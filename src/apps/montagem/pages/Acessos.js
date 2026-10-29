// Sorelly Admin · montagem — pages/Acessos.js
// RH → Acessos por setor: marca quais telas cada setor abre e, dentro de algumas telas (Consolidado, Comissões), quais partes cada um vê.
// Vale na hora (state.acessos e state.acessosBlocos sobre o padrão de navigation/perfis.js e domain/equipe.js). Só os sócios e o Nickolas mexem.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { ACESSO_TOTAL, AGENDAMENTO, AMANDA_M, ATENDENTE_PECAS, BIPADORAS, BLOCOS, CADASTRO_PECAS, DIRECAO_FAMILIA, DIRETORIA, FAMILIA, FINANCEIRO, KITNOVO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA } from "@/apps/montagem/domain/equipe";
import { ABAS } from "@/apps/montagem/navigation/abas";
import { GRUPOS_EDITAVEIS, PAPEL_LB, VISUAL, abasDoPapel } from "@/apps/montagem/navigation/perfis";
import { SETORES, ondeEsta } from "@/apps/montagem/navigation/setores";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { PageHead } from "@/apps/montagem/ui/page";
import { ContasLogin } from "@/apps/montagem/components/contas-login";
import { e } from "@/shared/react";
import React from "react";

var EDITORES = [16,17,28,29,44];   // Marcus, Nickolas, Lucas, Anamaria
var nomes = function(l){ return l.map(function(x){ return x.nome; }); };
var QUEM = {
  supervisao: ["Marcus","Anamaria","Lucas"],
  familia: nomes(DIRECAO_FAMILIA).concat(nomes(FAMILIA)), supervisora: [SUPERVISORA.nome], agendamento: nomes(AGENDAMENTO), financeiro: nomes(FINANCEIRO),
  inadimplencia: [AMANDA_M.nome], bipadora: nomes(BIPADORAS).concat([ATENDENTE_PECAS.nome]), montadora: nomes(MONTADORAS), listagens: [LISTAGENS_RESP.nome], kitnovo: [KITNOVO.nome], cadastropecas: nomes(CADASTRO_PECAS),
  representante: ["24 representantes (ainda sem login)"]};

