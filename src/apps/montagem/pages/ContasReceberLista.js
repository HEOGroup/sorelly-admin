// Sorelly Admin · montagem — pages/ContasReceberLista.js
// Financeiro › Receber › CONTAS A RECEBER (Marcus, 19/11/2026: "copiar a tela de Contas a pagar igual 100% e fazer um Contas a receber"). É o CLONE de pages/ContasPagarLista.js: UMA TABELA GIGANTE,
// controles numa faixa azul (Visão, Situação, Período, Busca, Colunas), filtro e ordenação no nome de cada coluna, colunas que cada pessoa abre, fecha e reordena, e a mesma coluna Comprovante ("Ver").
// Dados: DevMaster, só leitura (/api/contas-receber/titulos). Cada linha = um título de pagamento da revendedora. "A receber" = acerto - loja que ainda tem saldo (regra do Marcus de 27/10/2026); o resto é "Recebida".
// COMPROVANTE: vem do Atendimento interno (s.lancFin, o que a funcionária anexa); a ligação é feita por domain/comprovantes-receber.js (mesma revendedora, mesmo valor, data até 3 dias, par único).
// A tela antiga (mapa do dinheiro, CNPJs e contas) continua em pages/ContasReceber.js, no endereço /contas-a-receber-resumo.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { MenuMulti } from "@/apps/montagem/components/padrao-fin";
import { SeletorPeriodo, faixaDe, CNPJ_LETRA } from "@/apps/montagem/pages/ContasPagarLista";
import { comprovantesDosRecebidos } from "@/apps/montagem/domain/comprovantes-receber";
import { hojeIso, hojeYm, nomeMes } from "@/apps/montagem/domain/financeiro-familiar";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { createPortal } from "react-dom";
import { e, useEffect, useRef, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(2, 4) : "—"; };
var CNPJ5 = {"34":"Sorelly", "46":"Mayz", "59":"Serenity", "67":"Axis"};   // primeiro nome do CNPJ de cada empresa (Marcus, 20/11/2026): 34 Sorelly (34.753), 46 Mayz (46.873), 59 Serenity (59.146), 67 Axis (67.702, do Lucas)
var cnpjCurto = function(t){ var m = /^CNPJ\s+(\d+)$/.exec(String(t || "").trim()); return m && CNPJ5[m[1]] ? CNPJ5[m[1]] : (t || "—"); };
var bonito2 = function(t){ return String(t).toLowerCase().split(/(\s+|-)/).map(function(w){ return w ? w.charAt(0).toUpperCase()+w.slice(1) : w; }).join("").replace(/\bPj\b/g, "PJ").replace(/ (De|Da|Do|Dos|Das) /g, function(m){ return m.toLowerCase(); }).replace(/\bDevmaster\b/, "DevMaster"); };
var bancoDe = function(t){ var p = String(t || "").split(" - ").map(function(x){ return x.replace(/[-\s]+$/, "").trim(); }).filter(Boolean); if(!p.length || /^acerto/i.test(p[0])) return "—"; if(/^(pix|link|cr[eé]dito|d[eé]bito)$/i.test(p[0]) && p[1]) return bonito2(p[1].replace(/\s+\d+$/, "")); return bonito2(String(t).replace(/^pix\s+/i, "")); };
// DONO da conta de entrada (Marcus, 20/11/2026): CNPJ da Sorelly = 5 primeiros dígitos; pessoa = nome exato; fornecedor/caixa = o nome dele. Nada de grupo genérico ("Família e sócios", "Axis", "Maquininhas P").
var donoDe = function(x){
  var t = String(x.titular || ""), n = limpa(x.forma).toUpperCase();
  if(/^CNPJ\s+\d+$/.test(t)) return cnpjCurto(t);
  if(t==="Axis") return CNPJ5["67"];
  if(t==="Maquininhas P") return "Pontual";
  if(t==="Maquininhas P") return "Pontual";
  if(t==="Não pagou" || /^ACERTO/.test(n)) return "—";
  if(t==="Família e sócios"){ if(/MARCO/.test(n)) return /PJ/.test(n) ? "Marco PJ" : "Marco PF"; if(/ANA BEATRIZ/.test(n)) return "Ana Beatriz"; if(/MARCUS/.test(n)) return "Marcus"; if(/LUCAS/.test(n)) return "Lucas"; if(/ANAMARIA/.test(n)) return "Anamaria"; return bonito2(n.replace(/^PIX\s*-?\s*/, "").replace(/\s*-?\s*PF$/, "")); }
  return bonito2(n.replace(/^PIX\s*-?\s*/, "").replace(/\s*-\s*PF$/, "")) || "—";
};
var limpa = function(t){ return String(t || "").replace(/\s+/g, " ").trim(); };
var semAc = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var TEXTO_BUSCA = new WeakMap();   // texto de busca de cada linha, guardado (a busca fica rápida)
// menu suspenso COMPACTO da faixa azul (Marcus, 19/11/2026: "bem mais compacto e menor"): 28 px de altura e largura do texto
var menuMini = function(ops, atual, aoMudar, rotulo){ return e("select",{value:atual, "aria-label":rotulo, onChange:function(ev){ aoMudar(ev.target.value); }, style:{height:"18px", padding:"0 3px", lineHeight:"16px", textAlignLast:"center"}, className:"w-auto min-w-0 rounded border border-white/25 bg-white/10 text-center text-[10px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-primary"}, ops.map(function(o){ return e("option",{key:o[0], value:o[0], className:"bg-card text-foreground"}, o[1]); })); };   // padrao-ok: controles menores a pedido do Marcus (19/11 e 20/11/2026), como o seletor de período
// linha de grupo em AZUL suave (no lugar do preto) e letra branca; o seletor pega só as células da linha de grupo (a única com letra em negrito)
var CLS_FINA = "[&_table_td]:!text-[10px] [&_table_th]:!text-[10px] [&_table_td]:!h-[var(--lh,18px)] [&_table_tbody_tr]:[scroll-snap-align:start] [&_table_td]:!px-[1px] [&_table_th]:!px-[1px] [&_table_th_button]:!px-0 [&_table_th_button]:!gap-0.5 [&_table_th_button]:!tracking-normal [&_table_th_span]:!tracking-normal [&_table_th_button>span]:!hidden [&_table_td]:!py-0 [&_table_td]:!leading-none [&_table_th]:!h-[16px] [&_table_th_button]:!h-[14px] [&_table_th_button]:!py-0 [&_table_th_button]:!leading-none [&_table_th_button]:!text-[10px] [&_table_th_span]:!text-[10px] [&_table_th_span]:!leading-none [&_table_th]:!py-0 [&_table_tr]:!h-[var(--lh,18px)] [&_table_td_button]:!text-[10px] [&_table_td_a]:!text-[10px] [&_.overflow-x-auto]:!cursor-default [&_table_tr]:!cursor-default [&_table_td]:!cursor-default";   // padrao-ok: tabela com a mesma fonte (9 px), linhas baixas (18 px) e cabeçalho de 16 px da barra de cima, pedido do Marcus (20/11/2026)
var CLS_GRUPO = "[&_td[class*=font-semibold]]:!bg-[#2f4f8f]/70 [&_td[class*=font-semibold]]:!text-white";
var corCnpj = function(v, l){ var m = /CNPJ (\d+)/.exec(String(v || "")); return e("span",{style:{color:(m && CNPJ_LETRA[m[1]]) || "#E2E8F0"}}, v); };   // só a LETRA muda de cor, igual à Contas a pagar

