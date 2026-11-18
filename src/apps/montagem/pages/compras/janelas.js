// Sorelly Admin · montagem — pages/compras/janelas.js
// Janelas das Compras: detalhe da compra (3 colunas), nova solicitação / edição, janelas pequenas de cada etapa (motivo, compra efetuada, recebimento, entrega, CNPJ...) e a conferência do envio para pagamentos.
// useAcoes(c) junta tudo: devolve abrir(id), nova(), iniciar(pedido, op) e janelas() (os elementos a desenhar no fim da tela). As regras estão em domain/compras-estoque.js; aqui só desenho e chamo as ações (CE).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro, ESTADO } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ETAPA_ANALISE, ETIQUETAS, ETIQUETA_ELEGIVEL, FORMAS_DISP, FORMAS_PLANO, FORMAS_SEM_NF, REF_PRAZO, ROTULO_FORMA_DISP, MOTIVOS_ORCAMENTO, PAGAVEL_STATUS, ROTULO_ETIQUETA, ROTULO_FORMA_PLANO, ROTULO_MOTIVO_ORC, ROTULO_UNIDADE, ROTULO_URGENCIA, TRANSICOES, UNIDADES, URGENCIAS,
  compraParaOrientacoes, diasEntre, estoqueDaSolicitacao, compraParaPedidoPagamentos, entraNoEstoque, formatarDataHora, formatarDia, formatarReais, hojeSP, opcoesCnpj, orcamentosExigidos, pedidoDe, pendenciasAnalise, planoSituacao, podeAcaoPedido, podeEditarPlano, avisosDoPedido, textoFormaDisp, textoOrcamentos } from "@/apps/montagem/domain/compras-estoque";
import { Bt, Campo, Dado, DECIDE_MSG, EFETUA_MSG, Dialogo, EstoqueMomento, Janela, Painel, Selo, diasNaEtapa, norm, textoDias } from "@/apps/montagem/pages/compras/pecas";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";
import { FotoMaterial } from "@/apps/montagem/components/foto-material";
import { EQUIPE } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";

var CAMPO = INPUT+" h-8! w-full text-center text-[13px]!";
var r2 = function(n){ return Math.round((n || 0)*100)/100; };
var DIRETAS = {aprovar:1, autorizar:1, transito:1, cnpj_desfazer:1};   // ações que não pedem dado nenhum: executam no clique
var idDe = function(lista, v){ var x = (lista || []).find(function(y){ return String(y.id)===String(v); }); return x ? x.id : undefined; };
var opt = function(v, t){ return e("option",{key:v, value:v}, t); };
var copiarTexto = function(c, t, msg){ try{ navigator.clipboard.writeText(t).then(function(){ c.aviso(msg, "ok"); }, function(){ c.aviso("Não foi possível copiar."); }); }catch(x){ c.aviso("Não foi possível copiar."); } };
var COR_BT = {aprovar:"forte", autorizar:"forte", liberar:"forte", comprar:"forte", receber:"forte", entregar:"forte", cnpj:"forte", pagamento:"forte", reenviar:"forte", ajustar_orcamento:"forte", negar:"perigo", cancelar:"perigo"};
var ICONE_OP = {aprovar:"seal-check", autorizar:"seal-check", liberar:"lock-open", comprar:"receipt", receber:"package", entregar:"truck", transito:"truck", negar:"x-circle", cancelar:"x-circle", cnpj:"buildings", pagamento:"currency-circle-dollar", novo_orcamento:"arrow-counter-clockwise", reenviar:"paper-plane-tilt", esperar:"hourglass", ajustar_orcamento:"pencil-simple", cnpj_desfazer:"arrow-counter-clockwise"};

