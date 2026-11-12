// Sorelly Admin · montagem — pages/inad/Dividas.js
// Inadimplência › Dívidas (11/11/2026, pedido do Marcus): uma linha por dívida, filtro e ordem NO NOME DA COLUNA (igual ao Google Planilhas), saldo automático.
// A linha abre a ficha da devedora (dados, acordo com parcelas, pagamentos e histórico). Regras e contas em domain/inadimplencia.js (estado s.inad, ação INAD).
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { Aviso, Bloco, Botao, CAMPO, CampoSel, Rotulo, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CONTATOS, COR_SIT, ETAPAS, FORMAS, NOTAS, POS_VENDA, QUEM_COBRA, SITUACOES, aberta, excecoesDoAcordo, formatarDia, gerarParcelas, hojeIso, indicePagos, maxParcelasPix, proximaAcao, rotuloMes, saldoDe, situacaoDe, totalDe } from "@/apps/montagem/domain/inadimplencia";
import { CampoDin, CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useMemo, useState } from "@/shared/react";

var R$ = function(v){ return brl(v||0); };
var op = function(l){ return l.map(function(x){ return [x, x]; }); };
var AREA = "min-h-16 w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
function Par(p){ return e("div",{className:"flex items-center justify-between gap-3 border-b border-border py-1 text-[13px]"}, e("span",{className:"font-medium"}, p.t), e("span",{className:"tabular-nums "+(p.cor||"")}, p.v)); }

// linhas da tabela: tudo já calculado (saldo, situação, próxima ação)
function linhasDividas(inad, hoje){
  var pagos = indicePagos(inad), neg = {}; (inad.serasa||[]).forEach(function(n){ if(n.dividaId) neg[n.dividaId] = n.dataNeg; });
  return (inad.dividas||[]).slice().sort(function(a, b){ return String(b.data||"").localeCompare(String(a.data||"")); }).map(function(d){ var falta = saldoDe(d, pagos), total = totalDe(d);
    return {id:d.id, data:d.data||"", mes:rotuloMes(d.mes || String(d.data||"").slice(0, 7)), nome:d.nome, rep:d.rep||"", cobra:d.cobra||"", valor:total, pago:Math.max(0, Math.round((total-falta)*100)/100), falta:falta, sit:situacaoDe(d, pagos, hoje), etapa:d.etapa||"",
      acao:proximaAcao(d, pagos, inad.cfg, hoje).txt, nota:d.nota||"", serasa:neg[d.id] || "", posVenda:d.posVenda||"", ano:String(d.ano || String(d.data||"").slice(0, 4)), emAberto:aberta(d, pagos)}; });
}
var COLS = [
  {k:"data", t:"Data da dívida", fmt:function(v){ return formatarDia(v); }}, {k:"nome", t:"Devedora"}, {k:"rep", t:"Representante"}, {k:"cobra", t:"Quem cobra"},
  {k:"valor", t:"Valor", fmt:R$}, {k:"pago", t:"Pago", fmt:R$, cor:function(l){ return l.pago>0 ? "text-emerald-400" : ""; }}, {k:"falta", t:"Falta", fmt:R$, cor:function(l){ return l.falta>0.005 ? "text-red-400" : "text-emerald-400"; }},
  {k:"sit", t:"Situação", cor:function(l){ return (COR_SIT[l.sit]||"")+" font-semibold"; }}, {k:"etapa", t:"Etapa"}, {k:"acao", t:"Próxima ação"}, {k:"nota", t:"Nota promissória", cor:function(l){ return l.nota && l.nota!=="Assinada" ? "text-red-400" : ""; }},
  {k:"serasa", t:"Serasa", fmt:function(v){ return formatarDia(v); }}, {k:"posVenda", t:"Pós-venda"}, {k:"mes", t:"Mês da dívida"}];

