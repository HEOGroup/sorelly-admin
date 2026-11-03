// Sorelly Admin · montagem — pages/RegrasContasRep.js
// Financeiro → Pagamentos → "Regras e contas" (Marcus, 02/11/2026): tela para o Lucas deixar tudo definido ANTES (à noite, no fim de semana), com 2 abas:
//   · Regras: editar as regras do Pix (s.px.regras: na ordem, a primeira que serve decide; "perguntar à empresa" ou "mandar para uma conta") e testar uma situação;
//   · Contas das representantes: a conta de cada uma (AbaContasRep, de DirecionarPix.js).
// A fila do Direcionar continua separada: lá chegam os pedidos das representantes e o que as regras mandam perguntar à empresa.
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { Abas, Pagina } from "@/apps/montagem/components/padrao";
import { hojeIsoCp } from "@/apps/montagem/domain/controle-pagamentos";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { orientacaoCaixa } from "@/apps/montagem/domain/orientacao-pix";
import { AbaContasRep } from "@/apps/montagem/pages/DirecionarPix";
import { Testar } from "@/apps/montagem/pages/SimuladorPix";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var IN = INPUT+" h-8! text-[13px]!";
var VAZIO = {nome:"", comLink:"", dinheiroPctMin:"", pixMin:"", pixMax:"", totalMin:"", acao:"perguntar", destino:""};
var CAMPOS_NUM = ["dinheiroPctMin","pixMin","pixMax","totalMin"];
function useX(){ var cx = use(), s = cx.state; return {s:s, px:s.px, edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario), go:function(op, extra){ cx.dispatch(Object.assign({type:"PX", op:op, por:nomeDe(s.usuario)}, extra)); }}; }
var quando = function(r){ var q = r.quando||{}, t = []; if(q.comLink) t.push("a venda teve link ou cartão"); if(q.dinheiroPctMin!==undefined && q.dinheiroPctMin!=="") t.push("dinheiro ≥ "+q.dinheiroPctMin+"% do pago"); if(q.pixMin!==undefined && q.pixMin!=="") t.push("Pix ≥ R$ "+Number(q.pixMin).toLocaleString("pt-BR")); if(q.pixMax!==undefined && q.pixMax!=="") t.push("Pix < R$ "+Number(q.pixMax).toLocaleString("pt-BR")); if(q.totalMin!==undefined && q.totalMin!=="") t.push("total pago ≥ R$ "+Number(q.totalMin).toLocaleString("pt-BR")); return "Se "+(t.join(" e ") || "sem condição"); };
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11px] font-semibold"}, p.rot, p.children); }

