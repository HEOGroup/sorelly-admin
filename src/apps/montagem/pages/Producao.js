// Sorelly Admin · montagem — pages/Producao.js
// Produção (setor de fábrica de peças, turquesa): uma tela com abas. Painel, Produção diária, Premiação (só diretoria) e Configurações (só diretoria).
// Regras em domain/producao.js (estado s.pr); os corpos ficam em pages/producao/. NÃO é a Montagem de kits.
import { Abas } from "@/apps/montagem/components/padrao";
import { AbaProdConfig } from "@/apps/montagem/pages/producao/ProdConfig";
import { AbaProdDiaria } from "@/apps/montagem/pages/producao/ProdDiaria";
import { AbaProdPainel } from "@/apps/montagem/pages/producao/ProdPainel";
import { AbaProdPremiacao } from "@/apps/montagem/pages/producao/ProdPremiacao";
import { COR } from "@/apps/montagem/pages/producao/visualProd";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["painel","Painel"], ["diaria","Produção diária"], ["premiacao","Premiação"], ["config","Configurações"]];

function AbaProducao(){
  var st = useState("painel"), aba = st[0];
  var corpo = aba==="diaria" ? e(AbaProdDiaria,null) : aba==="premiacao" ? e(AbaProdPremiacao,null) : aba==="config" ? e(AbaProdConfig,null) : e(AbaProdPainel,null);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Produção", sub:"Produção diária de peças, painel de resultados e premiação mensal."}),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:COR}),
    corpo);
}
export { AbaProducao };
