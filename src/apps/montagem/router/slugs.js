// Sorelly Admin · montagem e bipagem — router/slugs.js
//
// No HTML original a tela ativa era `state.aba` (uma string curta, guardada no
// localStorage). Aqui a chave `aba` continua a mesma — o reducer não mudou —
// e ganha um slug legível que é o que aparece na URL.
//
// Para criar uma página nova: acrescente a aba em navigation/abas.js, o slug
// aqui e a rota em router/rotas.js. Nada mais precisa ser tocado.

import { SETORES, ondeEsta } from "@/apps/montagem/navigation/setores";

function noMenu(lista, aba) {
  return (lista || []).some(function (n) { return n.aba === aba || noMenu(n.itens, aba); });
}
/** Setor dono da tela: o das áreas do setor; se a tela só aparece no menu em texto do setor (campo `menu`), esse. */
export function setorDaAba(aba) {
  var o = ondeEsta(aba);
  if (o) return o.setor;
  return SETORES.find(function (st) { return noMenu(st.menu, aba); }) || null;
}

// Endereço novo (28/10/2026, pedido do Marcus): /setor/tela (ex.: /atendimento-interno/revendedoras), sem o "montagem".
// O prefixo "/montagem" era o nome do primeiro app do sistema; os endereços antigos (/montagem/atendimento-interno-revendedoras) continuam abrindo e levam ao novo.
// SLUG_DA_ABA guarda o nome ANTIGO de cada tela (ele serve para reconhecer os links antigos e as rotas em router/rotas.js); o endereço novo sai do menu:
// setor (nome do setor) + tela (o nome antigo sem o começo repetido do setor).
export const BASE_ANTIGA = "/montagem";

