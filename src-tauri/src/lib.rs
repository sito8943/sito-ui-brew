use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Mutex;
use tauri::{Emitter, EventTarget};

// In-memory cache for package sizes to avoid repeated disk scans
static SIZE_CACHE: Lazy<Mutex<HashMap<String, (u64, String)>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum PackageKind {
    Formula,
    Cask,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageListItem {
    pub name: String,
    pub kind: PackageKind,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageInfo {
    pub name: String,
    pub version: Option<String>,
    pub description: Option<String>,
    pub homepage: Option<String>,
    pub maintainers: Option<Vec<String>>, // best-effort; may be absent
    pub tap: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageSizeResult {
    pub name: String,
    pub kind: PackageKind,
    pub bytes: Option<u64>,
    pub human: Option<String>,
}

fn brew_path() -> String {
    // Use `brew` from PATH. If PATH lacks it, try common locations.
    // We don't check existence here; command spawn failures are handled per use.
    // Do not elevate privileges.
    "brew".to_string()
}

fn sanitize_name(name: &str) -> Result<(), String> {
    let valid = name
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '_' | '-' | '.' | '@' | '/' ));
    if !valid || name.is_empty() || name.len() > 128 {
        return Err("Invalid package name".to_string());
    }
    Ok(())
}

fn parse_list_output(json: &str, kind: PackageKind) -> Vec<PackageListItem> {
    // Handle both an array of strings and an array of objects with `name`/`token`.
    let mut out: Vec<PackageListItem> = Vec::new();
    match serde_json::from_str::<serde_json::Value>(json) {
        Ok(serde_json::Value::Array(items)) => {
            for item in items {
                if let Some(s) = item.as_str() {
                    out.push(PackageListItem { name: s.to_string(), kind: kind.clone() });
                } else if let Some(obj) = item.as_object() {
                    if let Some(n) = obj.get("name").and_then(|v| v.as_str())
                        .or_else(|| obj.get("full_name").and_then(|v| v.as_str()))
                        .or_else(|| obj.get("token").and_then(|v| v.as_str()))
                    {
                        out.push(PackageListItem { name: n.to_string(), kind: kind.clone() });
                    }
                }
            }
        }
        _ => {}
    }
    out
}

fn parse_list_plain(text: &str, kind: PackageKind) -> Vec<PackageListItem> {
    text
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .map(|name| PackageListItem {
            name: name.to_string(),
            kind: kind.clone(),
        })
        .collect()
}

fn format_bytes(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = 1024.0 * 1024.0;
    const GB: f64 = 1024.0 * 1024.0 * 1024.0;
    let b = bytes as f64;
    if b >= GB {
        format!("{:.2} GB", b / GB)
    } else if b >= MB {
        format!("{:.2} MB", b / MB)
    } else if b >= KB {
        format!("{:.2} KB", b / KB)
    } else {
        format!("{} B", bytes)
    }
}

fn du_size_bytes(path: &PathBuf) -> Option<u64> {
    // Use `du -sk` to get size in KiB then convert to bytes.
    let output = Command::new("du")
        .arg("-sk")
        .arg(path)
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let first = stdout.split_whitespace().next()?;
    if let Ok(kib) = first.parse::<u64>() {
        return Some(kib.saturating_mul(1024));
    }
    None
}

#[tauri::command]
fn list_packages() -> Result<Vec<PackageListItem>, String> {
    // Prefer a single JSON call when available, fallback to plain list names.
    let brew = brew_path();

    let info_out = Command::new(&brew)
        .args(["info", "--json=v2", "--installed"]) // supported on modern Homebrew
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|_| "Homebrew not found. Please install Homebrew.".to_string())?;

    if info_out.status.success() {
        let v: serde_json::Value = serde_json::from_slice(&info_out.stdout)
            .map_err(|_| "Invalid JSON from Homebrew info".to_string())?;
        let mut list = Vec::new();
        if let Some(arr) = v.get("formulae").and_then(|a| a.as_array()) {
            for e in arr {
                if let Some(n) = e.get("name").and_then(|v| v.as_str())
                    .or_else(|| e.get("full_name").and_then(|v| v.as_str()))
                {
                    list.push(PackageListItem { name: n.to_string(), kind: PackageKind::Formula });
                }
            }
        }
        if let Some(arr) = v.get("casks").and_then(|a| a.as_array()) {
            for e in arr {
                if let Some(n) = e.get("token").and_then(|v| v.as_str())
                    .or_else(|| e.get("name").and_then(|v| v.as_str()))
                {
                    list.push(PackageListItem { name: n.to_string(), kind: PackageKind::Cask });
                }
            }
        }
        return Ok(list);
    }

    // Fallback: older brew that lacks JSON list; use plain text names one per line
    let formula_out = Command::new(&brew)
        .args(["list", "--formula", "-1"]) // single column
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|_| "Homebrew not found. Please install Homebrew.".to_string())?;
    if !formula_out.status.success() {
        let err = String::from_utf8_lossy(&formula_out.stderr).to_string();
        return Err(format!("Failed to list formula packages: {}", err.trim()));
    }

    let cask_out = Command::new(&brew)
        .args(["list", "--cask", "-1"]) // single column
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|_| "Homebrew not found. Please install Homebrew.".to_string())?;
    if !cask_out.status.success() {
        let err = String::from_utf8_lossy(&cask_out.stderr).to_string();
        return Err(format!("Failed to list cask packages: {}", err.trim()));
    }

    let mut list = Vec::new();
    list.extend(parse_list_plain(&String::from_utf8_lossy(&formula_out.stdout), PackageKind::Formula));
    list.extend(parse_list_plain(&String::from_utf8_lossy(&cask_out.stdout), PackageKind::Cask));
    Ok(list)
}

