import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { c } from '../theme';
import { uid, useData } from '../DataContext';
import { iso } from '../storage';
import { DIRS, Ev, Journal } from '../types';
import { Btn, Chips, Field, Sheet, cardStyle, confirm, isDate } from './ui';
export function Events() {
  const { data, update } = useData(); const [ed, setEd] = useState<Ev | null>(null);
  const blank = (): Ev => ({ id: uid(), date: iso(new Date()), title:'', direction: DIRS[0].k, goal:'', tasks:'', course:'', results:'' });
  const list = [...data.events].sort((a, b) => b.date.localeCompare(a.date));
  const set = (k: keyof Ev) => (v: string) => setEd(e => (e ? ({ ...e, [k]: v } as Ev) : e));
  const save = () => {
    if (!ed) return;
    if (!ed.title.trim()) return Alert.alert('Название', 'Введите название мероприятия');
    if (!isDate(ed.date)) return Alert.alert('Дата', 'Формат ГГГГ-ММ-ДД, например 2026-11-04');
    update(d => ({ ...d, events: d.events.some(e => e.id === ed.id) ? d.events.map(e => (e.id === ed.id ? ed : e)) : [...d.events, ed] })); setEd(null);
  };
  const del = () => ed && confirm('Удалить мероприятие?', () => { const id = ed.id;
    update(d => ({ ...d, events: d.events.filter(e => e.id !== id),
      journal: d.journal.map(j => (j.eventId === id ? { ...j, eventId: undefined } : j)),
      plans: d.plans.map(p => ({ ...p, items: p.items.map(i => (i.eventId === id ? { ...i, eventId: undefined } : i)) })) })); setEd(null); });
  return (<View>
    <Btn t="+ Новое мероприятие" onPress={() => setEd(blank())} />
    {list.length === 0 && <Text style={{ color:c.dim, marginTop:16 }}>Пока нет мероприятий.</Text>}
    {list.map(e => <Pressable key={e.id} onPress={() => setEd(e)} style={cardStyle}>
      <Text style={{ color:c.text, fontWeight:'600' }}>{e.title}</Text>
      <Text style={{ color:c.dim, marginTop:4 }}>{e.date} · {DIRS.find(x => x.k === e.direction)?.l}</Text></Pressable>)}
    <Sheet visible={!!ed} title={ed && data.events.some(e => e.id === ed.id) ? 'Мероприятие' : 'Новое мероприятие'} onClose={() => setEd(null)}>
      {ed && <View>
        <Field label="Название" value={ed.title} onChange={set('title')} />
        <Field label="Дата (ГГГГ-ММ-ДД)" value={ed.date} onChange={set('date')} />
        <Text style={{ color:c.dim, marginTop:10 }}>Направление</Text>
        <Chips options={DIRS} value={ed.direction} onChange={k => setEd({ ...ed, direction: k })} />
        <Field label="Цель" value={ed.goal} onChange={set('goal')} multiline />
        <Field label="Задачи" value={ed.tasks} onChange={set('tasks')} multiline />
        <Field label="Ход мероприятия" value={ed.course} onChange={set('course')} multiline />
        <Field label="Результаты" value={ed.results} onChange={set('results')} multiline />
        <Btn t="Сохранить" onPress={save} />
        {data.events.some(e => e.id === ed.id) && <Btn t="Удалить" kind="danger" onPress={del} />}
      </View>}</Sheet></View>);
}
export function JournalSec() {
  const { data, update } = useData(); const [q, setQ] = useState(''); const [ed, setEd] = useState<Journal | null>(null);
  const items = [
    ...data.journal.map(j => ({ key:'j' + j.id, date:j.date, text:j.text, j, ev: data.events.find(e => e.id === j.eventId) })),
    ...data.events.map(e => ({ key:'e' + e.id, date:e.date, text:`Мероприятие: ${e.title}`, j: undefined, ev: undefined as Ev | undefined }))]
    .filter(i => (i.text + i.date).toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  const save = () => {
    if (!ed) return;
    if (!ed.text.trim()) return Alert.alert('Запись', 'Введите текст записи');
    if (!isDate(ed.date)) return Alert.alert('Дата', 'Формат ГГГГ-ММ-ДД');
    update(d => ({ ...d, journal: d.journal.some(j => j.id === ed.id) ? d.journal.map(j => (j.id === ed.id ? ed : j)) : [...d.journal, ed] })); setEd(null);
  };
  return (<View>
    <Btn t="+ Новая запись" onPress={() => setEd({ id: uid(), date: iso(new Date()), text:'' })} />
    <Field label="Поиск" value={q} onChange={setQ} placeholder="Текст или дата" />
    {items.length === 0 && <Text style={{ color:c.dim, marginTop:16 }}>Записей нет.</Text>}
    {items.map(i => <Pressable key={i.key} onPress={() => i.j ? setEd(i.j) : Alert.alert('Мероприятие', 'Редактируйте его в разделе «Мероприятия».')} style={cardStyle}>
      <Text style={{ color:c.dim }}>{i.date}{i.j ? '' : ' · из мероприятий'}</Text>
      <Text style={{ color:c.text, marginTop:4 }}>{i.text}</Text>
      {i.ev && <Text style={{ color:c.gold, marginTop:4 }}>Связано: {i.ev.title}</Text>}</Pressable>)}
    <Sheet visible={!!ed} title="Запись журнала" onClose={() => setEd(null)}>
      {ed && <View>
        <Field label="Дата (ГГГГ-ММ-ДД)" value={ed.date} onChange={v => setEd({ ...ed, date: v })} />
        <Field label="Содержание работы" value={ed.text} onChange={v => setEd({ ...ed, text: v })} multiline />
        <Text style={{ color:c.dim, marginTop:10 }}>Привязать к мероприятию</Text>
        <Chips options={[{ k:'', l:'Без привязки' }, ...data.events.map(e => ({ k: e.id, l: e.title }))]} value={ed.eventId ?? ''} onChange={k => setEd({ ...ed, eventId: k || undefined })} />
        <Btn t="Сохранить" onPress={save} />
        {data.journal.some(j => j.id === ed.id) && <Btn t="Удалить" kind="danger" onPress={() => confirm('Удалить запись?', () => { update(d => ({ ...d, journal: d.journal.filter(j => j.id !== ed.id) })); setEd(null); })} />}
      </View>}</Sheet></View>);
}
