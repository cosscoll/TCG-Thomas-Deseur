/** Live collection is always read from the authenticated server. */
export async function fetchCloudCollection(client, user) {
  if (!client || !user?.id) throw new Error("Compte requis.");
  const [owned, pack, history] = await Promise.all([
    client.from("tcg_player_cards").select("card_id,quantity").eq("user_id",user.id),
    client.from("tcg_player_pack_state").select("next_available_at,opened_count").eq("user_id",user.id).maybeSingle(),
    client.from("tcg_player_pack_history").select("cards,opened_at").eq("user_id",user.id).order("opened_at",{ascending:false}).limit(10),
  ]);
  if (owned.error || pack.error || history.error) throw new Error("Collection distante indisponible.");
  const copies = Object.create(null);
  for (const row of owned.data ?? []) copies[row.card_id] = row.quantity;
  return {
    copies,
    opened: pack.data?.opened_count ?? 0,
    history: (history.data ?? []).map(row => Array.isArray(row.cards) ? row.cards.map(card => card.id) : []),
    nextAvailableAt: pack.data?.next_available_at ?? null,
  };
}
export async function claimCloudBooster(client) {
  if (!client) throw new Error("Compte requis.");
  const {data,error} = await client.rpc("tcg_claim_daily_booster");
  if (error) {
    if (String(error.message).includes("booster_not_yet_available"))
      throw new Error("Ton prochain booster gratuit n'est pas encore disponible.");
    throw new Error("Ouverture indisponible. Réessaie plus tard.");
  }
  if (!data || !Array.isArray(data.cards) || data.cards.length!==5) throw new Error("Réponse de booster invalide.");
  return data;
}
