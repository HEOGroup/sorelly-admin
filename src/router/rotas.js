// Sorelly Admin — tabela de rotas
//
// Uma entrada por página. `lazy` faz o React Router baixar o chunk da página
// antes de trocar a tela: cada página vira um arquivo .js separado no build e
// só chega ao navegador quando alguém abre aquela tela.
//
// Para criar uma página nova, acrescente uma linha aqui. Nada mais.
import { e } from "@/shared/react";
import { Navigate, useOutletContext } from "react-router-dom";

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
    { index: true, element: e(Navigate, { to: "regras-reposicao", replace: true }) },   // por pedido do Marcus (07/10/2026): ao abrir o sistema aparece direto a página de regras de reposição
    pagina("listagens", () => import("@/apps/montagem/pages/Painel"), "AbaPainel"),
    pagina("calculadora", () => import("@/apps/montagem/pages/Calculadora"), "AbaCalculadora"),
    pagina("consolidado", () => import("@/apps/montagem/pages/Consolidado"), "AbaConsolidado"),
    pagina("relatorios", () => import("@/apps/montagem/pages/Relatorios"), "AbaRelatorios"),
    pagina("equipe", () => import("@/apps/montagem/pages/Equipe"), "AbaEquipe"),
    pagina("representantes", () => import("@/apps/montagem/pages/AvalRep"), "AbaAvalRep"),
    pagina("registros", () => import("@/apps/montagem/pages/Registros"), "AbaRegistros"),
    pagina("regras", () => import("@/apps/montagem/pages/Regras"), "AbaRegras"),
    pagina("regras-representantes", () => import("@/apps/montagem/pages/RegrasRepresentantes"), "AbaRegrasRepresentantes"),
    pagina("regras-acertos", () => import("@/apps/montagem/pages/RegrasAcertos"), "AbaRegrasAcertos"),
    pagina("regras-reposicao", () => import("@/apps/montagem/pages/RegrasReposicao"), "AbaRegrasReposicao"),
    pagina("expositores", () => import("@/apps/montagem/pages/Expositores"), "AbaExpositores"),
    pagina("compras-joias-representantes", () => import("@/apps/montagem/pages/ComprasJoias"), "AbaComprasJoias"),
    pagina("consolidado-representantes", () => import("@/apps/montagem/pages/ConsolidadoRepresentantes"), "AbaConsolidadoRep"),
    pagina("placar-representantes", () => import("@/apps/montagem/pages/PlacarRepresentantes"), "AbaPlacarRep"),
    pagina("controle-de-kits", () => import("@/apps/montagem/pages/ControleKits"), "AbaControleKits"),
    pagina("inadimplencia-financeira", () => import("@/apps/montagem/pages/InadimplenciaFin"), "AbaInadimplenciaFin"),
    pagina("comissoes", () => import("@/apps/montagem/pages/Comissoes"), "AbaComissoes"),
    pagina("pix-direto-a-enviar", () => import("@/apps/montagem/pages/PixDireto"), "AbaPixDireto"),
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
    paginaKN("kits-novos-pendencias", "AbaPendenciasEmbutido"),
    paginaKN("kits-novos-consolidado", "AbaConsolidadoKNEmbutido"),
    paginaKN("kits-novos-regras", "AbaRegrasKNEmbutido"),
    paginaKN("kits-novos-configurador", "AbaConfigKNEmbutido"),
    pagina("configurador", () => import("@/apps/montagem/pages/ConfiguradorGeral"), "AbaConfiguradorGeral"),
    pagina("avisos", () => import("@/apps/montagem/pages/ConfigAvisos"), "AbaConfigAvisos"),
    pagina("app-montadora", () => import("@/apps/montagem/pages/CelularMontadora"), "AbaCelular"),
    pagina("app-bipagem", () => import("@/apps/montagem/pages/CelularBipagem"), "AbaCelularBip"),
    pagina("app-representante", () => import("@/apps/montagem/pages/CelularRepresentante"), "AbaCelularRep"),
    pagina("app-revendedora", () => import("@/apps/montagem/pages/CelularRevendedora"), "AbaCelularRev"),
    pagina("vendas-vendas", () => import("@/apps/montagem/pages/Vendas"), "AbaVendasVendas"),
    pagina("cnpjs", () => import("@/apps/montagem/pages/Cnpjs"), "AbaCnpjs"),
    pagina("limite-de-faturamento", () => import("@/apps/montagem/pages/LimiteFaturamento"), "AbaLimiteFaturamento"),
    pagina("contas-a-pagar", () => import("@/apps/montagem/pages/ContasPagar"), "AbaContasPagar"),
    pagina("previsao-de-faturamento", () => import("@/apps/montagem/pages/PrevisaoFaturamento"), "AbaPrevisaoFaturamento"),
    pagina("painel-dos-acertos", () => import("@/apps/montagem/pages/PainelAcertos"), "AbaPainelAcertos"),
    pagina("visao-geral", () => import("@/apps/montagem/pages/VisaoGeral"), "AbaVisaoGeral"),
    pagina("funcionarios-e-representantes", () => import("@/apps/montagem/pages/Pessoas"), "AbaPessoas"),
    pagina("fluxo-da-empresa", () => import("@/apps/montagem/pages/FluxoEmpresa"), "AbaFluxoEmpresa"),
    pagina("acessos-por-setor", () => import("@/apps/montagem/pages/Acessos"), "AbaAcessos"),
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

export const rotas = [
  { path: "/", element: e(Navigate, { to: "/montagem", replace: true }) },
  montagem,
  kitsNovos,
  { path: "*", element: e(Navigate, { to: "/montagem", replace: true }) },
];

export default rotas;
