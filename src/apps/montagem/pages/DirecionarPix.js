// Sorelly Admin · montagem — pages/DirecionarPix.js
// Financeiro → Contas → Pagamentos → "Direcionar" e "Regras" (23/10/2026, layout 3 aprovado pelo Marcus, ampliado). O Lucas recebe os pedidos de conta do Pix, os de DENTRO da Sorelly (nunca têm conta fixa)
// e os das REPRESENTANTES (chegam do app), divide cada um em vários destinos e CONFIRMA sempre. O sistema sugere com o motivo escrito (regras em lista, com liga/desliga). Lógica em domain/direcionar-pix.js.
// Quando um destino tem orientação aberta (aba Orientações), confirmar também lança o Pix nela.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Botao, CAMPO, FaixaTotais, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { setBaixas, setClasse, setLancamentos, setPf, filtrar } from "@/apps/montagem/domain/contas-empresa";
import { TIPOS_DESTINO, direcionado, faltaDe, hojeIsoCp } from "@/apps/montagem/domain/controle-pagamentos";
import { sugerir } from "@/apps/montagem/domain/direcionar-pix";
import { descontoCartao, fornecedoresDoMes, geradoEm } from "@/apps/montagem/domain/pf-mes";
import { vinculoDeRep } from "@/apps/montagem/domain/link-pagamento";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { dataReferencia, posicaoEm } from "@/apps/montagem/domain/saldos-contas";
import { BKC } from "@/apps/montagem/lib/format";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var hm = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2, "0")+":"+String(d.getMinutes()).padStart(2, "0"); };
var haQuanto = function(ts){ var m = Math.max(0, Math.floor((Date.now()-ts)/60000)); return m<1 ? "agora" : m<60 ? "há "+m+" min" : "há "+Math.floor(m/60)+" h "+(m%60)+" min"; };
// urgência pela espera do Pix: até 30 min verde, até 1 h amarelo, depois vermelho (pedido do Marcus 24/10/2026: bater o olho e saber o que é urgente)
var COR_ESPERA = ["#4ade80", "#f5c14b", "#f87171"];
var nivelEspera = function(ts){ var m = (Date.now()-ts)/60000; return m<30 ? 0 : m<60 ? 1 : 2; };
var SELO_ORIGEM = {interno:["Interno", "#38bdf8"], rep:["Representante", "#c084fc"]};
var Selo = function(o){ var s = SELO_ORIGEM[o]; return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[clamp(11px,0.64vw,15px)] font-bold uppercase tracking-[.04em]", style:{background:s[1]+"26", color:s[1], border:"1px solid "+s[1]+"66"}}, s[0]); };
var SeloAlto = function(){ return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[clamp(11px,0.64vw,15px)] font-bold uppercase tracking-[.04em]", style:{background:"#f8717126", color:"#f87171", border:"1px solid #f8717166"}}, "Valor alto"); };
// CNPJ (34, 46, 59, 67) da maquininha ou do link que a representante tem, vindo do Link de pagamento
var nmRep = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); };
var mesmaRep = function(a, b){ a = nmRep(a); b = nmRep(b); return a===b || a.indexOf(b+" ")===0 || b.indexOf(a+" ")===0; };
var cnpjDaRep = function(s, rep){ var lp = s.lp; if(!lp) return ""; var v = vinculoDeRep(lp, rep) || (lp.vinculos||[]).filter(function(x){ return mesmaRep(x.representante, rep); })[0]; if(!v) return ""; var m = (lp.meios||[]).find(function(x){ return x.id===v.maquininhaId || x.id===v.linkId; }); var q = m ? String(m.cnpjId||"").match(/(34|46|59|67)/) : null; return q ? q[1] : ""; };
var formaNome = function(f){ return f==="maquininha" ? "Maquininha" : f==="link" ? "Link" : "Pix"; };
var tipoNome = function(t){ return (TIPOS_DESTINO[t] || ["—"])[0]; };
var FORMA = {dinheiro:"Dinheiro", link:"Link de pagamento", getnet:"Crédito à vista (Getnet)", credito:"Crédito", pix:"Pix"};
var textoPago = function(p){ return (FORMA[p.forma] || p.forma)+(p.cnpj ? " ("+p.cnpj+")" : "")+(p.parc ? " em "+p.parc+"x" : ""); };
var soma = function(l){ return r2((l||[]).reduce(function(t, x){ return t+(x.valor||0); }, 0)); };
var Secao = function(t, dir, filhos, p){ return e(BlocoBarra,{t:dir ? t+" · "+dir : t, grande:t==="Vendas", compacto:true, fixo:true, cor:"azul", borda:"ouro"}, filhos); };   // bordas douradas (Marcus, 24/10/2026)
// só o primeiro e o segundo nome na fila (o nome inteiro aparece no pedido aberto); "de/da/do" não conta como nome
var doisNomes = function(n){ var w = String(n||"").trim().split(/\s+/); var k = (w.length>2 && /^(de|da|do|dos|das|e)$/i.test(w[1])) ? 3 : 2; return w.slice(0, k).join(" "); };

function useDP(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, dp:s.dp, cp:s.cp, por:nomeDe(s.usuario), edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario)}; }

