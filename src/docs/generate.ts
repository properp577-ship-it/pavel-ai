import { DIRS, Data } from '../types';
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export type Kind = 'raport' | 'week' | 'month' | 'quarter' | 'year' | 'char' | 'iplan' | 'eplan' | 'analyt' | 'memo';
export const CATS = ['Рапорты', 'Отчёты', 'Характеристики и планы', 'Справки и записки'];
export const KINDS: { k: Kind; l: string; cat: string; st?: boolean }[] = [
  { k:'raport', l:'Рапорт группы', cat:CATS[0] },
  { k:'week', l:'Отчёт за неделю', cat:CATS[1] }, { k:'month', l:'Отчёт за месяц', cat:CATS[1] },
  { k:'quarter', l:'Квартальный отчёт', cat:CATS[1] }, { k:'year', l:'Годовой отчёт', cat:CATS[1] },
  { k:'char', l:'Характеристика воспитанника', cat:CATS[2], st:true }, { k:'iplan', l:'Индивидуальный план работы', cat:CATS[2], st:true },
  { k:'eplan', l:'План воспитательных мероприятий', cat:CATS[2] },
  { k:'analyt', l:'Аналитическая справка', cat:CATS[3] }, { k:'memo', l:'Служебная записка', cat:CATS[3] }];
