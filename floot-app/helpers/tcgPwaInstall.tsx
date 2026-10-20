import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { detectInstallEnvironment, type InstallEnvironment } from "./tcgInstallPlatform";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type InstallResult = "accepted" | "dismissed" | "manual" | "installed";
type InstallState = {
  environment: InstallEnvironment;
  installed: boolean;
  canPrompt: boolean;
  install: () => Promise<InstallResult>;
};
const defaultEnvironment = detectInstallEnvironment("");
const PwaInstallContext = createContext<InstallState | null>(null);

/** Mounted once above the pages: preserves beforeinstallprompt across navigation. */
export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [environment, setEnvironment] = useState(defaultEnvironment);
  const [installed, setInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    setEnvironment(detectInstallEnvironment(navigator.userAgent));
    const standalone = () => window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone());
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      if (!standalone()) setInstallPrompt(event as InstallEvent);
    };
    const afterInstall = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    const onDisplayChange = () => { if (standalone()) afterInstall(); };
    const media = window.matchMedia("(display-mode: standalone)");
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", afterInstall);
    media.addEventListener?.("change", onDisplayChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", afterInstall);
      media.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallResult> => {
    if (installed) return "installed";
    if (!installPrompt) return "manual";
    const pending = installPrompt;
    setInstallPrompt(null);
    try {
      await pending.prompt();
      const result = await pending.userChoice;
      return result.outcome === "accepted" ? "accepted" : "dismissed";
    } catch {
      // Browsers may reject or expire the prompt. Never claim installation.
      return "manual";
    }
  }, [installPrompt, installed]);

  return <PwaInstallContext.Provider value={{
    environment, installed, canPrompt: Boolean(installPrompt) && !installed, install
  }}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall(): InstallState {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  return context;
}
