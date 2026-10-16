import type {OutputType as Collection} from "../endpoints/collection_GET.schema";

/** Sauvegarde locale des cartes ; ni identifiant interne, ni adresse e-mail. */
export function serializeCollectionExport(collection:Collection,pseudo:string,exportedAt:string):string {
 if(!collection||!Array.isArray(collection.cards)||!Array.isArray(collection.owned)||
   !Array.isArray(collection.history)||typeof pseudo!=="string"||
   !Number.isFinite(Date.parse(exportedAt))) throw Error("Export du classeur indisponible.");
 return JSON.stringify({
   application:"TCG Deseur",
   exportedAt,
   joueur:{pseudo},
   classeur:collection
 },null,2);
}
