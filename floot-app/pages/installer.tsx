import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { CheckCircle2, Chrome, Copy, Download, ExternalLink, Share2, Smartphone, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";
import { usePwaInstall } from "../helpers/tcgPwaInstall";
import { CHROME_ANDROID_INTENT, INSTALL_URL } from "../helpers/tcgInstallPlatform";
import styles from "./installer.module.css";

const ICON="/_cdn/static/5a3ee4b7-e241-413e-899e-dfa4d6af8a3f-tcg-deseur-app-icon.png";

export default function Installer() {
  const { environment, installed, canPrompt, install } = usePwaInstall();
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const ios=environment.platform==="ios";
  const android=environment.platform==="android";
  const inApp=environment.embeddedBrowser;

  const triggerInstall = async () => {
    const outcome=await install();
    if(outcome==="accepted") setMessage("Installation acceptée. Confirme si ton appareil le demande.");
    else if(outcome==="installed") setMessage("Le jeu est déjà installé.");
    else {
      setManual(true);
      setMessage(outcome==="dismissed"
        ?"Installation annulée. Tu peux utiliser le menu du navigateur."
        :"Ton navigateur ne propose pas l'installation directe. Voici comment faire.");
    }
  };
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_URL);
      setCopied(true);
      setMessage("Adresse copiée. Colle-la dans Chrome ou Safari pour installer le jeu.");
    } catch {
      setCopied(false);
      setMessage("La copie automatique est bloquée : sélectionne l'adresse affichée ci-dessous et copie-la.");
    }
  };

  return <div className={styles.page}>
    <Helmet htmlAttributes={{ lang:"fr" }}>
      <title>Installer TCG Thomas Deseur sur mon téléphone</title>
      <meta name="description" content="Installe TCG Thomas Deseur depuis Chrome sur Android ou depuis Safari sur iPhone. Gratuit, sans passer par un store." />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#171321" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="TCG Deseur" />
      <link rel="apple-touch-icon" href={ICON} />
    </Helmet>
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>TCG THOMAS DESEUR</Link>
      <Link to="/" className={styles.return}><ArrowLeft size={17} aria-hidden="true" /> Retour au jeu</Link>
    </header>
    <main>
      <section className={styles.hero}>
        <div className={styles.iconBox}><img src={ICON} alt="Icône de TCG Thomas Deseur" /></div>
        <div className={styles.mainCopy}>
          <p className={styles.kicker}>INSTALLATION GRATUITE</p>
          <h1>Le jeu sur ton <em>écran d’accueil.</em></h1>
          <p className={styles.subtitle}>Retrouve tes boosters et ta collection comme dans une application. Pas de store ni de nouveau compte à créer.</p>

          {installed ? <div className={styles.success} role="status">
            <CheckCircle2 size={23} aria-hidden="true" />
            <div><strong>Le jeu est déjà installé.</strong><p>Tu peux y jouer directement.</p></div>
          </div> : canPrompt ? <>
            <Button size="lg" className={styles.mainButton} onClick={triggerInstall}>
              <Download aria-hidden="true" size={20} /> Installer le jeu maintenant
            </Button>
            <p className={styles.micro}>Une seule confirmation peut être demandée par ton téléphone.</p>
          </> : inApp ? <div className={styles.actionBox}>
            <strong>Tu es dans le navigateur d’une application (Instagram, Facebook…)</strong>
            <p>Pour installer le jeu, ouvre cette page dans {ios ? "Safari" : "Chrome"}.</p>
            {android && <a className={styles.directAction} href={CHROME_ANDROID_INTENT}>
              <Chrome size={20} aria-hidden="true" /> Ouvrir avec Chrome <ExternalLink size={17} aria-hidden="true" />
            </a>}
            <Button variant="outline" className={styles.secondaryButton} onClick={copyAddress}>
              <Copy size={18} aria-hidden="true" /> {copied ? "Adresse copiée" : "Copier le lien pour "+(ios?"Safari":"Chrome")}
            </Button>
            <p className={styles.micro}>Sinon : menu <strong>⋮</strong> d’Instagram → « Ouvrir dans le navigateur ».</p>
          </div> : <>
            <div className={styles.actionBox}>
              <strong>{ios ? "Sur iPhone et iPad" : android ? "Sur Android, Xiaomi, Redmi ou Poco" : "Sur ordinateur"}</strong>
              {ios ? <p>Dans <strong>Safari</strong>, appuie sur <Share2 size={17} aria-label="Partager" /> <strong>Partager</strong>, puis « Sur l’écran d’accueil » et « Ajouter ».</p>
                : android ? <p>Dans <strong>Chrome</strong>, ouvre le menu <strong>⋮</strong> puis choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».</p>
                : <p>Dans <strong>Chrome ou Edge</strong>, cherche « Installer l'application » dans le menu du navigateur ou l'icône d'installation près de l'adresse.</p>}
              <Button variant="outline" className={styles.secondaryButton} onClick={() => setManual(!manual)}>
                {manual ? "Masquer les étapes" : "Afficher les étapes détaillées"}
              </Button>
            </div>
          </>}

          {message && <p className={styles.message} role="status">{message}</p>}
          {inApp && !installed && <p className={styles.address}><span>Adresse à ouvrir :</span> <a href={INSTALL_URL}>{INSTALL_URL}</a></p>}
        </div>
      </section>

      {(manual || (!installed && !canPrompt && !inApp)) && <section className={styles.steps} aria-label="Installation pas à pas">
        <h2>{ios ? "Installer sur iPhone" : android ? "Installer sur Android" : "Installer sur ton appareil"}</h2>
        <ol>
          <li><b>Ouvre le lien</b> dans {ios?"Safari":android?"Google Chrome":"Chrome ou Edge"}.</li>
          <li>{ios ? <>Appuie sur <strong>Partager</strong>, puis sur <strong>Sur l’écran d’accueil</strong>.</>
            : <>Appuie sur le menu <strong>⋮</strong> et choisis <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</>}</li>
          <li><b>Confirme « Ajouter ».</b> L’icône TCG Deseur apparaît sur ton écran d’accueil.</li>
        </ol>
      </section>}

      <aside className={styles.note}>
        <Smartphone size={23} aria-hidden="true" />
        <div><strong>Même jeu, même collection.</strong><p>L’installation est gratuite. Tes cartes restent liées à ton compte en ligne. Une connexion Internet est nécessaire pour jouer.</p></div>
      </aside>
    </main>
    <footer><Link to="/">Retour au jeu</Link> · <Link to="/confidentialite-regles">Confidentialité et règles</Link></footer>
  </div>;
}