export const D = (s: string) => s.split('-').reverse().join('.');
export function presets() {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth(), dow = (n.getDay() + 6) % 7, q = Math.floor(m / 3) * 3;
  const r = (l: string, a: Date, b: Date) => ({ l, from: iso(a), to: iso(b) });
  return [r('Эта неделя', new Date(y, m, n.getDate() - dow), new Date(y, m, n.getDate() - dow + 6)),
    r('Этот месяц', new Date(y, m, 1), new Date(y, m + 1, 0)), r('Прошлый месяц', new Date(y, m - 1, 1), new Date(y, m, 0)),
    r('Квартал', new Date(y, q, 1), new Date(y, q + 3, 0)), r('Год', new Date(y, 0, 1), new Date(y, 11, 31))];
}
export function generate(kind: Kind, from: string, to: string, data: Data, sid?: string): string {
  const dn = (k: string) => DIRS.find(x => x.k === k)?.l ?? k;
  const by = (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date);
  const evs = data.events.filter(e => e.date >= from && e.date <= to).sort(by);
  const jr = data.journal.filter(j => j.date >= from && j.date <= to).sort(by);
  const per = `${D(from)} – ${D(to)}`;
  const st = data.students.find(s => s.id === sid);
  const obs = (st?.observations ?? []).filter(o => o.date >= from && o.date <= to).sort(by);
  const miss: string[] = [];
  if (!evs.length) miss.push('мероприятия за период не внесены');
  if (!jr.length) miss.push('записи журнала за период отсутствуют');
  const noRes = evs.filter(e => !e.results.trim()), noGoal = evs.filter(e => !e.goal.trim());
  if (noRes.length) miss.push(`не указаны результаты мероприятий: ${noRes.map(e => `«${e.title}»`).join(', ')}`);
  if (noGoal.length) miss.push(`не указана цель мероприятий: ${noGoal.map(e => `«${e.title}»`).join(', ')}`);
  const cell = (s: string) => s.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '/');
  const table = (rows: string[][]) => rows.map(r => `| ${r.map(cell).join(' | ')} |`);
  const evTable = () => table([['Дата', 'Мероприятие', 'Направление', 'Цель'], ...evs.map(e => [D(e.date), e.title, dn(e.direction), e.goal || 'не указана'])]);
  const dirs = DIRS.map(d => ({ l: d.l, n: evs.filter(e => e.direction === d.k).length }));
  const dirLines = evs.length ? dirs.filter(d => d.n).map(d => `- ${d.l}: мероприятий — ${d.n}`) : ['Сведения отсутствуют.'];
  const jrLines = jr.length ? jr.map(j => `- ${D(j.date)}: ${j.text}`) : ['Записи отсутствуют.'];
  const res = evs.filter(e => e.results.trim()).map(e => `- ${D(e.date)}, «${e.title}»: ${e.results.trim()}`);
  const done = data.plans.flatMap(p => p.items.filter(i => i.done && evs.some(e => e.id === i.eventId))
    .map(i => `- ${p.title}: «${i.text}» — выполнено (мероприятие «${evs.find(e => e.id === i.eventId)!.title}»)`));
  const L: string[] = [];
  const titles: Record<string, string> = { week:'неделю', month:'месяц', quarter:'квартал', year:'год' };
  if (kind === 'raport') L.push('# РАПОРТ', `о работе группы за период ${per}`, `Докладываю, что за указанный период проведено мероприятий: ${evs.length}; внесено записей о проделанной работе: ${jr.length}.`,
    '## Проведённые мероприятия', ...(evs.length ? evTable() : ['Сведения отсутствуют.']), '## Проделанная работа', ...jrLines);
  else if (titles[kind]) L.push('# ОТЧЁТ', `о проделанной воспитательной работе за ${titles[kind]} (${per})`, '## 1. Общие сведения',
    `За отчётный период проведено мероприятий: ${evs.length}; внесено записей о проделанной работе: ${jr.length}.`,
    '## 2. Проведённые мероприятия', ...(evs.length ? evTable() : ['Сведения отсутствуют.']), '## 3. Работа по направлениям воспитания', ...dirLines,
    '## 4. Ход работы', ...jrLines, '## 5. Результаты', ...(res.length ? res : ['Сведения о результатах не внесены.']),
    '## 6. Выполнение планов', ...(done.length ? done : ['Выполненные пункты планов, связанные с мероприятиями периода, отсутствуют.']));
  else if (kind === 'char' || kind === 'iplan') {
    const c = kind === 'char';
    if (!st) miss.push('не выбран воспитанник'); if (!obs.length) miss.push('педагогические наблюдения за период отсутствуют');
    L.push(c ? '# ХАРАКТЕРИСТИКА' : '# ИНДИВИДУАЛЬНЫЙ ПЛАН ВОСПИТАТЕЛЬНОЙ РАБОТЫ', `на воспитанника: ${st?.code ?? '[не выбран]'}`, `Период: ${per}`,
      '## 1. Общие сведения', '[Дополните: возраст, срок пребывания, иные сведения — в приложении не хранятся.]',
      c ? '## 2. Педагогические наблюдения' : '## 2. Исходное состояние (по наблюдениям)', ...(obs.length ? obs.map(o => `- ${D(o.date)}: ${o.text}`) : ['Сведения отсутствуют.']),
      ...(c ? ['## 3. Участие в мероприятиях', 'Сведения об участии воспитанника в мероприятиях в приложении не фиксируются. [Дополните.]', '## 4. Выводы и рекомендации', '[Дополните.]']
        : ['## 3. Цель работы', '[Дополните.]', '## 4. Задачи и мероприятия', '[Дополните.]', '## 5. Ожидаемые результаты', '[Дополните.]']));
  } else if (kind === 'eplan') {
    const open = data.plans.flatMap(p => p.items.filter(i => !i.done && !i.eventId).map(i => `- ${p.title} (${p.label}): ${i.text}`));
    L.push('# ПЛАН ВОСПИТАТЕЛЬНЫХ МЕРОПРИЯТИЙ', `на период ${per}`, '## Мероприятия', ...(evs.length ? evTable() : ['Мероприятия за период не внесены.']),
      '## Пункты планов, не выполненные и не связанные с мероприятием', ...(open.length ? open : ['Отсутствуют.']));
  } else if (kind === 'analyt') {
    const all = data.plans.flatMap(p => p.items);
    const months = [...new Set(evs.map(e => e.date.slice(0, 7)))].map(m => [m.split('-').reverse().join('.'), String(evs.filter(e => e.date.startsWith(m)).length)]);
    const gaps = dirs.filter(d => !d.n).map(d => d.l);
    L.push('# АНАЛИТИЧЕСКАЯ СПРАВКА', `о воспитательной работе за период ${per}`, '## 1. Количественные показатели',
      `Проведено мероприятий: ${evs.length}. Внесено записей журнала: ${jr.length}.`, `Пунктов планов всего: ${all.length}, выполнено: ${all.filter(i => i.done).length}.`,
      '## 2. Распределение по направлениям', ...table([['Направление', 'Мероприятий'], ...dirs.map(d => [d.l, String(d.n)])]),
      '## 3. Динамика по месяцам', ...(months.length ? table([['Месяц', 'Мероприятий'], ...months]) : ['Сведения отсутствуют.']),
      '## 4. Направления без мероприятий за период', ...(evs.length ? (gaps.length ? gaps.map(g => `- ${g}`) : ['Все направления охвачены.']) : ['Сведения отсутствуют.']),
      '## 5. Выводы', '[Дополните выводы и предложения.]');
  } else L.push('# СЛУЖЕБНАЯ ЗАПИСКА', 'Начальнику [наименование учреждения]', 'от воспитателя [ФИО]', 'Тема: [укажите тему]',
    `Довожу до Вашего сведения, что за период ${per} проведено мероприятий: ${evs.length}; внесено записей о проделанной работе: ${jr.length}.`,
    ...evs.map(e => `- ${D(e.date)}: ${e.title}`), 'Прошу: [дополните].');
  if (miss.length) L.push('## Сведения, требующие дополнения (удалите раздел после заполнения)', ...miss.map(m => `- ${m}`));
  L.push('Воспитатель  ______________ / ______________ /', `Дата составления: ${D(iso(new Date()))}`);
  return L.join('\n');
}
