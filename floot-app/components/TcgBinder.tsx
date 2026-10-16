import React, { useMemo, useRef, useState } from "react";
import type { OutputType as CollectionData } from "../endpoints/collection_GET.schema";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./Dialog";
import {
  buildBinder, filterBinder, binderCsv, binderMilestones, RARITIES, RARITY_LABELS,
  type Binder, type BinderCard, type Rarity,
} from "../helpers/tcgCollection";
import styles from "./TcgBinder.module.css";
import {tcgHistoryArtwork} from "../helpers/tcgHistoryArtwork";

type View = "collection" | "duplicates" | "progress" | "history";
const getLabel = (value: string) => RARITY_LABELS[value as Rarity] ?? value;
function saveBlob(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export function TcgBinder({ data }: { data: CollectionData }) {
  const [view, setView] = useState<View>("collection");
  const [search, setSearch] = useState("");
  const [ownership, setOwnership] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [sort, setSort] = useState("catalogue");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const calculated = useMemo(() => {
    try {
      return { binder: buildBinder(data.cards, data.owned), error: "" } as const;
    } catch (error) {
      return {
        binder: null,
        error: error instanceof Error ? error.message : "Collection indisponible.",
      } as const;
    }
  }, [data.cards, data.owned]);
  const binder = calculated.binder;
  if (!binder) {
    return <div className={styles.error} role="alert">Les données du classeur ne peuvent pas être affichées : {calculated.error}. Réessaie dans un instant.</div>;
  }
  const visible = filterBinder(binder, { ownership: view === "duplicates" ? "duplicates" : ownership, rarity, search, sort });
  const selected = binder.cards.find(card => card.id === selectedId);
  const selectedIndex = visible.findIndex(card => card.id === selectedId);
  const goals = binderMilestones(binder);
  const completedGoals = goals.filter(goal => goal.achieved).length;
  const progress = binder.byRarity;
  // A hidden reward must never leak through an empty rarity tile or filter.
  const visibleRarities = RARITIES.filter(r => !["secrete","mystere"].includes(r) || binder.cards.some(c => c.rarity === r));

  const resetFilters = () => { setSearch(""); setOwnership("all"); setRarity("all"); setSort("catalogue"); };
  const navigateTo = (next: View, own = "all", category = "all") => {
    setView(next); setOwnership(own); setRarity(category); setSearch(""); setSort("catalogue"); setSelectedId(null);
  };
  const moveCard = (step: number) => {
    const index = selectedIndex + step;
    const next = visible[index];
    if (!next) return;
    setSelectedId(next.id);
    // Disabled buttons lose keyboard focus. Keep the alternative active.
    if (step > 0 && index === visible.length - 1) previousRef.current?.focus();
    if (step < 0 && index === 0) nextRef.current?.focus();
  };
  const downloadCsv = () => saveBlob(binderCsv(binder), "tcg-deseur-ma-collection.csv", "text/csv;charset=utf-8");

  return <div className={styles.wrapper}>
    <div className={styles.metrics} aria-label="Statistiques de ta collection">
      <button type="button" onClick={() => navigateTo("collection", "owned")} className={styles.metric}>
        <span>Cartes différentes</span><strong>{binder.discovered} / {binder.total}</strong><small>Voir les possédées</small>
      </button>
      <button type="button" onClick={() => navigateTo("duplicates")} className={styles.metric}>
        <span>Exemplaires en double</span><strong>{binder.extras}</strong><small>{binder.duplicateTypes} type{binder.duplicateTypes > 1 ? "s" : ""} de cartes</small>
      </button>
      <button type="button" onClick={() => navigateTo("collection", "missing")} className={styles.metric}>
        <span>Cartes manquantes</span><strong>{binder.missing}</strong><small>Voir les cartes à trouver</small>
      </button>
      <div className={styles.metric}><span>Exemplaires au total</span><strong>{binder.copies}</strong><small>Doublons inclus</small></div>
    </div>

    <div className={styles.overall}>
      <div className={styles.progressTitle}><span>Progression de ta collection</span><strong>{binder.percent} %</strong></div>
      <div className={styles.bar} role="progressbar" aria-label="Progression générale du classeur" aria-valuemin={0} aria-valuemax={binder.total} aria-valuenow={binder.discovered}>
        <span style={{ width: binder.percent + "%" }} />
      </div>
      <div className={styles.rarityGrid}>
        {progress.filter(group => visibleRarities.includes(group.rarity)).map(group => <button key={group.rarity} type="button"
          onClick={() => navigateTo("collection", "all", group.rarity)}
          className={styles.rarityBox} data-rarity={group.rarity}
          aria-label={getLabel(group.rarity) + " : " + group.discovered + " cartes sur " + group.total + ". Voir ces cartes."}>
          <span>{getLabel(group.rarity)}</span><strong>{group.discovered} / {group.total}</strong>
          <span className={styles.miniBar} aria-hidden="true"><i style={{ width: group.percent + "%" }} /></span>
        </button>)}
      </div>
    </div>

    <div className={styles.navigation} aria-label="Rubriques du classeur">
      {([
        ["collection", "Mes cartes"],
        ["duplicates", "Mes doublons"],
        ["progress", "Objectifs"],
        ["history", "Historique"],
      ] as const).map(([id, text]) =>
        <Button key={id} size="sm" type="button" variant={view === id ? "primary" : "outline"}
          aria-pressed={view === id} onClick={() => navigateTo(id)}>{text}</Button>
      )}
    </div>

    {(view === "collection" || view === "duplicates") && <>
      <div className={styles.viewHeader}>
        <div><h3>{view === "duplicates" ? "Mes doublons" : "Toutes les cartes"}</h3>
        <p>{view === "duplicates"
          ? binder.duplicateTypes + " cartes différentes possédées plusieurs fois, soit " + binder.extras + " copies supplémentaires. Aucun échange n'est effectué."
          : "Une carte obtenue plusieurs fois ne compte qu'une fois pour compléter le classeur."}</p></div>
        <Button variant="outline" size="sm" onClick={downloadCsv}>Exporter en CSV</Button>
      </div>
      <div className={styles.filters}>
        <Input aria-label="Rechercher par nom ou identifiant" value={search} placeholder="Rechercher une carte…" onChange={event => setSearch(event.target.value)} />
        {view === "collection" && <Select value={ownership} onValueChange={setOwnership}>
          <SelectTrigger aria-label="Filtrer les cartes par possession"><SelectValue placeholder="Possession" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem><SelectItem value="owned">Possédées</SelectItem>
            <SelectItem value="missing">Manquantes</SelectItem><SelectItem value="duplicates">Doublons</SelectItem>
          </SelectContent>
        </Select>}
        <Select value={rarity} onValueChange={setRarity}>
          <SelectTrigger aria-label="Filtrer par rareté"><SelectValue placeholder="Rareté" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes raretés</SelectItem>
            {visibleRarities.map(r => <SelectItem key={r} value={r}>{getLabel(r)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label="Trier les cartes"><SelectValue placeholder="Tri" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="catalogue">Ordre du catalogue</SelectItem>
            <SelectItem value="rarity">Rareté décroissante</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="copies">Exemplaires décroissants</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className={styles.results}>
        <span>{visible.length} carte{visible.length > 1 ? "s" : ""} affichée{visible.length > 1 ? "s" : ""}</span>
        <Button size="sm" variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
      </div>
      {visible.length === 0
        ? <div className={styles.empty}>Aucune carte ne correspond à ces critères. Modifie les filtres pour poursuivre ta recherche.</div>
        : <div className={styles.grid}>
            {visible.map(card => <button key={card.id} type="button" className={styles.card}
              data-rarity={card.rarity} data-owned={card.owned ? "true" : "false"} data-alternative={card.alternative ? "true" : "false"}
              onClick={() => setSelectedId(card.id)} aria-label={"Voir la fiche de " + card.name}>
              <span className={styles.cardRarity}>{card.alternative ? "Illustration alternative" : getLabel(card.rarity)}</span>
              <span className={styles.art} aria-hidden="true">{card.owned && card.imagePath ? <img src={card.imagePath} alt="" loading="lazy" decoding="async" className={styles.cardImage} /> : "?"}</span>
              <strong>{card.name}</strong>
              {card.numericReference && <span>Réf. carte : <b>{card.numericReference}</b></span>}
              {card.alternative && <span className={styles.altLink}>↳ Variante de sa carte de base</span>}
              {card.sourceReference && <span>Source : {card.sourceReference}</span>}
              <span>{card.owned ? "Exemplaires : " + card.quantity : "Manquante"}</span>
              {card.quantity>1 && <span className={styles.duplicate}>×{card.quantity} exemplaires</span>}
              {card.extraCopies > 0 && <span className={styles.duplicate}>+{card.extraCopies} copie{card.extraCopies > 1 ? "s" : ""} en double</span>}
            </button>)}
          </div>}
    </>}
    {view === "progress" && <div className={styles.goalsView}>
      <h3>Objectifs de collection <span>{completedGoals} / {goals.length} accomplis</span></h3>
      <p>Ces jalons suivent uniquement tes découvertes. Ils ne donnent ni monnaie ni booster supplémentaire.</p>
      <div className={styles.goalGrid}>{goals.map(goal =>
        <div className={styles.goal} key={goal.key} data-achieved={goal.achieved}>
          <strong>{goal.label}</strong>
          <span>{goal.value} / {goal.target} · {goal.achieved ? "Terminé" : "À compléter"}</span>
          <div className={styles.goalTrack} role="progressbar" aria-label={goal.label} aria-valuemin={0}
            aria-valuemax={goal.target} aria-valuenow={goal.value}><i style={{ width: (goal.value / goal.target * 100) + "%" }} /></div>
        </div>)}</div>
    </div>}
    {view === "history" && <div className={styles.history}>
      <h3>Dernières ouvertures</h3>
      <p>Les {data.history.length} dernières ouvertures enregistrées (10 maximum). Le statut « nouvelle carte » d'une ancienne ouverture n'est pas déduit sans inventaire daté.</p>
      {data.history.length === 0
        ? <div className={styles.empty}>Aucun booster ouvert pour le moment.</div>
        : data.history.map((entry, index) => <article key={entry.createdAt + "-" + index} className={styles.historyEntry}>
          <strong>{new Date(entry.createdAt).toLocaleString("fr-FR")}</strong>
          <span>{entry.cards.length} cartes enregistrées</span>
          <div className={styles.historyCards}>{entry.cards.map((id, place) => {
            const card = binder.cards.find(c => c.imagePath === entry.artworks?.[place]) ?? binder.cards.find(c => c.id === id);
            const art = tcgHistoryArtwork(entry.artworks?.[place],card?.imagePath);
            return <div key={place} data-rarity={card?.rarity} className={styles.historyCard}>
              <small>#{place + 1} · {card ? getLabel(card.rarity) : "Rareté inconnue"}</small>
              {art.url && <img src={art.url} alt={"Illustration obtenue : "+(card?.name??"carte")}
                className={styles.historyArt} loading="lazy" decoding="async" />}
              <span>{card?.name ?? "Carte non reconnue"}</span>
              {art.isVariant && <small className={styles.historyVariant}>Illustration alternative</small>}
            </div>;
          })}</div>
        </article>)}
    </div>}
    <Dialog open={Boolean(selected && (view === "collection" || view === "duplicates"))} onOpenChange={open => { if (!open) setSelectedId(null); }}>
      <DialogContent className={styles.detail} onKeyDown={event => {
        if (event.key === "ArrowLeft") { event.preventDefault(); moveCard(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); moveCard(1); }
      }}>
        {selected && <><DialogHeader>
          <DialogTitle>{selected.name}</DialogTitle>
          <DialogDescription>{selected.alternative?"Alternative de sa carte de base · ":getLabel(selected.rarity)+" · "} Carte {selected.index + 1} sur {binder.total}. {selected.numericReference && "Référence : "+selected.numericReference}</DialogDescription>
        </DialogHeader>
        <div className={styles.detailArt} aria-hidden="true">{selected.owned && selected.imagePath ? <img src={selected.imagePath} alt="" className={styles.detailImage} /> : "?"}</div>
        <div className={styles.detailStats}>
          <span>{selected.owned ? "Possédée" : "Manquante"}</span>
          <strong>{selected.quantity} exemplaire{selected.quantity > 1 ? "s" : ""}</strong>
          <span>{selected.extraCopies} en double</span>
        </div>
        {selected.sourceReference && <p>Photo de référence : {selected.sourceReference}. La scène exacte reste à vérifier dans la galerie documentaire.</p>}
        <div className={styles.detailNavigation}>
          <Button ref={previousRef} variant="outline" disabled={selectedIndex <= 0} onClick={() => moveCard(-1)}>← Précédente</Button>
          <span>{selectedIndex + 1} / {visible.length}</span>
          <Button ref={nextRef} variant="outline" disabled={selectedIndex >= visible.length - 1} onClick={() => moveCard(1)}>Suivante →</Button>
        </div></>}
      </DialogContent>
    </Dialog>
  </div>;
}

