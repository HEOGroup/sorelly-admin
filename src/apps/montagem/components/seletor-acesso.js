// Sorelly Admin — components/seletor-acesso.js
// Barra de cima, versão 3 (aprovada pelo Marcus em 27/10/2026): busca, situação (Disponível, Em reunião, Ausente), avisos, SorellyChat e a conta (foto + nome).
// O menu da conta tem: trocar ou remover a foto, aparência (claro/escuro), tamanho da tela e Sair. NÃO muda nome de exibição (só a Diretoria, na aba Contas).
// Só a Diretoria vê a lista "Atuar como" para usar o sistema como outra pessoa. Sem servidor (modo antigo) a lista aparece para todos, como era a simulação do login.
import { ACESSO_TOTAL, AGENDAMENTO, AMANDA_M, ATENDENTE_PECAS, BIPADORAS, CADASTRO_PECAS, DIRECAO_FAMILIA, DIRETORIA, FAMILIA, FINANCEIRO, KITNOVO, LEONARDO, LISTAGENS_RESP, MONTADORAS, REPRESENTANTES_VER, SUPERVISORA, grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import * as srv from "@/apps/montagem/lib/api";
import { ORDEM_SIT, SITUACOES, salvarEu, usePerfil } from "@/apps/montagem/lib/perfil";
import { RecortarFoto } from "@/apps/montagem/components/recortar-foto";
import { PAPEL_LB, VISUAL } from "@/apps/montagem/navigation/perfis";
// primeiro e segundo nome ("Vanessa Alves Lapa" vira "Vanessa Alves"); Marcus, 18/11/2026: não escrever "Representantes" nem o nome inteiro
function doisNomes(n){ return String(n||"").trim().split(/ +/).slice(0, 2).join(" "); }
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import * as sons from "@/apps/montagem/lib/sons";
import { e, useEffect, useRef, useState } from "@/shared/react";
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
    ["bipadora", BIPADORAS.concat([ATENDENTE_PECAS])], ["montadora", MONTADORAS], ["listagens", [LISTAGENS_RESP]], ["kitnovo", [KITNOVO]], ["cadastropecas", CADASTRO_PECAS], ["representante", REPRESENTANTES_VER]]; };
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

