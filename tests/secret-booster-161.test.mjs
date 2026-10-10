import test from "node:test";
import assert from "node:assert/strict";
import {claimSecretPack161} from "../server/secret-booster-161.mjs";
import {REQUIRED_FOR_CHEVELU,SECRET_CARD_ID} from "../data/cards-161.js";

const complete=Object.fromEntries(REQUIRED_FOR_CHEVELU.map(id=>[id,1]));
function fakeServer(initial=complete){
  const inventory={...initial};
  let claimed=false;
  let grants=0;
  let queue=Promise.resolve();
  return {
    get inventory(){return {...inventory}},
    get grants(){return grants},
    get claimed(){return claimed},
    withLockedUserTransaction:(_userId,callback)=>{
      const run=async()=>{
        // Fake commits/rollback; matches the transaction contract but runs
        // entirely in-memory, without ever modifying a player record.
        const snapshot={...inventory};
        const priorClaim=claimed,priorGrants=grants;
        try{return await callback({
          getOwnedCardIds:async()=>Object.entries(inventory).map(([cardId,quantity])=>({cardId,quantity})),
          hasSecretClaim:async()=>claimed,
          insertSecretClaimOnce:async()=>{
            if(claimed)return false;
            claimed=true;return true;
          },
          grantCardOnce:async id=>{
            assert.equal(id,SECRET_CARD_ID);
            inventory[id]=(inventory[id]??0)+1;
            grants++;
          },
        })}catch(error){
          for(const id of Object.keys(inventory))delete inventory[id];
          Object.assign(inventory,snapshot);
          claimed=priorClaim;grants=priorGrants;
          throw error;
        }
      };
      const promise=queue.then(run,run);
      queue=promise.catch(()=>{});
      return promise;
    },
  };
}
test("seul le serveur confirme un booster Chevelu contenant une carte",async()=>{
  const server=fakeServer();
  const output=await claimSecretPack161({userId:"player-test",withLockedUserTransaction:server.withLockedUserTransaction});
  assert.deepEqual(output,{kind:"special_booster",cardId:SECRET_CARD_ID,cards:[SECRET_CARD_ID],count:1});
  assert.equal(server.inventory[SECRET_CARD_ID],1);
  assert.equal(server.grants,1);
});
test("une carte manquante interdit le booster secret",async()=>{
  const inv={...complete};delete inv.td_lille;
  const server=fakeServer(inv);
  await assert.rejects(claimSecretPack161({userId:"player-test",withLockedUserTransaction:server.withLockedUserTransaction}),/incomplète/);
  assert.equal(server.grants,0);
  assert.equal(server.claimed,false);
});
test("20 demandes concurrentes ne distribuent Chevelu qu'une seule fois",async()=>{
  const server=fakeServer();
  const results=await Promise.allSettled(
    Array.from({length:20},()=>claimSecretPack161({userId:"player-test",withLockedUserTransaction:server.withLockedUserTransaction}))
  );
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
  assert.equal(results.filter(r=>r.status==="rejected").length,19);
  assert.equal(server.grants,1);
  assert.equal(server.inventory[SECRET_CARD_ID],1);
});
test("une erreur de grant fait revenir l'enregistrement du claim",async()=>{
  let claim=false;
  const error=()=>claimSecretPack161({
    userId:"player-test",
    withLockedUserTransaction:async(_id,transaction)=>{
      let localClaim=claim;
      try{
        return await transaction({
          getOwnedCardIds:async()=>Object.entries(complete).map(([cardId,quantity])=>({cardId,quantity})),
          hasSecretClaim:async()=>claim,
          insertSecretClaimOnce:async()=>{claim=true;return true},
          grantCardOnce:async()=>{throw new Error("database write error")},
        });
      }catch(e){claim=localClaim;throw e;}
    },
  });
  await assert.rejects(error(),/database write error/);
  assert.equal(claim,false);
});
test("id de compte absent et transaction absente sont rejetés",async()=>{
  await assert.rejects(claimSecretPack161({userId:"",withLockedUserTransaction:async()=>{}}),/Session/);
  await assert.rejects(claimSecretPack161({userId:"player"}),/Session/);
});
