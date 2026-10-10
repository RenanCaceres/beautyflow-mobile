import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { clientesApi, servicosApi } from '../../src/services/api';
import { C, S, fmt, fmtData } from '../../src/theme';

export default function CadastrosScreen() {
  const [secao, setSecao]           = useState('clientes'); // 'clientes' | 'servicos'
  const [clientes, setClientes]     = useState([]);
  const [servicos, setServicos]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [busca, setBusca]           = useState('');
  const [modalCliente, setModalCliente] = useState(null);
  const [modalServico, setModalServico] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const [cls, svs] = await Promise.all([
        clientesApi.listar().catch(() => []),
        servicosApi.listar().catch(() => []),
      ]);
      setClientes(cls || []);
      setServicos(svs || []);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const removerCliente = (c) => {
    Alert.alert('Confirmar', `Remover ${c.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await clientesApi.excluir(c.id);
            carregar();
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  };

  const removerServico = (s) => {
    Alert.alert('Confirmar', `Remover "${s.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await servicosApi.excluir(s.id);
            carregar();
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  };

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone || '').includes(busca)
  );

  const servicosFiltrados = servicos.filter((s) =>
    s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const iniciais = (nome) =>
    (nome || '').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      {/* Top Header */}
      <View style={S.header}>
        <View>
          <Text style={S.headerSub}>Gestão da Agenda</Text>
          <Text style={S.headerTitle}>Cadastros</Text>
        </View>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: C.pink,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 14,
            shadowColor: C.pink,
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 3,
          }}
          onPress={() => secao === 'clientes' ? setModalCliente({}) : setModalServico({})}
        >
          <Feather name={secao === 'clientes' ? 'user-plus' : 'plus-circle'} size={15} color="white" />
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>
            {secao === 'clientes' ? 'Nova Cliente' : 'Novo Serviço'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Switcher Clientes / Serviços */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: 'white',
          padding: 4,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
        }}>
          <TouchableOpacity
            onPress={() => setSecao('clientes')}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 11,
              alignItems: 'center',
              backgroundColor: secao === 'clientes' ? C.pink : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: secao === 'clientes' ? 'white' : C.muted,
            }}>
              Clientes ({clientes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSecao('servicos')}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 11,
              alignItems: 'center',
              backgroundColor: secao === 'servicos' ? C.pink : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: secao === 'servicos' ? 'white' : C.muted,
            }}>
              Serviços ({servicos.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de Busca */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 13,
        }}>
          <Feather name="search" size={16} color={C.hint} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 11,
              paddingHorizontal: 10,
              fontSize: 13,
              color: C.text,
            }}
            placeholder={secao === 'clientes' ? 'Buscar cliente por nome ou telefone...' : 'Buscar procedimento...'}
            placeholderTextColor={C.hint}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Feather name="x-circle" size={16} color={C.hint} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={S.content} contentContainerStyle={{ paddingTop: 2, paddingBottom: 32 }}>
        {loading ? (
          <ActivityIndicator color={C.pink} style={{ marginTop: 48 }} />
        ) : secao === 'clientes' ? (
          clientesFiltrados.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Feather name="users" size={32} color={C.pinkMid} />
              <Text style={[S.muted, { marginTop: 10 }]}>Nenhuma cliente encontrada.</Text>
            </View>
          ) : (
            clientesFiltrados.map((c) => (
              <View key={c.id} style={S.card}>
                <View style={S.row}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: C.pinkLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: C.pinkDark, fontWeight: '700', fontSize: 14 }}>
                      {iniciais(c.nome)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.bold, { fontSize: 14 }]}>{c.nome}</Text>
                    <Text style={[S.hint, { marginTop: 2 }]}>{c.telefone}</Text>
                    {c.ultimo_servico && (
                      <Text style={{ fontSize: 11, color: C.pinkDark, fontWeight: '600', marginTop: 3 }}>
                        Último: {c.ultimo_servico} {c.ultimo_atendimento ? `(${fmtData(c.ultimo_atendimento)})` : ''}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: C.bg2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => setModalCliente({ cliente: c })}
                  >
                    <Feather name="edit-2" size={14} color={C.pinkDark} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: C.redLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => removerCliente(c)}
                  >
                    <Feather name="trash-2" size={14} color={C.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          servicosFiltrados.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Feather name="scissors" size={32} color={C.pinkMid} />
              <Text style={[S.muted, { marginTop: 10 }]}>Nenhum serviço encontrado.</Text>
            </View>
          ) : (
            servicosFiltrados.map((s) => (
              <View key={s.id} style={S.card}>
                <View style={S.between}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[S.bold, { fontSize: 15 }]}>{s.nome}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <Feather name="refresh-cw" size={12} color={C.pink} />
                      <Text style={S.hint}>Ciclo de retorno ideal: {s.intervalo_retorno_dias} dias</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.green, fontWeight: '700', fontSize: 16 }}>
                    {fmt(s.valor)}
                  </Text>
                </View>

                <View style={[S.row, { marginTop: 12, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 }]}>
                  <TouchableOpacity
                    style={[S.btnSm, { backgroundColor: C.bg2, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 5 }]}
                    onPress={() => setModalServico({ servico: s })}
                  >
                    <Feather name="edit-2" size={12} color={C.pinkDark} />
                    <Text style={{ color: C.pinkDark, fontSize: 12, fontWeight: '600' }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.btnSm, { backgroundColor: C.redLight, borderColor: '#F7C1C1', flexDirection: 'row', alignItems: 'center', gap: 5 }]}
                    onPress={() => removerServico(s)}
                  >
                    <Feather name="trash-2" size={12} color={C.red} />
                    <Text style={{ color: C.red, fontSize: 12, fontWeight: '600' }}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {modalCliente !== null && (
        <ModalCliente
          cliente={modalCliente.cliente}
          onClose={() => setModalCliente(null)}
          onSalvo={() => { setModalCliente(null); carregar(); }}
        />
      )}

      {modalServico !== null && (
        <ModalServico
          servico={modalServico.servico}
          onClose={() => setModalServico(null)}
          onSalvo={() => { setModalServico(null); carregar(); }}
        />
      )}
    </SafeAreaView>
  );
}