// ───────────── janelas pequenas de cada etapa ─────────────
function DlgMotivo(p){
  var st = useState(""), t = st[0], c = p.c, ped = p.ped, max = c.ce.config.motivoMax, sug = p.op==="negar" ? c.ce.motivosNegativa.slice(-6) : [];
  var enviar = function(){ if(c.exec({op:"pedido_"+p.op, id:ped.id, motivo:t})) p.fechar(); };
  return e(Dialogo,{t:p.titulo, sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"perigo", ic:"x-circle", onClick:enviar}, p.rotulo)]},
    p.op==="cancelar" && ped.enviada && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-[12.5px] text-[#FBBF24]"}, "Esta compra já foi enviada aos pagamentos: o financeiro precisa estornar."),
    sug.length>0 && e("div",{className:"flex flex-wrap justify-center gap-1.5"}, sug.map(function(x, i){ return e("button",{key:i, type:"button", onClick:function(){ st[1](x); }, className:"rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] hover:bg-white/20"}, x); })),
    e(Campo,{rot:"Motivo (obrigatório)"}, e("textarea",{value:t, maxLength:max, rows:3, autoFocus:true, onChange:function(ev){ st[1](ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})),
    e("span",{className:MONO+" text-[11px] text-white/50"}, t.length+" / "+max));
}
function DlgNovoOrc(p){
  var st = useState({motivo:"", detalhe:""}), v = st[0], c = p.c, ped = p.ped;
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var enviar = function(){ if(c.exec({op:"pedido_novo_orcamento", id:ped.id, motivo:v.motivo, detalhe:v.detalhe})) p.fechar(); };
  return e(Dialogo,{t:"Pedir novo orçamento", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"arrow-counter-clockwise", onClick:enviar}, "Devolver ao solicitante")]},
    e(Campo,{rot:"Motivo"}, e("select",{value:v.motivo, onChange:function(ev){ set("motivo", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Selecione…"), MOTIVOS_ORCAMENTO.map(function(m){ return opt(m, ROTULO_MOTIVO_ORC[m]); }))),
    e(Campo,{rot:"O que precisa ser ajustado"}, e("textarea",{value:v.detalhe, rows:3, onChange:function(ev){ set("detalhe", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})));
}
// EM ESPERA (18/11/2026): motivo e responsável pelo próximo passo obrigatórios; data de revisão opcional. Espera NÃO é "Novo orçamento / ajustes": aguarda uma condição, não uma correção do solicitante.
function DlgEsperar(p){
  var c = p.c, ped = p.ped, st = useState({ate:"", motivo:"", resp:""}), v = st[0], max = c.ce.config.motivoMax;
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var enviar = function(){ if(c.exec({op:"pedido_esperar", id:ped.id, ate:v.ate, motivo:v.motivo, responsavel:v.resp})) p.fechar(); };
  return e(Dialogo,{t:"Colocar em espera", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"hourglass", onClick:enviar}, "Colocar em espera")]},
    e(Campo,{rot:"Motivo (obrigatório)"}, e("textarea",{value:v.motivo, maxLength:max, rows:2, autoFocus:true, onChange:function(ev){ set("motivo", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})),
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
      e(Campo,{rot:"Responsável pelo próximo passo"}, e("input",{value:v.resp, list:"dl-pessoas-espera", placeholder:"Nome", onChange:function(ev){ set("resp", ev.target.value); }, className:CAMPO}),
        e("datalist",{id:"dl-pessoas-espera"}, EQUIPE.map(function(x){ return e("option",{key:x.id, value:x.nome}); }))),
      e(Campo,{rot:"Data de revisão (opcional)"}, e("input",{type:"date", value:v.ate, min:hojeSP(), onChange:function(ev){ set("ate", ev.target.value); }, className:CAMPO}))));
}
// REENVIAR PARA APROVAÇÃO (18/11/2026): a correção é feita em "Editar compra" (salvar NÃO reenvia). Aqui só confirma: volta para "1 — Solicitada" com o mesmo número, a conversa e o histórico.
function DlgReenviar(p){
  var c = p.c, ped = p.ped, st = useState(""), dv = ped.devolucao, max = c.ce.config.motivoMax;
  var enviar = function(){ if(c.exec({op:"pedido_reenviar", id:ped.id, nota:st[0]})) p.fechar(); };
  return e(Dialogo,{t:"Reenviar para aprovação", sub:"#"+ped.id+" · "+ped.titulo+" · "+formatarReais(ped.valorFinal), fechar:p.fechar,
    rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"paper-plane-tilt", onClick:enviar}, "Reenviar para aprovação")]},
    e(BlocoDevolucao,{ped:ped}),
    e("p",{className:"text-[13px]"}, "Confira se as correções pedidas já estão na compra (botão Editar compra). O pedido volta para \"1 — Solicitada\" com o mesmo número."),
    e(Campo,{rot:"O que foi corrigido (opcional)"}, e("textarea",{value:st[0], maxLength:max, rows:2, onChange:function(ev){ st[1](ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})));
}
// faixa de destaque do pedido devolvido: motivo, ajustes pedidos, quem pediu e quando
function BlocoDevolucao(p){
  var ped = p.ped, dv = ped.devolucao || (ped.orcamentoDetalhe ? {motivo:ped.orcamentoMotivo, detalhe:ped.orcamentoDetalhe} : null); if(!dv) return null;
  return e("div",{className:"flex flex-col gap-0.5 rounded-md border-2 border-[#FBBF24] bg-[#FBBF24]/10 px-2 py-1 text-left text-[13px]"},
    e("b",{className:"flex items-center gap-1.5 text-[11px] uppercase text-warning"}, e(Ph,{n:"arrow-counter-clockwise", s:13}), "Pendência de ajuste"),
    e("span",null, e("b",null, "Motivo: "), ROTULO_MOTIVO_ORC[dv.motivo] || dv.motivo || "Não informado"),
    e("span",{className:"break-words"}, e("b",null, "Ajustes pedidos: "), dv.detalhe || "Não informado"),
    dv.por && e("span",{className:"text-[11px]"}, "Pedido por "+dv.por+" em "+formatarDataHora(dv.em)+(dv.etapa ? " (estava em "+dv.etapa+")" : "")));
}
function DlgComprar(p){
  var c = p.c, ped = p.ped, lib = ped.liberacao, doFinanceiro = !!lib && lib.modo==="plano", edita = podeEditarPlano(c.s, ped, c.uid, c.papel);
  var base = rowsDe(ped.plano);
  var st = useState({valor:(doFinanceiro && ped.plano.length ? ped.planoInfo.soma : ped.valorFinal) || null, comprador:c.por, dia:hojeSP(), prev:ped.previsaoEntrega || "", numero:ped.numeroFornecedor || "", nf:ped.notaFiscal || "", rows:base}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var mudou = JSON.stringify(v.rows)!==JSON.stringify(base);
  var enviar = function(){
    var a = {op:"pedido_comprar", id:ped.id, valorCompra:v.valor, comprador:v.comprador, compradoEm:v.dia, previsaoEntrega:v.prev || undefined};
    if(edita && mudou) a.plano = linhasDoPlano(v.rows);
    if(!c.exec(a)) return;
    if(v.numero.trim() && v.numero.trim()!==ped.numeroFornecedor) c.exec({op:"pedido_set", id:ped.id, numeroFornecedor:v.numero});
    if(v.nf.trim() && v.nf.trim()!==ped.notaFiscal) c.exec({op:"pedido_nf", id:ped.id, notaFiscal:v.nf});
    p.fechar();
  };
  return e(Dialogo,{t:"Compra efetuada", sub:"#"+ped.id+" · "+ped.titulo, tam:"max-w-xl", fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"receipt", onClick:enviar}, "Marcar como efetuada")]},
    lib && e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[12.5px] text-white/80"}, "Liberada por "+lib.por+" em "+formatarDataHora(lib.em)+" · "+(doFinanceiro ? "plano de pagamento definido pelo financeiro: confirme a compra." : "só liberação: defina como comprar abaixo.")+(lib.nota ? " Observação: "+lib.nota : "")),
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
      e(Campo,{rot:"Valor da compra"}, e(Dinheiro,{value:v.valor, label:"Valor da compra", onChange:function(x){ set("valor", x); }})),
      e(Campo,{rot:"Quem comprou"}, e("input",{value:v.comprador, onChange:function(ev){ set("comprador", ev.target.value); }, className:CAMPO})),
      e(Campo,{rot:"Data da compra"}, e("input",{type:"date", value:v.dia, onChange:function(ev){ set("dia", ev.target.value); }, className:CAMPO})),
      e(Campo,{rot:"Previsão de entrega"}, e("input",{type:"date", value:v.prev, onChange:function(ev){ set("prev", ev.target.value); }, className:CAMPO})),
      e(Campo,{rot:"Nº do pedido no fornecedor"}, e("input",{value:v.numero, onChange:function(ev){ set("numero", ev.target.value); }, className:CAMPO})),
      e(Campo,{rot:"Nota fiscal"}, e("input",{value:v.nf, onChange:function(ev){ set("nf", ev.target.value); }, className:CAMPO}))),
    e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
      e("span",{className:"text-[12px] font-bold uppercase tracking-wide text-white/75"}, "Como comprar · plano de pagamento"),
      e(PlanoEditor,{rows:v.rows, set:function(r){ set("rows", r); }, cfg:c.ce.config, aviso:c.aviso, edita:edita, formas:formasDe(ped), refTotal:{valorCompra:v.valor, valorEstimado:ped.valorEstimado}}),
      !edita && ped.plano.length===0 && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-[12.5px] text-[#FBBF24]"}, "Sem plano de pagamento: peça ao financeiro para definir como comprar antes de efetuar."),
      !edita && doFinanceiro && e("p",{className:"text-[11.5px] text-white/60"}, "Alterar o plano exige a autorização para aprovar e liberar compras.")));
}
function DlgReceber(p){
  var c = p.c, ped = p.ped, pend = ped.itens.filter(function(i){ return i.pendente>0; });
  var ini = {}; pend.forEach(function(i){ ini[i.id] = i.pendente; });
  var st = useState({q:ini, dia:hojeSP()}), v = st[0];
  var setQ = function(id, x){ var q = Object.assign({}, v.q); q[id] = x; st[1](Object.assign({}, v, {q:q})); };
  var enviar = function(){
    var itens = pend.filter(function(i){ return Number(v.q[i.id])>0; }).map(function(i){ return {itemId:i.id, qtd:Number(v.q[i.id])}; });
    if(!itens.length) return c.aviso("Informe a quantidade recebida de pelo menos um item.");
    if(c.exec({op:"pedido_receber", id:ped.id, itens:itens, recebidoEm:v.dia})) p.fechar();
  };
  return e(Dialogo,{t:"Registrar recebimento", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"package", onClick:enviar}, "Registrar")]},
    e(Campo,{rot:"Data do recebimento"}, e("input",{type:"date", value:v.dia, max:hojeSP(), onChange:function(ev){ st[1](Object.assign({}, v, {dia:ev.target.value})); }, className:CAMPO})),
    e("div",{className:"flex flex-col gap-1.5"}, pend.map(function(i){
      return e("div",{key:i.id, className:"flex items-center gap-2 rounded-lg bg-black/25 px-2 py-1.5 text-left"},
        e("div",{className:"min-w-0 flex-1"}, e("div",{className:"break-words text-[13px] font-bold"}, i.titulo), e("div",{className:"text-[11px] text-white/70"}, "Faltam "+i.pendente+" de "+i.quantidade+" "+(i.rotuloUnidade || "").toLowerCase()+(i.entraEstoque ? (i.semMaterial ? " · sem material ligado" : " · entra no estoque") : ""))),
        e("input",{type:"number", min:0, max:i.pendente, value:v.q[i.id], "aria-label":"Quantidade recebida de "+i.titulo, onChange:function(ev){ setQ(i.id, ev.target.value); }, className:INPUT+" h-9! w-20 text-center "+MONO}));
    })));
}
function DlgEntregar(p){
  var c = p.c, ped = p.ped, st = useState({nome:"", dia:hojeSP(), ass:false}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var enviar = function(){ if(c.exec({op:"pedido_entregar", id:ped.id, entregueParaNome:v.nome, entregueEm:v.dia, assinaturaConfirmada:v.ass})) p.fechar(); };
  return e(Dialogo,{t:"Confirmar entrega", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"truck", onClick:enviar}, "Confirmar entrega")]},
    e(Campo,{rot:"Quem recebeu e assinou"}, e("input",{value:v.nome, autoFocus:true, onChange:function(ev){ set("nome", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Data da entrega"}, e("input",{type:"date", value:v.dia, onChange:function(ev){ set("dia", ev.target.value); }, className:CAMPO})),
    e("label",{className:"flex cursor-pointer items-center justify-center gap-2 text-[13px] font-bold"}, e("input",{type:"checkbox", checked:v.ass, onChange:function(ev){ set("ass", ev.target.checked); }}), "Assinatura confirmada"));
}
function DlgCnpj(p){
  var c = p.c, ped = p.ped, st = useState({id:ped.cnpjId || "", outro:ped.cnpjOutro || ""}), v = st[0];
  var enviar = function(){ if(c.exec({op:"pedido_cnpj", id:ped.id, cnpjId:v.id, cnpjOutro:v.outro})) p.fechar(); };
  return e(Dialogo,{t:"CNPJ pagador", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"buildings", onClick:enviar}, "Definir CNPJ")]},
    e(Campo,{rot:"CNPJ que vai pagar"}, e("select",{value:v.id, onChange:function(ev){ st[1](Object.assign({}, v, {id:ev.target.value})); }, className:CAMPO}, e("option",{value:""}, "Selecione…"), opcoesCnpj(c.s).map(function(o){ return opt(o.id, o.rotulo); }))),
    v.id==="outro" && e(Campo,{rot:"Qual é o outro CNPJ"}, e("input",{value:v.outro, onChange:function(ev){ st[1](Object.assign({}, v, {outro:ev.target.value})); }, className:CAMPO})));
}
function DlgConta(p){
  var c = p.c, ped = p.ped, contas = c.ce.contas.filter(function(x){ return x.ativa!==false; }), st = useState({id:"", par:""}), v = st[0], ct = contas.find(function(x){ return String(x.id)===String(v.id); });
  var enviar = function(){ if(c.exec({op:"pedido_pagamento", id:ped.id, contaId:idDe(contas, v.id), parcelas:ct && ct.tipo==="CARTAO" && v.par ? v.par : undefined})) p.fechar(); };
  return e(Dialogo,{t:"Conta pagadora", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"currency-circle-dollar", onClick:enviar}, "Definir conta")]},
    contas.length===0 ? e("p",{className:"text-[13px] text-white/70"}, "Nenhuma conta pagadora cadastrada.") : e(Campo,{rot:"Conta"}, e("select",{value:v.id, onChange:function(ev){ st[1](Object.assign({}, v, {id:ev.target.value})); }, className:CAMPO}, e("option",{value:""}, "Selecione…"), contas.map(function(x){ return opt(x.id, [x.banco, x.titular || x.documento, x.finalOuChave].filter(Boolean).join(" · ") || "Conta "+x.id); }))),
    ct && ct.tipo==="CARTAO" && e(Campo,{rot:"Parcelas"}, e("input",{type:"number", min:1, value:v.par, onChange:function(ev){ st[1](Object.assign({}, v, {par:ev.target.value})); }, className:CAMPO})));
}
function DlgValor(p){   // reenviar com novo valor · ajustar orçamento e aprovar
  var c = p.c, ped = p.ped, reenviar = p.op==="reenviar", st = useState({valor:ped.valorEstimado || null, link:ped.link || "", obs:ped.observacao || ""}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var enviar = function(){ if(c.exec({op:"pedido_"+p.op, id:ped.id, valorEstimado:v.valor, link:v.link, observacao:v.obs})) p.fechar(); };
  return e(Dialogo,{t:reenviar ? "Reenviar com novo valor" : "Ajustar orçamento e aprovar", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:reenviar ? "paper-plane-tilt" : "seal-check", onClick:enviar}, reenviar ? "Reenviar" : "Aprovar com este valor")]},
    e(Campo,{rot:"Valor estimado"}, e(Dinheiro,{value:v.valor, label:"Valor estimado", onChange:function(x){ set("valor", x); }})),
    e(Campo,{rot:"Link"}, e("input",{value:v.link, onChange:function(ev){ set("link", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Observações"}, e("textarea",{value:v.obs, rows:2, onChange:function(ev){ set("obs", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})));
}
// ANÁLISE FINANCEIRA (etapa 2, 18/11/2026): o financeiro escolhe o CNPJ pagador e a forma de pagamento entre as que o fornecedor aceita, com as condições (parcelas, juros, vencimento ou prazo).
// "Salvar análise" guarda sem liberar (o quadro mostra o que falta). "Liberar para compra" confere tudo e libera. op "aprovar_liberar" = aprova e libera de uma vez: se faltar algo, nada muda.
// Nada aqui marca pagamento, dá baixa, confirma recebimento ou mexe no estoque.
function DlgAnalise(p){
  var c = p.c, ped = p.ped, junto = p.op==="aprovar_liberar", max = c.ce.config.motivoMax;
  var st = useState({cnpjId:ped.cnpjId || "", cnpjOutro:ped.cnpjOutro || "", nota:"", rows:rowsDe(ped.plano)}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var dados = function(){ return {cnpjId:v.cnpjId, cnpjOutro:v.cnpjOutro, plano:linhasDoPlano(v.rows), nota:v.nota}; };
  var salvar = function(){ if(c.exec(Object.assign({op:"pedido_decisao", id:ped.id}, dados()))) p.fechar(); };
  var liberar = function(){ if(c.exec(Object.assign(junto ? {op:"pedido_aprovar", liberar:true} : {op:"pedido_liberar"}, {id:ped.id}, dados()))) p.fechar(); };
  return e(Dialogo,{t:junto ? "Aprovar e liberar" : "Análise financeira", sub:"#"+ped.id+" · "+ped.titulo+" · "+formatarReais(ped.valorFinal), tam:"max-w-xl", fechar:p.fechar,
    rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), !junto && e(Bt,{key:"s", ic:"floppy-disk", onClick:salvar}, "Salvar análise"), e(Bt,{key:"o", tipo:"forte", ic:"lock-open", onClick:liberar}, junto ? "Aprovar e liberar" : "Liberar para compra")]},
    junto && e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[13px]"}, "Aprova e libera de uma vez. Se faltar algum dado, nada é alterado."),
    e("div",{className:"flex flex-col gap-1 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wide"}, "Formas que o fornecedor aceita"),
      e(FormasDisponiveis,{fd:ped.formasDisp})),
    e("div",{className:"grid grid-cols-1 gap-2 "+(v.cnpjId==="outro" ? "sm:grid-cols-2" : "")},
      e(Campo,{rot:"CNPJ pagador"}, e("select",{value:v.cnpjId, onChange:function(ev){ set("cnpjId", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Selecione"), opcoesCnpj(c.s).map(function(o){ return opt(o.id, o.rotulo); }))),
      v.cnpjId==="outro" && e(Campo,{rot:"Qual é o outro CNPJ"}, e("input",{value:v.cnpjOutro, onChange:function(ev){ set("cnpjOutro", ev.target.value); }, className:CAMPO}))),
    e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wide"}, "Forma escolhida e condições"),
      e(PlanoEditor,{rows:v.rows, set:function(r){ set("rows", r); }, cfg:c.ce.config, aviso:c.aviso, edita:true, formas:formasDe(ped), refTotal:{valorCompra:null, valorEstimado:ped.valorEstimado}}),
      e("p",{className:"text-[11px]"}, "Pode dividir entre formas: a soma precisa fechar com o total. Liberar não marca nada como pago.")),
    e(Campo,{rot:"Observação para o comprador (opcional)"}, e("textarea",{value:v.nota, maxLength:max, rows:2, onChange:function(ev){ set("nota", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})));
}
// formas que o fornecedor aceita (gravadas na solicitação). Pedido antigo, sem a informação: "Não informado"
function FormasDisponiveis(p){
  var fd = p.fd, ks = fd && fd.opcoes ? FORMAS_DISP.filter(function(k){ return fd.opcoes[k]; }) : [];
  if(!ks.length) return e("span",{className:"text-[13px]"}, "Não informado");
  return e("div",{className:"flex flex-col gap-1"},
    fd.semNF && e("span",{className:"flex justify-center"}, e(Selo,{cor:"alerta", ic:"warning"}, "Sem NF: só Dinheiro e Pix REV")),
    ks.map(function(k){ return e("div",{key:k, className:"break-words rounded-md border border-white/20 px-2 py-0.5 text-[13px]"}, textoFormaDisp(k, fd.opcoes[k])); }));
}
// lista de formas que o editor de pagamento oferece: as que o fornecedor aceita (pedido antigo, sem a lista: todas)
var formasDe = function(ped){ var fd = ped.formasDisp; var ks = fd && fd.opcoes ? FORMAS_DISP.filter(function(k){ return fd.opcoes[k]; }) : []; return ks.length ? ks : null; };
// escolhe a janela pequena da operação
function DlgOp(p){
  var ped = pedidoDe(p.c.s, p.dlg.id), op = p.dlg.op; if(!ped) return null;
  var base = {c:p.c, ped:ped, fechar:p.fechar, op:op};
  if(op==="negar") return e(DlgMotivo,Object.assign({titulo:"Reprovar compra", rotulo:"Reprovar"}, base));
  if(op==="cancelar") return e(DlgMotivo,Object.assign({titulo:"Cancelar compra", rotulo:"Cancelar compra"}, base));
  if(op==="novo_orcamento") return e(DlgNovoOrc,base);
  if(op==="esperar") return e(DlgEsperar,base);
  if(op==="liberar" || op==="decisao" || op==="aprovar_liberar") return e(DlgAnalise,base);
  if(op==="comprar") return e(DlgComprar,base);
  if(op==="receber") return e(DlgReceber,base);
  if(op==="entregar") return e(DlgEntregar,base);
  if(op==="cnpj") return e(DlgCnpj,base);
  if(op==="pagamento") return e(DlgConta,base);
  if(op==="reenviar") return e(DlgReenviar,base);
  if(op==="ajustar_orcamento") return e(DlgValor,base);
  if(op==="vincular") return e(DlgVincular,base);
  return null;
}

// ───────────── plano de pagamento (editor reutilizado no detalhe, na liberação e na compra) ─────────────
// linha do plano para a tela (rowsDe) e de volta para a regra (linhasDoPlano): vencimento OU prazo combinado; parcelas no cartão e no boleto; juros e taxa só no cartão (18/11/2026)
var rowsDe = function(plano){ return (plano || []).map(function(x){ return {id:x.id, forma:x.forma, valor:x.valor, vencimento:x.vencimento || "", prazo:x.prazo || "", parcelas:x.parcelas || null, juros:x.juros==null ? null : x.juros, taxa:x.taxa || "", pago:!!x.pago}; }); };
var linhasDoPlano = function(rows){ return rows.map(function(x){ return {id:x.id, forma:x.forma, valor:x.valor, vencimento:x.vencimento, prazo:x.prazo || "", parcelas:x.forma==="cartao" ? (Number(x.parcelas) || 1) : x.forma==="boleto" && Number(x.parcelas)>0 ? Number(x.parcelas) : undefined, juros:x.forma==="cartao" ? x.juros : undefined, taxa:x.forma==="cartao" ? x.taxa : undefined}; }); };
var JUROS_SEL = function(j){ return j===true || j==="sim" ? "sim" : j===false || j==="nao" ? "nao" : ""; };
var JUROS_VAL = function(s){ return s==="sim" ? true : s==="nao" ? false : null; };
// partes do plano (controlado: rows/set vêm de quem usa). ref = {valorCompra, valorEstimado} (total de referência); linhaExtra(r, i) opcional; botoes opcionais no fim
function PlanoEditor(p){
  var rows = p.rows, set = p.set, cfg = p.cfg, edita = p.edita, formas = p.formas && p.formas.length ? p.formas : FORMAS_PLANO;   // p.formas = só as que o fornecedor aceita
  var alt = function(i, patch){ set(rows.map(function(x, k){ return k===i ? Object.assign({}, x, patch) : x; })); };
  var sit = planoSituacao(Object.assign({plano:[]}, p.refTotal, {plano:rows.map(function(x){ return {valor:x.valor || 0}; })}), cfg), dif = sit.diferenca;
  var nova = function(valor){ var ult = rows[rows.length-1]; set(rows.concat([{forma:ult ? ult.forma : (p.formas && p.formas.length ? formas[0] : "pix_empresa"), valor:valor, vencimento:ult ? ult.vencimento : hojeSP(), prazo:ult ? ult.prazo : "", parcelas:null, juros:null, taxa:"", pago:false}])); };
  var dividir = function(){ var resto = r2(sit.total-sit.soma); if(resto<=0.004) return p.aviso("Não há valor restante para dividir."); nova(resto); };
  var corDif = sit.vazio ? "neutro" : sit.fecha ? "ok" : "ruim";
  return e("div",{className:"flex flex-col gap-2"},
    e(Resumo,{itens:[["Soma", formatarReais(sit.soma)], ["Total", formatarReais(sit.total)], ["Diferença", (dif<0 ? "−" : "")+formatarReais(Math.abs(dif)), corDif==="ok" ? "text-success" : corDif==="ruim" ? "text-destructive" : ""]]}),
    rows.length===0 && e("p",{className:"px-2 py-1 text-[13px]"}, "Nenhuma parte de pagamento."),
    rows.map(function(r, i){
      var ops = formas.indexOf(r.forma)<0 ? formas.concat([r.forma]) : formas, parc = r.forma==="cartao" || r.forma==="boleto";
      return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-lg bg-black/25 p-2 ring-1 ring-white/10"},
        e("div",{className:"flex items-center gap-1.5"},
          e("select",{value:r.forma, disabled:!edita, "aria-label":"Forma da parte "+(i+1), onChange:function(ev){ var f = ev.target.value; alt(i, {forma:f, parcelas:f==="cartao" ? (r.parcelas || 1) : null, juros:null, taxa:""}); }, className:CAMPO}, ops.map(function(f){ return opt(f, ROTULO_FORMA_PLANO[f] || f); })),
          edita && e("button",{type:"button", "aria-label":"Remover parte "+(i+1), onClick:function(){ set(rows.filter(function(x, k){ return k!==i; })); }, className:"grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20"}, e(Ph,{n:"x", s:14}))),
        e(Dinheiro,{value:r.valor, label:"Valor da parte "+(i+1), disabled:!edita, onChange:function(x){ alt(i, {valor:x || 0}); }}),
        e("div",{className:"grid grid-cols-2 gap-1.5"},
          e(Campo,{rot:"Vencimento"}, e("input",{type:"date", value:r.vencimento, disabled:!edita, "aria-label":"Vencimento da parte "+(i+1), onChange:function(ev){ alt(i, {vencimento:ev.target.value}); }, className:CAMPO})),
          e(Campo,{rot:"Ou prazo combinado"}, e("input",{value:r.prazo || "", disabled:!edita, "aria-label":"Prazo combinado da parte "+(i+1), placeholder:"30 dias após a nota", onChange:function(ev){ alt(i, {prazo:ev.target.value}); }, className:CAMPO}))),
        parc && e("div",{className:"grid grid-cols-2 gap-1.5"},
          e(Campo,{rot:"Parcelas"}, e("input",{type:"number", min:1, max:cfg.parcelasMax, value:r.parcelas || (r.forma==="cartao" ? 1 : ""), disabled:!edita, "aria-label":"Parcelas da parte "+(i+1), onChange:function(ev){ alt(i, {parcelas:ev.target.value}); }, className:CAMPO})),
          r.forma==="cartao" && e(Campo,{rot:"Juros"}, e("select",{value:JUROS_SEL(r.juros), disabled:!edita, "aria-label":"Juros da parte "+(i+1), onChange:function(ev){ alt(i, {juros:JUROS_VAL(ev.target.value)}); }, className:CAMPO}, opt("", "Selecione"), opt("nao", "Sem juros"), opt("sim", "Com juros")))),
        r.forma==="cartao" && r.juros===true && e(Campo,{rot:"Taxa ou condição dos juros"}, e("input",{value:r.taxa || "", disabled:!edita, "aria-label":"Taxa dos juros da parte "+(i+1), placeholder:"2,5% ao mês", onChange:function(ev){ alt(i, {taxa:ev.target.value}); }, className:CAMPO})),
        p.linhaExtra && p.linhaExtra(r, i));
    }),
    !sit.vazio && !sit.fecha && e("p",{className:"rounded-lg bg-[#EF4444]/15 px-2 py-1 text-[12px] text-[#F87171]"}, sit.aviso),
    edita && e("div",{className:"flex flex-wrap justify-center gap-1.5"},
      e(Bt,{ic:"plus", onClick:function(){ nova(null); }}, "Parte"),
      e(Bt,{ic:"arrow-right", onClick:dividir}, "Dividir o restante"),
      p.botoes));
}
// resumo em células (rótulo em cima, valor embaixo) e tabela pequena da ficha: peça única TabelaPlanilha, sem filtro (poucas linhas), nada abreviado
function Resumo(p){ return e("div",{className:"grid gap-1.5", style:{gridTemplateColumns:"repeat("+p.itens.length+", minmax(0, 1fr))"}}, p.itens.map(function(i, k){ return e(Dado,{key:k, t:i[0], v:i[1], mono:true, cor:i[2]}); })); }
function Grade(p){ return e(TabelaPlanilha,{cols:p.cols, linhas:p.linhas, chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nenhum item."}); }
function PlanoPag(p){
  var c = p.c, ped = p.ped, cfg = c.ce.config, pagavel = PAGAVEL_STATUS.indexOf(ped.status)>=0;
  var base = rowsDe(ped.plano);
  var chave = JSON.stringify(base), st = useState({chave:chave, rows:base, forcar:false, motivo:""}), v = st[0];
  var rows = v.chave===chave ? v.rows : base, sujo = JSON.stringify(rows)!==chave;
  var edita = podeEditarPlano(c.s, ped, c.uid, c.papel), liberada = !!ped.decisao;   // depois de liberar, trocar a forma ou passar do total pede motivo
  var set = function(r){ st[1]({chave:chave, rows:r, forcar:v.forcar, motivo:v.motivo}); };
  var salvar = function(){
    if(ped.enviada && !v.forcar){ st[1]({chave:chave, rows:rows, forcar:true, motivo:v.motivo}); return c.aviso("Já foi enviado aos pagamentos: clique em Salvar plano de novo para confirmar a alteração."); }
    c.exec({op:"pedido_plano_set", id:ped.id, forcar:v.forcar, motivo:v.motivo, plano:linhasDoPlano(rows)});
  };
  var def = ped.status==="LIBERADA" && ped.liberacao && ped.liberacao.modo==="plano";
  return e(Painel,{t:"Plano de pagamento", ic:"currency-circle-dollar"},
    def && e("p",{className:"rounded-lg bg-black/25 px-2 py-1 text-[11px]"}, "Plano definido na análise financeira ("+ped.liberacao.por+")."),
    liberada && sujo && e(Campo,{rot:"Motivo da mudança (obrigatório se mudar a forma ou passar do total liberado)"}, e("input",{value:v.motivo, onChange:function(ev){ st[1]({chave:chave, rows:rows, forcar:v.forcar, motivo:ev.target.value}); }, className:CAMPO})),
    e(PlanoEditor,{rows:rows, set:set, cfg:cfg, edita:edita, refTotal:ped, aviso:c.aviso, formas:formasDe(ped),
      linhaExtra:function(r){ return pagavel && r.id && !sujo && e("div",{className:"flex justify-center"}, r.pago ? e(Selo,{cor:"ok", ic:"check-circle"}, "Paga") : e(Bt,{className:"py-1!", ic:"check-circle", onClick:function(){ c.exec({op:"pedido_plano_pago", id:ped.id, parteId:r.id}); }}, "Marcar paga")); },
      botoes:[sujo && e(Bt,{key:"d", ic:"arrow-counter-clockwise", onClick:function(){ set(base); }}, "Desfazer"), sujo && e(Bt,{key:"s", tipo:"forte", ic:"check-circle", onClick:salvar}, "Salvar plano")]}));
}

// ───────────── conferência do envio para pagamentos ─────────────
function Conferencia(p){
  var c = p.c, ped = pedidoDe(c.s, p.id), st = useState({destino:"ambos", forcar:false}), v = st[0];
  useEffect(function(){ var f = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, []);
  if(!ped) return null;
  var pf = c.s.pf && c.s.pf.fornecedores, cp = c.s.cp && c.s.cp.destinos;
  var pp = compraParaPedidoPagamentos(ped, {fornecedores:c.ce.fornecedores, pfFornecedores:pf, config:c.ce.config}), orient = compraParaOrientacoes(ped, {fornecedores:c.ce.fornecedores, destinos:cp || []});
  var env = ped.enviadaPagamentos, tr = TRANSICOES.enviar_pagamentos, pode = c.pode(tr, ped) && podeAcaoPedido(ped, "enviar_pagamentos");
  var json = JSON.stringify({pedidoPagamentos:pp, orientacoesPix:orient}, null, 2);
  var enviar = function(){ if(c.exec({op:"pedido_enviar_pagamentos", id:ped.id, destino:v.destino, forcar:v.forcar})) p.fechar(); };
  var col1 = e(Painel,{key:"a", t:"Pedido em pagamentos a fornecedores", ic:"receipt"},
    e("div",{className:"grid grid-cols-2 gap-1.5"}, e(Dado,{t:"Fornecedor", v:pp.fornecedorNome || "—"}), e(Dado,{t:"Número", v:pp.numero}), e(Dado,{t:"Data", v:formatarDia(pp.data)}), e(Dado,{t:"Total", v:formatarReais(pp.total), mono:true}), e(Dado,{t:"CNPJ pagador", v:pp.cnpj || "—"}), e(Dado,{t:"Nota fiscal", v:{com:"Com nota", sem:"Sem nota", misto:"Mista"}[pp.nfTipo]})),
    pp.linhas.length>0 ? e(Grade,{cols:[{k:"forma", t:"Forma"}, {k:"venc", t:"Vencimento"}, {k:"valor", t:"Valor"}, {k:"qtd", t:"Parcelas"}], linhas:pp.linhas.map(function(l, i){ return {id:i, forma:ROTULO_FORMA_PLANO[l.forma] || l.forma, venc:formatarDia(l.venc), valor:formatarReais(l.valor), qtd:l.qtd}; })}) : e("p",{className:"text-[11px]"}, "Nenhuma parte de pagamento."),
    pp.avisos.map(function(a, i){ return e("p",{key:i, className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1 text-[12px] text-[#FBBF24]"}, a); }));
  var col2 = e(Painel,{key:"b", t:"Orientações de Pix", ic:"currency-circle-dollar"},
    orient.length===0 ? e("p",{className:"px-2 py-2 text-[12.5px] text-white/60"}, "Nenhuma parte em Pix revendedora.") : orient.map(function(o, i){
      return e("div",{key:i, className:"flex flex-col items-center rounded-lg bg-black/25 px-2 py-1.5 text-center"}, e("b",{className:"text-[13px]"}, o.destinoNome || "—"), e("span",{className:MONO+" text-[15px] text-[#BFDBFE]"}, formatarReais(o.valor)),
        e("span",{className:"text-[11.5px] text-white/65"}, "Até "+(formatarDia(o.ate) || "—")+" · "+o.obs), o.destinoId==null && e("span",{className:"text-[11px] text-[#FBBF24]"}, "Destino não encontrado no controle de pagamentos"));
    }),
    env && e("div",{className:"flex flex-col items-center gap-1"}, e(Selo,{cor:"ok", ic:"check-circle"}, "Enviada em "+formatarDataHora(env.em)), e("span",{className:"text-[12px] text-white/70"}, "Por "+env.por+" · "+({pagamentos:"Pagamentos", orientacoes:"Orientações", ambos:"Pagamentos e orientações"}[env.destino] || "")))
  );
  return e(Janela,{t:env ? "Enviado para pagamentos" : "Enviar para pagamentos", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, colunas:[col1, col2],
    rodape:[
      !env && e("select",{key:"d", value:v.destino, "aria-label":"Destino", onChange:function(ev){ st[1](Object.assign({}, v, {destino:ev.target.value})); }, className:INPUT+" h-9! text-[13px]! text-center"}, opt("ambos", "Pagamentos e orientações"), opt("pagamentos", "Só pagamentos"), opt("orientacoes", "Só orientações")),
      !env && !pp.pronto && e("label",{key:"f", className:"flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold"}, e("input",{type:"checkbox", checked:v.forcar, onChange:function(ev){ st[1](Object.assign({}, v, {forcar:ev.target.checked})); }}), "Enviar mesmo assim"),
      e(Bt,{key:"j", ic:"copy", onClick:function(){ copiarTexto(c, json, "JSON copiado."); }}, "Copiar JSON"),
      !env && e(Bt,{key:"e", tipo:"forte", ic:"paper-plane-tilt", disabled:!pode, semAut:!pode, onClick:enviar}, "Enviar para pagamentos"),
      e(Bt,{key:"x", onClick:p.fechar}, "Fechar")]});
}

// ───────────── nova solicitação e edição ─────────────
var SEQ = 0;
function itemVazio(cls){ return {k:++SEQ, titulo:"", quantidade:1, unidade:"UNID", valorUnitario:null, classificacao:cls || "", materialId:""}; }
// FORMAS DE PAGAMENTO DISPONÍVEIS na solicitação (18/11/2026): várias ao mesmo tempo, cada uma com as condições do fornecedor. Sem NF = só Dinheiro e Pix REV.
function EditorFormas(p){
  var fd = p.fd, op = fd.opcoes, dis = p.disabled;
  var marca = function(k, on){ var o = Object.assign({}, op); if(on) o[k] = k==="boleto" ? {ref:"emissao_nf"} : {}; else delete o[k]; p.set({semNF:fd.semNF, opcoes:o}); };
  var altOp = function(k, patch){ var o = Object.assign({}, op); o[k] = Object.assign({}, op[k], patch); p.set({semNF:fd.semNF, opcoes:o}); };
  var semNF = function(on){ var o = {}; Object.keys(op).forEach(function(k){ if(!on || FORMAS_SEM_NF.indexOf(k)>=0) o[k] = op[k]; }); p.set({semNF:on, opcoes:o}); };
  var campo = function(k, chave, ph, tipo){ return e("input",{type:tipo || "text", min:tipo ? 1 : undefined, max:tipo ? p.parcelasMax : undefined, value:op[k][chave]==null ? "" : op[k][chave], disabled:dis, placeholder:ph, "aria-label":ROTULO_FORMA_DISP[k]+": "+ph, onChange:function(ev){ var x = {}; x[chave] = ev.target.value; altOp(k, x); }, className:CAMPO}); };
  return e("div",{className:"flex flex-col gap-1.5"},
    e("label",{className:"flex cursor-pointer items-center justify-center gap-2 text-[13px] font-bold"}, e("input",{type:"checkbox", checked:!!fd.semNF, disabled:dis, onChange:function(ev){ semNF(ev.target.checked); }}), "Sem NF (só Dinheiro e Pix REV)"),
    FORMAS_DISP.map(function(k){
      var on = !!op[k], bloq = !!fd.semNF && FORMAS_SEM_NF.indexOf(k)<0, o = op[k] || {};
      return e("div",{key:k, className:"flex flex-col gap-1.5 rounded-lg bg-black/25 p-2 ring-1 ring-white/10 "+(bloq ? "opacity-50" : "")},
        e("label",{className:"flex cursor-pointer items-center gap-2 text-[13px] font-bold"}, e("input",{type:"checkbox", checked:on, disabled:dis || bloq, onChange:function(ev){ marca(k, ev.target.checked); }}), ROTULO_FORMA_DISP[k]),
        on && k==="cartao" && e("div",{className:"grid grid-cols-2 gap-1.5"},
          e("select",{value:JUROS_SEL(o.juros), disabled:dis, "aria-label":"Cartão: juros", onChange:function(ev){ altOp(k, {juros:ev.target.value}); }, className:CAMPO}, opt("", "Juros"), opt("nao", "Sem juros"), opt("sim", "Com juros")),
          campo(k, "parcelasMax", "Parcelas até", "number")),
        on && k==="cartao" && JUROS_SEL(o.juros)==="sim" && campo(k, "taxa", "Taxa ou condição dos juros"),
        on && k==="boleto" && e("div",{className:"grid grid-cols-2 gap-1.5"},
          campo(k, "parcelas", "Parcelas", "number"),
          campo(k, "prazos", "Prazos: 30/60/90")),
        on && k==="boleto" && e("select",{value:o.ref || "emissao_nf", disabled:dis, "aria-label":"Boleto: prazos contados a partir", onChange:function(ev){ altOp(k, {ref:ev.target.value}); }, className:CAMPO}, REF_PRAZO.map(function(r){ return opt(r[0], "Dias contados "+r[1]); })),
        on && k!=="cartao" && k!=="boleto" && campo(k, "condicao", k==="dinheiro" ? "Prazo ou condição" : "Condição (ex.: à vista)"));
    }));
}
function FormCompra(p){
  var c = p.c, ce = c.ce, cfg = ce.config, ed = p.ped || null;
  var podeItens = ed ? (podeAcaoPedido(ed, "itens_set") && c.pode(TRANSICOES.itens_set, ed)) : true, podeDados = ed ? (c.opera || (ed.status==="AGUARDANDO_ORCAMENTO" && c.pode(TRANSICOES.reenviar, ed))) : true;   // pedido devolvido: o solicitante corrige fornecedor, condições e formas (18/11/2026); salvar NÃO reenvia
  var ini = ed ? {forn:ed.fornecedor || "", titulo:ed.titulo, setorId:ed.setorId==null ? "" : String(ed.setorId), categoriaId:ed.categoriaId==null ? "" : String(ed.categoriaId), urgencia:ed.urgencia, fd:ed.formasDisp ? JSON.parse(JSON.stringify(ed.formasDisp)) : {semNF:false, opcoes:{}}, motivo:"", previsao:ed.previsaoEntrega || "", link:ed.link || "", obs:ed.observacao || "", cond:ed.condicoesTxt || "",
      itens:ed.itens.map(function(i){ return {k:++SEQ, titulo:i.titulo, quantidade:i.quantidade, unidade:i.unidade, valorUnitario:i.valorUnitario!=null ? i.valorUnitario : (i.valorTotal && i.quantidade ? r2(i.valorTotal/i.quantidade) : null), classificacao:i.classificacao || "", materialId:i.materialId==null ? "" : String(i.materialId)}; })}
    : {forn:"", titulo:"", setorId:"", categoriaId:"", urgencia:"MEDIA", fd:{semNF:false, opcoes:{}}, motivo:"", previsao:"", link:"", obs:"", cond:"", itens:[itemVazio((cfg.classificacoes[0] || {}).id)]};
  var st = useState(ini), f = st[0];
  useEffect(function(){ var h = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", h); return function(){ window.removeEventListener("keydown", h); }; }, []);
  var set = function(k, x){ var n = Object.assign({}, f); n[k] = x; st[1](n); };
  var alt = function(i, patch){ set("itens", f.itens.map(function(x, k){ return k===i ? Object.assign({}, x, patch) : x; })); };
  var total = r2(f.itens.reduce(function(t, i){ return t+(i.valorUnitario || 0)*(Number(i.quantidade) || 0); }, 0));
  var forn = ce.fornecedores.find(function(x){ return norm(x.nome)===norm(f.forn); });
  var dados = function(){
    var o = {urgencia:f.urgencia, setorId:idDe(ce.setores, f.setorId) || "", categoriaId:idDe(ce.categorias, f.categoriaId) || "", previsaoEntrega:f.previsao, link:f.link, observacao:f.obs, condicoesTxt:f.cond, fornecedorId:forn ? forn.id : undefined, fornecedorNome:forn ? forn.nome : f.forn.trim()};
    if(!ed || Object.keys(f.fd.opcoes).length) o.formasDisp = f.fd;   // pedido antigo sem formas: só manda se alguém marcou
    if(f.motivo.trim()) o.motivo = f.motivo; return o;
  };
  var itensAcao = function(){ return f.itens.map(function(i){ return {titulo:i.titulo, quantidade:i.quantidade, unidade:i.unidade, valorUnitario:i.valorUnitario==null ? undefined : i.valorUnitario, classificacao:i.classificacao || undefined, materialId:idDe(ce.materiais, i.materialId)}; }); };
  var salvar = function(){
    if(!f.forn.trim()) return c.aviso("Informe o fornecedor.");
    if(!ed && !Object.keys(f.fd.opcoes).length) return c.aviso("Marque as formas de pagamento que o fornecedor aceita.");
    if(!ed){ if(c.exec(Object.assign({op:"pedido_add", titulo:f.titulo, itens:itensAcao()}, dados()))) p.fechar(); return; }
    if(podeItens && !c.exec({op:"pedido_itens_set", id:ed.id, itens:itensAcao(), titulo:f.titulo})) return;
    if(podeDados && !c.exec(Object.assign({op:"pedido_set", id:ed.id}, dados()))) return;
    p.fechar();
  };
  var col1 = e(Painel,{key:"a", t:"Fornecedor e dados", ic:"buildings"},
    e(Campo,{rot:"Fornecedor"}, e("input",{value:f.forn, list:"dl-fornecedores", disabled:!podeDados, placeholder:"Escolha ou digite um novo", onChange:function(ev){ set("forn", ev.target.value); }, className:CAMPO}),
      e("datalist",{id:"dl-fornecedores"}, ce.fornecedores.map(function(x){ return e("option",{key:x.id, value:x.nome}); })),
      f.forn.trim() && e("span",{className:"flex justify-center"}, forn ? e(Selo,{cor:"ok", ic:"check-circle"}, "Fornecedor cadastrado") : e(Selo,{cor:"info", ic:"plus"}, "Novo fornecedor"))),
    e(Campo,{rot:"Título (opcional)"}, e("input",{value:f.titulo, disabled:!podeItens && !podeDados, onChange:function(ev){ set("titulo", ev.target.value); }, className:CAMPO})),
    e("div",{className:"grid grid-cols-2 gap-1.5"},
      ce.setores.length>0 && e(Campo,{rot:"Setor solicitante"}, e("select",{value:f.setorId, disabled:!podeDados, onChange:function(ev){ set("setorId", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "—"), ce.setores.map(function(x){ return opt(x.id, x.nome); }))),
      ce.categorias.length>0 && e(Campo,{rot:"Categoria"}, e("select",{value:f.categoriaId, disabled:!podeDados, onChange:function(ev){ set("categoriaId", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "—"), ce.categorias.map(function(x){ return opt(x.id, x.nome); }))),
      e(Campo,{rot:"Urgência"}, e("select",{value:f.urgencia, disabled:!podeDados, onChange:function(ev){ set("urgencia", ev.target.value); }, className:CAMPO}, URGENCIAS.map(function(u){ return opt(u, ROTULO_URGENCIA[u]); }))),
      e(Campo,{rot:"Prazo de entrega"}, e("input",{type:"date", value:f.previsao, disabled:!podeDados, onChange:function(ev){ set("previsao", ev.target.value); }, className:CAMPO}))),
    ed && ed.decisao && e(Campo,{rot:"Motivo da mudança (obrigatório se trocar o fornecedor depois de liberada)"}, e("input",{value:f.motivo, disabled:!podeDados, onChange:function(ev){ set("motivo", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Link"}, e("input",{value:f.link, disabled:!podeDados, onChange:function(ev){ set("link", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Condições"}, e("input",{value:f.cond, disabled:!podeDados, onChange:function(ev){ set("cond", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Observações"}, e("textarea",{value:f.obs, rows:2, disabled:!podeDados, onChange:function(ev){ set("obs", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})));
  var col2 = e(Painel,{key:"b", t:"Itens", ic:"package"},
    f.itens.map(function(it, i){
      var entra = it.classificacao && entraNoEstoque(cfg, it.classificacao);
      return e("div",{key:it.k, className:"flex flex-col gap-1.5 rounded-lg bg-black/25 p-2 ring-1 ring-white/10"},
        e("div",{className:"flex items-center gap-1.5"},
          e("input",{value:it.titulo, disabled:!podeItens, "aria-label":"Descrição do item "+(i+1), placeholder:"Item "+(i+1), onChange:function(ev){ alt(i, {titulo:ev.target.value}); }, className:CAMPO}),
          podeItens && f.itens.length>1 && e("button",{type:"button", "aria-label":"Remover item "+(i+1), onClick:function(){ set("itens", f.itens.filter(function(x, k){ return k!==i; })); }, className:"grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20"}, e(Ph,{n:"x", s:14}))),
        e("div",{className:"grid grid-cols-2 gap-1.5"},
          e("input",{type:"number", min:1, value:it.quantidade, disabled:!podeItens, "aria-label":"Quantidade do item "+(i+1), onChange:function(ev){ alt(i, {quantidade:ev.target.value}); }, className:CAMPO+" "+MONO}),
          e("select",{value:it.unidade, disabled:!podeItens, "aria-label":"Unidade do item "+(i+1), onChange:function(ev){ alt(i, {unidade:ev.target.value}); }, className:CAMPO}, UNIDADES.map(function(u){ return opt(u, ROTULO_UNIDADE[u]); }))),
        e(Dinheiro,{value:it.valorUnitario, label:"Valor unitário do item "+(i+1), disabled:!podeItens, onChange:function(x){ alt(i, {valorUnitario:x}); }}),
        e("select",{value:it.classificacao, disabled:!podeItens, "aria-label":"Classificação do item "+(i+1), onChange:function(ev){ alt(i, {classificacao:ev.target.value}); }, className:CAMPO}, e("option",{value:""}, "Classificação…"), cfg.classificacoes.map(function(x){ return opt(x.id, x.nome+(x.entraEstoque ? " (entra no estoque)" : "")); })),
        entra && ce.materiais.length>0 && e("select",{value:it.materialId, disabled:!podeItens, "aria-label":"Material do estoque do item "+(i+1), onChange:function(ev){ alt(i, {materialId:ev.target.value}); }, className:CAMPO}, e("option",{value:""}, "Material do estoque (opcional)"), ce.materiais.map(function(m){ return opt(m.id, m.material); })),
        e("span",{className:MONO+" text-[12px] text-white/65"}, formatarReais(r2((it.valorUnitario || 0)*(Number(it.quantidade) || 0)))));
    }),
    podeItens && e(Bt,{ic:"plus", className:"self-center", onClick:function(){ set("itens", f.itens.concat([itemVazio(f.itens.length ? f.itens[f.itens.length-1].classificacao : "")])); }}, "Item"));
  var nOrc = orcamentosExigidos(cfg, total);
  var col3 = e("div",{key:"c", className:"flex flex-col gap-1.5"},
    e(Painel,{t:"Formas de pagamento disponíveis", ic:"currency-circle-dollar"},
      e(EditorFormas,{fd:f.fd, set:function(x){ set("fd", x); }, disabled:!podeDados, parcelasMax:cfg.parcelasMax}),
      e("p",{className:"px-1 text-[11px]"}, "O que o fornecedor aceita. O financeiro escolhe o CNPJ pagador e a forma na análise financeira.")),
    e(Painel,{t:"Resumo", ic:"receipt"},
      e(Resumo,{itens:[["Itens", String(f.itens.length)], ["Total", formatarReais(total)]]}),
      nOrc>0 && e("p",{className:"rounded-lg bg-[#60A5FA]/15 px-2 py-1.5 text-[11px] text-[#BFDBFE]"}, "Esta compra pede "+nOrc+" orçamentos. "+textoOrcamentos(cfg)+"."),
      ed && !podeItens && !podeDados && e("p",{className:"text-[13px] text-[#FBBF24]"}, "Sem autorização para editar esta compra.")));
  return e(Janela,{t:ed ? "Editar compra #"+ed.id : "Nova solicitação de compra", sub:ed ? ed.titulo : "Enviada ao financeiro para aprovação", fechar:p.fechar, colunas:[col1, col2, col3],
    rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"s", tipo:"forte", ic:"paper-plane-tilt", disabled:!!ed && !podeItens && !podeDados, semAut:true, onClick:salvar}, ed ? "Salvar alterações" : "Enviar solicitação")]});
}

// ───────────── detalhe da compra (3 colunas) ─────────────
var IDX = {NAO_VERIFICADA:0, AGUARDANDO:0, AGUARDANDO_ORCAMENTO:0, AGUARDANDO_AUTORIZACAO:0, AGUARDANDO_CNPJ:1, AGUARDANDO_FORMA_PAGAMENTO:1, APROVADA:1, LIBERADA:2, COMPRADA:3, EM_TRANSITO:3, RECEBIDA_PARCIAL:3, RECEBIDA:4, ENTREGUE:5};
var FORA_DOS_BOTOES = {plano_set:1, itens_set:1, enviar_pagamentos:1, etiqueta:1, decisao:1, cnpj:1, pagamento:1, vincular:1};   // CNPJ e pagamento agora ficam na janela da análise financeira (Liberar para compra)
// cor do tempo parado: 1 a 2 dias verde, 3 a 4 amarelo, 5 ou mais vermelho (igual ao cartão do funil)
var corDias = function(d){ return d>=5 ? "text-destructive" : d>=3 ? "text-warning" : "text-success"; };
var CLASSE_TOM = {success:"text-success", danger:"text-destructive", warning:"text-warning"};
// LINHA DO PROCESSO (Marcus, 17/11/2026: "bater o olho e saber o status"): as 6 etapas lado a lado; feita = verde com quem e quando, atual = destaque azul com o tempo parado em semáforo, futura = apagada.
function Processo(p){
  var ped = p.ped, idx = IDX[ped.status];
  var ultRec = ped.recebimentos.length ? ped.recebimentos[ped.recebimentos.length-1] : null;
  var passos = [
    {t:"Solicitada", quem:ped.solicitante, em:ped.solicitadoOriginalEm || ped.solicitadoEm, nota:ped.status==="AGUARDANDO_AUTORIZACAO" ? "Aguardando autorização" : ped.status==="AGUARDANDO_ORCAMENTO" ? "Novo orçamento pedido" : ped.status==="AGUARDANDO" ? "Em espera" : ""},
    {t:"Análise financeira", quem:ped.aprovadoPor, em:ped.aprovadoEm, nota:ETAPA_ANALISE.indexOf(ped.status)>=0 ? pendenciasAnalise(ped).join(" · ") : ped.cnpj || ""},
    {t:"Liberada", quem:ped.liberacao ? ped.liberacao.por : "", em:ped.liberacao ? ped.liberacao.em : "", nota:ETAPA_ANALISE.indexOf(ped.status)>=0 ? "Falta a análise financeira liberar" : ped.liberacao ? (ped.liberacao.modo==="plano" ? "Com CNPJ e forma de pagamento definidos" : "Só liberação: o comprador decide como comprar")+(ped.liberacao.nota ? " · "+ped.liberacao.nota : "") : ""},
    {t:"Efetuada", quem:ped.comprador, em:ped.compradoEm, nota:ped.valorCompra!=null ? formatarReais(ped.valorCompra)+(ped.status==="EM_TRANSITO" ? " · em trânsito" : "") : ""},
    {t:"Recebida", quem:ped.recebidoPor, em:ped.recebidoEm || (ultRec ? ultRec.dia : ""), nota:ped.status==="RECEBIDA_PARCIAL" ? "Recebida em parte: "+ped.recebimento.recebida+" de "+ped.recebimento.pedida : ""},
    {t:"Entregue", quem:ped.entregueParaNome, em:ped.entregueEm, nota:""}];
  var final = ped.status==="NEGADA" || ped.status==="CANCELADA";
  var lista = passos.map(function(x, i){
    var estado = final ? (x.em ? "feito" : "futuro") : ped.status==="ENTREGUE" ? "feito" : i<idx ? "feito" : i===idx ? "atual" : "futuro";
    return Object.assign({estado:estado}, x);
  });
  if(final) lista = lista.filter(function(x){ return x.estado==="feito"; }).concat([{t:ped.status==="NEGADA" ? "Reprovada" : "Cancelada", estado:"cancelado", quem:ped.status==="NEGADA" ? "" : ped.canceladoPor, em:ped.canceladoEm || ped.respondidoEm, nota:ped.status==="NEGADA" ? ped.motivoNegativa : ped.motivoCancelamento}]);
  var cores = {feito:"text-success", atual:"text-white", futuro:"", cancelado:"text-destructive"}, ics = {feito:"check-circle", atual:"circle-notch", futuro:"circle", cancelado:"x-circle"};
  var dias = diasNaEtapa(ped);
  return e("div",{className:"flex gap-1"}, lista.map(function(x, i){
    return e("div",{key:i, className:"flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md border px-2 py-0.5 text-center "+(x.estado==="atual" ? "border-2 border-white/70 bg-[var(--bloco-titulo)]" : x.estado==="feito" ? "border-[var(--positivo)]/50" : x.estado==="cancelado" ? "border-[var(--negativo)]" : "border-dashed border-white/20 opacity-60")},
      e("span",{className:"flex items-center gap-1 text-[11px] font-bold "+cores[x.estado]}, e(Ph,{n:ics[x.estado], s:12, fill:x.estado==="feito"}), x.t),
      x.estado==="atual" && e("span",{className:"text-[11px] font-bold tabular-nums "+corDias(dias)}, textoDias(dias)+" nesta etapa"),
      (x.quem || x.em) && e("span",{className:"text-[11px] leading-tight"}, [x.quem, x.em ? formatarDataHora(x.em) : ""].filter(Boolean).join(" · ")),
      x.nota && e("span",{className:"break-words text-[11px] leading-tight "+(x.estado==="atual" ? "font-semibold" : "")}, x.nota));
  }));
}
// linha de rótulo e valor dos blocos
function Linha(p){ return p.v==null || p.v==="" ? null : e("div",{className:"flex items-center justify-between gap-3 border-b border-white/10 py-0.5 last:border-b-0"}, e("span",{className:"text-[11px] font-semibold uppercase"}, p.t), e("span",{className:"text-right text-[11px] font-bold tabular-nums "+(p.cor || "")}, p.v)); }
// quantos dias faltam (ou passaram) para uma data: "em 3 dias", "hoje", "atrasada há 2 dias"
function prazoTexto(dia, final){
  if(!dia) return {v:"—", cor:""};
  var d = diasEntre(hojeSP(), String(dia).slice(0, 10)), data = formatarDia(dia);
  if(final) return {v:data, cor:""};
  return d<0 ? {v:data+" · atrasada há "+textoDias(-d), cor:"text-destructive"} : d===0 ? {v:data+" · hoje", cor:"text-warning"} : {v:data+" · em "+textoDias(d), cor:d<=2 ? "text-warning" : "text-success"};
}
// SITUAÇÃO E PRAZOS: tudo que diz "como está esta compra" em linhas curtas, com cor só de estado
function Prazos(p){
  var ped = p.ped, final = ["NEGADA", "CANCELADA", "ENTREGUE"].indexOf(ped.status)>=0, dias = diasNaEtapa(ped), solic = Math.max(0, diasEntre(String(ped.solicitadoOriginalEm || ped.solicitadoEm).slice(0, 10), hojeSP()));
  var ent = prazoTexto(ped.previsaoEntrega, final), ven = prazoTexto(ped.proximoVencimento, final || ped.pago);
  return e(Painel,{t:"Situação e prazos", ic:"clock"}, e("div",{className:"flex flex-col text-left"},
    e(Linha,{t:"Situação", v:ped.rotuloStatus, cor:CLASSE_TOM[ped.tom] || ""}),
    ped.atrasado && !final && e(Linha,{t:"Resposta", v:"Atrasada", cor:"text-destructive"}),
    e(Linha,{t:"Urgência", v:ped.rotuloUrgencia, cor:ped.urgencia==="ALTA" ? "text-destructive" : ped.urgencia==="MEDIA" ? "text-warning" : ""}),
    !final && e(Linha,{t:"Nesta etapa há", v:textoDias(dias), cor:corDias(dias)}),
    e(Linha,{t:"Solicitada há", v:textoDias(solic)}),
    e(Linha,{t:"Prazo de entrega", v:ent.v, cor:ent.cor}),
    e(Linha,{t:"Vencimento", v:ven.v, cor:ven.cor}),
    e(Linha,{t:ped.valorCompra!=null ? "Valor da compra" : "Valor estimado", v:ped.valorCompra==null && !(ped.valorFinal>0) ? "A definir" : formatarReais(ped.valorFinal)})));
}
// texto de uma parte do pagamento: "Boleto R$ 250,00 em 3x · 30 dias após a nota", "Cartão R$ 500,00 em 6x com juros (2,5% ao mês) · vence 20/11/2026"
var textoParte = function(x){
  return (ROTULO_FORMA_PLANO[x.forma] || x.forma)+" "+formatarReais(x.valor)+(x.parcelas>1 ? " em "+x.parcelas+"x" : "")+(x.forma==="cartao" && x.juros!=null ? (x.juros ? " com juros"+(x.taxa ? " ("+x.taxa+")" : "") : " sem juros") : "")+(x.vencimento ? " · vence "+formatarDia(x.vencimento) : "")+(x.prazo ? " · "+x.prazo : "");
};
var nomesFormas = function(l){ return (l || []).map(function(f){ return ROTULO_FORMA_DISP[f] || ROTULO_FORMA_PLANO[f] || f; }).join(" + "); };
// DECISÃO FINANCEIRA (18/11/2026): o que a análise financeira decidiu (CNPJ, forma, condições, quem e quando), o que o fornecedor aceitava, liberações anteriores e divergências
function DecisaoFin(p){
  var ped = p.ped, d = ped.decisao, pend = pendenciasAnalise(ped), hist = ped.decisoesHist || [], div = ped.divergencias || [];
  var tit = function(t){ return e("span",{className:"pt-1 text-[11px] font-bold uppercase"}, t); };
  return e(Painel,{t:"Decisão financeira", ic:"currency-circle-dollar"},
    pend.length>0 && e("div",{className:"flex flex-wrap justify-center gap-2"}, pend.map(function(x){ return e(Selo,{key:x, cor:x==="Pronto para liberar" ? "ok" : "alerta", ic:x==="Pronto para liberar" ? "check-circle" : "warning"}, x); })),
    d ? e("div",{className:"flex flex-col text-left"},
        e(Linha,{t:"CNPJ pagador", v:d.cnpj || "Não informado"}), e(Linha,{t:"Forma escolhida", v:nomesFormas(d.formas)}), e(Linha,{t:"Total liberado", v:formatarReais(d.total)}),
        e(Linha,{t:"Decidido por", v:d.por+" · "+formatarDataHora(d.em)}), e(Linha,{t:"Observação", v:d.nota}),
        (d.plano || []).map(function(x, i){ return e(Linha,{key:i, t:"Parte "+(i+1), v:textoParte(x)}); }))
      : e("div",{className:"flex flex-col text-left"}, e(Linha,{t:"CNPJ pagador", v:ped.cnpj || "Não informado"}), e(Linha,{t:"Forma escolhida", v:ped.plano.length ? nomesFormas(ped.plano.map(function(x){ return x.forma; }).filter(function(x, k, l){ return l.indexOf(x)===k; })) : "Não informado"})),
    tit("Formas que o fornecedor aceita"),
    e(FormasDisponiveis,{fd:ped.formasDisp}),
    div.length>0 && tit("Divergências depois da compra"),
    div.map(function(x, i){ return e("div",{key:"d"+i, className:"break-words rounded-md border border-[var(--negativo)] px-2 py-0.5 text-left text-[11px]"}, formatarDataHora(x.em)+" · "+x.por+" · "+x.campos.join(", ")+". Motivo: "+x.motivo); }),
    hist.length>0 && tit("Liberações anteriores"),
    hist.slice().reverse().map(function(x, i){ return e("div",{key:"h"+i, className:"break-words rounded-md border border-white/20 px-2 py-0.5 text-left text-[11px]"}, formatarDataHora(x.em)+" · "+x.por+" · "+(x.cnpj || "Não informado")+" · "+nomesFormas(x.formas)+" · "+formatarReais(x.total)+(x.motivo ? ". Trocada por "+x.substituidaPor+" em "+formatarDataHora(x.substituidaEm)+": "+x.motivo : "")); }));
}
function HistoricoCompra(p){
  var ped = p.ped, st = useState(false), todos = st[0], evs = ped.eventos.slice().reverse(), vis = todos ? evs : evs.slice(0, 5);
  return e(Painel,{t:"Histórico", ic:"clock-counter-clockwise"},
    // evento automático do sistema; o que virou aviso no SorellyChat ganha a marca "Aviso no chat" (as mensagens de pessoas ficam no bloco Conversa)
    vis.length===0 ? e("p",{className:"text-[13px]"}, "Nenhum movimento.") : vis.map(function(ev, i){ return e("div",{key:i, className:"rounded-md border border-white/20 px-2 py-0.5 text-left text-[11px] leading-tight"}, e("span",{className:"flex flex-wrap items-center justify-between gap-1 font-semibold tabular-nums"}, formatarDataHora(ev.em)+" · "+ev.por, ev.aviso && e("span",{className:"inline-flex items-center gap-1 text-[#BFDBFE]"}, e(Ph,{n:"bell", s:11}), "Aviso no chat")), e("div",{className:"break-words"}, ev.texto)); }),
    evs.length>5 && e("button",{type:"button", onClick:function(){ st[1](!todos); }, className:"h-8 rounded-md border border-white/30 text-[11px] font-semibold hover:bg-white/10"}, todos ? "Ver menos" : "Ver todo o histórico ("+evs.length+")"));
}
// CONVERSA DO PEDIDO = o grupo do pedido no SorellyChat (18/11/2026, src/server/compras-chat.js): lê e escreve lá. O que o solicitante responde no chat aparece aqui (é a mesma conversa, sem cópia e sem ciclo).
// As mensagens antigas (gravadas só no pedido, antes de 18/11/2026) continuam aparecendo em cima. Aviso automático e mensagem de pessoa têm visual diferente.
var dataDoChat = function(t){ try { return new Date(t).toLocaleString("pt-BR", {timeZone:"America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"}).replace(",", ""); } catch(x){ return ""; } };
var uidMsg = function(){ return "m"+Date.now().toString(36)+Math.random().toString(36).slice(2, 7); };
function Conversa(p){
  var c = p.c, ped = p.ped, st = useState(""), t = st[0], sv = useState({msgs:null, membros:[], erro:"", enviando:false}), v = sv[0], antigas = ped.mensagens || [];
  var api = apiAtiva();
  var ler = function(){ if(!api) return; chamar("GET", "/compras/conversa?pedido="+encodeURIComponent(ped.id)).then(function(r){ sv[1](function(o){ return Object.assign({}, o, {msgs:r.msgs || [], membros:r.membros || [], erro:""}); }); }).catch(function(x){ sv[1](function(o){ return Object.assign({}, o, {erro:x.message}); }); }); };
  useEffect(function(){ ler(); var tm = setInterval(ler, 8000); return function(){ clearInterval(tm); }; }, [ped.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  var enviar = function(){
    var tx = t.trim(); if(!tx) return c.aviso("Escreva a mensagem.");
    if(!api){ if(c.exec({op:"pedido_msg", id:ped.id, texto:tx})) st[1](""); return; }   // sem servidor (demonstração): fica só no pedido, como antes
    if(v.enviando) return; sv[1](Object.assign({}, v, {enviando:true}));
    chamar("POST", "/compras/conversa", {pedido:ped.id, id:uidMsg(), texto:tx}).then(function(r){ st[1](""); sv[1](function(o){ return Object.assign({}, o, {enviando:false}); }); if(!r.entregueAoSolicitante) c.aviso("Mensagem salva no pedido. O solicitante ainda não está vinculado a uma conta: ela não chegou ao chat dele."); ler(); })
      .catch(function(x){ sv[1](function(o){ return Object.assign({}, o, {enviando:false}); }); c.aviso("Mensagem não enviada: "+x.message+" O texto continua no campo para tentar de novo."); });
  };
  var linha = function(m, i){
    if(m.aviso) return e("div",{key:m.id || i, className:"rounded-md border border-[#60A5FA]/60 bg-[#3B82F6]/10 px-2 py-1 text-left text-[11px] leading-tight"}, e("span",{className:"flex items-center gap-1 font-semibold tabular-nums text-[#BFDBFE]"}, e(Ph,{n:"bell", s:11}), "Aviso automático · "+dataDoChat(m.t)), e("div",{className:"whitespace-pre-line break-words"}, m.texto));
    return e("div",{key:m.id || i, className:"rounded-md bg-black/25 px-2 py-1 text-left text-[13px] leading-tight"}, e("span",{className:"flex items-center gap-1 text-[11px] font-semibold"}, e(Ph,{n:"user", s:11}), m.nome+" · "+dataDoChat(m.t)), e("div",{className:"break-words"}, m.texto));
  };
  var msgs = v.msgs || [];
  return e(Painel,{t:"Conversa", ic:"chat-circle-text"},
    api && e("p",{className:"px-1 text-[11px]"}, "Ligada ao SorellyChat: grupo \"Compra #"+ped.id+"\""+(v.membros.length ? " · "+v.membros.map(function(x){ return x.nome; }).join(", ") : "")),
    antigas.length>0 && antigas.map(function(m, i){ return e("div",{key:"a"+i, className:"rounded-md bg-black/25 px-2 py-1 text-left text-[13px] leading-tight"}, e("span",{className:MONO+" text-[11px]"}, m.por+" · "+formatarDataHora(m.em)+" · só no pedido"), e("div",{className:"break-words"}, m.texto)); }),
    api && v.msgs==null && !v.erro && e("p",{className:"px-2 py-1 text-[13px]"}, "Carregando a conversa"),
    v.erro && e("p",{className:"rounded-lg bg-[#EF4444]/15 px-2 py-1 text-[11px] text-[#F87171]"}, "Não foi possível ler a conversa do chat: "+v.erro),
    v.msgs && msgs.length===0 && antigas.length===0 && e("p",{className:"px-2 py-1 text-[13px]"}, "Nenhuma mensagem."),
    msgs.slice(-12).map(linha),
    e("div",{className:"flex gap-1.5"}, e("input",{value:t, placeholder:"Mensagem", "aria-label":"Mensagem", onChange:function(ev){ st[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") enviar(); }, className:CAMPO}),
      e("button",{type:"button", "aria-label":"Enviar mensagem", disabled:v.enviando, onClick:enviar, className:"grid size-8 shrink-0 place-items-center rounded-lg bg-[#3B82F6] hover:bg-[#60A5FA] disabled:opacity-40"}, e(Ph,{n:"paper-plane-tilt", s:15}))));
}
// AVISOS NO SORELLYCHAT do pedido: entregue, pendente ou sem vínculo; "Tentar de novo" pede ao servidor para entregar o que falta (nunca duplica)
function AvisosChat(p){
  var c = p.c, ped = p.ped, lista = avisosDoPedido(ped), sv = useState(null), sit = sv[0], api = apiAtiva();
  var conferir = function(){ if(!api || !lista.length) return; chamar("POST", "/compras/avisos", {pedidos:[ped.id]}).then(function(r){ sv[1](r.situacao && r.situacao[ped.id] || {entregues:[], pendentes:[], vinculo:ped.solicitanteId!=null}); }).catch(function(x){ sv[1]({erro:x.message, entregues:[], pendentes:[]}); }); };
  useEffect(function(){ conferir(); }, [ped.id, lista.length]);   // eslint-disable-line react-hooks/exhaustive-deps
  var semVinculo = ped.solicitanteId==null && (lista.length>0 || ["ENTREGUE", "NEGADA", "CANCELADA"].indexOf(ped.status)<0);   // pedido já encerrado e sem aviso: não precisa do alerta
  if(!lista.length && !semVinculo) return null;
  var ent = sit ? sit.entregues.length : 0, pen = sit ? sit.pendentes.length : 0;
  return e(Painel,{t:"Avisos no SorellyChat", ic:"bell"},
    semVinculo && e("div",{className:"flex flex-col items-center gap-1"}, e(Selo,{cor:"alerta", ic:"warning"}, "Sem vínculo com o chat: o solicitante não recebe os avisos"),
      c.opera && e(Bt,{ic:"link", onClick:function(){ p.ac.iniciar(ped, "vincular"); }}, "Vincular solicitante")),
    lista.length>0 && e("div",{className:"flex flex-col text-left"},
      lista.slice(-6).reverse().map(function(a){ var ok = sit && sit.entregues.indexOf(a.aid)>=0, pend = sit && sit.pendentes.indexOf(a.aid)>=0;
        return e(Linha,{key:a.aid, t:a.titulo, v:!sit ? "Conferindo" : ok ? "Entregue" : pend ? (sit.vinculo ? "Pendente" : "Sem vínculo") : "Pendente", cor:ok ? "text-success" : "text-warning"}); })),
    sit && sit.erro && e("p",{className:"text-[11px] text-[#F87171]"}, "Chat indisponível agora. A ação do pedido continua valendo; os avisos ficam pendentes."),
    sit && (pen>0 || sit.erro) && !semVinculo && e(Bt,{ic:"arrow-counter-clockwise", className:"self-center", onClick:conferir}, "Tentar de novo"),
    sit && ent>0 && pen===0 && !sit.erro && e("span",{className:"text-[11px]"}, "Todos os avisos chegaram ao chat."));
}
// VINCULAR SOLICITANTE (pedido antigo): escolhe a PESSOA do sistema; o aviso vai para a conta dela. Nunca por aproximação de nome.
function DlgVincular(p){
  var c = p.c, ped = p.ped, st = useState(""), pessoas = EQUIPE.slice().sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var x = pessoas.find(function(y){ return String(y.id)===String(st[0]); });
  var enviar = function(){ if(!x) return c.aviso("Escolha a pessoa."); if(c.exec({op:"pedido_vincular", id:ped.id, solicitanteId:x.id, solicitante:x.nome})) p.fechar(); };
  return e(Dialogo,{t:"Vincular solicitante", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"link", onClick:enviar}, "Vincular")]},
    e("p",{className:"text-[13px]"}, "Solicitante gravado no pedido: "+(ped.solicitante || "Não informado")+". Escolha a pessoa certa: os avisos vão para a conta dela no SorellyChat."),
    e(Campo,{rot:"Pessoa"}, e("select",{value:st[0], onChange:function(ev){ st[1](ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Selecione"), pessoas.map(function(y){ return opt(y.id, y.nome); }))));
}
function NotaFiscal(p){
  var c = p.c, ped = p.ped, st = useState(ped.notaFiscal || ""), t = st[0];
  return e("div",{className:"flex gap-1.5"}, e("input",{value:t, placeholder:"Número da nota fiscal", "aria-label":"Nota fiscal", onChange:function(ev){ st[1](ev.target.value); }, className:CAMPO}),
    e(Bt,{ic:"check-circle", disabled:t.trim()===(ped.notaFiscal || ""), onClick:function(){ c.exec({op:"pedido_nf", id:ped.id, notaFiscal:t}); }}, "Salvar"));
}
function Detalhe(p){
  var c = p.c, ac = p.ac, ped = p.ped;
  useEffect(function(){ if(p.bloqueado) return; var f = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [p.bloqueado]);
  var final = ped.status==="NEGADA" || ped.status==="CANCELADA" || ped.status==="ENTREGUE", pagavel = PAGAVEL_STATUS.indexOf(ped.status)>=0;
  var acoes = ped.acoes.filter(function(a){ return !FORA_DOS_BOTOES[a.op]; });
  var podeEditar = (podeAcaoPedido(ped, "itens_set") && c.pode(TRANSICOES.itens_set, ped)) || (c.opera && ["NEGADA", "CANCELADA", "ENTREGUE"].indexOf(ped.status)<0);
  var urg = {ALTA:"ruim", MEDIA:"alerta", BAIXA:"neutro"}[ped.urgencia];
  // Estoque no momento da solicitação (Nickolas, 17/11/2026): um bloco por item ligado a material do estoque; origem = Estoque de material
  var snapsEstoque = ped.itens.filter(function(i){ return i.materialId!=null; }).map(function(i){ var sn = estoqueDaSolicitacao(c.s, {materialId:i.materialId, quantidade:i.quantidade, solicitadoEm:ped.solicitadoOriginalEm || ped.solicitadoEm, solicitadoPor:ped.solicitante}); return sn && Object.assign(sn, {quantidadeTxt:Number(i.quantidade).toLocaleString("pt-BR")+" "+(i.rotuloUnidade || "")+(Number(i.fatorEntrada)>1 ? " ("+(Number(i.quantidade)*Number(i.fatorEntrada)).toLocaleString("pt-BR")+" "+sn.unidade+")" : "")}); });   // compra em caixa: mostra também o total em unidades do estoque
  var blocoEstoque = e(EstoqueMomento,{snaps:snapsEstoque});
  var col1 = e("div",{key:"a", className:"flex flex-col gap-1.5"},
    ped.status==="AGUARDANDO_ORCAMENTO" && e(BlocoDevolucao,{ped:ped}),   // pendência de ajuste em destaque (18/11/2026)
    e(Prazos,{ped:ped}),
    e(Painel,{t:"Dados da compra", ic:"receipt"},
      ped.enviada && e(Selo,{cor:"ok", ic:"check-circle"}, "Enviada aos pagamentos"),
      e("div",{className:"flex flex-col text-left"},
        e(Linha,{t:"Fornecedor", v:ped.fornecedor}), e(Linha,{t:"Solicitante", v:ped.solicitante}), e(Linha,{t:"Setor", v:ped.setorNome}), e(Linha,{t:"Categoria", v:ped.categoriaNome}),
        e(Linha,{t:"Classificação", v:ped.classificacoesTxt}), e(Linha,{t:"CNPJ pagador", v:ped.cnpj || "Não informado"}), e(Linha,{t:"Nº do pedido", v:ped.numeroFornecedor}), e(Linha,{t:"Condições", v:ped.condicoesTxt})),
      ped.link && e("a",{href:/^https?:\/\//i.test(ped.link) ? ped.link : "https://"+ped.link, target:"_blank", rel:"noopener noreferrer", className:"inline-flex items-center justify-center gap-1.5 break-all rounded-md border border-white/20 px-2 py-0.5 text-[11px] font-bold hover:bg-white/10"}, e(Ph,{n:"link", s:12}), ped.link),
      ped.observacao && e("p",{className:"break-words rounded-md border border-white/20 px-2 py-0.5 text-left text-[11px]"}, ped.observacao)),
    e(DecisaoFin,{ped:ped}),
    ped.origem && ped.origem.tipo==="estoque" ? e(RetratoEstoque,{c:c, o:ped.origem}) : blocoEstoque);   // retrato gravado no pedido (Nickolas, 16/11/2026) ou, em compra antiga, o calculado do histórico
  var blocoItens =
    e(Painel,{t:"Itens", ic:"package"},
      // uma FICHA por item (Nickolas, 16/11/2026): nome e valores sempre inteiros para quem aprova (a tabela espremida cortava com "…"). Sem preço ainda = "A definir", nunca R$ 0,00
      ped.itens.map(function(i){
        var semPreco = i.valorUnitario==null && !(i.valorTotal>0), corRec = i.qtdRecebida>=i.quantidade ? ESTADO.ok : i.qtdRecebida>0 ? ESTADO.alerta : "#FFFFFF";
        return e("div",{key:i.id, className:"flex flex-col gap-1.5 rounded-lg bg-black/25 p-2 ring-1 ring-white/10"},
          e("b",{className:"break-words text-[13px] leading-snug text-white"}, i.titulo),
          e("div",{className:"grid grid-cols-3 gap-1.5"},
            e(Dado,{t:"Quantidade", v:i.quantidade+" "+(i.rotuloUnidade || "").toLowerCase(), mono:true}),
            e(Dado,{t:"Unitário", v:i.valorUnitario!=null ? formatarReais(i.valorUnitario) : "A definir", mono:i.valorUnitario!=null}),
            e(Dado,{t:"Total", v:semPreco ? "A definir" : formatarReais(i.valorTotal), mono:!semPreco})),
          e("span",{className:"text-[11px] font-bold uppercase", style:{color:corRec}}, "Recebido: "+i.qtdRecebida+" de "+i.quantidade));
      }),
      ped.itens.some(function(i){ return i.semMaterial; }) && e("p",{className:"text-[11.5px] text-[#FBBF24]"}, "Há item que entra no estoque sem material ligado: no recebimento ele não dará entrada."),
      podeEditar && e(Bt,{ic:"pencil-simple", className:"self-center", onClick:function(){ ac.editar(ped.id); }}, "Editar compra"));
  var col2 = e("div",{key:"b", className:"flex flex-col gap-1.5"}, blocoItens, e(PlanoPag,{c:c, ped:ped}), e(HistoricoCompra,{ped:ped}), e(Conversa,{c:c, ped:ped}));
  var col3 = e("div",{key:"c", className:"flex flex-col gap-1.5"},
    e(Painel,{t:"Ações", ic:"seal-check"},
      acoes.length===0 ? e("p",{className:"px-2 py-1 text-[12.5px] text-white/60"}, "Sem ações disponíveis nesta etapa.") : e("div",{className:"flex flex-col gap-1.5"}, acoes.map(function(a){
        var ok = c.pode(a, ped);
        var bt = e(Bt,{key:a.op, tipo:COR_BT[a.op] || "normal", ic:ICONE_OP[a.op], disabled:!ok, semAut:true, onClick:function(){ ac.iniciar(ped, a.op); }}, a.rotulo);
        return a.op==="aprovar" ? [bt, e(Bt,{key:"aprovar_liberar", tipo:"forte", ic:"lock-open", disabled:!ok || !c.pode(TRANSICOES.liberar, ped), semAut:true, titulo:"Aprova e já faz a análise financeira (CNPJ e forma de pagamento)", onClick:function(){ ac.aprovarLiberar(ped); }}, "Aprovar e liberar")] : bt;
      }))),
    ped.recebimento.pedida>0 && (pagavel || ped.status==="APROVADA" || ped.status==="LIBERADA") && e(Painel,{t:"Recebimento", ic:"package"},
      e("div",{className:"h-2 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:Math.min(100, Math.round(100*ped.recebimento.recebida/Math.max(1, ped.recebimento.pedida)))+"%", background:ped.recebimento.completo ? ESTADO.ok : ESTADO.alerta}})),
      e("span",{className:MONO+" text-[12.5px]"}, ped.recebimento.recebida+" de "+ped.recebimento.pedida+" itens"),
      ped.recebimentos.map(function(r, i){ return e("div",{key:i, className:"rounded-md bg-black/25 px-2 py-1 text-[11.5px]"}, formatarDia(r.dia)+" · "+r.por+" · "+r.itens.reduce(function(t, x){ return t+x.qtd; }, 0)+" un."); })),
    e(AvisosChat,{c:c, ac:ac, ped:ped}),
    e(Painel,{t:"Entrega e nota fiscal", ic:"truck"},
      ped.entregueEm && e("div",{className:"grid grid-cols-2 gap-1.5"}, e(Dado,{t:"Entregue em", v:formatarDia(ped.entregueEm)}), e(Dado,{t:"Recebido por", v:ped.entregueParaNome}), e(Dado,{t:"Assinatura", v:ped.assinaturaConfirmada ? "Confirmada" : "Não confirmada"})),
      !final && ped.status!=="NAO_VERIFICADA" && e(NotaFiscal,{key:ped.id+"-"+ped.notaFiscal, c:c, ped:ped}),
      final && ped.notaFiscal && e(Dado,{t:"Nota fiscal", v:ped.notaFiscal}),
      // campo Etiqueta de logística tirado a pedido da Helen (Chamados, 03/11/2026); os dados antigos ficam guardados
      null),
    e(Painel,{t:"Pagamentos", ic:"currency-circle-dollar"},
      !pagavel ? e("p",{className:"px-2 py-1 text-[12.5px] text-white/60"}, "Disponível depois da compra efetuada.") : ped.enviada
        ? e("div",{className:"flex flex-col items-center gap-1.5"}, e(Selo,{cor:"ok", ic:"check-circle"}, "Enviada em "+formatarDataHora(ped.enviadaPagamentos.em)), e("span",{className:"text-[12px] text-white/70"}, "Por "+ped.enviadaPagamentos.por), e(Bt,{ic:"receipt", onClick:function(){ ac.enviar(ped.id); }}, "Ver o que foi enviado"))
        : e(Bt,{tipo:"forte", ic:"paper-plane-tilt", disabled:!(c.pode(TRANSICOES.enviar_pagamentos, ped)), semAut:true, onClick:function(){ ac.enviar(ped.id); }}, "Enviar para pagamentos")));
  return e(Janela,{t:"Compra #"+ped.id, sub:ped.titulo+" · "+ped.rotuloStatus, fechar:p.fechar, topo:e(Processo,{ped:ped}), colunas:[col1, col2, col3]});
}

// ───────────── retrato do estoque no pedido feito pelo carrinho do Estoque de material (16/11/2026) ─────────────
// Os números de cima foram guardados quando a compra foi pedida e NÃO mudam. O saldo e o mínimo de hoje vêm à parte, com o nome "atual".
function RetratoEstoque(p){
  var o = p.o, mAt = (p.c.ce.materiais || []).find(function(x){ return String(x.id)===String(o.materialId); }) || null, un = o.unidade ? " "+o.unidade : "";
  return e(Painel,{t:"Estoque no momento da solicitação", ic:"warehouse"},
    e(FotoMaterial,{foto:(mAt && mAt.foto) || o.foto, rot:o.material, tam:"g"}),
    e("b",{className:"text-[13px]"}, o.material),
    e("div",{className:"grid grid-cols-2 gap-1.5"},
      e(Dado,{t:"Saldo no momento", v:o.saldo+un, mono:true}), e(Dado,{t:"Mínimo no momento", v:o.minimo+un, mono:true}),
      e(Dado,{t:"Quantidade solicitada", v:o.quantidade+un, mono:true}), e(Dado,{t:"Origem", v:"Estoque de material"}),
      e(Dado,{t:"Solicitado em", v:formatarDataHora(o.em)}), e(Dado,{t:"Responsável", v:o.por})),
    mAt ? e("div",{className:"grid grid-cols-2 gap-1.5 border-t border-white/10 pt-1.5"}, e(Dado,{t:"Saldo atual (hoje)", v:mAt.estoqueAtual+un, mono:true}), e(Dado,{t:"Mínimo atual (hoje)", v:mAt.estoqueMinimo+un, mono:true}))
      : e("span",{className:"text-[11px] text-white"}, "O material não está mais cadastrado no estoque."));
}

// ───────────── tudo junto: abrir, nova, iniciar, janelas ─────────────
function useAcoes(c){
  var sd = useState(null), det = sd[0], setDet = sd[1], sg = useState(null), dlg = sg[0], setDlg = sg[1], sf = useState(null), form = sf[0], setForm = sf[1], se = useState(null), env = se[0], setEnv = se[1];
  var a = {};
  a.abrir = function(id){ setDet(id); };
  a.nova = function(){ setForm({modo:"novo"}); };
  a.editar = function(id){ setForm({modo:"editar", id:id}); };
  a.enviar = function(id){ setEnv(id); };
  // inicia uma operação do pedido: confere o estado e a autorização; ações sem dado executam; as outras abrem a janela pequena
  a.iniciar = function(p, op){
    var tr = TRANSICOES[op]; if(!tr) return;
    if(!podeAcaoPedido(p, op)) return c.aviso("Não dá para \""+tr.rotulo.toLowerCase()+"\" com o pedido em \""+p.rotuloStatus+"\".");
    if(!c.pode(tr, p)) return c.aviso(tr.decide==="efetua" ? EFETUA_MSG : tr.decide ? DECIDE_MSG : "Sem autorização para esta ação.");
    if(DIRETAS[op]) return c.exec({op:"pedido_"+op, id:p.id});
    setDlg({op:op, id:p.id});
  };
  // atalho "Aprovar e liberar" (18/11/2026): abre a janela da análise financeira; só aprova e libera se tudo estiver certo (tudo ou nada)
  a.aprovarLiberar = function(p){
    if(!podeAcaoPedido(p, "aprovar")) return c.aviso("Não dá para aprovar e liberar com o pedido em \""+p.rotuloStatus+"\".");
    if(!c.pode(TRANSICOES.aprovar, p) || !c.pode(TRANSICOES.liberar, p)) return c.aviso(DECIDE_MSG);
    setDlg({op:"aprovar_liberar", id:p.id});
  };
  a.janelas = function(){
    var ped = det!=null ? pedidoDe(c.s, det) : null, out = [];
    if(ped) out.push(e(Detalhe,{key:"det", c:c, ac:a, ped:ped, bloqueado:!!(dlg || form || env), fechar:function(){ setDet(null); }}));
    if(dlg) out.push(e(DlgOp,{key:"dlg", c:c, dlg:dlg, fechar:function(){ setDlg(null); }}));
    if(form){ var pe = form.modo==="editar" ? pedidoDe(c.s, form.id) : null; if(form.modo==="novo" || pe) out.push(e(FormCompra,{key:"form-"+form.modo+"-"+(form.id || ""), c:c, ped:pe, fechar:function(){ setForm(null); }})); }
    if(env!=null) out.push(e(Conferencia,{key:"env", c:c, id:env, fechar:function(){ setEnv(null); }}));
    return out;
  };
  return a;
}

export { useAcoes };
