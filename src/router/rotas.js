// Sorelly Admin — tabela de rotas
//
// Uma entrada por página. `lazy` faz o React Router baixar o chunk da página
// antes de trocar a tela: cada página vira um arquivo .js separado no build e
// só chega ao navegador quando alguém abre aquela tela.
//
// Para criar uma página nova, acrescente uma linha aqui. Nada mais.
import { e } from "@/shared/react";
import { Navigate, useLocation, useOutletContext } from "react-router-dom";

/**
 * Rota com a página carregada sob demanda.
 *
 * A casca de cada app passa os dados comuns pelo contexto do <Outlet/>; aqui
 * eles voltam a ser props, que é como as telas já esperavam recebê-los no HTML
 * original — nenhuma página precisou ser adaptada.
 */
const pagina = (path, carregar, exportado) => ({
  path,
  lazy: async () => {
    const mod = await carregar();
    const Pagina = exportado ? mod[exportado] : mod.default;
    const Rota = () => e(Pagina, useOutletContext() || null);
    Rota.displayName = "Rota(" + (exportado || "default") + ")";
    return { Component: Rota };
  },
});

/**
 * Rota de uma tela do Kits novos (Curitiba) embutida dentro do admin.
 *
 * Tela e estado (reducer/Ctx do Kits novos) vêm sempre do mesmo arquivo —
 * KitsNovosEmbutido —, cada uma exportando um componente já pronto pra rota.
 * A planilha (~2 mil linhas) é carregada uma vez só: carregarDados() guarda
 * a promessa, então abrir uma segunda tela do Kits novos não baixa de novo.
 */
const paginaKN = (path, exportado) => ({
  path,
  loader: async () => {
    const { carregarDados } = await import("@/apps/kits-novos/data/dados");
    await carregarDados();
    return null;
  },
  lazy: async () => ({ Component: (await import("@/apps/montagem/pages/KitsNovosEmbutido"))[exportado] }),
});

