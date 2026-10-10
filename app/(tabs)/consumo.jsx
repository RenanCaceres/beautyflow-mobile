import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { consumoApi } from '../../src/services/api';
import { sincronizarTodasNotificacoes } from '../../src/services/notifications';
import { C, S, fmt, fmtData } from '../../src/theme';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function ConsumoScreen() {
  const agora = new Date();
  const [mes, setMes]     = useState(agora.getMonth() + 1);
  const [ano, setAno]     = useState(agora.getFullYear());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try { setItems(await consumoApi.listar(mes, ano)); }
    catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  // CORREÇÃO: useFocusEffect garante recarregamento ao voltar para esta aba
  // (ex: após editar serviços na aba Clientes/Serviços)
  useFocusEffect(
    useCallback(() => { carregar(); }, [mes, ano])
  );

  const remover = (item) => {
    Alert.alert('Confirmar', `Remover "${item.produto}"?`, [
      { text: 'Cancelar' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await consumoApi.excluir(item.id);
        carregar();
        sincronizarTodasNotificacoes();
      }},
    ]);
  };

  const total = items.reduce((s, i) => s + parseFloat(i.valor), 0);

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      {/* Seletor de mês */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: C.border, flexGrow: 0 }}
        contentContainerStyle={{ padding: 10, gap: 6 }}>
        {MESES.map((m, i) => (
          <TouchableOpacity key={i}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99,
              backgroundColor: mes === i+1 ? C.pink : C.bg2 }}
            onPress={() => setMes(i + 1)}>
            <Text style={{ color: mes === i+1 ? 'white' : C.muted, fontWeight: '500', fontSize: 13 }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={S.content}>
        {/* Card de total */}
        <View style={[S.card, { backgroundColor: C.redLight, borderColor: '#F7C1C1', marginBottom: 16 }]}>
          <Text style={{ fontSize: 12, color: C.red, fontWeight: '500' }}>TOTAL DO MÊS</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: C.red, marginTop: 4 }}>{fmt(total)}</Text>
        </View>

        {loading ? <ActivityIndicator color={C.pink} /> :
          items.length === 0 ? (
            <Text style={[S.muted, { textAlign: 'center', marginTop: 40 }]}>Nenhum consumo neste período.</Text>
          ) : items.map((item) => (
            <View key={item.id} style={[S.card, S.between]}>
              <View style={{ flex: 1 }}>
                <Text style={[S.bold, { fontSize: 14 }]}>{item.produto}</Text>
                <Text style={S.hint}>{fmtData(item.data)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ color: C.red, fontWeight: '600' }}>{fmt(item.valor)}</Text>
                <TouchableOpacity style={[S.btnSm, { backgroundColor: C.redLight, borderColor: '#F7C1C1' }]}
                  onPress={() => remover(item)}>
                  <Text style={{ color: C.red, fontSize: 12 }}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }
      </ScrollView>

      <TouchableOpacity
        style={{ margin: 16, backgroundColor: C.pink, padding: 14, borderRadius: 10, alignItems: 'center' }}
        onPress={() => setModal(true)}>
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>+ Registrar Compra</Text>
      </TouchableOpacity>

      {modal && (
        <ModalConsumo onClose={() => setModal(false)} onSalvo={() => { setModal(false); carregar(); sincronizarTodasNotificacoes(); }} />
      )}
    </SafeAreaView>
  );
}

function ModalConsumo({ onClose, onSalvo }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [produto, setProduto] = useState('');
  const [valor, setValor]     = useState('');
  const [data, setData]       = useState(hoje);

  const salvar = async () => {
    if (!produto.trim() || !valor) return Alert.alert('Atenção', 'Preencha todos os campos.');
    try {
      await consumoApi.criar({ produto, valor: parseFloat(valor), data });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[S.header, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Cancelar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Registrar Consumo</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={S.label}>Produto *</Text>
          <TextInput style={S.input} value={produto} onChangeText={setProduto} placeholder="Ex: Ácido Glicólico 30%" />
          <Text style={S.label}>Valor (R$) *</Text>
          <TextInput style={S.input} value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="0,00" />
          <Text style={S.label}>Data *</Text>
          <TextInput style={S.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
