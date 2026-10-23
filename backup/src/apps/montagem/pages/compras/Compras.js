// Sorelly Admin · montagem — pages/compras/Compras.js
// Telas de COMPRAS (setor Materiais e estoque, azul #3B82F6). São CORPOS de abas: uma tela com abas (escrita à parte) junta os três.
//   AbaCompraQuadro    indicadores clicáveis + filtros + kanban das compras (Solicitada → Aprovada → Liberada para compra → Efetuada → Recebida / Entregue, mais Reprovada e Cancelada)
//   AbaCompraPlanilha  tabela com filtros, total do filtro, paginação e exportar CSV
//   AbaCompraVisao     painel gerencial (dashboardCompras) em mosaico de blocos
// Regras e estado em domain/compras-estoque.js (s.ce, ações CE). Aqui só desenho e chamo as ações.
//
// MAPEAMENTO status do domínio → coluna do quadro (as 15 situações do domínio cabem em 7 colunas; a situação fina vira SELO no cartão):
//   Solicitada        = NAO_VERIFICADA · AGUARDANDO (selo "Em espera") · AGUARDANDO_ORCAMENTO (selo "Novo orçamento") · AGUARDANDO_AUTORIZACAO (selo "Aguard. autorização")
//   Aprovada          = APROVADA (falta o financeiro liberar) · AGUARDANDO_CNPJ (selo "Falta CNPJ") · AGUARDANDO_FORMA_PAGAMENTO (selo "Falta conta")
//   Liberada          = LIBERADA (o financeiro liberou: só OK ou já com o plano de pagamento; quem tem "Efetuar compras liberadas" compra)
//   Efetuada          = COMPRADA · EM_TRANSITO (selo "Em trânsito") · RECEBIDA_PARCIAL (selo "Parcial")
//   Recebida/Entregue = RECEBIDA · ENTREGUE (selo "Entregue")
//   Reprovada         = NEGADA          Cancelada = CANCELADA
// "Recebida parcial" fica como selo na coluna Efetuada (a compra só chega à coluna Recebida quando TODOS os itens chegaram).
// Mover/arrastar e "Concluir etapa ›" usam as mesmas operações do reducer: aprovar (ou autorizar), liberar, comprar, receber, negar, cancelar, e as janelas pedem os dados que a operação exige.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Abas, BarraFiltros, ESTADO, Faixa, LINHA, Mosaico, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { PAGAVEL_STATUS, ROTULO_STATUS, STATUS_PEDIDO, TRANSICOES, dashboardCompras, diasEntre, formatarDia, formatarHoras, formatarReais, hojeSP, listarPedidos, podeAcaoPedido } from "@/apps/montagem/domain/compras-estoque";
import { AZUL, Avatar, Bt, Ind, Selo, cnpjCurto, corTempo, diasNaEtapa, norm, textoDias, useCompras } from "@/apps/montagem/pages/compras/pecas";
import { useAcoes } from "@/apps/montagem/pages/compras/janelas";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useState } from "@/shared/react";

// ───────────── colunas e situações ─────────────
var COLUNAS = [
  {k:"solicitada", titulo:"Solicitada", cor:ESTADO.alerta},
  {k:"aprovada", titulo:"Aprovada", cor:AZUL},
  {k:"liberada", titulo:"Liberada para compra", cor:"#93C5FD"},
  {k:"efetuada", titulo:"Efetuada", cor:ESTADO.info},
  {k:"recebida", titulo:"Recebida / Entregue", cor:ESTADO.ok},
  {k:"reprovada", titulo:"Reprovada", cor:ESTADO.ruim},
  {k:"cancelada", titulo:"Cancelada", cor:ESTADO.neutro}];
var NOME_COL = {solicitada:"Solicitada", aprovada:"Aprovada", liberada:"Liberada para compra", efetuada:"Efetuada", recebida:"Recebida", reprovada:"Reprovada", cancelada:"Cancelada"};
var COL_DE = {NAO_VERIFICADA:"solicitada", AGUARDANDO:"solicitada", AGUARDANDO_ORCAMENTO:"solicitada", AGUARDANDO_AUTORIZACAO:"solicitada", APROVADA:"aprovada", AGUARDANDO_CNPJ:"aprovada", AGUARDANDO_FORMA_PAGAMENTO:"aprovada", LIBERADA:"liberada",
  COMPRADA:"efetuada", EM_TRANSITO:"efetuada", RECEBIDA_PARCIAL:"efetuada", RECEBIDA:"recebida", ENTREGUE:"recebida", NEGADA:"reprovada", CANCELADA:"cancelada"};
