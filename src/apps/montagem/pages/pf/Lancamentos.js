// Sorelly Admin · montagem — pages/pf/Lancamentos.js
// Lançamento de pagamentos (Pagamentos a Fornecedores): Pix (sem NF) do mês, uma linha por fornecedor e data de pagamento.
// Refeita no padrão do Cadastro de prestadores (20/11/2026, pedido do Marcus: "faça igual, mesma fonte, bordas, tudo parecido, sem perder nenhum dado"): bloco azul com a tabela de planilha (filtro e ordem no nome de cada coluna),
// faixa de controles em cima (só o mês) e, embaixo, o bloco da data escolhida com os Pix lançados (comprovante, conferência, estorno), os avisos de saldo e os pedidos.
// As janelas "Lançar pagamento", "Editar pagamento" e "Enviar acerto ao fornecedor" continuam as mesmas. Contas e regras ficam em domain/pf.js; aqui só o desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { cartoesLancamento, conferidoDe, temComprovante, filtrarLancamentos, hojeIso, destinoSaldo, janelaPorChave, janelasDoForn, ajustaExcesso, mesAtual, mesLabel, mesMais, mesesComLanc, pagoJanela } from "@/apps/montagem/domain/pf";
import { comprovantesDosRecebidos } from "@/apps/montagem/domain/comprovantes-receber";
import { apagarArquivo, baixarArquivo, obterArquivo } from "@/apps/montagem/lib/arquivos";
import { abrirAnexo, enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { copiar, msgWhatsApp, nomeArquivoExtrato, useLinkConferencia, useMesLanc } from "@/apps/montagem/pages/pf/extrato";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { COR, Campo, Modal, Sel, Txt, aviso, brl, dbr, mut, op, usePf } from "@/apps/montagem/pages/pf/ui";
import { INPUT } from "@/apps/montagem/ui/input";
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { BarraTabela, CampoMini, CelulaBarra } from "@/apps/montagem/components/planilha-cheia";
import { e, useEffect, useState } from "@/shared/react";
import { lerAlocs, porPedidoAtivo } from "@/apps/montagem/domain/pf";
import { nomeJanela } from "@/apps/montagem/domain/pf-mes";
import { BlocoPedidos, EscopoRelatorio, IdentPedidos, MarcaPedidos, ModalIdent, paraAcao } from "@/apps/montagem/pages/pf/PorPedido";   // controle por pedido (19/11/2026), só fornecedor com a opção ligada

// botão da janela (tipos: normal, forte, ok, conf, perigo): 32 px e letra de 13 px, como os botões do padrão
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#3B82F6] text-black hover:bg-[#FBBF24]", ok:"bg-[#22C55E]/25 text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35", conf:"bg-[#3B82F6]/25 text-[#93C5FD] ring-1 ring-[#3B82F6]/50 hover:bg-[#3B82F6]/35", perigo:"bg-destructive/20 text-destructive hover:bg-destructive/30"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition "+BT[p.tipo||"normal"]+(p.disabled ? " opacity-40" : "")+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:14}), p.children); }
// botãozinho de dentro da tabela (22 px, letra de 11 px), igual aos da tabela de prestadores
var BTL = "inline-flex h-[14px] items-center gap-1 whitespace-nowrap border-0 border-b bg-transparent px-0.5 text-[10px] font-medium leading-none disabled:opacity-40 ";   // padrao-ok: o que se clica é só texto com uma linha embaixo (pedido do Marcus, 20/11/2026)
var BTL_T = {normal:"border-white/50 text-white hover:text-white/80", forte:"border-primary text-primary hover:brightness-125", ok:"border-[#4ADE80]/60 text-[#4ADE80] hover:brightness-125", conf:"border-[#93C5FD]/60 text-[#93C5FD] hover:brightness-125", perigo:"border-destructive/60 text-destructive hover:brightness-125"};
function BtL(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); if(p.onClick) p.onClick(ev); }, disabled:p.disabled, title:p.titulo, "aria-label":p.titulo || (typeof p.children==="string" ? p.children : undefined), className:BTL+BTL_T[p.tipo||"normal"]}, p.ic && e(Ph,{n:p.ic, s:10}), p.children); }
// fundo azul-marinho e linhas de 26 px / letra de 11 px: o mesmo da tabela de prestadores
var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c] [&_tbody_tr[aria-expanded=true]]:!bg-[#26385c] [&_tbody_tr:not([aria-expanded])>td[colspan]]:!bg-[#1a2540]";
var FINA = "[&_table_td]:!text-[10px] [&_table_th]:!text-[10px] [&_table_td]:!h-[18px] [&_table_td]:!px-1 [&_table_th]:!px-1 [&_table_td]:!py-0 [&_table_td]:!leading-none [&_table_th]:!h-[16px] [&_table_th]:!py-0 [&_table_th_button]:!h-[14px] [&_table_th_button]:!px-0 [&_table_th_button]:!gap-0.5 [&_table_th_button]:!py-0 [&_table_th_button]:!leading-none [&_table_th_button]:!tracking-normal [&_table_th_button]:!text-[10px] [&_table_th_span]:!text-[10px] [&_table_th_span]:!leading-none [&_table_th_span]:!tracking-normal [&_table_tr]:!h-[18px] [&_table_td_button]:!text-[10px] [&_table_td_a]:!text-[10px] [&_table_td_input]:!h-[14px]";   // padrao-ok: mesma fonte (10 px), linhas de 18 px e cabeçalho de 16 px da Contas a receber, pedido do Marcus (20/11/2026)
var TITULO_FINO = "";   // títulos dos blocos no tamanho padrão (13 px, negrito, barra de 28 px), igual à tela Negociações; todas as barras ficam da mesma altura (Marcus, 21/11/2026)
var COMPACTA = FUNDO+" "+FINA+" "+TITULO_FINO;
var DETALHE = FUNDO+" "+FINA+" "+TITULO_FINO;
var BTN_NAV = "grid h-[18px] w-[18px] place-items-center rounded border border-white/25 bg-white/10 text-[10px] hover:bg-white/20";   // padrao-ok: igual à faixa da Contas a receber
var BTN_MINI = "inline-flex h-[18px] items-center whitespace-nowrap rounded border px-2 text-[10px] font-medium leading-none disabled:opacity-40 ";   // padrao-ok: botão da faixa azul, 18 px e 10 px
function BotaoMini(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.desabilitado, title:p.title || (typeof p.children==="string" ? p.children : undefined), className:BTN_MINI+(p.principal ? "border-primary bg-primary/20 text-primary hover:bg-primary/30" : "border-white/25 bg-white/10 text-white hover:bg-white/20")}, p.children); }


