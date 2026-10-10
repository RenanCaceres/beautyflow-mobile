// src/services/notifications.js
// Gerencia todas as notificações locais do BeautyFlow:
//   1. Resumo matinal às 07:00 — lembra das clientes do dia e seus horários marcados.
//   2. Lembrete 30 minutos antes — lembra da cliente e do serviço antes do horário marcado.
//   3. Lembrete de Dar Baixa 12 horas depois — lembra de dar baixa no atendimento após 12h da data/hora marcada.
//   4. Fechamento do Mês — no último dia do mês, envia resumo de quanto recebeu, quanto gastou e o lucro.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { agendamentosApi } from './api';
import { fmt } from '../theme';

const CHANNEL_ID = 'beautyflow';

// Evita disparar repetidamente lembretes imediatos de baixa já vencidos na mesma sessão
const baixasAtrasadasJaNotificadas = new Set();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Permissão e Canal Android ────────────────────────────────────────────────

export async function pedirPermissao() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'BeautyFlow – Alertas e Lembretes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#D4537E',
        sound: 'default',
      });
    }

    const atual = await Notifications.getPermissionsAsync();
    if (atual.status === 'granted') return true;

    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.status === 'granted';
  } catch (e) {
    console.warn('[Notificacoes] Erro ao pedir permissão:', e.message);
    return false;
  }
}

// ─── Helpers de Data/Hora e Trigger Compatível (Expo SDK 50 / 51 / 52+) ───────

function criarTriggerData(dateObj) {
  // Compatível tanto com expo-notifications ~0.28 (SDK 51) quanto ~0.29+ (SDK 52+)
  if (Notifications.SchedulableTriggerInputTypes?.DATE) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dateObj,
      channelId: CHANNEL_ID,
    };
  }
  return {
    date: dateObj,
    channelId: CHANNEL_ID,
  };
}

function parseDataHoraLocal(dataHora) {
  const iso = typeof dataHora === 'string' ? dataHora : new Date(dataHora).toISOString();
  const dataParte = iso.slice(0, 10); // YYYY-MM-DD
  const horaParte = iso.length >= 16 ? iso.slice(11, 16) : '09:00'; // HH:MM
  const [ano, mes, dia] = dataParte.split('-').map(Number);
  const [hora, min] = horaParte.split(':').map(Number);
  return new Date(ano, mes - 1, dia, hora || 0, min || 0, 0, 0);
}