function AbaAcessos(){
  var cx = use(), s = cx.state, d = cx.dispatch, edita = EDITORES.indexOf(s.usuario)>=0;
  var colunas = ["supervisao"].concat(GRUPOS_EDITAVEIS);
  // linhas agrupadas pelo setor do menu
  var setorDe = function(k){ var o = ondeEsta(k); return o ? o.setor.nome : "Apps de celular e outros"; };
  var ordem = SETORES.map(function(st){ return st.nome; }).concat(["Apps de celular e outros"]);
  var grupos = ordem.map(function(nm){ return {nome:nm, abas:ABAS.filter(function(a){ return setorDe(a[0])===nm; })}; }).filter(function(g){ return g.abas.length; });
  var marcar = function(papel, k, ligar){
    var atual = (abasDoPapel(papel, s.acessos) || []).slice();
    d({type:"ACESSO_SET", papel:papel, abas:ligar ? atual.concat([k]) : atual.filter(function(x){ return x!==k; })}); };
  var lista = function(chave){ return (s.acessosBlocos && s.acessosBlocos[chave]) || BLOCOS[chave].padrao; };
  var marcarBloco = function(chave, g, ligar){ var l = lista(chave).slice(); d({type:"ACESSO_BLOCO", chave:chave, grupos:ligar ? l.concat([g]) : l.filter(function(x){ return x!==g; })}); };
  var caixa = function(on, bloqueado, rotulo, aoMudar){ return e("input",{type:"checkbox", checked:on, disabled:bloqueado || !edita, "aria-label":rotulo,
    className:"size-4 cursor-pointer accent-[#E8B84B] disabled:cursor-not-allowed", onChange:function(ev){ aoMudar(ev.target.checked); }}); };
  var blocoMudou = function(g){ return Object.keys(BLOCOS).some(function(c){ return lista(c).indexOf(g)>=0 !== (BLOCOS[c].padrao.indexOf(g)>=0); }); };
  var restaurar = function(g){ d({type:"ACESSO_SET", papel:g, abas:null});
    Object.keys(BLOCOS).forEach(function(c){ if(lista(c).indexOf(g)>=0 === (BLOCOS[c].padrao.indexOf(g)>=0)) return; marcarBloco(c, g, BLOCOS[c].padrao.indexOf(g)>=0); }); };
  var td = "border-b border-border/40 px-2 py-1.5 text-center";
  var linhaTela = function(a){ var k = a[0], blocos = Object.keys(BLOCOS).filter(function(c){ return BLOCOS[c].tela===k; });
    return [e("tr",{key:k, className:"hover:bg-white/5"},
        e("td",{className:"sticky left-0 z-10 border-b border-border/40 bg-card px-3 py-1.5 text-left text-[13px] font-medium"}, a[1]),
        colunas.map(function(g){ return e("td",{key:g, className:td}, caixa(g==="supervisao" ? true : (abasDoPapel(g, s.acessos)||[]).indexOf(k)>=0, g==="supervisao", a[1]+" para "+PAPEL_LB[g], function(v){ marcar(g, k, v); })); }))]
      .concat(blocos.map(function(c){
        return e("tr",{key:k+c, className:"bg-black/15"},
          e("td",{className:"sticky left-0 z-10 border-b border-border/40 bg-[#1b1710] py-1.5 pl-8 pr-3 text-left text-[12px] text-white/85"}, "↳ dentro: "+BLOCOS[c].nome),
          colunas.map(function(g){ return e("td",{key:g, className:td}, caixa(g==="supervisao" ? true : lista(c).indexOf(g)>=0, g==="supervisao", BLOCOS[c].nome+" para "+PAPEL_LB[g], function(v){ marcarBloco(c, g, v); })); })); })); };
  var cabeca = function(g){ var v = VISUAL[g], mudou = g!=="supervisao" && ((s.acessos && s.acessos[g]) || blocoMudou(g));
    return e("th",{key:g, className:"sticky top-0 z-10 min-w-36 border-b border-border bg-sidebar p-1.5 align-top"},
      e("div",{className:"flex flex-col items-center gap-1 rounded-xl p-2 text-white", style:{background:v[0]}},
        e("span",{className:"grid size-8 place-items-center rounded-lg bg-black/25"}, e(Icon,{n:v[1], s:17})),
        e("span",{className:"text-[12.5px] font-bold leading-tight"}, PAPEL_LB[g]),
        e("span",{className:"text-[10.5px] font-medium leading-tight opacity-90"}, QUEM[g].join(", ")),
        mudou && edita && e("button",{onClick:function(){ restaurar(g); }, className:"mt-0.5 rounded bg-black/30 px-1.5 py-0.5 text-[10.5px] font-semibold hover:bg-black/45"},"Voltar ao padrão"))); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Acessos por setor", sub:"Marque as telas que cada setor abre e, dentro da tela, o que cada um enxerga. Vale na hora."}),
    e("div",{className:"mx-auto flex w-full max-w-[110rem] flex-col gap-3"},
      !edita && e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"},"Só os sócios e o Nickolas alteram os acessos. Você está só vendo."),
      e(BlocoBarra,{t:"Quem abre o quê", sub:"cada coluna é um setor · os sócios (primeira coluna) sempre veem tudo"},
        e("div",{className:"max-h-[75vh] overflow-auto p-2"},
          e("table",{className:"w-full border-separate border-spacing-0"},
            e("thead",null, e("tr",null,
              e("th",{className:"sticky left-0 top-0 z-20 min-w-56 border-b border-border bg-sidebar px-3 py-2 text-left text-[12px] font-semibold"},"Tela"), colunas.map(cabeca))),
            e("tbody",null, grupos.map(function(gr){ return e(React.Fragment,{key:gr.nome},
              e("tr",null, e("td",{colSpan:colunas.length+1, className:"bg-primary/15 px-3 py-1 text-left text-[11.5px] font-bold uppercase tracking-wide text-primary"}, gr.nome)),
              gr.abas.map(linhaTela)); }))))),
      e(ContasLogin),
      e("p",{className:"text-center text-[12px] text-white/70"},"Representantes: cada uma só verá os dados dela quando tiverem login. As telas em 'em breve' só os sócios veem.")));
}

export { AbaAcessos };
