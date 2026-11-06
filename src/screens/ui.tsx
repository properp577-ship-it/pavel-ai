import React from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { c } from '../theme';
export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
export const confirm = (title: string, ok: () => void) => Alert.alert(title, undefined, [{ text:'Отмена', style:'cancel' }, { text:'Удалить', style:'destructive', onPress: ok }]);
export const cardStyle = { backgroundColor:c.card, borderColor:c.border, borderWidth:1, borderRadius:16, padding:14, marginTop:10 } as const;
export const Btn = ({ t, onPress, kind }: { t: string; onPress: () => void; kind?: 'danger' | 'ghost' }) => (
  <Pressable onPress={onPress} style={{ backgroundColor: kind === 'danger' ? c.danger : kind === 'ghost' ? 'transparent' : c.accent, borderColor:c.border, borderWidth: kind === 'ghost' ? 1 : 0, borderRadius:12, paddingVertical:12, paddingHorizontal:16, alignItems:'center', marginTop:10 }}>
    <Text style={{ color: kind === 'ghost' ? c.text : '#0B0D12', fontWeight:'700' }}>{t}</Text></Pressable>);
export const Field = ({ label, value, onChange, multiline, placeholder, secure, numeric }: { label: string; value: string; onChange: (t: string) => void; multiline?: boolean; placeholder?: string; secure?: boolean; numeric?: boolean }) => (
  <View style={{ marginTop:10 }}><Text style={{ color:c.dim, marginBottom:4 }}>{label}</Text>
    <TextInput value={value} onChangeText={onChange} multiline={multiline} placeholder={placeholder} secureTextEntry={secure} keyboardType={numeric ? 'number-pad' : 'default'} maxLength={numeric ? 6 : undefined} autoCapitalize="none" autoCorrect={false} placeholderTextColor={c.dim}
      style={{ color:c.text, borderColor:c.border, borderWidth:1, borderRadius:10, padding:10, minHeight: multiline ? 80 : undefined, textAlignVertical: multiline ? 'top' : 'center' }} /></View>);
export function Chips<T extends string>({ options, value, onChange }: { options: { k: T; l: string }[]; value?: T; onChange: (k: T) => void }) {
  return <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:6 }}>{options.map(o =>
    <Pressable key={o.k} onPress={() => onChange(o.k)} style={{ paddingVertical:7, paddingHorizontal:12, borderRadius:20, borderWidth:1, borderColor: value === o.k ? c.accent : c.border, backgroundColor: value === o.k ? c.accent : 'transparent' }}>
      <Text style={{ color: value === o.k ? '#0B0D12' : c.text }}>{o.l}</Text></Pressable>)}</View>;
}
export const Sheet = ({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1, backgroundColor:c.bg }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', padding:18 }}>
        <Text style={{ color:c.text, fontSize:20, fontWeight:'700' }}>{title}</Text><Pressable onPress={onClose}><Text style={{ color:c.accent, fontSize:16 }}>Закрыть</Text></Pressable></View>
      <ScrollView contentContainerStyle={{ padding:18, paddingTop:0, paddingBottom:60 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </KeyboardAvoidingView></Modal>);
