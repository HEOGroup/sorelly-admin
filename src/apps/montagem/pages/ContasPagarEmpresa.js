// Sorelly Admin · montagem — pages/ContasPagarEmpresa.js
// Financeiro → Contas a pagar. Abre na SORELLY (empresa): total, os 4 CNPJs e Por fora. No topo, um seletor leva para a FAMÍLIA ou para SORELLY + FAMÍLIA.
// O DevMaster já traz as contas da família pagas pela empresa; "Sorelly + família" = Sorelly + só o que está no familiar e não no DevMaster (conciliação). Metas de Pix e salários dos sócios ficam em bloco à parte.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Abas, BarraFiltros, Faixa, Indicador, Pagina, Tab, Td, LINHA, degrade, ESTADO } from "@/apps/montagem/components/padrao";
import { FILIAIS, agrupar, conciliar, famTotais, filtrar, meses, porFilial, totais, temDados } from "@/apps/montagem/domain/contas-empresa";
import { ACESSO_FF, hojeYm, membrosFamilia, nomeMes, parcelasDe, pixDoMes, totaisPersona } from "@/apps/montagem/domain/financeiro-familiar";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { AbaFfContas, AbaFfPagas } from "@/apps/montagem/pages/FinFamiliar";
import { e, useState } from "@/shared/react";

var AZUL = "#3B82F6";
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var rotMes = function(ym){ return ym ? nomeMes(ym) : "Todos os meses"; };
var SITUACOES = [["", "Todas"], ["pago", "Pagas"], ["apagar", "A pagar"]];
var chip = function(txt, cor){ var c = ESTADO[cor] || cor; return e("span",{className:"inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold", style:{background:c+"26", color:c}}, txt); };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var somaT = function(a, b){ return {pago:r2(a.pago+b.pago), apagar:r2(a.apagar+b.apagar), total:r2(a.total+b.total), nPago:a.nPago+b.nPago, nApagar:a.nApagar+b.nApagar, n:a.n+b.n}; };
var parteFam = function(f, status){ return status==="pago" ? {pago:f.pago, apagar:0, total:f.pago, nPago:f.nPago, nApagar:0, n:f.nPago} : status==="apagar" ? {pago:0, apagar:f.apagar, total:f.apagar, nPago:0, nApagar:f.nApagar, n:f.nApagar} : f; };
var botaoCard = function(on, extra){ return "flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center transition hover:brightness-125 "+(on ? "ring-2 ring-[#3B82F6]" : "ring-1 ring-white/10")+" "+(extra||""); };

