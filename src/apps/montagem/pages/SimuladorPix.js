// Sorelly Admin · montagem — pages/SimuladorPix.js
// Financeiro → Chaves Pix e regras (02/11/2026, Marcus): "testar uma situação" e "orientação do caixa".
// Testar: o Financeiro escolhe um caso (representante, link, dinheiro, Pix) e vê para onde o sistema mandaria o Pix e por quê (mesma decisão do sistema, domain/pix-regras.js).
// Orientação: mostra quem precisa de Pix primeiro, juntando saldo, limite, contas negativas e a folha dos próximos dias (domain/orientacao-pix.js). Quem decide é o Lucas.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { ESTADO } from "@/apps/montagem/components/padrao";
import { contasPixDoCnpj, orientacaoCaixa } from "@/apps/montagem/domain/orientacao-pix";
import { pxSimular } from "@/apps/montagem/domain/pix-regras";
import { REPRESENTANTES } from "@/apps/montagem/domain/pessoas";
import { isoDia } from "@/apps/montagem/domain/saldos-contas";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var IN = INPUT+" h-8! text-[13px]!";
var R = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var RS = function(n){ return (n<0 ? "−" : "")+R(Math.abs(n)); };
var num = function(v){ var s = String(v||"").trim(); if(s.indexOf(",")>=0) s = s.replace(/\./g, "").replace(",", "."); var x = parseFloat(s); return isNaN(x) ? 0 : x; };
var dm = function(iso){ return iso ? iso.split("-").reverse().slice(0, 2).join("/") : ""; };
var VAZIO = {rep:"", linkCnpj:"", link:"", dinheiro:"", pix:""};
// casos prontos para testar
var CASOS = [
  {t:"R$ 500 em dinheiro e R$ 100 em Pix", c:{dinheiro:"500", pix:"100"}},
  {t:"R$ 3.000 em dinheiro e R$ 1.000 em Pix", c:{dinheiro:"3000", pix:"1000"}},
  {t:"Link no CNPJ 59 e Pix de R$ 500", c:{linkCnpj:"59", link:"4000", pix:"500"}},
  {t:"Link no CNPJ 59 e Pix de R$ 1.600", c:{linkCnpj:"59", link:"4000", pix:"1600"}},
  {t:"Só Pix de R$ 3.500", c:{pix:"3500"}},
  {t:"Só Pix de R$ 400", c:{pix:"400"}}];

function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11px] font-semibold"}, p.rot, p.children); }

