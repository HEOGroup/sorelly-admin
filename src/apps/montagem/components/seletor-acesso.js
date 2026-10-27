// Sorelly Admin — components/seletor-acesso.js
// Conta no topo da tela. Com o servidor ligado (barra versão 3, aprovada pelo Marcus em 27/10/2026): situação clicável (Disponível, Em reunião, Ausente), foto da pessoa, menu da conta
// (trocar ou remover a foto) e Sair. NÃO muda nome de exibição (só a Diretoria, na aba Contas). Só a Diretoria troca de pessoa para testar ("Atuar como").
// Sem servidor (modo antigo): simulação do login, escolher quem está usando o sistema, pessoas agrupadas por setor, com busca.
import { ACESSO_TOTAL, AGENDAMENTO, AMANDA_M, ATENDENTE_PECAS, BIPADORAS, CADASTRO_PECAS, DIRECAO_FAMILIA, DIRETORIA, FAMILIA, FINANCEIRO, KITNOVO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA, grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import * as srv from "@/apps/montagem/lib/api";
import { ORDEM_SIT, SITUACOES, reduzirFoto, salvarEu, usePerfil } from "@/apps/montagem/lib/perfil";
import { PAPEL_LB, VISUAL } from "@/apps/montagem/navigation/perfis";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useRef, useState } from "@/shared/react";

// ordem da lista: sócios primeiro, depois cada setor
var SETORES_LOGIN = function(){
  var socios = [16,29,28,37,38,32].map(function(i){ return DIRETORIA.concat(ACESSO_TOTAL, [AMANDA_M]).find(function(x){ return x.id===i; }); });
  return [["supervisao", socios], ["familia", DIRECAO_FAMILIA.concat(FAMILIA)], ["supervisora", [SUPERVISORA]], ["agendamento", AGENDAMENTO], ["financeiro", FINANCEIRO],
    ["bipadora", BIPADORAS.concat([ATENDENTE_PECAS])], ["montadora", MONTADORAS], ["listagens", [LISTAGENS_RESP]], ["kitnovo", [KITNOVO]], ["cadastropecas", CADASTRO_PECAS]]; };
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); };
var BOTAO_MENU = "flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-semibold outline-none hover:bg-white/10";

