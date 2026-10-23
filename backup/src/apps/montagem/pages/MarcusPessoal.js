// Sorelly Admin · montagem — pages/MarcusPessoal.js
// "Marcus": sistema PARTICULAR do Marcus (só ele vê: botão Admin / Marcus no alto do menu). Estado próprio em domain/marcus.js; dados reais em domain/marcus.local.js (fora do GitHub).
// Abas: Resumo, Recebimentos (retirada mensal vs faturamento), Patrimônio e dívidas, Contas do mês, Acessos (senhas), Atividades (kanban) e Dados (pessoais, empresas, carros).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Abas, Dinheiro, Faixa, Indicador, Janela, Pagina, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { gravar, remover, sincronizarFaturado, lancarRecebimento, marcarPago, zerarTudo, contasDoMes, somaContas, hojeMes, mesMais, nomeMes, resumoAno, anosComDados, patrimonio, useMarcus } from "@/apps/montagem/domain/marcus";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, brl } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Kanban } from "@/shared/kanban";
import { tabelaMeses } from "@/apps/montagem/domain/resumo-financeiro";
import { use } from "@/apps/montagem/state/context";
import { e, useState, useEffect, Fragment } from "@/shared/react";
var React = {Fragment:Fragment};

var OURO = "#D9A63A";
var pct = function(v){ return v==null ? "—" : v.toFixed(2).replace(".", ",")+"%"; };
var copiar = function(t){ try { navigator.clipboard.writeText(t); } catch(x){} };
// textos prontos para colar no WhatsApp (palavras importantes entre *asteriscos*); cada tela preenche COPIA[título da barra]
var COPIA = {};
function BtnCopiar(p){
  var st = useState(false), ok = st[0], setOk = st[1];
  return e("button",{type:"button", onClick:function(){ copiar(p.fn()); setOk(true); setTimeout(function(){ setOk(false); }, 1800); }, className:"mxcopia rounded-lg px-4 py-1.5 text-[14px] font-bold "+(ok ? "bg-green-600 text-white" : "text-black"), style:ok ? undefined : {background:"linear-gradient(135deg,#F3D98B,#D9A63A)"}}, ok ? "Copiado ✓" : (p.rot || "Copiar para WhatsApp"));
}
// tema preto e dourado do sistema do Marcus: letras maiores, linhas que acendem ao passar o mouse e botões com brilho e clique
var ESTILO = ".mx{font-size:17px}.mx table td{font-size:16.5px!important;padding-top:.7rem!important;padding-bottom:.7rem!important}.mx table th{font-size:12.5px!important;letter-spacing:.09em;color:#F3D98B!important;text-transform:uppercase}"
  + ".mx tbody tr{transition:background .15s}.mx tbody tr:hover{background:rgba(217,166,58,.09)}.mxl{transition:background .15s,transform .15s}.mxl:hover{background:rgba(217,166,58,.1);transform:translateX(3px)}"
  + ".mx button,.mx a{transition:transform .12s,box-shadow .2s,background .2s,filter .2s}.mx button:not(:disabled):hover{box-shadow:0 0 0 1px #D9A63A99,0 6px 20px rgba(217,166,58,.28);transform:translateY(-1px);filter:brightness(1.12)}.mx button:not(:disabled):active{transform:scale(.96);box-shadow:0 0 0 2px #D9A63A}"
  + ".mx h1{font-size:30px!important;background:linear-gradient(90deg,#F3D98B,#D9A63A);-webkit-background-clip:text;background-clip:text;color:transparent!important}.mx input,.mx select,.mx textarea{font-size:16px!important}";

