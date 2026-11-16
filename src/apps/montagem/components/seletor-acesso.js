// Sorelly Admin — components/seletor-acesso.js
// Barra de cima, versão 3 (aprovada pelo Marcus em 27/10/2026): busca, situação (Disponível, Em reunião, Ausente), avisos, SorellyChat e a conta (foto + nome).
// O menu da conta tem: trocar ou remover a foto, aparência (claro/escuro), tamanho da tela e Sair. NÃO muda nome de exibição (só a Diretoria, na aba Contas).
// Só a Diretoria vê a lista "Atuar como" para usar o sistema como outra pessoa. Sem servidor (modo antigo) a lista aparece para todos, como era a simulação do login.
import { ACESSO_TOTAL, AGENDAMENTO, AMANDA_M, ATENDENTE_PECAS, BIPADORAS, CADASTRO_PECAS, DIRECAO_FAMILIA, DIRETORIA, FAMILIA, FINANCEIRO, KITNOVO, LEONARDO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA, grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import * as srv from "@/apps/montagem/lib/api";
import { ORDEM_SIT, SITUACOES, salvarEu, usePerfil } from "@/apps/montagem/lib/perfil";
import { RecortarFoto } from "@/apps/montagem/components/recortar-foto";
import { PAPEL_LB, VISUAL } from "@/apps/montagem/navigation/perfis";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useRef, useState } from "@/shared/react";
import { useNavigate } from "react-router-dom";
import { caminhoDaAba } from "@/apps/montagem/router/slugs";

// Troca da própria senha (precisa da atual). Aparece dentro do menu da conta.
function TrocarSenha(){
  var so = useState(false), aberto = so[0], setAberto = so[1], sf = useState({atual:"", nova:"", repete:""}), f = sf[0], setF = sf[1], sm = useState(null), msg = sm[0], setMsg = sm[1], sb = useState(false), ocupado = sb[0], setOcupado = sb[1];
  var campo = function(rot, k, auto){ return e("label",{className:"flex flex-col gap-1 text-[11px] font-semibold"}, rot, e("input",{type:"password", autoComplete:auto, value:f[k], onChange:function(ev){ var c = Object.assign({}, f); c[k] = ev.target.value; setF(c); setMsg(null); }, className:"h-8 rounded-lg border border-border bg-black/20 px-3 text-[13px] outline-none focus:border-primary"})); };
  var enviar = function(ev){
    ev.preventDefault(); if(ocupado) return;
    if(f.nova.length<8){ setMsg({ok:false, t:"A senha nova precisa ter 8 letras ou mais."}); return; }
    if(f.nova!==f.repete){ setMsg({ok:false, t:"As duas senhas novas não são iguais."}); return; }
    setOcupado(true);
    srv.chamar("PATCH", "/perfil/senha", {atual:f.atual, nova:f.nova}).then(function(){ setOcupado(false); setF({atual:"", nova:"", repete:""}); setMsg({ok:true, t:"Senha trocada."}); })
      .catch(function(x){ setOcupado(false); setMsg({ok:false, t:x.message}); });
  };
  return e("div",{className:"contents"},   // o botão ocupa uma célula da grade do painel; o formulário abre embaixo, nas 2 colunas
    e("button",{type:"button", onClick:function(){ setAberto(!aberto); setMsg(null); }, className:BOTAO_MENU}, e(Icon,{n:"lock", s:14}), "Trocar senha"),
    aberto && e("form",{onSubmit:enviar, className:"col-span-2 flex flex-col gap-1.5 rounded-lg bg-black/20 p-2"},
      campo("Senha atual", "atual", "current-password"), campo("Senha nova", "nova", "new-password"), campo("Repita a senha nova", "repete", "new-password"),
      msg && e("p",{role:msg.ok ? "status" : "alert", className:"text-[12.5px] font-semibold "+(msg.ok ? "text-success" : "text-destructive")}, msg.t),
      e("button",{type:"submit", disabled:ocupado, className:"h-8 rounded-lg bg-primary text-[13px] font-bold text-primary-foreground hover:opacity-90"}, ocupado ? "Trocando…" : "Trocar senha")));
}

