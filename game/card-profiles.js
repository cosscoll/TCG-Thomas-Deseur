/**
 * V0.2 — profils de gameplay conçus manuellement pour douze cartes pilotes.
 * Ces effets sont fictifs, propres au jeu. Ils ne prétendent pas décrire des
 * pouvoirs réels de Thomas Deseur ni les règles d'un ancien prototype.
 *
 * Les 37 autres cartes conservent temporairement leurs statistiques V0.1.
 */
const entries = {
  standupper: { role:"Assaut", maxHp:102, quick:27, burst:43, focusGuard:14, ability:{name:"Dernier mot", effect:"drain", value:1, description:"Retire 1 énergie à l'adversaire après l'attaque spéciale."}},
  matelas: { role:"Rempart", maxHp:136, quick:19, burst:36, focusGuard:23, ability:{name:"Amorti", effect:"fortify", value:15, description:"Ajoute 15 points de protection après l'attaque spéciale."}},
  rituels: { role:"Tacticien", maxHp:109, quick:22, burst:39, focusGuard:14, ability:{name:"Rituel accéléré", effect:"recharge", value:1, description:"Récupère 1 énergie après l'attaque spéciale."}},
  fontaine: { role:"Chaos", maxHp:113, quick:23, burst:39, focusGuard:14, ability:{name:"Seconde source", effect:"heal", value:15, description:"Restaure jusqu'à 15 PV de la carte active après l'attaque spéciale."}},
  etalon: { role:"Assaut", maxHp:101, quick:29, burst:41, focusGuard:14, ability:{name:"Élan", effect:"unshielded", value:10, description:"+10 dégâts si l'adversaire n'a aucune protection au début de l'attaque."}},
  mouette: { role:"Assaut", maxHp:100, quick:26, burst:43, focusGuard:14, ability:{name:"Piqué", effect:"pierce", value:12, description:"Jusqu'à 12 dégâts de la capacité traversent directement la protection."}},
  chemise: { role:"Chaos", maxHp:111, quick:24, burst:38, focusGuard:14, ability:{name:"Retournement", effect:"break-guard", value:12, description:"Détruit jusqu'à 12 points de protection avant les dégâts."}},
  fauxbras: { role:"Rempart", maxHp:130, quick:20, burst:36, focusGuard:22, ability:{name:"Diversion", effect:"guard-energy", value:8, description:"Gagne 8 points de protection et récupère 1 énergie."}},
  costume: { role:"Chaos", maxHp:114, quick:23, burst:41, focusGuard:14, ability:{name:"Relais", effect:"bench-heal", value:17, description:"Soigne de 17 PV la carte de réserve la plus blessée."}},
  touriste: { role:"Tacticien", maxHp:111, quick:22, burst:39, focusGuard:14, ability:{name:"Prudence", effect:"guard-low-hp", value:12, description:"Gagne 12 protection si ses PV sont inférieurs ou égaux à la moitié."}},
  arnaque: { role:"Tacticien", maxHp:107, quick:22, burst:37, focusGuard:14, ability:{name:"Détournement", effect:"steal-energy", value:1, description:"Vole jusqu'à 1 énergie à l'adversaire, sans dépasser le maximum d'énergie."}},
  regent: { role:"Rempart", maxHp:132, quick:20, burst:38, focusGuard:22, ability:{name:"Commandement", effect:"guard-heal", value:8, description:"Gagne 8 protection et restaure 6 PV de la carte active."}},
};
export const PILOT_PROFILES = Object.freeze(Object.fromEntries(
  Object.entries(entries).map(([id, p]) => [id, Object.freeze({
    ...p, ability:Object.freeze(p.ability),
  })])
));
export const PILOT_CARD_IDS = Object.freeze(Object.keys(PILOT_PROFILES));
