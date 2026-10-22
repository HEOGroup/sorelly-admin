// Sorelly Admin · montagem — pages/Emprestimos.js
// Financeiro → Contas a pagar → Empréstimos: um empréstimo por linha (parcelas pagas e a pagar vindas do DevMaster) e, ao abrir, os dados do contrato (o Marcus passa os contratos).
// Vindo da tela Contas a pagar, o empréstimo clicado já chega aberto (s.emp.aberto). Dados do contrato ficam em s.emp.contratos (só neste navegador).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td, LINHA, ESTADO } from "@/apps/montagem/components/padrao";
import { ehFam, itensEmpresa } from "@/apps/montagem/domain/contas-empresa";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, Fragment, useState } from "@/shared/react";

var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var CAMPOS = [["banco", "Banco"], ["contrato", "Nº do contrato"], ["valor", "Valor contratado (R$)"], ["parcelas", "Nº de parcelas"], ["taxa", "Taxa (% ao mês)"], ["inicio", "Primeira parcela"], ["fim", "Última parcela"], ["garantia", "Garantia"]];

function lista(){
  var por = {};
  itensEmpresa().forEach(function(i){
    var emp = /^6\.01/.test(i.nat) || /FINANCIAMENTO|EMPR[ÉE]STIMO/i.test(i.natNome+" "+i.nome);
    if(!emp) return;
    var k = /^6\.01/.test(i.nat) ? i.natNome : i.nome, g = por[k] = por[k] || {chave:k, nome:k, itens:[], fam:ehFam(i)};
    g.itens.push(i);
  });
  return Object.keys(por).map(function(k){
    var g = por[k], pagos = g.itens.filter(function(i){ return i.status==="pago"; }), abertos = g.itens.filter(function(i){ return i.status!=="pago"; }).sort(function(a, b){ return a.venc.localeCompare(b.venc); });
    return Object.assign(g, {nPago:pagos.length, nAberto:abertos.length, pago:r2(pagos.reduce(function(t, i){ return t+i.valor; }, 0)), aberto:r2(abertos.reduce(function(t, i){ return t+i.valor; }, 0)), prox:abertos[0] || null, parcela:(abertos[0] || pagos[pagos.length-1] || {}).valor || 0});
  }).sort(function(a, b){ return (b.pago+b.aberto)-(a.pago+a.aberto); });
}

export function AbaEmprestimos(){
  var cx = use(), emp = cx.state.emp || {}, contratos = emp.contratos || {}, ls = lista(), sa = useState(emp.aberto || ""), aberto = sa[0], setAberto = sa[1];
  var tot = function(c){ return r2(ls.reduce(function(t, x){ return t+x[c]; }, 0)); };
  var set = function(chave, patch){ cx.dispatch({type:"EMP_SET", chave:chave, patch:patch}); };
  if(!ls.length) return e(Pagina,null, e(PageHead,{t:"Empréstimos", sub:"Contratos e parcelas"}), e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px]"}, "Nenhum empréstimo encontrado nas contas."));
  return e(Pagina,null,
    e(PageHead,{t:"Empréstimos", sub:"Parcelas pagas e a pagar de cada empréstimo e financiamento; abra um para ver as parcelas e o contrato"}),
    e(Faixa,{n:4}, e(Indicador,{normal:true, t:"Empréstimos", v:String(ls.length), cor:"info", sub:ls.filter(function(x){ return x.fam; }).length+" da família"}), e(Indicador,{normal:true, t:"Já pago", v:BK(tot("pago")), cor:"ok"}), e(Indicador,{normal:true, t:"Falta pagar", v:BK(tot("aberto")), cor:"alerta"}), e(Indicador,{normal:true, t:"Total", v:BK(tot("pago")+tot("aberto")), cor:"total"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Empréstimos e financiamentos", dir:BK(tot("aberto"))}, e("div",{className:"p-2"},
      e(Tab,{normal:true, cols:["Empréstimo", "De quem", "Parcelas pagas", "Parcelas a pagar", "Já pago", "Falta pagar", "Parcela", "Próximo vencimento"]}, ls.map(function(x){
        var ab = aberto===x.chave, ct = contratos[x.chave] || {};
        return [e("tr",{key:x.chave, className:LINHA+" cursor-pointer hover:bg-white/5", onClick:function(){ setAberto(ab ? "" : x.chave); }},
          e(Td,{forte:true, className:"text-left"}, (ab ? "▲ " : "▾ ")+x.nome), e(Td,null, x.fam ? "Família" : "Sorelly"), e(Td,null, x.nPago), e(Td,null, x.nAberto), e(Td,{dinheiro:true, cor:"ok"}, BK(x.pago)), e(Td,{dinheiro:true, cor:x.aberto>0 ? "alerta" : undefined}, BK(x.aberto)), e(Td,{dinheiro:true}, BK(x.parcela)), e(Td,null, x.prox ? br(x.prox.venc) : "—"))]
          .concat(ab ? [e("tr",{key:x.chave+"|d"}, e("td",{colSpan:8, className:"bg-black/30 p-3"},
            e("div",{className:"mb-2 text-[12.5px] font-bold text-white"}, "Dados do contrato"),
            e("div",{className:"mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4"}, CAMPOS.map(function(c){ return e("label",{key:c[0], className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11.5px] font-semibold text-white/70"}, c[1]), e("input",{key:c[0]+(ct[c[0]]||""), defaultValue:ct[c[0]]||"", className:INPUT+" h-8! w-full text-[12.5px]!", onBlur:function(ev){ if(ev.target.value!==(ct[c[0]]||"")){ var p = {}; p[c[0]] = ev.target.value; set(x.chave, p); } }})); })),
            e("div",{className:"mb-1 text-[12.5px] font-bold text-white"}, "Parcelas"),
            e("div",{className:"flex flex-wrap gap-1.5"}, x.itens.slice().sort(function(a, b){ return a.venc.localeCompare(b.venc); }).map(function(i){ var pg = i.status==="pago"; return e("span",{key:i.id, className:"rounded-lg px-2.5 py-1 text-[12px] font-semibold", style:{background:(pg ? ESTADO.ok : i.atraso>0 ? ESTADO.ruim : ESTADO.alerta)+"26", color:pg ? ESTADO.ok : i.atraso>0 ? ESTADO.ruim : ESTADO.alerta}}, br(i.venc)+" · "+BK(i.valor)+(pg ? " · paga" : i.atraso>0 ? " · atrasada" : "")); }))))] : []);
      })))));
}
