// Sorelly Admin · montagem — pages/preferencias-kit/resposta.js
// Mostra e edita a RESPOSTA de uma revendedora em UM bloco, e desenha a PRÉVIA de um bloco como a revendedora o veria no app.
import { Janela } from "@/apps/montagem/components/padrao";
import { ALFABETO, METAIS, pkExibirResposta, pkNormalizarResposta } from "@/apps/montagem/domain/preferencias-kit";
import { Area, Bolinha, Bt, BarraMetal, Chip, MCOR, Painel, Selo, usePk } from "@/apps/montagem/pages/preferencias-kit/visual";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";

var MAX_VISIVEL = 12;

// ---------- resposta mostrada (já pronta de pkExibirResposta) ----------
function RespostaView(p){
  var x = p.exibir;
  if(!x || x.vazio) return e("p",{className:"text-center text-[12px] text-white/55"}, "Sem resposta.");
  var soMetal = x.linhas.filter(function(l){ return !l.valores.length && l.vende==null; }), comValores = x.linhas.filter(function(l){ return l.valores.length; }), vend = x.linhas.filter(function(l){ return l.vende!=null; });
  return e("div",{className:"flex flex-col items-center gap-1.5"},
    x.vende!==null && e(Selo,{cor:x.vende ? "#4ADE80" : "#94A3B8", ic:x.vende ? "check-circle" : "x-circle"}, x.vende ? "Vende" : "Não vende"),
    x.ouroPct!=null && e("div",{className:"w-full max-w-xs"}, e(BarraMetal,{ouro:x.ouroPct})),
    comValores.map(function(l, i){
      return e("div",{key:"v"+i, className:"flex flex-wrap items-center justify-center gap-1 text-[12.5px]"}, e("span",{className:"font-bold text-white/85"}, l.rotulo+":"),
        l.valores.map(function(v, j){ var hex = l.hex && l.hex[j]; return e("span",{key:j, className:"inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11.5px]"}, hex && e(Bolinha,{cor:hex, s:11}), v); }));
    }),
    soMetal.length>0 && e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, soMetal.map(function(l, i){
      return e("span",{key:i, className:"inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11.5px]"}, e("b",null, l.rotulo), l.metal && e("span",{style:{color:MCOR[l.metal]}}, "· "+l.metal)); })),
    vend.length>0 && e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, vend.map(function(l, i){
      return e("span",{key:i, className:"inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11.5px]"}, e("b",null, l.rotulo), e("span",{style:{color:l.vende ? (MCOR[l.metal] || "#4ADE80") : "#94A3B8"}}, "· "+(l.vende ? (l.metal || "Vende") : "Não vende"))); })),
    x.imagens && x.imagens.length>0 && e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, x.imagens.map(function(u, i){
      return e("a",{key:i, href:u, target:"_blank", rel:"noopener noreferrer", title:"Abrir imagem"}, e("img",{src:u, alt:"Imagem enviada "+(i+1), loading:"lazy", className:"size-14 rounded-lg object-cover ring-1 ring-white/25"})); })));
}