// ---------- ficha da devedora ----------
function FichaDivida(p){
  var ctx = use(), s = ctx.state, d = ctx.dispatch, inad = s.inad, dv = (inad.dividas||[]).find(function(x){ return x.id===p.id; });
  var hoje = hojeIso(), por = porDe(s);
  var sa = useState({forma:"pix", n:"1", primeira:hoje, autorizadoPor:""}), ac = sa[0], setAc = sa[1];
  var sp = useState({data:hoje, valor:null, conta:"", quem:"Setor de Inadimplência", comprovante:"", confirmado:true}), pg = sp[0], setPg = sp[1];
  var so = useState(""), obs = so[0], setObs = so[1], sc = useState({resultado:CONTATOS[0], obs:""}), ct = sc[0], setCt = sc[1];
  var sr = useState(null), pr = sr[0], setPr = sr[1];   // prorrogação: {i, venc, motivo, autorizadoPor}
  var contas = useMemo(function(){ var o = {}; (inad.pagamentos||[]).forEach(function(x){ if(x.conta) o[x.conta] = 1; }); return Object.keys(o).sort(); }, [inad.pagamentos]);
  if(!dv) return null;
  var pagos = indicePagos(inad), saldo = saldoDe(dv, pagos), total = totalDe(dv), sit = situacaoDe(dv, pagos, hoje);
  var campo = function(k, v){ var c = {}; c[k] = v; d({type:"INAD", op:"div_campos", id:dv.id, campos:c, por:por}); };
  var n = Math.max(1, +ac.n||1), prev = saldo>0 ? gerarParcelas(saldo, n, ac.primeira || hoje) : [], ex = saldo>0 ? excecoesDoAcordo(dv, ac.forma, n, prev.length ? prev[0].valor : 0, saldo, inad.cfg) : [];
  var mx = maxParcelasPix(saldo, inad.cfg), pagsDela = (inad.pagamentos||[]).filter(function(x){ return x.dividaId===dv.id; });
  var quemOp = ["Setor de Inadimplência"].concat(dv.rep ? ["Representante "+dv.rep] : [], ["Marcus", "Nickolas"]);
  var parcelas = (dv.acordo && dv.acordo.parcelas) || [];

  var dados = e(Bloco,{key:"d", t:"Dívida"},
    e(Par,{t:"Valor", v:R$(dv.valor)}), (dv.acrescimos||[]).length>0 && e(Par,{t:"Acréscimos autorizados", v:R$(total-dv.valor)}), e(Par,{t:"Pago", v:R$(total-saldo), cor:"text-emerald-400"}), e(Par,{t:"Falta", v:R$(saldo), cor:saldo>0.005 ? "text-red-400" : "text-emerald-400"}),
    e(Par,{t:"Data da dívida", v:formatarDia(dv.data)}), e(Par,{t:"Situação agora", v:sit, cor:COR_SIT[sit]}),
    e("div",{className:"mt-2 grid grid-cols-2 gap-2"},
      e(CampoSel,{t:"Situação", id:"fSit", value:dv.sit||"", onChange:function(v){ campo("sit", v); }, opcoes:op(SITUACOES.indexOf(dv.sit)<0 && dv.sit ? [dv.sit].concat(SITUACOES) : SITUACOES)}),
      e(CampoSel,{t:"Etapa", id:"fEta", value:dv.etapa||"", onChange:function(v){ campo("etapa", v); }, opcoes:op(ETAPAS.indexOf(dv.etapa)<0 ? [dv.etapa||""].concat(ETAPAS) : ETAPAS)}),
      e(CampoSel,{t:"Quem cobra", id:"fCob", value:dv.cobra||"", onChange:function(v){ campo("cobra", v); }, opcoes:op(QUEM_COBRA.indexOf(dv.cobra)<0 ? [dv.cobra||""].concat(QUEM_COBRA) : QUEM_COBRA)}),
      e(CampoSel,{t:"Nota promissória", id:"fNot", value:dv.nota||"", onChange:function(v){ campo("nota", v); }, opcoes:op(NOTAS.indexOf(dv.nota)<0 ? [dv.nota||""].concat(NOTAS) : NOTAS)}),
      e(CampoSel,{t:"Pós-venda", id:"fPos", value:dv.posVenda||"", onChange:function(v){ campo("posVenda", v); }, opcoes:op([""].concat(POS_VENDA.indexOf(dv.posVenda)<0 && dv.posVenda ? [dv.posVenda] : [], POS_VENDA))}),
      e(CampoSel,{t:"Comissão da rep.", id:"fCom", value:dv.comissaoRep||"", onChange:function(v){ campo("comissaoRep", v); }, opcoes:[["", "A analisar"], ["Mantém", "Mantém"], ["Perde", "Perde"]]}),
      e(CampoTexto,{t:"Representante", id:"fRep", value:dv.rep||"", onChange:function(v){ campo("rep", v); }}),
      e(CampoTexto,{t:"Condicional", id:"fCond", value:dv.condicional||"", onChange:function(v){ campo("condicional", v); }})),
    e("p",{className:"mt-2 text-[11px] text-foreground"}, dv.origem||""));

  var acordo = e(Bloco,{key:"a", t:"Acordo"},
    parcelas.length ? e("div",null, parcelas.map(function(x, i){ var venc = !x.pagoEm && x.venc<hoje;
        return e("div",{key:i, className:"flex items-center justify-between gap-2 border-b border-border py-1 text-[13px]"}, e("span",null, "Parcela "+(i+1)+" · "+formatarDia(x.venc)+(x.prorrogada ? " (prorrogada)" : "")), e("span",{className:"tabular-nums"}, R$(x.valor)),
          e("span",{className:x.pagoEm ? "text-emerald-400" : venc ? "text-red-400" : "text-amber-300"}, x.pagoEm ? "Paga em "+formatarDia(x.pagoEm) : venc ? "Vencida" : "A vencer"),
          !x.pagoEm && e("button",{type:"button", onClick:function(){ setPr({i:i, venc:"", motivo:"", autorizadoPor:""}); }, className:"h-8 rounded-md border border-border px-2 text-[13px] hover:bg-white/10"}, "Prorrogar")); }),
      (dv.acordo.excecoes||[]).length>0 && e("p",{className:"py-1 text-[13px] text-amber-300"}, "Exceção autorizada por "+dv.acordo.autorizadoPor+": "+dv.acordo.excecoes.join("; ")),
      pr && e("div",{className:"mt-2 grid grid-cols-2 gap-2"}, e(CampoTexto,{t:"Nova data", id:"prV", tipo:"date", value:pr.venc, onChange:function(v){ setPr(Object.assign({}, pr, {venc:v})); }}), e(CampoTexto,{t:"Autorizado por", id:"prA", value:pr.autorizadoPor, onChange:function(v){ setPr(Object.assign({}, pr, {autorizadoPor:v})); }}),
        e(CampoTexto,{t:"Justificativa", id:"prM", cls:"col-span-2", value:pr.motivo, onChange:function(v){ setPr(Object.assign({}, pr, {motivo:v})); }}),
        e(Botao,{onClick:function(){ setPr(null); }}, "Cancelar"), e(Botao,{principal:true, onClick:function(){ d({type:"INAD", op:"prorrogar", id:dv.id, i:pr.i, venc:pr.venc, motivo:pr.motivo, autorizadoPor:pr.autorizadoPor, por:por}); setPr(null); }}, "Prorrogar parcela")))
      : e("p",{className:"py-1 text-[13px]"}, "Sem acordo gravado."+(dv.parcelasTxt ? " Na planilha: "+dv.parcelasTxt+"." : "")),
    saldo>0.005 && e("div",{className:"mt-2 border-t border-border pt-2"},
      e("p",{className:"pb-1 text-[11px] font-semibold uppercase tracking-[.05em]"}, parcelas.length ? "Novo acordo (renegociação)" : "Novo acordo"),
      e("div",{className:"grid grid-cols-2 gap-2"},
        e(CampoSel,{t:"Forma", id:"aF", value:ac.forma, onChange:function(v){ setAc(Object.assign({}, ac, {forma:v})); }, opcoes:FORMAS}),
        e(CampoSel,{t:"Parcelas", id:"aN", value:ac.n, onChange:function(v){ setAc(Object.assign({}, ac, {n:v})); }, opcoes:[1, 2, 3, 4, 5, 6].map(function(x){ return [String(x), x+"x de "+R$(Math.floor(saldo/x*100)/100)]; })}),
        e(CampoTexto,{t:"Primeira parcela", id:"aP", tipo:"date", value:ac.primeira, onChange:function(v){ setAc(Object.assign({}, ac, {primeira:v})); }}),
        e(CampoTexto,{t:"Autorizado por", id:"aA", value:ac.autorizadoPor, placeholder:"Só em exceção", onChange:function(v){ setAc(Object.assign({}, ac, {autorizadoPor:v})); }})),
      e("p",{className:"py-1 text-[13px]"}, ac.forma==="pix" ? (mx ? "Regra do Pix para este valor: até "+mx+" vezes, parcela mínima de "+R$(inad.cfg.parcelaMinima)+"." : "Acima de "+R$(inad.cfg.pixFaixas[inad.cfg.pixFaixas.length-1].ate)+": analisar ou oferecer cartão.") : "Cartão: até "+inad.cfg.cartaoMax+" vezes sem juros, por link."),
      ex.length>0 && e(Aviso,{tom:"vermelho"}, "Fora das regras: "+ex.join("; ")+". Precisa do nome de quem autorizou."),
      e("div",{className:"mt-2 flex justify-end"}, e(Botao,{principal:true, onClick:function(){ d({type:"INAD", op:"acordo", id:dv.id, forma:ac.forma, parcelas:prev, autorizadoPor:ac.autorizadoPor, por:por}); }}, "Gravar acordo"))));

  var pagamentos = e(Bloco,{key:"p", t:"Pagamentos"},
    pagsDela.length ? pagsDela.map(function(x){ return e("div",{key:x.id, className:"flex flex-wrap items-center justify-between gap-2 border-b border-border py-1 text-[13px]"}, e("span",null, formatarDia(x.data) || rotuloMes(x.mes)), e("span",{className:"tabular-nums text-emerald-400"}, R$(x.valor)), e("span",null, x.quem||""), e("span",null, x.conta||""),
        x.novo && !x.confirmado ? e("button",{type:"button", onClick:function(){ d({type:"INAD", op:"pag_campos", id:x.id, campos:{confirmado:true}, por:por}); if(x.noAcerto && dv.acertoId) d({type:"INAD_PAGAR", id:dv.acertoId, forma:"pix", descricao:x.conta, valor:x.valor, quem:x.quem}); }, className:"h-8 rounded-md border border-primary px-2 text-[13px] text-primary hover:bg-primary/20"}, "Confirmar recebimento") : e("span",{className:"text-emerald-400"}, "Confirmado")); })
      : e("p",{className:"py-1 text-[13px]"}, "Nenhum pagamento ligado a esta dívida."),
    saldo>0.005 && e("div",{className:"mt-2 border-t border-border pt-2"},
      e("p",{className:"pb-1 text-[11px] font-semibold uppercase tracking-[.05em]"}, "Registrar pagamento"),
      e("div",{className:"grid grid-cols-2 gap-2"},
        e(CampoTexto,{t:"Data", id:"pD", tipo:"date", value:pg.data, onChange:function(v){ setPg(Object.assign({}, pg, {data:v})); }}),
        e(CampoDin,{t:"Valor pago", id:"pV", value:pg.valor, onChange:function(v){ setPg(Object.assign({}, pg, {valor:v})); }}),
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"Conta de recebimento", id:"pC"}), e("input",{id:"pC", list:"inadContas", value:pg.conta, onChange:function(ev){ setPg(Object.assign({}, pg, {conta:ev.target.value})); }, className:CAMPO}), e("datalist",{id:"inadContas"}, contas.map(function(c){ return e("option",{key:c, value:c}); }))),
        e(CampoSel,{t:"Quem recuperou", id:"pQ", value:pg.quem, onChange:function(v){ setPg(Object.assign({}, pg, {quem:v})); }, opcoes:op(quemOp)}),
        e(CampoTexto,{t:"Comprovante", id:"pA", cls:"col-span-2", value:pg.comprovante, placeholder:"Nome do arquivo ou link", onChange:function(v){ setPg(Object.assign({}, pg, {comprovante:v})); }})),
      e("label",{className:"mt-2 flex h-8 items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:pg.confirmado, onChange:function(ev){ setPg(Object.assign({}, pg, {confirmado:ev.target.checked})); }, className:"size-4 accent-[#E8B84B]"}), "Recebimento já confirmado na conta"),
      dv.acertoId && e("p",{className:"py-1 text-[13px]"}, "Dívida nascida do acerto: o pagamento confirmado entra também no acerto, para liberar a comissão e o kit."),
      e("div",{className:"flex justify-end"}, e(Botao,{principal:true, onClick:function(){ d({type:"INAD", op:"pag_novo", dividaId:dv.id, data:pg.data, valor:pg.valor, conta:pg.conta, quem:pg.quem, comprovante:pg.comprovante, confirmado:pg.confirmado, por:por});
        if(dv.acertoId && pg.confirmado && pg.valor>0 && pg.data && String(pg.conta).trim() && String(pg.quem).trim()) d({type:"INAD_PAGAR", id:dv.acertoId, forma:"pix", descricao:pg.conta, valor:pg.valor, quem:pg.quem});
        setPg(Object.assign({}, pg, {valor:null, comprovante:""})); }}, "Registrar pagamento"))));

  var hist = (dv.hist||[]).slice().reverse();
  var historico = e(Bloco,{key:"h", t:"Histórico"},
    (dv.negociacao || dv.obs || dv.extra) && e("div",{className:"border-b border-border py-1 text-[13px]"}, e("p",{className:"text-[11px] font-semibold uppercase tracking-[.05em]"}, "Da planilha"),
      dv.negociacao && e("p",null, "Negociação: "+dv.negociacao), dv.obs && e("p",null, "Observação: "+dv.obs), dv.extra && e("p",null, "Outras anotações: "+dv.extra)),
    e("div",{className:"grid grid-cols-2 gap-2 py-2"},
      e(CampoSel,{t:"Registrar contato", id:"cR", value:ct.resultado, onChange:function(v){ setCt(Object.assign({}, ct, {resultado:v})); }, opcoes:op(CONTATOS)}),
      e(CampoTexto,{t:"O que ela disse", id:"cO", value:ct.obs, onChange:function(v){ setCt(Object.assign({}, ct, {obs:v})); }}),
      e("div",{className:"col-span-2 flex justify-end"}, e(Botao,{onClick:function(){ d({type:"INAD", op:"contato", id:dv.id, resultado:ct.resultado, obs:ct.obs, por:por}); setCt({resultado:CONTATOS[0], obs:""}); }}, "Registrar contato"))),
    e("textarea",{value:obs, placeholder:"Nova observação (as anteriores nunca são apagadas)", onChange:function(ev){ setObs(ev.target.value); }, className:AREA}),
    e("div",{className:"flex justify-end py-1"}, e(Botao,{onClick:function(){ d({type:"INAD", op:"hist", id:dv.id, txt:obs, por:por}); setObs(""); }}, "Gravar observação")),
    hist.length ? hist.map(function(h, i){ return e("div",{key:i, className:"border-t border-border py-1 text-[13px]"}, e("p",{className:"text-[11px]"}, h.em+" · "+h.por), e("p",{className:"whitespace-pre-wrap"}, h.txt)); }) : e("p",{className:"py-1 text-[13px]"}, "Sem registros no sistema ainda."));

  return e(Janela,{t:dv.nome, sub:(dv.rep ? "Representante "+dv.rep+" · " : "")+"Falta "+R$(saldo), fechar:p.fechar, colunas:[dados, acordo, pagamentos, historico]});
}

