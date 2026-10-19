// Sorelly Admin · montagem — pages/compras/visualCompras.js
// Peças visuais e ajudantes das telas de Estoque de material e Cadastros/Configurações de Compras (setor Materiais e estoque, azul #3B82F6).
//   useCe()                       estado s.ce, quem está logado, permissões e exec(op, dados) → true se o domínio aceitou (a recusa aparece no aviso do sistema)
//   Bt, BtMini, Ic, Selo, Ind     botão, botão pequeno, botão só de ícone, selo de estado, indicador clicável
//   Busca, Sel, Data, Campo       campos da barra de filtros (altura única h-9) e campo com rótulo
//   Painel, Vazio, Nivel          coluna de janela, estado vazio formal, barra de nível
//   Editor                        janela em colunas (dados | campos | ações) usada por TODOS os cadastros e movimentos
//   baixarCsv                     CSV com ; e vírgula decimal, BOM para o Excel
// Regras de negócio NÃO ficam aqui (estão em domain/compras-estoque.js).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro, ESTADO, Janela, degrade } from "@/apps/montagem/components/padrao";
import { capacidadesEstoque, ceReduz, podeAprovarCompra } from "@/apps/montagem/domain/compras-estoque";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var AZUL = "#3B82F6";
var SEM_AUT = "Sem autorização";
var cap1 = function(t){ return t ? String(t).charAt(0).toUpperCase()+String(t).slice(1) : t; };
var vazioV = function(v){ return v===undefined || v===null || v==="" || (typeof v==="number" && isNaN(v)); };

// ───────────── estado e permissões ─────────────
// cadastros = quem pode mexer em fornecedores, contas, catálogo e configurações: diretoria, quem aprova compras ou quem tem a permissão "Compra" do estoque
function useCe(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario), diretoria = DIRETORIA.some(function(x){ return x.id===s.usuario; });
  var caps = capacidadesEstoque(s, String(s.usuario), diretoria), aprova = podeAprovarCompra(s, s.usuario);
  var exec = function(op, dados){ var a = Object.assign({type:"CE", op:op, por:por, porId:s.usuario}, dados||{}); var r = ceReduz(s, a); d(a); return !!(r.patch && r.patch.ce); };
  return {s:s, ce:s.ce, cfg:s.ce.config, por:por, porId:s.usuario, diretoria:diretoria, caps:caps, aprova:aprova, cadastros:diretoria || aprova || caps.indexOf("COMPRA")>=0, exec:exec,
    pode:function(c){ return caps.indexOf(c)>=0; }};
}

// ───────────── botões e selos ─────────────
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#3B82F6] text-white hover:bg-[#60A5FA]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30", ok:"bg-[#22C55E]/25 text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35", marca:"bg-[#3B82F6]/25 text-[#BFDBFE] ring-1 ring-[#3B82F6]/60"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.disabled && p.semAut ? SEM_AUT : p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 "+BT[p.tipo||"normal"]+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:15}), p.children); }
function BtMini(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-bold transition disabled:opacity-40 "+(p.forte ? "bg-[#3B82F6]/25 text-[#BFDBFE] ring-1 ring-[#3B82F6]/50 hover:bg-[#3B82F6]/35" : "bg-white/10 hover:bg-white/15")}, p.ic && e(Ph,{n:p.ic, s:13}), p.children); }
// botão só de ícone (aria-label e dica obrigatórios); semAut = desabilitado por falta de autorização
function Ic(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, disabled:p.disabled, "aria-label":p.titulo, title:p.disabled && p.semAut ? p.titulo+" · "+SEM_AUT : p.titulo,
  className:"grid size-8 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-35 "+(p.forte ? "bg-[#3B82F6]/30 ring-1 ring-[#3B82F6]/60 hover:bg-[#3B82F6]/45" : p.perigo ? "bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/30" : "bg-white/10 hover:bg-white/20")}, e(Ph,{n:p.ic, s:16})); }