function ModalCliente({ cliente, onClose, onSalvo }) {
  const [nome, setNome]         = useState(cliente?.nome || '');
  const [telefone, setTelefone] = useState(cliente?.telefone || '');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'Informe o nome da cliente.');
    if (!telefone.trim()) return Alert.alert('Atenção', 'Informe o telefone / WhatsApp.');
    setSalvando(true);
    try {
      if (cliente) await clientesApi.atualizar(cliente.id, { nome: nome.trim(), telefone: telefone.trim() });
      else await clientesApi.criar({ nome: nome.trim(), telefone: telefone.trim() });
      onSalvo();
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(92,58,71,0.35)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          paddingBottom: 34,
        }}>
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: C.pinkMid, alignSelf: 'center', marginBottom: 14 }} />
          <View style={[S.between, { marginBottom: 16 }]}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.hint, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Cadastro de Cliente
              </Text>
              <Text style={S.headerTitle}>{cliente ? 'Editar Cliente' : 'Nova Cliente'}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="x" size={16} color={C.muted} />
            </TouchableOpacity>
          </View>

          <Text style={S.label}>Nome completo *</Text>
          <TextInput
            style={S.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Maria da Silva"
            placeholderTextColor={C.hint}
          />

          <Text style={S.label}>Telefone / WhatsApp *</Text>
          <TextInput
            style={S.input}
            value={telefone}
            onChangeText={setTelefone}
            placeholder="(43) 99999-0000"
            placeholderTextColor={C.hint}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[S.btnPrimary, { marginTop: 6, opacity: salvando ? 0.7 : 1 }]}
            onPress={salvar}
            disabled={salvando}
          >
            <Text style={S.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar Cliente'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ModalServico({ servico, onClose, onSalvo }) {
  const [nome, setNome]         = useState(servico?.nome || '');
  const [valor, setValor]       = useState(servico?.valor?.toString() || '');
  const [dias, setDias]         = useState(servico?.intervalo_retorno_dias?.toString() || '21');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!nome.trim() || !valor || !dias) {
      return Alert.alert('Atenção', 'Preencha nome, valor e prazo de retorno.');
    }
    setSalvando(true);
    try {
      const body = {
        nome: nome.trim(),
        valor: parseFloat(String(valor).replace(',', '.')),
        intervalo_retorno_dias: parseInt(dias, 10),
      };
      if (servico) await servicosApi.atualizar(servico.id, body);
      else await servicosApi.criar(body);
      onSalvo();
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(92,58,71,0.35)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          paddingBottom: 34,
        }}>
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: C.pinkMid, alignSelf: 'center', marginBottom: 14 }} />
          <View style={[S.between, { marginBottom: 16 }]}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.hint, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Catálogo de Procedimentos
              </Text>
              <Text style={S.headerTitle}>{servico ? 'Editar Serviço' : 'Novo Serviço'}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="x" size={16} color={C.muted} />
            </TouchableOpacity>
          </View>

          <Text style={S.label}>Nome do procedimento *</Text>
          <TextInput
            style={S.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Design de Sobrancelha com Henna"
            placeholderTextColor={C.hint}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={S.label}>Valor (R$) *</Text>
              <TextInput
                style={S.input}
                value={valor}
                onChangeText={setValor}
                keyboardType="decimal-pad"
                placeholder="45,00"
                placeholderTextColor={C.hint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.label}>Retorno (dias) *</Text>
              <TextInput
                style={S.input}
                value={dias}
                onChangeText={setDias}
                keyboardType="number-pad"
                placeholder="21"
                placeholderTextColor={C.hint}
              />
            </View>
          </View>

          <Text style={S.label}>Sugestões rápidas de ciclo</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {['15', '21', '30', '45'].map((d) => {
              const ativo = dias === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDias(d)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: ativo ? C.pink : C.border,
                    backgroundColor: ativo ? C.pinkLight : C.bg,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: ativo ? C.pinkDark : C.muted }}>
                    {d} dias
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[S.btnPrimary, { opacity: salvando ? 0.7 : 1 }]}
            onPress={salvar}
            disabled={salvando}
          >
            <Text style={S.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar Serviço'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
