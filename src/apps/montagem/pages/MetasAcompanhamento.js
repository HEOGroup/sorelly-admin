// Sorelly Admin · montagem — pages/MetasAcompanhamento.js
// Metas › Acompanhamento (Marcus, 02/11/2026): como a campanha anda, por representante e por classe. Dados reais, só leitura (lib/metas-dados.js → src/server/metas.js).
// Cada linha: revendedoras, aguardando acerto, acertaram, bateram a Meta 1, bateram a Meta 2, não bateram, taxa (bateram ÷ acertaram) e extra de brinde. Total na linha de cima da tabela.
import { Pagina } from "@/apps/montagem/components/padrao";
import { brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CAMPANHAS, MES_PADRAO, resumoPor } from "@/apps/montagem/domain/metas";
import { useMetas } from "@/apps/montagem/lib/metas-dados";
import { e, useMemo } from "@/shared/react";

var TOPO = "-mt-4 gap-2";
var N = function(v){ return Number(v).toLocaleString("pt-BR"); };
var pct = function(a, b){ return b ? (Math.round(a / b * 1000) / 10).toLocaleString("pt-BR") + "%" : "0%"; };
var VERDE = "font-semibold text-[#4ADE80]", VERMELHO = "font-semibold text-[#EF4444]", AMARELO = "font-semibold text-[#FBBF24]", OURO = "text-[#F3D98B]";

function colunas(nome){
  return [
    {k:"k", t:nome}, {k:"n", t:"Revendedoras", fmt:N}, {k:"agu", t:"Aguardando acerto", fmt:N, cor:function(){ return AMARELO; }},
    {k:"ac", t:"Acertaram", fmt:N}, {k:"b1", t:"Bateram Meta 1", fmt:N, cor:function(){ return VERDE; }}, {k:"b2", t:"Bateram Meta 2", fmt:N, cor:function(){ return VERDE; }},
    {k:"nao", t:"Não bateram", fmt:N, cor:function(){ return VERMELHO; }}, {k:"taxa", t:"Taxa de meta"}, {k:"extra", t:"Extra de brinde", fmt:brl, cor:function(){ return OURO; }}
  ];
}
function comTaxa(l){ return l.map(function(r){ return Object.assign({}, r, {taxa:pct(r.b1 + r.b2, r.ac)}); }); }
function total(linhas){
  var t = linhas.reduce(function(s, r){ ["n", "agu", "ac", "b1", "b2", "nao", "extra"].forEach(function(k){ s[k] = (s[k] || 0) + r[k]; }); return s; }, {});
  return ["Total", N(t.n || 0), N(t.agu || 0), N(t.ac || 0), N(t.b1 || 0), N(t.b2 || 0), N(t.nao || 0), pct((t.b1 || 0) + (t.b2 || 0), t.ac || 0), brl(t.extra || 0)];
}
var Titulo = function(t){ return e("h2",{className:"text-center text-[11px] font-semibold uppercase tracking-[.05em]"}, t); };

function AbaMetasAcompanhamento(){
  var m = useMetas(MES_PADRAO), dados = m.dados;
  var porRep = useMemo(function(){ return dados ? comTaxa(resumoPor(dados.itens, function(i){ return i.rep; })) : []; }, [dados]);
  var porClasse = useMemo(function(){
    if(!dados) return [];
    var l = resumoPor(dados.itens, function(i){ return i.classeNome; }), ordem = dados.classes.map(function(c){ return c.nome; });
    return comTaxa(l.sort(function(a, b){ return ordem.indexOf(a.k) - ordem.indexOf(b.k); }));
  }, [dados]);
  var titulo = e("h1",{className:"font-heading text-xl font-semibold leading-none"}, "Acompanhamento - Metas de " + (CAMPANHAS[MES_PADRAO] ? CAMPANHAS[MES_PADRAO].nome.replace(" de ", " ") : MES_PADRAO));
  if(!m.ligado) return e(Pagina,{className:TOPO}, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  if(m.erro) return e(Pagina,{className:TOPO}, titulo, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, m.erro));
  if(!dados) return e(Pagina,{className:TOPO}, titulo, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo as revendedoras e as vendas… na primeira vez pode levar alguns segundos."));
  return e(Pagina,{className:TOPO}, titulo,
    Titulo("Por representante"),
    e(TabelaPlanilha,{cols:colunas("Representante"), linhas:porRep, chave:"k", centro:true, semContagem:true, totalLinha:total, vazio:"Nenhuma representante."}),
    Titulo("Por classe"),
    e(TabelaPlanilha,{cols:colunas("Classe"), linhas:porClasse, chave:"k", centro:true, semContagem:true, totalLinha:total, vazio:"Nenhuma classe."}));
}
export { AbaMetasAcompanhamento };
