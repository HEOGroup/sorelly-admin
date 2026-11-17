// Sorelly Admin · montagem — components/pref-visual.js
// Preferência da revendedora em leitura VISUAL para quem monta o kit (Marcus, 16/11/2026: "não é nada visual"): barra de ouro e prata, pontinho de metal,
// valores separados por "·", "tudo em ouro" quando todos são iguais e as fotos dela. Recebe `dados` (pkExibirResposta) de pkResumoParaMontagem.
// Texto 13 px, rótulo 11 px; a cor só aparece no metal (dourado e prata), o resto é preto.
import { Fotos } from "@/apps/montagem/components/fotos-pref";
import { e } from "@/shared/react";

var PRETO = {color:"#111827"}, MARROM = {color:"#8A6A12"};
var COR_METAL = {ouro:"#C9A13B", prata:"#9CA3AF"};
var limpa = function(t){ return String(t||"").replace(/\s*\([^)]*\)/g, "").replace(/:\s*$/, "").trim(); };
var metalDe = function(t){ var m = String(t||"").toLowerCase(), c = []; if(m.indexOf("ouro")>=0) c.push("ouro"); if(m.indexOf("prata")>=0) c.push("prata"); return c; };
// pontinho(s) do metal + o nome
function Metal(p){
  var cs = metalDe(p.metal);
  return e("span",{className:"inline-flex items-center gap-1 font-bold", style:PRETO},
    e("span",{className:"inline-flex items-center gap-0.5"}, cs.map(function(c){ return e("i",{key:c, className:"inline-block size-2.5 rounded-full", style:{background:COR_METAL[c]}}); })),
    p.metal);
}
// barra do tanto de ouro e prata
function BarraOuro(p){
  var pct = Math.round(p.pct);
  return e("div",{className:"flex items-center gap-2"},
    e("div",{className:"flex h-2 w-14 shrink-0 overflow-hidden rounded-full", style:{background:COR_METAL.prata}}, e("i",{className:"block h-full", style:{width:pct+"%", background:COR_METAL.ouro}})),
    e("span",{className:"whitespace-nowrap text-[13px] font-bold", style:PRETO}, pct+"% ouro · "+(100-pct)+"% prata"));
}
// linhas sem valor e com metal (colar de filhos, colar de letras...) viram grupos por metal: "Ouro: A · M · N" ou "Tudo em ouro"
function porMetal(linhas){
  var g = [], achou = {};
  linhas.forEach(function(l){ var k = l.metal; if(!achou[k]){ achou[k] = {metal:k, itens:[]}; g.push(achou[k]); } achou[k].itens.push(limpa(l.rotulo)); });
  return g;
}

// TUDO NUMA LINHA que quebra só se faltar espaço: [título] barra de ouro · valores · metal; as fotos vão numa linha à parte
function PrefVisual(p){
  var d = p.dados;
  if(!d) return p.texto ? e("span",{className:"text-[13px] leading-tight", style:PRETO}, p.texto) : null;
  var linhas = d.linhas || [], soMetal = linhas.filter(function(l){ return !(l.valores||[]).length && l.metal && !/metal/i.test(l.rotulo); }), outras = linhas.filter(function(l){ return soMetal.indexOf(l)<0; });
  var grupos = porMetal(soMetal), unico = grupos.length===1 && soMetal.length>1, linha = "inline-flex flex-wrap items-baseline gap-x-1.5 text-[13px] leading-tight";
  return e("div",{className:"flex flex-col gap-1"},
    e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-0.5"},
      p.titulo && e("span",{className:"text-[11px] font-bold uppercase", style:MARROM}, p.titulo),
      d.vende===false && e("span",{className:"text-[13px] font-extrabold", style:PRETO}, "Não vende"),
      d.vende===true && !linhas.length && d.ouroPct==null && e("span",{className:"text-[13px] font-bold", style:PRETO}, "Vende"),
      d.ouroPct!=null && e(BarraOuro,{pct:d.ouroPct}),
      outras.map(function(l, i){
        var vs = (l.valores||[]).filter(Boolean);
        return e("span",{key:"o"+i, className:linha, style:PRETO}, !/metal/i.test(l.rotulo) && e("span",{className:"text-[11px] font-bold uppercase", style:MARROM}, limpa(l.rotulo)), vs.length ? e("b",null, vs.join(" · ")) : null, l.metal ? e(Metal,{metal:l.metal}) : null);
      }),
      unico ? e("span",{className:linha, style:PRETO}, e(Metal,{metal:grupos[0].metal}))
        : grupos.map(function(gr, i){ return e("span",{key:"g"+i, className:linha, style:PRETO}, e(Metal,{metal:gr.metal}), e("span",null, gr.itens.join(" · "))); })),
    e(Fotos,{lista:p.fotos}));
}

export { PrefVisual };
