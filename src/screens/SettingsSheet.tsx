import React, { useEffect, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { c } from '../theme';
import { DATA_KEY, useData } from '../DataContext';
import { useShifts } from '../ShiftsContext';
import { useSecurity } from '../security/Gate';
import { bioAvailable, changePin, disableBio, enableBio } from '../security/auth';
import { makeBackupText, parseBackupText } from '../security/backup';
import { loadEnc, saveEnc } from '../security/vault';
import { Data } from '../types';
import { Btn, Chips, Field, Sheet } from './ui';
const H = ({ t }: { t: string }) => <Text style={{ color:c.text, fontWeight:'700', fontSize:17, marginTop:24 }}>{t}</Text>;
export default function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const sec = useSecurity(); const { data } = useData(); const { shifts } = useShifts();
  const [canBio, setCanBio] = useState(false); const [busy, setBusy] = useState('');
  const [op, setOp] = useState(''); const [np, setNp] = useState(''); const [np2, setNp2] = useState('');
  const [bp, setBp] = useState(''); const [bp2, setBp2] = useState(''); const [rp, setRp] = useState('');
  useEffect(() => { bioAvailable().then(setCanBio); }, []);
  const err = (e: unknown) => Alert.alert('Ошибка', e instanceof Error ? e.message : String(e));
  const toggleBio = async (v: boolean) => { try { if (v) await enableBio(); else await disableBio(); sec.setBio(v); } catch (e) { err(e); } };
  const doPin = async () => {
    if (!/^\d{6}$/.test(np) || /^(\d)\1{5}$/.test(np) || np === '123456') return Alert.alert('PIN-код', 'Новый PIN — 6 цифр, не слишком простой');
    if (np !== np2) return Alert.alert('PIN-код', 'Новые PIN-коды не совпадают');
    setBusy('Меняю PIN…'); try { await changePin(op, np); setOp(''); setNp(''); setNp2(''); Alert.alert('PIN-код изменён', 'Данные остались доступны, перешифровывать не потребовалось.'); } catch (e) { err(e); } finally { setBusy(''); }
  };
  const doBackup = async () => {
    if (bp.length < 8) return Alert.alert('Пароль', 'Пароль резервной копии — не короче 8 символов'); if (bp !== bp2) return Alert.alert('Пароль', 'Пароли не совпадают');
    setBusy('Создаю копию…');
    try { const text = await makeBackupText(bp, data, shifts); await parseBackupText(text, bp); // проверка: копию можно расшифровать
      const uri = (FileSystem.cacheDirectory ?? '') + `PavelAI-${new Date().toISOString().slice(0, 10)}.pavelbak`;
      await FileSystem.writeAsStringAsync(uri, text); if (!(await Sharing.isAvailableAsync())) throw new Error('Отправка файлов недоступна');
      await Sharing.shareAsync(uri, { dialogTitle: 'Резервная копия Павел AI', UTI: 'public.data' }); setBp(''); setBp2('');
    } catch (e) { err(e); } finally { setBusy(''); }
  };
  const doRestore = async () => {
    if (!rp) return Alert.alert('Пароль', 'Введите пароль резервной копии');
    try { const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' }); if (r.canceled) return;
      setBusy('Проверяю копию…'); const b = await parseBackupText(await FileSystem.readAsStringAsync(r.assets[0].uri), rp); setBusy('');
      const d = b.data; Alert.alert('Копия проверена', `Создана: ${b.createdAt.slice(0, 10)}\nМероприятий: ${d.events.length}, записей: ${d.journal.length}, планов: ${d.plans.length}, воспитанников: ${d.students.length}, документов: ${d.docs.length}, смен: ${b.shifts.length}\n\nТекущие данные будут заменены.`,
        [{ text:'Отмена', style:'cancel' }, { text:'Восстановить', style:'destructive', onPress: () => apply(b.data, b.shifts) }]);
    } catch (e) { err(e); } finally { setBusy(''); }
  };
  const apply = async (nd: Data, ns: unknown[]) => {
    setBusy('Восстанавливаю…');
    try { await saveEnc('work-data-prev', data); await saveEnc(DATA_KEY, nd); // «prev» — страховочная копия текущих данных
      const chk = await loadEnc<Data>(DATA_KEY); if (JSON.stringify(chk) !== JSON.stringify(nd)) { await saveEnc(DATA_KEY, data); throw new Error('Проверка записи не пройдена, данные не изменены'); }
      await AsyncStorage.setItem('shifts', JSON.stringify(ns)); setRp(''); onClose(); sec.remount(); Alert.alert('Готово', 'Данные восстановлены.');
    } catch (e) { err(e); } finally { setBusy(''); }
  };
  return (<Sheet visible={visible} title="Безопасность" onClose={onClose}>
    {!!busy && <Text style={{ color:c.gold, marginBottom:8 }}>{busy}</Text>}
    <H t="Автоблокировка" />
    <Chips options={[{ k:'0', l:'При сворачивании' }, { k:'1', l:'1 мин' }, { k:'5', l:'5 мин' }, { k:'15', l:'15 мин' }]} value={String(sec.timeoutMin)} onChange={k => sec.setTimeoutMin(Number(k))} />
    <Btn t="Заблокировать сейчас" kind="ghost" onPress={() => { onClose(); sec.lock(); }} />
    {canBio && <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:16 }}><Text style={{ color:c.text }}>Вход по Face ID</Text><Switch value={sec.bio} onValueChange={toggleBio} /></View>}
    <H t="Смена PIN-кода" />
    <Field label="Текущий PIN" value={op} onChange={setOp} secure numeric /><Field label="Новый PIN (6 цифр)" value={np} onChange={setNp} secure numeric /><Field label="Повторите новый PIN" value={np2} onChange={setNp2} secure numeric />
    <Btn t="Изменить PIN" onPress={doPin} />
    <H t="Резервная копия" />
    <Text style={{ color:c.dim, marginTop:6 }}>Зашифрованный файл (.pavelbak) со всеми данными. Сохраните его в «Файлы» через меню «Поделиться». Пароль не восстанавливается.</Text>
    <Field label="Пароль копии (от 8 символов)" value={bp} onChange={setBp} secure /><Field label="Повторите пароль" value={bp2} onChange={setBp2} secure />
    <Btn t="Создать копию и сохранить в «Файлы»" onPress={doBackup} />
    <H t="Восстановление" />
    <Field label="Пароль копии" value={rp} onChange={setRp} secure />
    <Btn t="Выбрать файл и восстановить" kind="ghost" onPress={doRestore} />
  </Sheet>);
}
