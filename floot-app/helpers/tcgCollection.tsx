/** Collection read model for TCG Deseur. The server remains authoritative. */
export const RARITIES = ["commune", "rare", "epique", "legendaire", "hors_serie", "mystere", "secrete"] as const;
export type Rarity = typeof RARITIES[number];
export const RARITY_LABELS: Record<Rarity,string> = {
 commune:"Commune",rare:"Rare",epique:"Épique",legendaire:"Légendaire",
 hors_serie:"Hors-série",mystere:"Carte mystère",secrete:"Carte mystère"
};
const LEGACY_COUNTS:Partial<Record<Rarity,number>>={commune:17,rare:15,epique:10,legendaire:4,secrete:3};
const EDITION_COUNTS:Partial<Record<Rarity,number>>={commune:95,rare:35,epique:18,legendaire:11,hors_serie:1,secrete:1};
const ORIGIN_COUNTS:Partial<Record<Rarity,number>>={commune:33,rare:21,epique:8,legendaire:4,hors_serie:1};
export type CatalogueCard={id:string;name:string;rarity:string;imagePath?:string;reference?:string;sourceReference?:string|null;ordinal?:number;alternative?:boolean;parentId?:string|null};
export type InventoryRow = { cardId: string; quantity: number };
export type BinderCard = CatalogueCard & {
  quantity: number; owned: boolean; extraCopies: number; index: number;
};
export type RarityProgress = {
  rarity: Rarity; total: number; discovered: number; missing: number;
  copies: number; extras: number; percent: number;
};
export type Binder = {
  cards: BinderCard[]; total: number; discovered: number; missing: number;
  copies: number; extras: number; duplicateTypes: number; percent: number;
  byRarity: RarityProgress[];
};
const percent = (part: number, full: number) => full ? Math.round(part / full * 100) : 0;
const safePlus = (a: number, b: number) => {
  const result = a + b;
  if (!Number.isSafeInteger(result)) throw new Error("Quantité de cartes invalide.");
  return result;
};
export function buildBinder(catalogue: CatalogueCard[], inventory: InventoryRow[]): Binder {
  if (!Array.isArray(catalogue) || ![49,67,68,105,106,160,161].includes(catalogue.length) || !Array.isArray(inventory)) {
    throw new Error("Le catalogue de cartes est incomplet.");
  }
  const cardIds = new Set<string>();
  const rarityCounts = new Map<Rarity, number>();
  for (const card of catalogue) {
    if (!card || typeof card.id !== "string" || !/^(?:[a-z0-9_]+|COST-[0-9]{3})$/.test(card.id) ||
      !card.name || !RARITIES.includes(card.rarity as Rarity) || cardIds.has(card.id)) {
      throw new Error("Le catalogue contient une carte invalide.");
    }
    cardIds.add(card.id);
    const rarity = card.rarity as Rarity;
    rarityCounts.set(rarity, (rarityCounts.get(rarity) ?? 0) + 1);
  }
  const counts=catalogue.length===49?LEGACY_COUNTS:[67,68].includes(catalogue.length)?ORIGIN_COUNTS:EDITION_COUNTS;
  const privateCount=(rarityCounts.get("mystere")||0)+(rarityCounts.get("secrete")||0);
  if(((catalogue.length===68||catalogue.length===106)&&privateCount!==1)||((catalogue.length===67||catalogue.length===105)&&privateCount!==0))
   throw new Error("Le catalogue public ne doit pas révéler de carte privée.");
  for(const rarity of RARITIES){
    if([105,106].includes(catalogue.length))continue;
    if([67,68].includes(catalogue.length)&&(rarity==="mystere"||rarity==="secrete"))continue;
    const count=counts[rarity]??0;
    const expected=rarity==="secrete"&&catalogue.length===160?0:count;
    if((rarityCounts.get(rarity)??0)!==expected)
      throw new Error("La répartition des raretés du catalogue est invalide.");
  }
  const quantities = new Map<string, number>();
  for (const row of inventory) {
    if (!row || !cardIds.has(row.cardId) || quantities.has(row.cardId) ||
      !Number.isSafeInteger(row.quantity) || row.quantity < 0) {
      throw new Error("L'inventaire du joueur est invalide.");
    }
    quantities.set(row.cardId, row.quantity);
  }
  const cards = catalogue.map((card, index) => {
    const quantity = quantities.get(card.id) ?? 0;
    return { ...card, index, quantity, owned: quantity > 0, extraCopies: Math.max(0, quantity - 1) };
  });
  let copies = 0;
  for (const card of cards) copies = safePlus(copies, card.quantity);
  const discovered = cards.filter(c => c.owned).length;
  const byRarity = RARITIES.map(rarity => {
    const list = cards.filter(c => c.rarity === rarity);
    let amount = 0;
    for (const card of list) amount = safePlus(amount, card.quantity);
    const found = list.filter(c => c.owned).length;
    return {
      rarity, total: list.length, discovered: found,
      missing: list.length - found, copies: amount, extras: amount - found,
      percent: percent(found, list.length),
    };
  });
  return {
    cards, total: cards.length, discovered, missing: cards.length - discovered,
    copies, extras: copies - discovered,
    duplicateTypes: cards.filter(c => c.extraCopies > 0).length,
    percent: percent(discovered, cards.length), byRarity,
  };
}
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
export function filterBinder(binder: Binder, { ownership = "all", rarity = "all", search = "", sort = "catalogue" }: {
  ownership?: string; rarity?: string; search?: string; sort?: string;
} = {}): BinderCard[] {
  if (!["all", "owned", "missing", "duplicates"].includes(ownership) ||
    (rarity !== "all" && !RARITIES.includes(rarity as Rarity)) ||
    !["catalogue", "name", "rarity", "copies"].includes(sort)) {
    throw new Error("Filtre du classeur inconnu.");
  }
  const query = normalize(search);
  const result = binder.cards.filter(card =>
    (rarity === "all" || card.rarity === rarity) &&
    (ownership === "all" || (ownership === "owned" && card.owned) ||
      (ownership === "missing" && !card.owned) ||
      (ownership === "duplicates" && card.extraCopies > 0)) &&
    (!query || normalize(card.name).includes(query) || normalize(card.id).includes(query))
  );
  return [...result].sort((a, b) => {
    if (sort === "copies") return b.quantity - a.quantity || a.index - b.index;
    if (sort === "rarity") return RARITIES.indexOf(b.rarity as Rarity) - RARITIES.indexOf(a.rarity as Rarity) || a.index - b.index;
    if (sort === "name") return a.name.localeCompare(b.name, "fr", { sensitivity: "base" }) || a.index - b.index;
    return a.index - b.index;
  });
}
const csvField = (value: string | number): string => {
  let text = String(value).replace(/[\r\n\t]+/g, " ").trim();
  if (/^[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
};
/** Only card data: no player name, account ID, email or auth state. */
export function binderCsv(binder: Binder): string {
  const header = ["ID", "Carte", "Rareté", "Possédée", "Exemplaires", "Doublons supplémentaires"];
  const lines = [header.map(csvField).join(";")];
  for (const card of binder.cards) {
    lines.push([card.id, card.name, card.rarity, card.owned ? "Oui" : "Non",
      card.quantity, card.extraCopies].map(csvField).join(";"));
  }
  return "\ufeff" + lines.join("\r\n") + "\r\n";
}
/** Display-only milestones, no rewards or card grants. */
export function binderMilestones(binder: Binder) {
  const thresholds=binder.total===49?[1,5,10,25,49]:[105,106].includes(binder.total)?[1,5,10,25,50,75,100,105]:[67,68].includes(binder.total)?[1,5,10,20,40,60,67]:[1,5,10,40,80,120,160];
  const global = thresholds.map(target => ({
    key: "unique-" + target, label: target === 1 ? "Première carte découverte" : target + " cartes différentes",
    value: Math.min(target, binder.discovered), target, achieved: binder.discovered >= target,
  }));
  const groups = binder.byRarity.filter(group=>group.total>0).flatMap(group => [
    { key: group.rarity + "-first", label: "Première " + RARITY_LABELS[group.rarity].toLowerCase(),
      value: Math.min(group.discovered, 1), target: 1, achieved: group.discovered >= 1 },
    { key: group.rarity + "-complete", label: "Compléter la rareté " + RARITY_LABELS[group.rarity],
      value: group.discovered, target: group.total, achieved: group.discovered === group.total },
  ]);
  return [...global, ...groups];
}

