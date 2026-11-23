// Sorelly Admin — pages/ConsolidadoInterno.js
// Atendimento interno → Consolidado Sorelly. Só os atendimentos feitos na própria Sorelly (nada disso entra no Consolidado das representantes).
// Mostra o acerto de cada atendimento, quem bipou, quem atendeu, se levou kit novo, QUANTO TEMPO durou (de "Iniciar atendimento" até "Finalizar bipagem") e se o Financeiro já conferiu o pagamento.
// REFEITO em 17/11/2026 (Marcus: "melhore esse consolidado, igual ao Financeiro, tipo tabela em azul"): bloco azul (BlocoPainel) com a faixa do mês e dos números, e a TabelaPlanilha com filtro e ordem em cada coluna (o filtro e a busca soltos no topo saíram).
// Coluna nova "Financeiro": Conferido (verde), Em conferência (amarelo) ou Sem lançamento (vermelho): cor só para estado. 17/11/2026 (Marcus: "tira isso do topo, tira as coisas coloridas, padroniza"): a faixa azul tem SÓ o mês; os números saíram (quem quer ver "Em conferência" ou "Sem finalizar" filtra a coluna) e o resto da tabela é sem cor.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BK, N1, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+"/"+p[0]; };
var hm = function(ts){ return new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}); };
var primeiro = function(n){ return n ? String(n).split(" ")[0] : "—"; };
var traco = function(v, fmt){ return v===null || v===undefined || v==="" ? "—" : (fmt ? fmt(v) : String(v)); };
// 17/11/2026 (Marcus: "onde marca se é kit novo, reposição, retirada de brinde?"): coluna Tipo, com os mesmos nomes da lista do dia no Atendimento Sorelly
var TIPO = {acerto:"Acerto", kit_novo:"Kit novo", reposicao:"Reposição", premio:"Retirada de brinde", indicacao:"Retirada de brinde", retornando:"Novo kit", troca:"Troca"};
// 17/11/2026 (Marcus: "no tipo uma cor diferente em cada; o financeiro a mesma coisa, sem negrito"): selo colorido, sem negrito, para o Tipo e para o Financeiro
var COR_TIPO = {"Acerto":"#3B82F6", "Kit novo":"#22C55E", "Reposição":"#F59E0B", "Retirada de brinde":"#A855F7", "Novo kit":"#14B8A6", "Troca":"#EC4899"};
var COR_FIN = {"Conferido":"#22C55E", "Em conferência":"#FBBF24", "Sem lançamento":"#EF4444", "Não se aplica":"#FFFFFF"};
// só a COR da letra muda: mesma fonte, mesmo tamanho, sem negrito e sem caixa em volta (Marcus, 17/11/2026)
var selo = function(txt, cor){ return e("span",{className:"whitespace-nowrap", style:{color:cor||"#FFFFFF"}}, txt); };
// formas de pagamento: uma coluna para cada, com o valor em R$ (igual ao Consolidado das representantes); dinheiro primeiro
var FORMAS = [["dinheiro","Dinheiro"], ["pix","Pix"], ["link","Link"], ["credito","Crédito"], ["debito","Débito"], ["credito_cliente","Crédito da cliente"], ["acerto_loja","Acerto com loja"]];
var CONTINUA = {sim:"Sim", nao_regras:"Não · regras", nao_quer:"Não · não quis", outro_dia:"Outro dia"};