// ---- editor genérico em janela: campos = [{k, l, t:"texto"|"din"|"num"|"sel"|"check"|"area", ops}]
function Editor(p){
  var st = useState(Object.assign({}, p.valor)), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var campo = function(c){
    var val = v[c.k];
    var ent = c.t==="din" ? e(Dinheiro,{value:val||0, label:c.l, onChange:function(x){ set(c.k, x||null); }})
      : c.t==="sel" ? e("select",{value:val||"", onChange:function(ev){ set(c.k, ev.target.value); }, className:INPUT+" h-10 w-full"}, c.ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))
      : c.t==="check" ? e("label",{className:"flex h-10 items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:!!val, onChange:function(ev){ set(c.k, ev.target.checked); }}), c.l2 || c.l)
      : c.t==="area" ? e("textarea",{value:val||"", rows:3, onChange:function(ev){ set(c.k, ev.target.value); }, className:INPUT+" w-full py-2"})
      : e("input",{type:c.t==="num" ? "number" : "text", value:val==null ? "" : val, onChange:function(ev){ set(c.k, c.t==="num" ? (ev.target.value==="" ? null : +ev.target.value) : ev.target.value); }, className:INPUT+" h-10 w-full text-center"});
    return e("label",{key:c.k, className:"flex flex-col gap-1"}, c.t!=="check" && e("span",{className:"text-center text-[11px] font-bold uppercase tracking-wide text-white/60"}, c.l), ent);
  };
  return e(Janela,{t:p.t, fechar:p.fechar, colunas:[e("div",{key:"c", className:"flex flex-col gap-2.5"}, p.campos.map(campo))],
    rodape:[e(Btn,{key:"s", v:"primary", onClick:function(){ p.onSalvar(v); p.fechar(); }}, "Salvar"),
      p.onExcluir && e(Btn,{key:"x", v:"destructive", onClick:function(){ if(window.confirm("Excluir este item?")){ p.onExcluir(v); p.fechar(); } }}, "Excluir"),
      e(Btn,{key:"f", onClick:p.fechar}, "Cancelar")]});
}
var BtnEd = function(onClick, txt){ return e("button",{type:"button", onClick:onClick, className:"rounded-md bg-white/10 px-2 py-1 text-[11.5px] font-bold hover:bg-white/20"}, txt||"Editar"); };
var Barra = function(titulo, acao, filhos){ var cp = COPIA[titulo]; return e(BlocoBarra,{cor:"ouro", t:titulo, compacto:true}, (acao || cp) && e("div",{className:"flex flex-wrap justify-center gap-2 pb-2 pt-1"}, acao, cp && e(BtnCopiar,{fn:cp})), filhos); };

// ---------------- Resumo (em listas, sem blocos soltos)
function LinhaRes(rot, val, cor, sub){ return e("div",{key:rot, className:"mxl flex items-baseline justify-between gap-4 border-b border-white/10 px-4 py-3"}, e("span",{className:"text-[17px] text-white"}, rot, sub && e("span",{className:"ml-2 text-[13px] text-white/50"}, sub)), e("b",{className:"font-mono text-[22px]", style:{color:cor||"#F3D98B"}}, val)); }
function Resumo(s, ir){
  var pt = patrimonio(s), mes = hojeMes(), ano = mes.slice(0,4), cs = contasDoMes(s, mes), sm = somaContas(cs);
  var abertas = s.atividades.filter(function(a){ return a.status!=="concluida"; });
  var proximas = cs.filter(function(c){ return !c.pago; }).slice(0, 8);
  var anos = anosComDados(s), ras = anos.map(function(a){ return {ano:a, r:resumoAno(s, a)}; }).filter(function(x){ return x.r.meses>0; });
  var neg = function(t){ return "*"+t+"*"; };
  COPIA["Patrimônio"] = function(){ return neg("Patrimônio")+"\nBens: "+neg(brl(pt.bens))+"\nDívidas conhecidas: "+neg(brl(pt.dividas))+"\nPatrimônio líquido: "+neg(brl(pt.liquido))+"\nParcelas por mês: "+neg(brl(pt.parcelas)); };
  COPIA["Recebido e faturado"] = function(){ return neg("Recebido e faturado")+"\n"+ras.map(function(x){ return neg(x.ano)+": recebido "+neg(brl(x.r.rec))+" · faturado "+neg(brl(x.r.fat))+" ("+pct(x.r.pct)+")\nMédia por mês: recebido "+neg(brl(x.r.mediaRec))+" · faturado "+neg(brl(x.r.mediaFat)); }).join("\n"); };
  COPIA["Contas do mês"] = function(){ return neg("Contas de "+nomeMes(mes))+"\nTotal: "+neg(brl(sm.total))+" · pago "+neg(brl(sm.pago))+" · falta "+neg(brl(sm.falta))+"\n"+proximas.map(function(c){ return "Dia "+c.dia+" · "+neg(c.desc)+" · "+brl(c.valor)+(c.conta ? " ("+c.conta+")" : ""); }).join("\n"); };
  COPIA["Atividades abertas"] = function(){ return neg("Atividades abertas ("+abertas.length+")")+"\n"+abertas.slice(0, 10).map(function(a){ return "• "+neg(a.urg)+" · "+a.texto.slice(0, 110); }).join("\n"); };
  var tudo = function(){ return ["Patrimônio", "Recebido e faturado", "Contas do mês", "Atividades abertas"].map(function(k){ return COPIA[k](); }).join("\n\n"); };
  return e(React.Fragment, null,
    e("div",{className:"flex justify-center"}, e(BtnCopiar,{fn:tudo, rot:"Copiar o resumo todo"})),
    Barra("Patrimônio", null, e("div",null, LinhaRes("Bens", brl(pt.bens)), LinhaRes("Dívidas conhecidas", brl(pt.dividas), "#F87171", pt.semSaldo ? pt.semSaldo+" sem saldo informado" : ""), LinhaRes("Patrimônio líquido", brl(pt.liquido), pt.liquido>=0 ? "#4ADE80" : "#F87171"), LinhaRes("Parcelas por mês", brl(pt.parcelas), "#FBBF24"))),
    Barra("Recebido e faturado", null, e("div",null, ras.map(function(x){ return e(React.Fragment,{key:x.ano}, LinhaRes(String(x.ano), brl(x.r.rec), "#4ADE80", "recebido · faturado "+brl(x.r.fat)+" · "+pct(x.r.pct)), LinhaRes("Média por mês em "+x.ano, brl(x.r.mediaRec), "#F3D98B", "faturado "+brl(x.r.mediaFat))); }), e("div",{className:"flex justify-center py-2"}, e(Btn,{onClick:function(){ ir("marcusfat"); }}, "Abrir o faturamento mês a mês")))),
    Barra("Contas do mês", null, e("div",null, LinhaRes("Total de "+nomeMes(mes).split(" ")[0].toLowerCase(), brl(sm.total)), LinhaRes("Já pago", brl(sm.pago), "#4ADE80"), LinhaRes("Falta pagar", brl(sm.falta), sm.falta ? "#FBBF24" : "#4ADE80"),
      proximas.length ? e(Tab,{cols:["Dia","Conta","Onde sai","Valor"], className:"text-white"}, proximas.map(function(c){ return e("tr",{key:c.id, className:LINHA}, e(Td,{forte:true}, c.dia), e(Td,null, c.desc), e(Td,null, c.conta||"—"), e(Td,{dinheiro:true}, brl(c.valor))); })) : e("p",{className:"px-2 py-4 text-center text-[15px] text-white/60"}, "Tudo pago neste mês."),
      e("div",{className:"flex justify-center py-2"}, e(Btn,{onClick:function(){ ir("marcuscontas"); }}, "Ver as contas do mês")))),
    Barra("Atividades abertas", null, e("div",null, abertas.length ? abertas.slice(0, 6).map(function(a){ return LinhaRes(a.texto.length>70 ? a.texto.slice(0, 70)+"…" : a.texto, a.urg, URG[a.urg]||"#F3D98B", a.cat); }) : e("p",{className:"px-2 py-4 text-center text-[15px] text-white/60"}, "Nada aberto."), e("div",{className:"flex justify-center py-2"}, e(Btn,{onClick:function(){ ir("marcusativ"); }}, "Abrir as atividades")))));
}

// ---------------- Faturamento: 2025 e 2026 em sequência, em listagem (mês, recebido, faturado e %)
function Recebimentos(s){
  var anos = anosComDados(s), mesAt = hojeMes();
  var cel = function(l, campo, larg){ return e(Td,null, e("div",{className:"mx-auto "+larg}, e(Dinheiro,{value:l[campo]||0, label:campo==="rec" ? "Recebido" : "Faturado", onChange:function(v){ lancarRecebimento(l.mes, campo==="rec" ? (v||0) : (l.rec||0), campo==="fat" ? (v||0) : (l.fat||0)); }}))); };
  var neg = function(t){ return "*"+t+"*"; };
  COPIA["Recebido e faturado mês a mês"] = function(){ return anos.map(function(a){ var ra = resumoAno(s, a); return neg("Ano "+a)+" — recebido "+neg(brl(ra.rec))+" · faturado "+neg(brl(ra.fat))+" ("+pct(ra.pct)+")\n"+ra.linhas.filter(function(l){ return l.rec!=null || l.fat!=null; }).map(function(l){ return l.nome+": recebido "+neg(brl(l.rec||0))+" · faturado "+neg(brl(l.fat||0))+" · "+pct(l.pct); }).join("\n"); }).join("\n\n"); };
  var linhas = [];
  anos.forEach(function(a){ var ra = resumoAno(s, a);
    linhas.push(e("tr",{key:"a"+a, className:"bg-[#D9A63A]/20"}, e(Td,{forte:true, className:"text-left text-[19px] text-[#F3D98B]"}, "Ano "+a), e(Td,{dinheiro:true, forte:true, cor:"ok"}, brl(ra.rec)), e(Td,{dinheiro:true, forte:true, cor:"info"}, brl(ra.fat)), e(Td,{dinheiro:true, forte:true, cor:"total"}, pct(ra.pct))));
    ra.linhas.forEach(function(l){ if(a===mesAt.slice(0,4) && l.mes>mesAt && l.rec==null && l.fat==null) return;
      linhas.push(e("tr",{key:l.mes, className:LINHA}, e(Td,{forte:true, className:"text-left"}, l.nome), cel(l, "rec", "w-52"), cel(l, "fat", "w-56"), e(Td,{dinheiro:true, cor:"total"}, pct(l.pct)))); });
    linhas.push(e("tr",{key:"m"+a, className:LINHA+" bg-white/5"}, e(Td,{forte:true, className:"text-left"}, "Média mensal de "+a), e(Td,{dinheiro:true, forte:true}, brl(ra.mediaRec)), e(Td,{dinheiro:true, forte:true}, brl(ra.mediaFat)), e(Td,null))); });
  return e(React.Fragment, null,
    Barra("Recebido e faturado mês a mês", null, e(Tab,{cols:["Mês","Valor recebido","Valor faturado","%"]}, linhas)));
}

// ---------------- Patrimônio e dívidas
function Patrimonio(s){
  var pt = patrimonio(s), ed = useState(null), edit = ed[0], setEdit = ed[1];
  var TIPOS = [["carro","Carro"],["imovel","Imóvel"],["invest","Investimento"],["outro","Outro"]];
  var rot = {carro:"Carro", imovel:"Imóvel", invest:"Investimento", outro:"Outro"};
  var camposBem = [{k:"nome", l:"Nome"}, {k:"tipo", l:"Tipo", t:"sel", ops:TIPOS}, {k:"valor", l:"Valor de mercado", t:"din"}, {k:"saldo", l:"Falta pagar (financiamento)", t:"din"}, {k:"parcela", l:"Parcela por mês", t:"din"}, {k:"obs", l:"Observação", t:"area"}];
  var camposDiv = [{k:"nome", l:"Dívida"}, {k:"credor", l:"Credor"}, {k:"saldo", l:"Saldo devedor", t:"din"}, {k:"parcela", l:"Parcela por mês", t:"din"}, {k:"obs", l:"Observação", t:"area"}];
  var camposCred = [{k:"banco", l:"Banco"}, {k:"situacao", l:"Situação", t:"area"}];
  var novo = function(lista, base, titulo){ return e(Btn,{sm:true, v:"primary", onClick:function(){ setEdit({lista:lista, valor:base, t:titulo}); }}, "+ Novo"); };
  var vazio = function(x){ return x==null ? "—" : brl(x); };
  var neg = function(x){ return "*"+x+"*"; };
  COPIA["Bens"] = function(){ return neg("Bens")+"\n"+s.bens.map(function(b){ return "• "+neg(b.nome)+" ("+(rot[b.tipo]||b.tipo)+"): valor "+neg(brl(b.valor||0))+(b.saldo!=null ? " · falta pagar "+brl(b.saldo) : "")+(b.parcela ? " · parcela "+brl(b.parcela) : ""); }).join("\n")+"\nTotal em bens: "+neg(brl(pt.bens)); };
  COPIA["Dívidas no meu CPF"] = function(){ return neg("Dívidas no meu CPF")+"\n"+s.dividas.map(function(d){ return "• "+neg(d.nome)+" ("+(d.credor||"—")+"): saldo "+neg(d.saldo!=null ? brl(d.saldo) : "a informar")+(d.parcela ? " · parcela "+brl(d.parcela) : ""); }).join("\n"); };
  COPIA["Propostas de crédito nos bancos"] = function(){ return neg("Propostas de crédito")+"\n"+s.credito.map(function(c){ return "• "+neg(c.banco)+": "+c.situacao; }).join("\n"); };
  return e(React.Fragment, null,
    e(Faixa,{n:4}, e(Indicador,{t:"Bens", v:brl(pt.bens), cor:"total"}), e(Indicador,{t:"Dívidas e financiamentos", v:brl(pt.dividas), cor:"ruim"}), e(Indicador,{t:"Patrimônio líquido", v:brl(pt.liquido), cor:pt.liquido>=0 ? "ok" : "ruim"}), e(Indicador,{t:"Parcelas por mês", v:brl(pt.parcelas), cor:"alerta"})),
    pt.semSaldo || s.bens.some(function(b){ return b.parcela && b.saldo==null; }) ? e("p",{className:"text-center text-[12px] text-white/60"}, "Falta informar quanto falta pagar em alguns itens (aparece \"—\"): o patrimônio líquido fica mais certo quando você preencher.") : null,
    Barra("Bens", novo("bens", {tipo:"imovel", nome:"", valor:null, saldo:null, parcela:null}, "Novo bem"),
      e(Tab,{cols:["Bem","Tipo","Valor","Falta pagar","Parcela/mês","Obs.",""]}, s.bens.map(function(b){ return e("tr",{key:b.id, className:LINHA}, e(Td,{forte:true}, b.nome), e(Td,null, rot[b.tipo]||b.tipo), e(Td,{dinheiro:true, cor:"total"}, brl(b.valor||0)), e(Td,{dinheiro:true}, vazio(b.saldo)), e(Td,{dinheiro:true}, b.parcela ? brl(b.parcela) : "—"), e(Td,{className:"max-w-56 truncate text-white/70"}, b.obs), e(Td,null, BtnEd(function(){ setEdit({lista:"bens", valor:b, t:"Bem"}); }))); }))),
    Barra("Dívidas no meu CPF", novo("dividas", {nome:"", credor:"", saldo:null, parcela:null}, "Nova dívida"),
      e(Tab,{cols:["Dívida","Credor","Saldo devedor","Parcela/mês","Obs.",""]}, s.dividas.map(function(d){ return e("tr",{key:d.id, className:LINHA}, e(Td,{forte:true}, d.nome), e(Td,null, d.credor), e(Td,{dinheiro:true, cor:d.saldo ? "ruim" : undefined}, vazio(d.saldo)), e(Td,{dinheiro:true}, d.parcela ? brl(d.parcela) : "—"), e(Td,{className:"max-w-56 truncate text-white/70"}, d.obs), e(Td,null, BtnEd(function(){ setEdit({lista:"dividas", valor:d, t:"Dívida"}); }))); }))),
    Barra("Propostas de crédito nos bancos", novo("credito", {banco:"", situacao:""}, "Nova proposta"),
      e(Tab,{cols:["Banco","Situação",""]}, s.credito.map(function(c){ var ok = /concedido/i.test(c.situacao), no = /recusado/i.test(c.situacao);
        return e("tr",{key:c.id, className:LINHA}, e(Td,{forte:true}, c.banco), e(Td,{cor:ok ? "ok" : no ? "ruim" : undefined, className:"whitespace-normal!"}, c.situacao), e(Td,null, BtnEd(function(){ setEdit({lista:"credito", valor:c, t:"Proposta de crédito"}); }))); }))),
    edit && e(Editor,{t:edit.t, valor:edit.valor, fechar:function(){ setEdit(null); }, campos:edit.lista==="bens" ? camposBem : edit.lista==="dividas" ? camposDiv : camposCred,
      onSalvar:function(v){ gravar(edit.lista, v, edit.lista[0]); }, onExcluir:edit.valor.id ? function(v){ remover(edit.lista, v.id); } : null}));
}

// ---------------- Contas do mês
function Contas(s){
  var ms = useState(hojeMes()), mes = ms[0], setMes = ms[1], ed = useState(null), edit = ed[0], setEdit = ed[1];
  var cs = contasDoMes(s, mes), sm = somaContas(cs), hoje = new Date(), ehHoje = mes===hojeMes(), dia = hoje.getDate();
  var porConta = {}; cs.forEach(function(c){ if(c.pago) return; var k = c.conta || "Sem conta definida"; porConta[k] = (porConta[k]||0)+c.valor; });
  var campos = [{k:"desc", l:"Descrição"}, {k:"valor", l:"Valor", t:"din"}, {k:"dia", l:"Dia do vencimento", t:"num"}, {k:"conta", l:"De onde sai (conta ou cartão)"}, {k:"mensal", t:"check", l:"Repete todo mês"}];
  var nova = {desc:"", valor:null, dia:dia, conta:"", mensal:false, mes:mes};
  var neg = function(x){ return "*"+x+"*"; };
  COPIA["Contas do mês"] = function(){ return neg("Contas de "+nomeMes(mes))+"\nTotal "+neg(brl(sm.total))+" · pago "+neg(brl(sm.pago))+" · falta "+neg(brl(sm.falta))+"\n"+cs.map(function(c){ return (c.pago ? "✅ " : "⏳ ")+"Dia "+c.dia+" · "+neg(c.desc)+" · "+brl(c.valor)+(c.conta ? " ("+c.conta+")" : ""); }).join("\n"); };
  COPIA["O que falta pagar, por conta"] = function(){ return neg("O que falta pagar, por conta")+"\n"+Object.keys(porConta).sort(function(x, y){ return porConta[y]-porConta[x]; }).map(function(k){ return "• "+neg(k)+": "+brl(porConta[k]); }).join("\n"); };
  return e(React.Fragment, null,
    e("div",{className:"flex items-center justify-center gap-3"}, e(Btn,{sm:true, onClick:function(){ setMes(mesMais(mes, -1)); }}, "‹"), e("b",{className:"min-w-44 text-center font-heading text-lg"}, nomeMes(mes)), e(Btn,{sm:true, onClick:function(){ setMes(mesMais(mes, 1)); }}, "›"), e(Btn,{sm:true, v:"primary", onClick:function(){ setEdit({valor:nova}); }}, "+ Nova conta")),
    e(Faixa,{n:3}, e(Indicador,{t:"Total do mês", v:brl(sm.total), cor:"total"}), e(Indicador,{t:"Pago", v:brl(sm.pago), cor:"ok"}), e(Indicador,{t:"Falta pagar", v:brl(sm.falta), cor:sm.falta ? "alerta" : "ok"})),
    Barra("Contas do mês", null, cs.length ? e(Tab,{cols:["Dia","Conta","Onde sai","Valor","Pago",""]}, cs.map(function(c){ var atraso = ehHoje && !c.pago && c.dia<dia, vence = ehHoje && !c.pago && c.dia>=dia && c.dia-dia<=3;
      return e("tr",{key:c.id, className:LINHA+(c.pago ? " opacity-60" : "")}, e(Td,{forte:true, cor:atraso ? "ruim" : vence ? "alerta" : undefined}, c.dia), e(Td,null, c.desc, c.mensal && e("span",{className:"ml-1.5 text-[10px] text-white/50"}, "mensal")), e(Td,{className:"text-white/80"}, c.conta||"—"), e(Td,{dinheiro:true, forte:true}, brl(c.valor)),
        e(Td,null, e("input",{type:"checkbox", checked:c.pago, onChange:function(ev){ marcarPago(c.id, mes, ev.target.checked); }, className:"size-4 cursor-pointer accent-green-500"})), e(Td,null, BtnEd(function(){ setEdit({valor:c}); }))); }))
      : e("p",{className:"px-2 py-4 text-center text-[12.5px] text-white/60"}, "Nenhuma conta neste mês.")),
    Object.keys(porConta).length ? Barra("O que falta pagar, por conta", null, e(Tab,{cols:["Conta ou cartão","Falta pagar"]}, Object.keys(porConta).sort(function(a, b){ return porConta[b]-porConta[a]; }).map(function(k){ return e("tr",{key:k, className:LINHA}, e(Td,{forte:true}, k), e(Td,{dinheiro:true, cor:"alerta"}, brl(porConta[k]))); }))) : null,
    edit && e(Editor,{t:"Conta", valor:edit.valor, campos:campos, fechar:function(){ setEdit(null); }, onSalvar:function(v){ gravar("contas", Object.assign({}, v, {mes:v.mes||mes, dia:v.dia||1, valor:v.valor||0}), "c"); }, onExcluir:edit.valor.id ? function(v){ remover("contas", v.id); } : null}));
}

// ---------------- Acessos (senhas ficam escondidas até clicar)
function Acessos(s){
  var f = useState({cat:"Todos", q:""}), flt = f[0], setF = f[1], vis = useState({}), ver = vis[0], setVer = vis[1], ed = useState(null), edit = ed[0], setEdit = ed[1], edp = useState(null), editP = edp[0], setEditP = edp[1];
  var lista = s.acessos.filter(function(a){ return (flt.cat==="Todos" || a.cat===flt.cat) && (!flt.q || (a.plat+" "+a.login+" "+a.obs).toLowerCase().indexOf(flt.q.toLowerCase())>=0); });
  var campos = [{k:"cat", l:"Grupo", t:"sel", ops:[["Plataformas","Plataformas"],["Bancos","Bancos"]]}, {k:"plat", l:"Plataforma"}, {k:"login", l:"Login / usuário"}, {k:"senha", l:"Senha"}, {k:"obs", l:"Observação", t:"area"}];
  var camposP = [{k:"nome", l:"Nome"}, {k:"link", l:"Link"}];
  return e(React.Fragment, null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e("input",{value:flt.q, placeholder:"Buscar plataforma ou login", onChange:function(ev){ setF({cat:flt.cat, q:ev.target.value}); }, className:INPUT+" h-9 w-64 text-center"}),
      ["Todos","Plataformas","Bancos"].map(function(c){ return e("button",{key:c, type:"button", onClick:function(){ setF({cat:c, q:flt.q}); }, className:"h-9 rounded-lg px-3 text-[12.5px] font-bold "+(flt.cat===c ? "bg-primary text-primary-foreground" : "bg-white/10 hover:bg-white/20")}, c); }),
      e(Btn,{sm:true, v:"primary", onClick:function(){ setEdit({cat:"Plataformas", plat:"", login:"", senha:"", obs:""}); }}, "+ Novo acesso")),
    Barra("Logins e senhas ("+lista.length+")", null, e(Tab,{cols:["Plataforma","Login","Senha","Obs.",""]}, lista.map(function(a){ var aberto = !!ver[a.id];
      return e("tr",{key:a.id, className:LINHA}, e(Td,{forte:true}, a.plat), e(Td,{className:"text-white/90"}, a.login||"—", a.login && e("button",{type:"button", title:"Copiar login", onClick:function(){ copiar(a.login); }, className:"ml-1.5 rounded bg-white/10 px-1.5 text-[10.5px] hover:bg-white/25"}, "copiar")),
        e(Td,{dinheiro:true}, a.senha ? e(React.Fragment, null, aberto ? a.senha : "••••••••", e("button",{type:"button", onClick:function(){ var n = Object.assign({}, ver); if(aberto) delete n[a.id]; else n[a.id] = 1; setVer(n); }, className:"ml-1.5 rounded bg-white/10 px-1.5 text-[10.5px] hover:bg-white/25"}, aberto ? "ocultar" : "revelar"), e("button",{type:"button", title:"Copiar senha", onClick:function(){ copiar(a.senha); }, className:"ml-1 rounded bg-white/10 px-1.5 text-[10.5px] hover:bg-white/25"}, "copiar")) : "—"),
        e(Td,{className:"max-w-56 truncate text-white/70"}, a.obs), e(Td,null, BtnEd(function(){ setEdit(a); }))); }))),
    s.planilhas.length ? Barra("Minhas planilhas", e(Btn,{sm:true, onClick:function(){ setEditP({nome:"", link:""}); }}, "+ Nova"), e("div",{className:"flex flex-wrap justify-center gap-2 px-3 pb-3"}, s.planilhas.map(function(p){ return e("span",{key:p.id, className:"inline-flex items-center gap-1"}, p.link ? e("a",{href:p.link, target:"_blank", rel:"noreferrer", className:"rounded-lg bg-white/10 px-3 py-1.5 text-[12.5px] font-bold hover:bg-white/20"}, p.nome) : e("span",{className:"rounded-lg bg-white/5 px-3 py-1.5 text-[12.5px] font-bold text-white/60"}, p.nome), BtnEd(function(){ setEditP(p); }, "✎")); }))) : null,
    edit && e(Editor,{t:"Acesso", valor:edit, campos:campos, fechar:function(){ setEdit(null); }, onSalvar:function(v){ gravar("acessos", v, "a"); }, onExcluir:edit.id ? function(v){ remover("acessos", v.id); } : null}),
    editP && e(Editor,{t:"Planilha", valor:editP, campos:camposP, fechar:function(){ setEditP(null); }, onSalvar:function(v){ gravar("planilhas", v, "p"); }, onExcluir:editP.id ? function(v){ remover("planilhas", v.id); } : null}));
}

