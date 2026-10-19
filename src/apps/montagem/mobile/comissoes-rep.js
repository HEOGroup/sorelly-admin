// Sorelly Admin · app da representante — mobile/comissoes-rep.js
// Tela "Comissões" da representante: só as comissões DELA, em tempo real. Mesmo visual da aba Listagens do app: blocos claros com dourado, sem cores berrantes.
//   · Cartão do mês (dourado claro): comissão do mês, confirmado e previsto.
//   · Meses de pagamento → "Dia 11/10" (dropdown) → atendimentos daquele pagamento, a linha de total e o km.
//   · COMBUSTÍVEL: ela informa só o KM TOTAL DO PERÍODO, em cada data de pagamento, até o corte (13h do dia anterior). Sem km no prazo, paga só o valor fixo do Configurador.
//   · Aba "Entrega na empresa": ela abre junto com a funcionária e marca o que entregou (dinheiro e condicionais).
import { FORMA_LABEL } from "@/apps/montagem/domain/consignado";
import { chaveFech, comisEfetiva, datasDoMes, fmtDataBR, grupoDaRep, itensComissao, janelaDe, pctDaRep, resumoSituacao } from "@/apps/montagem/domain/comissoes";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { codigoDinheiro } from "@/apps/montagem/domain/dinheiro";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+"/"+p[0]; };
var quando = function(ts){ return new Date(ts).toLocaleString("pt-BR",{day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}); };
var dm = function(iso){ return fmtDataBR(iso).slice(0,5); };
// mesmos tons da aba Listagens: cartão branco com borda dourada clara, cabeçalho em dourado claro, textos escuros, valores em dourado
var CARD = "overflow-hidden rounded-2xl border border-[#E9DDBB] bg-white";
var OURO_CLARO = {background:"linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)"};
var BTN = "h-10 rounded-xl px-4 text-[13px] font-bold bg-[#C9A13B] txt-branco disabled:opacity-40";

// Quilometragem de uma data: só o total do período, até o corte
function Km(p){
  var rs = p.rs, d = p.d, key = chaveFech(p.data, p.rep);
  var st = useState(rs.kmTotal ? String(rs.kmTotal) : ""), v = st[0], setV = st[1];
  var km = parseFloat(String(v).replace(",","."))||0, travado = rs.aposCorte;
  return e("div",{className:"flex flex-col gap-1.5 border-t border-[#E9DDBB] px-3 py-2.5"},
    e("div",{className:"flex items-center justify-between gap-2"},
      e("b",{className:"text-[12.5px] text-[#111827]"},"Km total do período"),
      e("span",{className:"text-[11px] "+(travado ? "text-[#B91C1C]" : "text-[#9A8B63]")}, travado ? "Prazo encerrado" : "Até "+quando(rs.corte))),
    !travado && e("div",{className:"flex items-center gap-2"},
      e("input",{type:"number", inputMode:"decimal", min:0, step:"0.1", value:v, placeholder:"Ex.: 110", "aria-label":"Quilometragem total do período", onChange:function(ev){ setV(ev.target.value); },
        className:"h-10 min-w-0 flex-1 rounded-xl bg-white px-3 text-center text-sm text-[#111827] outline-none ring-1 ring-[#E9DDBB] placeholder:text-[#9CA3AF]"}),
      e("button",{disabled:!(km>0) || km===rs.kmTotal, onClick:function(){ d({type:"COMIS_FECH", key:key, patch:{km:km, kmPor:"rep", kmTs:new Date().toISOString(), kmModo:"total"}}); }, className:BTN}, rs.kmTotal ? "Atualizar" : "Enviar")),
    e("p",{className:"text-[11px] leading-snug text-[#6B7280]"},
      rs.combFixo ? "Sem km no prazo: o combustível pago é só o valor fixo de "+BK(rs.comb)+"."
      : rs.km>0 ? "✓ "+rs.km+" km enviados"+(rs.kmTs ? " em "+quando(rs.kmTs) : "")+(rs.preco>0 ? " · combustível "+BK(rs.comb) : " · o valor sai quando o financeiro atualizar a gasolina")+"."
      : "Sem o km até o prazo, o combustível é pago só pelo valor fixo ("+BK(p.fixo)+")."));
}

