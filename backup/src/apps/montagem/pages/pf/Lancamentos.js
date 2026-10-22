// Sorelly Admin · montagem — pages/pf/Lancamentos.js
// Lançamento de pagamentos (Pagamentos a Fornecedores): Pix (sem NF) do mês, um bloco por fornecedor e um card por data de pagamento (janela).
// Cada card tem a lista dos Pix lançados (com busca, conferência e estorno), a janela "Lançar pagamento" e a janela "Enviar acerto ao fornecedor".
// Contas e regras ficam em domain/pf.js; aqui só o desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { CAMPOS_BUSCA, cartoesLancamento, filtrarLancamentos, hojeIso, janelaPorChave, lancExcedente, mesAtual, mesLabel, mesMais, mesesComLanc, pagoJanela } from "@/apps/montagem/domain/pf";
import { apagarArquivo, baixarArquivo, salvarArquivo } from "@/apps/montagem/lib/arquivos";
import { copiar, linkDoAcerto, montarExtrato, msgWhatsApp, nomeArquivoExtrato, useMesLanc } from "@/apps/montagem/pages/pf/extrato";
import { Dinheiro, Faixa, Indicador, LINHA, Mosaico, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { COR, Campo, Chip, Modal, Sel, Txt, aviso, brl, dbr, mut, op, usePf } from "@/apps/montagem/pages/pf/ui";
import { PageHead } from "@/apps/montagem/ui/page";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

// botão pequeno com texto (tipos: normal, forte, ok, conf, perigo)
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#3B82F6] text-black hover:bg-[#FBBF24]", ok:"bg-[#22C55E]/25 text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35", conf:"bg-[#3B82F6]/25 text-[#93C5FD] ring-1 ring-[#3B82F6]/50 hover:bg-[#3B82F6]/35", perigo:"bg-destructive/20 text-destructive hover:bg-destructive/30"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition "+BT[p.tipo||"normal"]+(p.disabled ? " opacity-40" : "")+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:14}), p.children); }
function Barra(p){ return e("div",{className:"h-2 w-full overflow-hidden rounded-full bg-black/30"}, e("i",{className:"block h-full rounded-full", style:{width:Math.min(p.pct,100)+"%", background:p.pct>=99.5 ? COR.green : COR.orange}})); }
// número pequeno com rótulo (A pagar / Pago / Falta)
function Num(p){ return e("div",{className:"flex flex-col items-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.1em] text-muted-foreground"}, p.t), p.children); }
var ANEL = {late:"ring-2 ring-destructive/70", soon:"ring-2 ring-[#3B82F6]/70", "":"ring-1 ring-white/10"};

