import React from 'react';
import { Text, View } from 'react-native';
import { c } from '../theme';
export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (<View style={{ flex:1, backgroundColor:c.bg, padding:24, paddingTop:70 }}>
    <Text style={{ color:c.text, fontSize:28, fontWeight:'700' }}>{title}</Text>
    <View style={{ backgroundColor:c.card, borderColor:c.border, borderWidth:1, borderRadius:16, padding:16, marginTop:20 }}>
      <Text style={{ color:c.gold, fontWeight:'600' }}>Не реализовано</Text>
      <Text style={{ color:c.dim, marginTop:6 }}>{note}</Text></View></View>);
}