// Uma data de pagamento (dropdown)
function Situacao(p){
  var rs = p.rs, ab = p.aberta, c = p.c, jan = janelaDe(c, grupoDaRep(c, p.rep), p.data);
  var status = rs.paga ? "Paga" : rs.itens.length===0 ? "Sem atendimentos" : "a pagar";
  return e("div",{className:CARD},
    e("button",{onClick:p.alt, "aria-expanded":ab, className:"flex w-full items-center gap-2 px-3 py-2.5 text-left", style:ab ? OURO_CLARO : undefined},
      e("span",{className:"text-[#A67C12]"}, e(Icon,{n:ab ? "chevrondown" : "chevron", s:14})),
      e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13.5px] text-[#111827]"},"Dia "+dm(p.data)), e("span",{className:"block truncate text-[11px] text-[#9A8B63]"},"atendimentos "+dm(jan.ini)+" a "+dm(jan.fim))),
      e("span",{className:"text-right"}, e("b",{className:MONO+" block text-[13px] text-[#A67C12]"}, BK(rs.comissaoTotal)), e("span",{className:"block text-[10.5px] text-[#6B7280]"}, status))),
    ab && e("div",{className:"flex flex-col"},
      rs.itens.length>0 ? rs.itens.slice().sort(function(a,b){ return a.r.data.localeCompare(b.r.data); }).map(function(it){
        var direto = !!it.pixRep, forma = it.forma ? (FORMA_LABEL[it.forma] || it.forma) : (it.tipo==="kitnovo" ? "Kit novo" : it.tipo==="repos" ? "Reposição" : "");
        // 2 etapas que a representante acompanha: o agendamento receber (✓ Agend.) e o financeiro confirmar (✓ Finan.)
        var etapa = function(ok, nome){ return e("span",{className:"font-semibold "+(ok ? "text-[#15803D]" : "text-[#B45309]")}, (ok ? "✓ " : "○ ")+nome); };
        return e("div",{key:it.id, className:"flex flex-col gap-0.5 border-t border-[#E9DDBB] px-3 py-2"},
          e("div",{className:"flex items-baseline justify-between gap-2"}, e("p",{className:"min-w-0 flex-1 truncate text-[13px] font-semibold text-[#111827]"}, it.rev),
            e("b",{className:MONO+" shrink-0 text-[13px] "+(it.confirmado || direto ? "text-[#15803D]" : "text-[#A67C12]")}, BK(direto ? it.valorPago : it.comissao))),
          e("div",{className:"flex items-baseline justify-between gap-2 text-[11px] text-[#6B7280]"},
            e("span",{className:"min-w-0 truncate"}, dm(it.data)+(forma ? " · "+forma : "")+(it.valorPago>0 ? " · pagou "+BK(it.valorPago) : "")),
            e("span",{className:"shrink-0 font-semibold "+(it.confirmado || direto ? "text-[#15803D]" : "text-[#B45309]")}, direto ? "pago direto" : it.confirmado ? "confirmada" : "pendente")),
          !direto && e("div",{className:"flex flex-wrap items-center gap-x-3 text-[10.5px]"}, etapa(it.conferido, "Agendamento"), etapa(!!it.fin, "Financeiro"),
            it.conferido && !it.confirmado && it.motivo && e("span",{className:"text-[#B45309]"}, it.motivo)));
      }) : e("p",{className:"border-t border-[#E9DDBB] px-3 py-2.5 text-[12px] text-[#6B7280]"},"Nenhuma comissão neste pagamento ainda."),
      e(Km,{rs:rs, d:p.d, rep:p.rep, data:p.data, fixo:p.fixo})));
}

