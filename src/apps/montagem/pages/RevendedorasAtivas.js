// Sorelly Admin · montagem — pages/RevendedorasAtivas.js
// Setor "Revendedoras" (base de todos os setores): quem tem condicional aberto com previsão de devolução em 2026, lido da DevMaster (só leitura, servidor: src/server/revendedoras.js).
// Lista no estilo da DevMaster/planilha, UMA tabela só (sem páginas), centralizada, com linhas finas e a linha TOTAL DO FILTRO acima do cabeçalho; filtro e ordem NA coluna; botão para agrupar por representante.
// Em cima (Marcus, 26/10/2026): 4 blocos com listas (Revendedoras por representante, Condicionais por tipo, Médias, Devolução), abas por tipo e bloco Filtros. Os números mudam com abas e filtros.
// Expositores (26/10/2026): a lista traz também as condicionais com previsão no ano 3000 (expositor). "Todas" continua só com kits (2.105); abas Expositor e "Só expositor · sem kit" mostram os esquecidos; modelos agrupados (todos os "dois andares" juntos); média das 3 últimas vendas (dmach).
// Clicou na revendedora: abre a ficha em bloco inteiro (cadastro + condicionais da última para a primeira, com o tipo de cada uma). Decisões de 26/10/2026 em docs/DECISOES.md.
import { AbasTela, Botao, Bloco, BlocoFiltros, H, Segmentado, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { Faixa, Indicador, Pagina } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var hojeIso = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
var maisDias = function(n){ var d = new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
var SEM_PREV = "9999-99-99";
var classeDev = function(d){ var h = hojeIso(); return !d ? "sem" : d<h ? "vencida" : d<=maisDias(7) ? "7" : d<=maisDias(30) ? "30" : "depois"; };
var tipoCurto = function(x){ return /^Reposi/.test(x||"") ? "Reposição" : x==="Kit principal" ? "Principal" : x==="Kit novo" ? "Novo" : (x||"Outro"); };
var TIPOS = [["Principal","Kit principal"],["Novo","Kit novo"],["Reposição","Reposição"],["Encomenda","Encomenda"],["Expositor","Expositor"]];
// só o primeiro e o segundo nome (pula "de/da/do": "Ana da Silva" fica "Ana da Silva" = 3 palavras)
var doisNomes = function(n){ var w = String(n||"").trim().split(/\s+/); if(w[1]==="-") return w.join(" ");   // "Thalita - Sc", "Anne - Joinville": são representantes diferentes, ficam inteiros
  var k = (w.length>2 && /^(de|da|do|dos|das|e)$/i.test(w[1])) ? 3 : 2; return w.slice(0, k).join(" "); };
var fone = function(v){ var d = String(v||"").replace(/\D/g, ""); if(d.length>11 && d.slice(0, 2)==="55") d = d.slice(2); return d.length===11 ? "("+d.slice(0, 2)+") "+d.slice(2, 7)+"-"+d.slice(7) : d.length===10 ? "("+d.slice(0, 2)+") "+d.slice(2, 6)+"-"+d.slice(6) : String(v||""); };
var soma = function(l, k){ return l.reduce(function(tt, x){ return tt+(x[k]||0); }, 0); };
var norm = function(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var rs = function(v){ return "R$ "+Math.round(v||0).toLocaleString("pt-BR"); };
var dec = function(v){ return (Math.round((v||0)*100)/100).toLocaleString("pt-BR"); };
var MES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
var rotuloMes = function(k){ return MES_ABREV[Number(k.slice(5))-1]+"/"+k.slice(0, 4); };
var ultimosMeses = function(n){ var d = new Date(), o = []; for(var i = 0; i<n; i++){ o.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")); d.setDate(1); d.setMonth(d.getMonth()-1); } return o; };
var pct1 = function(v){ return v==="" || v===null || v===undefined ? "" : (Math.round(v*10)/10).toLocaleString("pt-BR")+"%"; };
var diasDe = function(iso){ return Math.max(0, Math.round((Date.now()-new Date(iso+"T12:00:00"))/86400000)); };
var tempoTxt = function(d){ return d<60 ? d+" dias" : Math.floor(d/30)+" meses"; };
// Itens que vêm dentro das condicionais de expositor mas NÃO são expositor: mini displays e cubos (com algumas revendedoras) e peças de joia de verdade. Ficam fora da tela (registrado em DECISOES.md).
var IGNORAR = ["Display e cubo", "Peças de joia"];
var ROT_TIPO = {Principal:"Principal", Novo:"Kit novo", "Reposição":"Reposição", Encomenda:"Encomenda", Expositor:"Expositor"};
var dm = function(iso){ return iso>=SEM_PREV ? "Sem previsão" : iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(0,4); };
var REP_COLS = [{k:"repCod", t:"Cód."}, {k:"representante", t:"Representante"}, {k:"n", t:"Revendedoras ativas"}, {k:"atrasadas", t:"Atrasadas"}, {k:"novos", t:"Kits novos"}, {k:"reposicoes", t:"Reposições"}, {k:"valor", t:"Valor em aberto", fmt:function(v){ return brl(v); }}];
// Aba 1 (Cadastro): só os dados da cliente. Aba 2 (Kits e vendas): identificação + kits, datas e vendas. Aba 3: Contas a receber.
var idadeDe = function(n){ if(!n || n<"1900") return ""; var h = new Date(), d = new Date(n+"T12:00:00"), a = h.getFullYear()-d.getFullYear(); if(h.getMonth()<d.getMonth() || (h.getMonth()===d.getMonth() && h.getDate()<d.getDate())) a--; return a>=14 && a<=100 ? a : ""; };
var casaTxt = function(d){ var m = Math.floor(d/30.44); return m<1 ? "Menos de 1 mês" : m<24 ? m+(m===1 ? " mês" : " meses") : Math.floor(m/12)+" anos"+(m%12 ? " e "+(m%12)+(m%12===1 ? " mês" : " meses") : ""); };
var faixaDe = function(i){ return i==="" ? "" : i<=25 ? "Até 25 anos" : i<=35 ? "26 a 35 anos" : i<=45 ? "36 a 45 anos" : "46 anos ou mais"; };
var FAIXAS = ["Até 25 anos", "26 a 35 anos", "36 a 45 anos", "46 anos ou mais"];
var COLS_CAD = [{k:"repCod", t:"Cód."}, {k:"representante", t:"Representante", max:150}, {k:"nome", t:"Revendedora", max:200}, {k:"idade", t:"Idade", fmt:function(v){ return v==="" ? "—" : v; }}, {k:"faixa", t:"Faixa etária", fmt:function(v){ return v || "—"; }}, {k:"nasc", t:"Nascimento", fmt:function(v){ return v ? dia(v) : "—"; }}, {k:"celular", t:"Celular"}, {k:"email", t:"E-mail", max:220, fmt:function(v){ return v || "—"; }},
  {k:"cidadeUf", t:"Cidade / UF", max:160}, {k:"bairro", t:"Bairro", max:150, fmt:function(v){ return v || "—"; }}, {k:"cep", t:"CEP", fmt:function(v){ return v || "—"; }}, {k:"cadastro", t:"Cadastro", fmt:function(v){ return v ? dia(v) : "—"; }}, {k:"casaDias", t:"Tempo de casa", fmt:function(v){ return v==="" ? "—" : casaTxt(v); }}, {k:"situacao", t:"Situação", cor:function(l){ return l.situacao==="Ativa" ? "text-success" : ""; }}];
var COLUNAS = [{k:"repCod", t:"Cód."}, {k:"representante", t:"Representante", max:150}, {k:"nome", t:"Revendedora", max:170}, {k:"situacao", t:"Situação", cor:function(l){ return l.situacao==="Ativa" ? "text-success" : ""; }},
  {k:"kitData", t:"Data do kit", fmt:function(v){ return dm(v); }},
  {k:"kitPrev", t:"Data prevista de acerto", fmt:dm, cor:function(l){ return l.kitPrev==="" || l.kitPrev>=SEM_PREV ? "" : l.kitPrev<hojeIso() ? "text-destructive font-semibold" : l.kitPrev<=maisDias(7) ? "text-warning font-semibold" : ""; }},
  {k:"cond", t:"Condicionais"}, {k:"pecas", t:"Peças", fmt:inteiro}, {k:"valor", t:"Valor total", fmt:function(v){ return brl(v); }}, {k:"devolucao", t:"Devolução", fmt:dm, cor:function(l){ return l.devolucao>=SEM_PREV ? "" : l.devolucao<hojeIso() ? "text-destructive font-semibold" : l.devolucao<=maisDias(7) ? "text-warning font-semibold" : ""; }}, {k:"tipo", t:"Tipo", max:150},
  {k:"expUn", t:"Expositores"}, {k:"expModelos", t:"Modelos de expositor", max:200},
  {k:"expDias", t:"Tempo com expositor", fmt:tempoTxt, cor:function(l){ return l.expDias==="" ? "" : l.expDias>365 ? "text-destructive font-semibold" : l.expDias>180 ? "text-warning font-semibold" : ""; }},
  {k:"mediaVendas", t:"Média das 3 últimas vendas", fmt:function(v, l){ return brl(v)+(l && l.nVendas<3 ? " ("+l.nVendas+(l.nVendas===1 ? " venda)" : " vendas)") : ""); }, cor:function(l){ return l.mediaVendas===0 ? "text-destructive" : ""; }}];
var ITEM_COLS = [{k:"condicional", t:"Condicional"}, {k:"grupo", t:"Grupo"}, {k:"modelo", t:"Modelo", max:320}, {k:"codigo", t:"Código"}, {k:"qtd", t:"Quantidade"}, {k:"valor", t:"Valor unitário", fmt:function(v){ return brl(v); }}];
var dia = function(s){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; };
var Campo = function(rotulo, valor, largo){ return e("div",{className:"min-w-0 break-words "+(largo ? "col-span-full" : "")}, e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-muted-foreground"}, rotulo), e("div",{className:"text-[13px]"}, valor || "—")); };
var th = "h-[30px] whitespace-nowrap border-b border-border bg-white/5 px-2.5 text-left text-[11px] font-medium uppercase tracking-[.05em]";
var td = "h-8 whitespace-nowrap border-b border-border px-2.5 text-[13px]";

// Ficha (Marcus, 26/10/2026): 4 blocos com listas (Em condicional, Acerto, Devolução, Cadastro) e UMA tabela com todas as condicionais, TOTAL acima do cabeçalho, centralizada, linhas finas.
// Previsão de acerto = a próxima previsão de devolução (a DevMaster não traz outra data de acerto); horário agendado e último acerto ainda não estão ligados.
var HIST_COLS = [{k:"codigo", t:"Condicional"}, {k:"emissao", t:"Emissão", fmt:function(v){ return dm(v); }}, {k:"tipo", t:"Tipo", max:150}, {k:"situacao", t:"Situação", cor:function(l){ return l.situacao==="Aberta" ? "text-warning" : ""; }}, {k:"vendedor", t:"Vendedor", max:150},
  {k:"pecas", t:"Peças", fmt:inteiro}, {k:"valor", t:"Valor", fmt:function(v){ return brl(v); }}, {k:"vendido", t:"Vendido", fmt:function(v){ return brl(v); }}, {k:"retornado", t:"Retornado", fmt:function(v){ return brl(v); }}, {k:"saldo", t:"Saldo", fmt:function(v){ return brl(v); }},
  {k:"prev", t:"Previsão de devolução", fmt:dm, cor:function(l){ return l.situacao!=="Aberta" || l.prev>=SEM_PREV ? "" : l.prev<hojeIso() ? "text-destructive font-semibold" : l.prev<=maisDias(7) ? "text-warning font-semibold" : ""; }},
  {k:"fechamento", t:"Fechamento", fmt:function(v){ return dm(v); }}, {k:"acerto", t:"Data do acerto", fmt:function(v){ return dm(v); }}, {k:"agenda", t:"Agenda"}, {k:"obs", t:"Observação", max:260}];
var VEND_COLS = [{k:"codigo", t:"Venda"}, {k:"emissao", t:"Emissão", fmt:function(v){ return dm(v); }}, {k:"situacao", t:"Situação", cor:function(l){ return l.situacao==="Cancelada" ? "text-destructive" : ""; }}, {k:"representante", t:"Representante", max:170},
  {k:"venda", t:"Venda bruta (DevMaster)", fmt:function(v){ return brl(v); }}, {k:"brinde", t:"Brindes", fmt:function(v){ return brl(v); }}, {k:"troca", t:"Trocas", fmt:function(v){ return brl(v); }}, {k:"indicacao", t:"Indicação", fmt:function(v){ return brl(v); }}, {k:"premiacao", t:"Premiação", fmt:function(v){ return brl(v); }},
  {k:"liquida", t:"Venda sem brinde", fmt:function(v){ return brl(v); }}, {k:"pct", t:"% de brinde", fmt:pct1}, {k:"comissao", t:"Comissão", fmt:function(v){ return brl(v); }}, {k:"acrescimo", t:"Acréscimo", fmt:function(v){ return brl(v); }}, {k:"acerto", t:"Valor do acerto", fmt:function(v){ return brl(v); }}, {k:"pagamento", t:"Pagamento"}];
// Ficha em formato de CADASTRO (Marcus, 27/10/2026): seções com campos rotulados, como um sistema de cadastro; nada de blocos dourados. Cadastro, situação do kit, condicionais, vendas por mês, modelos de expositor e observações.
function Ficha(p){
  var sv = useState("cond"), vista = sv[0], setVista = sv[1];
  var f = p.ficha, cs = f.condicionais || [], hoje = hojeIso(), n = cs.length;
  var vTot = soma(cs, "valor"), pTot = soma(cs, "pecas"), sTot = soma(cs, "saldo");
  var dias = function(d){ return Math.round((new Date(d+"T12:00:00")-new Date(hoje+"T12:00:00"))/86400000); };
  var datas = cs.filter(function(c){ return c.previsao; }).map(function(c){ return c.previsao; }).sort(), prox = datas.filter(function(d){ return d>=hoje; })[0] || "", venc = datas.filter(function(d){ return d<hoje; });
  var corte90 = maisDias(-90), kitF = cs.filter(function(c){ return c.tipo!=="Expositor" && c.emissao && c.emissao>=corte90; }).sort(function(a, b){ return a.emissao.localeCompare(b.emissao); })[0];
  var unicos = function(l){ var o = []; l.forEach(function(x){ if(x && o.indexOf(x)<0) o.push(x); }); return o; };
  var vendas = f.vendas || [], mediaV = vendas.length ? soma(vendas, "v")/vendas.length : 0;
  var itensExp = [].concat.apply([], cs.map(function(c){ return (c.itens || []).map(function(i){ return i; }); }));
  var gExp = {}; itensExp.forEach(function(i){ if(IGNORAR.indexOf(i.g)<0) gExp[i.g] = (gExp[i.g] || 0)+i.q; });
  var expTxt = Object.keys(gExp).sort(function(a, b){ return gExp[b]-gExp[a]; }).map(function(g){ return g+" ×"+gExp[g]; }).join(" · ");
  var hist = (f.historico || []).map(function(h, k){ return Object.assign({id:h.codigo+"-"+k}, h, {prev:h.previsao || SEM_PREV}); });
  var vts = (f.vendasTodas || []).map(function(v, k){ return Object.assign({id:v.codigo+"-"+k}, v, {pct:(v.liquida>0 && v.brinde!==null) ? v.brinde/v.liquida*100 : ""}); });
  var itens = [].concat.apply([], cs.map(function(c){ return (c.itens || []).map(function(i, k){ return {id:c.codigo+"-"+k, condicional:c.codigo, grupo:i.g, modelo:i.m, codigo:i.c, qtd:i.q, valor:i.v}; }); }));
  // card somente leitura (não parece formulário): rótulo e valor em texto. Edição só para acesso restrito (ainda não existe edição aqui).
  var D = function(rot, val, cor){ return [e("dt",{key:"r"+rot, className:"text-[13px]"}, rot), e("dd",{key:"v"+rot, className:"min-w-0 break-words text-[13px] font-medium "+(cor || "")}, val || "—")]; };
  var Col = function(titulo, linhas, borda){ return e("div",{className:"min-w-0 px-4 py-3 "+(borda ? "md:border-l md:border-border" : "")}, e("div",{className:"mb-1.5 text-[11px] font-semibold uppercase tracking-[.05em]", style:{color:"#f5d68a"}}, titulo), e("dl",{className:"grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1"}, linhas)); };
  var rs26 = f.resumo2026, bst = f.brinde || {}, anoF = new Date().getFullYear();
  var vendasLinhas = rs26 ? [].concat(D("Vendas fechadas", inteiro(rs26.n)), D("Venda sem brinde", brl(rs26.liquida)), D("Brindes", brl(rs26.brinde)), D("% de brinde", pct1(rs26.liquida>0 ? rs26.brinde/rs26.liquida*100 : "")), D("Trocas", brl(rs26.troca)), D("Indicação", brl(rs26.indicacao)), D("Premiação", brl(rs26.premiacao)),
    D("Média das 3 últimas vendas", vendas.length ? brl(mediaV) : "Nenhuma venda"), D("Última venda", vendas.length ? dm(vendas[0].d) : "")) : D("Vendas", bst.pronto===false ? "Calculando os brindes… "+bst.pct+"%" : "Sem dados");
  var copiar = function(){ var tx = f.nome+" · cód. "+f.cod+" · "+doisNomes(f.representante)+"\n"+n+" condicionais abertas · "+inteiro(pTot)+" peças · "+brl(vTot)+"\nPróxima devolução: "+(prox ? dm(prox) : "—");
    try{ navigator.clipboard.writeText(tx); }catch(x){} };
  var opVista = [["cond", "Condicionais · "+inteiro(hist.length)], ["vendas", "Vendas · "+inteiro(vts.length)]].concat(itens.length ? [["exp", "Expositores · "+inteiro(itens.length)]] : []);
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-end gap-2"}, e(Botao,{onClick:copiar}, "Copiar resumo"), e(Botao,{onClick:p.aoVoltar, principal:true}, "Voltar à lista")),
    e("section",{className:"overflow-hidden rounded-xl border border-border bg-card/60"},
      e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2", style:{background:"rgba(184,134,43,.15)"}},
        e("div",{className:"min-w-0"}, e("h2",{className:"inline text-[16px] font-semibold"}, f.nome), e("span",{className:"text-[13px]"}, "  ·  Cód. "+f.cod)),
        e("div",{className:"flex items-center gap-2"}, e("span",{className:"rounded-full px-2.5 py-0.5 text-[13px] font-medium "+(f.situacaoCadastro==="Ativa" ? "bg-success/20 text-success" : "bg-white/10")}, f.situacaoCadastro || "—"),
          e("span",{title:"Só quem tem acesso restrito pode alterar o cadastro", className:"rounded-md border border-border px-2 py-0.5 text-[13px]"}, "🔒 Edição restrita"))),
      e("div",{className:"grid grid-cols-1 md:grid-cols-4"},
        Col("Quem é", [].concat(D("Representante", (f.repCod ? f.repCod+" · " : "")+doisNomes(f.representante)), D("Cadastro", f.cadastradaEm ? dm(f.cadastradaEm) : ""), D("Endereço", f.endereco), D("Bairro", f.bairro), D("Cidade", f.cidade ? f.cidade+" / "+f.uf : ""), D("CEP", f.cep), D("Nome fantasia", f.fantasia))),
        Col("Contato", [].concat(D("Celular", fone(f.celular)), D("WhatsApp", fone(f.whatsapp)), D("Telefone", fone(f.telefone)), D("E-mail", f.email), D("Instagram", f.instagram)), true),
        Col("Kit", [].concat(D("Data do kit", kitF ? dm(kitF.emissao) : ""), D("Acerto previsto", kitF ? (kitF.previsao ? dm(kitF.previsao)+(dias(kitF.previsao)>=0 ? " · em "+dias(kitF.previsao)+" dias" : " · venceu há "+Math.abs(dias(kitF.previsao))+" dias") : "Sem previsão") : "", kitF && kitF.previsao ? (dias(kitF.previsao)<0 ? "text-destructive" : dias(kitF.previsao)<=7 ? "text-warning" : "") : ""),
          D("Condicionais abertas", inteiro(n)+" · "+inteiro(pTot)+" peças"), D("Valor em condicional", brl(vTot)), D("Saldo a devolver", brl(sTot)), D("Expositor", expTxt), D("Vendedores", unicos(cs.map(function(c){ return c.vendedor; })).join(" · "))), true),
        Col("Vendas de "+anoF, vendasLinhas, true))),
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"}, e(Segmentado,{opcoes:opVista, atual:vista, onMudar:setVista}),
      e("span",{className:"text-[13px]"}, vista==="cond" ? "Todas as condicionais que ela já teve, da última para a primeira" : vista==="vendas" ? "Todas as vendas (acertos), da última para a primeira" : "Modelos de expositor com ela")),
    vista==="cond" && e(TabelaPlanilha,{key:"h", cols:HIST_COLS, linhas:hist, chave:"id", centro:true,
      totalLinha:function(ls){ return [{span:5, t:"TOTAL · "+inteiro(ls.length)+(ls.length===1 ? " condicional" : " condicionais")}, inteiro(soma(ls, "pecas")), brl(soma(ls, "valor")), brl(soma(ls, "vendido")), brl(soma(ls, "retornado")), brl(soma(ls, "saldo")), {span:5, t:""}]; }, vazio:"Nenhuma condicional encontrada."}),
    vista==="vendas" && e(TabelaPlanilha,{key:"v", cols:VEND_COLS, linhas:vts, chave:"id", centro:true,
      totalLinha:function(ls){ var ok = ls.filter(function(x){ return x.situacao!=="Cancelada"; }), com = ok.filter(function(x){ return x.liquida!==null && x.liquida!==undefined; }), liq = soma(com, "liquida"), bri = soma(com, "brinde");
        return [{span:4, t:"TOTAL DE 2026 · "+inteiro(com.length)+(com.length===1 ? " venda" : " vendas")}, brl(soma(com, "venda")), brl(soma(com, "brinde")), brl(soma(com, "troca")), brl(soma(com, "indicacao")), brl(soma(com, "premiacao")), brl(liq), pct1(liq>0 ? bri/liq*100 : ""), brl(soma(com, "comissao")), brl(soma(com, "acrescimo")), brl(soma(com, "acerto")), ""]; }, vazio:"Nenhuma venda encontrada."}),
    vista==="exp" && e(TabelaPlanilha,{key:"x", cols:ITEM_COLS, linhas:itens, chave:"id", centro:true, totalLinha:function(ls){ return [{span:4, t:"TOTAL · "+inteiro(ls.length)+(ls.length===1 ? " modelo" : " modelos")}, inteiro(soma(ls, "qtd")), ""]; }, vazio:""}));
}

// bloco com borda dourada: título pequeno + total em cima, lista dentro (mesmo desenho do Direcionar pagamento)
function Painel(p){
  return e("section",{className:"flex h-full min-w-0 flex-col overflow-hidden rounded-lg border-2 border-[#d9a63a]/85 bg-card/60"},
    e("div",{className:"border-b border-border bg-[#B8862B]/20 px-2 py-1 text-center"}, e("div",{className:"truncate text-[11px] font-medium uppercase tracking-[.05em]", style:{color:"#f5d68a"}}, p.t), e("div",{className:"truncate text-[18px] font-medium tabular-nums "+(p.cor||"")}, p.v)),
    e("div",{className:"flex flex-1 flex-col"+(p.corpoMin ? " min-h-[192px]" : "")}, p.children));
}
var Ln = function(cols, vals, cab, k, onClick, extra){ return e("div",{key:k, onClick:onClick, className:"grid min-h-8 items-center border-b border-border text-center text-[13px] last:border-b-0 "+(cab ? "bg-white/5 text-[11px] font-medium uppercase tracking-[.02em] " : "")+(onClick ? "cursor-pointer hover:bg-white/10 " : "")+(extra || ""), style:{gridTemplateColumns:cols}},
  vals.map(function(v, i){ return e("span",{key:i, className:"min-w-0 truncate px-1 tabular-nums", title:typeof v==="string" ? v : undefined}, v); })); };

var SEL = H+" rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
// seleção compacta sem rótulo em cima: a primeira opção é o próprio nome do filtro
var Sel = function(nome, valor, opcoes, onChange, aria, ouro){ var ops = [["", nome]].concat(opcoes.filter(function(o){ return o[0]!==""; }));
  return e("select",{key:nome, value:valor, "aria-label":aria, title:aria, onChange:function(ev){ onChange(ev.target.value); }, className:SEL+" max-w-[14rem] truncate "+(valor ? "border-primary text-primary " : "")+(ouro ? "border-[#B8862B]" : "")}, ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
var FIL0 = {q:"", rep:"", uf:"", sit:"", dev:"", nc:"", grupo:"", modelo:"", de:"", ate:""};
function RevendedorasTela(props){
  var aba = props.vista;
  var sd = useState(null), dados = sd[0], setDados = sd[1], se = useState(""), erro = se[0], setErro = se[1];
  var sg = useState(true), agrupar = sg[0], setAgrupar = sg[1];
  var sf = useState(null), ficha = sf[0], setFicha = sf[1], sc = useState(false), carregandoFicha = sc[0], setCarregandoFicha = sc[1];
  var st = useState("todas"), tab = st[0], setTab = st[1];
  var sfi = useState(FIL0), fil = sfi[0], setFil = sfi[1], svd = useState("ano"), vend = svd[0], setVend = svd[1], sbr = useState(false), vbr = sbr[0], setVbr = sbr[1], sct = useState(false), cidTodas = sct[0], setCidTodas = sct[1], sfc = useState({q:"", rep:"", sit:"", uf:"", fx:"", de:"", ate:""}), fc = sfc[0], setFc = sfc[1];
  var sv = useState(null), vis = sv[0], setVis = sv[1], sr = useState(false), todasRep = sr[0], setTodasRep = sr[1], sgb = useState({}), grAb = sgb[0], setGrAb = sgb[1];
  var carrega = function(forcar){ setErro(""); chamar("GET", "/revendedoras"+(forcar ? "?atualizar=1" : "")).then(setDados).catch(function(x){ setErro(x.message); }); };
  useEffect(function(){ if(apiAtiva()) carrega(false); }, []);
  // enquanto a carga dos brindes não termina, pergunta de novo a cada 4 segundos (a lista já aparece com vendas brutas)
  useEffect(function(){ if(!dados || !dados.brinde || dados.brinde.pronto) return; var id = setTimeout(function(){ carrega(false); }, 4000); return function(){ clearTimeout(id); }; }, [dados]);   // eslint-disable-line react-hooks/exhaustive-deps
  var base = useMemo(function(){ return dados ? dados.itens.map(function(r){
    var conds = (r.conds || []).map(function(c){ var it = (c.it || []).filter(function(i){ return IGNORAR.indexOf(i.g)<0; }); return {t:tipoCurto(c.t), p:c.p, v:c.v, d:c.d, e:c.e || "", it:it, soDisplay:c.t==="Expositor" && (c.it || []).length>0 && it.length===0}; }).filter(function(c){ return !c.soDisplay; });
    var expC = conds.filter(function(c){ return c.t==="Expositor"; }), its = [].concat.apply([], expC.map(function(c){ return c.it; })), un = its.reduce(function(a, i){ return a+i.q; }, 0);
    var gr = {}; its.forEach(function(i){ gr[i.g] = (gr[i.g] || 0)+i.q; });
    var modelos = Object.keys(gr).sort(function(a, b){ return gr[b]-gr[a]; }).map(function(g){ return g+" ×"+gr[g]; }).join(" · ");
    var em = expC.map(function(c){ return c.e; }).filter(Boolean).sort()[0] || "", vs = r.vendas || null;
    // Data do kit = emissão da PRIMEIRA condicional (nunca expositor) dos últimos 90 dias; Data prevista de acerto = a previsão de devolução dessa mesma condicional, que já vem da DevMaster (emissão + cerca de 1 mês)
    var corte90 = maisDias(-90), kit = conds.filter(function(c){ return c.t!=="Expositor" && c.e && c.e>=corte90; }).sort(function(a, b){ return a.e.localeCompare(b.e); })[0];
    var tp = []; conds.forEach(function(c){ var n = ROT_TIPO[c.t] || c.t; if(tp.indexOf(n)<0) tp.push(n); });
    return {id:r.cod, repCod:r.repCod, representante:doisNomes(r.representante), repCompleta:r.representante, nome:r.nome, celular:fone(r.celular), cidadeUf:r.cidade ? r.cidade+" / "+r.uf : "", uf:r.uf, situacao:r.situacao || "",
      kitData:kit ? kit.e : "", kitPrev:kit ? (kit.d || SEM_PREV) : "", conds:conds, its:its, soExp:expC.length>0 && expC.length===conds.length, tipo:tp.join(" + "), expUn:un || "", expModelos:modelos, expDias:em ? diasDe(em) : "", mediaVendas:vs ? (vs.length ? soma(vs, "v")/vs.length : 0) : "", nVendas:vs ? vs.length : 0, vm:r.vm || {}, bm:r.bm || {}, nm:r.nm || {}, am:r.am || {}, nasc:r.nasc || "", idade:idadeDe(r.nasc), faixa:faixaDe(idadeDe(r.nasc)), cadastro:r.cadastro || "", casaDias:r.cadastro ? diasDe(r.cadastro) : "", email:r.email || "", instagram:r.instagram || "", bairro:r.bairro || "", cep:r.cep || "", app:!!r.app}; }) : []; }, [dados]);
  // linhas da tabela: aba + bloco Filtros; cada linha soma as condicionais que sobraram. "Todas" = só kits (sem expositor); Expositor e "Só expositor" mostram os expositores.
  // vendas por mês em colunas novas: "Últimos 3 meses" (os 3 meses do calendário) ou "Todos os meses" (tudo o que a DevMaster tem, até 24 meses)
  var mesesTodos = useMemo(function(){ var s = {}; if(dados) dados.itens.forEach(function(r){ Object.keys(r.vm || {}).forEach(function(k){ s[k] = 1; }); }); return Object.keys(s).sort().reverse(); }, [dados]);
  var anoAtual = new Date().getFullYear(), mesAtual = new Date().getMonth()+1;
  var mesesAno = []; for(var mm = 1; mm<=mesAtual; mm++) mesesAno.push(anoAtual+"-"+String(mm).padStart(2, "0"));   // jan até o mês atual, em ordem (da esquerda para a direita)
  var mesesVis = vend==="ano" ? mesesAno : vend==="3" ? ultimosMeses(3) : vend==="todos" ? mesesTodos : [];
  var colsVend = useMemo(function(){ var o = [], bri = function(v){ return v ? brl(v) : "—"; };
    if(vend==="ano") o.push({k:"v_ano", t:"Total vendido "+anoAtual, fmt:bri}, {k:"b_ano", t:"Brindes "+anoAtual, fmt:bri}, {k:"p_ano", t:"% de brinde", fmt:pct1}, {k:"n_ano", t:"Acertos "+anoAtual, fmt:function(v){ return v ? inteiro(v) : "—"; }}, {k:"a_ano", t:"Valor dos acertos "+anoAtual, fmt:bri});
    mesesVis.forEach(function(k){ o.push({k:"m_"+k, t:"Vendas "+rotuloMes(k), fmt:bri}); if(vbr) o.push({k:"bm_"+k, t:"Brinde "+rotuloMes(k), fmt:bri}); }); return o; }, [vend, vbr, mesesTodos]);   // eslint-disable-line react-hooks/exhaustive-deps
  var colsFinal = useMemo(function(){ return COLUNAS.concat(colsVend); }, [colsVend]);
  var repCols = useMemo(function(){ return REP_COLS.slice(0, 6).concat([{k:"cond", t:"Condicionais"}, {k:"pecas", t:"Peças", fmt:inteiro}, REP_COLS[6], {k:"expUn", t:"Expositores"}, {k:"mediaVendas", t:"Média das 3 últimas vendas", fmt:function(v){ return brl(v); }}], colsVend); }, [colsVend]);
  var tabEf = (fil.grupo || fil.modelo) && tab==="todas" ? "Expositor" : tab;
  var linhas = useMemo(function(){ var q = norm(fil.q), out = [];
    base.forEach(function(r){ var cs = tabEf==="todas" ? r.conds.filter(function(c){ return c.t!=="Expositor"; }) : tabEf==="so" ? (r.soExp ? r.conds : []) : r.conds.filter(function(c){ return c.t===tabEf; }); if(!cs.length) return;
      if(fil.rep && r.representante!==fil.rep) return; if(fil.uf && r.uf!==fil.uf) return; if(fil.sit && r.situacao!==fil.sit) return;
      if(fil.de && (!r.kitData || r.kitData<fil.de)) return; if(fil.ate && (!r.kitData || r.kitData>fil.ate)) return;
      if(q && norm(r.nome+" "+r.repCod+" "+r.celular+" "+r.representante).indexOf(q)<0) return;
      if(fil.nc==="1" && cs.length!==1) return; if(fil.nc==="2" && cs.length!==2) return; if(fil.nc==="3" && cs.length<3) return;
      if(fil.dev && !cs.some(function(c){ return classeDev(c.d)===fil.dev; })) return;
      if(fil.grupo && !r.its.some(function(i){ return i.g===fil.grupo; })) return; if(fil.modelo && !r.its.some(function(i){ return i.c===fil.modelo; })) return;
      var valor = soma(cs, "v"), ds = cs.map(function(c){ return c.d; }).filter(Boolean).sort();
      var linha = Object.assign({}, r, {cs:cs, cond:cs.length, pecas:soma(cs, "p"), valor:valor, media:valor/cs.length, devolucao:ds[0] || SEM_PREV}); mesesVis.forEach(function(k){ linha["m_"+k] = r.vm[k] || 0; linha["bm_"+k] = r.bm[k] || 0; });
      if(vend==="ano"){ linha.v_ano = mesesAno.reduce(function(tt, k){ return tt+(r.vm[k] || 0); }, 0); linha.b_ano = mesesAno.reduce(function(tt, k){ return tt+(r.bm[k] || 0); }, 0); linha.p_ano = linha.v_ano>0 ? linha.b_ano/linha.v_ano*100 : ""; linha.n_ano = mesesAno.reduce(function(tt, k){ return tt+(r.nm[k] || 0); }, 0); linha.a_ano = mesesAno.reduce(function(tt, k){ return tt+(r.am[k] || 0); }, 0); } out.push(linha); });
    return out; }, [base, tabEf, fil, vend, mesesTodos]);   // eslint-disable-line react-hooks/exhaustive-deps
  var porRepLinhas = useMemo(function(){ var m = {}, ordem = [], hoje = hojeIso();
    linhas.forEach(function(l){ var k = l.repCompleta; if(!m[k]){ m[k] = {id:k, repCod:l.repCod, representante:k, linhas:[]}; ordem.push(k); } m[k].linhas.push(l); });
    return ordem.map(function(k){ var g = m[k], ls = g.linhas, cs = [].concat.apply([], ls.map(function(l){ return l.cs; }));
      return Object.assign(g, {n:ls.length, atrasadas:ls.filter(function(l){ return l.cs.some(function(c){ return c.d && c.d<hoje; }); }).length, novos:cs.filter(function(c){ return c.t==="Novo"; }).length, reposicoes:cs.filter(function(c){ return c.t==="Reposição"; }).length, valor:soma(cs, "v"),
        cond:soma(ls, "cond"), pecas:soma(ls, "pecas"), expUn:soma(ls, "expUn"), mediaVendas:(function(){ var mv = ls.filter(function(x){ return x.mediaVendas!==""; }); return mv.length ? soma(mv, "mediaVendas")/mv.length : ""; })(),
        v_ano:soma(ls, "v_ano"), b_ano:soma(ls, "b_ano"), p_ano:soma(ls, "v_ano")>0 ? soma(ls, "b_ano")/soma(ls, "v_ano")*100 : "", n_ano:soma(ls, "n_ano"), a_ano:soma(ls, "a_ano")}, (function(){ var o = {}; mesesVis.forEach(function(k){ o["m_"+k] = soma(ls, "m_"+k); o["bm_"+k] = soma(ls, "bm_"+k); }); return o; })()); }); }, [linhas]);   // eslint-disable-line react-hooks/exhaustive-deps
  // expositores: grupos de modelos (dois andares juntos) e quem está com cada modelo; e os "só expositor" por tempo
  var exp = useMemo(function(){ var gs = {}, so = {a:{n:0, v:0}, b:{n:0, v:0}, c:{n:0, v:0}}, tot = 0;
    base.forEach(function(r){ r.its.forEach(function(i){ var g = gs[i.g] || (gs[i.g] = {nome:i.g, un:0, rev:{}, mod:{}}); g.un += i.q; g.rev[r.id] = 1; tot += i.q; var m = g.mod[i.c] || (g.mod[i.c] = {cod:i.c, nome:i.m, un:0, rev:{}}); m.un += i.q; m.rev[r.id] = 1; });
      if(r.soExp){ var d = r.expDias===""  ? 0 : r.expDias, k = d>365 ? "a" : d>180 ? "b" : "c"; so[k].n++; so[k].v += soma(r.conds, "v"); } });
    var lista = Object.keys(gs).map(function(k){ var g = gs[k]; return {nome:g.nome, un:g.un, rev:Object.keys(g.rev).length, mod:Object.keys(g.mod).map(function(c){ var m = g.mod[c]; return {cod:m.cod, nome:m.nome, un:m.un, rev:Object.keys(m.rev).length}; }).sort(function(a, b){ return b.un-a.un; })}; }).sort(function(a, b){ return (a.nome==="Outros")-(b.nome==="Outros") || b.un-a.un; });
    return {lista:lista, tot:tot, so:so, nSo:so.a.n+so.b.n+so.c.n}; }, [base]);
  var abre = function(l){ setCarregandoFicha(true); setErro(""); chamar("GET", "/revendedoras/"+l.id).then(function(f){ setFicha(f); setCarregandoFicha(false); }).catch(function(x){ setErro(x.message); setCarregandoFicha(false); }); };
  if(!apiAtiva()) return e(Pagina,null, e(PageHead,{t:"Revendedoras"}), e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));

  // números dos blocos: o que a tabela mostra agora (aba + filtros + filtros das colunas)
  var vl = vis || linhas, cs = [].concat.apply([], vl.map(function(l){ return l.cs; })), nCond = cs.length, vTot = soma(cs, "v"), pTot = soma(cs, "p"), nRev = vl.length;
  var porRep = {}; vl.forEach(function(l){ var o = porRep[l.representante] || (porRep[l.representante] = {n:0, c:0}); o.n++; o.c += l.cond; });
  var reps = Object.keys(porRep).sort(function(a, b){ return porRep[b].n-porRep[a].n || a.localeCompare(b, "pt-BR"); });
  var porTipo = TIPOS.map(function(x){ var q = cs.filter(function(c){ return c.t===x[0]; }); return {nome:x[1], n:q.length, p:soma(q, "p"), v:soma(q, "v")}; }).filter(function(x){ return x.n>0; });
  var dev = {vencida:0, "7":0, "30":0, depois:0, sem:0}; cs.forEach(function(c){ dev[classeDev(c.d)]++; });
  var contaTipo = function(k){ return base.reduce(function(tt, r){ return tt+r.conds.filter(function(c){ return c.t===k; }).length; }, 0); };
  var nKits = base.reduce(function(tt, r){ return tt+r.conds.filter(function(c){ return c.t!=="Expositor"; }).length; }, 0);
  var abas = [["todas", "Todas "+nKits.toLocaleString("pt-BR")]].concat(TIPOS.filter(function(x){ return x[0]!=="Expositor" && contaTipo(x[0])>0; }).map(function(x){ return [x[0], x[1]+" "+contaTipo(x[0]).toLocaleString("pt-BR")]; }))
    .concat([["Expositor", "Expositor "+contaTipo("Expositor").toLocaleString("pt-BR")], ["so", "Só expositor · sem kit "+exp.nSo]]);
  var opRep = [["", "Todas"]].concat(Array.from(new Set(base.map(function(r){ return r.representante; }))).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(x){ return [x, x]; }));
  var opUf = [["", "Todos"]].concat(Array.from(new Set(base.map(function(r){ return r.uf; }).filter(Boolean))).sort().map(function(x){ return [x, x]; }));
  var opSit = [["", "Todas"]].concat(Array.from(new Set(base.map(function(r){ return r.situacao; }).filter(Boolean))).sort().map(function(x){ return [x, x]; }));
  var opGrupo = [["", "Todos"]].concat(exp.lista.map(function(g){ return [g.nome, g.nome+" · "+inteiro(g.un)]; }));
  var opModelo = [["", "Todos"]].concat([].concat.apply([], exp.lista.map(function(g){ return g.mod.map(function(m){ return [m.cod, g.nome+" · "+m.nome+" ("+m.cod+") · "+inteiro(m.un)]; }); })));
  var mud = function(k){ return function(v){ var n = Object.assign({}, fil); n[k] = v; if(k==="grupo" && v) n.modelo = ""; if(k==="modelo" && v) n.grupo = ""; setFil(n); }; };
  var temFiltro = JSON.stringify(fil)!==JSON.stringify(FIL0);
  var G4 = "1.5fr .7fr .8fr .9fr";
  // linha TOTAL (primeira linha da tabela, acompanha abas, filtros e filtros de coluna): soma de tudo o que dá para somar
  var mediaDe = function(ls){ var mv = ls.filter(function(x){ return x.mediaVendas!==""; }); return mv.length ? brl(soma(mv, "mediaVendas")/mv.length) : ""; };
  var mesesTot = function(ls){ var o = []; if(vend==="ano"){ var sv = soma(ls, "v_ano"), sb = soma(ls, "b_ano"); o.push(brl(sv), brl(sb), pct1(sv>0 ? sb/sv*100 : ""), inteiro(soma(ls, "n_ano")), brl(soma(ls, "a_ano"))); }
    mesesVis.forEach(function(k){ o.push(brl(soma(ls, "m_"+k))); if(vbr) o.push(brl(soma(ls, "bm_"+k))); }); return o; };
  var totalRevs = function(ls){ return [{span:8, t:"TOTAL DO FILTRO · "+inteiro(ls.length)+(ls.length===1 ? " revendedora" : " revendedoras")}, inteiro(soma(ls, "cond")), inteiro(soma(ls, "pecas")), brl(soma(ls, "valor")), {span:2, t:""}, inteiro(soma(ls, "expUn")), "", "", mediaDe(ls)].concat(mesesTot(ls)); };
  var totalReps = function(rs2){ return [{span:2, t:"TOTAL DO FILTRO · "+inteiro(rs2.length)+(rs2.length===1 ? " representante" : " representantes")}, inteiro(soma(rs2, "n")), inteiro(soma(rs2, "atrasadas")), inteiro(soma(rs2, "novos")), inteiro(soma(rs2, "reposicoes")), inteiro(soma(rs2, "cond")), inteiro(soma(rs2, "pecas")), brl(soma(rs2, "valor")), inteiro(soma(rs2, "expUn")), mediaDe(rs2)].concat(mesesTot(rs2)); };

  // Aba 1: cadastro das clientes (todas as revendedoras da lista), só com os dados delas
  var cadLinhas = base.filter(function(r){ var q = norm(fc.q); if(fc.rep && r.representante!==fc.rep) return false; if(fc.sit && r.situacao!==fc.sit) return false; if(fc.uf && r.uf!==fc.uf) return false; if(fc.fx && r.faixa!==fc.fx) return false; if(fc.de && (!r.cadastro || r.cadastro<fc.de)) return false; if(fc.ate && (!r.cadastro || r.cadastro>fc.ate)) return false; return !q || norm(r.nome+" "+r.repCod+" "+r.celular+" "+r.representante+" "+r.cidadeUf).indexOf(q)>=0; });
  var mudC = function(k){ return function(v){ var n = Object.assign({}, fc); n[k] = v; setFc(n); }; };
  // Painel do alto da aba Cadastro (layout A, aprovado pelo Marcus em 27/10/2026): faixa de números + três listas. Acompanha os filtros da tabela.
  var painelCad = (function(){ var ls = cadLinhas, n = ls.length, ids = ls.filter(function(x){ return x.idade!==""; }), cs2 = ls.filter(function(x){ return x.casaDias!==""; });
    var cid = {}; ls.forEach(function(x){ var p = (x.cidadeUf || "").split(" / "), nome = p[0] || "Sem cidade", k = nome+"|"+(p[1] || ""); cid[k] = cid[k] || {nome:nome+(p[1] && p[1]!=="PR" ? " / "+p[1] : ""), n:0}; cid[k].n++; });
    var cidades = Object.keys(cid).map(function(k){ return cid[k]; }).sort(function(a, b){ return b.n-a.n || a.nome.localeCompare(b.nome, "pt-BR"); });
    var fx = FAIXAS.map(function(f){ return [f, ls.filter(function(x){ return x.faixa===f; }).length]; });
    var anos = function(x){ return x.casaDias/365.25; };
    var tc = [["Menos de 6 meses", function(a){ return a<.5; }], ["6 a 12 meses", function(a){ return a>=.5 && a<1; }], ["1 a 2 anos", function(a){ return a>=1 && a<2; }], ["2 a 3 anos", function(a){ return a>=2 && a<3; }], ["3 a 4 anos", function(a){ return a>=3 && a<4; }], ["4 a 5 anos", function(a){ return a>=4 && a<5; }], ["Mais de 5 anos", function(a){ return a>=5; }]]
      .map(function(q){ return [q[0], cs2.filter(function(x){ return q[1](anos(x)); }).length]; });
    var novas = ls.filter(function(x){ return x.cadastro && x.cadastro>=anoAtual+"-01-01"; }).length, doisAnos = cs2.filter(function(x){ return anos(x)>=2; }).length;
    var Lb = function(nome, v, tot, max, k){ return e("div",{key:k, className:"grid h-8 items-center gap-2 border-b border-border px-2 text-[13px] last:border-b-0", style:{gridTemplateColumns:"minmax(0,1.1fr) minmax(0,1fr) 6rem"}},
      e("span",{className:"truncate", title:nome}, nome), e("span",{className:"h-2 overflow-hidden rounded bg-white/10"}, e("span",{className:"block h-full rounded bg-[#d9a63a]", style:{width:(max ? v/max*100 : 0)+"%"}})), e("span",{className:"text-right tabular-nums"}, inteiro(v)+" · "+pct1(tot ? v/tot*100 : 0))); };
    var lista = function(a, tot){ var mx = Math.max.apply(null, a.map(function(x){ return x[1] || x.n || 0; }).concat([0])); return a.map(function(x, i){ var nome = x[0] || x.nome, v = x[1]!==undefined ? x[1] : x.n; return Lb(nome, v, tot, mx, nome+i); }); };
    var cidVis = cidTodas ? cidades : cidades.slice(0, 8);
    return e("div",{className:"flex flex-col gap-2.5"},
      e(Faixa,{n:6},
        e(Indicador,{t:"Revendedoras", v:inteiro(n), sub:inteiro(new Set(ls.map(function(x){ return x.repCod; })).size)+" representantes"}),
        e(Indicador,{t:"Idade média", v:ids.length ? Math.round(soma(ids, "idade")/ids.length)+" anos" : "—", sub:inteiro(ids.length)+" com nascimento"}),
        e(Indicador,{t:"Cidades", v:inteiro(cidades.length), sub:"maior: "+(cidades[0] ? cidades[0].nome : "—")}),
        e(Indicador,{t:"Tempo de casa", v:cs2.length ? casaTxt(soma(cs2, "casaDias")/cs2.length) : "—", sub:"média"}),
        e(Indicador,{t:"Novas em "+anoAtual, v:inteiro(novas), sub:pct1(n ? novas/n*100 : 0)+" do total"}),
        e(Indicador,{t:"Com 2 anos ou mais", v:inteiro(doisAnos), sub:pct1(cs2.length ? doisAnos/cs2.length*100 : 0)+" do total"})),
      e("div",{className:"grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]"},
        e(Painel,{t:"Cidades · % do total", v:inteiro(cidades.length)},
          lista(cidVis, n),
          cidades.length>8 && e("button",{type:"button", onClick:function(){ setCidTodas(!cidTodas); }, className:"h-8 w-full text-[13px] font-semibold text-primary hover:bg-white/10"}, cidTodas ? "Mostrar só as 8 maiores" : "Ver as "+cidades.length+" cidades")),
        e(Painel,{t:"Faixa etária", v:inteiro(ids.length)}, lista(fx, ids.length)),
        e(Painel,{t:"Tempo de casa", v:cs2.length ? casaTxt(soma(cs2, "casaDias")/cs2.length) : "—"}, lista(tc, cs2.length))));
  })();
  var cadastroView = e("div",{className:"flex flex-col gap-2.5"},
    painelCad,
    e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2"},
      e("input",{type:"search", value:fc.q, placeholder:"Buscar nome, código, celular, cidade…", "aria-label":"Buscar revendedora", onChange:function(ev){ mudC("q")(ev.target.value); }, className:SEL+" min-w-[11rem] flex-1"}),
      Sel("Representante", fc.rep, opRep, mudC("rep"), "Representante"), Sel("Situação", fc.sit, opSit, mudC("sit"), "Situação"), Sel("UF", fc.uf, opUf, mudC("uf"), "UF"), Sel("Faixa etária", fc.fx, FAIXAS.map(function(x){ return [x, x]; }), mudC("fx"), "Faixa etária"),
      e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-muted-foreground"}, "Cadastro"), e("input",{type:"date", value:fc.de, "aria-label":"Cadastro, de", onChange:function(ev){ mudC("de")(ev.target.value); }, className:SEL}), e("input",{type:"date", value:fc.ate, "aria-label":"Cadastro, até", onChange:function(ev){ mudC("ate")(ev.target.value); }, className:SEL}),
      (fc.q || fc.rep || fc.sit || fc.uf || fc.fx || fc.de || fc.ate) && e("button",{type:"button", onClick:function(){ setFc({q:"", rep:"", sit:"", uf:"", fx:"", de:"", ate:""}); }, className:H+" rounded-md border border-border px-3 text-[13px] hover:bg-white/10"}, "Limpar")),
    e(TabelaPlanilha,{key:"cad", cols:COLS_CAD, linhas:cadLinhas, chave:"id", aoClicar:abre, centro:true,
      totalLinha:function(ls){ var ids = ls.filter(function(x){ return x.idade!==""; }); return [{span:3, t:"TOTAL DO FILTRO · "+inteiro(ls.length)+(ls.length===1 ? " revendedora" : " revendedoras")}, ids.length ? "Média "+Math.round(soma(ids, "idade")/ids.length) : "", {span:8, t:""}, (function(){ var cs2 = ls.filter(function(x){ return x.casaDias!==""; }); return cs2.length ? "Média "+casaTxt(soma(cs2, "casaDias")/cs2.length) : ""; })(), ""]; }, vazio:"Nenhuma revendedora com esses filtros."}));
  // Aba 3: ainda sem fonte dos pagamentos (regra do Marcus, 27/10/2026: venda com forma "Acerto com loja" = NÃO pagou)
  var receberView = e("p",{className:"rounded-lg border border-border bg-card/60 px-3 py-6 text-center text-[13px]"}, "Contas a receber: aguardando a ligação com os pagamentos da DevMaster. Regra já definida: venda com a forma Acerto com loja = não pagou.");

  return e(Pagina,null,
        erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro),
    ficha && e(Ficha,{ficha:ficha, aoVoltar:function(){ setFicha(null); }}),
    // a lista fica montada (escondida) enquanto a ficha está aberta: filtros e ordem não se perdem ao voltar
    e("div",{className:"flex flex-col gap-2.5 "+(ficha ? "hidden" : "")},
      !dados && !erro ? e("p",{className:"text-[13px]"}, "Carregando da DevMaster… (a primeira vez demora cerca de 30 segundos)")
      : dados && aba==="cadastro" ? cadastroView : dados && aba==="receber" ? receberView
      : dados ? e("div",{className:"flex flex-col gap-2.5"},
        e("div",{className:"grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(21rem,1fr))]"},
          e(Painel,{t:"Revendedoras", v:inteiro(nRev), corpoMin:true},
            Ln("1.1fr 1fr 1fr", ["Representante", "Revendedoras", "Condicionais"], true, "h"),
            (todasRep ? reps : reps.slice(0, 5)).map(function(k){ return Ln("1.1fr 1fr 1fr", [k, inteiro(porRep[k].n), inteiro(porRep[k].c)], false, k, function(){ mud("rep")(k); }); }),
            reps.length>5 && Ln("1fr", [e("button",{type:"button", onClick:function(){ setTodasRep(!todasRep); }, className:"h-8 w-full text-[13px] font-semibold text-primary hover:bg-white/10"}, todasRep ? "Mostrar só as 5 maiores" : "Ver todas as "+reps.length+" representantes")], false, "mais")),
          e(Painel,{t:"Condicionais por tipo", v:brl(vTot), corpoMin:true},
            Ln("1fr 1.25fr .8fr 1.2fr", ["Tipo", "Condicionais", "Peças", "Valor"], true, "h"),
            porTipo.map(function(x){ return Ln("1fr 1.25fr .8fr 1.2fr", [x.nome, inteiro(x.n), inteiro(x.p), rs(x.v)], false, x.nome); }),
            Ln("1fr 1.25fr .8fr 1.2fr", ["Total", inteiro(nCond), inteiro(pTot), rs(vTot)], false, "t")),
          e(Painel,{t:"Média por revendedora", v:nRev ? brl(vTot/nRev) : "R$ 0,00", corpoMin:true},
            Ln("1.6fr 1fr", ["Peças por revendedora", nRev ? dec(pTot/nRev) : "0"], false, "a"),
            Ln("1.6fr 1fr", ["Condicionais por revendedora", nRev ? dec(nCond/nRev) : "0"], false, "b"),
            Ln("1.6fr 1fr", ["Média das 3 últimas vendas", (function(){ var mv = vl.filter(function(l){ return l.mediaVendas!==""; }); return mv.length ? brl(soma(mv, "mediaVendas")/mv.length) : "—"; })()], false, "c"),
            Ln("1.6fr 1fr", ["Com 2 ou mais condicionais", inteiro(vl.filter(function(l){ return l.cond>1; }).length)], false, "d")),
          e(Painel,{t:"Devolução", v:inteiro(dev.vencida)+(dev.vencida===1 ? " vencida" : " vencidas"), cor:dev.vencida ? "text-destructive" : "", corpoMin:true},
            Ln("1.6fr 1fr", ["Vencem em 7 dias", e("span",{className:dev["7"] ? "font-semibold text-warning" : ""}, inteiro(dev["7"]))], false, "a"),
            Ln("1.6fr 1fr", ["Vencem em 30 dias", inteiro(dev["30"])], false, "b"),
            Ln("1.6fr 1fr", ["Depois de 30 dias", inteiro(dev.depois)], false, "c"),
            Ln("1.6fr 1fr", ["Sem previsão", inteiro(dev.sem)], false, "d")),
        ),
        (tabEf==="Expositor" || tabEf==="so") && e("div",{className:"grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]"},
          e(Painel,{t:"Expositores · grupos de modelos", v:inteiro(exp.tot)+" unidades", corpoMin:true},
            Ln(G4, ["Grupo", "Modelos", "Unidades", "Revendedoras"], true, "h"),
            [].concat.apply([], exp.lista.map(function(g){ var ab = !!grAb[g.nome];
              return [Ln(G4, [(ab ? "▾ " : "▸ ")+g.nome, inteiro(g.mod.length), inteiro(g.un), inteiro(g.rev)], false, g.nome, function(){ var n = Object.assign({}, grAb); if(ab) delete n[g.nome]; else n[g.nome] = true; setGrAb(n); }, g.nome==="Dois andares" ? "bg-[#B8862B]/20 font-semibold" : "")]
                .concat(ab ? g.mod.map(function(m){ return Ln(G4, [m.nome+" ("+m.cod+")", "—", inteiro(m.un), inteiro(m.rev)], false, g.nome+m.cod, function(){ var n = Object.assign({}, FIL0, fil, {modelo:m.cod, grupo:""}); setFil(n); }, "bg-black/30"); }) : []); }))),
          e(Painel,{t:"Só expositor · sem kit", v:inteiro(exp.nSo)+(exp.nSo===1 ? " revendedora" : " revendedoras"), cor:exp.nSo ? "text-destructive" : "", corpoMin:true},
            Ln("1.6fr 1fr 1.2fr", ["Tempo com o expositor", "Revendedoras", "Valor"], true, "h"),
            Ln("1.6fr 1fr 1.2fr", ["Mais de 1 ano", e("span",{className:exp.so.a.n ? "font-semibold text-destructive" : ""}, inteiro(exp.so.a.n)), rs(exp.so.a.v)], false, "a", function(){ setTab("so"); }),
            Ln("1.6fr 1fr 1.2fr", ["De 6 meses a 1 ano", e("span",{className:exp.so.b.n ? "font-semibold text-warning" : ""}, inteiro(exp.so.b.n)), rs(exp.so.b.v)], false, "b", function(){ setTab("so"); }),
            Ln("1.6fr 1fr 1.2fr", ["Menos de 6 meses", inteiro(exp.so.c.n), rs(exp.so.c.v)], false, "c", function(){ setTab("so"); }))),
        e(AbasTela,{abas:abas, atual:tabEf, onMudar:function(k){ setTab(k); if(fil.grupo || fil.modelo) setFil(Object.assign({}, fil, {grupo:"", modelo:""})); }}),
        dados.vendasMes && dados.vendasMes.length>0 && e(TabelaPlanilha,{key:"vm", centro:true, chave:"periodo", linhas:dados.vendasMes.map(function(x){ return Object.assign({}, x, {mes:rotuloMes(x.periodo), pct:x.venda>0 ? x.brinde/x.venda*100 : ""}); }),
          cols:[{k:"mes", t:"Mês (todas as vendas)"}, {k:"acertos", t:"Acertos", fmt:inteiro}, {k:"clientes", t:"Clientes", fmt:inteiro}, {k:"venda", t:"Vendas sem brinde", fmt:function(v){ return brl(v); }}, {k:"acerto", t:"Valor dos acertos", fmt:function(v){ return brl(v); }}, {k:"brinde", t:"Brindes", fmt:function(v){ return brl(v); }}, {k:"pct", t:"% de brinde", fmt:pct1}],
          totalLinha:function(ls){ var v = soma(ls, "venda"), b = soma(ls, "brinde"); return ["TOTAL DE "+anoAtual, inteiro(soma(ls, "acertos")), "", brl(v), brl(soma(ls, "acerto")), brl(b), pct1(v>0 ? b/v*100 : "")]; }}),
        dados.brinde && !dados.brinde.pronto && e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Calculando os brindes de 2026… "+(dados.brinde.pct || 0)+"% · enquanto isso as vendas abaixo ainda incluem os brindes"+(dados.brinde.erro ? " (erro: "+dados.brinde.erro+")" : "")),
        // Filtros (opção 3, 27/10/2026): UMA linha só, junto da tabela. UF e Condicionais ficam no filtro de cada coluna; Grupo e Modelo só nas abas de expositor.
        e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2"},
          e("input",{type:"search", value:fil.q, placeholder:"Buscar nome, código, celular…", "aria-label":"Buscar revendedora", onChange:function(ev){ mud("q")(ev.target.value); }, className:SEL+" min-w-[11rem] flex-1"}),
          Sel("Representante", fil.rep, opRep, mud("rep"), "Representante"), Sel("Situação", fil.sit, opSit, mud("sit"), "Situação"),
          e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-muted-foreground"}, "Data do kit"), e("input",{type:"date", value:fil.de, "aria-label":"Data do kit, de", onChange:function(ev){ mud("de")(ev.target.value); }, className:SEL}), e("input",{type:"date", value:fil.ate, "aria-label":"Data do kit, até", onChange:function(ev){ mud("ate")(ev.target.value); }, className:SEL}),
          Sel("Devolução", fil.dev, [["", "Devolução"], ["vencida", "Vencidas"], ["7", "Em 7 dias"], ["30", "Em 30 dias"], ["depois", "Depois de 30 dias"], ["sem", "Sem previsão"]], mud("dev"), "Devolução"),
          (tabEf==="Expositor" || tabEf==="so") && Sel("Grupo", fil.grupo, opGrupo, mud("grupo"), "Grupo de expositor", true),
          (tabEf==="Expositor" || tabEf==="so") && Sel("Modelo", fil.modelo, opModelo, mud("modelo"), "Modelo de expositor", true),
          Sel("Sem coluna de brindes", vbr ? "1" : "", [["1", "Brindes: coluna ao lado de cada mês"]], function(v){ setVbr(v==="1"); }, "Mostrar uma coluna de brinde ao lado de cada mês", true),
          Sel("Sem vendas por mês", vend, [["ano", "Vendas: todo o ano de "+anoAtual], ["3", "Vendas: últimos 3 meses"], ["todos", "Vendas: todos os meses"]], setVend, "Mostrar as vendas de cada mês em colunas novas", true),
          temFiltro && e("button",{type:"button", onClick:function(){ setFil(FIL0); }, className:H+" rounded-md border border-border px-3 text-[13px] hover:bg-white/10"}, "Limpar"),
          e("button",{type:"button", onClick:function(){ setAgrupar(!agrupar); }, "aria-pressed":agrupar, className:H+" whitespace-nowrap rounded-md border px-3 text-[13px] "+(agrupar ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border hover:bg-white/10")}, "Por representante"),
          e("button",{type:"button", title:"Atualizar da DevMaster", "aria-label":"Atualizar da DevMaster", onClick:function(){ setDados(null); carrega(true); }, className:H+" w-8 rounded-md border border-border text-[15px] hover:bg-white/10"}, "↻")),
        agrupar ? e(TabelaPlanilha,{key:"reps", cols:repCols, linhas:porRepLinhas, chave:"id", centro:true,
          onFiltradas:function(rs2){ setVis([].concat.apply([], rs2.map(function(x){ return x.linhas; }))); },
          totalLinha:totalReps,
          detalhe:function(rep){ return e(TabelaPlanilha,{cols:colsFinal, linhas:rep.linhas, chave:"id", aoClicar:abre, centro:true, totalLinha:totalRevs}); },
          vazio:"Nenhuma representante com esses filtros."})
        : e(TabelaPlanilha,{key:"revs", cols:colsFinal, linhas:linhas, chave:"id", aoClicar:abre, centro:true, onFiltradas:setVis,
          totalLinha:totalRevs,
          vazio:"Nenhuma revendedora com esses filtros."})) : null),
    carregandoFicha && e("p",{className:"text-[13px]"}, "Abrindo a ficha…"));
}
function AbaRevendedorasAtivas(){ return e(RevendedorasTela,{vista:"cadastro"}); }
function AbaRevendedorasKits(){ return e(RevendedorasTela,{vista:"kits"}); }
function AbaRevendedorasReceber(){ return e(RevendedorasTela,{vista:"receber"}); }
export { AbaRevendedorasAtivas, AbaRevendedorasKits, AbaRevendedorasReceber };
