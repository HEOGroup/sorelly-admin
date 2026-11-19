// Sorelly Admin · montagem — pages/pf/PorPedido.js
// CONTROLE E RELATÓRIO POR PEDIDO (19/11/2026) dos Pagamentos a fornecedores. Só aparece para o fornecedor com a opção ligada (f.porPedido; começa só na Xangai).
// Peças usadas pela tela Lançamento de pagamentos (Lancamentos.js):
//   IdentPedidos   "Este pagamento se refere a:" (Um pedido / Mais de um pedido / Sem identificação) dentro do Lançar e da identificação posterior
//   ModalIdent     identificar ou corrigir os pedidos de um pagamento já lançado (com histórico; não confere o pagamento)
//   BlocoPedidos   área "Pedidos" dentro do acerto: valor, ajustes, pago identificado, saldo e "Valor ainda não identificado por pedido"
//   EscopoRelatorio "Conteúdo do relatório" da janela Enviar acerto ao fornecedor + ações do relatório por pedido (ver, baixar, link restrito e mensagem)
// Regras e contas em domain/pf.js (lerAlocs, resumoPedidoPf, acertoPorPedido...); relatório em lib/relatorio-pedidos-pf.js. Aqui só desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { CampoSel, MenuMulti, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { acertoPorPedido, alocado, lerAlocs, novoCodigoLink, pagosDoPedido, pedidosDoForn, pfReduz, resumoPedidoPf, semIdent, sugerirDivisao, textoAlocs } from "@/apps/montagem/domain/pf";
import { buscarAnexo } from "@/apps/montagem/lib/anexo";
import { htmlPedidos, msgPedidos } from "@/apps/montagem/lib/relatorio-pedidos-pf";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import { Campo, Modal, aviso, brl, dbr } from "@/apps/montagem/pages/pf/ui";

var BT = "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition disabled:opacity-40 ";
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:BT+(p.forte ? "bg-[#3B82F6] text-white hover:bg-[#60A5FA]" : "bg-white/10 hover:bg-white/20")+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:14}), p.children); }
// confere com a regra antes de gravar: recusado = aviso e false (a janela continua aberta)
function tenta(c, nome, extra){ var a = Object.assign({type:"PF", op:nome, por:c.por}, extra), r = pfReduz(c.s, a); if(!r.patch || !r.patch.pf){ if(r.msg) aviso(c, r.msg, "alerta"); return false; } c.d(a); return true; }
var r2 = function(v){ return Math.round((+v || 0)*100)/100; };
var dt = function(d){ return d ? dbr(String(d).slice(0, 10)) : "—"; };   // dbr já devolve dd/mm/aaaa

