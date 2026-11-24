// REPRESENTANTE COM MAIS DE UM CADASTRO (24/11/2026, Marcus: Thalita tem BI, CU e CV; Anne tem E2, EE e EX; a conta dela tem que ver tudo).
// sorelly.conta.rep_cod = código PRINCIPAL (BI); sorelly.conta.rep_extra = códigos a mais, separados por vírgula (CU,CV).
// Código antigo que lê só rep_cod continua certo (vê só o principal): por isso os extras ficam em coluna própria.
export const listaCodigos = (principal, extra) => {
  const vistos = new Set(), saida = [];
  [String(principal || "")].concat(String(extra || "").split(",")).forEach((c) => {
    const x = c.trim().toUpperCase();
    if (x && !vistos.has(x)) { vistos.add(x); saida.push(x); }
  });
  return saida;
};
// aceita a conta (eu) ou um código solto; devolve sempre uma lista
export const codigosDe = (eu) => (eu && Array.isArray(eu.repCods) && eu.repCods.length ? eu.repCods : listaCodigos(eu && eu.repCod, ""));
