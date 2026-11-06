export type Shift = { id: string; date: string; start: string; end: string; holiday: boolean };
export type Direction = 'mil' | 'spirit' | 'sport' | 'work' | 'art' | 'prev' | 'soc';
export const DIRS: { k: Direction; l: string }[] = [
  { k:'mil', l:'Военно-патриотическое' }, { k:'spirit', l:'Духовно-нравственное' }, { k:'sport', l:'Спортивно-оздоровительное' },
  { k:'work', l:'Профессионально-трудовое' }, { k:'art', l:'Эстетическое' }, { k:'prev', l:'Профилактическое' }, { k:'soc', l:'Социально-коммуникативное' }];
export type Ev = { id: string; date: string; title: string; direction: Direction; goal: string; tasks: string; course: string; results: string };
export type Journal = { id: string; date: string; text: string; eventId?: string };
export type Period = 'week' | 'month' | 'quarter' | 'year';
export const PERIODS: { k: Period; l: string }[] = [{ k:'week', l:'Неделя' }, { k:'month', l:'Месяц' }, { k:'quarter', l:'Квартал' }, { k:'year', l:'Год' }];
export type PlanItem = { id: string; text: string; done: boolean; eventId?: string };
export type Plan = { id: string; period: Period; label: string; title: string; items: PlanItem[] };
export type Obs = { id: string; date: string; text: string };
export type Student = { id: string; code: string; note: string; observations: Obs[] };
export type Data = { events: Ev[]; journal: Journal[]; plans: Plan[]; students: Student[]; docs: Doc[]; library: LibItem[]; favs: string[] };
export type Doc = { id: string; kind: string; title: string; from: string; to: string; studentId?: string; created: string; updated: string; text: string };
export type LibFile = { id: string; name: string; size: number };
export type LibItem = { id: string; title: string; direction: Direction; kind: string; keywords: string; goal: string; tasks: string; equipment: string; prep: string; course: string; results: string; files?: LibFile[]; builtin?: boolean };
