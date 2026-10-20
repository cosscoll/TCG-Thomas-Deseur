import { detectInstallEnvironment, INSTALL_URL, CHROME_ANDROID_INTENT } from "./tcgInstallPlatform";

describe("TCG Deseur — aide à l'installation gratuite", () => {
  it("détecte Chrome Android classique et n'affiche pas les instructions Instagram", () => {
    const env=detectInstallEnvironment("Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/131.0.0 Mobile Safari/537.36");
    expect(env).toEqual({platform:"android",embeddedBrowser:false,chromeAndroid:true});
  });
  it("détecte les téléphones Xiaomi et le navigateur intégré Instagram", () => {
    const env=detectInstallEnvironment("Mozilla/5.0 (Linux; Android 13; Redmi Note) Chrome/131.0 Mobile Safari/537.36 Instagram 360.0");
    expect(env.platform).toBe("android");
    expect(env.embeddedBrowser).toBe(true);
  });
  it("propose Safari à un iPhone ouvert dans Instagram", () => {
    const env=detectInstallEnvironment("Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 356.0");
    expect(env).toEqual({platform:"ios",embeddedBrowser:true,chromeAndroid:false});
  });
  it("iPhone Safari n'est pas traité comme un navigateur intégré", () => {
    const env=detectInstallEnvironment("Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Version/18.2 Mobile/15E148 Safari/604.1");
    expect(env.platform).toBe("ios");
    expect(env.embeddedBrowser).toBe(false);
  });
  it("les navigateurs desktop gardent les instructions adaptées", () => {
    expect(detectInstallEnvironment("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131")).toEqual({
      platform:"desktop",embeddedBrowser:false,chromeAndroid:false
    });
  });
  it("le lien Chrome pointe seulement vers le nouveau domaine officiel", () => {
    expect(INSTALL_URL).toBe("https://tcg-thomas-deseur.floot.app/installer");
    expect(CHROME_ANDROID_INTENT).toContain("tcg-thomas-deseur.floot.app/installer");
    expect(CHROME_ANDROID_INTENT).toContain("com.android.chrome");
    expect(CHROME_ANDROID_INTENT).not.toContain("budget-illimite");
  });
});
