// Sorelly Admin · montagem — pages/pf/Limite.js
// Limite mensal de fornecedores (Resumo do mês). Layout C do Marcus (21/10/2026): tabela por tipo (limite, lançado, pendente, folga, %, Pix, boleto/cheque, quem pesa),
// com as REGRAS ao lado (semáforo, mês de cada pagamento, fora do teto, como fechar negociação), os meses com folga para jogar Pix/parcelas e o calendário de vencimentos com os dias a evitar.
// As contas ficam em domain/pf-limite.js; aprovar e ajustar só quem tem a autorização `pf_limite_aprova` (padrão: Marcus).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { hojeIso, mesLabel, mesMais } from "@/apps/montagem/domain/pf";
import { CATS, CLASSES, classeForn, diasEvitarDoMes, limiteDe, mesTxt, quintoDiaUtil, semaforo, usoMes, vencimentosDoMes } from "@/apps/montagem/domain/pf-limite";
import { th, TD, brl, op, usePf } from "@/apps/montagem/pages/pf/ui";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var pct = function(a, b){ return b>0 ? a/b*100 : 0; };
var mil = function(v){ return v>=1000 ? Math.round(v/1000)+"k" : String(Math.round(v)); };
var mini = function(rot, fn, cor, dis){ return e("button",{type:"button", disabled:dis, onClick:fn, className:"h-8 whitespace-nowrap rounded-lg px-3 text-[12.5px] font-bold text-white ring-1 ring-white/25 hover:brightness-125 disabled:opacity-40", style:{background:cor||"#3B82F6"}}, rot); };
var CARTAO = "rounded-lg bg-black/25 p-3 ring-1 ring-white/10";
var SEM = [[0, "Até 80%", "Tranquilo", "Pode fechar"], [81, "80 a 90%", "Atenção", "Fechar com cuidado"], [91, "90 a 100%", "Só com aprovação", "Precisa do OK"], [101, "Acima de 100%", "Não fecha nada novo", "Joga para outro mês"]];
var CORES_CAT = {banho:"#A78BFA", bruto:"#2DD4BF", serv:"#FBBF24", fora:"#94A3B8"};

// barra com a cor do semáforo; a parte pendente aparece listrada
function BarraPct(p){
  var s = semaforo(p.pct), w = Math.min(100, p.pct), wp = Math.min(100-w, p.pctPend||0);
  return e("div",{className:"flex min-w-[8rem] items-center gap-2"}, e("div",{className:"flex h-2.5 flex-1 overflow-hidden rounded-full bg-white/15"}, e("div",{style:{width:w+"%", background:s.cor}}), wp>0 && e("div",{style:{width:wp+"%", background:"repeating-linear-gradient(45deg,"+s.cor+"88,"+s.cor+"88 4px,transparent 4px,transparent 8px)"}})),
    e("span",{className:"min-w-[3.2rem] text-right font-mono text-[14px] font-bold", style:{color:s.cor}}, Math.round(p.pct)+"%"));
}

var DIAS_SEM = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
var FILTROS = [["tudo", "Tudo"], ["pix", "Só Pix"], ["outros", "Boleto, cheque e cartão"]];
var dataBr = function(iso){ return iso.slice(8, 10)+"/"+iso.slice(5, 7); };