function horaFormatada(dataHora) {
  if (typeof dataHora === 'string' && dataHora.length >= 16) {
    return dataHora.slice(11, 16);
  }
  return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dataFormatadaCurta(dataHora) {
  const iso = typeof dataHora === 'string' ? dataHora.slice(0, 10) : new Date(dataHora).toISOString().slice(0, 10);
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

function nomesServicosAgendamento(ag) {
  if (Array.isArray(ag.servicos) && ag.servicos.length > 0) {
    return ag.servicos.map((s) => s.nome).join(' + ');
  }
  return ag.servico_nome || 'Atendimento';
}

const MESES_NOMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ─── Sincronização Completa de Todas as Notificações ──────────────────────────

let sincronizando = false;

export async function sincronizarTodasNotificacoes() {
  if (sincronizando) return;
  sincronizando = true;

  try {
    const temPermissao = await pedirPermissao();
    if (!temPermissao) return;

    const dados = await agendamentosApi.sincronizarNotificacoes();
    const agendamentos = Array.isArray(dados?.agendamentos) ? dados.agendamentos : [];
    const fechamentoAtual = dados?.fechamentoMesAtual;

    // Limpa agendamentos futuros antigos para recriar sem duplicatas
    await Notifications.cancelAllScheduledNotificationsAsync();

    const agora = Date.now();
    const pendentes = agendamentos.filter((a) => a.status === 'agendado');

    // Agrupa agendamentos pendentes por data (YYYY-MM-DD) para o Resumo Matinal às 07:00
    const porData = new Map();
    for (const ag of pendentes) {
      const dataIso = String(ag.data_hora).slice(0, 10);
      if (!porData.has(dataIso)) porData.set(dataIso, []);
      porData.get(dataIso).push(ag);
    }

    // ── 1. Resumo matinal todo dia às 07:00 da manhã ──────────────────────────
    for (const [dataIso, listaDia] of porData.entries()) {
      const [ano, mes, dia] = dataIso.split('-').map(Number);
      const alvo7h = new Date(ano, mes - 1, dia, 7, 0, 0, 0);

      if (alvo7h.getTime() > agora) {
        const resumoClientes = listaDia
          .map((a) => `${a.cliente_nome} às ${horaFormatada(a.data_hora)}`)
          .join(', ');
        const plural = listaDia.length > 1 ? 'clientes agendadas' : 'cliente agendada';

        await Notifications.scheduleNotificationAsync({
          identifier: `resumo_${dataIso}`,
          content: {
            title: `☀️ Bom dia! ${listaDia.length} ${plural} hoje`,
            body: resumoClientes,
            sound: true,
          },
          trigger: criarTriggerData(alvo7h),
        });
      }
    }

    // ── 2. Lembrete 30 min antes & 3. Lembrete de Dar Baixa 12h depois ────────
    for (const ag of pendentes) {
      const dtAtendimento = parseDataHoraLocal(ag.data_hora);
      const servicosTxt = nomesServicosAgendamento(ag);
      const horaTxt = horaFormatada(ag.data_hora);

      // 2) 30 minutos antes do atendimento
      const alvo30m = new Date(dtAtendimento.getTime() - 30 * 60 * 1000);
      if (alvo30m.getTime() > agora) {
        await Notifications.scheduleNotificationAsync({
          identifier: `lembrete_30m_${ag.id}`,
          content: {
            title: '⏰ Atendimento em 30 minutos',
            body: `${ag.cliente_nome} às ${horaTxt} — ${servicosTxt}`,
            sound: true,
          },
          trigger: criarTriggerData(alvo30m),
        });
      }

      // 3) 12 horas depois do horário marcado (Lembrar de dar baixa)
      const alvoBaixa12h = new Date(dtAtendimento.getTime() + 12 * 60 * 60 * 1000);
      if (alvoBaixa12h.getTime() > agora) {
        await Notifications.scheduleNotificationAsync({
          identifier: `baixa_12h_${ag.id}`,
          content: {
            title: '📝 Lembrete: Dar baixa no atendimento',
            body: `Já se passaram 12h do horário de ${ag.cliente_nome} (${servicosTxt} às ${horaTxt}). Não esqueça de dar baixa!`,
            sound: true,
          },
          trigger: criarTriggerData(alvoBaixa12h),
        });
      } else if (!baixasAtrasadasJaNotificadas.has(ag.id)) {
        // Já passaram mais de 12h e ainda está como 'agendado': lembra imediatamente (uma vez na sessão)
        baixasAtrasadasJaNotificadas.add(ag.id);
        const disparoCurto = new Date(Date.now() + 4000);
        await Notifications.scheduleNotificationAsync({
          identifier: `baixa_pendente_${ag.id}`,
          content: {
            title: '📝 Atendimento pendente de baixa (+12h)',
            body: `${ag.cliente_nome} (${servicosTxt} em ${dataFormatadaCurta(ag.data_hora)} às ${horaTxt}) ainda está sem baixa na agenda.`,
            sound: true,
          },
          trigger: criarTriggerData(disparoCurto),
        });
      }
    }

    // ── 4. Notificação de Fechamento do Mês (no final do mês) ─────────────────
    if (fechamentoAtual && fechamentoAtual.mes && fechamentoAtual.ano) {
      const { mes, ano, entradas, saidas, lucro } = fechamentoAtual;
      // Último dia do mês às 20:00
      const ultimoDiaMes = new Date(ano, mes, 0).getDate();
      let alvoFechamento = new Date(ano, mes - 1, ultimoDiaMes, 20, 0, 0, 0);

      // Se hoje já é o último dia do mês e já passou das 20h, agenda para 21:30 se ainda futuro
      if (alvoFechamento.getTime() <= agora) {
        const hoje = new Date();
        if (hoje.getDate() === ultimoDiaMes && hoje.getHours() < 23) {
          alvoFechamento = new Date(ano, mes - 1, ultimoDiaMes, 23, 0, 0, 0);
        }
      }

      if (alvoFechamento.getTime() > agora) {
        const nomeMes = MESES_NOMES[mes] || `${mes}/${ano}`;
        await Notifications.scheduleNotificationAsync({
          identifier: `fechamento_mes_${ano}_${mes}`,
          content: {
            title: `📊 Fechamento do Mês — ${nomeMes}`,
            body: `Recebeu: ${fmt(entradas)} | Gastou: ${fmt(saidas)} | Lucro: ${fmt(lucro)}`,
            sound: true,
          },
          trigger: criarTriggerData(alvoFechamento),
        });
      }
    }
  } catch (e) {
    console.warn('[Notificacoes] Falha ao sincronizar notificações:', e.message);
  } finally {
    sincronizando = false;
  }
}

// Mantido para compatibilidade com chamadas existentes na tela de Agenda
export async function agendarNotificacoesParaData() {
  return sincronizarTodasNotificacoes();
}