export const SLUG_DA_ABA = {
  painel: "listagens",
  visaobip: "visao-bipagem",
  agpainel: "agendamento",
  agrevs: "agendamento-revendedoras",
  agreps: "agendamento-representantes",
  agabertura: "agendamento-abertura",
  agconfig: "agendamento-configurador",
  aganalises: "agendamento-analises",
  aghistorico: "agendamento-historico",
  agbonus: "comissoes-bonus-agendamento",
  agmetas: "comissoes-metas-agendamento",
  cpagamentos: "controle-de-pagamentos",
  ctapagar: "contas-a-pagar-empresa-e-familia",
  ctalista: "contas-a-pagar",
  emprestimos: "emprestimos",
  chavespix: "chaves-pix-e-regras",
  chavespixbanco: "chaves-pix-dos-bancos",
  comlink: "comissoes-link-de-pagamento",
  adquirentes: "adquirentes-e-taxas",
  cfvisao: "cobranca-visao-geral",
  cfdevendo: "cobranca-devendo",
  cfquitados: "cobranca-quitadas",
  cfrelatorio: "cobranca-relatorios",
  cffunc: "cobranca-funcionarias",
  cfconfig: "cobranca-configuracao",
  cfregras: "cobranca-regras",
  pfresumo: "pf-resumo",
  pflanc: "pf-lancamento",
  pfneg: "pf-negociacoes",
  pfmaq: "pf-maquininha",
  pfforn: "pf-fornecedores",
  pfprest: "pf-prestadores",
  pfcadastro: "pf-cadastro",
  direcionar: "direcionar-pix",
  dircontas: "pagamentos-contas-das-representantes",
  dirregras: "pagamentos-regras-do-pix",
  ffhome: "ff-home",
  ffalertas: "ff-alertas",
  ffcontas: "ff-contas-a-pagar",
  ffpagas: "ff-contas-pagas",
  ffpix: "ff-pix-revendedoras",
  ffprest: "ff-prestadores",
  ffsocios: "ff-socios",
  ffprolab: "ff-pro-labores",
  ffrelatorio: "ff-relatorio",
  ffhist: "ff-historico",
  ffconfig: "ff-configuracoes",
  comdatas: "comissoes-datas-pagamento",
  meudesemp: "meu-desempenho",
  calc: "calculadora",
  consolidado: "consolidado",
  relatorios: "relatorios",
  equipe: "equipe",
  avalrep: "representantes",
  registros: "registros",
  regras: "regras",
  regrasrep: "regras-representantes",
  regrasacerto: "regras-acertos",
  informativos: "informativos",
  regreposicao: "regras-reposicao",
  expositores: "expositores",
  comprasrep: "compras-joias-representantes",
  configrep: "configuracoes-representantes",
  consrep: "consolidado-representantes",
  placar: "placar-representantes",
  controlekits: "controle-de-kits",
  inadfin: "inadimplencia-financeira",
  comissoes: "comissoes",
  pixdireto: "pix-representantes",
  inadimp: "inadimplencia",
  comconfig: "configurador-comissoes",
  intlist: "atendimento-interno-listagens",
  intrevs: "atendimento-interno-revendedoras",
  intcalc: "atendimento-interno-calculadora",
  intcons: "atendimento-interno-consolidado",
  condicionais: "condicionais",
  kitnovo: "revendedoras-novas",
  knpendencias: "kits-novos-pendencias",
  knconsolidado: "kits-novos-consolidado",
  knregras: "kits-novos-regras",
  knconfigurador: "kits-novos-configurador",
  config: "configurador",
  avisos: "avisos",
  padrao: "padrao-visual",
  versoes: "versoes",
  aprovacaocad: "aprovacao-de-cadastros",
  indicacoes: "indicacoes",
  msgcad: "mensagens-prontas",
  repcad: "representantes-do-setor",
  compras: "compras-e-estoque",
  linkpag: "link-de-pagamento",
  linkrel: "relatorio-de-links",
  melhorias: "melhorias",
  garantia: "garantia",
  marketing: "marketing",
  encomendas: "encomendas-e-reposicoes",
  encida: "ida-na-empresa",
  enctop50: "top-50",
  encrep: "reposicao-representantes",
  encregras: "regras-e-mensagens-reposicao",
  avaliacoes: "avaliacoes",
  equipes: "equipes",
  estoquesorelly: "estoque-sorelly",
  producao: "producao",
  cadpecas: "cadastro-de-pecas",
  prefkit: "preferencias-do-kit",
  pedirpecas: "pedir-pecas",
  desempenhocad: "desempenho-do-cadastro",
  celfunc: "app-funcionarias",
  celrep: "app-representante",
  vendas: "vendas-vendas",
  contaspagar: "contas-a-pagar-mensal",
  previsaocaixa: "previsao-de-caixa",
  resultado: "resultado-do-mes",
  previsaofat: "previsao-de-faturamento",
  revendedoras: "revendedoras",
  revbase: "revendedoras-ativas",
  revkits: "revendedoras-kits-e-vendas",
  revcond: "revendedoras-condicional",
  revreceber: "contas-a-receber",
  inicio: "inicio",
  apps: "apps",
  dinheiro: "dinheiro",
  comisstodos: "comissoes-de-todos",
  comisbip: "comissoes-bipagem",
  comismont: "comissoes-montagem",
  comisint: "comissoes-atendimento-interno",
  cnpjs: "cnpjs",
  caixa: "caixa",
  limitefat: "limite-de-faturamento",
  fiscal: "fiscal",
  painelacertos: "painel-dos-acertos",
  visaogeral: "visao-geral",
  rotina: "rotina-do-dia",
  pessoas: "funcionarios-e-representantes",
  rhvisao: "rh",
  rhpresenca: "rh-presenca",
  rhrelatorio: "rh-relatorio",
  rhcolab: "rh-colaboradores",
  rhadv: "rh-advertencias",
  rhexp: "rh-experiencia",
  rhhoras: "rh-horas-extras",
  rhnegoc: "rh-negociacoes",
  comcad: "comissoes-cadastro-revendedoras",
  cominad: "comissoes-inadimplencia",
  rhescala42: "rh-escala-42h",
  rhconfig: "rh-configurador",
  rhcrep: "rh-contratos-representantes",
  rhcfunc: "rh-contratos-funcionarios",
  rhcterc: "rh-contratos-terceiros",
  rhcmarcus: "rh-contratos-marcus",
  rhccred: "rh-contratos-credito",
  rhcalug: "rh-contratos-alugueis",
  rhcconsor: "rh-contratos-consorcios",
  rhcmodelos: "rh-contratos-modelos",
  acessos: "acessos-por-setor",
  fluxo: "fluxo-da-empresa",
  marcus: "marcus",
  marcusfat: "marcus-faturamento",
  marcuspat: "marcus-patrimonio",
  marcuscontas: "marcus-contas",
  marcusativ: "marcus-atividades",
  marcusacessos: "marcus-acessos",
  marcusdados: "marcus-dados",
  marcusextratos: "marcus-extratos",
  whats: "whatssorelly",
  mapa: "mapa-do-sistema",
  breve: "em-breve",
};

