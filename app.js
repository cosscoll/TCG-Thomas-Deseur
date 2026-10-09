import { CARDS, RARITIES } from "./data/cards.js";
import { emptyCollection, normalizeCollection, openDemoPack, collectionStats, LOCAL_COLLECTION_KEY } from "./game/collection.js";
import { accountsConfigured } from "./account/client.js";
import { initAccountPanel } from "./account/panel.js";
import { fetchCloudCollection, claimCloudBooster } from "./account/cloud-collection.js";

const byId = id => document.getElementById(id);
const rarities = Object.fromEntries(RARITIES.map(r => [r.id, r.label]));
const cardsById = new Map(CARDS.map(card => [card.id, card]));
const packs = byId("boosterDialog");
const packButton = byId("openBooster");
const againButton = byId("openAgain");
const filter = byId("collectionOwnedFilter");
const rarityFilter = byId("collectionRarity");
const search = byId("collectionSearch");
let demoCollection = emptyCollection();
let cloudCollection = null;
let accountClient = null;
let accountUser = null;
let sessionVersion = 0;
let openingInProgress = false;

try {
  demoCollection = normalizeCollection(JSON.parse(localStorage.getItem(LOCAL_COLLECTION_KEY) || "null"), CARDS);
} catch { demoCollection = emptyCollection(); }
const isCloud = () => Boolean(accountsConfigured() && accountClient && accountUser);
const collectionMode = () => !accountsConfigured() ? "demo" : isCloud() ? "cloud" : "locked";
function stateForDisplay() {
  const mode = collectionMode();
  return mode === "demo" ? demoCollection : mode === "cloud" ? cloudCollection : emptyCollection();
}
function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}
function saveLocalCollection() {
  try { localStorage.setItem(LOCAL_COLLECTION_KEY, JSON.stringify(demoCollection)); }
  catch { byId("collectionMode").textContent = "Stockage indisponible : la collection de démonstration risque de ne pas être conservée."; }
}
function cloudPackAvailable() {
  if (!cloudCollection) return false;
  const at = cloudCollection.nextAvailableAt;
  return !at || Number.isNaN(Date.parse(at)) || Date.parse(at) <= Date.now();
}
function formatNextPack(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "à une date non disponible";
  return "le " + new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short"}).format(date);
}
function renderPackStatus() {
  const mode = collectionMode();
  const available = !openingInProgress && (mode === "demo" || (mode === "cloud" && cloudPackAvailable()));
  packButton.disabled = !available;
  againButton.disabled = !available;
  let message;
  if (mode === "demo") message = "Mode démonstration : ouvre autant de boosters que tu veux, uniquement sur cet appareil.";
  else if (mode === "locked") message = "Connecte-toi à ton compte pour recevoir des cartes officielles.";
  else if (!cloudCollection) message = "Chargement de ta collection sécurisée…";
  else if (!cloudPackAvailable()) message = "Prochain booster disponible " + formatNextPack(cloudCollection.nextAvailableAt) + ".";
  else message = "Un booster est prêt : son contenu sera attribué et sauvegardé par le serveur.";
  byId("boosterAvailability").textContent = message;
}
function renderCollection() {
  const mode = collectionMode();
  const state = stateForDisplay();
  const copies = state?.copies || {};
  const stats = collectionStats(state || emptyCollection(), CARDS);
  for (const [id, value] of [
    ["summaryUnique", stats.unique + " / " + CARDS.length],
    ["summaryOpened", stats.opened],
    ["summaryCompletion", stats.completion + " %"],
    ["summaryDuplicates", stats.duplicates],
    ["collectionUnique", stats.unique + " / " + CARDS.length],
    ["collectionTotal", stats.total],
    ["collectionDuplicates", stats.duplicates],
    ["collectionOpened", stats.opened],
    ["collectionPercent", stats.completion + " %"],
  ]) byId(id).textContent = String(value);
  byId("collectionProgress").value = stats.unique;

  byId("collectionMode").textContent = mode === "demo"
    ? "Démonstration locale : tes cartes ne sont pas des récompenses officielles et ne sont pas synchronisées."
    : mode === "locked" ? "Connecte-toi pour retrouver ton classeur officiel."
    : cloudCollection ? "Classeur officiel associé à ton compte joueur." : "Chargement de ton classeur sécurisé…";

  const rarityRows = document.createDocumentFragment();
  for (const rarity of RARITIES) {
    const group = CARDS.filter(card => card.rarity === rarity.id);
    const collected = group.filter(card => (copies[card.id] || 0) > 0).length;
    const row = element("div", "rarity-breakdown-item rarity-" + rarity.id);
    row.append(element("span", "", rarity.label), element("strong", "", collected + " / " + group.length));
    rarityRows.append(row);
  }
  byId("rarityCompletion").replaceChildren(rarityRows);

  const searchTerm = search.value.trim().toLocaleLowerCase("fr");
  const choice = filter.value;
  const type = rarityFilter.value;
  const found = CARDS.filter(card => {
    const qty = copies[card.id] || 0;
    return (type === "all" || card.rarity === type) &&
      (choice === "all" || (choice === "owned" && qty > 0) ||
        (choice === "missing" && qty === 0) || (choice === "duplicates" && qty > 1)) &&
      (!searchTerm || card.name.toLocaleLowerCase("fr").includes(searchTerm));
  });
  byId("filterCount").textContent = found.length + " carte" + (found.length === 1 ? "" : "s") + " affichée" + (found.length === 1 ? "" : "s");
  const binder = document.createDocumentFragment();
  for (const card of found) {
    const qty = copies[card.id] || 0;
    const tile = element("article", "binder-card rarity-" + card.rarity + (qty ? " owned" : " missing"));
    const top = element("div", "binder-card-top");
    top.append(element("span", "binder-card-rarity", rarities[card.rarity]));
    tile.append(top, element("div", "binder-card-ornament", "?"));
    tile.append(element("strong", "binder-card-name", qty ? card.name : "Carte à découvrir"));
    tile.append(element("small", "binder-card-id", "BI / " + card.id.toUpperCase()));
    tile.append(element("span", "binder-card-count", qty ? qty + (qty > 1 ? " exemplaires" : " exemplaire") : "Non obtenue"));
    binder.append(tile);
  }
  byId("collectionGrid").replaceChildren(binder);
  byId("collectionEmpty").hidden = found.length !== 0;

  const history = Array.isArray(state?.history) ? state.history : [];
  const historyNodes = document.createDocumentFragment();
  if (!history.length) historyNodes.append(element("p", "", "Ton premier booster t'attend."));
  for (const [index, pack] of history.slice(0, 5).entries()) {
    const row = element("div", "collection-history-row");
    row.append(element("strong", "", "Booster n°" + (state.opened - index)));
    row.append(element("span", "", pack.map(id => cardsById.get(id)?.name || "Carte inconnue").join(" · ")));
    historyNodes.append(row);
  }
  byId("recentOpenings").replaceChildren(historyNodes);
  renderPackStatus();
}
function showPack(cards, mode) {
  const nodes = document.createDocumentFragment();
  for (const [index, card] of cards.entries()) {
    const tile = element("article", "booster-result rarity-" + card.rarity);
    tile.style.animationDelay = index * 0.09 + "s";
    tile.append(element("div", "booster-result-art", "?"));
    tile.append(element("small", "", rarities[card.rarity]));
    tile.append(element("strong", "", card.name));
    tile.append(element("small", "booster-discovery", card.newCard ? "NOUVELLE CARTE" : "DOUBLON · ×" + card.copies));
    nodes.append(tile);
  }
  byId("boosterResults").replaceChildren(nodes);
  byId("boosterModeNote").textContent = mode === "cloud"
    ? "Ces cartes sont enregistrées dans ton compte."
    : "Ces cartes sont enregistrées dans ton classeur de démonstration local.";
  renderCollection();
  if (typeof packs.showModal === "function") {
    if (!packs.open) packs.showModal();
  } else packs.setAttribute("open", "");
}
async function openBooster() {
  if (openingInProgress) return;
  const mode = collectionMode();
  if (mode === "locked" || (mode === "cloud" && !cloudPackAvailable())) return;
  openingInProgress = true;
  renderPackStatus();
  const version = sessionVersion;
  try {
    if (mode === "demo") {
      const opened = openDemoPack(demoCollection, CARDS);
      demoCollection = opened.state;
      saveLocalCollection();
      showPack(opened.results, "demo");
    } else {
      const previous = {...cloudCollection.copies};
      const user = accountUser;
      const receipt = await claimCloudBooster(accountClient);
      const quantities = {...previous};
      const results = receipt.cards.map(row => {
        const card = cardsById.get(row.id);
        if (!card || card.rarity !== row.rarity) throw new Error("Le serveur a renvoyé une carte inconnue.");
        const before = quantities[card.id] || 0;
        quantities[card.id] = before + 1;
        return {...card,newCard:before === 0,copies:quantities[card.id]};
      });
      if (version !== sessionVersion || user?.id !== accountUser?.id) return;
      cloudCollection = await fetchCloudCollection(accountClient, user);
      if (version !== sessionVersion) return;
      showPack(results, "cloud");
    }
  } catch {
    byId("boosterAvailability").textContent = "Impossible d'ouvrir ce booster pour le moment. Réessaie plus tard.";
  } finally {
    openingInProgress = false;
    renderPackStatus();
  }
}
packButton.addEventListener("click",openBooster);
againButton.addEventListener("click",openBooster);
filter.addEventListener("change",renderCollection);
rarityFilter.addEventListener("change",renderCollection);
search.addEventListener("input",renderCollection);
renderCollection();

initAccountPanel(async (client,user) => {
  const version = ++sessionVersion;
  accountClient = client;
  accountUser = user;
  cloudCollection = null;
  renderCollection();
  if (!client || !user) return;
  try {
    const received = await fetchCloudCollection(client,user);
    if (version !== sessionVersion) return;
    cloudCollection = received;
  } catch {
    if (version !== sessionVersion) return;
    byId("accountMessage").textContent = "Collection distante inaccessible. Aucune attribution locale ne sera enregistrée sur le serveur.";
  }
  renderCollection();
}).catch(() => {
  byId("accountMessage").textContent = "Service de comptes indisponible. Le mode démonstration reste accessible.";
});
