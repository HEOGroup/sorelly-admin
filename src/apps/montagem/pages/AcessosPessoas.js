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
import { VISUAL } from "@/apps/montagem/navigation/perfis";
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
// setor onde cada pessoa trabalha (Marcus, 19/11/2026: Anamaria e Ana Beatriz = Financeiro, Amanda de Miranda = Inadimplência); aparece na coluna Setor mesmo quando o acesso é Total ou Direção. Pessoa nova: acrescentar o código aqui.
var SETOR_PESSOA = {16:"Diretoria", 17:"Diretoria", 28:"Diretoria", 29:"Financeiro", 30:"Financeiro", 32:"Inadimplência"};
// SETOR editável para todos (Marcus, 23/11/2026: "sim, editar o Setor"). O setor é só uma etiqueta (onde a pessoa trabalha): quem libera é o Acesso. A escolha fica guardada em autorizações com a chave "setor:<nome>" (lista de pessoas),
// que o sistema já grava e sincroniza. Para quem tem acesso "Por setor", escolher um setor que tem grupo também muda o grupo da conta.
var SETORES_LISTA = ["Diretoria", "Financeiro", "Inadimplência", "Agendamento", "Atendimento e bipagem", "Montagem", "Supervisão da montagem", "Listagens", "Kit novo", "Cadastro de revendedoras", "Cadastro de peças", "Encomendas", "Produção", "Marketing", "RH", "Secretaria", "Garantia", "Básico"];
var MAPA_SETOR_GRUPO = {"Supervisão da montagem":"supervisora", "Agendamento":"agendamento", "Financeiro":"financeiro", "Inadimplência":"inadimplencia", "Atendimento e bipagem":"bipadora", "Montagem":"montadora", "Listagens":"listagens", "Kit novo":"kitnovo", "Cadastro de peças":"cadastropecas", "Encomendas":"encomendas", "Básico":"basico"};
var GRUPOS_SETOR = GRUPOS.filter(function(g){ return g!=="supervisao" && g!=="familia"; });
var ENDERECO = "https://sorelly-admin.vercel.app/";
var NL = String.fromCharCode(10);
var mensagemAcesso = function(c){ var nome = (c.nome || "").split(" ")[0]; return ["Oi, " + nome + "! Este é o seu acesso ao sistema da Sorelly.", "", "Endereço: " + ENDERECO, "Usuário: " + c.login, "Senha: " + c.senhaProvisoria, "", "Se a página já estiver aberta, feche e abra de novo para aparecerem as telas liberadas."].join(NL); };
var novaSenha = function(){ return "sorelly" + (1000 + Math.floor(Math.random() * 9000)); };
var pessoasDoSistema = EQUIPE.map(function(p){ return {id:p.id, nome:p.nome}; });

