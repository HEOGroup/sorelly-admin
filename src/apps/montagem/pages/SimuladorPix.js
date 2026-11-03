// Sorelly Admin · montagem — pages/SimuladorPix.js
// Orientação do caixa (02/11/2026, Marcus): quem precisa de Pix primeiro, juntando saldo, limite, contas negativas e a folha dos próximos dias (domain/orientacao-pix.js).
// Aparece na aba Contas das representantes (Pagamentos → Regras e contas). Quem decide continua sendo o Lucas. (O "testar uma situação" saiu em 03/11/2026.)
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { ESTADO } from "@/apps/montagem/components/padrao";
import { e } from "@/shared/react";

var R = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var RS = function(n){ return (n<0 ? "−" : "")+R(Math.abs(n)); };
var dm = function(iso){ return iso ? iso.split("-").reverse().slice(0, 2).join("/") : ""; };

function Orientacao(p){
  var o = p.o;
  if(!o) return e(BlocoBarra,{cor:"azul", t:"Orientação do caixa", compacto:true}, e("p",{className:"p-3 text-center text-[13px]"}, "Ainda não há saldo lançado. Lance os saldos em Saldos bancários para ver a orientação."));
  return e(BlocoBarra,{cor:"azul", t:"Orientação do caixa", sub:"Saldo de "+dm(o.dataSaldo)+" · folha e contas até "+dm(o.ate)+" · mande o Pix primeiro para quem está no alto da lista", compacto:true},
    e("div",{className:"flex flex-col gap-2 p-3"},
      o.semPrevisao && e("p",{className:"text-center text-[13px]"}, "Sem a previsão de contas a pagar neste computador: a lista usa só o saldo de hoje."),
      e("div",{className:"flex flex-col gap-1"}, o.frases.map(function(fr){ return e("p",{key:fr.id, className:"rounded-lg bg-black/25 px-3 py-1.5 text-center text-[13px]", style:fr.grave ? {boxShadow:"inset 0 0 0 1px "+ESTADO.ruim} : undefined}, e("b",null, fr.pos+"º  "), fr.texto); })),
      e(GradeFiltro,{chave:"pixcaixa", rows:o.cnpjs, cols:[
        {k:"pos", t:"Ordem", tipo:"num", forte:true, v:function(c){ return c.pos; }, exib:function(c){ return c.pos+"º"; }},
        {k:"cnpj", t:"CNPJ", v:function(c){ return c.nome; }},
        {k:"saldo", t:"Saldo hoje", tipo:"num", v:function(c){ return c.saldo; }, exib:function(c){ return RS(c.saldo); }, cor:function(c){ return c.saldo<0 ? "text-red-400" : "text-green-400"; }},
        {k:"limite", t:"Limite", tipo:"num", v:function(c){ return c.limite; }, exib:function(c){ return R(c.limite); }},
        {k:"folga", t:"Folga", tipo:"num", v:function(c){ return c.folga; }, exib:function(c){ return RS(c.folga); }, cor:function(c){ return c.folga<0 ? "text-red-400" : ""; }},
        {k:"pior", t:"Pior saldo", tipo:"num", v:function(c){ return c.pior; }, exib:function(c){ return RS(c.pior); }, cor:function(c){ return c.pior<0 ? "text-red-400" : ""; }},
        {k:"dia", t:"Dia do pior", v:function(c){ return dm(c.piorDia); }},
        {k:"folha", t:"Folha", tipo:"num", v:function(c){ return c.folha; }, exib:function(c){ return c.folha>0 ? R(c.folha) : "Sem folha"; }},
        {k:"sit", t:"Situação", forte:true, v:function(c){ return c.estoura ? "Vai passar do limite" : c.faltaFolha>0 ? "Folha não cabe" : c.negativa ? "Negativo" : "Folgado"; }, cor:function(c){ return c.estoura || c.faltaFolha>0 ? "text-red-400" : c.negativa ? "text-yellow-400" : "text-green-400"; }}]}),
      o.negativas.length>0 && e("div",{className:"flex flex-col gap-1"},
        e("p",{className:"text-center text-[11px] font-semibold"}, "Contas negativas hoje"),
        e(GradeFiltro,{chave:"pixneg", rows:o.negativas, cols:[
          {k:"conta", t:"Conta", v:function(n){ return n.nome; }},
          {k:"saldo", t:"Saldo", tipo:"num", v:function(n){ return n.saldo; }, exib:function(n){ return RS(n.saldo); }, cor:function(){ return "text-red-400"; }},
          {k:"limite", t:"Limite", tipo:"num", v:function(n){ return n.limite; }, exib:function(n){ return R(n.limite); }},
          {k:"folga", t:"Folga", tipo:"num", v:function(n){ return n.folga; }, exib:function(n){ return RS(n.folga); }, cor:function(n){ return n.folga<0 ? "text-red-400" : "text-yellow-400"; }}]})),
      o.folha.itens.length>0 && e("div",{className:"flex flex-col gap-1"},
        e("p",{className:"text-center text-[11px] font-semibold"}, "Folha e encargos até "+dm(o.ate)+" · total "+R(o.folha.total)),
        e(GradeFiltro,{chave:"pixfolha", rows:o.folha.itens, cols:[
          {k:"venc", t:"Vence", v:function(i){ return i.venc; }, exib:function(i){ return dm(i.venc); }},
          {k:"cnpj", t:"CNPJ", v:function(i){ return i.filial==="fora" ? "Por fora" : i.filial; }},
          {k:"nome", t:"Título", v:function(i){ return i.nome; }},
          {k:"valor", t:"Valor", tipo:"num", v:function(i){ return i.valor; }, exib:function(i){ return R(i.valor); }}]}))));
}

export { Orientacao };
