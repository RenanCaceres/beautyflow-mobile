import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { caixaApi, consumoApi } from '../../src/services/api';
import { sincronizarTodasNotificacoes } from '../../src/services/notifications';
import { C, S, fmt, fmtData } from '../../src/theme';

const MESES = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function CaixaScreen() {
  const agora = new Date();
  const [abaInterna, setAbaInterna] = useState('vendas'); // 'vendas' | 'despesas'
  const [periodo, setPeriodo]       = useState('mes');
  const [mes, setMes]               = useState(agora.getMonth() + 1);
  const [ano, setAno]               = useState(agora.getFullYear());
  const [dados, setDados]           = useState(null);
  const [despesas, setDespesas]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalDespesa, setModalDespesa] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const params = { periodo, mes, ano, dia: agora.toISOString().slice(0, 10) };
      const [rel, cons] = await Promise.all([
        caixaApi.relatorio(params),
        consumoApi.listar(mes, ano),
      ]);
      setDados(rel);
      setDespesas(cons);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [periodo, mes, ano])
  );

  const removerDespesa = (item) => {
    Alert.alert('Confirmar', `Remover "${item.produto}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await consumoApi.excluir(item.id);
          carregar();
          sincronizarTodasNotificacoes();
        },
      },
    ]);
  };

  // Dados para o Gráfico de Torres: Entradas × Saídas
  const maxValFinanceiro = dados
    ? Math.max(
        ...dados.entradas.map((e) => parseFloat(e.total || 0)),
        ...dados.saidas.map((s) => parseFloat(s.total || 0)),
        1
      )
    : 1;

  const periodos = dados
    ? [
        ...new Set([
          ...dados.entradas.map((e) => String(e.periodo)),
          ...dados.saidas.map((s) => String(s.periodo)),
        ]),
      ]
        .sort((a, b) => Number(a) - Number(b))
        .slice(0, 8)
    : [];

  // Dados para o Gráfico de Torres: Clientes Atendidas nos Meses
  const atendimentosMapa = new Map();
  if (Array.isArray(dados?.atendimentosPorMes)) {
    for (const row of dados.atendimentosPorMes) {
      atendimentosMapa.set(Number(row.mes), {
        atendimentos: Number(row.atendimentos || 0),
        clientes: Number(row.clientes || 0),
      });
    }
  }
  const mesesTorre = Array.from({ length: 12 }, (_, idx) => {
    const mNum = idx + 1;
    const item = atendimentosMapa.get(mNum) || { atendimentos: 0, clientes: 0 };
    return {
      mes: mNum,
      nome: MESES[mNum],
      qtd: item.atendimentos,
      clientesUnicas: item.clientes,
    };
  });
  const maxAtendimentos = Math.max(...mesesTorre.map((m) => m.qtd), 1);
  const totalAtendimentosAno = mesesTorre.reduce((acc, m) => acc + m.qtd, 0);

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      {/* Subcabeçalho com alternador Vendas vs Despesas */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            { k: 'vendas',   l: 'Visão Geral & Gráficos' },
            { k: 'despesas', l: `Despesas (${despesas.length})` },
          ].map((op) => {
            const ativo = abaInterna === op.k;
            return (
              <TouchableOpacity
                key={op.k}
                onPress={() => setAbaInterna(op.k)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: ativo ? C.pink : C.pinkLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: ativo ? 'white' : C.pinkDark,
                  }}
                >
                  {op.l}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {abaInterna === 'despesas' && (
          <TouchableOpacity
            onPress={() => setModalDespesa(true)}
            style={{
              backgroundColor: C.pink,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 99,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>+ Despesa</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={S.content}>
        {/* Seletor de mês horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {MESES.slice(1).map((m, i) => {
            const ativo = mes === i + 1;
            return (
              <TouchableOpacity
                key={i}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                  borderRadius: 99,
                  backgroundColor: ativo ? C.pink : 'white',
                  borderWidth: 1,
                  borderColor: ativo ? C.pink : C.border,
                }}
                onPress={() => setMes(i + 1)}
              >
                <Text
                  style={{
                    color: ativo ? 'white' : C.muted,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} />
        ) : !dados ? null : (
          <>
            {/* Card Principal Clean de Resumo do Mês */}
            <View style={[S.card, { padding: 18, marginBottom: 14 }]}>
              <View style={S.between}>
                <Text style={{ fontSize: 12, color: C.muted, fontWeight: '500' }}>
                  Lucro líquido ({MESES[mes]}/{ano})
                </Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {['dia', 'mes', 'ano'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPeriodo(p)}
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 3,
                        borderRadius: 99,
                        backgroundColor: periodo === p ? C.pinkLight : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: periodo === p ? C.pinkDark : C.hint,
                        }}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: dados.totais.lucro >= 0 ? C.text : C.red,
                  marginTop: 4,
                }}
              >
                {fmt(dados.totais.lucro)}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: C.border,
                }}
              >
                <View style={{ flex: 1, backgroundColor: C.greenLight, padding: 11, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, color: C.green, fontWeight: '500' }}>Recebido</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: C.green, marginTop: 2 }}>
                    {fmt(dados.totais.entradas)}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.redLight, padding: 11, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, color: C.red, fontWeight: '500' }}>Gastos</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: C.red, marginTop: 2 }}>
                    {fmt(dados.totais.saidas)}
                  </Text>
                </View>
              </View>
            </View>

            {abaInterna === 'vendas' ? (
              <>
                {/* GRÁFICO DE TORRES 1: Clientes Atendidas por Mês */}
                <View style={[S.card, { marginBottom: 14 }]}>
                  <View style={[S.between, { marginBottom: 4 }]}>
                    <Text style={[S.bold, { fontSize: 14 }]}>Clientes Atendidas por Mês</Text>
                    <Text style={{ fontSize: 12, color: C.pinkDark, fontWeight: '600' }}>
                      {totalAtendimentosAno} no ano
                    </Text>
                  </View>
                  <Text style={[S.hint, { marginBottom: 14 }]}>
                    Quantidade de atendimentos concluídos em cada mês de {ano}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      height: 135,
                      gap: 4,
                      paddingTop: 16,
                    }}
                  >
                    {mesesTorre.map((item) => {
                      const alturaPct = item.qtd > 0 ? Math.max((item.qtd / maxAtendimentos) * 95, 8) : 3;
                      const selecionado = item.mes === mes;
                      return (
                        <TouchableOpacity
                          key={item.mes}
                          activeOpacity={0.8}
                          onPress={() => setMes(item.mes)}
                          style={{ flex: 1, alignItems: 'center' }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: selecionado ? C.pinkDark : C.muted,
                              marginBottom: 4,
                            }}
                          >
                            {item.qtd > 0 ? item.qtd : ''}
                          </Text>
                          <View
                            style={{
                              width: '68%',
                              height: alturaPct,
                              backgroundColor:
                                item.qtd === 0
                                  ? C.border
                                  : selecionado
                                    ? C.pink
                                    : C.pinkSoft,
                              borderTopLeftRadius: 6,
                              borderTopRightRadius: 6,
                              borderBottomLeftRadius: 3,
                              borderBottomRightRadius: 3,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: selecionado ? '700' : '500',
                              color: selecionado ? C.pink : C.hint,
                              marginTop: 5,
                            }}
                          >
                            {item.nome}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* GRÁFICO DE TORRES 2: Entradas × Saídas */}
                {periodos.length > 0 && (
                  <View style={[S.card, { marginBottom: 14 }]}>
                    <Text style={[S.bold, { fontSize: 14, marginBottom: 4 }]}>
                      Entradas × Saídas ({periodo === 'mes' ? MESES[mes] : periodo})
                    </Text>
                    <Text style={[S.hint, { marginBottom: 14 }]}>
                      Comparativo financeiro por período
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 }}>
                      {periodos.map((p) => {
                        const e = dados.entradas.find((x) => String(x.periodo) === p);
                        const s = dados.saidas.find((x) => String(x.periodo) === p);
                        const hE = e ? Math.max((parseFloat(e.total) / maxValFinanceiro) * 95, 5) : 0;
                        const hS = s ? Math.max((parseFloat(s.total) / maxValFinanceiro) * 95, 5) : 0;
                        return (
                          <View key={p} style={{ flex: 1, alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                              <View
                                style={{
                                  width: 10,
                                  height: hE,
                                  backgroundColor: C.green,
                                  borderTopLeftRadius: 5,
                                  borderTopRightRadius: 5,
                                }}
                              />
                              <View
                                style={{
                                  width: 10,
                                  height: hS,
                                  backgroundColor: C.red,
                                  borderTopLeftRadius: 5,
                                  borderTopRightRadius: 5,
                                }}
                              />
                            </View>
                            <Text style={{ fontSize: 10, color: C.hint, marginTop: 5 }}>
                              {periodo === 'ano' ? MESES[Number(p)] || p : p}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <View style={[S.row, { marginTop: 12 }]}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green }} />
                      <Text style={[S.hint, { marginRight: 12 }]}>Recebido</Text>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.red }} />
                      <Text style={S.hint}>Gastos</Text>
                    </View>
                  </View>
                )}

                {/* Detalhamento Clean */}
                <View style={[S.card, { marginBottom: 24 }]}>
                  <Text style={[S.bold, { fontSize: 14, marginBottom: 8 }]}>Movimentações</Text>
                  {dados.entradas.length === 0 && dados.saidas.length === 0 ? (
                    <Text style={S.hint}>Nenhuma movimentação registrada neste período.</Text>
                  ) : (
                    <>
                      {dados.entradas.map((e, i) => (
                        <View
                          key={`e-${i}`}
                          style={[
                            S.between,
                            { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
                          ]}
                        >
                          <Text style={S.muted}>
                            Entrada ({periodo === 'mes' ? `Dia ${e.periodo}` : `Período ${e.periodo}`})
                          </Text>
                          <Text style={{ color: C.green, fontWeight: '600' }}>+ {fmt(e.total)}</Text>
                        </View>
                      ))}
                      {dados.saidas.map((s, i) => (
                        <View
                          key={`s-${i}`}
                          style={[
                            S.between,
                            { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
                          ]}
                        >
                          <Text style={S.muted}>
                            Saída ({periodo === 'mes' ? `Dia ${s.periodo}` : `Período ${s.periodo}`})
                          </Text>
                          <Text style={{ color: C.red, fontWeight: '600' }}>- {fmt(s.total)}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              </>
            ) : (
              /* Aba Interna: Lista de Despesas / Consumo */
              <View style={{ marginBottom: 24 }}>
                {despesas.length === 0 ? (
                  <View style={[S.card, { alignItems: 'center', paddingVertical: 30 }]}>
                    <Text style={S.muted}>Nenhuma despesa registrada em {MESES[mes]}.</Text>
                    <TouchableOpacity
                      onPress={() => setModalDespesa(true)}
                      style={{
                        marginTop: 12,
                        backgroundColor: C.pinkLight,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 99,
                      }}
                    >
                      <Text style={{ color: C.pinkDark, fontWeight: '600', fontSize: 13 }}>
                        + Registrar despesa
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  despesas.map((item) => (
                    <View key={item.id} style={[S.card, S.between]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[S.bold, { fontSize: 14 }]}>{item.produto}</Text>
                        <Text style={S.hint}>{fmtData(item.data)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={{ color: C.red, fontWeight: '600' }}>- {fmt(item.valor)}</Text>
                        <TouchableOpacity onPress={() => removerDespesa(item)}>
                          <Text style={{ color: C.hint, fontSize: 12 }}>Remover</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {modalDespesa && (
        <ModalNovaDespesa
          onClose={() => setModalDespesa(false)}
          onSalvo={() => {
            setModalDespesa(false);
            carregar();
            sincronizarTodasNotificacoes();
          }}
        />
      )}
    </SafeAreaView>
  );
}

function ModalNovaDespesa({ onClose, onSalvo }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [produto, setProduto] = useState('');
  const [valor, setValor]     = useState('');
  const [data, setData]       = useState(hoje);

  const salvar = async () => {
    if (!produto.trim() || !valor) return Alert.alert('Atenção', 'Preencha todos os campos.');
    try {
      await consumoApi.criar({ produto: produto.trim(), valor: parseFloat(valor), data });
      onSalvo();
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={S.header}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Fechar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Nova Despesa</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>
        <View style={{ padding: 18 }}>
          <Text style={S.label}>Produto ou despesa *</Text>
          <TextInput
            style={S.input}
            value={produto}
            onChangeText={setProduto}
            placeholder="Ex: Ácido Glicólico 30%"
          />
          <Text style={S.label}>Valor (R$) *</Text>
          <TextInput
            style={S.input}
            value={valor}
            onChangeText={setValor}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <Text style={S.label}>Data (AAAA-MM-DD) *</Text>
          <TextInput
            style={S.input}
            value={data}
            onChangeText={setData}
            placeholder="AAAA-MM-DD"
          />
          <TouchableOpacity style={[S.btnPrimary, { marginTop: 8 }]} onPress={salvar}>
            <Text style={S.btnPrimaryText}>Salvar Despesa</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
