import React, { createContext, useContext } from 'react';
import { Shift } from './types';
import { useStored } from './storage';
const Ctx = createContext<{ shifts: Shift[]; save: (s: Shift[]) => void }>({ shifts: [], save: () => {} });
export const ShiftsProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, save } = useStored<Shift[]>('shifts', []);
  return <Ctx.Provider value={{ shifts: data, save }}>{children}</Ctx.Provider>;
};
export const useShifts = () => useContext(Ctx);
