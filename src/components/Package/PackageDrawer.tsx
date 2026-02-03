import { useEffect, useMemo, useState } from "react";
import Drawer from "../Drawer";
import PackageKindChip from "./PackageKindChip";
import InfoItem from "../InfoItem";
import { useSelectedPackage } from "../../context/SelectedPackageContext";
import { useTranslation } from "react-i18next";
import { PackageKind } from "../../api/brew";
import {
  PackageDrawerController,
  PackageDrawerState,
} from "../../controllers/packages/PackageDrawerController";
import Loading from "../Loading";
import Button from "../Button";

export default function PackageDrawer() {
  const { t } = useTranslation();
  const { selected: item, close: closeContext } = useSelectedPackage();
  const controller = useMemo(() => new PackageDrawerController(), []);
  const [state, setState] = useState<PackageDrawerState>(controller.getState());

  console.log(item);

  useEffect(() => {
    const unsub = controller.subscribe(setState);
    return () => {
      unsub();
    };
  }, [controller]);

  useEffect(() => {
    if (item) controller.attach(item.name, item.kind);
    else controller.close();
  }, [item, controller]);

  const {
    open,
    name,
    kind,
    loading,
    error,
    info,
    size,
    confirming,
    uninstalling,
    progress,
  } = state;
  const displayName = name || item?.name || "";
  console.log("Rendering PackageDrawer for:", displayName);
  const displayKind = (kind ||
    (item?.kind as PackageKind) ||
    "formula") as PackageKind;
  const canUninstall = !!item && !uninstalling;

  const title = (
    <div className="min-w-0 flex flex-col items-start gap-2">
      <div className="truncate">
        <PackageKindChip kind={displayKind} link={false} />
      </div>
      <div className="font-semibold truncate">{displayName}</div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={() => {
        controller.close();
        closeContext();
      }}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="danger"
            disabled={!canUninstall}
            onClick={() => controller.requestUninstall()}
          >
            {uninstalling
              ? t("packages.drawer.actions.uninstalling")
              : t("packages.drawer.actions.uninstall")}
          </Button>
        </div>
      }
    >
      {loading && (
        <Loading variant="muted" className="text-sm">
          {t("packages.drawer.loading")}
        </Loading>
      )}
      {error && (
        <div className="text-sm text-red-600">{t("packages.drawer.error")}</div>
      )}
      {!loading && !error && info && (
        <div className="space-y-4">
          {info.description && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {info.description}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoItem
              label={t("packages.drawer.labels.version")}
              value={info.version ?? "—"}
            />
            <InfoItem
              label={t("packages.drawer.labels.tap")}
              value={info.tap ?? "—"}
            />
            <InfoItem label={t("packages.drawer.labels.maintainers")}>
              <span className="truncate max-w-[240px]">
                {info.maintainers?.join(", ") ?? "—"}
              </span>
            </InfoItem>
            <InfoItem
              label={t("packages.drawer.labels.homepage")}
              className="sm:col-span-2"
            >
              {info.homepage ? (
                <a
                  className="hover:text-bg-primary underline truncate max-w-[240px]"
                  href={info.homepage}
                  target="_blank"
                  rel="noopener"
                >
                  {info.homepage}
                </a>
              ) : (
                "—"
              )}
            </InfoItem>
            <InfoItem
              label={t("packages.drawer.labels.size")}
              value={size?.human ?? "—"}
              className="sm:col-span-2"
            />
          </div>
          {progress.length > 0 && (
            <div className="border border-gray-200 rounded-md p-2 max-h-48 overflow-y-auto">
              {progress.map((line, idx) => (
                <div key={idx} className="text-xs text-gray-700 leading-5">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => controller.cancelConfirm()}
          />
          <div className="absolute inset-x-4 top-24 rounded-md border border-gray-200 bg-white shadow-lg p-4 max-w-md mx-auto">
            <div className="text-red-600 font-semibold mb-1">
              {t("packages.drawer.actions.confirmTitle")}
            </div>
            <div className="text-sm mb-3">
              {t("packages.drawer.actions.confirmMessage", {
                name: displayName,
                kind: displayKind,
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => controller.cancelConfirm()}>
                {t("packages.drawer.actions.cancel")}
              </Button>
              <Button variant="danger" onClick={() => controller.confirmUninstall()}>
                {t("packages.drawer.actions.uninstall")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