// ───────────── janela: Editar pagamento (só enquanto não estiver conferido) ─────────────
function ModalEditar(p){
  var c = p.c, l = p.l, datas = janelasDoForn(c.pf, l.fornId);
  var st = useState({data:l.data, rev:l.revendedora||"", valor:Number(l.valor).toFixed(2), conta:l.conta==="—" ? "" : (l.conta||""), chavePix:l.chavePix||"", chave:l.chave, arq:null}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var opcoes = datas.some(function(j){ return j.chave===l.chave; }) ? datas : [{chave:l.chave, limite:l.limite||l.chave.split("|")[1]}].concat(datas);
  var salvar = function(){
    var patch = {data:v.data, revendedora:v.rev, valor:parseFloat(v.valor), conta:v.conta, chavePix:v.chavePix, chave:v.chave};
    var gravar = function(){ op(c, "lanc_set", {id:l.id, patch:patch}); p.fechar(); };
    if(!v.arq) return gravar();
    lerAnexo(v.arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ patch.arqKey = sv.key; patch.arqNome = v.arq.name; patch.arqTipo = v.arq.type; gravar(); },
      function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+"Não consegui enviar o comprovante.", "alerta"); });
  };
  return e(Modal,{t:"Editar pagamento", fechar:p.fechar, sub:e("span",null, "Lançado: ", e("b",null, brl(l.valor)), " · "+(l.revendedora||"—")+" · "+dbr(l.data))},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Data"}, e(Txt,{type:"date", value:v.data, label:"Data", onChange:function(x){ set("data", x); }})),
      e(Campo,{rot:"Nome da revendedora"}, e(Txt,{value:v.rev, label:"Nome da revendedora", onChange:function(x){ set("rev", x); }})),
      e(Campo,{rot:"Valor (R$)"}, e(Dinheiro,{out:"ponto", value:v.valor, label:"Valor", onChange:function(x){ set("valor", x); }})),
      e(Campo,{rot:"Data de pagamento"}, e(Sel,{value:v.chave, label:"Data de pagamento", className:"w-full", onChange:function(x){ set("chave", x); }},
        opcoes.map(function(j){ return e("option",{key:j.chave, value:j.chave}, dbr(j.limite)); }))),
      e(Campo,{rot:"Conta"}, e(Txt,{value:v.conta, label:"Conta", ph:"Ex.: Pix - Bradesco Prime", onChange:function(x){ set("conta", x); }})),
      e(Campo,{rot:"Chave Pix enviada"}, e(Txt,{value:v.chavePix, label:"Chave Pix enviada", onChange:function(x){ set("chavePix", x); }}))),
    e(Campo,{rot:"Comprovante de pagamento"},
      e("div",{className:"flex flex-wrap items-center gap-3 rounded-lg bg-black/25 px-3 py-2"},
        e("label",{className:"inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-[13px] font-bold hover:bg-white/15"}, e(Ph,{n:"paperclip", s:14}), l.arqKey || l.arqNome ? "Trocar arquivo" : "Selecionar arquivo",
          e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ set("arq", ev.target.files && ev.target.files[0] ? ev.target.files[0] : null); }})),
        e("span",{className:"text-[13px]"}, v.arq ? v.arq.name : (l.arqNome || "Nenhum arquivo")))),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:salvar}, "Salvar alteração")));
}


// ───────────── comprovante de um Pix (abrir, baixar ou anexar) ─────────────
var BTN_COMP = "inline-flex !h-[14px] !min-h-0 items-center gap-1 !border-0 !border-b !border-[#38BDF8]/70 !bg-transparent !px-0.5 !py-0 !text-[10px] font-medium leading-none !text-[#7DD3FC] hover:!text-white";   // padrao-ok: link com linha embaixo, menor
function comprovanteEl(c, l){
  var comp = l.arqKey
    ? e("a",{href:"#", role:"button", title:l.arqNome, onClick:function(ev){ ev.preventDefault(); ev.stopPropagation(); abrirAnexo(l.arqKey).catch(function(){ aviso(c, "Não consegui abrir o comprovante.", "alerta"); }); }, className:BTN_COMP}, e(Ph,{n:"paperclip", s:10}), "Comprovante")
    : l.arqId
    ? e("a",{href:"#", role:"button", title:l.arqNome, onClick:function(ev){ ev.preventDefault(); ev.stopPropagation(); baixarArquivo(l.arqId, l.arqNome||"comprovante").catch(function(){ aviso(c, "Não achei o arquivo neste computador.", "alerta"); }); }, className:BTN_COMP}, e(Ph,{n:"paperclip", s:10}), "Comprovante")
    : String(l.arqData||"").indexOf("data:")===0
      ? e("a",{href:l.arqData, target:"_blank", rel:"noreferrer", download:l.arqNome, title:l.arqNome, onClick:function(ev){ ev.stopPropagation(); }, className:BTN_COMP}, e(Ph,{n:"paperclip", s:10}), "Comprovante")
      : l.arqNome ? e("span",{className:"inline-flex items-center gap-1", title:l.arqNome}, e(Ph,{n:"paperclip", s:10}), "Comprovante anexado")
      : e("span",null, "---");
  // Pix vindo do Direcionar (17/11/2026): só conta como pago depois de anexar o comprovante
  if(l.aguardaComp) comp = e("label",{title:"Pix confirmado por "+(l.direcionadoPor||"Financeiro")+" no Direcionar. Anexe o comprovante para contar como pago.", className:BTN_COMP+" cursor-pointer !border-warning/70 !text-warning", onClick:function(ev){ ev.stopPropagation(); }}, e(Ph,{n:"paperclip", s:10}), "Anexar",
    e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ var arq = ev.target.files && ev.target.files[0]; if(!arq) return;
      lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ op(c, "lanc_comp", {id:l.id, arqNome:arq.name, arqTipo:arq.type, arqKey:sv.key}); }, function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+"Não consegui enviar o comprovante.", "alerta"); }); }}));
  return comp;
}

// ───────────── ações de um Pix lançado: editar (só antes da conferência), pedido, conferir e estornar ─────────────
function AcoesLanc(p){
  var l = p.l, c = p.c, se = useState(false), editando = se[0], setEditando = se[1], si = useState(false), porPed = porPedidoAtivo(c.pf, l.fornId) || (l.alocs || []).length>0;
  return e("span",{className:"inline-flex items-center gap-1"},
    // editar só enquanto não estiver conferido (Lucas, 18/11/2026)
    !l.auto && e(BtL,{ic:"pencil-simple", disabled:!c.edita || !!l.conferido, titulo:!c.edita ? "Só financeiro e diretoria" : l.conferido ? "Conferido: desfaça a conferência para alterar" : "Alterar este pagamento", onClick:function(){ setEditando(true); }}, "Editar"),
    // Conferir voltou (Lucas, 23/11/2026): o financeiro confere à mão se está tudo certo; dá para desfazer
    !l.auto && e(BtL,{ic:l.conferido ? "arrow-counter-clockwise" : "check", tipo:l.conferido ? "normal" : "conf", disabled:!c.edita, titulo:!c.edita ? "Só financeiro e diretoria" : l.conferido ? "Desfazer a conferência deste pagamento" : "Marcar este pagamento como conferido",
      onClick:function(){ if(l.conferido && !window.confirm("Desfazer a conferência deste pagamento de "+brl(l.valor)+"?")) return; op(c, "lanc_conferido", {id:l.id}); }}, l.conferido ? "Desfazer conferência" : "Conferir"),
    editando && e(ModalEditar,{c:c, l:l, fechar:function(){ setEditando(false); }}),
    // Estornar voltou (Lucas, 23/11/2026): apaga o Pix lançado errado, com confirmação; Pix dividido sai com todas as partes
    !l.auto && e(BtL,{ic:"trash", tipo:"perigo", disabled:!c.edita, titulo:c.edita ? "Estornar este pagamento" : "Só financeiro e diretoria", onClick:function(){
      if(!window.confirm("Estornar este pagamento de "+brl(l.valor)+" ("+(l.revendedora||"sem nome")+", "+dbr(l.data)+")?")) return;
      if(l.arqId) apagarArquivo(l.arqId);
      op(c, "lanc_del", {id:l.id}); }}, "Estornar"),
    porPed && !l.auto && e(MarcaPedidos,{c:c, l:l, abrir:function(){ si[1](true); }}),   // para qual pedido foi o dinheiro (não confere o pagamento)
    si[0] && e(ModalIdent,{c:c, l:l, fechar:function(){ si[1](false); }}),
    null);
}

