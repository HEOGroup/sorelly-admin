// Sorelly Admin · montagem — pages/encomendas/Quadro.js
// Encomendas e reposições → Quadro de pedidos: indicadores clicáveis, filtros numa barra, KANBAN (solicitado → em análise → aprovado → separando → entrega ou retirada agendada → concluído, mais recusado/cancelado),
// "Novo pedido" (janela em colunas, com o direito calculado e a recusa formal), detalhe do pedido (histórico, foto do local, agendamento) e cadastro simples das revendedoras.
// Regras (faixas, expositor, bloqueio) ficam em domain/encomendas.js (config editável); aqui só desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BarraFiltros, Dinheiro, Faixa, Janela, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { COR_STATUS, COR_TIPO, FINAIS, FORMAS, ICONE_TIPO, ROTULO_FORMA, ROTULO_STATUS, ROTULO_TIPO, TIPOS, agoraSP, bloqueadaNaData, direitoReposicao, formatarDataHora, formatarDia, formatarReais, hojeSP,
  indicadoresEr, listaPedidos, minutosNaEtapa, proximaEtapa, proximosStatus, reposicoesDoMes, representantesEr, revDe, textoTempo, validarPedido } from "@/apps/montagem/domain/encomendas";
import { Bt, BtMini, Escolha, Painel, TURQ, copiar, useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Busca, Campo, Ind, Sel, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { Kanban } from "@/shared/kanban";
import { e, useState } from "@/shared/react";

var CAMPO = INPUT+" w-full text-center";
var COLUNAS = ["solicitado", "analise", "aprovado", "separando", "agendado", "concluido", "cancelado"];   // a última junta recusado e cancelado

function Cartao(p){
  var x = p.x, prox = proximaEtapa(x), min = minutosNaEtapa(x, p.agora), corT = COR_TIPO[x.tipo];
  return e("div",{className:"flex flex-col items-center gap-1"},
    e(Selo,{cor:corT, ic:ICONE_TIPO[x.tipo]}, ROTULO_TIPO[x.tipo]),
    e("b",{className:"break-words text-[13.5px] leading-tight"}, x.revendedora),
    e("span",{className:"text-[11.5px] text-white/65"}, x.representante || "Sem representante"),
    (x.valor>0) && e("b",{className:MONO+" text-[17px] leading-none", style:{color:COR_STATUS[x.status]}}, formatarReais(x.valor)),
    x.tipo==="encomenda" && x.descricao && e("span",{className:"break-words text-[11.5px] text-white/75"}, x.descricao),
    e("div",{className:"flex flex-wrap justify-center gap-1"},
      x.forma && e(Selo,{cor:"#8B5CF6", ic:x.forma==="entrega" ? "truck" : "storefront", titulo:"Forma de receber"}, ROTULO_FORMA[x.forma]),
      x.dataAgendada && e(Selo,{cor:"#F3D98B", ic:"calendar-check", titulo:"Data agendada"}, formatarDia(x.dataAgendada)),
      x.taxa>0 && e(Selo,{cor:"#94A3B8", ic:"coins", titulo:"Taxa"}, formatarReais(x.taxa)),
      x.tipo==="expositor" && e(Selo,{cor:x.fotoLocal ? "#4ADE80" : "#FBBF24", ic:"camera", titulo:"Foto do local"}, x.fotoLocal ? "Foto" : "Sem foto"),
      !FINAIS[x.status] && min!=null && e(Selo,{cor:min>2880 ? "#EF4444" : min>1440 ? "#FBBF24" : "#4ADE80", ic:"clock", titulo:"Tempo na etapa"}, textoTempo(min))),
    x.motivo && e("span",{className:"text-[11px] text-white/55"}, x.motivo),
    prox && e(BtMini,{forte:true, ic:"arrow-right", onClick:function(){ p.onMover(x, x.status, prox); }}, "Concluir etapa ›"));
}

function AbaErQuadro(){
  var E = useEr(), s = E.s, er = E.er, st = useState({busca:"", tipo:"", forma:"", representante:""}), f = st[0], md = useState(null), modal = md[0];
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var limpar = function(){ st[1]({busca:"", tipo:"", forma:"", representante:""}); };
  var agora = agoraSP(), ind = indicadoresEr(s), lista = listaPedidos(s, f), ativo = !!(f.busca || f.tipo || f.forma || f.representante);
  var mover = function(x, de, para){
    if(para==="cancelado" || para==="recusado"){ md[1]({tipo:"motivo", id:x.id}); return; }
    if(para==="agendado" && !(x.forma && x.dataAgendada)){ md[1]({tipo:"agendar", id:x.id, mover:true}); return; }
    E.exec("ped_mover", {id:x.id, para:para});
  };
  var itens = function(k){ return lista.filter(function(x){ return k==="cancelado" ? (x.status==="cancelado" || x.status==="recusado") : x.status===k; }).map(function(x){ return Object.assign({}, x, {arrastavel:!FINAIS[x.status]}); }); };
  var colunas = COLUNAS.map(function(k){
    return {k:k, titulo:k==="cancelado" ? "Recusado ou cancelado" : ROTULO_STATUS[k], cor:COR_STATUS[k], itens:itens(k),
      aceita:function(it){ var t = proximosStatus(it); return k==="cancelado" ? (t.indexOf("cancelado")>=0 || t.indexOf("recusado")>=0) : t.indexOf(k)>=0; }}; });
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:8},
      e(Ind,{t:"Pedidos em aberto", v:ind.abertos, cor:"total", onClick:limpar, on:!ativo, titulo:"Todos os pedidos"}),
      e(Ind,{t:"Reposições", v:ind.porTipo.reposicao, cor:COR_TIPO.reposicao, onClick:function(){ set("tipo", f.tipo==="reposicao" ? "" : "reposicao"); }, on:f.tipo==="reposicao"}),
      e(Ind,{t:"Expositores", v:ind.porTipo.expositor, cor:COR_TIPO.expositor, onClick:function(){ set("tipo", f.tipo==="expositor" ? "" : "expositor"); }, on:f.tipo==="expositor"}),
      e(Ind,{t:"Encomendas", v:ind.porTipo.encomenda, cor:COR_TIPO.encomenda, onClick:function(){ set("tipo", f.tipo==="encomenda" ? "" : "encomenda"); }, on:f.tipo==="encomenda"}),
      e(Ind,{t:"Para analisar", v:ind.analise, cor:ind.analise ? "alerta" : "neutro", titulo:"Solicitados e em análise"}),
      e(Ind,{t:"Agendados para hoje", v:ind.agendadosHoje, cor:"info"}),
      e(Ind,{t:"Concluídos no mês", v:ind.concluidosMes, cor:"ok"}),
      e(Ind,{t:"Revendedoras bloqueadas", v:ind.bloqueadas, cor:ind.bloqueadas ? "ruim" : "neutro", titulo:"Abrir o cadastro de revendedoras", onClick:function(){ md[1]({tipo:"revs"}); }})),
    e(BarraFiltros,{ativo:ativo, onLimpar:limpar},
      e(Busca,{v:f.busca, set:function(v){ set("busca", v); }, ph:"Buscar revendedora, representante ou encomenda"}),
      e(Sel,{v:f.tipo, set:function(v){ set("tipo", v); }, rot:"Tipo", todos:"Todos os tipos", opcoes:TIPOS}),
      e(Sel,{v:f.representante, set:function(v){ set("representante", v); }, rot:"Representante", todos:"Todas as representantes", opcoes:representantesEr(er).map(function(n){ return [n, n]; })}),
      e(Sel,{v:f.forma, set:function(v){ set("forma", v); }, rot:"Forma de receber", todos:"Todas as formas", opcoes:FORMAS}),
      e("span",{className:"text-[12.5px] font-bold text-white/70"}, lista.length+(lista.length===1 ? " pedido" : " pedidos")),
      e(Bt,{ic:"user-circle", onClick:function(){ md[1]({tipo:"revs"}); }}, "Revendedoras"),
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ md[1]({tipo:"novo"}); }}, "Novo pedido")),
    e(Kanban,{colunas:colunas, unidade:["pedido", "pedidos"], vazio:"Nenhum pedido nesta etapa.", onMover:mover, onAbrir:function(x){ md[1]({tipo:"detalhe", id:x.id}); },
      card:function(x){ return e(Cartao,{x:x, agora:agora, onMover:mover}); }}),
    modal && modal.tipo==="novo" && e(NovoPedido,{E:E, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="motivo" && e(Motivo,{E:E, id:modal.id, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="agendar" && e(Agendar,{E:E, id:modal.id, mover:modal.mover, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="detalhe" && e(Detalhe,{E:E, id:modal.id, ir:function(m){ md[1](m); }, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="revs" && e(Revendedoras,{E:E, fechar:function(){ md[1](null); }}));
}

// Janela "Novo pedido": tipo, revendedora, representante, média dos 3 meses, valor; mostra o direito calculado e a mensagem formal de recusa.
function NovoPedido(p){
  var E = p.E, s = E.s, er = E.er, cfg = E.cfg, agora = agoraSP();
  var st = useState({tipo:"reposicao", revendedoraId:"", revendedora:"", representante:"", media3m:"", maiorVenda:"", valor:0, descricao:"", observacao:"", fotoLocal:"", forma:"", dataAgendada:""}), v = st[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var escolhe = function(id){ var r = revDe(er, id); st[1](function(o){ return Object.assign({}, o, r ? {revendedoraId:id, revendedora:r.nome, representante:r.representante || o.representante, media3m:r.media3m, maiorVenda:r.maiorVenda} : {revendedoraId:""}); }); };
  var t = v.tipo, mes = hojeSP().slice(0, 7), nome = String(v.revendedora||"").trim();
  var erro = validarPedido(s, v, agora), usadas = nome ? reposicoesDoMes(er, nome, mes) : 0;
  var dr = t==="reposicao" && v.media3m!=="" ? direitoReposicao(cfg, v.media3m, usadas) : null;
  var rev = nome ? er.revendedoras.find(function(r){ return r.nome.trim().toLowerCase()===nome.toLowerCase(); }) : null;
  var criar = function(registrarRecusa){ if(E.exec("ped_criar", {pedido:v, registrarRecusa:!!registrarRecusa})) p.fechar(); };
  var texto = function(){ return erro ? "Prezada revendedora, informamos que não foi possível atender à sua solicitação. "+erro.msg : ""; };
  var c1 = [e(Campo,{key:"t", rot:"Tipo do pedido"}, e(Escolha,{v:t, set:function(x){ set("tipo", x); }, ops:TIPOS})),
    er.revendedoras.length>0 && e(Campo,{key:"rc", rot:"Revendedora cadastrada", dica:"Opcional: preenche os dados do cadastro."}, e("select",{value:v.revendedoraId, onChange:function(ev){ if(ev.target.value) escolhe(ev.target.value); else set("revendedoraId", ""); }, className:CAMPO+" cursor-pointer"},
      [e("option",{key:"", value:""}, "Selecione")].concat(er.revendedoras.map(function(r){ return e("option",{key:r.id, value:r.id}, r.nome); })))),
    e(Campo,{key:"rv", rot:"Revendedora *"}, e("input",{type:"text", value:v.revendedora, placeholder:"Nome da revendedora", onChange:function(ev){ st[1](function(o){ return Object.assign({}, o, {revendedora:ev.target.value, revendedoraId:""}); }); }, className:CAMPO})),
    e(Campo,{key:"rp", rot:"Representante"}, e("input",{type:"text", value:v.representante, placeholder:"Nome da representante", onChange:function(ev){ set("representante", ev.target.value); }, className:CAMPO}))];
  var c2 = [(t==="reposicao" || t==="expositor") && e(Campo,{key:"m", rot:"Média de vendas dos 3 meses", dica:"Vem de outro módulo: digitada por enquanto."}, e(Dinheiro,{value:v.media3m==="" ? 0 : v.media3m, label:"Média dos 3 meses", onChange:function(x){ set("media3m", x); }})),
    t==="expositor" && e(Campo,{key:"mv", rot:"Maior venda"}, e(Dinheiro,{value:v.maiorVenda==="" ? 0 : v.maiorVenda, label:"Maior venda", onChange:function(x){ set("maiorVenda", x); }})),
    t!=="expositor" && e(Campo,{key:"vl", rot:t==="encomenda" ? "Valor estimado" : "Valor da reposição"}, e(Dinheiro,{value:v.valor, label:"Valor", onChange:function(x){ set("valor", x); }})),
    t==="encomenda" && e(Campo,{key:"d", rot:"Descrição *"}, e("textarea",{value:v.descricao, rows:2, placeholder:"Peça ou produto encomendado", onChange:function(ev){ set("descricao", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"})),
    t==="expositor" && e(Campo,{key:"f", rot:"Foto do local", dica:"Referência da foto enviada (obrigatória para aprovar)."}, e("input",{type:"text", value:v.fotoLocal, placeholder:"Ex.: foto enviada no WhatsApp em 16/10", onChange:function(ev){ set("fotoLocal", ev.target.value); }, className:CAMPO})),
    e(Campo,{key:"o", rot:"Observação"}, e("textarea",{value:v.observacao, rows:2, onChange:function(ev){ set("observacao", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"}))];
  var c3 = e(Painel,{key:"c3", t:"Direito e ações", ic:"gear"},
    rev && bloqueadaNaData(rev.bloqueadaAte) && e(Selo,{cor:"#EF4444", ic:"lock-key"}, "Bloqueada até "+formatarDia(rev.bloqueadaAte)),
    dr && e("div",{className:"grid grid-cols-2 gap-1.5"},
      e(Ind,{t:"Reposições no mês", v:dr.quantidadeMes, cor:dr.quantidadeMes ? "info" : "neutro"}), e(Ind,{t:"Restantes", v:dr.restantes, cor:dr.restantes ? "ok" : "ruim"}),
      e(Ind,{t:"Limite por reposição", v:formatarReais(dr.limite), cor:"total"}), e(Ind,{t:"Taxa", v:formatarReais(dr.taxa), cor:"alerta"})),
    t==="reposicao" && !dr && e("p",{className:"text-[12px] text-white/65"}, "Informe a média dos 3 meses para ver o direito."),
    erro ? e("p",{role:"alert", className:"rounded-lg px-2 py-1.5 text-[12.5px] font-bold "+(erro.formal ? "bg-[#EF4444]/20 text-[#F87171]" : "bg-[#FBBF24]/15 text-[#FBBF24]")}, (erro.formal ? "Recusa formal: " : "")+erro.msg)
      : e("p",{className:"rounded-lg bg-[#22C55E]/15 px-2 py-1.5 text-[12.5px] font-bold text-[#4ADE80]"}, "Pedido dentro das regras."),
    e(Bt,{tipo:"forte", ic:"paper-plane-tilt", disabled:!!erro, onClick:function(){ criar(false); }}, "Registrar pedido"),
    erro && erro.formal && e(Bt,{tipo:"perigo", ic:"prohibit", onClick:function(){ criar(true); }, titulo:"Grava o pedido já como Recusado, com o motivo"}, "Registrar recusa"),
    erro && erro.formal && e(Bt,{ic:"copy", onClick:function(){ copiar(texto()); }}, "Copiar mensagem de recusa"),
    e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"));
  return e(Janela,{t:"Novo pedido", sub:"Reposição, expositor ou encomenda: o direito é calculado pelas regras do setor.", fechar:p.fechar,
    colunas:[e(Painel,{key:"c1", t:"Pedido", ic:"clipboard-text", estado:"atual"}, c1), e(Painel,{key:"c2", t:"Valores", ic:"coins"}, c2), c3]});
}

// Motivo de recusa ou cancelamento
function Motivo(p){
  var x = p.E.er.pedidos.find(function(y){ return y.id===p.id; }), st = useState({para:"cancelado", nota:""}), v = st[0];
  if(!x) return null;
  var ops = [["cancelado", "Cancelar"]].concat(proximosStatus(x).indexOf("recusado")>=0 ? [["recusado", "Recusar"]] : []);
  var ok = function(){ if(p.E.exec("ped_mover", {id:p.id, para:v.para, nota:v.nota})) p.fechar(); };
  return e(Janela,{t:"Recusar ou cancelar pedido", sub:x.revendedora+" · "+ROTULO_TIPO[x.tipo], fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Motivo", ic:"note-pencil", estado:"atual"}, e(Campo,{rot:"Ação"}, e(Escolha,{v:v.para, set:function(y){ st[1](Object.assign({}, v, {para:y})); }, ops:ops})),
        e(Campo,{rot:"Motivo *"}, e("textarea",{value:v.nota, rows:3, placeholder:"Informe o motivo", onChange:function(ev){ st[1](Object.assign({}, v, {nota:ev.target.value})); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"}))),
      e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"check", disabled:!v.nota.trim(), onClick:ok}, "Confirmar"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// Forma de receber e data agendada (entrega com taxa conforme a regra, retirada na empresa agendada, retirada na data do acerto pela representante)
function Agendar(p){
  var x = p.E.er.pedidos.find(function(y){ return y.id===p.id; }), st = useState({forma:x ? x.forma : "", data:x ? x.dataAgendada : ""}), v = st[0];
  if(!x) return null;
  var taxa = x.tipo==="expositor" ? (v.forma==="entrega" ? p.E.cfg.expositor.taxaEntrega : 0) : x.taxa;
  var ok = function(){ var r = p.mover ? p.E.exec("ped_mover", {id:p.id, para:"agendado", forma:v.forma, data:v.data}) : p.E.exec("ped_agendar", {id:p.id, forma:v.forma, data:v.data}); if(r) p.fechar(); };
  return e(Janela,{t:"Agendar entrega ou retirada", sub:x.revendedora+" · "+ROTULO_TIPO[x.tipo], fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Agendamento", ic:"calendar-check", estado:"atual"}, e(Campo,{rot:"Forma de receber *"}, e(Escolha,{v:v.forma, set:function(y){ st[1](Object.assign({}, v, {forma:y})); }, ops:FORMAS})),
        e(Campo,{rot:"Data *"}, e("input",{type:"date", value:v.data, min:hojeSP(), onChange:function(ev){ st[1](Object.assign({}, v, {data:ev.target.value})); }, className:CAMPO})),
        taxa>0 && e(Selo,{cor:"#94A3B8", ic:"coins"}, "Taxa de "+formatarReais(taxa))),
      e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"check", disabled:!v.forma || !v.data, onClick:ok}, p.mover ? "Agendar e avançar" : "Salvar agendamento"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// Detalhe do pedido: dados | histórico | ações (foto do local, anotação, agendamento, avaliação do bloqueio)
function Detalhe(p){
  var E = p.E, x = E.er.pedidos.find(function(y){ return y.id===p.id; }), st = useState({foto:"", nota:"", vendas:0}), v = st[0];
  if(!x) return null;
  var set = function(k, y){ st[1](function(o){ var n = Object.assign({}, o); n[k] = y; return n; }); };
  var lin = function(r, val){ return val || val===0 ? e("div",{key:r, className:"flex flex-col items-center rounded-lg bg-black/25 px-2 py-1"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/65"}, r), e("b",{className:"break-words text-[13px]"}, val)) : null; };
  var dados = e(Painel,{key:"d", t:"Dados do pedido", estado:"feito"},
    e("div",{className:"flex flex-wrap justify-center gap-1"}, e(Selo,{cor:COR_TIPO[x.tipo], ic:ICONE_TIPO[x.tipo]}, ROTULO_TIPO[x.tipo]), e(Selo,{cor:COR_STATUS[x.status]}, ROTULO_STATUS[x.status])),
    lin("Revendedora", x.revendedora), lin("Representante", x.representante), lin("Média dos 3 meses", x.media3m!=null ? formatarReais(x.media3m) : ""), lin("Maior venda", x.maiorVenda!=null ? formatarReais(x.maiorVenda) : ""),
    lin(x.tipo==="encomenda" ? "Valor estimado" : "Valor", x.valor>0 ? formatarReais(x.valor) : ""), lin("Descrição", x.descricao), lin("Observação", x.observacao),
    lin("Forma de receber", x.forma ? ROTULO_FORMA[x.forma] : ""), lin("Data agendada", formatarDia(x.dataAgendada)), lin("Taxa", x.taxa>0 ? formatarReais(x.taxa) : ""), lin("Foto do local", x.fotoLocal),
    lin("Motivo", x.motivo), lin("Aberto em", formatarDataHora(x.criadoEm)+" · "+x.criadoPor),
    x.bloqueio && lin("Bloqueio", x.bloqueio.bloqueia ? "Até "+formatarDia(x.bloqueio.ate)+" ("+x.bloqueio.pct.toLocaleString("pt-BR")+"%)" : "Sem bloqueio ("+x.bloqueio.pct.toLocaleString("pt-BR")+"%)"));
  var historico = e(Painel,{key:"h", t:"Histórico", ic:"clock"}, e("ol",{className:"flex flex-col gap-1.5"}, x.historico.slice().reverse().map(function(h, i){
    return e("li",{key:i, className:"rounded-lg bg-black/25 px-2 py-1 text-[12px]"}, e("b",null, formatarDataHora(h.em)+" · "+h.por), e("div",{className:"text-white/75"}, (h.para && h.de!==h.para ? ROTULO_STATUS[h.para]+(h.nota ? " · " : "") : "")+(h.nota || ""))); })));
  var fim = FINAIS[x.status];
  var acoes = e(Painel,{key:"a", t:"Ações", ic:"gear", estado:"atual"},
    x.tipo==="expositor" && !fim && e(Campo,{rot:"Foto do local"}, e("input",{type:"text", value:v.foto, placeholder:"Referência da foto", onChange:function(ev){ set("foto", ev.target.value); }, className:CAMPO}),
      e(BtMini,{ic:"camera", disabled:!v.foto.trim(), onClick:function(){ if(E.exec("ped_foto", {id:x.id, foto:v.foto})) set("foto", ""); }}, "Registrar foto")),
    !fim && e(Bt,{ic:"calendar-check", onClick:function(){ p.ir({tipo:"agendar", id:x.id}); }}, x.dataAgendada ? "Reagendar" : "Agendar"),
    !fim && proximaEtapa(x) && e(Bt,{tipo:"forte", ic:"arrow-right", onClick:function(){ if(proximaEtapa(x)==="agendado" && !(x.forma && x.dataAgendada)) p.ir({tipo:"agendar", id:x.id, mover:true}); else E.exec("ped_mover", {id:x.id, para:proximaEtapa(x)}); }}, "Concluir etapa ›"),
    !fim && e(Bt,{tipo:"perigo", ic:"prohibit", onClick:function(){ p.ir({tipo:"motivo", id:x.id}); }}, "Recusar ou cancelar"),
    e(Campo,{rot:"Anotação"}, e("textarea",{value:v.nota, rows:2, onChange:function(ev){ set("nota", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"}),
      e(BtMini,{ic:"note-pencil", disabled:!v.nota.trim(), onClick:function(){ if(E.exec("ped_nota", {id:x.id, nota:v.nota})) set("nota", ""); }}, "Registrar anotação")),
    x.tipo==="reposicao" && x.status==="concluido" && e(Campo,{rot:"Vendas depois da reposição", dica:"Abaixo de "+E.cfg.bloqueio.pctMinimo+"% do valor, bloqueia por "+E.cfg.bloqueio.meses+" meses."}, e(Dinheiro,{value:v.vendas, label:"Vendas", onChange:function(y){ set("vendas", y); }}),
      e(BtMini,{ic:"lock-key", onClick:function(){ E.exec("bloqueio_avaliar", {id:x.id, vendas:v.vendas}); }}, "Avaliar bloqueio")),
    e(Bt,{ic:"x", onClick:p.fechar}, "Fechar"));
  return e(Janela,{t:"Pedido de "+ROTULO_TIPO[x.tipo].toLowerCase(), sub:x.revendedora, fechar:p.fechar, colunas:[dados, historico, acoes]});
}

// Cadastro simples das revendedoras (média dos 3 meses digitada; o dado real vem de outro módulo) e situação de bloqueio
function Revendedoras(p){
  var E = p.E, er = E.er, st = useState({id:"", nome:"", representante:"", media3m:0, maiorVenda:0}), v = st[0];
  var set = function(k, y){ st[1](function(o){ var n = Object.assign({}, o); n[k] = y; return n; }); };
  var novo = function(){ st[1]({id:"", nome:"", representante:"", media3m:0, maiorVenda:0}); };
  var lista = e(Painel,{key:"l", t:"Revendedoras cadastradas", ic:"user-circle", estado:"feito"}, er.revendedoras.length ? e(Tab,{cols:["Revendedora", "Média 3 meses", "Situação", ""]}, er.revendedoras.map(function(r){ var bl = bloqueadaNaData(r.bloqueadaAte);
      return e("tr",{key:r.id, className:LINHA}, e(Td,{forte:true}, r.nome), e(Td,{dinheiro:true}, formatarReais(r.media3m)),
        e(Td,{cor:bl ? "ruim" : "ok"}, bl ? "Bloqueada até "+formatarDia(r.bloqueadaAte) : "Liberada"),
        e(Td,null, e("span",{className:"inline-flex gap-1"}, e(BtMini,{ic:"note-pencil", onClick:function(){ st[1]({id:r.id, nome:r.nome, representante:r.representante, media3m:r.media3m, maiorVenda:r.maiorVenda}); }}, "Editar"),
          bl && e(BtMini,{ic:"lock-simple", disabled:!E.pode, titulo:E.pode ? "Liberar a revendedora" : "Só a diretoria libera", onClick:function(){ E.exec("bloqueio_remover", {id:r.id}); }}, "Liberar")))); }))
    : e(Vazio,{ic:"user-circle"}, "Nenhuma revendedora cadastrada."));
  var form = e(Painel,{key:"f", t:v.id ? "Editar revendedora" : "Nova revendedora", ic:"plus", estado:"atual"},
    e(Campo,{rot:"Nome *"}, e("input",{type:"text", value:v.nome, onChange:function(ev){ set("nome", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Representante"}, e("input",{type:"text", value:v.representante, onChange:function(ev){ set("representante", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Média de vendas dos 3 meses"}, e(Dinheiro,{value:v.media3m, label:"Média", onChange:function(y){ set("media3m", y); }})),
    e(Campo,{rot:"Maior venda"}, e(Dinheiro,{value:v.maiorVenda, label:"Maior venda", onChange:function(y){ set("maiorVenda", y); }})),
    e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:function(){ if(E.exec("rev_salvar", v)) novo(); }}, "Salvar"),
    v.id && e(Bt,{tipo:"perigo", ic:"trash", onClick:function(){ if(E.exec("rev_excluir", {id:v.id})) novo(); }}, "Excluir"),
    v.id && e(Bt,{ic:"plus", onClick:novo}, "Nova"));
  return e(Janela,{t:"Revendedoras", sub:"Cadastro simples para preencher os pedidos e controlar o bloqueio de 3 meses.", fechar:p.fechar, colunas:[lista, form]});
}
export { AbaErQuadro, NovoPedido, Motivo, Agendar, Detalhe, Revendedoras };