function Testar(p){
  var px = p.px, sc = p.sc, o = p.o, st = useState(VAZIO), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var rs = useState(null), res = rs[0], setRes = rs[1];
  var roda = function(c){ setRes(pxSimular(px, {rep:c.rep, linkCnpj:c.linkCnpj, link:num(c.link), dinheiro:num(c.dinheiro), pix:num(c.pix)})); };
  var caso = function(c){ var n = Object.assign({}, VAZIO, c); st[1](n); roda(n); };
  // quando as regras não escolhem a conta, o caixa orienta: CNPJ do link, ou o CNPJ que mais precisa de Pix (saldo, limite e folha)
  var sug = null;
  if(res && (res.tipo==="fila" || (res.tipo==="conta" && !res.cnpj)) && sc){
    var alvo = f.linkCnpj || (o && o.cnpjs.length ? o.cnpjs[0].id : ""), lista = alvo ? contasPixDoCnpj(px, sc, alvo) : [];
    if(alvo) sug = {cnpj:alvo, doLink:!!f.linkCnpj, lista:lista};
  }
  var cor = !res ? null : res.tipo==="conta" ? ESTADO.ok : res.tipo==="perguntar" ? ESTADO.alerta : res.tipo==="erro" ? ESTADO.ruim : ESTADO.total;
  var titulo = !res ? "" : res.tipo==="conta" ? "Mandar o Pix para: "+res.conta+(res.cnpj ? " (CNPJ "+res.cnpj+")" : "") : res.tipo==="perguntar" ? "Perguntar à empresa antes de enviar" : res.tipo==="fila" ? "Fica na fila para a empresa definir" : "Não deu para testar";
  return e(BlocoBarra,{cor:"azul", t:"Testar uma situação", sub:"Escolha um caso e veja para onde o sistema mandaria o Pix e por quê", compacto:true},
    e("div",{className:"flex flex-col gap-2 p-3"},
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, CASOS.map(function(c){ return e(Btn,{key:c.t, v:"ghost", sm:true, onClick:function(){ caso(c.c); }}, c.t); })),
      e("div",{className:"grid gap-2 rounded-xl bg-black/25 p-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(9.5rem, 1fr))"}},
        e(Campo,{rot:"Representante"}, e("select",{value:f.rep, "aria-label":"Representante", className:IN+" w-full cursor-pointer", onChange:function(ev){ set({rep:ev.target.value}); }}, e("option",{value:""}, "Nenhuma"), REPRESENTANTES.map(function(r){ return e("option",{key:r.nome, value:r.nome}, r.nome); }))),
        e(Campo,{rot:"Pagou com link no CNPJ"}, e("select",{value:f.linkCnpj, "aria-label":"CNPJ do link", className:IN+" w-full cursor-pointer", onChange:function(ev){ set({linkCnpj:ev.target.value}); }}, e("option",{value:""}, "Sem link"), ["34","46","59","67"].map(function(c){ return e("option",{key:c, value:c}, "CNPJ "+c); }))),
        e(Campo,{rot:"Valor do link (R$)"}, e("input",{value:f.link, inputMode:"decimal", disabled:!f.linkCnpj, "aria-label":"Valor do link", className:IN+" w-full text-center", onChange:function(ev){ set({link:ev.target.value}); }})),
        e(Campo,{rot:"Dinheiro (R$)"}, e("input",{value:f.dinheiro, inputMode:"decimal", "aria-label":"Dinheiro", className:IN+" w-full text-center", onChange:function(ev){ set({dinheiro:ev.target.value}); }})),
        e(Campo,{rot:"Pix (R$)"}, e("input",{value:f.pix, inputMode:"decimal", "aria-label":"Pix", className:IN+" w-full text-center", onChange:function(ev){ set({pix:ev.target.value}); }})),
        e("div",{className:"flex items-end justify-center"}, e(Btn,{v:"primary", onClick:function(){ roda(f); }}, "Testar"))),
      res && e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/25 p-3 text-center", style:{boxShadow:"inset 0 0 0 1px "+cor}},
        e("b",{className:"text-[13px]", style:{color:cor}}, titulo),
        e("p",{className:"text-[13px]"}, res.motivo),
        sug && e("div",{className:"flex flex-col gap-0.5 border-t border-white/10 pt-1.5"},
          e("p",{className:"text-[13px] font-semibold"}, "Sugestão do caixa (a empresa decide): "+(sug.lista.length ? sug.lista[0].label : "CNPJ "+sug.cnpj)),
          e("p",{className:"text-[11px]"}, sug.doLink ? "A venda teve link no CNPJ "+sug.cnpj+": o Pix segue no mesmo CNPJ." : "CNPJ "+sug.cnpj+" é o que mais precisa de Pix agora (veja a orientação abaixo)."),
          sug.lista.length>0 ? sug.lista.slice(0, 4).map(function(c, i){ return e("p",{key:i, className:"text-[11px]"}, c.label+" · saldo "+RS(c.saldo)+" · limite "+R(c.limite)+" · folga "+RS(c.folga)); }) : e("p",{className:"text-[11px]"}, "Nenhuma conta Pix deste CNPJ está ligada aos Saldos bancários. Ligue em Chaves Pix e regras.")),
        res.passos && res.passos.length>0 && e("div",{className:"flex flex-col gap-0.5 border-t border-white/10 pt-1.5"},
          e("p",{className:"text-[11px] font-semibold"}, "Regras olhadas, na ordem"),
          res.passos.map(function(t, i){ return e("p",{key:i, className:"text-[11px] "+(t.indexOf("COMBINA")===0 ? "font-bold" : "")}, t); })))));
}