// ───────────── os Pix lançados de uma data (tabela de planilha: filtro e ordem no nome de cada coluna) ─────────────
// Pix que passou do total de uma data e foi cobrir a seguinte (as linhas "Crédito" automáticas): a divisão sai em cima do ÚLTIMO Pix da data de origem (o que atravessou o total).
// Só de exibição: nada muda no banco. Origem e destino calculam igual, então os dois lados mostram o mesmo Pix cortado em partes (Marcus, 21/11/2026)
function repartirPix(pf, chave){
  var r2 = function(x){ return Math.round(x*100)/100; };
  var todos = pf.lancamentos.filter(function(l){ return l.chave===chave; });
  var reais = todos.filter(function(l){ return !l.auto && l.valor>0; }).sort(function(a, b){ return String(a.data).localeCompare(String(b.data)) || a.id-b.id; });
  var resta = {}; reais.forEach(function(l){ resta[l.id] = l.valor; });
  var saidas = todos.filter(function(l){ return l.auto && l.paraChave && l.valor<0; }).sort(function(a, b){ return String(a.paraChave).localeCompare(String(b.paraChave)); });
  var partes = [], sobra = {};
  saidas.forEach(function(s){
    var rest = r2(-s.valor);
    for(var i = reais.length-1; i>=0 && rest>0.004; i--){
      var l = reais[i], t = Math.min(rest, resta[l.id]); if(t<=0.004) continue;
      resta[l.id] = r2(resta[l.id]-t); rest = r2(rest-t); partes.push({l:l, par:s.par, para:s.paraChave, valor:t});
    }
    if(rest>0.004) sobra[s.par] = rest;   // sem Pix para cortar (ex.: veio de desconto): continua como linha de crédito
  });
  return {partes:partes, sobra:sobra, resta:resta};
}
function ListaPagamentos(p){
  var cd = p.cd, c = p.c, res = filtrarLancamentos(cd.lancs, {}), pf = c.pf, minha = repartirPix(pf, cd.chave), cacheOrig = {};
  // ORIGEM (Lucas, 23/11/2026): só Automático (veio do Direcionar ou do próprio sistema) ou Manual
  var origemDe = function(l){ return (l.origemPix || l.auto) ? "Automático" : "Manual"; };
  var base = function(l){ return {l:l, data:dbr(l.data), rev:l.revendedora||"—", conta:l.conta||"—", chave:l.chavePix||"—", por:l.pagoPor||"---", origem:origemDe(l),
    sit:conferidoDe(l) ? "Conferido"+(l.conferidoEm ? " "+dbr(l.conferidoEm) : "") : temComprovante(l) ? "Aguardando conferência" : "Falta o comprovante", comp:l.arqKey || l.arqId || l.arqNome || l.aguardaComp ? "com" : "sem"}; };
  // "nome · R$ 1.000,00 · 1/2": o Pix inteiro junto do nome e a parte no fim; a coluna Valor traz só o que fecha esta data
  var nomeParte = function(l, k, n){ return (l.revendedora||"—")+(n>=2 ? " · "+brl(l.valor)+" · "+k+"/"+n : ""); };
  var linhas = [];
  res.lista.forEach(function(l){
    if(l.auto && l.paraChave && l.valor<0){   // saiu daqui para outra data: o Pix cortado já aparece abaixo; só sobra a linha se não havia Pix para cortar
      var sb = minha.sobra[l.par]; if(sb) linhas.push(Object.assign({id:String(l.id)}, base(l), {valor:-sb})); return; }
    if(l.auto && l.deChave && l.valor>0){   // veio de outra data: mostra as partes do Pix de lá
      var orig = cacheOrig[l.deChave] || (cacheOrig[l.deChave] = repartirPix(pf, l.deChave));
      orig.partes.filter(function(x){ return x.par===l.par; }).forEach(function(x){
        var n = orig.partes.filter(function(z){ return z.l===x.l; }).length+(orig.resta[x.l.id]>0.004 ? 1 : 0), k = (orig.resta[x.l.id]>0.004 ? 2 : 1)+orig.partes.filter(function(z){ return z.l===x.l; }).indexOf(x);
        linhas.push(Object.assign({id:"p"+x.l.id+"-"+l.par}, base(x.l), {rev:nomeParte(x.l, k, n), valor:x.valor, parte:true})); });
      var sv = orig.sobra[l.par]; if(sv) linhas.push(Object.assign({id:String(l.id)}, base(l), {valor:sv}));
      return; }
    var mp = minha.partes.filter(function(x){ return x.l===l; }), ficou = minha.resta[l.id]!=null ? minha.resta[l.id] : l.valor;
    if(mp.length && ficou<=0.004) return;   // o Pix inteiro foi para outra data: aparece lá
    linhas.push(Object.assign({id:String(l.id)}, base(l), {rev:nomeParte(l, 1, mp.length+1), valor:ficou}));
  });
  // desconto da Maquininha Banho: abatido direto na conta, entra como uma linha da lista
  if(cd.mq>0.005) linhas.push({id:"mq", l:null, data:"Desc.", rev:"Maquininha Banho · "+cd.mqRef, conta:"Abatido direto na conta", chave:"—", por:"---", origem:"Automático", valor:cd.mq, sit:"—", comp:"—",
    acao:e(BtL,{ic:"sliders", titulo:"Ajustar na aba Maquininha Banho", onClick:function(){ c.d({type:"ABA", aba:"pfmaq"}); }}, "Ajustar")});
  // o que passou de uma data para outra, o saldo, o ajuste e o pago a mais viram LINHAS da tabela (não entram no Total dos Pix); o Pix que passou de uma data para outra já tem a sua linha própria (Marcus, 21/11/2026)
  var info = function(id, rev, valor, acao){ linhas.push({id:"i-"+id, l:null, info:true, data:"—", rev:rev, conta:"—", chave:"—", por:"---", origem:"Automático", valor:valor, sit:"—", comp:"—", acao:acao || null}); };
  if(cd.saldoDst) info("falta", "Falta pagar nesta data", cd.aberto, c.edita ? e(BtL,{ic:"arrow-bend-down-right", titulo:"Passar o que falta para a parcela de "+dbr(cd.saldoDst.limite), onClick:function(){
    if(window.confirm("Passar "+brl(cd.aberto)+" que falta em "+dbr(cd.limite)+" para somar na parcela de "+dbr(cd.saldoDst.limite)+"?")) op(c, "saldo_passar", {chave:cd.chave}); }}, "Passar para "+dbr(cd.saldoDst.limite)) : null);
  cd.saldoSaiu.forEach(function(x){ info("ss"+x.chave, "Saldo passou para "+dm(x.chave), -x.valor); });
  cd.saldoVeio.forEach(function(x){ info("sv"+x.chave, "Saldo veio de "+dm(x.chave), x.valor); });
  if(cd.ajuste>0.005) info("aj", "Diferença enviada a mais · somada à dívida"+(cd.descSaiu.length ? " · descontada em "+cd.descSaiu.map(function(x){ return dm(x.chave); }).join(", ") : ""), cd.ajuste, e(BtL,{ic:"plus-circle", titulo:"Ver o ajuste nas Negociações", onClick:function(){ c.d({type:"ABA", aba:"pfneg"}); }}, "Ver ajuste"));
  cd.descVeio.forEach(function(x){ info("dv"+x.chave, "Desconto · enviado a mais em "+dm(x.chave), -x.valor); });
  if(cd.excPix>0.005) info("exc", "Pago a mais", cd.excPix);
  var cols = [{k:"data", t:"Data"}, {k:"rev", t:"Revendedora"}, {k:"conta", t:"Conta"}, {k:"chave", t:"Chave Pix"}, {k:"por", t:"Pago por"}, {k:"origem", t:"Origem"},
    {k:"comp", t:"Comprovante", render:function(v, l){ return l.l ? comprovanteEl(c, l.l) : "—"; }},
    {k:"sit", t:"Situação", cor:function(l){ return !l.l ? "" : (conferidoDe(l.l) ? "text-success" : "text-warning"); }},
    {k:"valor", t:"Valor", fmt:brl, cor:function(l){ return Number(l.valor)<0 ? "text-destructive" : "text-success"; }},
    {k:"acoes", t:"", render:function(v, l){ return l.parte ? null : l.l ? e(AcoesLanc,{c:c, l:l.l}) : (l.acao || null); }}];   // a parte "2/2" não tem Editar: edita-se o Pix na linha "1/2"
  var rodape = function(ls){ return ["Total", String(new Set(ls.filter(function(x){ return x.l && !x.l.auto; }).map(function(x){ return x.l.id; })).size)+" Pix", "", "", "", "", "", cd.aguardando>0 ? cd.aguardando+" a conferir" : "", brl(ls.filter(function(x){ return !x.info; }).reduce(function(t, x){ return t+Number(x.valor||0); }, 0)), ""]; };
  return e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, totalRodape:rodape, vazio:"Nenhum pagamento lançado nesta data."});
}