// ───────────── lista de pagamentos lançados de um card (com filtro) ─────────────
function FiltroLanc(p){
  var f = p.f, set = function(k, v){ var n = Object.assign({}, f); n[k] = v; p.set(n); };
  var datas = p.lancs.map(function(l){ return l.data; }).sort(), campo = CAMPOS_BUSCA.find(function(x){ return x[0]===(f.campo||""); }) || CAMPOS_BUSCA[0];
  var ativo = f.q || f.d1 || f.d2 || f.st;
  return e("div",{className:"flex flex-col gap-2 rounded-lg bg-black/25 p-2.5"},
    e("div",{className:"flex gap-2"},
      e("input",{type:"search", value:f.q||"", placeholder:"🔍 "+campo[2], "aria-label":"Buscar pagamentos", className:INPUT+" h-9! min-w-0 flex-1 text-[13px]!", onChange:function(ev){ set("q", ev.target.value); }}),
      e("select",{value:f.campo||"", title:"Onde buscar", className:INPUT+" h-9! cursor-pointer text-[13px]!", onChange:function(ev){ set("campo", ev.target.value); }}, CAMPOS_BUSCA.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); }))),
    e("div",{className:"flex flex-wrap items-center gap-2 text-[12px] font-semibold"},
      e("label",{className:"flex items-center gap-1"}, "De", e("input",{type:"date", value:f.d1||"", min:datas[0], max:datas[datas.length-1], className:INPUT+" h-9! w-36 text-[13px]!", onChange:function(ev){ set("d1", ev.target.value); }})),
      e("label",{className:"flex items-center gap-1"}, "Até", e("input",{type:"date", value:f.d2||"", min:datas[0], max:datas[datas.length-1], className:INPUT+" h-9! w-36 text-[13px]!", onChange:function(ev){ set("d2", ev.target.value); }})),
      e("select",{value:f.st||"", className:INPUT+" h-9! cursor-pointer text-[13px]!", onChange:function(ev){ set("st", ev.target.value); }}, [["","Todos"],["0","Aguardando"],["1","Conferidos"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      e(Bt,{onClick:function(){ p.set({}); }, ic:"x"}, "Limpar")),
    ativo && e("div",{className:"text-[12.5px]"}, ((f.d1||f.d2) ? (f.d1 ? dbr(f.d1) : "início")+" a "+(f.d2 ? dbr(f.d2) : "fim")+" · " : "")+p.res.n+" de "+p.res.total+" pagamento(s) · total ", e("b",null, brl(p.res.soma))));
}

function ItemLanc(p){
  var l = p.l, c = p.c;
  var comp = l.arqId
    ? e("button",{type:"button", title:l.arqNome, onClick:function(){ baixarArquivo(l.arqId, l.arqNome||"comprovante").catch(function(){ aviso(c, "Não achei o arquivo neste computador.", "alerta"); }); }, className:"inline-flex items-center gap-1 rounded-full bg-[#06B6D4]/20 px-2.5 py-0.5 text-[11.5px] font-bold text-[#22D3EE] hover:bg-[#06B6D4]/30"}, e(Ph,{n:"paperclip", s:13}), "comprovante")
    : String(l.arqData||"").indexOf("data:")===0
      ? e("a",{href:l.arqData, target:"_blank", rel:"noreferrer", download:l.arqNome, title:l.arqNome, className:"inline-flex items-center gap-1 rounded-full bg-[#06B6D4]/20 px-2.5 py-0.5 text-[11.5px] font-bold text-[#22D3EE]"}, e(Ph,{n:"paperclip", s:13}), "comprovante")
      : l.arqNome ? e("span",{className:"inline-flex items-center gap-1 text-[11.5px]", title:l.arqNome}, e(Ph,{n:"paperclip", s:13}), "comprovante anexado")
      : e("span",{className:"text-[11.5px] text-muted-foreground"}, "sem comprovante");
  var conf = l.conferido ? e(Chip,{cor:"green"}, "✓ Conferido "+dbr(l.conferidoEm)) : e(Chip,{cor:"orange"}, "⏳ Aguardando conferência");
  return e("div",{className:"flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 "+(l.conferido ? "bg-[#22C55E]/10" : "bg-black/25")},
    e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]"}, e("b",null, dbr(l.data)), e("span",{className:"text-muted-foreground"}, l.revendedora||"—"), e("span",{className:"text-muted-foreground"}, l.conta||"—"), comp, conf),
    e("div",{className:"flex items-center gap-2"}, e("b",{className:MONO+" text-[14px]", style:{color:COR.green}}, brl(l.valor)),
      e(Bt,{tipo:l.conferido ? "normal" : "conf", disabled:!c.edita, titulo:c.edita ? "" : "Só financeiro e diretoria", onClick:function(){
        if(l.conferido && !window.confirm("Desfazer a conferência deste pagamento de "+brl(l.valor)+"?")) return;
        op(c, "lanc_conferido", {id:l.id}); }}, l.conferido ? "Desfazer conferência" : "Conferir"),
      e(Bt,{tipo:"perigo", disabled:!c.edita, titulo:c.edita ? "" : "Só financeiro e diretoria", onClick:function(){
        if(!window.confirm("Estornar este pagamento de "+brl(l.valor)+"?")) return;
        if(l.arqId) apagarArquivo(l.arqId);
        op(c, "lanc_del", {id:l.id}); }}, "Estornar")));
}

