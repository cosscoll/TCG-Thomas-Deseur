import React from "react";
import {useQuery} from "@tanstack/react-query";
import {getLeaderboard} from "../endpoints/leaderboard_GET.schema";
import styles from "./TcgLeaderboard.module.css";
export function TcgLeaderboard(){
 const query=useQuery({queryKey:["tcg-leaderboard"],queryFn:({signal})=>getLeaderboard(signal),staleTime:60_000,refetchOnWindowFocus:true,retry:1});
 return <section className={styles.board} id="classement" aria-labelledby="leaderboard-heading">
  <div className={styles.intro}><p className={styles.kicker}>CLASSEMENT DES COLLECTIONNEURS</p>
   <h2 id="leaderboard-heading">Le classement des joueurs</h2>
   <p>Le classement récompense la plus grande collection d'illustrations différentes sur 105. En cas d'égalité, le joueur ayant ouvert le moins de boosters est devant.</p></div>
  {query.isLoading && <p role="status">Chargement du classement…</p>}
  {query.isError && <div role="alert">Classement indisponible pour le moment. <button type="button" onClick={()=>query.refetch()}>Réessayer</button></div>}
  {query.data && <><div className={styles.total}>Joueurs classés : <strong>{query.data.totalPlayers}</strong></div>
   <div className={styles.tableWrap}><table className={styles.table}>
    <thead><tr><th scope="col">Rang</th><th scope="col">Joueur</th><th scope="col">Collection</th><th scope="col">Boosters ouverts</th></tr></thead>
    <tbody>{query.data.players.map((player,i)=><tr key={i}>
     <td className={styles.rank}>#{player.rank}</td><td className={styles.player}>{player.username}</td>
     <td><strong>{player.illustrations}</strong> / 105</td><td>{player.boosters}</td>
    </tr>)}</tbody>
   </table></div>
   <p className={styles.note}>Nombre total de boosters ouverts à ce jour. Les cartes reçues directement par code cadeau comptent dans la collection, sans ajouter un booster. Seuls les pseudonymes sont publics.</p>
  </>}
 </section>;
}