// ───────────── "Este pagamento se refere a:" (controlado: alocs/setAlocs) ─────────────
// alocs = [{pedidoId, valor (texto com ponto), adiant}]. lancId = pagamento sendo corrigido (fica fora do saldo dos pedidos).
function IdentPedidos(p){
  var c = p.c, pf = c.pf, valor = r2(parseFloat(p.valor) || 0), sm = useState(p.alocs.length>1 ? "varios" : p.alocs.length===1 ? "um" : "sem"), modo = sm[0];
  var lista = pedidosDoForn(pf, p.fid).map(function(pd){
    var r = resumoPedidoPf(pf, pd.id), outros = r2(pagosDoPedido(pf, pd.id).filter(function(x){ return x.l.id!==p.lancId; }).reduce(function(s, x){ return s+x.valor; }, 0));
    return {pd:pd, saldo:r2(r.pix-r.ajustesTotal-outros)};
  }).filter(function(x){ return x.pd.semNF>0.005 || p.alocs.some(function(a){ return a.pedidoId===x.pd.id; }); });
  var de = function(id){ return p.alocs.find(function(a){ return a.pedidoId===id; }); };
  var setUm = function(id, v, adiant){ p.setAlocs(id ? [{pedidoId:id, valor:v, adiant:!!adiant}] : []); };
  var setVarios = function(id, patch){ var n = lista.map(function(x){ var a = de(x.pd.id) || {pedidoId:x.pd.id, valor:"", adiant:false}; return x.pd.id===id ? Object.assign({}, a, patch) : a; }).filter(function(a){ return parseFloat(a.valor)>0 || a.pedidoId===id; }); p.setAlocs(n); };
  var mudaModo = function(m){ sm[1](m); if(m==="sem") p.setAlocs([]); if(m==="um" && p.alocs.length>1) p.setAlocs(p.alocs.slice(0, 1)); };
  var conf = lerAlocs(pf, p.fid, valor, p.alocs.map(function(a){ return {pedidoId:a.pedidoId, valor:parseFloat(a.valor) || 0, adiant:a.adiant}; }), p.lancId);
  var soma = r2(p.alocs.reduce(function(s, a){ return s+(parseFloat(a.valor) || 0); }, 0)), resto = r2(valor-soma);
  var excede = function(x){ var a = de(x.pd.id); return a && (parseFloat(a.valor) || 0)>x.saldo+0.005; };
  var um = p.alocs[0], xUm = um ? lista.find(function(x){ return x.pd.id===um.pedidoId; }) : null;
  return e("div",{className:"flex flex-col gap-2 rounded-lg bg-black/25 p-2 text-center ring-1 ring-[#3B82F6]/40"},
    e("b",{className:"text-[11px] uppercase"}, "Este pagamento se refere a:"),
    e("div",{className:"flex justify-center"}, e(Segmentado,{opcoes:[["um","Um pedido"], ["varios","Mais de um pedido"], ["sem","Sem identificação de pedido"]], atual:modo, onMudar:mudaModo})),
    !lista.length && modo!=="sem" && e("p",{className:"text-[13px]"}, "Este fornecedor não tem pedido com valor em Pix nas Negociações."),
    modo==="um" && lista.length>0 && e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
      e(CampoSel,{t:"Pedido", value:um ? String(um.pedidoId) : "", opcoes:[["", "Selecione"]].concat(lista.map(function(x){ return [String(x.pd.id), x.pd.numero+" · saldo "+brl(Math.max(0, x.saldo))]; })),
        onChange:function(v){ var x = lista.find(function(y){ return String(y.pd.id)===v; }); setUm(x ? x.pd.id : null, x ? String(r2(Math.max(0, Math.min(valor, x.saldo)))) : ""); }}),
      e(Campo,{rot:"Valor destinado a ele (R$)"}, e(Dinheiro,{out:"ponto", value:um ? um.valor : "", label:"Valor destinado", disabled:!um, onChange:function(v){ setUm(um.pedidoId, v, um.adiant); }}))),
    modo==="um" && xUm && excede(xUm) && e("label",{className:"flex cursor-pointer items-center justify-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:!!um.adiant, onChange:function(ev){ setUm(um.pedidoId, um.valor, ev.target.checked); }}), "O que passa do saldo é adiantamento / crédito do pedido"),
    modo==="varios" && lista.length>0 && e(TabelaPlanilha,{chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true,
      cols:[{k:"ped", t:"Pedido"}, {k:"saldo", t:"Saldo"}, {k:"valor", t:"Valor destinado", render:function(v, l){ var a = de(l.id); return e("div",{className:"w-36"}, e(Dinheiro,{out:"ponto", value:a ? a.valor : "", label:"Valor para "+l.ped, onChange:function(x){ setVarios(l.id, {valor:x}); }})); }},
        {k:"adiant", t:"Adiantamento", render:function(v, l){ var x = lista.find(function(y){ return y.pd.id===l.id; }); return excede(x) ? e("input",{type:"checkbox", "aria-label":"Adiantamento de "+l.ped, checked:!!(de(l.id) || {}).adiant, onChange:function(ev){ setVarios(l.id, {adiant:ev.target.checked}); }}) : "—"; }}],
      linhas:lista.map(function(x){ return {id:x.pd.id, ped:x.pd.numero, saldo:brl(Math.max(0, x.saldo)), valor:"", adiant:""}; })}),
    modo!=="sem" && e("div",{className:"flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px]"},
      e("span",null, "Destinado aos pedidos: ", e("b",null, brl(soma))),
      e("span",null, "Valor sem identificação de pedido: ", e("b",{style:{color:resto<-0.005 ? "#F87171" : resto>0.005 ? "#FBBF24" : "#4ADE80"}}, brl(Math.max(0, resto))))),
    modo!=="sem" && conf.erro && e("p",{className:"rounded-md bg-[#EF4444]/15 px-2 py-1 text-[13px] text-[#F87171]"}, conf.erro));
}
// alocs da tela → ação (número)
var paraAcao = function(alocs){ return alocs.map(function(a){ return {pedidoId:a.pedidoId, valor:parseFloat(a.valor) || 0, adiant:!!a.adiant}; }).filter(function(a){ return a.valor>0; }); };
var daAcao = function(alocs){ return (alocs || []).map(function(a){ return {pedidoId:a.pedidoId, valor:String(a.valor), adiant:!!a.adiant}; }); };

// ───────────── identificar / corrigir os pedidos de um pagamento já lançado ─────────────
function ModalIdent(p){
  var c = p.c, l = p.l, st = useState(daAcao(l.alocs)), alocs = st[0];
  var salvar = function(){ if(tenta(c, "lanc_pedidos", {id:l.id, alocs:paraAcao(alocs)})) p.fechar(); };
  return e(Modal,{t:"Identificar pedido do pagamento", fechar:p.fechar, sub:e("span",null, "Pix de ", e("b",null, brl(l.valor)), " · "+(l.revendedora || "—")+" · "+dt(l.data)+". O pagamento continua um só, com o mesmo comprovante; a conferência não muda.")},
    e(IdentPedidos,{c:c, fid:l.fornId, valor:l.valor, alocs:alocs, setAlocs:st[1], lancId:l.id}),
    (l.pedHist || []).length>0 && e("div",{className:"flex flex-col gap-1 text-left"}, e("b",{className:"text-[11px] uppercase"}, "Histórico da identificação"),
      l.pedHist.slice().reverse().map(function(h, i){ return e("div",{key:i, className:"rounded-md border border-white/20 px-2 py-1 text-[11px]"}, dt(h.em)+(h.por ? " · "+h.por : "")+": "+h.antes+" → "+h.depois); })),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{forte:true, ic:"check", onClick:salvar}, "Salvar identificação")));
}
// marca curta no pagamento (lista do acerto): para quais pedidos foi
function MarcaPedidos(p){
  var l = p.l, pf = p.c.pf, sem = semIdent(l);
  return e("span",{className:"inline-flex flex-wrap items-center gap-1 text-[11px]"},
    (l.alocs || []).length ? e("span",{className:"rounded border border-[#60A5FA]/60 px-1.5 text-[#BFDBFE]"}, textoAlocs(pf, l.alocs)) : null,
    sem>0.005 && e("span",{className:"rounded border border-[#FBBF24]/60 px-1.5 text-[#FBBF24]"}, (alocado(l)>0.005 ? brl(sem)+" " : "")+"sem identificação de pedido"),
    p.c.edita && e("button",{type:"button", onClick:p.abrir, className:"h-8 rounded-md bg-white/10 px-2 text-[11px] font-semibold hover:bg-white/20"}, (l.alocs || []).length ? "Corrigir pedidos" : "Identificar pedido"));
}