var ORDEM = {solicitada:0, aprovada:1, liberada:2, efetuada:3, recebida:4};
var FINAIS = ["ENTREGUE", "NEGADA", "CANCELADA"];
var SELO_STATUS = {AGUARDANDO:["Em espera", "neutro"], AGUARDANDO_ORCAMENTO:["Novo orçamento", "alerta"], AGUARDANDO_AUTORIZACAO:["Aguard. autorização", "alerta"], AGUARDANDO_CNPJ:["Falta CNPJ", "info"], AGUARDANDO_FORMA_PAGAMENTO:["Falta conta", "info"], EM_TRANSITO:["Em trânsito", "info"], RECEBIDA_PARCIAL:["Parcial", "alerta"], ENTREGUE:["Entregue", "ok"]};
// próxima operação natural de cada situação (botão "Concluir etapa ›")
var PROXIMO = {NAO_VERIFICADA:"aprovar", AGUARDANDO:"aprovar", AGUARDANDO_ORCAMENTO:"aprovar", AGUARDANDO_AUTORIZACAO:"autorizar", AGUARDANDO_CNPJ:"cnpj", AGUARDANDO_FORMA_PAGAMENTO:"pagamento", APROVADA:"liberar", LIBERADA:"comprar", COMPRADA:"receber", EM_TRANSITO:"receber", RECEBIDA_PARCIAL:"receber", RECEBIDA:"entregar"};
var ultimoEm = function(p){ return p.eventos && p.eventos.length ? p.eventos[p.eventos.length-1].em : p.solicitadoEm; };
var ALTURA = "h-9! text-[13px]!";
var SEL = INPUT+" "+ALTURA+" w-auto max-w-[12rem] cursor-pointer text-center";

// soltar o cartão numa coluna / "Mover para…": traduz a coluna na operação do reducer; transição inválida mostra a mensagem formal
function mover(c, ac, pd, de, para){
  var st = pd.status, o0 = ORDEM[de], o1 = ORDEM[para], aviso = function(t){ return c.aviso(t); };
  if(FINAIS.indexOf(st)>=0) return aviso("Esta compra já foi finalizada ("+pd.rotuloStatus.toLowerCase()+") e não muda de etapa.");
  if(para==="reprovada") return ac.iniciar(pd, "negar");
  if(para==="cancelada") return ac.iniciar(pd, "cancelar");
  if(o1<o0) return aviso("Não é possível voltar a compra para \""+NOME_COL[para]+"\". Cancele a compra ou peça ajuste ao financeiro.");
  if(para==="aprovada") return ac.iniciar(pd, st==="AGUARDANDO_AUTORIZACAO" ? "autorizar" : "aprovar");
  if(para==="liberada"){   // de Solicitada: aprova e libera num passo só (atalho); de Aprovada: abre a janela "Liberar para compra"
    if(st==="AGUARDANDO_AUTORIZACAO") return aviso("Autorize a compra antes de liberar para compra.");
    if(st==="AGUARDANDO_CNPJ") return aviso("Defina o CNPJ pagador antes de liberar a compra.");
    if(st==="AGUARDANDO_FORMA_PAGAMENTO") return aviso("Defina a conta pagadora antes de liberar a compra.");
    if(o0===0) return ac.aprovarLiberar(pd);
    return ac.iniciar(pd, "liberar");
  }
  if(para==="efetuada"){
    if(o0===0) return aviso("Aprove e libere a compra antes de efetuar.");
    if(st==="AGUARDANDO_CNPJ") return aviso("Defina o CNPJ pagador antes de efetuar a compra.");
    if(st==="AGUARDANDO_FORMA_PAGAMENTO") return aviso("Defina a conta pagadora antes de efetuar a compra.");
    if(st==="APROVADA") return aviso("O financeiro precisa liberar a compra antes de efetuar.");
    return ac.iniciar(pd, "comprar");
  }
  if(para==="recebida"){ if(o0<3) return aviso("Efetue a compra antes de registrar o recebimento."); return ac.iniciar(pd, "receber"); }
}