// meses (AAAA-MM) que o período escolhido cobre; sem período = os meses do ano até hoje. No máximo 36 (os mais recentes).
function mesesDoPeriodo(faixa, hoje){
  var ini = faixa ? faixa[0].slice(0, 7) : hoje.slice(0, 4)+"-01", fim = faixa ? faixa[1].slice(0, 7) : hoje.slice(0, 7), out = [];
  var a = Number(ini.slice(0, 4)), m = Number(ini.slice(5, 7));
  while((String(a)+"-"+String(m).padStart(2, "0"))<=fim && out.length<120){ if(a>=2022) out.push(a+"-"+String(m).padStart(2, "0")); m++; if(m>12){ m = 1; a++; } }
  return out.slice(-36);
}
// abre o comprovante (foto ou PDF guardado em texto) numa aba nova
function abrirComp(c){
  var w = window.open("about:blank", "_blank");
  fetch(c.url).then(function(r){ return r.blob(); }).then(function(b){ var u = URL.createObjectURL(b); if(w) w.location.href = u; else window.open(u, "_blank"); setTimeout(function(){ URL.revokeObjectURL(u); }, 120000); })
    .catch(function(){ if(w) w.close(); window.alert("Não consegui abrir o comprovante."); });
}

function AbaCtaReceber(){
  var cx = use(), s = cx.state;
  var hoje0 = hojeIso(), anoAtual = new Date().getFullYear();
  var sca = useState({}), cache = sca[0], setCache = sca[1], pedidos = useRef({}), ref = useRef({k:"", v:{}});
  var se = useState("recebidas"), escopo = se[0], setEscopo = se[1], sv = useState("lista"), vista = sv[0], setVista = sv[1], sq = useState("n"), quem = sq[0], setQuem = sq[1];
  var sp = useState({modo:"meses", filtra:true, atras:false, dDe:hojeYm()+"-01", dAte:hoje0, mDe:hojeYm(), mAte:hojeYm(), aDe:anoAtual, aAte:anoAtual}), per = sp[0], setPerRaw = sp[1];
  var sg0 = useState(""), agr = sg0[0], setAgr = sg0[1], sgf = useState({}), grAb = sgf[0], setGrAb = sgf[1], sa = useState(null), aberta = sa[0], setAberta = sa[1], sbt = useState(""), buscaTxt = sbt[0], setBuscaTxt = sbt[1], sbu = useState(""), busca = sbu[0], setBusca = sbu[1];
  var chavePref = "sorelly_cre_colunas_v1_"+(s.usuario || "x");
  var scp = useState(function(){ try{ var g = JSON.parse(localStorage.getItem(chavePref) || "null"); if(g && typeof g==="object") return g; }catch(x){} return {}; }), prefCols = scp[0], setPrefCols = scp[1];
  var spp = useState(function(){ try{ var g = Number(localStorage.getItem("sorelly_cre_porpag")); if(g>=50 && g<=500) return g; }catch(x){} return 100; }), porPag = spp[0], setPorPag = spp[1];
  useEffect(function(){ var t = setTimeout(function(){ setBusca(buscaTxt); }, 300); return function(){ clearTimeout(t); }; }, [buscaTxt]);   // eslint-disable-line react-hooks/exhaustive-deps -- espera parar de digitar (0,3 s) antes de procurar
  var setPer = function(mudanca){ setPerRaw(function(o){ return Object.assign({}, o, mudanca); }); };
  var faixa = faixaDe(per), ABERTO = escopo!=="recebidas", PAGO = escopo!=="receber";

  // O QUE LER DA DEVMASTER: "A receber" lê todo o acerto - loja em aberto de uma vez; os outros leem um mês por vez (e o em aberto, se "+ Atrasadas" estiver marcado)
  var chaves = escopo==="receber" ? ["nao"] : mesesDoPeriodo(faixa, hoje0).concat(escopo==="todas" && per.atras ? ["nao"] : []), chavesTxt = chaves.join(",");
  useEffect(function(){
    if(!apiAtiva()) return undefined;
    var vivo = true;
    (function proxima(i){
      if(!vivo || i>=chaves.length) return;
      var k = chaves[i];
      if(pedidos.current[k]){ proxima(i+1); return; }
      pedidos.current[k] = 1; setCache(function(c){ var o = Object.assign({}, c); o[k] = "lendo"; return o; });
      var rota = k==="nao" ? "/contas-receber/titulos?nao=1" : "/contas-receber/titulos?mes="+Number(k.slice(5, 7))+"&ano="+k.slice(0, 4);
      chamar("GET", rota).then(function(d){ setCache(function(c){ var o = Object.assign({}, c); o[k] = d.linhas || []; return o; }); }).catch(function(x){ delete pedidos.current[k]; setCache(function(c){ var o = Object.assign({}, c); o[k] = "erro: "+(x && x.message ? x.message : "falhou"); return o; }); }).then(function(){ proxima(i+1); });
    })(0);
    return function(){ vivo = false; };
  }, [chavesTxt]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!apiAtiva()) return e(Pagina,null, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  var lendo = chaves.filter(function(k){ return cache[k]==="lendo" || cache[k]===undefined; }).length, falhou = chaves.filter(function(k){ return typeof cache[k]==="string" && cache[k].indexOf("erro")===0; });

  // LINHAS: junta o que já foi lido (o em aberto só entra se ainda não veio pelo mês: não conta duas vezes)
  var vistos = {}, todas = [];
  var chv = function(x){ return [x.cod, x.nota, x.parc, x.d, x.forma, x.valor, x.saldo].join("|"); };
  chaves.filter(function(k){ return k!=="nao" && Array.isArray(cache[k]); }).concat(chaves.indexOf("nao")>=0 && Array.isArray(cache.nao) ? ["nao"] : []).forEach(function(k){
    cache[k].forEach(function(x){ var c = chv(x); if(k==="nao" && vistos[c]) return; if(k!=="nao") vistos[c] = 1; todas.push(Object.assign({}, x, {rid:k+"|"+x.id, aberto:!!(x.nao && x.saldo>0)})); }); });
  var base = todas.filter(function(x){ return quem==="t" || !x.fn; });
  var chaveCache = base.length+"|"+(s.lancFin || []).length;
  if(ref.current.k!==chaveCache){ ref.current = {k:chaveCache, v:comprovantesDosRecebidos(base.map(function(x){ return Object.assign({}, x, {id:x.rid}); }), s.lancFin || [], {}).mapa}; }   // o código da linha na tela é o rid (mês + código), igual ao que a ligação devolve
  var comps = ref.current.v;

  var dataBase = function(x){ return x.aberto ? (x.venc || x.d || "") : (x.d || ""); };
  var noMes = function(x){ var d = dataBase(x); if(!faixa) return true; return (d>=faixa[0] && d<=faixa[1]) || (per.atras && x.aberto && !!x.venc && x.venc<hoje0); };
  var buscando = String(busca || "").trim()!=="", termos = semAc(busca).split(/\s+/).filter(Boolean);
  var ls = base.filter(function(x){ return (escopo==="todas" || x.aberto===(escopo==="receber")) && (buscando || noMes(x)); });
  if(termos.length) ls = ls.filter(function(x){
    var tx = TEXTO_BUSCA.get(x); if(tx===undefined){ tx = semAc([x.rev, x.rep, x.nota, limpa(x.forma), x.grupo, x.titular, x.cod, r2(x.valor).toFixed(2).replace(".", ","), r2(x.valor).toLocaleString("pt-BR", {minimumFractionDigits:2}), dm(x.d), dm(x.venc)].join(" ")); TEXTO_BUSCA.set(x, tx); }
    return termos.every(function(t0){ return tx.indexOf(t0)>=0; }); });
  ls = ls.slice().sort(function(a, b){ var p = dataBase(a), q = dataBase(b); return PAGO && !ABERTO ? q.localeCompare(p) || a.rev.localeCompare(b.rev) : (p||"9999").localeCompare(q||"9999") || a.rev.localeCompare(b.rev); });   // recebidas: a mais recente primeiro; a receber: vence primeiro no alto

  var atrasoDe = function(x){ return x.aberto && x.venc && x.venc<hoje0 ? Math.max(1, Math.round((new Date(hoje0+"T00:00:00") - new Date(x.venc+"T00:00:00")) / 86400000)) : 0; };
  var sitDe = function(x){ return x.aberto ? (atrasoDe(x)>0 ? "Atrasada · "+atrasoDe(x)+" dias" : "A receber") : x.nao ? "Recebida depois" : "Recebida"; };
  var linhas = ls.map(function(x){
    var c = comps[x.rid] || null, ehPix = /pix/i.test(x.forma || "");
    return {id:x.rid, it:x, comp:c, sit:sitDe(x), rec:x.aberto ? "—" : dm(x.d), venc:dm(x.venc), nome:x.rev, valor:x.aberto ? x.saldo : x.valor, orig:x.valor, forma:x.grupo || "—", conta:bancoDe(limpa(x.forma)), cnpj:donoDe(x), rep:x.rep, nota:x.nota || "—", parc:x.parc || "—",
      compro:c ? "Ver" : (!x.aberto && ehPix && x.rep==="Sorelly") ? "Falta anexar" : "—", abrir:"Abrir"}; });   // só o Pix do Atendimento interno (representante "Sorelly") tem comprovante lá; o das representantes não passa pelo Atendimento
  var corSit = function(l){ return l.it.aberto ? (atrasoDe(l.it)>0 ? "text-warning" : "") : "text-success"; };
  var botaoAbrir = function(v, l){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); setAberta(l.it); }, className:"cursor-pointer text-[11px] font-semibold underline hover:text-primary"}, "Abrir"); };
  var verComp = function(v, l){ if(v==="Ver" && l.comp) return e("button",{type:"button", title:l.comp.nome, onClick:function(ev){ ev.stopPropagation(); abrirComp(l.comp); }, className:"cursor-pointer underline"}, "Ver"); return v==="Falta anexar" ? e("span",{className:"text-warning"}, v) : v; };
  var cols = [{k:"sit", t:"Situação", cor:corSit}].concat(PAGO ? [{k:"rec", t:"Recebido"}] : [], [{k:"venc", t:"Vence"}, {k:"nome", t:"Revendedora"}, {k:"valor", t:"Valor", fmt:BKC}],
    [{k:"forma", t:"Forma"}, {k:"conta", t:"Conta"}, {k:"cnpj", t:"CNPJ"}, {k:"compro", t:"Comp.", render:verComp}], [{k:"rep", t:"Representante"}, {k:"nota", t:"Venda"}, {k:"parc", t:"Parcela"}], escopo==="receber" ? [{k:"orig", t:"Valor original", fmt:BKC}] : []);
  // COLUNAS DO JEITO DE CADA UM (igual à Contas a pagar): abre/fecha pelo menu "Colunas" e muda a ordem segurando o título; fica neste navegador, por usuário
  var ordenaCols = function(lista){
    var od = prefCols.ordem || [], pos = [], ks = [], out = lista.slice();
    lista.forEach(function(c, ci){ if(!c.fixa && od.indexOf(c.k)>=0){ pos.push(ci); ks.push(c.k); } });
    ks.sort(function(a, b){ return od.indexOf(a)-od.indexOf(b); });
    pos.forEach(function(ci, j){ out[ci] = lista.filter(function(c){ return c.k===ks[j]; })[0]; });
    return out;
  };
  var colsOrdenadas = ordenaCols(cols), ocultas = prefCols.ocultas || [];
  cols = colsOrdenadas.filter(function(c){ return c.fixa || ocultas.indexOf(c.k)<0; });
  var opcoesCols = colsOrdenadas.filter(function(c){ return !c.fixa; });
  var mudaPref = function(novo){ var o = Object.assign({}, prefCols, novo); setPrefCols(o); try{ localStorage.setItem(chavePref, JSON.stringify(o)); }catch(x){} };
  var moverCol = function(de, para){
    if(de===para) return;
    var ks = opcoesCols.map(function(c){ return c.k; }), a = ks.indexOf(de), b = ks.indexOf(para); if(a<0 || b<0) return;
    ks.splice(a, 1); ks.splice(b, 0, de); mudaPref({ordem:ks});
  };
  // TOTAL por dia, mês ou ano (acompanha a aba do período), com uma coluna para cada CNPJ que aparece e o acumulado
  var mesHoje = hoje0.slice(0, 7), anoHoje = hoje0.slice(0, 4), tits = []; ls.forEach(function(x){ if(tits.indexOf(x.titular)<0) tits.push(x.titular); }); tits.sort(function(a, b){ return String(a).localeCompare(String(b), "pt-BR"); });
  var totaisPor = function(chaveDe, rotuloDe, sitDe2){ var gr = {}; ls.forEach(function(x){ var k = chaveDe(x); (gr[k] = gr[k] || []).push(x); });
    var ks = Object.keys(gr).filter(function(k){ return k; }).sort(); if(gr[""]) ks.push(""); var acum = 0;
    return ks.map(function(k){ var its = gr[k], tot = r2(its.reduce(function(t, x){ return t+(x.aberto ? x.saldo : x.valor); }, 0)), tudo = its.every(function(x){ return !x.aberto; }); acum = r2(acum+tot);
      var o = {id:"d"+k, dia:k ? rotuloDe(k) : "Sem data", qtd:its.length, total:tot, acum:acum, sit:tudo ? "Recebido" : !k ? "Sem data" : sitDe2(k)};
      tits.forEach(function(t, i){ o["t"+i] = r2(its.filter(function(x){ return x.titular===t; }).reduce(function(t0, x){ return t0+(x.aberto ? x.saldo : x.valor); }, 0)); }); return o; }); };
  var linhasDia = per.modo==="anos" ? totaisPor(function(x){ return dataBase(x).slice(0, 4); }, function(k){ return k; }, function(k){ return k<anoHoje ? "Atrasadas" : k===anoHoje ? "Ano atual" : "A vencer"; })
    : per.modo==="meses" ? totaisPor(function(x){ return dataBase(x).slice(0, 7); }, function(k){ return nomeMes(k); }, function(k){ return k<mesHoje ? "Atrasadas" : k===mesHoje ? "Mês atual" : "A vencer"; })
    : totaisPor(dataBase, dm, function(k){ return k<hoje0 ? "Atrasadas" : k===hoje0 ? "Hoje" : "A vencer"; });
  var corDia = function(l){ return l.sit.indexOf("Atrasadas")===0 ? "text-warning" : l.sit==="Recebido" ? "text-success" : ""; };
  var colsDia = [{k:"dia", t:per.modo==="anos" ? "Ano" : per.modo==="meses" ? "Mês" : escopo==="recebidas" ? "Recebido" : escopo==="receber" ? "Vence" : "Data", cor:corDia}, {k:"sit", t:"Situação", cor:corDia}, {k:"qtd", t:"Pagamentos"}]
    .concat(tits.map(function(t, i){ return {k:"t"+i, t:t || "Sem titular", fmt:BKC}; }), [{k:"total", t:"Total", fmt:BKC}, {k:"acum", t:"Acumulado", fmt:BKC}]);
  var resumoGr = {}; if(agr) linhas.forEach(function(l){ var k = l[agr], g1 = resumoGr[k] || (resumoGr[k] = {n:0, tot:0, orig:0, np:0}); g1.n++; g1.tot += l.valor; g1.orig += l.orig; if(l.it.aberto) g1.np++; });   // total de cada grupo com TODAS as linhas (o grupo fechado só mostra uma)

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-4 -mb-4 -mt-4 md:-mx-6 md:-mb-6 md:-mt-6 [&>section]:!rounded-none [&>section]:!border-l-[4px] [&>section]:!border-t-0 [&>section]:!border-r-[4px] [&>section]:!border-b-[4px]"},
    aberta && createPortal(Ficha({x:aberta, c:comps[aberta.rid] || null, sit:sitDe(aberta), fechar:function(){ setAberta(null); }}), document.body),
    e(BlocoPainel,{titulo:escopo==="receber" ? "Contas a receber" : escopo==="recebidas" ? "Contas recebidas" : "Contas a receber e recebidas", compacto:true},
      e("div",{className:"flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-1.5 py-1 [&_button]:!h-[18px] [&_button]:!py-0 [&_button]:!leading-none [&_button]:!px-1 [&_button]:!text-[10px] [&_button]:!justify-center [&_button]:!border-white/25 [&_button]:!bg-white/10 [&_select]:!h-[18px] [&_select]:!py-0 [&_select]:!text-[10px] [&_input]:!h-[18px] [&_input]:!py-0 [&_input]:!text-[10px] [&_input]:!text-center"},   // padrao-ok: barra de filtros compacta, fonte 11 px, pedido do Marcus (20/11/2026)
        e("input",{type:"search", value:buscaTxt, onChange:function(ev){ setBuscaTxt(ev.target.value); }, placeholder:"Buscar: nome, valor...", "aria-label":"Buscar nas contas", style:{height:"18px", padding:"0 4px"}, className:"w-56 min-w-0 rounded border border-white/25 bg-white/10 text-center text-[10px] text-white placeholder:text-white/70 outline-none focus-visible:ring-2 focus-visible:ring-primary"}),   // padrao-ok: busca no alto, igual à Contas a pagar (pedido do Marcus de 16/11/2026)
        menuMini([["lista", "Separado"], ["dia", "Total"]], vista, setVista, "Visão"),
        menuMini([["receber", "A receber"], ["recebidas", "Recebidas"], ["todas", "Todas"]], escopo, function(k){ setEscopo(k); setPer({atras:k==="receber"}); }, "Situação"),
        vista==="lista" && menuMini([["", "Sem agrupar"], ["rep", "Por representante"], ["nome", "Por revendedora"]], agr, function(k){ setAgr(k); setGrAb({}); }, "Agrupar"),
        e(SeletorPeriodo,{anoAtual:anoAtual, anos:[], carr:{}, per:per, setPer:setPer, comAtraso:escopo==="todas"}),
        vista==="lista" && e(MenuMulti,{cls:"w-20 [&>button]:h-[18px] [&>button]:px-1", rodape:{rotulo:"Voltar ao padrão", onClick:function(){ mudaPref({ordem:[], ocultas:[]}); }}, opcoes:opcoesCols.map(function(c){ return [c.k, c.t]; }), valor:opcoesCols.filter(function(c){ return ocultas.indexOf(c.k)<0; }).map(function(c){ return c.k; }), onChange:function(lista){ mudaPref({ocultas:opcoesCols.map(function(c){ return c.k; }).filter(function(k){ return lista.indexOf(k)<0; })}); }, plural:"colunas", vazio:"Nenhuma coluna"}),
        menuMini([["n", "Sem funcionárias"], ["t", "Com funcionárias"]], quem, setQuem, "Quem"),
        lendo>0 && e("span",{role:"status", className:"text-[13px] font-semibold text-white"}, "Lendo a DevMaster… "+lendo+(lendo===1 ? " mês" : " meses")),
        falhou.length>0 && e("span",{role:"alert", className:"text-[13px] font-semibold text-warning"}, "Não consegui ler "+falhou.length+(falhou.length===1 ? " mês." : " meses.")+" Mude o período e volte.")),
      vista!=="lista" ? e(TabelaPlanilha,{key:escopo+vista, cols:colsDia, linhas:linhasDia, chave:"id", grade:true, semContagem:true, vazio:"Nenhum pagamento."})
        : e("div",{ref:function(el){ if(el){ var ajusta = function(){ var sc = el.querySelector(".overflow-x-auto"); if(!sc) return; var t = sc.getBoundingClientRect().top; var th0 = sc.querySelector("thead th"), hh = th0 ? th0.getBoundingClientRect().height : 18, av = Math.max(120, window.innerHeight-t-4), n = Math.max(3, Math.floor((av-hh)/18)), lh = (av-hh)/n; el.style.setProperty("--lh", lh.toFixed(3)+"px"); sc.style.height = (av-1)+"px"; sc.style.maxHeight = (av-1)+"px"; sc.style.scrollSnapType = "y mandatory"; sc.style.scrollPaddingTop = hh+"px"; }; ajusta(); setTimeout(ajusta, 150); if(!el.__aj){ el.__aj = ajusta; window.addEventListener("resize", function(){ if(el.__aj) el.__aj(); }); } else el.__aj = ajusta; var b = [].slice.call(el.querySelectorAll("th button")).filter(function(x){ return x.textContent.trim().toLowerCase().indexOf("comp.")===0; })[0]; if(b) b.title = "Comprovante"; } }, className:"flex min-h-0 flex-1 flex-col "+(agr ? CLS_GRUPO+" " : "")+CLS_FINA}, e(TabelaPlanilha, Object.assign({key:escopo+agr, fina:true, cols:cols, aoClicar:function(l){ setAberta(l.it); }, aoMoverColuna:moverCol, alturaMax:"calc(100vh - 6.6rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, maozinha:true, vazio:lendo>0 ? "Lendo a DevMaster…" : "Nenhum pagamento neste filtro."},
          agr ? {agrupar:agr, faixaFina:true, limite:porPag, grupoAberto:function(v){ return buscando || !!grAb[v]; }, aoGrupo:function(v){ var o = Object.assign({}, grAb); o[v] = !grAb[v]; setGrAb(o); },
              grupoEsquerda:true, linhaGrupo:function(v){ var g0 = resumoGr[v] || {n:0, tot:0, orig:0, np:0}, ks = cols.map(function(c){ return c.k; }), iv = ks.indexOf("valor"), span = iv>0 ? iv : cols.length;
                var rot = ((buscando || grAb[v]) ? "▾ " : "▸ ")+(v || "Sem nome")+" · "+g0.n+(g0.n===1 ? " pagamento" : " pagamentos")+(g0.np ? " · "+g0.np+" a receber" : "");
                if(span===cols.length) return {span:span, rotulo:rot+" · "+BKC(r2(g0.tot))};
                return {span:span, rotulo:rot, resto:cols.slice(span).map(function(c){ return c.k==="valor" ? BKC(r2(g0.tot)) : c.k==="orig" ? BKC(r2(g0.orig)) : ""; })}; }}
            : {limite:6000})))));
}

