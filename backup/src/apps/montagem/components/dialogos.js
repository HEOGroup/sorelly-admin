// Sorelly Admin · montagem e bipagem — components/dialogos.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { capacidadeListagem, kitsNaListagem, listagemCheia } from "@/apps/montagem/domain/regras";
import { sugerido } from "@/apps/montagem/domain/vendas";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { Modal } from "@/apps/montagem/ui/modal";
import { e, useEffect, useRef, useState } from "@/shared/react";

function DlgNovoKit(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var st = useState({rev:"", bairro:"", v1:0, v2:0, v3:0, prio:false}), f = st[0], set = st[1];
  function up(k,v){ var n = Object.assign({}, f); n[k]=v; set(n); }
  var vendas = [f.v1,f.v2,f.v3].filter(function(x){return x>0;});
  var campo = function(lb, ch){ return e("label",{className:"flex flex-col gap-1.5"}, e("span",{className:"text-sm font-medium"}, lb), ch); };
  var lig = p.lid && s.listagens.find(function(x){return x.id===p.lid;});
  var cheia = lig && listagemCheia(s, p.lid);
  return e(Modal,{open:!!p.lid, titulo:"Kit de \u00faltima hora",
      sub: cheia ? "Listagem cheia ("+kitsNaListagem(s,p.lid)+"/"+capacidadeListagem(lig)+"): escolha outra listagem" : "Entra como aguardando valor at\u00e9 a Deysiane confirmar",
      confirmar:"Incluir kit", icone:"plus",
      desabilitado:!f.rev.trim() || cheia, onClose:p.fechar,
      onConfirmar:function(){ d({type:"ADD_KIT", lid:p.lid, rev:f.rev.trim(), bairro:f.bairro.trim(), vendas:vendas, prio:f.prio}); set({rev:"",bairro:"",v1:0,v2:0,v3:0,prio:false}); p.fechar(); }},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      campo("Revendedora", e("input",{className:INPUT, value:f.rev, onChange:function(ev){up("rev",ev.target.value);}})),
      campo("Bairro", e("input",{className:INPUT, value:f.bairro, onChange:function(ev){up("bairro",ev.target.value);}})),
      campo("\u00daltima venda", e(MoneyInput,{value:f.v1, onChange:function(v){up("v1",v);}})),
      campo("2\u00aa venda", e(MoneyInput,{value:f.v2, onChange:function(v){up("v2",v);}})),
      campo("3\u00aa venda", e(MoneyInput,{value:f.v3, onChange:function(v){up("v3",v);}})),
      e("label",{className:"flex items-center gap-2 self-end text-sm font-medium"}, e("input",{type:"checkbox", checked:f.prio, onChange:function(){up("prio",!f.prio);}, className:"size-4 accent-primary"}), "Priorit\u00e1rio")),
    vendas.length>0 && e("p",{className:"text-sm text-muted-foreground"},"Kit sugerido pela m\u00e9dia: ", e("b",{className:MONO+" text-primary"}, BK(sugerido(vendas, use().state.cfg)))));
}
function codigoRetirada(l){ return {L1:"4821", L2:"7364", L3:"2957", L4:"6148"}[l.id] || "1234"; }
function Assinatura(p){
  var ref = useRef(null), des = useRef(false);
  var ponto = function(ev){ var c = ref.current, r = c.getBoundingClientRect(); return [(ev.clientX-r.left)*c.width/r.width, (ev.clientY-r.top)*c.height/r.height]; };
  var limpar = function(){ var c = ref.current; c.getContext("2d").clearRect(0,0,c.width,c.height); p.onChange(null); };
  return e("div",{className:"flex flex-col gap-1.5"},
    e("div",{className:"flex items-baseline justify-between"},
      e("span",{className:"text-sm font-medium"},"3. Assinatura da representante"),
      e("button",{type:"button", onClick:limpar, className:"text-[12px] text-muted-foreground underline-offset-2 hover:underline"},"Limpar")),
    e("canvas",{ref:ref, width:560, height:150, "aria-label":"Quadro de assinatura",
      className:"h-[110px] w-full touch-none rounded-lg border border-dashed border-primary/50 bg-white",
      onPointerDown:function(ev){ des.current = true; ev.currentTarget.setPointerCapture(ev.pointerId); var g = ref.current.getContext("2d"), pt = ponto(ev);
        g.lineWidth = 2.5; g.lineCap = "round"; g.strokeStyle = "#1B1409"; g.beginPath(); g.moveTo(pt[0], pt[1]); },
      onPointerMove:function(ev){ if(!des.current) return; var g = ref.current.getContext("2d"), pt = ponto(ev); g.lineTo(pt[0], pt[1]); g.stroke(); },
      onPointerUp:function(){ if(!des.current) return; des.current = false; p.onChange(ref.current.toDataURL("image/png")); }}));
}
function DlgRetirada(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var l = p.lid && s.listagens.find(function(x){return x.id===p.lid;});
  var prontos = l ? s.kits.filter(function(k){return k.lid===l.id && k.status==="bipado";}) : [];
  var outros = l ? s.kits.filter(function(k){return k.lid===l.id && k.status!=="bipado" && k.status!=="retirado";}).length : 0;
  var sel0 = {}; prontos.forEach(function(k){ sel0[k.id] = true; });
  var st = useState({}), sel = st[0], setSel = st[1];
  var cd = useState(""), cod = cd[0], setCod = cd[1];
  var as = useState(null), ass = as[0], setAss = as[1];
  var ch = useState(0), chave = ch[0], setChave = ch[1];
  var so = useState(false), sozinha = so[0], setSozinha = so[1];   // veio na empresa e retirou sozinha: leva todos os kits prontos da listagem
  useEffect(function(){ setSel(sel0); setCod(""); setAss(null); setChave(chave+1); setSozinha(false); }, [p.lid]);
  var ids = prontos.filter(function(k){return sel[k.id];}).map(function(k){return k.id;});
  var total = prontos.filter(function(k){return sel[k.id];}).reduce(function(t,k){return t+k.valor;},0);
  var codOk = l && cod===codigoRetirada(l);
  var marcar = function(id){ var o = Object.assign({}, sel); o[id] = !o[id]; setSel(o); };
  var todos = ids.length===prontos.length;
  var alternaSozinha = function(){ var v = !sozinha; setSozinha(v); var o = {}; if(v) prontos.forEach(function(k){o[k.id]=true;}); setSel(v ? o : sel0); };
  return e(Modal,{open:!!p.lid, titulo:"Fazer retirada", sub: l ? l.rep+" \u00b7 "+prontos.length+(prontos.length===1?" kit bipado dispon\u00edvel":" kits bipados dispon\u00edveis")+(outros?" \u00b7 "+outros+" ainda em produ\u00e7\u00e3o":"") : "",
      confirmar: ids.length ? "Confirmar retirada de "+ids.length+(ids.length===1?" kit":" kits") : "Marque os kits", icone:"check",
      desabilitado: !ids.length || (!sozinha && (!codOk || !ass)), onClose:p.fechar,
      onConfirmar:function(){ d({type:"RETIRAR", lid:p.lid, ids:ids, por:s.usuario, assinatura:ass, codigo:codOk, sozinha:sozinha}); p.fechar(); }},
    // retirou sozinha: a representante veio na empresa e levou os kits; a funcion\u00e1ria logada faz a retirada junto. S\u00f3 marca.
    e("label",{className:"flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm "+(sozinha ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40")},
      e("input",{type:"checkbox", checked:sozinha, onChange:alternaSozinha, className:"size-4 accent-primary"}),
      e("span",{className:"flex-1"}, e("b",null,"Retirou sozinha"), e("span",{className:"ml-2 text-[12px] text-muted-foreground"},"Veio na empresa e levou os kits. Marca todos os kits prontos e dispensa c\u00f3digo e assinatura.")),
      e(Icon,{n:"user", s:16, className:"text-primary"})),
    // 1) quais kits
    e("div",{className:"flex flex-col gap-1.5"},
      e("div",{className:"flex items-baseline justify-between"},
        e("span",{className:"text-sm font-medium"},"1. Kits que ela est\u00e1 levando"),
        e("button",{type:"button", onClick:function(){ var o = {}; if(!todos) prontos.forEach(function(k){o[k.id]=true;}); setSel(o); }, className:"text-[12px] text-primary underline-offset-2 hover:underline"}, todos?"Desmarcar todos":"Marcar todos")),
      e("div",{className:"max-h-52 overflow-auto rounded-lg border border-border"},
        prontos.map(function(k){ return e("label",{key:k.id, className:"flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-muted/40"},
          e("input",{type:"checkbox", checked:!!sel[k.id], onChange:function(){marcar(k.id);}, className:"size-4 accent-primary"}),
          e("span",{className:"flex-1 truncate"}, k.prio && e("span",{className:"text-primary"},"\u2605 "), k.rev),
          e("span",{className:MONO+" text-primary"}, BK(k.valor))); })),
      e("p",{className:"text-right text-[12px] text-muted-foreground"}, ids.length+" de "+prontos.length+" marcados \u00b7 ", e("b",{className:MONO+" text-foreground"}, BK(total)))),
    // 2) c\u00f3digo do app da representante
    e("label",{className:"flex flex-col gap-1.5"},
      e("span",{className:"text-sm font-medium"},"2. C\u00f3digo de retirada (aparece no app da representante)"),
      e("div",{className:"flex items-center gap-2"},
        e("input",{inputMode:"numeric", maxLength:4, value:cod, placeholder:"0000", onChange:function(ev){setCod(ev.target.value.replace(/\D/g,"").slice(0,4));},
          className:INPUT+" w-32 text-center text-lg! tracking-[.4em] "+MONO+(cod.length===4 ? (codOk?" border-success!":" border-destructive!") : "")}),
        cod.length===4 && e("span",{className:"text-sm font-semibold "+(codOk?"text-success":"text-destructive")}, codOk ? "C\u00f3digo confere" : "C\u00f3digo n\u00e3o confere")),
      l && e("span",{className:"text-[12px] text-muted-foreground"},"Demonstra\u00e7\u00e3o: o c\u00f3digo de "+l.rep+" \u00e9 "+codigoRetirada(l)+".")),
    // 3) assinatura
    e(Assinatura,{key:chave, onChange:setAss}),
    e("p",{className:"text-[12px] text-muted-foreground"},"Entregue por ", e("b",{className:"text-foreground"}, nomeDe(s.usuario)), " (login). Data, hora, kits, c\u00f3digo e assinatura ficam registrados na listagem."));
}

export { DlgNovoKit, codigoRetirada, Assinatura, DlgRetirada };
