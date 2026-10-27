// Sorelly Admin · kits novos Curitiba — components/rep-editar.js
// Janela para mapear uma representante: regiões que atende (em blocos, com ✕ e "+ adicionar") e dias e horários. Ao salvar, os horários passam de "Simulação" para "Informado".
import { EditorRegioes, regiaoDe } from "@/apps/kits-novos/components/rep-regioes-editor";
import { DIAS, horDeJan, janDe } from "@/apps/kits-novos/domain/regioes-rep";
import { todasReps } from "@/apps/kits-novos/domain/indicacao";
import { use } from "@/apps/kits-novos/state/context";
import { INPUT, MONO } from "@/apps/kits-novos/ui/input";
import { Modal } from "@/apps/kits-novos/ui/modal";
import { e, useState } from "@/shared/react";

function Campo(p){ return e("label",{className:"flex flex-col gap-1 "+(p.className||"")}, e("span",{className:"text-[12px] font-medium"}, p.l), p.children); }
var AREA = INPUT+" h-auto! min-h-16 py-2 text-sm!";

function DlgPerfilRep(p){
  var cx = use(), d = cx.dispatch, it = todasReps(cx.state).find(function(x){ return x.nome===p.nome; }) || {nome:p.nome, p:null}, base = it.p || {};
  var st = useState({reg:regiaoDe(base), obs:base.obs||"", lim:base.lim||"", hor:base.hor || horDeJan(base.jan)}), f = st[0], set = st[1];
  var up = function(k, v){ var n = Object.assign({}, f); n[k] = v; set(n); };
  var salvar = function(){
    d({type:"PERFIL_SALVAR", nome:p.nome, perfil:Object.assign({nome:p.nome, completo:base.completo, func:!!it.func}, f.reg, {obs:f.obs, lim:Number(f.lim)||0, hor:f.hor, jan:janDe(f.hor), sim:false})});
  };
  return e(Modal,{open:true, largo:true, titulo:"Mapa de "+p.nome, sub:base.completo || "Regiões e horários em que atende", confirmar:"Salvar", icone:"save", onClose:p.fechar, onConfirmar:salvar},
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"},
      e(EditorRegioes,{v:f.reg, onChange:function(v){ up("reg", v); }}),
      e("div",{className:"flex flex-col gap-3"},
        e(Campo,{l:"Dias e horários (ex.: das 8h às 12h e das 14h às 18h)"}, e("div",{className:"flex flex-col gap-1"}, DIAS.map(function(d){
          return e("div",{key:d[0], className:"flex items-center gap-2"}, e("span",{className:"w-9 shrink-0 text-[12px]"}, d[1]),
            e("input",{className:INPUT+" h-8! flex-1 text-sm!", value:f.hor[d[0]]||"", placeholder:"não atendo", "aria-label":d[1], onChange:function(ev){ var h = Object.assign({}, f.hor); h[d[0]] = ev.target.value; up("hor", h); }})); }))),
        e(Campo,{l:"Entregas de kit novo por dia"}, e("input",{className:INPUT+" w-28 "+MONO, inputMode:"numeric", value:f.lim, onChange:function(ev){ up("lim", ev.target.value.replace(/\D/g, "").slice(0, 2)); }})),
        e(Campo,{l:"Observação"}, e("textarea",{className:AREA, rows:2, value:f.obs, onChange:function(ev){ up("obs", ev.target.value); }})))));
}

export { DlgPerfilRep };
