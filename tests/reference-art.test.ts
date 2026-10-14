import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {personaIds,palaceIds} from '../src/lib/model';
import {referenceAnimation,referenceArt} from '../src/lib/reference-art';
const edition=JSON.parse(readFileSync('edition.json','utf8')).id;
it.each(edition==='palace'?palaceIds:personaIds)('%s 加载本地素材且完整适配显示区域',id=>{
 const animation=referenceAnimation(id,'./'),asset=animation.assets[0];
 expect(asset.u).toBe('./'+(id==='leader'?'references/':'characters/'));
 const [width,height]=referenceArt[id].size,[x,y,bw,bh]=referenceArt[id].bounds;
 expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(x+bw).toBeLessThanOrEqual(width);expect(y+bh).toBeLessThanOrEqual(height);
 const scale=animation.layers[0].ks.s.k[0]/100;expect(bw*scale).toBeLessThanOrEqual(276.01);expect(bh*scale).toBeLessThanOrEqual(330.01);
 if(id!=='leader'){
  const file=readFileSync('public/characters/'+asset.p);expect(file.subarray(1,4).toString()).toBe('PNG');expect(file.readUInt32BE(16)).toBe(width);expect(file.readUInt32BE(20)).toBe(height);expect(file[25]).toBe(6);
  expect(animation.layers[0].masksProperties).toBeUndefined();
 }else{expect(animation.layers[0].masksProperties?.[0].pt.k.v.length).toBeGreaterThan(200);}
});
