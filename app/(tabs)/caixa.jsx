import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { caixaApi } from '../../src/services/api';
import { C, S, fmt } from '../../src/theme';

const MESES = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function CaixaScreen() {
  const agora = new Date();
  const [periodo, setPeriodo] = useState('mes');
  const [mes, setMes]         = useState(agora.getMonth() + 1);
  const [ano, setAno]         = useState(agora.getFullYear());
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    try {
      const params = { periodo, mes, ano, dia: agora.toISOString().slice(0,10) };
      setDados(await caixaApi.relatorio(params));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // CORREÇÃO: useFocusEffect garante recarregamento ao voltar para esta aba
  useFocusEffect(
    useCallback(() => { carregar(); }, [periodo, mes, ano])
  );

  // Gráfico de barras simples com View
  const maxVal = dados
    ? Math.max(...dados.entradas.map(e => parseFloat(e.total)), ...dados.saidas.map(s => parseFloat(s.total)), 1)
    : 1;

  const periodos = dados
    ? [...new Set([...dados.entradas.map(e => String(e.periodo)), ...dados.saidas.map(s => String(s.periodo))])]
        .sort((a,b) => Number(a)-Number(b)).slice(0, 8)
    : [];

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      <ScrollView style={S.content}>
        {/* Abas de período */}
        <View style={[S.row, { marginBottom: 16, backgroundColor: C.bg2, borderRadius: 10, padding: 4 }]}>
          {['dia','mes','ano'].map((p) => (
            <TouchableOpacity key={p} style={{ flex: 1, paddingVertical: 8, borderRadius: 8,
              backgroundColor: periodo === p ? C.pink : 'transparent', alignItems: 'center' }}
              onPress={() => setPeriodo(p)}>
              <Text style={{ color: periodo === p ? 'white' : C.muted, fontWeight: '500', fontSize: 13 }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Seletor de mês (apenas no modo mês) */}
        {periodo === 'mes' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 6 }}>
            {MESES.slice(1).map((m, i) => (
              <TouchableOpacity key={i}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
                  backgroundColor: mes === i+1 ? C.pink : C.bg2 }}
                onPress={() => setMes(i + 1)}>
                <Text style={{ color: mes === i+1 ? 'white' : C.muted, fontSize: 12, fontWeight: '500' }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} /> : !dados ? null : (<>
          {/* Cards de resumo */}
          <View style={{ gap: 10, marginBottom: 20 }}>
            <View style={[S.card, { backgroundColor: C.greenLight, borderColor: '#9FE1CB' }]}>
              <Text style={{ fontSize: 11, color: C.green, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Entradas</Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: C.green, marginTop: 4 }}>{fmt(dados.totais.entradas)}</Text>
            </View>
            <View style={[S.card, { backgroundColor: C.redLight, borderColor: '#F7C1C1' }]}>
              <Text style={{ fontSize: 11, color: C.red, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Saídas</Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: C.red, marginTop: 4 }}>{fmt(dados.totais.saidas)}</Text>
            </View>
            <View style={S.card}>
              <Text style={{ fontSize: 11, color: C.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lucro Líquido</Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: dados.totais.lucro >= 0 ? C.green : C.red, marginTop: 4 }}>
                {fmt(dados.totais.lucro)}
              </Text>
            </View>
          </View>

          {/* Gráfico de barras nativo */}
          {periodos.length > 0 && (
            <View style={[S.card, { marginBottom: 20 }]}>
              <Text style={[S.bold, { marginBottom: 12 }]}>Entradas × Saídas</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 }}>
                {periodos.map((p) => {
                  const e = dados.entradas.find(x => String(x.periodo) === p);
                  const s = dados.saidas.find(x => String(x.periodo) === p);
                  const hE = e ? (parseFloat(e.total) / maxVal) * 100 : 0;
                  const hS = s ? (parseFloat(s.total) / maxVal) * 100 : 0;
                  return (
                    <View key={p} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                      <View style={{ width: '40%', height: hE, backgroundColor: C.green, borderRadius: 3, minHeight: hE > 0 ? 4 : 0 }} />
                      <View style={{ width: '40%', height: hS, backgroundColor: C.red,   borderRadius: 3, minHeight: hS > 0 ? 4 : 0 }} />
                      <Text style={{ fontSize: 9, color: C.hint, marginTop: 2 }}>{p}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={[S.row, { marginTop: 10 }]}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, marginRight: 4 }} />
                <Text style={[S.hint, { marginRight: 12 }]}>Entradas</Text>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.red, marginRight: 4 }} />
                <Text style={S.hint}>Saídas</Text>
              </View>
            </View>
          )}

          {/* Tabelas resumidas */}
          <Text style={[S.bold, { marginBottom: 8 }]}>Detalhamento</Text>
          {dados.entradas.map((e, i) => (
            <View key={i} style={[S.between, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={S.muted}>Período {e.periodo}</Text>
              <Text style={{ color: C.green, fontWeight: '600' }}>{fmt(e.total)}</Text>
            </View>
          ))}
          {dados.saidas.map((s, i) => (
            <View key={i} style={[S.between, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={S.muted}>Saída {s.periodo}</Text>
              <Text style={{ color: C.red, fontWeight: '600' }}>{fmt(s.total)}</Text>
            </View>
          ))}
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}
