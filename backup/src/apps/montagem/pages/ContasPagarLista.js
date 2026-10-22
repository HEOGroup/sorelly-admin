// Sorelly Admin · montagem — pages/ContasPagarLista.js
// Financeiro → Contas a pagar. SEGUNDA tela no padrão do Financeiro (regra fixa do Marcus, 22/10/2026; copia pages/Faturamento.js): título + botão de ação · bloco Filtros no topo
// (grade de 4 colunas, 32 px) · faixa de totais · abas visíveis (Quando vence | A pagar | Pagas | Todas) · tabela de layout fixo, R$ em todo valor, números à direita, texto que corta com "…".
// Só a Sorelly: a família fica em Análise de custos e no Financeiro familiar (menu). Dados do DevMaster (domain/contas-empresa.js); aqui só a leitura em lista e os filtros.
import { AbasTela, BlocoFiltros, Botao, COR, CampoBusca, CampoSel, FaixaTotais, TabelaP, Td, Tr, brl } from "@/apps/montagem/components/padrao-fin";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { FILIAIS, filtrar, meses, setBaixas, setClasse, setLancamentos, setPf, temDados } from "@/apps/montagem/domain/contas-empresa";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { RegistrarPagamento } from "@/apps/montagem/components/registrar-pagamento";
import { hojeIso, hojeYm, nomeMes } from "@/apps/montagem/domain/financeiro-familiar";
import { BKC } from "@/apps/montagem/lib/format";
import { NovaConta } from "@/apps/montagem/pages/ContasPagarEmpresa";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
var ABAS = [["quando","Quando vence"],["apagar","A pagar"],["pago","Pagas"],["todas","Todas"]];
var PERIODOS = [["", "Todo o mês"], ["atraso", "Atrasadas"], ["hoje", "Hoje"], ["amanha", "Amanhã"], ["semana", "Esta semana"], ["prox", "Próxima semana"]];
var ORDENS = [["venc","Vencimento"], ["valor","Maior valor"], ["forn","Fornecedor"], ["nat","Natureza"]];
var NOTAS = [["", "Todas"], ["com", "Com nota"], ["sem", "Sem nota"]];

// datas em texto ISO (aaaa-mm-dd); semana = segunda a domingo
var somaDias = function(iso, n){ var d = new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };
var segunda = function(iso){ var d = new Date(iso+"T12:00:00"), w = (d.getDay()+6)%7; return somaDias(iso, -w); };
var dataDe = function(i){ return i.status==="pago" ? (i.baixa||i.venc) : i.venc; };
var dm = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7) : "—"; };
function noPeriodo(i, per, hoje){
  if(!per) return true; var d = dataDe(i), ini = segunda(hoje), fim = somaDias(ini, 6), ini2 = somaDias(ini, 7), fim2 = somaDias(ini, 13);
  if(per==="atraso") return i.status==="apagar" && i.venc<hoje;
  if(per==="hoje") return d===hoje; if(per==="amanha") return d===somaDias(hoje, 1);
  if(per==="semana") return d>=ini && d<=fim; if(per==="prox") return d>=ini2 && d<=fim2;
  return true;
}
var CMP = { venc:function(a, b){ return (a.venc||"").localeCompare(b.venc||"") || a.nome.localeCompare(b.nome); }, valor:function(a, b){ return b.valor-a.valor; }, forn:function(a, b){ return a.nome.localeCompare(b.nome); }, nat:function(a, b){ return (a.nat+a.nome).localeCompare(b.nat+b.nome); } };
var nomeFilial = function(id){ return id==="fora" ? "Por fora" : id; };

