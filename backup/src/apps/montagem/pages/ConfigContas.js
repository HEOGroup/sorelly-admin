// Sorelly Admin · montagem — pages/ConfigContas.js
// Configurador das contas bancárias (blocos por CNPJ e contas, limite de cheque especial, bloqueada). Abre pela engrenagem da tela Caixa.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { TIPOS_CONTA } from "@/apps/montagem/domain/saldos-contas";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, brl } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

// ── Configurador: blocos (CNPJs) e contas ──
function ConfigContas(){
  var cx = use(), sc = cx.state.saldosContas;
  var nv = useState({nome:"", bloco:sc.blocos[0] ? sc.blocos[0].id : "", tipo:"PJ"}), novo = nv[0], setNovo = nv[1];
  var nb = useState(""), novoBloco = nb[0], setNovoBloco = nb[1];
  var salvar = function(c, patch){ cx.dispatch({type:"SALDO_CONTA", conta:Object.assign({}, c, patch)}); };
  var slug = function(t){ return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")+"_"+Math.random().toString(36).slice(2,6); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Configurador das contas", sub:"Blocos (um por CNPJ) e contas. O limite é o cheque especial: entra no saldo disponível."}),
    e(BlocoBarra,{t:"Nova conta", compacto:true},
      e("div",{className:"flex flex-wrap items-center gap-2 p-3"},
        e("input",{value:novo.nome, placeholder:"Nome da conta", className:INPUT+" min-w-52 flex-1", onChange:function(ev){ setNovo(Object.assign({}, novo, {nome:ev.target.value})); }}),
        e("select",{value:novo.bloco, className:INPUT, onChange:function(ev){ setNovo(Object.assign({}, novo, {bloco:ev.target.value})); }}, sc.blocos.map(function(b){ return e("option",{key:b.id, value:b.id}, b.nome); })),
        e("select",{value:novo.tipo, className:INPUT, onChange:function(ev){ setNovo(Object.assign({}, novo, {tipo:ev.target.value})); }}, Object.keys(TIPOS_CONTA).map(function(k){ return e("option",{key:k, value:k}, TIPOS_CONTA[k]); })),
        e(Btn,{onClick:function(){ if(!novo.nome.trim()) return; cx.dispatch({type:"SALDO_CONTA", conta:{id:slug(novo.nome), nome:novo.nome.trim(), bloco:novo.bloco, tipo:novo.tipo, limite:0, bloqueada:novo.bloco==="BLOQ"}}); setNovo(Object.assign({}, novo, {nome:""})); }}, "Adicionar"))),
    e(BlocoBarra,{t:"Novo bloco (CNPJ)", compacto:true},
      e("div",{className:"flex flex-wrap items-center gap-2 p-3"},
        e("input",{value:novoBloco, placeholder:"Ex.: Nova empresa · 80", className:INPUT+" min-w-52 flex-1", onChange:function(ev){ setNovoBloco(ev.target.value); }}),
        e(Btn,{onClick:function(){ if(!novoBloco.trim()) return; cx.dispatch({type:"SALDO_BLOCO", bloco:{id:slug(novoBloco), nome:novoBloco.trim()}}); setNovoBloco(""); }}, "Adicionar bloco"))),
    sc.blocos.map(function(b){
      var cs = sc.contas.filter(function(c){ return c.bloco===b.id; });
      return e(BlocoBarra,{key:b.id, t:b.nome, sub:cs.length+" conta(s)"},
        e("div",{className:"flex flex-col divide-y divide-border/60 px-3 py-1"}, cs.length===0 ? e("p",{className:"py-3 text-center text-sm text-muted-foreground"}, "Nenhuma conta neste bloco.") : cs.map(function(c){
          return e("div",{key:c.id, className:"flex flex-wrap items-center gap-2 py-1.5"},
            e("input",{defaultValue:c.nome, "aria-label":"Nome da conta", className:INPUT+" h-9! min-w-48 flex-1 text-sm!", onBlur:function(ev){ if(ev.target.value.trim() && ev.target.value!==c.nome) salvar(c, {nome:ev.target.value.trim()}); }}),
            e("select",{value:c.tipo, className:INPUT+" h-9! text-sm!", onChange:function(ev){ salvar(c, {tipo:ev.target.value}); }}, Object.keys(TIPOS_CONTA).map(function(k){ return e("option",{key:k, value:k}, TIPOS_CONTA[k]); })),
            e("select",{value:c.bloco, className:INPUT+" h-9! text-sm!", "aria-label":"Mover para o bloco", onChange:function(ev){ salvar(c, {bloco:ev.target.value}); }}, sc.blocos.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); })),
            e("label",{className:"flex items-center gap-1 text-[12px] text-muted-foreground"}, "Limite",
              e("input",{inputMode:"numeric", defaultValue:brl(c.limite||0), className:INPUT+" h-9! w-32 px-2! text-right text-sm! "+MONO,
                onChange:function(ev){ ev.target.value = brl(Number(ev.target.value.replace(/\D/g,"").slice(0,10)||0)/100); },
                onBlur:function(ev){ salvar(c, {limite:Number(ev.target.value.replace(/\D/g,"")||0)/100}); }})),
            e("label",{className:"flex items-center gap-1 text-[12px]"}, e("input",{type:"checkbox", checked:!!c.bloqueada, onChange:function(ev){ salvar(c, {bloqueada:ev.target.checked}); }}), "Bloqueada"),
            e(Btn,{onClick:function(){ if(window.confirm("Excluir a conta "+c.nome+" e os saldos dela?")) cx.dispatch({type:"SALDO_CONTA_DEL", id:c.id}); }}, "Excluir")); })));
    }));
}

export { ConfigContas };