const montagem = {
  path: "montagem",
  lazy: async () => ({ Component: (await import("@/apps/montagem/App")).default }),
  children: [
    { index: true, element: e(Navigate, { to: "visao-geral", replace: true }) },   // por pedido do Marcus (22/10/2026): ao abrir o sistema aparece sempre a Visão geral (antes era Regras de reposição, de 07/10/2026)
    pagina("listagens", () => import("@/apps/montagem/pages/Painel"), "AbaPainel"),
    pagina("agendamento", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgPainel"),
    pagina("agendamento-remarcacoes", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgRemarc"),
    pagina("plano-45-60-indicacoes", () => import("@/apps/montagem/pages/Plano4560"), "AbaP45Ind"),
    pagina("plano-45-60-aprovacao", () => import("@/apps/montagem/pages/Plano4560"), "AbaP45Apr"),
    pagina("plano-45-60-acompanhamento", () => import("@/apps/montagem/pages/Plano4560"), "AbaP45Acomp"),
    pagina("plano-45-60-alinhamento", () => import("@/apps/montagem/pages/Plano4560"), "AbaP45Alin"),
    pagina("plano-45-60-mensagens", () => import("@/apps/montagem/pages/Plano4560Msgs"), "AbaP45Msg"),
    pagina("plano-45-60-painel", () => import("@/apps/montagem/pages/Plano4560"), "AbaP45Pnl"),
    pagina("agendamento-representantes", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgReps"),
    pagina("agendamento-abertura", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgAbertura"),
    pagina("agendamento-configurador", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgConfig"),
    pagina("agendamento-analises", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgAnalises"),
    pagina("agendamento-historico", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgHistorico"),
    pagina("comissoes-bonus-agendamento", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgComissoes"),
    pagina("ff-home", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfHome"),
    pagina("ff-alertas", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfAlertas"),
    pagina("ff-contas-a-pagar", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfContas"),
    pagina("ff-contas-pagas", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfPagas"),
    pagina("ff-pix-revendedoras", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfPix"),
    pagina("ff-socios", () => import("@/apps/montagem/pages/FinFamiliarSocios"), "AbaFfSocios"),
    pagina("ff-prestadores", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfPrest"),
    pagina("ff-pro-labores", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfProlab"),
    pagina("ff-relatorio", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfRelatorio"),
    pagina("ff-historico", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfHist"),
    pagina("ff-configuracoes", () => import("@/apps/montagem/pages/FinFamiliar"), "AbaFfConfig"),
    pagina("pf-resumo", () => import("@/apps/montagem/pages/pf/Resumo"), "AbaPfResumo"),
    pagina("pf-lancamento", () => import("@/apps/montagem/pages/pf/Lancamentos"), "AbaPfLanc"),
    pagina("pf-negociacoes", () => import("@/apps/montagem/pages/pf/Negociacoes"), "AbaPfNeg"),
    pagina("pf-maquininha", () => import("@/apps/montagem/pages/pf/Maquininha"), "AbaPfMaq"),
    pagina("pf-fornecedores", () => import("@/apps/montagem/pages/pf/Fornecedores"), "AbaPfForn"),
    pagina("pf-prestadores", () => import("@/apps/montagem/pages/pf/Fornecedores"), "AbaPfPrest"),
    pagina("pf-cadastro", () => import("@/apps/montagem/pages/pf/Fornecedores"), "AbaPfCadastro"),
    pagina("direcionar-pix", () => import("@/apps/montagem/pages/DirecionarPix"), "AbaDirecionar"),
    pagina("pagamentos-contas-das-representantes", () => import("@/apps/montagem/pages/DirecionarPix"), "AbaContasRep"),
    pagina("pagamentos-regras-do-pix", () => import("@/apps/montagem/pages/DirecionarPix"), "AbaRegrasPix"),
    pagina("cobranca-visao-geral", () => import("@/apps/montagem/pages/CobrancaFunc"), "AbaCfVisao"),
    pagina("cobranca-devendo", () => import("@/apps/montagem/pages/CobrancaFunc"), "AbaCfDevendo"),
    pagina("cobranca-quitadas", () => import("@/apps/montagem/pages/CobrancaFunc"), "AbaCfQuitados"),
    pagina("cobranca-relatorios", () => import("@/apps/montagem/pages/CobrancaFunc"), "AbaCfRelatorio"),
    pagina("cobranca-funcionarias", () => import("@/apps/montagem/pages/CobrancaFunc"), "AbaCfFuncionarias"),
    pagina("cobranca-configuracao", () => import("@/apps/montagem/pages/CobrancaFunc"), "AbaCfConfig"),
    pagina("cobranca-regras", () => import("@/apps/montagem/pages/CobrancaFunc"), "AbaCfRegras"),
    pagina("controle-de-pagamentos", () => import("@/apps/montagem/pages/ControlePagamentos"), "AbaControlePagamentos"),
    pagina("contas-a-pagar-empresa-e-familia", () => import("@/apps/montagem/pages/ContasPagarEmpresa"), "AbaCtaPagar"),
    pagina("contas-a-pagar", () => import("@/apps/montagem/pages/ContasPagarLista"), "AbaCtaLista"),
    pagina("comissoes-datas-pagamento", () => import("@/apps/montagem/pages/ComissoesDatas"), "AbaComDatas"),
    pagina("comissoes-metas-agendamento", () => import("@/apps/montagem/pages/Agendamento"), "AbaAgMetas"),
    pagina("visao-bipagem", () => import("@/apps/montagem/pages/VisaoBipagem"), "AbaVisaoBipagem"),
    pagina("meu-desempenho", () => import("@/apps/montagem/pages/MeuDesempenho"), "AbaMeuDesempenho"),
    pagina("calculadora", () => import("@/apps/montagem/pages/Calculadora"), "AbaCalculadora"),
    pagina("consolidado", () => import("@/apps/montagem/pages/Consolidado"), "AbaConsolidado"),
    pagina("relatorios", () => import("@/apps/montagem/pages/Relatorios"), "AbaRelatorios"),
    pagina("equipe", () => import("@/apps/montagem/pages/Equipe"), "AbaEquipe"),
    pagina("representantes", () => import("@/apps/montagem/pages/AvalRep"), "AbaAvalRep"),
    pagina("registros", () => import("@/apps/montagem/pages/Registros"), "AbaRegistros"),
    pagina("regras", () => import("@/apps/montagem/pages/Regras"), "AbaRegras"),
    pagina("regras-representantes", () => import("@/apps/montagem/pages/RegrasRepresentantes"), "AbaRegrasRepresentantes"),
    pagina("informativos", () => import("@/apps/montagem/pages/Informativos"), "AbaInformativos"),
    pagina("regras-acertos", () => import("@/apps/montagem/pages/RegrasAcertos"), "AbaRegrasAcertos"),
    pagina("regras-reposicao", () => import("@/apps/montagem/pages/RegrasReposicao"), "AbaRegrasReposicao"),
    pagina("expositores", () => import("@/apps/montagem/pages/ExpositoresModulo"), "AbaExpositoresModulo"),   // a tela antiga (pages/Expositores.js, só fotos) virou a aba "Fotos dos kits novos"
    pagina("compras-joias-representantes", () => import("@/apps/montagem/pages/ComprasJoias"), "AbaComprasJoias"),
    pagina("consolidado-representantes", () => import("@/apps/montagem/pages/ConsolidadoRepresentantes"), "AbaConsolidadoRep"),
    pagina("placar-representantes", () => import("@/apps/montagem/pages/PlacarRepresentantes"), "AbaPlacarRep"),
    pagina("controle-de-kits", () => import("@/apps/montagem/pages/ControleKits"), "AbaControleKits"),
    pagina("inadimplencia-financeira", () => import("@/apps/montagem/pages/InadimplenciaFin"), "AbaInadimplenciaFin"),
    pagina("comissoes", () => import("@/apps/montagem/pages/Comissoes"), "AbaComissoes"),
    pagina("pix-representantes", () => import("@/apps/montagem/pages/PixDireto"), "AbaPixDireto"),
    pagina("inadimplencia", () => import("@/apps/montagem/pages/Inadimplencia"), "AbaInadimplencia"),
    pagina("configurador-comissoes", () => import("@/apps/montagem/pages/ConfigComissoes"), "AbaConfigComissoes"),
    pagina("atendimento-interno-listagens", () => import("@/apps/montagem/pages/AtendimentoInternoListagens"), "AbaIntListagens"),
    pagina("atendimento-interno-revendedoras", () => import("@/apps/montagem/pages/RevendedorasInternas"), "AbaRevendedorasInternas"),
    pagina("atendimento-interno-consolidado", () => import("@/apps/montagem/pages/ConsolidadoInterno"), "AbaConsolidadoInterno"),
    pagina("atendimento-interno-calculadora", () => import("@/apps/montagem/pages/AtendimentoInternoCalculadora"), "AbaIntCalculadora"),
    pagina("configuracoes-representantes", () => import("@/apps/montagem/pages/ConfigRepresentantes"), "AbaConfigRepresentantes"),
    pagina("condicionais", () => import("@/apps/montagem/pages/Condicionais"), "AbaCondicionais"),
    pagina("app-condicionais", () => import("@/apps/montagem/pages/CelularCondicionais"), "AbaCelularCond"),
    paginaKN("revendedoras-novas", "AbaKitsNovosEmbutido"),
    paginaKN("representantes-do-setor", "AbaRepCadastroEmbutido"),
    paginaKN("kits-novos-pendencias", "AbaPendenciasEmbutido"),
    paginaKN("kits-novos-consolidado", "AbaConsolidadoKNEmbutido"),
    paginaKN("kits-novos-regras", "AbaRegrasKNEmbutido"),
    paginaKN("kits-novos-configurador", "AbaConfigKNEmbutido"),
    pagina("configurador", () => import("@/apps/montagem/pages/ConfiguradorGeral"), "AbaConfiguradorGeral"),
    pagina("estoque-sorelly", () => import("@/apps/montagem/pages/EstoqueSorelly"), "AbaEstoqueSorelly"),
    pagina("producao", () => import("@/apps/montagem/pages/Producao"), "AbaProducao"),
    pagina("cadastro-de-pecas", () => import("@/apps/montagem/pages/CadastroPecas"), "AbaCadastroPecas"),
    pagina("pedir-pecas", () => import("@/apps/montagem/pages/PedirPecas"), "AbaPedirPecas"),
    pagina("preferencias-do-kit", () => import("@/apps/montagem/pages/PreferenciasKit"), "AbaPreferenciasKit"),
    pagina("avaliacoes", () => import("@/apps/montagem/pages/Avaliacoes"), "AbaAvaliacoes"),
    pagina("encomendas-e-reposicoes", () => import("@/apps/montagem/pages/Encomendas"), "AbaEncomendas"),
    pagina("ida-na-empresa", () => import("@/apps/montagem/pages/EncomendasTelas"), "AbaEncIda"),
    pagina("top-50", () => import("@/apps/montagem/pages/EncomendasTelas"), "AbaEncTop50"),
    pagina("reposicao-representantes", () => import("@/apps/montagem/pages/EncomendasTelas"), "AbaEncRep"),
    pagina("regras-e-mensagens-reposicao", () => import("@/apps/montagem/pages/EncomendasTelas"), "AbaEncRegras"),
    pagina("marketing", () => import("@/apps/montagem/pages/Marketing"), "AbaMarketing"),
    pagina("garantia", () => import("@/apps/montagem/pages/Garantia"), "AbaGarantia"),
    pagina("adquirentes-e-taxas", () => import("@/apps/montagem/pages/Adquirentes"), "AbaAdquirentes"),
    pagina("comissoes-link-de-pagamento", () => import("@/apps/montagem/pages/ComissaoLink"), "AbaComissaoLink"),
    pagina("chaves-pix-e-regras", () => import("@/apps/montagem/pages/ChavesPix"), "AbaChavesPix"),
    pagina("relatorio-de-links", () => import("@/apps/montagem/pages/LinkRelatorio"), "AbaLinkRelatorio"),
    pagina("link-de-pagamento", () => import("@/apps/montagem/pages/LinkPagamento"), "AbaLinkPagamento"),
    pagina("equipes", () => import("@/apps/montagem/pages/Equipes"), "AbaEquipes"),
    pagina("compras-e-estoque", () => import("@/apps/montagem/pages/ComprasEstoque"), "AbaComprasEstoque"),
    pagina("indicacoes", () => import("@/apps/montagem/pages/Indicacoes"), "AbaIndicacoes"),
    pagina("mensagens-prontas", () => import("@/apps/montagem/pages/MensagensProntas"), "AbaMensagensProntas"),
    pagina("aprovacao-de-cadastros", () => import("@/apps/montagem/pages/AprovacaoCadastros"), "AbaAprovacaoCadastros"),
    pagina("desempenho-do-cadastro", () => import("@/apps/montagem/pages/DesempenhoCadastro"), "AbaDesempenhoCadastro"),
    pagina("versoes", () => import("@/apps/montagem/pages/Versoes"), "AbaVersoes"),
    pagina("padrao-visual", () => import("@/apps/montagem/pages/PadraoVisual"), "AbaPadraoVisual"),
    pagina("avisos", () => import("@/apps/montagem/pages/ConfigAvisos"), "AbaConfigAvisos"),
    pagina("app-montadora", () => import("@/apps/montagem/pages/CelularMontadora"), "AbaCelular"),
    pagina("app-bipagem", () => import("@/apps/montagem/pages/CelularBipagem"), "AbaCelularBip"),
    pagina("app-representante", () => import("@/apps/montagem/pages/CelularRepresentante"), "AbaCelularRep"),
    pagina("app-revendedora", () => import("@/apps/montagem/pages/CelularRevendedora"), "AbaCelularRev"),
    pagina("vendas-vendas", () => import("@/apps/montagem/pages/Vendas"), "AbaVendasVendas"),
    pagina("caixa", () => import("@/apps/montagem/pages/Caixa"), "AbaCaixa"),
    pagina("emprestimos", () => import("@/apps/montagem/pages/Emprestimos"), "AbaEmprestimos"),
    pagina("chaves-pix-dos-bancos", () => import("@/apps/montagem/pages/ChavesPixBancos"), "AbaChavesPixBancos"),
    pagina("rotina-do-dia", () => import("@/apps/montagem/pages/Rotina"), "AbaRotina"),
    pagina("cnpjs", () => import("@/apps/montagem/pages/Cnpjs"), "AbaCnpjs"),
    pagina("limite-de-faturamento", () => import("@/apps/montagem/pages/LimiteFaturamento"), "AbaLimiteFaturamento"),
    pagina("fiscal", () => import("@/apps/montagem/pages/Fiscal"), "AbaFiscal"),
    pagina("contas-a-pagar-mensal", () => import("@/apps/montagem/pages/ContasPagar"), "AbaContasPagar"),
    pagina("previsao-de-caixa", () => import("@/apps/montagem/pages/PrevisaoCaixa"), "AbaPrevisaoCaixa"),
    pagina("comissoes-de-todos", () => import("@/apps/montagem/pages/ComissoesTodos"), "AbaComissoesTodos"),
    pagina("comissoes-bipagem", () => import("@/apps/montagem/pages/ComissoesTodos"), "AbaComisBipagem"),
    pagina("comissoes-montagem", () => import("@/apps/montagem/pages/ComissoesTodos"), "AbaComisMontagem"),
    pagina("comissoes-atendimento-interno", () => import("@/apps/montagem/pages/ComissoesTodos"), "AbaComisInterno"),
    pagina("dinheiro", () => import("@/apps/montagem/pages/Dinheiro"), "AbaDinheiro"),
    pagina("apps", () => import("@/apps/montagem/pages/Apps"), "AbaApps"),
    pagina("revendedoras", () => import("@/apps/montagem/pages/BaseRevendedoras"), "AbaBaseRevendedoras"),
    pagina("previsao-de-faturamento", () => import("@/apps/montagem/pages/PrevisaoFaturamento"), "AbaPrevisaoFaturamento"),
    pagina("painel-dos-acertos", () => import("@/apps/montagem/pages/PainelAcertos"), "AbaPainelAcertos"),
    pagina("visao-geral", () => import("@/apps/montagem/pages/VisaoGeral"), "AbaVisaoGeral"),
    pagina("funcionarios-e-representantes", () => import("@/apps/montagem/pages/Pessoas"), "AbaPessoas"),
    pagina("marcus", () => import("@/apps/montagem/pages/MarcusPessoal"), "AbaMarcus"),
    pagina("marcus-faturamento", () => import("@/apps/montagem/pages/MarcusPessoal"), "AbaMarcusFat"),
    pagina("marcus-patrimonio", () => import("@/apps/montagem/pages/MarcusPessoal"), "AbaMarcusPat"),
    pagina("marcus-contas", () => import("@/apps/montagem/pages/MarcusPessoal"), "AbaMarcusContas"),
    pagina("marcus-extratos", () => import("@/apps/montagem/pages/MarcusExtratos"), "AbaMarcusExtratos"),
    pagina("marcus-atividades", () => import("@/apps/montagem/pages/MarcusPessoal"), "AbaMarcusAtiv"),
    pagina("marcus-acessos", () => import("@/apps/montagem/pages/MarcusPessoal"), "AbaMarcusAcessos"),
    pagina("marcus-dados", () => import("@/apps/montagem/pages/MarcusPessoal"), "AbaMarcusDados"),
    pagina("fluxo-da-empresa", () => import("@/apps/montagem/pages/FluxoEmpresa"), "AbaFluxoEmpresa"),
    pagina("mapa-do-sistema", () => import("@/apps/montagem/pages/MapaSistema"), "AbaMapa"),
    pagina("whatssorelly", () => import("@/apps/montagem/pages/WhatsSorelly"), "AbaWhats"),
    pagina("acessos-por-setor", () => import("@/apps/montagem/pages/AcessosAutorizacoes"), "AbaAcessosAutorizacoes"),
    pagina("rh", () => import("@/apps/montagem/pages/RH"), "AbaRhVisao"),
    pagina("rh-presenca", () => import("@/apps/montagem/pages/RH"), "AbaRhPresenca"),
    pagina("rh-relatorio", () => import("@/apps/montagem/pages/RH"), "AbaRhRelatorio"),
    pagina("rh-colaboradores", () => import("@/apps/montagem/pages/RH"), "AbaRhColab"),
    pagina("rh-advertencias", () => import("@/apps/montagem/pages/RH"), "AbaRhAdv"),
    pagina("rh-experiencia", () => import("@/apps/montagem/pages/RH"), "AbaRhExp"),
    pagina("rh-horas-extras", () => import("@/apps/montagem/pages/RH"), "AbaRhHoras"),
    pagina("rh-negociacoes", () => import("@/apps/montagem/pages/RH"), "AbaRhNegoc"),
    pagina("comissoes-cadastro-revendedoras", () => import("@/apps/montagem/pages/MetasSetor"), "AbaComCadastro"),
    pagina("comissoes-inadimplencia", () => import("@/apps/montagem/pages/MetasSetor"), "AbaComInad"),
    pagina("rh-escala-42h", () => import("@/apps/montagem/pages/RHEscala42"), "AbaRhEscala42"),
    pagina("rh-configurador", () => import("@/apps/montagem/pages/RH"), "AbaRhConfig"),
    pagina("rh-contratos-representantes", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrRep"),
    pagina("rh-contratos-funcionarios", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrFunc"),
    pagina("rh-contratos-terceiros", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrTerc"),
    pagina("rh-contratos-marcus", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrMarcus"),
    pagina("rh-contratos-credito", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrCredito"),
    pagina("rh-contratos-alugueis", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrAluguel"),
    pagina("rh-contratos-consorcios", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrConsorcio"),
    pagina("rh-contratos-modelos", () => import("@/apps/montagem/pages/RHContratos"), "AbaRhContrModelos"),
    pagina("em-breve",() => import("@/apps/montagem/pages/Breve"), "AbaBreve"),
    pagina("em-breve/:nome", () => import("@/apps/montagem/pages/Breve"), "AbaBreve"),
    { path: "*", element: e(Navigate, { to: "/montagem/listagens", replace: true }) },
  ],
};

const kitsNovos = {
  path: "kits-novos",
  // Os ~2.000 registros da planilha chegam antes da casca montar, num .json
  // servido à parte. Só quem abre este app paga esse download.
  loader: async () => {
    const { carregarDados } = await import("@/apps/kits-novos/data/dados");
    await carregarDados();
    return null;
  },
  lazy: async () => ({ Component: (await import("@/apps/kits-novos/App")).default }),
  children: [
    { index: true, element: e(Navigate, { to: "kits", replace: true }) },
    pagina("kits", () => import("@/apps/kits-novos/pages/Kits"), "AbaKits"),
    pagina("pendencias", () => import("@/apps/kits-novos/pages/Pendencias"), "AbaPendencias"),
    pagina("consolidado", () => import("@/apps/kits-novos/pages/Consolidado"), "AbaConsolidado"),
    pagina("regras", () => import("@/apps/kits-novos/pages/Regras"), "AbaRegras"),
    pagina("configurador", () => import("@/apps/kits-novos/pages/Config"), "AbaConfig"),
    { path: "*", element: e(Navigate, { to: "/kits-novos/kits", replace: true }) },
  ],
};

// Endereço sem /montagem: o prefixo é só o nome interno do app principal (existe também /kits-novos). Quem digita /regras-acertos cai em /montagem/regras-acertos.
function SemPrefixo() {
  const l = useLocation();
  return e(Navigate, { to: "/montagem" + (l.pathname === "/" ? "" : l.pathname) + l.search + l.hash, replace: true });
}

export const rotas = [
  { path: "/", element: e(Navigate, { to: "/montagem", replace: true }) },
  montagem,
  kitsNovos,
  { path: "*", element: e(SemPrefixo) },   // endereço curto (ex.: /app-revendedora) vale como /montagem/app-revendedora
];

export default rotas;