function ListaPagamentos(p){
  var cd = p.cd, c = p.c, f = p.f, res = filtrarLancamentos(cd.lancs, f), ativo = f.q || f.d1 || f.d2 || f.st;
  return e("div",{className:"mt-2 flex flex-col gap-2 rounded-xl bg-black/20 p-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"}, e("b",{className:"text-[12px] uppercase tracking-[.1em]"}, "Pagamentos lançados"),
      cd.aguardando>0 && e(Chip,{cor:"orange"}, cd.aguardando+" aguardando conferência")),
    cd.lancs.length>0 && e(FiltroLanc,{f:f, set:p.setF, lancs:cd.lancs, res:res}),
    cd.mq>0.005 && e("div",{className:"flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#06B6D4]/10 px-3 py-2"},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]"}, e("b",null, "desconto"), e("span",{className:"text-muted-foreground"}, "Maquininha Banho · "+cd.mqRef), e("span",{className:"text-[11.5px] text-muted-foreground"}, "abatido direto na conta")),
      e("div",{className:"flex items-center gap-2"}, e("b",{className:MONO+" text-[14px]", style:{color:COR.green}}, brl(cd.mq)), e(Bt,{onClick:function(){ c.d({type:"ABA", aba:"pfmaq"}); }}, "Ajustar"))),
    !cd.lancs.length ? (cd.mq>0.005 ? null : e("p",{className:"py-2 text-center text-[13px] text-muted-foreground"}, "Nenhum pagamento lançado nesta data.")) :
      res.lista.length ? res.lista.map(function(l){ return e(ItemLanc,{key:l.id, l:l, c:c}); }) :
      ativo && e("p",{className:"py-2 text-center text-[13px] text-muted-foreground"}, "Nenhum pagamento encontrado com esse filtro."));
}

// ───────────── uma data de pagamento = uma linha da tabela do fornecedor (a lista de pagamentos abre embaixo dela) ─────────────
function LinhaData(p){
  var cd = p.cd, c = p.c, aberto = p.abertos[cd.chave], ir = function(aba){ c.d({type:"ABA", aba:aba}); }, pode = c.edita;
  var corLinha = cd.situacao==="late" ? "bg-destructive/10" : cd.situacao==="soon" ? "bg-[#3B82F6]/10" : "";
  var linha = e("tr",{key:cd.chave, className:LINHA+" "+corLinha},
    p.forn && e(Td,{forte:true, className:"text-left"}, p.forn),
    e(Td,null, e("b",null, dbr(cd.limite)), e("div",{className:"text-[11px] font-normal leading-tight text-muted-foreground"}, "fecha "+dbr(cd.fim))),
    e(Td,{className:"whitespace-normal!"}, e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, e(Chip,{s:cd.status}), e(Chip,{s:cd.prazo}), cd.aguardando>0 && e(Chip,{cor:"orange"}, cd.aguardando+" a conferir"))),
    e(Td,{dinheiro:true, forte:true}, e("button",{type:"button", title:"Ver o detalhe das parcelas nas Negociações", onClick:function(){ ir("pfneg"); }, className:"hover:underline"}, brl(cd.total))),
    e(Td,{dinheiro:true, cor:"ok"}, brl(cd.pago)),
    e(Td,{dinheiro:true, forte:true, cor:cd.aberto>0.005 ? "ruim" : "ok"}, brl(cd.aberto)),
    e(Td,{className:"hidden w-24 md:table-cell"}, e(Barra,{pct:cd.pct})),
    e(Td,null, e("div",{className:"flex items-center justify-center gap-1"},
      e(Bt,{tipo:"forte", ic:"plus", disabled:!pode, titulo:pode ? "Lançar pagamento" : "Só financeiro e diretoria", onClick:function(){ p.lancar(cd.chave); }}, "Lançar"),
      e(Bt,{tipo:cd.aberto<=0.005 ? "ok" : "normal", ic:"link", titulo:cd.aberto<=0.005 ? "Enviar acerto ao fornecedor" : "Link do fornecedor", onClick:function(){ p.enviar(cd.chave); }}),
      e(Bt,{ic:aberto ? "caret-up" : "caret-down", titulo:aberto ? "Ocultar pagamentos" : "Ver pagamentos lançados", onClick:function(){ p.alt(cd.chave); }}, String(cd.lancs.length)))));
  var extra = [];
  if(cd.mq>0.005 && !aberto) extra.push(e("tr",{key:cd.chave+"mq"}, e("td",{colSpan:p.forn ? 8 : 7, className:"px-2 pb-1.5 text-center"},
    e("button",{type:"button", title:"Ver na aba Maquininha Banho", onClick:function(){ ir("pfmaq"); }, className:"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] hover:brightness-125 "+(cd.excesso>0.005 ? "bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/50" : "bg-[#06B6D4]/10 ring-1 ring-[#06B6D4]/40")},
      "💳 desconto da maquininha ", e("b",null, brl(cd.mq)), e("span",{className:"text-muted-foreground"}, cd.mqRef+(cd.excesso>0.005 ? " · sobra "+brl(cd.excesso)+" — clique para dividir" : ""))))));
  if(aberto) extra.push(e("tr",{key:cd.chave+"ls"}, e("td",{colSpan:p.forn ? 8 : 7, className:"px-2 pb-2"}, e(ListaPagamentos,{cd:cd, c:c, f:p.filtros[cd.chave]||{}, setF:function(n){ p.setFiltro(cd.chave, n); }}))));
  return [linha].concat(extra);
}

