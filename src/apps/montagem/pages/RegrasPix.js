// Sorelly Admin · montagem — pages/RegrasPix.js
// Regras do Pix (s.px.regras: na ordem, a primeira que serve decide; "perguntar à empresa" ou "mandar para uma conta"), e a regra obrigatória dos R$ 3.000 (ligar para o Financeiro) em cima.
// Bloco do Direcionar (12/11/2026, Marcus: a tela Regras e contas deixou de existir; Contas das representantes e Regras do Pix ficam EMBAIXO do Direcionar).
import { BTN_GRUPO, BlocoPainel, GrupoBtn } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { LIMITE_LIGAR_FINANCEIRO } from "@/apps/montagem/domain/pix-regras";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect } from "@/shared/react";

function useX(){ var cx = use(), s = cx.state; return {s:s, px:s.px, edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario), go:function(op, extra){ cx.dispatch(Object.assign({type:"PX", op:op, por:nomeDe(s.usuario)}, extra)); }}; }
var brl = function(v){ return "R$ "+Number(v).toLocaleString("pt-BR"); };
var quando = function(r){ var q = r.quando||{}, t = []; if(q.comLink) t.push("a venda teve link ou cartão"); if(q.dinheiroPctMin!==undefined && q.dinheiroPctMin!=="") t.push("dinheiro ≥ "+q.dinheiroPctMin+"% do pago"); if(q.pixMin!==undefined && q.pixMin!=="") t.push("Pix ≥ "+brl(q.pixMin)); if(q.pixMax!==undefined && q.pixMax!=="") t.push("Pix < "+brl(q.pixMax)); if(q.totalMin!==undefined && q.totalMin!=="") t.push("total pago ≥ "+brl(q.totalMin)); return t.length ? t.join(" e ") : "sempre"; };

function RegrasPix(){
  var X = useX(), px = X.px;
  useEffect(function(){ if(px.regrasExV!==1 && X.edita) X.go("regras_exemplo"); }, [px.regrasExV, X.edita]);   // eslint-disable-line react-hooks/exhaustive-deps
  var n = px.regras.length;
  var linhas = px.regras.map(function(r, i){ return {id:r.id, ordem:(i+1)+"º", nome:r.nome, quando:quando(r), faz:r.acao==="perguntar" ? "Perguntar à empresa" : "Mandar para "+(r.destino || "—"), lig:r.ativa===false ? "Não" : "Sim", r:r, i:i}; });
  return e("div",{className:"flex flex-col gap-3"},
    e(BlocoPainel,{esquerda:true, titulo:"Regras do Pix · de cima para baixo, a primeira que serve decide"}, e(TabelaPlanilha,{semContagem:true, grade:true, vazio:"Nenhuma regra ainda.", linhas:px.regras.length ? linhas : [], cols:[
      {k:"ordem", t:"Ordem"},
      {k:"nome", t:"Regra"},
      {k:"quando", t:"Quando"},
      {k:"faz", t:"O que faz", cor:function(l){ return l.r.acao==="perguntar" ? "text-warning" : "text-success"; }},
      {k:"lig", t:"Ligada", render:function(v, l){ var r = l.r, on = r.ativa!==false; return e("div",{className:"py-1"}, e("button",{type:"button", disabled:!X.edita, onClick:function(){ X.go("regra_set", {id:r.id, patch:{ativa:!on}}); }, className:"h-8 w-20 rounded-md border border-border bg-card text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40 "+(on ? "text-success" : "text-warning")}, on ? "Sim" : "Não")); }},
      {k:"mud", t:"Mudar", render:function(v, l){ var r = l.r, i = l.i; return X.edita ? e("div",{className:"py-1"}, e(GrupoBtn,null,
        e("button",{key:"u", type:"button", disabled:i===0, "aria-label":"Subir a regra", onClick:function(){ X.go("regra_mover", {id:r.id, dir:-1}); }, className:BTN_GRUPO}, "↑"),
        e("button",{key:"d", type:"button", disabled:i===n-1, "aria-label":"Descer a regra", onClick:function(){ X.go("regra_mover", {id:r.id, dir:1}); }, className:BTN_GRUPO}, "↓"),
        e("button",{key:"x", type:"button", onClick:function(){ if(window.confirm("Excluir a regra "+r.nome+"?")) X.go("regra_del", {id:r.id}); }, className:BTN_GRUPO}, "Excluir"))) : null; }}]}))
  );
}

// Regra obrigatória: Pix acima do limite = ligar para o Financeiro (bloco próprio, na coluna da esquerda de Regras & Condições)
function BlocoRegraObrigatoria(){
  return e(BlocoPainel,{esquerda:true, titulo:"Regra obrigatória · Pix acima de R$ "+LIMITE_LIGAR_FINANCEIRO.toLocaleString("pt-BR", {minimumFractionDigits:2})}, e("div",{className:"flex min-h-8 items-center px-3 py-1.5 text-[13px] font-semibold"}, "Obrigatório ligar para o Financeiro"));
}

export { RegrasPix, BlocoRegraObrigatoria };
