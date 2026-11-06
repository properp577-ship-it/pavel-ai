import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { c } from '../theme';
import { useData } from '../DataContext';
import { Chips } from './ui';
import { Events, JournalSec } from './WorkEvents';
import { Plans, Students } from './WorkPlans';
import Library from './Library';
type K = 'ev' | 'jr' | 'pl' | 'st' | 'lb';
export default function WorkScreen() {
  const [k, setK] = useState<K>('ev'); const { error } = useData();
  return (<ScrollView style={{ flex:1, backgroundColor:c.bg }} contentContainerStyle={{ padding:20, paddingTop:70, paddingBottom:40 }} keyboardShouldPersistTaps="handled">
    <Text style={{ color:c.text, fontSize:28, fontWeight:'700' }}>Работа</Text>
    {!!error && <Text style={{ color:c.danger, marginTop:8 }}>{error}</Text>}
    <Chips<K> options={[{ k:'ev', l:'Мероприятия' }, { k:'jr', l:'Журнал' }, { k:'pl', l:'Планы' }, { k:'st', l:'Воспитанники' }, { k:'lb', l:'Библиотека' }]} value={k} onChange={setK} />
    <View>{k === 'ev' ? <Events /> : k === 'jr' ? <JournalSec /> : k === 'pl' ? <Plans /> : k === 'st' ? <Students /> : <Library />}</View>
    <Text style={{ color:c.dim, marginTop:24, fontSize:12 }}>Вложения к мероприятиям пока не реализованы (файлы можно добавлять к материалам библиотеки).</Text>
  </ScrollView>);
}
