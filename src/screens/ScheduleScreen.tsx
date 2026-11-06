import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { c } from '../theme';
import { useShifts } from '../ShiftsContext';
import { useData } from '../DataContext';
import { iso, shiftHours, validTime } from '../storage';
import { Shift } from '../types';
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const Btn = ({ t, onPress, color = c.accent }: { t: string; onPress: () => void; color?: string }) =>
  <Pressable onPress={onPress} style={{ backgroundColor:color, borderRadius:12, paddingVertical:12, paddingHorizontal:16, alignItems:'center' }}>
    <Text style={{ color:'#0B0D12', fontWeight:'700' }}>{t}</Text></Pressable>;
export default function ScheduleScreen() {
  const { shifts, save } = useShifts();
  const { data } = useData();
  const [cur, setCur] = useState(new Date());
  const [sel, setSel] = useState(iso(new Date()));
  const [start, setStart] = useState('08:00'); const [end, setEnd] = useState('20:00');
  const [holiday, setHoliday] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const y = cur.getFullYear(), m = cur.getMonth(), ym = iso(new Date(y, m, 1)).slice(0, 7);
  const days = new Date(y, m + 1, 0).getDate(), offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const month = shifts.filter(s => s.date.startsWith(ym)).sort((a, b) => a.date.localeCompare(b.date));
  const hours = month.reduce((a, s) => a + shiftHours(s), 0);
  const holH = month.filter(s => s.holiday).reduce((a, s) => a + shiftHours(s), 0);
  const submit = () => {
    if (!validTime(start) || !validTime(end)) return Alert.alert('Время', 'Формат ЧЧ:ММ, например 08:00');
    const s: Shift = { id: editId ?? String(Date.now()), date: sel, start, end, holiday };
    save(editId ? shifts.map(x => x.id === editId ? s : x) : [...shifts, s]); setEditId(null);
  };
  const edit = (s: Shift) => { setEditId(s.id); setSel(s.date); setStart(s.start); setEnd(s.end); setHoliday(s.holiday); };
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (<ScrollView style={{ flex:1, backgroundColor:c.bg }} contentContainerStyle={{ padding:20, paddingTop:70 }}>
    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
      <Pressable onPress={() => setCur(new Date(y, m - 1, 1))}><Text style={{ color:c.accent, fontSize:26 }}>‹</Text></Pressable>
      <Text style={{ color:c.text, fontSize:22, fontWeight:'700' }}>{MONTHS[m]} {y}</Text>
      <Pressable onPress={() => setCur(new Date(y, m + 1, 1))}><Text style={{ color:c.accent, fontSize:26 }}>›</Text></Pressable></View>
    <Text style={{ color:c.dim, marginTop:8 }}>Смен: {month.length} · Часов: {hours.toFixed(1)} · Праздничных смен: {month.filter(s => s.holiday).length} ({holH.toFixed(1)} ч)</Text>
    <View style={{ flexDirection:'row', flexWrap:'wrap', marginTop:14 }}>
      {cells.map((d, i) => { const date = d ? `${ym}-${String(d).padStart(2, '0')}` : ''; const has = month.some(s => s.date === date) || data.events.some(e => e.date === date);
        return <View key={i} style={{ width:'14.28%', aspectRatio:1, padding:2 }}>{d ? <Pressable onPress={() => setSel(date)}
          style={{ flex:1, borderRadius:10, alignItems:'center', justifyContent:'center', backgroundColor: sel === date ? c.accent : has ? c.card : 'transparent', borderWidth: has ? 1 : 0, borderColor: c.gold }}>
          <Text style={{ color: sel === date ? '#0B0D12' : c.text }}>{d}</Text></Pressable> : null}</View>; })}</View>
    <View style={{ backgroundColor:c.card, borderRadius:16, borderColor:c.border, borderWidth:1, padding:16, marginTop:14 }}>
      <Text style={{ color:c.text, fontWeight:'600' }}>{editId ? 'Редактирование смены' : 'Новая смена'}: {sel}</Text>
      <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
        {[[start, setStart], [end, setEnd]].map(([v, f], i) => <TextInput key={i} value={v as string} onChangeText={f as (t: string) => void}
          style={{ flex:1, color:c.text, borderColor:c.border, borderWidth:1, borderRadius:10, padding:10 }} placeholderTextColor={c.dim} />)}</View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:12 }}>
        <Text style={{ color:c.dim }}>Праздничная смена</Text><Switch value={holiday} onValueChange={setHoliday} /></View>
      <Btn t={editId ? 'Сохранить' : 'Добавить смену'} onPress={submit} /></View>
    {data.events.filter(e => e.date === sel).map(e => <Text key={e.id} style={{ color:c.gold, marginTop:8 }}>Мероприятие: {e.title}</Text>)}
    {month.map(s => <Pressable key={s.id} onPress={() => edit(s)} onLongPress={() => Alert.alert('Удалить смену?', s.date, [{ text:'Отмена' }, { text:'Удалить', style:'destructive', onPress: () => save(shifts.filter(x => x.id !== s.id)) }])}
      style={{ flexDirection:'row', justifyContent:'space-between', padding:14, borderBottomColor:c.border, borderBottomWidth:1 }}>
      <Text style={{ color:c.text }}>{s.date} · {s.start}–{s.end}{s.holiday ? ' ★' : ''}</Text><Text style={{ color:c.dim }}>{shiftHours(s).toFixed(1)} ч</Text></Pressable>)}
    <Text style={{ color:c.dim, marginTop:10, fontSize:12 }}>Нажмите на смену — править, удерживайте — удалить.</Text>
  </ScrollView>);
}
