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
import { ACESSO_FF, baixaDividas, diasEntre } from "@/apps/montagem/domain/financeiro-familiar";
import { dataReferencia, posicaoEm } from "@/apps/montagem/domain/saldos-contas";
import { BKC } from "@/apps/montagem/lib/format";
import { SeletorConta } from "@/apps/montagem/components/seletor-conta";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var hm = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2, "0")+":"+String(d.getMinutes()).padStart(2, "0"); };
var hmH = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2, "0")+"h"+String(d.getMinutes()).padStart(2, "0"); };
var curto = function(ts){ var m = Math.max(0, Math.floor((Date.now()-ts)/60000)); return m<1 ? "agora" : m<60 ? m+" min" : Math.floor(m/60)+" h "+String(m%60).padStart(2, "0"); };
var haQuanto = function(ts){ var m = Math.max(0, Math.floor((Date.now()-ts)/60000)); return m<1 ? "agora" : m<60 ? "há "+m+" min" : "há "+Math.floor(m/60)+" h "+(m%60)+" min"; };
// urgência pela espera do Pix: até 30 min verde, até 1 h amarelo, depois vermelho (pedido do Marcus 24/10/2026: bater o olho e saber o que é urgente)
var COR_ESPERA = ["#4ade80", "#f5c14b", "#f87171"];
var nivelEspera = function(ts){ var m = (Date.now()-ts)/60000; return m<30 ? 0 : m<60 ? 1 : 2; };
var SELO_ORIGEM = {interno:["Interno", "#38bdf8"], rep:["Representante", "#c084fc"]};
var Selo = function(o){ var s = SELO_ORIGEM[o]; return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-bold uppercase tracking-[.04em]", style:{background:s[1]+"26", color:s[1], border:"1px solid "+s[1]+"66"}}, s[0]); };
var SeloAlto = function(){ return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-bold uppercase tracking-[.04em]", style:{background:"#f8717126", color:"#f87171", border:"1px solid #f8717166"}}, "Valor alto"); };
// CNPJ (34, 46, 59, 67) da maquininha ou do link que a representante tem, vindo do Link de pagamento
var nmRep = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); };
var mesmaRep = function(a, b){ a = nmRep(a); b = nmRep(b); return a===b || a.indexOf(b+" ")===0 || b.indexOf(a+" ")===0; };
var cnpjDaRep = function(s, rep){ var lp = s.lp; if(!lp) return ""; var v = vinculoDeRep(lp, rep) || (lp.vinculos||[]).filter(function(x){ return mesmaRep(x.representante, rep); })[0]; if(!v) return ""; var m = (lp.meios||[]).find(function(x){ return x.id===v.maquininhaId || x.id===v.linkId; }); var q = m ? String(m.cnpjId||"").match(/(34|46|59|67)/) : null; return q ? q[1] : ""; };
var formaNome = function(f){ return f==="maquininha" ? "Maquininha" : f==="link" ? "Link" : "Pix"; };
// PARTES (Marcus, 26/10/2026): a revendedora decide COMO paga (ex.: R$ 1.500 no cartão, R$ 1.000 no Pix e R$ 500 em dinheiro). Dinheiro já está pago (pagos). Cada parte que falta (cartão, Pix, link) precisa do seu próprio destino. Sem partes no pedido, vale uma parte só: a forma dele.
var partesDe = function(p){ var l = (p.partes && p.partes.length) ? p.partes : [{forma:p.forma||"pix", valor:p.valor}]; return l.map(function(x, i){ var f = x.forma||"pix"; return {id:f+"#"+i, forma:f, valor:r2(x.valor)}; }); };
var formaLonga = function(f){ return f==="maquininha" ? "Cartão (maquininha)" : f==="link" ? "Link de pagamento" : "Pix"; };
var formaPalavra = function(f){ return f==="maquininha" ? "Cartão" : f==="link" ? "Link" : "Pix"; };
// célula de nome: nunca abrevia, quebra em outra linha
var TdN = function(p){ return e("td",{title:p.title, className:"h-8 whitespace-normal break-words border-b border-border px-2.5 py-1 text-left leading-snug "+(p.forte ? "font-semibold" : "")}, p.children); };
var tipoNome = function(t){ return (TIPOS_DESTINO[t] || ["—"])[0]; };
var FORMA = {dinheiro:"Dinheiro", link:"Link de pagamento", getnet:"Crédito à vista (Getnet)", credito:"Crédito", pix:"Pix"};
var textoPago = function(p){ return (FORMA[p.forma] || p.forma)+(p.cnpj ? " · CNPJ "+p.cnpj : "")+(p.parc ? " em "+p.parc+"x" : ""); };
var soma = function(l){ return r2((l||[]).reduce(function(t, x){ return t+(x.valor||0); }, 0)); };
// Painel: bloco neutro com BORDA PRÓPRIA (dourada) em cada um (Marcus, 26/10/2026: voltar às bordas, só com menos espaço em volta). Título centralizado e resumo embaixo do título (cor só no valor). Sem barra de rolagem por dentro.
var Painel = function(titulo, rotulo, valor, cor, filhos){ return e("section",{className:"flex min-w-0 flex-col overflow-hidden rounded-lg border-[3px] border-[#d9a63a]/85 bg-card/60"},
  e("div",{className:"flex min-h-11 flex-col items-center justify-center gap-0.5 border-b border-border bg-white/5 px-4 py-1 text-center"},
    e("h2",{className:"text-[16px] font-bold leading-tight text-foreground"}, titulo),
    valor ? e("div",{className:"flex items-baseline justify-center gap-2"}, rotulo ? e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-foreground"}, rotulo) : null, e("b",{className:"text-[16px] font-bold tabular-nums", style:{color:cor}}, valor)) : null),
  e("div",{className:"flex min-h-0 flex-1 flex-col"}, filhos)); };
var Secao = function(t, dir, filhos, p){ return e(BlocoBarra,{t:dir ? t+" · "+dir : t, compacto:true, fixo:true, cor:"azul", borda:"ouro"}, filhos); };   // bordas douradas (Marcus, 24/10/2026)
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

// Dívidas da família com PRAZO e saldo em aberto (Financeiro familiar, aba Prestadores). Só quem abre o Financeiro familiar vê (sócios). O destino é o prestador de mesmo nome em Controle de pagamentos.
function dividasDaFamilia(ff, cp, hoje){
  var out = [];
  (ff.dividas||[]).forEach(function(d){
    if(!(d.valor>0) || !d.prazo) return;
    var pr = (ff.prest||[]).find(function(x){ return x.id===d.prestId; }); if(!pr || !pr.ativo) return;
    var bx = baixaDividas(ff, d.prestId).porId[d.id], falta = bx ? bx.falta : 0; if(!(falta>0.005)) return;
    var dest = (cp.destinos||[]).filter(function(z){ return z.ativo && (z.tipo==="PRESTADOR" || z.tipo==="FAMILIA") && nmRep(z.nome)===nmRep(pr.nome); })[0];
    out.push({id:d.id, nome:pr.nome, titulo:d.titulo || d.descricao || d.codigo || "", falta:r2(falta), prazo:d.prazo, dias:diasEntre(hoje, d.prazo), destinoId:dest ? dest.id : ""}); });
  return out.sort(function(a, b){ return a.prazo.localeCompare(b.prazo); });
}

function AbaDirecionar(){
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
  var partes = sel ? partesDe(sel) : [], temPix = partes.some(function(z){ return z.forma==="pix"; });
  var ctxSug = {pontual:fornAbertos.filter(function(f){ return /^Pontual/.test(f.nome); }), cp:cp, regras:dp.regras, cnpjs:ctxCnpj, contasRep:dp.contasRep||{}, limiteAlto:dp.limiteAlto||7000, cnpjDaRep:function(rep){ return cnpjDaRep(s, rep); }};
  var fazDe = function(forma, valor){ return sugerir(Object.assign({}, sel, {valor:valor, forma:forma}), ctxSug); };
  var div = sel ? (drafts[sel.id] || []) : [], restante = sel ? r2(sel.valor-soma(div)) : 0;
  var setDiv = function(l){ var n = Object.assign({}, drafts); n[sel.id] = l; setDrafts(n); setErro(""); };
  var divDe = function(id){ return div.filter(function(x){ return x.parte===id; }); };
  var restDe = function(id){ var p = partes.filter(function(z){ return z.id===id; })[0]; return p ? r2(p.valor-soma(divDe(id))) : 0; };
  var setDivDe = function(id, l){ setDiv(div.filter(function(x){ return x.parte!==id; }).concat(l)); };
  var parteDe = function(forma){ var l = partes.filter(function(z){ return z.forma===forma; }); return l.filter(function(z){ return restDe(z.id)>0.004; })[0] || l[0] || null; };
  var parteAlvo = function(pref){ if(pref){ var q = partes.filter(function(z){ return z.id===pref; })[0] || parteDe(pref); if(q) return q; } return partes.filter(function(z){ return restDe(z.id)>0.004; })[0] || partes[0] || null; };
  var restPix = function(){ var q = parteDe("pix"); return q ? restDe(q.id) : 0; };
  var rotuloParte = function(p){ var mesmas = partes.filter(function(z){ return z.forma===p.forma; }); return formaLonga(p.forma)+(mesmas.length>1 ? " "+(mesmas.indexOf(p)+1) : ""); };
  var addDest = function(destinoId, valor, regra, conta, motivo, pref){ if(!sel) return; var pt = parteAlvo(pref); if(!pt) return; var l = divDe(pt.id), rest = restDe(pt.id), i = l.findIndex(function(x){ return x.destinoId===destinoId && (x.conta||"")===(conta||""); }), v = r2(Math.min(valor==null ? rest : valor, Math.max(rest, 0)));
    if(!(v>0)) return; if(i>=0) l[i] = Object.assign({}, l[i], {valor:r2(l[i].valor+v)}); else l.push({destinoId:destinoId, valor:v, regra:regra||0, conta:conta||"", via:pt.forma, parte:pt.id, motivo:motivo||""}); setDivDe(pt.id, l); };
  var confirmar = function(){
    if(!sel) return; if(!div.length){ setErro("Defina o destino de cada forma de pagamento."); return; }
    var aberta = partes.filter(function(p){ return Math.abs(restDe(p.id))>0.009; })[0];
    if(aberta){ var rr = restDe(aberta.id); setErro("Falta definir "+rotuloParte(aberta)+": "+(rr>0 ? "falta "+BKC(rr) : "passou "+BKC(-rr))+"."); return; }
    c.d({type:"DP", op:"divisao", id:sel.id, divisoes:div}); c.d({type:"DP", op:"confirma", id:sel.id, por:c.por});
    div.forEach(function(x){ if((x.via||"pix")!=="pix") return; var o = cp.orientacoes.filter(function(z){ return z.destinoId===x.destinoId && z.status==="aberta" && faltaDe(z)>0; })[0]; if(o) c.d({type:"CP", op:"orient_lanc", id:o.id, valor:Math.min(x.valor, faltaDe(o)), origem:sel.quem, por:c.por}); });
    var n = Object.assign({}, drafts); delete n[sel.id]; setDrafts(n); setSelId(null); setErro("");
  };
  // destinos que ainda faltam: orientações abertas + CNPJs com contas vencendo
  var faltam = cp.orientacoes.filter(function(o){ return o.status==="aberta" && faltaDe(o)>0; }).map(function(o){ var d = destinoDe(o.destinoId); return {id:d.id, nome:d.nome, tipo:d.tipo, falta:faltaDe(o), atrasada:!!(o.ate && o.ate<hojeIsoCp())}; });
  ctxCnpj.forEach(function(x){ var d = cp.destinos.filter(function(z){ return z.cnpjId===x.id; })[0]; if(d && (x.hoje+x.amanha)>0) faltam.push({id:d.id, nome:d.nome, tipo:"CNPJ", falta:r2(x.hoje+x.amanha), info:"vencem hoje e amanhã"}); });
  var sfm = useState("falta"), modoForn = sfm[0], setModoForn = sfm[1];
  var veFam = ACESSO_FF.indexOf(s.usuario)>=0 && !!(s.ff && s.ff.dividas), dividasFam = veFam ? dividasDaFamilia(s.ff, cp, hojeIsoCp()) : [], totalFam = r2(dividasFam.reduce(function(tt, x){ return tt+x.falta; }, 0)), famVenc = dividasFam.filter(function(x){ return x.dias<0; }).length;
  var fornLista = fornecedoresDoMes(cp, modoForn==="mes"), negativas = contasNegativas(s), totalNeg = r2(negativas.reduce(function(tt, x){ return tt+x.saldo; }, 0));
  var sdv = useState(""), dividindo = sdv[0], setDividindo = sdv[1], sek = useState(""), edKey = sek[0], setEdKey = sek[1];   // dividindo = forma que está dividindo; edKey = linha aberta para editar o valor
  var optsDe = function(f){ var l = [["", f==="pix" ? "Escolha a conta" : "Escolha o CNPJ", ""]];
    if(f==="pix") Object.keys(TIPOS_DESTINO).forEach(function(tp){ cp.destinos.filter(function(d){ return d.ativo && d.tipo===tp; }).forEach(function(d){ l.push([d.id, d.nome, tipoNome(tp)]); }); });
    else cp.destinos.filter(function(d){ return d.ativo && d.tipo==="CNPJ"; }).forEach(function(d){ l.push([d.id, d.nome, f==="link" ? "Link de pagamento do CNPJ" : "Maquininha do CNPJ"]); });
    return l; };
  var opcoesSel = function(lista, primeiro){ var gs = [], m = {}; lista.slice(1).forEach(function(o){ if(!m[o[2]]){ m[o[2]] = []; gs.push(o[2]); } m[o[2]].push(o); }); return [e("option",{key:"_", value:""}, primeiro)].concat(gs.map(function(g){ return e("optgroup",{key:g, label:g}, m[g].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); })); };
  // PLANO SUGERIDO (Marcus, 24/10/2026), agora POR PARTE: cada forma de pagamento recebe a sua sugestão de destino.
  var planoBase = function(forma, valor){
    var fz = fazDe(forma, valor), rest = valor, rows = [], hoje = hojeIsoCp();
    if(forma && forma!=="pix"){ var n0 = negativas.filter(function(x){ return cp.destinos.some(function(z){ return z.cnpjId===x.bloco; }); })[0], dN = n0 ? cp.destinos.filter(function(z){ return z.cnpjId===n0.bloco; })[0] : cp.destinos.filter(function(z){ return z.cnpjId; })[0];
      if(dN) rows.push({destinoId:dN.id, valor:valor, motivo:(forma==="link" ? "Link" : "Maquininha")+" do CNPJ "+dN.cnpjId+(n0 ? ": a conta mais no negativo é "+n0.nome : ""), regra:0, conta:"", via:forma}); return rows; }
    var push = function(destinoId, valor, motivo, regra, conta){ var v = r2(Math.min(valor, rest)); if(!destinoId || !(v>0.004)) return; rows.push({destinoId:destinoId, valor:v, motivo:motivo, regra:regra||0, conta:conta||"", via:"pix"}); rest = r2(rest-v); };
    // REGRA (Marcus, 24/10/2026): o que FATURA (conta de CNPJ) não se mistura com o que NÃO fatura (fornecedor, representante, família...). O que é 34 fica no 34; venda no link de um CNPJ volta para esse CNPJ.
    var link = (sel.pagos||[]).filter(function(q){ return q.forma==="link" && q.cnpj; })[0];
    if(link){ var dl = cp.destinos.filter(function(z){ return z.cnpjId===link.cnpj; })[0]; if(dl){ push(dl.id, rest, "Venda paga no link do CNPJ "+link.cnpj+": o dinheiro volta para o mesmo CNPJ", 1); return rows; } }
    // 1) o que NÃO fatura: metas das representantes, fornecedores pontuais e vencidos
    if(sel.origem==="rep") (cp.orientacoes||[]).filter(function(o){ return o.status==="aberta" && faltaDe(o)>0; }).forEach(function(o){ var d = destinoDe(o.destinoId); if(rest>0.004 && d.tipo==="REPRESENTANTE" && d.nome!==sel.repOrigem) push(d.id, faltaDe(o), "Fecha a meta de Pix direto de "+d.nome, 3); });
    var getnet = (sel.pagos||[]).some(function(q){ return q.forma==="getnet"; });
    if(rest>0.004 && (valor>3000 || (getnet && valor>750))) fornAbertos.filter(function(f){ return /^Pontual/.test(f.nome); }).forEach(function(f){ push(f.destinoId, f.total, "Fecha "+f.nome+(f.dMin ? " (até "+f.dMin.slice(8,10)+"/"+f.dMin.slice(5,7)+")" : ""), valor>3000 ? 4 : 5); });
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
    else if(fz && fz.opcoes[0]) push(fz.opcoes[0].destinoId, rest, fz.opcoes[0].motivo, fz.opcoes[0].regra);
    return rows;
  };
  // regra (Marcus, 26/10/2026): a intenção é UM pagamento só. A sugestão é sempre uma conta só, com o valor inteiro (a conta que mais receberia na sugestão); dividir é escolha do Lucas.
  var planoDe = function(forma, valor){ var rows = planoBase(forma, valor);
    if(rows.length>1){ var mx = rows.reduce(function(a, b){ return b.valor>a.valor ? b : a; }, rows[0]); rows = [Object.assign({}, mx, {valor:valor})]; }
    return rows; };
  var porTipo = {interno:0, rep:0}; todosFila.forEach(function(x){ porTipo[x.origem] += x.valor; });
  var maisAntigo = todosFila.length ? Math.min.apply(null, todosFila.map(function(x){ return x.recebidoEm; })) : null;
  // ── LAYOUT D1 (Marcus, 26/10/2026): pedido aberto em cima (3 colunas) e, embaixo, Contas a pagar | Contas negativas | Vendas. Cada bloco só ocupa a altura do que tem; sem pedido, os 3 blocos sobem.
  var ROT = "mb-1 text-[11px] font-medium uppercase tracking-[.05em]", OURO = {color:"#f5c14b"};
  var estado = !div.length ? "" : restante>0.009 ? "falta "+BKC(restante) : restante<-0.009 ? "passou "+BKC(-restante) : "fechado";
  // Vendas: linhas aparecem conforme os pedidos chegam
  var blocoVendas = Painel("Vendas", "Na fila", fila.length ? fila.length+" · "+BKC(soma(fila.map(function(x){ return {valor:x.valor}; }))) : "0", "#4ade80", fila.length ? e("div",{className:"min-w-0"}, e(TabelaP,{minW:340, cols:[{t:"Revendedora"},{t:"Forma", w:108},{t:"Direcionar", n:true, w:100},{t:"Espera", w:68}]}, fila.map(function(x){ var on = sel && sel.id===x.id, esp = COR_ESPERA[nivelEspera(x.recebidoEm)];
    return e("tr",{key:x.id, onClick:function(){ setSelId(x.id); setErro(""); }, className:"cursor-pointer "+(on ? "bg-[#1f3a6e]" : "hover:bg-white/10"), style:{boxShadow:"inset 4px 0 0 "+esp}, title:"Chegou às "+hm(x.recebidoEm)+" · "+(x.origem==="interno" ? "Interno Sorelly · atendida por "+x.atendente : "Representante"+(x.maq ? " · "+x.maq : ""))+(x.vendas>0 ? " · vendas "+BKC(x.vendas) : "")+(x.valor>=limAlto ? " · valor alto" : "")},
      e("td",{className:"h-8 whitespace-normal break-words border-b border-border px-2.5 py-1 text-left font-semibold leading-snug"}, doisNomes(String(x.quem).replace(/^Representante\s+/, ""))+(x.valor>=limAlto ? " ↑" : "")),
      e("td",{className:"h-8 whitespace-normal border-b border-border px-2.5 py-1 text-left leading-snug "+(partesDe(x).some(function(q){ return q.forma!=="pix"; }) ? "font-semibold text-warning" : "")}, partesDe(x).map(function(q){ return formaPalavra(q.forma); }).join(" + ")),
      e("td",{className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-right font-bold tabular-nums", style:{color:"#f5c14b"}}, BKC(x.valor)),
      e("td",{className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-left font-semibold tabular-nums", style:{color:esp}}, curto(x.recebidoEm))); })))
    : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Nenhuma venda na fila."));
  // Contas a pagar (fornecedores): no modo "o que falta" só Falta, Limite e Situação; em "todos do mês" entram A pagar e Pago
  var ddmm = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7) : "—"; };
  var tabelaFam = dividasFam.length ? e("div",{className:"min-w-0"}, e(TabelaP,{minW:340, cols:[{t:"Dívida"},{t:"Falta", n:true, w:104},{t:"Prazo", w:64},{t:"Situação", w:88}]}, dividasFam.map(function(x){ var venc = x.dias<0, perto = x.dias>=0 && x.dias<=7, pode = c.edita && x.destinoId && sel && temPix && restPix()>0.004;
      return e(Tr,{key:x.id, onClick:pode ? function(){ addDest(x.destinoId, Math.min(restPix(), x.falta), 8, "", "Dívida da família · prazo "+ddmm(x.prazo), "pix"); } : undefined, title:pode ? "Adicionar "+x.nome+" como destino do Pix aberto" : (x.destinoId ? undefined : "Sem destino cadastrado para "+x.nome+" em Controle de pagamentos")},
        e(TdN,{forte:true, title:x.nome+(x.titulo ? " · "+x.titulo : "")}, x.nome+(x.titulo ? " · "+x.titulo : "")), e(Td,{n:true, forte:true, cor:venc ? "text-warning" : ""}, BKC(x.falta)), e(Td,{cor:venc ? "text-warning" : ""}, ddmm(x.prazo)),
        e("td",{className:"h-8 border-b border-border px-2.5 text-left"}, e("span",{className:"inline-block whitespace-nowrap rounded px-2 py-0.5 text-[13px] font-bold "+(venc ? "bg-warning/25 text-warning" : perto ? "bg-warning/15 text-warning" : "bg-white/10 text-foreground")}, venc ? "Vencido" : perto ? "Em "+x.dias+" d" : "Aberto"))); })))
    : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Nenhuma dívida da família com prazo em aberto.");
  var colsForn = modoForn==="mes" ? [{t:"Fornecedor"},{t:"A pagar", n:true, w:98},{t:"Pago", n:true, w:98},{t:"Falta", n:true, w:98},{t:"Limite", w:64},{t:"Situação", w:100}] : [{t:"Fornecedor"},{t:"Falta", n:true, w:96},{t:"Limite", w:68},{t:"Situação", w:84}];
  var blocoContas = Painel("Contas a pagar", "Falta", modoForn==="familia" ? BKC(totalFam) : BKC(totalFalta), "#f5c14b", e("div",{className:"flex flex-col"},
    e("div",{className:"flex items-center justify-between gap-2 border-b border-border px-3 py-1.5"}, e(Segmentado,{opcoes:[["falta","Falta"],["mes","Todos do mês"]].concat(veFam ? [["familia","Família"+(famVenc ? " · "+famVenc : "")]] : []), atual:modoForn, onMudar:setModoForn}), e("span",{className:"text-[13px] text-foreground"}, modoForn==="familia" ? dividasFam.length+(dividasFam.length===1 ? " dívida" : " dívidas") : fornLista.length+(fornLista.length===1 ? " fornecedor" : " fornecedores"))),
    modoForn==="familia" ? tabelaFam : fornLista.length ? e("div",{className:"min-w-0"}, e(TabelaP,{minW:modoForn==="mes" ? 540 : 320, cols:colsForn}, fornLista.map(function(x){ var venc = x.saldo>0.005 && x.ate && x.ate<hojeIsoCp(), pode = c.edita && x.destinoId && sel && temPix && restPix()>0.004 && x.saldo>0.005;
        var falta = e(Td,{n:true, forte:true, cor:x.saldo>0.005 ? (venc ? "text-warning" : "") : "text-success"}, x.saldo>0.005 ? BKC(x.saldo) : "—");
        var limite = e(Td,{title:x.obs||undefined, cor:venc ? "text-warning" : ""}, x.ate ? x.ate.slice(8,10)+"/"+x.ate.slice(5,7) : (x.obs ? "ver" : "—"));
        var situacao = e("td",{className:"h-8 border-b border-border px-2.5 text-left"}, e("span",{className:"inline-block whitespace-nowrap rounded px-2 py-0.5 text-[13px] font-bold "+(x.saldo<=0.005 ? "bg-success/20 text-success" : venc ? "bg-warning/25 text-warning" : "bg-white/10 text-foreground")}, x.saldo<=0.005 ? "Pago" : (venc ? "Vencido" : "Aberto")));
        return e(Tr,{key:x.id, apagado:x.saldo<=0.005, onClick:pode ? function(){ addDest(x.destinoId, Math.min(restPix(), x.saldo), 0, "", "Conta a pagar · falta "+BKC(x.saldo), "pix"); } : undefined, title:pode ? "Adicionar "+x.nome+" como destino do Pix aberto" : undefined},
          e(TdN,{forte:true, title:x.nome}, x.nome), modoForn==="mes" && e(Td,{n:true}, BKC(x.aPagar)), modoForn==="mes" && e(Td,{n:true, cor:x.pago>0.005 ? "text-success" : "", forte:true}, BKC(x.pago)), falta, limite, situacao); })))
      : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Sem saldo de fornecedores. Rode scripts/planilha-fornecedores.mjs com a planilha."),
    modoForn!=="familia" && e("details",{className:"border-t border-border px-3 py-1.5 text-[13px] text-foreground"}, e("summary",{className:"cursor-pointer"}, "Como o Pix quita"), e("p",{className:"pt-1"}, "Pontual: o Pix quita a parcela aberta mais antiga e o que passar vai para a próxima. Cartão quita o 1 a 10 do mês seguinte, com desconto estimado de "+String(descontoCartao()).replace(".", ",")+"% (média dos últimos 3 meses). Planilha de "+(geradoEm() ? geradoEm().slice(8,10)+"/"+geradoEm().slice(5,7) : "—")+"."))));
  // Contas negativas
  var blocoNegativas = Painel("Contas negativas", negativas.length+(negativas.length===1 ? " conta" : " contas"), negativas.length ? "−"+BKC(-totalNeg) : "R$ 0,00", "#f87171", negativas.length ? e("div",{className:"min-w-0"}, e(TabelaP,{minW:330, cols:[{t:"Conta"},{t:"Saldo", n:true, w:118},{t:"Disponível", n:true, w:112}]}, negativas.map(function(x){ var d = cp.destinos.filter(function(z){ return z.cnpjId===x.bloco; })[0], pode = c.edita && d && sel && restante>0.004;
      return e("tr",{key:x.id, onClick:pode ? function(){ addDest(d.id, Math.min(restante, -x.saldo), 7, x.nome, "Conta negativa · saldo −"+BKC(-x.saldo)); } : undefined, title:(pode ? "Enviar Pix para "+x.nome+" · " : "")+"Limite "+(x.limite ? BKC(x.limite) : "—"), className:pode ? "cursor-pointer hover:bg-white/10" : "", style:x.junto ? {boxShadow:"inset 4px 0 0 #d9a63a"} : undefined},
        e(TdN,{forte:true, title:x.nome}, x.nome), e(Td,{n:true, cor:"text-destructive"}, "−"+BKC(-x.saldo)), e(Td,{n:true, cor:x.disp<0 ? "text-destructive" : ""}, x.disp<0 ? "−"+BKC(-x.disp) : BKC(x.disp))); })))
    : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Nenhuma conta negativa agora."));
  // Pedido aberto: cabeçalho, 4 valores em uma linha e 3 colunas (Sugestão | Para onde vai | Confirmar)
  // ── PEDIDO ABERTO · modelo 3B (Marcus, 26/10/2026): Valores em linhas | Para onde enviar (sugestão do sistema ou lista fechada com Editar e ✕) | Confirmar
  // ── PEDIDO ABERTO · versão 2 (Marcus, 26/10/2026): resumo dos valores à esquerda e, à direita, uma linha baixa por pagamento (destino numa seleção, motivo embaixo, estado à direita). Dividir e Editar só aparecem quando precisam.
  // ── PEDIDO ABERTO · versão B final (Marcus, 26/10/2026): resumo numa coluna só, compacto e mais largo (cada pagamento já feito em uma linha) | tabela de pagamentos: Pagamento · Conta · Valor · Motivo · ações. Cada pagamento: Inteiro (uma conta) ou Dividir (várias contas); a sugestão é a etiqueta dentro do motivo.
  var Ln = function(rot, val, cor, fundo, recuo){ return e("div",{className:"flex h-7 items-center justify-between gap-3 border-b border-border pr-3 "+(recuo ? "pl-7" : "pl-3"), style:fundo ? {background:"rgba(217,166,58,.12)"} : undefined}, e("span",{className:"whitespace-nowrap text-[13px] text-foreground"}, rot), e("b",{className:"whitespace-nowrap text-[13px] font-semibold tabular-nums", style:cor ? {color:cor} : undefined}, val)); };
  var NOME = "text-[13px] font-semibold leading-snug break-words";
  var mistura = div.some(function(x){ return destinoDe(x.destinoId).tipo==="CNPJ"; }) && div.some(function(x){ return destinoDe(x.destinoId).tipo!=="CNPJ"; });
  var fechado = div.length>0 && partes.every(function(p){ return Math.abs(restDe(p.id))<=0.009; });
  var planos = {}; partes.forEach(function(p){ planos[p.id] = planoDe(p.forma, p.valor); });
  var temSugestao = partes.some(function(p){ return !divDe(p.id).length && (planos[p.id]||[]).length>0; });
  var usarTodas = function(){ var novo = div.slice(); partes.forEach(function(p){ if(divDe(p.id).length) return; (planos[p.id]||[]).forEach(function(x){ novo.push({destinoId:x.destinoId, valor:x.valor, regra:x.regra, conta:x.conta, via:p.forma, parte:p.id, motivo:x.motivo}); }); }); setDiv(novo); setDividindo(""); };
  var btn = "h-7 rounded-md border border-border px-2.5 text-[13px] hover:bg-white/10";
  var COLP = "min-[1100px]:grid-cols-[156px_minmax(0,1fr)]", COLS = "min-[1100px]:grid-cols-[240px_104px_minmax(0,1fr)_64px]";
  var LINHA = "grid grid-cols-1 items-center gap-x-2 gap-y-1 border-b border-border/60 py-1 min-h-10 last:border-b-0 "+COLS;
  var linha = function(k, a, b, c2, d2, e2){ return e("div",{key:k, className:LINHA}, b || e("div"), c2 || e("div"), d2 || e("div"), e2 || e("div")); };
  // contas bancárias de cada sócio vêm do Financeiro familiar (só quem abre o Financeiro familiar vê); a lista abre em cascata: grupo > nome > conta
  var contasDe = function(d){ if(!veFam || d.tipo!=="FAMILIA" || !d.personaId) return []; return ((s.ff||{}).contasBanc||[]).filter(function(cb){ return cb.personaId===d.personaId && cb.ativo!==false; }).map(function(cb){ return cb.nome; }); };
  // contas bancárias de cada CNPJ (Saldo das contas); clicar no CNPJ abre as contas dele
  var contasPorCnpj = (function(){ var m = {}, sc = s.saldosContas; if(!sc) return m; var ref = dataReferencia(sc, hojeIsoCp()); if(!ref) return m; posicaoEm(sc, ref).blocos.forEach(function(b){ m[b.id] = b.contas.filter(function(x){ return !x.conta.bloqueada && x.conta.tipo!=="CAIXA"; }).map(function(x){ return x.conta.nome; }); }); return m; })();
  var comContas = function(d, cs){ return cs.length ? {nome:d.nome, itens:cs.map(function(n){ return {nome:n, id:d.id, conta:n}; })} : {nome:d.nome, id:d.id, conta:""}; };
  // lista em níveis: grupo > nome > conta (cresce sozinha com o que for cadastrado)
  var arvoreDe = function(f){
    var cnpjs = cp.destinos.filter(function(d){ return d.ativo && d.tipo==="CNPJ"; }).map(function(d){ return f==="pix" ? comContas(d, contasPorCnpj[d.cnpjId] || []) : {nome:d.nome, id:d.id, conta:""}; });
    if(f!=="pix") return cnpjs;
    return Object.keys(TIPOS_DESTINO).map(function(tp){ return {nome:tipoNome(tp), itens:tp==="CNPJ" ? cnpjs : cp.destinos.filter(function(d){ return d.ativo && d.tipo===tp; }).map(function(d){ return comContas(d, contasDe(d)); })}; }).filter(function(g){ return g.itens.length; }); };
  var renderParte = function(p){
    var id = p.id, f = p.forma, ld = divDe(id), rest = restDe(id), pl = planos[id] || [], dest = optsDe(f), sug = !ld.length;
    var toDiv = function(x, valor){ return {destinoId:x.destinoId, valor:valor==null ? x.valor : valor, regra:x.regra, conta:x.conta, via:f, parte:id, motivo:x.motivo}; };
    // lista de contas mostrada: o que já foi definido; se nada foi definido e o sistema sugere várias contas, as sugestões aparecem como linhas editáveis
    var lista = ld.length ? ld : (pl.length>1 ? pl.map(function(x){ return toDiv(x); }) : []);
    var restL = r2(p.valor-soma(lista));
    var dividir = lista.length>1 || dividindo===id;
    var estadoP = sug ? (pl.length ? "" : "falta definir") : rest>0.009 ? "falta "+BKC(rest) : rest<-0.009 ? "passou "+BKC(-rest) : "";
    var corP = (sug || Math.abs(rest)>0.009) ? "#f5c14b" : "#4ade80";
    var aceita = function(){ setDivDe(id, pl.map(function(x){ return toDiv(x); })); setDividindo(""); };
    var aceitaBtn = function(){ return e("button",{type:"button", onClick:aceita, title:"Aceitar a sugestão", "aria-label":"Aceitar a sugestão", className:"grid h-7 w-7 place-items-center justify-self-center rounded-md border border-primary bg-primary/20 text-[13px] font-bold text-primary hover:bg-primary/30"}, "✓"); };
    var muda = function(m){
      if(m==="inteiro"){ if(lista.length>1) setDivDe(id, [Object.assign({}, lista[0], {valor:p.valor})]); setDividindo(""); setEdKey(""); return; }
      var base = lista.length ? lista : (pl.length ? [toDiv(pl[0], p.valor)] : []);
      if(base.length===1){ var meio = r2(base[0].valor/2); setDivDe(id, [Object.assign({}, base[0], {valor:r2(base[0].valor-meio)})]); }
      else if(base.length>1) setDivDe(id, base);
      setDividindo(id); };
    var chave = c.edita ? e("div",{className:"inline-flex w-fit overflow-hidden rounded-md border border-border"}, [["inteiro","Inteiro"],["dividir","Dividir"]].map(function(o, n){ var on = (dividir ? "dividir" : "inteiro")===o[0];
      return e("button",{key:o[0], type:"button", onClick:function(){ muda(o[0]); }, className:"h-6 px-2 text-[11px] "+(n ? "border-l border-border " : "")+(on ? "bg-primary/20 font-bold text-primary" : "hover:bg-white/10")}, o[1]); })) : null;
    var celPag = e("div",{className:"flex flex-col items-center gap-0.5 text-center"}, e("b",{className:"text-[13px] font-semibold leading-snug"}, rotuloParte(p)), e("div",{className:"flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5"}, chave, estadoP ? e("span",{className:"text-[13px] font-semibold", style:{color:corP}}, estadoP) : null));
    var seletor = function(valorAtual, contaAtual, onEscolher, primeiro, rotulo){ var d = valorAtual ? destinoDe(valorAtual) : null, txt = d ? d.nome+(contaAtual ? " · "+contaAtual : "") : primeiro; return c.edita ? e(SeletorConta,{nos:arvoreDe(f), texto:txt, rotulo:rotulo, onEscolher:onEscolher, vazio:!d}) : e("span",{className:NOME}, d ? txt : "—"); };
    var txtValor = function(v){ return e("div",{className:"flex justify-center"}, e("span",{className:"inline-flex h-7 items-center rounded-md border border-border bg-white/5 px-2.5 text-[13px] font-semibold tabular-nums"}, BKC(v))); };
    var fmtSug = function(x, k){ var tx = String(x.motivo||""), ix = tx.indexOf(" · "), l1 = ix>=0 ? tx.slice(0, ix+2) : tx, l2 = ix>=0 ? tx.slice(ix+3) : ""; return e("span",{key:k, className:"block"}, destinoDe(x.destinoId).nome+" — "+l1, l2 ? e("br") : null, l2); };
    var sugTxt = pl.length ? e("div",{className:"flex flex-col gap-1"}, pl.map(function(x, k){ return fmtSug(x, k); })) : "Nenhuma sugestão serviu. Escolha a conta.";
    var txtSug = function(s){ return e("div",{className:"text-center text-[13px] leading-snug"}, s); };
    var primeiroRot = f==="pix" ? "Escolha a conta" : "Escolha o CNPJ";
    var linhas = [];
    if(!dividir){
      var un = ld.length ? ld[0] : (pl.length ? pl[0] : null);
      linhas.push(linha("u", celPag, seletor(un ? un.destinoId : "", un ? (un.conta||"") : "", function(v, cta){ setDivDe(id, [{destinoId:v, valor:p.valor, regra:0, conta:cta, via:f, parte:id, motivo:(un && un.destinoId===v && !cta) ? un.motivo : "Escolhida por você"}]); }, primeiroRot, "Conta para "+rotuloParte(p)),
        txtValor(p.valor), txtSug(sugTxt), sug && pl.length>0 && c.edita ? aceitaBtn() : null));
    } else {
      lista.forEach(function(x, n){ var d = destinoDe(x.destinoId), k = sel.id+"|"+id+"|"+n, edita = edKey===k;
        linhas.push(linha(k, n===0 ? celPag : null, seletor(x.destinoId, x.conta||"", function(v, cta){ var l = lista.slice(); l[n] = Object.assign({}, x, {destinoId:v, conta:cta, motivo:"Escolhida por você"}); setDivDe(id, l); }, primeiroRot, "Conta "+(n+1)+" de "+rotuloParte(p)),
          edita ? e(CampoDinheiro,{value:x.valor || null, label:"Valor para "+d.nome, disabled:!c.edita, className:CAMPO+" text-right tabular-nums", onChange:function(v){ var l = lista.slice(), nv = r2(Math.min(v || 0, p.valor)); l[n] = Object.assign({}, x, {valor:nv}); if(l.length===2){ var o2 = 1-n; l[o2] = Object.assign({}, l[o2], {valor:r2(p.valor-nv)}); } setDivDe(id, l); }}) : txtValor(x.valor),
          txtSug(pl.length>1 ? (pl[n] ? fmtSug(pl[n], n) : "") : (n===0 ? sugTxt : "")),
          !c.edita ? null : sug ? (n===0 ? aceitaBtn() : null) : e("div",{className:"flex justify-center gap-1.5"}, e("button",{type:"button", title:"Editar o valor", "aria-label":"Editar o valor", onClick:function(){ setEdKey(edita ? "" : k); }, className:"h-7 rounded-md border px-2 text-[13px] hover:bg-white/10 "+(edita ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border")}, edita ? "OK" : "✎"),
            e("button",{type:"button", "aria-label":"Tirar "+d.nome, onClick:function(){ var l = lista.filter(function(z, kk){ return kk!==n; }); if(l.length===1) l[0] = Object.assign({}, l[0], {valor:p.valor}); setDivDe(id, l); setEdKey(""); if(l.length<2) setDividindo(""); }, className:"h-7 w-7 rounded-md border border-border text-[13px] hover:bg-white/10"}, "✕")))); });
      if(!sug) linhas.push(linha("add", null, seletor("", "", function(v, cta){
          var l = lista.slice();
          if(restL>0.004) l.push({destinoId:v, valor:restL, regra:0, conta:cta, via:f, parte:id, motivo:"Escolhida por você"});
          else if(l.length){ var ult = l[l.length-1], meio = r2(ult.valor/2); l[l.length-1] = Object.assign({}, ult, {valor:r2(ult.valor-meio)}); l.push({destinoId:v, valor:meio, regra:0, conta:cta, via:f, parte:id, motivo:"Escolhida por você"}); }
          else l.push({destinoId:v, valor:p.valor, regra:0, conta:cta, via:f, parte:id, motivo:"Escolhida por você"});
          setDivDe(id, l); setDividindo(""); }, "Adicionar conta", "Adicionar conta em "+rotuloParte(p)), null,
        txtSug((sug ? "Sugestão: " : "Soma ")+BKC(soma(lista))+(sug ? "" : " · "+(restL>0.009 ? "falta "+BKC(restL) : restL<-0.009 ? "passou "+BKC(-restL) : "fechado"))),
        c.edita && ld.length>0 ? e("button",{type:"button", onClick:function(){ setDivDe(id, []); setDividindo(""); setEdKey(""); }, className:btn+" justify-self-center", title:"Volta para a sugestão do sistema"}, "Sugestão") : null));
    }
    return e("div",{key:id, className:"grid flex-1 grid-cols-1 content-center items-start gap-x-2 border-b-2 border-border px-3 py-0.5 "+COLP}, e("div",{className:"flex min-h-10 items-center justify-center py-1"}, celPag), e("div",{className:"flex min-w-0 flex-col justify-center"}, linhas));
  };
  var pedido = !sel ? null : Painel("Direcionar pagamento", "", "", "", e("div",{className:"flex flex-col"},
    e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-border px-3 py-1.5"}, Selo(sel.origem), sel.valor>=limAlto && SeloAlto(), e("span",{className:"min-w-0 flex-1 truncate text-[16px] font-bold leading-tight text-foreground", title:sel.quem}, sel.quem),
      e("span",{className:"text-[13px] text-foreground"}, (sel.origem==="interno" ? "Atendida por "+sel.atendente : (sel.maq||""))+" · chegou às "+hmH(sel.recebidoEm)+" · pagamento aguardando há ", e("b",{style:{color:COR_ESPERA[nivelEspera(sel.recebidoEm)]}}, curto(sel.recebidoEm)))),
    sel.obs && e("p",{className:"border-b border-border px-3 py-1.5 text-[13px] text-foreground"}, "Obs.: "+sel.obs),
    e("div",{className:"grid grid-cols-1 min-[1100px]:grid-cols-[310px_minmax(0,1fr)]"},
      e("div",{className:"min-w-0 bg-white/[0.03] min-[1100px]:border-r min-[1100px]:border-border"}, Ln("Vendas", sel.vendas>0 ? BKC(sel.vendas) : "—"), Ln("A pagar", sel.vendas>0 ? BKC(sel.aPagar) : "—"), Ln("Já pago", BKC(soma(sel.pagos)), "#4ade80"),
        (sel.pagos||[]).length ? sel.pagos.map(function(p, n){ return e("div",{key:"pg"+n}, Ln(textoPago(p), BKC(p.valor), null, false, true)); }) : Ln("Nada pago ainda", "", null, false, true),
        Ln("Falta pagar", BKC(sel.valor), "#f5c14b", true)),
      e("div",{className:"flex min-w-0 flex-col"},
        e("div",{className:"hidden gap-x-2 border-b border-border bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[.05em] text-foreground min-[1100px]:grid "+COLP}, e("span",{className:"text-center"},"Pagamento"), e("div",{className:"grid gap-x-2 "+COLS}, e("span",{className:"text-center"},"Conta"), e("span",{className:"text-center"},"Valor"), e("span",{className:"text-center"},"Sugestão"), e("span"))),
        partes.map(renderParte))),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2 border-t border-border bg-white/[0.04] px-3 py-1.5"},
      e("span",{className:"mr-auto flex flex-wrap items-baseline gap-x-2 text-[13px] text-foreground"}, e("b",{className:"font-semibold"}, "Falta enviar"), e("b",{className:"font-semibold tabular-nums", style:{color:!div.length ? "#f5c14b" : fechado ? "#4ade80" : "#f5c14b"}}, restante<-0.009 ? "Passou "+BKC(-restante) : BKC(Math.max(restante, 0))), e("span",null, "· "+partes.length+(partes.length===1 ? " pagamento" : " pagamentos")+" · Enviado "+BKC(soma(div)))),
      c.edita && temSugestao && e("button",{type:"button", onClick:usarTodas, className:"h-8 rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10"}, "Usar todas as sugestões"),
      mistura && e("span",{className:"text-[13px] text-warning"}, "Atenção: mistura conta que fatura (CNPJ) com conta que não fatura."),
      erro && e("span",{className:"text-[13px] text-destructive"}, erro),
      c.edita && e("button",{type:"button", onClick:confirmar, disabled:!div.length, className:"h-8 rounded-md border px-4 text-[13px] font-semibold "+(div.length ? "border-primary bg-primary/20 text-primary hover:bg-primary/30" : "border-border bg-card text-foreground opacity-60")}, "OK · enviar"))));
  return e("div",{className:"-mx-2 -mb-2 -mt-3 flex flex-col gap-1.5 md:-mx-3 md:-mb-3 [&_td]:!text-center [&_th]:!text-center [&_input]:!text-center [&_select]:!text-center"},
    !c.edita && e("span",{className:"px-2 text-[13px] text-foreground"}, "Só quem direciona Pix confirma. Você pode ver."),
    pedido,
    e("div",{className:"grid grid-cols-1 items-stretch gap-1.5 min-[1280px]:grid-cols-3"}, blocoContas, blocoNegativas, blocoVendas),
    // ── feitos
    feitos.length>0 && Painel("Direcionados", "Pedidos", String(feitos.length), "#4ade80", e(TabelaP,{minW:720, cols:[{t:"Hora", w:70},{t:"De"},{t:"Valor", n:true, w:130},{t:"Destinos"},{t:"Quem confirmou", w:140},{t:"", w:90}]}, feitos.map(function(x){
      return e(Tr,{key:x.id}, e(Td,null, x.confirmadoEm ? hm(x.confirmadoEm) : "—"), e(Td,{forte:true}, x.quem), e(Td,{n:true}, BKC(x.valor)), e(Td,{title:x.divisoes.map(function(d){ return destinoDe(d.destinoId).nome+" "+BKC(d.valor); }).join(" · ")}, x.divisoes.map(function(d){ return destinoDe(d.destinoId).nome+" "+BKC(d.valor); }).join(" · ")), e(Td,null, x.confirmadoPor || "—"),
        e("td",{className:"h-8 border-b border-border px-2 text-right"}, c.edita ? e("button",{type:"button", onClick:function(){ c.d({type:"DP", op:"reabre", id:x.id}); }, className:"h-7 rounded-md border border-border px-2 text-[13px] hover:bg-white/10"}, "Reabrir") : null)); }))));
}

// ── Regras do Pix: lista em ordem de prioridade, com liga/desliga
function AbaRegrasPix(){
  var c = useDP(), regras = c.dp.regras;
  return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"text-[13px] text-foreground"}, "O sistema olha as regras de cima para baixo. A primeira que serve vira a sugestão, com o motivo escrito. O Lucas confirma sempre."),
    e(TabelaP,{minW:720, cols:[{t:"#", w:50},{t:"Se"},{t:"Então"},{t:"Ativa", w:100}]}, regras.map(function(r){ return e(Tr,{key:r.id, apagado:!r.ativa}, e(Td,null, String(r.n)), e(Td,{title:r.se}, r.se), e(Td,{title:r.entao}, r.entao),
      e("td",{className:"h-8 border-b border-border px-2.5"}, e("button",{type:"button", disabled:!c.edita, onClick:function(){ c.d({type:"DP", op:"regra", id:r.id, patch:{ativa:!r.ativa}}); }, className:"h-7 w-16 rounded-md border px-2 text-[13px] "+(r.ativa ? "border-success text-success" : "border-border text-foreground")+(c.edita ? " hover:bg-white/10" : "")}, r.ativa ? "Sim" : "Não"))); })),
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
      e("p",{className:"border-b border-border px-3 py-2 text-[13px] text-foreground"}, "Sem marca, o sistema sugere o CNPJ da maquininha ou do link da representante. Pix de valor fora do normal ignora a conta marcada e sobe para o Lucas definir."),
      e(TabelaP,{minW:760, cols:[{t:"Representante", w:200}, {t:"Maquininha ou link"}, {t:"CNPJ dela", w:90}, {t:"Conta de envio", w:280}, {t:"", w:90}]},
        reps.map(function(r){ var k = chave(r), fx = fixas[k] || fixas[r.nome] || "", cn = cnpjDaRep(s, k);
          return e(Tr,{key:r.id},
            e(Td,{forte:true, title:r.nome}, k), e(Td,{title:meiosDe(k)}, meiosDe(k)), e(Td,null, cn ? "CNPJ "+cn : "—"),
            e("td",{className:"border-b border-border px-1.5"}, e("select",{value:fx, disabled:!c.edita, "aria-label":"Conta de envio de "+k, onChange:function(ev){ c.d({type:"DP", op:"fixa", rep:k, destinoId:ev.target.value}); }, className:CAMPO+" truncate"},
              e("option",{value:""}, cn ? "Automático · CNPJ "+cn : "Automático"), contas.map(function(d){ return e("option",{key:d.id, value:d.id}, tipoNome(d.tipo)+" · "+d.nome); }))),
            e("td",{className:"border-b border-border px-1.5 text-center"}, fx ? e("span",{className:"inline-flex h-6 items-center rounded px-2 text-[13px] font-bold", style:{background:"#4ade8026", color:"#4ade80"}}, "FIXA") : e("span",{className:"text-[13px] text-foreground/70"}, "auto"))); })))),
    Secao("Valor fora do normal", "sobe para o Lucas e passa na frente da fila", e("div",{className:"flex flex-wrap items-end gap-3 px-3 py-3"},
      e("div",{style:{minWidth:220}}, e(Rotulo,{t:"A partir de (R$)", id:"dp-lim"}), e(CampoDinheiro,{value:dp.limiteAlto || 7000, label:"Valor fora do normal", disabled:!c.edita, className:CAMPO+" text-right tabular-nums", onChange:function(v){ if(v>0) c.d({type:"DP", op:"limite", valor:v}); }})),
      e("p",{className:"min-w-0 flex-1 text-[13px] text-foreground"}, "Um Pix desse valor, de qualquer representante, não usa a conta fixa. Ele passa na frente da fila e o Lucas escolhe a conta."))));
}

export { AbaDirecionar, AbaContasRep, AbaRegrasPix };
