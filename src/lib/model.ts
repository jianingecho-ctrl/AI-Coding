import { z } from 'zod';

export const categories = ['领导', '喜欢的同事', '普通同事', '讨厌的人', '特别讨厌的人'] as const;
export type Category = typeof categories[number];
export const actionIds = ['salute', 'happy', 'wave', 'fish', 'yawn', 'kneel', 'panic'] as const;
export const entryIds = ['slide', 'bounce', 'spin', 'fade'] as const;
export const characterSkinIds = ['desert', 'milktea', 'neon', 'judge'] as const;
export const cardSkinIds = ['note', 'verdict', 'chat', 'alarm'] as const;
export const gagIds = ['none', 'paper', 'fish', 'hearts', 'overload'] as const;
export type Action = typeof actionIds[number];
export type CharacterSkin = typeof characterSkinIds[number];
export const personalEffectSchema = z.object({
  action: z.enum(['auto', ...actionIds]).default('auto'),
  entry: z.enum(['auto', ...entryIds]).default('auto'),
  characterSkin: z.enum(['auto', ...characterSkinIds]).default('auto'),
  cardSkin: z.enum(['auto', ...cardSkinIds]).default('auto'),
  gag: z.enum(['auto', ...gagIds]).default('auto'),
  line: z.string().trim().max(60).default(''),
});
export type PersonalEffect = z.infer<typeof personalEffectSchema>;
export const resolvedEffectSchema = z.object({
  action: z.enum(actionIds), entry: z.enum(entryIds),
  characterSkin: z.enum(characterSkinIds), cardSkin: z.enum(cardSkinIds),
  gag: z.enum(gagIds), line: z.string().max(60),
});
export type ResolvedEffect = z.infer<typeof resolvedEffectSchema>;
export const contactSchema = z.object({
  id: z.string().min(1).max(100), name: z.string().trim().min(1).max(40),
  category: z.enum(categories), effects: personalEffectSchema.optional(),
});
export type Contact = z.infer<typeof contactSchema>;
export const summarySchema = z.object({
  core: z.string().max(500), todos: z.array(z.string().max(500)).max(20),
  deadline: z.string().max(200), reply: z.string().max(200),
  source: z.enum(['本地规则摘要', '本地 AI 摘要']), warning: z.string().optional(),
});
export type Summary = z.infer<typeof summarySchema>;
export const messageSchema = z.object({
  id: z.string(), contact: contactSchema, text: z.string().min(1).max(5000),
  createdAt: z.string(), summary: summarySchema,
  // 接收时效果快照；旧版历史没有这个字段也能读取。
  effect: resolvedEffectSchema.optional(), preview: z.boolean().optional(),
});
export type Message = z.infer<typeof messageSchema>;
export const aiSchema = z.object({
  enabled: z.boolean(), model: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_.:/-]+$/),
});
export const stateSchema = z.object({
  contacts: z.array(contactSchema).max(100), history: z.array(messageSchema).max(200),
  pet: z.object({
    name: z.string().trim().min(1).max(20), color: z.enum(['薄荷绿', '蜜桃粉', '奶油黄']),
    skin: z.enum(characterSkinIds).default('desert'),
  }),
  ai: aiSchema.default({enabled: false, model: 'qwen2.5:3b'}),
});
export type State = z.infer<typeof stateSchema>;
export const defaultState: State = {
  contacts: [
    {id: 'boss', name: '王经理', category: '领导'},
    {id: 'friend', name: '小林', category: '喜欢的同事'},
    {id: 'colleague', name: '陈同事', category: '普通同事'},
    {id: 'annoying', name: '甩锅达人', category: '讨厌的人'},
    {id: 'nemesis', name: '终极甩锅王', category: '特别讨厌的人'},
  ],
  history: [], pet: {name: '小判官', color: '薄荷绿', skin: 'desert'},
  ai: {enabled: false, model: 'qwen2.5:3b'},
};
export interface Bridge {
  getState(): Promise<State>;
  saveSettings(settings: Pick<State, 'contacts' | 'pet'> & {ai?: State['ai']}): Promise<State>;
  sendMessage(input: {contactId: string; text: string}): Promise<Message>;
  previewContact(contact: Contact): Promise<Message>;
  clearHistory(): Promise<State>;
  openPanel(): Promise<void>;
  quit(): Promise<void>;
  onState(callback: (state: State) => void): () => void;
  onMessage(callback: (message: Message) => void): () => void;
}