function AbaCtaLista(){
  var cx = use(), s = cx.state, hoje = hojeIso();
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);
  var ms = meses(), ini = ms.indexOf(hojeYm())>=0 ? hojeYm() : (ms[ms.length-1] || "");
  var a = useState("quando"), aba = a[0], setAba = a[1], b = useState(ini), mes = b[0], setMes = b[1];
  var c = useState(""), per = c[0], setPer = c[1], f = useState(""), filial = f[0], setFilial = f[1], g = useState(""), nota = g[0], setNota = g[1], h = useState(""), busca = h[0], setBusca = h[1];
  var i2 = useState(""), nat = i2[0], setNat = i2[1], o = useState("venc"), ord = o[0], setOrd = o[1], l = useState(100), lim = l[0], setLim = l[1], n = useState(false), nova = n[0], setNova = n[1];
  var sl = useState([]), sel = sl[0], setSel = sl[1], rg = useState(false), regPag = rg[0], setRegPag = rg[1], av = useState(""), aviso = av[0], setAviso = av[1];
  var podePagar = temAutorizacao("pagamento_registra", s.usuario);
  if(!temDados()) return e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Sem contas da empresa neste computador.");
  var quem = "sorelly";
  var limpar = function(){ setPer(""); setFilial(""); setNota(""); setBusca(""); setNat(""); setLim(100); };
  var filtrado = !!(per || filial || nota || busca || nat);
  // faixa de totais: o que está nos filtros de mês, CNPJ, nota e busca (ignora a aba e o período)
  var todos = filtrar(mes, filial, busca, "", quem, nota).filter(function(i){ return !nat || (i.nat+" · "+i.natNome)===nat; });
  var pagos = todos.filter(function(i){ return i.status==="pago"; }), abertos = todos.filter(function(i){ return i.status==="apagar"; }), atrasadas = abertos.filter(function(i){ return i.venc<hoje; });
  // aba "Quando vence": o que está em aberto por dia, semana e CNPJ (clicar no valor filtra a lista)
  var emAberto = filtrar("", "", "", "apagar", quem, ""), ini7 = segunda(hoje);
  var QUANDO = [["atraso","Atrasadas", emAberto.filter(function(i){ return i.venc<hoje; })], ["hoje","Hoje", emAberto.filter(function(i){ return i.venc===hoje; })], ["amanha","Amanhã", emAberto.filter(function(i){ return i.venc===somaDias(hoje, 1); })],
    ["semana","Esta semana", emAberto.filter(function(i){ return i.venc>=ini7 && i.venc<=somaDias(ini7, 6); })], ["prox","Próxima semana", emAberto.filter(function(i){ return i.venc>=somaDias(ini7, 7) && i.venc<=somaDias(ini7, 13); })]];
  var colFil = FILIAIS.filter(function(x){ return x[0]!=="ho"; });
  var irLista = function(perK, fil){ setPer(perK); setFilial(fil||""); setLim(100); setAba("apagar"); };
  var celQuando = function(lista, fil, perK){ var v = soma(fil ? lista.filter(function(i){ return i.filial===fil; }) : lista);
    return e("td",{key:(fil||"t")+perK, onClick:v>0 ? function(){ irLista(perK, fil); } : undefined, title:v>0 ? "Ver a lista" : undefined, className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-right tabular-nums "+(v>0 ? "cursor-pointer text-foreground hover:bg-white/10" : "text-foreground/50")}, v>0 ? BKC(v) : "—"); };
  var quando = e(TabelaP,{minW:980, cols:[{t:"Quando", w:150},{t:"Contas", n:true, w:90},{t:"Total", n:true, w:150}].concat(colFil.map(function(x){ return {t:x[1], n:true, w:150}; }))},
    QUANDO.map(function(x){ return e("tr",{key:x[0]}, e(Td,{forte:true, cor:x[0]==="atraso" && x[2].length ? "text-warning" : ""}, x[1]), e(Td,{n:true}, String(x[2].length)), celQuando(x[2], "", x[0]), colFil.map(function(fi){ return celQuando(x[2], fi[0], x[0]); })); }),
    e(Tr,{key:"t", total:true}, e(Td,null, "Em aberto"), e(Td,{n:true}, String(emAberto.length)), e(Td,{n:true}, BKC(soma(emAberto))), colFil.map(function(fi){ return e(Td,{key:fi[0], n:true}, BKC(soma(emAberto.filter(function(i){ return i.filial===fi[0]; })))); })));
  // abas de lista: A pagar | Pagas | Todas
  var statusAba = aba==="apagar" ? "apagar" : aba==="pago" ? "pago" : "";
  var base = filtrar(mes, filial, busca, statusAba, quem, nota).filter(function(i){ return noPeriodo(i, per, hoje) && (!nat || (i.nat+" · "+i.natNome)===nat); });
  var nats = []; filtrar(mes, filial, busca, statusAba, quem, nota).forEach(function(i){ var k = i.nat+" · "+i.natNome; if(nats.indexOf(k)<0) nats.push(k); }); nats.sort();
  var ls = base.slice().sort(CMP[ord]), vis = ls.slice(0, lim), totLista = soma(base);
  var situacao = function(i){ return i.status==="pago" ? "Pago "+dm(i.baixa) : i.atraso>0 ? "Atrasada · "+i.atraso+" dias" : "A pagar"; };
  var colCheck = podePagar && (aba==="apagar" || aba==="todas"), colAcao = podePagar && (aba==="pago" || aba==="todas");
  var nomeCnpj = function(f){ return f==="fora" ? "Por fora" : "CNPJ "+f; };
  var marca = function(i){
    if(sel.indexOf(i.id)>=0){ setSel(sel.filter(function(x){ return x!==i.id; })); setAviso(""); return; }
    var ref = ls.filter(function(x){ return sel.indexOf(x.id)>=0; })[0];
    if(ref && ref.filial!==i.filial){ setAviso("Marque só contas do mesmo CNPJ. Já tem "+nomeCnpj(ref.filial)+" marcado: registre esse pagamento ou desmarque."); return; }
    setAviso(""); setSel(sel.concat([i.id]));
  };
  var todasItens = ls.filter(function(i){ return sel.indexOf(i.id)>=0; });
  var barraSel = podePagar && (todasItens.length>0 || aviso) ? e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] text-foreground"},
    todasItens.length>0 && e("span",null, todasItens.length+(todasItens.length>1 ? " contas marcadas" : " conta marcada")+" · "+nomeCnpj(todasItens[0].filial)+" · ", e("b",null, BKC(soma(todasItens)))),
    aviso && e("span",{className:"text-warning"}, aviso),
    todasItens.length>0 && e("span",{className:"ml-auto flex gap-2"}, e(Botao,{onClick:function(){ setSel([]); setAviso(""); }}, "Limpar"), e(Botao,{principal:true, onClick:function(){ setRegPag(true); }}, "Registrar pagamento"))) : null;
  var lista = e("div",{className:"flex flex-col gap-2"},
    e("p",{className:"text-[13px] text-foreground"}, base.length+" títulos · total ", e("b",null, BKC(totLista))),
    barraSel,
    e(TabelaP,{minW:960+(colCheck ? 40 : 0)+(colAcao ? 110 : 0), cols:(colCheck ? [{t:"", w:40}] : []).concat([{t:"Vence", w:90},{t:"CNPJ", w:80},{t:"Número", w:130},{t:"Parcela", w:80},{t:"Fornecedor"},{t:"Natureza", w:230},{t:"Valor", n:true, w:140},{t:"Situação", w:160}], colAcao ? [{t:"", w:110}] : [])},
      vis.map(function(i){ var num = ((i.pref||"")+" "+(i.num||"")).trim() || "—";
        return e(Tr,{key:i.id}, colCheck && e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, i.status==="apagar" ? e("input",{type:"checkbox", checked:sel.indexOf(i.id)>=0, onChange:function(){ marca(i); }, "aria-label":"Marcar "+i.nome, className:"h-4 w-4 cursor-pointer accent-[#d4af37]"}) : null), e(Td,{title:"Emissão "+(i.emissao ? dm(i.emissao) : "—")}, dm(i.venc)), e(Td,null, nomeFilial(i.filial)), e(Td,null, num), e(Td,null, i.parc||"—"), e(Td,{forte:true}, i.nome), e(Td,{title:i.nat+" "+i.natNome}, i.natNome),
          e(Td,{n:true}, BKC(i.valor)), e(Td,{cor:i.status==="apagar" && i.atraso>0 ? "text-warning" : (i.status==="pago" ? "text-success" : ""), title:i.bx ? ("Pago por "+nomeDe(i.bx.por)+" · "+i.bx.contaNome+(i.bx.obs ? " · "+i.bx.obs : "")) : (i.obs||undefined)}, situacao(i)), colAcao && e("td",{className:"h-8 border-b border-border px-2 text-right"}, i.bx ? e("button",{type:"button", onClick:function(){ if(window.confirm("Desfazer este pagamento? A conta volta para A pagar.")) cx.dispatch({type:"CPE_BAIXA_DESFAZ", id:i.bx.id, por:s.usuario}); }, className:"h-7 rounded-md border border-border px-2 text-[12px] text-foreground hover:bg-white/10"}, "Desfazer") : null)); }),
      vis.length ? e(Tr,{key:"t", total:true}, colCheck && e(Td,null, ""), e(Td,null, "Total"), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, base.length+" títulos"), e(Td,null, ""), e(Td,{n:true}, BKC(totLista)), e(Td,null, ""), colAcao && e(Td,null, "")) : null),
    !vis.length && e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Nenhuma conta neste filtro."),
    ls.length>vis.length && e("div",{className:"flex justify-center"}, e(Botao,{onClick:function(){ setLim(lim+200); }}, "Mostrar mais ("+(ls.length-vis.length)+")")));
  var titulo = ABAS.filter(function(x){ return x[0]===aba; })[0][1];
  return e("div",{className:"flex flex-col gap-3"},
    nova && e(NovaConta,{fechar:function(){ setNova(false); }}),
    regPag && todasItens.length>0 && e(RegistrarPagamento,{s:s, itens:todasItens, fechar:function(){ setRegPag(false); }, salvar:function(baixas){ cx.dispatch({type:"CPE_BAIXA", baixas:baixas}); setRegPag(false); setSel([]); setAviso(""); }}),
    e("div",{className:"flex h-10 items-center justify-between gap-2"}, e("h1",{className:"truncate text-[16px] font-semibold text-foreground"}, "Contas a pagar"), e(Botao,{principal:true, onClick:function(){ setNova(true); }}, "Lançar conta")),
    e(BlocoFiltros,{onLimpar:filtrado ? limpar : null},
      e(CampoSel,{t:"Mês", id:"cp-mes", value:mes, onChange:function(v){ setMes(v); setLim(100); setNat(""); }, opcoes:ms.map(function(m){ return [m, nomeMes(m)]; }).concat(ms.length>1 ? [["", "Todos os meses"]] : [])}),
      e(CampoSel,{t:"Período", id:"cp-per", value:per, onChange:function(v){ setPer(v); setLim(100); }, opcoes:PERIODOS}),
      e(CampoSel,{t:"CNPJ", id:"cp-cnpj", value:filial, onChange:function(v){ setFilial(v); setLim(100); }, opcoes:[["", "Todos"]].concat(FILIAIS.map(function(x){ return [x[0], x[1]+(x[0]==="fora" ? "" : " · "+x[2])]; }))}),
      e(CampoSel,{t:"Nota", id:"cp-nota", value:nota, onChange:function(v){ setNota(v); setLim(100); }, opcoes:NOTAS}),
      e(CampoSel,{t:"Natureza", id:"cp-nat", value:nat, onChange:function(v){ setNat(v); setLim(100); }, opcoes:[["", "Todas"]].concat(nats.map(function(x){ return [x, x]; }))}),
      e(CampoSel,{t:"Ordenar por", id:"cp-ord", value:ord, onChange:setOrd, opcoes:ORDENS}),
      e(CampoBusca,{t:"Buscar", id:"cp-busca", value:busca, placeholder:"Fornecedor, natureza ou valor", onChange:function(v){ setBusca(v); setLim(100); }})),
    e(FaixaTotais,{itens:[{t:"Total", v:BKC(soma(todos))},{t:"Pago", v:BKC(soma(pagos))},{t:"A pagar", v:BKC(soma(abertos))},{t:"Atrasadas", v:BKC(soma(atrasadas)), cor:atrasadas.length ? "text-warning" : ""},{t:"Títulos", v:String(todos.length)}]}),
    e(AbasTela,{abas:ABAS, atual:aba, onMudar:function(k){ setAba(k); setLim(100); if(k==="quando"){ setPer(""); } }}),
    aba==="quando" ? e("div",{className:"flex flex-col gap-2"}, e("h3",{className:"text-[13px] font-semibold text-foreground"}, "Em aberto por dia, semana e CNPJ · clique no valor para ver a lista"), quando) : lista);
}

export { AbaCtaLista };