// ───────────── bloco de um fornecedor: 3 indicadores centralizados + tabela de datas ─────────────
function BlocoForn(p){
  var g = p.g, f = g.f, c = p.c, ir = function(aba){ c.d({type:"ABA", aba:aba}); };
  var linhas = [].concat.apply([], g.cards.map(function(cd){ return LinhaData({cd:cd, c:c, abertos:p.abertos, filtros:p.filtros, setFiltro:p.setFiltro, alt:p.alt, lancar:p.lancar, enviar:p.enviar}); }));
  return e(BlocoBarra,{t:f.nome, sub:f.cat+" · "+g.cicloTxt, dir:g.aberto>0.005 ? brl(g.aberto)+" falta" : "✓ quitado", cor:"azul", compacto:true},
    e("div",{className:"flex flex-col gap-2 p-2"},
      // com uma data só, a própria linha já mostra os valores; os 3 indicadores só entram quando há mais de uma data
      g.cards.length>1 && e("div",{className:"flex items-stretch gap-2"},
        e(Faixa,{n:3, className:"flex-1"}, e(Indicador,{t:"A pagar", v:brl(g.total), cor:"total"}), e(Indicador,{t:"Pago", v:brl(g.pago), cor:"ok"}), e(Indicador,{t:"Falta", v:brl(g.aberto), cor:g.aberto>0.005 ? "ruim" : "ok"})),
        e(Bt,{ic:"gear", titulo:"Configurar o ciclo deste fornecedor", className:"self-center", onClick:function(){ ir("pfforn"); }}, "Ciclo")),
      e(Tab,{cols:["Pagamento","Situação","A pagar","Pago","Falta",e("span",{key:"b",className:"hidden md:inline"},"Andamento"),""]}, linhas)));
}

