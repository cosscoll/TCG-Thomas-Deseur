/**
 * Server-only orchestrator for Chevelu's one-time reward.
 *
 * Call ONLY from a logged-in POST endpoint. Caller MUST obtain userId from
 * the validated server session, never request body or localStorage.
 *
 * Contract:
 * - withLockedUserTransaction(userId, callback): one serialized PostgreSQL
 *   transaction under per-user row lock / advisory xact lock;
 * - transaction.getOwnedCardIds(): SELECT official inventory quantities > 0;
 * - transaction.hasSecretClaim(): SELECT existing claim;
 * - transaction.insertSecretClaimOnce(): INSERT ... ON CONFLICT DO NOTHING
 *   RETURNING id, true iff inserted;
 * - transaction.grantCardOnce(id): award exactly one unique Chevelu card
 *   through authoritative inventory UPSERT in SAME transaction.
 * All methods must reject on database failures so transaction rolls back.
 */
import {assertSecretPackEligible} from "../game/collection-161.js";
import {SECRET_CARD_ID} from "../data/cards-161.js";

export async function claimSecretPack161({userId,withLockedUserTransaction}){
  if(typeof userId!=="string"||!userId||typeof withLockedUserTransaction!=="function"){
    throw new Error("Session authentifiée requise");
  }
  return await withLockedUserTransaction(userId,async transaction=>{
    if(!transaction||typeof transaction.getOwnedCardIds!=="function"||
      typeof transaction.hasSecretClaim!=="function"||
      typeof transaction.insertSecretClaimOnce!=="function"||
      typeof transaction.grantCardOnce!=="function"){
      throw new Error("Transaction serveur incomplète");
    }
    const [owned,alreadyClaimed]=await Promise.all([
      transaction.getOwnedCardIds(),transaction.hasSecretClaim(),
    ]);
    const ownership=Object.fromEntries(
      owned.map(row=>[row.cardId,row.quantity])
    );
    // Validate current ownership under lock, not a cached HTTP response.
    assertSecretPackEligible(ownership,{secretPackClaimed:alreadyClaimed});
    // Unique DB constraint enforces one claim per player even if the lock
    // implementation accidentally races.
    const inserted=await transaction.insertSecretClaimOnce();
    if(!inserted)throw new Error("Booster secret déjà attribué");
    // This grant is inside the SAME transaction as the uniqueness record.
    await transaction.grantCardOnce(SECRET_CARD_ID);
    return Object.freeze({
      kind:"special_booster",cardId:SECRET_CARD_ID,
      cards:[SECRET_CARD_ID],count:1,
    });
  });
}
