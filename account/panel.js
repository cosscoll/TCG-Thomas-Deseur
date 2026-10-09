import { getAccountClient, accountsConfigured } from "./client.js";
import { validateDeck } from "../game/engine.js";

/**
 * Account UI is optional. The solo game stays fully usable without backend.
 * Cloud decks are snapshots uploaded/downloaded by the player explicitly.
 * Local scores are NEVER treated as server-trusted rewards.
 */
export async function initAccountPanel({ readDeck, applyDeck }) {
  const $ = id => document.getElementById(id);
  const form = $("accountForm");
  if (!form) return;
  const feedback = $("accountFeedback");
  const formSection = $("accountAnonymous");
  const memberSection = $("accountMember");
  const setup = $("accountSetup");
  const recoverySection = $("accountRecovery");
  let client = null, user = null, recovering = false;

  const notify = message => { feedback.textContent = message; };
  const setVisible = (node, show) => { node.hidden = !show; };
  function render() {
    setVisible(setup, !accountsConfigured());
    setVisible(formSection, accountsConfigured() && !user && !recovering);
    setVisible(memberSection, accountsConfigured() && Boolean(user) && !recovering);
    setVisible(recoverySection, accountsConfigured() && recovering);
    if (user) $("accountUser").textContent = "Connecté : " + (user.email || "joueur");
  }
  render();
  if (!accountsConfigured()) {
    notify("Les comptes seront activés dès qu'un projet Supabase sécurisé sera connecté.");
    return;
  }
  try {
    client = await getAccountClient();
    if (!client) return;
    const { data, error } = await client.auth.getUser();
    if (error) notify("La session précédente n'a pas pu être relue.");
    user = data?.user ?? null;
    render();
    client.auth.onAuthStateChange((event, session) => {
      user = session?.user ?? null;
      recovering = event === "PASSWORD_RECOVERY" ? true : event === "SIGNED_OUT" ? false : recovering;
      render();
    });
  } catch {
    notify("Service de comptes indisponible. Le mode solo local reste accessible.");
    return;
  }

  $("accountMode").addEventListener("change", () => {
    $("accountNameLabel").hidden = $("accountMode").value !== "signup";
    notify("");
  });
  $("accountMode").dispatchEvent(new Event("change"));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) return;
    const email = $("accountEmail").value.trim();
    const password = $("accountPassword").value;
    const mode = $("accountMode").value;
    if (!email || password.length < 8) {
      notify("Renseigne un e-mail et un mot de passe d'au moins 8 caractères.");
      return;
    }
    const button = $("accountSubmit");
    button.disabled = true;
    try {
      if (mode === "signup") {
        const name = $("accountName").value.trim();
        if (name.length < 3 || name.length > 30) {
          notify("Le pseudo doit contenir entre 3 et 30 caractères.");
          return;
        }
        const { data, error } = await client.auth.signUp({
          email, password, options: { data: { display_name: name } },
        });
        if (error) throw error;
        notify(data.session
          ? "Compte créé et connecté. Tu peux maintenant sauvegarder ton deck."
          : "Demande reçue. Vérifie ton e-mail pour confirmer ton inscription.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        notify("Connexion effectuée.");
      }
      $("accountPassword").value = "";
    } catch {
      notify("Connexion ou inscription impossible. Vérifie les informations et réessaie.");
    } finally {
      button.disabled = false;
    }
  });

  $("accountForgot").addEventListener("click", async () => {
    const email = $("accountEmail").value.trim();
    if (!email) { notify("Saisis ton adresse e-mail avant de demander un lien."); return; }
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      // Identical message to avoid revealing whether an address is registered.
      notify("Si cette adresse est reconnue, tu recevras un lien pour changer le mot de passe.");
    } catch {
      notify("Impossible d'envoyer le lien actuellement. Réessaie plus tard.");
    }
  });

  $("accountUpdatePassword").addEventListener("click", async () => {
    const pass = $("accountNewPassword").value;
    if (pass.length < 8) { notify("Choisis au moins 8 caractères."); return; }
    try {
      const { error } = await client.auth.updateUser({ password: pass });
      if (error) throw error;
      recovering = false;
      $("accountNewPassword").value = "";
      render();
      notify("Mot de passe mis à jour.");
    } catch {
      notify("Modification impossible. Renvoie un lien de réinitialisation.");
    }
  });

  $("accountSignOut").addEventListener("click", async () => {
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      user = null;
      recovering = false;
      render();
      notify("Déconnexion effectuée. Ton deck local reste sur cet appareil.");
    } catch {
      notify("Déconnexion impossible pour le moment.");
    }
  });

  $("accountSaveDeck").addEventListener("click", async () => {
    if (!user || !client) return;
    const cards = readDeck();
    const validation = validateDeck(cards);
    if (!validation.valid) { notify("Deck incomplet : sauvegarde cloud annulée."); return; }
    const { error } = await client.from("player_decks")
      .upsert({ user_id: user.id, cards }, { onConflict: "user_id" });
    notify(error ? "Enregistrement impossible : vérifie la configuration du compte."
      : "Deck enregistré dans ton compte.");
  });

  $("accountLoadDeck").addEventListener("click", async () => {
    if (!user || !client) return;
    const { data, error } = await client.from("player_decks")
      .select("cards").eq("user_id", user.id).maybeSingle();
    if (error) { notify("Chargement du deck impossible."); return; }
    if (!data) { notify("Aucun deck enregistré sur ton compte."); return; }
    if (!validateDeck(data.cards).valid) { notify("Deck cloud invalide : aucune modification locale."); return; }
    applyDeck(data.cards);
    notify("Deck chargé depuis ton compte sur cet appareil.");
  });
}
