/** Galerie de sélection des illustrations réellement présentes dans le classeur.
 * Associe chaque rendu stylisé au bon original, sans se fier à l'ancienne référence
 * portée par la carte. Les photos sources restent consultables, jamais sélectionnables.
 * Les 160 illustrations publiques sont les SEULES images de carte affichées ici.
 */
import {CARD_PHOTO_PAIRS_160} from '../data/correspondances-photo-illustration.js';

const galleryByGroup=new Map();
for(const pair of CARD_PHOTO_PAIRS_160){
  const list=galleryByGroup.get(pair.groupId)||[];
  list.push(pair);
  galleryByGroup.set(pair.groupId,list);
}
const make=(tag,className,text)=>{
 const e=document.createElement(tag);
 if(className)e.className=className;
 if(text!==undefined)e.textContent=text;
 return e;
};
for(const group of document.querySelectorAll('.group')){
 const originalPhotos=group.querySelector('.photos');
 const sourceCount=originalPhotos.querySelectorAll('.photo').length;
 const pairs=galleryByGroup.get(group.id)||[];
 const heading=group.querySelector('.heading small');
 heading.textContent=pairs.length+' illustration(s) stylisée(s) disponible(s) · '+sourceCount+' photo(s) originale(s)';
 const originals=make('details','originals-details');
 const summary=make('summary','','Voir les '+sourceCount+' photographies d’origine (références / comparaison)');
 originals.append(summary);
 // The original source gallery is kept as supporting evidence, but collapsed.
 originalPhotos.remove();
 originals.append(originalPhotos);
 originalPhotos.classList.add('source-photos');
 const arts=make('div','photos artwork-photos');
 for(const pair of pairs){
   const card=make('div','photo artwork-photo');
   card.dataset.sourceRef=pair.sourceReference;
   card.dataset.cardId=pair.id;
   const imagePath='../collection-161/assets/cards/'+encodeURIComponent(pair.illustration);
   const link=make('a');link.href=imagePath;link.target='_blank';
   link.rel='noopener noreferrer';
   const image=make('img');image.src=imagePath;
   image.alt='Illustration stylisée '+pair.id+', basée sur '+pair.sourceReference;
   image.loading='lazy';image.decoding='async';
   image.addEventListener('error',()=>{
     card.classList.add('artwork-unavailable');
     const status=make('small','artwork-error','Fichier de rendu inaccessible — vérifier sa publication.');
     if(!card.querySelector('.artwork-error'))card.append(status);
   });
   link.append(image);
   card.append(link,make('strong','',pair.id),make('span','','Illustration stylisée déjà utilisée dans le classeur'),make('small','','Source corrigée : '+pair.sourceReference));
   arts.append(card);
 }
 if(pairs.length===0){
   arts.append(make('p','no-artworks','Aucune illustration stylisée n’existe actuellement pour ce costume. Les photos originales sont consultables ci-dessous, mais ne peuvent pas être sélectionnées comme cartes.'));
 }
 const editor=group.querySelector('.review');
 group.insertBefore(arts,editor);
 editor.after(originals);
 group.dataset.artworkCount=String(pairs.length);
 group.dataset.search+=' '+pairs.map(p=>p.id+' '+p.illustration+' '+p.sourceReference).join(' ').toLocaleLowerCase('fr');
}
await import('./editor.js');