function AbaConsolidadoInterno(){
  var cx = use(), s = cx.state;
  var hoje = isoDia(new Date());
  var mm = useState(hoje.slice(0,7)), mes = mm[0], setMes = mm[1];
  var feitos = (s.internos||[]).filter(function(x){ return x.status==="acertado"; }).map(function(x){
    // 10/11/2026 (Marcus: "tem que aparecer os atendimentos de hoje todos"): sem o registro completo (computador ainda com tela antiga), usa o acerto guardado no próprio atendimento e os pagamentos enviados ao financeiro
    var reg = (s.acertosConsignado||[]).find(function(a){ return a.internoId===x.id; }), lfC = (s.lancFin||[]).find(function(l){ return l.internoId===x.id; });
    var r = reg || Object.assign({}, x.acerto || {}, {pagamentos:(lfC ? lfC.linhas.filter(function(l){ return l.tipo==="pagamento" && !l.isento; }).map(function(l){ return {forma:l.forma, valor:l.valor, descricao:(l.partes||[]).map(function(q){ return q.descricao; }).join(" + ")}; }) : [])});
    var pag = (r.pagamentos||[]).reduce(function(t,p){ return t+(p.valor||0); }, 0);
    return {x:x, r:r, lf:lfC || null, pag:pag, dur:x.inicioTs && x.fimTs ? Math.max(1, Math.round((x.fimTs-x.inicioTs)/60000)) : null}; });
  var meses = feitos.map(function(f){ return (f.x.data||"").slice(0,7); }).concat([mes]).filter(function(m,i,a){ return m && a.indexOf(m)===i; }).sort().reverse();
  var doMes = feitos.filter(function(f){ return (f.x.data||"").slice(0,7)===mes; })
    .sort(function(a,c){ return (c.x.data+(c.x.hora||"")).localeCompare(a.x.data+(a.x.hora||"")); });
  var somaForma = function(r, k){ var v = (r.pagamentos||[]).filter(function(p){ return p.forma===k; }).reduce(function(t,p){ return t+(p.valor||0); }, 0); return v>0 ? v : null; };
  var linhas = doMes.map(function(f){ var x = f.x, r = f.r, lf = f.lf;
    var links = []; if(lf) lf.linhas.forEach(function(l){ (l.partes||[]).forEach(function(q){ if(q.comprovante) links.push({c:q.descricao||"Comprovante", u:q.comprovante.url}); (q.extras||[]).forEach(function(x,k){ links.push({c:(q.descricao||"Comprovante")+" "+(k+2), u:x.url}); }); }); });
    // só acerto com valor a pagar precisa de lançamento no financeiro; reposição, brinde e novo kit não têm pagamento ("Não se aplica") e não são erro
    var tp = x.tipo || "acerto", precisa = tp==="acerto" && (r.valorAcerto||0)>0.009;
    var fin = lf ? (lf.conferido ? "Conferido" : "Em conferência") : precisa ? "Sem lançamento" : "Não se aplica";
    return {id:x.id, data:x.data, hora:x.hora || "—", nome:x.nome, tipo:TIPO[tp]||tp, venda:r.vendaLiquida!=null ? r.vendaLiquida : null, pct:r.comissaoPct!=null ? r.comissaoPct : null, acerto:r.valorAcerto!=null ? r.valorAcerto : null, pago:f.pag, f_dinheiro:somaForma(r,"dinheiro"), f_pix:somaForma(r,"pix"), f_link:somaForma(r,"link"), f_credito:somaForma(r,"credito"), f_debito:somaForma(r,"debito"), f_acerto_loja:somaForma(r,"acerto_loja"),
      fin:fin, _links:links, bipou:primeiro(x.bipou), atendeu:primeiro(x.atendeu), kit:x.kitNovo ? "Sim" : "Não",
      continua:x.continua ? (CONTINUA[x.continua]||x.continua)+(x.continua==="sim" && x.novaCond ? " · nova "+x.novaCond : "")+(x.continua==="outro_dia" && x.renovaDia ? " · "+x.renovaDia.split("-").reverse().join("/") : "") : "—",
      inicio:x.inicioTs ? hm(x.inicioTs) : (x.chegada || "—"), fim:x.fimTs ? hm(x.fimTs) : "—", dur:f.dur, _x:x}; });
  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("label",{className:"flex items-center gap-1.5 text-[13px] font-semibold"}, "Mês", e("select",{value:mes, "aria-label":"Mês", onChange:function(ev){ setMes(ev.target.value); }, className:"h-8 cursor-pointer rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]"}, meses.map(function(m){ return e("option",{key:m, value:m}, nomeMes(m)); }))));
  var din = function(v){ return v==null ? "—" : BK(v); };
  var cols = [{k:"data", t:"Data", data:true}, {k:"hora", t:"Hora"}, {k:"nome", t:"Revendedora"}, {k:"tipo", t:"Tipo", render:function(v){ return selo(v, COR_TIPO[v]); }},
    {k:"venda", t:"Venda", fmt:din, render:din}, {k:"pct", t:"Comissão %", fmt:function(v){ return v==null ? "—" : v+"%"; }, render:function(v){ return v==null ? "—" : v+"%"; }},
    {k:"acerto", t:"Valor do acerto", fmt:din, render:din}, {k:"pago", t:"Valor pago", fmt:din, render:din},
    ].concat(FORMAS.map(function(fm){ return {k:"f_"+fm[0], t:fm[1], fmt:din, render:din}; }), [
    {k:"fin", t:"Financeiro", render:function(v){ return selo(v, COR_FIN[v]); }},
    {k:"_links", t:"Comprovantes", fmt:function(v){ return v && v.length ? v.length+" anexado"+(v.length>1 ? "s" : "") : "—"; }, render:function(v){ return v && v.length ? e("span",{className:"flex flex-wrap items-center justify-center gap-x-2"}, v.map(function(k, i){ return e("a",{key:i, href:k.u, target:"_blank", rel:"noreferrer", title:k.c, onClick:function(ev){ ev.stopPropagation(); }, className:"underline"}, "Ver "+(i+1)); })) : "—"; }},
    {k:"bipou", t:"Quem bipou"}, {k:"atendeu", t:"Quem atendeu"}, {k:"kit", t:"Levou kit novo"},
    {k:"continua", t:"Continua?"},
    {k:"inicio", t:"Início"}, {k:"fim", t:"Fim (bipagem)"}, {k:"dur", t:"Duração", fmt:function(v){ return v==null ? "—" : v+" min"; }, render:function(v){ return v==null ? "—" : v+" min"; }}]);
  var cabAcima = [[{t:"Atendimento", span:8}, {t:"Pagamentos", span:FORMAS.length}, {t:"Financeiro e atendimento", span:9}]];
  // linha de TOTAL no fim da tabela (do que está filtrado): venda, % de comissão (média pela venda), valor do acerto e valor pago
  var rodape = function(ls){ var tv = ls.reduce(function(t,l){ return t+(l.venda||0); }, 0), ta = ls.reduce(function(t,l){ return t+(l.acerto||0); }, 0), tp = ls.reduce(function(t,l){ return t+(l.pago||0); }, 0);
    var tpct = tv>0 ? ls.reduce(function(t,l){ return t+(l.venda||0)*(l.pct||0); }, 0)/tv : null;
    return ["Total", "", ls.length+(ls.length===1 ? " atendimento" : " atendimentos"), "", BK(tv), tpct!=null ? N1(tpct)+"%" : "—", BK(ta), BK(tp)].concat(FORMAS.map(function(fm){ var s2 = ls.reduce(function(t,l){ return t+(l["f_"+fm[0]]||0); }, 0); return s2>0 ? BK(s2) : "—"; }), ["", "", "", "", "", "", "", "", ""]); };
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Consolidado Sorelly", compacto:true, dir:String(linhas.length)}, faixa,
      linhas.length===0 ? e("p",{className:"py-6 text-center text-[13px]"}, "Nenhum atendimento interno feito em "+nomeMes(mes)+".")
        : e(TabelaPlanilha,{key:mes, cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:true, semContagem:true, totalRodape:rodape, cabAcima:cabAcima, limite:50, paginas:true})));
}

export { AbaConsolidadoInterno };
