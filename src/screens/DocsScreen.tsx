import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { c } from '../theme';
import { uid, useData } from '../DataContext';
import { iso } from '../storage';
import { Doc } from '../types';
import { CATS, D, KINDS, Kind, generate, presets } from '../docs/generate';
import { hasTables } from '../docs/build';
import { Fmt, exportDoc } from '../docs/export';
import { Btn, Chips, Field, Sheet, cardStyle, confirm, isDate } from './ui';
export default function DocsScreen() {
  const { data, update, error } = useData();
  const [tab, setTab] = useState<'new' | 'arch'>('new'); const [kind, setKind] = useState<Kind>('month');
  const pr = presets(); const [from, setFrom] = useState(pr[1].from); const [to, setTo] = useState(pr[1].to);
  const [sid, setSid] = useState(data.students[0]?.id ?? ''); const [ed, setEd] = useState<Doc | null>(null);
  const [q, setQ] = useState(''); const [cat, setCat] = useState('');
  const info = KINDS.find(k => k.k === kind)!;
  const store = (d: Doc) => update(x => ({ ...x, docs: x.docs.some(y => y.id === d.id) ? x.docs.map(y => (y.id === d.id ? d : y)) : [...x.docs, d] }));
  const okPeriod = (f: string, t: string) => (!isDate(f) || !isDate(t) || f > t) ? (Alert.alert('Период', 'Даты в формате ГГГГ-ММ-ДД, начало не позже конца'), false) : true;
  const create = () => {
    if (!okPeriod(from, to)) return;
    if (info.st && !sid) return Alert.alert('Воспитанник', 'Выберите воспитанника');
    const code = data.students.find(s => s.id === sid)?.code;
    const d: Doc = { id: uid(), kind, title: info.st ? `${info.l}: ${code}` : `${info.l} за ${D(from)} – ${D(to)}`, from, to, studentId: info.st ? sid : undefined,
      created: iso(new Date()), updated: iso(new Date()), text: generate(kind, from, to, data, sid) };
    store(d); setEd(d);
  };
  const save = () => { if (!ed) return false; if (!ed.title.trim()) { Alert.alert('Название', 'Введите название'); return false; } if (!okPeriod(ed.from, ed.to)) return false;
    const d = { ...ed, updated: iso(new Date()) }; store(d); setEd(d); return true; };
  const exp = async (f: Fmt) => { if (!save() || !ed) return; try { await exportDoc(ed.title, ed.text, f); } catch (e) { Alert.alert('Ошибка экспорта', String((e as Error).message ?? e)); } };
  const rebuild = () => ed && Alert.alert('Пересобрать текст?', 'Текущий текст будет заменён данными за выбранный период.', [{ text:'Отмена', style:'cancel' },
    { text:'Пересобрать', onPress: () => okPeriod(ed.from, ed.to) && setEd({ ...ed, text: generate(ed.kind as Kind, ed.from, ed.to, data, ed.studentId) }) }]);
  const copy = () => { if (!ed || !save()) return; const d = { ...ed, id: uid(), title: ed.title + ' (копия)', created: iso(new Date()), updated: iso(new Date()) }; store(d); setEd(d); };
  const list = data.docs.filter(d => (!cat || KINDS.find(k => k.k === d.kind)?.cat === cat) && d.title.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => b.updated.localeCompare(a.updated));
  return (<ScrollView style={{ flex:1, backgroundColor:c.bg }} contentContainerStyle={{ padding:20, paddingTop:70, paddingBottom:40 }} keyboardShouldPersistTaps="handled">
    <Text style={{ color:c.text, fontSize:28, fontWeight:'700' }}>Документы</Text>
    {!!error && <Text style={{ color:c.danger, marginTop:8 }}>{error}</Text>}
    <Chips options={[{ k:'new' as const, l:'Создать' }, { k:'arch' as const, l:`Архив (${data.docs.length})` }]} value={tab} onChange={setTab} />
    {tab === 'new' ? <View>
      <Text style={{ color:c.dim, marginTop:14 }}>Тип документа</Text>
      <Chips options={KINDS.map(k => ({ k: k.k, l: k.l }))} value={kind} onChange={setKind} />
      <Text style={{ color:c.dim, marginTop:14 }}>Период</Text>
      <Chips options={pr.map(p => ({ k: p.l, l: p.l }))} onChange={k => { const p = pr.find(x => x.l === k)!; setFrom(p.from); setTo(p.to); }} />
      <Field label="С (ГГГГ-ММ-ДД)" value={from} onChange={setFrom} /><Field label="По (ГГГГ-ММ-ДД)" value={to} onChange={setTo} />
      {info.st && <View><Text style={{ color:c.dim, marginTop:14 }}>Воспитанник</Text><Chips options={data.students.map(s => ({ k: s.id, l: s.code }))} value={sid} onChange={setSid} /></View>}
      <Btn t="Сформировать черновик" onPress={create} />
      <Text style={{ color:c.dim, marginTop:12, fontSize:12 }}>Черновик собирается только из внесённых записей. Чего не хватает — указано в конце документа.</Text>
    </View> : <View>
      <Field label="Поиск по названию" value={q} onChange={setQ} />
      <Chips options={[{ k:'', l:'Все' }, ...CATS.map(x => ({ k: x, l: x }))]} value={cat} onChange={setCat} />
      {list.length === 0 && <Text style={{ color:c.dim, marginTop:16 }}>Документов нет.</Text>}
      {list.map(d => <Pressable key={d.id} onPress={() => setEd(d)} style={cardStyle}><Text style={{ color:c.text, fontWeight:'600' }}>{d.title}</Text>
        <Text style={{ color:c.dim, marginTop:4 }}>{KINDS.find(k => k.k === d.kind)?.cat} · создан {D(d.created)} · изменён {D(d.updated)}</Text></Pressable>)}
    </View>}
    <Sheet visible={!!ed} title="Документ" onClose={() => setEd(null)}>
      {ed && <View>
        <Field label="Название" value={ed.title} onChange={v => setEd({ ...ed, title: v })} />
        <Field label="Период с" value={ed.from} onChange={v => setEd({ ...ed, from: v })} /><Field label="Период по" value={ed.to} onChange={v => setEd({ ...ed, to: v })} />
        <Text style={{ color:c.dim, marginTop:10 }}>Создан: {D(ed.created)}</Text>
        <TextInput value={ed.text} onChangeText={v => setEd({ ...ed, text: v })} multiline placeholderTextColor={c.dim}
          style={{ color:c.text, borderColor:c.border, borderWidth:1, borderRadius:10, padding:10, minHeight:320, marginTop:10, textAlignVertical:'top' }} />
        <Text style={{ color:c.dim, fontSize:12, marginTop:6 }}>Разметка: «# » — заголовок, «## » — раздел, строки «| а | б |» — таблица.</Text>
        <Btn t="Сохранить" onPress={() => { if (save()) Alert.alert('Сохранено'); }} />
        <Btn t="Пересобрать по периоду" kind="ghost" onPress={rebuild} /><Btn t="Создать копию" kind="ghost" onPress={copy} />
        <Btn t="Word (.docx)" onPress={() => exp('docx')} /><Btn t="PDF" onPress={() => exp('pdf')} />
        {hasTables(ed.text) && <Btn t="Excel (.xlsx) — таблицы" onPress={() => exp('xlsx')} />}
        <Btn t="Удалить" kind="danger" onPress={() => confirm('Удалить документ?', () => { update(x => ({ ...x, docs: x.docs.filter(y => y.id !== ed.id) })); setEd(null); })} />
      </View>}</Sheet>
  </ScrollView>);
}
