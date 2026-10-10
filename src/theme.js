import { StyleSheet } from 'react-native';

export const C = {
  pink:       '#D4537E',
  pinkLight:  '#FBEAF0',
  pinkDark:   '#993556',
  green:      '#1D9E75',
  greenLight: '#EAF3DE',
  red:        '#E24B4A',
  redLight:   '#FCEBEB',
  amber:      '#EF9F27',
  amberLight: '#FAEEDA',
  amberDark:  '#854F0B',
  bg:         '#fafaf9',
  bg2:        '#f4f3f1',
  border:     'rgba(0,0,0,0.1)',
  text:       '#1a1a18',
  muted:      '#6b6b67',
  hint:       '#9c9a94',
};

export const S = StyleSheet.create({
  // Tela
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: 16 },

  // Cabeçalho
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.text },

  // Cards
  card: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },

  // Texto
  label: { fontSize: 12, fontWeight: '500', color: C.muted, marginBottom: 4 },
  value: { fontSize: 14, color: C.text },
  bold:  { fontWeight: '600' },
  muted: { color: C.muted, fontSize: 13 },
  hint:  { color: C.hint,  fontSize: 12 },

  // Input
  input: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: 10, fontSize: 14, color: C.text, backgroundColor: C.bg2, marginBottom: 12 },

  // Botões
  btnPrimary: { backgroundColor: C.pink, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: 'white', fontWeight: '600', fontSize: 14 },
  btnGhost: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', padding: 11, borderRadius: 8, alignItems: 'center', backgroundColor: 'white' },
  btnGhostText: { color: C.muted, fontSize: 14 },
  btnSm: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

// Badge helper
export function badgeStyle(tipo) {
  const map = {
    pink:  { bg: C.pinkLight,  text: C.pinkDark },
    green: { bg: C.greenLight, text: C.green     },
    red:   { bg: C.redLight,   text: C.red       },
    amber: { bg: C.amberLight, text: C.amberDark },
    gray:  { bg: C.bg2,        text: C.muted     },
  };
  return map[tipo] || map.gray;
}

export function fmt(valor) {
  return parseFloat(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
// CORREÇÃO de fuso horário:
// O PostgreSQL retorna timestamps como "2025-05-04T14:00:00.000Z" (com Z = UTC).
// new Date(str) converte para horário local, subtraindo 3h no Brasil (UTC-3).
// A solução é ler HH:MM direto da string ISO, sem passar pelo construtor Date.
export function fmtData(d) {
  // Extrai YYYY-MM-DD direto da string, sem conversão de timezone
  const parte = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
  const [ano, mes, dia] = parte.split('-');
  return `${dia}/${mes}/${ano}`;
}
export function fmtHora(d) {
  // Extrai HH:MM direto da string ISO — ex: "2025-05-04T14:00:00.000Z" -> "14:00"
  if (typeof d === 'string' && d.length >= 16) {
    return d.slice(11, 16);
  }
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
