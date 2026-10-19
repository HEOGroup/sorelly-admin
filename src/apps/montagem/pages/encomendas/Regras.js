// Sorelly Admin · montagem — pages/encomendas/Regras.js
// Encomendas e reposições → Regras e configuração: faixas de reposição (tabela editável), regras do expositor e do bloqueio, e os dois textos para copiar para o WhatsApp
// (gerados das regras, nunca fixos). Só a diretoria edita (domain/encomendas.js → podeConfigurar); os demais só leem.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, LINHA, Mosaico, Tab, Td } from "@/apps/montagem/components/padrao";
import { formatarReais, textoRegrasExpositor, textoRegrasReposicao } from "@/apps/montagem/domain/encomendas";
import { Bt, BtMini, copiar, useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Campo, Selo } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var CAMPO = INPUT+" w-full text-center";
var NUM = INPUT+" w-20 text-center";

function Texto(p){
  var st = useState(false);
  return e("div",{className:"flex flex-col gap-2 p-2.5"},
    e("pre",{className:"whitespace-pre-wrap break-words rounded-lg bg-black/30 p-2.5 text-left font-sans text-[12.5px] leading-snug text-white/90"}, p.texto),
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:st[0] ? "check" : "copy", onClick:function(){ if(copiar(p.texto)){ st[1](true); setTimeout(function(){ st[1](false); }, 2000); } }}, st[0] ? "Copiado" : "Copiar para o WhatsApp")));
}

function AbaErRegras(){
  var E = useEr(), cfg = E.cfg, pode = E.pode;
  var st = useState(function(){ return JSON.parse(JSON.stringify({faixas:cfg.faixas, expositor:cfg.expositor, bloqueio:cfg.bloqueio})); }), d = st[0];
  var mut = function(fn){ st[1](function(o){ var n = JSON.parse(JSON.stringify(o)); fn(n); return n; }); };
  var sujo = JSON.stringify(d)!==JSON.stringify({faixas:cfg.faixas, expositor:cfg.expositor, bloqueio:cfg.bloqueio});
  var salvar = function(){ E.exec("config_salvar", {config:d}); };
  var descartar = function(){ st[1](JSON.parse(JSON.stringify({faixas:cfg.faixas, expositor:cfg.expositor, bloqueio:cfg.bloqueio}))); };
  var din = function(val, onChange, rot){ return e(Dinheiro,{value:val, label:rot, disabled:!pode, className:"w-36", onChange:onChange}); };
  var faixas = e("div",{className:"flex flex-col gap-2 p-2.5"},
    e(Tab,{cols:["A partir da média", "Reposições por mês", "Limite por reposição", "Taxa", ""]}, d.faixas.map(function(f, i){
      return e("tr",{key:i, className:LINHA},
        e(Td,null, i===0 ? e("b",{className:"font-mono"}, formatarReais(0)) : din(f.de, function(x){ mut(function(n){ n.faixas[i].de = x; }); }, "A partir da média")),
        e(Td,null, e("input",{type:"number", min:0, step:1, disabled:!pode, value:f.qtd, onChange:function(ev){ mut(function(n){ n.faixas[i].qtd = Number(ev.target.value)||0; }); }, className:NUM})),
        e(Td,null, f.qtd>0 ? din(f.limite, function(x){ mut(function(n){ n.faixas[i].limite = x; }); }, "Limite") : "—"),
        e(Td,null, f.qtd>0 ? din(f.taxa, function(x){ mut(function(n){ n.faixas[i].taxa = x; }); }, "Taxa") : "—"),
        e(Td,null, i>0 && pode && e(BtMini,{ic:"trash", titulo:"Remover a faixa", onClick:function(){ mut(function(n){ n.faixas.splice(i, 1); }); }}, "Remover"))); })),
    pode && e("div",{className:"flex justify-center"}, e(Bt,{ic:"plus", onClick:function(){ mut(function(n){ var u = n.faixas[n.faixas.length-1]; n.faixas.push({de:(u ? u.de : 0)+500, qtd:u ? u.qtd : 1, limite:u ? u.limite : 0, taxa:u ? u.taxa : 0}); }); }}, "Adicionar faixa")));
  var expositor = e("div",{className:"grid grid-cols-1 gap-2 p-2.5"},
    e(Campo,{rot:"Média exigida nos 3 meses"}, din(d.expositor.media3m, function(x){ mut(function(n){ n.expositor.media3m = x; }); }, "Média exigida")),
    e(Campo,{rot:"Ou ao menos uma venda de"}, din(d.expositor.vendaMinima, function(x){ mut(function(n){ n.expositor.vendaMinima = x; }); }, "Venda mínima")),
    e(Campo,{rot:"Taxa de entrega"}, din(d.expositor.taxaEntrega, function(x){ mut(function(n){ n.expositor.taxaEntrega = x; }); }, "Taxa de entrega")),
    e("label",{className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-bold"}, e("input",{type:"checkbox", disabled:!pode, checked:!!d.expositor.exigeFoto, onChange:function(ev){ mut(function(n){ n.expositor.exigeFoto = ev.target.checked; }); }}), "Exigir foto do local para aprovar"));
  var bloqueio = e("div",{className:"grid grid-cols-1 gap-2 p-2.5 sm:grid-cols-2"},
    e(Campo,{rot:"Vendas mínimas (% da reposição)"}, e("input",{type:"number", min:0, max:100, disabled:!pode, value:d.bloqueio.pctMinimo, onChange:function(ev){ mut(function(n){ n.bloqueio.pctMinimo = Number(ev.target.value)||0; }); }, className:CAMPO})),
    e(Campo,{rot:"Meses de bloqueio"}, e("input",{type:"number", min:1, max:24, disabled:!pode, value:d.bloqueio.meses, onChange:function(ev){ mut(function(n){ n.bloqueio.meses = Number(ev.target.value)||0; }); }, className:CAMPO})));
  var aviso = !pode ? e("div",{className:"flex justify-center"}, e(Selo,{cor:"#FBBF24", ic:"lock-key"}, "Somente a diretoria altera as regras")) : null;
  return e("div",{className:"flex flex-col gap-2.5"},
    aviso,
    pode && sujo && e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-[#14B8A6]/15 px-3 py-2 ring-1 ring-[#14B8A6]/50"}, e("b",{className:"text-[12.5px]"}, "Há alterações não salvas"),
      e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:salvar}, "Salvar regras"), e(Bt,{ic:"x", onClick:descartar}, "Descartar")),
    e(BlocoBarra,{cor:"turquesa", t:"Faixas de reposição", sub:"Pela média de vendas dos últimos 3 meses.", compacto:true}, faixas),
    e(Mosaico,{min:"22rem"},
      e(BlocoBarra,{cor:"turquesa", t:"Expositor", compacto:true}, expositor),
      e(BlocoBarra,{cor:"turquesa", t:"Bloqueio de reposição", compacto:true}, bloqueio),
      e(BlocoBarra,{cor:"turquesa", t:"Texto da reposição", compacto:true}, e(Texto,{texto:textoRegrasReposicao(cfg)})),
      e(BlocoBarra,{cor:"turquesa", t:"Texto do expositor", compacto:true}, e(Texto,{texto:textoRegrasExpositor(cfg)}))));
}
export { AbaErRegras };