// ───────────── janela: Lançar pagamento ─────────────
function ModalLancar(p){
  var c = p.c, chave = p.chave, j = janelaPorChave(c.pf, chave), f = c.pf.fornecedores.find(function(x){ return x.id===parseInt(chave.split("|")[0]); });
  var aberto = j ? Math.max(0, j.total-pagoJanela(c.pf, chave)) : 0;
  var st = useState({data:hojeIso(), rev:"", valor:aberto>0.005 ? aberto.toFixed(2) : "", conta:"", arq:null}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var salvar = function(){
    var valor = parseFloat(v.valor);
    if(!valor || valor<=0) return aviso(c, "Informe o valor pago.", "alerta");
    if(!v.data) return aviso(c, "Informe a data do pagamento.", "alerta");
    var rev = v.rev.trim(); if(!rev) return aviso(c, "Informe o nome da revendedora.", "alerta");
    var ex = lancExcedente(c.pf, chave, valor);
    if(ex.passa && !window.confirm("O valor ultrapassa o que falta nesta data (saldo de "+brl(ex.aberto)+"). Lançar mesmo assim?")) return;
    var arq = v.arq, base = {chave:chave, data:v.data, revendedora:rev, valor:valor, conta:v.conta.trim(), forcar:true};
    var gravar = function(arqId){
      op(c, "lanc_add", Object.assign({}, base, arq ? {arqNome:arq.name, arqTipo:arq.type, arqData:hojeIso()} : {}));
      // guarda o id do arquivo no lançamento recém-criado
      if(arqId) mut(c, function(pf){ var ls = pf.lancamentos.filter(function(l){ return l.chave===chave && !l.arqId && l.arqNome===arq.name; }); if(ls.length) ls[ls.length-1].arqId = arqId; return "Pagamento lançado — "+brl(valor)+" para "+rev+" · comprovante anexado"; });
      p.fechar(chave);
    };
    if(!arq) return gravar("");
    var id = "pfc-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
    salvarArquivo(id, arq).then(function(){ gravar(id); }, function(){ aviso(c, "Não foi possível guardar o comprovante. O pagamento será lançado sem anexo.", "alerta"); arq = null; gravar(""); });
  };
  return e(Modal,{t:"Lançar pagamento", fechar:function(){ p.fechar(null); },
    sub:e("span",null, (f ? f.nome : "")+" · pagamento de ", e("b",null, dbr(chave.split("|")[1])), " · falta ", e("b",{style:{color:COR.red}}, brl(aberto)), " de "+brl(j ? j.total : 0))},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Data"}, e(Txt,{type:"date", value:v.data, label:"Data", onChange:function(x){ set("data", x); }})),
      e(Campo,{rot:"Nome da revendedora"}, e(Txt,{value:v.rev, label:"Nome da revendedora", ph:"Ex.: Ana Paula de Lima", onChange:function(x){ set("rev", x); }})),
      e(Campo,{rot:"Valor (R$)"}, e(Dinheiro,{out:"ponto", value:v.valor, label:"Valor", onChange:function(x){ set("valor", x); }})),
      e(Campo,{rot:"Conta"}, e(Txt,{value:v.conta, label:"Conta", ph:"Ex.: Pix - Bradesco Prime", onChange:function(x){ set("conta", x); }}))),
    e(Campo,{rot:"Comprovante de pagamento"},
      e("div",{className:"flex flex-wrap items-center gap-3 rounded-lg bg-black/25 px-3 py-2"},
        e("label",{className:"inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-[12.5px] font-bold hover:bg-white/15"}, e(Ph,{n:"paperclip", s:14}), "Selecionar arquivo",
          e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ set("arq", ev.target.files && ev.target.files[0] ? ev.target.files[0] : null); }})),
        e("span",{className:"text-[12.5px] "+(v.arq ? "" : "text-muted-foreground")}, v.arq ? v.arq.name : "Nenhum arquivo selecionado"))),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Bt,{onClick:function(){ p.fechar(null); }}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:salvar}, "Lançar pagamento")));
}