function NovaDivida(p){
  var ctx = use(), s = ctx.state, d = ctx.dispatch, st = useState({nome:"", valor:null, data:hojeIso(), rep:"", cobra:"Representante", nota:"Assinada", condicional:"", obs:""}), f = st[0], set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var form = e(Bloco,{key:"f", t:"Dados da dívida"}, e("div",{className:"grid grid-cols-2 gap-2 pt-1"},
    e(CampoTexto,{t:"Devedora", id:"nN", cls:"col-span-2", value:f.nome, onChange:function(v){ set("nome", v); }}),
    e(CampoDin,{t:"Valor da dívida", id:"nV", value:f.valor, onChange:function(v){ set("valor", v); }}), e(CampoTexto,{t:"Data da dívida", id:"nD", tipo:"date", value:f.data, onChange:function(v){ set("data", v); }}),
    e(CampoTexto,{t:"Representante", id:"nR", value:f.rep, onChange:function(v){ set("rep", v); }}), e(CampoSel,{t:"Quem cobra", id:"nC", value:f.cobra, onChange:function(v){ set("cobra", v); }, opcoes:op(QUEM_COBRA)}),
    e(CampoSel,{t:"Nota promissória", id:"nP", value:f.nota, onChange:function(v){ set("nota", v); }, opcoes:op(NOTAS)}), e(CampoTexto,{t:"Condicional", id:"nK", value:f.condicional, onChange:function(v){ set("condicional", v); }}),
    e(CampoTexto,{t:"Observação", id:"nO", cls:"col-span-2", value:f.obs, onChange:function(v){ set("obs", v); }})));
  return e(Janela,{t:"Nova dívida", fechar:p.fechar, colunas:[form], rodape:[e(Botao,{key:"c", onClick:p.fechar}, "Cancelar"), e(Botao,{key:"s", principal:true, onClick:function(){ d(Object.assign({type:"INAD", op:"div_nova", por:porDe(s)}, f)); if(String(f.nome).trim() && f.valor>0) p.fechar(); }}, "Lançar dívida")]});
}

