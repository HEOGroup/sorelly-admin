// Sorelly Admin · kits novos Curitiba — components/rep-regioes-editor.js
// Regiões que a representante atende, em BLOCOS (nada de texto corrido): cada bairro ou cidade é um bloco com ✕ para excluir (pede "tem certeza") e há "+ adicionar".
// Curitiba: bairros (a ★ marca prioridade). Região metropolitana e outras cidades: um bloco por cidade, com os bairros dela dentro. Serve à tela Regiões (salva na hora) e à janela de Editar (salva no botão).
// v = {cur, curTodos, prior, rmc, rmcTodos, pg, outras}; onChange(novo v).
import { PERFIS0, RMC } from "@/apps/kits-novos/domain/regioes-rep";
import { e, useState } from "@/shared/react";

var BASE = "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[12px] ";
var BAIRROS_CONHECIDOS = (function(){ var o = {}; Object.keys(PERFIS0).forEach(function(k){ PERFIS0[k].cur.forEach(function(b){ o[b] = 1; }); }); return Object.keys(o).sort(); })();

// bloco de um bairro ou cidade: ✕ pede confirmação antes de excluir
function Bloco(p){
  var st = useState(false), conf = st[0];
  if(conf) return e("span",{className:BASE+"border-destructive bg-destructive/10"},
    e("span",{className:"max-w-40 truncate"}, "Excluir "+p.texto+"?"),
    e("button",{type:"button", onClick:function(){ st[1](false); p.onRemover(); }, className:"rounded bg-destructive px-1.5 text-[11px] font-semibold text-white"}, "Sim, excluir"),
    e("button",{type:"button", onClick:function(){ st[1](false); }, className:"rounded border border-border px-1.5 text-[11px]"}, "Não"));
  return e("span",{className:BASE+"border-border bg-card"},
    p.onEstrela && e("button",{type:"button", "aria-pressed":!!p.estrela, title:p.estrela ? "Tirar a prioridade" : "Marcar como prioridade", onClick:p.onEstrela, className:"text-[13px] leading-none "+(p.estrela ? "text-primary" : "text-foreground/40 hover:text-primary")}, p.estrela ? "★" : "☆"),
    e("span",{className:"max-w-48 truncate", title:p.texto}, p.texto),
    e("button",{type:"button", "aria-label":"Excluir "+p.texto, title:"Excluir", onClick:function(){ st[1](true); }, className:"text-[14px] leading-none hover:text-destructive"}, "×"));
}

// "+ adicionar": abre um campo; Enter ou Adicionar confirma, Esc cancela
function Adicionar(p){
  var vs = useState(""), valor = vs[0], ab = useState(false);
  if(!ab[0]) return e("button",{type:"button", onClick:function(){ ab[1](true); }, className:BASE+"border-dashed border-primary/60 text-primary hover:bg-primary/10"}, "+ "+p.rotulo);
  var ok = function(){ var t = valor.trim(); if(t) p.onAdd(t); vs[1](""); ab[1](false); }, cancela = function(){ vs[1](""); ab[1](false); };
  return e("span",{className:"inline-flex items-center gap-1"},
    e("input",{autoFocus:true, list:p.sugestoes ? p.id : undefined, value:valor, placeholder:p.rotulo, "aria-label":p.rotulo, onChange:function(ev){ vs[1](ev.target.value); },
      onKeyDown:function(ev){ if(ev.key==="Enter"){ ev.preventDefault(); ok(); } else if(ev.key==="Escape") cancela(); },
      className:"h-7 w-44 rounded-md border border-border bg-card px-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-primary"}),
    p.sugestoes && e("datalist",{id:p.id}, p.sugestoes.map(function(s){ return e("option",{key:s, value:s}); })),
    e("button",{type:"button", onClick:ok, className:BASE+"border-primary bg-primary/20 text-primary"}, "Adicionar"),
    e("button",{type:"button", onClick:cancela, className:BASE+"border-border"}, "Cancelar"));
}

// liga e desliga ("Curitiba inteira", "Ponta Grossa"...)
function Alterna(p){
  return e("button",{type:"button", "aria-pressed":p.on, onClick:p.onClick, className:BASE+(p.on ? "border-primary bg-primary/25 font-semibold text-primary" : "border-border text-foreground/70 hover:bg-white/10")}, (p.on ? "✓ " : "")+p.texto);
}

