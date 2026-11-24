// Sorelly Admin · montagem — pages/MarcusAcessos.js
// Marcus › Acessos e senhas (Marcus, 23/11/2026): "pegue a tela do Contas a pagar da Sorelly, azul, e aplique 100% igual".
// Mesma casca do Financeiro › Contas a pagar: PAGINA_CHEIA, BlocoPainel, barra azul em forma de tabela (BarraTabela/CelulaBarra) e TabelaPlanilha fina com filtro no nome da coluna.
// Dados pessoais: ficam só neste navegador (domain/marcus.js, localStorage). Nada no servidor nem no Git.
import { Pagina } from "@/apps/montagem/components/padrao";
import { Janela } from "@/apps/montagem/components/padrao";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { PAGINA_CHEIA, CLS_FINA_ESPACO, BarraTabela, CelulaBarra, CampoMini, BuscaMini, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { Btn } from "@/apps/montagem/ui/button";
import { gravar, remover, useMarcus } from "@/apps/montagem/domain/marcus";
import { e, useState } from "@/shared/react";

var copiar = function(t){ try { navigator.clipboard.writeText(t); } catch(x){} };
var CAMPOS_ACESSO = [{k:"cat", l:"Grupo", t:"sel", ops:["Plataformas", "Bancos"]}, {k:"plat", l:"Plataforma"}, {k:"login", l:"Login ou usuário"}, {k:"senha", l:"Senha"}, {k:"obs", l:"Observação", t:"area"}];
var CAMPOS_PLANILHA = [{k:"nome", l:"Nome"}, {k:"link", l:"Link"}];

function Editor(p){
  var st = useState(Object.assign({}, p.valor)), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var campo = function(c){
    var ent = c.t==="sel" ? e("select",{value:v[c.k] || c.ops[0], onChange:function(ev){ set(c.k, ev.target.value); }, className:CAMPO}, c.ops.map(function(o){ return e("option",{key:o, value:o}, o); }))
      : c.t==="area" ? e("textarea",{value:v[c.k] || "", rows:3, onChange:function(ev){ set(c.k, ev.target.value); }, className:CAMPO.replace("h-8", "py-1.5")})
      : e("input",{type:"text", value:v[c.k] == null ? "" : v[c.k], onChange:function(ev){ set(c.k, ev.target.value); }, className:CAMPO});
    return e("div",{key:c.k, className:"min-w-0"}, e(Rotulo,{t:c.l}), ent);
  };
  return e(Janela,{t:p.t, fechar:p.fechar, colunas:[e("div",{key:"c", className:"flex flex-col gap-2"}, p.campos.map(campo))],
    rodape:[e(Btn,{key:"s", v:"primary", onClick:function(){ p.onSalvar(v); p.fechar(); }}, "Salvar"),
      p.onExcluir && e(Btn,{key:"x", v:"destructive", onClick:function(){ if(window.confirm("Excluir este item?")){ p.onExcluir(v); p.fechar(); } }}, "Excluir"),
      e(Btn,{key:"f", onClick:p.fechar}, "Cancelar")]});
}

function TelaAcessos(){
  var s = useMarcus(), bs = useState(""), busca = bs[0], setBusca = bs[1], ts = useState("acessos"), tipo = ts[0], setTipo = ts[1];
  var vs = useState({}), ver = vs[0], setVer = vs[1], ed = useState(null), edit = ed[0], setEdit = ed[1];
  var q = busca.toLowerCase();
  var acessos = s.acessos.filter(function(a){ return !q || (a.cat+" "+a.plat+" "+a.login+" "+a.obs).toLowerCase().indexOf(q)>=0; }).map(function(a){ return Object.assign({}, a, {_orig:a}); });
  var planilhas = s.planilhas.filter(function(pl){ return !q || (pl.nome+" "+pl.link).toLowerCase().indexOf(q)>=0; }).map(function(pl){ return Object.assign({}, pl, {_orig:pl}); });
  var mini = function(rot, fn){ return e("button",{type:"button", className:"mx-0.5 rounded border border-border px-1 text-[11px] hover:bg-white/10", onClick:function(ev){ ev.stopPropagation(); fn(); }}, rot); };
  var colsAcesso = [{k:"cat", t:"Grupo"}, {k:"plat", t:"Plataforma"}, {k:"login", t:"Login",
      render:function(v, l){ return e("span",null, v || "", v ? mini("Copiar", function(){ copiar(v); }) : null); }},
    {k:"senha", t:"Senha", render:function(v, l){ if(!v) return ""; var aberto = !!ver[l.id]; return e("span",null, aberto ? v : "••••••••", mini(aberto ? "Ocultar" : "Ver", function(){ var o = Object.assign({}, ver); o[l.id] = !aberto; setVer(o); }), mini("Copiar", function(){ copiar(v); })); }, fmt:function(v){ return v ? "••••••••" : ""; }},
    {k:"obs", t:"Observação"}];
  var colsPlanilha = [{k:"nome", t:"Planilha"}, {k:"link", t:"Link", render:function(v){ return v ? e("a",{href:v, target:"_blank", rel:"noreferrer", className:"underline", onClick:function(ev){ ev.stopPropagation(); }}, v) : ""; }}];
  var novo = function(){ setEdit(tipo==="acessos" ? {_tipo:"acessos", cat:"Plataformas", plat:"", login:"", senha:"", obs:""} : {_tipo:"planilhas", nome:"", link:""}); };
  var abrir = function(l){ setEdit(Object.assign({_tipo:tipo}, l._orig)); };
  var sai = function(v){ var o = Object.assign({}, v); var t = o._tipo; delete o._tipo; delete o._orig; return [t, o]; };
  var eAc = edit && edit._tipo==="acessos";
  return e(Pagina,{className:PAGINA_CHEIA},
    edit && e(Editor,{key:edit.id || "novo", t:eAc ? "Acesso" : "Planilha", valor:edit, campos:eAc ? CAMPOS_ACESSO : CAMPOS_PLANILHA, fechar:function(){ setEdit(null); },
      onSalvar:function(v){ var r = sai(v); gravar(r[0], r[1], eAc ? "a" : "p"); },
      onExcluir:edit.id ? function(v){ remover(sai(v)[0], v.id); } : null}),
    e(BlocoPainel,{titulo:"Acessos e senhas - Marcus", compacto:true, acao:e(Botao,{principal:true, onClick:novo}, tipo==="acessos" ? "Novo acesso" : "Nova planilha")},
      e(BarraTabela,null,
        e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{valor:busca, aoMudar:setBusca, ph:"Plataforma, login...", rotulo:"Buscar nos acessos"})),
        e(CelulaBarra,{rotulo:"Mostrar"}, e(CampoMini,{valor:tipo, aoMudar:setTipo, rotulo:"Mostrar", ops:[["acessos", "Logins e senhas"], ["planilhas", "Planilhas"]]}))),
      e("div",{ref:refCheia({}), className:CLS_FINA_ESPACO},
        e(TabelaPlanilha,{key:tipo, fina:true, cols:tipo==="acessos" ? colsAcesso : colsPlanilha, aoClicar:abrir, alturaMax:"calc(100vh - 6.6rem)", linhas:tipo==="acessos" ? acessos : planilhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, limite:6000,
          totalRodape:function(ls){ return (tipo==="acessos" ? colsAcesso : colsPlanilha).map(function(c, j){ return j===0 ? "Total" : j===1 ? ls.length+(ls.length===1 ? " item" : " itens") : ""; }); },
          vazio:"Nenhum item."}))));
}
function AbaMarcusAcessos(){ return e(TelaAcessos,null); }
export { AbaMarcusAcessos };