// ───────────── avisos da data: saldo que passou para outra data, que veio de outra, pago a mais, desconto da maquininha ─────────────
function dm(chave){ var l = String(chave||"").split("|")[1]||""; return l.slice(8,10)+"/"+l.slice(5,7); }
function avisosDe(cd){
  var a = [];
  if(cd.saldoDst) a.push("Falta "+brl(cd.aberto));
  cd.passou.forEach(function(x){ a.push(brl(x.valor)+" passou para "+dm(x.chave)); });
  cd.saldoSaiu.forEach(function(x){ a.push("Saldo de "+brl(x.valor)+" passou para "+dm(x.chave)); });
  cd.saldoVeio.forEach(function(x){ a.push("Saldo de "+brl(x.valor)+" veio de "+dm(x.chave)); });
  cd.veio.forEach(function(x){ a.push(brl(x.valor)+" veio de "+dm(x.chave)); });
  if(cd.ajuste>0.005) a.push("Diferença enviada a mais: "+brl(cd.ajuste)+" · somada à dívida"+(cd.descSaiu.length ? " · descontada em "+cd.descSaiu.map(function(x){ return dm(x.chave); }).join(", ") : ""));
  cd.descVeio.forEach(function(x){ a.push("Desc. de "+brl(x.valor)+" · enviado a mais em "+dm(x.chave)); });
  if(cd.excPix>0.005) a.push("Pago a mais: "+brl(cd.excPix));
  if(cd.mq>0.005) a.push("Desc. da maquininha "+brl(cd.mq)+" ("+cd.mqRef+")"+(cd.excesso>0.005 ? " · sobra "+brl(cd.excesso) : ""));
  return a;
}