function Regras(p){
  var X = p.X, px = X.px, st = useState(VAZIO), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var ativas = px.contas.filter(function(c){ return c.ativa; });
  var pode = f.nome.trim() && (f.comLink || CAMPOS_NUM.some(function(k){ return f[k]!==""; })) && (f.acao==="perguntar" || f.destino);
  var salvar = function(){ var q = {}; CAMPOS_NUM.forEach(function(k){ if(f[k]!=="") q[k] = Number(String(f[k]).replace(",", ".")); }); if(f.comLink) q.comLink = true;
    X.go("regra_add", {nome:f.nome, quando:q, destino:f.acao==="perguntar" ? "" : f.destino, acao:f.acao==="perguntar" ? "perguntar" : ""}); st[1](VAZIO); };
  var n = px.regras.length;
  return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"text-center text-[13px]"}, "O sistema olha as regras de cima para baixo. A primeira que serve decide. O que mandar \"perguntar à empresa\" cai na fila do Direcionar. O Lucas confirma sempre."),
    e(GradeFiltro,{chave:"regraspix", vazio:"Nenhuma regra ainda. Crie abaixo ou traga as regras de exemplo.", rows:px.regras, cols:[
      {k:"ordem", t:"Ordem", forte:true, tipo:"num", v:function(r){ return px.regras.indexOf(r)+1; }, exib:function(r){ return (px.regras.indexOf(r)+1)+"º"; }},
      {k:"nome", t:"Regra", v:function(r){ return r.nome; }},
      {k:"quando", t:"Quando", v:function(r){ return quando(r); }},
      {k:"faz", t:"O que faz", forte:true, v:function(r){ return r.acao==="perguntar" ? "Perguntar à empresa" : "Mandar para "+(r.destino || "—"); }, cor:function(r){ return r.acao==="perguntar" ? "text-yellow-400" : "text-green-400"; }},
      {k:"lig", t:"Ligada", min:110, semFiltro:true, v:function(r){ return r.ativa===false ? "Não" : "Sim"; }, cel:function(r){ return e(Btn,{v:"ghost", sm:true, disabled:!X.edita, onClick:function(){ X.go("regra_set", {id:r.id, patch:{ativa:r.ativa===false}}); }}, r.ativa===false ? "Não" : "Sim"); }},
      {k:"mud", t:"Mudar", min:250, semFiltro:true, v:function(){ return ""; }, cel:function(r){ var i = px.regras.indexOf(r);
        return X.edita ? e("span",{className:"flex items-center justify-center gap-1"},
          e(Btn,{v:"ghost", sm:true, disabled:i===0, onClick:function(){ X.go("regra_mover", {id:r.id, dir:-1}); }}, "↑"), e(Btn,{v:"ghost", sm:true, disabled:i===n-1, onClick:function(){ X.go("regra_mover", {id:r.id, dir:1}); }}, "↓"),
          e(Btn,{v:"ghost", sm:true, onClick:function(){ if(window.confirm("Excluir a regra "+r.nome+"?")) X.go("regra_del", {id:r.id}); }}, "Excluir")) : null; }}]}),
    X.edita && e("div",{className:"flex justify-center"}, e(Btn,{v:"ghost", sm:true, onClick:function(){ X.go("regras_exemplo", {forcar:true}); }}, "Trazer as regras de exemplo")),
    X.edita && e("div",{className:"grid gap-2 rounded-xl border border-border p-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(9.5rem, 1fr))"}},
      e(Campo,{rot:"Nome da regra"}, e("input",{value:f.nome, "aria-label":"Nome da regra", className:IN+" w-full text-center", onChange:function(ev){ set({nome:ev.target.value}); }})),
      e(Campo,{rot:"Teve link ou cartão"}, e("select",{value:f.comLink, "aria-label":"Teve link ou cartão", className:IN+" w-full cursor-pointer", onChange:function(ev){ set({comLink:ev.target.value}); }}, e("option",{value:""}, "Tanto faz"), e("option",{value:"1"}, "Sim"))),
      e(Campo,{rot:"Dinheiro a partir de (%)"}, e("input",{value:f.dinheiroPctMin, inputMode:"decimal", "aria-label":"Dinheiro a partir de", className:IN+" w-full text-center", onChange:function(ev){ set({dinheiroPctMin:ev.target.value}); }})),
      e(Campo,{rot:"Pix a partir de (R$)"}, e("input",{value:f.pixMin, inputMode:"decimal", "aria-label":"Pix a partir de", className:IN+" w-full text-center", onChange:function(ev){ set({pixMin:ev.target.value}); }})),
      e(Campo,{rot:"Pix abaixo de (R$)"}, e("input",{value:f.pixMax, inputMode:"decimal", "aria-label":"Pix abaixo de", className:IN+" w-full text-center", onChange:function(ev){ set({pixMax:ev.target.value}); }})),
      e(Campo,{rot:"Total pago a partir de (R$)"}, e("input",{value:f.totalMin, inputMode:"decimal", "aria-label":"Total pago a partir de", className:IN+" w-full text-center", onChange:function(ev){ set({totalMin:ev.target.value}); }})),
      e(Campo,{rot:"O que fazer"}, e("select",{value:f.acao, "aria-label":"O que fazer", className:IN+" w-full cursor-pointer", onChange:function(ev){ set({acao:ev.target.value}); }}, e("option",{value:"perguntar"}, "Perguntar à empresa"), e("option",{value:"conta"}, "Mandar para uma conta"))),
      f.acao==="conta" && e(Campo,{rot:"Conta"}, e("select",{value:f.destino, "aria-label":"Conta", className:IN+" w-full cursor-pointer", onChange:function(ev){ set({destino:ev.target.value}); }}, e("option",{value:""}, "Escolha a conta"), ativas.map(function(c){ return e("option",{key:c.id, value:c.id}, c.label); }))),
      e("div",{className:"flex items-end justify-center"}, e(Btn,{v:"primary", ic:"plus", disabled:!pode, onClick:salvar}, "Criar regra"))),
    e(Testar,{px:px, sc:X.s.saldosContas, o:p.o}));
}

function AbaRegrasContas(){
  var X = useX(), at = useState("regras"), aba = at[0], setAba = at[1];
  useEffect(function(){ if(X.px.regrasExV!==1 && X.edita) X.go("regras_exemplo"); }, [X.px.regrasExV, X.edita]);   // eslint-disable-line react-hooks/exhaustive-deps
  return e(Pagina,null,
    e(PageHead,{t:"Regras e contas", sub:"Deixe tudo definido antes: as regras do Pix e a conta de cada representante. Os pedidos chegam na fila do Direcionar."}),
    e(Abas,{abas:[["regras","Regras"],["contas","Contas das representantes"]], atual:aba, onMudar:setAba}),
    aba==="regras" ? e(Regras,{X:X, o:X.s.saldosContas ? orientacaoCaixa(X.s.saldosContas, hojeIsoCp(), 10) : null}) : e(AbaContasRep,null));
}
export { AbaRegrasContas };
