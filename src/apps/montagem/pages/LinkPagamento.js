// Sorelly Admin · montagem — pages/LinkPagamento.js
// Link de pagamento e maquininhas. REORGANIZADO em 16/11/2026 (Marcus: "não faz sentido o topo ter Link de pagamento e Relatório de links e dentro dele várias abas; reorganiza igual ao Financeiro"):
// cada antiga aba virou TELA do menu do setor (navigation/setores.js, MENU_LINKPAG), na ordem do fluxo: Solicitações → Comprovantes → Descontados no acerto → Histórico; Relatórios (Relatório de links, Análises, Taxas e recebimentos); Cadastro (Meios e acessos, Representantes).
// Cada tela é UM bloco azul (BlocoPainel) como no Contas a pagar. Solicitações já está compacta e em planilha; as outras telas guardam o corpo de antes dentro do bloco, até serem refeitas uma a uma.
// Os corpos continuam em pages/link-pagamento/. Regras e contas em domain/link-pagamento.js (estado s.lp). Contexto em docs/negocio/LINK-DE-PAGAMENTO.md.
import { AbaLpAnalises } from "@/apps/montagem/pages/link-pagamento/Analises";
import { AbaLpDescontados } from "@/apps/montagem/pages/link-pagamento/Descontados";
import { AbaLpComprovantes } from "@/apps/montagem/pages/link-pagamento/Comprovantes";
import { AbaLpHistorico } from "@/apps/montagem/pages/link-pagamento/Historico";
import { AbaLpMeios } from "@/apps/montagem/pages/link-pagamento/Meios";
import { AbaLpRepresentantes } from "@/apps/montagem/pages/link-pagamento/Representantes";
import { AbaLpSolicitacoes } from "@/apps/montagem/pages/link-pagamento/Solicitacoes";
import { AbaLpTaxas } from "@/apps/montagem/pages/link-pagamento/Taxas";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { DIRETORIA } from "@/apps/montagem/domain/equipe";
import { caminhoDaAba } from "@/apps/montagem/router/slugs";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";
import { useNavigate } from "react-router-dom";

// moldura de toda tela do setor: um bloco azul com o nome da tela na barra, igual às telas do Financeiro
function Moldura(p){
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:p.titulo, compacto:true}, e("div",{className:"p-2"}, p.children)));
}

// telas já refeitas (trazem o próprio bloco azul): só precisam da raiz da tela
function Raiz(p){ return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"}, p.children); }

// telas para onde a tela de Solicitações aponta (antes eram abas)
var DESTINOS = {comprovantes:"linkcomp", historico:"linkhist"};

function AbaLinkPagamento(){
  var navigate = useNavigate();
  return e(AbaLpSolicitacoes,{onIr:function(k){ navigate(caminhoDaAba(DESTINOS[k] || "linkpag")); }});
}
function AbaLinkComprovantes(){ return e(Raiz,null, e(AbaLpComprovantes,null)); }
function AbaLinkDescontados(){ return e(Raiz,null, e(AbaLpDescontados,null)); }
function AbaLinkHistorico(){ return e(Raiz,null, e(AbaLpHistorico,null)); }
function AbaLinkAnalises(){ return e(Raiz,null, e(AbaLpAnalises,null)); }
function AbaLinkTaxas(){
  var cx = use(), diretoria = DIRETORIA.some(function(x){ return x.id===cx.state.usuario; });   // Taxas e recebimentos é só da Diretoria (Hellen, 03/11/2026)
  return diretoria ? e(Raiz,null, e(AbaLpTaxas,null)) : e(Moldura,{titulo:"Taxas e recebimentos dos links"}, e("p",{className:"py-6 text-center text-[13px]"}, "Esta tela é só da Diretoria."));
}
function AbaLinkMeios(){ return e(Raiz,null, e(AbaLpMeios,null)); }
function AbaLinkRepresentantes(){ return e(Raiz,null, e(AbaLpRepresentantes,null)); }
export { AbaLinkPagamento, AbaLinkComprovantes, AbaLinkDescontados, AbaLinkHistorico, AbaLinkAnalises, AbaLinkTaxas, AbaLinkMeios, AbaLinkRepresentantes };