// uma cidade com os bairros dela dentro (sem bairro = a cidade inteira)
function Cidade(p){
  var c = p.c;
  return e("div",{className:"flex flex-col gap-1.5 rounded-md border border-border bg-black/20 p-2"},
    e("div",{className:"flex items-center justify-between gap-2"}, e(Bloco,{texto:c.c, onRemover:p.onRemover}), e("span",{className:"text-[11px]"}, c.b.length ? c.b.length+(c.b.length===1 ? " bairro" : " bairros") : "cidade inteira")),
    e("div",{className:"flex flex-wrap items-center gap-1.5"},
      c.b.map(function(b){ return e(Bloco,{key:b, texto:b, onRemover:function(){ p.onBairros(c.b.filter(function(x){ return x!==b; })); }}); }),
      e(Adicionar,{rotulo:"bairro", onAdd:function(t){ if(c.b.indexOf(t)<0) p.onBairros(c.b.concat([t])); }})));
}

function Grupo(p){ return e("div",{className:"flex flex-col gap-1.5"}, e("b",{className:"text-[11px] uppercase tracking-[.05em]"}, p.t), p.children); }

function EditorRegioes(p){
  var v = p.v, mud = function(patch){ p.onChange(Object.assign({}, v, patch)); };
  var cidades = function(chave, rotulo, sugestoes, idLista){
    return [(v[chave]||[]).map(function(c, i){
        return e(Cidade,{key:c.c+i, c:c, onRemover:function(){ mud(Object.fromEntries([[chave, v[chave].filter(function(_, j){ return j!==i; })]])); },
          onBairros:function(b){ var n = v[chave].map(function(x, j){ return j===i ? {c:x.c, b:b} : x; }); mud(Object.fromEntries([[chave, n]])); }}); }),
      e("div",{key:"add"+chave}, e(Adicionar,{id:idLista, rotulo:rotulo, sugestoes:sugestoes, onAdd:function(t){ if(!(v[chave]||[]).some(function(x){ return x.c.toLowerCase()===t.toLowerCase(); })) mud(Object.fromEntries([[chave, (v[chave]||[]).concat([{c:t, b:[]}])]])); }}))];
  };
  return e("div",{className:"flex flex-col gap-3"},
    e(Grupo,{t:"Curitiba · ★ marca prioridade"},
      e("div",{className:"flex flex-wrap items-center gap-1.5"},
        e(Alterna,{texto:"Curitiba inteira", on:!!v.curTodos, onClick:function(){ mud({curTodos:!v.curTodos}); }}),
        (v.cur||[]).map(function(b){ var pr = (v.prior||[]).indexOf(b)>=0;
          return e(Bloco,{key:b, texto:b, estrela:pr, onEstrela:function(){ mud({prior:pr ? v.prior.filter(function(x){ return x!==b; }) : (v.prior||[]).concat([b])}); },
            onRemover:function(){ mud({cur:v.cur.filter(function(x){ return x!==b; }), prior:(v.prior||[]).filter(function(x){ return x!==b; })}); }}); }),
        e(Adicionar,{id:"dl-bairros", rotulo:"bairro", sugestoes:BAIRROS_CONHECIDOS, onAdd:function(t){ if((v.cur||[]).indexOf(t)<0) mud({cur:(v.cur||[]).concat([t])}); }}))),
    e(Grupo,{t:"Região metropolitana"},
      e("div",{className:"flex flex-col gap-1.5"}, e("div",null, e(Alterna,{texto:"Região metropolitana inteira", on:!!v.rmcTodos, onClick:function(){ mud({rmcTodos:!v.rmcTodos}); }})), cidades("rmc", "cidade", RMC, "dl-rmc"))),
    e(Grupo,{t:"Outras cidades"},
      e("div",{className:"flex flex-col gap-1.5"}, e("div",null, e(Alterna,{texto:"Ponta Grossa", on:!!v.pg, onClick:function(){ mud({pg:!v.pg}); }})), cidades("outras", "cidade", null, "dl-outras"))),
    e(Grupo,{t:"Não atende · não indicar kit novo (cidade inteira, ou bairros dentro dela)"},
      e("div",{className:"flex flex-col gap-1.5"}, cidades("nao", "cidade", ["Curitiba"].concat(RMC), "dl-nao"))));
}

// as 7 informações de região de um perfil (com padrão para quem ainda não tem)
var regiaoDe = function(p){ p = p || {}; return {cur:p.cur||[], curTodos:!!p.curTodos, prior:p.prior||[], rmc:p.rmc||[], rmcTodos:!!p.rmcTodos, pg:!!p.pg, outras:p.outras||[], nao:p.nao||[]}; };

export { EditorRegioes, regiaoDe };
