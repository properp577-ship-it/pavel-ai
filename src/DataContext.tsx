import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Data } from './types';
import { c } from './theme';
import { loadOrMigrate, saveEnc } from './security/vault';
export const DATA_KEY = 'work-data-v2'; const OLD_KEY = 'work-data-v1';
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
// Тестовые данные: НЕ вносите реальные ФИО и сведения несовершеннолетних.
export const seed: Data = { events: [], journal: [], plans: [], docs: [], library: [], favs: [], students: [
  { id:'s1', code:'Воспитанник А', note:'Тестовая карточка', observations: [] },
  { id:'s2', code:'Воспитанник Б', note:'Тестовая карточка', observations: [] },
  { id:'s3', code:'Воспитанник В', note:'Тестовая карточка', observations: [] }] };
type Ctx = { data: Data; update: (fn: (d: Data) => Data) => void; error: string };
const C = createContext<Ctx>({ data: seed, update: () => {}, error: '' });
export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<Data>(seed); const [ready, setReady] = useState(false); const [error, setError] = useState(''); const [fatal, setFatal] = useState(false);
  useEffect(() => { (async () => {
    try { const d = await loadOrMigrate<Data>(DATA_KEY, OLD_KEY); if (d) setData({ ...seed, ...d }); }
    catch (e) { setFatal(true); setError('Ошибка чтения данных: ' + (e as Error).message + '. Запись отключена, чтобы не потерять данные.'); }
    finally { setReady(true); } })(); }, []);
  const update = useCallback((fn: (d: Data) => Data) => setData(prev => {
    const next = fn(prev); if (fatal) return prev;
    saveEnc(DATA_KEY, next).then(() => setError('')).catch(e => setError('Не удалось сохранить данные: ' + (e as Error).message));
    return next; }), [fatal]);
  if (!ready) return <View style={{ flex:1, backgroundColor:c.bg, justifyContent:'center' }}><Text style={{ color:c.dim, textAlign:'center' }}>Загрузка…</Text></View>;
  return <C.Provider value={{ data, update, error }}>{children}</C.Provider>;
};
export const useData = () => useContext(C);