// ───────────── janela: Lançar pagamento ─────────────
function ModalLancar(p){
  var c = p.c, sCh = useState(p.chave || ""), chave = sCh[0], escolher = !!p.escolher;   // escolher = janela completa (Marcus, 20/11/2026): o financeiro escolhe o fornecedor e em QUAL data o Pix entra
  var j = chave ? janelaPorChave(c.pf, chave) : null, f = chave ? c.pf.fornecedores.find(function(x){ return x.id===parseInt(chave.split("|")[0]); }) : null;
  var aberto = j ? Math.max(0, j.total-pagoJanela(c.pf, chave)) : 0;
  var st = useState({data:hojeIso(), rev:"", valor:aberto>0.005 ? aberto.toFixed(2) : "", conta:"", chavePix:"", pagoPor:"", arq:null, adiar:"manter"}), v = st[0], setV = st[1];
  var datasDe = function(fid){ return janelasDoForn(c.pf, fid).slice().sort(function(x, y){ return x.limite.localeCompare(y.limite); }); };
  var escolheData = function(k){ var jj = k ? janelaPorChave(c.pf, k) : null, ab = jj ? Math.max(0, jj.total-pagoJanela(c.pf, k)) : 0; sCh[1](k); setV(Object.assign({}, v, {valor:ab>0.005 ? ab.toFixed(2) : "", adiar:"manter"})); };
  var escolheForn = function(fid){ var ds = datasDe(fid), alvo = ds.find(function(x){ return pagoJanela(c.pf, x.chave)<x.total-0.005; }) || ds[ds.length-1]; escolheData(alvo ? alvo.chave : ""); };
  var porPed = !!f && porPedidoAtivo(c.pf, f.id), sAl = useState([]), alocs = sAl[0];   // "Este pagamento se refere a:" (só fornecedor com a opção ligada)
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  // pago a mais: de novembro/2026 em diante a dívida da data sobe sozinha ("Diferença enviada a mais"); antes disso fica só o aviso
  var vNum = parseFloat(v.valor), excV = vNum>aberto+0.005 ? Math.round((vNum-aberto)*100)/100 : 0, ajusta = excV && ajustaExcesso(c.pf, chave);
  var avisoValor = !excV ? null
    : e("div",{className:"rounded-lg px-3 py-2 text-center text-[13px] "+(ajusta ? "bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/50" : "bg-destructive/15 ring-1 ring-destructive/50")},
        ajusta ? e("div",null, "Diferença enviada a mais: ", e("b",null, brl(excV)), ". A dívida desta data sobe de "+brl(j ? j.total : 0)+" para ", e("b",null, brl((j ? j.total : 0)+excV)), ".")
          : e("div",null, "Passou do total em ", e("b",null, brl(excV)), ". Fica só o aviso na linha."));
  // pagou menos do que falta: manter o saldo em aberto nesta data ou passar a diferença para a 1ª data do mês seguinte
  var difMenos = vNum>0.005 && aberto-vNum>0.005 ? Math.round((aberto-vNum)*100)/100 : 0, dst = difMenos && j && j.limite<hojeIso() ? destinoSaldo(c.pf, chave) : null;   // só depois de vencida
  var escolhaSaldo = !dst ? null
    : e("div",{className:"flex flex-col items-center gap-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-[13px]"},
        e("div",null, "Falta ", e("b",{style:{color:COR.red}}, brl(difMenos)), " nesta data"),
        e(Segmentado,{opcoes:[["manter","Manter em aberto"], ["adiar","Passar para "+dbr(dst.limite)]], atual:v.adiar, onMudar:function(x){ set("adiar", x); }}));
  var salvar = function(){
    var valor = parseFloat(v.valor);
    if(!valor || valor<=0) return aviso(c, "Informe o valor pago.", "alerta");
    if(!v.data) return aviso(c, "Informe a data do pagamento.", "alerta");
    if(!chave) return aviso(c, "Escolha o fornecedor e a data em que o Pix entra.", "alerta");
    var rev = v.rev.trim(); if(!rev) return aviso(c, "Informe o nome da revendedora (ou de quem pagou).", "alerta");
    var arq = v.arq, base = {chave:chave, data:v.data, revendedora:rev, valor:valor, conta:v.conta.trim(), chavePix:v.chavePix.trim(), pagoPor:v.pagoPor.trim(), forcar:true, adiar:!!dst && v.adiar==="adiar"};
    if(porPed && alocs.length){ var cfA = lerAlocs(c.pf, f.id, valor, paraAcao(alocs), null); if(cfA.erro) return aviso(c, cfA.erro, "alerta"); base.alocs = cfA.alocs; }   // um registro só; a divisão vai junto
    var gravar = function(arqId){
      op(c, "lanc_add", Object.assign({}, base, arq ? {arqNome:arq.name, arqTipo:arq.type, arqData:hojeIso()} : {}));
      // guarda o id do arquivo no lançamento recém-criado
      if(arqId) mut(c, function(pf){ var ls = pf.lancamentos.filter(function(l){ return l.chave===chave && !l.arqId && l.arqNome===arq.name; }); if(ls.length) ls[ls.length-1].arqId = arqId; return "Pagamento lançado — "+brl(valor)+" para "+rev+" · comprovante anexado"; });
      p.fechar(chave);
    };
    if(!arq) return gravar("");
    // o comprovante vai para o SERVIDOR (todo mundo abre, em qualquer computador); só foto ou PDF (Marcus, 16/11/2026)
    lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ base.arqKey = sv.key; gravar(""); }, function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+"O pagamento será lançado sem anexo.", "alerta"); arq = null; gravar(""); });
  };
  return e(Modal,{t:"Lançar pagamento", fechar:function(){ p.fechar(null); },
    sub:chave ? e("span",null, (f ? f.nome : "")+" · pagamento de ", e("b",null, dbr(chave.split("|")[1])), " · falta ", e("b",{style:{color:COR.red}}, brl(aberto)), " de "+brl(j ? j.total : 0)) : e("span",null, "Escolha o fornecedor e a data em que o Pix entra")},
    escolher && e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Fornecedor"}, e(Sel,{value:f ? String(f.id) : "", label:"Fornecedor", className:"w-full", onChange:function(x){ if(x) escolheForn(parseInt(x)); }}, e("option",{value:""}, "Escolha o fornecedor"), c.pf.fornecedores.map(function(x){ return e("option",{key:x.id, value:String(x.id)}, x.nome); }))),
      e(Campo,{rot:"Entra no pagamento de"}, e(Sel,{value:chave, label:"Entra no pagamento de", className:"w-full", onChange:escolheData}, e("option",{value:""}, f ? "Escolha a data" : "Escolha o fornecedor antes"), f ? datasDe(f.id).map(function(x){ var fl = Math.max(0, x.total-pagoJanela(c.pf, x.chave)); return e("option",{key:x.chave, value:x.chave}, dbr(x.limite)+" · "+(fl>0.005 ? "falta "+brl(fl) : "quitado")); }) : null))),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Data"}, e(Txt,{type:"date", value:v.data, label:"Data", onChange:function(x){ set("data", x); }})),
      e(Campo,{rot:"Nome da revendedora"}, e(Txt,{value:v.rev, label:"Nome da revendedora", ph:"Ex.: Ana Paula de Lima", onChange:function(x){ set("rev", x); }})),
      e(Campo,{rot:"Valor (R$)"}, e(Dinheiro,{out:"ponto", value:v.valor, label:"Valor", onChange:function(x){ set("valor", x); }})),
      e(Campo,{rot:"Conta"}, e(Txt,{value:v.conta, label:"Conta", ph:"Ex.: Pix - Bradesco Prime", onChange:function(x){ set("conta", x); }})),
      e(Campo,{rot:"Chave Pix enviada"}, e(Txt,{value:v.chavePix, label:"Chave Pix enviada", ph:"Chave que recebeu o Pix", onChange:function(x){ set("chavePix", x); }})),
      escolher && e(Campo,{rot:"Pago por (de onde saiu)"}, e(Txt,{value:v.pagoPor, label:"Pago por", ph:"Ex.: Marcus PF, Lucas, revendedora", onChange:function(x){ set("pagoPor", x); }}))),
    e(Campo,{rot:"Comprovante de pagamento"},
      e("div",{className:"flex flex-wrap items-center gap-3 rounded-lg bg-black/25 px-3 py-2"},
        e("label",{className:"inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-[13px] font-bold hover:bg-white/15"}, e(Ph,{n:"paperclip", s:14}), "Selecionar arquivo",
          e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ set("arq", ev.target.files && ev.target.files[0] ? ev.target.files[0] : null); }})),
        e("span",{className:"text-[13px] "+(v.arq ? "" : "text-muted-foreground")}, v.arq ? v.arq.name : "Nenhum arquivo selecionado"))),
    porPed && e(IdentPedidos,{c:c, fid:f.id, valor:v.valor, alocs:alocs, setAlocs:sAl[1], lancId:null}),
    avisoValor,
    escolhaSaldo,
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Bt,{onClick:function(){ p.fechar(null); }}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:salvar}, "Lançar pagamento")));
}

