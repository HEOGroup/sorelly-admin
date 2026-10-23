// Sorelly Admin · montagem — pages/EstoqueSorelly.js
// Financeiro → Estoque Sorelly: estoque GERAL de peças (interno + com revendedoras), mês a mês. Uma tela só, com abas; os corpos ficam em pages/estoque-sorelly/.
// NÃO é o estoque de material (esse é Compras e estoque de material, em Materiais e estoque). Regras e contas: domain/estoque-sorelly.js (estado s.es).
import { Abas } from "@/apps/montagem/components/padrao";
import { AbaConfigurador } from "@/apps/montagem/pages/estoque-sorelly/Configurador";
import { AbaPreenchimento } from "@/apps/montagem/pages/estoque-sorelly/Preenchimento";
import { AbaResumo } from "@/apps/montagem/pages/estoque-sorelly/Resumo";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["resumo","Resumo geral"], ["preenchimento","Preenchimento"], ["config","Configurador"]];
var COR = "#3B82F6";   // cor do setor (azul, igual ao Financeiro)

function AbaEstoqueSorelly(){
  var st = useState({aba:"resumo", mes:null}), v = st[0];
  var ir = function(aba, mes){ st[1]({aba:aba, mes:mes || null}); };
  var corpo = v.aba==="preenchimento" ? e(AbaPreenchimento,{key:"p"+v.mes, mesInicial:v.mes})
    : v.aba==="config" ? e(AbaConfigurador,null)
    : e(AbaResumo,{onIr:ir});
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Estoque Sorelly", sub:"Posição mensal do estoque de peças, interno e com revendedoras."}),
    e(Abas,{abas:ABAS, atual:v.aba, onMudar:function(a){ ir(a, null); }, cor:COR}),
    corpo);
}
export { AbaEstoqueSorelly };
