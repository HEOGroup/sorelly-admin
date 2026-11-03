// Sorelly Admin · montagem — pages/MetasRevendedoras.js
// Metas › Revendedoras (Marcus, 02/11/2026; protótipo aprovado em docs/ideias/metas-tela-1.html): todas as revendedoras com a meta do mês, três blocos de resumo em cima
// (categorias, acertos do mês, meta do mês) e a lista em planilha com o filtro NA coluna. Dados reais, só leitura: servidor src/server/metas.js; regras em domain/metas.js.
// Meta = média das 3 últimas vendas ANTES do mês + percentual (Meta 1 e Meta 2); o brinde extra (BB e Normal) vem da campanha do mês. Dezembro nasce como cópia de novembro.
// A meta vale para o PRÓXIMO ACERTO, em qualquer data (Marcus, 02/11/2026): quem acerta em dezembro continua com a meta de novembro.
// Coluna "Brinde extra no acerto" (Marcus, 02/11/2026): para quem bateu a meta, a etapa do brinde extra: A liberar → Pagamento confirmado → Aplicado no acerto (regra do acerto: o brinde só libera
// com o pagamento confirmado, por isso só se aplica depois de confirmar). A etapa fica no módulo metas do servidor (chave brindes), só a Diretoria grava por enquanto.
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { Pagina } from "@/apps/montagem/components/padrao";
import { CAMPO, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CAMPANHAS, MES_PADRAO } from "@/apps/montagem/domain/metas";
import { apiAtiva, chamar, nomeDaConta } from "@/apps/montagem/lib/api";
import { e, useEffect, useMemo, useState } from "@/shared/react";

// Topo colado (Marcus, 02/11/2026: "sobe mais ainda"): a tela puxa 16 px para cima do espaço padrão do MAIN e o título é uma linha só, sem subtítulo.
var TOPO = "-mt-4 gap-2";
var N = function(v){ return Number(v).toLocaleString("pt-BR"); };
var pct = function(a, b){ return b ? (Math.round(a / b * 1000) / 10).toLocaleString("pt-BR") + "%" : "0%"; };
var dm = function(iso){ return iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : ""; };
var VERDE = "font-semibold text-[#4ADE80]", VERMELHO = "font-semibold text-[#EF4444]", AMARELO = "font-semibold text-[#FBBF24]", OURO = "text-[#F3D98B]";
var corSit = function(l){ return l.situacao.indexOf("Bateu") === 0 ? VERDE : l.situacao === "Não bateu" ? VERMELHO : AMARELO; };
var dinheiro = function(v){ return typeof v === "number" ? brl(v) : v; };

var COLS = [
  {k:"cod", t:"Código"}, {k:"nome", t:"Nome"}, {k:"rep", t:"Representante"}, {k:"classeNome", t:"Classe"},
  {k:"media", t:"Média", fmt:function(v){ return v ? brl(v) : "Sem venda"; }}, {k:"cond", t:"Condicional"},
  {k:"m1", t:"Meta 1", fmt:dinheiro}, {k:"br1", t:"Brinde extra Meta 1", cor:function(){ return OURO; }}, {k:"m2", t:"Meta 2", fmt:dinheiro}, {k:"br2", t:"Brinde extra Meta 2", cor:function(){ return OURO; }},
  {k:"previsto", t:"Acerto previsto", fmt:function(v){ return v.indexOf("Acertou") === 0 ? v : dm(v); }},
  {k:"vendeuTxt", t:"Vendeu", fmt:dinheiro}, {k:"situacao", t:"Situação", cor:corSit}
];

// Botão + na coluna Média (Marcus, 02/11/2026): abre mais 3 colunas com as vendas que formam a média (da mais nova para a mais antiga).
var EXTRAS = [{k:"v1", t:"Última venda"}, {k:"v2", t:"Penúltima venda"}, {k:"v3", t:"Antepenúltima venda"}];
var ETAPAS = [["liberar", "A liberar"], ["pago", "Pagamento confirmado"], ["aplicado", "Aplicado no acerto"]];
var rotuloEtapa = function(k){ return (ETAPAS.filter(function(x){ return x[0] === k; })[0] || [0, "A liberar"])[1]; };
var chaveBrinde = function(mes, cod){ return mes + "|" + cod; };
function montaCols(ver, alterna, brinde){
  var r = [];
  COLS.forEach(function(c){
    if(c.k !== "media") return r.push(c);
    r.push(Object.assign({}, c, {acao:{rotulo:ver ? "−" : "+", titulo:ver ? "Esconder as vendas anteriores" : "Mostrar as vendas anteriores", onClick:alterna}}));
    if(ver) EXTRAS.forEach(function(x){ r.push(x); });
  });
  r.push({k:"brinde", t:"Brinde extra no acerto", render:brinde});
  return r;
}
var daVenda = function(x){ return x ? brl(x.v) + " em " + dm(x.d).slice(0, 5) : "-"; };

