// Sorelly Admin · montagem — pages/CadastroPecas.js
// Setor próprio "Cadastro de peças" (responsável Rayssa; Financeiro e diretoria também acessam): uma tela só, com abas. Corpos em pages/cadpecas/.
// Regras em domain/cadastro-pecas.js (estado s.cpc). Preços sugeridos seguem para aprovação no SorellyChat (grupo "Cadastro de Peças").
// Estilo das telas de Pagamentos a fornecedores (azul, tabelas pequenas, sem blocos coloridos), pedido do Marcus em 20-21/10/2026.
import { Abas } from "@/apps/montagem/components/padrao";
import { AbaCalculadora } from "@/apps/montagem/pages/cadpecas/Calculadora";
import { AbaBanho } from "@/apps/montagem/pages/cadpecas/Banho";
import { AbaControle } from "@/apps/montagem/pages/cadpecas/Controle";
import { AbaFaturas, AbaRetirarOuro } from "@/apps/montagem/pages/cadpecas/Faturas";
import { AbaLotes } from "@/apps/montagem/pages/cadpecas/Lotes";
import { AbaConfigCad, AbaDevMaster, AbaFornecedores } from "@/apps/montagem/pages/cadpecas/Outras";
import { AbaPedidos } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { AbaSolicitacoes } from "@/apps/montagem/pages/cadpecas/Solicitacoes";
import { contagem } from "@/apps/montagem/domain/pedidos-pecas";
import { use } from "@/apps/montagem/state/context";
import { COR } from "@/apps/montagem/pages/cadpecas/visualCad";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["sol","Solicitações"], ["ped","Pedidos de bruto"], ["ctrl","Controle do mês"], ["fp","Faturas Pontual"], ["fe","Faturas Ellos"], ["ouro","Retirar ouro"], ["banho","Tabela do banho"], ["lotes","Planilhas de cadastro"], ["calc","Calculadora"], ["forn","Fornecedores"], ["dev","DevMaster"], ["config","Configurações"]];

function AbaCadastroPecas(){
  var st = useState({aba:"sol", lote:""}), v = st[0], novos = contagem(use().state.pp).aberto;
  var ir = function(aba, lote){ st[1]({aba:aba, lote:lote!==undefined ? lote : v.lote}); };
  var corpo = v.aba==="sol" ? e(AbaSolicitacoes,null) : v.aba==="forn" ? e(AbaFornecedores,null) : v.aba==="dev" ? e(AbaDevMaster,null) : v.aba==="config" ? e(AbaConfigCad,null)
    : v.aba==="ctrl" ? e(AbaControle,null) : v.aba==="fp" ? e(AbaFaturas,{galv:"pontual"}) : v.aba==="fe" ? e(AbaFaturas,{galv:"ellos"}) : v.aba==="ouro" ? e(AbaRetirarOuro,null) : v.aba==="banho" ? e(AbaBanho,null)
    : v.aba==="calc" ? e(AbaCalculadora,{loteId:v.lote, onLote:function(id){ ir("calc", id); }})
    : v.aba==="lotes" ? e(AbaLotes,{onAbrir:function(id){ ir("calc", id); }})
    : e(AbaPedidos,null);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Cadastro de peças", sub:"Solicitações da produção, pedidos de bruto, faturas de banho, controle do mês, custo e preço das peças e pedidos para a DevMaster."}),
    e(Abas,{abas:ABAS.map(function(a){ return a[0]==="sol" && novos ? [a[0], a[1]+" ("+novos+")"] : a; }), atual:v.aba, onMudar:function(a){ ir(a); }, cor:COR}),
    corpo);
}
export { AbaCadastroPecas };
