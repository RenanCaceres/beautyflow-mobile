import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agendamentosApi, servicosApi, clientesApi } from '../../src/services/api';
import { agendarNotificacoesParaData, pedirPermissao } from '../../src/services/notifications';
import { C, S, fmt, fmtHora } from '../../src/theme';

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─────────────────────────────────────────────────────────────────────────────
// Calendário mensal (abre ao clicar na seta para baixo abaixo dos dias)
// ─────────────────────────────────────────────────────────────────────────────
function ModalCalendario({ dataAtual, diasIndisponiveis = {}, onClose, onSelectData }) {
  const [ano, setAno] = useState(parseInt(dataAtual.slice(0, 4), 10));
  const [mes, setMes] = useState(parseInt(dataAtual.slice(5, 7), 10) - 1);
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
            <Text style={cal.titulo}>{MESES_NOMES[mes]} {ano}</Text>
            <TouchableOpacity style={cal.navBtn} onPress={() => mudarMes(1)}>
              <Text style={cal.navTxt}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={cal.semanaRow}>
            {DIAS_CURTOS.map((d) => (
              <Text key={d} style={cal.semanaLabel}>{d}</Text>
            ))}
          </View>

          <View style={cal.grade}>
            {celulas.map((dia, i) => {
              const iso = dia ? toISO(dia) : null;
              const selecionado = iso && iso === dataAtual;
              const ehHoje      = iso && iso === hoje;
              const bloqueado   = iso && Boolean(diasIndisponiveis[iso]);
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    cal.celula,
                    selecionado && cal.celulaSelected,
                    !selecionado && ehHoje && cal.celulaHoje,
                    !selecionado && bloqueado && { backgroundColor: C.redLight, borderRadius: 19 },
                  ]}
                  onPress={() => {
                    if (!dia) return;
                    onSelectData(iso);
                    onClose();
                  }}
                  disabled={!dia}
                >
                  <Text
                    style={[
                      cal.celulaText,
                      selecionado && cal.celulaSelectedText,
                      !selecionado && ehHoje && cal.celulaHojeText,
                      !selecionado && bloqueado && { color: C.red, fontWeight: '700' },
                      !dia && { opacity: 0 },
                    ]}
                  >
                    {dia || '·'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={cal.btnHoje}
            onPress={() => {
              onSelectData(hoje);
              onClose();
            }}
          >
            <Text style={cal.btnHojeTxt}>Ir para hoje</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Relógio circular interativo — seleciona a hora e depois os minutos
// ─────────────────────────────────────────────────────────────────────────────
function ModalRelogio({ horaAtual, onClose, onSelectHora }) {
  const partes = (horaAtual || '09:00').split(':');
  const h24Inicial = parseInt(partes[0], 10) || 0;
  const mInicial = parseInt(partes[1], 10) || 0;

  const [modo, setModo]     = useState('hora'); // 'hora' | 'minuto'
  const [ampm, setAmpm]     = useState(h24Inicial >= 12 ? 'PM' : 'AM');
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

  const numerosHora   = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
  const numerosMinuto = Array.from({ length: 12 }, (_, i) => i * 5);

  let h24Display = hora12 % 12;
  if (ampm === 'PM') h24Display += 12;

  return (
    <Modal animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={cal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={relogio.container}>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginBottom: 8 }}>
            {modo === 'hora' ? 'Selecione a hora' : 'Agora selecione os minutos'}
          </Text>

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
              <TouchableOpacity
                style={[relogio.ampmBtn, ampm === 'AM' && relogio.ampmBtnAtivo]}
                onPress={() => setAmpm('AM')}
              >
                <Text style={[relogio.ampmTxt, ampm === 'AM' && relogio.ampmTxtAtivo]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[relogio.ampmBtn, ampm === 'PM' && relogio.ampmBtnAtivo]}
                onPress={() => setAmpm('PM')}
              >
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
                    <Text style={[relogio.numeroTxt, n === minuto && relogio.numeroTxtAtivo]}>
                      {String(n).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
          </View>

          <Text style={relogio.dica}>Toque fora do relógio para digitar manualmente</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function CampoHora({ hora, setHora }) {
  const [modalAberto, setModalAberto] = useState(false);
  const inputRef = React.useRef(null);
  const ignorarProximoFoco = React.useRef(false);

  const abrirRelogio = () => {
    if (ignorarProximoFoco.current) {
      ignorarProximoFoco.current = false;
      return;
    }
    inputRef.current?.blur();
    setModalAberto(true);
  };

  const selecionarHora = (novaHora) => {
    setHora(novaHora);
    setModalAberto(false);
  };

  const fecharParaDigitar = () => {
    setModalAberto(false);
    ignorarProximoFoco.current = true;
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setModalAberto(true)}>
        <View style={[S.input, S.between, { marginBottom: 12 }]}>
          <TextInput
            ref={inputRef}
            style={{ flex: 1, fontSize: 14, color: C.text, padding: 0 }}
            placeholder="HH:MM"
            value={hora}
            onChangeText={setHora}
            onFocus={abrirRelogio}
            showSoftInputOnFocus={!modalAberto}
          />
          <Text style={{ fontSize: 13, color: C.pink, fontWeight: '600' }}>🕒 Relógio</Text>
        </View>
      </TouchableOpacity>
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
      <TouchableOpacity activeOpacity={0.85} onPress={() => setModalAberto(true)}>
        <View style={[S.input, S.between, { marginBottom: 12 }]}>
          <TextInput
            ref={inputRef}
            style={{ flex: 1, fontSize: 14, color: C.text, padding: 0 }}
            placeholder="DD/MM/AAAA"
            value={textoDigitado}
            onChangeText={aoDigitar}
            onFocus={abrirCalendario}
            showSoftInputOnFocus={!modalAberto}
          />
          <Text style={{ fontSize: 13, color: C.pink, fontWeight: '600' }}>📅 Calendário</Text>
        </View>
      </TouchableOpacity>
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

// Gera os 5 dias ao redor da data selecionada para a tira superior
function gerarDiasAoRedor(dataIso) {
  const base = new Date(dataIso + 'T12:00:00');
  const lista = [];
  for (let offset = -2; offset <= 2; offset++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() + offset);
    const iso = dt.toISOString().slice(0, 10);
    lista.push({
      iso,
      semana: DIAS_CURTOS[dt.getDay()],
      diaNum: dt.getDate(),
    });
  }
  return lista;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela principal – Agenda (Clean & Amigável)
// ─────────────────────────────────────────────────────────────────────────────
export default function AgendaScreen() {
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData]                   = useState(hoje);
  const [agendamentos, setAgs]            = useState([]);
  const [servicos, setServicos]           = useState([]);
  const [diasIndisponiveis, setIndisp]    = useState({});
  const [loading, setLoading]             = useState(true);
  const [modalNovo, setModalNovo]         = useState(false);
  const [modalEditar, setModalEditar]     = useState(null);
  const [modalBaixa, setModalBaixa]       = useState(null);
  const [modalCal, setModalCal]           = useState(false);

  const carregarIndisponiveis = useCallback(async () => {
    try {
      const rows = await agendamentosApi.listarIndisponiveis();
      const mapa = {};
      (rows || []).forEach((r) => {
        mapa[r.data] = r.motivo || 'Indisponível / Folga';
      });
      setIndisp(mapa);
    } catch {
      // ignora silenciosamente se endpoint ainda não existir
    }
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista] = await Promise.all([
        agendamentosApi.listarPorData(data),
        carregarIndisponiveis(),
      ]);
      setAgs(lista);
      agendarNotificacoesParaData(lista, data);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }, [data, carregarIndisponiveis]);

  useEffect(() => {
    carregar().then(() => {
      pedirPermissao();
    });
  }, [carregar]);

  useEffect(() => {
    servicosApi.listar().then(setServicos).catch(() => {});
  }, []);

  const diaAtualIndisponivel = Boolean(diasIndisponiveis[data]);

  const alternarIndisponibilidadeDia = async () => {
    try {
      if (diaAtualIndisponivel) {
        await agendamentosApi.removerIndisponivel(data);
        await carregarIndisponiveis();
      } else {
        await agendamentosApi.marcarIndisponivel(data, 'Indisponível / Folga');
        await carregarIndisponiveis();
        Alert.alert(
          'Dia marcado como indisponível',
          'A API e o assistente de Retorno sabem que você não atenderá neste dia.'
        );
      }
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  };

  const mudarData = (delta) => {
    const dt = new Date(data + 'T12:00:00');
    dt.setDate(dt.getDate() + delta);
    setData(dt.toISOString().slice(0, 10));
  };

  const remover = (id) => {
    Alert.alert('Confirmar', 'Remover este agendamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await agendamentosApi.excluir(id);
          carregar();
        },
      },
    ]);
  };

  const diasVisiveis = gerarDiasAoRedor(data);
  const dtAtual = new Date(data + 'T12:00:00');
  const mesAnoExtenso = dtAtual.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={S.screen} edges={['bottom']}>
      {/* Subcabeçalho Clean com contador, botão de indisponibilidade e botão + Agendar */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topCount}>
            {agendamentos.length} {agendamentos.length === 1 ? 'atendimento' : 'atendimentos'} no dia
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 11,
              paddingVertical: 8,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: diaAtualIndisponivel ? C.red : C.border,
              backgroundColor: diaAtualIndisponivel ? C.redLight : 'white',
            }}
            onPress={alternarIndisponibilidadeDia}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: diaAtualIndisponivel ? C.red : C.muted }}>
              {diaAtualIndisponivel ? '🔓 Liberar dia' : '🔒 Folga / Indisp.'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnAgendarPill} onPress={() => setModalNovo(true)}>
            <Text style={styles.btnAgendarPillText}>+ Agendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de Dias com Setas nas Extremidades + Seta para baixo para abrir o Calendário */}
      <View style={styles.dateSelectorWrapper}>
        <View style={styles.daysStripRow}>
          <TouchableOpacity style={styles.edgeArrowBtn} onPress={() => mudarData(-1)}>
            <Text style={styles.edgeArrowText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.daysStripCenter}>
            {diasVisiveis.map((item) => {
              const ativo = item.iso === data;
              const indisp = Boolean(diasIndisponiveis[item.iso]);
              return (
                <TouchableOpacity
                  key={item.iso}
                  style={[
                    styles.dayCard,
                    indisp && !ativo && { backgroundColor: C.redLight, borderColor: '#F5C4C4' },
                    ativo && styles.dayCardAtivo,
                  ]}
                  onPress={() => setData(item.iso)}
                >
                  <Text
                    style={[
                      styles.dayWeekTxt,
                      indisp && !ativo && { color: C.red },
                      ativo && styles.dayWeekTxtAtivo,
                    ]}
                  >
                    {item.semana}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumTxt,
                      indisp && !ativo && { color: C.red },
                      ativo && styles.dayNumTxtAtivo,
                    ]}
                  >
                    {item.diaNum}{indisp ? '🔒' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.edgeArrowBtn} onPress={() => mudarData(1)}>
            <Text style={styles.edgeArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Seta para baixo abaixo dos dias disponíveis para abrir o calendário */}
        <TouchableOpacity
          style={styles.openCalendarHandle}
          activeOpacity={0.75}
          onPress={() => setModalCal(true)}
        >
          <Text style={styles.openCalendarText}>{mesAnoExtenso}</Text>
          <Text style={styles.openCalendarArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {diaAtualIndisponivel && (
        <View style={{
          marginHorizontal: 14,
          marginTop: 10,
          padding: 11,
          borderRadius: 12,
          backgroundColor: C.redLight,
          borderWidth: 1,
          borderColor: '#F5C4C4',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{ fontSize: 12, color: C.red, fontWeight: '600', flex: 1 }}>
            🔒 Dia marcado como indisponível (a IA de retorno não sugerirá esta data).
          </Text>
        </View>
      )}

      <ScrollView style={S.content}>
        {loading ? (
          <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} />
        ) : agendamentos.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={[S.muted, { textAlign: 'center' }]}>
              {diaAtualIndisponivel
                ? 'Este dia está marcado como indisponível / folga.'
                : 'Nenhum agendamento para este dia.'}
            </Text>
            {!diaAtualIndisponivel && (
              <TouchableOpacity
                style={{ marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, backgroundColor: C.pinkLight }}
                onPress={() => setModalNovo(true)}
              >
                <Text style={{ color: C.pinkDark, fontWeight: '600', fontSize: 13 }}>+ Agendar horário</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          agendamentos.map((a) => {
            const temMultiplos = Array.isArray(a.servicos) && a.servicos.length > 0;
            const totalValor = a.valor_final
              ? parseFloat(a.valor_final)
              : temMultiplos
                ? a.servicos.reduce((s, sv) => s + parseFloat(sv.valor || 0), 0)
                : parseFloat(a.servico_valor || 0);

            const nomesServicos = temMultiplos
              ? a.servicos.map((sv) => sv.nome).join(' • ')
              : a.servico_nome;

            const realizado = a.status === 'realizado';
            const cancelado = a.status === 'cancelado';

            return (
              <View key={a.id} style={styles.agCard}>
                {/* Coluna esquerda de horário e status */}
                <View style={styles.agTimeCol}>
                  <Text style={styles.agHoraTxt}>{fmtHora(a.data_hora)}</Text>
                  <Text
                    style={[
                      styles.agStatusTxt,
                      realizado
                        ? { color: C.green }
                        : cancelado
                          ? { color: C.red }
                          : { color: C.hint },
                    ]}
                  >
                    {realizado ? 'Pago' : cancelado ? 'Cancelado' : 'Aberto'}
                  </Text>
                </View>

                {/* Coluna direita com detalhes do atendimento */}
                <View style={styles.agMainCol}>
                  <View style={S.between}>
                    <Text style={styles.agClienteTxt} numberOfLines={1}>
                      {a.cliente_nome}
                    </Text>
                    <Text style={styles.agValorTxt}>{fmt(totalValor)}</Text>
                  </View>

                  <Text style={styles.agServicosTxt} numberOfLines={2}>
                    {nomesServicos}
                  </Text>

                  {a.observacao ? (
                    <Text style={styles.agObsTxt}>{a.observacao}</Text>
                  ) : null}

                  <View style={styles.agLinksRow}>
                    {a.status === 'agendado' && (
                      <>
                        <TouchableOpacity onPress={() => setModalBaixa(a)}>
                          <Text style={styles.linkBaixa}>Concluir / Baixa</Text>
                        </TouchableOpacity>
                        <Text style={styles.dotSep}>•</Text>
                        <TouchableOpacity onPress={() => setModalEditar(a)}>
                          <Text style={styles.linkMuted}>Editar</Text>
                        </TouchableOpacity>
                        <Text style={styles.dotSep}>•</Text>
                      </>
                    )}
                    <TouchableOpacity onPress={() => remover(a.id)}>
                      <Text style={styles.linkMuted}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {modalCal && (
        <ModalCalendario
          dataAtual={data}
          diasIndisponiveis={diasIndisponiveis}
          onClose={() => setModalCal(false)}
          onSelectData={(novaData) => setData(novaData)}
        />
      )}
      {modalNovo && (
        <ModalNovoAgendamento
          servicos={servicos}
          dataInicial={data}
          onClose={() => setModalNovo(false)}
          onSalvo={() => {
            setModalNovo(false);
            carregar();
          }}
        />
      )}
      {modalEditar && (
        <ModalEditarAgendamento
          agendamento={modalEditar}
          servicos={servicos}
          onClose={() => setModalEditar(null)}
          onSalvo={() => {
            setModalEditar(null);
            carregar();
          }}
        />
      )}
      {modalBaixa && (
        <ModalBaixa
          agendamento={modalBaixa}
          servicos={servicos}
          onClose={() => setModalBaixa(null)}
          onSalvo={() => {
            setModalBaixa(null);
            carregar();
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal – Novo Agendamento (com opção de criar nova cliente na hora)
// ─────────────────────────────────────────────────────────────────────────────
function ModalNovoAgendamento({ servicos, dataInicial, onClose, onSalvo }) {
  const [selecionados, setSelecionados] = useState([]);
  const [data, setData]   = useState(dataInicial);
  const [hora, setHora]   = useState('09:00');
  const [obs, setObs]     = useState('');
  const [clienteBusca, setBusca] = useState('');
  const [clienteLista, setLista] = useState([]);
  const [cliente, setCliente]    = useState(null);

  // Cadastro rápido de cliente sem sair do modal
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [novoNome, setNovoNome]             = useState('');
  const [novoTel, setNovoTel]               = useState('');

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

  const salvarClienteRapida = async () => {
    if (!novoNome.trim() || !novoTel.trim()) {
      return Alert.alert('Atenção', 'Preencha nome e WhatsApp da nova cliente.');
    }
    try {
      const criada = await clientesApi.criar({ nome: novoNome.trim(), telefone: novoTel.trim() });
      setCliente(criada);
      setCriandoCliente(false);
      setNovoNome('');
      setNovoTel('');
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  };

  const salvar = async () => {
    if (!cliente)                  return Alert.alert('Atenção', 'Selecione uma cliente.');
    if (selecionados.length === 0) return Alert.alert('Atenção', 'Selecione ao menos um serviço.');
    try {
      await agendamentosApi.criar({
        cliente_id:  cliente.id,
        servico_ids: selecionados.map((s) => s.id),
        servico_id:  selecionados[0].id,
        data_hora:   `${data}T${hora}:00-03:00`,
        observacao:  obs,
      });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={S.header}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Fechar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Novo Agendamento</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 18 }}>
          <View style={[S.between, { marginBottom: 6 }]}>
            <Text style={S.label}>Cliente *</Text>
            <TouchableOpacity onPress={() => setCriandoCliente(!criandoCliente)}>
              <Text style={{ fontSize: 12, color: C.pink, fontWeight: '600' }}>
                {criandoCliente ? '← Buscar existente' : '+ Nova cliente'}
              </Text>
            </TouchableOpacity>
          </View>

          {criandoCliente ? (
            <View style={[S.card, { backgroundColor: C.pinkLight, borderColor: C.pinkSoft }]}>
              <TextInput
                style={S.input}
                placeholder="Nome completo da cliente"
                value={novoNome}
                onChangeText={setNovoNome}
              />
              <TextInput
                style={S.input}
                placeholder="WhatsApp (43) 9 9000-0000"
                keyboardType="phone-pad"
                value={novoTel}
                onChangeText={setNovoTel}
              />
              <TouchableOpacity style={S.btnPrimary} onPress={salvarClienteRapida}>
                <Text style={S.btnPrimaryText}>Adicionar e selecionar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ClienteSelector
              cliente={cliente}
              setCliente={setCliente}
              clienteBusca={clienteBusca}
              buscarCliente={buscarCliente}
              clienteLista={clienteLista}
              setLista={setLista}
              setBusca={setBusca}
            />
          )}

          <ServicoSelector
            servicos={servicos}
            selecionados={selecionados}
            toggleServico={toggleServico}
            totalSelecionado={totalSelecionado}
          />
          <Text style={[S.label, { marginTop: 8 }]}>Data *</Text>
          <CampoData data={data} setData={setData} />
          <Text style={S.label}>Horário *</Text>
          <CampoHora hora={hora} setHora={setHora} />
          <Text style={S.label}>Observação</Text>
          <TextInput
            style={[S.input, { height: 75, textAlignVertical: 'top' }]}
            multiline
            value={obs}
            onChangeText={setObs}
            placeholder="Opcional..."
          />
          <TouchableOpacity style={[S.btnPrimary, { marginTop: 8, marginBottom: 30 }]} onPress={salvar}>
            <Text style={S.btnPrimaryText}>
              Confirmar Agendamento {totalSelecionado > 0 ? `• ${fmt(totalSelecionado)}` : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal – Editar Agendamento
// ─────────────────────────────────────────────────────────────────────────────
function ModalEditarAgendamento({ agendamento, servicos, onClose, onSalvo }) {
  const servicosIniciais = Array.isArray(agendamento.servicos) && agendamento.servicos.length > 0
    ? agendamento.servicos
    : servicos.filter((s) => s.id === agendamento.servico_id);

  const [selecionados, setSelecionados] = useState(servicosIniciais);
  const [data, setData] = useState(agendamento.data_hora.slice(0, 10));
  const [hora, setHora] = useState(fmtHora(agendamento.data_hora));
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
        data_hora:   `${data}T${hora}:00-03:00`,
        observacao:  obs,
      });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={S.header}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Fechar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Editar Agendamento</Text>
          <TouchableOpacity onPress={salvar}><Text style={{ color: C.pink, fontWeight: '600' }}>Salvar</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 18 }}>
          <View style={[S.card, { backgroundColor: C.pinkLight, borderColor: C.pinkSoft, marginBottom: 14 }]}>
            <Text style={{ fontWeight: '600', color: C.pinkDark }}>{agendamento.cliente_nome}</Text>
            <Text style={S.hint}>{agendamento.cliente_telefone}</Text>
          </View>
          <ServicoSelector
            servicos={servicos}
            selecionados={selecionados}
            toggleServico={toggleServico}
            totalSelecionado={totalSelecionado}
          />
          <Text style={[S.label, { marginTop: 8 }]}>Data *</Text>
          <CampoData data={data} setData={setData} />
          <Text style={S.label}>Horário *</Text>
          <CampoHora hora={hora} setHora={setHora} />
          <Text style={S.label}>Observação</Text>
          <TextInput
            style={[S.input, { height: 75, textAlignVertical: 'top' }]}
            multiline
            value={obs}
            onChangeText={setObs}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal – Dar Baixa
// ─────────────────────────────────────────────────────────────────────────────
function ModalBaixa({ agendamento, servicos, onClose, onSalvo }) {
  const servicosIniciais = Array.isArray(agendamento.servicos) && agendamento.servicos.length > 0
    ? agendamento.servicos
    : servicos.filter((s) => s.id === agendamento.servico_id);

  const [selecionados, setSelecionados] = useState(servicosIniciais);
  const [status, setStatus]             = useState('realizado');
  const [obs, setObs]                   = useState(agendamento.observacao || '');
  const [valorCustom, setValorCustom]   = useState('');

  const totalTabela = selecionados.reduce((s, sv) => s + parseFloat(sv.valor || 0), 0);

  const toggleServico = (servico) => {
    setSelecionados((prev) => {
      const jaEsta = prev.some((s) => s.id === servico.id);
      return jaEsta ? prev.filter((s) => s.id !== servico.id) : [...prev, servico];
    });
  };

  const confirmar = async () => {
    try {
      const valorFinal = valorCustom ? parseFloat(valorCustom) : totalTabela;
      await agendamentosApi.darBaixa(agendamento.id, {
        status,
        observacao:  obs,
        servico_ids: selecionados.map((s) => s.id),
        valor_final: valorFinal,
      });
      onSalvo();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={S.header}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.muted }}>Fechar</Text></TouchableOpacity>
          <Text style={S.headerTitle}>Concluir Atendimento</Text>
          <TouchableOpacity onPress={confirmar}><Text style={{ color: C.green, fontWeight: '600' }}>Confirmar</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 18 }}>
          <View style={[S.card, { backgroundColor: C.pinkLight, borderColor: C.pinkSoft, marginBottom: 14 }]}>
            <Text style={{ fontWeight: '600', color: C.pinkDark, fontSize: 15 }}>{agendamento.cliente_nome}</Text>
            <Text style={S.hint}>{fmtHora(agendamento.data_hora)}</Text>
          </View>

          <Text style={S.label}>Resultado do atendimento</Text>
          <View style={[S.row, { marginBottom: 16 }]}>
            {[
              { val: 'realizado', label: 'Realizado', cor: C.green, bg: C.greenLight },
              { val: 'cancelado', label: 'Cancelado', cor: C.red,   bg: C.redLight   },
            ].map((op) => (
              <TouchableOpacity
                key={op.val}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: status === op.val ? op.cor : C.border,
                  backgroundColor: status === op.val ? op.bg : 'white',
                }}
                onPress={() => setStatus(op.val)}
              >
                <Text style={{ fontWeight: '600', color: status === op.val ? op.cor : C.muted }}>{op.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {status === 'realizado' && (
            <>
              <ServicoSelector
                servicos={servicos}
                selecionados={selecionados}
                toggleServico={toggleServico}
                totalSelecionado={totalTabela}
              />
              <Text style={[S.label, { marginTop: 10 }]}>
                Valor cobrado (deixe em branco para {fmt(totalTabela)})
              </Text>
              <TextInput
                style={S.input}
                keyboardType="decimal-pad"
                placeholder={`Padrão: ${fmt(totalTabela)}`}
                value={valorCustom}
                onChangeText={setValorCustom}
              />
            </>
          )}

          <Text style={S.label}>Observação</Text>
          <TextInput
            style={[S.input, { height: 75, textAlignVertical: 'top' }]}
            multiline
            value={obs}
            onChangeText={setObs}
          />

          <TouchableOpacity
            style={[S.btnPrimary, { backgroundColor: status === 'realizado' ? C.green : C.red, marginTop: 8 }]}
            onPress={confirmar}
          >
            <Text style={S.btnPrimaryText}>
              {status === 'realizado' ? 'Confirmar Recebimento' : 'Confirmar Cancelamento'}
            </Text>
          </TouchableOpacity>
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
    <View style={{ marginBottom: 12 }}>
      {cliente ? (
        <View style={[S.between, S.card, { backgroundColor: C.pinkLight, borderColor: C.pinkSoft, marginBottom: 0 }]}>
          <View>
            <Text style={{ fontWeight: '600', color: C.pinkDark }}>{cliente.nome}</Text>
            <Text style={S.hint}>{cliente.telefone}</Text>
          </View>
          <TouchableOpacity onPress={() => { setCliente(null); setBusca(''); }}>
            <Text style={{ color: C.pink, fontSize: 12, fontWeight: '600' }}>Trocar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            style={[S.input, { marginBottom: 4 }]}
            placeholder="Digite o nome ou telefone..."
            value={clienteBusca}
            onChangeText={buscarCliente}
          />
          {clienteLista.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={{
                padding: 11, backgroundColor: 'white',
                borderWidth: 1, borderColor: C.border, borderRadius: 10, marginBottom: 4,
              }}
              onPress={() => { setCliente(c); setLista([]); }}
            >
              <Text style={S.bold}>{c.nome}</Text>
              <Text style={S.hint}>{c.telefone}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

function ServicoSelector({ servicos, selecionados, toggleServico, totalSelecionado }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={[S.between, { marginBottom: 6 }]}>
        <Text style={S.label}>Serviços *</Text>
        {selecionados.length > 0 && (
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.green }}>
            Total: {fmt(totalSelecionado)}
          </Text>
        )}
      </View>
      {servicos.map((s) => {
        const marcado = selecionados.some((sel) => sel.id === s.id);
        return (
          <TouchableOpacity
            key={s.id}
            style={[
              S.between,
              {
                padding: 12, borderRadius: 12, marginBottom: 6,
                borderWidth: 1,
                borderColor: marcado ? C.pink : C.border,
                backgroundColor: marcado ? C.pinkLight : 'white',
              },
            ]}
            onPress={() => toggleServico(s)}
          >
            <Text style={{ color: marcado ? C.pinkDark : C.text, fontWeight: marcado ? '600' : '400', flex: 1 }}>
              {s.nome}
            </Text>
            <Text style={{ color: marcado ? C.pinkDark : C.muted, fontWeight: '600', fontSize: 13 }}>
              {fmt(s.valor)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topCount: {
    fontSize: 13,
    color: C.muted,
  },
  btnAgendarPill: {
    backgroundColor: C.pink,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 99,
  },
  btnAgendarPillText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  dateSelectorWrapper: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  daysStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  edgeArrowBtn: {
    width: 32,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  edgeArrowText: {
    fontSize: 22,
    color: C.pink,
    fontWeight: '600',
    lineHeight: 24,
  },
  daysStripCenter: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dayCard: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  dayCardAtivo: {
    backgroundColor: C.pink,
    borderColor: C.pink,
  },
  dayWeekTxt: {
    fontSize: 11,
    color: C.hint,
    fontWeight: '500',
  },
  dayWeekTxtAtivo: {
    color: C.pinkLight,
  },
  dayNumTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    marginTop: 2,
  },
  dayNumTxtAtivo: {
    color: 'white',
  },
  openCalendarHandle: {
    marginTop: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openCalendarText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '500',
  },
  openCalendarArrow: {
    fontSize: 11,
    color: C.pink,
  },
  agCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  agTimeCol: {
    width: 56,
    paddingTop: 1,
  },
  agHoraTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  agStatusTxt: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  agMainCol: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    paddingLeft: 14,
  },
  agClienteTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  agValorTxt: {
    fontSize: 13,
    fontWeight: '500',
    color: C.muted,
  },
  agServicosTxt: {
    fontSize: 13,
    color: C.hint,
    marginTop: 3,
  },
  agObsTxt: {
    fontSize: 12,
    color: C.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  agLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  linkBaixa: {
    fontSize: 13,
    fontWeight: '600',
    color: C.pink,
  },
  linkMuted: {
    fontSize: 13,
    color: C.hint,
  },
  dotSep: {
    fontSize: 12,
    color: C.border,
  },
});

const cal = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(58,38,48,0.35)', justifyContent: 'center', alignItems: 'center' },
  container:  { backgroundColor: 'white', borderRadius: 20, padding: 18, width: 325, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titulo:     { fontSize: 16, fontWeight: '600', color: C.text },
  navBtn:     { padding: 6, borderRadius: 10, backgroundColor: C.pinkLight },
  navTxt:     { fontSize: 18, color: C.pink, fontWeight: '600', paddingHorizontal: 4 },
  semanaRow:  { flexDirection: 'row', marginBottom: 6 },
  semanaLabel:{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.hint },
  grade:      { flexDirection: 'row', flexWrap: 'wrap' },
  celula:     { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 99 },
  celulaSelected:     { backgroundColor: C.pink },
  celulaHoje:         { borderWidth: 1.5, borderColor: C.pink },
  celulaText:         { fontSize: 13, color: C.text },
  celulaSelectedText: { color: 'white', fontWeight: '700' },
  celulaHojeText:     { color: C.pink, fontWeight: '700' },
  btnHoje:    { marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: C.pinkLight, alignItems: 'center' },
  btnHojeTxt: { color: C.pinkDark, fontWeight: '600', fontSize: 13 },
});

const relogio = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: 300, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  display:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  displayTxt:      { fontSize: 36, fontWeight: '700', color: C.hint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  displayTxtAtivo: { color: C.pink, backgroundColor: C.pinkLight },
  ampmBox:   { marginLeft: 8, gap: 4 },
  ampmBtn:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: C.bg2 },
  ampmBtnAtivo: { backgroundColor: C.pink },
  ampmTxt:      { fontSize: 12, fontWeight: '600', color: C.muted },
  ampmTxtAtivo: { color: 'white' },
  face:      { width: 200, height: 200, borderRadius: 100, backgroundColor: C.bg, position: 'relative', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  centro:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.pink },
  numero:    { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  numeroAtivo:    { backgroundColor: C.pink },
  numeroTxt:      { fontSize: 13, fontWeight: '600', color: C.text },
  numeroTxtAtivo: { color: 'white' },
  dica:      { marginTop: 14, fontSize: 11, color: C.hint, textAlign: 'center' },
});
