// Sorelly Admin · montagem — pages/MetasRegras.js
// Metas › Regras (Marcus, 02/11/2026): a regra da campanha escrita para a equipe e as representantes (GERADA dos números da campanha, nada fixo na tela), a tabela de metas e brindes por categoria
// (a mensagem pronta para o WhatsApp saiu a pedido do Marcus). A tela Campanha acabou: aqui mesmo o botão Editar deixa digitar, por categoria, a Meta 1, a Meta 2 e o brinde extra (BB e Normal) de cada meta.
// Salvar grava no servidor (módulo metas, chave campanhas, por mês) e todas as telas do setor passam a usar os valores. Sem nada salvo valem os valores padrão de domain/metas.js.
// A categoria de R$ 7.000 ou mais tem meta individual (média +15% e +35%): só o brinde extra dela se digita. Linha de divisão antes do bloco da Meta 1 e antes do bloco da Meta 2.
import { Pagina } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { FAIXAS_OFICIAIS, PRATA_FAIXAS } from "@/apps/montagem/domain/consignado";
import { BRINDE_EXTRAS, CAMPANHAS, MES_PADRAO } from "@/apps/montagem/domain/metas";
import { chamar } from "@/apps/montagem/lib/api";
import { limpaMetas, useMetas } from "@/apps/montagem/lib/metas-dados";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var TOPO = "-mt-4 gap-2";
var N = function(v){ return Number(v).toLocaleString("pt-BR"); };
var reais = function(v){ return "R$ " + Number(v || 0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var numero = function(t){ var s = String(t).replace(/[^\d,]/g, "").replace(",", "."); return parseFloat(s) || 0; };
var CAMPOS = ["m1", "bb1", "no1", "m2", "bb2", "no2"];
var EXTRA = ["bb1", "no1", "bb2", "no2"];   // brinde extra: escolhido entre os valores permitidos (sempre R$ 4,00 a menos que um valor de brinde da Sorelly)

// Régua de comissão e brinde do acerto (Kit padrão e Kit 100% Prata), lida de domain/consignado.js: faixa de venda líquida → comissão, brinde Normal e brinde BB.
var COLS_COM = [
  {k:"venda", t:"Venda líquida"}, {k:"p1", t:"Comissão", sep:true}, {k:"n1", t:"Normal"}, {k:"b1", t:"BB"},
  {k:"p2", t:"Comissão", sep:true}, {k:"n2", t:"Normal"}, {k:"b2", t:"BB"}
];
// Barra em cima da tabela de comissões, só uma: "Comissões e brindes" em cima de Venda líquida, e Padrão | Prata em cima das colunas (Marcus, 02/11/2026)
var CAB_COM = [[{t:"Comissões e brindes", span:1}, {t:"Padrão", span:3, sep:true}, {t:"Prata", span:3, sep:true}]];
function comissoes(){
  var l = [];   // a linha "abaixo de R$ 300,00" saiu para compactar o bloco (sem comissão e sem brinde)
  FAIXAS_OFICIAIS.forEach(function(f, i){
    var p = PRATA_FAIXAS[i], prox = FAIXAS_OFICIAIS[i + 1];
    l.push({venda:prox ? brl(f.min) + " até " + brl(prox.min - 0.01) : brl(f.min) + " ou mais", p1:f.pct + "%", n1:brl(f.bn), b1:brl(f.bb), p2:p.pct + "%", n2:brl(p.bn), b2:brl(p.bb)});
  });
  return l;
}
var COMISSOES = comissoes();

function regrasEscritas(r, cls){
  var ini = cls.filter(function(c){ return c.id === "ini"; })[0] || {m1: r.piso1, m2: r.piso2}, ini2 = cls.filter(function(c){ return c.id === "ini2"; })[0];
  return [
    "A meta vale para o PRÓXIMO ACERTO, em qualquer data. Quem acerta em dezembro continua com a meta de novembro.",
    "A meta sai da média das 3 últimas vendas antes da campanha (venda sem brinde).",
    ini2 && (ini.m1 !== ini2.m1 || ini.m2 !== ini2.m2) ? "Kit novo e médias até R$ 999,99: cada categoria tem a sua meta, veja a tabela abaixo." : "Kit novo e média de R$ 0,00 até R$ 999,99: Meta 1 de " + brl(ini.m1) + " e Meta 2 de " + brl(ini.m2) + ".",
    "Cada categoria tem a sua Meta 1 e a sua Meta 2 (tabela abaixo). A categoria de R$ 7.000,00 ou mais tem meta individual: média + " + r.pct1 + "% e + " + r.pct2 + "%.",
    "Quem bate a meta ganha brinde BB e Normal EXTRA, somado ao brinde que o acerto já dá.",
    "O brinde extra só é liberado com o pagamento do acerto confirmado.",
    "Quem ainda não acertou quando a campanha seguinte começa mantém a meta da campanha anterior."
  ];
}
function AbaMetasRegras(){
  var sm = useState(MES_PADRAO), mes = sm[0], setMes = sm[1], sv = useState(0), v = sv[0], setV = sv[1];
  var m = useMetas(mes, v), dados = m.dados;
  var sed = useState(false), edita = sed[0], setEdita = sed[1], sx = useState({}), txt = sx[0], setTxt = sx[1];
  var sa = useState(null), salvas = sa[0], setSalvas = sa[1], se = useState(""), erro = se[0], setErro = se[1], sg = useState(""), aviso = sg[0], setAviso = sg[1];
  useEffect(function(){
    if(!m.ligado) return;
    chamar("GET", "/estado/metas").then(function(d){ setSalvas((d.conteudo || {}).campanhas || {}); }).catch(function(x){ setErro(x.message); });
  }, [m.ligado]);   // eslint-disable-line react-hooks/exhaustive-deps
  var comecaEditar = function(){
    var t = {}; dados.classes.forEach(function(c){ var o = {}; CAMPOS.forEach(function(k){ o[k] = EXTRA.indexOf(k) >= 0 ? String(c[k]) : reais(c[k]); }); t[c.id] = o; });
    setTxt(t); setAviso(""); setEdita(true);
  };
  var muda = function(id, k, val){ var t = Object.assign({}, txt); t[id] = Object.assign({}, t[id], {[k]:val}); setTxt(t); };
  var grava = function(novas, msg){
    chamar("PUT", "/estado/metas", {chaves:{campanhas:novas}}).then(function(){ setSalvas(novas); limpaMetas(); setV(v + 1); setEdita(false); setAviso(msg); setErro(""); }).catch(function(x){ setErro(x.message); });
  };
  var salvar = function(){
    var cls = {}; dados.classes.forEach(function(c){ var t = txt[c.id] || {}, o = {};
      CAMPOS.forEach(function(k){ if(c.individual && (k === "m1" || k === "m2")) return; o[k] = numero(t[k]); }); cls[c.id] = o; });
    grava(Object.assign({}, salvas, {[mes]:{classes:cls}}), "Salvo. Revendedoras, Acompanhamento, Histórico e esta tela já usam estes valores.");
  };
  var padrao = function(){ var n = Object.assign({}, salvas); delete n[mes]; grava(n, "Valores padrão de volta."); };
  var campo = function(k){
    return function(val, l){
      if(l.individual && (k === "m1" || k === "m2")) return "Média +" + dados.regra[k === "m1" ? "pct1" : "pct2"] + "%";
      if(!edita) return reais(val);
      if(EXTRA.indexOf(k) >= 0){
        var atual = (txt[l.id] || {})[k] || "", ops = BRINDE_EXTRAS.slice();
        if(atual && ops.indexOf(Number(atual)) < 0) ops.push(Number(atual));   // valor antigo fora da lista continua aparecendo até ser trocado
        ops.sort(function(a, b){ return a - b; });
        return e("select",{value:atual, "aria-label":l.nome + " " + k, onChange:function(ev){ muda(l.id, k, ev.target.value); }, className:CAMPO + " w-32 text-center"},
          ops.map(function(x){ return e("option",{key:x, value:String(x)}, reais(x)); }));
      }
      return e("input",{type:"text", inputMode:"decimal", "aria-label":l.nome + " " + k, value:(txt[l.id] || {})[k] || "", onChange:function(ev){ muda(l.id, k, ev.target.value); },
        onBlur:function(){ muda(l.id, k, reais(numero((txt[l.id] || {})[k]))); }, className:CAMPO + " w-32 text-center"});
    };
  };
  var linhas = useMemo(function(){
    if(!dados) return [];
    var n = {}; dados.itens.forEach(function(i){ n[i.classe] = (n[i.classe] || 0) + 1; });
    return dados.classes.map(function(c){ return {id:c.id, nome:c.desc || c.nome, individual:c.individual, n:n[c.id] || 0, m1:c.m1, bb1:c.bb1, no1:c.no1, m2:c.m2, bb2:c.bb2, no2:c.no2}; });
  }, [dados]);
  var COLS = [
    {k:"nome", t:"Categoria (média das 3 últimas vendas)"}, {k:"n", t:"Revendedoras", fmt:N},
    {k:"m1", t:"Meta 1", sep:true, render:campo("m1")}, {k:"bb1", t:"Extra BB", render:campo("bb1")}, {k:"no1", t:"Extra Normal", render:campo("no1")},
    {k:"m2", t:"Meta 2", sep:true, render:campo("m2")}, {k:"bb2", t:"Extra BB", render:campo("bb2")}, {k:"no2", t:"Extra Normal", render:campo("no2")}
  ];
  var cabeca = e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
    e("h1",{className:"font-heading text-xl font-semibold leading-none"}, "Regras - Metas de " + (CAMPANHAS[mes] ? CAMPANHAS[mes].nome.replace(" de ", " ") : mes)),
    e(Segmentado,{opcoes:Object.keys(CAMPANHAS).map(function(k){ return [k, CAMPANHAS[k].nome.replace(" de ", " ")]; }), atual:mes, onMudar:function(k){ setMes(k); setEdita(false); setAviso(""); }}));
  if(!m.ligado) return e(Pagina,{className:TOPO}, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  if(m.erro || erro) return e(Pagina,{className:TOPO}, cabeca, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, m.erro || erro));
  if(!dados) return e(Pagina,{className:TOPO}, cabeca, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo as regras da campanha…"));
  var barra = {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)"};
  var bloco = function(t, filhos, dir){ return e("section",{className:"flex h-full flex-col rounded-lg border border-border bg-card/60"},
    e("h2",{className:"flex h-[30px] items-center justify-center rounded-t-lg border-b border-border px-3 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-[#1a1306]", style:barra}, t), filhos); };
  var blocoComissoes = e(TabelaPlanilha,{cols:COLS_COM, linhas:COMISSOES, chave:"venda", centro:true, semContagem:true, semFiltro:true, cheia:true, cabAcima:CAB_COM});
  return e(Pagina,{className:TOPO}, cabeca,
    e("div",{className:"grid grid-cols-1 items-stretch gap-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"}, bloco("Como funciona", regrasEscritas(dados.regra, dados.classes).map(function(r, i){ return e("p",{key:i, className:"flex min-h-7 flex-1 items-center justify-center border-b border-border px-3 py-1 text-center text-[13px] leading-snug last:border-b-0"}, r); })), blocoComissoes),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      edita
        ? [e(Botao,{key:"s", principal:true, onClick:salvar}, "Salvar"), e(Botao,{key:"c", onClick:function(){ setEdita(false); }}, "Cancelar"), e(Botao,{key:"p", onClick:padrao, desabilitado:!(salvas && salvas[mes])}, "Voltar ao padrão")]
        : e(Botao,{principal:true, onClick:comecaEditar, desabilitado:!salvas}, "Editar"),
      aviso && e("span",{role:"status", className:"text-[13px] font-semibold"}, aviso)),
    e(TabelaPlanilha,{cols:COLS, linhas:linhas, chave:"id", centro:true, semContagem:true, semFiltro:true, vazio:"Nenhuma categoria."}));
}
export { AbaMetasRegras };
