import { tcgHistoryArtwork, normalizePublicArtworkPath } from "./tcgHistoryArtwork";
describe("Historique : illustrations normalisées", () => {
  const root="https://cosscoll.github.io/TCG-Thomas-Deseur/";
  const gray=root+"collection-validee/assets/gray-extended-";
  const fixed=root+"collection-validee/assets/detourees/";
  it("affiche la nouvelle version de l'alternative historique",()=>{
    expect(tcgHistoryArtwork(gray+"variants01/td-2-043.webp",fixed+"td-1-004.webp"))
      .toEqual({url:fixed+"td-2-043.webp",isVariant:true});
  });
  it("ne transforme pas un ancien visuel principal en alternative",()=>{
    expect(tcgHistoryArtwork(gray+"first10/td-1-004.webp",fixed+"td-1-004.webp"))
      .toEqual({url:fixed+"td-1-004.webp",isVariant:false});
  });
  it("garde les nouvelles images déjà normalisées",()=>{
    expect(tcgHistoryArtwork(fixed+"td-1-021.webp",fixed+"td-1-021.webp"))
      .toEqual({url:fixed+"td-1-021.webp",isVariant:false});
  });
  it("normalise les anciennes images originales publiques",()=>{
    const before=root+"collection-161/assets/cards/td-lille.webp";
    expect(tcgHistoryArtwork(before,before)).toEqual({url:fixed+"td-lille.webp",isVariant:false});
  });
  it("ne laisse passer aucune ressource arbitraire ou privée",()=>{
    expect(normalizePublicArtworkPath("javascript:alert(1)")).toBeNull();
    expect(normalizePublicArtworkPath("https://not-our-catalog.test/p.png")).toBeNull();
    expect(normalizePublicArtworkPath(root+"collection-validee/assets/private/bonus.webp")).toBeNull();
    expect(normalizePublicArtworkPath(fixed+"td-1-021.webp?query=1")).toBeNull();
    expect(normalizePublicArtworkPath(fixed+"../../td-1-021.webp")).toBeNull();
  });
});
