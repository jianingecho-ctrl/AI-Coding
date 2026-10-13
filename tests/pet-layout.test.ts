import {it,expect} from 'vitest';
import {petWindowSize,resizedPetBounds} from '../src/lib/pet-layout';
it('默认待机窗口缩小，显示消息时展开而不改变人物缩放',()=>{
 expect(petWindowSize(.6,false)).toEqual({width:260,height:290});expect(petWindowSize(.6,true)).toEqual({width:420,height:582});expect(petWindowSize(.45,false).height).toBeLessThan(petWindowSize(1,false).height);
});
it('展开与收起保持底部及中心位置，避免拖动位置被重置',()=>{
 const area={x:0,y:0,width:1600,height:1000},idle={x:600,y:680,...petWindowSize(.6,false)},expanded=resizedPetBounds(idle,area,.6,true),restored=resizedPetBounds(expanded,area,.6,false);
 expect(expanded.x+expanded.width/2).toBe(idle.x+idle.width/2);expect(expanded.y+expanded.height).toBe(idle.y+idle.height);expect(restored).toEqual(idle);
});
it('小屏幕与负坐标显示器上不超出可用区域',()=>{
 const area={x:-700,y:30,width:320,height:500},bounds=resizedPetBounds({x:-100,y:900,width:260,height:290},area,1,true);
 expect(bounds.x).toBeGreaterThanOrEqual(area.x);expect(bounds.y).toBeGreaterThanOrEqual(area.y);expect(bounds.x+bounds.width).toBeLessThanOrEqual(area.x+area.width);expect(bounds.y+bounds.height).toBeLessThanOrEqual(area.y+area.height);
});
