// Sorelly Admin · montagem — pages/encomendas/Joao.js
// Ficha do pedido › bloco "Entrega pelo João" (17/11/2026, Marcus): taxa cobrada ou isenta (só a diretoria muda), "Bipei as peças" (obrigatório antes de liberar para o João)
// e, quando a condicional assinada volta, o botão que copia a mensagem para a revendedora avaliar a reposição (texto em Regras e mensagens › Avaliação da reposição).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { formatarReais, mensagemTexto } from "@/apps/montagem/domain/encomendas";
import { copiar } from "@/apps/montagem/pages/encomendas/visual";
import { e } from "@/shared/react";

// caixa da ficha: barra azul no topo (BlocoPainel) e conteúdo com pouco espaço
function Caixa(p){ return e(BlocoPainel,{titulo:p.t, dir:p.dir}, e("div",{className:"flex flex-col p-2"}, p.children)); }

function BlocoJoao(p){
  var E = p.E, x = p.x;
  if(x.tipo!=="reposicao" || x.canal!=="entrega") return null;
  var fim = x.status==="concluido" || x.status==="recusado" || x.status==="cancelado";
  var primeiro = String(x.revendedora || "").trim().split(" ")[0];
  return e(Caixa,{t:"Entrega pelo João"},
    e("div",{className:"flex flex-col items-center gap-1.5 text-[13px]"},
      x.taxaIsenta ? e("span",{className:"font-semibold text-success"}, "Taxa isenta") : x.taxa>0 ? e("span",null, "Taxa de "+formatarReais(x.taxa)+(x.comprovante ? " (paga)" : " (falta o comprovante)")) : null,
      !fim && E.pode && (x.taxaIsenta
        ? e(Botao,{onClick:function(){ E.exec("ped_taxa", {id:x.id, isenta:false}); }}, "Cobrar a taxa")
        : e(Botao,{onClick:function(){ E.exec("ped_taxa", {id:x.id, isenta:true}); }}, "Isentar a taxa")),
      x.status==="bipagem" && (x.bipado
        ? e("span",{className:"font-semibold text-success"}, "Bipado por "+x.bipado.por)
        : e(Botao,{principal:true, onClick:function(){ E.exec("ped_bipar", {id:x.id}); }}, "Bipei as peças")),
      (x.status==="condicional" || x.status==="concluido") && e(Botao,{onClick:function(){ copiar(mensagemTexto(E.cfg, "avaliacao").split("{nome}").join(primeiro)); }}, "Copiar mensagem de avaliação")));
}
export { BlocoJoao, Caixa };
