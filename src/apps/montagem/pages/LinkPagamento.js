// Sorelly Admin · montagem — pages/LinkPagamento.js
// Link de pagamento e maquininhas: uma tela só, com abas (Solicitações, Histórico, Análises, Comprovantes, Taxas e recebimentos, Meios e acessos, Representantes).
// Os corpos ficam em pages/link-pagamento/. Regras e contas em domain/link-pagamento.js (estado s.lp). Contexto em docs/negocio/LINK-DE-PAGAMENTO.md.
import { AbaLpAnalises } from "@/apps/montagem/pages/link-pagamento/Analises";
import { AbaLpDescontados } from "@/apps/montagem/pages/link-pagamento/Descontados";
import { AbaLpComprovantes } from "@/apps/montagem/pages/link-pagamento/Comprovantes";
import { AbaLpHistorico } from "@/apps/montagem/pages/link-pagamento/Historico";
import { AbaLpMeios } from "@/apps/montagem/pages/link-pagamento/Meios";
import { AbaLpRepresentantes } from "@/apps/montagem/pages/link-pagamento/Representantes";
import { AbaLpSolicitacoes } from "@/apps/montagem/pages/link-pagamento/Solicitacoes";
import { AbaLpTaxas } from "@/apps/montagem/pages/link-pagamento/Taxas";
import { Abas } from "@/apps/montagem/components/padrao";
import { DIRETORIA } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["solicitacoes", "Solicitações"], ["historico", "Histórico"], ["analises", "Análises"], ["comprovantes", "Comprovantes"], ["descontados", "Descontados no acerto"], ["taxas", "Taxas e recebimentos"], ["meios", "Meios e acessos"], ["representantes", "Representantes"]];
var COR = "#0EA5E9";   // cor do setor Link de pagamento

function AbaLinkPagamento(){
  var st = useState("solicitacoes"), aba = st[0], cx = use(), diretoria = DIRETORIA.some(function(x){ return x.id===cx.state.usuario; });   // Taxas e recebimentos é só da Diretoria (Hellen, 03/11/2026)
  var abas = ABAS.filter(function(a){ return a[0]!=="taxas" || diretoria; });
  if(aba==="taxas" && !diretoria) aba = "solicitacoes";
  var corpo = aba==="solicitacoes" ? e(AbaLpSolicitacoes,{onIr:st[1]})
    : aba==="historico" ? e(AbaLpHistorico,null)
    : aba==="analises" ? e(AbaLpAnalises,null)
    : aba==="comprovantes" ? e(AbaLpComprovantes,null)
    : aba==="descontados" ? e(AbaLpDescontados,null)
    : aba==="taxas" ? e(AbaLpTaxas,null)
    : aba==="meios" ? e(AbaLpMeios,null)
    : e(AbaLpRepresentantes,null);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Link de pagamento e maquininhas", sub:"Solicitações de link, comprovantes, taxas, meios de recebimento e vínculo com as representantes."}),
    e(Abas,{abas:abas, atual:aba, onMudar:st[1], cor:COR}),
    corpo);
}
export { AbaLinkPagamento };
