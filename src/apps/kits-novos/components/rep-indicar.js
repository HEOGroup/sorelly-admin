// Sorelly Admin · kits novos Curitiba — components/rep-indicar.js
// Indicação: dada a região e as janelas da revendedora, mostra as melhores representantes (e por que). Sugestoes serve ao simulador e à janela de detalhe da revendedora.
import { Bloco, Botao, CampoSel, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { aberto } from "@/apps/kits-novos/domain/etapas";
import { FORTALECER_ATE, LIMITE_REV, rotuloSlot, sugerir, todasReps } from "@/apps/kits-novos/domain/indicacao";
import { PERFIS0, RMC } from "@/apps/kits-novos/domain/regioes-rep";
import { GradeJanelas } from "@/apps/kits-novos/components/grade-janelas";
import { use } from "@/apps/kits-novos/state/context";
import { badge } from "@/apps/kits-novos/ui/badge";
import { Vazio } from "@/apps/kits-novos/ui/card";
import { e, useState } from "@/shared/react";

var NIVEL = {bairro:["Bairro","success","check"], cidade:["Cidade","info"], inteira:["Cidade inteira","muted"]};

function Sugestoes(p){
  var s = use().state, r = sugerir(s, p.rev), lista = r.lista.slice(0, p.max || 5);
  if(!p.rev.cid) return e(Vazio,{txt:"Escolha a cidade da revendedora."});
  if(!lista.length) return e(Vazio,{txt:"Nenhuma representante atende esta região e este horário."});
  var cols = [{t:"#", w:36, n:1}, {t:"Representante", w:150}, {t:"Cobertura", w:160}, {t:"Prioridade", w:140}, {t:"Horários em comum"}, {t:"Revendedoras", w:110, n:1}, {t:"Abertos", w:70, n:1}, {t:"Recusas", w:72, n:1}, {t:"Pontos", w:70, n:1}].concat(p.onEscolher ? [{t:"", w:84}] : []);
  return e("div",{className:"flex flex-col gap-2"},
    e(TabelaP,{cols:cols, minW:p.onEscolher ? 1110 : 1030},
      lista.map(function(x, i){ var nv = NIVEL[x.nivel], comum = x.comum;
        return e(Tr,{key:x.nome},
          e(Td,{n:true}, String(i+1)), e(Td,{forte:true}, x.nome),
          e(Td,null, badge(nv[0], nv[1], nv[2])),
          e(Td,null, x.prior ? badge("Prioridade","primary","star") : "—"),
          e(Td,{title:comum ? comum.map(rotuloSlot).join(", ") : ""}, comum===null ? "Sem janelas informadas" : x.semHorario ? "Sem horário da representante" : comum.length+(comum.length===1 ? " horário: " : " horários: ")+comum.slice(0, 3).map(rotuloSlot).join(", ")+(comum.length>3 ? "…" : "")),
          e(Td,{n:true, cor:x.cota==null ? "text-foreground/40" : x.cota>LIMITE_REV ? "text-destructive" : x.cota<=FORTALECER_ATE ? "text-success" : "", title:x.cota>LIMITE_REV ? "Acima de "+LIMITE_REV+": o ideal é não mandar kit novo" : x.cota<=FORTALECER_ATE ? "Para fortalecer" : ""}, x.cota==null ? "—" : String(x.cota)),
          e(Td,{n:true, cor:x.abertos>3 ? "text-warning" : ""}, String(x.abertos)), e(Td,{n:true, cor:x.recusas ? "text-destructive" : ""}, String(x.recusas)), e(Td,{n:true, forte:true}, String(Math.round(x.pontos))),
          p.onEscolher && e(Td,null, e("button",{type:"button", onClick:function(){ p.onEscolher(x.nome); }, className:"inline-flex h-6 items-center rounded-md bg-primary px-2 text-[12px] font-semibold text-primary-foreground hover:bg-primary/80"}, "Escolher")));
      })),
    p.mostrarFora && r.fora.length>0 && e(TabelaP,{minW:420, cols:[{t:"Fora da indicação", w:200}, {t:"Motivo"}]}, r.fora.map(function(x){ return e(Tr,{key:x.nome, apagado:true}, e(Td,null, x.nome), e(Td,null, badge(x.motivo, x.motivo.indexOf("Bloqueada")>=0 ? "destructive" : "muted"))); })));
}

// cidades e bairros que existem no mapa das representantes
function opcoesLocal(s){
  var cid = {}, bai = {};
  todasReps(s).forEach(function(it){ var p = it.p; if(!p) return;
    (p.cur||[]).forEach(function(b){ (bai["Curitiba"] = bai["Curitiba"] || {})[b] = 1; });
    (p.rmc||[]).concat(p.outras||[]).forEach(function(x){ cid[x.c] = 1; (x.b||[]).forEach(function(b){ (bai[x.c] = bai[x.c] || {})[b] = 1; }); });
    if(p.pg) cid["Ponta Grossa"] = 1; });
  RMC.forEach(function(c){ cid[c] = 1; });
  return {cidades:["Curitiba"].concat(Object.keys(cid).sort()), bairros:function(c){ return Object.keys(bai[c]||{}).sort(); }};
}

function RepIndicar(){
  var cx = use(), s = cx.state, op = opcoesLocal(s);
  var st = useState({cid:"Curitiba", bai:"", jan:{}, rev:""}), f = st[0], set = st[1];
  var up = function(k, v){ var n = Object.assign({}, f); n[k] = v; set(n); };
  var abertas = s.dados.filter(function(c){ return aberto(c) && !c.rep; }).slice(0, 60);
  var escolheRev = function(id){
    var c = s.dados.find(function(x){ return x.id===id; });
    set(c ? {cid:c.cid || "Curitiba", bai:c.bai || "", jan:c.jan || {}, rev:id} : Object.assign({}, f, {rev:""}));
  };
  var bairros = op.bairros(f.cid);
  return e("div",{className:"flex flex-col gap-3"},
    e("section",{className:"rounded-lg border border-border bg-card/60"},
      e("div",{className:"flex h-8 items-center px-3 text-[13px] font-medium"}, "Revendedora"),
      e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 px-3 pb-3 md:grid-cols-4"},
        e(CampoSel,{t:"Do quadro (sem representante)", id:"ind-rev", cls:"col-span-2", value:f.rev, onChange:escolheRev, opcoes:[["", "Digitar a região"]].concat(abertas.map(function(c){ return [c.id, c.nome+" · "+(c.bai ? c.bai+", " : "")+c.cid]; }))}),
        e(CampoSel,{t:"Cidade", id:"ind-cid", value:f.cid, onChange:function(v){ set(Object.assign({}, f, {cid:v, bai:"", rev:""})); }, opcoes:op.cidades.map(function(c){ return [c, c]; })}),
        e(CampoSel,{t:"Bairro", id:"ind-bai", value:f.bai, onChange:function(v){ set(Object.assign({}, f, {bai:v, rev:""})); }, opcoes:[["", "Qualquer"]].concat(bairros.map(function(b){ return [b, b]; }))}))),
    e(Bloco,{t:"Janelas da revendedora", dir:e(Botao,{onClick:function(){ set(Object.assign({}, f, {jan:{}})); }}, "Limpar")}, e(GradeJanelas,{valor:f.jan, onChange:function(v){ set(Object.assign({}, f, {jan:v, rev:""})); }})),
    e(Bloco,{t:"Representantes indicadas"}, e(Sugestoes,{rev:{cid:f.cid, bai:f.bai, jan:f.jan}, max:6, mostrarFora:true})));
}

export { RepIndicar, Sugestoes };
