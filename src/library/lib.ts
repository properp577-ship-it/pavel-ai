import { DIRS, Ev, LibItem } from '../types';
export const LKINDS = ['Классный час', 'Беседа', 'Дискуссия', 'Викторина', 'Спортивное', 'Патриотическое', 'Практикум'];
export const dirLabel = (k: string) => DIRS.find(d => d.k === k)?.l ?? k;
export type Scope = 'all' | 'fav' | 'mine';
export function search(items: LibItem[], q: string, favs: string[], scope: Scope, dir: string, kind: string) {
  const w = q.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(i => (scope === 'all' || (scope === 'fav' ? favs.includes(i.id) : !i.builtin)) && (!dir || i.direction === dir) && (!kind || i.kind === kind)
    && w.every(x => [i.title, i.keywords, i.goal, i.tasks, i.kind, dirLabel(i.direction), i.course].join(' ').toLowerCase().includes(x)));
}
export function toText(i: LibItem) {
  const s = (h: string, t: string) => (t.trim() ? [`## ${h}`, ...t.split('\n').filter(l => l.trim())] : []);
  return [`# ${i.title}`, `Направление: ${dirLabel(i.direction)}. Тип: ${i.kind}.`, ...s('Цель', i.goal), ...s('Задачи', i.tasks), ...s('Оборудование', i.equipment),
    ...s('Подготовка', i.prep), ...s('Ход мероприятия', i.course), ...s('Ожидаемые результаты', i.results)].join('\n');
}
// Ожидаемые результаты переносятся в «ход» с пометкой «план»: фактические результаты вносятся только после проведения.
export function toEvent(i: LibItem, date: string, id: string): Ev {
  const course = [i.prep.trim() && `Подготовка:\n${i.prep}`, i.equipment.trim() && `Оборудование: ${i.equipment}`, i.course.trim() && `Ход:\n${i.course}`,
    i.results.trim() && `Ожидаемые результаты (по плану, не фактические):\n${i.results}`].filter(Boolean).join('\n\n');
  return { id, date, title: i.title, direction: i.direction, goal: i.goal, tasks: i.tasks, course, results: '' };
}
