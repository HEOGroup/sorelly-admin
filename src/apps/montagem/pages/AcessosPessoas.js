// Sorelly Admin · montagem — pages/AcessosPessoas.js
// RH › Pessoas › Acessos e autorizações, visão "Pessoas" (19/11/2026, pedido do Marcus: "simplifica muito, como se fosse a tela do Contas a pagar").
// UMA tabela com poucas colunas, uma linha por pessoa: Pessoa, Grupo de acesso, Perfil, Módulos, Situação e a ação (Liberar ou Bloquear). Tudo se muda na própria linha, sem detalhe embaixo.
// O acesso é por GRUPO (domain/equipe.js, navigation/perfis.js). Perfil Diretoria abre todos os módulos do servidor; perfil Setor abre só os módulos marcados (botão Módulos).
// A conta de login vem do servidor (/api/contas); só a Diretoria grava. Sem servidor a tabela mostra só o grupo que o sistema sabe de cada pessoa.
import { Janela } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { EQUIPE, grupoDe } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useState } from "@/shared/react";

var EDITORES = [16, 17, 28, 29, 32, 44];   // quem altera: Marcus, Nickolas, Lucas, Anamaria, Amanda de Miranda e Leonardo
var GRUPOS = ["supervisao", "familia", "supervisora", "agendamento", "financeiro", "inadimplencia", "bipadora", "montadora", "listagens", "kitnovo", "cadastropecas", "encomendas", "basico"];
// módulos que o servidor confere (src/server/permissoes.js → SETORES_VALIDOS)
var MODULOS = [["rh", "RH"], ["cobranca", "Cobrança"], ["socios", "Sócios"], ["financeiro", "Financeiro"], ["linkpag", "Link de pagamento"], ["agendamento", "Agendamento"], ["cadastro", "Cadastro de revendedoras"], ["kitsnovos", "Kits novos"], ["montagem", "Montagem"], ["producao", "Produção"], ["encomendas", "Encomendas"], ["pecas", "Cadastro de peças"], ["marketing", "Marketing"], ["garantia", "Garantia"]];
var SIT = {aguardando:"Aguardando", ativo:"Ativo", bloqueado:"Bloqueado"};
var COR_SIT = {Aguardando:"text-warning", Ativo:"text-success", Bloqueado:"text-destructive"};
// nomes curtos e padronizados desta tela (Marcus, 19/11/2026: "organiza, padroniza"): uma palavra ou duas, sem parênteses
var LB = {supervisora:"Supervisão da montagem", agendamento:"Agendamento", financeiro:"Financeiro", inadimplencia:"Inadimplência", bipadora:"Atendimento e bipagem", montadora:"Montagem", listagens:"Listagens", kitnovo:"Kit novo", cadastropecas:"Cadastro de peças", encomendas:"Encomendas", basico:"Básico"};
var GRUPOS_SETOR = GRUPOS.filter(function(g){ return g!=="supervisao" && g!=="familia"; });
var pessoasDoSistema = EQUIPE.map(function(p){ return {id:p.id, nome:p.nome}; });

