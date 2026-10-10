import { StyleSheet } from 'react-native';

export const C = {
  pink:       '#D4537E',
  pinkSoft:   '#F6D6E2',
  pinkLight:  '#FDF0F5',
  pinkDark:   '#9E355A',
  green:      '#1D9E75',
  greenLight: '#EAF7F2',
  red:        '#E25555',
  redLight:   '#FDF0F0',
  amber:      '#E59824',
  amberLight: '#FEF6E7',
  amberDark:  '#8F580A',
  bg:         '#FCF9FB',
  bg2:        '#F5EEF2',
  border:     '#EFE4EA',
  text:       '#3A2630',
  muted:      '#7C6872',
  hint:       '#A896A0',
};

export const S = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: 18, paddingTop: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.text },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  label: { fontSize: 12, fontWeight: '500', color: C.muted, marginBottom: 5 },
  value: { fontSize: 14, color: C.text },
  bold:  { fontWeight: '600', color: C.text },
  muted: { color: C.muted, fontSize: 13 },
  hint:  { color: C.hint,  fontSize: 12 },

  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
    backgroundColor: 'white',
    marginBottom: 12,
  },

  btnPrimary: {
    backgroundColor: C.pink,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: 'white', fontWeight: '600', fontSize: 14 },

  btnGhost: {
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  btnGhostText: { color: C.muted, fontSize: 13, fontWeight: '500' },

  btnSm: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

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

export function fmtData(d) {
  const parte = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
  const [ano, mes, dia] = parte.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function fmtHora(d) {
  if (typeof d === 'string' && d.length >= 16) {
    return d.slice(11, 16);
  }
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
