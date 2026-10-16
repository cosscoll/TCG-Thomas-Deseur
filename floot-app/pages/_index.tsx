import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, AUTH_QUERY_KEY } from "../helpers/useAuth";
import { getCollection } from "../endpoints/collection_GET.schema";
import { postBooster } from "../endpoints/booster_POST.schema";
import { openCollectionReward } from "../endpoints/completion_POST.schema";
import { postProfile } from "../endpoints/profile_POST.schema";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/Dialog";
import { TcgBinder } from "../components/TcgBinder";
import { TcgGiftCodes } from "../components/TcgGiftCodes";
import { TcgLeaderboard } from "../components/TcgLeaderboard";
import { serializeCollectionExport } from "../helpers/tcgCollectionExport";
import styles from "./_index.module.css";

const rarities = ["commune", "rare", "epique", "legendaire", "hors_serie"] as const;
const labels: Record<string, string> = {
  commune: "Commune", rare: "Rare", epique: "Épique",
  legendaire: "Légendaire", hors_serie: "Hors-série", secrete: "Carte mystère",mystere:"Carte mystère",
};

function remainingTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  if (!seconds) return "Disponible maintenant";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return (hours ? String(hours).padStart(2, "0") + ":" : "")
    + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

export default function Home() {
  const { authState, logout, onLogin } = useAuth();
  const qc = useQueryClient();
  const logged = authState.type === "authenticated";
  const userId = logged ? authState.user.id : null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const [showDraw, setShowDraw] = useState(false);
  const [drawn, setDrawn] = useState<Awaited<ReturnType<typeof postBooster>>["drawn"]>([]);
  const [isCompletionReward,setIsCompletionReward]=useState(false);
  const [revealed, setRevealed] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profileNotice, setProfileNotice] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const collection = useQuery({
    queryKey: ["tcg-collection", userId],
    queryFn: ({ signal }) => getCollection(signal),
    enabled: logged,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const claim = useMutation({
    mutationFn: async () => {
      const owner = userIdRef.current;
      const result = await postBooster();
      return { owner, result };
    },
    onSuccess: ({ owner, result }) => {
      if (owner === null || owner !== userIdRef.current) return;
      setIsCompletionReward(false);
      setDrawn(result.drawn);
      setRevealed(1);
      setShowDraw(true);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tcg-collection"] });
      qc.invalidateQueries({ queryKey: ["tcg-leaderboard"] });
      setNow(Date.now());
    },
  });
  const reward = useMutation({
    mutationFn: async () => {
      const owner=userIdRef.current;
      const result=await openCollectionReward();
      return {owner,result};
    },
    onSuccess: ({owner,result}) => {
      if(owner===null||owner!==userIdRef.current)return;
      setIsCompletionReward(true);
      setDrawn(result.drawn);
      setRevealed(1);
      setShowDraw(true);
    },
    onSettled: () => qc.invalidateQueries({queryKey:["tcg-collection"]}),
  });
  const profile = useMutation({
    mutationFn: async (body: Parameters<typeof postProfile>[0]) => {
      const owner = userIdRef.current;
      const result = await postProfile(body);
      return { owner, result };
    },
    onSuccess: ({ owner, result }) => {
      if (owner === null || owner !== userIdRef.current || authState.type !== "authenticated") return;
      onLogin({ ...authState.user, displayName: result.displayName });
      setEditingProfile(false);
      setProfileNotice("Ton pseudo a été enregistré.");
      qc.invalidateQueries({ queryKey: ["tcg-leaderboard"] });
    },
  });
  useEffect(() => {
    // A previous account's pack preview must never be visible in the next one.
    setShowDraw(false);
    setDrawn([]);
    setIsCompletionReward(false);
    setEditingProfile(false);
    setProfileNotice("");
    claim.reset();
    reward.reset();
    profile.reset();
  }, [userId]);

  const data = logged ? collection.data : undefined;
  const cards = data?.cards ?? [];
  const owned = new Map((data?.owned ?? []).map(card => [card.cardId, card.quantity]));
  const distinct = data?.completion.found ?? 0;
  const total = [...owned.values()].reduce((sum, quantity) => sum + quantity, 0);
  const due = data?.nextAvailable ? new Date(data.nextAvailable).getTime() : 0;
  const available = logged && Boolean(data) && ((data?.stock??0)+(data?.giftStock??0)>0);
  const activeCard = drawn[revealed - 1];
  const cardTotal = 105;
  const canOpenAgain = logged && (isCompletionReward ? ((data?.stock??0)+(data?.giftStock??0)>0)
    : ((claim.data?.result.stock??data?.stock??0)+(claim.data?.result.giftStock??data?.giftStock??0)>0));

  const signOut = async () => {
    try { await logout(); }
    catch (error) {
      setProfileNotice("La déconnexion n'a pas abouti. Réessaie.");
      console.error("Déconnexion impossible :", error);
    }
  };

  const exportCollection = () => {
    if (!data || authState.type !== "authenticated") return;
    const blob = new Blob([serializeCollectionExport(data,authState.user.displayName,new Date().toISOString())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tcg-deseur-classeur.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className={styles.app}>
      <Helmet htmlAttributes={{lang:"fr"}}>
        <title>TCG Deseur | Boosters et collection de cartes</title>
        <meta name="description" content="TCG Deseur : ouvre un booster de cinq cartes, découvre des raretés et complète ton classeur personnel en ligne." />
      </Helmet>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span>TCG</span><strong>DESEUR <small>JEU DE COLLECTION</small></strong>
        </Link>
        <nav aria-label="Navigation principale">
          <a href="#booster">Boosters</a>
          <a href="#collection">Classeur</a>
          <a href="#classement">Classement</a>
          <a href="#profile">Compte</a>
        </nav>
        {logged
          ? <Button variant="outline" size="sm" onClick={signOut}>Déconnexion</Button>
          : <Button asChild size="sm"><Link to="/login">Connexion / Inscription</Link></Button>}
      </header>

      <main className={styles.content}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>TCG DESEUR · ÉDITION ORIGINE · 105 ILLUSTRATIONS</p>
            <h1>La chasse aux cartes <em>commence ici.</em></h1>
            <p>Un booster, cinq découvertes. Collectionne les 67 cartes de base et leurs 38 alternatives pour débloquer ton booster exceptionnel.</p>
            <div className={styles.heroActions}>
              <Button asChild size="lg"><a href="#booster">Découvrir les boosters →</a></Button>
              <Button variant="outline" asChild size="lg"><a href="#collection">Mon classeur</a></Button>
            </div>
          </div>
          <div className={styles.cardsHero} aria-hidden="true">
            <div className={styles.cardBack}>TCG</div>
            <div className={styles.cardFront}><small>ÉDITION ORIGINE</small><b>TCG</b><span>105 À COLLECTIONNER</span></div>
          </div>
        </section>

        <section className={styles.stats} aria-label="Statistiques de collection">
          <div><span>Cartes différentes</span><strong>{data ? distinct : "—"} <small>/ {cardTotal}</small></strong></div>
          <div><span>Boosters ouverts</span><strong>{data?.opened ?? "—"}</strong></div>
          <div><span>Doublons</span><strong>{data ? total - distinct : "—"}</strong></div>
          <div><span>Progression</span><strong>{data ? Math.round(distinct / cardTotal * 100) + "%" : "—"}</strong></div>
        </section>

        <section id="booster" className={styles.section}>
          <div className={styles.sectionTitle}>
            <p className={styles.kicker}>01 / LA DÉCOUVERTE</p>
            <h2>Ouvrir un booster</h2>
            <p>Les trois premières cartes sont Communes. La quatrième : 90 % Rare ou 10 % Alternative. La cinquième : 80 % Rare, 17 % Épique, 2 % Légendaire ou 1 % Hors-série.</p>
          </div>
          <div className={styles.boosterPanel}>
            <div className={styles.packVisual} aria-hidden="true"><small>ÉDITION ORIGINE</small><b>TCG DESEUR</b><strong>?</strong><span>5 CARTES</span></div>
            <div className={styles.packText}>
              <h3>Un peu de suspense.<br />Une nouvelle découverte.</h3>
              <p>Trois Communes garanties, une quatrième Rare ou Alternative et une dernière Rare ou supérieure. Chaque carte est enregistrée dans ton classeur.</p>
              <div className={styles.rarityChips}>{rarities.map(r => <span key={r}>{labels[r]}</span>)}</div>
              {!logged
                ? <p className={styles.notice}>Crée ton compte pour ouvrir ton premier booster et conserver tes cartes en ligne.</p>
                : collection.isLoading
                  ? <p className={styles.notice}>Chargement de la collection…</p>
                  : collection.isError
                    ? <div className={styles.notice} role="alert"><p>Impossible de charger ton classeur.</p><Button variant="outline" size="sm" onClick={() => collection.refetch()}>Réessayer</Button></div>
                    : <p className={styles.notice} role="status">
                        <strong>{data?.stock??0} / 3 boosters classiques</strong> en stock
                        {(data?.giftStock??0)>0 && <> · <strong>{data?.giftStock} booster(s) cadeau(x)</strong></>}
                        {(data?.stock??0)<3 && due>now && <> · Recharge dans <strong className={styles.timer}>{remainingTime(due-now)}</strong></>}
                        {(data?.stock??0)===3 && <> · Réserve pleine</>}
                      </p>}
              {logged
                ? <Button size="lg" disabled={!available || claim.isPending || reward.isPending} onClick={() => claim.mutate()}>
                    {claim.isPending ? "Enregistrement des cinq cartes…" : "Ouvrir mon booster →"}
                  </Button>
                : <Button size="lg" asChild><Link to="/login?mode=register">Créer mon compte →</Link></Button>}
              {claim.isError && <p className={styles.error} role="alert">{claim.error.message} La disponibilité va être actualisée.</p>}
              <small className={styles.small}>1 booster toutes les 12 heures. Réserve de 3 maximum. Aucun achat.</small>
            </div>
          </div>
        </section>

        <section className={styles.completionPanel} aria-labelledby="completion-title">
          <div>
            <p className={styles.kicker}>DÉFI DE COLLECTION</p>
            <h2 id="completion-title">Complète ton classeur, débloque un booster exceptionnel.</h2>
            <p>Réunis les 105 illustrations de la collection (67 cartes de base et 38 alternatives) pour recevoir un booster exceptionnel contenant cinq cartes. Son contenu reste à découvrir lors de l'ouverture.</p>
            {logged && data && <p role="status"><strong>{data.completion.found} / {data.completion.required}</strong> cartes différentes découvertes.</p>}
            {logged && data?.completion.claimed && <p role="status">Booster de collection déjà récupéré.</p>}
            {logged && data?.completion.available && <p role="status">Ton booster de collection est prêt.</p>}
          </div>
          {logged && data && <Button size="lg" disabled={!data.completion.available || reward.isPending || claim.isPending} onClick={()=>reward.mutate()}>
            {reward.isPending?"Enregistrement des cartes…":"Ouvrir mon booster de collection"}
          </Button>}
          {reward.isError && <p className={styles.error} role="alert">{reward.error.message}</p>}
        </section>

        <TcgGiftCodes logged={logged} isAdmin={logged && authState.user.role === "admin"} cards={(data?.cards ?? []).filter(card => card.ordinal <= 105)} />

        <section id="collection" className={styles.section}>
          <div className={styles.sectionTitle}>
            <p className={styles.kicker}>02 / COLLECTION</p>
            <h2>Mon classeur</h2>
            <p>{logged ? "Cartes possédées, exemplaires en double, objectifs et historique privé de tes ouvertures." : "Connecte-toi pour découvrir les cartes du nouveau classeur."}</p>
          </div>
          {logged && data && <TcgBinder key={userId} data={data} />}
          {!logged && <div className={styles.empty}><p>Ton classeur sera disponible dès que tu auras créé un compte.</p><Button asChild><Link to="/login">M'inscrire</Link></Button></div>}
          {logged && collection.isLoading && <div className={styles.empty}>Chargement du classeur…</div>}
          {logged && collection.isError && <div className={styles.empty} role="alert"><p>Ton classeur n'a pas pu être chargé.</p><Button onClick={() => collection.refetch()}>Réessayer</Button></div>}
        </section>

        <TcgLeaderboard />

        <section id="profile" className={styles.account}>
          <div><p className={styles.kicker}>03 / ESPACE JOUEUR</p><h2>Un compte, une collection.</h2><p>Retrouve ta progression sur plusieurs appareils, sans sauvegarde locale fragile.</p></div>
          {logged ? <div className={styles.accountDetails}>
            <strong>{authState.user.displayName}</strong><p>{authState.user.email}</p>
            {profileNotice && <p className={styles.small} role="status">{profileNotice}</p>}
            {editingProfile
              ? <form className={styles.profileForm} onSubmit={event => { event.preventDefault(); profile.mutate({ displayName }); }}>
                  <label htmlFor="display-name">Ton pseudonyme (3 à 24 caractères)</label>
                  <Input id="display-name" maxLength={24} value={displayName} onChange={event => setDisplayName(event.target.value)} />
                  {profile.isError && <p className={styles.error} role="alert">{profile.error.message}</p>}
                  <div className={styles.profileActions}>
                    <Button type="submit" disabled={profile.isPending || displayName.trim().length < 3}>Enregistrer</Button>
                    <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>Annuler</Button>
                  </div>
                </form>
              : <Button variant="outline" onClick={() => { setDisplayName(authState.user.displayName); setEditingProfile(true); setProfileNotice(""); }}>Modifier mon pseudo</Button>}
            <Button variant="outline" disabled={!data} onClick={exportCollection}>Exporter mon classeur (JSON sans e-mail)</Button>
            <Button variant="outline" onClick={signOut}>Me déconnecter</Button>
          </div> : <Button asChild size="lg"><Link to="/login">Créer mon compte →</Link></Button>}
        </section>
      </main>

      <footer>TCG Deseur — Prototype indépendant non officiel. Collection uniquement.</footer>
      <Dialog open={showDraw} onOpenChange={setShowDraw}>
        <DialogContent className={styles.drawDialog}>
          <DialogHeader>
            <DialogTitle>{isCompletionReward?"Ton booster de collection":"Découverte de ton booster"}</DialogTitle>
            <DialogDescription>Les cinq cartes sont enregistrées dans ton compte. Révèle-les une par une pour découvrir la surprise.</DialogDescription>
          </DialogHeader>
          {activeCard && <div className={styles.revealStage} aria-live="polite">
            <span className={styles.revealCount}>CARTE {revealed} SUR 5</span>
            <div className={styles.revealCard} data-rarity={activeCard.rarity} key={revealed}>
              <small>{labels[activeCard.rarity]}{activeCard.alternative?" · VERSION ALTERNATIVE":""}</small>{activeCard.imagePath?<img className={styles.drawImage} src={activeCard.imagePath} alt="" />:<b aria-hidden="true">?</b>}
              <strong>{activeCard.name}</strong>
              <span>{activeCard.newCard ? "NOUVELLE CARTE" : "DOUBLON · EXEMPLAIRE " + activeCard.quantity}</span>
            </div>
            <div className={styles.revealProgress} aria-label={revealed + " cartes révélées sur 5"}>
              {drawn.map((_, index) => <i key={index} className={index < revealed ? styles.revealedDot : ""} />)}
            </div>
          </div>}
          {revealed < drawn.length
            ? <Button size="lg" onClick={() => setRevealed(current => Math.min(drawn.length, current + 1))}>Révéler la carte suivante →</Button>
            : <div className={styles.finalActions}>
                {canOpenAgain && !claim.isPending && !reward.isPending && <Button size="lg" disabled={claim.isPending} onClick={() => claim.mutate()}>Ouvrir un autre booster →</Button>}
                {claim.isPending && <Button size="lg" disabled>Ouverture du prochain booster…</Button>}
                {claim.isError && <p className={styles.error} role="alert">{claim.error.message}</p>}
                {!canOpenAgain && <p className={styles.small}>Tu n'as plus de booster en stock. Reviens après la prochaine recharge.</p>}
                <Button variant="outline" onClick={() => { setShowDraw(false); document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }); }}>Voir mon classeur →</Button>
              </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

