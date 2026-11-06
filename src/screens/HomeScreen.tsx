import React, { useState } from 'react';
import { Btn } from './ui';
import SettingsSheet from './SettingsSheet';
import { ScrollView, Text, View } from 'react-native';
import { c } from '../theme';
import { useShifts } from '../ShiftsContext';
import { useData } from '../DataContext';
import { iso, shiftHours } from '../storage';
const card = { backgroundColor:c.card, borderColor:c.border, borderWidth:1, borderRadius:16, padding:16, marginTop:14 } as const;
export default function HomeScreen() {
  const { shifts } = useShifts();
  const { data } = useData();
  const [set, setSet] = useState(false);
  const now = new Date(), today = iso(now), ym = today.slice(0, 7);
  const month = shifts.filter(s => s.date.startsWith(ym));
  const hours = month.reduce((a, s) => a + shiftHours(s), 0);
  const next = [...shifts].filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const h = now.getHours();
  const hello = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  return (<ScrollView style={{ flex:1, backgroundColor:c.bg }} contentContainerStyle={{ padding:24, paddingTop:70 }}>
    <Text style={{ color:c.dim }}>{now.toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</Text>
    <Text style={{ color:c.text, fontSize:30, fontWeight:'700', marginTop:4 }}>{hello}, Павел</Text>
    <View style={card}><Text style={{ color:c.dim }}>Ближайшая смена</Text>
      <Text style={{ color:c.text, fontSize:20, fontWeight:'600', marginTop:6 }}>{next ? `${next.date} · ${next.start}–${next.end}` : 'Смен нет'}</Text></View>
    <View style={card}><Text style={{ color:c.dim }}>Часов за месяц</Text>
      <Text style={{ color:c.accent, fontSize:34, fontWeight:'700', marginTop:6 }}>{hours.toFixed(1)}</Text>
      <Text style={{ color:c.dim }}>Смен: {month.length}</Text></View>
    <View style={card}><Text style={{ color:c.dim }}>Ближайшие мероприятия</Text>
      {data.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3).map(e => <Text key={e.id} style={{ color:c.text, marginTop:6 }}>{e.date} · {e.title}</Text>)}
      {!data.events.some(e => e.date >= today) && <Text style={{ color:c.dim, marginTop:6 }}>Нет</Text>}</View>
    <View style={card}><Text style={{ color:c.dim }}>Последние записи журнала</Text>
      {[...data.journal].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(j => <Text key={j.id} numberOfLines={2} style={{ color:c.text, marginTop:6 }}>{j.date} · {j.text}</Text>)}
      {data.journal.length === 0 && <Text style={{ color:c.dim, marginTop:6 }}>Записей нет</Text>}</View>
    <Btn t="Безопасность и резервные копии" kind="ghost" onPress={() => setSet(true)} />
    <SettingsSheet visible={set} onClose={() => setSet(false)} />
  </ScrollView>);
}