// ---------- prévia do bloco (como aparece no app da revendedora) ----------
var PILULA = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ring-1 ring-black/25";
function pilulas(lista, extra){
  var vis = lista.slice(0, MAX_VISIVEL), resto = lista.length-vis.length;
  return e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, vis.map(function(t, i){ return e("span",{key:i, className:PILULA+" bg-white/70"}, t); }), resto>0 && e("span",{className:PILULA+" bg-black/10"}, "+"+resto), extra);
}
var seg3 = function(rot){ return e("div",{className:"flex flex-wrap justify-center gap-1"}, (rot||METAIS).map(function(m){ return e("span",{key:m, className:PILULA+" bg-white/70"}, m); })); };
function Pergunta(p){ return e("div",{className:"flex flex-col items-center gap-1"}, e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide text-black/70"}, p.t), p.children); }
function PreviaBloco(p){
  var b = p.b, tipo = b.type, ini = [];
  var corpo = [];
  if(tipo==="id") corpo.push(e(Pergunta,{key:"c", t:b.colorField.label}, e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, b.colorField.options.slice(0, 24).map(function(o, i){ return e(Bolinha,{key:i, cor:o.hex, s:20, titulo:o.value}); }), !b.colorField.options.length && e("span",{className:"text-[12px] text-black/60"}, "Nenhuma cor cadastrada."))));
  if(tipo==="slider"){ corpo.push(e(Pergunta,{key:"g", t:"Proporção ouro e prata"}, e("div",{className:"h-2 w-40 overflow-hidden rounded-full bg-black/15"}, e("div",{className:"h-full w-1/2 bg-[#B8862B]"})))); b.fields.forEach(function(f){ corpo.push(e(Pergunta,{key:f.key, t:f.label}, pilulas(f.options))); }); }
  if(tipo==="filhos") b.options.slice(0, MAX_VISIVEL).forEach(function(o, i){ corpo.push(e(Pergunta,{key:"o"+i, t:o}, seg3())); });
  if(tipo==="vend" || tipo==="vendsimple"){
    corpo.push(e(Pergunta,{key:"s", t:"Você vende?"}, seg3(["Sim", "Não"])));
    if(tipo==="vend"){
      if(b.hasSlider) corpo.push(e(Pergunta,{key:"g", t:"Proporção ouro e prata"}, e("div",{className:"h-2 w-40 overflow-hidden rounded-full bg-black/15"}, e("div",{className:"h-full w-1/2 bg-[#B8862B]"}))));
      if(b.metalField) corpo.push(e(Pergunta,{key:"m", t:b.metalField.label}, seg3()));
      b.fields.forEach(function(f){ corpo.push(e(Pergunta,{key:f.key, t:f.label}, pilulas(f.options))); });
    }
  }
  if(tipo==="vendmetal") b.items.slice(0, MAX_VISIVEL).forEach(function(it, i){ corpo.push(e(Pergunta,{key:"i"+i, t:it}, seg3(["Não vende"].concat(METAIS)))); });
  if(tipo==="letras") corpo.push(e(Pergunta,{key:"l", t:"Letras (ouro, prata ou ambos)"}, e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, ALFABETO.slice(0, b.maxLetters||26).map(function(l){ return e("span",{key:l, className:"grid size-6 place-items-center rounded bg-white/70 text-[11px] font-bold ring-1 ring-black/25"}, l); }))));
  if(tipo==="observacoes") corpo.push(e("div",{key:"ob", className:"h-14 w-full rounded-lg bg-white/70 ring-1 ring-black/25"}));
  if(b.allowImages) corpo.push(e("div",{key:"im", className:"flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/40 px-2 py-1.5 text-[11.5px] font-bold text-black/70"}, e(Ph,{n:"image", s:14}), "Anexar imagens (até "+(b.maxImages||3)+")"));
  return e("div",{className:"flex flex-col gap-2 rounded-xl p-2.5 text-center text-[#1B1409]", style:{background:b.accent}},
    e("div",{className:"flex items-center justify-center gap-1.5 font-heading text-[14px] font-bold"}, p.numero!=null && e("span",{className:"grid size-5 place-items-center rounded-full bg-black/80 text-[11px] text-white"}, p.numero), b.title),
    corpo);
}

// amostra de resposta de um bloco (só para a prévia ao vivo do editor)
function amostraResposta(b){
  var o = function(l, i){ return l[i]; };
  if(b.type==="id") return {[b.colorField.key]:b.colorField.options.slice(0, 2).map(function(c){ return c.value; })};
  if(b.type==="slider"){ var r = {goldPercent:60}; b.fields.forEach(function(f){ if(f.options.length) r[f.key] = [f.options[0]]; }); return r; }
  if(b.type==="filhos"){ var r2 = {}; if(o(b.options,0)) r2[b.options[0]] = "Ouro"; if(o(b.options,1)) r2[b.options[1]] = "Prata"; return r2; }
  if(b.type==="letras") return {A:"Ouro", B:"Prata"};
  if(b.type==="vend"){ var r3 = {selling:true}; if(b.hasSlider) r3.goldPercent = 50; if(b.metalField) r3.metal = "Ouro"; b.fields.forEach(function(f){ if(f.options.length) r3[f.key] = [f.options[0]]; }); return r3; }
  if(b.type==="vendmetal"){ var r4 = {}; if(o(b.items,0)) r4[b.items[0]] = {selling:true, metal:"Ouro"}; if(o(b.items,1)) r4[b.items[1]] = {selling:false}; return r4; }
  return null;
}

