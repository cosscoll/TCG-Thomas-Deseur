import {db} from "../helpers/db";
import {sql} from "kysely";
import superjson from "superjson";
import type {OutputType} from "./leaderboard_GET.schema";
const headers={"Content-Type":"application/json","Cache-Control":"public, max-age=30"};
/** Read-only global ranking: never selects email, sessions or confidential artwork. */
export async function handle(){
 try{
  const result=await sql<{username:string;illustrations:number;boosters:number}>`
   SELECT COALESCE(NULLIF(TRIM(u.display_name),''),'Joueur') AS "username",
          COALESCE(inv.found,0)::integer AS "illustrations",
          COALESCE(packs.opened,0)::integer AS "boosters"
   FROM users u
   LEFT JOIN LATERAL (
    SELECT COUNT(*) AS found
    FROM tcg_artwork_inventory inv
    JOIN tcg_artwork_refs ref ON ref.artwork_id=inv.artwork_id AND ref.private=false
    WHERE inv.user_id=u.id AND inv.quantity>0
   ) inv ON true
   LEFT JOIN LATERAL (
    SELECT COUNT(*) AS opened
    FROM tcg_pack_history_origin h
    WHERE h.user_id=u.id AND h.kind<>'collection_reward'
   ) packs ON true
   ORDER BY "illustrations" DESC, "boosters" ASC, u.created_at ASC, u.id ASC
  `.execute(db);
  const players=result.rows.map((r,i)=>({
   rank:i+1,username:r.username,illustrations:Number(r.illustrations),boosters:Number(r.boosters)
  }));
  return new Response(superjson.stringify({players,totalPlayers:players.length} satisfies OutputType),{headers});
 }catch(error){
  console.error("TCG leaderboard",error);
  return new Response(superjson.stringify({error:"Classement momentanément indisponible."}),{status:500,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
 }
}