#[tauri::command]
fn get_package_info(name: &str) -> Result<PackageInfo, String> {
    sanitize_name(name)?;
    let brew = brew_path();
    let out = Command::new(&brew)
        .args(["info", "--json=v2", name])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|_| "Homebrew not found. Please install Homebrew.".to_string())?;
    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr).to_string();
        return Err(format!("Failed to get package info: {}", err.trim()));
    }

    let v: serde_json::Value = serde_json::from_slice(&out.stdout)
        .map_err(|_| "Invalid JSON from Homebrew info".to_string())?;

    // brew info --json=v2 returns either { formulae: [..] } or { casks: [..] }
    let obj = v.as_object().ok_or_else(|| "Unexpected JSON shape".to_string())?;
    let entry = if let Some(arr) = obj.get("formulae").and_then(|a| a.as_array()) {
        arr.get(0).cloned()
    } else if let Some(arr) = obj.get("casks").and_then(|a| a.as_array()) {
        arr.get(0).cloned()
    } else {
        None
    }
    .ok_or_else(|| "Package not found".to_string())?;

    // Extract fields with graceful fallback
    let name_field = entry
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or(name)
        .to_string();
    let version = entry
        .get("versions")
        .and_then(|v| v.get("stable"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(|| entry.get("version").and_then(|v| v.as_str()).map(|s| s.to_string()));
    let description = entry
        .get("desc")
        .or_else(|| entry.get("description"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let homepage = entry
        .get("homepage")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    // maintainers: try common shapes
    let maintainers = entry
        .get("maintainers")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|m| m.as_str().map(|s| s.to_string()))
                .collect::<Vec<_>>()
        });
    let tap = entry
        .get("tap")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Ok(PackageInfo {
        name: name_field,
        version,
        description,
        homepage,
        maintainers,
        tap,
    })
}

fn caskroom_paths(name: &str) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    paths.push(PathBuf::from(format!("/opt/homebrew/Caskroom/{}", name)));
    paths.push(PathBuf::from(format!("/usr/local/Caskroom/{}", name)));
    paths
}

