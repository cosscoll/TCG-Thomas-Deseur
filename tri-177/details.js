/** Ajoute la provenance aux 177 photos originales sans modifier les choix du tri.
 * Les noms sont descriptifs et provisoires. Les liens pointent vers les
 * sources documentaires fournies dans l'inventaire, pas vers une origine
 * d'épisode ou une date de tournage supposée.
 */
import {PHOTO_ORIGINS_177} from "../data/photo-origins-177.js";
const labels={
 "images/100-1000-couches":"Costumes — vidéos 100 et 1000 couches",
 "images/serie-100-couches":"Costumes — série 100 couches",
 "images/personnages-thomas":"Personnages Thomas Deseur",
 "images/Braderie-de-Lille-2026":"Braderie de Lille — affiche officielle"
};
const all=[...document.querySelectorAll(".group .photo")];
for(const photo of all){
 const reference=photo.querySelector("strong")?.textContent?.trim();
 const meta=PHOTO_ORIGINS_177[reference];
 if(!meta)continue;
 const wrap=document.createElement("div");
 wrap.className="photo-provenance";
 const title=document.createElement("span");
 title.className="photo-origin-title";
 title.textContent="D'où vient cette photo ?";
 const from=document.createElement("span");
 from.className="photo-origin-name";
 from.textContent=labels[meta.series]??meta.origin;
 const file=document.createElement("small");
 file.textContent="Archive originale : "+meta.originalFile;
 wrap.append(title,from,file);
 if(meta.originUrl){
   const source=document.createElement("a");
   source.href=meta.originUrl;
   source.target="_blank";
   source.rel="noopener noreferrer";
   source.textContent="Consulter la source ↗";
   source.setAttribute("aria-label","Voir la source de "+reference);
   wrap.append(source);
 }
 photo.append(wrap);
}
document.querySelector("#originInfo")?.replaceChildren(
 document.createTextNode("Origine documentée sur "+all.filter(p=>PHOTO_ORIGINS_177[p.querySelector("strong")?.textContent?.trim()]).length+" photos")
);
