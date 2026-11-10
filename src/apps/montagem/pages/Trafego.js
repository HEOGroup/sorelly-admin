// Sorelly Admin · montagem — pages/Trafego.js
// Marketing › Tráfego pago (05/11/2026, pedido do Marcus e do Diego, gestor de tráfego): UMA tela com abas (Investimento, Mês a mês, Dia a dia, Criativos). Corpos em pages/trafego/.
// Regras e contas em domain/trafego.js (estado s.tp, ação TP). Substitui a planilha do Diego.
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela } from "@/apps/montagem/components/padrao-fin";
import { AbaTpCriativos } from "@/apps/montagem/pages/trafego/Criativos";
import { AbaTpDia } from "@/apps/montagem/pages/trafego/DiaADia";
import { AbaTpInvestimento } from "@/apps/montagem/pages/trafego/Investimento";
import { AbaTpMensal } from "@/apps/montagem/pages/trafego/MesAMes";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["inv", "Investimento"], ["mes", "Mês a mês"], ["dia", "Dia a dia"], ["cri", "Criativos"]];

function AbaTrafego(){
  var s = use().state, st = useState("inv"), aba = st[0];
  var cab = e(PageHead,{t:"Tráfego pago", sub:"Investimento, leads, aprovadas e cadastradas do Google Ads e do Meta Ads."});
  if(!s.tp) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados do Tráfego pago indisponíveis."));
  var corpo = aba==="inv" ? e(AbaTpInvestimento) : aba==="mes" ? e(AbaTpMensal) : aba==="dia" ? e(AbaTpDia) : e(AbaTpCriativos);
  return e(Pagina,null, cab, e(AbasTela,{abas:ABAS, atual:aba, onMudar:st[1]}), e("div",{key:aba, className:"flex flex-col gap-2.5"}, corpo));
}

export { AbaTrafego };