// ---------- editor da resposta (Janela em colunas: resposta atual | edição) ----------
var CURTO = {"Ouro":"Ouro", "Prata":"Prata", "Ouro + Prata":"Ambos", "Não vende":"Não vende"};
// escolha entre poucas opções; vazio = sem resposta
function Seg(p){
  return e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, [""].concat(p.opcoes).map(function(o){
    return e(Chip,{key:o||"-", on:p.v===o, onClick:function(){ p.set(o); }, titulo:o || "Sem resposta"}, o ? (p.curto ? (CURTO[o] || o) : o) : "—"); }));
}
function Linha(p){ return e("div",{className:"flex flex-col items-center gap-1 rounded-lg bg-white/5 px-2 py-1.5"}, e("span",{className:"text-[12px] font-bold text-white/85"}, p.t), p.children); }

function EditorResposta(p){
  var b = p.bloco, ctx = usePk(), pk = ctx.pk;
  var st = useState(function(){ return JSON.parse(JSON.stringify(p.resposta || {})); }), r = st[0];
  var set = function(fn){ var c = Object.assign({}, r); fn(c); st[1](c); };
  var lista = function(k){ return Array.isArray(r[k]) ? r[k] : []; };
  var alterna = function(k, v){ set(function(c){ var l = lista(k).slice(), i = l.indexOf(v); if(i>=0) l.splice(i, 1); else l.push(v); if(l.length) c[k] = l; else delete c[k]; }); };
  var chips = function(k, opcoes, hex){
    return e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, opcoes.map(function(o, i){ var on = lista(k).indexOf(o)>=0;
      return e(Chip,{key:o, on:on, onClick:function(){ alterna(k, o); }}, hex && e(Bolinha,{cor:hex[i], s:11}), o); }));
  };
  var metalDe = function(k){ return typeof r[k]==="string" ? r[k] : ""; };
  var setMetal = function(k, v){ set(function(c){ if(v) c[k] = v; else delete c[k]; }); };
  var gold = function(){ return r.goldPercent==null ? null : r.goldPercent; };
  var ouroEdit = function(){ return e("div",{className:"flex flex-col items-center gap-1"},
    e("div",{className:"flex items-center gap-2"}, e("input",{type:"range", min:0, max:100, step:5, value:gold()==null ? 50 : gold(), "aria-label":"Porcentagem de ouro", onChange:function(ev){ var v = +ev.target.value; set(function(c){ c.goldPercent = v; }); }, className:"w-44 accent-[#E8B84B]"}),
      gold()==null ? e("span",{className:"text-[11.5px] text-white/55"}, "Sem proporção") : e("b",{className:"text-[12px]"}, gold()+"% ouro"),
      gold()!=null && e(Bt,{className:"py-1!", onClick:function(){ set(function(c){ delete c.goldPercent; }); }}, "Limpar")),
    gold()!=null && e("div",{className:"w-full max-w-xs"}, e(BarraMetal,{ouro:gold()}))); };
  var campos = [];
  if(b.type==="id") campos.push(e(Linha,{key:"c", t:b.colorField.label}, chips(b.colorField.key, b.colorField.options.map(function(o){ return o.value; }), b.colorField.options.map(function(o){ return o.hex; }))));
  if(b.type==="slider"){ campos.push(e(Linha,{key:"g", t:"Proporção ouro e prata"}, ouroEdit())); b.fields.forEach(function(f){ campos.push(e(Linha,{key:f.key, t:f.label}, chips(f.key, f.options))); }); }
  if(b.type==="filhos") b.options.forEach(function(o){ campos.push(e(Linha,{key:o, t:o}, e(Seg,{v:metalDe(o), opcoes:METAIS, curto:true, set:function(v){ setMetal(o, v); }}))); });
  if(b.type==="letras") ALFABETO.slice(0, b.maxLetters || 26).forEach(function(l){ campos.push(e(Linha,{key:l, t:l}, e(Seg,{v:metalDe(l), opcoes:METAIS, curto:true, set:function(v){ setMetal(l, v); }}))); });
  if(b.type==="vend" || b.type==="vendsimple"){
    campos.push(e(Linha,{key:"s", t:"Você vende?"}, e(Seg,{v:r.selling===true ? "Sim" : r.selling===false ? "Não" : "", opcoes:["Sim", "Não"], set:function(v){ set(function(c){ if(v==="") delete c.selling; else c.selling = v==="Sim"; }); }})));
    if(b.type==="vend" && r.selling===true){
      if(b.hasSlider) campos.push(e(Linha,{key:"g", t:"Proporção ouro e prata"}, ouroEdit()));
      if(b.metalField) campos.push(e(Linha,{key:"m", t:b.metalField.label}, e(Seg,{v:metalDe("metal"), opcoes:METAIS, curto:true, set:function(v){ setMetal("metal", v); }})));
      b.fields.forEach(function(f){ campos.push(e(Linha,{key:f.key, t:f.label}, chips(f.key, f.options))); });
    }
  }
  if(b.type==="vendmetal") b.items.forEach(function(it){
    var x = r[it], v = x && typeof x==="object" ? (x.selling ? (x.metal || "") : "Não vende") : "";
    campos.push(e(Linha,{key:it, t:it}, e(Seg,{v:v, opcoes:["Não vende"].concat(METAIS), curto:true, set:function(n){ set(function(c){ if(!n) delete c[it]; else if(n==="Não vende") c[it] = {selling:false}; else c[it] = {selling:true, metal:n}; }); }})));
  });
  var imgs = lista("images").join("\n");
  if(b.allowImages) campos.push(e(Linha,{key:"im", t:"Imagens (um link por linha, até "+(b.maxImages||3)+")"}, e(Area,{v:imgs, rot:"Links das imagens", rows:3, set:function(v){ set(function(c){ var l = v.split(/\r?\n/).filter(function(x){ return x.trim(); }).slice(0, b.maxImages||3); if(l.length) c.images = l; else delete c.images; }); }})));
  var n = pkNormalizarResposta(b, r), valido = !!n.resposta;
  var salvar = function(){ pk("resposta_set", {revendedoraId:p.rev.id, key:b.key, resposta:n.resposta, fonte:"manual"}); p.fechar(); };
  var remover = function(){ pk("resposta_set", {revendedoraId:p.rev.id, key:b.key, resposta:null, fonte:"manual"}); p.fechar(); };
  return e(Janela,{t:b.title, sub:"Resposta de "+p.rev.nome, fechar:p.fechar,
    colunas:[
      e(Painel,{key:"a", t:"Resposta atual", ic:"eye"}, e(RespostaView,{exibir:pkExibirResposta(b, r)}), !valido && e("p",{className:"text-[11.5px] text-white/55"}, "Preencha ao menos uma opção para salvar."), n.avisos.map(function(a, i){ return e("p",{key:i, className:"text-[11.5px] text-[#FDE68A]"}, a); })),
      e(Painel,{key:"b", t:"Edição", ic:"pencil-simple"}, campos)],
    rodape:[e(Bt,{key:"s", tipo:"forte", ic:"floppy-disk", disabled:!valido, onClick:salvar}, "Salvar resposta"), p.resposta && e(Bt,{key:"r", tipo:"perigo", ic:"trash", onClick:remover}, "Remover resposta"), e(Bt,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

export { RespostaView, PreviaBloco, EditorResposta, amostraResposta };