function Orientacao(p){
  var o = p.o;
  if(!o) return e(BlocoBarra,{cor:"azul", t:"Orientação do caixa", compacto:true}, e("p",{className:"p-3 text-center text-[13px]"}, "Ainda não há saldo lançado. Lance os saldos em Saldos bancários para ver a orientação."));
  return e(BlocoBarra,{cor:"azul", t:"Orientação do caixa", sub:"Saldo de "+dm(o.dataSaldo)+" · folha e contas até "+dm(o.ate)+" · mande o Pix primeiro para quem está no alto da lista", compacto:true},
    e("div",{className:"flex flex-col gap-2 p-3"},
      o.semPrevisao && e("p",{className:"text-center text-[13px]"}, "Sem a previsão de contas a pagar neste computador: a lista usa só o saldo de hoje."),
      e("div",{className:"flex flex-col gap-1"}, o.frases.map(function(fr){ return e("p",{key:fr.id, className:"rounded-lg bg-black/25 px-3 py-1.5 text-center text-[13px]", style:fr.grave ? {boxShadow:"inset 0 0 0 1px "+ESTADO.ruim} : undefined}, e("b",null, fr.pos+"º  "), fr.texto); })),
      e(GradeFiltro,{chave:"pixcaixa", rows:o.cnpjs, cols:[
        {k:"pos", t:"Ordem", tipo:"num", forte:true, v:function(c){ return c.pos; }, exib:function(c){ return c.pos+"º"; }},
        {k:"cnpj", t:"CNPJ", v:function(c){ return c.nome; }},
        {k:"saldo", t:"Saldo hoje", tipo:"num", v:function(c){ return c.saldo; }, exib:function(c){ return RS(c.saldo); }, cor:function(c){ return c.saldo<0 ? "text-red-400" : "text-green-400"; }},
        {k:"limite", t:"Limite", tipo:"num", v:function(c){ return c.limite; }, exib:function(c){ return R(c.limite); }},
        {k:"folga", t:"Folga", tipo:"num", v:function(c){ return c.folga; }, exib:function(c){ return RS(c.folga); }, cor:function(c){ return c.folga<0 ? "text-red-400" : ""; }},
        {k:"pior", t:"Pior saldo", tipo:"num", v:function(c){ return c.pior; }, exib:function(c){ return RS(c.pior); }, cor:function(c){ return c.pior<0 ? "text-red-400" : ""; }},
        {k:"dia", t:"Dia do pior", v:function(c){ return dm(c.piorDia); }},
        {k:"folha", t:"Folha", tipo:"num", v:function(c){ return c.folha; }, exib:function(c){ return c.folha>0 ? R(c.folha) : "Sem folha"; }},
        {k:"sit", t:"Situação", forte:true, v:function(c){ return c.estoura ? "Vai passar do limite" : c.faltaFolha>0 ? "Folha não cabe" : c.negativa ? "Negativo" : "Folgado"; }, cor:function(c){ return c.estoura || c.faltaFolha>0 ? "text-red-400" : c.negativa ? "text-yellow-400" : "text-green-400"; }}]}),
      o.negativas.length>0 && e("div",{className:"flex flex-col gap-1"},
        e("p",{className:"text-center text-[11px] font-semibold"}, "Contas negativas hoje"),
        e(GradeFiltro,{chave:"pixneg", rows:o.negativas, cols:[
          {k:"conta", t:"Conta", v:function(n){ return n.nome; }},
          {k:"saldo", t:"Saldo", tipo:"num", v:function(n){ return n.saldo; }, exib:function(n){ return RS(n.saldo); }, cor:function(){ return "text-red-400"; }},
          {k:"limite", t:"Limite", tipo:"num", v:function(n){ return n.limite; }, exib:function(n){ return R(n.limite); }},
          {k:"folga", t:"Folga", tipo:"num", v:function(n){ return n.folga; }, exib:function(n){ return RS(n.folga); }, cor:function(n){ return n.folga<0 ? "text-red-400" : "text-yellow-400"; }}]})),
      o.folha.itens.length>0 && e("div",{className:"flex flex-col gap-1"},
        e("p",{className:"text-center text-[11px] font-semibold"}, "Folha e encargos até "+dm(o.ate)+" · total "+R(o.folha.total)),
        e(GradeFiltro,{chave:"pixfolha", rows:o.folha.itens, cols:[
          {k:"venc", t:"Vence", v:function(i){ return i.venc; }, exib:function(i){ return dm(i.venc); }},
          {k:"cnpj", t:"CNPJ", v:function(i){ return i.filial==="fora" ? "Por fora" : i.filial; }},
          {k:"nome", t:"Título", v:function(i){ return i.nome; }},
          {k:"valor", t:"Valor", tipo:"num", v:function(i){ return i.valor; }, exib:function(i){ return R(i.valor); }}]}))));
}

function SimuladorPix(p){
  var s = p.X.s, o = s.saldosContas ? orientacaoCaixa(s.saldosContas, isoDia(new Date()), 10) : null;
  return e("div",{className:"flex flex-col gap-2.5"}, e(Testar,{px:p.X.px, sc:s.saldosContas, o:o}), e(Orientacao,{o:o}));
}
export { SimuladorPix, Testar, Orientacao };
