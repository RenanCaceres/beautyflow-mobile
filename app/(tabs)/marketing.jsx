import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { marketingApi, clientesApi, whatsappApi } from '../../src/services/api';
import { C, S } from '../../src/theme';

// Substitui o placeholder {{nome}} (com ou sem espaços dentro das chaves)
// pelo primeiro nome da cliente.
function personalizar(texto, nomeCompleto) {
  const primeiroNome = String(nomeCompleto || '').trim().split(' ')[0];
  return String(texto || '').replace(/\{\{\s*nome\s*\}\}/gi, primeiroNome);
}

function BolhaChat({ role, texto, onConfirmar, confirmada }) {
  const isUser = role === 'user';
  return (
    <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <View style={{
        maxWidth: '85%',
        backgroundColor: isUser ? C.pink : 'white',
        borderWidth: isUser ? 0 : 1,
        borderColor: C.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 9,
      }}>
        <Text style={{ color: isUser ? 'white' : C.text, fontSize: 14, lineHeight: 20 }}>{texto}</Text>
      </View>
      {!isUser && (
        <TouchableOpacity
          onPress={onConfirmar}
          style={{
            marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: confirmada ? C.green : C.bg2,
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
          }}>
          <Text style={{ color: confirmada ? 'white' : C.muted, fontSize: 12, fontWeight: '600' }}>
            {confirmada ? '✓ Mensagem em uso' : '✓ Usar esta mensagem'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MarketingScreen() {
  const [mensagens, setMensagens] = useState([]); // { role: 'user'|'model', texto }
  const [input, setInput]         = useState('');
  const [enviando, setEnviando]   = useState(false);

  const [mensagemConfirmada, setMensagemConfirmada] = useState(null); // texto com {{nome}}
  const [clientes, setClientes]                     = useState([]);
  const [loadingClientes, setLoadingClientes]       = useState(false);
  const [selecionadas, setSelecionadas]             = useState(new Set());
  const [busca, setBusca]                           = useState('');
  const [disparando, setDisparando]                 = useState(false);
  const [filaInfo, setFilaInfo]                     = useState(null);

  const scrollRef = useRef(null);

  const atualizarFila = async () => {
    try {
      const info = await whatsappApi.fila();
      setFilaInfo(info);
    } catch {
      // ignora erro se o servidor ainda não estiver com a rota ativa
    }
  };

  useEffect(() => {
    if (!mensagemConfirmada) return;
    atualizarFila();
    const timer = setInterval(atualizarFila, 5000);
    return () => clearInterval(timer);
  }, [mensagemConfirmada]);

  const enviarPrompt = async () => {
    const texto = input.trim();
    if (!texto || enviando) return;

    const novasMensagens = [...mensagens, { role: 'user', texto }];
    setMensagens(novasMensagens);
    setInput('');
    setEnviando(true);
    try {
      const { resposta } = await marketingApi.chat(novasMensagens);
      setMensagens([...novasMensagens, { role: 'model', texto: resposta }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setMensagens([...novasMensagens, { role: 'model', texto: '⚠️ Não consegui gerar agora, tenta de novo.' }]);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarMensagem = async (texto) => {
    setMensagemConfirmada(texto);
    setSelecionadas(new Set());
    setBusca('');
    setLoadingClientes(true);
    try {
      const lista = await clientesApi.listar();
      setClientes(lista);
    } catch (e) {
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  const trocarMensagem = () => {
    setMensagemConfirmada(null);
    setClientes([]);
    setSelecionadas(new Set());
    setBusca('');
  };

  const alternarCliente = (id) => {
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const clientesFiltradas = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.trim().toLowerCase()) ||
    String(c.telefone || '').includes(busca.trim())
  );

  const todasSelecionadas =
    clientesFiltradas.length > 0 &&
    clientesFiltradas.every((c) => selecionadas.has(c.id));

  const alternarTodas = () => {
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (todasSelecionadas) {
        clientesFiltradas.forEach((c) => novo.delete(c.id));
      } else {
        clientesFiltradas.forEach((c) => novo.add(c.id));
      }
      return novo;
    });
  };

  const enviarCampanhaWaha = () => {
    const ids = Array.from(selecionadas);
    if (ids.length === 0) {
      Alert.alert('Selecione as clientes', 'Marque pelo menos uma cliente na lista para enviar.');
      return;
    }

    const delayMin = filaInfo?.config?.delayMinSegundos || 25;
    const delayMax = filaInfo?.config?.delayMaxSegundos || 60;

    Alert.alert(
      'Confirmar disparo no WhatsApp',
      `Enviar esta mensagem para ${ids.length} cliente(s) selecionada(s)?\n\nO app vai disparar aos poucos pelo WAHA (intervalo aleatório de ${delayMin}s a ${delayMax}s entre cada mensagem) para proteger seu número contra bloqueios.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Enviar (${ids.length})`,
          onPress: async () => {
            setDisparando(true);
            try {
              const r = await whatsappApi.dispararCampanha({
                mensagem: mensagemConfirmada,
                clienteIds: ids,
              });
              setSelecionadas(new Set());
              await atualizarFila();
              Alert.alert(
                'Disparo iniciado!',
                `${r.enfileiradas} mensagem(ns) adicionada(s) na fila do WhatsApp.\n\nElas estão sendo enviadas automaticamente aos poucos (${delayMin}s a ${delayMax}s por envio).`
              );
            } catch (e) {
              Alert.alert('Erro ao disparar campanha', e.message || 'Verifique se a API e o WAHA estão ativos.');
            } finally {
              setDisparando(false);
            }
          },
        },
      ]
    );
  };

  const iniciais = (nome) => nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const pendentesNaFila = (filaInfo?.contadores?.pendente || 0) + (filaInfo?.contadores?.enviando || 0);

  // ── Tela 2: mensagem confirmada, seleção de clientes por checkbox e disparo gradual ──
  if (mensagemConfirmada) {
    return (
      <SafeAreaView style={S.screen} edges={['bottom']}>
        {/* Cabeçalho com mensagem escolhida */}
        <View style={{ backgroundColor: 'white', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <View style={S.between}>
            <Text style={S.label}>Mensagem em uso</Text>
            <TouchableOpacity onPress={trocarMensagem}>
              <Text style={{ color: C.pink, fontSize: 12, fontWeight: '600' }}>← Trocar mensagem</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, color: C.text, marginTop: 4 }}>{mensagemConfirmada}</Text>

          {/* Aviso de proteção anti-ban (range limit) e status da fila */}
          <View style={{
            marginTop: 10,
            padding: 8,
            borderRadius: 8,
            backgroundColor: pendentesNaFila > 0 ? C.pinkLight : C.bg2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ fontSize: 11, color: pendentesNaFila > 0 ? C.pinkDark : C.muted, flex: 1 }}>
              {pendentesNaFila > 0
                ? `⏳ Enviando aos poucos no WhatsApp: ${pendentesNaFila} na fila (${filaInfo?.contadores?.enviada || 0} enviadas)`
                : `🛡️ Proteção Anti-Ban ativa: envio gradual a cada ${filaInfo?.config?.delayMinSegundos || 25}s–${filaInfo?.config?.delayMaxSegundos || 60}s`}
            </Text>
          </View>

          {/* Barra de busca e botão Selecionar Todas */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <TextInput
              style={[S.input, { flex: 1, marginBottom: 0, paddingVertical: 7, fontSize: 13 }]}
              placeholder="Buscar cliente por nome ou telefone..."
              value={busca}
              onChangeText={setBusca}
            />
            <TouchableOpacity
              onPress={alternarTodas}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: todasSelecionadas ? C.pink : C.border,
                backgroundColor: todasSelecionadas ? C.pinkLight : 'white',
              }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: todasSelecionadas ? C.pinkDark : C.muted }}>
                {todasSelecionadas ? 'Desmarcar todas' : 'Marcar todas'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de clientes com Checkboxes */}
        <ScrollView style={S.content}>
          {loadingClientes ? (
            <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} />
          ) : clientesFiltradas.length === 0 ? (
            <Text style={[S.muted, { textAlign: 'center', marginTop: 60 }]}>Nenhuma cliente encontrada.</Text>
          ) : clientesFiltradas.map((c) => {
            const marcada = selecionadas.has(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.8}
                onPress={() => alternarCliente(c.id)}
                style={[
                  S.card,
                  marcada && { borderColor: C.pink, backgroundColor: '#fff9fb' },
                ]}>
                <View style={S.row}>
                  {/* Checkbox */}
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: marcada ? C.pink : C.hint,
                    backgroundColor: marcada ? C.pink : 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {marcada && <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>

                  <View style={{
                    width: 36, height: 36, borderRadius: 18, backgroundColor: C.pinkLight,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Text style={{ color: C.pinkDark, fontWeight: '600', fontSize: 12 }}>{iniciais(c.nome)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[S.bold, { fontSize: 14, color: C.text }]}>{c.nome}</Text>
                    <Text style={{ fontSize: 11, color: C.muted }}>{c.telefone}</Text>
                    <Text style={[S.hint, { marginTop: 2 }]} numberOfLines={2}>
                      {personalizar(mensagemConfirmada, c.nome)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Rodapé fixo com botão Enviar para as clientes selecionadas */}
        <View style={{
          padding: 12,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: C.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <View>
            <Text style={[S.bold, { fontSize: 14, color: C.text }]}>
              {selecionadas.size} selecionada(s)
            </Text>
            <Text style={S.hint}>Disparo gradual via WAHA</Text>
          </View>

          <TouchableOpacity
            disabled={selecionadas.size === 0 || disparando}
            onPress={enviarCampanhaWaha}
            style={{
              flex: 1,
              backgroundColor: '#25D366',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: 'center',
              opacity: selecionadas.size === 0 || disparando ? 0.5 : 1,
            }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
              {disparando
                ? 'Enfileirando...'
                : `Enviar no WhatsApp (${selecionadas.size})`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Tela 1: chat pra montar a mensagem ────────────────────────────────────
  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={S.content}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {mensagens.length === 0 && (
            <Text style={[S.muted, { textAlign: 'center', marginTop: 40 }]}>
              Descreva o tipo de mensagem que você quer.{'\n'}
              Ex: "Faça uma mensagem de Dia dos Namorados convidando pra depilação"{'\n'}
              ou "Está frio, fale que temos aquecedor no espaço".
            </Text>
          )}
          {mensagens.map((m, i) => (
            <BolhaChat
              key={i}
              role={m.role}
              texto={m.texto}
              confirmada={mensagemConfirmada === m.texto}
              onConfirmar={() => confirmarMensagem(m.texto)}
            />
          ))}
          {enviando && <ActivityIndicator color={C.pink} style={{ marginVertical: 10 }} />}
        </ScrollView>

        <View style={{
          flexDirection: 'row', gap: 8, padding: 12, backgroundColor: 'white',
          borderTopWidth: 1, borderTopColor: C.border, alignItems: 'flex-end',
        }}>
          <TextInput
            style={[S.input, { flex: 1, marginBottom: 0, maxHeight: 100 }]}
            placeholder="Descreva a mensagem que você quer..."
            value={input}
            onChangeText={setInput}
            multiline
            editable={!enviando}
          />
          <TouchableOpacity
            disabled={enviando || !input.trim()}
            style={{
              backgroundColor: C.pink, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12,
              opacity: enviando || !input.trim() ? 0.5 : 1,
            }}
            onPress={enviarPrompt}>
            <Text style={{ color: 'white', fontWeight: '600' }}>Gerar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
