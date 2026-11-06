import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
// Локальное хранилище. TODO (этап 5+): шифрование и защита доступом.
export function useStored<T>(key: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(key).then(v => { if (v) setData(JSON.parse(v)); setReady(true); }); }, [key]);
  const save = useCallback((next: T) => { setData(next); AsyncStorage.setItem(key, JSON.stringify(next)); }, [key]);
  return { data, save, ready };
}
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function shiftHours(s: { start: string; end: string }) {
  const m = (t: string) => { const [h, mi] = t.split(':').map(Number); return h*60+mi; };
  let d = m(s.end) - m(s.start); if (d <= 0) d += 1440;
  return d / 60;
}
export const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