// ordem da lista: sócios primeiro, depois cada setor
var SETORES_LOGIN = function(){
  var todos = DIRETORIA.concat(ACESSO_TOTAL, [AMANDA_M], DIRECAO_FAMILIA, FAMILIA, [LEONARDO]), por = function(ids){ return ids.map(function(i){ return todos.find(function(x){ return x.id===i; }); }); };
  return [["supervisao", por([16,17,37,44])], ["familia", por([29,28,38,32,31,30])], ["supervisora", [SUPERVISORA]], ["agendamento", AGENDAMENTO], ["financeiro", FINANCEIRO],
    ["bipadora", BIPADORAS.concat([ATENDENTE_PECAS])], ["montadora", MONTADORAS], ["listagens", [LISTAGENS_RESP]], ["kitnovo", [KITNOVO]], ["cadastropecas", CADASTRO_PECAS]]; };
var BOTAO_MENU = "flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-[13px] font-semibold outline-none hover:bg-white/10";
var comLoginAgora = function(){ return srv.apiAtiva() && !!srv.token(); };

// Situação: um clique abre as três opções. Só existe com o servidor ligado.
function PilulaSituacao(p){ p = p || {};
  var sit = useState(false), aberta = sit[0], setAberta = sit[1], pf = usePerfil();
  if(!comLoginAgora() || pf.meuId==null || ["16","17","28","44"].indexOf(srv.pessoaDaConta())<0) return null;   // situação (reunião/ausente): só Marcus, Nickolas, Lucas e Leonardo
  var meu = pf.pessoas[pf.meuId] || {}, atual = SITUACOES[meu.situacao] || SITUACOES.disponivel;
  var mudar = function(k){ setAberta(false); salvarEu({situacao:k}).catch(function(x){ window.alert(x.message); }); };
  return e("div",{className:"relative"},
    e("button",{type:"button", onClick:function(){ setAberta(!aberta); }, "aria-label":"Minha situação", "aria-expanded":aberta,
        title:p.compacto ? "Minha situação: "+atual[0] : undefined,
        className:p.compacto ? "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-primary/40 bg-primary/10 outline-none hover:bg-primary/15" : "flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 text-[13px] font-semibold outline-none hover:bg-primary/15"},
      e("span",{className:"size-2.5 rounded-full", style:{background:atual[1]}}), !p.compacto && atual[0], !p.compacto && e(Icon,{n:"chevrondown", s:11})),
    aberta && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberta(false); }}),
    aberta && e("div",{className:"absolute "+(p.esq ? "left-0" : "right-0")+" top-11 z-50 flex w-44 flex-col gap-0.5 rounded-xl bg-card p-1.5 shadow-2xl ring-1 ring-[#E8B84B]/40"},
      ORDEM_SIT.map(function(k){ return e("button",{key:k, type:"button", onClick:function(){ mudar(k); }, className:BOTAO_MENU+(meu.situacao===k ? " bg-white/10" : "")},
        e("span",{className:"size-2.5 rounded-full", style:{background:SITUACOES[k][1]}}), SITUACOES[k][0]); })));
}