// ───────────── janela: Enviar acerto ao fornecedor ─────────────
function ModalAcerto(p){
  var c = p.c, pf = c.pf, chave = p.chave, parte = chave.split("|"), f = pf.fornecedores.find(function(x){ return x.id===parseInt(parte[0]); }), j = janelaPorChave(pf, chave);
  var cd = cartoesLancamento(pf, j ? j.mes : mesAtual()).grupos.reduce(function(a, g){ return a || g.cards.find(function(k){ return k.chave===chave; }); }, null);
  var ms = useState(""), msg = ms[0], setMsg = ms[1];
  var total = j ? j.total : 0, pago = Math.min(pagoJanela(pf, chave), total), falta = total-pago, ls = cd ? cd.lancs : [], comComp = ls.filter(function(l){ return l.arqId || l.arqData; }).length;
  var link = linkDoAcerto(pf, chave);
  var abrir = function(){ var w = window.open("", "_blank"); montarExtrato(pf, chave).then(function(h){ var u = URL.createObjectURL(new Blob([h],{type:"text/html"})); if(w) w.location.href = u; else window.open(u, "_blank"); setTimeout(function(){ URL.revokeObjectURL(u); }, 60000); }); };
  var baixar = function(){ montarExtrato(pf, chave).then(function(h){ var u = URL.createObjectURL(new Blob([h],{type:"text/html"})), a = document.createElement("a"); a.href = u; a.download = nomeArquivoExtrato(pf, chave); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 1500); aviso(c, "Arquivo do acerto baixado"); }); };
  return e(Modal,{t:"Enviar acerto ao fornecedor", fechar:p.fechar,
    sub:e("span",null, (f ? f.nome : "")+" · acerto de ", e("b",null, dbr(parte[1])), " — "+ls.length+" Pix, "+comComp+" com comprovante · ", falta>0.005 ? e("b",{style:{color:COR.red}}, brl(falta)+" ainda em aberto") : e("b",{style:{color:COR.green}}, "quitado"))},
    falta>0.005 && e("div",{className:"flex items-start gap-2 rounded-xl border border-[#3B82F6]/50 bg-[#3B82F6]/10 px-4 py-2.5 text-[13.5px] font-medium"}, e(Ph,{n:"warning", s:18}), "Este acerto ainda não está quitado — o fornecedor verá os Pix já enviados e o saldo em aberto."),
    e(Campo,{rot:"Link de conferência (somente leitura)"},
      e("div",{className:"flex gap-2"}, e("input",{readOnly:true, value:link, "aria-label":"Link de conferência", className:INPUT+" h-10! min-w-0 flex-1", onFocus:function(ev){ ev.target.select(); }}),
        e(Bt,{ic:"copy", onClick:function(){ copiar(link).then(function(){ aviso(c, "Link copiado"); }); }}, "Copiar"))),
    e("div",{className:"flex flex-wrap gap-2"},
      e(Bt,{ic:"eye", onClick:abrir}, "Ver como o fornecedor vê"), e(Bt,{ic:"download-simple", onClick:baixar}, "Baixar HTML"),
      e(Bt,{ic:"chat-circle-dots", onClick:function(){ setMsg(msgWhatsApp(pf, chave)); }}, "Gerar mensagem"),
      msg && e(Bt,{tipo:"ok", ic:"copy", onClick:function(){ copiar(msg).then(function(){ aviso(c, "Mensagem copiada"); }); }}, "Copiar mensagem")),
    msg && e("textarea",{rows:10, value:msg, "aria-label":"Mensagem de WhatsApp", className:INPUT+" h-auto! py-2 text-[13px]", onChange:function(ev){ setMsg(ev.target.value); }}),
    e("p",{className:"text-[12px] text-muted-foreground"}, "A página mostra só o fechamento desta data — total do período, cada Pix e os comprovantes. Não dá acesso a nenhuma outra informação do sistema."),
    e("div",{className:"flex justify-end"}, e(Bt,{onClick:p.fechar}, "Fechar")));
}

