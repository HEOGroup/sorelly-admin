// Sorelly Admin · montagem — pages/PagasPorDia.js
// Financeiro › Contas › Pagas por dia (Marcus, 29/10/2026, pedido do financeiro): escolhe um dia e mostra quanto foi pago nele, por CNPJ e conta por conta.
// Mesmos dados da tela Contas a pagar (baixas da DevMaster pela DATA DE DÉBITO + pagamentos dados no sistema); aqui só a leitura do dia.
// Padrão do Financeiro (PADRAO-VISUAL.md): título · bloco Filtros no topo (4 colunas, 32 px) · faixa de totais · tabela de layout fixo, R$ em todo valor, números à direita.
import { BlocoFiltros, Botao, CAMPO, CampoBusca, CampoSel, FaixaTotais, Rotulo, TabelaP, Td, Tr, brl } from "@/apps/montagem/components/padrao-fin";
import { FILIAIS, filtrar, servidorEm, setBaixas, setClasse, setLancamentos, setPf } from "@/apps/montagem/domain/contas-empresa";
import { hojeIso } from "@/apps/montagem/domain/financeiro-familiar";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var somaDias = function(iso, n){ var d = new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };
var br = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; };
var SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
var nomeFilial = function(id){ return id==="fora" ? "Por fora" : id==="ho" ? "H&O Apps" : "CNPJ "+id; };

function AbaPagasPorDia(){
  var cx = use(), s = cx.state;
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);
  var d = useState(hojeIso()), dia = d[0], setDia = d[1], f = useState(""), filial = f[0], setFilial = f[1], b = useState(""), busca = b[0], setBusca = b[1];
  var srvEm = servidorEm();
  var doDia = filtrar("", "", "", "pago", "", "").filter(function(i){ return i.baixa===dia; });
  var vis = doDia.filter(function(i){ return !filial || i.filial===filial; }).filter(function(i){ var q = busca.trim().toLowerCase(); return !q || (i.nome+" "+i.natNome+" "+i.valor.toFixed(2).replace(".", ",")).toLowerCase().indexOf(q)>=0; }).sort(function(x, y){ return y.valor-x.valor; });
  var tot = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
  var por = function(id){ return tot(doDia.filter(function(i){ return i.filial===id; })); };
  var itens = [{t:"Total do dia", v:brl(tot(doDia)), cor:"text-success"}].concat(FILIAIS.map(function(x){ return {t:x[1], v:brl(por(x[0]))}; }));
  var dsem = SEMANA[new Date(dia+"T12:00:00").getDay()];
  var limpar = function(){ setFilial(""); setBusca(""); };
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("h1",{className:"mr-auto truncate text-[16px] font-semibold text-foreground"}, "Pagas por dia"),
      e(Botao,{onClick:function(){ setDia(somaDias(dia, -1)); }}, "‹ Dia anterior"),
      e(Botao,{onClick:function(){ setDia(hojeIso()); }}, "Hoje"),
      e(Botao,{onClick:function(){ setDia(somaDias(dia, 1)); }}, "Dia seguinte ›")),
    e(BlocoFiltros,{onLimpar:(filial || busca) ? limpar : null},
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Dia", id:"pd-dia"}), e("input",{id:"pd-dia", type:"date", value:dia, onChange:function(ev){ if(ev.target.value) setDia(ev.target.value); }, className:CAMPO})),
      e(CampoSel,{t:"CNPJ", id:"pd-cnpj", value:filial, onChange:setFilial, opcoes:[["", "Todos"]].concat(FILIAIS.map(function(x){ return [x[0], x[1]]; }))}),
      e(CampoBusca,{t:"Buscar", id:"pd-busca", value:busca, placeholder:"Fornecedor, natureza ou valor", onChange:setBusca})),
    e(FaixaTotais,{itens:itens}),
    e("p",{className:"text-center text-[11px] text-foreground"}, (srvEm ? "Lido direto da DevMaster, atualiza a cada 10 minutos. " : "")+"Pago = baixa pela data de débito, mais os pagamentos dados no sistema. "+br(dia)+" ("+dsem+") · "+doDia.length+(doDia.length===1 ? " pagamento" : " pagamentos")+"."),
    e(TabelaP,{minW:820, cols:[{t:"CNPJ", w:100},{t:"Fornecedor"},{t:"Natureza", w:230},{t:"Número", w:130},{t:"Valor", n:true, w:140}]},
      vis.map(function(i){ var num = ((i.pref||"")+" "+(i.num||"")).trim() || "—";
        return e(Tr,{key:i.id}, e(Td,null, nomeFilial(i.filial)), e(Td,{forte:true}, i.nome), e(Td,null, i.natNome), e(Td,null, num), e(Td,{n:true, cor:"text-success"}, brl(i.valor))); }),
      vis.length ? e(Tr,{key:"t", total:true}, e(Td,null, "Total"), e(Td,null, vis.length+(vis.length===1 ? " pagamento" : " pagamentos")), e(Td,null, ""), e(Td,null, ""), e(Td,{n:true}, brl(tot(vis)))) : null),
    !vis.length && e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Nenhum pagamento neste dia."));
}
export { AbaPagasPorDia };
