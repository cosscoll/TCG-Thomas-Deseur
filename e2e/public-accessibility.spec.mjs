import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages=[
 {path:'/',ready:'h1'},
 {path:'/collection-validee/',ready:'article.card[data-group]'},
 {path:'/audit-visuels/',ready:'#count'},
 {path:'/planches/',ready:'#status'},
 {path:'/avancement/',ready:'#total'},
 {path:'/beta/',ready:'#feedback-form'},
 {path:'/kit-visuels/',ready:'#preview'},
 {path:'/prototype-booster/',ready:'#start'},
];
for(const target of pages){
 test('WCAG A/AA sur la page publique '+target.path,async({page},info)=>{
  test.skip(info.project.name!=='desktop-chromium','Un navigateur dédié à axe suffit');
  await page.goto(target.path);
  await expect(page.locator(target.ready).first()).toBeVisible();
  const report=await new AxeBuilder({page})
    .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])
    .analyze();
  const problems=report.violations.map(v=>({
   rule:v.id,impact:v.impact,
   nodes:v.nodes.slice(0,4).map(x=>x.target.join(' '))
  }));
  expect(problems,'Problèmes WCAG A/AA sur '+target.path).toEqual([]);
 });
}
test('parcours clavier et liens de saut des pages de catalogue et revue',async({page},info)=>{
 test.skip(info.project.name!=='desktop-chromium');
 for(const target of [
  {path:'/collection-validee/',skip:true},
  {path:'/audit-visuels/',skip:true},
  {path:'/beta/',skip:true}
 ]){
  await page.goto(target.path);
  await page.keyboard.press('Tab');
  const node=await page.evaluate(()=>({
   tag:document.activeElement?.tagName,
   text:document.activeElement?.textContent?.trim()?.slice(0,100),
   href:document.activeElement?.getAttribute('href')
  }));
  expect(node.tag,'Premier contrôle clavier '+target.path).toBe('A');
  expect(node.href).toMatch(/^#/);
 }
});