#[tauri::command]
fn get_package_size(name: &str, kind: PackageKind) -> Result<PackageSizeResult, String> {
    sanitize_name(name)?;
    let key = format!("{:?}:{}", kind, name);
    if let Some((bytes, human)) = SIZE_CACHE.lock().unwrap().get(&key).cloned() {
        return Ok(PackageSizeResult {
            name: name.to_string(),
            kind,
            bytes: Some(bytes),
            human: Some(human),
        });
    }

    let mut bytes_opt: Option<u64> = None;
    let mut human_opt: Option<String> = None;

    match kind {
        PackageKind::Formula => {
            let brew = brew_path();
            let out = Command::new(&brew)
                .args(["--cellar", name])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|_| "Homebrew not found. Please install Homebrew.".to_string())?;
            if !out.status.success() {
                let err = String::from_utf8_lossy(&out.stderr).to_string();
                return Err(format!("Failed to resolve package cellar: {}", err.trim()));
            }
            let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !path.is_empty() {
                let p = PathBuf::from(path);
                if let Some(bytes) = du_size_bytes(&p) {
                    human_opt = Some(format_bytes(bytes));
                    bytes_opt = Some(bytes);
                }
            }
        }
        PackageKind::Cask => {
            for p in caskroom_paths(name) {
                if p.exists() {
                    if let Some(bytes) = du_size_bytes(&p) {
                        human_opt = Some(format_bytes(bytes));
                        bytes_opt = Some(bytes);
                        break;
                    }
                }
            }
        }
    }

    if let (Some(bytes), Some(human)) = (bytes_opt, human_opt.clone()) {
        SIZE_CACHE
            .lock()
            .unwrap()
            .insert(key, (bytes, human.clone()));
    }

    Ok(PackageSizeResult {
        name: name.to_string(),
        kind,
        bytes: bytes_opt,
        human: human_opt,
    })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UninstallRequest {
    pub name: String,
    pub kind: PackageKind,
    pub confirm: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UninstallEventPayload {
    pub name: String,
    pub kind: PackageKind,
    pub message: String,
    pub done: bool,
    pub success: Option<bool>,
}

#[tauri::command]
fn uninstall_package(app: tauri::AppHandle, req: UninstallRequest) -> Result<(), String> {
    if !req.confirm {
        return Err("Uninstall not confirmed".to_string());
    }
    sanitize_name(&req.name)?;
    let name = req.name.clone();
    let kind = req.kind.clone();

    tauri::async_runtime::spawn(async move {
        // Build command safely
        let brew = brew_path();
        let mut args: Vec<&str> = vec!["uninstall"]; // never use sudo
        if let PackageKind::Cask = kind {
            args.push("--cask");
        }
        // name is validated; pass as a single arg
        args.push(&name);

        let mut child = match Command::new(&brew)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                let _ = app.emit(
                    "uninstall-progress",
                    UninstallEventPayload {
                        name: name.clone(),
                        kind: kind.clone(),
                        message: format!("Failed to start uninstall: {}", e),
                        done: true,
                        success: Some(false),
                    },
                );
                return;
            }
        };

        // Stream stdout
        if let Some(stdout) = child.stdout.take() {
            let app_clone = app.clone();
            let name_clone = name.clone();
            let kind_clone = kind.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines().flatten() {
                    let _ = app_clone.emit(
                        "uninstall-progress",
                        UninstallEventPayload {
                            name: name_clone.clone(),
                            kind: kind_clone.clone(),
                            message: line,
                            done: false,
                            success: None,
                        },
                    );
                }
            });
        }
        // Stream stderr
        if let Some(stderr) = child.stderr.take() {
            let app_clone = app.clone();
            let name_clone = name.clone();
            let kind_clone = kind.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for line in reader.lines().flatten() {
                    let _ = app_clone.emit(
                        "uninstall-progress",
                        UninstallEventPayload {
                            name: name_clone.clone(),
                            kind: kind_clone.clone(),
                            message: line,
                            done: false,
                            success: None,
                        },
                    );
                }
            });
        }

        // Wait for completion
        let status = match child.wait() {
            Ok(s) => s,
            Err(e) => {
                let _ = app.emit(
                    "uninstall-progress",
                    UninstallEventPayload {
                        name: name.clone(),
                        kind: kind.clone(),
                        message: format!("Uninstall failed: {}", e),
                        done: true,
                        success: Some(false),
                    },
                );
                return;
            }
        };

        let success = status.success();
        let _ = app.emit(
            "uninstall-progress",
            UninstallEventPayload {
                name: name.clone(),
                kind: kind.clone(),
                message: if success {
                    "Uninstall completed".to_string()
                } else {
                    format!("Uninstall failed with code {:?}", status.code())
                },
                done: true,
                success: Some(success),
            },
        );
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_packages,
            get_package_info,
            get_package_size,
            uninstall_package
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