// lista com as regras do domínio; quem não vê o funil completo só enxerga as próprias solicitações
function baseLista(c, o){
  var r = listarPedidos(c.s, Object.assign({escopo:"todos", limite:100000}, o || {})).itens;
  return c.veTodas ? r : r.filter(function(x){ return norm(x.solicitante)===norm(c.por); });
}
function Busca(p){
  return e("div",{className:"relative min-w-48 max-w-sm flex-1 basis-56"}, e(Ph,{n:"magnifying-glass", s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60"}),
    e("input",{type:"search", value:p.v, placeholder:p.ph, "aria-label":p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+ALTURA+" w-full pl-9 text-center"}));
}
function Sel(p){
  return e("select",{value:p.v, "aria-label":p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:SEL}, e("option",{value:""}, p.rot), p.opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
}
var unicos = function(l, f){ var m = {}; l.forEach(function(x){ var v = f(x); if(v) m[v] = 1; }); return Object.keys(m).sort(function(a, b){ return a.localeCompare(b); }); };

// ───────────── cartão do quadro ─────────────
function CartaoCompra(p){
  var pd = p.p, c = p.c, ac = p.ac, final = FINAIS.indexOf(pd.status)>=0, dias = diasNaEtapa(pd, p.hoje), op = PROXIMO[pd.status], tr = op ? TRANSICOES[op] : null;
  var pode = !!tr && podeAcaoPedido(pd, op) && c.pode(tr, pd), selo = SELO_STATUS[pd.status] || (pd.status==="LIBERADA" && pd.liberacao ? (pd.liberacao.modo==="plano" ? ["Plano definido", "ok"] : ["Comprador define", "neutro"]) : null), urg = {ALTA:"ruim", MEDIA:"alerta", BAIXA:"neutro"}[pd.urgencia];
  var naoFecha = !final && pd.plano.length>0 && !pd.planoInfo.fecha;
  return e("div",{className:"flex flex-col items-center gap-1.5"},
    e("div",{className:"flex w-full items-start justify-center gap-1.5"}, e("b",{className:MONO+" text-[12px] text-[#BFDBFE]"}, "#"+pd.id), e("span",{className:"line-clamp-2 min-w-0 break-words text-[13px] font-bold leading-tight"}, pd.titulo)),
    e("span",{className:"w-full truncate text-[12px] text-white/70", title:pd.fornecedor}, pd.fornecedor || "Sem fornecedor"),
    e("span",{className:MONO+" text-[14px] font-bold"}, formatarReais(pd.valorFinal)),
    e("div",{className:"flex items-center justify-center gap-1.5"}, e(Avatar,{nome:pd.solicitante, s:22}), pd.cnpjId && e("span",{title:pd.cnpj, className:"rounded bg-white/10 px-1.5 py-0.5 text-[10.5px] font-bold"}, cnpjCurto(pd)),
      pd.link && e(Ph,{n:"link", s:14, className:"text-[#BFDBFE]"}), pd.mensagens.length>0 && e("span",{title:pd.mensagens.length+" mensagens", className:"inline-flex items-center gap-0.5 text-[11px] text-white/70"}, e(Ph,{n:"chat-circle-text", s:14}), pd.mensagens.length)),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1"},
      !final && e(Selo,{cor:corTempo(dias), ic:"clock", titulo:"Tempo na etapa"}, textoDias(dias)),
      urg && !final && e(Selo,{cor:urg, ic:"flag", titulo:"Urgência"}, pd.rotuloUrgencia),
      selo && e(Selo,{cor:selo[1]}, selo[0]),
      pd.atrasado && e(Selo,{cor:"ruim", ic:"warning"}, "Atrasada"),
      naoFecha && e(Selo,{cor:"alerta", ic:"warning", titulo:pd.planoInfo.aviso}, "Plano não fecha")),
    tr && e(Bt,{tipo:"marca", disabled:!pode, semAut:true, titulo:tr.rotulo, className:"w-full py-1.5! text-[12px]!", onClick:function(ev){ ev.stopPropagation(); ac.iniciar(pd, op); }}, "Concluir etapa ›"),
    op==="aprovar" && pode && e(Bt,{disabled:!c.pode(TRANSICOES.liberar, pd), semAut:true, titulo:"Aprova e libera para compra num clique", ic:"lock-open", className:"w-full py-1.5! text-[12px]!", onClick:function(ev){ ev.stopPropagation(); ac.aprovarLiberar(pd); }}, "Aprovar e liberar"));
}

// ───────────── tela 1: quadro ─────────────
var estadoFiltro = function(o){ return {q:o.q || "", sol:o.sol || "", setor:o.setor!=null ? String(o.setor) : "", cls:o.cls || "", urg:o.urg || "", atr:!!o.atr, ind:o.ind || ""}; };
function AbaCompraQuadro(props){
  var c = useCompras(), ac = useAcoes(c), ce = c.ce, cfg = ce.config, hoje = hojeSP(), mes = hoje.slice(0, 7);
  var st = useState(estadoFiltro(props.filtroInicial || {})), f = st[0];
  useEffect(function(){ st[1](estadoFiltro(props.filtroInicial || {})); }, [props.filtroInicial]);
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var todas = baseLista(c);
  var IND = {
    solicitadas:function(p){ return COL_DE[p.status]==="solicitada"; },
    aguard:function(p){ return p.status==="NAO_VERIFICADA" || p.status==="AGUARDANDO_AUTORIZACAO"; },
    autoriz:function(p){ return p.status==="AGUARDANDO_AUTORIZACAO"; },
    aprovadas:function(p){ return p.status==="APROVADA"; },
    liberadas:function(p){ return p.status==="LIBERADA"; },
    areceber:function(p){ return ["COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL"].indexOf(p.status)>=0; },
    atrasadas:function(p){ return p.atrasado; },
    mes:function(p){ return String(p.solicitadoEm).slice(0, 7)===mes && p.status!=="NEGADA" && p.status!=="CANCELADA"; }};
  var conta = function(k){ return todas.filter(IND[k]).length; };
  var aguard = todas.filter(IND.aguard).sort(function(a, b){ return String(a.solicitadoEm).localeCompare(String(b.solicitadoEm)); });
  var totalMes = todas.filter(IND.mes).reduce(function(t, p){ return t+p.valorFinal; }, 0);
  var lista = baseLista(c, {q:f.q, setorId:f.setor || undefined, urgencia:f.urg || undefined, classificacao:f.cls || undefined, atrasada:f.atr || undefined})
    .filter(function(p){ return (!f.sol || norm(p.solicitante)===norm(f.sol)) && (!f.ind || IND[f.ind](p)); });
  var ativo = !!(f.q || f.sol || f.setor || f.cls || f.urg || f.atr || f.ind);
  var clica = function(k){ return function(){ set("ind", f.ind===k ? "" : k); }; };
  var cols = COLUNAS.map(function(col){
    var itens = lista.filter(function(p){ return COL_DE[p.status]===col.k; }).map(function(p){ return Object.assign({}, p, {arrastavel:FINAIS.indexOf(p.status)<0}); });
    if(col.k==="solicitada" || col.k==="aprovada" || col.k==="liberada" || col.k==="efetuada") itens.sort(function(a, b){ return String(ultimoEm(a)).localeCompare(String(ultimoEm(b))); });
    else itens.sort(function(a, b){ return (a.status==="ENTREGUE" ? 1 : 0)-(b.status==="ENTREGUE" ? 1 : 0) || String(ultimoEm(b)).localeCompare(String(ultimoEm(a))); });
    return Object.assign({}, col, {itens:itens, aceita:true});
  });
  return e(Pagina,null,
    e(Faixa,{n:6},
      e(Ind,{t:"Aguardando aprovação", v:aguard.length, cor:"alerta", on:f.ind==="aguard", onClick:clica("aguard"), sub:aguard.length ? "Mais antiga: "+textoDias(Math.max(0, diasEntre(String(aguard[0].solicitadoEm).slice(0, 10), hoje))) : undefined}),
      e(Ind,{t:"Aprovadas a liberar", v:conta("aprovadas"), cor:"info", on:f.ind==="aprovadas", onClick:clica("aprovadas"), titulo:"Aprovadas pelo financeiro, aguardando a liberação para compra"}),
      e(Ind,{t:"Liberadas para comprar", v:conta("liberadas"), cor:AZUL, on:f.ind==="liberadas", onClick:clica("liberadas"), titulo:"Liberadas pelo financeiro, aguardando quem efetua a compra"}),
      e(Ind,{t:"A receber", v:conta("areceber"), cor:"info", on:f.ind==="areceber", onClick:clica("areceber")}),
      e(Ind,{t:"Atrasadas", v:conta("atrasadas"), cor:"ruim", on:f.ind==="atrasadas", onClick:clica("atrasadas"), titulo:"Solicitações sem resposta além de "+cfg.slaHoras+" horas"}),
      e(Ind,{t:"Total do mês", v:formatarReais(totalMes), cor:AZUL, on:f.ind==="mes", onClick:clica("mes")})),
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ st[1](estadoFiltro({})); }},
      e(Busca,{v:f.q, set:function(v){ set("q", v); }, ph:"Buscar por nº, item ou fornecedor"}),
      e(Sel,{v:f.sol, set:function(v){ set("sol", v); }, rot:"Solicitante", opcoes:unicos(todas, function(p){ return p.solicitante; }).map(function(x){ return [x, x]; })}),
      ce.setores.length>0 && e(Sel,{v:f.setor, set:function(v){ set("setor", v); }, rot:"Setor", opcoes:ce.setores.map(function(x){ return [String(x.id), x.nome]; })}),
      e(Sel,{v:f.cls, set:function(v){ set("cls", v); }, rot:"Classificação", opcoes:cfg.classificacoes.map(function(x){ return [x.id, x.nome]; })}),
      e(Sel,{v:f.urg, set:function(v){ set("urg", v); }, rot:"Urgência", opcoes:[["ALTA", "Alta"], ["MEDIA", "Média"], ["BAIXA", "Baixa"]]}),
      e("button",{type:"button", "aria-pressed":f.atr, onClick:function(){ set("atr", !f.atr); }, className:"inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold transition "+(f.atr ? "bg-[#EF4444]/25 text-[#F87171] ring-1 ring-[#EF4444]/60" : "bg-white/10 hover:bg-white/15")}, e(Ph,{n:"warning", s:14}), "Atrasadas"),
      e("span",{className:MONO+" text-[12px] text-white/70"}, lista.length+(lista.length===1 ? " resultado" : " resultados")),
      e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", onClick:ac.nova}, "Nova solicitação")),
    todas.length===0 && e("p",{className:"rounded-xl bg-black/20 px-3 py-2 text-center text-[13px] text-white/70"}, "Nenhuma compra registrada. Use \"Nova solicitação\" para começar."),
    e(Kanban,{colunas:cols, unidade:["compra", "compras"], vazio:"Nenhuma compra nesta etapa.",
      card:function(it){ return e(CartaoCompra,{p:it, c:c, ac:ac, hoje:hoje}); },
      onMover:function(it, de, para){ mover(c, ac, it, de, para); },
      onAbrir:function(it){ ac.abrir(it.id); }}),
    ac.janelas());
}

