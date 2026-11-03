// Sorelly Admin · montagem — pages/MetasHistorico.js
// Metas › Histórico (Marcus, 02/11/2026): uma linha por campanha (novembro, dezembro...) e, para comparar, o desafio mensal do admin antigo.
// Campanha nova = participantes, quem já acertou, quem bateu a Meta 1 e a Meta 2, taxa e extra de brinde. Dados reais, só leitura (lib/metas-dados.js).
import { Pagina } from "@/apps/montagem/components/padrao";
import { brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CAMPANHAS, HISTORICO_ANTIGO } from "@/apps/montagem/domain/metas";
import { useMetas } from "@/apps/montagem/lib/metas-dados";
import { e, useMemo } from "@/shared/react";

var TOPO = "-mt-4 gap-2";
var N = function(v){ return typeof v === "number" ? v.toLocaleString("pt-BR") : v; };
var pct = function(a, b){ return b ? (Math.round(a / b * 1000) / 10).toLocaleString("pt-BR") + "%" : "0%"; };
var dinheiro = function(v){ return typeof v === "number" ? brl(v) : v; };
var COLS = [
  {k:"camp", t:"Campanha"}, {k:"n", t:"Participantes", fmt:N}, {k:"ac", t:"Acertaram", fmt:N}, {k:"bat", t:"Bateram a meta", fmt:N}, {k:"b1", t:"Meta 1", fmt:N}, {k:"b2", t:"Meta 2", fmt:N},
  {k:"taxa", t:"Taxa de meta"}, {k:"extra", t:"Extra de brinde", fmt:dinheiro}, {k:"sit", t:"Situação"}
];
function linhaDe(d, mes){
  var it = d ? d.itens : [], ac = it.filter(function(i){ return i.vendeu !== null; }).length;
  var b1 = it.filter(function(i){ return i.situacao === "Bateu Meta 1"; }).length, b2 = it.filter(function(i){ return i.situacao === "Bateu Meta 2"; }).length;
  return {camp:CAMPANHAS[mes].nome, n:it.length, ac:ac, bat:b1 + b2, b1:b1, b2:b2, taxa:pct(b1 + b2, ac), extra:it.reduce(function(t, i){ return t + (i.extraBb || 0) + (i.extraNormal || 0); }, 0),
    sit:!d ? "Lendo" : ac ? "Em andamento" : it.length ? "Sem acertos ainda" : "Ainda não começou"};
}

function AbaMetasHistorico(){
  var nov = useMetas("2026-11"), dez = useMetas("2026-12");
  var linhas = useMemo(function(){
    var a = HISTORICO_ANTIGO;
    return [linhaDe(nov.dados, "2026-11"), linhaDe(dez.dados, "2026-12"),
      {camp:a.nome, n:a.participantes, ac:a.acertaram, bat:a.bateram, b1:"-", b2:"-", taxa:pct(a.bateram, a.acertaram), extra:"-", sit:"Encerrado"}];
  }, [nov.dados, dez.dados]);
  var titulo = e("h1",{className:"font-heading text-xl font-semibold leading-none"}, "Histórico das Metas");
  if(!nov.ligado) return e(Pagina,{className:TOPO}, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  if(nov.erro || dez.erro) return e(Pagina,{className:TOPO}, titulo, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, nov.erro || dez.erro));
  if(!nov.dados || !dez.dados) return e(Pagina,{className:TOPO}, titulo, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo as revendedoras e as vendas… na primeira vez pode levar alguns segundos."));
  return e(Pagina,{className:TOPO}, titulo,
    e(TabelaPlanilha,{cols:COLS, linhas:linhas, chave:"camp", centro:true, semContagem:true, vazio:"Nenhuma campanha."}),
    e("p",{className:"text-center text-[13px]"}, "Admin antigo: desafio mensal com uma meta só, de agosto a outubro de 2026 (3.588 desafios encerrados). Taxa = quem bateu ÷ quem acertou."));
}
export { AbaMetasHistorico };