// ───────────── lista ÚNICA: uma linha por pagamento (fornecedor + data), um de cada vez, os em aberto primeiro ─────────────
function ListaGeral(p){
  var linhas = [];
  p.cart.grupos.forEach(function(g){ g.cards.forEach(function(cd){ linhas.push({f:g.f, cd:cd}); }); });
  linhas.sort(function(a, b){ var fa = a.cd.aberto>0.005 ? 0 : 1, fb = b.cd.aberto>0.005 ? 0 : 1; return fa-fb || String(a.cd.limite).localeCompare(String(b.cd.limite)) || String(a.f.nome).localeCompare(String(b.f.nome)); });
  var abertas = linhas.filter(function(x){ return x.cd.aberto>0.005; }).length;
  return e(BlocoBarra,{t:"Pagamentos do mês", sub:"Um por vez: lance na linha; ela fecha quando a falta chega a zero", dir:abertas ? abertas+" em aberto" : "✓ todos fechados", cor:"azul", compacto:true},
    e("div",{className:"p-2"}, e(Tab,{cols:["Fornecedor", "Pagamento", "Situação", "A pagar", "Pago", "Falta", e("span",{key:"b", className:"hidden md:inline"}, "Andamento"), ""]},
      [].concat.apply([], linhas.map(function(x){ return LinhaData({cd:x.cd, forn:x.f.nome, c:p.c, abertos:p.abertos, filtros:p.filtros, setFiltro:p.setFiltro, alt:p.alt, lancar:p.lancar, enviar:p.enviar}); })))));
}

// ───────────── consolidado do mês: só sai quando TODOS os pagamentos estão fechados ─────────────
function Consolidado(p){
  var cart = p.cart, st = useState(false), copiado = st[0], fechado = cart.grupos.length>0 && cart.falta<=0.005;
  var restantes = cart.grupos.reduce(function(t, g){ return t+g.cards.filter(function(cd){ return cd.aberto>0.005; }).length; }, 0);
  var linhas = cart.grupos.map(function(g){ return {nome:g.f.nome, total:g.total, pago:g.pago, falta:g.aberto}; });
  var texto = "Consolidado de pagamentos · "+mesLabel(p.mes+"-01")+"\n"+linhas.map(function(l){ return l.nome+": pago "+brl(l.pago)+" de "+brl(l.total); }).join("\n")+"\nTotal pago: "+brl(cart.pago)+" de "+brl(cart.total);
  var copiar = function(){ try { navigator.clipboard.writeText(texto); } catch(x){} st[1](true); setTimeout(function(){ st[1](false); }, 1800); };
  return e(BlocoBarra,{t:"Consolidado do mês", sub:fechado ? "Todos os pagamentos de "+mesLabel(p.mes+"-01")+" estão fechados" : "Sai sozinho quando todos os pagamentos estiverem fechados", dir:fechado ? "✓ fechado" : restantes+" em aberto", cor:fechado ? "verde" : "ouro", compacto:true},
    fechado
      ? e("div",{className:"flex flex-col gap-2 p-2"},
          e(Tab,{cols:["Fornecedor", "A pagar", "Pago", "Falta"]}, linhas.map(function(l){ return e("tr",{key:l.nome, className:LINHA}, e(Td,{forte:true, className:"text-left"}, l.nome), e(Td,{dinheiro:true}, brl(l.total)), e(Td,{dinheiro:true, cor:"ok"}, brl(l.pago)), e(Td,{dinheiro:true, cor:"ok"}, brl(l.falta))); }).concat([e("tr",{key:"t", className:LINHA+" font-bold"}, e(Td,{forte:true, className:"text-left"}, "Total do mês"), e(Td,{dinheiro:true, forte:true}, brl(cart.total)), e(Td,{dinheiro:true, forte:true, cor:"ok"}, brl(cart.pago)), e(Td,{dinheiro:true, forte:true, cor:"ok"}, brl(cart.falta)))])),
          e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"copy", onClick:copiar}, copiado ? "Copiado ✓" : "Copiar consolidado")))
      : e("p",{className:"p-3 text-center text-[13px] text-muted-foreground"}, "Faltam "+restantes+(restantes===1 ? " pagamento" : " pagamentos")+" para fechar o mês ("+brl(cart.falta)+" ainda em aberto)."));
}