// ───────────── tela 2: planilha ─────────────
var POR_PAGINA = 25;
var ESCOPO = {andamento:"funil", historico:"historico", todos:"todos"};
function csvDe(lista){
  var esc = function(v){ var t = String(v==null ? "" : v); return /[;"\n\r]/.test(t) ? "\""+t.replace(/"/g, "\"\"")+"\"" : t; }, dec = function(v){ return v==null ? "" : Number(v).toFixed(2).replace(".", ","); };
  var cab = ["Nº", "Data da solicitação", "Compra", "Fornecedor", "Solicitante", "Setor", "Classificação", "CNPJ pagador", "Valor", "Situação", "Vencimento", "Pago", "Nota fiscal"];
  var linhas = lista.map(function(p){ return [p.id, formatarDia(String(p.solicitadoEm).slice(0, 10)), p.titulo, p.fornecedor, p.solicitante, p.setorNome, p.classificacoesTxt, p.cnpj || "", dec(p.valorFinal), p.rotuloStatus, formatarDia(p.proximoVencimento), p.pago ? "Sim" : "Não", p.notaFiscal]; });
  return "﻿"+[cab].concat(linhas).map(function(l){ return l.map(esc).join(";"); }).join("\r\n");
}
function baixarCsv(nome, texto){
  var u = URL.createObjectURL(new Blob([texto], {type:"text/csv;charset=utf-8"})), a = document.createElement("a");
  a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 1000);
}
var FILTRO0 = {q:"", de:"", ate:"", forn:"", cnpj:"", cls:"", sit:"", sol:"", esc:"todos", pg:0};
function AbaCompraPlanilha(){
  var c = useCompras(), ac = useAcoes(c), cfg = c.ce.config, st = useState(FILTRO0), f = st[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; if(k!=="pg") n.pg = 0; st[1](n); };
  var todas = baseLista(c);
  var lista = baseLista(c, {escopo:ESCOPO[f.esc], q:f.q, status:f.sit || undefined, classificacao:f.cls || undefined})
    .filter(function(p){ var d = String(p.solicitadoEm).slice(0, 10); return (!f.de || d>=f.de) && (!f.ate || d<=f.ate) && (!f.forn || p.fornecedor===f.forn) && (!f.cnpj || p.cnpj===f.cnpj) && (!f.sol || norm(p.solicitante)===norm(f.sol)); })
    .sort(function(a, b){ return String(b.solicitadoEm).localeCompare(String(a.solicitadoEm)) || Number(b.id)-Number(a.id); });
  var total = lista.reduce(function(t, p){ return t+p.valorFinal; }, 0), aPagar = lista.filter(function(p){ return PAGAVEL_STATUS.indexOf(p.status)>=0 && !p.pago; }).reduce(function(t, p){ return t+p.valorFinal; }, 0);
  var paginas = Math.max(1, Math.ceil(lista.length/POR_PAGINA)), pg = Math.min(f.pg, paginas-1), vis = lista.slice(pg*POR_PAGINA, (pg+1)*POR_PAGINA);
  var ativo = !!(f.q || f.de || f.ate || f.forn || f.cnpj || f.cls || f.sit || f.sol || f.esc!=="todos");
  var corSit = function(p){ return {primary:"info", muted:"neutro", warning:"alerta", info:"info", success:"ok", danger:"ruim"}[p.tom] || "info"; };
  return e(Pagina,null,
    e(Faixa,{n:4}, e(Ind,{t:"Compras", v:lista.length, cor:AZUL}), e(Ind,{t:"Valor total", v:formatarReais(total), cor:"total"}), e(Ind,{t:"Valor médio", v:formatarReais(lista.length ? total/lista.length : 0), cor:"info"}), e(Ind,{t:"A pagar", v:formatarReais(aPagar), cor:"alerta", titulo:"Compras efetuadas ainda não pagas"})),
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ st[1](FILTRO0); }},
      e(Busca,{v:f.q, set:function(v){ set("q", v); }, ph:"Buscar por nº, item ou fornecedor"}),
      e("label",{className:"inline-flex items-center gap-1.5 rounded-lg bg-white/5 pl-2.5 text-[12px] font-bold ring-1 ring-white/10"}, e(Ph,{n:"calendar-blank", s:14, className:"text-white/70"}), "De", e("input",{type:"date", value:f.de, "aria-label":"Data inicial", onChange:function(ev){ set("de", ev.target.value); }, className:INPUT+" "+ALTURA+" w-36 border-0! bg-transparent! text-center"})),
      e("label",{className:"inline-flex items-center gap-1.5 rounded-lg bg-white/5 pl-2.5 text-[12px] font-bold ring-1 ring-white/10"}, e(Ph,{n:"calendar-blank", s:14, className:"text-white/70"}), "Até", e("input",{type:"date", value:f.ate, "aria-label":"Data final", onChange:function(ev){ set("ate", ev.target.value); }, className:INPUT+" "+ALTURA+" w-36 border-0! bg-transparent! text-center"})),
      e(Sel,{v:f.forn, set:function(v){ set("forn", v); }, rot:"Fornecedor", opcoes:unicos(todas, function(p){ return p.fornecedor; }).map(function(x){ return [x, x]; })}),
      e(Sel,{v:f.cnpj, set:function(v){ set("cnpj", v); }, rot:"CNPJ pagador", opcoes:unicos(todas, function(p){ return p.cnpj; }).map(function(x){ return [x, x]; })}),
      e(Sel,{v:f.cls, set:function(v){ set("cls", v); }, rot:"Classificação", opcoes:cfg.classificacoes.map(function(x){ return [x.id, x.nome]; })}),
      e(Sel,{v:f.sit, set:function(v){ set("sit", v); }, rot:"Situação", opcoes:STATUS_PEDIDO.map(function(x){ return [x, ROTULO_STATUS[x]]; })}),
      e(Sel,{v:f.sol, set:function(v){ set("sol", v); }, rot:"Solicitante", opcoes:unicos(todas, function(p){ return p.solicitante; }).map(function(x){ return [x, x]; })}),
      e("select",{value:f.esc, "aria-label":"Escopo", onChange:function(ev){ set("esc", ev.target.value); }, className:SEL}, e("option",{value:"todos"}, "Todas as compras"), e("option",{value:"andamento"}, "Em andamento"), e("option",{value:"historico"}, "Histórico (entregues e reprovadas)")),
      e("span",{className:MONO+" text-[12px] text-white/70"}, lista.length+(lista.length===1 ? " resultado" : " resultados")),
      e(Bt,{ic:"file-csv", className:"h-9 py-0!", disabled:!lista.length, onClick:function(){ baixarCsv("compras-"+hojeSP()+".csv", csvDe(lista)); c.aviso("Planilha exportada.", "ok"); }}, "Exportar CSV")),
    lista.length===0 ? e("p",{className:"rounded-xl bg-black/20 px-3 py-4 text-center text-[13px] text-white/70"}, todas.length===0 ? "Nenhuma compra registrada." : "Nenhuma compra neste filtro.")
      : e("div",{className:"rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
        e(Tab,{cols:["Nº", "Data", "Compra", "Fornecedor", "Solicitante", "Classificação", "CNPJ", "Valor", "Situação", "Vencimento"]}, vis.map(function(p){
          return e("tr",{key:p.id, onClick:function(){ ac.abrir(p.id); }, className:LINHA+" cursor-pointer hover:bg-white/5"},
            e(Td,{dinheiro:true, forte:true}, "#"+p.id), e(Td,null, formatarDia(String(p.solicitadoEm).slice(0, 10))), e(Td,{className:"max-w-[14rem] truncate", forte:true}, e("span",{title:p.titulo}, p.titulo)), e(Td,{className:"max-w-[10rem] truncate"}, e("span",{title:p.fornecedor}, p.fornecedor || "—")),
            e(Td,null, p.solicitante), e(Td,{className:"max-w-[9rem] truncate"}, p.classificacoesTxt || "—"), e(Td,null, cnpjCurto(p) || "—"), e(Td,{dinheiro:true}, formatarReais(p.valorFinal)),
            e(Td,null, e(Selo,{cor:corSit(p)}, p.rotuloStatus)), e(Td,{cor:p.vencido ? "ruim" : undefined}, formatarDia(p.proximoVencimento) || "—"));
        })),
        paginas>1 && e("div",{className:"flex flex-wrap items-center justify-center gap-2 pt-2"},
          e(Bt,{disabled:pg===0, ic:"caret-right", className:"[&_i]:rotate-180", onClick:function(){ set("pg", pg-1); }}, "Anterior"),
          e("span",{className:MONO+" text-[12px] text-white/75"}, "Página "+(pg+1)+" de "+paginas),
          e(Bt,{disabled:pg>=paginas-1, onClick:function(){ set("pg", pg+1); }}, "Próxima", e(Ph,{n:"caret-right", s:15})))),
    ac.janelas());
}

