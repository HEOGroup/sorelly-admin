// Sorelly Admin · montagem — pages/DirecionarPix.js
// Financeiro → Contas → Pagamentos → "Direcionar" e "Regras" (23/10/2026, layout 3 aprovado pelo Marcus, ampliado). O Lucas recebe os pedidos de conta do Pix, os de DENTRO da Sorelly (nunca têm conta fixa)
// e os das REPRESENTANTES (chegam do app), divide cada um em vários destinos e CONFIRMA sempre. O sistema sugere com o motivo escrito (regras em lista, com liga/desliga). Lógica em domain/direcionar-pix.js.
// Quando um destino tem orientação aberta (aba Orientações), confirmar também lança o Pix nela.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { BTN_GRUPO, BlocoPainel, GrupoBtn, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { orientacaoCaixa } from "@/apps/montagem/domain/orientacao-pix";
import { Botao, CAMPO, FaixaTotais, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { setBaixas, setClasse, setLancamentos, setPf, filtrar } from "@/apps/montagem/domain/contas-empresa";
import { TIPOS_DESTINO, direcionado, faltaDe, hojeIsoCp } from "@/apps/montagem/domain/controle-pagamentos";
import { sugerir } from "@/apps/montagem/domain/direcionar-pix";
import { PedidosKit } from "@/apps/montagem/pages/dp/PedidosKit";
import { descontoCartao, fornecedoresDoMesPf, geradoEm } from "@/apps/montagem/domain/pf-mes";
import { vinculoDeRep } from "@/apps/montagem/domain/link-pagamento";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { ACESSO_FF, baixaDividas, diasEntre } from "@/apps/montagem/domain/financeiro-familiar";
import { dataReferencia, posicaoEm } from "@/apps/montagem/domain/saldos-contas";
import { BKC } from "@/apps/montagem/lib/format";
import { SeletorConta } from "@/apps/montagem/components/seletor-conta";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { e, Fragment, useEffect, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var hm = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2, "0")+":"+String(d.getMinutes()).padStart(2, "0"); };
var hmH = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2, "0")+"h"+String(d.getMinutes()).padStart(2, "0"); };
var ateNomes = function(n, k){ var w = String(n||"").trim().split(/\s+/), q = 0, out = [], part = /^(de|da|do|dos|das|e)$/i; for(var i = 0; i<w.length; i++){ var nome = !part.test(w[i]); if(nome && q===k) break; if(nome) q++; out.push(w[i]); } while(out.length && part.test(out[out.length-1])) out.pop(); return out.join(" "); };   // só os primeiros nomes (Direcionados)
var curto = function(ts){ var m = Math.max(0, Math.floor((Date.now()-ts)/60000)); return m<1 ? "agora" : m<60 ? m+" min" : Math.floor(m/60)+" h "+String(m%60).padStart(2, "0"); };
var haQuanto = function(ts){ var m = Math.max(0, Math.floor((Date.now()-ts)/60000)); return m<1 ? "agora" : m<60 ? "há "+m+" min" : "há "+Math.floor(m/60)+" h "+(m%60)+" min"; };
// urgência pela espera do Pix: até 30 min verde, até 1 h amarelo, depois vermelho (pedido do Marcus 24/10/2026: bater o olho e saber o que é urgente)
var COR_ESPERA = ["var(--positivo)", "#f5c14b", "var(--negativo)"];
var nivelEspera = function(ts){ var m = (Date.now()-ts)/60000; return m<30 ? 0 : m<60 ? 1 : 2; };
var SELO_ORIGEM = {interno:["Interno", "#38bdf8"], rep:["Representante", "#c084fc"]};
var Selo = function(o){ var s = SELO_ORIGEM[o]; return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-bold uppercase tracking-[.04em]", style:{background:s[1]+"26", color:s[1], border:"1px solid "+s[1]+"66"}}, s[0]); };
var SeloAlto = function(){ return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-bold uppercase tracking-[.04em]", style:{background:"#f8717126", color:"var(--negativo)", border:"1px solid #f8717166"}}, "Valor alto"); };
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
// TabelaP com linha de total no fim (03/11/2026): rodape entra depois das linhas
var TabelaT = function(p){ return e(TabelaP,{minW:p.minW, cols:p.cols}, p.children, p.rodape); };
var tipoNome = function(t){ return (TIPOS_DESTINO[t] || ["—"])[0]; };
var FORMA = {dinheiro:"Dinheiro", link:"Link de pagamento", getnet:"Crédito à vista (Getnet)", credito:"Crédito", pix:"Pix"};
var textoPago = function(p){ return (FORMA[p.forma] || p.forma)+(p.cnpj ? " · CNPJ "+p.cnpj : "")+(p.parc ? " em "+p.parc+"x" : ""); };
var soma = function(l){ return r2((l||[]).reduce(function(t, x){ return t+(x.valor||0); }, 0)); };
// Painel: bloco neutro com borda em linha normal (Marcus, 12/11/2026: tirou a borda dourada de 3 px; antes, 26/10/2026, era dourada). Título centralizado e resumo embaixo do título (cor só no valor). Sem barra de rolagem por dentro.
var FAIXA_CTRL = "flex h-11 items-center justify-between gap-2 border-b border-border px-3";
var Painel = function(titulo, rotulo, valor, cor, filhos){ return e("section",{className:"flex min-w-0 flex-col overflow-hidden rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 [&_.overflow-x-auto]:!rounded-none [&_.overflow-x-auto]:!border-0"},
  e("div",{className:"flex min-h-8 flex-col items-center justify-center border-b border-border bg-[var(--bloco-titulo)] px-4 text-center text-white"},
    e("h2",{className:"py-1.5 text-[13px] font-bold leading-tight text-foreground"}, titulo),
    valor ? e("div",{className:"flex items-baseline justify-center gap-2"}, rotulo ? e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-foreground"}, rotulo) : null, e("b",{className:"text-[16px] font-bold tabular-nums", style:{color:cor}}, valor)) : null),
  e("div",{className:"flex min-h-0 flex-1 flex-col"}, filhos)); };
var Secao = function(t, dir, filhos, p){ return e(BlocoBarra,{t:dir ? t+" · "+dir : t, compacto:true, fixo:true, cor:"azul", borda:"normal"}, filhos); };   // borda em linha normal (Marcus, 12/11/2026: sem borda colorida nos blocos do Direcionar)
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
// todas as contas por CNPJ (sem bloqueadas e sem aplicações), para o botão "Ver todas as contas" e para trocar o Rotativo pela conta Sicredi do mesmo CNPJ
function contasTodas(s){
  var sc = s.saldosContas; if(!sc) return [];
  var ref = dataReferencia(sc, hojeIsoCp()); if(!ref) return [];
  return posicaoEm(sc, ref).blocos.map(function(b){ return {id:b.id, contas:b.contas.filter(function(x){ return !x.conta.bloqueada && x.conta.tipo!=="CAIXA"; }).map(function(x){ return {id:x.conta.id, nome:x.conta.nome, saldo:r2(x.saldo), limite:x.conta.limite||0, disp:r2(x.disp)}; })}; }).filter(function(b){ return b.contas.length; });
}
var ehRotativo = function(n){ return /rotativo/i.test(String(n||"")); };
// Pix não vai para o Rotativo (Marcus, 26/10/2026): ele fica dentro do Sicredi do mesmo CNPJ; para liquidar o Rotativo o Pix vai para o Sicredi
function contaPixDe(blocos, bloco, nome){ if(!ehRotativo(nome)) return nome; var b = blocos.filter(function(z){ return z.id===bloco; })[0], alvo = b && b.contas.filter(function(x){ return /sicredi/i.test(x.nome) && !ehRotativo(x.nome); })[0]; return alvo ? alvo.nome : nome; }
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
  var vcs = useState(null), verComp = vcs[0], setVerComp = vcs[1];   // comprovante aberto para conferir (Marcus, 12/11/2026: a conferência fica no Direcionar)
  // H&O também recebe Pix (Marcus, 26/10/2026): cria o destino uma vez, se ainda não existir (o estado vem do servidor e não passa pela migração)
  var semHO = c.edita && !cp.destinos.some(function(d){ return d.cnpjId==="HO"; });
  useEffect(function(){ if(semHO) c.d({type:"CP", op:"destino_add", nome:"CNPJ H&O · H&O Apps", tipo:"CNPJ", cnpjId:"HO"}); }, [semHO]);   // eslint-disable-line react-hooks/exhaustive-deps
  var limAlto = dp.limiteAlto || 7000;
  // valor alto passa na frente da fila; depois, o mais antigo (24/10/2026)
  var fila = dp.pix.filter(function(x){ return x.status==="fila" && (orig==="todos" || x.origem===orig); }).sort(function(a, b){ var ra = a.origem==="rep", rb = b.origem==="rep"; if(ra!==rb) return ra ? -1 : 1; var ha = a.valor>=limAlto, hb = b.valor>=limAlto; if(ha!==hb) return ha ? -1 : 1; return a.recebidoEm-b.recebidoEm; });   // representante sempre na frente (Marcus, 04/11/2026)
  var feitos = dp.pix.filter(function(x){ return x.status==="direcionado"; }).sort(function(a, b){ return (b.confirmadoEm||0)-(a.confirmadoEm||0); });
  var todosFila = dp.pix.filter(function(x){ return x.status==="fila"; });
  var sel = dp.pix.filter(function(x){ return x.id===selId && x.status==="fila"; })[0] || fila[0] || null;
  var hojeDir = r2(feitos.filter(function(x){ return (x.confirmadoEm||0) > new Date().setHours(0, 0, 0, 0); }).reduce(function(t, x){ return t+x.valor; }, 0));
  var destinoDe = function(id){ return cp.destinos.filter(function(d){ return d.id===id; })[0] || {nome:"(removido)", tipo:"CNPJ"}; };
  var optDest = [["", "Escolha para quem enviar"]]; Object.keys(TIPOS_DESTINO).forEach(function(t){ cp.destinos.filter(function(d){ return d.ativo && d.tipo===t; }).forEach(function(d){ optDest.push([d.id, tipoNome(t)+" · "+d.nome]); }); });
  // fornecedores: o que FALTA para fechar o mês atual e a data limite (planilha, aba RESUMO MÊS; Marcus 24/10/2026). Clicar adiciona o fornecedor como destino.
  var fornAbertos = fornecedoresDoMesPf(s.pf, cp).map(function(f){ return {id:f.id, nome:f.nome, total:f.saldo, dMin:f.ate, obs:f.obs, destinoId:f.destinoId}; });
  var totalFalta = r2(fornAbertos.reduce(function(tt, f){ return tt+f.total; }, 0));
  var partes = sel ? partesDe(sel) : [], temPix = partes.some(function(z){ return z.forma==="pix"; });
  var ctxSug = {pontual:fornAbertos.filter(function(f){ return /^Pontual/.test(f.nome); }), cp:cp, regras:dp.regras, cnpjs:ctxCnpj, contasRep:dp.contasRep||{}, contasRepExtra:dp.contasRepExtra||{}, regrasPx:(s.px && s.px.regras)||[], limiteAlto:dp.limiteAlto||7000, cnpjDaRep:function(rep){ return cnpjDaRep(s, rep); }};
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
  var fornLista = fornecedoresDoMesPf(s.pf, cp, modoForn==="mes"), negativas = contasNegativas(s), todasC = contasTodas(s), totalNeg = r2(negativas.reduce(function(tt, x){ return tt+x.saldo; }, 0));
  var stt = useState({}), travados = stt[0], setTravados = stt[1];   // pagamentos confirmados (travados) até apertar Editar (Marcus, 12/11/2026)
  var sdv = useState(""), dividindo = sdv[0], setDividindo = sdv[1], sek = useState(""), edKey = sek[0], setEdKey = sek[1], spv = useState({}), pendV = spv[0], setPendV = spv[1], sva = useState(false), verTodas = sva[0], setVerTodas = sva[1], sab = useState({}), abertosC = sab[0], setAbertosC = sab[1];   // dividindo = forma que está dividindo; edKey = linha aberta para editar o valor
  var optsDe = function(f){ var l = [["", f==="pix" ? "Escolha a conta" : "Escolha o CNPJ", ""]];
    if(f==="pix") Object.keys(TIPOS_DESTINO).forEach(function(tp){ cp.destinos.filter(function(d){ return d.ativo && d.tipo===tp; }).forEach(function(d){ l.push([d.id, d.nome, tipoNome(tp)]); }); });
    else cp.destinos.filter(function(d){ return d.ativo && d.tipo==="CNPJ"; }).forEach(function(d){ l.push([d.id, d.nome, f==="link" ? "Link de pagamento do CNPJ" : "Maquininha do CNPJ"]); });
    return l; };
  var opcoesSel = function(lista, primeiro){ var gs = [], m = {}; lista.slice(1).forEach(function(o){ if(!m[o[2]]){ m[o[2]] = []; gs.push(o[2]); } m[o[2]].push(o); }); return [e("option",{key:"_", value:""}, primeiro)].concat(gs.map(function(g){ return e("optgroup",{key:g, label:g}, m[g].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); })); };
  // PLANO SUGERIDO (Marcus, 24/10/2026), agora POR PARTE: cada forma de pagamento recebe a sua sugestão de destino.
  var planoBase = function(forma, valor){
    var fz = fazDe(forma, valor), rest = valor, rows = [], hoje = hojeIsoCp();
    // cartão e link da REPRESENTANTE: o CNPJ é o da maquininha ou do link dela (Marcus, 09/11/2026; não existe "maquininha do CNPJ mais negativo")
    if(forma && forma!=="pix" && sel.origem==="rep"){ var cnR = cnpjDaRep(s, sel.repOrigem), dR = cnR ? cp.destinos.filter(function(z){ return z.cnpjId===cnR; })[0] : null;
      if(dR){ rows.push({destinoId:dR.id, valor:valor, motivo:(forma==="link" ? "Link" : "Maquininha")+" de "+sel.repOrigem+": CNPJ "+cnR, regra:12, conta:"", via:forma}); return rows; } }
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
      mesmas.forEach(function(x, k){ if(rest>0.004) push(dn.id, k===mesmas.length-1 ? rest : -x.saldo, "CNPJ "+bl+": "+x.nome+" está no negativo (−"+BKC(-x.saldo)+")"+(ehRotativo(x.nome) ? " · o Pix vai para o Sicredi, que liquida o Rotativo" : ""), 7, contaPixDe(todasC, bl, x.nome)); }); }
    else if(fz && fz.opcoes[0]) push(fz.opcoes[0].destinoId, rest, fz.opcoes[0].motivo, fz.opcoes[0].regra);
    return rows;
  };
  // regra (Marcus, 26/10/2026): a intenção é UM pagamento só. A sugestão é sempre uma conta só, com o valor inteiro (a conta que mais receberia na sugestão); dividir é escolha do Lucas.
  var planoDe = function(forma, valor){ var rows = planoBase(forma, valor);
    if(rows.length>1){ var mx = rows.reduce(function(a, b){ return b.valor>a.valor ? b : a; }, rows[0]); rows = [Object.assign({}, mx, {valor:valor})]; }
    return rows; };
  var porTipo = {interno:0, rep:0}; todosFila.forEach(function(x){ porTipo[x.origem] += x.valor; });
  var maisAntigo = todosFila.length ? Math.min.apply(null, todosFila.map(function(x){ return x.recebidoEm; })) : null;
  // ── LAYOUT D1 (Marcus, 26/10/2026): pedido aberto em cima (3 colunas) e, embaixo, Vendas | Contas negativas | Contas a pagar. Cada bloco só ocupa a altura do que tem; sem pedido, os 3 blocos sobem. (03/11/2026: Vendas à esquerda, onde entram todos os recebimentos; Contas a pagar à direita; coluna Forma tirada.)
  var ROT = "mb-1 text-[11px] font-medium uppercase tracking-[.05em]", OURO = {color:"#f5c14b"};
  var estado = !div.length ? "" : restante>0.009 ? "falta "+BKC(restante) : restante<-0.009 ? "passou "+BKC(-restante) : "fechado";
  // Linha de total no fim de cada tabela (03/11/2026, Marcus: o resumo sai do título do bloco; as tabelas ficam como eram)
  var linhaTotal = function(cels){ return e(Tr,{key:"total", total:true}, cels.map(function(c, i){ return e(Td,{key:i, n:c.d, forte:true}, c.t); })); };
  // Vendas: linhas aparecem conforme os pedidos chegam
  var blocoVendas = Painel("Aguardando na Fila", "", "", "var(--positivo)", fila.length ? e("div",{className:"min-w-0"}, e(TabelaT,{rodape:linhaTotal([{t:"Total"}, {t:fila.length+(fila.length===1 ? " pedido" : " pedidos")}, {t:BKC(soma(fila.map(function(x){ return {valor:x.valor}; }))), d:true}, {t:""}]), minW:340, cols:[{t:"Revendedora"},{t:"Origem", w:92},{t:"Direcionar", n:true, w:100},{t:"Espera", w:68}]}, fila.map(function(x){ var on = sel && sel.id===x.id, esp = COR_ESPERA[nivelEspera(x.recebidoEm)];
    return e("tr",{key:x.id, onClick:function(){ setSelId(x.id); setErro(""); }, className:"cursor-pointer "+(on ? "bg-[#1f3a6e]" : "hover:bg-white/10"), title:"Chegou às "+hm(x.recebidoEm)+" · "+(x.origem==="interno" ? "Interno Sorelly · atendida por "+x.atendente : "Representante"+(x.maq ? " · "+x.maq : ""))+(x.vendas>0 ? " · vendas "+BKC(x.vendas) : "")+(x.valor>=limAlto ? " · valor alto" : "")},
      e("td",{className:"h-8 whitespace-normal break-words border-b border-border px-2.5 py-1 text-left font-semibold leading-snug"}, (x.origem==="rep" ? (x.revendedora ? doisNomes(x.revendedora) : "—") : doisNomes(x.quem))+(x.valor>=limAlto ? " ↑" : "")),
      e("td",{className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-center font-semibold", style:x.origem==="rep" ? {color:"#93C5FD"} : undefined, title:x.origem==="rep" ? "Representante "+(x.repOrigem||"") : "Interno Sorelly"}, x.origem==="rep" ? doisNomes(x.repOrigem || String(x.quem).replace(/^Representante\s+/, "")) : "Interno"),
      e("td",{className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-right font-bold tabular-nums", style:{color:"#f5c14b"}}, BKC(x.valor)),
      e("td",{className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-left font-semibold tabular-nums", style:{color:esp}}, curto(x.recebidoEm))); })))
    : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Nenhuma venda na fila."));
  // Contas a pagar (fornecedores): no modo "o que falta" só Falta, Limite e Situação; em "todos do mês" entram A pagar e Pago
  var ddmm = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7) : "—"; };
  var tabelaFam = dividasFam.length ? e("div",{className:"min-w-0"}, e(TabelaT,{rodape:linhaTotal([{t:"Total"}, {t:BKC(totalFam), d:true}, {t:""}, {t:""}]), minW:340, cols:[{t:"Dívida"},{t:"Falta", n:true, w:104},{t:"Prazo", w:64},{t:"Situação", w:88}]}, dividasFam.map(function(x){ var venc = x.dias<0, perto = x.dias>=0 && x.dias<=7, pode = c.edita && x.destinoId && sel && temPix && restPix()>0.004;
      return e(Tr,{key:x.id, onClick:pode ? function(){ addDest(x.destinoId, Math.min(restPix(), x.falta), 8, "", "Dívida da família · prazo "+ddmm(x.prazo), "pix"); } : undefined, title:pode ? "Adicionar "+x.nome+" como destino do Pix aberto" : (x.destinoId ? undefined : "Sem destino cadastrado para "+x.nome+" em Controle de pagamentos")},
        e(TdN,{forte:true, title:x.nome+(x.titulo ? " · "+x.titulo : "")}, x.nome+(x.titulo ? " · "+x.titulo : "")), e(Td,{n:true, forte:true, cor:venc ? "text-warning" : ""}, BKC(x.falta)), e(Td,{cor:venc ? "text-warning" : ""}, ddmm(x.prazo)),
        e("td",{className:"h-8 border-b border-border px-2.5 text-left"}, e("span",{className:"inline-block whitespace-nowrap rounded px-2 py-0.5 text-[13px] font-bold "+(venc ? "bg-warning/25 text-warning" : perto ? "bg-warning/15 text-warning" : "bg-white/10 text-foreground")}, venc ? "Vencido" : perto ? "Em "+x.dias+" d" : "Aberto"))); })))
    : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Nenhuma dívida da família com prazo em aberto.");
  var colsForn = modoForn==="mes" ? [{t:"Fornecedor"},{t:"A pagar", n:true, w:98},{t:"Pago", n:true, w:98},{t:"Falta", n:true, w:98},{t:"Limite", w:64},{t:"Situação", w:100}] : [{t:"Fornecedor"},{t:"Falta", n:true, w:96},{t:"Limite", w:68},{t:"Situação", w:84}];
  var blocoContas = Painel("Pagamentos para Fornecedores", "", "", "#f5c14b", e("div",{className:"flex flex-col"},
    modoForn==="familia" ? tabelaFam : fornLista.length ? e("div",{className:"min-w-0"}, e(TabelaT,{rodape:linhaTotal(modoForn==="mes" ? [{t:"Total"}, {t:BKC(r2(fornLista.reduce(function(tt, x){ return tt+(x.aPagar||0); }, 0))), d:true}, {t:BKC(r2(fornLista.reduce(function(tt, x){ return tt+(x.pago||0); }, 0))), d:true}, {t:BKC(totalFalta), d:true}, {t:""}, {t:""}] : [{t:"Total"}, {t:BKC(totalFalta), d:true}, {t:""}, {t:""}]), minW:modoForn==="mes" ? 540 : 320, cols:colsForn}, fornLista.map(function(x){ var venc = x.saldo>0.005 && x.ate && x.ate<hojeIsoCp(), pode = c.edita && x.destinoId && sel && temPix && restPix()>0.004 && x.saldo>0.005;
        var falta = e(Td,{n:true, forte:true, cor:x.saldo>0.005 ? (venc ? "text-warning" : "") : "text-success"}, x.saldo>0.005 ? BKC(x.saldo) : "—");
        var limite = e(Td,{title:x.obs||undefined, cor:venc ? "text-warning" : ""}, x.ate ? x.ate.slice(8,10)+"/"+x.ate.slice(5,7) : (x.obs ? "ver" : "—"));
        var situacao = e("td",{className:"h-8 border-b border-border px-2.5 text-left"}, e("span",{className:"inline-block whitespace-nowrap rounded px-2 py-0.5 text-[13px] font-bold "+(x.saldo<=0.005 ? "bg-success/20 text-success" : venc ? "bg-warning/25 text-warning" : "bg-white/10 text-foreground")}, x.saldo<=0.005 ? "Pago" : (venc ? "Vencido" : "Aberto")));
        return e(Tr,{key:x.id, apagado:x.saldo<=0.005, onClick:pode ? function(){ addDest(x.destinoId, Math.min(restPix(), x.saldo), 0, "", "Conta a pagar · falta "+BKC(x.saldo), "pix"); } : undefined, title:pode ? "Adicionar "+x.nome+" como destino do Pix aberto" : undefined},
          e(TdN,{forte:true, title:x.nome}, x.nome), modoForn==="mes" && e(Td,{n:true}, BKC(x.aPagar)), modoForn==="mes" && e(Td,{n:true, cor:x.pago>0.005 ? "text-success" : "", forte:true}, BKC(x.pago)), falta, limite, situacao); })))
      : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Sem saldo de fornecedores. Rode scripts/planilha-fornecedores.mjs com a planilha."),
    null));
  // Contas negativas
  var dinheiroC = function(v){ return v<0 ? "−"+BKC(-v) : BKC(v); };
  var nomeCnpj = function(id){ if(id==="PF") id = "ITM";  var d = cp.destinos.filter(function(z){ return z.cnpjId===id; })[0]; return d ? d.nome : id==="HO" ? "CNPJ H&O · H&O Apps" : id; };
  var linhaConta = function(x, blocoId, negativa){ var d = cp.destinos.filter(function(z){ return z.cnpjId===blocoId; })[0], pode = c.edita && d && sel && restante>0.004, conta = contaPixDe(todasC, blocoId, x.nome), v = negativa ? Math.min(restante, -x.saldo) : restante, bloco = blocoId==="ITM" || blocoId==="PART" ? "PF" : blocoId;   // coluna CNPJ: conta de pessoa física mostra PF (Marcus, 04/11/2026), não o código interno
    return e("tr",{key:x.id, onClick:pode ? function(){ addDest(d.id, v, 7, conta, (negativa ? "Conta negativa · saldo −"+BKC(-x.saldo) : "Conta de "+nomeCnpj(bloco))+(conta!==x.nome ? " · Pix vai para "+conta+" (liquida o Rotativo)" : "")); } : undefined, title:(pode ? "Enviar Pix para "+conta+" · " : "")+"Limite "+(x.limite ? BKC(x.limite) : "—"), className:pode ? "cursor-pointer hover:bg-white/10" : ""},
      negativa && e(Td,{forte:true, title:nomeCnpj(bloco)}, bloco), e(TdN,{forte:true, title:x.nome}, x.nome), e(Td,{cor:x.saldo<0 ? "text-[var(--negativo)]" : x.saldo>0 ? "text-[var(--positivo)]" : ""}, dinheiroC(x.saldo)), e(Td,{cor:x.disp<0 ? "text-[var(--negativo)]" : x.disp>0 ? "text-[var(--positivo)]" : ""}, dinheiroC(x.disp))); };
  var blocoNegativas = Painel("Contas negativas", "", "", "var(--negativo)", e("div",{className:"flex flex-col"}, negativas.length ? e("div",{className:"min-w-0"}, e(TabelaT,{rodape:linhaTotal([{t:"Total"}, {t:negativas.length+(negativas.length===1 ? " conta" : " contas")}, {t:dinheiroC(totalNeg), d:true}, {t:dinheiroC(r2(negativas.reduce(function(tt, x){ return tt+x.disp; }, 0))), d:true}]), minW:400, cols:[{t:"CNPJ", w:60},{t:"Conta"},{t:"Saldo", n:true, w:118},{t:"Disponível", n:true, w:112}]}, negativas.map(function(x){ return linhaConta(x, x.bloco, true); })))
    : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Nenhuma conta negativa agora.")));
  // Pedido aberto: cabeçalho, 4 valores em uma linha e 3 colunas (Sugestão | Para onde vai | Confirmar)
  // ── PEDIDO ABERTO · modelo 3B (Marcus, 26/10/2026): Valores em linhas | Para onde enviar (sugestão do sistema ou lista fechada com Editar e ✕) | Confirmar
  // ── PEDIDO ABERTO · versão 2 (Marcus, 26/10/2026): resumo dos valores à esquerda e, à direita, uma linha baixa por pagamento (destino numa seleção, motivo embaixo, estado à direita). Dividir e Editar só aparecem quando precisam.
  // ── PEDIDO ABERTO · versão B final (Marcus, 26/10/2026): resumo numa coluna só, compacto e mais largo (cada pagamento já feito em uma linha) | tabela de pagamentos: Pagamento · Conta · Valor · Motivo · ações. Cada pagamento: Inteiro (uma conta) ou Dividir (várias contas); a sugestão é a etiqueta dentro do motivo.
  var NOME = "text-[13px] font-semibold leading-snug break-words";
  var mistura = div.some(function(x){ return destinoDe(x.destinoId).tipo==="CNPJ"; }) && div.some(function(x){ return destinoDe(x.destinoId).tipo!=="CNPJ"; });
  var fechado = div.length>0 && partes.every(function(p){ return Math.abs(restDe(p.id))<=0.009; });
  var planos = {}; partes.forEach(function(p){ planos[p.id] = planoDe(p.forma, p.valor); });
  var temSugestao = partes.some(function(p){ return !divDe(p.id).length && (planos[p.id]||[]).length>0; });
  var usarTodas = function(){ var novo = div.slice(); partes.forEach(function(p){ if(divDe(p.id).length) return; (planos[p.id]||[]).forEach(function(x){ novo.push({destinoId:x.destinoId, valor:x.valor, regra:x.regra, conta:x.conta, via:p.forma, parte:p.id, motivo:x.motivo}); }); }); setDiv(novo); setDividindo(""); };
  var btn = "h-7 rounded-md border border-border px-2.5 text-[13px] hover:bg-white/10";
  // BLOCO EM GRADE COM LINHAS (Marcus, 11/11/2026: "nada escrito no meio do nada, tem que ter linhas"): cada informação fica numa célula com título; as linhas vêm do gap-px sobre o fundo da cor da linha.
  var GR = "200px 118px 420px 132px minmax(260px,1fr) 104px";   // Conta larga: nenhuma conta quebra; Sugestão e Ação mais à direita (Marcus, 12/11/2026)
  var CEL = "flex min-h-8 min-w-0 items-center justify-center bg-card px-2.5 py-1 text-center text-[13px]";
  var CABC = "flex min-h-[30px] items-center justify-center bg-[var(--bloco-colunas)] px-2.5 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-white";
  var linha = function(k, a, b, c2, d2, e2){ return {k:k, b:b, c2:c2, d2:d2, e2:e2}; };
  // contas bancárias de cada sócio vêm do Financeiro familiar (só quem abre o Financeiro familiar vê); a lista abre em cascata: grupo > nome > conta
  var contasDe = function(d){ if(!veFam || d.tipo!=="FAMILIA" || !d.personaId) return []; return ((s.ff||{}).contasBanc||[]).filter(function(cb){ return cb.personaId===d.personaId && cb.ativo!==false; }).map(function(cb){ return cb.nome; }); };
  // contas bancárias de cada CNPJ (Saldo das contas); clicar no CNPJ abre as contas dele
  var contasPorCnpj = (function(){ var m = {}, sc = s.saldosContas; if(!sc) return m; var ref = dataReferencia(sc, hojeIsoCp()); if(!ref) return m; posicaoEm(sc, ref).blocos.forEach(function(b){ m[b.id] = b.contas.filter(function(x){ return !x.conta.bloqueada && x.conta.tipo!=="CAIXA" && !ehRotativo(x.conta.nome); }).map(function(x){ return x.conta.nome; }); }); return m; })();
  // saldo de cada conta do CNPJ (Marcus, 12/11/2026: ao abrir as contas, mostrar o saldo)
  var saldoPorConta = (function(){ var m = {}, sc = s.saldosContas; if(!sc) return m; var ref = dataReferencia(sc, hojeIsoCp()); if(!ref) return m; posicaoEm(sc, ref).blocos.forEach(function(bl){ m[bl.id] = {}; bl.contas.forEach(function(x){ m[bl.id][x.conta.nome] = x.saldo; }); }); return m; })();
  // largura do box de contas: do tamanho da conta de nome MAIS COMPRIDO + o maior saldo (Marcus, 12/11/2026: "compacte um pouco mais")
  var largConta = (function(){ var mx = 0; Object.keys(contasPorCnpj).forEach(function(k){ contasPorCnpj[k].forEach(function(n){ mx = Math.max(mx, String(n).length); }); }); cp.destinos.forEach(function(x){ if(x.tipo==="CNPJ") mx = Math.max(mx, String(x.nome).length); }); var nome = mx*7.8+20, saldo = 15*7.8+20; return {larg:Math.max(300, Math.min(580, Math.round(nome+saldo+40))), w0:Math.round(100*nome/(nome+saldo))}; })();
  var comContas = function(d, cs){ var sd = saldoPorConta[d.cnpjId] || {}; return cs.length ? {nome:d.nome, itens:cs.map(function(n){ return {nome:n, id:d.id, conta:n, cols:[n, sd[n]==null ? "—" : (sd[n]<0 ? "−"+BKC(-sd[n]) : BKC(sd[n]))], w:[largConta.w0, 100-largConta.w0], heads:["Conta", "Saldo"], cores:[null, sd[n]>0 ? "var(--positivo)" : sd[n]<0 ? "var(--negativo)" : null]}; })} : {nome:d.nome, id:d.id, conta:""}; };
  // lista em níveis: grupo > nome > conta (cresce sozinha com o que for cadastrado)
  var arvoreDe = function(f){
    var cnpjs = cp.destinos.filter(function(d){ return d.ativo && d.tipo==="CNPJ"; }).map(function(d){ return f==="pix" ? comContas(d, contasPorCnpj[d.cnpjId] || []) : {nome:d.nome, id:d.id, conta:""}; });
    if(f!=="pix"){
      // cartão: Maquininha ou Link de pagamento (meios cadastrados em Link de pagamento; Getnet é da Pontual)
      var lpm = ((s.lp||{}).meios||[]).filter(function(m){ return m.ativo!==false; });
      var pont = cp.destinos.filter(function(d){ return d.ativo && /^Pontual/.test(d.nome); })[0];
      var destDe = function(m){ if(m.cnpjId) return cp.destinos.filter(function(d){ return d.ativo && d.tipo==="CNPJ" && d.cnpjId===m.cnpjId; })[0]; return m.dono ? pont : null; };
      var folhaC = function(rot, m){ var d = destDe(m); return d ? {nome:d.nome+" "+m.nome, cols:[d.nome, m.nome], w:[40, 60], heads:["Destino", rot], id:d.id, conta:rot+" · "+m.nome} : null; };
      var porNome = function(a, b2){ return a.cols[0].localeCompare(b2.cols[0]) || a.cols[1].localeCompare(b2.cols[1]); };
      // regra (Marcus, 26/10/2026): acerto de representante só mostra a maquininha e o link DELA (Link de pagamento → vínculo); acerto interno só as maquininhas de uso interno (Sorelly)
      var rep = sel && sel.origem==="rep", lpAll = s.lp || {}, vin = rep ? (vinculoDeRep(lpAll, sel.repOrigem) || (lpAll.vinculos||[]).filter(function(x){ return mesmaRep(x.representante, sel.repOrigem); })[0]) : null;
      var daRep = function(m){ return !!vin && (m.id===vin.maquininhaId || m.id===vin.linkId); }, interna = function(m){ return /sorelly|interno/i.test(String(m.uso||"")); };
      var maqs = lpm.filter(function(m){ return m.tipo==="MAQUININHA" && (rep ? daRep(m) : interna(m)); }).map(function(m){ return folhaC("Maquininha", m); }).filter(Boolean).sort(porNome);
      var links = lpm.filter(function(m){ return m.tipo==="LINK" && (rep ? daRep(m) : true); }).map(function(m){ return folhaC("Link", m); }).filter(Boolean).sort(porNome);
      if(pont && !rep) links.push({nome:pont.nome+" Getnet link", cols:[pont.nome, "Getnet · pedir valor, parcelas e bandeira"], w:[40, 60], heads:["Destino", "Link"], id:pont.id, conta:"Link · Getnet"});
      return [{nome:"Maquininha", itens:maqs}, {nome:"Link de pagamento", itens:links}].filter(function(g){ return g.itens.length; });
    }
    // só aparece quem tem valor pendente (Marcus, 26/10/2026): orientações abertas e fornecedores com saldo; mostra o devido e o prazo
    var pend = {};
    cp.orientacoes.forEach(function(o){ if(o.status!=="aberta") return; var fl = faltaDe(o); if(!(fl>0)) return; var q = pend[o.destinoId] || (pend[o.destinoId] = {valor:0, prazo:""}); q.valor = r2(q.valor+fl); if(o.ate && (!q.prazo || o.ate<q.prazo)) q.prazo = o.ate; });
    fornAbertos.forEach(function(x){ if(x.destinoId && x.total>0) pend[x.destinoId] = {valor:x.total, prazo:x.dMin||""}; });
    var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7) : "—"; };
    var folhaDev = function(nome, valor, prazo, id, conta){ return {nome:nome, cols:[nome, BKC(valor), dm(prazo)], w:[46, 30, 24], heads:["Nome", "Devido", "Prazo"], id:id, conta:conta||""}; };
    var ff = s.ff || {};
    // sócio: um divisor "Contas" e um divisor "Prestadores de serviço" (só os que têm valor devido), vindos do Financeiro familiar
    var socio = function(d){
      if(!veFam || !d.personaId) return {nome:d.nome, id:d.id, conta:""};
      var curto = d.nome.replace(/\s+PF$/i, "");
      var contas = (ff.contasBanc||[]).filter(function(cb){ return cb.personaId===d.personaId && cb.ativo!==false && !cb.prestadorId; }).map(function(cb){ return {nome:cb.nome, id:d.id, conta:cb.nome}; });
      var prests = (ff.prest||[]).filter(function(pr){ return pr.ativo && pr.responsavelId===d.personaId; }).map(function(pr){
        var bx = baixaDividas(ff, pr.id), falta = r2(bx.falta); if(!(falta>0.005)) return null;
        var prazo = (ff.dividas||[]).filter(function(dv){ var b = bx.porId[dv.id]; return dv.prazo && dv.valor>0 && b && b.falta>0.005; }).map(function(dv){ return dv.prazo; }).sort()[0] || "";
        var cb = (ff.contasBanc||[]).filter(function(c){ return c.prestadorId===pr.id && c.ativo!==false; })[0];
        return folhaDev(pr.nome, falta, prazo, d.id, cb ? cb.nome : pr.nome); }).filter(Boolean);
      var itens = []; if(contas.length) itens.push({nome:"Contas "+curto, itens:contas}); if(prests.length) itens.push({nome:"Prestadores de serviço", itens:prests});
      return itens.length ? {nome:d.nome, itens:itens} : {nome:d.nome, id:d.id, conta:""}; };
    var devedores = function(tp){ return cp.destinos.filter(function(d){ return d.ativo && d.tipo===tp && pend[d.id]; }).map(function(d){ return folhaDev(d.nome, pend[d.id].valor, pend[d.id].prazo, d.id); }); };
    return Object.keys(TIPOS_DESTINO).map(function(tp){ return {nome:tp==="CNPJ" ? "Empresa" : tipoNome(tp), itens:tp==="CNPJ" ? cnpjs : tp==="FAMILIA" ? cp.destinos.filter(function(d){ return d.ativo && d.tipo===tp; }).map(socio) : devedores(tp)}; }).filter(function(g){ return g.itens.length; }); };
  var renderParte = function(p){
    var id = p.id, f = p.forma, ld = divDe(id), rest = restDe(id), pl = planos[id] || [], dest = optsDe(f), sug = !ld.length;
    var toDiv = function(x, valor){ return {destinoId:x.destinoId, valor:valor==null ? x.valor : valor, regra:x.regra, conta:x.conta, via:f, parte:id, motivo:x.motivo}; };
    // lista de contas mostrada: o que já foi definido; se nada foi definido e o sistema sugere várias contas, as sugestões aparecem como linhas editáveis
    var lista = ld.length ? ld : (pl.length>1 ? pl.map(function(x){ return toDiv(x); }) : []);
    var restL = r2(p.valor-soma(lista));
    var pk = sel.id+"|"+id, pv = pendV[pk] || [], trava = !!travados[pk], setTrava = function(v){ var n = Object.assign({}, travados); if(v) n[pk] = true; else delete n[pk]; setTravados(n); };   // pv = valores das linhas de conta nova que ainda não têm conta escolhida
    var setPv = function(a){ var n = Object.assign({}, pendV); n[pk] = a; setPendV(n); };
    var dividir = lista.length>1 || dividindo===id;
    var estadoP = sug ? (pl.length ? "" : "falta definir") : rest>0.009 ? "falta "+BKC(rest) : rest<-0.009 ? "passou "+BKC(-rest) : "";
    var corP = (sug || Math.abs(rest)>0.009) ? "#f5c14b" : "var(--positivo)";
    var aceita = function(){ setDivDe(id, pl.map(function(x){ return toDiv(x); })); setDividindo(""); };
    var aceitaBtn = function(){ return e("button",{key:"ok", type:"button", onClick:function(){ if(sug && pl.length) aceita(); setTrava(true); }, title:"Confirmar este pagamento", className:"grid h-8 place-items-center px-3 text-[13px] font-semibold text-primary hover:bg-primary/20"}, "Confirmar"); };
    var editarBtn = function(){ return e("button",{key:"ed", type:"button", onClick:function(){ setTrava(false); }, title:"Abrir para editar de novo", className:"grid h-8 place-items-center px-3 text-[13px] font-semibold hover:bg-white/10"}, "Editar"); };
    var grupoBtn = function(){ return e("div",{className:"inline-flex h-8 items-stretch divide-x divide-border overflow-hidden rounded-md border border-border bg-card"}, Array.prototype.slice.call(arguments)); };   // botões juntos numa caixa com borda (Marcus, 12/11/2026: nada de botão avulso)
    var muda = function(m){
      if(m==="inteiro"){ if(lista.length>1) setDivDe(id, [Object.assign({}, lista[0], {valor:p.valor})]); setPv([]); setDividindo(""); setEdKey(""); return; }
      var base = lista.length ? lista : (pl.length ? [toDiv(pl[0], p.valor)] : []);
      if(base.length===1){ var meio = r2(base[0].valor/2); setDivDe(id, [Object.assign({}, base[0], {valor:r2(base[0].valor-meio)})]); setPv([meio]); }
      else if(base.length>1) setDivDe(id, base);
      else { var m1 = r2(p.valor/2); setPv([m1, r2(p.valor-m1)]); }
      setDividindo(id); };
    var chave = c.edita && !trava ? e(SeletorConta,{nos:[{nome:"Inteiro", id:"inteiro", conta:""}, {nome:"Dividir", id:"dividir", conta:""}], texto:dividir ? "Dividir" : "Inteiro", rotulo:"Inteiro ou dividir "+rotuloParte(p), titulo:"Pagamento", centro:true, larg:150, onEscolher:function(v){ muda(v); }}) : e("span",{className:NOME}, dividir ? "Dividir" : "Inteiro");
    var celPag = e("div",{className:"inline-flex min-h-8 flex-col items-center justify-center rounded-md border border-border bg-card px-3 py-1 text-center"}, e("b",{className:"whitespace-nowrap text-[13px] font-semibold leading-snug"}, rotuloParte(p)), estadoP ? e("span",{className:"whitespace-nowrap text-[13px] font-semibold", style:{color:corP}}, estadoP) : null);
    var seletor = function(valorAtual, contaAtual, onEscolher, primeiro, rotulo){ var d = valorAtual ? destinoDe(valorAtual) : null, txt = d ? d.nome+(contaAtual ? " · "+contaAtual : "") : primeiro; return c.edita && !trava ? e(SeletorConta,{nos:arvoreDe(f), semQuebra:true, centro:true, larg:580, texto:txt, rotulo:rotulo, onEscolher:onEscolher, vazio:!d}) : e("span",{className:NOME}, d ? txt : "—"); };
    var txtValor = function(v){ return e("div",{className:"flex justify-center"}, e("span",{className:"inline-flex h-8 items-center rounded-md border border-border bg-card px-3 text-[13px] font-semibold tabular-nums"}, BKC(v))); };
    // Sugestão (Marcus, 12/11/2026: "ruim de ler, organize"): uma caixa com borda por sugestão: o NOME da conta em negrito e o motivo embaixo, em linhas separadas
    var fmtSug = function(x, k){ var tx = String(x.motivo||""), ix = tx.indexOf(" · "), l1 = ix>=0 ? tx.slice(0, ix) : tx, l2 = ix>=0 ? tx.slice(ix+3) : ""; return e("div",{key:k, className:"flex w-full flex-col items-center gap-0.5 rounded-md border border-border bg-card px-3 py-1.5 text-center leading-snug"}, e("b",{className:"text-[13px] font-semibold"}, destinoDe(x.destinoId).nome), l1 ? e("span",{className:"text-[13px]"}, l1) : null, l2 ? e("span",{className:"text-[13px]"}, l2) : null); };
    var sugTxt = pl.length ? e("div",{className:"flex w-full flex-col gap-1.5"}, pl.map(function(x, k){ return fmtSug(x, k); })) : e("div",{className:"w-full rounded-md border border-border bg-card px-3 py-1.5 text-center text-[13px] leading-snug"}, "Nenhuma sugestão serviu. Escolha a conta.");
    var txtSug = function(s){ return s ? e("div",{className:"w-full text-center text-[13px] leading-snug"}, s) : null; };
    var primeiroRot = f==="pix" ? "Escolha a conta" : "Escolha o CNPJ";
    var linhas = [];
    if(!dividir){
      var un = ld.length ? ld[0] : (pl.length ? pl[0] : null);
      linhas.push(linha("u", celPag, seletor(un ? un.destinoId : "", un ? (un.conta||"") : "", function(v, cta){ setDivDe(id, [{destinoId:v, valor:p.valor, regra:0, conta:cta, via:f, parte:id, motivo:(un && un.destinoId===v && !cta) ? un.motivo : "Escolhida por você"}]); }, primeiroRot, "Conta para "+rotuloParte(p)),
        txtValor(p.valor), txtSug(sugTxt), c.edita && (trava || ld.length || pl.length) ? grupoBtn(trava ? editarBtn() : aceitaBtn()) : null));
    } else {
      // Dividir: cada linha tem conta e valor editável; a linha nova já nasce com valor, mesmo sem conta. O + fica só na última linha.
      var rs = lista.map(function(x){ return {x:x, val:x.valor}; }).concat(pv.map(function(v){ return {val:v}; }));
      var grava = function(a){ setDivDe(id, a.filter(function(q){ return q.x; }).map(function(q){ return Object.assign({}, q.x, {valor:q.val}); })); setPv(a.filter(function(q){ return !q.x; }).map(function(q){ return q.val; })); };
      var copia = function(){ return rs.map(function(q){ return {x:q.x, val:q.val}; }); };
      var tira = function(k){ var a = copia(), saiu = a[k].val; a.splice(k, 1);
        if(a.length<2){ if(a.length && a[0].x) setDivDe(id, [Object.assign({}, a[0].x, {valor:p.valor})]); else setDivDe(id, []); setPv([]); setDividindo(""); setEdKey(""); return; }
        a[a.length-1].val = r2(a[a.length-1].val+saiu); grava(a); };
      var mais = function(){ var a = copia(), falta = r2(p.valor-a.reduce(function(tt, q){ return tt+q.val; }, 0));
        if(falta>0.004) a.push({val:falta}); else { var u = a[a.length-1], meio = r2(u.val/2); u.val = r2(u.val-meio); a.push({val:meio}); } grava(a); };
      var muda1 = function(k, v){ var a = copia(), nv = r2(Math.min(v || 0, p.valor)); a[k].val = nv; if(a.length===2) a[1-k].val = r2(p.valor-nv); grava(a); };
      rs.forEach(function(q, k){ var x = q.x, d = x ? destinoDe(x.destinoId) : null, ultima = k===rs.length-1, rotC = "Conta "+(k+1)+" de "+rotuloParte(p);
        var contaCel = x ? seletor(x.destinoId, x.conta||"", function(v, cta){ var a = copia(); a[k].x = Object.assign({}, x, {destinoId:v, conta:cta, motivo:"Escolhida por você"}); grava(a); }, primeiroRot, rotC)
          : seletor("", "", function(v, cta){ var a = copia(); a[k].x = {destinoId:v, valor:q.val, regra:0, conta:cta, via:f, parte:id, motivo:"Escolhida por você"}; grava(a); }, primeiroRot, rotC);
        var valCel = c.edita && !trava ? e(CampoDinheiro,{value:q.val || null, label:"Valor da conta "+(k+1), disabled:!c.edita, className:CAMPO+" text-right tabular-nums", onChange:function(v){ muda1(k, v); }}) : txtValor(q.val);
        var acoes = !c.edita ? null : trava ? (k===0 ? grupoBtn(editarBtn()) : null) : (sug && x && k===0) ? grupoBtn(aceitaBtn()) : grupoBtn(e("button",{key:"x", type:"button", "aria-label":"Tirar a conta "+(k+1), title:"Tirar esta conta", onClick:function(){ tira(k); }, className:"grid h-8 w-8 place-items-center text-[13px] hover:bg-white/10"}, "✕"),
          ultima ? e("button",{key:"m", type:"button", title:"Adicionar mais uma conta", "aria-label":"Adicionar mais uma conta", onClick:mais, className:"grid h-8 w-8 place-items-center text-[13px] font-bold text-primary hover:bg-primary/20"}, "+") : null, ultima && x ? aceitaBtn() : null);
        linhas.push(linha(sel.id+"|"+id+"|"+k, null, contaCel, valCel, txtSug(k===0 ? sugTxt : ""), acoes)); });
    }
    var span = {gridRow:"span "+linhas.length};   // Pagamento e Modo ocupam todas as linhas da parte quando ela é dividida
    return e(Fragment,{key:id}, e("div",{className:CEL, style:span}, celPag), e("div",{className:CEL, style:span}, chave),
      linhas.map(function(L){ return [e("div",{key:L.k+"c", className:CEL}, L.b), e("div",{key:L.k+"v", className:CEL}, L.c2), e("div",{key:L.k+"s", className:CEL}, L.d2), e("div",{key:L.k+"a", className:CEL+" sticky right-0 z-10 border-l border-border"}, L.e2)]; }));   // coluna Confirmar fixa à direita: em tela estreita o botão nunca some (Marcus, 12/11/2026)
  };
  var RL = function(rot, val, cor){ return e(Fragment,{key:"rl"+rot}, e("div",{className:CEL+" border-b border-border"}, rot), e("div",{className:CEL+" border-b border-l border-border font-semibold tabular-nums", style:cor ? {color:cor} : undefined}, val)); };   // Resumo: linhas todas da mesma espessura e Falta pagar na cor normal (Marcus, 12/11/2026)
  var corFalta = !div.length ? "#f5c14b" : fechado ? "var(--positivo)" : "#f5c14b";
  var avisoTxt = erro ? {t:erro, cor:"var(--negativo)"} : mistura ? {t:"Atenção: mistura conta que fatura (CNPJ) com conta que não fatura.", cor:"#f5c14b"} : {t:"—", cor:""};
  // PEDIDO ABERTO em grade com linhas (Marcus, 11/11/2026, layout A): tudo em células com título; nenhum texto solto. Quem e quando | Resumo e Pagamentos | Rodapé de envio.
  var BOTAO_OK = "h-8 whitespace-nowrap rounded-md border px-4 text-[13px] font-semibold ";
  var pedido = !sel ? null : Painel("Direcionar pagamento", "", "", "", e("div",{className:"flex flex-col gap-px bg-border"},
    e("div",{className:"overflow-x-auto"}, e("div",{className:"grid grid-cols-[150px_minmax(0,1.5fr)_minmax(0,1fr)_100px_130px_minmax(0,1.4fr)] gap-px bg-border min-[1100px]:grid-cols-[310px_318px_420px_132px_150px_minmax(0,1fr)]", style:{minWidth:900}},   // Origem com 310 px: a borda direita dela cai na linha direita da coluna Valor, logo abaixo (Marcus, 12/11/2026)
      ["Origem", "Nome", "Atendimento", "Chegou", "Aguardando", "Observação"].map(function(t, i){ return e("div",{key:"h"+i, className:CABC}, t); }),
      e("div",{className:CEL}, e("span",{className:"flex items-center gap-1.5"}, Selo(sel.origem), sel.valor>=limAlto && SeloAlto())),
      e("div",{className:CEL+" font-semibold", title:sel.quem}, sel.origem==="rep" ? doisNomes(sel.repOrigem || String(sel.quem).replace(/^Representante\s+/, ""))+(sel.revendedora ? " · "+sel.revendedora : "") : sel.quem),
      e("div",{className:CEL}, sel.origem==="interno" ? "Atendida por "+sel.atendente : (sel.maq || "—")),
      e("div",{className:CEL+" tabular-nums"}, hmH(sel.recebidoEm)),
      e("div",{className:CEL+" font-bold tabular-nums", style:{color:COR_ESPERA[nivelEspera(sel.recebidoEm)]}}, curto(sel.recebidoEm)),
      e("div",{className:CEL}, sel.obs || "—"))),
    e("div",{className:"grid grid-cols-1 gap-px bg-border min-[1100px]:grid-cols-[310px_minmax(0,1fr)]"},
      e("div",{className:"grid min-w-0 grid-cols-[minmax(0,1fr)_132px] content-start bg-card"},
        e("div",{className:CABC+" border-b border-border"}, "Resumo"), e("div",{className:CABC+" border-b border-l border-border"}, "Valor"),
        RL("Vendas", sel.vendas>0 ? BKC(sel.vendas) : "—"), RL("A pagar", sel.vendas>0 ? BKC(sel.aPagar) : "—"), RL("Já pago", BKC(soma(sel.pagos)), "var(--positivo)"),
        (sel.pagos||[]).length ? sel.pagos.map(function(p, n){ return RL(textoPago(p), BKC(p.valor)); }) : RL("Nada pago ainda", "—"),
        RL("Falta pagar", BKC(sel.valor), "#f5c14b"),
        e("div",{className:CEL+" col-span-2 flex-col gap-2 py-2.5"},
          c.edita && temSugestao ? e("button",{type:"button", onClick:usarTodas, className:"h-8 w-full whitespace-nowrap rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10"}, "Usar todas as sugestões") : null,
          c.edita ? e("button",{type:"button", onClick:confirmar, disabled:!div.length, className:BOTAO_OK+"w-full "+(div.length ? "border-primary bg-primary/20 text-primary hover:bg-primary/30" : "border-border bg-card text-foreground opacity-60")}, "OK · enviar") : null,
          avisoTxt.t!=="—" ? e("span",{className:"text-center text-[13px] font-semibold", style:avisoTxt.cor ? {color:avisoTxt.cor} : undefined}, avisoTxt.t) : null)),
      e("div",{className:"min-w-0 overflow-x-auto bg-card"}, e("div",{className:"grid h-full gap-px bg-border", style:{gridTemplateColumns:GR, gridTemplateRows:"30px", minWidth:1234}},
        ["Pagamento", "Modo", "Conta", "Valor", "Sugestão", "Confirmar"].map(function(t, i){ return e("div",{key:"p"+i, className:CABC+(i===5 ? " sticky right-0 z-10" : "")}, t); }),
        partes.map(renderParte)))),
    ));
  return e("div",{className:"[--topo-tabela:var(--bloco-colunas)] [--border:rgba(255,255,255,0.3)] [--color-border:rgba(255,255,255,0.3)] [--color-success:var(--positivo)] [--color-destructive:var(--negativo)] -mx-2 -mb-2 -mt-3 flex flex-col gap-1.5 md:-mx-3 md:-mb-3 [&_td]:!text-center [&_th]:!text-center [&_input]:!text-center [&_select]:!text-center"},
    e(PedidosKit),
    !c.edita && e("span",{className:"px-2 text-[13px] text-foreground"}, "Só quem direciona Pix confirma. Você pode ver."),
    pedido,
    e("div",{className:"grid grid-cols-1 items-stretch gap-1.5 min-[1280px]:grid-cols-3"}, blocoVendas, blocoNegativas, blocoContas),
    // ── feitos
    feitos.length>0 && (function(){
      // DIRECIONADOS no padrão (Marcus, 12/11/2026): só o título, uma linha por destino, revendedora (4 primeiros nomes), conta escrita pela regra única e Reabrir pequeno, só até o pagamento ser conferido
      var lancs = s.lancFin || [], conferido = function(x){ var l = lancs.filter(function(q){ return x.internoId ? q.internoId===x.internoId : (x.origem==="rep" && (q.id==="LFR_"+x.kitId || q.repAcertoId===x.kitId)); })[0]; return !!(l && l.conferido); };
      // SITUAÇÃO (Marcus, 12/11/2026: "ali não é só direcionar, é direcionar, confirmar e receber o comprovante"): o pedido só sai de pendente quando o financeiro confere o pagamento
      // SITUAÇÃO (Marcus, 12/11/2026): palavra curta, uma cor para cada etapa, e a coluna Com diz quem tem de agir. Só sai de pendente quando o financeiro confere.
      var situ = function(x){ var l = lancs.filter(function(q){ return x.internoId ? q.internoId===x.internoId : (x.origem==="rep" && (q.id==="LFR_"+x.kitId || q.repAcertoId===x.kitId)); })[0];
        if(l && l.conferido) return ["Conferido", "—"];
        if(x.internoId){ if(!l) return ["Comprovante", "Atendente"];
          var temComp = (l.linhas||[]).filter(function(q){ return q.tipo==="pagamento" && !q.isento; }).every(function(q){ return (q.partes||[]).every(function(p){ return !!p.comprovante; }); });
          if(!l.etapaComprovantes) return temComp ? ["Aguarda OK", "Atendente"] : ["Comprovante", "Atendente"];
          if(!l.finalizado) return ["Finalizar", "Atendente"];
          return ["Conferir", "Financeiro"]; }
        return (x.comprovante || (l && l.finalizado)) ? ["Conferir", "Financeiro"] : ["Comprovante", "Representante"]; };
      var COR_SIT = {"Comprovante":"#F87171", "Aguarda OK":"#FACC15", "Finalizar":"#38BDF8", "Conferir":"#E879F9", "Conferido":"#4ADE80"};   // cinco cores bem diferentes só na letra (vermelho, amarelo, azul, magenta, verde); Marcus, 12/11/2026: nada de bloco por fora
      var dtx = function(ts){ var q = new Date(ts); return String(q.getDate()).padStart(2, "0")+"/"+String(q.getMonth()+1).padStart(2, "0")+"/"+q.getFullYear(); };
      // uma linha por pedido (o destino pode ser vários, então não entra aqui): data, hora, revendedora, valor, quem direcionou, situação e com quem está
      var lfDe = function(x){ return lancs.filter(function(q){ return x.internoId ? q.internoId===x.internoId : (x.origem==="rep" && (q.id==="LFR_"+x.kitId || q.repAcertoId===x.kitId)); })[0] || null; };
      var pagLinhas = function(l){ return l.linhas.filter(function(q){ return q.tipo==="pagamento" && !q.isento; }); };
      var compsDe = function(x){ var l = lfDe(x), out = []; if(!l) return out; pagLinhas(l).forEach(function(q){ (q.partes||[]).forEach(function(p){ if(p.comprovante) out.push(Object.assign({}, p.comprovante, {conta:p.descricao||"", valor:p.valor||0})); }); }); return out; };   // um por conta: o Pix pode ter vários comprovantes (um para cada conta)
      var tudoComComp = function(x){ var l = lfDe(x); if(!l) return false; var ps = pagLinhas(l); return ps.length>0 && ps.every(function(q){ return (q.partes||[]).length>0 && (q.partes||[]).every(function(p){ return !!p.comprovante; }); }); };
      // CONFERIR AQUI (Marcus, 12/11/2026: "a conferência deveria ir ali mesmo, com uma coluna do comprovante"): quem direciona vê o comprovante e confere; isso também fecha os dois passos da atendente
      var conferirAqui = function(x){ var l = lfDe(x); if(!l) return;
        c.d({type:"FIN_ETAPA", id:l.id, patch:{etapaComprovantes:true, finalizado:true, finalizadoTs:Date.now()}});
        l.linhas.forEach(function(q, i){ if(q.tipo!=="pagamento" || q.isento) return; c.d({type:"FIN_LINHA", id:l.id, i:i, patch:{partes:(q.partes||[]).map(function(p){ return Object.assign({}, p, {ok:true}); })}, por:c.por}); }); };
      var linhas = feitos.map(function(x){ var st = situ(x), n = compsDe(x).length; return {id:x.id, sit:st[0], com:st[1], comp:n>0 ? "Ver" : "—", conf:(c.edita && st[0]!=="Conferido" && tudoComComp(x)) ? "Conferir" : (c.edita && st[0]==="Conferido" && lfDe(x) ? "Desfazer" : "—"), data:x.confirmadoEm ? dtx(x.confirmadoEm) : "—", hora:x.confirmadoEm ? hm(x.confirmadoEm) : "—", rev:ateNomes(x.origem==="rep" ? (x.revendedora || x.quem) : x.quem, 4), valor:BKC(x.valor), quem:x.confirmadoPor || "—", reabre:(c.edita && st[0]!=="Conferido") ? x.id : "", x:x}; });
      // as linhas ficam sempre no mesmo lugar (mais novo em cima): conferir não muda a linha de posição (Marcus, 12/11/2026: "clicou e sumiu")
      var desfazerAqui = function(x){ var l = lfDe(x); if(!l) return;   // volta a conferência para pendente (o comprovante e as etapas da atendente ficam)
        l.linhas.forEach(function(q, i){ if(q.tipo!=="pagamento" || q.isento) return; c.d({type:"FIN_LINHA", id:l.id, i:i, patch:{partes:(q.partes||[]).map(function(p){ return Object.assign({}, p, {ok:false}); })}, por:c.por}); }); };
      var BTN_CLARO = "h-8 min-w-24 max-w-full whitespace-nowrap rounded-md border border-white/50 bg-white/20 px-3.5 text-[13px] font-semibold text-white hover:bg-white/30";   // botão claro (Marcus, 12/11/2026: "não pode ter essa cor tão escura")
      var BTN_PEQ = "h-[18px] whitespace-nowrap rounded-md border px-2 text-[11px] hover:bg-white/10 ";
      var modalComp = verComp && e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4", role:"dialog", "aria-modal":"true", onClick:function(){ setVerComp(null); }},
        e("div",{className:"flex max-h-full w-full max-w-3xl flex-col gap-2 overflow-auto rounded-lg border border-border bg-card p-3", onClick:function(ev){ ev.stopPropagation(); }},
          e("div",{className:"flex items-center justify-between gap-2 text-[13px] font-semibold"}, e("span",null, "Comprovante de "+verComp.nome), e("button",{type:"button", onClick:function(){ setVerComp(null); }, className:BTN_PEQ+"border-border"}, "Fechar")),
          verComp.lista.map(function(cp, k){ return e("div",{key:k, className:"flex flex-col gap-1 border-t border-border pt-2"},
            e("span",{className:"text-center text-[13px] font-semibold"}, "Comprovante "+(k+1)+" de "+verComp.lista.length+(cp.conta ? " · "+cp.conta : "")+(cp.valor>0 ? " · "+BKC(cp.valor) : "")),
            /^data:image|^https?:/.test(cp.url||"") && !/pdf/i.test(cp.nome||"")
              ? e("img",{src:cp.url, alt:"Comprovante "+(k+1), className:"max-h-[75vh] w-full rounded-md object-contain"})
              : e("a",{href:cp.url, download:cp.nome||"comprovante", className:"text-center text-[13px] font-semibold text-primary underline"}, "Baixar "+(cp.nome||"comprovante"))); })));
      return e(Fragment,null, modalComp, e(BlocoPainel,{titulo:"Direcionados", compacto:true}, e(TabelaPlanilha,{semContagem:true, grade:true, chave:"id", vazio:"Nada direcionado", linhas:linhas, cols:[{k:"data", t:"Data"}, {k:"hora", t:"Hora"}, {k:"rev", t:"Revendedora"}, {k:"valor", t:"Valor"}, {k:"quem", t:"Quem direcionou"},
        {k:"sit", t:"Situação", render:function(v){ return e("span",{className:"font-semibold", style:{color:COR_SIT[v]}}, v); }},
        {k:"com", t:"Com"},
        {k:"comp", t:"Comprovante", render:function(v, r){ return v==="Ver" ? e("button",{type:"button", onClick:function(){ setVerComp({nome:r.rev, lista:compsDe(r.x)}); }, className:BTN_CLARO}, compsDe(r.x).length>1 ? "Abrir comprovantes ("+compsDe(r.x).length+")" : "Abrir comprovante") : "—"; }},
        {k:"conf", t:"Conferir", render:function(v, r){ return v==="Conferir" ? e(Botao,{principal:true, onClick:function(){ conferirAqui(r.x); }}, "Conferir") : v==="Desfazer" ? e("button",{type:"button", onClick:function(){ desfazerAqui(r.x); }, title:"Volta este pagamento para a conferência", className:BTN_CLARO}, "Desfazer") : "—"; }},
        {k:"reabre", t:"Reabrir", render:function(v){ return v ? e("button",{type:"button", onClick:function(){ c.d({type:"DP", op:"reabre", id:v}); }, className:BTN_PEQ+"border-border"}, "Reabrir") : "—"; }}]})));
    })());
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

// ── Contas das representantes (Marcus, 02/11/2026): o Lucas deixa definida a conta de cada representante (à noite, no fim de semana). Planilha com a barra dourada inteira: conta fixa, vale até e limite de valor.
// Sem marca, vale o CNPJ da maquininha ou do link dela. A fila do Direcionar usa esta lista; o que as regras mandam perguntar cai lá.
function AbaContasRep(){
  var c = useDP(), s = c.s, cp = c.cp, dp = c.dp, fixas = dp.contasRep || {}, extra = dp.contasRepExtra || {};
  var o = s.saldosContas ? orientacaoCaixa(s.saldosContas, hojeIsoCp(), 10) : null;
  var vistos = {}, reps = [];
  var junta = function(n){ n = String(n||"").replace(/^Representante\s+/i, "").trim(); if(!n) return; var ja = reps.filter(function(r){ return mesmaRep(r.nome, n); })[0]; if(ja){ if(n.length>ja.nome.length){ ja.nome = n; ja.id = n; } return; } reps.push({id:n, nome:n}); };
  ((s.lp && s.lp.vinculos) || []).forEach(function(v){ junta(v.representante); });
  cp.destinos.filter(function(d){ return d.tipo==="REPRESENTANTE" && d.ativo; }).forEach(function(d){ junta(d.nome); });
  dp.pix.forEach(function(x){ if(x.origem==="rep") junta(x.repOrigem); });
  reps.sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var contas = cp.destinos.filter(function(d){ return d.ativo && (d.tipo==="CNPJ" || d.tipo==="FORNECEDOR" || d.tipo==="PRESTADOR"); });
  var chave = function(r){ return r.nome.replace(/^Representante\s+/i, ""); };
  var fixaDe = function(r){ return fixas[chave(r)] || fixas[r.nome] || ""; };
  var chaveDe = function(r){ return fixas[chave(r)] ? chave(r) : fixas[r.nome] ? r.nome : chave(r); };
  var nFix = reps.filter(function(r){ return fixaDe(r); }).length;
  var meiosDe = function(nome){ var lp = s.lp; if(!lp) return "—"; var v = vinculoDeRep(lp, nome); if(!v) return "—"; var l = []; (lp.meios||[]).forEach(function(m){ if(m.id===v.maquininhaId || m.id===v.linkId) l.push(m.nome); }); return l.length ? l.join(" · ") : "—"; };
  var autoDe = function(r){ var cn = cnpjDaRep(s, chave(r)); return cn ? "Conta do CNPJ "+cn : "Perguntar à empresa"; };
  var extraDe = function(r){ return extra[chaveDe(r)] || {}; };
  var sitDe = function(r){ var x = extraDe(r); return !fixaDe(r) ? "Perguntar à empresa" : x.auto && !x.conferida ? "Fixa · falta conferir" : "Fixa"; };
  var sugerirCaixa = function(r){ var alvo = cnpjDaRep(s, chave(r)) || (o && o.cnpjs.length ? o.cnpjs[0].id : ""), d = alvo ? cp.destinos.find(function(x){ return x.ativo && x.nome.indexOf("CNPJ "+alvo)===0; }) : null; if(d) c.d({type:"DP", op:"fixa", rep:chave(r), destinoId:d.id}); };
  var fixaNome = function(r){ var id = fixaDe(r), d = id ? contas.filter(function(z){ return z.id===id; })[0] : null; return d ? tipoNome(d.tipo)+" · "+d.nome : "Automático"; };
  var linhas = reps.map(function(r){ var x = extraDe(r); return {rep:chave(r), meio:meiosDe(chave(r)), auto:autoDe(r), fixa:fixaNome(r), ate:x.ate || "", lim:x.limite || 0, sit:sitDe(r), r:r}; });
  // Bloco no padrão do Direcionar (Marcus, 12/11/2026): título azul, linhas brancas, tabela da peça única, botões juntos numa caixa com borda
  return e("div",{className:PADRAO_BLOCOS+" flex flex-col gap-3"},
    e(BlocoPainel,{titulo:"Contas das representantes"}, e(TabelaPlanilha,{semContagem:true, vazio:"Nenhuma representante.", linhas:linhas, cols:[
      {k:"rep", t:"Representante"},
      {k:"meio", t:"Maquininha ou link"},
      {k:"auto", t:"Se ficar automático"},
      {k:"fixa", t:"Conta fixa", render:function(v, l){ var r = l.r; return e("select",{value:fixaDe(r), disabled:!c.edita, "aria-label":"Conta fixa de "+chave(r), onChange:function(ev){ c.d({type:"DP", op:"fixa", rep:chave(r), destinoId:ev.target.value}); }, className:CAMPO+" w-[280px] text-center"},
          e("option",{value:""}, "Automático"), contas.map(function(d){ return e("option",{key:d.id, value:d.id}, tipoNome(d.tipo)+" · "+d.nome); })); }},
      {k:"ate", t:"Vale até", render:function(v, l){ var r = l.r, k = chaveDe(r); return e("input",{type:"date", value:(extra[k]||{}).ate||"", disabled:!c.edita || !fixaDe(r), "aria-label":"Conta fixa vale até, "+chave(r), onChange:function(ev){ c.d({type:"DP", op:"fixa_extra", rep:k, patch:{ate:ev.target.value}}); }, className:CAMPO+" w-[150px] text-center"}); }},
      {k:"lim", t:"Limite de valor", render:function(v, l){ var r = l.r, k = chaveDe(r); return e(CampoDinheiro,{value:(extra[k]||{}).limite||null, label:"Limite de valor, "+chave(r), disabled:!c.edita || !fixaDe(r), placeholder:"Sem limite", className:CAMPO+" w-[150px] text-center tabular-nums", onChange:function(val){ c.d({type:"DP", op:"fixa_extra", rep:k, patch:{limite:val||0}}); }}); }},
      {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Fixa" ? "text-[var(--positivo)]" : "text-warning"; }},
      {k:"acoes", t:"Ações", render:function(v, l){ var r = l.r, x0 = extraDe(r);
        return e(GrupoBtn,null,
          e("button",{key:"c", type:"button", disabled:!c.edita || !(x0.auto && !x0.conferida), title:x0.de ? "Veio de: "+x0.de : undefined, onClick:function(){ c.d({type:"DP", op:"fixa_extra", rep:chaveDe(r), patch:{conferida:true}}); }, className:BTN_GRUPO}, "Conferir"),
          e("button",{key:"s", type:"button", disabled:!c.edita, onClick:function(){ sugerirCaixa(r); }, className:BTN_GRUPO}, "Sugerir pelo caixa"),
          e("button",{key:"l", type:"button", disabled:!c.edita || !fixaDe(r), onClick:function(){ c.d({type:"DP", op:"fixa", rep:chave(r), destinoId:""}); }, className:BTN_GRUPO}, "Limpar")); }}]})),
    e(BlocoPainel,{titulo:"Valor fora do normal · sobe para a fila do Direcionar e passa na frente"}, e("div",{className:"flex flex-wrap items-end justify-center gap-3 px-3 py-3"},
      e("div",{style:{minWidth:220}}, e(Rotulo,{t:"A partir de (R$)", id:"dp-lim"}), e(CampoDinheiro,{value:dp.limiteAlto || 7000, label:"Valor fora do normal", disabled:!c.edita, className:CAMPO+" text-center tabular-nums", onChange:function(v){ if(v>0) c.d({type:"DP", op:"limite", valor:v}); }})),
      e("p",{className:"min-w-0 flex-1 text-center text-[13px]"}, "Um Pix desse valor, de qualquer representante, não usa a conta fixa: cai na fila e o Lucas escolhe a conta. "+nFix+" de "+reps.length+" representantes com conta fixa."))));
}

export { AbaDirecionar, AbaContasRep, AbaRegrasPix };