// contas a pagar de cada CNPJ (atrasadas, hoje, amanhã) e quanto há disponível nas contas dele
// contas bancárias NEGATIVAS agora (uma linha por conta, sem agrupar por CNPJ): para o Lucas saber quem precisa receber Pix
function contasNegativas(s){
  var sc = s.saldosContas; if(!sc) return [];
  var ref = dataReferencia(sc, hojeIsoCp()); if(!ref) return [];
  var pos = posicaoEm(sc, ref), l = [];
  pos.blocos.forEach(function(b){ b.contas.forEach(function(x){ if(!x.conta.bloqueada && x.conta.tipo!=="CAIXA" && x.saldo<-0.005) l.push({id:x.conta.id, nome:x.conta.nome, bloco:b.id, saldo:r2(x.saldo), limite:x.conta.limite||0, disp:r2(x.disp)}); }); });
  // contas do mesmo banco e do mesmo CNPJ ficam juntas (ex.: Sicredi Sorelly 34 e Sicredi Rotativo 34); os grupos seguem do mais negativo para o menos
  var chaveG = function(x){ return String(x.nome).split(" ")[0].toLowerCase()+"|"+x.bloco; }, tot = {}, minimo = {};
  l.forEach(function(x){ var k = chaveG(x); tot[k] = (tot[k]||0)+1; minimo[k] = Math.min(minimo[k]===undefined ? 0 : minimo[k], x.saldo); x.grupo = k; });
  l.forEach(function(x){ x.junto = tot[x.grupo]>1; });
  return l.sort(function(a, b){ return (minimo[a.grupo]-minimo[b.grupo]) || (a.grupo<b.grupo ? -1 : a.grupo>b.grupo ? 1 : 0) || a.saldo-b.saldo; });
}
function contextoCnpj(s){
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);
  var hoje = hojeIsoCp(), amanha = (function(){ var d = new Date(hoje+"T12:00:00"); d.setDate(d.getDate()+1); return d.toISOString().slice(0, 10); })();
  var abertos = filtrar("", "", "", "apagar", "sorelly", ""), sc = s.saldosContas, ref = sc ? dataReferencia(sc, hoje) : null, pos = ref ? posicaoEm(sc, ref) : {blocos:[]};
  return ["34", "46", "59", "67"].map(function(id){
    var l = abertos.filter(function(i){ return i.filial===id; }), b = pos.blocos.filter(function(x){ return x.id===id; })[0] || {real:0, disp:0};
    return {id:id, atras:soma(l.filter(function(i){ return i.venc<hoje; }).map(function(i){ return {valor:i.valor}; })), hoje:soma(l.filter(function(i){ return i.venc===hoje; }).map(function(i){ return {valor:i.valor}; })),
      amanha:soma(l.filter(function(i){ return i.venc===amanha; }).map(function(i){ return {valor:i.valor}; })), disp:r2(b.disp), saldo:r2(b.real)};
  });
}

