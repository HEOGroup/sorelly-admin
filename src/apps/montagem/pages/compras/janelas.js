// Sorelly Admin · montagem — pages/compras/janelas.js
// Janelas das Compras: detalhe da compra (3 colunas), nova solicitação / edição, janelas pequenas de cada etapa (motivo, compra efetuada, recebimento, entrega, CNPJ...) e a conferência do envio para pagamentos.
// useAcoes(c) junta tudo: devolve abrir(id), nova(), iniciar(pedido, op) e janelas() (os elementos a desenhar no fim da tela). As regras estão em domain/compras-estoque.js; aqui só desenho e chamo as ações (CE).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro, ESTADO, Faixa, Indicador, Janela, Tab, Td } from "@/apps/montagem/components/padrao";
import { ETIQUETAS, ETIQUETA_ELEGIVEL, FORMAS_PLANO, MOTIVOS_ORCAMENTO, PAGAVEL_STATUS, ROTULO_ETIQUETA, ROTULO_FORMA_PLANO, ROTULO_MOTIVO_ORC, ROTULO_UNIDADE, ROTULO_URGENCIA, TRANSICOES, UNIDADES, URGENCIAS,
  compraParaOrientacoes, compraParaPedidoPagamentos, entraNoEstoque, formatarDataHora, formatarDia, formatarReais, hojeSP, opcoesCnpj, orcamentosExigidos, pedidoDe, planoSituacao, podeAcaoPedido, podeEditarPlano, textoOrcamentos } from "@/apps/montagem/domain/compras-estoque";
import { Bt, Campo, Dado, DECIDE_MSG, EFETUA_MSG, Dialogo, Painel, Selo, diasNaEtapa, norm, textoDias } from "@/apps/montagem/pages/compras/pecas";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";