// ───────────── janela: Enviar acerto ao fornecedor ─────────────
function ModalAcerto(p){
  var c = p.c, pf = c.pf, chave = p.chave, parte = chave.split("|"), f = pf.fornecedores.find(function(x){ return x.id===parseInt(parte[0]); }), j = janelaPorChave(pf, chave);
  var cd = cartoesLancamento(pf, j ? j.mes : mesAtual()).grupos.reduce(function(a, g){ return a || g.cards.find(function(k){ return k.chave===chave; }); }, null);
  var ms = useState(""), msg = ms[0], setMsg = ms[1];
  var total = j ? j.total : 0, pago = Math.min(pagoJanela(pf, chave), total), falta = total-pago, ls = cd ? cd.lancs : [], comComp = ls.filter(function(l){ return l.arqId || l.arqKey || l.arqData; }).length;
  var lk = useLinkConferencia(pf, chave), link = lk.link;
  // "Conteúdo do relatório" (19/11/2026): só para fornecedor com a opção ligada; "Fechamento completo" continua o padrão e igual a hoje
  var porPed = !!f && porPedidoAtivo(pf, f.id), sCt = useState("completo"), sIds = useState([]);
  var escopo = porPed && e(EscopoRelatorio,{c:c, fid:f.id, fnome:f.nome, chave:chave, conteudo:sCt[0], setConteudo:sCt[1], ids:sIds[0], setIds:sIds[1]});
  if(porPed && sCt[0]!=="completo") return e(Modal,{t:"Enviar acerto ao fornecedor", fechar:p.fechar, sub:e("span",null, f.nome+" · relatório por pedido")}, escopo, e("div",{className:"flex justify-end"}, e(Bt,{onClick:p.fechar}, "Fechar")));
  // Ver e Baixar usam a MESMA página do link público (18/11/2026): o que se vê aqui é o que o fornecedor vê
  var abrir = function(){ if(!link) return aviso(c, "O link ainda está sendo gerado. Tente de novo.", "alerta"); window.open(link, "_blank", "noopener"); };
  var baixar = function(){
    if(!link) return aviso(c, "O link ainda está sendo gerado. Tente de novo.", "alerta");
    fetch(link).then(function(r){ if(!r.ok) throw new Error(); return r.text(); }).then(function(h){ var u = URL.createObjectURL(new Blob([h],{type:"text/html"})), a = document.createElement("a"); a.href = u; a.download = nomeArquivoExtrato(pf, chave); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 1500); },
      function(){ aviso(c, "Não consegui baixar a página do acerto. Tente de novo.", "alerta"); });
  };
  return e(Modal,{t:"Enviar acerto ao fornecedor", fechar:p.fechar,
    sub:e("span",null, (f ? f.nome : "")+" · acerto de ", e("b",null, dbr(parte[1])), " — "+ls.length+" Pix, "+comComp+" com comprovante · ", falta>0.005 ? e("b",{style:{color:COR.red}}, brl(falta)+" ainda em aberto") : e("b",{style:{color:COR.green}}, "quitado"))},
    escopo,
    falta>0.005 && e("div",{className:"flex items-start gap-2 rounded-xl border border-[#3B82F6]/50 bg-[#3B82F6]/10 px-4 py-2.5 text-[13px] font-medium"}, e(Ph,{n:"warning", s:18}), "Este acerto ainda não está quitado — o fornecedor verá os Pix já enviados e o saldo em aberto."),
    e(Campo,{rot:"Link de conferência (somente leitura)"},
      e("div",{className:"flex gap-2"}, e("input",{readOnly:true, value:link || (lk.erro ? "Não consegui gerar o link: "+lk.erro : "Gerando o link…"), "aria-label":"Link de conferência", className:INPUT+" h-8! min-w-0 flex-1 text-[13px]!", onFocus:function(ev){ ev.target.select(); }}),
        e(Bt,{ic:"copy", onClick:function(){ copiar(link).then(function(){ aviso(c, "Link copiado"); }); }}, "Copiar"))),
    e("div",{className:"flex flex-wrap gap-2"},
      e(Bt,{ic:"eye", onClick:abrir}, "Ver como o fornecedor vê"), e(Bt,{ic:"download-simple", onClick:baixar}, "Baixar HTML"),
      e(Bt,{ic:"chat-circle-dots", onClick:function(){ setMsg(msgWhatsApp(pf, chave, link)); }}, "Gerar mensagem"),
      msg && e(Bt,{tipo:"ok", ic:"copy", onClick:function(){ copiar(msg).then(function(){ aviso(c, "Mensagem copiada"); }); }}, "Copiar mensagem")),
    msg && e("textarea",{rows:10, value:msg, "aria-label":"Mensagem de WhatsApp", className:INPUT+" h-auto! py-2 text-[13px]", onChange:function(ev){ setMsg(ev.target.value); }}),
    e("p",{className:"text-[11px] text-muted-foreground"}, "A página mostra só o fechamento desta data — total do período, cada Pix e os comprovantes. Não dá acesso a nenhuma outra informação do sistema."),
    e("div",{className:"flex justify-end"}, e(Bt,{onClick:p.fechar}, "Fechar")));
}


// ───────────── consolidado do mês: só sai quando TODOS os pagamentos estão fechados ─────────────
function Consolidado(p){
  var cart = p.cart, st = useState(false), copiado = st[0], fechado = cart.grupos.length>0 && cart.falta<=0.005;
  var linhas = cart.grupos.map(function(g){ return {id:String(g.f.id), nome:g.f.nome, total:g.total, pago:g.pago, falta:g.aberto}; });
  var texto = "Consolidado de pagamentos · "+mesLabel(p.mes+"-01")+"\n"+linhas.map(function(l){ return l.nome+": pago "+brl(l.pago)+" de "+brl(l.total); }).join("\n")+"\nTotal pago: "+brl(cart.pago)+" de "+brl(cart.total);
  var copiarTxt = function(){ try { navigator.clipboard.writeText(texto); } catch(x){} st[1](true); setTimeout(function(){ st[1](false); }, 1800); };
  if(!fechado) return null;   // sem aviso enquanto faltar pagamento (Marcus, 20/11/2026): o consolidado só aparece quando tudo estiver fechado
  var cols = [{k:"nome", t:"Fornecedor"}, {k:"total", t:"A pagar", fmt:brl}, {k:"pago", t:"Pago", fmt:brl, cor:function(){ return "text-success"; }}, {k:"falta", t:"Falta", fmt:brl, cor:function(){ return "text-success"; }}];
  return e(BlocoPainel,{titulo:"Consolidado do mês · "+mesLabel(p.mes+"-01"), compacto:true, cls:COMPACTA, dir:"Fechado", acao:e("button",{type:"button", className:"h-[18px] rounded border border-white/25 bg-white/10 px-2 text-[11px] font-medium hover:bg-white/20", onClick:copiarTxt}, copiado ? "Copiado ✓" : "Copiar consolidado")},
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, totalRodape:function(){ return ["Total do mês", brl(cart.total), brl(cart.pago), brl(cart.falta)]; }, vazio:"Nada a consolidar."}));
}

