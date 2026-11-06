import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { c } from '../theme';
import { uid, useData } from '../DataContext';
import { iso } from '../storage';
import { DIRS, LibItem } from '../types';
import { BUILTIN } from '../library/builtin';
import { LKINDS, Scope, dirLabel, search, toEvent, toText } from '../library/lib';
import { addFile, openFile, removeFile } from '../library/files';
import { exportDoc } from '../docs/export';
import { Btn, Chips, Field, Sheet, cardStyle, confirm, isDate } from './ui';
const SECT: [keyof LibItem, string][] = [['goal', 'Цель'], ['tasks', 'Задачи'], ['equipment', 'Оборудование'], ['prep', 'Подготовка'], ['course', 'Ход мероприятия'], ['results', 'Ожидаемые результаты']];
export default function Library() {
  const { data, update } = useData();
  const [q, setQ] = useState(''); const [scope, setScope] = useState<Scope>('all'); const [dir, setDir] = useState(''); const [kind, setKind] = useState('');
  const [viewId, setViewId] = useState<string | null>(null); const [ed, setEd] = useState<LibItem | null>(null); const [mv, setMv] = useState(iso(new Date())); const [mvOpen, setMvOpen] = useState(false);
  const all = [...data.library, ...BUILTIN]; const cur = all.find(i => i.id === viewId);
  const list = search(all, q, data.favs, scope, dir, kind);
  const err = (e: unknown) => Alert.alert('Ошибка', e instanceof Error ? e.message : String(e));
  const fav = (id: string) => update(d => ({ ...d, favs: d.favs.includes(id) ? d.favs.filter(x => x !== id) : [...d.favs, id] }));
  const patch = (id: string, f: (i: LibItem) => LibItem) => update(d => ({ ...d, library: d.library.map(i => (i.id === id ? f(i) : i)) }));
  const blank = (): LibItem => ({ id: uid(), title: '', direction: DIRS[0].k, kind: LKINDS[0], keywords: '', goal: '', tasks: '', equipment: '', prep: '', course: '', results: '' });
  const save = () => { if (!ed) return; if (!ed.title.trim()) return Alert.alert('Название', 'Введите название');
    update(d => ({ ...d, library: d.library.some(i => i.id === ed.id) ? d.library.map(i => (i.id === ed.id ? ed : i)) : [...d.library, ed] })); setEd(null); };
  const set = (k: keyof LibItem) => (v: string) => setEd(e => (e ? ({ ...e, [k]: v } as LibItem) : e));
  const del = (i: LibItem) => confirm('Удалить материал и его файлы?', async () => { try { for (const f of i.files ?? []) await removeFile(f.id); } catch (e) { err(e); }
    update(d => ({ ...d, library: d.library.filter(x => x.id !== i.id), favs: d.favs.filter(x => x !== i.id) })); setViewId(null); });
  const toEvents = () => { if (!cur) return; if (!isDate(mv)) return Alert.alert('Дата', 'Формат ГГГГ-ММ-ДД');
    update(d => ({ ...d, events: [...d.events, toEvent(cur, mv, uid())] })); setMvOpen(false); setViewId(null); Alert.alert('Готово', 'Мероприятие добавлено в «Работа → Мероприятия». Проверьте дату и внесите результаты после проведения.'); };
  const exp = async (f: 'docx' | 'pdf') => { if (!cur) return; try { await exportDoc(cur.title, toText(cur), f); } catch (e) { err(e); } };
  const attach = async () => { if (!cur) return; try { const f = await addFile(); if (f) patch(cur.id, i => ({ ...i, files: [...(i.files ?? []), f] })); } catch (e) { err(e); } };
  const sh = <T extends string>(o: { k: T; l: string }[], v: T, f: (k: T) => void) => <Chips<T> options={o} value={v} onChange={f} />;
  return (<View>
    <Btn t="+ Свой материал" onPress={() => setEd(blank())} />
    <Field label="Поиск (название, тема, ключевые слова)" value={q} onChange={setQ} />
    {sh<Scope>([{ k:'all', l:'Все' }, { k:'fav', l:'★ Избранное' }, { k:'mine', l:'Мои' }], scope, setScope)}
    {sh<string>([{ k:'', l:'Все направления' }, ...DIRS], dir, setDir)}
    {sh<string>([{ k:'', l:'Любой тип' }, ...LKINDS.map(k => ({ k, l: k }))], kind, setKind)}
    <Text style={{ color:c.dim, marginTop:10 }}>Найдено: {list.length}</Text>
    {list.map(i => <Pressable key={i.id} onPress={() => setViewId(i.id)} style={cardStyle}>
      <View style={{ flexDirection:'row', justifyContent:'space-between' }}><Text style={{ color:c.text, fontWeight:'600', flex:1 }}>{i.title}</Text>
        <Pressable onPress={() => fav(i.id)} hitSlop={10}><Text style={{ color:c.gold, fontSize:20 }}>{data.favs.includes(i.id) ? '★' : '☆'}</Text></Pressable></View>
      <Text style={{ color:c.dim, marginTop:4 }}>{dirLabel(i.direction)} · {i.kind}{i.builtin ? '' : ' · мой'}</Text></Pressable>)}
    <Text style={{ color:c.dim, marginTop:20, fontSize:12 }}>Готовые материалы — авторские заготовки общего характера: адаптируйте их под возраст и состав группы. Нормативные документы в библиотеку не включены; добавляйте собственные файлы в свои материалы.</Text>
    <Sheet visible={!!cur} title="Материал" onClose={() => setViewId(null)}>
      {cur && <View>
        <Text style={{ color:c.text, fontSize:20, fontWeight:'700' }}>{cur.title}</Text>
        <Text style={{ color:c.dim, marginTop:4 }}>{dirLabel(cur.direction)} · {cur.kind}</Text>
        {SECT.map(([k, h]) => !!(cur[k] as string)?.trim() && <View key={k} style={{ marginTop:12 }}><Text style={{ color:c.gold, fontWeight:'600' }}>{h}</Text><Text style={{ color:c.text, marginTop:4 }}>{cur[k] as string}</Text></View>)}
        {!cur.builtin && <View style={{ marginTop:14 }}><Text style={{ color:c.gold, fontWeight:'600' }}>Файлы</Text>
          {(cur.files ?? []).map(f => <View key={f.id} style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8 }}>
            <Pressable onPress={() => openFile(f).catch(err)} style={{ flex:1 }}><Text style={{ color:c.accent }}>{f.name} ({Math.ceil(f.size / 1024)} КБ)</Text></Pressable>
            <Pressable onPress={() => confirm('Удалить файл?', async () => { try { await removeFile(f.id); patch(cur.id, i => ({ ...i, files: (i.files ?? []).filter(x => x.id !== f.id) })); } catch (e) { err(e); } })}><Text style={{ color:c.danger }}>Удалить</Text></Pressable></View>)}
          <Btn t="+ Добавить файл (до 3 МБ)" kind="ghost" onPress={attach} /></View>}
        <Btn t="Перенести в «Мероприятия»" onPress={() => setMvOpen(true)} />
        {mvOpen && <View><Field label="Дата проведения (ГГГГ-ММ-ДД)" value={mv} onChange={setMv} /><Btn t="Создать мероприятие" onPress={toEvents} /></View>}
        <Btn t={data.favs.includes(cur.id) ? '★ Убрать из избранного' : '☆ В избранное'} kind="ghost" onPress={() => fav(cur.id)} />
        <Btn t="Word (.docx)" onPress={() => exp('docx')} /><Btn t="PDF" onPress={() => exp('pdf')} />
        {cur.builtin ? <Btn t="Создать свою копию для правки" kind="ghost" onPress={() => { const { builtin, ...r } = cur; void builtin; setViewId(null); setEd({ ...r, id: uid(), title: cur.title + ' (моя версия)', files: [] }); }} />
          : <View><Btn t="Редактировать" kind="ghost" onPress={() => { setEd(cur); setViewId(null); }} /><Btn t="Удалить" kind="danger" onPress={() => del(cur)} /></View>}
      </View>}</Sheet>
    <Sheet visible={!!ed} title="Материал" onClose={() => setEd(null)}>
      {ed && <View>
        <Field label="Название" value={ed.title} onChange={set('title')} />
        <Text style={{ color:c.dim, marginTop:10 }}>Направление</Text>{sh(DIRS, ed.direction, k => setEd({ ...ed, direction: k }))}
        <Text style={{ color:c.dim, marginTop:10 }}>Тип</Text>{sh<string>(LKINDS.map(k => ({ k, l: k })), ed.kind, k => setEd({ ...ed, kind: k }))}
        <Field label="Ключевые слова (через пробел)" value={ed.keywords} onChange={set('keywords')} />
        {SECT.map(([k, h]) => <Field key={k} label={h} value={ed[k] as string} onChange={set(k)} multiline />)}
        <Btn t="Сохранить" onPress={save} /></View>}</Sheet></View>);
}
