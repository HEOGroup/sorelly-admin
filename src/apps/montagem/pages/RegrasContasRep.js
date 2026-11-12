// Sorelly Admin · montagem — pages/RegrasContasRep.js
// Financeiro → "Regras e contas" (Marcus, 02/11/2026; refeita em 12/11/2026 no padrão do Direcionar): UMA tela só, sem abas, para o Lucas deixar tudo definido ANTES (à noite, no fim de semana):
//   · Contas das representantes: a conta fixa de cada uma (AbaContasRep, de DirecionarPix.js);
//   · Regras do Pix: dentro da mesma tela, logo abaixo (s.px.regras: na ordem, a primeira que serve decide; "perguntar à empresa" ou "mandar para uma conta").
// Blocos e tabelas pelas peças do padrão (components/bloco-painel.js e tabela-planilha.js). A fila do Direcionar continua separada.
import { BTN_GRUPO, BlocoPainel, GrupoBtn, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { AbaContasRep } from "@/apps/montagem/pages/DirecionarPix";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var VAZIO = {nome:"", comLink:"", dinheiroPctMin:"", pixMin:"", pixMax:"", totalMin:"", acao:"perguntar", destino:""};
var CAMPOS_NUM = ["dinheiroPctMin","pixMin","pixMax","totalMin"];
function useX(){ var cx = use(), s = cx.state; return {s:s, px:s.px, edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario), go:function(op, extra){ cx.dispatch(Object.assign({type:"PX", op:op, por:nomeDe(s.usuario)}, extra)); }}; }
var brl = function(v){ return "R$ "+Number(v).toLocaleString("pt-BR"); };
var quando = function(r){ var q = r.quando||{}, t = []; if(q.comLink) t.push("a venda teve link ou cartão"); if(q.dinheiroPctMin!==undefined && q.dinheiroPctMin!=="") t.push("dinheiro ≥ "+q.dinheiroPctMin+"% do pago"); if(q.pixMin!==undefined && q.pixMin!=="") t.push("Pix ≥ "+brl(q.pixMin)); if(q.pixMax!==undefined && q.pixMax!=="") t.push("Pix < "+brl(q.pixMax)); if(q.totalMin!==undefined && q.totalMin!=="") t.push("total pago ≥ "+brl(q.totalMin)); return t.length ? t.join(" e ") : "sempre"; };