// ───────────── Tela inteira ─────────────
function Empresa(p){
  var cx = use(), ff = cx.state.ff, vejaFamilia = p.vejaFamilia;
  var ms = meses(), ini = ms.indexOf(hojeYm())>=0 ? hojeYm() : (ms[ms.length-1] || ""), sm = useState(ini), mes = sm[0], setMes = sm[1];
  var modo = p.modo || "sorelly";
  var sb = useState(""), busca = sb[0], setBusca = sb[1];
  var ss = useState(""), status = ss[0], setStatus = ss[1];
  var sa = useState({}), abertas = sa[0], setAbertas = sa[1];
  var filial = p.sel, setFilial = p.setSel, juntar = vejaFamilia && modo==="junto";
  if(!temDados()) return e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px]"}, "Sem contas da empresa neste computador.");
  var lista = filtrar(mes, filial, busca, status), fs = porFilial(mes, busca, status);
  var fam = vejaFamilia ? famTotais(ff, mes) : null, famParte = fam ? parteFam(fam, status) : null;
  var TE = totais(filtrar(mes, "", busca, status)), TT = juntar && famParte ? somaT(TE, famParte) : TE;
  var T = filial==="" && juntar && famParte ? somaT(totais(lista), famParte) : totais(lista);
  var atrasadas = lista.filter(function(i){ return i.status==="apagar" && i.atraso>0; }), pagoOutro = lista.filter(function(i){ return i.status==="pago" && i.outroMes; });
  var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
  var atrasoTotal = soma(atrasadas) + (filial==="" && juntar && fam ? fam.atrasado : 0);
  var filNome = filial ? (FILIAIS.find(function(f){ return f[0]===filial; })||[])[1] : (juntar ? "Empresa e família" : "Só empresa");
  var alterna = function(k){ var o = Object.assign({}, abertas); o[k] = !o[k]; setAbertas(o); };
  var conc = vejaFamilia ? conciliar(ff, mes) : null;
  var card = function(id, nome, desc, t, nota){
    var on = filial===id;
    return e("button",{key:id||"todas", type:"button", onClick:function(){ setFilial(id); }, title:desc, className:botaoCard(on), style:degrade(on ? AZUL : "neutro")},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/85"}, nome),
      e("b",{className:MONO+" text-[17px] leading-tight", style:{color:on ? ESTADO.info : "#fff"}}, BK(t.total)),
      e("span",{className:"text-[10.5px] leading-tight text-white/60"}, "Pago "+BK(t.pago)),
      e("span",{className:"text-[10.5px] leading-tight", style:{color:t.apagar>0 ? ESTADO.alerta : "rgba(255,255,255,.5)"}}, "Falta "+BK(t.apagar)),
      nota && e("span",{className:"text-[10px] leading-tight text-white/45"}, nota));
  };
  // layout: 1) bloco principal (Empresa, Família e juntas, separados), 2) os 4 CNPJs, 3) Por fora, Família e Conciliação
  var pixFam = fam ? r2(parcelasDe(ff, mes ? {ym:mes} : {}).filter(function(x){ return x.conta.categoria==="PIX_REVENDEDORA" || x.conta.forma==="PIX revendedoras"; }).reduce(function(t, x){ return t+x.valor; }, 0)) : 0;
  // Total = DevMaster (que já traz as contas da família pagas pela empresa) + só o que está no familiar e NÃO está no DevMaster (conciliação)
  var sf = conc ? conc.soFam : [], sfT = {pago:r2(sf.reduce(function(t, x){ return t+x.pago; }, 0)), apagar:r2(sf.reduce(function(t, x){ return t+x.restante; }, 0)), total:r2(sf.reduce(function(t, x){ return t+x.valor; }, 0)), nPago:sf.filter(function(x){ return x.pago>0; }).length, nApagar:sf.filter(function(x){ return x.restante>0.005; }).length, n:sf.length};
  var junto = conc ? somaT(TE, parteFam(sfT, status)) : TE;
  var bloco = function(rot, t, nota, k){ return e("div",{key:k, className:"flex min-w-0 flex-col items-center rounded-lg bg-black/20 px-2 py-1.5"},
    e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, rot), e("b",{className:MONO+" text-[20px] leading-tight text-white"}, BK(t.total)),
    e("span",{className:"text-[11px] leading-tight text-white/65"}, "Pago "+BK(t.pago)+" · Falta "+BK(t.apagar)), nota && e("span",{className:"mt-0.5 text-[10px] leading-tight text-white/45"}, nota)); };
  var onP = filial==="";
  var principal = e("button",{type:"button", onClick:function(){ setFilial(""); }, title:"Abrir tudo da Sorelly", className:"w-full rounded-xl px-3 py-2 text-center transition hover:brightness-125 "+(onP ? "ring-2 ring-[#3B82F6]" : "ring-1 ring-white/10"), style:degrade(onP ? AZUL : "neutro")},
    e("div",{className:"mb-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-white/85"}, "Principal · "+rotMes(mes)),
    e("div",{className:"grid grid-cols-1 gap-2 "+(juntar ? "sm:grid-cols-3" : "")}, bloco(juntar ? "Sorelly" : "Sorelly (empresa)", TE, null, "e"), juntar && bloco("Só no familiar", sfT, "não está na Sorelly ("+sf.length+" contas)", "f"), juntar && bloco("Total do mês", junto, "Sorelly + só o que está no familiar", "j")));
  var cnpjs = fs.filter(function(f){ return f.id!=="fora"; }).map(function(f){ return card(f.id, f.nome, f.desc, f); });
  var baixo = [card("fora", "Por fora", "Pessoal, Pix e fora dos CNPJs", fs.filter(function(f){ return f.id==="fora"; })[0])];
  if(juntar){
    var dif = conc.soDev.length+conc.soFam.length, on = filial==="conc";
    baixo.push(e("button",{key:"conc", type:"button", onClick:function(){ setFilial("conc"); }, title:"O que está nos dois sistemas, só no DevMaster e só no familiar", className:botaoCard(on), style:degrade(on ? AZUL : "neutro")},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/85"}, "Conciliação"),
      e("b",{className:MONO+" text-[17px] leading-tight", style:{color:dif ? ESTADO.alerta : ESTADO.ok}}, dif+" diferenças"),
      e("span",{className:"text-[10.5px] leading-tight text-white/60"}, conc.pares.length+" já batem")));
  }
  var linhaCards = e("div",{className:"flex flex-col gap-2"}, principal, e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-4"}, cnpjs), e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-"+baixo.length}, baixo));
  if(filial==="conc" && vejaFamilia) return e("div",{className:"flex flex-col gap-2.5"}, linhaCards, e(Conciliacao,{c:conc, mes:mes}));
  return e("div",{className:"flex flex-col gap-2.5"},
    linhaCards,
    e(BarraFiltros,{ativo:!!busca || !!filial || !!status, onLimpar:function(){ setBusca(""); setFilial(""); setStatus(""); }},
      e("select",{value:mes, "aria-label":"Mês", className:INPUT+" h-9! w-44 cursor-pointer", onChange:function(ev){ setMes(ev.target.value); }}, ms.map(function(m){ return e("option",{key:m, value:m}, rotMes(m)); }), ms.length>1 && e("option",{value:""}, "Todos os meses")),
      e("div",{className:"flex gap-1"}, SITUACOES.map(function(x){ var on = status===x[0]; return e("button",{key:x[0], type:"button", onClick:function(){ setStatus(x[0]); }, className:"h-9 rounded-lg px-3 text-[12.5px] font-bold ring-1 "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,"+AZUL+"66,"+AZUL+"22)", boxShadow:"inset 0 0 0 1px "+AZUL+"cc"} : undefined}, x[1]); })),
      e("input",{value:busca, placeholder:"Buscar título, natureza ou valor", "aria-label":"Buscar", className:INPUT+" h-9! w-72", onChange:function(ev){ setBusca(ev.target.value); }})),
    e(Faixa,{n:5},
      e(Indicador,{t:"Total do mês", v:BK(T.total), cor:"total", sub:filNome}),
      e(Indicador,{t:"Pago", v:BK(T.pago), cor:"ok", sub:T.nPago+" pagamentos"}),
      e(Indicador,{t:"Falta pagar", v:BK(T.apagar), cor:T.apagar>0 ? "alerta" : "neutro", sub:T.nApagar+" contas"}),
      e(Indicador,{t:"Atrasado", v:BK(atrasoTotal), cor:atrasoTotal>0 ? "ruim" : "neutro", sub:"contas vencidas"}),
      e(Indicador,{t:"Pago de outro mês", v:BK(soma(pagoOutro)), cor:pagoOutro.length ? "info" : "neutro", sub:pagoOutro.length+" com vencimento em outro mês"})),
    filial==="" && juntar && fam && e(FamiliaNoTodas,{ff:ff, mes:mes, status:status, abrir:function(){ p.setModo("familia"); }}),
    !agrupar(lista).length && e("p",{className:"rounded-xl bg-muted/30 px-4 py-5 text-center text-[14px]"}, "Nenhuma conta da empresa neste filtro."),
    agrupar(lista).map(function(g){
      return e(BlocoBarra,{key:g.grupo, cor:"azul", compacto:true, t:g.grupo, dir:BK(g.total)},
        e("div",{className:"p-2"}, e(Tab,{cols:["Natureza", "Pago", "Falta pagar", "Total"]}, g.nats.map(function(n){
          var k = mes+"|"+filial+"|"+g.grupo+"|"+n.cod, ab = !!abertas[k];
          return [e("tr",{key:k, onClick:function(){ alterna(k); }, className:LINHA+" cursor-pointer hover:bg-white/5"},
            e(Td,{forte:true}, n.nome+" ", e("span",{className:"text-[11px] font-normal text-white/50"}, n.cod+(ab ? " ▲" : " ▾"))), e(Td,{dinheiro:true, cor:n.pago>0 ? "ok" : undefined}, BK(n.pago)), e(Td,{dinheiro:true, cor:n.apagar>0 ? "alerta" : undefined}, BK(n.apagar)), e(Td,{dinheiro:true, forte:true}, BK(n.total))),
            ab && e("tr",{key:k+"d"}, e("td",{colSpan:4, className:"bg-black/25 p-2"}, e(Tab,{cols:["Situação", "Data", "Título", "Prefixo", "Valor"]}, n.itens.map(function(i){
              var pago = i.status==="pago", atr = !pago && i.atraso>0;
              return e("tr",{key:i.id, className:LINHA},
                e(Td,null, pago ? chip("Pago", "ok") : atr ? chip("Atrasada "+i.atraso+"d", "ruim") : chip("A pagar", "alerta")),
                e(Td,{cor:i.outroMes ? "alerta" : undefined}, pago ? "Pago em "+br(i.baixa)+(i.outroMes ? " · vence "+br(i.venc) : "") : "Vence "+br(i.venc)),
                e(Td,{className:"max-w-[22rem] truncate"}, i.nome), e(Td,null, i.pref),
                e(Td,{dinheiro:true}, BK(i.valor), !pago && i.valorTitulo-i.valor>0.005 && e("span",{className:"block text-[10.5px] font-normal text-white/50"}, "de "+BK(i.valorTitulo))));
            }))))];
        }))));
    }),
    vejaFamilia && mes && e(MetaSocios,{ff:ff, mes:mes}));
}

// sócios: meta de Pix revendedoras e salário (pró-labore) do mês, vindos do Financeiro familiar
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
function MetaSocios(p){
  var ff = p.ff, mes = p.mes, socios = ff.personas.filter(function(q){ return q.tipo==="SOCIO" && q.ativo && (q.mostrarProlabore || (ff.pixMeta||{})[q.id+"|"+mes]>0); });
  var pro = parcelasDe(ff, {ym:mes}).filter(function(x){ return x.conta.categoria==="PRO_LABORE"; });
  var dono = function(x){ var id = x.conta.personaId; if(socios.some(function(q){ return q.id===id; })) return id; var d = norm(x.conta.descricao+" "+(x.conta.beneficiario||"")); var q = socios.find(function(z){ return d.indexOf(norm(z.nome))>=0 || d.indexOf(norm(z.nome.split(" ")[0]))>=0; }); return q ? q.id : id; };
  var linhas = socios.map(function(q){
    var meus = pro.filter(function(x){ return dono(x)===q.id; }), meta = (ff.pixMeta||{})[q.id+"|"+mes]||0, rec = pixDoMes(ff, q.id, mes), vg = ((ff.prolabore||{})[q.id]||{vigencias:[]}).vigencias.filter(function(v){ return v.desde<=mes; }).sort(function(x, y){ return y.desde.localeCompare(x.desde); })[0];
    return {id:q.id, nome:q.nome, cor:q.cor, liquido:vg ? vg.liquido : 0, plPago:r2(meus.reduce(function(t, x){ return t+x.pago; }, 0)), plFalta:r2(meus.reduce(function(t, x){ return t+x.restante; }, 0)), meta:meta, rec:rec, falta:r2(Math.max(0, meta-rec))};
  }).filter(function(x){ return x.meta>0 || x.liquido>0 || x.plPago>0 || x.plFalta>0; });
  if(!linhas.length) return null;
  var tot = function(k){ return r2(linhas.reduce(function(t, x){ return t+x[k]; }, 0)); };
  return e(BlocoBarra,{cor:"azul", compacto:true, t:"Sócios: salário e meta de Pix revendedoras", dir:nomeMes(mes)}, e("div",{className:"p-2"}, e(Tab,{cols:["Sócio", "Pró-labore (líquido)", "Salário pago", "Salário a pagar", "Meta de Pix", "Recebido", "Falta"]},
    linhas.map(function(x){ return e("tr",{key:x.id, className:LINHA}, e(Td,{forte:true}, e("span",{className:"mr-1.5 inline-block size-2.5 rounded-full align-middle", style:{background:x.cor}}), x.nome), e(Td,{dinheiro:true}, x.liquido ? BK(x.liquido) : "—"), e(Td,{dinheiro:true, cor:"ok"}, BK(x.plPago)), e(Td,{dinheiro:true, cor:x.plFalta>0 ? "alerta" : undefined}, BK(x.plFalta)), e(Td,{dinheiro:true, forte:true}, x.meta ? BK(x.meta) : "—"), e(Td,{dinheiro:true, cor:"ok"}, BK(x.rec)), e(Td,{dinheiro:true, cor:x.falta>0 ? "alerta" : undefined}, BK(x.falta))); }),
    e("tr",{key:"t", className:LINHA+" bg-white/5"}, e(Td,{forte:true}, "Total"), e(Td,{dinheiro:true}, BK(tot("liquido"))), e(Td,{dinheiro:true, cor:"ok"}, BK(tot("plPago"))), e(Td,{dinheiro:true, cor:"alerta"}, BK(tot("plFalta"))), e(Td,{dinheiro:true, forte:true}, BK(tot("meta"))), e(Td,{dinheiro:true, cor:"ok"}, BK(tot("rec"))), e(Td,{dinheiro:true, cor:"alerta"}, BK(tot("falta")))))));
}

// bloco da família dentro de "Todas" (somado ao total)
function FamiliaNoTodas(p){
  var ps = parcelasDe(p.ff, p.mes ? {ym:p.mes} : {}).filter(function(x){ return p.status==="pago" ? x.pago>0 : p.status==="apagar" ? x.restante>0.005 : true; });
  var por = {};
  ps.forEach(function(x){ var pe = x.conta.personaId, o = por[pe] = por[pe] || {id:pe, pago:0, apagar:0, total:0}; o.pago += x.pago; o.apagar += x.restante; o.total += x.valor; });
  var linhas = Object.keys(por).map(function(id){ var pe = p.ff.personas.find(function(q){ return q.id===id; }) || {nome:id, cor:"#888"}; return Object.assign({nome:pe.nome, cor:pe.cor}, por[id]); }).sort(function(a, b){ return b.total-a.total; });
  var tot = linhas.reduce(function(t, x){ return t+x.total; }, 0);
  return e(BlocoBarra,{cor:"azul", compacto:true, t:"Família e casas (Financeiro familiar)", dir:BK(tot)}, e("div",{className:"p-2"}, e(Tab,{cols:["Pessoa ou casa", "Pago", "Falta pagar", "Total"]}, linhas.map(function(x){
    return e("tr",{key:x.id, className:LINHA+" cursor-pointer hover:bg-white/5", onClick:p.abrir}, e(Td,{forte:true}, e("span",{className:"mr-1.5 inline-block size-2.5 rounded-full align-middle", style:{background:x.cor}}), x.nome), e(Td,{dinheiro:true, cor:x.pago>0 ? "ok" : undefined}, BK(x.pago)), e(Td,{dinheiro:true, cor:x.apagar>0 ? "alerta" : undefined}, BK(x.apagar)), e(Td,{dinheiro:true, forte:true}, BK(x.total)));
  })), e("p",{className:"pb-1 text-center text-[11.5px] text-white/55"}, "Clique numa linha para abrir as contas da família. O pessoal do DevMaster não entra aqui para não contar duas vezes.")));
}

// ───────────── Família: telas completas do Financeiro familiar dentro do Contas a pagar ─────────────
function Familia(){
  var cx = use(), ff = cx.state.ff, sa = useState("pagar"), sub = sa[0], setSub = sa[1], mes = hojeYm();
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Abas,{abas:[["pagar","A pagar"],["pagas","Pagas"],["socios","Sócios: salário e Pix"],["pessoa","Resumo por pessoa"],["conc","Conciliação"]], atual:sub, onMudar:setSub, cor:AZUL}),
    sub==="pagar" ? e(AbaFfContas) : sub==="pagas" ? e(AbaFfPagas) : sub==="socios" ? e(MetaSocios,{ff:ff, mes:mes}) : sub==="conc" ? e(Conciliacao,{c:conciliar(ff, mes), mes:mes}) : e(ResumoFamilia));
}
function ResumoFamilia(){
  var cx = use(), s = cx.state, ff = s.ff, d = cx.dispatch, ym = hojeYm();
  if(!ff || !(ff.contas||[]).length) return e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px]"}, "Sem contas da família neste computador.");
  var membros = membrosFamilia(ff), ids = membros.concat(ff.personas.filter(function(p){ return p.tipo==="FAMILIAR" && membros.indexOf(p.id)<0; }).map(function(p){ return p.id; }));
  var linhas = ids.map(function(id){ var p = ff.personas.find(function(x){ return x.id===id; }); if(!p) return null; var t = totaisPersona(ff, id, ym); return {p:p, t:t}; }).filter(function(x){ return x && x.t.todasContas>0; });
  var tot = function(k){ return Math.round(linhas.reduce(function(a, x){ return a+x.t.contas[k]; }, 0)*100)/100; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(Indicador,{t:"Contas do mês", v:BK(tot("total")), cor:"total", sub:nomeMes(ym)}),
      e(Indicador,{t:"Pago", v:BK(tot("pago")), cor:"ok"}),
      e(Indicador,{t:"Falta pagar", v:BK(tot("restante")), cor:"alerta"}),
      e(Indicador,{t:"Atrasado", v:BK(tot("atrasado")), cor:tot("atrasado")>0 ? "ruim" : "neutro"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Por pessoa e casa (com a parte de cada um nas contas divididas)", dir:nomeMes(ym)}, e("div",{className:"p-2"}, e(Tab,{cols:["Pessoa", "Pago", "Falta pagar", "Total", "Pendentes"]}, linhas.map(function(x){
      return e("tr",{key:x.p.id, className:LINHA}, e(Td,{forte:true}, e("span",{className:"mr-1.5 inline-block size-2.5 rounded-full align-middle", style:{background:x.p.cor}}), x.p.nome), e(Td,{dinheiro:true, cor:"ok"}, BK(x.t.contas.pago)), e(Td,{dinheiro:true, cor:x.t.contas.restante>0 ? "alerta" : undefined}, BK(x.t.contas.restante)), e(Td,{dinheiro:true}, BK(x.t.contas.total)), e(Td,null, x.t.contas.pendentes));
    })))));
}