// ---------------- Atividades (kanban)
var COLS = [["nova","Não iniciada","#94A3B8"],["andamento","Em andamento","#60A5FA"],["aprovacao","Aprovação","#FBBF24"],["parada","Parada","#F97316"],["concluida","Concluída","#4ADE80"]];
var URG = {Urgente:"#EF4444", Alta:"#F97316", "Média":"#FBBF24", Baixa:"#60A5FA", OK:"#4ADE80"};
function Atividades(s){
  var f = useState("Todas"), cat = f[0], setCat = f[1], ed = useState(null), edit = ed[0], setEdit = ed[1];
  var itens = s.atividades.filter(function(a){ return cat==="Todas" || a.cat===cat; });
  var colunas = COLS.map(function(c){ return {k:c[0], titulo:c[1], cor:c[2], itens:itens.filter(function(a){ return a.status===c[0]; })}; });
  var campos = [{k:"texto", l:"Atividade", t:"area"}, {k:"urg", l:"Urgência", t:"sel", ops:["Urgente","Alta","Média","Baixa","OK"].map(function(x){ return [x, x]; })}, {k:"cat", l:"Categoria", t:"sel", ops:[["Empresa","Empresa"],["Pessoal","Pessoal"]]}, {k:"quem", l:"Quem está vendo"}, {k:"status", l:"Situação", t:"sel", ops:COLS.map(function(c){ return [c[0], c[1]]; })}, {k:"obs", l:"Observação", t:"area"}];
  return e(React.Fragment, null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, ["Todas","Empresa","Pessoal"].map(function(c){ return e("button",{key:c, type:"button", onClick:function(){ setCat(c); }, className:"h-9 rounded-lg px-3 text-[12.5px] font-bold "+(cat===c ? "bg-primary text-primary-foreground" : "bg-white/10 hover:bg-white/20")}, c); }), e(Btn,{sm:true, v:"primary", onClick:function(){ setEdit({texto:"", urg:"Média", cat:"Pessoal", quem:"Marcus", status:"nova", obs:""}); }}, "+ Nova atividade")),
    e(Kanban,{colunas:colunas, unidade:["atividade","atividades"], vazio:"Nada nesta etapa.", onAbrir:function(it){ setEdit(it); },
      onMover:function(it, de, para){ gravar("atividades", Object.assign({}, it, {status:para}), "t"); },
      card:function(it){ return e("div",{className:"flex flex-col gap-1"}, e("span",{className:"mx-auto rounded px-1.5 text-[10px] font-bold", style:{background:(URG[it.urg]||"#888")+"33", color:URG[it.urg]||"#fff"}}, it.urg+" · "+it.cat), e("p",{className:"text-[12.5px] leading-snug break-words"}, it.texto.length>150 ? it.texto.slice(0,150)+"…" : it.texto), (it.quem || it.mes) && e("span",{className:"text-[10.5px] text-white/55"}, [it.quem, it.mes].filter(Boolean).join(" · "))); }}),
    edit && e(Editor,{t:"Atividade", valor:edit, campos:campos, fechar:function(){ setEdit(null); }, onSalvar:function(v){ gravar("atividades", v, "t"); }, onExcluir:edit.id ? function(v){ remover("atividades", v.id); } : null}));
}

