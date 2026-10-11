// ⚠️ Endereços da API:
// - Rede local (em casa, mesmo Wi-Fi do servidor): IP interno do Xubuntu
// - Fora de casa: domínio público via DuckDNS + porta 8443
//
// O roteador da TIM não suporta "hairpin NAT" (não redireciona de volta
// pra dentro de casa quando alguém na própria rede tenta acessar o domínio
// público). Por isso, o app tenta primeiro o endereço local; se não
// conseguir num tempo curto (sinal de que está fora de casa), cai
// automaticamente pro endereço público. O resultado fica em cache durante
// a sessão do app, pra não repetir esse teste em toda requisição.
import * as Network from 'expo-network';

const LOCAL_URL = 'http://192.168.1.8:3000/api';
const PUBLIC_URL = 'https://beautyflow.duckdns.org:8443/api';
const TIMEOUT_MS = 4000;

let baseUrlAtiva = null; // cache em memória durante a sessão do app

// [DEBUG TEMPORÁRIO] log detalhado pra investigar o "Network request failed".
// Aparece no logcat com a tag ReactNativeJS. Remover depois de resolvido.
async function logDebug(label, extra) {
  try {
    const net = await Network.getNetworkStateAsync();
    console.log(
      `[NETDEBUG ${new Date().toISOString()}] ${label} | ` +
      `conexao=${net.type} internet=${net.isInternetReachable} conectado=${net.isConnected}` +
      (extra ? ` | ${extra}` : '')
    );
  } catch (e) {
    console.log(`[NETDEBUG ${new Date().toISOString()}] ${label} | (falha ao ler estado de rede: ${e.message})` + (extra ? ` | ${extra}` : ''));
  }
}

function detalhesErro(err) {
  const extras = Object.keys(err)
    .filter((k) => !['name', 'message', 'stack'].includes(k))
    .map((k) => `${k}=${JSON.stringify(err[k])}`)
    .join(', ');
  return `${err.name}: ${err.message}` + (err.cause ? ` | cause=${JSON.stringify(err.cause)}` : '') + (extras ? ` | extras={${extras}}` : '');
}

async function fetchComTimeout(url, opts, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  await logDebug(`INICIANDO fetch -> ${url}`);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    await logDebug(`SUCESSO fetch -> ${url}`, `status=${res.status}`);
    return res;
  } catch (e) {
    await logDebug(`FALHOU fetch -> ${url}`, detalhesErro(e));
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function detectarBaseUrl() {
  try {
    await fetchComTimeout(LOCAL_URL.replace('/api', ''), {}, TIMEOUT_MS);
    return LOCAL_URL;
  } catch {
    return PUBLIC_URL;
  }
}

async function tentar(url, opts) {
  const res = await fetchComTimeout(url, opts, TIMEOUT_MS);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data;
}

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);

  if (!baseUrlAtiva) {
    baseUrlAtiva = await detectarBaseUrl();
  }

  try {
    return await tentar(baseUrlAtiva + path, opts);
  } catch (err) {
    // Se a URL em cache falhar ou travar (ex: trocou de rede no meio da
    // sessão), tenta a outra uma vez, sempre com timeout, e atualiza o cache.
    if (err.name === 'AbortError' || err.name === 'TypeError' || err.message === 'Network request failed') {
      const alternativa = baseUrlAtiva === LOCAL_URL ? PUBLIC_URL : LOCAL_URL;
      try {
        const resultado = await tentar(alternativa + path, opts);
        baseUrlAtiva = alternativa;
        return resultado;
      } catch (err2) {
        // [DEBUG TEMPORÁRIO] mostra as duas URLs tentadas e o erro real de cada uma
        throw new Error(
          `[DEBUG] 1ª tentativa (${baseUrlAtiva}${path}): ${detalhesErro(err)} | ` +
          `2ª tentativa (${alternativa}${path}): ${detalhesErro(err2)}`
        );
      }
    }
    throw new Error(`[DEBUG] ${baseUrlAtiva}${path} -> ${detalhesErro(err)}`);
  }
}

export const api = {
  get:    (p)    => req('GET',    p),
  post:   (p, b) => req('POST',  p, b),
  put:    (p, b) => req('PUT',   p, b),
  patch:  (p, b) => req('PATCH', p, b),
  delete: (p)    => req('DELETE', p),
};

export const clientesApi = {
  listar:      ()         => api.get('/clientes'),
  buscar:      (q)        => api.get(`/clientes/search?q=${encodeURIComponent(q)}`),
  criar:       (body)     => api.post('/clientes', body),
  atualizar:   (id, body) => api.put(`/clientes/${id}`, body),
  excluir:     (id)       => api.delete(`/clientes/${id}`),
};

export const servicosApi = {
  listar:      ()         => api.get('/servicos'),
  criar:       (body)     => api.post('/servicos', body),
  atualizar:   (id, body) => api.put(`/servicos/${id}`, body),
  excluir:     (id)       => api.delete(`/servicos/${id}`),
};

export const agendamentosApi = {
  listarPorData:           (data)         => api.get(`/agendamentos?data=${data}`),
  sincronizarNotificacoes: ()             => api.get('/agendamentos/sincronizar-notificacoes'),
  listarIndisponiveis:     ()             => api.get('/agendamentos/indisponiveis'),
  marcarIndisponivel:      (data, motivo) => api.post('/agendamentos/indisponiveis', { data, motivo }),
  removerIndisponivel:     (data)         => api.delete(`/agendamentos/indisponiveis/${data}`),
  criar:                   (body)         => api.post('/agendamentos', body),
  atualizar:               (id, body)     => api.put(`/agendamentos/${id}`, body),
  darBaixa:                (id, body)     => api.patch(`/agendamentos/${id}/baixa`, body),
  excluir:                 (id)           => api.delete(`/agendamentos/${id}`),
};

export const consumoApi = {
  listar:  (mes, ano) => api.get(`/consumo?mes=${mes}&ano=${ano}`),
  criar:   (body)     => api.post('/consumo', body),
  excluir: (id)       => api.delete(`/consumo/${id}`),
};

export const caixaApi = {
  relatorio: (params) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/caixa?${qs}`);
  },
};

export const retornoApi = {
  listar: (filtro = 'todas') => api.get(`/retorno?filtro=${filtro}`),
  servicosCliente: (clienteId) => api.get(`/retorno/${clienteId}/servicos`),
};

export const marketingApi = {
  gerarMensagemRetorno: (body) => api.post('/marketing/mensagem-retorno', body),
  chat: (mensagens) => api.post('/marketing/chat', { mensagens }),
};

export const whatsappApi = {
  status: () => api.get('/whatsapp/status'),
  fila: () => api.get('/whatsapp/fila'),
  enviarRetorno: (body) => api.post('/whatsapp/retorno', body),
  dispararRetornos: (body) => api.post('/whatsapp/retorno/disparar', body),
  aprovarRetornos: (ids) => api.post('/whatsapp/retorno/aprovar', { ids }),
  rejeitarRetornos: () => api.post('/whatsapp/retorno/rejeitar', {}),
  dispararCampanha: (body) => api.post('/whatsapp/campanha', body),
};

