# Sito UI Brew

<img width="816" height="612" alt="Screenshot 2026-02-03 at 15 38 04" src="https://github.com/user-attachments/assets/85606641-1759-4263-8541-ef466a557179" />

A desktop UI for Homebrew built with React, Vite, Tailwind CSS, and Tauri. It lets you browse installed packages, view details, and uninstall with progress feedback. It also integrates a hybrid info source (remote Formulae API when online, local Homebrew when offline) and provides fast, debounced search with filter chips and sortable columns.

## Requirements

- Node.js: 20.19+ or 22.12+
- Rust toolchain (for Tauri)
- Homebrew installed and available on PATH

## Quick start

- Install dependencies: `npm ci`
- Web dev (browser): `npm run dev`
- Desktop dev (Tauri):
  - Install Tauri CLI: `npm i -g @tauri-apps/cli`
  - Run: `npm run tauri dev`
- Production build:
  - Web: `npm run build` (produces `dist/`)
  - Tauri bundle: `npm run tauri build`

## Project structure

- `src/components/` UI components
  - `Package/` package list, drawer, table header/row, filter chips
  - `IconButton`, `Button`, `Loading`
- `src/context/` app state (SelectedPackage, Search)
- `src/controllers/` non-React controllers (e.g., PackageDrawerController)
- `src/services/` data/services (Brew client integration, hybrid info fetch)
- `src/hooks/` reusable hooks (e.g., `usePackageSizes`)
- `src/lang/` i18n resources (`_pages`, `_accessibility`, `_entities`)
- `src-tauri/` Tauri backend (Rust)

## Key concepts

- Logic outside React: controllers/services encapsulate behavior; components render and call controller methods.
- Contexts:
  - `SelectedPackageContext` holds the current selection and intent (`details` or `uninstall`).
  - `SearchContext` holds query, kinds, size range, refresh, and exposes debounced query.
- i18n: `react-i18next` with namespaced resources. Default namespace is `_pages`.
- Styling: Tailwind v4 with custom variables in `src/styles/variables.css`.

## Developing

- Add UI: keep components presentational; push side effects and data operations into hooks/services/controllers.
- Write hooks for repeated state/effect patterns (sorting, filtering, data fetch with cache).
- Update translations: add keys under `src/lang/en/_pages.json` and `src/lang/es/_pages.json` (and `_accessibility` when needed).
- Prefer `IconButton` and `Button` for consistent actions; pass `variant` appropriately (`primary`, `secondary`, `danger`, `ghost`).
- Keep uninstall flows centralized via the drawer/controller so UI stays consistent.

## Testing and typechecking

- Typecheck/build: `npm run build` (requires Node 20.19+ or 22.12+)
- Preview build: `npm run preview`

## Troubleshooting

- Vite requires Node 20.19+ or 22.12+: upgrade your Node.js if builds fail on 18.x.
- Tauri dev/build requires a Rust toolchain and platform prerequisites; see https://tauri.app
- If the package list is empty due to filters, filter chips remain visible so you can clear them.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