export const ABA_DO_SLUG = Object.keys(SLUG_DA_ABA).reduce(function (acc, aba) {
  acc[SLUG_DA_ABA[aba]] = aba;
  return acc;
}, {});

export const ABA_INICIAL = "painel";

function slugTexto(t) {
  return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
// Pastas de public/ e prefixos fixos: nenhum setor pode ter o mesmo nome (o arquivo estático ganharia da tela).
var RESERVADOS = { dados: 1, fotos: 1, regras: 1, api: 1, "kits-novos": 1, montagem: 1, "em-breve": 1 };

/** Endereço novo de cada aba: "setor/tela". Aba que não está em nenhum setor (início, chat, mapa...) fica com o nome antigo, solto. */
export const ENDERECO_DA_ABA = (function () {
  var out = {}, usados = {};
  Object.keys(SLUG_DA_ABA).forEach(function (aba) {
    var antigo = SLUG_DA_ABA[aba], dono = aba === "breve" ? null : setorDaAba(aba), fim = antigo;
    if (dono) {
      var setor = slugTexto(dono.nome);
      if (setor && !RESERVADOS[setor]) {
        var resto = antigo === setor ? "painel" : antigo.indexOf(setor + "-") === 0 ? antigo.slice(setor.length + 1) : antigo;
        var cand = setor + "/" + resto;
        if (usados[cand]) cand = setor + "/" + antigo;   // dois nomes iguais no mesmo setor: usa o nome antigo inteiro
        if (!usados[cand]) fim = cand;
      }
    }
    usados[fim] = aba;
    out[aba] = fim;
  });
  return out;
})();

export const ABA_DO_ENDERECO = Object.keys(ENDERECO_DA_ABA).reduce(function (acc, aba) {
  acc[ENDERECO_DA_ABA[aba]] = aba;
  return acc;
}, {});

/** Caminho completo de uma aba. `breve` é o nome da tela ainda não construída. */
export function caminhoDaAba(aba, breve) {
  var fim = ENDERECO_DA_ABA[aba] || ENDERECO_DA_ABA[ABA_INICIAL];
  if (aba === "breve" && breve) return "/" + fim + "/" + encodeURIComponent(breve);
  return "/" + fim;
}

/** Endereço novo de um link ANTIGO (/montagem/nome-antigo, ou só /nome-antigo). Devolve null se o nome não é de nenhuma tela. */
export function caminhoNovoDoAntigo(pathname) {
  var partes = String(pathname || "").replace(/^\/montagem(?=\/|$)/, "").split("/").filter(Boolean);
  var aba = ABA_DO_SLUG[partes[0]];
  if (!aba) return null;
  return aba === "breve" && partes[1] ? "/" + ENDERECO_DA_ABA[aba] + "/" + partes[1] : "/" + ENDERECO_DA_ABA[aba];
}

/** Lê a aba (e o nome da tela "em breve") a partir do pathname (endereço novo; o antigo também é aceito). */
export function abaDoCaminho(pathname) {
  var partes = String(pathname || "").replace(/^\/montagem(?=\/|$)/, "").split("/").filter(Boolean);
  var aba = ABA_DO_ENDERECO[partes[0] + "/" + partes[1]] || ABA_DO_ENDERECO[partes[0]];
  var usouDois = !!ABA_DO_ENDERECO[partes[0] + "/" + partes[1]];
  if (!aba) aba = ABA_DO_SLUG[partes[0]] || ABA_INICIAL;
  var resto = partes.slice(usouDois ? 2 : 1);
  var breve = aba === "breve" && resto[0] ? decodeURIComponent(resto[0]) : null;
  return { aba: aba, breve: breve };
}