// ---------------- Dados pessoais, empresas, carros
function Dados(s){
  var ed = useState(null), edit = ed[0], setEdit = ed[1], vis = useState({}), ver = vis[0], setVer = vis[1];
  var camposPes = [{k:"k", l:"Informação"}, {k:"v", l:"Valor"}];
  var camposEmp = [{k:"nome", l:"Nome curto"}, {k:"razao", l:"Razão social"}, {k:"cnpj", l:"CNPJ"}, {k:"end", l:"Endereço"}, {k:"cep", l:"CEP"}, {k:"ie", l:"Inscrição estadual/municipal"}, {k:"socio", l:"Sócio"}, {k:"cpf", l:"CPF do sócio"}, {k:"email", l:"E-mail"}];
  var camposCar = [{k:"nome", l:"Veículo"}, {k:"ano", l:"Ano"}, {k:"renavam", l:"Renavam"}, {k:"placa", l:"Placa"}, {k:"dono", l:"Proprietário (Marcus = meu carro)"}, {k:"cpf", l:"CPF do proprietário"}];
  var cp = function(t){ return t ? e("button",{type:"button", onClick:function(){ copiar(t); }, className:"ml-1.5 rounded bg-white/10 px-2 text-[12px] hover:bg-white/25"}, "copiar") : null; };
  var novo = function(lista, base){ return e(Btn,{sm:true, v:"primary", onClick:function(){ setEdit({lista:lista, valor:base}); }}, "+ Novo"); };
  var salvarLista = {pessoais:"d", empresas:"e", carros:"v"};
  var neg = function(t){ return "*"+t+"*"; };
  // empresas no nome do Marcus: só a H&O e a Mayz
  var minhas = s.empresas.filter(function(m){ return /h&o|mayz/i.test((m.nome||"")+" "+(m.razao||"")); });
  var meusCarros = s.carros.filter(function(c){ return /marcus/i.test(c.dono||""); }), carrosFam = s.carros.filter(function(c){ return !/marcus/i.test(c.dono||""); });
  var textoCarros = function(tit, ls){ return function(){ return neg(tit)+"\n"+ls.map(function(c){ return "• "+neg(c.nome)+(c.ano ? " "+c.ano : "")+" · placa "+neg(c.placa||"—")+" · renavam "+(c.renavam||"—")+" · dono "+neg(c.dono||"—"); }).join("\n"); }; };
  COPIA["Empresas no meu nome"] = function(){ return neg("Empresas no meu nome")+"\n"+minhas.map(function(m){ return "• "+neg(m.nome)+(m.razao ? " — "+m.razao : "")+"\nCNPJ "+neg(m.cnpj||"—")+(m.end ? "\n"+m.end : "")+(m.ie ? "\nInscrição "+m.ie : ""); }).join("\n"); };
  COPIA["Meus carros"] = textoCarros("Meus carros", meusCarros);
  COPIA["Carros da família"] = textoCarros("Carros da família", carrosFam);
  COPIA["Dados pessoais"] = function(){ return neg("Dados pessoais")+"\n"+s.pessoais.filter(function(d){ return !/e-?cac/i.test(d.k); }).map(function(d){ return d.k+": "+neg(d.v); }).join("\n"); };
  var tabCarros = function(ls, lista){ return e(Tab,{cols:["Veículo","Ano","Placa","Renavam","Proprietário","CPF",""]}, ls.map(function(c){
    return e("tr",{key:c.id, className:LINHA}, e(Td,{forte:true}, c.nome), e(Td,null, c.ano), e(Td,{dinheiro:true}, c.placa, cp(c.placa)), e(Td,{dinheiro:true}, c.renavam, cp(c.renavam)), e(Td,null, c.dono), e(Td,{dinheiro:true}, c.cpf), e(Td,null, BtnEd(function(){ setEdit({lista:"carros", valor:c}); }))); })); };
  return e(React.Fragment, null,
    Barra("Dados pessoais", novo("pessoais", {k:"", v:""}), e(Tab,{cols:["Informação","Valor",""]}, s.pessoais.map(function(d){ var sec = /e-?cac/i.test(d.k), aberto = !!ver[d.id];
      return e("tr",{key:d.id, className:LINHA}, e(Td,{forte:true}, d.k), e(Td,{dinheiro:true}, sec && !aberto ? "••••••••" : d.v, sec && e("button",{type:"button", onClick:function(){ var n = Object.assign({}, ver); if(aberto) delete n[d.id]; else n[d.id] = 1; setVer(n); }, className:"ml-1.5 rounded bg-white/10 px-2 text-[12px] hover:bg-white/25"}, aberto ? "ocultar" : "revelar"), cp(d.v)), e(Td,null, BtnEd(function(){ setEdit({lista:"pessoais", valor:d}); }))); }))),
    Barra("Empresas no meu nome", novo("empresas", {nome:"", razao:"", cnpj:"", end:"", cep:"", ie:"", socio:"Marcus Vinicius Hess de Oliveira", cpf:"", email:""}), e(Tab,{cols:["Empresa","CNPJ","Sócio","CPF","Endereço","Inscrição",""]}, minhas.map(function(m){
      return e("tr",{key:m.id, className:LINHA}, e(Td,{forte:true, title:m.razao}, m.nome), e(Td,{dinheiro:true}, m.cnpj, cp(m.cnpj)), e(Td,null, m.socio), e(Td,{dinheiro:true}, m.cpf, cp(m.cpf)), e(Td,{className:"text-white/70"}, m.end), e(Td,{className:"text-white/70"}, m.ie), e(Td,null, BtnEd(function(){ setEdit({lista:"empresas", valor:m}); }))); }))),
    Barra("Meus carros", novo("carros", {nome:"", ano:"", renavam:"", placa:"", dono:"Marcus", cpf:""}), tabCarros(meusCarros)),
    Barra("Carros da família", novo("carros", {nome:"", ano:"", renavam:"", placa:"", dono:"", cpf:""}), tabCarros(carrosFam)),
    e("div",{className:"flex justify-center pt-1"}, e(Btn,{sm:true, v:"destructive", title:"Apaga o que foi mexido neste navegador e volta aos dados do arquivo local", onClick:function(){ if(window.confirm("Voltar tudo ao que veio da planilha? O que você lançou depois neste navegador será perdido.")) zerarTudo(); }}, "Voltar aos dados da planilha")),
    edit && e(Editor,{t:"Editar", valor:edit.valor, fechar:function(){ setEdit(null); }, campos:edit.lista==="pessoais" ? camposPes : edit.lista==="empresas" ? camposEmp : camposCar, onSalvar:function(v){ gravar(edit.lista, v, salvarLista[edit.lista]); }, onExcluir:edit.valor.id ? function(v){ remover(edit.lista, v.id); } : null}));
}

