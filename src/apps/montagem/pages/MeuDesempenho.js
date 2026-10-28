// Sorelly Admin · montagem — pages/MeuDesempenho.js
// Cada bipadora vê o PRÓPRIO desempenho e a PRÓPRIA comissão do mês, e as regras da comissão da bipagem. Nenhum dinheiro da empresa, nenhum total de outras pessoas.
// A Direção e a supervisão podem escolher de quem ver.
import { BIPADORAS } from "@/apps/montagem/domain/equipe";
import { resumoBipadora } from "@/apps/montagem/domain/regras";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

function AbaMeuDesempenho(){
  var s = use().state, minha = BIPADORAS.find(function(b){ return b.id===s.usuario; }), es = useState(minha ? minha.id : BIPADORAS[0].id), escolhida = es[0], setEscolhida = es[1];
  var b = BIPADORAS.find(function(x){ return x.id===(minha ? minha.id : escolhida); }), r = resumoBipadora(b, s), c = s.cfg;
  // a bipadora só vê o valor da PRÓPRIA comissão no último dia do mês (regra do Marcus, 27/10/2026); direção e supervisão veem sempre
  var hj = new Date(), fimDoMes = hj.getDate() === new Date(hj.getFullYear(), hj.getMonth()+1, 0).getDate(), vejoValor = !minha || fimDoMes, SEGREDO = "Só no fim do mês";
  var tile = function(t, v, cor, sub){ return e("div",{key:t, className:"flex flex-col items-center justify-center rounded-xl bg-card px-3 py-3 text-center ring-1 ring-[#E8B84B]/30"},
    e("b",{className:"font-mono text-[24px] leading-none", style:{color:cor}}, v), e("span",{className:"mt-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"}, t), sub && e("span",{className:"text-[11.5px] text-muted-foreground"}, sub)); };
  var regra = function(t, v){ return e("div",{key:t, className:"flex items-center justify-between gap-3 border-b border-white/10 py-2 text-[13.5px] last:border-b-0"}, e("span",null, t), e("b",{className:"font-mono text-[#F3D98B]"}, v)); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Meu desempenho", sub:minha ? "Como você está indo neste mês e a sua comissão. Só você vê os seus números." : "Desempenho e comissão de uma bipadora. Cada uma vê só a dela."},
      !minha && e("select",{value:escolhida, className:INPUT+" h-9! w-48", "aria-label":"Bipadora", onChange:function(ev){ setEscolhida(Number(ev.target.value)); }}, BIPADORAS.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6"},
      tile("Kits bipados no mês", r.total, "#F3D98B", r.hoje+" hoje"), tile("Kits normais", r.n, "#60A5FA"), tile("Kits especiais", r.e, "#C084FC"),
      tile("Peças faltando", r.faltas, r.faltas>0 ? "#F87171" : "#4ADE80", "descontam da comissão"), tile("Tempo médio por kit", r.tempo ? r.tempo+" min" : "—", "#F3D98B"), tile("Minha comissão do mês", vejoValor ? BK(r.liquido) : SEGREDO, "#4ADE80", vejoValor ? "já com os descontos" : "aparece no último dia do mês")),
    e("section",{className:"overflow-hidden rounded-2xl border border-[#E8B84B]/40 bg-card"},
      e("div",{className:"border-b border-border px-4 py-2.5"}, e("h2",{className:"font-heading text-[15px] font-bold"}, "Regras da minha comissão"), e("p",{className:"text-[12px] text-muted-foreground"}, "Como o valor é calculado. Quem muda esses números é a diretoria.")),
      e("div",{className:"flex flex-col px-4 py-1"},
        regra("Cada kit normal bipado", BK(c.valorBipNormal)), regra("Cada kit especial (valor do kit acima de "+BK(c.limiteBipEspecial)+")", BK(c.valorBipEspecial)),
        regra("Cada peça faltando ou errada desconta", BK(c.perdaFalta)), regra("O que você ganhou antes dos descontos", vejoValor ? BK(r.bruto) : SEGREDO), regra("Descontos por peça faltando", vejoValor ? "− "+BK(r.perda) : SEGREDO), regra("Sua comissão", vejoValor ? BK(r.liquido) : SEGREDO))));
}
export { AbaMeuDesempenho };