// calendário do mês: o que vence em cada dia (por tipo), total da semana, dias de conta fixa, melhores dias para boleto e cheque, e o detalhe do dia escolhido
function CalendarioVenc(p){
  var pf = p.pf, hoje = hojeIso(), sm = useState(p.mes), mes = sm[0], setMes = sm[1], sf = useState("tudo"), filtro = sf[0], setFiltro = sf[1], ss = useState(""), selX = ss[0], setSel = ss[1];
  var todos = vencimentosDoMes(pf, mes), evitar = diasEvitarDoMes(mes), q5 = quintoDiaUtil(mes), a = mes.split("-").map(Number), primeiro = new Date(a[0], a[1]-1, 1).getDay(), nDias = new Date(a[0], a[1], 0).getDate();
  var itens = todos.filter(function(x){ return filtro==="tudo" || (filtro==="pix" ? x.pix : !x.pix); });
  var iso = function(d){ return mes+"-"+String(d).padStart(2, "0"); };
  var doDia = function(d){ return itens.filter(function(x){ return x.dia===d; }); };
  var soma = function(l){ return l.reduce(function(t, x){ return t+x.valor; }, 0); };
  var total = soma(itens.filter(function(x){ return !x.pend; })), totPend = soma(itens.filter(function(x){ return x.pend; }));
  // dia escolhido: o clicado, senão hoje (se for deste mês), senão o primeiro dia com vencimento
  var padrao = (hoje.slice(0, 7)===mes ? parseInt(hoje.slice(8, 10), 10) : (itens[0] ? itens[0].dia : 1)), sel = selX && selX.slice(0, 7)===mes ? parseInt(selX.slice(8, 10), 10) : padrao;
  // melhores dias para boleto e cheque: dias que ainda vêm, fora dos dias de conta fixa, com menos boleto e cheque já marcado
  var cargaOutros = function(d){ return soma(todos.filter(function(x){ return x.dia===d && !x.pix && !x.pend && !x.fora; })); };
  var livres = []; for(var d = 1; d<=nDias; d++){ var ds = new Date(a[0], a[1]-1, d).getDay(); if(iso(d)>=hoje && evitar.indexOf(d)<0 && ds>0 && ds<6) livres.push({d:d, v:cargaOutros(d)}); }
  livres.sort(function(x, y){ return x.v-y.v || x.d-y.d; }); livres = livres.slice(0, 5).sort(function(x, y){ return x.d-y.d; });
  var cel = [], semanas = [], linha = [], somaSem = 0;
  var fechaSemana = function(){ semanas.push(e("div",{key:"s"+semanas.length, className:"grid grid-cols-7 gap-1"}, linha)); cel.push(e("div",{key:"t"+semanas.length, className:"flex flex-col items-center justify-center rounded-md bg-white/5 px-1 text-center"}, e("span",{className:"text-[10.5px] uppercase text-white/60"}, "semana"), e("b",{className:"font-mono text-[13px]"}, somaSem>0 ? mil(somaSem) : "—"))); linha = []; somaSem = 0; };
  for(var i = 0; i<primeiro; i++) linha.push(e("div",{key:"v"+i}));
  for(var dd = 1; dd<=nDias; dd++){ (function(dd){
    var l = doDia(dd), v = soma(l.filter(function(x){ return !x.pend; })), vp = soma(l.filter(function(x){ return x.pend; })), ev = evitar.indexOf(dd)>=0, outros = soma(l.filter(function(x){ return !x.pix && !x.pend && !x.fora; })), ehHoje = iso(dd)===hoje, passou = iso(dd)<hoje, on = sel===dd;
    var porCat = {}; l.filter(function(x){ return !x.pend; }).forEach(function(x){ porCat[x.cl] = (porCat[x.cl]||0)+x.valor; }); somaSem += v;
    var tudoPago = l.length>0 && l.every(function(x){ return x.pago; });
    linha.push(e("button",{key:dd, type:"button", onClick:function(){ setSel(iso(dd)); }, title:(ev ? "Dia de conta fixa: evitar boleto e cheque. " : "")+(l.length ? l.length+" vencimento(s)" : "Nada vence"),
      className:"flex min-h-[4.6rem] flex-col gap-0.5 rounded-md px-1.5 py-1 text-left transition hover:brightness-125", style:{background:ev ? "#EF444430" : "#ffffff0d", opacity:passou && !on ? 0.65 : 1, boxShadow:on ? "inset 0 0 0 2px #3B82F6" : (ehHoje ? "inset 0 0 0 2px #fff" : (ev && outros>0 ? "inset 0 0 0 1.5px #EF4444" : "none"))}},
      e("span",{className:"flex items-center justify-between"}, e("b",{className:"text-[13px]"}, dd), e("span",{className:"font-mono text-[12.5px] font-bold", style:{color:v>0 ? "#fff" : "#ffffff44"}}, v>0 ? mil(v) : "·")),
      e("span",{className:"flex flex-wrap gap-x-1.5 text-[11px] font-mono"}, Object.keys(porCat).map(function(k){ return e("span",{key:k, style:{color:CORES_CAT[k]}}, "●"+mil(porCat[k])); })),
      vp>0 && e("span",{className:"text-[10.5px] font-bold text-[#fbbf24]"}, "pend. "+mil(vp)),
      ev && e("span",{className:"text-[10.5px] font-bold", style:{color:outros>0 ? "#fca5a5" : "#ffffff77"}}, outros>0 ? "evitar!" : "evitar"),
      tudoPago && e("span",{className:"text-[10.5px] font-bold text-[#4ade80]"}, "pago"))); somaSem = somaSem; })(dd);
    if((primeiro+dd)%7===0) fechaSemana(); }
  if(linha.length) fechaSemana();
  var grade = []; semanas.forEach(function(sm2, k){ grade.push(e("div",{key:"w"+k, className:"grid grid-cols-[minmax(0,1fr)_4.2rem] gap-1"}, sm2, cel[k])); });
  var diaSel = doDia(sel), dtSel = new Date(a[0], a[1]-1, sel), evSel = evitar.indexOf(sel)>=0;
  var navBtn = function(rot, n){ return e("button",{type:"button", "aria-label":n<0 ? "Mês anterior" : "Próximo mês", onClick:function(){ setMes(mesMais(mes, n)); setSel(""); }, className:"h-8 w-9 rounded-lg bg-white/10 text-[16px] font-bold hover:bg-white/20"}, rot); };
  var detalhe = e("div",{className:CARTAO+" flex flex-col gap-2"},
    e("div",{className:"flex items-baseline justify-between gap-2"}, e("b",{className:"text-[15px] capitalize"}, DIAS_SEM[dtSel.getDay()]+", "+dataBr(iso(sel))), e("b",{className:"font-mono text-[15px]"}, brl(soma(diaSel.filter(function(x){ return !x.pend; }))))),
    evSel && e("p",{className:"rounded-md px-2 py-1 text-[12.5px]", style:{background:"#EF444430"}}, "Dia de conta fixa: evite boleto e cheque."+(sel===20 ? " O dia 20 é o pior." : "")),
    diaSel.length ? e("div",{className:"flex flex-col"}, diaSel.map(function(x, i){ return e("div",{key:i, className:"flex items-center justify-between gap-2 border-t border-white/10 py-1.5 text-[13px]"},
      e("div",{className:"min-w-0"}, e("span",{className:"mr-1.5", style:{color:CORES_CAT[x.cl]}}, "●"), e("b",null, x.nome), e("div",{className:"ml-4 text-[11.5px] text-white/65"}, x.formaTxt+(x.numero ? " · "+x.numero : "")+(x.fora ? " · fora do teto" : ""))),
      e("div",{className:"text-right"}, e("div",{className:"font-mono font-bold"}, brl(x.valor)), e("div",{className:"text-[11px] font-bold", style:{color:x.pend ? "#fbbf24" : (x.pago ? "#4ade80" : "#ffffff99")}}, x.pend ? "pendente de aprovação" : (x.pago ? "pago" : "a pagar")))); })) : e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Nada vence neste dia."));
  var topo = e("div",{className:"flex flex-wrap items-center gap-2"}, navBtn("‹", -1), e("b",{className:"min-w-[10rem] text-center text-[16px]"}, mesLabel(mes+"-01")), navBtn("›", 1), e("span",{className:"flex-1"}),
    FILTROS.map(function(x){ var on = filtro===x[0]; return e("button",{key:x[0], type:"button", onClick:function(){ setFiltro(x[0]); }, className:"h-8 rounded-lg px-3 text-[12.5px] font-bold text-white ring-1 "+(on ? "ring-white/60" : "ring-white/15"), style:{background:on ? "#2563EB" : "#ffffff14"}}, x[1]); }));
  var legenda = e("div",{className:"flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/80"}, CATS.map(function(k){ return e("span",{key:k[0]}, e("span",{style:{color:CORES_CAT[k[0]]}}, "● "), k[1]); }), e("span",null, e("span",{style:{color:CORES_CAT.fora}}, "● "), "Fora do teto"), e("span",null, e("span",{className:"mr-1 inline-block size-2.5 rounded-sm align-middle", style:{background:"#EF444466"}}), "Dia de conta fixa"), e("span",null, "Contorno branco: hoje"));
  return e(BlocoBarra,{cor:"azul", compacto:true, t:"Calendário de vencimentos · "+mesLabel(mes+"-01"), dir:brl(total)+(totPend>0 ? " + "+brl(totPend)+" pendente" : "")}, e("div",{className:"flex flex-col gap-3 p-3"}, topo, legenda,
    e("div",{className:"grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]"},
      e("div",{className:"flex flex-col gap-1"}, e("div",{className:"grid grid-cols-[minmax(0,1fr)_4.2rem] gap-1"}, e("div",{className:"grid grid-cols-7 gap-1 text-center text-[11.5px] font-bold uppercase text-white/65"}, ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map(function(x){ return e("div",{key:x}, x); })), e("div",null)), grade),
      e("div",{className:"flex flex-col gap-3"}, detalhe,
        e("div",{className:CARTAO}, e("b",{className:"text-[14px]"}, "Melhores dias para boleto e cheque"), e("p",{className:"mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-white/85"}, livres.length ? livres.map(function(x, i){ return e("span",{key:x.d, className:"mr-3 whitespace-nowrap"}, e("b",null, "dia "+x.d), " ", e("span",{className:"font-mono text-white/65"}, x.v>0 ? mil(x.v) : "livre")); }) : "Nenhum dia livre neste mês."), e("p",{className:"mt-1 text-[11.5px] text-white/60"}, "Dias úteis fora da conta fixa, com menos boleto e cheque já marcados."+(q5 ? " O 5º dia útil é o dia "+q5+"." : "")))))));
}

function LimiteMes(p){
  var c = usePf(), pf = p.pf, mes = p.mes, L = limiteDe(pf), u = usoMes(pf, mes), pode = temAutorizacao("pf_limite_aprova", c.s.usuario);
  var sa = useState(false), ajusta = sa[0], setAjusta = sa[1], sc = useState(false), classes = sc[0], setClasses = sc[1];
  var porc = pct(u.total, L.teto), s = semaforo(porc), evitar = diasEvitarDoMes(mes), q5 = quintoDiaUtil(mes), hoje = hojeIso();
  var forns = pf.fornecedores.slice().sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var salvaCat = function(k, v){ var n = Number(String(v).replace(/\./g, "").replace(",", ".")); if(n>0) op(c, "limite_set", {patch:k==="teto" ? {teto:n} : {cat:{[k]:n}}}); };
  var campoLim = function(rot, k, val){ return e("label",{key:k, className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, rot), e("input",{key:k+val, defaultValue:String(val).replace(".", ","), className:INPUT+" h-8! w-32 text-right", onBlur:function(ev){ if(ev.target.value!==String(val)) salvaCat(k, ev.target.value); }})); };
  var fornList = Object.keys(u.forn).map(function(k){ return u.forn[k]; });
  var quem = function(cl){ return fornList.filter(function(x){ return x.cl===cl; }).sort(function(a, b){ return b.total-a.total; }).slice(0, 3); };
  // linhas da tabela: total, três tipos e (se houver) o que fica fora do teto
  var linhas = [{k:"total", rot:"Total do mês", lim:L.teto, uso:u.total, pend:u.pend.total, pix:u.pix, out:u.outros, cor:s.cor, forte:true}].concat(CATS.map(function(k){
    var cat = k[0], q = quem(cat), pixC = 0, outC = 0; return {k:cat, rot:k[1], lim:L.cat[cat], uso:u.cat[cat], pend:u.pend.cat[cat], cor:CORES_CAT[cat], quem:q}; }));
  var tdN = TD+" text-right font-mono whitespace-nowrap";
  var tabela = e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full min-w-[56rem] border-collapse"},
    e("thead",null, e("tr",null, th("Tipo"), th("Limite", "text-right"), th("Lançado", "text-right"), th("Pendente", "text-right"), th("Folga", "text-right"), th("% do limite"), th("Quem pesa"))),
    e("tbody",null, linhas.map(function(x){ var pc = pct(x.uso, x.lim), sm = semaforo(pc), folga = x.lim-x.uso;
      return e("tr",{key:x.k, className:"border-b border-border/50 "+(x.forte ? "bg-white/5" : "")},
        e("td",{className:TD+" whitespace-nowrap"}, e("span",{className:"mr-2 inline-block size-2.5 rounded-full align-middle", style:{background:x.k==="total" ? sm.cor : x.cor}}), e("b",{className:x.forte ? "text-[15px]" : ""}, x.rot)),
        e("td",{className:tdN}, brl(x.lim)), e("td",{className:tdN+" font-bold"}, brl(x.uso)), e("td",{className:tdN, style:{color:x.pend>0 ? "#fbbf24" : undefined}}, x.pend>0 ? brl(x.pend) : "—"),
        e("td",{className:tdN+" font-bold", style:{color:folga<0 ? "#EF4444" : "#22C55E"}}, (folga<0 ? "passou " : "")+brl(Math.abs(folga))),
        e("td",{className:TD}, e(BarraPct,{pct:pc, pctPend:pct(x.pend, x.lim)}), e("div",{className:"text-[11.5px] font-bold", style:{color:sm.cor}}, sm.rot)),
        e("td",{className:TD+" text-[12.5px]"}, x.k==="total" ? e("span",{className:"text-white/85"}, "Pix ", e("b",{className:"font-mono"}, mil(x.pix)), " · Boleto, cheque, cartão ", e("b",{className:"font-mono"}, mil(x.out)), u.fora>0 && [" · Fora do teto ", e("b",{key:"f", className:"font-mono"}, mil(u.fora))]) : (x.quem.length ? x.quem.map(function(q, i){ return e("span",{key:i, className:"mr-3 whitespace-nowrap"}, q.nome+" ", e("b",{className:"font-mono"}, mil(q.total))); }) : e("span",{className:"text-white/50"}, "—")))); }))));
  // regras ao lado
  var regras = e("div",{className:CARTAO+" flex flex-col gap-3 text-[13px]"},
    e("div",null, e("b",{className:"text-[14px]"}, "Semáforo do mês"), e("div",{className:"mt-1.5 grid grid-cols-1 gap-1"}, SEM.map(function(x){ var sm = semaforo(x[0]), on = sm.n===s.n;
      return e("div",{key:x[2], className:"flex items-center justify-between gap-2 rounded-md px-2 py-1", style:{background:on ? sm.cor+"33" : "transparent", boxShadow:on ? "inset 0 0 0 1.5px "+sm.cor : "none"}}, e("span",null, e("span",{className:"mr-2 inline-block size-2.5 rounded-full align-middle", style:{background:sm.cor}}), e("b",null, x[1])), e("span",{className:"text-right text-white/85"}, x[2])); }))),
    e("div",null, e("b",{className:"text-[14px]"}, "Em que mês cada pagamento entra"), e("ul",{className:"mt-1 list-disc pl-5 text-white/85"}, e("li",null, "Boleto, cheque e cartão: mês do vencimento"), e("li",null, "Pix: mês da negociação (mês de referência)"), e("li",null, "O teto soma tudo: Pix, boleto, cheque e cartão de todos os fornecedores"))),
    e("div",null, e("b",{className:"text-[14px]"}, "Fora do teto"), e("p",{className:"mt-1 text-white/85"}, "Sócios, Casa e Mídia (Facebook e Google) são controlados à parte.")),
    e("div",null, e("b",{className:"text-[14px]"}, "Cada tipo tem o seu teto"), e("p",{className:"mt-1 text-white/85"}, "Se um tipo estourar, não pega a sobra do outro sem aprovação.")),
    e("div",null, e("b",{className:"text-[14px]"}, "Para fechar uma negociação nova"), e("ol",{className:"mt-1 list-decimal pl-5 text-white/85"}, e("li",null, "Ver a folga do mês e a folga do tipo"), e("li",null, "Não coube: jogar o Pix ou as parcelas para um mês com folga"), e("li",null, "Só fica lançado depois de aprovado; até lá, pendente"), e("li",null, "Nada é pago sem confirmação"))));
  // meses com folga (para jogar Pix e parcelas)
  var prox = [1, 2, 3, 4].map(function(n){ return mesMais(mes, n); });
  var folgas = e("div",{className:CARTAO}, e("b",{className:"text-[14px]"}, "Meses com folga"), e("span",{className:"ml-2 text-[12px] text-white/65"}, "para jogar Pix e parcelas"),
    e("table",{className:"mt-1 w-full border-collapse text-[13px]"}, e("thead",null, e("tr",null, th("Mês"), th("Lançado", "text-right"), th("Folga", "text-right"), th("Banho", "text-right"), th("Bruto", "text-right"), th("Serv.", "text-right"))),
      e("tbody",null, prox.map(function(m){ var x = usoMes(pf, m), fg = L.teto-x.total, sm = semaforo(pct(x.total, L.teto));
        return e("tr",{key:m, className:"border-b border-border/50"}, e("td",{className:"px-2 py-1.5"}, e("span",{className:"mr-2 inline-block size-2.5 rounded-full align-middle", style:{background:sm.cor}}), e("b",null, mesLabel(m+"-01"))),
          e("td",{className:"whitespace-nowrap px-2 py-1.5 text-right font-mono"}, brl(x.total)), e("td",{className:"whitespace-nowrap px-2 py-1.5 text-right font-mono font-bold", style:{color:fg<0 ? "#EF4444" : "#22C55E"}}, fg<0 ? "passou "+brl(-fg) : brl(fg)),
          CATS.map(function(k){ var g = L.cat[k[0]]-x.cat[k[0]]; return e("td",{key:k[0], className:"px-2 py-1.5 text-right font-mono text-[12.5px]", style:{color:g<0 ? "#EF4444" : undefined}}, g<0 ? "−"+mil(-g) : mil(g)); })); }))));
  var pendentes = u.pendentes.length>0 && e("div",{className:"flex flex-col gap-2 rounded-lg px-3 py-2", style:{background:"#F59E0B22", boxShadow:"inset 0 0 0 2px #F59E0B"}},
    e("b",{className:"text-[14px]"}, "Pendentes de aprovação · "+brl(u.pend.total)+" neste mês"),
    u.pendentes.map(function(x){ return e("div",{key:x.pd.id, className:"flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[13px]"},
      e("div",{className:"min-w-0"}, e("b",null, x.f ? x.f.nome : "—"), " · "+(x.pd.numero||"pedido")+" · "+brl(x.valor)+" em "+mesTxt(mes), e("div",{className:"text-[12px] text-white/70"}, x.pd.aprovMotivo||"")),
      e("div",{className:"flex gap-2"}, mini("Aprovar", function(){ op(c, "pedido_aprovar", {id:x.pd.id}); }, "#16A34A", !pode), mini("Excluir", function(){ if(window.confirm("Excluir o pedido pendente de "+(x.f ? x.f.nome : "")+"?")) op(c, "pedido_del", {id:x.pd.id}); }, "#DC2626", !c.edita))); }),
    !pode && e("p",{className:"text-[12px] text-white/70"}, "Só quem tem a autorização de aprovar o limite aprova (padrão: Marcus)."));
  var classif = classes && e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, th("Fornecedor"), th("Conta no teto como"))), e("tbody",null, forns.map(function(f){ var cl = classeForn(pf, f);
    return e("tr",{key:f.id, className:"border-b border-border/50"}, e("td",{className:TD}, e("b",null, f.nome)), e("td",{className:TD}, e("select",{key:f.id+cl, defaultValue:cl, disabled:!pode, className:INPUT+" h-8! w-52 cursor-pointer text-[13px]!", onChange:function(ev){ op(c, "limite_set", {patch:{classe:{[f.id]:ev.target.value}}}); }}, CLASSES.map(function(k){ return e("option",{key:k[0], value:k[0]}, k[1]); })))); }))));
  return e("div",{className:"flex flex-col gap-3"}, e(BlocoBarra,{cor:"azul", compacto:true, t:"Limite de fornecedores · "+mesLabel(mes+"-01"), dir:Math.round(porc)+"% · "+s.rot}, e("div",{className:"flex flex-col gap-3 p-3"},
    tabela,
    e("div",{className:"grid grid-cols-1 gap-3 lg:grid-cols-2"}, regras, e("div",{className:"flex flex-col gap-3"}, folgas)),
    pendentes,
    e("div",{className:"flex flex-wrap items-center gap-2"}, mini(classes ? "Fechar classificação" : "Classificação dos fornecedores", function(){ setClasses(!classes); }, "#ffffff22"), pode && mini(ajusta ? "Concluir ajuste" : "Ajustar tetos", function(){ setAjusta(!ajusta); }, "#ffffff22"),
      ajusta && [campoLim("Teto do mês", "teto", L.teto)].concat(CATS.map(function(k){ return campoLim(k[1], k[0], L.cat[k[0]]); }))), classif)), e(CalendarioVenc,{key:mes, pf:pf, mes:mes}));
}