// ───────────── a tela ─────────────
var COMP_TENTADOS = {};   // id do Pix → já tentou subir o comprovante nesta sessão
function AbaPfLanc(){
  var c = usePf(), pf = c.pf, mm = useMesLanc(), mes = mm[0], setMes = mm[1];
  var ssel = useState(""), sel = ssel[0], setSel = ssel[1];
  var sl = useState(null), modalLanc = sl[0], setModalLanc = sl[1], ss = useState(null), modalAcerto = ss[0], setModalAcerto = ss[1];
  var cart = cartoesLancamento(pf, mes), meses = mesesComLanc(pf, mes);
  var sEsc = useState(false), esc = sEsc[0];
  var lancar = function(k){ sEsc[1](false); setModalLanc(k); };
  var lancarFaixa = function(k){ sEsc[1](true); setModalLanc(k || "novo"); };   // janela completa: escolhe fornecedor e data
  var fecharLanc = function(k){ setModalLanc(null); if(k){ setSel(k); var jj = janelaPorChave(pf, k); if(jj && jj.mes!==mes) setMes(jj.mes); } };   // depois de lançar, a data abre embaixo com os Pix
  var enviar = function(k){ setModalAcerto(k); };   // o link é pedido ao servidor dentro da janela (18/11/2026)
  // comprovantes antigos guardados SÓ neste navegador sobem para o servidor (18/11/2026), um por vez, uma vez por sessão: o link do fornecedor passa a mostrá-los
  useEffect(function(){
    if(!c.edita) return;
    var fila = pf.lancamentos.filter(function(l){ return l.arqId && !l.arqKey && !COMP_TENTADOS[l.id]; }); if(!fila.length) return;
    var feitos = [], p = Promise.resolve();
    fila.forEach(function(l){ COMP_TENTADOS[l.id] = true; p = p.then(function(){
      return obterArquivo(l.arqId).then(function(blob){
        if(!blob) return null;
        var arq = new File([blob], l.arqNome || "comprovante", {type:blob.type || l.arqTipo || ""});
        return lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ feitos.push({id:l.id, arqKey:sv.key}); });
      }).catch(function(){ return null; });
    }); });
    p.then(function(){ if(feitos.length) op(c, "lanc_comp_srv", {itens:feitos}); });
  }, [pf.lancamentos.length]);   // eslint-disable-line react-hooks/exhaustive-deps
  // comprovante que a funcionária anexou no ATENDIMENTO INTERNO (s.lancFin) passa sozinho para o Pix igual daqui (Marcus, 20/11/2026): mesma revendedora, mesmo valor, data até 3 dias; só liga quando o par é único (regra da Contas a receber)
  useEffect(function(){
    if(!c.edita) return;
    var tits = pf.lancamentos.filter(function(l){ return !l.arqKey && !l.arqId && !l.arqNome && !l.auto && !COMP_TENTADOS["a"+l.id]; }).map(function(l){ return {id:l.id, rev:l.revendedora, valor:Number(l.valor), d:l.data, forma:"pix"}; });
    if(!tits.length || !(c.s.lancFin || []).length) return;
    var mapa = comprovantesDosRecebidos(tits, c.s.lancFin).mapa, ids = Object.keys(mapa); if(!ids.length) return;
    var p = Promise.resolve();
    ids.forEach(function(id){ COMP_TENTADOS["a"+id] = true; p = p.then(function(){
      var m = mapa[id], tipo = (/^data:([^;]+);/.exec(m.url) || [])[1] || "image/jpeg";
      return fetch(m.url).then(function(rs){ return rs.blob(); }).then(function(blob){ var arq = new File([blob], m.nome || "comprovante", {type:tipo});
        return lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ op(c, "lanc_comp", {id:Number(id), arqNome:arq.name, arqTipo:tipo, arqKey:sv.key}); }); }).catch(function(){ return null; });
    }); });
  }, [pf.lancamentos.length, (c.s.lancFin || []).length]);   // eslint-disable-line react-hooks/exhaustive-deps

  // uma linha por data de pagamento de cada fornecedor, as em aberto primeiro
  var linhas = [];
  cart.grupos.forEach(function(g){ g.cards.forEach(function(cd){ linhas.push({id:cd.chave, g:g, cd:cd, tipo:g.f.tipoNeg || (g.f.tipo==="prestador" ? "Prestador" : "—"), forn:nomeJanela(g.f.nome, g.js, cd.j), pag:dbr(cd.limite), fecha:dbr(cd.fim),   // fornecedor com o período junto, igual ao Resumo e ao Direcionar (Marcus, 21/11/2026)
    sit:cd.aberto<=0.005 ? "Quitado" : cd.dias<0 ? "Vencido" : "Aberto", conf:cd.aguardando>0 ? cd.aguardando+" a conferir" : "—", total:cd.total, pago:cd.pago, falta:cd.aberto,
    and:Math.round(cd.pct)+"%", pix:cd.lancs.length, aviso:avisosDe(cd).join(" · ") || "—"}); }); });
  // cada fornecedor fica JUNTO (Pontual: 1 a 10, 11 a 20, 21 ao fim, sempre em ordem de data); quem tem saldo em aberto vem primeiro (Marcus, 20/11/2026)
  var ORDEM_TIPO = ["Banho", "Bruto", "Material gráfico", "Sistema", "Tintas", "Prestador"], rk = function(t){ var i = ORDEM_TIPO.indexOf(t); return i<0 ? 99 : i; };   // por tipo: banho, bruto e os outros em seguida (Marcus, 20/11/2026)
  linhas.sort(function(a, b){ return rk(a.tipo)-rk(b.tipo) || String(a.forn).localeCompare(String(b.forn)) || String(a.cd.limite).localeCompare(String(b.cd.limite)); });
  var abertas = linhas.filter(function(x){ return x.cd.aberto>0.005; }).length;
  var corSit = function(l){ return l.sit==="Vencido" ? "text-destructive" : ""; };   // Aberto e Quitado na mesma cor; só Vencido em vermelho
  var cols = [{k:"tipo", t:"Tipo"}, {k:"forn", t:"Fornecedor"}, {k:"fecha", t:"Fecha"}, {k:"sit", t:"Situação", cor:corSit},
    {k:"conf", t:"Conferência", cor:function(l){ return l.cd.aguardando>0 ? "text-warning" : ""; }},
    {k:"total", t:"A pagar", fmt:brl}, {k:"pago", t:"Pago", fmt:brl, cor:function(l){ return l.pago>0 ? "text-success" : ""; }},
    {k:"falta", t:"Falta", fmt:brl, cor:function(l){ return l.falta>0.005 ? "text-destructive" : "text-success"; }},
    {k:"aviso", t:"Avisos", render:function(v){ return e("span",{className:"block min-w-[9rem] max-w-[22rem] whitespace-nowrap"}, v); }}];
  var soma = function(ls, k){ return ls.reduce(function(t, x){ return t+Number(x[k]||0); }, 0); };
  var rodape = function(ls){ return ["Total", "", String(ls.length)+" datas", "", "", brl(soma(ls, "total")), brl(soma(ls, "pago")), brl(soma(ls, "falta")), ""]; };
  // bloco de cima = filtro PRÓPRIO (não mexe no "Pagamentos do mês"): abre com o mês atual e os 6 seguintes; a coluna Mês deixa marcar os outros (Marcus, 20/11/2026)
  var mAtual = mesAtual(), linhasResumo = [], padraoMeses = new Set();
  for(var mi = 0; mi<24; mi++){ var mk = mesMais("2026-01", mi), ct = mk===mes ? cart : cartoesLancamento(pf, mk), ab = 0, rot = mesLabel(mk+"-01")+(mk===mAtual ? " · mês atual" : "");
    ct.grupos.forEach(function(g){ g.cards.forEach(function(x){ if(x.aberto>0.005) ab++; }); });
    var dist = (Number(mk.slice(0,4))-Number(mAtual.slice(0,4)))*12 + Number(mk.slice(5))-Number(mAtual.slice(5));
    linhasResumo.push({id:mk, ano:mk.slice(0,4), mes:rot, total:ct.total, pago:ct.pago, falta:ct.falta, abertas:ab}); if(dist>=0 && dist<=6) padraoMeses.add(rot); }
  var filtroTopo = {mes:padraoMeses};
  var colsResumo = [{k:"mes", t:"Mês"}, {k:"total", t:"A pagar no mês", fmt:brl}, {k:"pago", t:"Pago", fmt:brl, cor:function(){ return "text-success"; }}, {k:"falta", t:"Falta", fmt:brl, cor:function(l){ return l.falta>0.005 ? "text-destructive" : "text-success"; }}, {k:"abertas", t:"Datas em aberto"}];
  var rodapeAno = function(ls){ return ["Total", brl(ls.reduce(function(t, x){ return t+x.total; }, 0)), brl(ls.reduce(function(t, x){ return t+x.pago; }, 0)), brl(ls.reduce(function(t, x){ return t+x.falta; }, 0)), String(ls.reduce(function(t, x){ return t+x.abertas; }, 0))]; };
  // a data escolhida na tabela
  var cdSel = null, gSel = null; cart.grupos.forEach(function(g){ g.cards.forEach(function(cd){ if(cd.chave===sel){ cdSel = cd; gSel = g; } }); });
  var pedidos = cdSel && porPedidoAtivo(pf, parseInt(cdSel.chave.split("|")[0]));
  var BARRA = "flex flex-wrap items-center justify-between gap-2 border-x-[4px] border-y border-[#5b74ad] bg-[#1b2a4a] px-2 py-0.5";
  return e("div",{className:PADRAO_BLOCOS+" -mx-4 -mb-4 -mt-4 md:-mx-6 md:-mb-6 md:-mt-6 flex flex-col gap-0 [&_section]:!rounded-none [&_section]:!border-x-[4px] [&_section]:!border-y-0 [&>*_section]:!mt-[3px] [&>*_section]:!shadow-[0_-3px_0_0_#fff] [&>section]:!mt-[3px] [&>section]:!shadow-[0_-3px_0_0_#fff] [&>*:first-child_section]:!mt-0 [&>*:first-child_section]:!shadow-none"},
    e("div",{title:"Pix (sem NF) do mês, por fornecedor e data de acerto: o que se deve, o que já foi pago e o que falta."},
      e(BlocoPainel,{titulo:"Pagamentos a fornecedores", compacto:true, cls:COMPACTA},
        e(TabelaPlanilha,{cols:colsResumo, linhas:linhasResumo, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, filtroInicial:filtroTopo, totalRodape:rodapeAno, vazio:"Nada neste filtro."}))),
    [
      e(BlocoPainel,{key:"lista", titulo:"Pagamentos do mês", compacto:true, cls:COMPACTA, acao:e("span",{className:"inline-flex items-center gap-2"}, e(CampoMini,{valor:mes, aoMudar:setMes, rotulo:"Mês", ops:meses.map(function(m){ return [m, mesLabel(m+"-01")]; })}),
          c.edita && e(BotaoMini,{principal:true, title:"Lançar um Pix: escolhe o fornecedor e a data de pagamento", onClick:function(){ lancarFaixa(); }}, "+ Lançar pagamento"))},   // Lançar voltou (Lucas, 23/11/2026)   // o mês fica no canto esquerdo da barra do bloco, em cima da coluna Tipo (Marcus, 21/11/2026)
        !cart.grupos.length ? e("p",{className:"px-3 py-2 text-center text-[11px]"}, "Nenhum pagamento sem NF (Pix) em "+mesLabel(mes+"-01")+".") : e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, totalRodape:rodape, vazio:"Nenhum pagamento.",
          aoClicar:function(l){ setSel(l.id); setTimeout(function(){ var el = document.getElementById("pag-detalhe"); if(el && el.scrollIntoView) el.scrollIntoView({behavior:"smooth", block:"nearest"}); }, 60); },
          linhaCls:function(l){ return l.id===sel ? "!bg-[#26385c]" : ""; }})),
      e("div",{id:"pag-detalhe", key:"detalhe"},
        cdSel ? e(BlocoPainel,{titulo:gSel.f.nome+" · "+dbr(cdSel.limite)+" · "+gSel.f.cat+" · "+gSel.cicloTxt, compacto:true, cls:DETALHE},
          e("div",{className:"w-0 min-w-full overflow-x-auto", "data-sem-arrastar":""},
            e(BarraTabela,null,
              c.edita && e(CelulaBarra,{rotulo:"Pix"}, e(BotaoMini,{principal:true, title:"Lançar um Pix nesta data de pagamento", onClick:function(){ lancar(cdSel.chave); }}, "+ Lançar pagamento")),   // Lançar voltou (Lucas, 23/11/2026)
              e(CelulaBarra,{rotulo:"Acerto"}, e(BotaoMini,{onClick:function(){ enviar(cdSel.chave); }}, cdSel.aberto<=0.005 ? "Enviar acerto ao fornecedor" : "Link do fornecedor")),
              e(CelulaBarra,{rotulo:"Ciclo"}, e(BotaoMini,{title:"Configurar o ciclo deste fornecedor", onClick:function(){ c.d({type:"ABA", aba:"pfforn"}); }}, "Ciclo do fornecedor"))),
            e(ListaPagamentos,{cd:cdSel, c:c}),
            pedidos && e("div",{className:"p-2"}, e(BlocoPedidos,{c:c, chave:cdSel.chave})))) :
        e("p",{className:"rounded-lg border border-border bg-[#0f1729] px-3 py-1.5 text-center text-[11px]"}, "Escolha uma linha na tabela para ver os Pix lançados dela aqui.")),
      e(Consolidado,{key:"consolidado", cart:cart, mes:mes})],
    modalLanc && e(ModalLancar,{key:modalLanc+(esc ? "|e" : ""), c:c, chave:modalLanc==="novo" ? "" : modalLanc, escolher:esc, fechar:fecharLanc}),
    modalAcerto && e(ModalAcerto,{c:c, chave:modalAcerto, fechar:function(){ setModalAcerto(null); }}));
}

export { AbaPfLanc, BotaoMini, COMPACTA };