// ───────────── a tela ─────────────
function AbaPfLanc(){
  var c = usePf(), pf = c.pf, mm = useMesLanc(), mes = mm[0], setMes = mm[1];
  var sa = useState({}), abertos = sa[0], setAbertos = sa[1], sf = useState({}), filtros = sf[0], setFiltros = sf[1];
  var sl = useState(null), modalLanc = sl[0], setModalLanc = sl[1], ss = useState(null), modalAcerto = ss[0], setModalAcerto = ss[1];
  var cart = cartoesLancamento(pf, mes), meses = mesesComLanc(pf, mes);
  var alt = function(k){ var n = Object.assign({}, abertos); n[k] = !n[k]; setAbertos(n); };
  var setFiltro = function(k, f){ var n = Object.assign({}, filtros); n[k] = f; setFiltros(n); };
  var lancar = function(k){ setModalLanc(k); };
  var fecharLanc = function(k){ setModalLanc(null); if(k){ var n = Object.assign({}, abertos); n[k] = true; setAbertos(n); } };
  var enviar = function(k){ op(c, "token_acerto", {chave:k}); setModalAcerto(k); };
  var bloco = function(g){ return e(BlocoForn,{key:g.f.id, g:g, c:c, abertos:abertos, filtros:filtros, setFiltro:setFiltro, alt:alt, lancar:lancar, enviar:enviar}); };
  return e(Pagina,null,
    e(PageHead,{t:"Lançamento de Pagamentos", sub:"Pix (sem NF) do mês, por fornecedor e data de acerto"},
      e(Bt,{ic:"plus", onClick:function(){ c.d({type:"ABA", aba:"pfforn"}); }}, "Novo fornecedor")),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#3B82F6]/15 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40"},
      e("div",{className:"flex items-center gap-1.5"},
        e("button",{type:"button", title:"Mês anterior", "aria-label":"Mês anterior", onClick:function(){ setMes(mesMais(mes, -1)); }, className:"grid size-9 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, e(Ph,{n:"caret-left", s:16})),
        e(Sel,{value:mes, label:"Mês", className:"w-48", onChange:setMes}, meses.map(function(m){ return e("option",{key:m, value:m}, mesLabel(m+"-01")+(m===mesAtual() ? " · mês atual" : "")); })),
        e("button",{type:"button", title:"Próximo mês", "aria-label":"Próximo mês", onClick:function(){ setMes(mesMais(mes, 1)); }, className:"grid size-9 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, e(Ph,{n:"caret-right", s:16})),
        e(Bt,{onClick:function(){ setMes(mesAtual()); }, className:"h-9"}, "Mês atual")),
      e(Faixa,{n:3, className:"min-w-[18rem] flex-1"}, e(Indicador,{t:"A pagar no mês", v:brl(cart.total), cor:"total"}), e(Indicador,{t:"Pago", v:brl(cart.pago), cor:"ok"}), e(Indicador,{t:"Falta", v:brl(cart.falta), cor:cart.falta>0.005 ? "ruim" : "ok"}))),
    !cart.grupos.length ? e("p",{className:"rounded-xl bg-muted/30 px-4 py-4 text-center text-[14px] text-muted-foreground"}, "Nenhum pagamento sem NF (Pix) em "+mesLabel(mes+"-01")+". Use o seletor acima para ver outro mês.") : e("div",{className:"flex flex-col gap-2.5"},
      e(ListaGeral,{cart:cart, c:c, abertos:abertos, filtros:filtros, setFiltro:setFiltro, alt:alt, lancar:lancar, enviar:enviar}),
      e(Consolidado,{cart:cart, mes:mes})),
    modalLanc && e(ModalLancar,{key:modalLanc, c:c, chave:modalLanc, fechar:fecharLanc}),
    modalAcerto && e(ModalAcerto,{c:c, chave:modalAcerto, fechar:function(){ setModalAcerto(null); }}));
}

export { AbaPfLanc };