function AbaAcessosPessoas(){
  var cx = use(), s = cx.state, d = cx.dispatch, edita = EDITORES.indexOf(s.usuario)>=0;
  var sc = useState(null), contas = sc[0], setContas = sc[1], se = useState(""), erro = se[0], setErro = se[1], sm = useState(""), modId = sm[0], setModId = sm[1], cf = useState(null), conf = cf[0], setConf = cf[1], av = useState(""), aviso = av[0], setAviso = av[1];
  useEffect(function(){ if(apiAtiva()) chamar("GET", "/contas").then(function(j){ setContas(j.contas || []); setErro(""); }).catch(function(x){ setErro(x.message || "Não consegui ler as contas."); }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var muda = function(id, corpo){ chamar("PATCH", "/contas/"+id, corpo).then(function(j){ setContas(function(l){ return (l || []).map(function(c){ return c.id===id ? j.conta : c; }); }); setErro(""); }).catch(function(x){ setErro(x.message || "Não consegui salvar."); }); };
  var fazAcao = function(c, a){
    if(a==="bloquear") muda(c.id, {status:"bloqueado"});
    else if(a==="liberar") muda(c.id, {status:"ativo"});
    else if(a==="copiar"){ try { navigator.clipboard.writeText(mensagemAcesso(c)); setErro(""); setAviso("Acesso de "+c.nome.split(" ")[0]+" copiado. Cole no WhatsApp."); } catch(x){ setErro("Não consegui copiar. Tente de novo."); } }
    else if(a==="senha") setConf({tipo:"senha", c:c, nome:c.nome}); };
  var nomeDe = function(c){ var p = pessoasDoSistema.find(function(x){ return x.id===c.pessoaId; }); return p ? p.nome : c.nome; };

  // ACESSO em três níveis simples (Marcus, 19/11/2026: "arruma esse grupo de acessos, os nomes e o perfil, não dá assim"): Total, Direção ou Por grupo.
  // Total = grupo Acesso total + perfil Diretoria + sem lista de telas presa na conta (igual aos sócios). A lista de telas da conta (abas) é o que prendia a Priscila em 25 setores sem o Financeiro (19/11/2026). Direção = tudo, menos os Configuradores. Por grupo = a pessoa escolhe o grupo do setor e os módulos.
  var NIVEIS = [["total", "Acesso total"], ["direcao", "Direção"], ["grupo", "Por setor"]];
  var efetivo = function(c){ return c.grupo || (c.pessoaId!=null ? grupoDe(c.pessoaId) : ""); };
  var nivelDe = function(g){ return g==="supervisao" ? "total" : g==="familia" ? "direcao" : "grupo"; };
  var rotNivel = function(n){ return NIVEIS.find(function(x){ return x[0]===n; })[1]; };
  var mudaNivel = function(c, n, nome){
    if(n==="total") setConf({tipo:"total", c:c, nome:nome});
    else if(n==="direcao") muda(c.id, {grupo:"familia", abas:null, ocultar:null});
    else muda(c.id, {grupo:GRUPOS_SETOR.indexOf(efetivo(c))>=0 ? efetivo(c) : "basico", perfil:"MEMBER"}); };
  var setorSalvo = function(pid){ var au = s.autoriz || {}, ach = Object.keys(au).filter(function(k){ return k.indexOf("setor:")===0 && (au[k] || []).indexOf(pid)>=0; })[0]; return ach ? ach.slice(6) : ""; };
  var rotSetor = function(pid, n, g){ return setorSalvo(pid) || (n==="grupo" ? (LB[g] || "Sem setor") : (SETOR_PESSOA[pid] || "—")); };
  var mudaSetor = function(l, novo){
    var au = s.autoriz || {};
    Object.keys(au).forEach(function(k){ if(k.indexOf("setor:")===0 && k!=="setor:"+novo && (au[k] || []).indexOf(l.pid)>=0) d({type:"AUTORIZ_SET", k:k, ids:au[k].filter(function(x){ return x!==l.pid; })}); });
    var atual = au["setor:"+novo] || []; if(atual.indexOf(l.pid)<0) d({type:"AUTORIZ_SET", k:"setor:"+novo, ids:atual.concat([l.pid])});
    var g = MAPA_SETOR_GRUPO[novo]; if(l.n==="grupo" && g && l.c) muda(l.c.id, {grupo:g}); };
  var linhas = (contas || []).map(function(c){ var g = efetivo(c), n = nivelDe(g); return {id:"c_"+c.id, c:c, pid:c.pessoaId, cor:(VISUAL[g] || [])[0] || "#64748B", nome:nomeDe(c), nivel:rotNivel(n), n:n, grupo:rotSetor(c.pessoaId, n, g), modulos:c.perfil==="ADMIN" ? "Todos" : (c.setores || []).length+" de "+MODULOS.length, sit:SIT[c.status] || c.status, acao:""}; });
  pessoasDoSistema.forEach(function(p){ if(!(contas || []).some(function(c){ return c.pessoaId===p.id; })){ var g = grupoDe(p.id), n = nivelDe(g); linhas.push({id:"p_"+p.id, c:null, pid:p.id, cor:(VISUAL[g] || [])[0] || "#64748B", nome:p.nome, nivel:rotNivel(n), n:n, grupo:rotSetor(p.id, n, g), modulos:"—", sit:apiAtiva() && contas ? "Sem conta" : "—", acao:""}); } });
  linhas.sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });

  var cols = [
    {k:"nome", t:"Pessoa", w:"13rem", render:function(v, l){ return e("span",{className:"inline-flex items-center justify-center gap-1.5"}, e("span",{"aria-hidden":"true", className:"size-2 shrink-0 rounded-full", style:{background:l.cor}}), v); }},
    {k:"nivel", t:"Acesso", w:"14rem", render:function(v, l){ var c = l.c; if(!c) return e("span",null, v);
      return e("select",{className:CAMPO+" w-full cursor-pointer !bg-[#4a6bb0]/45 !text-[11px] [text-align-last:center]", value:l.n, disabled:!edita, "aria-label":"Acesso de "+l.nome, onChange:function(ev){ mudaNivel(c, ev.target.value, l.nome); }}, NIVEIS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })); }},
    {k:"grupo", t:"Setor", w:"13rem", render:function(v, l){ if(l.pid==null) return e("span",null, v);
      var ops = SETORES_LISTA.indexOf(v)>=0 ? SETORES_LISTA : [v].concat(SETORES_LISTA);
      return e("select",{className:CAMPO+" w-full cursor-pointer !bg-[#4a6bb0]/45 !text-[11px] [text-align-last:center]", value:v, disabled:!edita, "aria-label":"Setor de "+l.nome, onChange:function(ev){ mudaSetor(l, ev.target.value); }}, ops.map(function(o){ return e("option",{key:o, value:o}, o); })); }},
    {k:"modulos", t:"Módulos", w:"7rem", render:function(v, l){ var c = l.c; if(!c || c.perfil==="ADMIN") return e("span",null, v);
      return e(Botao,{onClick:function(){ setModId(c.id); }, title:"Escolher os módulos do servidor que esta pessoa abre"}, v); }},
    {k:"sit", t:"Situação", w:"7rem", cor:function(l){ return COR_SIT[l.sit] || ""; }},
    {k:"acao", t:"Ação", w:"9rem", render:function(v, l){ var c = l.c; if(!c || !edita) return e("span",null, "—");
      var ativo = c.status==="ativo", tem = !!(c.login && c.senhaProvisoria && c.status!=="aguardando");
      return e("select",{className:CAMPO+" w-full cursor-pointer !bg-[#4a6bb0]/45 !text-[11px] [text-align-last:center]", value:"", "aria-label":"Ação sobre a conta de "+l.nome, onChange:function(ev){ var v2 = ev.target.value; ev.target.value = ""; fazAcao(c, v2); }},
        e("option",{value:""}, "Escolher"), ativo ? e("option",{value:"bloquear"}, "Bloquear") : e("option",{value:"liberar", disabled:c.pessoaId==null}, c.status==="bloqueado" ? "Reativar" : "Liberar"),
        tem && e("option",{value:"copiar"}, "Copiar acesso (usuário e senha)"), c.login && c.status!=="aguardando" && e("option",{value:"senha"}, "Gerar senha nova")); }}];

  var conta = modId ? (contas || []).find(function(c){ return c.id===modId; }) : null;
  var corpoModulos = conta && e("div",{key:"m", className:"grid grid-cols-2 gap-x-3 gap-y-1"}, MODULOS.map(function(m){ var on = (conta.setores || []).indexOf(m[0])>=0;
    return e("label",{key:m[0], className:"flex h-8 items-center gap-1.5 text-[13px]"}, e("input",{type:"checkbox", checked:on, disabled:!edita, className:"size-4 accent-[var(--bloco-titulo)] disabled:cursor-not-allowed", onChange:function(ev){ muda(conta.id, {setores:ev.target.checked ? (conta.setores || []).concat([m[0]]) : (conta.setores || []).filter(function(x){ return x!==m[0]; })}); }}), m[1]); }));
  return e("div",{className:"flex min-h-0 flex-1 flex-col gap-2 [&_tbody_td]:!bg-[#16264a] [&_tbody_tr:hover_td]:!bg-[#1d3366] [&_tbody_button]:!border-0 [&_tbody_button]:!bg-[#4a6bb0]/45 [&_tbody_button]:!text-[11px]"},
    !edita && e("span",{className:"text-center text-[13px] font-semibold text-warning"}, "Só a diretoria, a Anamaria, a Amanda de Miranda e o Leonardo alteram os acessos. Você está só vendo."),
    aviso && e("span",{role:"status", className:"text-center text-[13px] font-semibold text-success"}, aviso),
    erro && e("span",{role:"alert", className:"text-center text-[13px] font-semibold text-destructive"}, erro),
    contas===null && apiAtiva() && !erro ? e("span",{className:"text-center text-[13px]"}, "Carregando") : e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semMao:true, semContagem:true, semLimpar:true, cheia:true, alturaMax:"calc(100vh - 11rem)", limite:100, vazio:"Ninguém cadastrado."}),
    conf && e(Janela,{t:conf.tipo==="total" ? "Dar acesso total a "+conf.nome+"?" : "Gerar senha nova para "+conf.nome+"?", sub:conf.tipo==="total" ? "Passa a ver tudo, como os sócios: dinheiro, salários e contratos." : "A senha atual deixa de valer. Depois use Copiar acesso para mandar a nova.", fechar:function(){ setConf(null); }, colunas:[e("span",{key:"x", className:"text-center text-[13px]"}, conf.tipo==="total" ? "Grupo Acesso total, perfil Diretoria e sem lista de telas presa na conta." : "O sistema cria uma senha nova na hora.")],
      rodape:[e(Botao,{key:"n", onClick:function(){ setConf(null); }}, "Cancelar"), e(Botao,{key:"s", principal:true, onClick:function(){ var c2 = conf.c; setConf(null); setAviso(""); if(conf.tipo==="total") muda(c2.id, {grupo:"supervisao", perfil:"ADMIN", abas:null, ocultar:null}); else muda(c2.id, {senha:novaSenha()}); }}, "Confirmar")]}),
    conta && e(Janela,{t:"Módulos de "+nomeDe(conta), sub:"Esta pessoa abre só os módulos marcados. Vale na hora.", fechar:function(){ setModId(""); }, colunas:[corpoModulos], rodape:[e(Botao,{key:"f", principal:true, onClick:function(){ setModId(""); }}, "Concluir")]}));
}

export { AbaAcessosPessoas };
