// Sorelly Admin · montagem e bipagem — pages/Vendas.js (Análise de vendas)
//
// Quando a Calculadora de kits dá uma média acima do limite (cfg.limiteAnaliseVendas),
// fica obrigatório mandar a análise de vendas por print antes de liberar — a leitura
// do print continua na ferramenta separada (IA), aqui só acompanha quem já mandou e
// guarda o resumo por revendedora, pra juntar com as preferências na hora do kit.
import { listagemDe } from "@/apps/montagem/domain/regras";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI, Vazio } from "@/apps/montagem/ui/card";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TH, TR } from "@/apps/montagem/ui/table";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useRef, useState } from "@/shared/react";
import React from "react";

// Slot pra anexar 1 print (só nesta sessão — não vai pro localStorage, imagem é pesada demais pra isso).
// Serve pra ela ter os 3 prints juntos aqui enquanto escreve o resumo; a leitura pela IA continua na ferramenta à parte.
function SlotPrint(p){
  var inputRef = useRef(null);
  var onFile = function(ev){ var f = ev.target.files && ev.target.files[0]; if(!f) return;
    var reader = new FileReader(); reader.onload = function(){ p.onChange(reader.result); }; reader.readAsDataURL(f); };
  return e("div",{className:"relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30"},
    p.src
      ? e(React.Fragment,null,
          e("img",{src:p.src, className:"h-full w-full object-cover"}),
          e("button",{onClick:function(){p.onChange(null);}, title:"Remover", className:"absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"}, e(Icon,{n:"x", s:13})))
      : e("button",{onClick:function(){inputRef.current.click();}, className:"flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"},
          e(Icon,{n:"plus", s:16}), e("span",{className:"text-[11px]"},"Print "+p.n)),
    e("input",{ref:inputRef, type:"file", accept:"image/*", className:"hidden", onChange:onFile}));
}
function LinhaPendente(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, l = listagemDe(s, k);
  var rs = useState(""), resumo = rs[0], setResumo = rs[1], ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var ps = useState([null,null,null]), prints = ps[0], setPrints = ps[1];
  var setPrint = function(i, v){ var o = prints.slice(); o[i] = v; setPrints(o); };
  return e(React.Fragment,null,
    e("tr",{className:TR},
      e(TD,{className:"font-medium"}, k.rev, e("p",{className:"text-[12px] font-normal text-muted-foreground"}, k.bairro)),
      e(TD,null, l ? l.rep+" · "+l.horario : "—"),
      e(TD,{className:MONO+" text-primary font-semibold"}, BK(k.analiseVendas.media)),
      e(TD,null, e("button",{onClick:function(){setAberto(!aberto);}, className:"text-[13px] font-semibold text-primary hover:underline"}, aberto?"Fechar":"Registrar")) ),
    aberto && e("tr",null, e("td",{colSpan:4, className:"bg-muted/30 px-4 py-3"},
      e("div",{className:"flex flex-col gap-3"},
        e("div",null,
          e("label",{className:"mb-1.5 block text-[12.5px] font-semibold text-muted-foreground"},"Anexe os 3 prints da DevMaster (só de referência aqui, a leitura é na ferramenta à parte)"),
          e("div",{className:"grid grid-cols-3 gap-2"}, [0,1,2].map(function(i){ return e(SlotPrint,{key:i, n:i+1, src:prints[i], onChange:function(v){setPrint(i,v);}}); }))),
        e("label",{className:"text-[12.5px] font-semibold text-muted-foreground"},"Cole aqui o resumo gerado na ferramenta de análise (print + IA)"),
        e("textarea",{value:resumo, onChange:function(ev){setResumo(ev.target.value);}, rows:4, placeholder:"KIT "+k.rev.toUpperCase()+" — ... anéis, brincos, ouro/prata ...",
          className:INPUT+" text-[13px]! font-mono!"}),
        e("div",{className:"flex justify-end"},
          e(Btn,{v:"primary", sm:true, ic:"check", disabled:!resumo.trim(), onClick:function(){
            d({type:"ANALISE_VENDAS_ENVIADA", id:k.id, por:s.usuario, resumo:resumo.trim()}); setAberto(false); }},"Marcar como enviada"))))));
}
function AbaVendasVendas(){
  var cx = use(), s = cx.state;
  var pendentes = s.kits.filter(function(k){ return k.analiseVendas && k.analiseVendas.obrigatoria && !k.analiseVendas.enviada; });
  var enviadas = s.kits.filter(function(k){ return k.analiseVendas && k.analiseVendas.enviada; });
  return e(React.Fragment,null,
    e(PageHead,{t:"Análise de vendas", sub:"Kits com média acima de "+BK(s.cfg.limiteAnaliseVendas)+" precisam da análise de vendas por print antes de liberar. A leitura do print continua na ferramenta à parte; aqui é só o controle de quem já mandou."}),
    e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-3"},
      e(KPI,{l:"Aguardando análise", v:pendentes.length, tom:pendentes.length?"text-warning":""}),
      e(KPI,{l:"Já enviadas", v:enviadas.length, tom:"text-success"}),
      e(KPI,{l:"Limite da obrigatoriedade", v:BK(s.cfg.limiteAnaliseVendas)})),
    e("div",{className:"rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-[13px]"},
      e("b",{className:"text-primary"},"Como funciona hoje: "), "clica em Registrar, anexa os 3 prints da DevMaster (fica só aqui, de referência) e sobe eles também na ferramenta de análise (IA) à parte — ela lê e gera o resumo, que a Deysiane cola aqui. Quando a DevMaster liberar a API de vendas, essa etapa vira automática."),
    e("div",{className:"overflow-hidden rounded-xl border border-border bg-card"},
      e("table",{className:"w-full border-collapse text-sm"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, e(TH,null,"Revendedora"), e(TH,null,"Representante"), e(TH,null,"Média"), e(TH,null,"Ação"))),
        e("tbody",null, pendentes.length===0
          ? e("tr",null, e("td",{colSpan:4, className:"p-0"}, e(Vazio,{txt:"Nenhuma revendedora aguardando análise de vendas."})))
          : pendentes.map(function(k){ return e(LinhaPendente,{key:k.id, k:k}); })))));
}

export { AbaVendasVendas };