// FICHA do pagamento (botão Abrir): só leitura, com o comprovante do Atendimento quando existe
function Ficha(p){
  var x = p.x, c = p.c;
  var dado = function(t, v){ return e("div",{key:t, className:"flex items-center justify-between gap-3 border-b border-border py-1"}, e("span",{className:"text-[11px] font-semibold uppercase"}, t), e("span",{className:"text-right text-[13px]"}, v)); };
  return e("div",{role:"dialog", "aria-modal":"true", "aria-label":"Pagamento", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }, className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"},
    e("div",{className:"flex max-h-[90vh] w-full max-w-md flex-col gap-1 overflow-auto rounded-lg border-2 border-[var(--bloco-titulo)] bg-popover p-3 text-foreground shadow-xl"},
      e("div",{className:"flex items-center justify-between gap-2 pb-1"}, e("b",{className:"text-[13px]"}, x.rev), e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"h-8 rounded-md border border-border px-3 text-[13px] hover:bg-white/10"}, "Fechar")),
      dado("Situação", p.sit), dado("Valor", BKC(x.aberto ? x.saldo : x.valor)), x.aberto && dado("Valor original", BKC(x.valor)), dado("Emissão", dm(x.d)), dado("Vence", dm(x.venc)), dado("Forma", x.grupo || "—"), dado("Conta de entrada", limpa(x.forma) || "—"),
      dado("CNPJ", x.titular || "—"), dado("Representante", x.rep || "—"), dado("Venda", x.nota || "—"), dado("Parcela", x.parc || "—"), dado("Código da revendedora", x.cod || "—"),
      e("div",{className:"flex items-center justify-between gap-3 pt-2"}, e("span",{className:"text-[11px] font-semibold uppercase"}, "Comprovante"),
        c ? e("button",{type:"button", onClick:function(){ abrirComp(c); }, className:"h-8 cursor-pointer rounded-md border border-border px-3 text-[13px] underline hover:bg-white/10"}, "Ver") : e("span",{className:"text-[13px]"}, "—"))));
}

export { AbaCtaReceber };
