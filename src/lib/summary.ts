import type { Summary } from './model';
// 确定性的离线提取器；不把模拟消息发送到外部服务。
export function summarize(text:string): Summary {
  const normalized=text.trim().replace(/\r\n/g,'\n');
  const sentences=normalized.split(/[。！!；;\n]+/).map(s=>s.trim()).filter(Boolean);
  const action=/(请|麻烦|需要|记得|帮忙|务必|完成|提交|整理|更新|确认|发送|发给|准备|跟进|安排|处理)/;
  const todos=sentences.filter(s=>action.test(s)&&!/(无需|不用|不必).{0,4}(回复|处理|跟进)/.test(s)).slice(0,8);
  const deadlinePattern=/(?:\d{4}[-年/.])?\d{1,2}[-月/.]\d{1,2}日?(?:\s*\d{1,2}(?::\d{2}|点(?:半|\d{1,2}分)?))?(?:前|之前)?|(?:今天|今日|明天|明日|后天|本周|下周|周[一二三四五六日天]|星期[一二三四五六日天])(?:[一二三四五六日天])?(?:上午|下午|晚上|中午|下班)?(?:\s*\d{1,2}(?::\d{2}|点(?:半|\d{1,2}分)?))?(?:前|之前|内)?|\d{1,2}(?::\d{2}|点(?:半|\d{1,2}分)?)(?:前|之前)|\d+[小时天]+内/g;
  const dates=[...new Set(normalized.match(deadlinePattern)||[])];
  const noReply=/(不用|无需|不必).{0,4}回复/.test(normalized);
  const mustReply=/(请|麻烦|需要|记得|务必).{0,12}(回复|答复|确认)|收到.{0,6}(回复|回一下)|[？?]/.test(normalized);
  return {core:sentences.slice(0,2).join('；').slice(0,180)||normalized.slice(0,180),todos,deadline:dates.length?dates.join('、'):'未明确，请核对原消息',reply:noReply?'无需回复（原文明确）':mustReply?'需要回复或确认':'未明确，建议核对',source:'本地规则摘要'};
}