// Entrega na empresa: a representante abre junto com a funcionária e vai marcando o que entregou (dinheiro e condicionais), como na retirada de kits
function EntregaEmpresa(p){
  var s = p.s, d = p.d, rep = p.rep;
  var lista = (s.acertosConsignado||[]).filter(function(r){ return r.origem!=="interno" && r.rep===rep && (r.tipo==="acerto" || r.tipo==="kit_novo_entrega"); })
    .sort(function(a,b){ return (b.data+(b.hora||"")).localeCompare(a.data+(a.hora||"")); });
  var pend = lista.filter(function(r){ return !(r.recebimento && r.recebimento.ok); }), feitos = lista.filter(function(r){ return r.recebimento && r.recebimento.ok; }).slice(0,4);
  var marca = function(r, campo, ligar){ var rec = r.recebimento || {}, rp = Object.assign({}, rec.rep || {}); rp[campo] = ligar ? {ok:true, ts:new Date().toISOString()} : {ok:false};
    d({type:"CONSREP_RECEBER", id:r.id, patch:{rep:rp}}); };
  var linha = function(titulo, sub, feito, onClick, desab, feitoTxt){ return e("div",{className:"flex items-center gap-2 border-t border-[#E9DDBB] px-3 py-2"},
    e("div",{className:"min-w-0 flex-1"}, e("p",{className:"truncate text-[13px] text-[#111827]"}, titulo), e("p",{className:"truncate text-[11px] text-[#9A8B63]"}, sub)),
    e("button",{onClick:onClick, disabled:desab, className:"h-9 shrink-0 rounded-xl px-3 text-[12px] font-bold disabled:opacity-60 "+(feito ? "bg-white text-[#A67C12] ring-1 ring-[#C9A13B]" : "bg-[#C9A13B] txt-branco")}, feito ? "✓ "+(feitoTxt||"Entreguei") : "Entreguei")); };
  var card = function(r){
    var rec = r.recebimento || {}, rp = rec.rep || {}, din = rec.din || {}, conf = !!rec.ok;
    var dinTot = Math.round((r.pagamentos||[]).filter(function(x){ return x.forma==="dinheiro"; }).reduce(function(t,x){ return t+(x.valor||0); }, 0)*100)/100;
    var nums = rec.condNums || r.condicionaisSelecionadas || [], kitNovo = r.tipo==="kit_novo_entrega";
    var diverge = din.ok && din.contado!=null && Math.abs(din.contado-dinTot)>0.009;
    return e("div",{key:r.id, className:CARD},
      e("div",{className:"flex items-center justify-between gap-2 px-3 py-2.5", style:OURO_CLARO},
        e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[13.5px] text-[#111827]"}, r.rev), e("span",{className:"block text-[11px] text-[#9A8B63]"}, dm(r.data)+" · "+(kitNovo ? "Kit novo" : "Acerto"))),
        e("span",{className:"shrink-0 text-[11px] font-semibold text-[#6B7280]"}, conf ? "✓ Conferido" : rec.inicioTs ? "Funcionária conferindo" : "Aguardando")),
      dinTot>0 && linha("Dinheiro "+BK(dinTot), din.ok ? "Empresa: ✓ recebeu"+(diverge ? " "+BK(din.contado) : "") : "Código para a funcionária digitar: "+codigoDinheiro("R"+r.id, 1), !!(rp.din && rp.din.ok), function(){ marca(r, "din", !(rp.din && rp.din.ok)); }, conf, "Entreguei o dinheiro"),
      diverge && e("p",{className:"border-t border-[#E9DDBB] bg-[#FEF2F2] px-3 py-2 text-[11.5px] font-semibold leading-snug text-[#B91C1C]"},"Divergência: você lançou "+BK(dinTot)+" e a empresa contou "+BK(din.contado)+". A diferença de "+BK(dinTot-din.contado)+" ficou em aberto."),
      (kitNovo || nums.length>0) && linha("Condicionais"+(nums.length ? " · "+nums.join(", ") : ""), rec.prom && rec.prom.ok ? "Empresa: ✓ assinatura confirmada" : "Empresa: assinatura ainda não confirmada", !!(rp.cond && rp.cond.ok), function(){ marca(r, "cond", !(rp.cond && rp.cond.ok)); }, conf, "Entreguei as condicionais"),
      dinTot<=0 && !(kitNovo || nums.length>0) && e("p",{className:"border-t border-[#E9DDBB] px-3 py-2 text-[11.5px] text-[#6B7280]"},"Nada a entregar neste atendimento."));
  };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"px-1 text-[11.5px] leading-snug text-[#8E8E93]"},"Abra esta tela junto com a funcionária da empresa e vá marcando o que você entregou. Quando os dois lados marcam, o atendimento fica conferido."),
    pend.length===0 ? e("p",{className:"rounded-2xl bg-[#1C1C1E] p-3 text-center text-[12px] text-[#8E8E93]"},"Nada pendente de entrega.") : pend.map(card),
    feitos.length>0 && e("p",{className:"px-1 pt-1 text-[10.5px] font-bold uppercase tracking-wide text-[#8E8E93]"},"Últimos conferidos"), feitos.map(card));
}

