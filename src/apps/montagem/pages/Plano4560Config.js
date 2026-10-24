// Sorelly Admin · montagem — pages/Plano4560Config.js
// Seção "Plano 45/60" do Configurador geral (Tecnologia): parâmetros do plano em um lugar só. Só a Diretoria muda; a regra vale na hora. Lógica em domain/plano45-60.js (ação P45 op "config").
import { BlocoFiltros, Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { podeAprovar } from "@/apps/montagem/domain/plano45-60";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

function Num(p){
  return e("div",{className:"min-w-0"}, e(Rotulo,{t:p.t, id:p.id}),
    e("input",{id:p.id, inputMode:"numeric", value:p.value, disabled:p.disabled, onChange:function(ev){ p.onChange(ev.target.value.replace(/\D/g, "").slice(0, 6)); }, className:CAMPO+" text-right tabular-nums"}));
}

function ConfigPlano4560(){
  var cx = use(), s = cx.state, cfg = s.p45.config, pode = podeAprovar(s.usuario);
  var ini = function(){ return {mediaAcerto:String(cfg.mediaAcerto), minimoPorRep:String(cfg.minimoPorRep), janelaIni:String(cfg.janelaIni), janelaFim:String(cfg.janelaFim), teto:String(cfg.teto), crescimentoMin:String(cfg.crescimentoMin), diasLivres:String(cfg.diasLivres),
    r45:String(cfg.minimos.representante[45]), r60:String(cfg.minimos.representante[60]), s45:String(cfg.minimos.sorelly[45]), s60:String(cfg.minimos.sorelly[60])}; };
  var st = useState(ini), f = st[0], set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var salvar = function(){ cx.dispatch({type:"P45", op:"config", por:nomeDe(s.usuario), dados:{mediaAcerto:f.mediaAcerto, minimoPorRep:f.minimoPorRep, janelaIni:f.janelaIni, janelaFim:f.janelaFim, teto:f.teto, crescimentoMin:f.crescimentoMin, diasLivres:f.diasLivres,
    minimos:{representante:{45:f.r45, 60:f.r60}, sorelly:{45:f.s45, 60:f.s60}}}}); };
  var campo = function(k, t, id){ return e(Num,{t:t, id:id, value:f[k], disabled:!pode, onChange:function(v){ set(k, v); }}); };
  return e("div",{className:"flex flex-col gap-2.5"},
    !pode && e("p",{className:"rounded-lg border border-border bg-card/60 px-3 py-2 text-[13px]"}, "Só a Diretoria muda estes valores."),
    e(BlocoFiltros,{titulo:"Mínimo de vendas sugerido (R$)"},
      campo("r45", "Representante 45 dias", "p45cr45"), campo("r60", "Representante 60 dias", "p45cr60"), campo("s45", "Sorelly 45 dias", "p45cs45"), campo("s60", "Sorelly 60 dias", "p45cs60")),
    e(BlocoFiltros,{titulo:"Regras do plano"},
      campo("diasLivres", "Dias livres do pedido", "p45cdl"), campo("mediaAcerto", "Média por acerto (R$)", "p45cma"), campo("minimoPorRep", "Mínimo de indicadas", "p45cmr"), campo("teto", "Teto de revendedoras", "p45cte"),
      campo("janelaIni", "Janela: dia inicial", "p45cji"), campo("janelaFim", "Janela: dia final", "p45cjf"), campo("crescimentoMin", "Crescimento mínimo (%)", "p45ccm")),
    pode && e("div",{className:"flex justify-end"}, e(Botao,{principal:true, onClick:salvar}, "Salvar")),
    e("p",{className:"text-[12px] text-foreground/80"}, "Dias livres: a representante muda a data do acerto sem autorização até esse número de dias depois da data atual; além disso o pedido vai para aprovação e, sem ela, vale a multa de remarcação. O mínimo é só sugestão: a Diretoria fixa o valor final na aprovação."));
}

export { ConfigPlano4560 };
