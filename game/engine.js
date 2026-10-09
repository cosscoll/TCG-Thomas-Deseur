import { CARDS } from "../data/cards.js";
import { PILOT_PROFILES } from "./card-profiles.js";

export const DECK_SIZE = 8;
export const WIN_KOS = 3;
export const MAX_ENERGY = 5;
export const ARCHETYPES = Object.freeze(["Assaut", "Rempart", "Tacticien", "Chaos"]);
const validIds = new Set(CARDS.map(card => card.id));

function hashId(id) {
  let value = 2166136261;
  for (let i = 0; i < id.length; i++) {
    value ^= id.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** Combat stats are balanced PROTOTYPE values, not verified lore or source data. */
export function cardStats(id) {
  if (!validIds.has(id)) throw new Error("Carte inconnue : " + id);
  const manual = PILOT_PROFILES[id];
  if (manual) return Object.freeze({
    id, ...manual, description: manual.ability.name + " — " + manual.ability.description,
  });
  const hash = hashId(id);
  const roleIndex = hash % ARCHETYPES.length;
  const role = ARCHETYPES[roleIndex];
  const hpBases = [98, 128, 107, 110];
  const quickBases = [26, 19, 22, 23];
  const burstBases = [42, 37, 40, 44];
  return Object.freeze({
    id, role,
    maxHp: hpBases[roleIndex] + ((hash >>> 4) % 9),
    quick: quickBases[roleIndex] + ((hash >>> 9) % 5),
    burst: burstBases[roleIndex] + ((hash >>> 15) % 7),
    focusGuard: role === "Rempart" ? 22 : 14,
    ability: null,
    description: {
      Assaut: "Frappe rapide puissante.",
      Rempart: "Concentration qui protège davantage.",
      Tacticien: "Récupère 1 énergie après une capacité.",
      Chaos: "Capacité renforcée lorsque ses PV sont faibles."
    }[role]
  });
}

export function validateDeck(ids) {
  const errors = [];
  if (!Array.isArray(ids)) return { valid: false, errors: ["Le deck doit être une liste."] };
  if (ids.length !== DECK_SIZE) errors.push("Le deck doit contenir exactement " + DECK_SIZE + " cartes.");
  if (new Set(ids).size !== ids.length) errors.push("Une seule copie de chaque carte est autorisée.");
  for (const id of ids) if (typeof id !== "string" || !validIds.has(id)) errors.push("Carte inconnue dans le deck.");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

/**
 * Deterministic recommendation: two cards of each role, no reliance on rarity.
 * This is a deck for the free prototype, not a player's owned collection.
 */
export function suggestBalancedDeck() {
  const chosen = [];
  for (const role of ARCHETYPES) {
    const options = CARDS.filter(card => cardStats(card.id).role === role);
    if (options.length < 2) throw new Error("Catalogue incomplet pour le rôle " + role);
    chosen.push(options[0].id, options[1].id);
  }
  if (!validateDeck(chosen).valid) throw new Error("Échec de création du deck équilibré.");
  return chosen;
}

function seededRng(seed) {
  let state = (seed >>> 0) || 0x12345abc;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(items, random) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
function fighter(id) { return { id, hp: cardStats(id).maxHp }; }
function makeSide(deck, random) {
  const pile = shuffle(deck, random);
  const active = fighter(pile.shift());
  const bench = [fighter(pile.shift()), fighter(pile.shift())];
  return { active, bench, pile, discard: [], energy: 1, guard: 0, knockouts: 0 };
}

export function createMatch({ playerDeck, aiDeck, seed = 12345 } = {}) {
  const player = validateDeck(playerDeck);
  const ai = validateDeck(aiDeck);
  if (!player.valid || !ai.valid) throw new Error([...player.errors, ...ai.errors].join(" "));
  if (!Number.isSafeInteger(seed)) throw new Error("Graine de partie invalide.");
  const random = seededRng(seed);
  return {
    version: 1, round: 1, turn: "player", winner: null,
    sides: { player: makeSide(playerDeck, random), ai: makeSide(aiDeck, random) },
    history: ["La partie commence. Premier objectif : " + WIN_KOS + " KO."]
  };
}

export function legalActions(match, actor) {
  if (!match || match.winner || match.turn !== actor || !["player", "ai"].includes(actor)) return [];
  const side = match.sides[actor];
  const options = [{ type: "quick" }, { type: "focus" }];
  if (side.energy >= 2) options.push({ type: "burst" });
  for (let i = 0; i < side.bench.length; i++) options.push({ type: "swap", index: i });
  return options;
}
function log(state, entry) {
  state.history.push(entry);
  if (state.history.length > 30) state.history.shift();
}
function replenish(side) {
  if (!side.active && side.bench.length) side.active = side.bench.shift();
  while (side.bench.length < 2 && side.pile.length) side.bench.push(fighter(side.pile.shift()));
}
/** Resolve an authored card ability; the remaining cards keep V0.1 attacks. */
function applyAbilityAfterHit(state, attacker, rival, ability) {
  if (!ability) return;
  const { effect, value } = ability;
  let detail = "";
  if (effect === "drain") {
    const taken = Math.min(rival.energy, value);
    rival.energy -= taken;
    detail = "-" + taken + " énergie adverse";
  } else if (effect === "fortify") {
    const actual = Math.min(value, 35 - attacker.guard);
    attacker.guard += actual;
    detail = "+" + actual + " protection";
  } else if (effect === "recharge") {
    const actual = Math.min(value, MAX_ENERGY - attacker.energy);
    attacker.energy += actual;
    detail = "+" + actual + " énergie";
  } else if (effect === "heal") {
    const actual = Math.min(value, cardStats(attacker.active.id).maxHp - attacker.active.hp);
    attacker.active.hp += actual;
    detail = "+" + actual + " PV";
  } else if (effect === "guard-energy") {
    const actual = Math.min(value, 35 - attacker.guard);
    attacker.guard += actual;
    const energy = Math.min(1, MAX_ENERGY - attacker.energy);
    attacker.energy += energy;
    detail = "+" + actual + " protection, +" + energy + " énergie";
  } else if (effect === "bench-heal") {
    const injured = attacker.bench
      .filter(card => card.hp < cardStats(card.id).maxHp)
      .sort((a,b) => (cardStats(b.id).maxHp-b.hp)-(cardStats(a.id).maxHp-a.hp))[0];
    if (injured) {
      const actual = Math.min(value, cardStats(injured.id).maxHp - injured.hp);
      injured.hp += actual;
      detail = injured.id + " : +" + actual + " PV en réserve";
    } else detail = "aucune carte de réserve blessée";
  } else if (effect === "guard-low-hp") {
    if (attacker.active.hp * 2 <= cardStats(attacker.active.id).maxHp) {
      const actual = Math.min(value, 35 - attacker.guard);
      attacker.guard += actual;
      detail = "+" + actual + " protection";
    } else detail = "condition de PV non remplie";
  } else if (effect === "steal-energy") {
    const actual = Math.min(value, rival.energy, MAX_ENERGY - attacker.energy);
    rival.energy -= actual;
    attacker.energy += actual;
    detail = actual + " énergie détournée";
  } else if (effect === "guard-heal") {
    const actual = Math.min(value, 35 - attacker.guard);
    attacker.guard += actual;
    const hp = Math.min(6, cardStats(attacker.active.id).maxHp - attacker.active.hp);
    attacker.active.hp += hp;
    detail = "+" + actual + " protection, +" + hp + " PV";
  }
  if (detail) log(state, ability.name + " : " + detail + ".");
}
function attack(state, actor, type) {
  const attacker = state.sides[actor];
  const rivalKey = actor === "player" ? "ai" : "player";
  const rival = state.sides[rivalKey];
  const unit = cardStats(attacker.active.id);
  let damage = type === "burst" ? unit.burst : unit.quick;
  const ability = type === "burst" ? unit.ability : null;
  if (type === "burst") {
    attacker.energy -= 2;
    if (unit.role === "Tacticien") attacker.energy = Math.min(MAX_ENERGY, attacker.energy + 1);
    if (unit.role === "Chaos" && attacker.active.hp * 2 <= unit.maxHp) damage += 10;
  }
  if (ability?.effect === "unshielded" && rival.guard === 0) {
    damage += ability.value;
    log(state, ability.name + " : +" + ability.value + " dégâts.");
  }
  if (ability?.effect === "break-guard") {
    const broken = Math.min(ability.value, rival.guard);
    rival.guard -= broken;
    log(state, ability.name + " : " + broken + " protection détruite.");
  }
  const bypass = ability?.effect === "pierce" ? Math.min(ability.value, damage) : 0;
  const absorbed = Math.min(rival.guard, damage - bypass);
  rival.guard -= absorbed;
  const applied = damage - absorbed;
  rival.active.hp = Math.max(0, rival.active.hp - applied);
  log(state, (actor === "player" ? "Toi" : "Billy") + " : " +
    (type === "burst" ? (ability?.name || "capacité") : "frappe rapide") + " avec " + attacker.active.id +
    " (" + applied + " dégâts" + (absorbed ? ", " + absorbed + " bloqués" : "") + ").");
  applyAbilityAfterHit(state, attacker, rival, ability);
  if (rival.active.hp === 0) {
    rival.discard.push(rival.active.id);
    rival.active = null;
    attacker.knockouts += 1;
    log(state, "KO ! " + (actor === "player" ? "Tu remportes" : "Billy remporte") +
      " un point (" + attacker.knockouts + "/" + WIN_KOS + ").");
    replenish(rival);
    rival.guard = 0;
    if (attacker.knockouts >= WIN_KOS || !rival.active) {
      state.winner = actor;
      state.turn = null;
      log(state, actor === "player" ? "Victoire ! Tu gagnes la partie." : "Défaite : Billy gagne cette partie.");
    }
  }
}

/** Pure state transition: returns a new state and never changes the supplied state. */
export function applyAction(match, actor, action) {
  if (!match || !["player", "ai"].includes(actor)) throw new Error("Joueur invalide.");
  const valid = legalActions(match, actor);
  if (!action || !valid.some(a => a.type === action.type && (a.type !== "swap" || a.index === action.index))) {
    throw new Error("Action interdite pendant ce tour.");
  }
  const state = JSON.parse(JSON.stringify(match));
  const side = state.sides[actor];
  if (action.type === "quick" || action.type === "burst") attack(state, actor, action.type);
  if (action.type === "focus") {
    side.energy = Math.min(MAX_ENERGY, side.energy + 2);
    const guard = cardStats(side.active.id).focusGuard;
    side.guard = Math.min(35, side.guard + guard);
    log(state, (actor === "player" ? "Tu te concentres" : "Billy se concentre") +
      " : +2 énergie, +" + guard + " protection.");
  }
  if (action.type === "swap") {
    const old = side.active;
    side.active = side.bench[action.index];
    side.bench[action.index] = old;
    side.guard = Math.min(35, side.guard + 6);
    log(state, (actor === "player" ? "Tu changes" : "Billy change") +
      " de carte active pour " + side.active.id + ".");
  }
  state.version += 1;
  if (!state.winner) {
    const next = actor === "player" ? "ai" : "player";
    state.turn = next;
    state.sides[next].energy = Math.min(MAX_ENERGY, state.sides[next].energy + 1);
    if (next === "player") state.round += 1;
  }
  return state;
}

/** Skill presets modify only the choices of the solo AI, never the player's rules. */
export const AI_DIFFICULTIES = Object.freeze(["decouverte", "normal", "expert"]);

function expertActionScore(match, choice) {
  const current = match.sides.ai;
  const foe = match.sides.player;
  const after = applyAction(match, "ai", choice);
  const future = after.sides.ai;
  const target = after.sides.player;
  const knockouts = future.knockouts - current.knockouts;
  const hpDamage = knockouts > 0
    ? foe.active.hp
    : foe.active.hp - target.active.hp;
  const guardDamage = foe.guard - target.guard;
  let score =
    hpDamage + guardDamage * 0.45 +
    knockouts * 62 + (after.winner === "ai" ? 180 : 0) +
    (future.energy - current.energy) * 7.3 +
    (future.guard - current.guard) * 0.48;

  // An apparently weak swap is useful only when it prevents a near-certain KO.
  if (choice.type === "swap") {
    const enemyStats = cardStats(foe.active.id);
    const nextThreat = foe.energy >= 1 ? enemyStats.burst : enemyStats.quick;
    const threatened = current.active.hp + current.guard <= nextThreat;
    const savedHp = future.active.hp - current.active.hp;
    score += Math.max(0, savedHp) * (threatened ? 0.48 : 0.18);
    score += threatened ? 17 : -7;
  }
  if (choice.type === "focus") {
    const threat = cardStats(foe.active.id).burst;
    const needed = current.active.hp + current.guard <= threat;
    const saved = future.active.hp + future.guard > threat;
    if (needed && saved) score += 16;
    if (foe.active.hp <= cardStats(current.active.id).quick) score -= 19;
  }
  return score;
}

/**
 * Select an AI move without mutating match state or seeing hidden cards.
 * "decouverte" is deliberately forgiving, "normal" keeps the original strategy,
 * "expert" evaluates legal single-turn outcomes. No server/PvP authority here.
 */
export function chooseAiAction(match, difficulty = "normal") {
  if (!AI_DIFFICULTIES.includes(difficulty)) {
    throw new Error("Difficulté inconnue : " + difficulty);
  }
  const choices = legalActions(match, "ai");
  if (!choices.length) return null;
  const self = match.sides.ai;
  const enemy = match.sides.player;
  const info = cardStats(self.active.id);

  if (difficulty === "decouverte") {
    if (self.energy >= 4 && match.round % 4 === 0) return { type: "burst" };
    if (self.guard < 8 && match.round % 5 === 0) return { type: "focus" };
    return { type: "quick" };
  }

  if (difficulty === "expert") {
    return choices.map(choice => ({ choice, score: expertActionScore(match, choice) }))
      .sort((a, b) => b.score - a.score)[0].choice;
  }

  const damaged = self.active.hp < info.maxHp * 0.28;
  if (damaged && self.bench.length && self.bench[0].hp > self.active.hp + 35) {
    return { type: "swap", index: 0 };
  }
  if (self.energy >= 2 &&
     (info.burst + (info.role === "Chaos" && self.active.hp * 2 <= info.maxHp ? 10 : 0) >= enemy.active.hp + enemy.guard ||
      self.energy >= 4 || match.round % 3 === 0)) {
    return { type: "burst" };
  }
  if (self.energy < 2 && self.guard < 8 && self.active.hp > enemy.active.hp * 0.65 && match.round % 3 === 1) {
    return { type: "focus" };
  }
  return { type: "quick" };
}
