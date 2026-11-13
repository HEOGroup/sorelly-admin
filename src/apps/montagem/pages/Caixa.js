// Sorelly Admin · montagem — pages/Caixa.js (Financeiro › Contas bancárias)
// UMA planilha grande só (Marcus, 12/11/2026): linhas = contas por CNPJ + totais, resumo do mês, pagamentos, recebido e faturamento do dia; colunas = cada dia do mês (mais o último dia do mês anterior, que é a base).
// Dá para LANÇAR direto nas células (saldo da conta, pagamentos do dia, faturamento do dia). Dia sem lançamento repete o saldo do dia anterior e fica MARCADO (amarelo): só repetiu, ninguém atualizou.
// Cada CNPJ tem uma barra que abre e fecha; o botão Aberto / Fechar do CNPJ (coluna Hoje) confirma o CNPJ de hoje (SALDO_FECHAR). Guarda em s.saldosContas (reducer SALDO_*). Regras em domain/saldos-contas.js.
import { MESES_LONGO, contasDoMes, fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { RECEBER_LOCAL, RECEBER_MAPA_LOCAL, FERIADOS, chaveMes, datasLancadas, isoDia } from "@/apps/montagem/domain/saldos-contas";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";
import { ConfigContas } from "@/apps/montagem/pages/ConfigContas";
import { bancoDeConta, junta, nomePropio, rotuloCnpj } from "@/apps/montagem/lib/nome-conta";
import { filtrar, servidorEm, setBaixas, setClasse, setLancamentos, setPf, totais } from "@/apps/montagem/domain/contas-empresa";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";

var dp = function(k){ return k.split("-").reverse().join("/"); };
var dc = function(k){ return k.split("-").reverse().slice(0,2).join("/"); };
var sinal = function(v){ return (v>=0 ? "+ " : "− ")+BK(Math.abs(v)); };
var num = function(v){ return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var cor = function(v){ return v<0 ? "text-destructive" : ""; };   // número positivo ou zero = branco; negativo = vermelho (Marcus, 12/11/2026)
var SEM = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
var diaSem = function(k){ return new Date(k+"T12:00:00").getDay(); };
var fimSem = function(k){ var d = diaSem(k); return d===0 || d===6 || !!FERIADOS[k]; };   // fim de semana e feriado: mesma cor
var NOME_BARRA = {"34":"Sorelly", "46":"Mayz", "59":"Serenity", "67":"Axis", "HO":"H&O", "ho":"H&O"};
// ESCRITA DA CONTA (regra única do Financeiro, lib/nome-conta.js): empresa = CNPJ nº · Nome curto · Banco; cada informação aparece UMA vez. Duas contas do mesmo CNPJ e banco ganham o que as diferencia no fim (Rotativo, Aplicação).
var semAc = function(x){ return String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
var idEmpresa = function(b, c){ if(["34", "46", "59", "67", "HO", "ITM"].indexOf(b.id)>=0) return b.id; var m = /(?:^|\s)(34|46|59|67)(?:\s|$)/.exec(c.nome); return m ? m[1] : ""; };
var rotuloEmpresa = function(id, nome){ return rotuloCnpj(id==="HO" ? "H&O" : id, nome); };
function rotuloConta(b, c){
  var id = idEmpresa(b, c), banco = bancoDeConta(c.nome), resto = "";
  if(id){ var fora = {}; semAc(banco+" "+id+" "+(rotuloEmpresa(id, b.nome))+" "+b.nome+" economica cnpj").split(/[\s·]+/).forEach(function(w){ if(w) fora[w] = 1; });
    resto = nomePropio(String(c.nome).split(/\s+/).filter(function(w){ return !fora[semAc(w)]; }).join(" ")); }
  var cn = id==="HO" ? "H&O" : id==="ITM" ? "Marco PJ" : id || nomePropio(b.nome);   // primeira coluna: o número do CNPJ
  return {id:id, cn:cn, base:id ? (banco || resto || nomePropio(c.nome)) : nomePropio(c.nome), resto:banco ? resto : ""};   // segunda coluna: só o nome da conta
}
var TINTAS = ["[--bgl:#232b37] bg-[#232b37]", "[--bgl:#2a2837] bg-[#2a2837]", "[--bgl:#1e2f2d] bg-[#1e2f2d]", "[--bgl:#322630] bg-[#322630]", "[--bgl:#1d2f36] bg-[#1d2f36]", "[--bgl:#282a30] bg-[#282a30]", "[--bgl:#322924] bg-[#322924]", "[--bgl:#2a3123] bg-[#2a3123]"];   // uma cor clara de fundo para cada CNPJ (linhas da planilha)
var linhaCls = function(l){ return l.ci!==undefined ? TINTAS[l.ci % TINTAS.length] : (l.total || l.forte) ? "bg-white/10 font-bold" : ""; };

// saldo da conta numa data (último lançado até lá); ds = datas lançadas, ordenadas
function efetivo(sc, ds, id, ate){
  for(var i=ds.length-1; i>=0; i--){ if(ds[i]<=ate && sc.saldos[ds[i]][id]!==undefined) return sc.saldos[ds[i]][id]; }
  return null;
}

// célula editável: clica, digita (dígitos entram pela direita, "-" inverte o sinal), Enter grava.
// rep = o valor só repetiu o do dia anterior (ninguém lançou): texto amarelo. travado = CNPJ fechado naquele dia. inteiro = número sem centavos (quantidade de acertos).
function Celula(p){
  var st = useState(null), ed = st[0], setEd = st[1], div = p.inteiro ? 1 : 100, okR = useRef(false);
  if(p.leitura) return e("span",{className:"block w-full px-2 py-0 text-center text-[11px] tabular-nums "+cor(p.v)}, p.v===null ? "—" : (p.inteiro ? String(Math.round(p.v)) : BK(p.v)));   // leitura: sem clique para editar, o meio da tela fica com a mão de arrastar
  var txt = function(v){ return p.inteiro ? String(Math.round(Math.abs(v))) : num(Math.abs(v)); };
  if(ed===null) return e("button",{type:"button", disabled:p.travado && !p.reabrir, onClick:function(){ if(p.travado && p.reabrir) p.reabrir(); setEd(p.v||0); },
    title:p.travado ? (p.reabrir ? "CNPJ fechado hoje: clique para reabrir e editar" : "CNPJ fechado neste dia: reabra o CNPJ para editar") : p.rep ? "Repetido do dia anterior: ninguém confirmou este saldo. Clique, digite e aperte Enter (OK)." : "Clique, digite o saldo e aperte Enter (OK). Se for zero, aperte Enter também.",
    className:"w-full px-2 py-0 text-center text-[11px] "+"tabular-nums "+(p.travado ? "" : " hover:underline")+(p.pulsa ? " pulso-leve" : "")}, e("span",{className:cor(p.v)}, p.v===null ? "—" : (p.inteiro ? String(Math.round(p.v)) : BK(p.v))));   // a cor vai no span: a regra do bloco compacto força branco no botão
  return e("input",{ref:function(el){ if(el && document.activeElement!==el){ el.focus(); el.select(); } }, inputMode:"numeric", value:(ed<0?"-":"")+txt(ed),
    className:"w-full min-w-24 border-b border-white bg-transparent px-2 py-0 text-center text-[11px] outline-none "+"tabular-nums "+cor(ed),
    onChange:function(ev){ var raw = ev.target.value, n = (raw.match(/-/g)||[]).length%2===1, dg = raw.replace(/\D/g,"").slice(0,12); setEd((n?-1:1)*Number(dg||0)/div); },
    onKeyDown:function(ev){ if(ev.key==="Enter"){ okR.current = true; p.salvar(ed); setEd(null); } if(ev.key==="Escape"){ okR.current = true; setEd(null); } },
    onBlur:function(){ if(!okR.current && ed!==null && ed!==p.v) p.salvar(ed); okR.current = false; setEd(null); }});   // sair do campo só grava se mudou; Enter (OK) grava sempre, até o zero
}


// ── "Como ler": como a conta fecha, o que se lança todo dia, quem lança e quando (recolhido por padrão) ──
function ComoLer(p){
  var fl = p.fl || {}, atraso = function(u){ if(!u) return null; var d = Math.round((new Date(p.ontem+"T12:00:00")-new Date(u+"T12:00:00"))/86400000); return d<=0 ? 0 : d; };
  var passo = function(n, t, d){ return e("div",{className:"flex gap-2"}, e("span",{className:"grid size-6 shrink-0 place-items-center rounded-md bg-[var(--bloco-titulo)] text-[11px] font-bold text-white"}, n), e("div",{className:"text-[13px] leading-snug"}, e("b",{}, t), d ? " — "+d : "")); };
  var SUB = "text-[11px] font-bold uppercase tracking-wide text-white";
  var linhas = p.fontes.map(function(f){ var a = atraso(f.ultima); return {nome:f.nome, quem:f.quem, onde:f.onde, ultima:f.ultima ? dp(f.ultima) : "—", sit:a===null ? "nunca lançado" : a===0 ? "✓ em dia" : "atrasado "+a+" dia(s)", a:a}; });
  return e(BlocoPainel,{titulo:"Como ler o Caixa", compacto:true}, e("div",{className:"flex flex-col gap-3 p-3"},
    e("div",{className:"grid gap-3 lg:grid-cols-2"},
      e("div",{className:"flex flex-col gap-2"},
        e("p",{className:SUB}, "A conta que precisa fechar"),
        passo("1","Saldo no início","dinheiro nas contas no 1º dia do período (último saldo do dia anterior)"),
        passo("2","+ Recebido nas contas","baixas do contas a receber, sem o acerto com loja (não entrou) e sem os repasses diretos (não passam pelas contas), mais os aportes de sócio"),
        passo("3","− Contas pagas","pagos por CNPJ e por fora, sem os repasses diretos a fornecedores"),
        passo("4","= Saldo esperado  ×  Saldo real","a diferença é a divergência: SOBRANDO (mais dinheiro que o esperado) ou FALTANDO"),
        e("p",{className:"mt-1 text-[11px] text-white"}, "Durante o mês a divergência não é definitiva: venda do Carregar já entrou no banco e ainda não foi baixada, e inadimplência de outros meses entra nas baixas. O mês só fecha de verdade no fim.")),
      e("div",{className:"flex flex-col gap-2"},
        e("p",{className:SUB}, "O funil do período"+(p.dA ? " ("+dc(p.dA)+" → "+dc(p.dB)+")" : "")),
        [["Notas fiscais (faturado)", fl.nf, "o que foi vendido e faturado"],["Contas a receber (baixas)", fl.baixas, "o que foi liquidado, inclui inadimplência antiga e compra de funcionários"],["Recebido nas contas", fl.fat, "baixas − acerto com loja − repasses diretos + aportes"],["Entrou de verdade", fl.entrou, "variação do saldo + o que foi pago (nas contas)"]].map(function(x){
          return e("div",{key:x[0], className:"flex items-baseline justify-between gap-3 border border-border px-3 py-1.5 text-[13px]"}, e("span",{}, e("b",{}, x[0]), e("span",{className:"ml-2 text-[11px] text-white"}, x[2])), e("b",{className:"tabular-nums"}, x[1]===undefined||x[1]===null ? "—" : BK(x[1]))); }),
        e("p",{className:"text-[11px] text-white"}, "Cada degrau tem um motivo diferente de diferença. Compare um com o outro para achar onde está a divergência."))),
    e("div",{},
      e("p",{className:SUB+" mb-1"}, "O que se lança todo dia, quem e quando (sempre às 10h do dia seguinte, sobre o dia anterior)"),
      e(TabelaPlanilha,{semContagem:true, grade:true, chave:"nome", linhas:linhas, cols:[{k:"nome", t:"Item"}, {k:"quem", t:"Quem lança"}, {k:"onde", t:"Onde"}, {k:"ultima", t:"Último dia lançado"}, {k:"sit", t:"Situação", render:function(v, l){ return e("span",{className:"font-semibold "+(l.a===null ? "text-red-300" : l.a===0 ? "text-emerald-300" : "text-amber-300")}, v); }}]}),
      e("p",{className:"mt-1 text-[11px] text-white"}, "Quem lança cada item ainda será definido (por enquanto, os dados do Marcus). O horário combinado é provisório e será revisto.")),
    e("div",{},
      e("p",{className:SUB+" mb-1"}, "Regras e ideias deste sistema"),
      e("ul",{className:"list-disc space-y-0.5 pl-5 text-[13px] leading-snug text-white"},
        e("li",{}, "O saldo de cada dia é o do FIM do dia. Conta sem lançamento no dia vale o último saldo. Fim de semana e feriado aparecem em violeta."),
        e("li",{}, "Acerto com loja está nas baixas, mas não entra na conta. Inadimplência paga de outros meses entra nas baixas (ainda não dá para separar)."),
        e("li",{}, "Repasses diretos (Point, Pontual, Office Graf, Linda Acessórios, Prestadores, PIX Representantes): a revendedora paga direto ao fornecedor. Entram no recebido e já contam como pago (estão em “contas por fora”), por isso saem das contas."),
        e("li",{}, "Aporte de sócio: dinheiro que o sócio manda para um CNPJ. Não é faturamento; entra como aporte no dia."),
        e("li",{}, "Não há transferência entre CNPJs. O Itaú Marco PJ é conta da empresa, num bloco próprio."),
        e("li",{}, "A divergência por CNPJ usa a natureza do relatório (ex.: PIX SICREDI ATACADISTA = CNPJ 34): é uma aproximação."),
        e("li",{}, "Em breve: puxar as formas de pagamento direto da Calculadora de acertos e o PIX para representantes do Consolidado.")))));
}

function AbaCaixa(){
  var cx = use(), s = cx.state, sc = s.saldosContas, hojeD = new Date(), hoje = isoDia(hojeD);
  var st = useState({a:hojeD.getFullYear(), m:hojeD.getMonth()}), per = st[0], setPer = st[1], ano = per.a, mes = per.m;
  var fs = useState("todos"), filtro = fs[0], setFiltro = fs[1];
  var cf = useState(false), cfg = cf[0], setCfg = cf[1];
  var lr = useState(false), ler = lr[0], setLer = lr[1];
  var oc = useState({}), ocultos = oc[0], setOcultos = oc[1];
  var gs = useState({}), gFech = gs[0], setGFech = gs[1];   // barras FECHADAS (o que não está aqui está aberto)
  var dd = useState(false), diasAberto = dd[0], setDiasAberto = dd[1];
  var aba = "saldos", raiz = useRef(null), edS = useState(false), edita = edS[0], setEdita = edS[1], pe = useState({modo:"mes", de:"", ate:""}), periodo = pe[0], setPeriodo = pe[1], po = useState(null), popPos = po[0], setPopPos = po[1], lgS = useState(1600), lg = lgS[0], setLg = lgS[1];
  useEffect(function(){ var el = raiz.current; if(!el) return undefined; var calc = function(){ setLg(el.clientWidth); }; calc(); var ro = typeof ResizeObserver!=="undefined" ? new ResizeObserver(calc) : null; if(ro) ro.observe(el); window.addEventListener("resize", calc); return function(){ if(ro) ro.disconnect(); window.removeEventListener("resize", calc); }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  // DEVMASTER (Marcus, 12/11/2026): o Resumo do mês bate Contas a receber e Contas pagas com o saldo. Mesmas fontes da tela Resultado do mês.
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);
  var sdr = useState(null), dr = sdr[0], setDr = sdr[1];
  var carregaDr = function(){ chamar("GET", "/contas-receber").then(setDr).catch(function(x){ setDr({erro:x.message}); }); };
  useEffect(function(){ if(apiAtiva()) carregaDr(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(!dr || dr.pronto===undefined || (dr.pronto && !dr.atualizando)) return undefined; var id = setTimeout(carregaDr, 4000); return function(){ clearTimeout(id); }; }, [dr]);   // eslint-disable-line react-hooks/exhaustive-deps
  var ds = datasLancadas(sc), pref = chaveMes(ano, mes), ehAtual = ano===hojeD.getFullYear() && mes===hojeD.getMonth();
  var baseData = isoDia(new Date(ano, mes, 0)), fm = sc.fechamentos || {};
  // colunas: o último dia do mês anterior (base) e TODOS os dias do mês até hoje (mês passado: até o fim)
  var ultimo = ehAtual ? hoje : isoDia(new Date(ano, mes+1, 0)), dias = [];
  if(isoDia(new Date(ano, mes, 1))<=hoje){ for(var di = 1; di<=31; di++){ var iso = isoDia(new Date(ano, mes, di)); if(iso.slice(0,7)!==pref || iso>ultimo) break; dias.push(iso); } }
  var diasSel = dias;   // PERÍODO (Marcus, 12/11/2026): Base + hoje (padrão), mês inteiro, últimos 7 ou 15 dias, ou de um dia até outro; a base (último dia do mês anterior) vai sempre junto
  if(periodo.modo==="hoje") diasSel = dias.slice(-1); else if(periodo.modo==="7") diasSel = dias.slice(-7); else if(periodo.modo==="15") diasSel = dias.slice(-15);
  else if(periodo.modo==="faixa"){ var deF = periodo.de || dias[0], ateF = periodo.ate || dias[dias.length-1]; diasSel = dias.filter(function(k){ return k>=deF && k<=ateF; }); }
  var cols = [baseData].concat(diasSel), vcols = cols.filter(function(k){ return !ocultos[k]; });
  var dA = vcols[0], dB = vcols[vcols.length-1], dEnd = cols[cols.length-1];
  var mover = function(n){ var d2 = new Date(ano, mes+n, 1); setPer({a:d2.getFullYear(), m:d2.getMonth()}); setOcultos({}); setPeriodo({modo:periodo.modo==="faixa" ? "mes" : periodo.modo, de:"", ate:""}); };
  var blocos = sc.blocos.filter(function(b){ return sc.contas.some(function(c){ return c.bloco===b.id; }); });
  var vis = blocos.filter(function(b){ return filtro==="todos" || filtro===b.id; });
  var nomeFiltro = filtro==="todos" ? "" : ((sc.blocos.filter(function(b){ return b.id===filtro; })[0]||{}).nome||"");
  var contasSel = sc.contas.filter(function(c){ return filtro==="todos" || c.bloco===filtro; }), livres = contasSel.filter(function(c){ return !c.bloqueada; });
  var lancou = function(k, id){ return !!(sc.saldos[k] && sc.saldos[k][id]!==undefined); };
  var agoraD = new Date(), eh = function(k){ var lim = new Date(k+"T10:00:00"); lim.setDate(lim.getDate()+1); return agoraD >= lim; };   // eh(k): já passou das 10h do dia seguinte a k? só então um saldo não preenchido repete o do dia anterior
  var vd = function(id, k){ if(lancou(k, id)) return sc.saldos[k][id]; return eh(k) ? efetivo(sc, ds, id, k) : 0; };   // preenchido = o valor; não preenchido e ainda no prazo = 0,00; passou das 10h do dia seguinte = repete o anterior
  var sd = function(id, k){ var v = vd(id, k); return v===null ? 0 : v; };
  var realDia = function(k){ return livres.reduce(function(t, c){ return t+sd(c.id, k); }, 0); };
  var bloqDia = function(k){ return contasSel.filter(function(c){ return c.bloqueada; }).reduce(function(t, c){ return t+sd(c.id, k); }, 0); };
  var limSel = livres.reduce(function(t, c){ return t+(c.limite||0); }, 0);
  var usadoDia = function(k){ return livres.reduce(function(t, c){ var v = sd(c.id, k); return t+(v<0 ? Math.min(c.limite||0, -v) : 0); }, 0); };
  var totalTodos = function(k){ return sc.contas.filter(function(c){ return !c.bloqueada; }).reduce(function(t, c){ return t+sd(c.id, k); }, 0); };
  // pagamentos, recebido e aportes por dia
  var pagoDia = function(k, id){ var d = (s.contasPagasDiario||{})[k]; if(!d) return 0; return id==="fora" ? (d.contasPorFora||0) : ((d.cnpjs||{})[id]||0); };
  var pagoTotalDia = function(k){ return ["34","46","59","67","fora"].reduce(function(t2,id){ return t2+pagoDia(k, id); },0); };
  var recDia = function(k, grupo){ var d = (RECEBER_LOCAL||{})[k]; if(!d) return 0; return Object.keys(d).reduce(function(x,n){ return x+((RECEBER_MAPA_LOCAL[n]||["DEF"])[0]===grupo ? d[n] : 0); },0); };
  var aporteDia = function(k, b){ return (((sc.aportes||{})[k])||[]).reduce(function(x,a){ return x+((!b || a.bloco===b) ? a.valor : 0); },0); };   // aporte de sócio: dinheiro que o sócio manda para o CNPJ
  var diasDe = function(a, b){ var out = [], d = new Date(a+"T12:00:00"), f = new Date(b+"T12:00:00"); d.setDate(d.getDate()+1); while(d<=f){ out.push(isoDia(d)); d.setDate(d.getDate()+1); } return out; };
  var temDiario = function(mm){ return Object.keys(s.contasPagasDiario||{}).filter(function(k){ return k.slice(0,7)===mm && pagoTotalDia(k)>0; }).length>=5; };   // mês com pagamentos lançados dia a dia
  var pagoPeriodo = function(a, b){ var porMes = {}; diasDe(a, b).forEach(function(k){ var mm = k.slice(0,7); (porMes[mm] = porMes[mm] || []).push(k); });
    return Object.keys(porMes).reduce(function(tot, mm){ var dd2 = porMes[mm], an = Number(mm.slice(0,4)), mi = Number(mm.slice(5,7))-1;
      if(temDiario(mm)) return tot+dd2.reduce(function(x,k){ return x+pagoTotalDia(k); },0);
      return tot+contasDoMes(s, String(an), mi).pago*dd2.length/new Date(an, mi+1, 0).getDate(); }, 0); };   // sem diário: valor do mês na proporção dos dias
  var fdAll = fatEfetivo(s);
  var acumCampo = function(campo, d){ var pts = {}; Object.keys(fdAll).sort().forEach(function(k){ (pts[k.slice(0,7)] = pts[k.slice(0,7)] || []).push([k, fdAll[k][campo]||0]); }); var mm = d.slice(0,7), tot = 0, v = 0; Object.keys(pts).sort().forEach(function(x){ if(x<mm){ var q = pts[x]; tot += q[q.length-1][1]; } }); (pts[mm]||[]).forEach(function(q){ if(q[0]<=d) v = q[1]; }); return tot+v; };   // acumulado até a data (guardado como acumulado do mês)
  var fatAte = function(d){ return acumCampo("recebido", d)-acumCampo("loja", d)+acumCampo("recup", d); };   // o que de fato entrou nas contas
  // funil do período (base → último dia) para o "Como ler"
  var fl = {ini:null, fim:null, fat:0, pago:0, esperado:null, dif:null};
  if(dEnd && baseData<dEnd){ fl.ini = totalTodos(baseData); fl.fim = totalTodos(dEnd); fl.fat = fatAte(dEnd)-fatAte(baseData); fl.baixas = acumCampo("recebido", dEnd)-acumCampo("recebido", baseData); fl.loja = acumCampo("loja", dEnd)-acumCampo("loja", baseData); fl.recup = acumCampo("recup", dEnd)-acumCampo("recup", baseData); fl.pago = pagoPeriodo(baseData, dEnd); fl.pagoBruto = fl.pago;
    fl.dir = diasDe(baseData, dEnd).reduce(function(x,k){ return x+recDia(k,"FORN"); },0);   // vai direto ao fornecedor/representante: nunca passa pelas contas (entra no recebido e já conta como pago)
    fl.aporte = diasDe(baseData, dEnd).reduce(function(x,k){ return x+aporteDia(k); },0); fl.nf = acumCampo("nf", dEnd)-acumCampo("nf", baseData);
    fl.fat = fl.fat-fl.dir+fl.aporte; fl.pago = Math.max(0, fl.pago-fl.dir); fl.esperado = fl.ini+fl.fat-fl.pago; fl.dif = fl.fim-fl.esperado; fl.entrou = fl.fim-fl.ini+fl.pago; }
  // resumo do mês, dia a dia: do fechamento do mês anterior (base) até cada dia, só com o que aconteceu NESTE mês
  var fluxo = function(k){
    var entre = diasDe(baseData, k), ini = realDia(baseData), rec, pago;
    if(filtro==="todos"){ var dir = entre.reduce(function(x,d){ return x+recDia(d,"FORN"); },0), ap2 = entre.reduce(function(x,d){ return x+aporteDia(d); },0); rec = (fatAte(k)-fatAte(baseData))-dir+ap2; pago = Math.max(0, pagoPeriodo(baseData, k)-dir); }
    else { rec = entre.reduce(function(x,d){ return x+recDia(d, filtro)+aporteDia(d, filtro); },0); pago = entre.reduce(function(x,d){ return x+pagoDia(d, filtro); },0); }
    var esp = ini+rec-pago; return {rec:rec, pago:pago, esp:esp, dif:realDia(k)-esp};
  };
  var somaDias = function(fn){ return diasDe(dA||hoje, dB||hoje).reduce(function(x,k){ return x+fn(k); },0); };
  var ultimaDe = function(obj, fn){ var ks = Object.keys(obj||{}).filter(fn).sort(); return ks.length ? ks[ks.length-1] : null; };
  var ontemIso = isoDia(new Date(hojeD.getFullYear(), hojeD.getMonth(), hojeD.getDate()-1));
  var fontes = [
    {nome:"Saldos das contas bancárias", quem:"Marcus (por enquanto)", onde:"Caixa › planilha dia a dia (as células)", ultima:ds.length ? ds[ds.length-1] : null},
    {nome:"Pagamentos do dia (por CNPJ e por fora)", quem:"Nayale", onde:"Financeiro › Contas a pagar › Diário", ultima:ultimaDe(s.contasPagasDiario, function(k){ return pagoTotalDia(k)>0; })},
    {nome:"Notas fiscais (faturado)", quem:"Marcus (por enquanto)", onde:"Financeiro › Faturamento (outra tela)", ultima:ultimaDe(s.fatDia, function(k){ return (s.fatDia[k].nf||0)>0; })},
    {nome:"Contas a receber (baixas)", quem:"Marcus (por enquanto)", onde:"Financeiro › Faturamento (outra tela)", ultima:ultimaDe(s.fatDia, function(k){ return (s.fatDia[k].recebido||0)>0; })}];
  var fechar = function(k, ids, fechado){ var valores = {}; sc.contas.filter(function(c){ return ids.indexOf(c.bloco)>=0; }).forEach(function(c){ valores[c.id] = sd(c.id, k); }); cx.dispatch({type:"SALDO_FECHAR", data:k, blocos:ids, valores:valores, fechado:fechado}); };
  var todosIds = blocos.map(function(b){ return b.id; });

  // ── linhas da planilha ──
  var linhas = [], meta = {}, uid = 0;
  var grupo = function(ord, nome, extra){ var key = ord+"|"+nome; meta[key] = Object.assign({nome:nome}, extra||{}); return key; };
  var linha = function(g, nome, tipo, fn, extra){ var r = Object.assign({id:"r"+(uid++), g:g, nome:nome, tipo:tipo}, extra||{}); cols.forEach(function(k){ r[k] = fn(k); }); linhas.push(r); return r; };
  var varDe = function(fn){ return dA && dB && dA!==dB ? fn(dB)-fn(dA) : null; };
  var gT = grupo("00", "Totais do dia"+(nomeFiltro ? " · "+nomeFiltro : ""));
  var rT = function(nome, fn, comVar){ var r = linha(gT, nome, "tot", fn); r.var = comVar ? varDe(fn) : null; return r; };
  rT("TOTAL · saldo real (sem bloqueadas)", realDia, true);
  rT("DISPONÍVEL · saldo + cheque especial", function(k){ return realDia(k)+limSel; }, true);
  rT("Cheque especial · limite", function(){ return limSel; });
  rT("Cheque especial · usado", usadoDia);
  rT("Cheque especial · folga", function(k){ return Math.max(0, limSel-usadoDia(k)); });
  rT("Bloqueado", bloqDia, true);
  vis.forEach(function(b, i){
    var cs = sc.contas.filter(function(c){ return c.bloco===b.id; }), g = grupo(String(10+i), b.nome, {bloco:b.id, n:cs.length, bloq:b.id==="BLOQ", contas:cs});
        var rot = cs.map(function(c){ return rotuloConta(b, c); }), cont = {}; rot.forEach(function(x){ var q = x.id+"|"+x.base; cont[q] = (cont[q]||0)+1; });
    cs.forEach(function(c, ci){ var rx = rot[ci], nomeC = ((cont[rx.id+"|"+rx.base]>1 || b.id==="BLOQ") && rx.resto) ? junta([rx.base, rx.resto]) : rx.base; var r = linha(g, nomeC, "conta", function(k){ return vd(c.id, k); }, {cid:c.id, bloco:b.id, conta:c, ci:i, cn:rx.cn}); r.var = (dA && dB) ? sd(c.id, dB)-sd(c.id, dA) : null; r.lim = c.limite||0; r.disp = c.bloqueada ? 0 : sd(c.id, dEnd)+(c.limite||0); });
  });
  // ── colunas ──
  var celula = function(k){ return function(v, l){
    if(l.tipo==="conta"){ var lanc = lancou(k, l.cid), trav = !!(fm[k] && fm[k][l.bloco]);
      return e(Celula,{key:k+l.cid+(v===null ? "n" : v), v:v, lancado:lanc, rep:!lanc && eh(k) && v!==null, travado:trav, leitura:!edita || k!==hoje, reabrir:k===hoje ? function(){ fechar(k, [l.bloco], false); } : null, salvar:function(x){ cx.dispatch({type:"SALDO_CEL", data:k, conta:l.cid, valor:x}); }}); }
    if(l.tipo==="sit") return v===null ? "—" : e("span",{className:"font-semibold "+(v==="Bateu" ? "text-success" : v==="Sobrando" ? "text-amber-300" : "text-destructive")}, v);
    if(v===null || v===undefined) return "—";
    var n = Number(v), c3 = n<0 ? "text-destructive" : "";
    return e("span",{className:"tabular-nums "+c3}, l.tipo==="roi" ? String(Math.round(n)) : (n===0 && l.tipo!=="tot" && l.tipo!=="dif" ? "—" : BK(n)));
  }; };
  var colDia = function(k){ var semLanc = eh(k) && !sc.contas.some(function(c){ return lancou(k, c.id); });
    return {k:k, t:SEM[diaSem(k)].slice(0, 3)+" "+dc(k)+(k===hoje ? " · hoje" : "")+(k===baseData ? " · base" : ""), w:"7.5rem", corTopo:semLanc ? "#FBBF24" : (fimSem(k) ? "#8B5CF6" : undefined), pulso:edita && k===hoje, render:celula(k)}; };
  var pCols = [{k:"nome", t:"Conta", w:"20rem", fixa:true, bordaGrossa:true, bordaFora:"esq", render:function(v, l){ return e("span",{title:v}, v); }}]
    .concat(vcols.map(function(k, i){ var cd = colDia(k); if(i===vcols.length-1){ cd.fixaDir = "26.5rem - 6px"; cd.bordaGrossa = true; } return cd; }), [
      {k:"var", t:"Variação "+(dA && dB && dA!==dB ? dc(dA)+" → "+dc(dB) : ""), w:"10rem", fixaDir:"16.5rem - 4px", render:function(v, l){ return v===null || v===undefined ? "—" : e("span",{className:"tabular-nums "+(l.varTipo==="soma" ? "" : cor(v))}, l.varTipo==="soma" ? BK(v) : sinal(v)); }},
      {k:"lim", t:"Limite", w:"7.5rem", fixaDir:"9rem - 2px", render:function(v, l){ return (l.tipo==="conta" || l.tipo==="cnpjtot") && v ? e("span",{className:"tabular-nums"}, BK(v)) : ""; }},
      {k:"disp", t:"Disponível agora", w:"9rem", fixaDir:"0", bordaFora:"dir", render:function(v, l){ return (l.tipo==="conta" || l.tipo==="cnpjtot") ? e("span",{className:"tabular-nums "+cor(v)}, BK(v)) : ""; }}]);
  var abrirGrupos = function(v){ var o = {}; Object.keys(meta).forEach(function(k){ o[k] = !v; }); setGFech(o); };


  var deX = periodo.de || dias[0] || baseData, ateX = periodo.ate || dias[dias.length-1] || baseData;
  var rotPeriodo = periodo.modo==="hoje" ? "Base + hoje" : periodo.modo==="mes" ? "Mês inteiro" : periodo.modo==="7" ? "Últimos 7 dias" : periodo.modo==="15" ? "Últimos 15 dias" : "De "+dc(deX)+" até "+dc(ateX);
  var botaoPeriodo = e("button",{type:"button", title:"Escolher quais dias aparecem na planilha", onClick:function(ev){ var r = ev.currentTarget.getBoundingClientRect(); setPopPos(popPos ? null : {x:r.left, y:r.bottom+4}); }, className:"h-[18px] whitespace-nowrap rounded-md border border-white/40 bg-white/10 px-2 text-[11px] font-semibold normal-case text-white hover:bg-white/20"}, "Período: "+rotPeriodo+" ▾");
  // janelinha do período no padrão do sistema (igual ao menu de filtro das colunas): tudo centralizado, linhas finas, itens de 32 px, letra de 13 e 11 px
  var botaoEditar = e("button",{type:"button", title:edita ? "Terminar a edição (a planilha volta a só mostrar e rolar)" : "Abre as células: clique na conta, digite o saldo e aperte Enter (OK). Saldo zero também precisa do OK", onClick:function(){ setEdita(!edita); }, className:"h-[18px] whitespace-nowrap rounded-md border px-2 text-[11px] font-semibold text-white "+(edita ? "border-white bg-white/30" : "border-white/40 bg-white/10 hover:bg-white/20")}, edita ? "Concluir edição" : "Editar");
  var acoesBarra = e("span",{className:"flex items-center gap-1"}, botaoPeriodo, botaoEditar);
  // RESPONSIVO (Marcus, 12/11/2026): o travamento depende da largura. Larga = trava os dois lados; média = só a esquerda (CNPJ e Conta); estreita = nada travado. Assim, rolando até um lado ou outro, as colunas sempre aparecem inteiras.
  var travaE = lg>=760, travaD = lg>=1250;
  var ajusta = function(arr){ return arr.map(function(c){ var o = Object.assign({}, c); if(!travaE && o.fixa){ delete o.fixa; delete o.bordaFora; delete o.bordaGrossa; } if(!travaD && o.fixaDir!==undefined){ delete o.fixaDir; delete o.bordaFora; delete o.bordaGrossa; } return o; }); };
  var CABP = "flex min-h-[26px] items-center justify-center bg-[var(--bloco-colunas)] px-3 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-white";
  var ITEMP = "flex h-8 w-full items-center justify-center border-t border-border px-3 text-center text-[13px] hover:bg-white/10 ";
  var CAMPOP = "h-8 w-full border-t border-border bg-transparent px-2 text-center text-[13px] text-foreground outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden";
  var abreData = function(ev){ if(ev.target.showPicker){ try{ ev.target.showPicker(); }catch(x){ /* sem calendário: digita */ } } };
  var popPeriodo = popPos && e("div",{key:"popperiodo"}, e("div",{className:"fixed inset-0 z-40", onClick:function(){ setPopPos(null); }}),
    e("div",{className:"fixed z-50 max-h-[88vh] w-72 overflow-y-auto rounded-lg border border-border bg-popover text-foreground shadow-xl", style:{left:Math.min(popPos.x, Math.max(8, window.innerWidth-300)), top:Math.min(popPos.y, Math.max(8, window.innerHeight*0.1))}},
      e("div",{className:CABP}, "Atalhos"),
      [["hoje","Base + hoje"], ["mes","Mês inteiro (todos os dias)"], ["7","Últimos 7 dias"], ["15","Últimos 15 dias"]].map(function(x){ return e("button",{key:x[0], type:"button", onClick:function(){ setPeriodo({modo:x[0], de:"", ate:""}); setPopPos(null); }, className:ITEMP+(periodo.modo===x[0] ? "bg-white/15 font-bold" : "")}, x[1]); }),
      e("div",{className:CABP}, "Mês"),
      e("div",{className:"grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] border-t border-border"}, e("button",{type:"button", "aria-label":"Mês anterior", onClick:function(){ mover(-1); }, className:"h-8 text-[13px] hover:bg-white/10"}, "‹"), e("div",{className:"flex h-8 items-center justify-center border-x border-border text-[13px] font-semibold"}, MESES_LONGO[mes]+" de "+ano), e("button",{type:"button", "aria-label":"Próximo mês", onClick:function(){ mover(1); }, className:"h-8 text-[13px] hover:bg-white/10"}, "›")),
      e("div",{className:CABP}, "De um dia até outro dia"),
      e("div",{className:"grid grid-cols-2"}, e("div",{className:"border-r border-border"}, e("div",{className:"pt-1 text-center text-[11px] font-semibold uppercase tracking-[.05em]"}, "De"), e("input",{type:"date", min:dias[0], max:dias[dias.length-1], value:deX, "aria-label":"Primeiro dia", className:CAMPOP, onClick:abreData, onChange:function(ev){ if(ev.target.value) setPeriodo({modo:"faixa", de:ev.target.value, ate:periodo.ate}); }})),
        e("div",null, e("div",{className:"pt-1 text-center text-[11px] font-semibold uppercase tracking-[.05em]"}, "Até"), e("input",{type:"date", min:dias[0], max:dias[dias.length-1], value:ateX, "aria-label":"Último dia", className:CAMPOP, onClick:abreData, onChange:function(ev){ if(ev.target.value) setPeriodo({modo:"faixa", de:periodo.de, ate:ev.target.value}); }}))),
      e("div",{className:CABP}, "CNPJ"),
      e("select",{value:filtro, "aria-label":"Ver só um CNPJ", onChange:function(ev){ setFiltro(ev.target.value); }, className:CAMPOP+" cursor-pointer"}, [["todos","Todos os CNPJs"]].concat(blocos.map(function(b){ return [b.id, b.nome.split(" · ")[1] ? b.nome.split(" · ")[1] : b.nome.split(" ")[0]]; })).map(function(x){ return e("option",{key:x[0], value:x[0], className:"bg-[#1f3358] text-white"}, x[1]); })),
      e("div",{className:CABP}, "Dias"),
      e("button",{type:"button", className:ITEMP, onClick:function(){ setDiasAberto(!diasAberto); }}, "Dias: "+vcols.length+" de "+cols.length+(diasAberto ? " ▴" : " ▾")),
      diasAberto && e("div",{className:"border-t border-border px-3 py-2"}, e("div",{className:"mb-2 flex justify-center gap-2"}, e(Btn,{onClick:function(){ setOcultos({}); }}, "Todos"), e(Btn,{onClick:function(){ var o = {}; cols.forEach(function(k, i){ if(i<cols.length-2) o[k] = 1; }); setOcultos(o); }}, "Só os 2 últimos")),
        e("div",{className:"flex max-h-48 flex-col gap-0.5 overflow-y-auto"}, cols.map(function(k){ var marcado = !ocultos[k];
          return e("label",{key:k, className:"flex cursor-pointer items-center justify-center gap-2 rounded-md px-2 py-1 text-[13px] hover:bg-primary/10 "+(fimSem(k) ? "text-violet-300" : "")},
            e("input",{type:"checkbox", checked:marcado, onChange:function(){ var o = Object.assign({}, ocultos); if(marcado){ if(vcols.length<=1) return; o[k] = 1; } else delete o[k]; setOcultos(o); }}),
            e("span",{className:"w-20"}, SEM[diaSem(k)].slice(0,3)), e("span",{className:"tabular-nums"}, dp(k)), FERIADOS[k] && e("span",{className:"text-[11px]"}, "feriado")); }))),
      e("div",{className:CABP}, "Mais"),
      cols.indexOf(hoje)>=0 && e("button",{type:"button", className:ITEMP, title:"Fecha todos os CNPJs de hoje (confirma os saldos de hoje)", onClick:function(){ setPopPos(null); fechar(hoje, todosIds, true); }}, "Fechar CNPJs de hoje"),
      cols.indexOf(hoje)>=0 && e("button",{type:"button", className:ITEMP, title:"Reabre todos os CNPJs de hoje para editar", onClick:function(){ setPopPos(null); fechar(hoje, todosIds, false); }}, "Reabrir CNPJs de hoje"),
      e("button",{type:"button", className:ITEMP, onClick:function(){ setPopPos(null); abrirGrupos(true); }}, "Abrir todos os blocos"), e("button",{type:"button", className:ITEMP, onClick:function(){ setPopPos(null); abrirGrupos(false); }}, "Fechar todos os blocos"),
      e("button",{type:"button", className:ITEMP, onClick:function(){ setPopPos(null); setLer(!ler); }}, ler ? "Esconder como ler" : "Como ler esta tela"), e("button",{type:"button", className:ITEMP, onClick:function(){ setPopPos(null); setCfg(!cfg); }}, cfg ? "Fechar contas" : "Contas (cadastro)"),
      e("p",{className:"border-t border-border px-3 py-1.5 text-center text-[11px] text-white"}, "A coluna base (último dia do mês anterior) aparece sempre.")));
  var abaDe = function(key){ var o = key.slice(0, 2); return o==="80" ? "resumo" : o==="81" ? "pag" : o==="82" ? "rec" : o==="83" ? "fat" : o==="90" ? "conf" : "saldos"; };
  // RESUMO DO MÊS (Marcus, 12/11/2026): bate Contas a receber e Contas pagas (DevMaster) com o saldo das contas.
  //   Recebido (contas a receber, DevMaster, até agora) − Contas pagas (DevMaster, até agora) = resultado pela DevMaster.
  //   Saldo das contas hoje − saldo do dia 31 = resultado financeiro das contas. A divergência é a diferença entre os dois resultados.
  var mI = mes+1, m0R = mes, ymR = ano+"-"+String(mI).padStart(2, "0"), tPg = totais(filtrar(ymR, "", "", "", "", "")), srvPg = !!servidorEm() && tPg.n>0;
  var pagoR = srvPg ? tPg.pago : (contasDoMes(s, String(ano), m0R).pago || 0);   // com a DevMaster lida pelo servidor, a conta é a do alto da tela Contas a pagar
  var pronto = !!(dr && dr.pronto && dr.K && dr.A), ktR = pronto ? (dr.K.t[mI] || {}) : {}, recR = pronto ? (ktR.rec || 0) : null;   // Contas a receber SEM o acerto com loja (só o que foi pago na hora: Pix, link, cartão, dinheiro)
  var msgR = !apiAtiva() ? "sem servidor" : dr && dr.erro && !dr.pronto ? "erro ao ler" : "lendo a DevMaster…"+(dr && dr.etapa ? " "+dr.etapa+" "+(dr.pct || 0)+"%" : "");
  var iniR = totalTodos(baseData), fimR = totalTodos(dEnd||baseData), resDm = recR===null ? null : recR-pagoR, resFin = fimR-iniR, divR = resDm===null ? null : resFin-resDm;
  var sitR = divR===null ? "—" : Math.abs(divR)<1000 ? "Bateu" : divR>0 ? "Sobrando" : "Faltando";
  var linhasRes = [["Contas a receber (DevMaster) · até agora", recR===null ? msgR : recR], ["Contas pagas (DevMaster) · até agora", pagoR], ["Resultado pela DevMaster (receber − pagas)", resDm===null ? "—" : resDm], ["Saldo das contas em "+dc(baseData), iniR], ["Saldo das contas em "+dc(dEnd||baseData)+" (hoje)", fimR], ["Resultado financeiro das contas (hoje − "+dc(baseData)+")", resFin], ["Divergência (resultado financeiro − resultado DevMaster)", divR===null ? "—" : divR], ["Situação da divergência", sitR]].map(function(x, i){ return {id:"r"+i, nome:x[0], v:x[1], forte:/^Resultado/.test(x[0]) || /^Divergência/.test(x[0])}; });
  var blocoResumo = e(BlocoPainel,{titulo:"Resumo de "+MESES_LONGO[mes]+" de "+ano+" · DevMaster × saldo", compacto:true}, e(TabelaPlanilha,{semContagem:true, semFiltro:true, grade:true, chave:"id", linhas:linhasRes, linhaCls:linhaCls, cols:[{k:"nome", t:"Item", w:"26rem"}, {k:"v", t:"Valor", w:"11rem", render:function(v, l){ if(v===null || v===undefined) return "—"; if(typeof v==="string") return v; return e("span",{className:"tabular-nums "+cor(v)}, BK(v)); }}]}));
  // um bloco azul para cada grupo da aba escolhida  // um bloco azul para cada grupo da aba escolhida, todos com as mesmas colunas (alinhadas), como nas Chaves Pix
  // ABA SALDOS (Marcus, 12/11/2026): em cima, dois blocos lado a lado: Totais do dia (dia 31 × atual) e Saldo por CNPJ; embaixo, UMA planilha com todas as contas em sequência, uma cor clara de fundo por CNPJ, sem barra de título
  var cnomes = function(b){ if(b.id==="BLOQ") return "Bloqueado"; return ["34", "46", "59", "67", "HO", "ITM"].indexOf(b.id)>=0 ? rotuloEmpresa(b.id, b.nome) : nomePropio(b.nome); };
  var tl = [["TOTAL · saldo real (sem bloqueadas)", realDia, true], ["DISPONÍVEL · saldo + cheque especial", function(k){ return realDia(k)+limSel; }, true], ["Cheque especial · limite", function(){ return limSel; }, false], ["Cheque especial · usado", usadoDia, false], ["Cheque especial · folga", function(k){ return Math.max(0, limSel-usadoDia(k)); }, false], ["Bloqueado", bloqDia, true]];
  var linhasTot = tl.map(function(x, i){ var a2 = x[1](baseData), b2 = x[1](dEnd); return {id:"t"+i, nome:x[0], a:a2, b:b2, v:b2-a2, forte:x[2]}; });
  var rn = function(campo){ return function(v, l){ if(v===null || v===undefined) return ""; var comCor = l.forte || l.cnpj; if(campo==="v") return comCor ? e("span",{className:"tabular-nums "+cor(v)}, sinal(v)) : "—"; return e("span",{className:"tabular-nums "+(comCor ? cor(v) : "")}, BK(v)); }; };
  var colsAB = function(t0, nomeW){ return [{k:"nome", t:t0, w:nomeW, render:function(v, l){ return e("span",{className:"font-semibold"}, v+(l.n ? " · "+l.n+(l.n===1 ? " conta" : " contas") : "")); }}, {k:"a", t:"Dia "+dc(baseData)+" · base", w:"9.5rem", render:rn("a")}, {k:"b", t:"Atual · "+dc(dEnd), w:"9.5rem", render:rn("b")}, {k:"v", t:"Variação", w:"9.5rem", render:rn("v")}]; };
  var linhasCnpj = vis.map(function(b, i){ var cs = sc.contas.filter(function(c){ return c.bloco===b.id; }), a2 = cs.reduce(function(t2, c){ return t2+sd(c.id, baseData); }, 0), b2 = cs.reduce(function(t2, c){ return t2+sd(c.id, dEnd); }, 0); return {id:"c"+b.id, nome:cnomes(b), a:a2, b:b2, v:b2-a2, cnpj:true, bloco:b.id, ci:i, n:cs.length, bloq:b.id==="BLOQ"}; });
  var tA = linhasCnpj.filter(function(l){ return !l.bloq; }).reduce(function(t2, l){ return t2+l.a; }, 0), tB = linhasCnpj.filter(function(l){ return !l.bloq; }).reduce(function(t2, l){ return t2+l.b; }, 0);
  linhasCnpj.push({id:"ctot", nome:"TOTAL (sem bloqueadas)", a:tA, b:tB, v:tB-tA, cnpj:true, total:true});
  var colsCnpj = colsAB("CNPJ", "15rem").concat([{k:"h", t:"Hoje · confirmar", w:"9rem", render:function(v, l){ if(!l.bloco || cols.indexOf(hoje)<0) return ""; var fe = !!(fm[hoje] && fm[hoje][l.bloco]); return e("button",{type:"button", title:fe ? "CNPJ fechado hoje (clique para reabrir e editar)" : "Fechar este CNPJ hoje: confirma os saldos de hoje", onClick:function(){ fechar(hoje, [l.bloco], !fe); }, className:"text-[13px] font-semibold hover:underline "+(fe ? "text-success" : "text-white")}, fe ? "Fechado" : "Aberto"); }}]);
  var blocoTotais = e("div",{className:"[&>section]:border-[3px] [&>section]:border-[#5b84d1] [&>section>div:first-child]:!bg-[#3b66b3]"}, e(BlocoPainel,{titulo:"Resumo dos saldos"+(nomeFiltro ? " · "+nomeFiltro : ""), compacto:true}, e(TabelaPlanilha,{semContagem:true, semFiltro:true, grade:true, chave:"id", linhas:linhasTot, cols:colsAB("Conta", "19rem"), linhaCls:linhaCls})));
  var blocoCnpj = e(BlocoPainel,{titulo:"Saldo por CNPJ", compacto:true}, e(TabelaPlanilha,{semContagem:true, semFiltro:true, grade:true, chave:"id", linhas:linhasCnpj, cols:colsCnpj, linhaCls:linhaCls}));
  var pColsS = [{k:"cn", t:"CNPJ", w:"4.5rem", fixa:"0", bordaFora:"esq", render:function(v){ return e("span",null, v); }}, {k:"nome", t:"Conta", w:"13rem", fixa:"4.5rem", bordaGrossa:true, render:function(v){ return e("span",{title:v}, v); }}].concat(pCols.slice(1));
  var planilhaSaldos = e(BlocoPainel,{titulo:"Contas · saldo do fim de cada dia", acao:acoesBarra, compacto:true}, e("div",{className:"bg-[var(--bloco-titulo)] p-1.5 [&_table_td]:!h-[20px] [&_table_th]:!font-medium"}, e(TabelaPlanilha,{semContagem:true, semFiltro:true, grade:true, chave:"id", vazio:"Nenhuma conta.", alturaMax:"calc(100vh - 8rem)", linhas:linhas.filter(function(l){ return l.tipo==="conta"; }), cols:ajusta(pColsS), linhaCls:linhaCls})));
  var blocosAba = Object.keys(meta).sort().filter(function(key){ return aba!=="saldos" && abaDe(key)===aba; }).map(function(key, ix){ var m = meta[key], rows = linhas.filter(function(l){ return l.g===key; }), fechado = !!gFech[key];
    var tit = m.contas ? (NOME_BARRA[m.bloco] || m.nome)+" · "+m.n+(m.n===1 ? " conta" : " contas")+(m.bloq ? " · fora do total" : "") : m.nome;
    return e(BlocoPainel,{key:key, titulo:tit, acao:ix===0 ? acoesBarra : undefined, compacto:true, aoTitulo:function(){ var o = Object.assign({}, gFech); o[key] = !gFech[key]; setGFech(o); }, fechado:fechado}, !fechado && e("div",{className:"bg-[var(--bloco-titulo)] p-1.5 [&_table_td]:!h-[20px] [&_table_th]:!font-medium"}, e(TabelaPlanilha,{semContagem:true, semFiltro:true, grade:true, chave:"id", vazio:"Nada aqui", linhas:rows, cols:ajusta(pCols)}))); });
  // as planilhas rolam para o lado juntas (ficam alinhadas)
  var sincroniza = function(ev){ var el = ev.target; if(!el || !el.classList || !el.classList.contains("overflow-x-auto") || !raiz.current) return; [].slice.call(raiz.current.querySelectorAll(".overflow-x-auto")).forEach(function(o){ if(o!==el && o.scrollLeft!==el.scrollLeft) o.scrollLeft = el.scrollLeft; }); };
  return e("div",{ref:raiz, onScrollCapture:aba==="saldos" ? undefined : sincroniza, className:PADRAO_BLOCOS+" [&_button]:cursor-pointer [&_select]:cursor-pointer -mx-2 -mb-2 -mt-5 flex flex-col gap-1.5 pl-3 md:-mx-3 md:-mb-3 md:pl-4"},
    e("div",{className:"grid grid-cols-1 items-start gap-1.5 xl:grid-cols-2"}, e("div",{className:"flex flex-col gap-1.5"}, blocoTotais, blocoResumo), blocoCnpj),
    popPeriodo,
    ler && e(ComoLer,{fontes:fontes, ontem:ontemIso, fl:fl, dA:baseData, dB:dEnd}),
    cfg && e(BlocoPainel,{titulo:"Contas", compacto:true}, e("div",{className:"p-3"}, e(ConfigContas,{}))),
    aba==="saldos" && planilhaSaldos,
    blocosAba,
    dias.length===0 && e("p",{className:"text-center text-[13px] text-white"}, "Nenhum dia lançado neste mês ainda."));
}

export { AbaCaixa };
