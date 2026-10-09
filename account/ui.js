import { accountsConfigured, getAccountClient } from "./client.js";

const $ = id => document.getElementById(id);
const dialog = $("accountDialog");
const button = $("accountButton");
const form = $("accountForm");
const status = $("accountMessage");
const mode = $("accountMode");
const nicknameLabel = $("accountNicknameLabel");
const submit = $("accountSubmit");
const logout = $("accountSignOut");
let client = null;
let currentUser = null;

function announce(message) { status.textContent = message; }
function render() {
  const loggedIn = Boolean(currentUser);
  form.hidden = loggedIn || !accountsConfigured();
  logout.hidden = !loggedIn;
  button.textContent = loggedIn ? "Mon compte" : "Compte joueur";
  if (loggedIn) {
    announce("Connecté : " + (currentUser.email || "joueur") +
      ". La synchronisation des combats sera ajoutée après sécurisation du serveur.");
  } else if (!accountsConfigured()) {
    announce("La création de compte sera activée après raccordement d'un projet Supabase. Aucun compte n'est créé dans ce prototype.");
  } else announce("Connecte-toi ou crée ton compte. Selon la configuration, un e-mail de confirmation sera envoyé.");
}
function updateFormMode() {
  const creating = mode.value === "signup";
  nicknameLabel.hidden = !creating;
  $("accountNickname").required = creating;
  submit.textContent = creating ? "Créer mon compte" : "Se connecter";
}
mode.addEventListener("change", updateFormMode);
button.addEventListener("click", () => {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!client || currentUser) return;
  const email = $("accountEmail").value.trim();
  const password = $("accountPassword").value;
  const nickname = $("accountNickname").value.trim();
  if (!email || password.length < 8) {
    announce("Saisis un e-mail valide et un mot de passe de 8 caractères minimum.");
    return;
  }
  if (mode.value === "signup" && (nickname.length < 2 || nickname.length > 24)) {
    announce("Le pseudonyme doit comporter entre 2 et 24 caractères.");
    return;
  }
  submit.disabled = true;
  try {
    const result = mode.value === "signup"
      ? await client.auth.signUp({email,password,options:{data:{username:nickname}}})
      : await client.auth.signInWithPassword({email,password});
    if (result.error) throw result.error;
    $("accountPassword").value = "";
    if (mode.value === "signup" && !result.data.session) {
      announce("Demande reçue. Vérifie ta boîte e-mail pour confirmer ton inscription.");
    } else {
      currentUser = result.data.user;
      render();
    }
  } catch (error) {
    announce("Compte : " + (error?.message || "une erreur est survenue") +
      ". Vérifie les informations et réessaie.");
  } finally { submit.disabled = false; }
});
logout.addEventListener("click", async () => {
  if (!client) return;
  logout.disabled = true;
  try {
    const {error} = await client.auth.signOut();
    if (error) throw error;
    currentUser = null;
    render();
  } catch { announce("La déconnexion a échoué. Réessaie."); }
  finally { logout.disabled = false; }
});
updateFormMode();
render();
if (accountsConfigured()) {
  getAccountClient().then(async connected => {
    client = connected;
    const {data:{user},error} = await client.auth.getUser();
    if (error) throw error;
    currentUser = user;
    render();
    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      render();
    });
  }).catch(() => announce("Service de comptes indisponible. Réessaie plus tard."));
}
