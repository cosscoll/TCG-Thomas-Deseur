import test from 'node:test';
import assert from 'node:assert/strict';
import {luminance,ratio,assess,markdown} from '../scripts/check-contrast-static.mjs';
test('WCAG contrast formula known black/white',()=>{
 assert.ok(Math.abs(ratio('#000000','#ffffff')-21)<1e-7);
 assert.equal(ratio('#111111','#111111'),1);
 assert.throws(()=>luminance('#fff'));
});
test('12 documented public text/background pairs meet AA normal text',()=>{
 const result=assess();
 assert.equal(result.length,12);
 assert.ok(result.every(x=>x.aa==='passe'),JSON.stringify(result.filter(x=>x.aa!=='passe')));
 assert.ok(Math.min(...result.map(x=>x.ratio))>4.5);
 assert.match(markdown(result),/contrastes/);
});