import superjson from "superjson";
export type LeaderboardPlayer={rank:number;username:string;illustrations:number;boosters:number};
export type OutputType={players:LeaderboardPlayer[];totalPlayers:number};
export async function getLeaderboard(signal?:AbortSignal):Promise<OutputType>{
 const response=await fetch("/_api/leaderboard",{signal,cache:"no-store"});
 const data=superjson.parse<any>(await response.text());
 if(!response.ok)throw Error(data?.error||"Classement indisponible.");
 return data as OutputType;
}