// Conta: foto e nome; o menu reúne foto, aparência, tamanho da tela, "atuar como" (Diretoria) e Sair.
// p.zoom = o controle de tamanho; p.onTema = alterna claro/escuro. O zoom fica sempre montado (só escondido quando o menu está fechado) para valer desde a abertura do sistema.
function ContaMenu(p){
  var cx = use(), s = cx.state, d = cx.dispatch, g = grupoDe(s.usuario), v = VISUAL[g] || ["#D9A63A","user"], navigate = useNavigate();
  var ab = useState(false), aberto = ab[0], setAberto = ab[1], arq = useRef(null), rc = useState(null), recorte = rc[0], setRecorte = rc[1];
  var comLogin = comLoginAgora(), podeTrocar = !comLogin || ["16","17","28","44"].indexOf(srv.pessoaDaConta())>=0;   // "atuar como": Marcus, Nickolas e Lucas; os demais usam somente a própria conta
  var pf = usePerfil(), quem = pf.pessoas[s.usuario] || {}, meu = pf.meuId!=null ? (pf.pessoas[pf.meuId] || {}) : null;
  var escolher = function(id){ d({type:"LOGIN", id:id, atuando:true}); setAberto(false); navigate(caminhoDaAba("inicio")); };   // ao trocar de pessoa, vai para o Início dela (as abas do Marcus não vão junto; voltando para si, as dele voltam)
  var sair = function(){ setAberto(false); if(comLogin) srv.sair(); else d({type:"SAIR"}); };
  var trocarFoto = function(ev){
    var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!f) return;
    setAberto(false); setRecorte(f);   // abre a janelinha de enquadrar; quem salva é ela
  };
  var salvarRecorte = function(url){ salvarEu({foto:url}).then(function(){ setRecorte(null); }).catch(function(x){ window.alert(x.message); }); };
  var removerFoto = function(){ salvarEu({foto:""}).then(function(){ setAberto(false); }).catch(function(x){ window.alert(x.message); }); };
  var foto = function(tam, rd){ return quem.foto
    ? e("span",{className:"block shrink-0 bg-cover bg-center", style:{width:tam, height:tam, backgroundImage:"url("+quem.foto+")", borderRadius:rd}})
    : e("span",{className:"grid shrink-0 place-items-center text-white", style:{width:tam, height:tam, background:v[0], borderRadius:rd}}, e(Icon,{n:v[1], s:Math.round(tam*0.5)})); };

  var conta = e("div",{className:p.compacto ? "relative min-w-0 flex-1" : "relative"},
    e("input",{ref:arq, type:"file", accept:"image/*", className:"hidden", onChange:trocarFoto}),
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-label":"Minha conta", "aria-expanded":aberto,
        className:(p.compacto ? "flex h-8 w-full" : "flex h-8")+" cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 pl-1.5 pr-2.5 text-sm font-semibold outline-none hover:bg-primary/15"},
      foto(p.compacto ? 22 : 26, 7), e("span",{className:"flex min-w-0 flex-col items-start leading-none"}, e("span",null, nomeDe(s.usuario)), e("span",{className:"mt-0.5 text-[11px] font-medium opacity-70"}, PAPEL_LB[g])),
      e(Icon,{n: aberto ? "chevrondown" : "chevron", s:12, className:p.compacto ? "ml-auto" : ""})),
    aberto && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberto(false); }}),
    // painel mínimo (Marcus, 16/11/2026: "tem que ser muito mais simplificado"): sem cabeçalho (o nome já está na barra), 1 coluna de linhas de 32 px, 14 rem
    e("div",{className:(aberto ? "" : "hidden ")+"absolute "+(p.esq ? "left-0" : "right-0")+" top-10 z-50 flex max-h-[80vh] w-56 flex-col gap-0.5 overflow-y-auto rounded-xl bg-card p-1.5 shadow-2xl ring-1 ring-[#E8B84B]/40"},
      comLogin && meu && e("div",{className:"flex gap-0.5"},
        e("button",{type:"button", onClick:function(){ arq.current.click(); }, className:BOTAO_MENU}, e(Icon,{n:"pencil", s:14}), "Trocar foto"),
        meu.foto && e("button",{type:"button", onClick:removerFoto, title:"Remover foto", "aria-label":"Remover foto", className:"grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-white/10"}, e(Icon,{n:"trash", s:14}))),
      comLogin && e(TrocarSenha),
      e("button",{type:"button", onClick:p.onTema, className:BOTAO_MENU}, e(Icon,{n:"sunmoon", s:14}), "Claro / escuro"),
      e("div",{className:"flex h-8 items-center justify-between gap-2 px-2"}, e("span",{className:"text-[13px] font-semibold"}, "Tamanho"), p.zoom),
      podeTrocar && e("select",{value:s.usuario, title:"Atuar como outra pessoa", "aria-label":"Atuar como outra pessoa", onChange:function(ev){ escolher(Number(ev.target.value)); },
        className:"mt-1 h-8 w-full cursor-pointer rounded-lg border border-border bg-black/20 px-2 text-[13px] outline-none focus:border-primary"},
        SETORES_LOGIN().map(function(gr){ return e("optgroup",{key:gr[0], label:PAPEL_LB[gr[0]]}, gr[1].map(function(x){ return e("option",{key:x.id, value:x.id, className:"bg-card text-white"}, x.nome); })); }))));
  // botão Sair sempre à vista ao lado da conta (Marcus, 29/10/2026: não achava onde sair para entrar com a conta de outra pessoa)
  var botaoSair = e("button",{type:"button", onClick:sair, title:comLogin ? "Sair e entrar com outra conta" : "Sair (voltar para a tela de entrada)", "aria-label":"Sair", className:(p.compacto ? "flex h-8 w-8 shrink-0 justify-center" : "flex h-8 gap-1.5 px-2.5")+" cursor-pointer items-center rounded-lg border border-border bg-white/5 text-[13px] font-semibold outline-none hover:bg-white/10"}, e(Icon,{n:"logout", s:15}), !p.compacto && "Sair");
  return e("div",{className:p.compacto ? "flex min-w-0 flex-1 items-center gap-1.5" : "flex items-center gap-1.5"}, conta, botaoSair, recorte && e(RecortarFoto,{arquivo:recorte, onSalvar:salvarRecorte, onCancelar:function(){ setRecorte(null); }}));
}

export { PilulaSituacao, ContaMenu, SETORES_LOGIN };