function AbaDirecionar(props){
  var c = useDP(), s = c.s, cp = c.cp, dp = c.dp, ctxCnpj = contextoCnpj(s);
  var so = useState("todos"), orig = so[0], setOrig = so[1], ss = useState(null), selId = ss[0], setSelId = ss[1], sd = useState({}), drafts = sd[0], setDrafts = sd[1], se = useState("");
  var erro = se[0], setErro = se[1];
  var limAlto = dp.limiteAlto || 7000;
  // valor alto passa na frente da fila; depois, o mais antigo (24/10/2026)
  var fila = dp.pix.filter(function(x){ return x.status==="fila" && (orig==="todos" || x.origem===orig); }).sort(function(a, b){ var ha = a.valor>=limAlto, hb = b.valor>=limAlto; if(ha!==hb) return ha ? -1 : 1; return a.recebidoEm-b.recebidoEm; });
  var feitos = dp.pix.filter(function(x){ return x.status==="direcionado"; }).sort(function(a, b){ return (b.confirmadoEm||0)-(a.confirmadoEm||0); });
  var todosFila = dp.pix.filter(function(x){ return x.status==="fila"; });
  var sel = dp.pix.filter(function(x){ return x.id===selId && x.status==="fila"; })[0] || fila[0] || null;
  var hojeDir = r2(feitos.filter(function(x){ return (x.confirmadoEm||0) > new Date().setHours(0, 0, 0, 0); }).reduce(function(t, x){ return t+x.valor; }, 0));
  var destinoDe = function(id){ return cp.destinos.filter(function(d){ return d.id===id; })[0] || {nome:"(removido)", tipo:"CNPJ"}; };
  var optDest = [["", "Escolha para quem enviar"]]; Object.keys(TIPOS_DESTINO).forEach(function(t){ cp.destinos.filter(function(d){ return d.ativo && d.tipo===t; }).forEach(function(d){ optDest.push([d.id, tipoNome(t)+" · "+d.nome]); }); });
  // fornecedores: o que FALTA para fechar o mês atual e a data limite (planilha, aba RESUMO MÊS; Marcus 24/10/2026). Clicar adiciona o fornecedor como destino.
  var fornAbertos = fornecedoresDoMes(cp).map(function(f){ return {id:f.id, nome:f.nome, total:f.saldo, dMin:f.ate, obs:f.obs, destinoId:f.destinoId}; });
  var totalFalta = r2(fornAbertos.reduce(function(tt, f){ return tt+f.total; }, 0));
  var faz = sel ? sugerir(sel, {pontual:fornAbertos.filter(function(f){ return /^Pontual/.test(f.nome); }), cp:cp, regras:dp.regras, cnpjs:ctxCnpj, contasRep:dp.contasRep||{}, limiteAlto:dp.limiteAlto||7000, cnpjDaRep:function(rep){ return cnpjDaRep(s, rep); }}) : null;
  var div = sel ? (drafts[sel.id] || []) : [], restante = sel ? r2(sel.valor-soma(div)) : 0;
  var setDiv = function(l){ var n = Object.assign({}, drafts); n[sel.id] = l; setDrafts(n); setErro(""); };
  var addDest = function(destinoId, valor, regra, conta){ if(!sel) return; var vv = viaMap[sel.id] || sel.forma || "pix", l = div.slice(), i = l.findIndex(function(x){ return x.destinoId===destinoId && (x.conta||"")===(conta||"") && (x.via||"pix")===vv; }), v = r2(Math.min(valor==null ? restante : valor, Math.max(restante, 0)));
    if(!(v>0)) return; if(i>=0) l[i] = Object.assign({}, l[i], {valor:r2(l[i].valor+v)}); else l.push({destinoId:destinoId, valor:v, regra:regra||0, conta:conta||"", via:vv}); setDiv(l); };
  var usaSug = function(o){ addDest(o.destinoId, o.valor, o.regra); };
  var confirmar = function(){
    if(!sel) return; if(!div.length){ setErro("Escolha pelo menos um destino."); return; } if(Math.abs(restante)>0.009){ setErro("A soma dos destinos precisa fechar com "+BKC(sel.valor)+" (falta "+BKC(restante)+")."); return; }
    c.d({type:"DP", op:"divisao", id:sel.id, divisoes:div}); c.d({type:"DP", op:"confirma", id:sel.id, por:c.por});
    div.forEach(function(x){ if((x.via||"pix")!=="pix") return; var o = cp.orientacoes.filter(function(z){ return z.destinoId===x.destinoId && z.status==="aberta" && faltaDe(z)>0; })[0]; if(o) c.d({type:"CP", op:"orient_lanc", id:o.id, valor:Math.min(x.valor, faltaDe(o)), origem:sel.quem, por:c.por}); });
    var n = Object.assign({}, drafts); delete n[sel.id]; setDrafts(n); setSelId(null); setErro("");
  };
  // destinos que ainda faltam: orientações abertas + CNPJs com contas vencendo
  var faltam = cp.orientacoes.filter(function(o){ return o.status==="aberta" && faltaDe(o)>0; }).map(function(o){ var d = destinoDe(o.destinoId); return {id:d.id, nome:d.nome, tipo:d.tipo, falta:faltaDe(o), atrasada:!!(o.ate && o.ate<hojeIsoCp())}; });
  ctxCnpj.forEach(function(x){ var d = cp.destinos.filter(function(z){ return z.cnpjId===x.id; })[0]; if(d && (x.hoje+x.amanha)>0) faltam.push({id:d.id, nome:d.nome, tipo:"CNPJ", falta:r2(x.hoje+x.amanha), info:"vencem hoje e amanhã"}); });
  var sfm = useState("falta"), modoForn = sfm[0], setModoForn = sfm[1];
  var fornLista = fornecedoresDoMes(cp, modoForn==="mes"), negativas = contasNegativas(s), totalNeg = r2(negativas.reduce(function(tt, x){ return tt+x.saldo; }, 0));
  var sdv = useState(false), dividindo = sdv[0], setDividindo = sdv[1];
  var svv = useState({}), viaMap = svv[0], setViaMap = svv[1], via = sel ? (viaMap[sel.id] || sel.forma || "pix") : "pix";   // por onde o valor vai: Pix, Maquininha ou Link
  var optDestVia = via==="pix" ? optDest : [["", "Escolha o CNPJ"]].concat(cp.destinos.filter(function(d){ return d.ativo && d.tipo==="CNPJ"; }).map(function(d){ return [d.id, (via==="link" ? "Link do " : "Maquininha do ")+d.nome]; }));
  // PLANO SUGERIDO (Marcus, 24/10/2026): o sistema já propõe a divisão do Pix. Ex.: R$ 1.000 = R$ 407 para fechar um fornecedor e o resto para a conta mais no negativo.
  var montarPlano = function(){
    var rest = sel.valor, rows = [], hoje = hojeIsoCp();
    if(sel.forma && sel.forma!=="pix"){ var n0 = negativas.filter(function(x){ return cp.destinos.some(function(z){ return z.cnpjId===x.bloco; }); })[0], dN = n0 ? cp.destinos.filter(function(z){ return z.cnpjId===n0.bloco; })[0] : cp.destinos.filter(function(z){ return z.cnpjId; })[0];
      if(dN) rows.push({destinoId:dN.id, valor:sel.valor, motivo:(sel.forma==="link" ? "Link" : "Maquininha")+" do CNPJ "+dN.cnpjId+(n0 ? ": a conta mais no negativo é "+n0.nome : ""), regra:0, conta:"", via:sel.forma}); return rows; }
    var push = function(destinoId, valor, motivo, regra, conta){ var v = r2(Math.min(valor, rest)); if(!destinoId || !(v>0.004)) return; rows.push({destinoId:destinoId, valor:v, motivo:motivo, regra:regra||0, conta:conta||"", via:"pix"}); rest = r2(rest-v); };
    // REGRA (Marcus, 24/10/2026): o que FATURA (conta de CNPJ) não se mistura com o que NÃO fatura (fornecedor, representante, família...). O que é 34 fica no 34; venda no link de um CNPJ volta para esse CNPJ.
    var link = (sel.pagos||[]).filter(function(q){ return q.forma==="link" && q.cnpj; })[0];
    if(link){ var dl = cp.destinos.filter(function(z){ return z.cnpjId===link.cnpj; })[0]; if(dl){ push(dl.id, rest, "Venda paga no link do CNPJ "+link.cnpj+": o dinheiro volta para o mesmo CNPJ", 1); return rows; } }
    // 1) o que NÃO fatura: metas das representantes, fornecedores pontuais e vencidos
    if(sel.origem==="rep") (cp.orientacoes||[]).filter(function(o){ return o.status==="aberta" && faltaDe(o)>0; }).forEach(function(o){ var d = destinoDe(o.destinoId); if(rest>0.004 && d.tipo==="REPRESENTANTE" && d.nome!==sel.repOrigem) push(d.id, faltaDe(o), "Fecha a meta de Pix direto de "+d.nome, 3); });
    var getnet = (sel.pagos||[]).some(function(q){ return q.forma==="getnet"; });
    if(rest>0.004 && (sel.valor>3000 || (getnet && sel.valor>750))) fornAbertos.filter(function(f){ return /^Pontual/.test(f.nome); }).forEach(function(f){ push(f.destinoId, f.total, "Fecha "+f.nome+(f.dMin ? " (até "+f.dMin.slice(8,10)+"/"+f.dMin.slice(5,7)+")" : ""), sel.valor>3000 ? 4 : 5); });
    if(rest>0.004) fornAbertos.filter(function(f){ return f.destinoId && !/^Pontual/.test(f.nome) && f.dMin && f.dMin<hoje && f.total<=rest; }).slice(0, 2).forEach(function(f){ push(f.destinoId, f.total, "Fecha "+f.nome+" (vencido em "+f.dMin.slice(8,10)+"/"+f.dMin.slice(5,7)+")", 0); });
    if(rows.length){
      // sobrou valor: continua só em quem não fatura (paga parte do próximo fornecedor aberto)
      fornAbertos.filter(function(f){ return f.destinoId && !rows.some(function(r){ return r.destinoId===f.destinoId; }); }).sort(function(x, y){ return String(x.dMin||"9").localeCompare(String(y.dMin||"9")); }).forEach(function(f){ if(rest>0.004) push(f.destinoId, f.total, "Paga parte de "+f.nome+" (falta "+BKC(f.total)+")", 0); });
      return rows;
    }
    // 2) nada disso serviu: tudo no MESMO CNPJ, o mais no negativo, nas contas negativas dele
    var comCnpj = negativas.filter(function(x){ return cp.destinos.some(function(z){ return z.cnpjId===x.bloco; }); });
    if(comCnpj.length){ var bl = comCnpj[0].bloco, dn = cp.destinos.filter(function(z){ return z.cnpjId===bl; })[0], mesmas = comCnpj.filter(function(x){ return x.bloco===bl; });
      mesmas.forEach(function(x, k){ if(rest>0.004) push(dn.id, k===mesmas.length-1 ? rest : -x.saldo, "CNPJ "+bl+": "+x.nome+" está no negativo (−"+BKC(-x.saldo)+")", 7, x.nome); }); }
    else if(faz && faz.opcoes[0]) push(faz.opcoes[0].destinoId, rest, faz.opcoes[0].motivo, faz.opcoes[0].regra);
    return rows;
  };
  var plano = sel ? montarPlano() : [];
  var porTipo = {interno:0, rep:0}; todosFila.forEach(function(x){ porTipo[x.origem] += x.valor; });
  var maisAntigo = todosFila.length ? Math.min.apply(null, todosFila.map(function(x){ return x.recebidoEm; })) : null;
  return e("div",{className:"flex flex-col gap-3 [&_td]:!text-center [&_th]:!text-center [&_input]:!text-center [&_select]:!text-center"},
    e("div",{className:"flex flex-wrap items-center justify-end gap-2"},
      !c.edita && e("span",{className:"text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Só quem direciona Pix confirma. Você pode ver."), props && props.extra),
    e("div",{className:"grid grid-cols-1 items-stretch gap-3 min-[1100px]:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]"},
      // ── fila
      e("div",{className:"flex min-w-0 flex-col [&>section]:flex-1"}, Secao("Vendas", "", fila.length ? e("div",{className:"max-h-[30rem] overflow-y-auto"}, e(TabelaP,{minW:720, cols:[{t:"Nº", w:"5%"},{t:"Hora", w:"8%"},{t:"Revendedora", w:"18%"},{t:"Tipo", w:"15%"},{t:"Forma", w:"13%"},{t:"Vendas", n:true, w:"17%"},{t:"A direcionar", n:true, w:"14%"},{t:"Espera", w:"10%"}]}, fila.map(function(x, i){ var on = sel && sel.id===x.id, esp = COR_ESPERA[nivelEspera(x.recebidoEm)];
        return e("tr",{key:x.id, onClick:function(){ setSelId(x.id); setErro(""); }, className:"cursor-pointer "+(on ? "bg-[#1f3a6e]" : "hover:bg-white/10"), style:{boxShadow:"inset 4px 0 0 "+esp}},
          e("td",{className:"h-11 whitespace-nowrap border-b border-border px-2.5 font-bold tabular-nums"}, String(i+1)),
          e("td",{className:"h-11 whitespace-nowrap border-b border-border px-2.5 text-left tabular-nums"}, hm(x.recebidoEm)),
          e("td",{className:"h-11 truncate border-b border-border px-2.5 text-left text-[clamp(13px,0.76vw,18px)] font-semibold", title:x.quem+(x.origem==="interno" ? " · atendida por "+x.atendente : " · "+(x.maq||""))}, doisNomes(String(x.quem).replace(/^Representante\s+/, ""))),
          e("td",{className:"h-11 truncate border-b border-border px-2.5 text-left text-[clamp(13px,0.76vw,18px)]", title:x.origem==="interno" ? "Interno Sorelly · "+x.atendente : "Representante"+(x.valor>=limAlto ? " · valor alto" : "")}, x.origem==="interno" ? "Interno" : (x.valor>=limAlto ? "Representante ↑" : "Representante")),
          e("td",{className:"h-11 truncate border-b border-border px-2.5 text-left text-[clamp(13px,0.76vw,18px)] font-semibold "+((x.forma||"pix")==="pix" ? "" : "text-warning"), title:"Forma de pagamento deste pedido"}, formaNome(x.forma)),
          e("td",{className:"h-11 whitespace-nowrap border-b border-border px-2.5 text-right text-[clamp(18px,1.1vw,28px)] font-black tabular-nums tracking-tight"}, x.vendas>0 ? BKC(x.vendas) : "—"),
          e("td",{className:"h-11 whitespace-nowrap border-b border-border px-2.5 text-right text-[clamp(13px,0.76vw,18px)] font-extrabold tabular-nums", style:{color:"#f5c14b", background:"rgba(217,166,58,.08)"}}, BKC(x.valor)),
          e("td",{className:"h-11 whitespace-nowrap border-b border-border px-2.5 text-left font-bold tabular-nums", style:{color:esp}}, haQuanto(x.recebidoEm))); })))
        : e("p",{className:"px-3 py-6 text-center text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Nenhum pedido na fila."))),
      // ── pedido aberto
      sel ? e("div",{className:"flex min-w-0 flex-col gap-3"},
        Secao("Direcionar pagamento", restante>0.009 ? "falta direcionar "+BKC(restante) : restante<-0.009 ? "passou "+BKC(-restante) : "tudo direcionado", e("div",{className:"flex flex-col"},
          // cabeçalho do pedido: tipo em selo, nome grande, quem atendeu e a hora (24/10/2026: melhorar o nome e os valores)
          e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2.5"}, Selo(sel.origem), sel.valor>=limAlto && SeloAlto(), e("span",{className:"min-w-0 flex-1 truncate text-[clamp(17px,1vw,24px)] font-extrabold leading-tight text-foreground", title:sel.quem}, sel.quem),
            e("span",{className:"w-full text-[clamp(13px,0.76vw,18px)] text-foreground"}, (sel.origem==="interno" ? "Atendida por "+sel.atendente : (sel.maq||""))+" · chegou às "+hm(sel.recebidoEm)+" · ", e("b",{style:{color:COR_ESPERA[nivelEspera(sel.recebidoEm)]}}, haQuanto(sel.recebidoEm)))),
          e("div",{className:"grid grid-cols-2 border-b border-border"}, [["Valor de vendas", sel.vendas>0 ? BKC(sel.vendas) : "—", "#e5e7eb"], ["Valor a pagar", sel.vendas>0 ? BKC(sel.aPagar) : "—", "#f5c14b"], ["Já pago", BKC(soma(sel.pagos)), "#4ade80", true], ["A direcionar", BKC(sel.valor), "#f5c14b"]].map(function(x, i){
            return e("div",{key:x[0], className:"min-w-0 px-2 py-2 text-center "+((i%2 ? "border-l border-border " : "")+(i<2 ? "border-b border-border" : "")), style:i===3 ? {background:"rgba(217,166,58,.12)"} : undefined}, e("div",{className:"truncate text-[clamp(11px,0.64vw,15px)] font-medium uppercase tracking-[.05em] text-foreground"}, x[0]), e("div",{className:"truncate font-extrabold tabular-nums "+(i===0 ? "text-[clamp(22px,1.3vw,32px)]" : "text-[clamp(18px,1.05vw,26px)]"), style:{color:x[2]}}, x[1])); })),
          (sel.pagos||[]).length>0 && e("div",{className:"flex flex-wrap gap-x-5 gap-y-1 border-b border-border px-3 py-2 text-[clamp(13px,0.76vw,18px)] text-foreground"}, e("b",{className:"font-bold"}, "Já pagou:"), sel.pagos.map(function(p, i){ return e("span",{key:i, className:"font-semibold"}, textoPago(p)+" · ", e("b",{className:"tabular-nums text-success"}, BKC(p.valor))); })),
          sel.obs && e("p",{className:"border-b border-border px-3 py-1.5 text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Obs.: "+sel.obs),
        // 1) SUGESTÃO DO SISTEMA: o plano já pronto (um botão), mais outras opções de uma conta só
        e("div",{className:"border-t border-border px-3 py-2"}, e("p",{className:"mb-1 text-[clamp(11px,0.64vw,15px)] font-medium uppercase tracking-[.05em]", style:{color:"#f5c14b"}}, "1 · Sugestão do sistema"+(sel.origem==="interno" ? " (sem conta fixa)" : "")),
          plano.length ? e("div",{className:"rounded-md border border-[#d9a63a] bg-[#1b1810]"}, e(TabelaP,{minW:420, cols:[{t:"Destino"},{t:"Valor", n:true, w:120},{t:"Motivo"}]}, plano.map(function(x, i){ var d = destinoDe(x.destinoId); var nm = d.nome+(x.conta ? " · "+x.conta : "");
              return e("tr",{key:x.destinoId+"|"+(x.conta||"")+i}, e(Td,{forte:true, title:nm}, nm), e(Td,{n:true, forte:true}, BKC(x.valor)), e("td",{className:"whitespace-normal break-words border-b border-border px-2.5 py-1.5 leading-snug"}, x.motivo)); })),
            e("div",{className:"flex flex-wrap items-center justify-between gap-2 px-3 py-2"}, e("span",{className:"text-[clamp(13px,0.76vw,18px)] text-foreground"}, plano.length>1 ? plano.length+" destinos · soma "+BKC(soma(plano)) : "1 destino"), c.edita && e("button",{type:"button", onClick:function(){ setDiv(plano.map(function(x){ return {destinoId:x.destinoId, valor:x.valor, regra:x.regra, conta:x.conta, via:x.via||"pix"}; })); setDividindo(false); }, className:"h-9 rounded-md border border-primary bg-primary px-4 text-[clamp(13px,0.76vw,18px)] font-bold text-primary-foreground hover:opacity-90"}, "Usar esta divisão")))
          : e("p",{className:"rounded-md border border-border px-3 py-2 text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Nenhuma regra serviu. Escolha a conta abaixo."),
          faz.opcoes.length>0 && e("div",{className:"mt-2"}, e("p",{className:"mb-1 text-[clamp(11px,0.64vw,15px)] font-medium uppercase tracking-[.05em] text-foreground"}, "Ou tudo numa conta só"),
            e("div",{className:"rounded-md border border-border [&_td]:text-[clamp(13px,0.76vw,18px)]"}, e(TabelaP,{minW:420, cols:[{t:"Destino"},{t:"Valor", n:true, w:110},{t:"Motivo"},{t:"", w:70}]}, faz.opcoes.slice(0, 3).map(function(o){
              return e("tr",{key:o.destinoId}, e(Td,{forte:true, title:o.nome}, o.nome), e(Td,{n:true, forte:true}, BKC(sel.valor)), e("td",{className:"whitespace-normal break-words border-b border-border px-2.5 py-1.5 leading-snug"}, o.motivo),
                e("td",{className:"border-b border-border px-1"}, c.edita && e("button",{type:"button", onClick:function(){ setDiv([{destinoId:o.destinoId, valor:sel.valor, regra:o.regra, conta:"", via:"pix"}]); setDividindo(false); }, className:"h-7 rounded-md border border-border px-2 text-[clamp(13px,0.76vw,18px)] hover:bg-white/10"}, "Usar"))); }))))),
        // 2) PARA ONDE VAI: escolhe a conta, divide se quiser, e dá OK
        e("div",{className:"border-t border-border"}, e("p",{className:"px-3 pt-2 text-[clamp(11px,0.64vw,15px)] font-medium uppercase tracking-[.05em]", style:{color:"#f5c14b"}}, "2 · Para onde vai "+(via==="pix" ? "este Pix" : via==="link" ? "este link" : "esta maquininha")+(div.length ? " · "+(restante>0.009 ? "falta "+BKC(restante) : restante<-0.009 ? "passou "+BKC(-restante) : "fechado") : "")), e("div",{className:"flex flex-col"},
          div.length ? e(TabelaP,{minW:520, cols:[{t:"Destino"},{t:"Valor", n:true, w:150},{t:"", w:44}]}, div.map(function(x, i){ var d = destinoDe(x.destinoId);
            return e("tr",{key:x.destinoId+"|"+(x.conta||"")},
              e(Td,{forte:true, title:tipoNome(d.tipo)+" · "+d.nome+(x.conta ? " · "+x.conta : "")}, d.nome+(x.conta ? " · "+x.conta : "")+((x.via||"pix")!=="pix" ? " · "+formaNome(x.via) : "")),
              e("td",{className:"border-b border-border px-1.5"}, e(CampoDinheiro,{value:x.valor || null, label:"Valor para "+d.nome, disabled:!c.edita, className:CAMPO+" text-right tabular-nums", onChange:function(v){ var l = div.slice(), nv = r2(Math.min(v || 0, sel.valor)); l[i] = Object.assign({}, x, {valor:nv}); if(l.length===2){ var o2 = 1-i; l[o2] = Object.assign({}, l[o2], {valor:r2(sel.valor-nv)}); } setDiv(l); }})),
              e("td",{className:"border-b border-border px-1 text-center"}, c.edita ? e("button",{type:"button", "aria-label":"Tirar "+d.nome, onClick:function(){ var l = div.filter(function(z, k){ return k!==i; }); if(l.length===1) l[0] = Object.assign({}, l[0], {valor:sel.valor}); setDiv(l); }, className:"h-7 w-7 rounded-md border border-border text-[clamp(13px,0.76vw,18px)] hover:bg-white/10"}, "✕") : null)); }))
          : e("p",{className:"px-3 py-4 text-center text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Use a sugestão acima ou escolha a conta aqui embaixo."),
          c.edita && e("div",{className:"flex flex-wrap items-center gap-2 border-t border-border px-3 pt-2"}, e("span",{className:"text-[clamp(13px,0.76vw,18px)] font-medium uppercase tracking-[.05em] text-foreground"}, "Enviar por"), e(Segmentado,{opcoes:[["pix","Pix"],["maquininha","Maquininha"],["link","Link"]], atual:via, onMudar:function(v2){ var m = Object.assign({}, viaMap); m[sel.id] = v2; setViaMap(m); }}), via!=="pix" && e("span",{className:"text-[clamp(13px,0.76vw,18px)] text-warning"}, "A revendedora passa o valor na "+(via==="link" ? "link de pagamento" : "maquininha")+" do CNPJ escolhido.")),
          c.edita && e("div",{className:"flex flex-wrap items-end gap-2 px-3 py-2"},
            e("div",{className:"min-w-0 flex-1", style:{minWidth:200}}, e(Rotulo,{t:via!=="pix" ? "Direcionar para o CNPJ" : (div.length ? "Enviar chave Pix para outra conta" : "Enviar chave Pix"), id:"dp-add"}), e("select",{id:"dp-add", value:"", onChange:function(ev){ var v = ev.target.value; if(!v) return; if(!div.length) setDiv([{destinoId:v, valor:sel.valor, regra:0, conta:"", via:via}]); else addDest(v, null, 0); }, className:CAMPO+" truncate"}, optDestVia.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
            e(Botao,{onClick:function(){ if(div.length===1){ var l = div.slice(), meio = r2(l[0].valor/2); l[0] = Object.assign({}, l[0], {valor:r2(l[0].valor-meio)}); setDiv(l); setDividindo(true); } else setDividindo(!dividindo); }, desabilitado:!div.length, title:"Divide o valor com uma segunda conta"}, "Dividir"),
            e(Botao,{onClick:function(){ setDiv([]); setDividindo(false); }, desabilitado:!div.length}, "Limpar"), e(Botao,{principal:true, onClick:confirmar, desabilitado:!div.length}, "OK · enviar")),
          dividindo && div.length===1 && c.edita && e("div",{className:"flex flex-wrap items-end gap-2 border-t border-border px-3 py-2"}, e("div",{className:"min-w-0 flex-1", style:{minWidth:200}}, e(Rotulo,{t:"Dividir com a conta", id:"dp-div"}), e("select",{id:"dp-div", value:"", onChange:function(ev){ var v = ev.target.value; if(!v) return; var l = div.slice(); l.push({destinoId:v, valor:r2(sel.valor-l[0].valor), regra:0, conta:"", via:via}); setDiv(l); setDividindo(false); }, className:CAMPO+" truncate"}, optDestVia.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })))),
          div.some(function(x){ return destinoDe(x.destinoId).tipo==="CNPJ"; }) && div.some(function(x){ return destinoDe(x.destinoId).tipo!=="CNPJ"; }) && e("p",{className:"border-t border-border px-3 py-1.5 text-[clamp(13px,0.76vw,18px)] text-warning"}, "Atenção: mistura conta que fatura (CNPJ) com conta que não fatura. Pode, mas não é o ideal."),
          erro && e("p",{className:"border-t border-border px-3 py-1.5 text-[clamp(13px,0.76vw,18px)] text-destructive"}, erro))),
        // regras usadas: uma linha por regra, texto inteiro
        e("div",{className:"border-t border-border px-3 py-2"}, e("p",{className:"mb-1 text-[clamp(11px,0.64vw,15px)] font-medium uppercase tracking-[.05em] text-foreground"}, "Regras usadas"),
          faz.regras.some(function(r){ return r.estado==="usada" || r.estado==="info"; }) ? e("div",{className:"rounded-md border border-border [&_td]:text-[clamp(13px,0.76vw,18px)]"}, e(TabelaP,{minW:420, cols:[{t:"Nº", w:44},{t:"Regra"},{t:"Situação", w:96}]}, faz.regras.filter(function(r){ return r.estado==="usada" || r.estado==="info"; }).map(function(r){
            return e("tr",{key:r.n}, e(Td,{forte:true}, String(r.n)), e("td",{className:"whitespace-normal break-words border-b border-border px-2.5 py-1.5 leading-snug"}, r.texto), e(Td,{cor:r.estado==="info" ? "text-warning" : "text-success"}, r.estado==="info" ? "Atenção" : "Usada")); })))
          : e("p",{className:"text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Nenhuma regra usada."))))
      ) : e("div",{className:"rounded-lg border border-border px-4 py-10 text-center text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Fila vazia. Quando chegar um pedido, ele aparece aqui.")),
    // ── embaixo, lado a lado: fornecedores (com botão Falta | Todos do mês) e saldo das contas negativas (uma linha por conta)
    e("div",{className:"grid grid-cols-1 items-stretch gap-3 min-[1100px]:grid-cols-2"},
      e("div",{className:"flex min-w-0 flex-col [&>section]:flex-1"}, Secao("Fornecedores · "+(modoForn==="mes" ? "todos do mês" : "vencido e o que falta"), fornAbertos.length ? "falta "+BKC(totalFalta) : "", e("div",{className:"flex flex-col"},
        e("div",{className:"flex items-center justify-between gap-2 border-b border-border px-3 py-1.5"}, e(Segmentado,{opcoes:[["falta","Vencido e o que falta"],["mes","Todos do mês"]], atual:modoForn, onMudar:setModoForn}), e("span",{className:"text-[clamp(13px,0.76vw,18px)] text-foreground"}, fornLista.length+(fornLista.length===1 ? " fornecedor" : " fornecedores"))),
        fornLista.length ? e("div",{className:"max-h-80 overflow-y-auto"}, e(TabelaP,{minW:600, cols:[{t:"Fornecedor"},{t:"A pagar", n:true, w:98},{t:"Pago", n:true, w:98},{t:"Falta", n:true, w:98},{t:"Limite", w:64},{t:"Situação", w:100}]}, fornLista.map(function(x){ var venc = x.saldo>0.005 && x.ate && x.ate<hojeIsoCp(), pode = c.edita && x.destinoId && sel && restante>0.004 && x.saldo>0.005;
            return e(Tr,{key:x.id, apagado:x.saldo<=0.005, onClick:pode ? function(){ addDest(x.destinoId, Math.min(restante, x.saldo), 0); } : undefined, title:pode ? "Adicionar "+x.nome+" como destino do Pix aberto" : undefined},
              e(Td,{forte:true, title:x.nome}, x.nome), e(Td,{n:true}, BKC(x.aPagar)), e(Td,{n:true, cor:x.pago>0.005 ? "text-success" : "", forte:true}, BKC(x.pago)), e(Td,{n:true, forte:true, cor:x.saldo>0.005 ? (venc ? "text-warning" : "") : "text-success"}, x.saldo>0.005 ? BKC(x.saldo) : "—"), e(Td,{title:x.obs||undefined, cor:venc ? "text-warning" : ""}, x.ate ? x.ate.slice(8,10)+"/"+x.ate.slice(5,7) : (x.obs ? "ver" : "—")),
                            e("td",{className:"h-8 border-b border-border px-2.5 text-left"}, e("span",{className:"inline-block whitespace-nowrap rounded px-2 py-0.5 text-[clamp(13px,0.76vw,18px)] font-bold "+(x.saldo<=0.005 ? "bg-success/20 text-success" : venc ? "bg-warning/25 text-warning" : "bg-white/10 text-foreground")}, x.saldo<=0.005 ? "Pago" : (venc ? "Vencido" : "Em aberto")))); })))
          : e("p",{className:"px-3 py-4 text-center text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Sem saldo de fornecedores. Rode scripts/planilha-fornecedores.mjs com a planilha."),
        e("p",{className:"border-t border-border px-3 py-1.5 text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Pontual: o Pix quita a parcela aberta mais antiga e o que passar vai para a próxima. Cartão quita o 1 a 10 do mês seguinte, com desconto estimado de "+String(descontoCartao()).replace(".", ",")+"% (média dos últimos 3 meses). Planilha de "+(geradoEm() ? geradoEm().slice(8,10)+"/"+geradoEm().slice(5,7) : "—")+".")))),
      e("div",{className:"flex min-w-0 flex-col [&>section]:flex-1"}, Secao("Saldo das contas · negativas", negativas.length ? negativas.length+" contas · −"+BKC(-totalNeg) : "", negativas.length ? e("div",{className:"max-h-96 overflow-y-auto"}, e(TabelaP,{minW:480, cols:[{t:"Conta"},{t:"Saldo", n:true, w:120},{t:"Limite", n:true, w:110},{t:"Disponível", n:true, w:120}]}, negativas.map(function(x){ var d = cp.destinos.filter(function(z){ return z.cnpjId===x.bloco; })[0], pode = c.edita && d && sel && restante>0.004;
          return e("tr",{key:x.id, onClick:pode ? function(){ addDest(d.id, Math.min(restante, -x.saldo), 7, x.nome); } : undefined, title:pode ? "Enviar Pix para "+x.nome : undefined, className:pode ? "cursor-pointer hover:bg-white/10" : "", style:x.junto ? {boxShadow:"inset 4px 0 0 #d9a63a"} : undefined},
            e(Td,{forte:true, title:x.nome}, x.nome), e(Td,{n:true, cor:"text-destructive"}, "−"+BKC(-x.saldo)), e(Td,{n:true}, x.limite ? BKC(x.limite) : "—"), e(Td,{n:true, cor:x.disp<0 ? "text-destructive" : ""}, x.disp<0 ? "−"+BKC(-x.disp) : BKC(x.disp))); })))
        : e("p",{className:"px-3 py-4 text-center text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Nenhuma conta negativa agora.")))),
    // ── feitos
    feitos.length>0 && Secao("Direcionados", String(feitos.length), e(TabelaP,{minW:720, cols:[{t:"Hora", w:70},{t:"De"},{t:"Valor", n:true, w:130},{t:"Destinos"},{t:"Quem confirmou", w:140},{t:"", w:90}]}, feitos.map(function(x){
      return e(Tr,{key:x.id}, e(Td,null, x.confirmadoEm ? hm(x.confirmadoEm) : "—"), e(Td,{forte:true}, x.quem), e(Td,{n:true}, BKC(x.valor)), e(Td,{title:x.divisoes.map(function(d){ return destinoDe(d.destinoId).nome+" "+BKC(d.valor); }).join(" · ")}, x.divisoes.map(function(d){ return destinoDe(d.destinoId).nome+" "+BKC(d.valor); }).join(" · ")), e(Td,null, x.confirmadoPor || "—"),
        e("td",{className:"h-8 border-b border-border px-2 text-right"}, c.edita ? e("button",{type:"button", onClick:function(){ c.d({type:"DP", op:"reabre", id:x.id}); }, className:"h-7 rounded-md border border-border px-2 text-[clamp(13px,0.76vw,18px)] hover:bg-white/10"}, "Reabrir") : null)); }))));
}

// ── Regras do Pix: lista em ordem de prioridade, com liga/desliga
function AbaRegrasPix(){
  var c = useDP(), regras = c.dp.regras;
  return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"text-[clamp(13px,0.76vw,18px)] text-foreground"}, "O sistema olha as regras de cima para baixo. A primeira que serve vira a sugestão, com o motivo escrito. O Lucas confirma sempre."),
    e(TabelaP,{minW:720, cols:[{t:"#", w:50},{t:"Se"},{t:"Então"},{t:"Ativa", w:100}]}, regras.map(function(r){ return e(Tr,{key:r.id, apagado:!r.ativa}, e(Td,null, String(r.n)), e(Td,{title:r.se}, r.se), e(Td,{title:r.entao}, r.entao),
      e("td",{className:"h-8 border-b border-border px-2.5"}, e("button",{type:"button", disabled:!c.edita, onClick:function(){ c.d({type:"DP", op:"regra", id:r.id, patch:{ativa:!r.ativa}}); }, className:"h-7 w-16 rounded-md border px-2 text-[clamp(13px,0.76vw,18px)] "+(r.ativa ? "border-success text-success" : "border-border text-foreground")+(c.edita ? " hover:bg-white/10" : "")}, r.ativa ? "Sim" : "Não"))); })),
    c.edita && e("div",{className:"flex justify-end"}, e(Botao,{onClick:function(){ c.d({type:"DP", op:"demo"}); }, title:"Volta os pedidos de teste para a fila"}, "Recarregar pedidos de teste")));
}

// ── Contas das representantes: o Lucas marca 1 ou 2 vezes por dia a conta de envio de cada representante (24/10/2026). Sem marca, vale o CNPJ da maquininha ou do link dela.
function AbaContasRep(){
  var c = useDP(), s = c.s, cp = c.cp, dp = c.dp, fixas = dp.contasRep || {};
  // todas as representantes que o sistema conhece: as do Link de pagamento (maquininha/link), as que já são destino e as que já mandaram Pix
  var vistos = {}, reps = [];
  var junta = function(n){ n = String(n||"").replace(/^Representante\s+/i, "").trim(); if(!n) return; var ja = reps.filter(function(r){ return mesmaRep(r.nome, n); })[0]; if(ja){ if(n.length>ja.nome.length){ ja.nome = n; ja.id = n; } return; } reps.push({id:n, nome:n}); };
  ((s.lp && s.lp.vinculos) || []).forEach(function(v){ junta(v.representante); });
  cp.destinos.filter(function(d){ return d.tipo==="REPRESENTANTE" && d.ativo; }).forEach(function(d){ junta(d.nome); });
  dp.pix.forEach(function(x){ if(x.origem==="rep") junta(x.repOrigem); });
  reps.sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var contas = cp.destinos.filter(function(d){ return d.ativo && (d.tipo==="CNPJ" || d.tipo==="FORNECEDOR" || d.tipo==="PRESTADOR"); });
  var chave = function(r){ return r.nome.replace(/^Representante\s+/i, ""); };
  var nFix = reps.filter(function(r){ return fixas[chave(r)] || fixas[r.nome]; }).length;
  var meiosDe = function(nome){ var lp = s.lp; if(!lp) return "—"; var v = vinculoDeRep(lp, nome); if(!v) return "—"; var l = []; (lp.meios||[]).forEach(function(m){ if(m.id===v.maquininhaId || m.id===v.linkId) l.push(m.nome); }); return l.length ? l.join(" · ") : "—"; };
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Representantes", v:String(reps.length)}, {t:"Com conta fixa", v:String(nFix), cor:nFix ? "text-success" : ""}, {t:"Automático (CNPJ da maquininha)", v:String(reps.length-nFix)}, {t:"Valor fora do normal", v:BKC(dp.limiteAlto || 7000), cor:"text-warning"}]}),
    Secao("Conta de cada representante", "marque a conta; vale para os próximos Pix dela", e("div",{className:"flex flex-col"},
      e("p",{className:"border-b border-border px-3 py-2 text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Sem marca, o sistema sugere o CNPJ da maquininha ou do link da representante. Pix de valor fora do normal ignora a conta marcada e sobe para o Lucas definir."),
      e(TabelaP,{minW:760, cols:[{t:"Representante", w:200}, {t:"Maquininha ou link"}, {t:"CNPJ dela", w:90}, {t:"Conta de envio", w:280}, {t:"", w:90}]},
        reps.map(function(r){ var k = chave(r), fx = fixas[k] || fixas[r.nome] || "", cn = cnpjDaRep(s, k);
          return e(Tr,{key:r.id},
            e(Td,{forte:true, title:r.nome}, k), e(Td,{title:meiosDe(k)}, meiosDe(k)), e(Td,null, cn ? "CNPJ "+cn : "—"),
            e("td",{className:"border-b border-border px-1.5"}, e("select",{value:fx, disabled:!c.edita, "aria-label":"Conta de envio de "+k, onChange:function(ev){ c.d({type:"DP", op:"fixa", rep:k, destinoId:ev.target.value}); }, className:CAMPO+" truncate"},
              e("option",{value:""}, cn ? "Automático · CNPJ "+cn : "Automático"), contas.map(function(d){ return e("option",{key:d.id, value:d.id}, tipoNome(d.tipo)+" · "+d.nome); }))),
            e("td",{className:"border-b border-border px-1.5 text-center"}, fx ? e("span",{className:"inline-flex h-6 items-center rounded px-2 text-[clamp(13px,0.76vw,18px)] font-bold", style:{background:"#4ade8026", color:"#4ade80"}}, "FIXA") : e("span",{className:"text-[clamp(13px,0.76vw,18px)] text-foreground/70"}, "auto"))); })))),
    Secao("Valor fora do normal", "sobe para o Lucas e passa na frente da fila", e("div",{className:"flex flex-wrap items-end gap-3 px-3 py-3"},
      e("div",{style:{minWidth:220}}, e(Rotulo,{t:"A partir de (R$)", id:"dp-lim"}), e(CampoDinheiro,{value:dp.limiteAlto || 7000, label:"Valor fora do normal", disabled:!c.edita, className:CAMPO+" text-right tabular-nums", onChange:function(v){ if(v>0) c.d({type:"DP", op:"limite", valor:v}); }})),
      e("p",{className:"min-w-0 flex-1 text-[clamp(13px,0.76vw,18px)] text-foreground"}, "Um Pix desse valor, de qualquer representante, não usa a conta fixa. Ele passa na frente da fila e o Lucas escolhe a conta."))));
}

// Tela própria (1º do menu do Financeiro): Direcionar | Regras
function AbaDirecionarPix(){
  var sv = useState("dir"), v = sv[0], setV = sv[1];
  var seg = e(Segmentado,{opcoes:[["dir","Direcionar"],["contas","Contas das representantes"],["regras","Regras do Pix"]], atual:v, onMudar:setV});
  return e("div",{className:"-mt-2 flex flex-col gap-2"},
    v!=="dir" && e("div",{className:"flex justify-end"}, seg),
    v==="dir" ? e(AbaDirecionar,{extra:seg}) : v==="contas" ? e(AbaContasRep,null) : e(AbaRegrasPix,null));
}
export { AbaDirecionar, AbaRegrasPix, AbaDirecionarPix };
