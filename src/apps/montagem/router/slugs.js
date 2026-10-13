// Sorelly Admin · montagem e bipagem — router/slugs.js
//
// No HTML original a tela ativa era `state.aba` (uma string curta, guardada no
// localStorage). Aqui a chave `aba` continua a mesma — o reducer não mudou —
// e ganha um slug legível que é o que aparece na URL.
//
// Para criar uma página nova: acrescente a aba em navigation/abas.js, o slug
// aqui e a rota em router/rotas.js. Nada mais precisa ser tocado.

export const BASE = "/montagem";

export const SLUG_DA_ABA = {
  painel: "listagens",
  calc: "calculadora",
  consolidado: "consolidado",
  relatorios: "relatorios",
  equipe: "equipe",
  avalrep: "representantes",
  registros: "registros",
  regras: "regras",
  regrasrep: "regras-representantes",
  regrasacerto: "regras-acertos",
  regreposicao: "regras-reposicao",
  expositores: "expositores",
  comprasrep: "compras-joias-representantes",
  configrep: "configuracoes-representantes",
  consrep: "consolidado-representantes",
  placar: "placar-representantes",
  controlekits: "controle-de-kits",
  inadfin: "inadimplencia-financeira",
  comissoes: "comissoes",
  pixdireto: "pix-direto-a-enviar",
  inadimp: "inadimplencia",
  comconfig: "configurador-comissoes",
  intlist: "atendimento-interno-listagens",
  intrevs: "atendimento-interno-revendedoras",
  intcalc: "atendimento-interno-calculadora",
  intcons: "atendimento-interno-consolidado",
  condicionais: "condicionais",
  celcond: "app-condicionais",
  kitnovo: "revendedoras-novas",
  knpendencias: "kits-novos-pendencias",
  knconsolidado: "kits-novos-consolidado",
  knregras: "kits-novos-regras",
  knconfigurador: "kits-novos-configurador",
  config: "configurador",
  avisos: "avisos",
  celular: "app-montadora",
  celbip: "app-bipagem",
  celrep: "app-representante",
  celrev: "app-revendedora",
  vendas: "vendas-vendas",
  contaspagar: "contas-a-pagar",
  previsaofat: "previsao-de-faturamento",
  cnpjs: "cnpjs",
  limitefat: "limite-de-faturamento",
  painelacertos: "painel-dos-acertos",
  visaogeral: "visao-geral",
  pessoas: "funcionarios-e-representantes",
  acessos: "acessos-por-setor",
  fluxo: "fluxo-da-empresa",
  breve: "em-breve",
};

export const ABA_DO_SLUG = Object.keys(SLUG_DA_ABA).reduce(function (acc, aba) {
  acc[SLUG_DA_ABA[aba]] = aba;
  return acc;
}, {});

export const ABA_INICIAL = "painel";

/** Caminho completo de uma aba. `breve` é o nome da tela ainda não construída. */
export function caminhoDaAba(aba, breve) {
  var slug = SLUG_DA_ABA[aba] || SLUG_DA_ABA[ABA_INICIAL];
  if (aba === "breve" && breve) return BASE + "/" + slug + "/" + encodeURIComponent(breve);
  return BASE + "/" + slug;
}

/** Lê a aba (e o nome da tela "em breve") a partir do pathname. */
export function abaDoCaminho(pathname) {
  var partes = pathname.replace(BASE, "").split("/").filter(Boolean);
  var aba = ABA_DO_SLUG[partes[0]] || ABA_INICIAL;
  var breve = aba === "breve" && partes[1] ? decodeURIComponent(partes[1]) : null;
  return { aba: aba, breve: breve };
}
