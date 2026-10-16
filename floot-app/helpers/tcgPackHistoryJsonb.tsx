import {sql} from "kysely";

/** Five explicitly typed SQL parameters become a JSONB array.
 * JSON.stringify(ids) produced a JSONB string (PostgreSQL 23514).
 * Bare parameters passed to variadic jsonb_build_array(any) cannot be
 * inferred by PostgreSQL (42P18). Always cast each bound id to text.
 */
export function tcgPackHistoryJsonb(ids:readonly string[]){
 if(ids.length!==5||ids.some(id=>typeof id!=="string"||!id.trim())){
  throw Error("Historique du booster : cinq références valides requises.");
 }
 return sql<string[]>`jsonb_build_array(${sql.join(ids.map(id=>sql`${id}::text`))})`;
}