function SeletorAcesso(){
  var cx = use(), s = cx.state, d = cx.dispatch, g = grupoDe(s.usuario), v = VISUAL[g] || ["#D9A63A","user"];
  var ab = useState(false), aberto = ab[0], setAberto = ab[1], bq = useState(""), busca = bq[0], setBusca = bq[1], sit = useState(false), sitAberta = sit[0], setSitAberta = sit[1];
  var q = semAcento(busca), arq = useRef(null);
  var comLogin = srv.apiAtiva() && !!srv.token(), podeTrocar = !comLogin || srv.ehAdmin();
  var pf = usePerfil(), quem = pf.pessoas[s.usuario] || {}, meu = pf.meuId!=null ? (pf.pessoas[pf.meuId] || {}) : null;
  var sitMinha = SITUACOES[meu && meu.situacao] || SITUACOES.disponivel;
  var escolher = function(id){ d({type:"LOGIN", id:id}); setAberto(false); setBusca(""); };
  var sairDaConta = function(){ setAberto(false); if(comLogin) srv.sair(); else d({type:"SAIR"}); };
  var trocarFoto = function(ev){
    var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!f) return;
    reduzirFoto(f).then(function(url){ return salvarEu({foto:url}); }).then(function(){ setAberto(false); }).catch(function(x){ window.alert(x.message); });
  };
  var removerFoto = function(){ salvarEu({foto:""}).then(function(){ setAberto(false); }).catch(function(x){ window.alert(x.message); }); };
  var mudarSituacao = function(k){ setSitAberta(false); salvarEu({situacao:k}).catch(function(x){ window.alert(x.message); }); };

  // foto da pessoa (ou o ícone do grupo, como sempre foi)
  var miniatura = function(tam, rd){ return quem.foto
    ? e("span",{className:"block shrink-0 rounded-md bg-cover bg-center", style:{width:tam, height:tam, backgroundImage:"url("+quem.foto+")", borderRadius:rd}})
    : e("span",{className:"grid shrink-0 place-items-center rounded-md text-white", style:{width:tam, height:tam, background:v[0], borderRadius:rd}}, e(Icon,{n:v[1], s:Math.round(tam*0.5)})); };
  var cabecaChip = function(){ return [miniatura(24, 6),
    e("span",{key:"t", className:"flex flex-col items-start leading-none"}, e("span",null, nomeDe(s.usuario)), e("span",{className:"mt-0.5 text-[9.5px] font-medium opacity-70"}, PAPEL_LB[g]))]; };
  var itemFoto = comLogin && meu && [
    e("button",{key:"f", type:"button", onClick:function(){ arq.current.click(); }, className:BOTAO_MENU}, e(Icon,{n:"pencil", s:15}), "Trocar minha foto"),
    meu.foto && e("button",{key:"r", type:"button", onClick:removerFoto, className:BOTAO_MENU}, e(Icon,{n:"trash", s:15}), "Remover minha foto")];
  var botaoSair = e("button",{type:"button", onClick:sairDaConta, className:"mt-1 h-9 rounded-lg bg-white/10 text-[13px] font-semibold hover:bg-white/15"}, comLogin ? "Sair" : "Sair (voltar para a tela de entrada)");

  // Situação: um clique abre as três opções
  var pilula = comLogin && meu && e("div",{className:"relative"},
    e("button",{type:"button", onClick:function(){ setSitAberta(!sitAberta); }, "aria-label":"Minha situação", "aria-expanded":sitAberta,
        className:"flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] font-semibold outline-none hover:bg-white/10"},
      e("span",{className:"size-2.5 rounded-full", style:{background:sitMinha[1]}}), sitMinha[0], e(Icon,{n:"chevrondown", s:11})),
    sitAberta && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setSitAberta(false); }}),
    sitAberta && e("div",{className:"absolute right-0 top-11 z-50 flex w-44 flex-col gap-0.5 rounded-xl bg-card p-1.5 shadow-2xl ring-1 ring-[#E8B84B]/40"},
      ORDEM_SIT.map(function(k){ return e("button",{key:k, type:"button", onClick:function(){ mudarSituacao(k); }, className:BOTAO_MENU+(meu.situacao===k ? " bg-white/10" : "")},
        e("span",{className:"size-2.5 rounded-full", style:{background:SITUACOES[k][1]}}), SITUACOES[k][0]); })));

  // Diretoria (com servidor ligado ou no modo antigo): lista para atuar como outra pessoa. Os demais: só o próprio nome e o menu da conta.
  var corpoPopup = podeTrocar
    ? [e("input",{key:"b", autoFocus:true, value:busca, placeholder:"Buscar pessoa…", "aria-label":"Buscar pessoa", onChange:function(ev){ setBusca(ev.target.value); },
        className:"h-9 w-full rounded-lg border border-border bg-black/20 px-3 text-[13px] outline-none focus:border-primary"}),
      itemFoto,
      SETORES_LOGIN().map(function(gr){ var vis = VISUAL[gr[0]], gente = gr[1].filter(function(p){ return !q || semAcento(p.nome).indexOf(q)>=0; });
        if(!gente.length) return null;
        return e("div",{key:gr[0], className:"flex flex-col gap-1.5 rounded-lg p-2", style:{background:vis[0]+"1A", boxShadow:"inset 3px 0 0 "+vis[0]}},
          e("div",{className:"flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide"},
            e("span",{className:"grid size-5 place-items-center rounded-md text-white", style:{background:vis[0]}}, e(Icon,{n:vis[1], s:11})), PAPEL_LB[gr[0]]),
          e("div",{className:"flex flex-wrap gap-1.5"}, gente.map(function(p){ var on = p.id===s.usuario;
            return e("button",{key:p.id, onClick:function(){ escolher(p.id); },
              className:"rounded-lg px-2.5 py-1 text-[12.5px] font-semibold ring-1 "+(on ? "text-white ring-2" : "bg-black/20 ring-border hover:bg-white/10"), style:on ? {background:vis[0], borderColor:vis[0]} : undefined}, p.nome); }))); }),
      botaoSair]
    : [itemFoto, botaoSair];

  var chip = e("div",{className:"relative"},
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-label":podeTrocar ? "Acesso (trocar de pessoa)" : "Minha conta", "aria-expanded":aberto,
        className:"flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 pl-1.5 pr-2.5 text-sm font-semibold outline-none hover:bg-primary/15"},
      cabecaChip(), e(Icon,{n: aberto ? "chevrondown" : "chevron", s:12})),
    aberto && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberto(false); }}),
    aberto && e("div",{className:"absolute right-0 top-11 z-50 flex max-h-[75vh] flex-col gap-2 overflow-y-auto rounded-xl bg-card p-3 shadow-2xl ring-1 ring-[#E8B84B]/40 "+(podeTrocar ? "w-[min(30rem,92vw)]" : "w-60")}, corpoPopup));

  return e("div",{className:"flex items-center gap-1.5"},
    e("input",{ref:arq, type:"file", accept:"image/*", className:"hidden", onChange:trocarFoto}),
    pilula, chip,
    comLogin && e("button",{onClick:sairDaConta, "aria-label":"Sair da conta", title:"Sair da conta",
      className:"flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 text-[12.5px] font-semibold outline-none hover:bg-white/10"}, e(Icon,{n:"logout", s:14}), "Sair"));
}

export { SeletorAcesso, SETORES_LOGIN };