// Lista de usuários (27/11/2026, Marcus): Marcus (id 16) e Vanessa (id 9001) fixos no topo; os demais em ordem alfabética, sem grupos; busca sem acento, teclado, ESC e clique fora.
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
function listaUsuarios(){
  var vistos = {}, todos = [];
  SETORES_LOGIN().forEach(function(gr){ gr[1].forEach(function(x){ var chave = semAcento(x && x.nome).trim(); if(x && !vistos[x.id] && !vistos["n"+chave]){ vistos[x.id] = 1; vistos["n"+chave] = 1; todos.push({id:x.id, nome:x.nome, papel:PAPEL_LB[gr[0]]}); } }); });
  var fixos = [16, 9001].map(function(id){ return todos.find(function(x){ return x.id===id; }); }).filter(Boolean);
  var resto = todos.filter(function(x){ return x.id!==16 && x.id!==9001; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR", {sensitivity:"base"}); });
  return {fixos:fixos, resto:resto};
}
function SeletorUsuarios(p){
  var sq = useState(""), q = sq[0], setQ = sq[1], sh = useState(0), sel = sh[0], setSel = sh[1], lista = useRef(null);
  var l = listaUsuarios(), busca = semAcento(q).trim();
  var itens = l.fixos.concat(l.resto).filter(function(x){ return !busca || semAcento(x.nome).indexOf(busca)>=0; });
  useEffect(function(){ var el = lista.current && lista.current.querySelector('[data-sel="1"]'); if(el && el.scrollIntoView) el.scrollIntoView({block:"nearest"}); }, [sel, q]);
  var tecla = function(ev){
    if(ev.key==="Escape"){ ev.preventDefault(); p.onFechar(); }
    else if(ev.key==="ArrowDown"){ ev.preventDefault(); setSel(Math.min(sel+1, itens.length-1)); }
    else if(ev.key==="ArrowUp"){ ev.preventDefault(); setSel(Math.max(sel-1, 0)); }
    else if(ev.key==="Enter"){ ev.preventDefault(); if(itens[sel]) p.onEscolher(itens[sel].id); }
  };
  return e("div",{className:"contents"},
    e("div",{className:"fixed inset-0 z-40", onClick:p.onFechar}),
    e("div",{onKeyDown:tecla, className:"absolute "+(p.esq ? "left-0" : "right-0")+" top-9 z-50 flex w-60 max-w-[calc(100vw-1rem)] flex-col rounded-lg bg-card p-1 shadow-2xl ring-1 ring-[#E8B84B]/40", style:{maxHeight:"min(400px, calc(100vh - 80px))"}},
      e("input",{autoFocus:true, value:q, onChange:function(ev){ setQ(ev.target.value); setSel(0); }, placeholder:"Buscar usuário", "aria-label":"Buscar usuário", className:"mb-1 h-7 w-full shrink-0 rounded-md border border-border bg-black/20 px-2 text-[12px] outline-none focus:border-primary"}), // padrao-ok (Marcus 27/11/2026: 12 px, linha 26 px, reticências)
      e("div",{ref:lista, role:"listbox", className:"min-h-0 flex-1 overflow-y-auto", style:{scrollbarWidth:"thin"}},
        itens.length===0 && e("p",{className:"px-2 py-1.5 text-[12px] font-medium"}, "Ninguém encontrado."), // padrao-ok (Marcus 27/11/2026: 12 px, linha 26 px, reticências)
        itens.map(function(x, i){ var atual = x.id===p.atual, fixo = x.id===16 || x.id===9001;
          return e("button",{key:x.id, type:"button", role:"option", "aria-selected":atual, "data-sel":i===sel ? "1" : "0", onMouseEnter:function(){ setSel(i); }, onClick:function(){ p.onEscolher(x.id); },
            className:"flex h-[26px] w-full shrink-0 cursor-pointer items-center gap-2 overflow-hidden whitespace-nowrap rounded-md px-2 text-left text-[12px] leading-none outline-none "+(i===sel ? "bg-white/10" : "")+(atual ? " font-bold" : " font-medium")}, // padrao-ok (Marcus 27/11/2026: 12 px, linha 26 px, reticências)
            e("span",{className:"min-w-0 flex-1 truncate", title:x.nome}, x.id===9001 ? "Vanessa — Representante" : x.nome), // padrao-ok (Marcus 27/11/2026: 12 px, linha 26 px, reticências)
            atual && e(Icon,{n:"check", s:14, className:"shrink-0"})); }))));
}

// Conta: foto e nome; o menu reúne foto, aparência, tamanho da tela, "atuar como" (Diretoria) e Sair.
// p.zoom = o controle de tamanho; p.onTema = alterna claro/escuro. O zoom fica sempre montado (só escondido quando o menu está fechado) para valer desde a abertura do sistema.
function ContaMenu(p){
  var cx = use(), s = cx.state, d = cx.dispatch, g = grupoDe(s.usuario), v = VISUAL[g] || ["#D9A63A","user"], navigate = useNavigate();
  var ab = useState(false), aberto = ab[0], setAberto = ab[1], arq = useRef(null), rc = useState(null), recorte = rc[0], setRecorte = rc[1];
  var comLogin = comLoginAgora(), podeTrocar = !comLogin || ["16"].indexOf(srv.pessoaDaConta())>=0;   // "atuar como": SÓ o Marcus (decisão dele em 25/11/2026); os demais usam somente a própria conta
  var sSom = useState(sons.config()), som = sSom[0], setSom = sSom[1];
  useEffect(function(){ return sons.assinar(function(){ setSom(sons.config()); }); }, []);
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

  // 27/11/2026 (Marcus): foto e nome abrem a LISTA DE USUÁRIOS (só quem pode atuar como outra pessoa); as configurações ficam numa engrenagem à parte.
  var eng = useState(false), engAberta = eng[0], setEngAberta = eng[1];
  var botaoConta = e("button",{type:"button", onClick:function(){ if(podeTrocar){ setAberto(!aberto); setEngAberta(false); } }, "aria-label":podeTrocar ? "Trocar de usuário" : "Minha conta", "aria-expanded":aberto, disabled:!podeTrocar,
      className:(p.compacto ? "flex h-8 w-full" : "flex h-8")+" "+(podeTrocar ? "cursor-pointer hover:bg-white/10" : "cursor-default")+" min-w-0 items-center gap-2 rounded-lg px-1.5 text-[13px] font-semibold outline-none"},
    foto(p.compacto ? 22 : 26, 7), e("span",{className:"flex min-w-0 flex-col items-start leading-none"}, e("span",null, doisNomes(nomeDe(s.usuario))), s.usuario===16 && e("span",{className:"mt-0.5 text-[11px] font-medium opacity-70"}, PAPEL_LB[g])),   // o nível de acesso (Acesso total) aparece só para o Marcus; os outros veem só o nome (Marcus, 21/11/2026)
    podeTrocar && e(Icon,{n:aberto ? "chevrondown" : "chevron", s:12, className:"ml-auto"}));
  var conta = e("div",{className:p.compacto ? "relative min-w-0 flex-1" : "relative"}, botaoConta,
    aberto && podeTrocar && e(SeletorUsuarios,{atual:s.usuario, esq:p.esq, onEscolher:function(id){ setAberto(false); escolher(id); }, onFechar:function(){ setAberto(false); }}));
  var linhaMenu = "flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[12px] font-medium outline-none hover:bg-white/10"; // padrao-ok (Marcus 27/11/2026: 12 px, linha 26 px, reticências)
  var engrenagem = e("div",{className:"relative shrink-0"},
    e("input",{ref:arq, type:"file", accept:"image/*", className:"hidden", onChange:trocarFoto}),
    e("button",{type:"button", onClick:function(){ setEngAberta(!engAberta); setAberto(false); }, title:"Configurações do perfil", "aria-label":"Configurações do perfil", "aria-expanded":engAberta, className:"flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg outline-none hover:bg-white/10"}, e(Icon,{n:"settings", s:15})),
    engAberta && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setEngAberta(false); }}),
    e("div",{className:(engAberta ? "" : "hidden ")+"absolute "+(p.esq ? "left-0" : "right-0")+" top-9 z-50 flex max-h-[80vh] w-52 flex-col gap-0.5 overflow-y-auto rounded-lg bg-card p-1 shadow-2xl ring-1 ring-[#E8B84B]/40"},
      comLogin && meu && e("div",{className:"flex gap-0.5"},
        e("button",{type:"button", onClick:function(){ arq.current.click(); }, className:linhaMenu}, e(Icon,{n:"pencil", s:14}), "Trocar foto"),
        meu.foto && e("button",{type:"button", onClick:removerFoto, title:"Remover foto", "aria-label":"Remover foto", className:"grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md hover:bg-white/10"}, e(Icon,{n:"trash", s:14}))), // padrao-ok (Marcus 27/11/2026: 12 px, linha 26 px, reticências)
      comLogin && e(TrocarSenha),
      e("button",{type:"button", onClick:function(){ sons.mudar({mudo:!som.mudo}); try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(x){} }, title:som.mudo ? "Liga de novo todos os sons do sistema" : "Desliga todos os sons do sistema (cliques, avisos, sirene e voz de Nova venda); os avisos continuam aparecendo na tela", className:linhaMenu}, e(Icon,{n:som.mudo ? "volumex" : "volume2", s:14}), som.mudo ? "Som desligado" : "Som ligado"),
      e("button",{type:"button", onClick:p.onTema, className:linhaMenu}, e(Icon,{n:"sunmoon", s:14}), "Claro / escuro"),
      e("div",{className:"flex h-7 items-center justify-between gap-2 px-2"}, e("span",{className:"text-[12px] font-medium"}, "Tamanho"), p.zoom))); // padrao-ok (Marcus 27/11/2026: 12 px, linha 26 px, reticências)
  // botão Sair sempre à vista ao lado da conta (Marcus, 29/10/2026: não achava onde sair para entrar com a conta de outra pessoa)
  var botaoSair = e("button",{type:"button", onClick:sair, title:comLogin ? "Sair e entrar com outra conta" : "Sair (voltar para a tela de entrada)", "aria-label":"Sair", className:(p.compacto ? "flex h-8 w-8 shrink-0 justify-center" : "flex h-8 gap-1.5 px-2.5")+" cursor-pointer items-center rounded-lg border border-border bg-white/5 text-[13px] font-semibold outline-none hover:bg-white/10"}, e(Icon,{n:"logout", s:15}), !p.compacto && "Sair");
  return e("div",{className:p.compacto ? "flex min-w-0 flex-1 items-center gap-1" : "flex items-center gap-1"}, conta, engrenagem, botaoSair, recorte && e(RecortarFoto,{arquivo:recorte, onSalvar:salvarRecorte, onCancelar:function(){ setRecorte(null); }}));
}

export { PilulaSituacao, ContaMenu, SETORES_LOGIN };
