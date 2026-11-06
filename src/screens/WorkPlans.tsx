import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { c } from '../theme';
import { uid, useData } from '../DataContext';
import { iso } from '../storage';
import { PERIODS, Plan, Student } from '../types';
import { Btn, Chips, Field, Sheet, cardStyle, confirm, isDate } from './ui';
export function Plans() {
  const { data, update } = useData();
  const [ed, setEd] = useState<(Plan & { lines: string }) | null>(null);
  const [link, setLink] = useState<{ p: string; i: string } | null>(null);
  const patchItem = (pid: string, iid: string, f: (x: Plan['items'][number]) => Plan['items'][number]) =>
    update(d => ({ ...d, plans: d.plans.map(p => (p.id === pid ? { ...p, items: p.items.map(i => (i.id === iid ? f(i) : i)) } : p)) }));
  const save = () => {
    if (!ed) return;
    if (!ed.title.trim()) return Alert.alert('План', 'Введите название плана');
    const { lines, ...plan } = ed; const old = data.plans.find(p => p.id === ed.id)?.items ?? [];
    plan.items = lines.split('\n').map(s => s.trim()).filter(Boolean).map(t => old.find(o => o.text === t) ?? { id: uid(), text: t, done: false });
    update(d => ({ ...d, plans: d.plans.some(p => p.id === plan.id) ? d.plans.map(p => (p.id === plan.id ? plan : p)) : [...d.plans, plan] })); setEd(null);
  };
  const open = (p: Plan) => setEd({ ...p, lines: p.items.map(i => i.text).join('\n') });
  return (<View>
    <Btn t="+ Новый план" onPress={() => setEd({ id: uid(), period:'week', label:'', title:'', items: [], lines:'' })} />
    {data.plans.length === 0 && <Text style={{ color:c.dim, marginTop:16 }}>Планов пока нет.</Text>}
    {data.plans.map(p => <View key={p.id} style={cardStyle}>
      <Text style={{ color:c.text, fontWeight:'600' }}>{p.title}</Text>
      <Text style={{ color:c.dim, marginTop:2 }}>{PERIODS.find(x => x.k === p.period)?.l} · {p.label} · выполнено {p.items.filter(i => i.done).length}/{p.items.length}</Text>
      {p.items.map(i => { const ev = data.events.find(e => e.id === i.eventId); return (
        <View key={i.id} style={{ flexDirection:'row', alignItems:'center', marginTop:8 }}>
          <Pressable onPress={() => patchItem(p.id, i.id, x => ({ ...x, done: !x.done }))}><Text style={{ color:c.accent, fontSize:22 }}>{i.done ? '☑' : '☐'}</Text></Pressable>
          <Text style={{ color: i.done ? c.dim : c.text, flex:1, marginHorizontal:8, textDecorationLine: i.done ? 'line-through' : 'none' }}>{i.text}{ev ? `\n↳ ${ev.title}` : ''}</Text>
          <Pressable onPress={() => setLink({ p: p.id, i: i.id })}><Text style={{ color:c.gold }}>Связать</Text></Pressable></View>); })}
      <Btn t="Изменить план" kind="ghost" onPress={() => open(p)} /></View>)}
    <Sheet visible={!!ed} title="План работы" onClose={() => setEd(null)}>
      {ed && <View>
        <Field label="Название" value={ed.title} onChange={v => setEd({ ...ed, title: v })} />
        <Field label="Период (например: Ноябрь 2026)" value={ed.label} onChange={v => setEd({ ...ed, label: v })} />
        <Chips options={PERIODS} value={ed.period} onChange={k => setEd({ ...ed, period: k })} />
        <Field label="Пункты плана (каждый с новой строки)" value={ed.lines} onChange={v => setEd({ ...ed, lines: v })} multiline />
        <Btn t="Сохранить" onPress={save} />
        {data.plans.some(p => p.id === ed.id) && <Btn t="Удалить план" kind="danger" onPress={() => confirm('Удалить план?', () => { update(d => ({ ...d, plans: d.plans.filter(p => p.id !== ed.id) })); setEd(null); })} />}
      </View>}</Sheet>
    <Sheet visible={!!link} title="Связать с мероприятием" onClose={() => setLink(null)}>
      {data.events.length === 0 && <Text style={{ color:c.dim }}>Сначала добавьте мероприятие.</Text>}
      {link && <Chips options={[{ k:'', l:'Без связи' }, ...data.events.map(e => ({ k: e.id, l: `${e.date} ${e.title}` }))]}
        value={data.plans.find(p => p.id === link.p)?.items.find(i => i.id === link.i)?.eventId ?? ''}
        onChange={k => { patchItem(link.p, link.i, x => ({ ...x, eventId: k || undefined, done: k ? true : x.done })); setLink(null); }} />}
    </Sheet></View>);
}
export function Students() {
  const { data, update } = useData(); const [id, setId] = useState<string | null>(null);
  const [obs, setObs] = useState(''); const [od, setOd] = useState(iso(new Date()));
  const st = data.students.find(s => s.id === id);
  const patch = (f: (s: Student) => Student) => update(d => ({ ...d, students: d.students.map(s => (s.id === id ? f(s) : s)) }));
  const add = () => {
    if (!obs.trim()) return Alert.alert('Наблюдение', 'Введите текст');
    if (!isDate(od)) return Alert.alert('Дата', 'Формат ГГГГ-ММ-ДД');
    patch(s => ({ ...s, observations: [{ id: uid(), date: od, text: obs.trim() }, ...s.observations] })); setObs('');
  };
  return (<View>
    <Text style={{ color:c.gold, marginTop:10 }}>Используйте условные обозначения, не вносите реальные ФИО и данные.</Text>
    <Btn t="+ Новая карточка" onPress={() => { const n = uid(); update(d => ({ ...d, students: [...d.students, { id: n, code: 'Воспитанник', note: '', observations: [] }] })); setId(n); }} />
    {data.students.map(s => <Pressable key={s.id} onPress={() => setId(s.id)} style={cardStyle}>
      <Text style={{ color:c.text, fontWeight:'600' }}>{s.code}</Text><Text style={{ color:c.dim }}>Наблюдений: {s.observations.length}</Text></Pressable>)}
    <Sheet visible={!!st} title="Карточка" onClose={() => setId(null)}>
      {st && <View>
        <Field label="Обозначение" value={st.code} onChange={v => patch(s => ({ ...s, code: v }))} />
        <Field label="Заметка" value={st.note} onChange={v => patch(s => ({ ...s, note: v }))} multiline />
        <Text style={{ color:c.text, fontWeight:'700', marginTop:18 }}>Педагогические наблюдения</Text>
        <Field label="Дата (ГГГГ-ММ-ДД)" value={od} onChange={setOd} />
        <Field label="Наблюдение" value={obs} onChange={setObs} multiline />
        <Btn t="Добавить наблюдение" onPress={add} />
        {st.observations.map(o => <View key={o.id} style={cardStyle}><Text style={{ color:c.dim }}>{o.date}</Text><Text style={{ color:c.text, marginTop:4 }}>{o.text}</Text>
          <Pressable onPress={() => confirm('Удалить наблюдение?', () => patch(s => ({ ...s, observations: s.observations.filter(x => x.id !== o.id) })))}><Text style={{ color:c.danger, marginTop:6 }}>Удалить</Text></Pressable></View>)}
        <Btn t="Удалить карточку" kind="danger" onPress={() => confirm('Удалить карточку?', () => { update(d => ({ ...d, students: d.students.filter(s => s.id !== st.id) })); setId(null); })} />
      </View>}</Sheet></View>);
}
