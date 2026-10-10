import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicosApi } from '../../src/services/api';
import { C, S, fmt } from '../../src/theme';

export default function ServicosScreen() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);

  const carregar = async () => {
    setLoading(true);
    try { setServicos(await servicosApi.listar()); }
    catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const remover = (s) => {
    Alert.alert('Confirmar', `Remover "${s.nome}"?`, [
      { text: 'Cancelar' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await servicosApi.excluir(s.id); carregar(); }
        catch (e) { Alert.alert('Erro', e.message); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      <ScrollView style={S.content}>
        {loading ? <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} /> :
          servicos.length === 0 ? (
            <Text style={[S.muted, { textAlign: 'center', marginTop: 60 }]}>Nenhum serviço cadastrado.</Text>
          ) : servicos.map((s) => (
            <View key={s.id} style={S.card}>
              <View style={S.between}>
                <Text style={[S.bold, { fontSize: 15, flex: 1 }]}>{s.nome}</Text>
                <Text style={{ color: C.green, fontWeight: '700', fontSize: 16 }}>{fmt(s.valor)}</Text>
              </View>
              <Text style={[S.hint, { marginTop: 4 }]}>🔄 Retorno ideal: {s.intervalo_retorno_dias} dias</Text>
              <View style={[S.row, { marginTop: 10, justifyContent: 'flex-end' }]}>
                <TouchableOpacity style={[S.btnSm, { marginRight: 8, backgroundColor: C.bg2 }]} onPress={() => setModal({ servico: s })}>
                  <Text style={{ color: C.muted, fontSize: 12 }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.btnSm, { backgroundColor: C.redLight, borderColor: '#F7C1C1' }]} onPress={() => remover(s)}>
                  <Text style={{ color: C.red, fontSize: 12 }}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }
      </ScrollView>

      <TouchableOpacity
        style={{ margin: 16, backgroundColor: C.pink, padding: 14, borderRadius: 10, alignItems: 'center' }}
        onPress={() => setModal({})}>
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>+ Novo Serviço</Text>
      </TouchableOpacity>

      {modal !== null && (
        <ModalServico
          servico={modal.servico}
          onClose={() => setModal(null)}
          onSalvo={() => { setModal(null); carregar(); }}
        />
      )}
    </SafeAreaView>
  );
}

function ModalServico({ servico, onClose, onSalvo }) {
  const [nome, setNome]         = useState(servico?.nome || '');
  const [valor, setValor]       = useState(servico?.valor?.toString() || '');
  const [dias, setDias]         = useState(servico?.intervalo_retorno_dias?.toString() || '30');

  const salvar = async () => {
    if (!nome.trim() || !valor || !dias) return Alert.alert('Atenção', 'Preencha todos os campos.');
    try {
      const body = { nome, valor: parseFloat(valor), intervalo_retorno_dias: parseInt(dias) };
      if (servico) await servicosApi.atualizar(servico.id, body);
      else await servicosApi.criar(body);
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[S.header, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Cancelar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>{servico ? 'Editar Serviço' : 'Novo Serviço'}</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={S.label}>Nome do serviço *</Text>
          <TextInput style={S.input} value={nome} onChangeText={setNome} placeholder="Ex: Limpeza de Pele" />
          <Text style={S.label}>Valor (R$) *</Text>
          <TextInput style={S.input} value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="0,00" />
          <Text style={S.label}>Retorno ideal (dias) *</Text>
          <TextInput style={S.input} value={dias} onChangeText={setDias} keyboardType="number-pad" placeholder="30" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
