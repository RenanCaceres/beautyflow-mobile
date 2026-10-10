import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientesApi } from '../../src/services/api';
import { C, S, fmtData } from '../../src/theme';

export default function ClientesScreen() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busca, setBusca]       = useState('');
  const [modal, setModal]       = useState(null);

  const carregar = async () => {
    setLoading(true);
    try { setClientes(await clientesApi.listar()); }
    catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const remover = (c) => {
    Alert.alert('Confirmar', `Remover ${c.nome}?`, [
      { text: 'Cancelar' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await clientesApi.excluir(c.id); carregar(); }
        catch (e) { Alert.alert('Erro', e.message); }
      }},
    ]);
  };

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca)
  );

  const iniciais = (nome) => nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      <View style={{ padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TextInput style={[S.input, { marginBottom: 0 }]} placeholder="Buscar cliente..." value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView style={S.content}>
        {loading ? <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} /> :
          filtrados.length === 0 ? (
            <Text style={[S.muted, { textAlign: 'center', marginTop: 60 }]}>Nenhuma cliente encontrada.</Text>
          ) : filtrados.map((c) => (
            <View key={c.id} style={S.card}>
              <View style={S.row}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.pinkLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.pinkDark, fontWeight: '600', fontSize: 13 }}>{iniciais(c.nome)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.bold, { fontSize: 14 }]}>{c.nome}</Text>
                  <Text style={S.hint}>{c.telefone}</Text>
                  {c.ultimo_servico && <Text style={S.hint}>Último: {c.ultimo_servico}</Text>}
                </View>
              </View>
              <View style={[S.row, { marginTop: 10, justifyContent: 'flex-end' }]}>
                <TouchableOpacity style={[S.btnSm, { marginRight: 8, backgroundColor: C.bg2 }]} onPress={() => setModal({ cliente: c })}>
                  <Text style={{ color: C.muted, fontSize: 12 }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.btnSm, { backgroundColor: C.redLight, borderColor: '#F7C1C1' }]} onPress={() => remover(c)}>
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
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>+ Nova Cliente</Text>
      </TouchableOpacity>

      {modal !== null && (
        <ModalCliente
          cliente={modal.cliente}
          onClose={() => setModal(null)}
          onSalvo={() => { setModal(null); carregar(); }}
        />
      )}
    </SafeAreaView>
  );
}

function ModalCliente({ cliente, onClose, onSalvo }) {
  const [nome, setNome]         = useState(cliente?.nome || '');
  const [telefone, setTelefone] = useState(cliente?.telefone || '');

  const salvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'Informe o nome.');
    if (!telefone.trim()) return Alert.alert('Atenção', 'Informe o telefone.');
    try {
      if (cliente) await clientesApi.atualizar(cliente.id, { nome, telefone });
      else await clientesApi.criar({ nome, telefone });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[S.header, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Cancelar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>{cliente ? 'Editar Cliente' : 'Nova Cliente'}</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={S.label}>Nome completo *</Text>
          <TextInput style={S.input} value={nome} onChangeText={setNome} placeholder="Ex: Maria da Silva" />
          <Text style={S.label}>Telefone / WhatsApp *</Text>
          <TextInput style={S.input} value={telefone} onChangeText={setTelefone} placeholder="(43) 9 9000-0000" keyboardType="phone-pad" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