function ComissoesRep(p){
  var s = p.s, d = p.d, rep = p.l.rep, c = comisEfetiva(s), agora = Date.now(), mesAtual = isoDia(new Date(agora)).slice(0,7);
  var ms = useState(mesAtual), mesVenda = ms[0], setMesVenda = ms[1];            // mês dos atendimentos (cartão de cima)
  var am = useState(undefined), aMes = am[0], setAMes = am[1];                    // dropdown: um mês de pagamento aberto por vez
  var as = useState(undefined), aSit = as[0], setASit = as[1];                    // dropdown: uma data aberta por vez
  var tb = useState("com"), aba = tb[0], setAba = tb[1];                           // "com" = comissões · "entrega" = entrega na empresa
  var itens = itensComissao(c, s, agora), g = grupoDaRep(c, rep);
  var meus = itens.filter(function(i){ return i.dest===rep && !i.pixRep; });     // o Pix direto não é comissão: já entra como pago
  var atend = (s.acertosConsignado||[]).filter(function(r){ return r.origem!=="interno" && r.rep===rep; });
  var mesesVenda = atend.map(function(r){ return (r.data||"").slice(0,7); }).concat([mesAtual]).filter(function(m,i,a){ return m && a.indexOf(m)===i; }).sort().reverse();
  var doMes = meus.filter(function(i){ return (i.data||"").slice(0,7)===mesVenda; });
  var nAtend = atend.filter(function(r){ return (r.data||"").slice(0,7)===mesVenda; }).length;
  var total = doMes.reduce(function(t,i){ return t+i.comissao; }, 0), conf = doMes.filter(function(i){ return i.confirmado; }).reduce(function(t,i){ return t+i.comissao; }, 0);

  // pagamentos que o financeiro não conseguiu identificar: a representante é avisada aqui e manda o comprovante
  var naoIdent = []; atend.forEach(function(r){ Object.keys(r.divs||{}).forEach(function(i){ if(r.divs[i].tipo==="nao_ident" && !(r.fin && r.fin[i])){ var pg = (r.pagamentos||[])[i]||{}; naoIdent.push({rev:r.rev, data:r.data, valor:pg.valor||0}); } }); });

  // meses de pagamento + as 3 datas de cada um
  var meses = {}; meses[mesAtual] = true; itens.filter(function(i){ return i.dest===rep; }).forEach(function(i){ meses[i.dataRem.slice(0,7)] = true; });
  var dados = Object.keys(meses).sort().reverse().map(function(m){
    var rss = datasDoMes(c, g, m).map(function(dt){ return {data:dt, rs:resumoSituacao(c, itens, rep, dt, agora)}; });
    var som = function(f){ return Math.round(rss.reduce(function(a,x){ return a+f(x.rs); }, 0)*100)/100; };
    var com = som(function(r){ return r.comissaoTotal; }), comb = som(function(r){ return r.comb; }), pagos = som(function(r){ return r.pagos; });
    return {mes:m, datas:rss, com:com, comb:comb, pagar:Math.round((com+comb)*100)/100, pagos:pagos, falta:Math.max(0, Math.round((com+comb-pagos)*100)/100)}; });
  var mesAberto = aMes!==undefined ? aMes : mesAtual;
  var sitPadrao = (function(){ var cur = dados.find(function(m){ return m.mes===mesAberto; }); return cur ? (cur.datas.find(function(x){ return x.rs.itens.length>0 && !x.rs.paga; }) || {}).data : null; })();
  var sitAberta = aSit!==undefined ? aSit : sitPadrao;

  var avisoGas = !!(c.gasolinaPR && c.gasolinaPR.valor>0 && c.gasolinaPR.em && (c.gasolinaVisto||{})[rep]!==c.gasolinaPR.em);   // aviso do preço da gasolina ainda não visto por ela
  var nPend = atend.filter(function(r){ return (r.tipo==="acerto" || r.tipo==="kit_novo_entrega") && !(r.recebimento && r.recebimento.ok); }).length;
  var abas = e("div",{className:"flex gap-1.5"}, [["com","Comissões"],["entrega","Entrega na empresa"]].map(function(o){ var a = aba===o[0];
    return e("button",{key:o[0], onClick:function(){ setAba(o[0]); }, "aria-pressed":a, className:"rounded-full px-3 py-1.5 text-[12px] font-bold whitespace-nowrap "+(a ? "bg-[#C9A13B] txt-branco" : "bg-[#1C1C1E] text-[#8E8E93]")}, o[1], o[0]==="entrega" && nPend>0 && " · "+nPend); }));
  if(aba==="entrega") return e("div",{className:"mt-3 flex flex-col gap-2.5 pb-4"}, abas, e(EntregaEmpresa,{s:s, d:d, rep:rep}));
  return e("div",{className:"mt-3 flex flex-col gap-2.5 pb-4"}, abas,
    naoIdent.length>0 && e("div",{className:"flex flex-col gap-1 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-3"},
      e("b",{className:"text-[13px] text-[#B91C1C]"},"Pagamento não identificado"),
      naoIdent.map(function(x,i){ return e("p",{key:i, className:"text-[12px] leading-snug text-[#B91C1C]"}, "O financeiro não encontrou o pagamento de "+x.rev+" ("+BK(x.valor)+", acerto de "+dm(x.data)+"). Envie o comprovante para o financeiro."); })),
    avisoGas && e("div",{className:"flex flex-col gap-1 rounded-2xl border border-[#E9DDBB] bg-[#FFF8E1] p-3"},
      e("b",{className:"text-[13px] text-[#111827]"},"⛽ Combustível atualizado"),
      e("p",{className:"text-[12px] leading-snug text-[#6B7280]"},"O financeiro atualizou o preço da gasolina para "+BK(c.gasolinaPR.valor)+" por litro ("+quando(c.gasolinaPR.em)+"). O combustível dos seus períodos foi recalculado."),
      e("button",{onClick:function(){ d({type:"COMIS_GAS_VISTO", rep:rep}); }, className:"h-9 self-start rounded-xl bg-[#C9A13B] px-4 text-[12px] font-bold txt-branco"},"Entendi")),
    // cartão do mês
    e("div",{className:"flex flex-col gap-1.5 rounded-2xl border border-[#E9DDBB] p-3", style:OURO_CLARO},
      e("div",{className:"flex items-center justify-between gap-2"},
        e("div",null, e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#A67C12]"},"Comissão de "+nomeMes(mesVenda)), e("b",{className:MONO+" text-[22px] text-[#111827]"}, BK(total))),
        e("select",{value:mesVenda, "aria-label":"Mês dos atendimentos", onChange:function(ev){ setMesVenda(ev.target.value); }, className:"h-8 rounded-lg bg-white px-2 text-[12px] font-semibold text-[#111827] outline-none ring-1 ring-[#E9DDBB]"},
          mesesVenda.map(function(m){ return e("option",{key:m, value:m}, nomeMes(m)); }))),
      e("p",{className:"text-[11.5px] text-[#6B7280]"}, nAtend+(nAtend===1 ? " atendimento" : " atendimentos")+" · confirmado "+BK(conf)+" · previsto "+BK(total-conf)),
      e("p",{className:"text-[11px] text-[#9A8B63]"}, pctDaRep(c, rep)+"% sobre o acerto · paga dias "+(c.ciclos[g]||[]).join("/")+". O financeiro ainda confere cada valor.")),
    e("p",{className:"px-1 text-[11.5px] leading-snug text-[#8E8E93]"},
      "Informe o km total do período em cada pagamento até as "+String(c.corteHora).padStart(2,"0")+"h"+(c.corteDias===1 ? " do dia anterior" : c.corteDias>1 ? " de "+c.corteDias+" dias antes" : "")+". Sem o km no prazo, o combustível pago é só "+BK(c.combSemEnvio)+"."),
    dados.map(function(m){ var abM = mesAberto===m.mes;
      return e("div",{key:m.mes, className:"flex flex-col gap-2"},
        e("button",{onClick:function(){ setAMes(abM ? null : m.mes); setASit(undefined); }, "aria-expanded":abM, className:"flex items-center gap-2 rounded-2xl border border-[#E9DDBB] bg-white px-3 py-2.5 text-left"},
          e("span",{className:"text-[#A67C12]"}, e(Icon,{n:abM ? "chevrondown" : "chevron", s:14})), e("b",{className:"flex-1 text-[13.5px] text-[#111827]"}, "Pagamentos de "+nomeMes(m.mes)),
          e("span",{className:MONO+" text-[12px] font-semibold text-[#A67C12]"}, BK(m.pagar))),
        abM && m.datas.map(function(x){ var aberta = sitAberta===x.data;
          return e(Situacao,{key:x.data, rs:x.rs, c:c, rep:rep, data:x.data, aberta:aberta, alt:function(){ setASit(aberta ? null : x.data); }, d:d, fixo:c.combSemEnvio}); }),
        // consolidado do mês: a comissão total em tempo real + o combustível (km total de cada período) = o que a empresa paga; depois o pago e o restante
        abM && e("div",{className:CARD},
          e("div",{className:"px-3 py-2", style:OURO_CLARO}, e("b",{className:"text-[13.5px] text-[#111827]"},"Consolidado de "+nomeMes(m.mes))),
          e("div",{className:"grid grid-cols-3 gap-px bg-[#E9DDBB]"}, [["Comissão",m.com],["+ Combustível",m.comb],["= A pagar",m.pagar,"text-[#A67C12] font-extrabold"],["Já pago",m.pagos],["Restante",m.falta]].map(function(x){
            return e("div",{key:x[0], className:"flex flex-col items-center bg-[#FBF4E0] px-1 py-1.5 text-center"}, e("span",{className:"text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]"}, x[0]), e("b",{className:MONO+" text-[12px] "+(x[2]||"text-[#111827]")}, BK(x[1]))); })),
          e("p",{className:"bg-[#FBF4E0] px-3 pb-2 pt-1 text-[10.5px] leading-snug text-[#6B7280]"},"A comissão aparece em tempo real, mesmo antes de o financeiro confirmar. O combustível vem do km total que você informa no fim de cada período."))); }));
}

export { ComissoesRep };
