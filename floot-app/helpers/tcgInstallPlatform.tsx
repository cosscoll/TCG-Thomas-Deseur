/** Environnement du parcours PWA : aucune donnée personnelle n'est conservée. */
export type InstallPlatform = "ios" | "android" | "desktop";
export type InstallEnvironment = {
  platform: InstallPlatform;
  embeddedBrowser: boolean;
  chromeAndroid: boolean;
};
export const INSTALL_URL = "https://tcg-thomas-deseur.floot.app/installer";

export function detectInstallEnvironment(userAgent: string): InstallEnvironment {
  const ua = userAgent || "";
  const isIpadDesktop = /Macintosh/i.test(ua) && /Mobile/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || isIpadDesktop;
  const isAndroid = !isIOS && /Android/i.test(ua);
  return {
    platform: isIOS ? "ios" : isAndroid ? "android" : "desktop",
    embeddedBrowser: /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS|TikTok|Musical_ly|BytedanceWebview|Snapchat|MicroMessenger|Pinterest|Line\//i.test(ua),
    chromeAndroid: isAndroid && /Chrome\//i.test(ua) && !/EdgA\/|OPR\/|SamsungBrowser\//i.test(ua)
  };
}

/** Tentative initiée par l'utilisateur ; le navigateur intégré peut la refuser. */
export const CHROME_ANDROID_INTENT =
  "intent://tcg-thomas-deseur.floot.app/installer#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Ftcg-thomas-deseur.floot.app%2Finstaller;end";