// ───────────── dados do pedido (descrição, condições, observações, compra) ─────────────
function ModalPedidoInfo(p){
  var c = p.c, pd = p.pd, f = c.pf.fornecedores.find(function(x){ return x.id===pd.fornId; }), nome = String(f ? f.nome : "").toLowerCase();
  var compras = ((c.s.ce && c.s.ce.pedidos) || []).filter(function(x){ return nome && String(x.fornecedorNome || "").toLowerCase().indexOf(nome)>=0; }).slice(-60).reverse();
  var st = useState({descricao:pd.descricao || "", condicoes:pd.condicoes || "", obs:pd.obs || "", compraId:pd.compraId==null ? "" : String(pd.compraId)}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var salvar = function(){ var cp = compras.find(function(x){ return String(x.id)===v.compraId; }); if(tenta(c, "pedido_info", {id:pd.id, descricao:v.descricao, condicoes:v.condicoes, obs:v.obs, compraId:cp ? cp.id : (v.compraId ? pd.compraId : null)})) p.fechar(); };
  var area = function(k, rot){ return e(Campo,{rot:rot}, e("textarea",{value:v[k], rows:2, "aria-label":rot, onChange:function(ev){ set(k, ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"})); };
  return e(Modal,{t:"Dados do pedido "+pd.numero, fechar:p.fechar, sub:"Só informação. Os valores e as parcelas continuam nas Negociações, que formam a dívida do acerto."},
    area("descricao", "Descrição"), area("condicoes", "Condições negociadas e datas previstas"), area("obs", "Observações"),
    e(CampoSel,{t:"Pedido do módulo Compras", value:v.compraId, opcoes:[["", compras.length ? "Sem vínculo" : "Nenhuma compra deste fornecedor em Compras"]].concat(compras.map(function(x){ return [String(x.id), "#"+x.id+" · "+(x.titulo || "")]; })), onChange:function(x){ set("compraId", x); }}),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{forte:true, ic:"check", onClick:salvar}, "Salvar")));
}

// ───────────── área "Pedidos" do acerto ─────────────
function BlocoPedidos(p){
  var c = p.c, a = acertoPorPedido(c.pf, p.chave), si = useState(null), info = si[0], sg = useState(false);
  if(!a) return null;
  var linhas = a.pedidos.map(function(r){ return {id:r.pd.id, _r:r, ped:r.pd.numero, neste:brl(r.nesteAcerto), valor:brl(r.valor), ajustes:r.ajustesTotal>0.005 ? "− "+brl(r.ajustesTotal) : "—", pago:brl(r.pagoIdentificado), saldo:brl(Math.max(0, r.saldo)), acao:""}; });
  return e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-2.5 text-center"},
    e("b",{className:"text-[11px] uppercase"}, "Pedidos deste acerto"),
    e(TabelaPlanilha,{chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nenhum pedido nesta data.",
      cols:[{k:"ped", t:"Pedido"}, {k:"neste", t:"Neste acerto"}, {k:"valor", t:"Valor original"}, {k:"ajustes", t:"Ajustes"}, {k:"pago", t:"Pago identificado"},
        {k:"saldo", t:"Saldo em aberto", render:function(v, l){ return e("b",{style:{color:l._r.saldo>0.005 ? "#F87171" : "#4ADE80"}}, v); }},
        {k:"acao", t:"Dados", render:function(v, l){ return e("button",{type:"button", disabled:!c.edita, onClick:function(){ si[1](l._r.pd); }, className:"h-8 rounded-md bg-white/10 px-2 text-[11px] font-semibold hover:bg-white/20 disabled:opacity-40"}, "Dados"); }}],
      linhas:linhas}),
    e("div",{className:"flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px]"},
      e("span",null, "Pago neste acerto: ", e("b",null, brl(a.pago))),
      e("span",null, "Identificado por pedido: ", e("b",null, brl(a.identificado))),
      e("span",null, "Valor ainda não identificado por pedido: ", e("b",{style:{color:a.naoIdentificado>0.005 ? "#FBBF24" : "#4ADE80"}}, brl(a.naoIdentificado)))),
    a.naoIdentificado>0.005 && c.edita && e("div",{className:"flex justify-center"}, e(Bt,{forte:true, ic:"magic-wand", titulo:"Propõe a divisão dos Pix sem pedido; só grava depois de você confirmar", onClick:function(){ sg[1](true); }}, "Sugerir divisão")),
    sg[0] && e(ModalSugestao,{c:c, chave:p.chave, fechar:function(){ sg[1](false); }}),
    a.mq>0.005 && e("div",{className:"flex flex-wrap items-center justify-center gap-2 text-[13px]"},
      e("span",null, "Desconto da maquininha de ", e("b",null, brl(a.mq)), " se refere a:"),
      e("div",{className:"w-64"}, e(CampoSel,{value:a.mqDe ? String(a.mqDe.pedidoId) : "", opcoes:[["", "Não identificado"], ["geral", "Acerto geral"]].concat(a.pedidos.map(function(r){ return [String(r.pd.id), r.pd.numero]; })),
        onChange:function(x){ if(!c.edita) return aviso(c, "Só financeiro e diretoria.", "alerta"); if(x) tenta(c, "ajuste_pedido", {chave:p.chave, pedidoId:x}); }}))),
    a.ajuste>0.005 && e("p",{className:"text-[11px]"}, "Diferença enviada a mais neste acerto: "+brl(a.ajuste)+" (acerto geral). Os Pix a mais entram no pedido quando forem identificados como adiantamento."),
    info && e(ModalPedidoInfo,{c:c, pd:info, fechar:function(){ si[1](null); }}));
}

// ───────────── SUGERIR DIVISÃO (19/11/2026): proposta dos Pix sem pedido, por ordem de vencimento; grava só o que for confirmado ─────────────
function ModalSugestao(p){
  var c = p.c, pf = c.pf, sug = sugerirDivisao(pf, p.chave), su = useState(null), usar = su[0] || sug.map(function(x){ return x.l.id; });
  var nome = function(id){ var pd = pf.pedidos.find(function(x){ return x.id===id; }); return pd ? pd.numero : "Pedido "+id; };
  var alterna = function(id){ su[1](usar.indexOf(id)>=0 ? usar.filter(function(x){ return x!==id; }) : usar.concat([id])); };
  var escolhidos = sug.filter(function(x){ return usar.indexOf(x.l.id)>=0; });
  var tot = function(f){ return escolhidos.reduce(function(s, x){ return s+f(x); }, 0); };
  var confirmar = function(){ if(!escolhidos.length) return aviso(c, "Marque pelo menos um pagamento.", "alerta"); if(tenta(c, "lanc_pedidos_lote", {itens:escolhidos.map(function(x){ return {id:x.l.id, alocs:x.alocs}; })})) p.fechar(); };
  return e(Modal,{t:"Sugerir divisão por pedido", largo:true, fechar:p.fechar, sub:"Proposta pela ordem de vencimento dos pedidos deste acerto, até o saldo de cada um. Nada é gravado até você confirmar. Os pagamentos continuam os mesmos, com os mesmos comprovantes."},
    !sug.length ? e("p",{className:"text-[13px]"}, "Não há Pix sem identificação que caiba no saldo dos pedidos deste acerto.") :
    e(TabelaPlanilha,{chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true,
      cols:[{k:"usar", t:"Usar", render:function(v, l){ return e("input",{type:"checkbox", "aria-label":"Usar a sugestão do Pix de "+l.rev, checked:usar.indexOf(l.id)>=0, onChange:function(){ alterna(l.id); }}); }},
        {k:"data", t:"Data"}, {k:"rev", t:"Revendedora"}, {k:"valor", t:"Valor do Pix"}, {k:"div", t:"Sugestão", render:function(v){ return e("span",{style:{whiteSpace:"normal"}}, v); }}, {k:"resto", t:"Fica sem pedido"}],
      linhas:sug.map(function(x){ return {id:x.l.id, usar:"", data:dt(x.l.data), rev:x.l.revendedora || "—", valor:brl(x.l.valor), div:x.novas.map(function(n){ return nome(n.pedidoId)+" "+brl(n.valor); }).join(" + "), resto:x.resto>0.005 ? brl(x.resto) : "—"}; })}),
    sug.length>0 && e("p",{className:"text-[13px]"}, escolhidos.length+" pagamento(s) marcado(s) · "+brl(tot(function(x){ return x.novas.reduce(function(s, n){ return s+n.valor; }, 0); }))+" vai(ão) para os pedidos"),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Bt,{onClick:p.fechar}, "Cancelar"), sug.length>0 && e(Bt,{forte:true, ic:"check", onClick:confirmar}, "Confirmar divisão")));
}

// ───────────── "Conteúdo do relatório" da janela Enviar acerto ao fornecedor ─────────────
// conteudo: "completo" (padrão, igual a hoje) | "um" | "varios". Com pedido escolhido, as ações abaixo valem só para ele(s).
function EscopoRelatorio(p){
  var c = p.c, pf = c.pf, fid = p.fid, a = acertoPorPedido(pf, p.chave), todos = pedidosDoForn(pf, fid).filter(function(pd){ return pd.semNF>0.005 || pagosDoPedido(pf, pd.id).length; });
  var ids = p.ids, setIds = p.setIds, sm = useState(""), msg = sm[0], sb = useState(false), boleto = sb[0];   // boleto: desligado = só Pix (igual ao acerto normal)
  var semIdLanc = pf.lancamentos.filter(function(l){ return l.fornId===fid && !l.aguardaComp && semIdent(l)>0.005; });
  var link = function(){ var t = Object.keys(pf.linksPedido || {}).find(function(k){ var x = pf.linksPedido[k]; return x.fornId===fid && x.pedidos.join(",")===ids.slice().map(Number).sort(function(m, n){ return m-n; }).join(",") && !!x.boleto===boleto; }); return t ? window.location.origin+"/acerto/"+t : ""; };
  var lk = ids.length ? link() : "";
  var comprovantes = function(){
    var ls = []; ids.forEach(function(id){ pagosDoPedido(pf, Number(id)).forEach(function(x){ if(x.l.arqKey && ls.indexOf(x.l)<0) ls.push(x.l); }); });
    var mapa = {}; return Promise.all(ls.map(function(l){ return buscarAnexo(l.arqKey).then(function(r){ mapa[l.id] = r && r.url || ""; }, function(){ mapa[l.id] = ""; }); })).then(function(){ return mapa; });
  };
  var montar = function(){ return comprovantes().then(function(m){ return htmlPedidos(pf, fid, ids.map(Number), function(l){ return m[l.id] || ""; }, {geradoEm:new Date().toISOString().slice(0, 10), boleto:boleto}); }); };
  var ver = function(){ var w = window.open("", "_blank"); montar().then(function(h){ var u = URL.createObjectURL(new Blob([h], {type:"text/html"})); if(w) w.location.href = u; else window.open(u, "_blank"); setTimeout(function(){ URL.revokeObjectURL(u); }, 60000); }); };
  var baixar = function(){ montar().then(function(h){ var u = URL.createObjectURL(new Blob([h], {type:"text/html"})), el = document.createElement("a"); el.href = u; el.download = "pedidos-"+String(p.fnome || "fornecedor").toLowerCase().replace(/[^a-z0-9]+/g, "-")+".html"; document.body.appendChild(el); el.click(); el.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 1500); }); };
  // cria o link (se ainda não existe) com um código sorteado aqui, para a mensagem já sair com ele
  var garantirLink = function(){ if(lk) return lk; if(!ids.length){ aviso(c, "Escolha o pedido.", "alerta"); return ""; } var t = novoCodigoLink(); return tenta(c, "link_pedidos", {fornId:fid, pedidos:ids.map(Number), boleto:boleto, token:t}) ? window.location.origin+"/acerto/"+t : ""; };
  var gerarLink = function(){ garantirLink(); };
  var gerarMsg = function(){ if(!c.edita && !lk) return aviso(c, "Só financeiro e diretoria geram o link.", "alerta"); var u = garantirLink(); if(u) sm[1](msgPedidos(pf, fid, ids.map(Number), u, boleto)); };
  var copiar = function(t, ok){ try { navigator.clipboard.writeText(t).then(function(){ aviso(c, ok); }); } catch(x){ aviso(c, "Não consegui copiar.", "alerta"); } };
  return e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-2.5 text-center ring-1 ring-[#3B82F6]/40"},
    e("b",{className:"text-[11px] uppercase"}, "Conteúdo do relatório"),
    e("div",{className:"flex justify-center"}, e(Segmentado,{opcoes:[["completo","Fechamento completo"], ["um","Pedido específico"], ["varios","Pedidos selecionados"]], atual:p.conteudo, onMudar:function(x){ p.setConteudo(x); setIds(x==="um" ? ids.slice(0, 1) : ids); sm[1](""); }})),
    p.conteudo==="um" && e(CampoSel,{t:"Pedido", value:ids[0] ? String(ids[0]) : "", opcoes:[["", "Selecione"]].concat(todos.map(function(pd){ return [String(pd.id), pd.numero]; })), onChange:function(x){ setIds(x ? [Number(x)] : []); sm[1](""); }}),
    p.conteudo==="varios" && e(MenuMulti,{t:"Pedidos", opcoes:todos.map(function(pd){ return [String(pd.id), pd.numero]; }), valor:ids.map(String), plural:"pedidos", vazio:"Nenhum pedido", onChange:function(l){ setIds(l.map(Number)); sm[1](""); }}),
    p.conteudo!=="completo" && semIdLanc.length>0 && e("p",{className:"rounded-md bg-[#FBBF24]/15 px-2 py-1 text-[13px] text-[#FBBF24]"}, semIdLanc.length+" pagamento(s) deste fornecedor ainda sem identificação de pedido. Eles NÃO entram no relatório por pedido; revise antes de enviar."),
    p.conteudo!=="completo" && e("label",{className:"flex cursor-pointer items-center justify-center gap-2 text-[13px] font-semibold"}, e("input",{type:"checkbox", checked:boleto, onChange:function(ev){ sb[1](ev.target.checked); sm[1](""); }}), "Incluir boleto no relatório e na mensagem (sem marcar: só o valor em Pix)"),
    p.conteudo!=="completo" && ids.length>0 && e("div",{className:"flex flex-col gap-2"},
      e("div",{className:"flex gap-2"}, e("input",{readOnly:true, value:lk || "Clique em Gerar link", "aria-label":"Link dos pedidos", className:INPUT+" h-8! min-w-0 flex-1 text-center text-[13px]!", onFocus:function(ev){ ev.target.select(); }}),
        lk ? e(Bt,{ic:"copy", onClick:function(){ copiar(lk, "Link copiado"); }}, "Copiar") : e(Bt,{ic:"link", disabled:!c.edita, onClick:gerarLink}, "Gerar link")),
      e("div",{className:"flex flex-wrap justify-center gap-2"},
        e(Bt,{ic:"eye", onClick:ver}, "Ver como o fornecedor vê"), e(Bt,{ic:"download-simple", onClick:baixar}, "Baixar HTML"),
        e(Bt,{ic:"chat-circle-dots", onClick:gerarMsg}, "Gerar mensagem"),
        msg && e(Bt,{ic:"copy", onClick:function(){ copiar(msg, "Mensagem copiada"); }}, "Copiar mensagem")),
      msg && e("textarea",{rows:9, value:msg, "aria-label":"Mensagem", onChange:function(ev){ sm[1](ev.target.value); }, className:INPUT+" h-auto! py-2 text-[13px]!"}),
      e("p",{className:"text-[11px]"}, "O link mostra só os pedidos escolhidos e os comprovantes dos pagamentos ligados a eles. Não dá acesso ao fechamento completo nem a outros pedidos.")));
}

export { IdentPedidos, ModalIdent, MarcaPedidos, BlocoPedidos, EscopoRelatorio, paraAcao };
