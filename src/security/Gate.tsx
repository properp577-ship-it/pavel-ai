import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { c } from '../theme';
import { bioEnabled, hasPin, lockKey, setupPin, unlock, unlockBio } from './auth';
import { cleanExports } from './clean';
const SET = 'settings-v1';
type S = { lock: () => void; remount: () => void; timeoutMin: number; setTimeoutMin: (m: number) => void; bio: boolean; setBio: (b: boolean) => void };
const Ctx = createContext<S>({ lock: () => {}, remount: () => {}, timeoutMin: 5, setTimeoutMin: () => {}, bio: false, setBio: () => {} });
export const useSecurity = () => useContext(Ctx);
function PinScreen({ mode, bio, onDone }: { mode: 'setup' | 'unlock'; bio: boolean; onDone: () => void }) {
  const [pin, setPin] = useState(''); const [first, setFirst] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const tryBio = async () => { if (await unlockBio()) onDone(); };
  useEffect(() => { if (mode === 'unlock' && bio) tryBio(); }, []); // eslint-disable-line
  const submit = async (p: string) => {
    setBusy(true);
    try {
      if (mode === 'setup') {
        if (/^(\d)\1{5}$/.test(p) || p === '123456') { setPin(''); setMsg('Слишком простой PIN-код'); }
        else if (!first) { setFirst(p); setPin(''); setMsg('Повторите PIN-код'); }
        else if (first !== p) { setFirst(''); setPin(''); setMsg('PIN-коды не совпали. Начните заново'); }
        else { await setupPin(p); onDone(); }
      } else if (await unlock(p)) onDone(); else { setPin(''); setMsg('Неверный PIN-код'); }
    } catch (e) { setPin(''); setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const press = (d: string) => { if (busy || pin.length >= 6) return; const p = pin + d; setPin(p); if (p.length === 6) submit(p); };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', mode === 'unlock' && bio ? 'ID' : '', '0', '⌫'];
  return (<View style={{ flex:1, backgroundColor:c.bg, alignItems:'center', justifyContent:'center', padding:24 }}>
    <Text style={{ color:c.text, fontSize:26, fontWeight:'700' }}>Павел AI</Text>
    <Text style={{ color:c.dim, marginTop:8, textAlign:'center' }}>{mode === 'setup' ? (first ? 'Повторите PIN-код' : 'Придумайте PIN-код из 6 цифр') : 'Введите PIN-код'}</Text>
    <View style={{ flexDirection:'row', gap:14, marginVertical:28 }}>{[0, 1, 2, 3, 4, 5].map(i =>
      <View key={i} style={{ width:14, height:14, borderRadius:7, backgroundColor: i < pin.length ? c.accent : c.border }} />)}</View>
    <Text style={{ color: busy ? c.dim : c.danger, minHeight:40, textAlign:'center' }}>{busy ? 'Проверка…' : msg}</Text>
    <View style={{ flexDirection:'row', flexWrap:'wrap', width:264, justifyContent:'center' }}>{keys.map((k, i) =>
      <Pressable key={i} disabled={!k} onPress={() => k === '⌫' ? setPin(pin.slice(0, -1)) : k === 'ID' ? tryBio() : press(k)}
        style={{ width:72, height:72, margin:8, borderRadius:36, alignItems:'center', justifyContent:'center', backgroundColor: k ? c.card : 'transparent' }}>
        <Text style={{ color:c.text, fontSize: k === 'ID' ? 16 : 26 }}>{k === 'ID' ? 'Face ID' : k}</Text></Pressable>)}</View>
    {mode === 'setup' && <Text style={{ color:c.gold, marginTop:16, textAlign:'center', fontSize:12 }}>Забытый PIN-код восстановить нельзя. Делайте резервные копии (Главная → Безопасность).</Text>}
  </View>);
}
export function Gate({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<'load' | 'setup' | 'locked' | 'open'>('load'); const stRef = useRef(st); stRef.current = st;
  const [epoch, setEpoch] = useState(0); const [covered, setCovered] = useState(false);
  const [tm, setTm] = useState(5); const tmRef = useRef(5); const [bio, setBio] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); const bg = useRef(0);
  const lock = useCallback(() => { lockKey(); cleanExports(); setSt('locked'); }, []);
  const arm = useCallback(() => { if (timer.current) clearTimeout(timer.current); if (stRef.current === 'open' && tmRef.current > 0) timer.current = setTimeout(lock, tmRef.current * 60000); }, [lock]);
  useEffect(() => { (async () => {
    try { const s = await AsyncStorage.getItem(SET); if (s) { const m = JSON.parse(s).timeoutMin; if (typeof m === 'number') { setTm(m); tmRef.current = m; } } } catch { /* значения по умолчанию */ }
    setBio(await bioEnabled()); cleanExports(); setSt((await hasPin()) ? 'locked' : 'setup'); })(); }, []);
  useEffect(() => { arm(); return () => { if (timer.current) clearTimeout(timer.current); }; }, [st, tm, arm]);
  useEffect(() => { const sub = AppState.addEventListener('change', s => {
    setCovered(s !== 'active'); if (s === 'background') bg.current = Date.now();
    if (s === 'active' && bg.current && stRef.current === 'open' && (tmRef.current === 0 || Date.now() - bg.current > tmRef.current * 60000)) lock();
    if (s === 'active') bg.current = 0; }); return () => sub.remove(); }, [lock]);
  const setTimeoutMin = (m: number) => { setTm(m); tmRef.current = m; AsyncStorage.setItem(SET, JSON.stringify({ timeoutMin: m })).catch(() => {}); };
  return (<Ctx.Provider value={{ lock, remount: () => setEpoch(e => e + 1), timeoutMin: tm, setTimeoutMin, bio, setBio }}>
    <View style={{ flex:1, backgroundColor:c.bg }} onTouchStart={arm}>
      {st === 'open' ? <React.Fragment key={epoch}>{children}</React.Fragment> : st === 'load' ? null : <PinScreen mode={st === 'setup' ? 'setup' : 'unlock'} bio={bio} onDone={() => setSt('open')} />}
      {covered && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor:c.bg, alignItems:'center', justifyContent:'center' }}><Text style={{ color:c.dim, fontSize:22 }}>Павел AI</Text></View>}
    </View></Ctx.Provider>);
}