// ───────────── tela 3: visão geral ─────────────
var PERIODOS = [["hoje", "Hoje"], ["7d", "7 dias"], ["30d", "30 dias"], ["mes", "Mês"], ["tudo", "Tudo"]];
function BarraValor(p){
  var pct = p.max>0 ? Math.max(3, Math.round(100*p.valor/p.max)) : 0, cor = p.cor || AZUL;
  return e(p.onClick ? "button" : "div",{type:p.onClick ? "button" : undefined, onClick:p.onClick, title:p.onClick ? "Abrir no quadro" : undefined, className:"flex w-full flex-col items-center gap-1 rounded-lg bg-black/20 px-2 py-1.5 text-center "+(p.onClick ? "cursor-pointer transition hover:bg-black/40" : "")},
    e("span",{className:"break-words text-[12.5px] font-bold leading-tight"}, p.nome),
    e("div",{className:"h-2 w-full overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:pct+"%", background:"linear-gradient(90deg, "+cor+"88, "+cor+")"}})),
    e("span",{className:MONO+" text-[12px] text-white/85"}, p.texto),
    p.sub && e("span",{className:"text-[11px] leading-tight text-white/60"}, p.sub));
}
var vazioBloco = function(t){ return e("p",{className:"px-2 py-3 text-center text-[12.5px] text-white/60"}, t); };
function AbaCompraVisao(props){
  var c = useCompras(), ac = useAcoes(c), ce = c.ce, st = useState("30d"), per = st[0], ir = props.onIrQuadro;
  if(!c.opera) return e(Pagina,null, e("p",{className:"rounded-xl bg-black/20 px-3 py-4 text-center text-[13px] text-white/70"}, "A visão geral das compras é restrita ao financeiro e à diretoria."));
  var d = dashboardCompras(c.s, per), lt = d.leadTime, qtdPedidos = ce.pedidos.length;
  var etapas = [["Resposta", lt.respostaHoras], ["Compra", lt.compraHoras], ["Entrega", lt.entregaHoras]], maxH = Math.max.apply(null, etapas.map(function(x){ return x[1] || 0; }));
  var temEtapa = etapas.some(function(x){ return x[1]!=null; });
  var vai = function(filtro){ return ir ? function(){ ir(filtro); } : undefined; };
  var max = function(l, k){ return Math.max.apply(null, [0].concat(l.map(function(x){ return x[k]; }))); };
  var idPorNome = function(lista, nome){ var x = lista.find(function(y){ return y.nome===nome; }); return x ? x.id : null; };
  var porSetor = d.porSetor, porCat = d.porCategoria;
  return e(Pagina,null,
    e(Abas,{abas:PERIODOS, atual:per, onMudar:st[1], cor:AZUL}),
    e("p",{className:"text-center text-[12px] text-white/65"}, "Período: "+d.periodo.rotulo+(d.periodo.de ? " · "+formatarDia(d.periodo.de)+" a "+formatarDia(d.periodo.ate) : "")),
    e(Faixa,{n:6},
      e(Ind,{t:"Gasto no período", v:formatarReais(d.gastoTotal), cor:AZUL, sub:d.qtdCompras+(d.qtdCompras===1 ? " compra efetuada" : " compras efetuadas")}),
      e(Ind,{t:"Atrasadas", v:d.atrasadasNoSla, cor:"ruim", onClick:vai({ind:"atrasadas"}), titulo:ir ? "Abrir no quadro" : undefined}),
      e(Ind,{t:"Aguardando autorização", v:d.aguardandoAutorizacao, cor:"alerta", onClick:vai({ind:"autoriz"}), titulo:ir ? "Abrir no quadro" : undefined}),
      e(Ind,{t:"Aprovadas a liberar", v:d.aprovadasParaComprar, cor:"info", onClick:vai({ind:"aprovadas"}), titulo:ir ? "Abrir no quadro" : undefined}),
      e(Ind,{t:"Liberadas para comprar", v:d.liberadasParaComprar, cor:AZUL, onClick:vai({ind:"liberadas"}), titulo:ir ? "Abrir no quadro" : undefined}),
      e(Ind,{t:"Gargalo", v:lt.gargalo || "—", cor:lt.gargalo ? "alerta" : "neutro", titulo:"Etapa que mais demora em média"})),
    qtdPedidos===0 && e("p",{className:"rounded-xl bg-black/20 px-3 py-2 text-center text-[13px] text-white/70"}, "Nenhuma compra registrada ainda. Os números aparecem depois das primeiras solicitações."),
    e(Mosaico,{min:"20rem"},
      e(BlocoBarra,{cor:"azul", t:"Tempo médio por etapa", compacto:true}, temEtapa ? e("div",{className:"flex flex-col gap-1.5 p-2"}, etapas.map(function(x){
        return e(BarraValor,{key:x[0], nome:x[0]+(lt.gargalo===x[0] ? " · gargalo" : ""), valor:x[1] || 0, max:maxH, texto:formatarHoras(x[1]), cor:lt.gargalo===x[0] ? ESTADO.alerta : AZUL});
      })) : vazioBloco("Sem dados de etapas neste período.")),
      e(BlocoBarra,{cor:"azul", t:"Solicitações mais paradas", compacto:true, dir:d.maisParadas.length || undefined}, d.maisParadas.length ? e("div",{className:"flex flex-col gap-1.5 p-2"}, d.maisParadas.map(function(p){
        return e("button",{key:p.id, type:"button", onClick:function(){ ac.abrir(p.id); }, className:"flex w-full cursor-pointer flex-col items-center rounded-lg bg-black/20 px-2 py-1.5 text-center transition hover:bg-black/40"},
          e("span",{className:"break-words text-[12.5px] font-bold leading-tight"}, "#"+p.id+" · "+p.titulo), e("span",{className:"text-[11.5px] text-white/65"}, p.solicitante+" · parada há "+formatarHoras(p.horasParado)));
      })) : vazioBloco("Nenhuma solicitação parada.")),
      e(BlocoBarra,{cor:"azul", t:"Por categoria", compacto:true}, porCat.length ? e("div",{className:"flex flex-col gap-1.5 p-2"}, porCat.map(function(x){
        return e(BarraValor,{key:x.nome, nome:x.nome, valor:x.valorPedido, max:max(porCat, "valorPedido"), texto:formatarReais(x.valorPedido), sub:x.pedidos+(x.pedidos===1 ? " pedido" : " pedidos")+" · gasto "+formatarReais(x.gasto)});
      })) : vazioBloco("Sem pedidos neste período.")),
      e(BlocoBarra,{cor:"azul", t:"Por setor", compacto:true}, porSetor.length ? e("div",{className:"flex flex-col gap-1.5 p-2"}, porSetor.map(function(x){
        var id = idPorNome(ce.setores, x.nome);
        return e(BarraValor,{key:x.nome, nome:x.nome, valor:x.valorPedido, max:max(porSetor, "valorPedido"), texto:formatarReais(x.valorPedido), sub:x.pedidos+(x.pedidos===1 ? " pedido" : " pedidos")+" · gasto "+formatarReais(x.gasto), onClick:id!=null ? vai({setor:id}) : undefined});
      })) : vazioBloco("Sem pedidos neste período.")),
      e(BlocoBarra,{cor:"azul", t:"Gasto por classificação", compacto:true}, d.porClassificacao.length ? e("div",{className:"flex flex-col gap-1.5 p-2"}, d.porClassificacao.map(function(x){
        var cl = ce.config.classificacoes.find(function(y){ return y.nome===x.nome; });
        return e(BarraValor,{key:x.nome, nome:x.nome, valor:x.gasto, max:max(d.porClassificacao, "gasto"), texto:formatarReais(x.gasto), onClick:cl ? vai({cls:cl.id}) : undefined});
      })) : vazioBloco("Sem compras efetuadas neste período.")),
      e(BlocoBarra,{cor:"azul", t:"Gasto por conta", compacto:true}, d.porConta.length ? e("div",{className:"flex flex-col gap-1.5 p-2"}, d.porConta.map(function(x){
        return e(BarraValor,{key:x.rotulo, nome:x.rotulo, valor:x.gasto, max:max(d.porConta, "gasto"), texto:formatarReais(x.gasto), sub:x.compras+(x.compras===1 ? " compra" : " compras")+" · "+Math.round(x.parte*100)+"%"});
      })) : vazioBloco("Sem compras efetuadas neste período."))),
    ac.janelas());
}

export { AbaCompraQuadro, AbaCompraPlanilha, AbaCompraVisao };