function AbaAcessosPessoas(){
  var cx = use(), s = cx.state, edita = EDITORES.indexOf(s.usuario)>=0;
  var sc = useState(null), contas = sc[0], setContas = sc[1], se = useState(""), erro = se[0], setErro = se[1], sm = useState(""), modId = sm[0], setModId = sm[1];
  useEffect(function(){ if(apiAtiva()) chamar("GET", "/contas").then(function(j){ setContas(j.contas || []); setErro(""); }).catch(function(x){ setErro(x.message || "Não consegui ler as contas."); }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var muda = function(id, corpo){ chamar("PATCH", "/contas/"+id, corpo).then(function(j){ setContas(function(l){ return (l || []).map(function(c){ return c.id===id ? j.conta : c; }); }); setErro(""); }).catch(function(x){ setErro(x.message || "Não consegui salvar."); }); };
  var nomeDe = function(c){ var p = pessoasDoSistema.find(function(x){ return x.id===c.pessoaId; }); return p ? p.nome : c.nome; };

  // ACESSO em três níveis simples (Marcus, 19/11/2026: "arruma esse grupo de acessos, os nomes e o perfil, não dá assim"): Total, Direção ou Por grupo.
  // Total = grupo Acesso total + perfil Diretoria + sem lista de telas presa na conta (igual aos sócios). A lista de telas da conta (abas) é o que prendia a Priscila em 25 setores sem o Financeiro (19/11/2026). Direção = tudo, menos os Configuradores. Por grupo = a pessoa escolhe o grupo do setor e os módulos.
  var NIVEIS = [["total", "Acesso total"], ["direcao", "Direção"], ["grupo", "Por setor"]];
  var efetivo = function(c){ return c.grupo || (c.pessoaId!=null ? grupoDe(c.pessoaId) : ""); };
  var nivelDe = function(g){ return g==="supervisao" ? "total" : g==="familia" ? "direcao" : "grupo"; };
  var rotNivel = function(n){ return NIVEIS.find(function(x){ return x[0]===n; })[1]; };
  var mudaNivel = function(c, n, nome){
    if(n==="total"){ if(window.confirm("Dar ACESSO TOTAL a "+nome+"? Passa a ver tudo, como os sócios (dinheiro, salários e contratos).")) muda(c.id, {grupo:"supervisao", perfil:"ADMIN", abas:null, ocultar:null}); }
    else if(n==="direcao") muda(c.id, {grupo:"familia", abas:null, ocultar:null});
    else muda(c.id, {grupo:GRUPOS_SETOR.indexOf(efetivo(c))>=0 ? efetivo(c) : "basico", perfil:"MEMBER"}); };
  var linhas = (contas || []).map(function(c){ var g = efetivo(c), n = nivelDe(g); return {id:"c_"+c.id, c:c, nome:nomeDe(c), nivel:rotNivel(n), n:n, grupo:n==="grupo" ? (LB[g] || "Sem setor") : "—", modulos:c.perfil==="ADMIN" ? "Todos" : (c.setores || []).length+" de "+MODULOS.length, sit:SIT[c.status] || c.status, acao:""}; });
  pessoasDoSistema.forEach(function(p){ if(!(contas || []).some(function(c){ return c.pessoaId===p.id; })){ var g = grupoDe(p.id), n = nivelDe(g); linhas.push({id:"p_"+p.id, c:null, nome:p.nome, nivel:rotNivel(n), n:n, grupo:n==="grupo" ? (LB[g] || g) : "—", modulos:"—", sit:apiAtiva() && contas ? "Sem conta" : "—", acao:""}); } });
  linhas.sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });

  var cols = [
    {k:"nome", t:"Pessoa", w:"16rem"},
    {k:"nivel", t:"Acesso", w:"18rem", render:function(v, l){ var c = l.c; if(!c) return e("span",null, v);
      return e("select",{className:CAMPO+" w-full cursor-pointer", value:l.n, disabled:!edita, "aria-label":"Acesso de "+l.nome, onChange:function(ev){ mudaNivel(c, ev.target.value, l.nome); }}, NIVEIS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })); }},
    {k:"grupo", t:"Setor", w:"16rem", render:function(v, l){ var c = l.c; if(!c || l.n!=="grupo") return e("span",null, v);
      return e("select",{className:CAMPO+" w-full cursor-pointer", value:efetivo(c), disabled:!edita, "aria-label":"Setor de "+l.nome, onChange:function(ev){ muda(c.id, {grupo:ev.target.value}); }}, GRUPOS_SETOR.map(function(g){ return e("option",{key:g, value:g}, LB[g] || g); })); }},
    {k:"modulos", t:"Módulos", w:"9rem", render:function(v, l){ var c = l.c; if(!c || c.perfil==="ADMIN") return e("span",null, v);
      return e(Botao,{onClick:function(){ setModId(c.id); }, title:"Escolher os módulos do servidor que esta pessoa abre"}, v); }},
    {k:"sit", t:"Situação", w:"9rem", cor:function(l){ return COR_SIT[l.sit] || ""; }},
    {k:"acao", t:"Ação", w:"9rem", render:function(v, l){ var c = l.c; if(!c || !edita) return e("span",null, "—");
      return c.status==="ativo" ? e(Botao,{onClick:function(){ muda(c.id, {status:"bloqueado"}); }}, "Bloquear")
        : e(Botao,{principal:true, desabilitado:c.pessoaId==null, title:c.pessoaId==null ? "Ligue a conta a uma pessoa do sistema antes de liberar" : "", onClick:function(){ muda(c.id, {status:"ativo"}); }}, c.status==="bloqueado" ? "Reativar" : "Liberar"); }}];

  var conta = modId ? (contas || []).find(function(c){ return c.id===modId; }) : null;
  var corpoModulos = conta && e("div",{key:"m", className:"grid grid-cols-2 gap-x-3 gap-y-1"}, MODULOS.map(function(m){ var on = (conta.setores || []).indexOf(m[0])>=0;
    return e("label",{key:m[0], className:"flex h-8 items-center gap-1.5 text-[13px]"}, e("input",{type:"checkbox", checked:on, disabled:!edita, className:"size-4 accent-[var(--bloco-titulo)] disabled:cursor-not-allowed", onChange:function(ev){ muda(conta.id, {setores:ev.target.checked ? (conta.setores || []).concat([m[0]]) : (conta.setores || []).filter(function(x){ return x!==m[0]; })}); }}), m[1]); }));
  return e("div",{className:"flex min-h-0 flex-1 flex-col gap-2"},
    !edita && e("span",{className:"text-center text-[13px] font-semibold text-warning"}, "Só a diretoria, a Anamaria, a Amanda de Miranda e o Leonardo alteram os acessos. Você está só vendo."),
    erro && e("span",{role:"alert", className:"text-center text-[13px] font-semibold text-destructive"}, erro),
    contas===null && apiAtiva() && !erro ? e("span",{className:"text-center text-[13px]"}, "Carregando") : e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semMao:true, semContagem:true, semLimpar:true, cheia:true, alturaMax:"calc(100vh - 11rem)", limite:100, vazio:"Ninguém cadastrado."}),
    conta && e(Janela,{t:"Módulos de "+nomeDe(conta), sub:"Esta pessoa abre só os módulos marcados. Vale na hora.", fechar:function(){ setModId(""); }, colunas:[corpoModulos], rodape:[e(Botao,{key:"f", principal:true, onClick:function(){ setModId(""); }}, "Concluir")]}));
}

export { AbaAcessosPessoas };