function AbaMetasRevendedoras(){
  var sd = useState(null), dados = sd[0], setDados = sd[1], se = useState(""), erro = se[0], setErro = se[1], mes = MES_PADRAO;   // sem seletor de mês (Marcus, 02/11/2026): a campanha vigente; a troca de campanha virá na tela Campanha
  var sv = useState(false), ver = sv[0], setVer = sv[1], sb = useState(null), est = sb[0], setEst = sb[1];
  // etapa do brinde extra de cada uma (módulo metas, chave brindes)
  useEffect(function(){
    if(!apiAtiva()) return;
    chamar("GET", "/estado/metas").then(function(d){ setEst((d.conteudo || {}).brindes || {}); }).catch(function(x){ setErro(x.message); });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var mudaEtapa = function(cod, etapa){
    if(!est) return;
    var novo = Object.assign({}, est); novo[chaveBrinde(mes, cod)] = {etapa:etapa, por:nomeDaConta() || "", em:new Date().toISOString()};
    setEst(novo);
    chamar("PUT", "/estado/metas", {chaves:{brindes:novo}}).catch(function(x){ setErro(x.message); setEst(est); });
  };
  var cols = useMemo(function(){
    return montaCols(ver, function(){ setVer(!ver); }, function(v, l){
      if(l.situacao.indexOf("Bateu") !== 0) return "-";
      var at = l.etapaBrinde, ops = ETAPAS.filter(function(x){ return x[0] !== "aplicado" || at !== "liberar"; });   // só aplica quem já está com o pagamento confirmado
      return e("select",{value:at, "aria-label":"Brinde extra de " + l.nome, onChange:function(ev){ mudaEtapa(l.cod, ev.target.value); }, className:CAMPO + " w-52 text-center"},
        ops.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); }));
    });
  }, [ver, est]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){
    if(!apiAtiva()) return;
    var vivo = true; setDados(null); setErro("");
    chamar("GET", "/metas/revendedoras?mes=" + mes).then(function(d){ if(vivo) setDados(d); }).catch(function(x){ if(vivo) setErro(x.message); });
    return function(){ vivo = false; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var linhas = useMemo(function(){
    return dados ? dados.itens.map(function(i){
      var etapa = ((est || {})[chaveBrinde(mes, i.cod)] || {}).etapa || "liberar";
      return Object.assign({}, i, {etapaBrinde:etapa, brinde:i.situacao.indexOf("Bateu") === 0 ? rotuloEtapa(etapa) : "-", br1:"BB " + brl(i.br1Bb) + " + Normal " + brl(i.br1No), br2:"BB " + brl(i.br2Bb) + " + Normal " + brl(i.br2No), v1:daVenda((i.vendasMedia || [])[0]), v2:daVenda((i.vendasMedia || [])[1]), v3:daVenda((i.vendasMedia || [])[2]), previsto:i.vendeu === null ? i.prev : "Acertou em " + dm(i.acertoEm).slice(0, 5), vendeuTxt:i.vendeu === null ? "Aguardando" : i.vendeu});
    }) : [];
  }, [dados, est]);   // eslint-disable-line react-hooks/exhaustive-deps
  var resumo = useMemo(function(){
    if(!dados) return null;
    var it = dados.itens, ac = it.filter(function(i){ return i.vendeu !== null; }), agu = it.filter(function(i){ return i.vendeu === null; });
    var ini = dados.mes + "-01", fim = dados.mes + "-" + new Date(Number(dados.mes.slice(0, 4)), Number(dados.mes.slice(5, 7)), 0).getDate();
    var prev = agu.filter(function(i){ return i.prev && i.prev <= fim; }).length;
    var cnt = function(s){ return it.filter(function(i){ return i.situacao === s; }).length; };
    var b1 = cnt("Bateu Meta 1"), b2 = cnt("Bateu Meta 2"), nao = cnt("Não bateu");
    return {total:it.length, ac:ac.length, agu:agu.length, prev:prev, fim:fim.slice(8, 10) + "/" + fim.slice(5, 7), ini:ini, b1:b1, b2:b2, nao:nao,
      extra:it.reduce(function(t, i){ return (est || {})[chaveBrinde(mes, i.cod)] && (est || {})[chaveBrinde(mes, i.cod)].etapa === "aplicado" ? t : t + (i.extraBb || 0) + (i.extraNormal || 0); }, 0),
      porClasse:dados.classes.map(function(c){ return {nome:c.nome, desc:c.desc || c.nome, metas:c.individual ? "Média +" + dados.regra.pct1 + "% e +" + dados.regra.pct2 + "%" : brl(c.m1) + " e " + brl(c.m2), n:it.filter(function(i){ return i.classe === c.id; }).length}; })};
  }, [dados, est]);   // eslint-disable-line react-hooks/exhaustive-deps

  if(!apiAtiva()) return e(Pagina,{className:TOPO}, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  var cabeca = e("h1",{className:"font-heading text-xl font-semibold leading-none"}, "Revendedoras - Metas de " + (CAMPANHAS[mes] ? CAMPANHAS[mes].nome.replace(" de ", " ") : mes));
  if(erro) return e(Pagina,{className:TOPO}, cabeca, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro));
  if(!dados) return e(Pagina,{className:TOPO}, cabeca, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo as revendedoras e as vendas… na primeira vez pode levar alguns segundos."));

  return e(Pagina,{className:TOPO}, cabeca,
    e("div",{className:"grid grid-cols-1 gap-2.5 lg:grid-cols-3"},
      e(BlocoResumo,{t:"Revendedoras por categoria", cab:["Categoria (média das 3 últimas vendas)", "Revendedoras", "Meta 1 e Meta 2"], linhas:resumo.porClasse.map(function(c){ return {r:c.desc, v:N(c.n), p:c.metas}; })}),
      e(BlocoResumo,{t:"Acertos da campanha", cab:["Situação", "Revendedoras", "Do total"], linhas:[
        {r:"Participantes", v:N(resumo.total), p:"100%"},
        {r:"Acertaram", v:N(resumo.ac), p:pct(resumo.ac, resumo.total), cor:"ok"},
        {r:"Aguardando acerto", v:N(resumo.agu), p:pct(resumo.agu, resumo.total), cor:"alerta"},
        {r:"Previstos até " + resumo.fim, v:N(resumo.prev), p:pct(resumo.prev, resumo.agu)},
        {r:"Depois de " + resumo.fim + " ou sem data", v:N(resumo.agu - resumo.prev), p:pct(resumo.agu - resumo.prev, resumo.agu)},
        {r:"Taxa de acerto", v:pct(resumo.ac, resumo.total), total:true}]}),
      e(BlocoResumo,{t:"Meta da campanha", cab:["Resultado", "Revendedoras", "Dos acertos"], linhas:[
        {r:"Bateram a Meta 2", v:N(resumo.b2), p:pct(resumo.b2, resumo.ac), cor:"ok"},
        {r:"Bateram a Meta 1", v:N(resumo.b1), p:pct(resumo.b1, resumo.ac), cor:"ok"},
        {r:"Total que bateram", v:N(resumo.b1 + resumo.b2), p:pct(resumo.b1 + resumo.b2, resumo.ac), cor:"ok"},
        {r:"Não bateram", v:N(resumo.nao), p:pct(resumo.nao, resumo.ac), cor:"ruim"},
        {r:"Ainda sem acerto", v:N(resumo.agu), p:pct(resumo.agu, resumo.total) + " do total", cor:"alerta"},
        {r:"Extra de brinde a liberar", v:brl(resumo.extra), p:"BB e Normal", total:true, cor:"ouro"}]})),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"cod", centro:true, semContagem:true, vazio:"Nenhuma revendedora encontrada."}));
}
export { AbaMetasRevendedoras };
