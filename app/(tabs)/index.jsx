import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agendamentosApi, servicosApi, clientesApi } from '../../src/services/api';
import { agendarNotificacoesParaData, pedirPermissao } from '../../src/services/notifications';
import { C, S, fmt, fmtHora } from '../../src/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Calendário mensal
// ─────────────────────────────────────────────────────────────────────────────
function ModalCalendario({ dataAtual, onClose, onSelectData }) {
  const [ano, setAno] = useState(parseInt(dataAtual.slice(0, 4)));
  const [mes, setMes] = useState(parseInt(dataAtual.slice(5, 7)) - 1);

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const hoje = new Date().toISOString().slice(0, 10);

  const mudarMes = (delta) => {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 0)  { novoMes = 11; novoAno--; }
    if (novoMes > 11) { novoMes = 0;  novoAno++; }
    setMes(novoMes);
    setAno(novoAno);
  };

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes   = new Date(ano, mes + 1, 0).getDate();
  const celulas = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);

  const toISO = (dia) => {
    const mm = String(mes + 1).padStart(2, '0');
    const dd = String(dia).padStart(2, '0');
    return `${ano}-${mm}-${dd}`;
  };

  return (
    <Modal animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={cal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={cal.container}>
          <View style={cal.header}>
            <TouchableOpacity style={cal.navBtn} onPress={() => mudarMes(-1)}>
              <Text style={cal.navTxt}>‹</Text>
            </TouchableOpacity>
            <Text style={cal.titulo}>{MESES[mes]} {ano}</Text>
            <TouchableOpacity style={cal.navBtn} onPress={() => mudarMes(1)}>
              <Text style={cal.navTxt}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={cal.semanaRow}>
            {DIAS_SEMANA.map((d) => (
              <Text key={d} style={cal.semanaLabel}>{d}</Text>
            ))}
          </View>

          <View style={cal.grade}>
            {celulas.map((dia, i) => {
              const selecionado = dia && toISO(dia) === dataAtual;
              const ehHoje      = dia && toISO(dia) === hoje;
              return (
                <TouchableOpacity
                  key={i}
                  style={[cal.celula, selecionado && cal.celulaSelected, !selecionado && ehHoje && cal.celulaHoje]}
                  onPress={() => { if (!dia) return; onSelectData(toISO(dia)); onClose(); }}
                  disabled={!dia}
                >
                  <Text style={[cal.celulaText, selecionado && cal.celulaSelectedText, !selecionado && ehHoje && cal.celulaHojeText, !dia && { opacity: 0 }]}>
                    {dia || '·'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={cal.btnHoje} onPress={() => { onSelectData(hoje); onClose(); }}>
            <Text style={cal.btnHojeTxt}>Ir para hoje</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Relógio – seletor de hora e minuto
// ─────────────────────────────────────────────────────────────────────────────
function ModalRelogio({ horaAtual, onClose, onSelectHora }) {
  const partes = (horaAtual || '09:00').split(':');
  const h24Inicial = parseInt(partes[0], 10) || 0;
  const mInicial = parseInt(partes[1], 10) || 0;

  const [modo, setModo] = useState('hora'); // 'hora' | 'minuto'
  const [ampm, setAmpm] = useState(h24Inicial >= 12 ? 'PM' : 'AM');
  const [hora12, setHora12] = useState(h24Inicial % 12 === 0 ? 12 : h24Inicial % 12);
  const [minuto, setMinuto] = useState(mInicial - (mInicial % 5));

  const RAIO = 88;
  const CENTRO = 100;

  const posicao = (indice) => {
    const angulo = (indice * 30 - 90) * (Math.PI / 180);
    return {
      left: CENTRO + RAIO * Math.cos(angulo) - 18,
      top:  CENTRO + RAIO * Math.sin(angulo) - 18,
    };
  };

  const escolherHora = (h12, ap) => {
    setHora12(h12);
    setAmpm(ap);
    setModo('minuto');
  };

  const escolherMinuto = (m) => {
    setMinuto(m);
    let h24 = hora12 % 12;
    if (ampm === 'PM') h24 += 12;
    onSelectHora(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const numerosHora = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
  const numerosMinuto = Array.from({ length: 12 }, (_, i) => i * 5);

  let h24Display = hora12 % 12;
  if (ampm === 'PM') h24Display += 12;

  return (
    <Modal animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={cal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={relogio.container}>
          <View style={relogio.display}>
            <TouchableOpacity onPress={() => setModo('hora')}>
              <Text style={[relogio.displayTxt, modo === 'hora' && relogio.displayTxtAtivo]}>
                {String(h24Display).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            <Text style={relogio.displayTxt}>:</Text>
            <TouchableOpacity onPress={() => setModo('minuto')}>
              <Text style={[relogio.displayTxt, modo === 'minuto' && relogio.displayTxtAtivo]}>
                {String(minuto).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            <View style={relogio.ampmBox}>
              <TouchableOpacity style={[relogio.ampmBtn, ampm === 'AM' && relogio.ampmBtnAtivo]} onPress={() => setAmpm('AM')}>
                <Text style={[relogio.ampmTxt, ampm === 'AM' && relogio.ampmTxtAtivo]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[relogio.ampmBtn, ampm === 'PM' && relogio.ampmBtnAtivo]} onPress={() => setAmpm('PM')}>
                <Text style={[relogio.ampmTxt, ampm === 'PM' && relogio.ampmTxtAtivo]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={relogio.face}>
            <View style={relogio.centro} />
            {modo === 'hora'
              ? numerosHora.map((n, i) => (
                  <TouchableOpacity
                    key={n}
                    style={[relogio.numero, posicao(i), n === hora12 && relogio.numeroAtivo]}
                    onPress={() => escolherHora(n, ampm)}
                  >
                    <Text style={[relogio.numeroTxt, n === hora12 && relogio.numeroTxtAtivo]}>{n}</Text>
                  </TouchableOpacity>
                ))
              : numerosMinuto.map((n, i) => (
                  <TouchableOpacity
                    key={n}
                    style={[relogio.numero, posicao(i), n === minuto && relogio.numeroAtivo]}
                    onPress={() => escolherMinuto(n)}
                  >
                    <Text style={[relogio.numeroTxt, n === minuto && relogio.numeroTxtAtivo]}>{String(n).padStart(2, '0')}</Text>
                  </TouchableOpacity>
                ))}
          </View>

          <Text style={relogio.dica}>Toque fora do relógio para digitar manualmente</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Campo de horário – abre o relógio ao focar, mas permanece digitável
// ─────────────────────────────────────────────────────────────────────────────
function CampoHora({ hora, setHora }) {
  const [modalAberto, setModalAberto] = useState(false);
  const inputRef = React.useRef(null);
  const ignorarProximoFoco = React.useRef(false);

  const abrirRelogio = () => {
    if (ignorarProximoFoco.current) {
      // Foco disparado por nós mesmos (depois de tocar fora do relógio
      // pra digitar manualmente) — não reabre o relógio nesse caso.
      ignorarProximoFoco.current = false;
      return;
    }
    inputRef.current?.blur();
    setModalAberto(true);
  };

  // Usuário escolheu hora/minuto no relógio: fecha sem devolver o foco
  // (evita reabrir o próprio relógio via onFocus).
  const selecionarHora = (novaHora) => {
    setHora(novaHora);
    setModalAberto(false);
  };

  // Usuário tocou fora do relógio: fecha e devolve o foco pro campo,
  // liberando digitação manual como já era feito antes.
  const fecharParaDigitar = () => {
    setModalAberto(false);
    ignorarProximoFoco.current = true;
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <>
      <TextInput
        ref={inputRef}
        style={S.input}
        placeholder="HH:MM"
        value={hora}
        onChangeText={setHora}
        onFocus={abrirRelogio}
        showSoftInputOnFocus={!modalAberto}
      />
      {modalAberto && (
        <ModalRelogio
          horaAtual={hora}
          onClose={fecharParaDigitar}
          onSelectHora={selecionarHora}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Campo de data – abre o calendário ao focar, exibe em DD/MM/AAAA,
// mas continua digitável (mesmo padrão do CampoHora acima)
// ─────────────────────────────────────────────────────────────────────────────
function paraExibicaoData(iso) {
  if (!iso || iso.length < 10) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function paraISOData(display) {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  return `${ano}-${mes}-${dia}`;
}

function CampoData({ data, setData }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [textoDigitado, setTextoDigitado] = useState(paraExibicaoData(data));
  const inputRef = React.useRef(null);
  const ignorarProximoFoco = React.useRef(false);

  // Mantém o texto exibido em sincronia quando a data muda por fora
  // (ex: usuário escolheu no calendário, ou o campo foi pré-populado).
  useEffect(() => { setTextoDigitado(paraExibicaoData(data)); }, [data]);

  const abrirCalendario = () => {
    if (ignorarProximoFoco.current) {
      ignorarProximoFoco.current = false;
      return;
    }
    inputRef.current?.blur();
    setModalAberto(true);
  };

  const selecionarData = (novaIso) => {
    setData(novaIso);
    setModalAberto(false);
  };

  const fecharParaDigitar = () => {
    setModalAberto(false);
    ignorarProximoFoco.current = true;
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const aoDigitar = (texto) => {
    setTextoDigitado(texto);
    const iso = paraISOData(texto);
    if (iso) setData(iso);
  };

  return (
    <>
      <TextInput
        ref={inputRef}
        style={S.input}
        placeholder="DD/MM/AAAA"
        value={textoDigitado}
        onChangeText={aoDigitar}
        onFocus={abrirCalendario}
        showSoftInputOnFocus={!modalAberto}
      />
      {modalAberto && (
        <ModalCalendario
          dataAtual={data}
          onClose={fecharParaDigitar}
          onSelectData={selecionarData}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela principal – Agenda
// ─────────────────────────────────────────────────────────────────────────────
export default function AgendaScreen() {
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData]             = useState(hoje);
  const [agendamentos, setAgs]      = useState([]);
  const [servicos, setServicos]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalNovo, setModalNovo]   = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalBaixa, setModalBaixa] = useState(null);
  const [modalCal, setModalCal]     = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await agendamentosApi.listarPorData(data);
      setAgs(lista);
      agendarNotificacoesParaData(lista, data);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Corrigido: pede a permissão de notificação SOMENTE depois que os agendamentos
  // já carregaram, evitando que o diálogo de permissão (que tira o app do foreground
  // por um instante) entre em corrida com o fetch inicial e derrube a conexão.
  useEffect(() => {
    carregar().then(() => {
      pedirPermissao();
    });
  }, [carregar]);
  useEffect(() => { servicosApi.listar().then(setServicos).catch(() => {}); }, []);

  const mudarData = (d) => {
    const dt = new Date(data + 'T12:00:00');
    dt.setDate(dt.getDate() + d);
    setData(dt.toISOString().slice(0, 10));
  };

  const remover = (id) => {
    Alert.alert('Confirmar', 'Remover agendamento?', [
      { text: 'Cancelar' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await agendamentosApi.excluir(id); carregar(); } },
    ]);
  };

  const borderColor = { agendado: C.pink, realizado: C.green, cancelado: C.hint };

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>

      {/* Navegação de data */}
      <View style={[S.row, styles.navBar]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => mudarData(-1)}>
          <Text style={styles.navTxt}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalCal(true)} style={styles.dataPill}>
          <Text style={{ fontWeight: '600', color: C.text }}>
            {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </Text>
          <Text style={{ fontSize: 11, color: C.pink, marginLeft: 6 }}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => mudarData(1)}>
          <Text style={styles.navTxt}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={S.content}>
        {loading
          ? <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} />
          : agendamentos.length === 0
            ? <Text style={[S.muted, { textAlign: 'center', marginTop: 60 }]}>Nenhum agendamento.</Text>
            : agendamentos.map((a) => {
                const temMultiplos = Array.isArray(a.servicos) && a.servicos.length > 0;
                const totalValor   = temMultiplos
                  ? a.servicos.reduce((s, sv) => s + parseFloat(sv.valor || 0), 0)
                  : parseFloat(a.servico_valor || 0);

                return (
                  <View key={a.id} style={[S.card, { borderLeftWidth: 4, borderLeftColor: borderColor[a.status] || C.border }]}>
                    <View style={S.between}>
                      <Text style={[S.bold, { fontSize: 15 }]}>{a.cliente_nome}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: borderColor[a.status] }}>{a.status}</Text>
                    </View>

                    {temMultiplos ? (
                      <>
                        {a.servicos.map((sv, i) => (
                          <Text key={i} style={[S.muted, { marginTop: i === 0 ? 2 : 1 }]}>• {sv.nome} — {fmt(sv.valor)}</Text>
                        ))}
                        {a.servicos.length > 1 && (
                          <View style={styles.totalBadge}>
                            <Text style={styles.totalBadgeTxt}>Total: {fmt(totalValor)}</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={S.muted}>{a.servico_nome} — {fmt(a.servico_valor)}</Text>
                    )}

                    <Text style={S.hint}>{fmtHora(a.data_hora)}</Text>
                    {a.observacao ? <Text style={[S.hint, { fontStyle: 'italic', marginTop: 4 }]}>{a.observacao}</Text> : null}

                    {/* Ações */}
                    <View style={[S.row, { marginTop: 10, flexWrap: 'wrap', gap: 8 }]}>
                      {a.status === 'agendado' && (
                        <>
                          <TouchableOpacity style={[styles.btnAcao, { backgroundColor: '#EEF2FF' }]} onPress={() => setModalEditar(a)}>
                            <Text style={{ color: '#5C6BC0', fontSize: 12, fontWeight: '500' }}>✏️ Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.btnAcao, { backgroundColor: C.greenLight }]} onPress={() => setModalBaixa(a)}>
                            <Text style={{ color: C.green, fontSize: 12, fontWeight: '500' }}>✅ Dar Baixa</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity style={[styles.btnAcao, { backgroundColor: C.redLight }]} onPress={() => remover(a.id)}>
                        <Text style={{ color: C.red, fontSize: 12, fontWeight: '500' }}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
        }
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalNovo(true)}>
        <Text style={{ color: 'white', fontSize: 24, lineHeight: 28 }}>+</Text>
      </TouchableOpacity>

      {modalCal && (
        <ModalCalendario dataAtual={data} onClose={() => setModalCal(false)} onSelectData={setData} />
      )}
      {modalNovo && (
        <ModalNovoAgendamento
          servicos={servicos} dataInicial={data}
          onClose={() => setModalNovo(false)}
          onSalvo={() => { setModalNovo(false); carregar(); }}
        />
      )}
      {modalEditar && (
        <ModalEditarAgendamento
          agendamento={modalEditar} servicos={servicos}
          onClose={() => setModalEditar(null)}
          onSalvo={() => { setModalEditar(null); carregar(); }}
        />
      )}
      {modalBaixa && (
        <ModalBaixa
          agendamento={modalBaixa} servicos={servicos}
          onClose={() => setModalBaixa(null)}
          onSalvo={() => { setModalBaixa(null); carregar(); }}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal – Novo Agendamento
// ─────────────────────────────────────────────────────────────────────────────
function ModalNovoAgendamento({ servicos, dataInicial, onClose, onSalvo }) {
  const [selecionados, setSelecionados] = useState([]);
  const [data, setData]   = useState(dataInicial);
  const [hora, setHora]   = useState('09:00');
  const [obs, setObs]     = useState('');
  const [clienteBusca, setBusca] = useState('');
  const [clienteLista, setLista] = useState([]);
  const [cliente, setCliente]    = useState(null);

  const totalSelecionado = selecionados.reduce((s, sv) => s + parseFloat(sv.valor || 0), 0);

  const toggleServico = (servico) => {
    setSelecionados((prev) => {
      const jaEsta = prev.some((s) => s.id === servico.id);
      return jaEsta ? prev.filter((s) => s.id !== servico.id) : [...prev, servico];
    });
  };

  const buscarCliente = async (q) => {
    setBusca(q);
    if (q.length < 2) { setLista([]); return; }
    const r = await clientesApi.buscar(q);
    setLista(r);
  };

  const salvar = async () => {
    if (!cliente)                  return Alert.alert('Atenção', 'Selecione uma cliente.');
    if (selecionados.length === 0) return Alert.alert('Atenção', 'Selecione ao menos um serviço.');
    try {
      await agendamentosApi.criar({
        cliente_id:  cliente.id,
        servico_ids: selecionados.map((s) => s.id),
        servico_id:  selecionados[0].id,
        // CORREÇÃO: adiciona offset -03:00 para que o PostgreSQL receba
        // o horário local de Brasília e armazene corretamente.
        data_hora:   `${data}T${hora}:00-03:00`,
        observacao:  obs,
      });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[S.header, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Cancelar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Novo Agendamento</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 16 }}>
          <ClienteSelector cliente={cliente} setCliente={setCliente} clienteBusca={clienteBusca} buscarCliente={buscarCliente} clienteLista={clienteLista} setLista={setLista} setBusca={setBusca} />
          <ServicoSelector servicos={servicos} selecionados={selecionados} toggleServico={toggleServico} totalSelecionado={totalSelecionado} />
          <Text style={[S.label, { marginTop: 8 }]}>Data *</Text>
          <CampoData data={data} setData={setData} />
          <Text style={S.label}>Horário *</Text>
          <CampoHora hora={hora} setHora={setHora} />
          <Text style={S.label}>Observação</Text>
          <TextInput style={[S.input, { height: 80, textAlignVertical: 'top' }]} multiline value={obs} onChangeText={setObs} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal – Editar Agendamento
// ─────────────────────────────────────────────────────────────────────────────
function ModalEditarAgendamento({ agendamento, servicos, onClose, onSalvo }) {
  // Pré-popula com os dados existentes
  const servicosIniciais = Array.isArray(agendamento.servicos) && agendamento.servicos.length > 0
    ? servicos.filter((s) => agendamento.servicos.some((sv) => sv.id === s.id))
    : servicos.filter((s) => s.id === agendamento.servico_id);

  // CORREÇÃO: extrai data e hora diretamente da string ISO sem conversão de fuso
  // ex: "2025-05-04T14:00:00.000Z" -> data="2025-05-04", hora="14:00"
  const dataISO = agendamento.data_hora.slice(0, 10);
  const horaStr = agendamento.data_hora.slice(11, 16);

  const [selecionados, setSelecionados] = useState(servicosIniciais);
  const [data, setData] = useState(dataISO);
  const [hora, setHora] = useState(horaStr);
  const [obs, setObs]   = useState(agendamento.observacao || '');

  const totalSelecionado = selecionados.reduce((s, sv) => s + parseFloat(sv.valor || 0), 0);

  const toggleServico = (servico) => {
    setSelecionados((prev) => {
      const jaEsta = prev.some((s) => s.id === servico.id);
      return jaEsta ? prev.filter((s) => s.id !== servico.id) : [...prev, servico];
    });
  };

  const salvar = async () => {
    if (selecionados.length === 0) return Alert.alert('Atenção', 'Selecione ao menos um serviço.');
    try {
      await agendamentosApi.atualizar(agendamento.id, {
        servico_ids: selecionados.map((s) => s.id),
        servico_id:  selecionados[0].id,
        // CORREÇÃO: adiciona offset -03:00 para que o PostgreSQL receba
        // o horário local de Brasília e armazene corretamente.
        data_hora:   `${data}T${hora}:00-03:00`,
        observacao:  obs,
      });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[S.header, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Cancelar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Editar Agendamento</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>

        {/* Cliente (somente leitura) */}
        <ScrollView style={{ padding: 16 }}>
          <Text style={S.label}>Cliente</Text>
          <View style={[S.card, { marginBottom: 12, backgroundColor: C.bg2 }]}>
            <Text style={{ color: C.text, fontWeight: '500' }}>{agendamento.cliente_nome}</Text>
          </View>

          <ServicoSelector servicos={servicos} selecionados={selecionados} toggleServico={toggleServico} totalSelecionado={totalSelecionado} />

          <Text style={[S.label, { marginTop: 8 }]}>Data *</Text>
          <CampoData data={data} setData={setData} />
          <Text style={S.label}>Horário *</Text>
          <CampoHora hora={hora} setHora={setHora} />
          <Text style={S.label}>Observação</Text>
          <TextInput style={[S.input, { height: 80, textAlignVertical: 'top' }]} multiline value={obs} onChangeText={setObs} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal – Dar Baixa (com serviços editáveis e valor ajustável)
// ─────────────────────────────────────────────────────────────────────────────
function ModalBaixa({ agendamento, servicos, onClose, onSalvo }) {
  const [status, setStatus] = useState('realizado');
  const [obs, setObs]       = useState('');

  // Serviços pré-selecionados do agendamento
  // CORREÇÃO: usa os dados completos de `servicos` (que vêm da API com valor correto),
  // filtrando pelos IDs do agendamento. Isso garante que o valor seja o cadastrado,
  // não um valor residual do objeto parcial retornado junto com o agendamento.
  const idsDoAgendamento = Array.isArray(agendamento.servicos) && agendamento.servicos.length > 0
    ? agendamento.servicos.map((sv) => sv.id)
    : agendamento.servico_id ? [agendamento.servico_id] : [];

  const servicosIniciais = servicos.filter((s) => idsDoAgendamento.includes(s.id));

  const [selecionados, setSelecionados] = useState(servicosIniciais);
  const [valorEditado, setValorEditado] = useState(false);

  // Valor total calculado pelos serviços selecionados
  const totalCalculado = selecionados.reduce((acc, sv) => acc + parseFloat(sv.valor || 0), 0);

  // CORREÇÃO: inicializa com string vazia e deixa o useEffect definir o valor correto
  // na primeira renderização, evitando o "0.00" que aparecia quando servicos ainda carregava.
  const [valorFinal, setValorFinal] = useState('');

  // Atualiza valor automaticamente quando serviços mudam (a menos que tenha editado manualmente)
  useEffect(() => {
    if (!valorEditado) {
      setValorFinal(String(totalCalculado.toFixed(2)));
    }
  }, [selecionados, totalCalculado]);

  const toggleServico = (servico) => {
    setSelecionados((prev) => {
      const jaEsta = prev.some((s) => s.id === servico.id);
      return jaEsta ? prev.filter((s) => s.id !== servico.id) : [...prev, servico];
    });
  };

  const salvar = async () => {
    try {
      await agendamentosApi.darBaixa(agendamento.id, {
        status,
        observacao:  obs,
        servico_ids: selecionados.map((s) => s.id),
        valor_final: parseFloat(valorFinal) || totalCalculado,
      });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[S.header, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Cancelar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Dar Baixa</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Confirmar</Text></TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 16 }}>
          {/* Status */}
          <Text style={S.label}>Status</Text>
          {['realizado', 'cancelado'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[S.card, { marginBottom: 8, borderColor: status === s ? C.pink : C.border, borderWidth: status === s ? 2 : 1 }]}
              onPress={() => setStatus(s)}
            >
              <Text style={{ color: C.text }}>{s === 'realizado' ? '✅ Realizado' : '❌ Cancelado'}</Text>
            </TouchableOpacity>
          ))}

          {/* Serviços realizados */}
          <Text style={[S.label, { marginTop: 12 }]}>Serviços realizados</Text>
          <Text style={[S.hint, { marginBottom: 8 }]}>Ajuste os serviços caso tenha mudado</Text>
          {servicos.map((s) => {
            const ativo = selecionados.some((sv) => sv.id === s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[S.card, { marginBottom: 6 }, ativo && { borderColor: C.pink, borderWidth: 2, backgroundColor: C.pinkLight }]}
                onPress={() => toggleServico(s)}
              >
                <View style={S.between}>
                  <View style={[S.row, { flex: 1 }]}>
                    <View style={[styles.checkbox, ativo && styles.checkboxAtivo]}>
                      {ativo && <Text style={{ color: 'white', fontSize: 11, lineHeight: 14 }}>✓</Text>}
                    </View>
                    <Text style={[S.bold, { flex: 1 }, ativo && { color: C.pinkDark }]}>{s.nome}</Text>
                  </View>
                  <Text style={{ color: C.green, fontWeight: '600', marginLeft: 8 }}>{fmt(s.valor)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Valor final */}
          <View style={[styles.valorBox, { marginTop: 12 }]}>
            <View style={S.between}>
              <Text style={styles.valorLabel}>Valor cobrado (R$)</Text>
              {valorEditado && (
                <TouchableOpacity onPress={() => { setValorFinal(String(totalCalculado.toFixed(2))); setValorEditado(false); }}>
                  <Text style={{ fontSize: 11, color: C.pink }}>Restaurar</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.valorInput}
              value={valorFinal}
              onChangeText={(v) => { setValorFinal(v); setValorEditado(true); }}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            {selecionados.length > 0 && (
              <Text style={styles.valorHint}>
                Valor dos serviços: {fmt(totalCalculado)}
                {valorEditado && parseFloat(valorFinal) !== totalCalculado
                  ? parseFloat(valorFinal) < totalCalculado
                    ? `  •  Desconto: ${fmt(totalCalculado - parseFloat(valorFinal))}`
                    : `  •  Acréscimo: ${fmt(parseFloat(valorFinal) - totalCalculado)}`
                  : ''}
              </Text>
            )}
          </View>

          {/* Observação */}
          <Text style={[S.label, { marginTop: 12 }]}>Observação</Text>
          <TextInput
            style={[S.input, { height: 80, textAlignVertical: 'top' }]}
            multiline value={obs} onChangeText={setObs} placeholder="Opcional..."
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componentes reutilizáveis
// ─────────────────────────────────────────────────────────────────────────────
function ClienteSelector({ cliente, setCliente, clienteBusca, buscarCliente, clienteLista, setLista, setBusca }) {
  return (
    <>
      <Text style={S.label}>Cliente *</Text>
      {cliente ? (
        <View style={[S.row, { backgroundColor: C.pinkLight, padding: 10, borderRadius: 8, marginBottom: 12 }]}>
          <Text style={{ flex: 1, color: C.pinkDark, fontWeight: '500' }}>{cliente.nome}</Text>
          <TouchableOpacity onPress={() => setCliente(null)}>
            <Text style={{ color: C.pinkDark }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput style={S.input} placeholder="Buscar cliente..." value={clienteBusca} onChangeText={buscarCliente} />
          {clienteLista.map((c) => (
            <TouchableOpacity key={c.id} style={[S.card, { marginBottom: 6 }]} onPress={() => { setCliente(c); setLista([]); setBusca(''); }}>
              <Text style={S.bold}>{c.nome}</Text>
              <Text style={S.hint}>{c.telefone}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </>
  );
}

function ServicoSelector({ servicos, selecionados, toggleServico, totalSelecionado }) {
  return (
    <>
      <View style={[S.between, { marginBottom: 6, marginTop: 4 }]}>
        <Text style={S.label}>Serviços * (selecione um ou mais)</Text>
        {selecionados.length > 0 && (
          <Text style={{ fontSize: 11, color: C.pink, fontWeight: '600' }}>
            {selecionados.length} selecionado{selecionados.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>
      {servicos.map((s) => {
        const ativo = selecionados.some((sv) => sv.id === s.id);
        return (
          <TouchableOpacity
            key={s.id}
            style={[S.card, { marginBottom: 6 }, ativo && { borderColor: C.pink, borderWidth: 2, backgroundColor: C.pinkLight }]}
            onPress={() => toggleServico(s)}
          >
            <View style={S.between}>
              <View style={[S.row, { flex: 1 }]}>
                <View style={[styles.checkbox, ativo && styles.checkboxAtivo]}>
                  {ativo && <Text style={{ color: 'white', fontSize: 11, lineHeight: 14 }}>✓</Text>}
                </View>
                <Text style={[S.bold, { flex: 1 }, ativo && { color: C.pinkDark }]}>{s.nome}</Text>
              </View>
              <Text style={{ color: C.green, fontWeight: '600', marginLeft: 8 }}>{fmt(s.valor)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      {selecionados.length > 0 && (
        <View style={styles.resumoServicos}>
          <Text style={styles.resumoServicosLabel}>{selecionados.map((s) => s.nome).join('  +  ')}</Text>
          <Text style={styles.resumoServicosTotalTxt}>Total: {fmt(totalSelecionado)}</Text>
        </View>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  navBar: { justifyContent: 'space-between', padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#0000001A' },
  navBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f4f3f1' },
  navTxt: { fontSize: 18, color: '#1a1a18' },
  dataPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FBEAF0' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: '#D4537E', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#D4537E', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  btnAcao: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  totalBadge: { alignSelf: 'flex-start', backgroundColor: '#EAF3DE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  totalBadgeTxt: { color: '#1D9E75', fontWeight: '700', fontSize: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#0000001A', alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: 'white' },
  checkboxAtivo: { backgroundColor: '#D4537E', borderColor: '#D4537E' },
  resumoServicos: { backgroundColor: '#F0FAF5', borderRadius: 10, borderWidth: 1, borderColor: '#C6EAD9', padding: 12, marginBottom: 16, marginTop: 4 },
  resumoServicosLabel: { color: '#1D9E75', fontSize: 13, fontWeight: '500' },
  resumoServicosTotalTxt: { color: '#1D9E75', fontSize: 17, fontWeight: '800', marginTop: 4 },

  // Valor final na baixa
  valorBox: { backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 4 },
  valorLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  valorInput: { fontSize: 28, fontWeight: '700', color: C.pink, borderBottomWidth: 2, borderBottomColor: C.pink, paddingBottom: 4, marginBottom: 6 },
  valorHint: { fontSize: 11, color: C.muted },
});

const cal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: 340, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  titulo: { fontSize: 17, fontWeight: '700', color: '#1a1a18' },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f4f3f1', alignItems: 'center', justifyContent: 'center' },
  navTxt: { fontSize: 22, color: '#1a1a18', lineHeight: 26 },
  semanaRow: { flexDirection: 'row', marginBottom: 8 },
  semanaLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9c9a94' },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 100 },
  celulaSelected: { backgroundColor: '#D4537E' },
  celulaHoje: { backgroundColor: '#FBEAF0' },
  celulaText: { fontSize: 14, color: '#1a1a18' },
  celulaSelectedText: { color: 'white', fontWeight: '700' },
  celulaHojeText: { color: '#D4537E', fontWeight: '700' },
  btnHoje: { marginTop: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#D4537E', alignItems: 'center' },
  btnHojeTxt: { color: '#D4537E', fontWeight: '600', fontSize: 14 },
});

const relogio = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: 300, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10 },
  display: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  displayTxt: { fontSize: 40, fontWeight: '700', color: '#c8c6c1' },
  displayTxtAtivo: { color: '#D4537E' },
  ampmBox: { marginLeft: 14 },
  ampmBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  ampmBtnAtivo: { backgroundColor: '#FBEAF0' },
  ampmTxt: { fontSize: 13, fontWeight: '600', color: '#9c9a94' },
  ampmTxtAtivo: { color: '#D4537E' },
  face: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#f4f3f1' },
  centro: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4537E', left: 96, top: 96 },
  numero: { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  numeroAtivo: { backgroundColor: '#D4537E' },
  numeroTxt: { fontSize: 14, color: '#1a1a18' },
  numeroTxtAtivo: { color: 'white', fontWeight: '700' },
  dica: { marginTop: 14, fontSize: 12, color: '#9c9a94', textAlign: 'center' },
});
