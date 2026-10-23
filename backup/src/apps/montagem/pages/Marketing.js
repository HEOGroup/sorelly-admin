// Sorelly Admin · montagem — pages/Marketing.js
// Marketing: UMA tela com abas (Visão geral, Mural de criativos, Divulgação, Erros em produtos). Corpos em pages/marketing/.
// Regras e contas em domain/marketing.js (estado s.mk, ação MK). Cor do setor: rosa.
import { Abas, Pagina } from "@/apps/montagem/components/padrao";
import { errosPendentes } from "@/apps/montagem/domain/marketing";
import { AbaMkDivulgacao } from "@/apps/montagem/pages/marketing/Divulgacao";
import { COR } from "@/apps/montagem/pages/marketing/comum";
import { AbaMkErros } from "@/apps/montagem/pages/marketing/Erros";
import { AbaMkMural } from "@/apps/montagem/pages/marketing/Mural";
import { AbaMkVisao } from "@/apps/montagem/pages/marketing/Visao";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

function AbaMarketing(){
  var s = use().state, st = useState("geral"), aba = st[0];
  if(!s.mk) return e(Pagina,null, e(PageHead,{t:"Marketing", sub:"Mural de criativos, divulgação e erros em produtos."}), e("p",{className:"py-6 text-center text-[13px] text-white/60"}, "Dados do Marketing indisponíveis."));
  var n = errosPendentes(s);
  var ABAS = [["geral", "Visão geral"], ["mural", "Mural de criativos"], ["divulgacao", "Divulgação"], ["erros", "Erros em produtos"+(n ? " ("+n+")" : "")]];
  var corpo = aba==="geral" ? e(AbaMkVisao,{ir:st[1]}) : aba==="mural" ? e(AbaMkMural,null) : aba==="divulgacao" ? e(AbaMkDivulgacao,null) : e(AbaMkErros,null);
  return e(Pagina,null,
    e(PageHead,{t:"Marketing", sub:"Mural de criativos, divulgação e erros em produtos."}),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:COR}),
    e("div",{key:aba, className:"flex flex-col gap-2.5"}, corpo));
}

export { AbaMarketing };
