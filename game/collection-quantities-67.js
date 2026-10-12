/**
 * TCG Deseur — presentation-only quantities for the approved 67 characters.
 *
 * Input is the authenticated server's collection inventory, not generated
 * locally; this helper MUST NOT grant cards or update stored quantities.
 * The format of alternative artworks remains undecided.
 */
const MAX_COPIES=Number.MAX_SAFE_INTEGER;

export function describeOwnedQuantity(quantity) {
 if(!Number.isSafeInteger(quantity)||quantity<0)throw Error("Quantité invalide.");
 return {
  owned:quantity>=1,
  isDuplicate:quantity>=2,
  quantity,
  badge:quantity>=2?"×"+quantity:null,
  accessibleText:quantity===0?"Carte non obtenue":
    quantity===1?"1 exemplaire possédé":quantity+" exemplaires possédés",
 };
}

/** Read-only display model for the 67 approved base cards. */
export function buildApprovedCollectionQuantities(catalogue,inventory) {
 if(!Array.isArray(catalogue)||catalogue.length!==67)throw Error("Catalogue des 67 cartes requis.");
 if(!Array.isArray(inventory))throw Error("Inventaire du serveur requis.");
 const ids=new Set();
 for(const card of catalogue){
  if(!card||typeof card.id!=="string"||ids.has(card.id))throw Error("Catalogue des cartes invalide.");
  ids.add(card.id);
 }
 const stock=new Map();
 for(const line of inventory){
  if(!line||typeof line.cardId!=="string"||!ids.has(line.cardId)||
     !Number.isSafeInteger(line.quantity)||line.quantity<0||stock.has(line.cardId))
   throw Error("Inventaire incohérent, impossible d'afficher les exemplaires.");
  stock.set(line.cardId,line.quantity);
 }
 const cards=catalogue.map(c=>({...c,...describeOwnedQuantity(stock.get(c.id)??0)}));
 const uniqueOwned=cards.filter(c=>c.owned).length;
 const totalCopies=cards.reduce((n,c)=>{
  const sum=n+c.quantity;
  if(!Number.isSafeInteger(sum)||sum>MAX_COPIES)throw Error("Nombre d'exemplaires excessif.");
  return sum;
 },0);
 return {
  cards,
  uniqueOwned,
  missing:67-uniqueOwned,
  totalCopies,
  extraCopies:totalCopies-uniqueOwned,
  duplicateTypes:cards.filter(c=>c.isDuplicate).length,
  // A second copy does not replace a missing character.
  completedBaseCharacters:uniqueOwned===67,
 };
}
