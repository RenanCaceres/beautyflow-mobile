import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Linking,
  ActivityIndicator, Modal, TextInput, Alert, SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { retornoApi, marketingApi, whatsappApi } from '../../src/services/api';
import { C, S, fmtData } from '../../src/theme';

const FILTROS = [
  { key: 'todas',    label: 'Todas' },
  { key: 'hoje',     label: 'Hoje' },
  { key: '3dias',    label: '3 dias' },
  { key: '7dias',    label: '7 dias' },
  { key: 'vencidas', label: 'Vencidas' },
];

function badgeInfo(dias) {
  if (dias < 0)   return { bg: C.redLight,   text: C.red,       label: `Vencido há ${Math.abs(dias)}d` };
  if (dias === 0) return { bg: C.pinkLight,  text: C.pink,      label: 'Vence hoje' };
  if (dias <= 3)  return { bg: C.amberLight, text: C.amberDark, label: `Em ${dias}d` };
  return            { bg: C.bg2,         text: C.muted,     label: `Em ${dias}d` };
}

// Modal que mostra todos os serviços feitos pela cliente, datas e dias vencidos
function ModalServicosCliente({ visible, cliente, onFechar, onGerarIA }) {
  if (!cliente) return null;
  const servicos = Array.isArray(cliente.servicos) ? cliente.servicos : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <RNSafeAreaView style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: 16,
          maxHeight: '82%',
        }}>
          <View style={[S.between, { marginBottom: 6 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[S.bold, { fontSize: 16, color: C.text }]}>{cliente.nome}</Text>
              <Text style={S.hint}>Histórico de serviços realizados e prazos de validade</Text>
            </View>
            <TouchableOpacity onPress={onFechar} style={{ padding: 6 }}>
              <Text style={{ fontSize: 16, color: C.muted, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ marginTop: 8 }}>
            {servicos.length === 0 ? (
              <Text style={[S.muted, { textAlign: 'center', marginVertical: 24 }]}>
                Nenhum serviço realizado registrado.
              </Text>
            ) : (
              servicos.map((srv, idx) => {
                const badge = badgeInfo(srv.dias_para_retorno);
                const vencido = srv.dias_para_retorno < 0;
                const diasVencidos = srv.dias_vencidos ?? (vencido ? Math.abs(srv.dias_para_retorno) : 0);

                return (
                  <View
                    key={`${srv.servico_id}-${idx}`}
                    style={{
                      backgroundColor: idx === 0 ? '#fff9fb' : C.bg,
                      borderWidth: 1,
                      borderColor: idx === 0 ? C.pink : C.border,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 10,
                    }}>
                    <View style={S.between}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[S.bold, { fontSize: 14, color: C.text }]}>{srv.servico_nome}</Text>
                          {idx === 0 && (
                            <View style={{ backgroundColor: C.pinkLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 10, color: C.pinkDark, fontWeight: '600' }}>MAIS VENCIDO</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[S.hint, { marginTop: 2 }]}>
                          Validade do serviço: {srv.intervalo_retorno_dias} dias
                        </Text>
                      </View>
                      <View style={{ backgroundColor: badge.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                        <Text style={{ color: badge.text, fontSize: 11, fontWeight: '600' }}>{badge.label}</Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, gap: 3 }}>
                      <Text style={{ fontSize: 12, color: C.text }}>
                        📅 <Text style={S.bold}>Realizado em:</Text> {fmtData(srv.ultimo_atendimento)}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.text }}>
                        ⏳ <Text style={S.bold}>Vencimento ideal:</Text> {fmtData(srv.data_retorno_ideal)}
                      </Text>
                      <Text style={{ fontSize: 12, color: vencido ? C.red : srv.dias_para_retorno === 0 ? C.pinkDark : C.muted, fontWeight: '600' }}>
                        {vencido
                          ? `⚠️ ${diasVencidos} dia(s) vencido(s)`
                          : srv.dias_para_retorno === 0
                            ? '📌 Vence exatamente hoje (0 dias vencidos)'
                            : `✅ Dentro da validade (faltam ${srv.dias_para_retorno} dias)`}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                      <TouchableOpacity
                        style={{ backgroundColor: C.pink, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                        onPress={() => {
                          onFechar();
                          onGerarIA(cliente, srv);
                        }}>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                          ✨ Gerar mensagem única (IA + WAHA)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity
            style={[S.btnGhost, { marginTop: 8 }]}
            onPress={onFechar}>
            <Text style={S.btnGhostText}>Fechar</Text>
          </TouchableOpacity>
        </RNSafeAreaView>
      </View>
    </Modal>
  );
}

// Modal de revisão da mensagem única gerada por IA (clima + datas comemorativas + dia da semana)
function ModalMensagemIA({
  visible, gerando, enviandoWaha, texto, setTexto, contexto,
  onEnviarWaha, onEnviarWhatsAppDireto, onFechar,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <RNSafeAreaView style={{ backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
          <Text style={[S.bold, { fontSize: 16, marginBottom: 2 }]}>Mensagem única gerada com IA</Text>
          <Text style={[S.hint, { marginBottom: 10 }]}>
            Personalizada com nome na agenda, clima da cidade, dia da semana e datas comemorativas.
          </Text>

          {contexto && !gerando && (
            <View style={{ backgroundColor: C.bg2, padding: 10, borderRadius: 8, marginBottom: 10, gap: 2 }}>
              <Text style={{ fontSize: 11, color: C.muted }}>🌤️ <Text style={S.bold}>Clima:</Text> {contexto.clima}</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>📆 <Text style={S.bold}>Semana:</Text> {contexto.diaSemana}</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>🎉 <Text style={S.bold}>Datas:</Text> {contexto.datasComemorativas}</Text>
            </View>
          )}

          {gerando ? (
            <ActivityIndicator color={C.pink} style={{ marginVertical: 30 }} />
          ) : (
            <TextInput
              style={[S.input, { height: 115, textAlignVertical: 'top' }]}
              multiline
              value={texto}
              onChangeText={setTexto}
            />
          )}

          <View style={{ gap: 8, marginTop: 6 }}>
            <TouchableOpacity
              disabled={gerando || enviandoWaha || !texto}
              style={{
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: C.pink,
                alignItems: 'center',
                opacity: gerando || enviandoWaha || !texto ? 0.5 : 1,
              }}
              onPress={onEnviarWaha}>
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {enviandoWaha ? 'Enfileirando no WAHA...' : '🤖 Enviar pelo WAHA (Fila Anti-Ban)'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: C.bg2, alignItems: 'center' }}
                onPress={onFechar}>
                <Text style={{ color: C.muted, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={gerando || !texto}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 8,
                  backgroundColor: '#25D366',
                  alignItems: 'center',
                  opacity: gerando || !texto ? 0.5 : 1,
                }}
                onPress={onEnviarWhatsAppDireto}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Abrir WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNSafeAreaView>
      </View>
    </Modal>
  );
}

// Modal para revisar/selecionar quais clientes do lote automático de hoje devem receber a mensagem
function ModalConfirmarLoteAutomatico({
  visible, itens = [], selecionados = {}, onToggle, onConfirmar, onRejeitar, onFechar, processando,
}) {
  const qtdMarcados = Object.values(selecionados).filter(Boolean).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <RNSafeAreaView style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
          maxHeight: '84%',
        }}>
          <View style={[S.between, { marginBottom: 8 }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[S.bold, { fontSize: 16, color: C.text }]}>
                Confirmar Envio de Retorno ({qtdMarcados}/{itens.length})
              </Text>
              <Text style={S.hint}>
                Desmarque caso não queira enviar para alguma cliente hoje.
              </Text>
            </View>
            <TouchableOpacity onPress={onFechar} style={{ padding: 6 }}>
              <Text style={{ fontSize: 16, color: C.muted, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ marginVertical: 8 }}>
            {itens.map((item) => {
              const marcado = Boolean(selecionados[item.id]);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => onToggle(item.id)}
                  style={{
                    backgroundColor: marcado ? '#FFF9FB' : C.bg,
                    borderWidth: 1,
                    borderColor: marcado ? C.pink : C.border,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: marcado ? C.pink : C.hint,
                    backgroundColor: marcado ? C.pink : 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    {marcado && <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.bold, { fontSize: 14, color: C.text }]}>{item.cliente_nome}</Text>
                    <Text style={[S.hint, { marginBottom: 4 }]}>{item.telefone}</Text>
                    <Text style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>{item.texto}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              disabled={processando || qtdMarcados === 0}
              onPress={onConfirmar}
              style={{
                backgroundColor: C.pink,
                paddingVertical: 13,
                borderRadius: 10,
                alignItems: 'center',
                opacity: processando || qtdMarcados === 0 ? 0.5 : 1,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                {processando ? 'Autorizando envio...' : `✅ Autorizar e Enviar (${qtdMarcados})`}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                disabled={processando}
                onPress={onRejeitar}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: C.redLight,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: C.red, fontWeight: '700', fontSize: 13 }}>Não enviar hoje</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={processando}
                onPress={onFechar}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: C.bg2,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: C.muted, fontWeight: '600', fontSize: 13 }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNSafeAreaView>
      </View>
    </Modal>
  );
}

export default function RetornoScreen() {
  const [filtro, setFiltro]     = useState('todas');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Modal de detalhes de serviços feitos pela cliente
  const [clienteDetalhe, setClienteDetalhe] = useState(null);

  // Modal de geração de mensagem única com IA
  const [modalAberto, setModalAberto]   = useState(false);
  const [gerando, setGerando]           = useState(false);
  const [enviandoWaha, setEnviandoWaha] = useState(false);
  const [textoIA, setTextoIA]           = useState('');
  const [contextoIA, setContextoIA]     = useState(null);
  const [clienteAtual, setClienteAtual] = useState(null);
  const [servicoAtual, setServicoAtual] = useState(null);

  // Status da fila do WAHA, disparo em lote e confirmação do automático
  const [filaInfo, setFilaInfo]                   = useState(null);
  const [disparandoLote, setDisparandoLote]       = useState(false);
  const [modalConfirmarAuto, setModalConfirmarAuto] = useState(false);
  const [selecionadosAuto, setSelecionadosAuto]   = useState({});
  const [processandoAuto, setProcessandoAuto]     = useState(false);

  const carregarFila = async () => {
    try {
      const info = await whatsappApi.fila();
      setFilaInfo(info);
      const listaAprov = Array.isArray(info?.aguardandoAprovacao) ? info.aguardandoAprovacao : [];
      if (listaAprov.length > 0) {
        const mapa = {};
        listaAprov.forEach((it) => { mapa[it.id] = true; });
        setSelecionadosAuto(mapa);
      }
    } catch {
      // ignora silenciosamente se endpoint ainda não estiver ativo
    }
  };

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await retornoApi.listar(filtro);
      setClientes(lista);
      carregarFila();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [filtro]);

  const toggleItemAuto = (id) => {
    setSelecionadosAuto((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const aprovarEnvioAutomatico = async (idsCustom = null) => {
    const listaAprov = Array.isArray(filaInfo?.aguardandoAprovacao) ? filaInfo.aguardandoAprovacao : [];
    const idsParaAprovar = idsCustom || listaAprov.filter((it) => selecionadosAuto[it.id]).map((it) => it.id);
    if (idsParaAprovar.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos uma cliente para autorizar o envio.');
      return;
    }

    setProcessandoAuto(true);
    try {
      const r = await whatsappApi.aprovarRetornos(idsParaAprovar);
      setModalConfirmarAuto(false);
      await carregarFila();
      const cfg = r?.config;
      Alert.alert(
        'Envio autorizado!',
        `${r.aprovadas} mensagem(ns) liberada(s) para envio no WhatsApp` +
          (cfg ? ` com intervalo de segurança (${cfg.delayMinSegundos}s a ${cfg.delayMaxSegundos}s).` : '.')
      );
    } catch (e) {
      Alert.alert('Erro ao autorizar', e.message);
    } finally {
      setProcessandoAuto(false);
    }
  };

  const rejeitarEnvioAutomatico = () => {
    Alert.alert(
      'Cancelar envio de hoje?',
      'As mensagens automáticas preparadas hoje serão descartadas e não serão enviadas.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Sim, não enviar hoje',
          style: 'destructive',
          onPress: async () => {
            setProcessandoAuto(true);
            try {
              await whatsappApi.rejeitarRetornos();
              setModalConfirmarAuto(false);
              await carregarFila();
            } catch (e) {
              Alert.alert('Erro', e.message);
            } finally {
              setProcessandoAuto(false);
            }
          },
        },
      ]
    );
  };

  const enviarWhatsApp = (telefone, texto) => {
    const tel = telefone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${tel}?text=${encodeURIComponent(texto)}`);
  };

  const gerarComIA = async (cliente, servicoEscolhido = null) => {
    const srv = servicoEscolhido || {
      servico_id: cliente.servico_id,
      servico_nome: cliente.servico_nome,
      ultimo_atendimento: cliente.ultimo_atendimento,
      dias_para_retorno: cliente.dias_para_retorno,
      dias_vencidos: cliente.dias_vencidos,
    };

    setClienteAtual(cliente);
    setServicoAtual(srv);
    setModalAberto(true);
    setGerando(true);
    setTextoIA('');
    setContextoIA(null);

    try {
      const res = await marketingApi.gerarMensagemRetorno({
        nome: cliente.nome,
        servico: srv.servico_nome,
        diasAtraso: srv.dias_para_retorno < 0 ? Math.abs(srv.dias_para_retorno) : 0,
      });
      setTextoIA(res.mensagem || '');
      setContextoIA(res.contexto || null);
    } catch (e) {
      setTextoIA('');
      setModalAberto(false);
      Alert.alert('Erro', 'Não foi possível gerar a mensagem agora. Tente novamente em instantes.');
    } finally {
      setGerando(false);
    }
  };

  const confirmarEnvioWaha = async () => {
    if (!clienteAtual || !textoIA) return;
    setEnviandoWaha(true);
    try {
      const r = await whatsappApi.enviarRetorno({
        clienteId: clienteAtual.id,
        texto: textoIA,
        servicoId: servicoAtual?.servico_id || clienteAtual.servico_id,
        ultimoAtendimento: servicoAtual?.ultimo_atendimento || clienteAtual.ultimo_atendimento,
      });
      setModalAberto(false);
      carregarFila();
      const cfg = r?.config;
      Alert.alert(
        'Enfileirada no WAHA!',
        cfg
          ? `A mensagem para ${clienteAtual.nome} entrou na fila de envio com intervalo de segurança (${cfg.delayMinSegundos}s a ${cfg.delayMaxSegundos}s).`
          : `A mensagem para ${clienteAtual.nome} entrou na fila de envio do WAHA.`
      );
    } catch (e) {
      Alert.alert('Erro ao enfileirar no WAHA', e.message || 'Verifique a conexão com a API.');
    } finally {
      setEnviandoWaha(false);
    }
  };

  const confirmarEnvioWhatsAppDireto = () => {
    if (clienteAtual) enviarWhatsApp(clienteAtual.telefone, textoIA);
    setModalAberto(false);
  };

  const dispararLoteWaha = () => {
    const elegiveis = clientes.filter((c) => c.dias_para_retorno <= 0);
    if (elegiveis.length === 0) {
      Alert.alert('Nenhuma cliente vencida/hoje', 'Não há clientes com serviço vencido ou vencendo hoje nesta aba.');
      return;
    }

    Alert.alert(
      'Disparar Retornos via WAHA',
      `O Gemini vai consultar o clima da cidade, datas comemorativas e dia da semana para gerar uma mensagem ÚNICA para cada uma das ${elegiveis.length} cliente(s) vencidas/de hoje, enviando aos poucos com intervalo anti-ban.\n\nDeseja iniciar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, disparar',
          onPress: async () => {
            setDisparandoLote(true);
            try {
              const r = await whatsappApi.dispararRetornos({
                clienteIds: elegiveis.map((c) => c.id),
              });
              carregarFila();
              const cfg = r?.config;
              Alert.alert(
                'Disparo iniciado!',
                `${r.enfileiradas} mensagem(ns) única(s) gerada(s) e colocada(s) na fila do WAHA` +
                  (r.ignoradas > 0 ? ` (${r.ignoradas} já haviam sido enviadas anteriormente).` : '.') +
                  (cfg ? `\n\nIntervalo anti-ban: ${cfg.delayMinSegundos}s a ${cfg.delayMaxSegundos}s entre cada mensagem.` : '')
              );
            } catch (e) {
              Alert.alert('Erro no disparo WAHA', e.message || 'Falha ao enfileirar retornos.');
            } finally {
              setDisparandoLote(false);
            }
          },
        },
      ]
    );
  };

  const iniciais = (nome) => nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const pendentesFila = (filaInfo?.contadores?.pendente || 0) + (filaInfo?.contadores?.enviando || 0);
  const listaAguardando = Array.isArray(filaInfo?.aguardandoAprovacao) ? filaInfo.aguardandoAprovacao : [];

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: C.border, flexGrow: 0 }}
        contentContainerStyle={{ padding: 10, gap: 6 }}>
        {FILTROS.map((f) => (
          <TouchableOpacity key={f.key}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99,
              backgroundColor: filtro === f.key ? C.pink : C.bg2,
            }}
            onPress={() => setFiltro(f.key)}>
            <Text style={{ color: filtro === f.key ? 'white' : C.muted, fontWeight: '500', fontSize: 13 }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Card de Confirmação quando o Job Automático preparou mensagens e aguarda permissão da dona */}
      {listaAguardando.length > 0 && (
        <View style={{
          marginHorizontal: 14,
          marginTop: 10,
          padding: 13,
          borderRadius: 14,
          backgroundColor: '#FFF5F8',
          borderWidth: 1.5,
          borderColor: C.pink,
          gap: 8,
        }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.pinkDark }}>
              🔔 Posso enviar as mensagens de retorno de hoje? ({listaAguardando.length})
            </Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Clientes: {listaAguardando.map((i) => i.cliente_nome.split(' ')[0]).join(', ')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity
              disabled={processandoAuto}
              onPress={() => aprovarEnvioAutomatico(listaAguardando.map((i) => i.id))}
              style={{
                backgroundColor: C.pink,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 9,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                ✅ Sim, pode enviar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={processandoAuto}
              onPress={() => setModalConfirmarAuto(true)}
              style={{
                backgroundColor: 'white',
                borderWidth: 1,
                borderColor: C.pink,
                paddingHorizontal: 11,
                paddingVertical: 8,
                borderRadius: 9,
              }}
            >
              <Text style={{ color: C.pinkDark, fontSize: 12, fontWeight: '700' }}>
                👁️ Revisar / Escolher
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={processandoAuto}
              onPress={rejeitarEnvioAutomatico}
              style={{
                backgroundColor: C.redLight,
                paddingHorizontal: 11,
                paddingVertical: 8,
                borderRadius: 9,
              }}
            >
              <Text style={{ color: C.red, fontSize: 12, fontWeight: '700' }}>
                ✕ Não enviar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Barra WAHA de disparo manual / em lote com proteção anti-ban */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text }}>
            🤖 Automação WAHA + Gemini
          </Text>
          <Text style={S.hint}>
            {pendentesFila > 0
              ? `Enviando aos poucos: ${pendentesFila} na fila (${filaInfo?.config?.delayMinSegundos || 25}s–${filaInfo?.config?.delayMaxSegundos || 60}s)`
              : 'Gera msg única (clima + datas + semana) com range limit'}
          </Text>
        </View>
        <TouchableOpacity
          disabled={disparandoLote || loading}
          onPress={dispararLoteWaha}
          style={{
            backgroundColor: C.pinkDark,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            opacity: disparandoLote || loading ? 0.5 : 1,
          }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
            {disparandoLote ? 'Gerando...' : 'Disparar Vencidas'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={S.content}>
        {loading ? <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} /> :
          clientes.length === 0 ? (
            <Text style={[S.muted, { textAlign: 'center', marginTop: 60 }]}>Nenhuma cliente nesta categoria.</Text>
          ) : clientes.map((c) => {
            const badge = badgeInfo(c.dias_para_retorno);
            const qtdServicos = Array.isArray(c.servicos) ? c.servicos.length : 1;

            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.85}
                onPress={() => setClienteDetalhe(c)}
                style={S.card}>
                <View style={S.row}>
                  <View style={{
                    width: 38, height: 38, borderRadius: 19, backgroundColor: C.pinkLight,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Text style={{ color: C.pinkDark, fontWeight: '600', fontSize: 13 }}>{iniciais(c.nome)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[S.bold, { fontSize: 14, color: C.text }]}>{c.nome}</Text>
                    <Text style={{ fontSize: 12, color: C.pinkDark, fontWeight: '600', marginTop: 1 }}>
                      Mais vencido: {c.servico_nome}
                    </Text>
                    <Text style={S.hint}>Feito em: {fmtData(c.ultimo_atendimento)}</Text>
                    <Text style={S.hint}>
                      {c.dias_para_retorno < 0
                        ? `Vencido há ${Math.abs(c.dias_para_retorno)} dia(s) (ideal: ${fmtData(c.data_retorno_ideal)})`
                        : `Retorno ideal: ${fmtData(c.data_retorno_ideal)}`}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.pink, fontWeight: '600', marginTop: 4 }}>
                      📋 Toque para ver {qtdServicos > 1 ? `os ${qtdServicos} serviços realizados` : 'detalhes do serviço'} ▸
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={{ backgroundColor: badge.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                      <Text style={{ color: badge.text, fontSize: 11, fontWeight: '600' }}>{badge.label}</Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: C.pink, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                      onPress={() => gerarComIA(c)}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>✨ Gerar IA</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        }
      </ScrollView>

      <ModalServicosCliente
        visible={!!clienteDetalhe}
        cliente={clienteDetalhe}
        onFechar={() => setClienteDetalhe(null)}
        onGerarIA={(cli, srv) => gerarComIA(cli, srv)}
      />

      <ModalMensagemIA
        visible={modalAberto}
        gerando={gerando}
        enviandoWaha={enviandoWaha}
        texto={textoIA}
        setTexto={setTextoIA}
        contexto={contextoIA}
        onEnviarWaha={confirmarEnvioWaha}
        onEnviarWhatsAppDireto={confirmarEnvioWhatsAppDireto}
        onFechar={() => setModalAberto(false)}
      />

      <ModalConfirmarLoteAutomatico
        visible={modalConfirmarAuto}
        itens={listaAguardando}
        selecionados={selecionadosAuto}
        onToggle={toggleItemAuto}
        onConfirmar={() => aprovarEnvioAutomatico()}
        onRejeitar={rejeitarEnvioAutomatico}
        onFechar={() => setModalConfirmarAuto(false)}
        processando={processandoAuto}
      />
    </SafeAreaView>
  );
}