function AbaInadDividas(){
  var s = use().state, inad = s.inad, hoje = hojeIso();
  var sv = useState("abertas"), vista = sv[0], sf = useState(null), ficha = sf[0], sn = useState(false), nova = sn[0];
  var todas = useMemo(function(){ return inad ? linhasDividas(inad, hoje) : []; }, [inad, hoje]);
  var anos = useMemo(function(){ var o = {}; todas.forEach(function(l){ if(l.ano) o[l.ano] = 1; }); return Object.keys(o).sort().reverse().slice(0, 3); }, [todas]);
  var linhas = useMemo(function(){ return vista==="abertas" ? todas.filter(function(l){ return l.emAberto; }) : vista==="tudo" ? todas : todas.filter(function(l){ return l.ano===vista; }); }, [todas, vista]);
  var cab = e(PageHead,{t:"Dívidas", sub:"Uma linha por dívida. O saldo muda sozinho quando um pagamento é confirmado. Filtre e ordene clicando no nome da coluna."},
    e(Segmentado,{opcoes:[["abertas", "Em aberto"]].concat(anos.map(function(a){ return [a, a]; }), [["tudo", "Tudo"]]), atual:vista, onMudar:sv[1]}), e(Botao,{principal:true, onClick:function(){ sn[1](true); }}, "Nova dívida"));
  if(!inad) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados da Inadimplência indisponíveis."));
  var total = function(ls){ var v = 0, pg = 0, f = 0; ls.forEach(function(l){ v += l.valor; pg += l.pago; f += l.falta; }); return ["Total", ls.length.toLocaleString("pt-BR")+" dívidas", "", "", R$(v), R$(pg), R$(f), "", "", "", "", "", "", ""]; };
  return e(Pagina,null, cab,
    e(TabelaPlanilha,{key:vista, cols:COLS, linhas:linhas, chave:"id", escura:true, grade:true, limite:100, totalLinha:total, aoClicar:function(l){ sf[1](l.id); }, vazio:"Nenhuma dívida nesta visão."}),
    ficha && e(FichaDivida,{id:ficha, fechar:function(){ sf[1](null); }}), nova && e(NovaDivida,{fechar:function(){ sn[1](false); }}));
}

export { AbaInadDividas, FichaDivida, linhasDividas };