// visão do ano: uma linha por mês com o teto, o semáforo e os três tipos
function LimiteAno(p){
  var pf = p.pf, L = limiteDe(pf);
  return e(BlocoBarra,{cor:"azul", compacto:true, t:"Limite de fornecedores · mês a mês", dir:"teto "+brl(L.teto)}, e("div",{className:"overflow-x-auto p-3"}, e("table",{className:"w-full min-w-[44rem] border-collapse"},
    e("thead",null, e("tr",null, th("Mês"), th("Lançado", "text-right"), th("% do teto", "text-right"), th("Banho", "text-right"), th("Bruto", "text-right"), th("Serviços", "text-right"), th("Pendente", "text-right"))),
    e("tbody",null, p.meses.map(function(m){ var u = usoMes(pf, m), pc = pct(u.total, L.teto), s = semaforo(pc);
      return e("tr",{key:m, className:"border-b border-border/50"}, e("td",{className:TD}, e("b",null, mesLabel(m+"-01"))), e("td",{className:TD+" text-right font-mono"}, brl(u.total)), e("td",{className:TD+" text-right font-mono font-bold", style:{color:s.cor}, title:s.rot}, u.total>0 ? Math.round(pc)+"%" : "—"),
        CATS.map(function(k){ var v = u.cat[k[0]], pc2 = pct(v, L.cat[k[0]]); return e("td",{key:k[0], className:TD+" text-right font-mono text-[13px]", style:{color:v>0 ? semaforo(pc2).cor : undefined}}, v>0 ? brl(v) : "—"); }),
        e("td",{className:TD+" text-right font-mono text-[13px]", style:{color:u.pend.total>0 ? "#fbbf24" : undefined}}, u.pend.total>0 ? brl(u.pend.total) : "—")); })))));
}

export { LimiteMes, LimiteAno };