function Regras(p){
  var X = p.X, px = X.px, st = useState(VAZIO), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var ativas = px.contas.filter(function(c){ return c.ativa; });
  var pode = f.nome.trim() && (f.comLink || CAMPOS_NUM.some(function(k){ return f[k]!==""; })) && (f.acao==="perguntar" || f.destino);
  var salvar = function(){ var q = {}; CAMPOS_NUM.forEach(function(k){ if(f[k]!=="") q[k] = Number(String(f[k]).replace(",", ".")); }); if(f.comLink) q.comLink = true;
    X.go("regra_add", {nome:f.nome, quando:q, destino:f.acao==="perguntar" ? "" : f.destino, acao:f.acao==="perguntar" ? "perguntar" : ""}); st[1](VAZIO); };
  var n = px.regras.length;
  var linhas = px.regras.map(function(r, i){ return {id:r.id, ordem:(i+1)+"º", nome:r.nome, quando:quando(r), faz:r.acao==="perguntar" ? "Perguntar à empresa" : "Mandar para "+(r.destino || "—"), lig:r.ativa===false ? "Não" : "Sim", r:r, i:i}; });
  var num = function(id, rot, k){ return e("div",{className:"min-w-0"}, e(Rotulo,{t:rot, id:id}), e("input",{id:id, value:f[k], inputMode:"decimal", "aria-label":rot, className:CAMPO+" w-full text-center", onChange:function(ev){ var o = {}; o[k] = ev.target.value; set(o); }})); };
  return e("div",{className:"flex flex-col gap-3"},
    e(BlocoPainel,{titulo:"Regras do Pix · de cima para baixo, a primeira que serve decide"}, e(TabelaPlanilha,{semContagem:true, vazio:"Nenhuma regra ainda. Crie abaixo ou traga as regras de exemplo.", linhas:px.regras.length ? linhas : [], cols:[
      {k:"ordem", t:"Ordem"},
      {k:"nome", t:"Regra"},
      {k:"quando", t:"Quando"},
      {k:"faz", t:"O que faz", cor:function(l){ return l.r.acao==="perguntar" ? "text-warning" : "text-success"; }},
      {k:"lig", t:"Ligada", render:function(v, l){ var r = l.r, on = r.ativa!==false; return e("button",{type:"button", disabled:!X.edita, onClick:function(){ X.go("regra_set", {id:r.id, patch:{ativa:!on}}); }, className:"h-8 w-20 rounded-md border border-border bg-card text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40 "+(on ? "text-success" : "text-warning")}, on ? "Sim" : "Não"); }},
      {k:"mud", t:"Mudar", render:function(v, l){ var r = l.r, i = l.i; return X.edita ? e(GrupoBtn,null,
        e("button",{key:"u", type:"button", disabled:i===0, "aria-label":"Subir a regra", onClick:function(){ X.go("regra_mover", {id:r.id, dir:-1}); }, className:BTN_GRUPO}, "↑"),
        e("button",{key:"d", type:"button", disabled:i===n-1, "aria-label":"Descer a regra", onClick:function(){ X.go("regra_mover", {id:r.id, dir:1}); }, className:BTN_GRUPO}, "↓"),
        e("button",{key:"x", type:"button", onClick:function(){ if(window.confirm("Excluir a regra "+r.nome+"?")) X.go("regra_del", {id:r.id}); }, className:BTN_GRUPO}, "Excluir")) : null; }}]})),
    X.edita && e(BlocoPainel,{titulo:"Nova regra"}, e("div",{className:"flex flex-col gap-3 p-3"},
      e("div",{className:"grid gap-3", style:{gridTemplateColumns:"repeat(auto-fit, minmax(10rem, 1fr))"}},
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"Nome da regra", id:"rg-nome"}), e("input",{id:"rg-nome", value:f.nome, "aria-label":"Nome da regra", className:CAMPO+" w-full text-center", onChange:function(ev){ set({nome:ev.target.value}); }})),
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"Link ou cartão", id:"rg-link"}), e("select",{id:"rg-link", value:f.comLink, "aria-label":"Teve link ou cartão", className:CAMPO+" w-full cursor-pointer text-center", onChange:function(ev){ set({comLink:ev.target.value}); }}, e("option",{value:""}, "Tanto faz"), e("option",{value:"1"}, "Sim"))),
        num("rg-din", "Dinheiro de (%)", "dinheiroPctMin"), num("rg-pixmin", "Pix de (R$)", "pixMin"), num("rg-pixmax", "Pix menor que (R$)", "pixMax"), num("rg-total", "Total pago de (R$)", "totalMin"),
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"O que fazer", id:"rg-acao"}), e("select",{id:"rg-acao", value:f.acao, "aria-label":"O que fazer", className:CAMPO+" w-full cursor-pointer text-center", onChange:function(ev){ set({acao:ev.target.value}); }}, e("option",{value:"perguntar"}, "Perguntar à empresa"), e("option",{value:"conta"}, "Mandar para uma conta"))),
        f.acao==="conta" && e("div",{className:"min-w-0"}, e(Rotulo,{t:"Conta", id:"rg-conta"}), e("select",{id:"rg-conta", value:f.destino, "aria-label":"Conta", className:CAMPO+" w-full cursor-pointer text-center", onChange:function(ev){ set({destino:ev.target.value}); }}, e("option",{value:""}, "Escolha a conta"), ativas.map(function(c){ return e("option",{key:c.id, value:c.id}, c.label); })))),
      e("div",{className:"flex justify-center"}, e(Botao,{principal:true, disabled:!pode, onClick:salvar}, "Criar regra")))));
}

function AbaRegrasContas(){
  var X = useX(), cx = use();
  useEffect(function(){ if(X.edita && cx.state.dp && cx.state.dp.maqV!==1) cx.dispatch({type:"DP", op:"aplicar_maq", por:nomeDe(cx.state.usuario)}); }, [cx.state.dp && cx.state.dp.maqV, X.edita]);   // aplica uma vez a conta fixa das maquininhas e links (o Lucas confere) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(X.px.regrasExV!==1 && X.edita) X.go("regras_exemplo"); }, [X.px.regrasExV, X.edita]);   // eslint-disable-line react-hooks/exhaustive-deps
  return e(Pagina,null,
    e("div",{className:PADRAO_BLOCOS+" flex flex-col gap-3"},
      e(PageHead,{t:"Regras e contas"}),
      e(AbaContasRep,null),
      e(Regras,{X:X})));
}
export { AbaRegrasContas };