var CAMPO = INPUT+" h-9! w-full text-center text-[13px]!";
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
function DlgEsperar(p){
  var st = useState(""), c = p.c, ped = p.ped;
  var enviar = function(){ if(c.exec({op:"pedido_esperar", id:ped.id, ate:st[0]})) p.fechar(); };
  return e(Dialogo,{t:"Colocar em espera", sub:"#"+ped.id+" · "+ped.titulo, fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"hourglass", onClick:enviar}, "Colocar em espera")]},
    e(Campo,{rot:"Esperar até (opcional)"}, e("input",{type:"date", value:st[0], min:hojeSP(), onChange:function(ev){ st[1](ev.target.value); }, className:CAMPO})));
}
function DlgComprar(p){
  var c = p.c, ped = p.ped, lib = ped.liberacao, doFinanceiro = !!lib && lib.modo==="plano", edita = podeEditarPlano(c.s, ped, c.uid, c.papel);
  var base = ped.plano.map(function(x){ return {id:x.id, forma:x.forma, valor:x.valor, vencimento:x.vencimento || "", parcelas:x.parcelas || null, pago:!!x.pago}; });
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
      e(PlanoEditor,{rows:v.rows, set:function(r){ set("rows", r); }, cfg:c.ce.config, aviso:c.aviso, edita:edita, refTotal:{valorCompra:v.valor, valorEstimado:ped.valorEstimado}}),
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
        e("div",{className:"min-w-0 flex-1"}, e("div",{className:"truncate text-[13px] font-bold"}, i.titulo), e("div",{className:"text-[11px] text-white/60"}, "Faltam "+i.pendente+" de "+i.quantidade+" "+(i.rotuloUnidade || "").toLowerCase()+(i.entraEstoque ? (i.semMaterial ? " · sem material ligado" : " · entra no estoque") : ""))),
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
// liberar para compra: só OK (o comprador decide como comprar) ou já definindo COMO comprar (plano de pagamento fechado)
function DlgLiberar(p){
  var c = p.c, ped = p.ped, base = ped.plano.map(function(x){ return {id:x.id, forma:x.forma, valor:x.valor, vencimento:x.vencimento || "", parcelas:x.parcelas || null, pago:!!x.pago}; });
  var st = useState({modo:"ok", nota:"", rows:base}), v = st[0], max = c.ce.config.motivoMax;
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var enviar = function(){ var a = {op:"pedido_liberar", id:ped.id, modo:v.modo, nota:v.nota}; if(v.modo==="plano") a.plano = linhasDoPlano(v.rows); if(c.exec(a)) p.fechar(); };
  var opcao = function(k, ic, t, d){ var on = v.modo===k; return e("button",{type:"button", "aria-pressed":on, onClick:function(){ set("modo", k); }, className:"flex flex-1 basis-56 flex-col items-center gap-1 rounded-xl px-3 py-2 text-center transition "+(on ? "bg-[#3B82F6]/25 ring-2 ring-[#3B82F6]" : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10")}, e(Ph,{n:ic, s:20, className:on ? "text-[#BFDBFE]" : "text-white/70"}), e("b",{className:"text-[13px]"}, t), e("span",{className:"text-[11.5px] leading-tight text-white/65"}, d)); };
  return e(Dialogo,{t:"Liberar para compra", sub:"#"+ped.id+" · "+ped.titulo+" · "+formatarReais(ped.valorFinal), tam:v.modo==="plano" ? "max-w-xl" : "max-w-lg", fechar:p.fechar, rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"o", tipo:"forte", ic:"lock-open", onClick:enviar}, "Liberar para compra")]},
    e("div",{className:"flex flex-wrap justify-center gap-2"},
      opcao("ok", "seal-check", "Só liberar", "O comprador decide como comprar"),
      opcao("plano", "currency-circle-dollar", "Definir como comprar", "Plano de pagamento: partes, vencimentos e parcelas no cartão")),
    v.modo==="plano" && e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
      e("span",{className:"text-[12px] font-bold uppercase tracking-wide text-white/75"}, "Plano de pagamento"),
      e(PlanoEditor,{rows:v.rows, set:function(r){ set("rows", r); }, cfg:c.ce.config, aviso:c.aviso, edita:true, refTotal:{valorCompra:null, valorEstimado:ped.valorEstimado}}),
      e("p",{className:"text-[11.5px] text-white/60"}, "O plano precisa fechar com o total para liberar. O comprador só confirma; alterar depois exige a autorização para aprovar e liberar.")),
    e(Campo,{rot:"Observação para o comprador (opcional)"}, e("textarea",{value:v.nota, maxLength:max, rows:2, onChange:function(ev){ set("nota", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})));
}
// escolhe a janela pequena da operação
function DlgOp(p){
  var ped = pedidoDe(p.c.s, p.dlg.id), op = p.dlg.op; if(!ped) return null;
  var base = {c:p.c, ped:ped, fechar:p.fechar, op:op};
  if(op==="negar") return e(DlgMotivo,Object.assign({titulo:"Reprovar compra", rotulo:"Reprovar"}, base));
  if(op==="cancelar") return e(DlgMotivo,Object.assign({titulo:"Cancelar compra", rotulo:"Cancelar compra"}, base));
  if(op==="novo_orcamento") return e(DlgNovoOrc,base);
  if(op==="esperar") return e(DlgEsperar,base);
  if(op==="liberar") return e(DlgLiberar,base);
  if(op==="comprar") return e(DlgComprar,base);
  if(op==="receber") return e(DlgReceber,base);
  if(op==="entregar") return e(DlgEntregar,base);
  if(op==="cnpj") return e(DlgCnpj,base);
  if(op==="pagamento") return e(DlgConta,base);
  if(op==="reenviar" || op==="ajustar_orcamento") return e(DlgValor,base);
  return null;
}

// ───────────── plano de pagamento (editor reutilizado no detalhe, na liberação e na compra) ─────────────
var linhasDoPlano = function(rows){ return rows.map(function(x){ return {id:x.id, forma:x.forma, valor:x.valor, vencimento:x.vencimento, parcelas:x.forma==="cartao" ? (Number(x.parcelas) || 1) : undefined}; }); };
// partes do plano (controlado: rows/set vêm de quem usa). ref = {valorCompra, valorEstimado} (total de referência); linhaExtra(r, i) opcional; botoes opcionais no fim
function PlanoEditor(p){
  var rows = p.rows, set = p.set, cfg = p.cfg, edita = p.edita;
  var alt = function(i, patch){ set(rows.map(function(x, k){ return k===i ? Object.assign({}, x, patch) : x; })); };
  var sit = planoSituacao(Object.assign({plano:[]}, p.refTotal, {plano:rows.map(function(x){ return {valor:x.valor || 0}; })}), cfg), dif = sit.diferenca;
  var nova = function(valor){ var ult = rows[rows.length-1]; set(rows.concat([{forma:ult ? ult.forma : "pix_empresa", valor:valor, vencimento:ult ? ult.vencimento : hojeSP(), parcelas:null, pago:false}])); };
  var dividir = function(){ var resto = r2(sit.total-sit.soma); if(resto<=0.004) return p.aviso("Não há valor restante para dividir."); nova(resto); };
  var corDif = sit.vazio ? "neutro" : sit.fecha ? "ok" : "ruim";
  return e("div",{className:"flex flex-col gap-2"},
    e(Faixa,{n:3}, e(Indicador,{t:"Soma", v:formatarReais(sit.soma), cor:"info"}), e(Indicador,{t:"Total", v:formatarReais(sit.total), cor:"total"}), e(Indicador,{t:"Diferença", v:(dif<0 ? "−" : "")+formatarReais(Math.abs(dif)), cor:corDif})),
    rows.length===0 && e("p",{className:"px-2 py-1 text-[12.5px] text-white/60"}, "Nenhuma parte de pagamento."),
    rows.map(function(r, i){
      return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-lg bg-black/25 p-2 ring-1 ring-white/10"},
        e("div",{className:"flex items-center gap-1.5"},
          e("select",{value:r.forma, disabled:!edita, "aria-label":"Forma da parte "+(i+1), onChange:function(ev){ alt(i, {forma:ev.target.value, parcelas:ev.target.value==="cartao" ? (r.parcelas || 1) : null}); }, className:CAMPO}, FORMAS_PLANO.map(function(f){ return opt(f, ROTULO_FORMA_PLANO[f]); })),
          edita && e("button",{type:"button", "aria-label":"Remover parte "+(i+1), onClick:function(){ set(rows.filter(function(x, k){ return k!==i; })); }, className:"grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20"}, e(Ph,{n:"x", s:14}))),
        e(Dinheiro,{value:r.valor, label:"Valor da parte "+(i+1), disabled:!edita, onChange:function(x){ alt(i, {valor:x || 0}); }}),
        e("input",{type:"date", value:r.vencimento, disabled:!edita, "aria-label":"Vencimento da parte "+(i+1), onChange:function(ev){ alt(i, {vencimento:ev.target.value}); }, className:CAMPO}),
        r.forma==="cartao" && e("input",{type:"number", min:1, max:cfg.parcelasMax, value:r.parcelas || 1, disabled:!edita, "aria-label":"Parcelas da parte "+(i+1), placeholder:"Parcelas", onChange:function(ev){ alt(i, {parcelas:ev.target.value}); }, className:CAMPO}),
        p.linhaExtra && p.linhaExtra(r, i));
    }),
    !sit.vazio && !sit.fecha && e("p",{className:"rounded-lg bg-[#EF4444]/15 px-2 py-1 text-[12px] text-[#F87171]"}, sit.aviso),
    edita && e("div",{className:"flex flex-wrap justify-center gap-1.5"},
      e(Bt,{ic:"plus", onClick:function(){ nova(null); }}, "Parte"),
      e(Bt,{ic:"arrow-right", onClick:dividir}, "Dividir o restante"),
      p.botoes));
}
function PlanoPag(p){
  var c = p.c, ped = p.ped, cfg = c.ce.config, pagavel = PAGAVEL_STATUS.indexOf(ped.status)>=0;
  var base = ped.plano.map(function(x){ return {id:x.id, forma:x.forma, valor:x.valor, vencimento:x.vencimento || "", parcelas:x.parcelas || null, pago:!!x.pago}; });
  var chave = JSON.stringify(base), st = useState({chave:chave, rows:base, forcar:false}), v = st[0];
  var rows = v.chave===chave ? v.rows : base, sujo = JSON.stringify(rows)!==chave;
  var edita = podeEditarPlano(c.s, ped, c.uid, c.papel);
  var set = function(r){ st[1]({chave:chave, rows:r, forcar:v.forcar}); };
  var salvar = function(){
    if(ped.enviada && !v.forcar){ st[1]({chave:chave, rows:rows, forcar:true}); return c.aviso("Já foi enviado aos pagamentos: clique em Salvar plano de novo para confirmar a alteração."); }
    c.exec({op:"pedido_plano_set", id:ped.id, forcar:v.forcar, plano:linhasDoPlano(rows)});
  };
  var def = ped.status==="LIBERADA" && ped.liberacao && ped.liberacao.modo==="plano";
  return e(Painel,{t:"Plano de pagamento", ic:"currency-circle-dollar"},
    def && e("p",{className:"rounded-lg bg-black/25 px-2 py-1 text-[11.5px] text-white/70"}, "Plano definido pelo financeiro ("+ped.liberacao.por+")."),
    e(PlanoEditor,{rows:rows, set:set, cfg:cfg, edita:edita, refTotal:ped, aviso:c.aviso,
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
    pp.linhas.length>0 ? e(Tab,{cols:["Forma", "Vencimento", "Valor", "Parcelas"]}, pp.linhas.map(function(l, i){ return e("tr",{key:i, className:"border-t border-white/10"}, e(Td,null, ROTULO_FORMA_PLANO[l.forma] || l.forma), e(Td,null, formatarDia(l.venc)), e(Td,{dinheiro:true}, formatarReais(l.valor)), e(Td,{dinheiro:true}, l.qtd)); })) : e("p",{className:"text-[12.5px] text-white/60"}, "Nenhuma parte de pagamento."),
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
function FormCompra(p){
  var c = p.c, ce = c.ce, cfg = ce.config, ed = p.ped || null;
  var podeItens = ed ? (podeAcaoPedido(ed, "itens_set") && c.pode(TRANSICOES.itens_set, ed)) : true, podeDados = ed ? c.opera : true;
  var ini = ed ? {forn:ed.fornecedor || "", titulo:ed.titulo, setorId:ed.setorId==null ? "" : String(ed.setorId), categoriaId:ed.categoriaId==null ? "" : String(ed.categoriaId), urgencia:ed.urgencia, cnpjId:ed.cnpjId || "", cnpjOutro:ed.cnpjOutro || "", previsao:ed.previsaoEntrega || "", link:ed.link || "", obs:ed.observacao || "", cond:ed.condicoesTxt || "",
      itens:ed.itens.map(function(i){ return {k:++SEQ, titulo:i.titulo, quantidade:i.quantidade, unidade:i.unidade, valorUnitario:i.valorUnitario!=null ? i.valorUnitario : (i.valorTotal && i.quantidade ? r2(i.valorTotal/i.quantidade) : null), classificacao:i.classificacao || "", materialId:i.materialId==null ? "" : String(i.materialId)}; })}
    : {forn:"", titulo:"", setorId:"", categoriaId:"", urgencia:"MEDIA", cnpjId:"", cnpjOutro:"", previsao:"", link:"", obs:"", cond:"", itens:[itemVazio((cfg.classificacoes[0] || {}).id)]};
  var st = useState(ini), f = st[0];
  useEffect(function(){ var h = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", h); return function(){ window.removeEventListener("keydown", h); }; }, []);
  var set = function(k, x){ var n = Object.assign({}, f); n[k] = x; st[1](n); };
  var alt = function(i, patch){ set("itens", f.itens.map(function(x, k){ return k===i ? Object.assign({}, x, patch) : x; })); };
  var total = r2(f.itens.reduce(function(t, i){ return t+(i.valorUnitario || 0)*(Number(i.quantidade) || 0); }, 0));
  var forn = ce.fornecedores.find(function(x){ return norm(x.nome)===norm(f.forn); });
  var dados = function(){
    var o = {urgencia:f.urgencia, setorId:idDe(ce.setores, f.setorId) || "", categoriaId:idDe(ce.categorias, f.categoriaId) || "", previsaoEntrega:f.previsao, link:f.link, observacao:f.obs, condicoesTxt:f.cond, fornecedorId:forn ? forn.id : undefined, fornecedorNome:forn ? forn.nome : f.forn.trim()};
    if(f.cnpjId){ o.cnpjId = f.cnpjId; o.cnpjOutro = f.cnpjOutro; } return o;
  };
  var itensAcao = function(){ return f.itens.map(function(i){ return {titulo:i.titulo, quantidade:i.quantidade, unidade:i.unidade, valorUnitario:i.valorUnitario==null ? undefined : i.valorUnitario, classificacao:i.classificacao || undefined, materialId:idDe(ce.materiais, i.materialId)}; }); };
  var salvar = function(){
    if(!f.forn.trim()) return c.aviso("Informe o fornecedor.");
    if(!f.cnpjId) return c.aviso("Escolha o CNPJ pagador.");
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
    e(Campo,{rot:"CNPJ pagador"}, e("select",{value:f.cnpjId, disabled:!podeDados, onChange:function(ev){ set("cnpjId", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Selecione…"), opcoesCnpj(c.s).map(function(o){ return opt(o.id, o.rotulo); }))),
    f.cnpjId==="outro" && e(Campo,{rot:"Qual é o outro CNPJ"}, e("input",{value:f.cnpjOutro, disabled:!podeDados, onChange:function(ev){ set("cnpjOutro", ev.target.value); }, className:CAMPO})),
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
  var col3 = e(Painel,{key:"c", t:"Resumo", ic:"receipt"},
    e(Faixa,{n:2}, e(Indicador,{t:"Itens", v:f.itens.length, cor:"info"}), e(Indicador,{t:"Total", v:formatarReais(total), cor:"total"})),
    nOrc>0 && e("p",{className:"rounded-lg bg-[#60A5FA]/15 px-2 py-1.5 text-[12px] text-[#BFDBFE]"}, "Esta compra pede "+nOrc+" orçamentos. "+textoOrcamentos(cfg)+"."),
    e("p",{className:"px-1 text-[12px] text-white/60"}, "O plano de pagamento pode ser montado depois, dentro da compra."),
    ed && !podeItens && !podeDados && e("p",{className:"text-[12.5px] text-[#FBBF24]"}, "Sem autorização para editar esta compra."));
  return e(Janela,{t:ed ? "Editar compra #"+ed.id : "Nova solicitação de compra", sub:ed ? ed.titulo : "Enviada ao financeiro para aprovação", fechar:p.fechar, colunas:[col1, col2, col3],
    rodape:[e(Bt,{key:"v", onClick:p.fechar}, "Voltar"), e(Bt,{key:"s", tipo:"forte", ic:"paper-plane-tilt", disabled:!!ed && !podeItens && !podeDados, semAut:true, onClick:salvar}, ed ? "Salvar alterações" : "Enviar solicitação")]});
}

// ───────────── detalhe da compra (3 colunas) ─────────────
var IDX = {NAO_VERIFICADA:0, AGUARDANDO:0, AGUARDANDO_ORCAMENTO:0, AGUARDANDO_AUTORIZACAO:0, AGUARDANDO_CNPJ:1, AGUARDANDO_FORMA_PAGAMENTO:1, APROVADA:1, LIBERADA:2, COMPRADA:3, EM_TRANSITO:3, RECEBIDA_PARCIAL:3, RECEBIDA:4, ENTREGUE:5};
var FORA_DOS_BOTOES = {plano_set:1, itens_set:1, enviar_pagamentos:1, etiqueta:1};
function Etapas(p){
  var ped = p.ped, idx = IDX[ped.status];
  var ultRec = ped.recebimentos.length ? ped.recebimentos[ped.recebimentos.length-1] : null;
  var passos = [
    {t:"Solicitada", quem:ped.solicitante, em:ped.solicitadoOriginalEm || ped.solicitadoEm, nota:ped.status==="AGUARDANDO_AUTORIZACAO" ? "Aguardando autorização" : ped.status==="AGUARDANDO_ORCAMENTO" ? "Novo orçamento pedido" : ped.status==="AGUARDANDO" ? "Em espera" : ""},
    {t:"Aprovada", quem:ped.aprovadoPor, em:ped.aprovadoEm, nota:ped.status==="AGUARDANDO_CNPJ" ? "Falta o CNPJ pagador" : ped.status==="AGUARDANDO_FORMA_PAGAMENTO" ? "Falta a conta pagadora" : ped.cnpj || ""},
    {t:"Liberada", quem:ped.liberacao ? ped.liberacao.por : "", em:ped.liberacao ? ped.liberacao.em : "", nota:ped.status==="APROVADA" ? "Falta o financeiro liberar para compra" : ped.liberacao ? (ped.liberacao.modo==="plano" ? "Com plano de pagamento definido" : "Só liberação: o comprador decide como comprar")+(ped.liberacao.nota ? " · "+ped.liberacao.nota : "") : ""},
    {t:"Efetuada", quem:ped.comprador, em:ped.compradoEm, nota:ped.valorCompra!=null ? formatarReais(ped.valorCompra)+(ped.status==="EM_TRANSITO" ? " · em trânsito" : "") : ""},
    {t:"Recebida", quem:ped.recebidoPor, em:ped.recebidoEm || (ultRec ? ultRec.dia : ""), nota:ped.status==="RECEBIDA_PARCIAL" ? "Recebida em parte: "+ped.recebimento.recebida+" de "+ped.recebimento.pedida : ""},
    {t:"Entregue", quem:ped.entregueParaNome, em:ped.entregueEm, nota:""}];
  var final = ped.status==="NEGADA" || ped.status==="CANCELADA";
  var lista = passos.map(function(x, i){
    var estado = final ? (x.em ? "feito" : "futuro") : ped.status==="ENTREGUE" ? "feito" : i<idx ? "feito" : i===idx ? "atual" : "futuro";
    return Object.assign({estado:estado}, x);
  });
  if(final) lista = lista.filter(function(x){ return x.estado==="feito"; }).concat([{t:ped.status==="NEGADA" ? "Reprovada" : "Cancelada", estado:"cancelado", quem:ped.status==="NEGADA" ? "" : ped.canceladoPor, em:ped.canceladoEm || ped.respondidoEm, nota:ped.status==="NEGADA" ? ped.motivoNegativa : ped.motivoCancelamento}]);
  var cores = {feito:"#4ADE80", atual:"#60A5FA", futuro:"#94A3B8", cancelado:"#EF4444"}, ics = {feito:"check-circle", atual:"circle-notch", futuro:"circle", cancelado:"x-circle"};
  var st = useState(false), todos = st[0], evs = ped.eventos.slice().reverse(), vis = todos ? evs : evs.slice(0, 5);
  return e(Painel,{t:"Etapas", ic:"clock"},
    lista.map(function(x, i){
      var c = cores[x.estado];
      return e("div",{key:i, className:"flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-left", style:{background:x.estado==="atual" ? "#3B82F626" : "rgba(255,255,255,.05)", boxShadow:x.estado==="futuro" ? undefined : "inset 0 0 0 "+(x.estado==="atual" ? 2 : 1)+"px "+(x.estado==="atual" ? "#3B82F6AA" : c+"33"), border:x.estado==="futuro" ? "1px dashed rgba(148,163,184,.45)" : undefined, opacity:x.estado==="futuro" ? 0.75 : 1}},
        e(Ph,{n:ics[x.estado], s:16, fill:x.estado==="feito", style:{color:c}, className:"mt-0.5"}),
        e("span",{className:"flex min-w-0 flex-1 flex-col leading-tight"}, e("b",{className:"text-[12.5px]", style:{color:x.estado==="futuro" ? undefined : c}}, x.t+(x.estado==="atual" ? " · "+textoDias(diasNaEtapa(ped)) : "")),
          (x.quem || x.em) && e("span",{className:"text-[11.5px] text-white/70"}, [x.quem, x.em ? formatarDataHora(x.em) : ""].filter(Boolean).join(" · ")),
          x.nota && e("span",{className:"break-words text-[11.5px] text-white/65"}, x.nota)));
    }),
    vis.length>0 && e("div",{className:"flex flex-col gap-1 border-t border-white/10 pt-1.5"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/55"}, "Histórico"),
      vis.map(function(ev, i){ return e("div",{key:i, className:"rounded-md bg-black/20 px-2 py-1 text-left text-[11.5px] leading-tight"}, e("span",{className:MONO+" text-white/55"}, formatarDataHora(ev.em)+" · "+ev.por), e("div",{className:"break-words text-white/85"}, ev.texto)); }),
      evs.length>5 && e("button",{type:"button", onClick:function(){ st[1](!todos); }, className:"rounded-md bg-white/10 py-1 text-[11.5px] font-bold hover:bg-white/15"}, todos ? "Ver menos" : "Ver todo o histórico ("+evs.length+")")));
}
function Conversa(p){
  var c = p.c, ped = p.ped, st = useState(""), t = st[0], msgs = ped.mensagens.slice(-6);
  var enviar = function(){ if(!t.trim()) return c.aviso("Escreva a mensagem."); if(c.exec({op:"pedido_msg", id:ped.id, texto:t})) st[1](""); };
  return e(Painel,{t:"Conversa", ic:"chat-circle-text"},
    msgs.length===0 ? e("p",{className:"px-2 py-1 text-[12.5px] text-white/60"}, "Nenhuma mensagem.") : msgs.map(function(m, i){ return e("div",{key:i, className:"rounded-md bg-black/25 px-2 py-1 text-left text-[12px] leading-tight"}, e("span",{className:MONO+" text-[11px] text-white/55"}, m.por+" · "+formatarDataHora(m.em)), e("div",{className:"break-words"}, m.texto)); }),
    e("div",{className:"flex gap-1.5"}, e("input",{value:t, placeholder:"Mensagem", "aria-label":"Mensagem", onChange:function(ev){ st[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") enviar(); }, className:CAMPO}),
      e("button",{type:"button", "aria-label":"Enviar mensagem", onClick:enviar, className:"grid size-9 shrink-0 place-items-center rounded-lg bg-[#3B82F6] hover:bg-[#60A5FA]"}, e(Ph,{n:"paper-plane-tilt", s:15}))));
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
  var col1 = e("div",{key:"a", className:"flex flex-col gap-2.5"},
    e(Painel,{t:"Dados da compra", ic:"receipt"},
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, e(Selo,{cor:{primary:"info", muted:"neutro", warning:"alerta", info:"info", success:"ok", danger:"ruim"}[ped.tom] || "info"}, ped.rotuloStatus), ped.atrasado && e(Selo,{cor:"ruim", ic:"warning"}, "Atrasada"), e(Selo,{cor:urg, ic:"flag"}, "Urgência "+ped.rotuloUrgencia.toLowerCase()), ped.enviada && e(Selo,{cor:"ok", ic:"check-circle"}, "Enviada aos pagamentos")),
      e("div",{className:"grid grid-cols-2 gap-1.5"},
        e(Dado,{t:"Fornecedor", v:ped.fornecedor || "—"}), e(Dado,{t:"Solicitante", v:ped.solicitante}), e(Dado,{t:"Setor", v:ped.setorNome}), e(Dado,{t:"Categoria", v:ped.categoriaNome}),
        e(Dado,{t:"Classificação", v:ped.classificacoesTxt || "—"}), e(Dado,{t:"CNPJ pagador", v:ped.cnpj || "—"}),
        e(Dado,{t:ped.valorCompra!=null ? "Valor da compra" : "Valor estimado", v:formatarReais(ped.valorFinal), mono:true}), e(Dado,{t:"Prazo de entrega", v:formatarDia(ped.previsaoEntrega) || "—"}),
        e(Dado,{t:"Vencimento", v:formatarDia(ped.proximoVencimento)}), e(Dado,{t:"Nº do pedido", v:ped.numeroFornecedor}), e(Dado,{t:"Condições", v:ped.condicoesTxt})),
      ped.link && e("a",{href:/^https?:\/\//i.test(ped.link) ? ped.link : "https://"+ped.link, target:"_blank", rel:"noopener noreferrer", className:"inline-flex items-center justify-center gap-1.5 break-all rounded-lg bg-black/25 px-2 py-1.5 text-[12.5px] font-bold text-[#BFDBFE] hover:bg-black/40"}, e(Ph,{n:"link", s:14}), ped.link),
      ped.observacao && e("p",{className:"break-words rounded-lg bg-black/25 px-2 py-1.5 text-[12.5px] text-white/80"}, ped.observacao)),
    e(Painel,{t:"Itens", ic:"package"},
      e(Tab,{cols:["Item", "Qtd", "Unitário", "Total", "Recebido"]}, ped.itens.map(function(i){
        return e("tr",{key:i.id, className:"border-t border-white/10"}, e(Td,{className:"max-w-[9rem] truncate", forte:true}, e("span",{title:i.titulo}, i.titulo)), e(Td,{dinheiro:true}, i.quantidade+" "+(i.rotuloUnidade || "").toLowerCase()), e(Td,{dinheiro:true}, i.valorUnitario!=null ? formatarReais(i.valorUnitario) : "—"), e(Td,{dinheiro:true}, formatarReais(i.valorTotal)), e(Td,{dinheiro:true, cor:i.qtdRecebida>=i.quantidade ? "ok" : i.qtdRecebida>0 ? "alerta" : undefined}, i.qtdRecebida+"/"+i.quantidade));
      })),
      ped.itens.some(function(i){ return i.semMaterial; }) && e("p",{className:"text-[11.5px] text-[#FBBF24]"}, "Há item que entra no estoque sem material ligado: no recebimento ele não dará entrada."),
      podeEditar && e(Bt,{ic:"pencil-simple", className:"self-center", onClick:function(){ ac.editar(ped.id); }}, "Editar compra")));
  var col2 = e("div",{key:"b", className:"flex flex-col gap-2.5"}, e(Etapas,{ped:ped}), e(PlanoPag,{c:c, ped:ped}), e(Conversa,{c:c, ped:ped}));
  var col3 = e("div",{key:"c", className:"flex flex-col gap-2.5"},
    e(Painel,{t:"Ações", ic:"seal-check"},
      acoes.length===0 ? e("p",{className:"px-2 py-1 text-[12.5px] text-white/60"}, "Sem ações disponíveis nesta etapa.") : e("div",{className:"flex flex-col gap-1.5"}, acoes.map(function(a){
        var ok = c.pode(a, ped);
        var bt = e(Bt,{key:a.op, tipo:COR_BT[a.op] || "normal", ic:ICONE_OP[a.op], disabled:!ok, semAut:true, onClick:function(){ ac.iniciar(ped, a.op); }}, a.rotulo);
        return a.op==="aprovar" ? [bt, e(Bt,{key:"aprovar_liberar", tipo:"forte", ic:"lock-open", disabled:!ok || !c.pode(TRANSICOES.liberar, ped), semAut:true, titulo:"Aprova e libera para compra num clique", onClick:function(){ ac.aprovarLiberar(ped); }}, "Aprovar e liberar")] : bt;
      }))),
    ped.recebimento.pedida>0 && (pagavel || ped.status==="APROVADA" || ped.status==="LIBERADA") && e(Painel,{t:"Recebimento", ic:"package"},
      e("div",{className:"h-2 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:Math.min(100, Math.round(100*ped.recebimento.recebida/Math.max(1, ped.recebimento.pedida)))+"%", background:ped.recebimento.completo ? ESTADO.ok : ESTADO.alerta}})),
      e("span",{className:MONO+" text-[12.5px]"}, ped.recebimento.recebida+" de "+ped.recebimento.pedida+" itens"),
      ped.recebimentos.map(function(r, i){ return e("div",{key:i, className:"rounded-md bg-black/25 px-2 py-1 text-[11.5px]"}, formatarDia(r.dia)+" · "+r.por+" · "+r.itens.reduce(function(t, x){ return t+x.qtd; }, 0)+" un."); })),
    e(Painel,{t:"Entrega e nota fiscal", ic:"truck"},
      ped.entregueEm && e("div",{className:"grid grid-cols-2 gap-1.5"}, e(Dado,{t:"Entregue em", v:formatarDia(ped.entregueEm)}), e(Dado,{t:"Recebido por", v:ped.entregueParaNome}), e(Dado,{t:"Assinatura", v:ped.assinaturaConfirmada ? "Confirmada" : "Não confirmada"})),
      !final && ped.status!=="NAO_VERIFICADA" && e(NotaFiscal,{key:ped.id+"-"+ped.notaFiscal, c:c, ped:ped}),
      final && ped.notaFiscal && e(Dado,{t:"Nota fiscal", v:ped.notaFiscal}),
      ETIQUETA_ELEGIVEL.indexOf(ped.status)>=0 && e(Campo,{rot:"Etiqueta de logística"}, e("select",{value:ped.etiqueta || "", onChange:function(ev){ c.exec({op:"pedido_etiqueta", id:ped.id, etiqueta:ev.target.value}); }, className:CAMPO}, e("option",{value:""}, "Sem etiqueta"), ETIQUETAS.map(function(x){ return opt(x, ROTULO_ETIQUETA[x]); })))),
    e(Painel,{t:"Pagamentos", ic:"currency-circle-dollar"},
      !pagavel ? e("p",{className:"px-2 py-1 text-[12.5px] text-white/60"}, "Disponível depois da compra efetuada.") : ped.enviada
        ? e("div",{className:"flex flex-col items-center gap-1.5"}, e(Selo,{cor:"ok", ic:"check-circle"}, "Enviada em "+formatarDataHora(ped.enviadaPagamentos.em)), e("span",{className:"text-[12px] text-white/70"}, "Por "+ped.enviadaPagamentos.por), e(Bt,{ic:"receipt", onClick:function(){ ac.enviar(ped.id); }}, "Ver o que foi enviado"))
        : e(Bt,{tipo:"forte", ic:"paper-plane-tilt", disabled:!(c.pode(TRANSICOES.enviar_pagamentos, ped)), semAut:true, onClick:function(){ ac.enviar(ped.id); }}, "Enviar para pagamentos")));
  return e(Janela,{t:"Compra #"+ped.id, sub:ped.titulo+" · "+ped.rotuloStatus, fechar:p.fechar, colunas:[col1, col2, col3]});
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
  // atalho: aprova e já libera para compra (só liberação; o comprador decide como comprar). Os dois passos entram na linha do tempo
  a.aprovarLiberar = function(p){
    if(!podeAcaoPedido(p, "aprovar")) return c.aviso("Não dá para aprovar e liberar com o pedido em \""+p.rotuloStatus+"\".");
    if(!c.pode(TRANSICOES.aprovar, p) || !c.pode(TRANSICOES.liberar, p)) return c.aviso(DECIDE_MSG);
    return c.exec({op:"pedido_aprovar", id:p.id, liberar:true});
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