function Selo(p){ var c = ESTADO[p.cor] || p.cor || "#94A3B8"; return e("span",{title:p.titulo, className:"inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:c+"26", color:c, boxShadow:"inset 0 0 0 1px "+c+"55"}}, p.ic && e(Ph,{n:p.ic, s:12}), p.children); }

// Indicador clicável: número até 20px + nome pequeno, degradê por sentido (cor de estado). on = filtro ligado.
function Ind(p){
  var cor = ESTADO[p.cor] || p.cor || ESTADO.total, Tag = p.onClick ? "button" : "div";
  return e(Tag,{type:p.onClick ? "button" : undefined, onClick:p.onClick, title:p.titulo || (p.onClick ? "Filtrar a lista" : undefined),
    className:"flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center "+(p.onClick ? "cursor-pointer transition hover:bg-black/45 " : "")+(p.on ? "ring-2 ring-white/60 " : ""), style:degrade(p.cor)},
    e("b",{className:MONO+" text-[19px] leading-none", style:{color:cor}}, p.v),
    e("span",{className:"mt-1 text-[10.5px] font-bold uppercase leading-tight tracking-wide text-white/75"}, p.t),
    p.sub && e("span",{className:"text-[10.5px] leading-tight text-white/50"}, cap1(p.sub)));
}

// ───────────── campos ─────────────
var H9 = "h-9! text-[13px]!";
function Busca(p){
  return e("div",{className:"relative min-w-48 max-w-sm flex-1 basis-56"}, e(Ph,{n:"magnifying-glass", s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60"}),
    e("input",{type:"search", value:p.v, placeholder:p.ph, "aria-label":p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+H9+" w-full pl-9 text-center"}));
}
// opcoes = [[valor, rótulo]]; o primeiro item "" é o "todos"
function Sel(p){
  return e("select",{value:p.v, "aria-label":p.rot, title:p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+H9+" cursor-pointer text-center "+(p.className||"")},
    [["", p.todos || p.rot]].concat(p.opcoes).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
}
function Data(p){
  return e("label",{className:"inline-flex items-center gap-1.5 rounded-lg bg-white/5 pl-2.5 text-[12px] font-bold ring-1 ring-white/10"}, e(Ph,{n:"calendar-blank", s:14, className:"text-white/70"}), p.rot,
    e("input",{type:p.tipo||"date", value:p.v, min:p.min, max:p.max, "aria-label":p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+H9+" w-36 border-0! bg-transparent! text-center"}));
}
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/75"}, p.rot), p.children, p.dica && e("span",{className:"text-[11px] text-white/55"}, cap1(p.dica))); }

// ───────────── blocos de apoio ─────────────
function Vazio(p){ return e("div",{className:"flex flex-col items-center justify-center gap-1.5 rounded-xl bg-black/20 px-4 py-6 text-center text-[13px] text-white/70 ring-1 ring-white/10"}, e(Ph,{n:p.ic || "tray", s:26, className:"text-white/45"}), p.children); }
// coluna de janela: estado "feito" = concluído (passou para o lado, verde); "atual" = em destaque (azul)
function Painel(p){
  var feito = p.estado==="feito", atual = p.estado==="atual";
  return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl p-2.5 text-center "+(p.className||""),
      style:atual ? {background:"linear-gradient(160deg, #3B82F633, rgba(0,0,0,.25))", boxShadow:"inset 0 0 0 2px #3B82F6AA"} : feito ? {background:"linear-gradient(160deg, #22C55E1F, rgba(0,0,0,.22))", boxShadow:"inset 0 0 0 1px #22C55E55"} : {background:"rgba(0,0,0,.22)", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)"}},
    p.t && e("div",{className:"flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wide "+(feito ? "text-[#4ADE80]" : atual ? "text-[#BFDBFE]" : "text-white/75")}, e(Ph,{n:feito ? "check-circle" : (p.ic || "circle"), s:15, fill:feito}), p.t),
    p.children);
}
// barra de nível do saldo: a marca branca é o estoque mínimo (no meio da barra)
function Nivel(p){
  var alvo = Math.max(p.minimo*2, 1), pct = Math.max(0, Math.min(100, Math.round(p.atual/alvo*100)));
  return e("div",{className:"relative h-2 w-full overflow-hidden rounded-full bg-white/10", role:"img", "aria-label":"Nível do estoque: "+pct+"%"},
    e("div",{className:"h-full rounded-full", style:{width:pct+"%", background:p.cor}}), p.minimo>0 && e("span",{className:"absolute inset-y-0 left-1/2 w-px bg-white/80"}));
}
// célula de número (saldo, mínimo...): número dentro de caixa, nome pequeno embaixo
function Num(p){ return e("div",{className:"flex min-w-0 flex-col items-center rounded-lg bg-black/25 px-1 py-1"}, e("b",{className:MONO+" text-[19px] leading-none", style:p.cor ? {color:ESTADO[p.cor] || p.cor} : undefined}, p.v), e("span",{className:"mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70"}, p.t)); }

// ───────────── Editor: janela em colunas (dados | campos | ações) ─────────────
// campos = [{k, rot, tipo:"texto"|"num"|"dinheiro"|"data"|"select"|"cor"|"area"|"bool"|"botoes", ops:[[valor, rótulo]], obrig, se(v), dica, min, max, ph}]
// ini = valores iniciais · dados = elemento da coluna "já preenchido" (esquerda) · lateral(v) = resumo calculado na coluna de ações · valida(v) → texto de erro
// onSalvar(v) → true se foi aceito (a janela fecha) · onExcluir() → true se aceito (pede confirmação em 2 cliques) · extras = botões a mais na coluna de ações
function Editor(p){
  var st = useState(function(){ return Object.assign({}, p.ini); }), v = st[0], er = useState(""), erro = er[0], cf = useState(false), conf = cf[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); er[1](""); };
  var campos = p.campos.filter(function(c){ return !c.se || c.se(v); });
  var nc = p.nc || (campos.length>4 ? 2 : 1), tam = Math.ceil(campos.length/nc), grupos = [];
  for(var i = 0; i<campos.length; i += tam) grupos.push(campos.slice(i, i+tam));
  var salvar = function(){
    for(var j = 0; j<campos.length; j++){ var c = campos[j], o = typeof c.obrig==="function" ? c.obrig(v) : c.obrig; if(o && vazioV(v[c.k])){ er[1]("Preencha o campo: "+c.rot+"."); return; } }
    var m = p.valida ? p.valida(v) : ""; if(m){ er[1](m); return; }
    if(p.onSalvar(v)) p.fechar();
  };
  var campo = function(c){
    var val = v[c.k], ctl;
    if(c.tipo==="dinheiro") ctl = e(Dinheiro,{value:val==null || val==="" ? 0 : val, label:c.rot, onChange:function(x){ set(c.k, x); }});
    else if(c.tipo==="bool") return e("label",{key:c.k, className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-bold hover:bg-white/15"}, e("input",{type:"checkbox", checked:!!val, onChange:function(ev){ set(c.k, ev.target.checked); }}), c.rot);
    else if(c.tipo==="botoes") return e(Campo,{key:c.k, rot:c.rot}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, c.ops.map(function(o){ var on = val===o[0];
      return e("button",{key:o[0], type:"button", onClick:function(){ set(c.k, o[0]); }, className:"rounded-lg px-3 py-1.5 text-[12.5px] font-bold ring-1 transition "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"),
        style:on ? {background:"linear-gradient(135deg,"+AZUL+"66,"+AZUL+"22)", boxShadow:"inset 0 0 0 1px "+AZUL+"cc"} : undefined}, o[1]); })));
    else if(c.tipo==="select") ctl = e("select",{value:val==null ? "" : val, onChange:function(ev){ set(c.k, ev.target.value); }, className:INPUT+" w-full cursor-pointer text-center"}, [["", c.vazio || "Selecione"]].concat(typeof c.ops==="function" ? c.ops(v) : c.ops).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
    else if(c.tipo==="area") ctl = e("textarea",{value:val||"", rows:3, placeholder:c.ph, onChange:function(ev){ set(c.k, ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"});
    else if(c.tipo==="cor") ctl = e("input",{type:"color", value:val || "#3B82F6", onChange:function(ev){ set(c.k, ev.target.value); }, className:"h-10 w-full cursor-pointer rounded-lg border border-input bg-transparent"});
    else ctl = e("input",{type:c.tipo==="num" ? "number" : c.tipo==="data" ? "date" : "text", inputMode:c.tipo==="num" ? "numeric" : undefined, step:c.tipo==="num" ? 1 : undefined, min:c.min, max:c.max, placeholder:c.ph, value:val==null ? "" : val, onChange:function(ev){ set(c.k, ev.target.value); }, className:INPUT+" w-full text-center"});
    return e(Campo,{key:c.k, rot:c.rot+(c.obrig===true ? " *" : ""), dica:c.dica}, ctl);
  };
  var cols = [];
  if(p.dados) cols.push(e(Painel,{key:"dados", t:p.tDados || "Dados", estado:"feito"}, p.dados));
  grupos.forEach(function(g, gi){ cols.push(e(Painel,{key:"g"+gi, t:(p.titulos && p.titulos[gi]) || (grupos.length>1 ? "Dados "+(gi+1) : "Preenchimento"), ic:"pencil-simple", estado:gi===0 && !p.dados ? "atual" : undefined}, g.map(campo))); });
  cols.push(e(Painel,{key:"acoes", t:"Ações", ic:"gear"},
    p.lateral && p.lateral(v),
    erro && e("p",{role:"alert", className:"rounded-lg bg-[#EF4444]/20 px-2 py-1.5 text-[12.5px] font-bold text-[#F87171]"}, erro),
    p.semAut && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-[12px] font-bold text-[#FBBF24]"}, "Sem autorização para alterar."),
    e(Bt,{tipo:"forte", ic:p.icSalvar || "floppy-disk", onClick:salvar, disabled:!!p.semAut, semAut:true}, p.salvarRot || "Salvar"),
    p.extras,
    p.onExcluir && e(Bt,{tipo:"perigo", ic:"trash", disabled:!!p.semAut, semAut:true, onClick:function(){ if(!conf){ cf[1](true); return; } if(p.onExcluir()) p.fechar(); }}, conf ? "Confirmar exclusão" : "Excluir"),
    e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar")));
  return e(Janela,{t:p.t, sub:p.sub, fechar:p.fechar, colunas:cols});
}

// ───────────── exportar planilha ─────────────
// cab = ["Data", ...]; linhas = [[...]]; números como texto com vírgula decimal (use vg)
var vg = function(n){ return String(Math.round((Number(n)||0)*100)/100).replace(".", ","); };
function baixarCsv(nome, cab, linhas){
  var esc = function(x){ var t = String(x==null ? "" : x); return /[;"\n\r]/.test(t) ? '"'+t.replace(/"/g, '""')+'"' : t; };
  var txt = "﻿"+[cab].concat(linhas).map(function(l){ return l.map(esc).join(";"); }).join("\r\n");
  try{ var b = new Blob([txt], {type:"text/csv;charset=utf-8"}), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000); }catch(x){}
}

export { AZUL, SEM_AUT, cap1, useCe, Bt, BtMini, Ic, Selo, Ind, Busca, Sel, Data, Campo, Vazio, Painel, Nivel, Num, Editor, baixarCsv, vg };