// ───────────── Conciliação DevMaster × Financeiro familiar ─────────────
function Conciliacao(p){
  var c = p.c, mes = p.mes;
  var nomePessoa = function(x){ return x.conta.personaId; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(Indicador,{t:"Nos dois sistemas", v:String(c.pares.length), cor:"ok", sub:BK(c.valorPares)}),
      e(Indicador,{t:"Só no DevMaster", v:String(c.soDev.length), cor:c.soDev.length ? "alerta" : "neutro", sub:BK(c.valorSoDev)+" falta no familiar"}),
      e(Indicador,{t:"Só no familiar", v:String(c.soFam.length), cor:c.soFam.length ? "alerta" : "neutro", sub:BK(c.valorSoFam)+" não está no DevMaster"}),
      e(Indicador,{t:"Mês", v:rotMes(mes).split("/")[0], cor:"info", sub:"Conciliação por valor e mês"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Pix revendedoras: DevMaster × familiar", dir:String(c.pix.length)}, e("div",{className:"p-2"}, e(Tab,{cols:["Pessoa", "DevMaster: meta", "DevMaster: pago", "Familiar: meta", "Familiar: pago", "Diferença no pago"]}, c.pix.map(function(x){
      var dif = r2(x.devPago-x.famPago);
      return e("tr",{key:x.id, className:LINHA}, e(Td,{forte:true}, x.nome), e(Td,{dinheiro:true}, BK(x.devMeta)), e(Td,{dinheiro:true}, BK(x.devPago)), e(Td,{dinheiro:true}, BK(x.famMeta)), e(Td,{dinheiro:true}, BK(x.famPago)), e(Td,{dinheiro:true, cor:Math.abs(dif)>0.005 ? "alerta" : "ok"}, BK(dif)));
    })))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Só no DevMaster (falta lançar no familiar)", dir:BK(c.valorSoDev)}, e("div",{className:"p-2"}, c.soDev.length ? e(Tab,{cols:["Natureza", "Título", "Data", "Valor", "Situação"]}, c.soDev.map(function(i){
      return e("tr",{key:i.id, className:LINHA}, e(Td,null, i.natNome), e(Td,{className:"max-w-[20rem] truncate"}, i.nome), e(Td,null, i.status==="pago" ? "Pago em "+br(i.baixa) : "Vence "+br(i.venc)), e(Td,{dinheiro:true}, BK(i.valor)), e(Td,null, i.status==="pago" ? chip("Pago", "ok") : chip("A pagar", "alerta")));
    })) : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nada neste mês."))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Só no Financeiro familiar (não está no DevMaster)", dir:BK(c.valorSoFam)}, e("div",{className:"p-2"}, c.soFam.length ? e(Tab,{cols:["Pessoa", "Conta", "Mês", "Valor", "Situação"]}, c.soFam.map(function(x){
      var pago = x.status==="PAGO";
      return e("tr",{key:x.chave, className:LINHA}, e(Td,null, nomePessoa(x)), e(Td,{className:"max-w-[20rem] truncate"}, x.conta.descricao), e(Td,null, nomeMes(x.ym)), e(Td,{dinheiro:true}, BK(x.valor)), e(Td,null, pago ? chip("Pago", "ok") : x.atrasada ? chip("Atrasada", "ruim") : chip(x.status==="PARCIAL" ? "Parcial" : "A pagar", "alerta")));
    })) : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nada neste mês."))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Nos dois sistemas (já conciliado)", dir:BK(c.valorPares)}, e("div",{className:"p-2"}, c.pares.length ? e(Tab,{cols:["Conta no familiar", "Título no DevMaster", "Mês", "Valor"]}, c.pares.map(function(x, k){
      return e("tr",{key:k, className:LINHA}, e(Td,{className:"max-w-[18rem] truncate"}, x.fam.conta.descricao), e(Td,{className:"max-w-[18rem] truncate"}, x.dev.nome), e(Td,null, nomeMes(x.fam.ym)), e(Td,{dinheiro:true}, BK(x.dev.valor)));
    })) : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nada neste mês."))));
}

function AbaCtaPagar(){
  var cx = use(), s = cx.state, vejaFamilia = ACESSO_FF.indexOf(s.usuario)>=0;
  var inicial = "sorelly"; try{ var g = sessionStorage.getItem("cta_sel"); if(g==="familia") inicial = "familia"; sessionStorage.removeItem("cta_sel"); }catch(x){}
  var sm = useState(inicial), modo0 = sm[0], setModo = sm[1], sc = useState(""), sel = sc[0], setSel = sc[1];
  var modo = vejaFamilia ? modo0 : "sorelly";
  return e(Pagina,null,
    e(PageHead,{t:"Contas a pagar", sub:"Sorelly primeiro; a família num clique"}),
    vejaFamilia && e(Abas,{abas:[["sorelly","Sorelly"],["familia","Família"],["junto","Sorelly + família"]], atual:modo, onMudar:function(m){ setModo(m); setSel(""); }, cor:AZUL}),
    modo==="familia" ? e(Familia) : e(Empresa,{modo:modo, setModo:setModo, sel:sel, setSel:setSel, vejaFamilia:vejaFamilia}));
}

export { AbaCtaPagar };
