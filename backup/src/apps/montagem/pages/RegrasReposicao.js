// Sorelly Admin — pages/RegrasReposicao.js
// Encomendas e reposições → Regras: uma página só, para ler as regras e o que ainda falta alinhar. Os valores vêm de domain/reposicao.js.
import { reais } from "@/apps/montagem/domain/consignado";
import { REGRAS_REPOSICAO as R, REPOSICAO_A_ALINHAR } from "@/apps/montagem/domain/reposicao";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

var v = function(x){ return e("b",{className:"text-primary"}, x); };
function bloco(titulo, ic, sub, filhos){
  return e("div",{key:titulo, className:"flex flex-col rounded-xl bg-linear-to-br from-[#E8B84B]/10 via-card to-card p-5 ring-1 ring-[#E8B84B]/20"},
    e("div",{className:"mb-1 flex items-center gap-2"}, e("span",{className:"grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"}, e(Icon,{n:ic, s:16})),
      e("h2",{className:"font-heading text-lg font-semibold"}, titulo)),
    e("p",{className:"mb-3 text-[13px] text-muted-foreground"}, sub), filhos);
}
function lista(itens){
  return e("ol",{className:"flex flex-col gap-2"}, itens.map(function(it,i){ return e("li",{key:i, className:"flex gap-2.5 text-sm leading-snug"},
    e("span",{className:MONO+" mt-px grid size-5 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold text-primary"}, i+1), e("span",null, it)); }));
}

function AbaRegrasReposicao(){
  return e(React.Fragment,null,
    e(PageHead,{t:"Regras de reposição e encomendas", sub:"Tudo em uma página: o que já foi definido e o que ainda falta alinhar com o setor."}),
    e("div",{className:"flex items-start gap-3 rounded-xl bg-warning/15 p-4 ring-1 ring-warning/40"},
      e(Icon,{n:"alert", s:18, className:"mt-0.5 shrink-0 text-warning"}),
      e("div",null, e("b",{className:"block text-[15px]"},"Reposição NÃO está disponível neste momento"),
        e("p",{className:"text-[13.5px] leading-snug"},"Decisão do Marcus (07/10/2026): não oferecer nem explicar reposição às revendedoras agora, senão muitas vão querer. Por isso o kit novo não fala de reposição. Primeiro as regras abaixo precisam ser alinhadas com o setor."))),
    e("div",{className:"grid grid-cols-1 items-start gap-4 xl:grid-cols-2"},
      bloco("Reposição: o que já temos","caminhao","Do checklist do kit novo. Ainda não vale na prática.",[
        e("div",{key:"l"}, lista([
          e("span",null,"Só pode pedir a partir do ", v(R.aPartirDoMes+"º mês"), "."),
          e("span",null,"Precisa ter vendido no mínimo ", v(reais(R.minVendido)), " para solicitar."),
          e("span",null,"Precisa vender pelo menos ", v(R.pctVendidoParaNaoBloquear+"% do valor da reposição"), "; senão fica bloqueada para novos pedidos."),
          e("span",null,"Cada reposição tem uma taxa de ", v(reais(R.taxa)), ".")]))]),
      bloco("Encomendas","cubos","Pedido de peças específicas depois do primeiro kit.",[
        e("div",{key:"l"}, lista([
          "A revendedora só pode encomendar depois de receber o primeiro kit.",
          "As regras, prazos e o contato das encomendas ainda precisam ser definidos."]))]),
      bloco("A alinhar","registro","Pontos em aberto. Conforme forem definidos, entram aqui.", [e("div",{key:"l"}, lista(REPOSICAO_A_ALINHAR))])));
}

export { AbaRegrasReposicao };
