import { accountsConfigured, getAccountClient } from "./client.js";

export async function initAccountPanel(onSessionChange) {
  const $ = id => document.getElementById(id);
  const form = $("accountForm");
  const status = $("accountMessage");
  const setup = $("accountSetup");
  const loggedOut = $("accountAnonymous");
  const loggedIn = $("accountMember");
  const passwordReset = $("accountPasswordRecovery");
  const mode = $("accountMode");
  const nameLabel = $("accountNameLabel");
  let client = null;
  let user = null;
  let recovery = false;
  const notify = message => { status.textContent = message; };
  const show = (element,visible) => { element.hidden = !visible; };

  function render() {
    show(setup, !accountsConfigured());
    show(loggedOut, accountsConfigured() && !user && !recovery);
    show(loggedIn, accountsConfigured() && Boolean(user) && !recovery);
    show(passwordReset, accountsConfigured() && recovery);
    if (user) $("accountUserEmail").textContent = user.email || "Compte connecté";
  }
  function notifyParent() {
    // Supabase discourages awaiting other auth operations within its listener.
    queueMicrotask(() => Promise.resolve(onSessionChange(client,user)).catch(
      () => notify("La collection de ton compte est momentanément indisponible.")
    ));
  }
  function updateMode() {
    const registering = mode.value === "signup";
    show(nameLabel, registering);
    $("accountName").required = registering;
    $("accountSubmit").textContent = registering ? "Créer mon compte" : "Me connecter";
    $("accountPassword").autocomplete = registering ? "new-password" : "current-password";
  }
  mode.addEventListener("change", updateMode);
  updateMode();
  render();
  if (!accountsConfigured()) {
    notify("L'inscription sera disponible après le raccordement sécurisé de Supabase. Tu peux découvrir le classeur de démonstration sans compte.");
    return;
  }
  try {
    client = await getAccountClient();
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    user = data?.user ?? null;
    render();
    notifyParent();
    client.auth.onAuthStateChange((event, session) => {
      user = session?.user ?? null;
      if (event === "PASSWORD_RECOVERY") recovery = true;
      if (event === "SIGNED_OUT") recovery = false;
      render();
      notifyParent();
    });
  } catch {
    notify("Service d'inscription indisponible. Réessaie plus tard.");
    return;
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const email=$("accountEmail").value.trim(),password=$("accountPassword").value;
    const signup=mode.value==="signup",name=$("accountName").value.trim();
    if (!email || password.length<8) { notify("Saisis un e-mail et un mot de passe d'au moins huit caractères."); return; }
    if (signup && (name.length<3 || name.length>30)) { notify("Ton pseudo doit contenir 3 à 30 caractères."); return; }
    const submit=$("accountSubmit");
    submit.disabled=true;
    try {
      const { data,error }=signup
        ? await client.auth.signUp({email,password,options:{data:{display_name:name}}})
        : await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      $("accountPassword").value="";
      notify(signup && !data?.session
        ? "Inscription reçue. Vérifie ta boîte e-mail pour confirmer ton compte."
        : "Connexion effectuée.");
    } catch { notify("Connexion ou inscription impossible. Vérifie les informations et réessaie."); }
    finally { submit.disabled=false; }
  });
  $("accountForgot").addEventListener("click",async()=>{
    const email=$("accountEmail").value.trim();
    if(!email){notify("Indique ton adresse e-mail dans le formulaire.");return;}
    try{
      const {error}=await client.auth.resetPasswordForEmail(email,{
        redirectTo:window.location.origin+window.location.pathname,
      });
      if(error)throw error;
      notify("Si ce compte existe, un lien de réinitialisation a été envoyé.");
    }catch{notify("Le lien n'a pas pu être envoyé. Réessaie plus tard.");}
  });
  $("accountChangePassword").addEventListener("click",async()=>{
    const password=$("accountNewPassword").value;
    if(password.length<8){notify("Huit caractères minimum.");return;}
    try{
      const {error}=await client.auth.updateUser({password});
      if(error)throw error;
      $("accountNewPassword").value="";
      recovery=false;
      render();
      notify("Ton mot de passe a été modifié.");
    }catch{notify("Modification impossible. Renvoie un lien de récupération.");}
  });
  $("accountSignOut").addEventListener("click",async()=>{
    try{
      const {error}=await client.auth.signOut();
      if(error)throw error;
      user=null;
      render();
      notifyParent();
      notify("Déconnexion effectuée.");
    }catch{notify("Déconnexion impossible, réessaie plus tard.");}
  });
}
