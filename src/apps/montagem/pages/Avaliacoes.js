// Sorelly Admin · montagem — pages/Avaliacoes.js
// Avaliações: UMA tela com abas (Visão geral, Representantes pelas revendedoras e pelo sistema, Kits, Montagem, Funcionários, Configurador).
// Corpos em pages/avaliacoes/. Regras e contas em domain/avaliacoes.js (estado s.av, ações AV). Cor do módulo: laranja do Cadastro.
import { Abas, Pagina } from "@/apps/montagem/components/padrao";
import { AbaAvConfig } from "@/apps/montagem/pages/avaliacoes/Configurador";
import { AbaAvFunc } from "@/apps/montagem/pages/avaliacoes/Funcionarios";
import { AbaAvKits, AbaAvMontagem } from "@/apps/montagem/pages/avaliacoes/KitsMontagem";
import { AbaAvRepsRev, AbaAvRepsSis } from "@/apps/montagem/pages/avaliacoes/Representantes";
import { AbaAvVisao } from "@/apps/montagem/pages/avaliacoes/Visao";
import { COR } from "@/apps/montagem/pages/avaliacoes/visual";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["geral","Visão geral"], ["revs","Representantes (pelas revendedoras)"], ["sis","Representantes (pelo sistema)"], ["kits","Kits"], ["mont","Montagem"], ["func","Funcionários"], ["cfg","Configurador"]];

function AbaAvaliacoes(){
  var st = useState("geral"), aba = st[0];
  var corpo = aba==="geral" ? e(AbaAvVisao,{ir:st[1]})
    : aba==="revs" ? e(AbaAvRepsRev,null)
    : aba==="sis" ? e(AbaAvRepsSis,null)
    : aba==="kits" ? e(AbaAvKits,null)
    : aba==="mont" ? e(AbaAvMontagem,null)
    : aba==="func" ? e(AbaAvFunc,null)
    : e(AbaAvConfig,null);
  return e(Pagina,null,
    e(PageHead,{t:"Avaliações", sub:"Avaliação das representantes, dos kits, da montagem e dos funcionários."}),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:COR}),
    e("div",{key:aba, className:"flex flex-col gap-2.5"}, corpo));
}

export { AbaAvaliacoes };
