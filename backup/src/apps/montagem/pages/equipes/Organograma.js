// Sorelly Admin · montagem — pages/equipes/Organograma.js
// Aba Organograma: indicadores e a árvore da empresa em cartões (mosaico) por departamento; clicar abre a janela do departamento.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Mosaico, degrade } from "@/apps/montagem/components/padrao";
import { eqArvore, eqIndicadores } from "@/apps/montagem/domain/equipes";
import { Bt, ChipPessoa, useEquipes } from "@/apps/montagem/pages/equipes/pecas";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var MAX_CHIPS = 10;
// lista de pessoas: supervisão primeiro (o domínio já ordena), no máximo MAX_CHIPS, o resto vira "+N"
function Pessoas(p){
  var ms = p.membros, ver = ms.slice(0, MAX_CHIPS), resto = ms.length-ver.length;
  if(!ms.length) return e("span",{className:"text-[11.5px] text-white/50"}, "Sem pessoas");
  return e("div",{className:"flex flex-wrap justify-center gap-1"}, ver.map(function(m){ return e(ChipPessoa,{key:m.id, nome:m.nome, papel:m.papel, vinculada:!!m.pessoaId}); }),
    resto>0 && e("span",{className:"rounded-full bg-white/10 px-2 py-0.5 text-[11.5px] font-bold text-white/80"}, "+"+resto));
}
// um departamento e, recuado dentro dele, os de baixo (hierarquia por paiId)
function No(p){
  var n = p.n, cor = n.cor, raiz = n.nivel===1;
  return e("div",{className:"flex min-w-0 flex-col gap-1.5 "+(raiz ? "rounded-xl p-2.5 text-center " : "rounded-lg border-l-2 bg-black/20 p-2 ")+(n.arquivado ? "opacity-60" : ""), style:raiz ? degrade(cor) : {borderColor:cor}},
    e("button",{type:"button", onClick:function(){ p.abrir(n.id); }, title:"Abrir o departamento", className:"flex w-full items-center justify-center gap-1.5 rounded-lg px-1 py-0.5 hover:bg-white/10"},
      e(Ph,{n:n.arquivado ? "archive" : "buildings", s:15, style:{color:cor}}),
      e("span",{className:"min-w-0 truncate font-heading text-[14px] font-bold"}, n.nome),
      e("span",{className:MONO+" rounded-md bg-black/30 px-1.5 text-[12px] font-bold", title:"Pessoas no departamento e abaixo dele"}, n.totalGeral)),
    n.supervisores.length>0 ? e("div",{className:"flex flex-wrap justify-center gap-1"}, n.supervisores.map(function(m){ return e(ChipPessoa,{key:m.id, nome:m.nome, papel:m.papel, vinculada:!!m.pessoaId}); }))
      : e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-[#FBBF24]/90"}, "Sem supervisão"),
    e(Pessoas,{membros:n.membros.filter(function(m){ return m.papel!=="SUPERVISOR"; })}),
    n.filhos.length>0 && e("div",{className:"flex flex-col gap-1.5 pt-0.5"}, n.filhos.map(function(f){ return e(No,{key:f.id, n:f, abrir:p.abrir}); })));
}

function AbaOrganograma(p){
  var q = useEquipes(), arq = useState(false), ind = eqIndicadores(q.s), arv = eqArvore(q.s, {arquivados:arq[0]});
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:5},
      e(Indicador,{t:"Departamentos", v:ind.departamentos, cor:"#8B5CF6", sub:ind.arquivados ? ind.arquivados+(ind.arquivados===1 ? " arquivado" : " arquivados") : undefined}),
      e(Indicador,{t:"Pessoas", v:ind.pessoasUnicas, cor:"info"}),
      e(Indicador,{t:"Supervisores", v:ind.supervisores, cor:"total"}),
      e(Indicador,{t:"Sem supervisor", v:ind.semSupervisor, cor:ind.semSupervisor ? "alerta" : "ok"}),
      e(Indicador,{t:"Vazios", v:ind.vazios, cor:ind.vazios ? "alerta" : "ok"})),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e(Bt,{tipo:arq[0] ? "marca" : "normal", ic:arq[0] ? "eye" : "archive", onClick:function(){ arq[1](!arq[0]); }}, arq[0] ? "Ocultar arquivados" : "Mostrar arquivados"),
      e(Bt,{tipo:"forte", ic:"plus", disabled:!q.pode, semAut:true, onClick:p.novo}, "Novo departamento")),
    arv.filhos.length
      ? e(BlocoBarra,{cor:"roxo", t:arv.nome, sub:arv.totalDepartamentos+" departamentos", dir:arv.totalGeral+" pessoas", compacto:true},
          e("div",{className:"p-2.5"}, e(Mosaico,{min:"17rem"}, arv.filhos.map(function(n){ return e(No,{key:n.id, n:n, abrir:p.abrir}); }))))
      : e(Vazio,{ic:"tree-structure"}, "Nenhum departamento cadastrado."));
}

export { AbaOrganograma };
