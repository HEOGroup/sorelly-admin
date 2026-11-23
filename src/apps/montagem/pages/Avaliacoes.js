// Sorelly Admin · montagem — pages/Avaliacoes.js
// Avaliações: UMA tela com abas (Visão geral, Representantes pelas revendedoras e pelo sistema, Kits, Montagem, Funcionários, Configurador).
// Corpos em pages/avaliacoes/. Regras e contas em domain/avaliacoes.js (estado s.av, ações AV).
// 12/11/2026 (Marcus): tela no padrão. Abas da peça AbasTela, sem blocos de números no topo, tudo em tabela com filtro no cabeçalho das colunas (pages/avaliacoes/Tabelas.js e KitsMontadoras.js).
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela } from "@/apps/montagem/components/padrao-fin";
import { AbaAvConfig } from "@/apps/montagem/pages/avaliacoes/Configurador";
import { AbaAvKitsMontadora } from "@/apps/montagem/pages/avaliacoes/KitsMontadoras";
import { AbaAvFuncTabelas, AbaAvMontagemTabelas, AbaAvRepsRevTabela, AbaAvRepsSisTabela, AbaAvVisaoTabelas } from "@/apps/montagem/pages/avaliacoes/Tabelas";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["geral","Visão geral"], ["revs","Representantes (pelas revendedoras)"], ["sis","Representantes (pelo sistema)"], ["kits","Kits"], ["mont","Montagem"], ["func","Funcionários"], ["cfg","Configurador"]];

function AbaAvaliacoes(){
  var st = useState("geral"), aba = st[0];
  var corpo = aba==="geral" ? e(AbaAvVisaoTabelas,{ir:st[1]})
    : aba==="revs" ? e(AbaAvRepsRevTabela,null)
    : aba==="sis" ? e(AbaAvRepsSisTabela,null)
    : aba==="kits" ? e(AbaAvKitsMontadora,null)
    : aba==="mont" ? e(AbaAvMontagemTabelas,null)
    : aba==="func" ? e(AbaAvFuncTabelas,null)
    : e(AbaAvConfig,null);
  return e(Pagina,null,
    e(PageHead,{t:"Avaliações", sub:"Avaliação das representantes, dos kits, da montagem e dos funcionários."}),
    e(AbasTela,{abas:ABAS, atual:aba, onMudar:st[1]}),
    e("div",{key:aba, className:"flex flex-col gap-2.5"}, corpo));
}

export { AbaAvaliacoes };
