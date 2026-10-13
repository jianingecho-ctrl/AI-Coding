import { personalEffectSchema, type Action, type Category, type Contact, type Message, type ResolvedEffect, type State } from './model';

export const actionLabels = {salute: '立正敬礼', happy: '开心蹦跶', wave: '佛系招手', fish: '继续摸鱼', yawn: '困到打哈欠', kneel: '滑跪举牌', panic: '崩溃滑跪'} as const;
export const entryLabels = {slide: '从边缘滑入', bounce: '弹跳出场', spin: '转圈出场', fade: '悄悄出现'} as const;
export const gagLabels = {none: '不加特效', paper: '工单暴雨', fish: '摸鱼小鱼', hearts: '爱心撒花', overload: '驼峰过载'} as const;
export const characterSkins = [
  {id: 'desert', name: '沙漠社畜', description: '护目镜、连帽衫，今天也要元气上班。'},
  {id: 'milktea', name: '奶茶摸鱼', description: '奶茶续命，带薪发呆。'},
  {id: 'neon', name: '霓虹加班', description: '耳机一戴，工位之外与我无关。'},
  {id: 'judge', name: '赛博判官', description: '小眼镜、判官服，职场是非我来判。'},
] as const;
export const cardSkins = [
  {id: 'note', name: '摸鱼便签'}, {id: 'verdict', name: '职场判决书'},
  {id: 'chat', name: '心动气泡'}, {id: 'alarm', name: '驼峰过载警报'},
] as const;
const defaults: Record<Category, Omit<ResolvedEffect, 'characterSkin'>> = {
  '领导': {action: 'salute', entry: 'fade', cardSkin: 'verdict', gag: 'paper', line: '领导一声响，驼峰也站岗。'},
  '喜欢的同事': {action: 'happy', entry: 'bounce', cardSkin: 'chat', gag: 'hearts', line: '是你呀！驼峰都开心得冒泡。'},
  '普通同事': {action: 'wave', entry: 'fade', cardSkin: 'note', gag: 'fish', line: '工位驼上线，收到先点头。'},
  '讨厌的人': {action: 'kneel', entry: 'slide', cardSkin: 'verdict', gag: 'paper', line: '这消息有点沉，先跪为敬。'},
  '特别讨厌的人': {action: 'panic', entry: 'slide', cardSkin: 'alarm', gag: 'overload', line: '驼峰已过载，滑跪申请工伤。'},
};
export function isKneeling(action: string) { return action === 'kneel' || action === 'panic'; }
export function hasPersonalEffects(contact: Contact) {
  return Boolean(contact.effects && Object.entries(contact.effects).some(([key,value]) => key === 'line' ? Boolean(value.trim()) : value !== 'auto'));
}
export function isDisliked(category: Category) { return category === '讨厌的人' || category === '特别讨厌的人'; }
export function allowedActions(category: Category): Action[] {
  return isDisliked(category) ? ['kneel', 'panic'] : ['salute', 'happy', 'wave', 'fish', 'yawn', 'kneel', 'panic'];
}
export function resolveEffects(contact: Contact, pet?: State['pet']): ResolvedEffect {
  const base = defaults[contact.category];
  const custom = contact.effects ?? personalEffectSchema.parse({});
  let action = custom.action === 'auto' ? base.action : custom.action;
  // 保留滑跪约定，允许两种跪姿和个性皮肤，不被非法配置绕过。
  if (isDisliked(contact.category) && !isKneeling(action)) action = base.action;
  return {
    action,
    entry: isKneeling(action) ? 'slide' : custom.entry === 'auto' ? base.entry : custom.entry,
    characterSkin: custom.characterSkin === 'auto' ? pet?.skin ?? 'desert' : custom.characterSkin,
    cardSkin: custom.cardSkin === 'auto' ? base.cardSkin : custom.cardSkin,
    gag: custom.gag === 'auto' ? base.gag : custom.gag,
    line: custom.line || base.line,
  };
}
export function messageEffects(message: Message) { return message.effect ?? resolveEffects(message.contact); }
