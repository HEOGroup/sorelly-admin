// Sorelly Admin · montagem — mobile/montadora-pedido.js
// App da montadora → aba "Pedir peça": a montadora pede peças ao Cadastro de peças e vê a resposta (vai produzir, pronto, não temos).
// Regras em domain/pedidos-pecas.js (estado s.pp). Cores sólidas, sem degradê; descrição de cartão em uma linha.
import { BANHOS, MODELOS, PUBLICOS, STATUS, TIPOS_PECA, URGENCIAS, resumoPedido } from "@/apps/montagem/domain/pedidos-pecas";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var COR_ST = {aberto:"#B45309", ok:"#1D4ED8", pronto:"#15803D", sem:"#B91C1C"};
var CAMPO = "h-10 w-full rounded-xl border border-[#E9DDBB] bg-white px-2.5 text-[14px] text-[#111827] outline-none";
var VAZIO = {tipo:"", banho:"tanto", publico:"", modelos:"3", urg:"normal", texto:""};

function Chips(p){
  return e("div",{className:"flex flex-wrap gap-1.5"}, p.opcoes.map(function(o){ var on = String(o[0])===String(p.v);
    return e("button",{key:o[0], type:"button", onClick:function(){ p.set(o[0]); }, className:"h-9 rounded-full px-3 text-[13px] font-bold "+(on ? "bg-[#B8862B] text-white" : "bg-[#F6EBCB] text-[#6B5B2A]")}, o[1]); }));
}
function Rot(p){ return e("p",{className:"mb-1 text-[11.5px] font-bold uppercase tracking-wide text-[#6B5B2A]"}, p.t); }

function CelPedir(){
  var cx = use(), s = cx.state, d = cx.dispatch, id = s.celular, m = s.montadoras.find(function(x){ return x.id===id; }) || {nome:"—"};
  var st = useState(VAZIO), v = st[0], set = function(k, x){ st[1](Object.assign({}, v, {[k]:x})); };
  var meus = ((s.pp && s.pp.pedidos) || []).filter(function(p){ return p.porId===id; });
  var avisos = meus.filter(function(p){ return p.status!=="aberto" && !p.visto; });
  var enviar = function(){
    d({type:"PP", op:"add", por:m.nome, porId:id, origem:"app", tipo:v.tipo, banho:v.banho, publico:v.publico, modelos:v.modelos, urg:v.urg, texto:v.texto});
    if(v.tipo || v.texto.trim()) st[1](VAZIO);
  };
  return e("div",{className:"flex flex-col gap-2.5"},
    avisos.map(function(p){
      return e("button",{key:p.id, type:"button", onClick:function(){ d({type:"PP", op:"visto", id:p.id}); }, className:"flex flex-col rounded-2xl px-3.5 py-3 text-left", style:{background:COR_ST[p.status]+"1A", color:COR_ST[p.status]}},
        e("b",{className:"truncate text-[14px]"}, p.status==="pronto" ? "Pronto, pode buscar" : p.status==="ok" ? "O cadastro vai produzir" : "O cadastro não tem"),
        e("span",{className:"line-clamp-2 text-[13px]"}, resumoPedido(p)+(p.status==="sem" && p.resposta ? " · "+p.resposta : "")),
        e("span",{className:"text-[11.5px] font-semibold"}, "Toque para fechar o aviso"));
    }),
    e("div",{className:"flex flex-col gap-2.5 rounded-2xl border border-[#E9DDBB] bg-white p-3 shadow-sm"},
      e("div",null, e(Rot,{t:"Peça"}),
        e("select",{value:v.tipo, onChange:function(ev){ set("tipo", ev.target.value); }, "aria-label":"Peça", className:CAMPO}, e("option",{value:""}, "Escolha a peça"), TIPOS_PECA.map(function(t){ return e("option",{key:t, value:t}, t); }))),
      e("div",null, e(Rot,{t:"Banho"}), e(Chips,{opcoes:BANHOS, v:v.banho, set:function(x){ set("banho", x); }})),
      e("div",null, e(Rot,{t:"Público"}), e(Chips,{opcoes:[["", "Qualquer"]].concat(PUBLICOS), v:v.publico, set:function(x){ set("publico", x); }})),
      e("div",null, e(Rot,{t:"Quantos modelos"}), e(Chips,{opcoes:MODELOS.map(function(n){ return [String(n), String(n)]; }), v:v.modelos, set:function(x){ set("modelos", x); }})),
      e("div",null, e(Rot,{t:"Urgência"}), e(Chips,{opcoes:URGENCIAS, v:v.urg, set:function(x){ set("urg", x); }})),
      e("input",{value:v.texto, onChange:function(ev){ set("texto", ev.target.value); }, placeholder:"Detalhe: letras A, M · aro 16", "aria-label":"Detalhe", className:CAMPO}),
      e("button",{type:"button", onClick:enviar, className:"h-11 rounded-xl bg-[#B8862B] text-[15px] font-bold text-white"}, "Enviar pedido")),
    e("div",{className:"flex flex-col gap-1.5"},
      e("p",{className:"px-1 text-[13px] font-bold text-[#4B5563]"}, "Meus pedidos"),
      meus.length ? meus.slice(0, 15).map(function(p){
        return e("div",{key:p.id, className:"flex items-center justify-between gap-2 rounded-2xl border border-[#E9DDBB] bg-white px-3 py-2.5 shadow-sm"},
          e("span",{className:"min-w-0 truncate text-[13.5px] font-semibold text-[#111827]"}, resumoPedido(p)),
          e("span",{className:"shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold", style:{background:COR_ST[p.status]+"1F", color:COR_ST[p.status]}}, STATUS[p.status]));
      }) : e("p",{className:"px-1 text-[13px] text-[#6B7280]"}, "Você ainda não pediu peças.")));
}
export { CelPedir };