// Faturado do ano atual vem do admin (Visão geral → Faturamento mês a mês): meses fechados = real; mês atual = faturado até agora (oficial do dia anterior + "Hoje").
// Atualiza ao abrir e a cada 10 min enquanto a tela estiver aberta. Sem servidor, não roda sozinho com o sistema fechado: a primeira abertura do dia já traz o número novo.
function useFaturadoAuto(adm){
  useEffect(function(){
    var rodar = function(){
      try {
        var t = tabelaMeses(adm, undefined), ano = new Date().getFullYear(), linhas = [];
        t.rows.forEach(function(r){ if(r.tipo==="real" && r.fat>0) linhas.push({mes:ano+"-"+String(r.mes+1).padStart(2,"0"), fat:r.fat}); else if(r.atual && r.hojeRecebido>0) linhas.push({mes:ano+"-"+String(r.mes+1).padStart(2,"0"), fat:r.hojeRecebido, parcial:true}); });
        sincronizarFaturado(linhas, new Date().toISOString());
      } catch(x){}
    };
    rodar(); var id = setInterval(rodar, 600000); return function(){ clearInterval(id); };
  }, [adm]);
}
// cada tela é um item do menu lateral (modo Marcus); mesma casca para todas
function Tela(p){
  var s = useMarcus(), d = use().dispatch;
  useFaturadoAuto(use().state);
  return e(Pagina, null, e("style",null, ESTILO), e("div",{className:"mx flex flex-col gap-3", style:{background:"radial-gradient(900px 320px at 50% -60px, rgba(217,166,58,.16), transparent)"}}, e(PageHead,{t:p.t, sub:p.sub}), p.corpo(s, function(aba){ d({type:"ABA", aba:aba}); })));
}
var tela = function(t, sub, corpo){ return function(){ return e(Tela,{t:t, sub:sub, corpo:corpo}); }; };
var AbaMarcus = tela("Resumo", "Meu controle particular", Resumo);
var AbaMarcusFat = tela("Faturamento", "Recebido e faturado, mês a mês", function(s){ return e(Recebimentos, s); });
var AbaMarcusPat = tela("Patrimônio e dívidas", "Bens, dívidas e propostas de crédito", function(s){ return e(Patrimonio, s); });
var AbaMarcusContas = tela("Contas do mês", "O que vence e o que já foi pago", function(s){ return e(Contas, s); });
var AbaMarcusAtiv = tela("Atividades", "O que preciso resolver", function(s){ return e(Atividades, s); });
var AbaMarcusAcessos = tela("Acessos e senhas", "Logins, bancos e planilhas", function(s){ return e(Acessos, s); });
var AbaMarcusDados = tela("Dados", "Pessoais, empresas e carros", function(s){ return e(Dados, s); });
export { ESTILO, AbaMarcus, AbaMarcusFat, AbaMarcusPat, AbaMarcusContas, AbaMarcusAtiv, AbaMarcusAcessos, AbaMarcusDados };
