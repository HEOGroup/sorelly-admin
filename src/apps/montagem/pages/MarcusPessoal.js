// Sorelly Admin · montagem — pages/MarcusPessoal.js
// "Marcus": sistema PARTICULAR do Marcus (só ele vê: botão Admin / Marcus no alto do menu). Estado próprio em domain/marcus.js; dados reais em domain/marcus.local.js (fora do GitHub).
// LAYOUT NOVO (23/10/2026): mesmo padrão do Financeiro (components/padrao-fin.js; regra fixa de 22/10/2026 no fim de PADRAO-VISUAL.md):
//   título + ação · bloco Filtros (grade de 4 colunas, 32 px) · faixa de totais (rótulo + valor) · abas visíveis · tabelas com número à direita e R$ em todo valor. Sem degradê, sem cartões, Inter 13 px.
// Telas: Resumo, Faturamento (recebido × faturado), Patrimônio e dívidas, Contas do mês, Acessos (senhas), Atividades (kanban) e Dados (pessoais, empresas, carros).
import { AbasTela, Bloco, BlocoFiltros, Botao, CAMPO, COR, CampoBusca, CampoSel, FaixaTotais, Rotulo, Segmentado, TabelaP, Td, Tr, corSinal, brl as R } from "@/apps/montagem/components/padrao-fin";
import { Dinheiro, Janela, Pagina } from "@/apps/montagem/components/padrao";
import { gravar, remover, sincronizarFaturado, lancarRecebimento, marcarPago, zerarTudo, contasDoMes, somaContas, hojeMes, mesMais, nomeMes, resumoAno, anosComDados, patrimonio, useMarcus } from "@/apps/montagem/domain/marcus";
import { Btn } from "@/apps/montagem/ui/button";
import { MoneyInput } from "@/apps/montagem/ui/input";
import { Kanban } from "@/shared/kanban";
import { tabelaMeses } from "@/apps/montagem/domain/resumo-financeiro";
import { use } from "@/apps/montagem/state/context";
import { e, useState, useEffect } from "@/shared/react";

var pct = function(v){ return v==null ? "—" : v.toFixed(2).replace(".", ",")+"%"; };
var copiar = function(t){ try { navigator.clipboard.writeText(t); } catch(x){} };
var neg = function(t){ return "*"+t+"*"; };   // negrito do WhatsApp
// tema do sistema Marcus: só o necessário (letras brancas, Inter 13 px do padrão; nada de degradê nem animação)
var ESTILO = ".mx{font-size:13px}.mx input[type=checkbox]{accent-color:#4ade80}";
var URG = {Urgente:"#EF4444", Alta:"#F97316", "Média":"#FBBF24", Baixa:"#60A5FA", OK:"#4ADE80"};

// botão que copia o texto pronto para o WhatsApp (palavras importantes entre *asteriscos*)
function BtnCopiar(p){
  var st = useState(false), ok = st[0], setOk = st[1];
  return e(Botao,{principal:ok, onClick:function(){ copiar(p.fn()); setOk(true); setTimeout(function(){ setOk(false); }, 1800); }}, ok ? "Copiado" : (p.rot || "Copiar WhatsApp"));
}
// título da tela + ações à direita
var Cab = function(t, acoes){ return e("div",{className:"flex h-10 items-center justify-between gap-2"}, e("h1",{className:"truncate text-[16px] font-semibold text-foreground", title:t}, t), e("div",{className:"flex items-center gap-2"}, acoes)); };
var Mini = function(txt, onClick, title){ return e("button",{type:"button", title:title||txt, onClick:onClick, className:"h-6 rounded border border-border px-1.5 text-[11px] text-foreground hover:bg-white/10"}, txt); };
var Editar = function(onClick){ return Mini("Editar", onClick); };
var Novo = function(onClick, txt){ return e(Botao,{principal:true, onClick:onClick}, txt || "+ Novo"); };
var Vazio = function(txt){ return e("p",{className:"px-2 py-4 text-center text-[13px] text-foreground"}, txt); };
var COL_ED = {t:"", w:64};

// ---- editor genérico em janela: campos = [{k, l, t:"texto"|"din"|"num"|"sel"|"check"|"area", ops}]
function Editor(p){
  var st = useState(Object.assign({}, p.valor)), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var campo = function(c){
    var val = v[c.k];
    var ent = c.t==="din" ? e(Dinheiro,{value:val||0, label:c.l, onChange:function(x){ set(c.k, x||null); }})
      : c.t==="sel" ? e("select",{value:val||"", onChange:function(ev){ set(c.k, ev.target.value); }, className:CAMPO}, c.ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))
      : c.t==="check" ? e("label",{className:"flex h-8 items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:!!val, onChange:function(ev){ set(c.k, ev.target.checked); }}), c.l2 || c.l)
      : c.t==="area" ? e("textarea",{value:val||"", rows:3, onChange:function(ev){ set(c.k, ev.target.value); }, className:CAMPO.replace("h-8","py-1.5")})
      : e("input",{type:c.t==="num" ? "number" : "text", value:val==null ? "" : val, onChange:function(ev){ set(c.k, c.t==="num" ? (ev.target.value==="" ? null : +ev.target.value) : ev.target.value); }, className:CAMPO});
    return e("div",{key:c.k, className:"min-w-0"}, c.t!=="check" && e(Rotulo,{t:c.l}), ent);
  };
  return e(Janela,{t:p.t, fechar:p.fechar, colunas:[e("div",{key:"c", className:"flex flex-col gap-2"}, p.campos.map(campo))],
    rodape:[e(Btn,{key:"s", v:"primary", onClick:function(){ p.onSalvar(v); p.fechar(); }}, "Salvar"),
      p.onExcluir && e(Btn,{key:"x", v:"destructive", onClick:function(){ if(window.confirm("Excluir este item?")){ p.onExcluir(v); p.fechar(); } }}, "Excluir"),
      e(Btn,{key:"f", onClick:p.fechar}, "Cancelar")]});
}

// ---------------- Resumo
function Resumo(p){
  var s = p.s, ir = p.ir, pt = patrimonio(s), mes = hojeMes(), ano = mes.slice(0,4), cs = contasDoMes(s, mes), sm = somaContas(cs);
  var abertas = s.atividades.filter(function(a){ return a.status!=="concluida"; });
  var proximas = cs.filter(function(c){ return !c.pago; }).slice(0, 8);
  var ras = anosComDados(s).map(function(a){ return {ano:a, r:resumoAno(s, a)}; }).filter(function(x){ return x.r.meses>0; });
  var rAno = ras.filter(function(x){ return String(x.ano)===ano; })[0];
  var textos = {
    "Patrimônio": function(){ return neg("Patrimônio")+"\nBens: "+neg(R(pt.bens))+"\nDívidas conhecidas: "+neg(R(pt.dividas))+"\nPatrimônio líquido: "+neg(R(pt.liquido))+"\nParcelas por mês: "+neg(R(pt.parcelas)); },
    "Recebido e faturado": function(){ return neg("Recebido e faturado")+"\n"+ras.map(function(x){ return neg(x.ano)+": recebido "+neg(R(x.r.rec))+" · faturado "+neg(R(x.r.fat))+" ("+pct(x.r.pct)+")\nMédia por mês: recebido "+neg(R(x.r.mediaRec))+" · faturado "+neg(R(x.r.mediaFat)); }).join("\n"); },
    "Contas do mês": function(){ return neg("Contas de "+nomeMes(mes))+"\nTotal: "+neg(R(sm.total))+" · pago "+neg(R(sm.pago))+" · falta "+neg(R(sm.falta))+"\n"+proximas.map(function(c){ return "Dia "+c.dia+" · "+neg(c.desc)+" · "+R(c.valor)+(c.conta ? " ("+c.conta+")" : ""); }).join("\n"); },
    "Atividades abertas": function(){ return neg("Atividades abertas ("+abertas.length+")")+"\n"+abertas.slice(0, 10).map(function(a){ return "• "+neg(a.urg)+" · "+a.texto.slice(0, 110); }).join("\n"); }
  };
  var tudo = function(){ return Object.keys(textos).map(function(k){ return textos[k](); }).join("\n\n"); };
  var par = function(t, v, cor, tot){ return e(Tr,{key:t, total:tot}, e(Td,null, t), e(Td,{n:true, cor:cor}, v)); };
  return e("div",{className:"flex flex-col gap-3"},
    Cab("Resumo", e(BtnCopiar,{fn:tudo, rot:"Copiar resumo"})),
    e(FaixaTotais,{itens:[{t:"Líquido", v:R(pt.liquido), cor:corSinal(pt.liquido)}, {t:"Recebido "+ano, v:R(rAno ? rAno.r.rec : 0), cor:COR.entra}, {t:"Faturado "+ano, v:R(rAno ? rAno.r.fat : 0)}, {t:"Falta pagar", v:R(sm.falta), cor:sm.falta ? COR.sai : ""}, {t:"Atividades", v:String(abertas.length)}]}),
    e("div",{className:"grid grid-cols-1 items-start gap-3 lg:grid-cols-2"},
      e(Bloco,{t:"Patrimônio"}, e(TabelaP,{cols:[{t:"Item"}, {t:"Valor", n:true, w:150}]},
        par("Bens", R(pt.bens)), par("Dívidas", R(pt.dividas), COR.sai), par("Parcelas por mês", R(pt.parcelas)), par("Patrimônio líquido", R(pt.liquido), corSinal(pt.liquido), true))),
      e(Bloco,{t:"Recebido e faturado", dir:e(Botao,{onClick:function(){ ir("marcusfat"); }}, "Mês a mês")},
        ras.length ? e(TabelaP,{cols:[{t:"Ano", w:64}, {t:"Recebido", n:true, w:130}, {t:"Faturado", n:true, w:130}, {t:"%", n:true, w:72}]}, ras.map(function(x){ return e(Tr,{key:x.ano}, e(Td,{forte:true}, String(x.ano)), e(Td,{n:true, cor:COR.entra}, R(x.r.rec)), e(Td,{n:true}, R(x.r.fat)), e(Td,{n:true}, pct(x.r.pct))); }))
        : Vazio("Nenhum mês lançado.")),
      e(Bloco,{t:"Contas do mês · "+nomeMes(mes), dir:e(Botao,{onClick:function(){ ir("marcuscontas"); }}, "Abrir")},
        proximas.length ? e(TabelaP,{cols:[{t:"Dia", w:48}, {t:"Conta"}, {t:"Onde sai", w:130}, {t:"Valor", n:true, w:120}]}, proximas.map(function(c){ return e(Tr,{key:c.id}, e(Td,{forte:true}, String(c.dia)), e(Td,null, c.desc), e(Td,null, c.conta||"—"), e(Td,{n:true}, R(c.valor))); })) : Vazio("Tudo pago neste mês.")),
      e(Bloco,{t:"Atividades abertas", dir:e(Botao,{onClick:function(){ ir("marcusativ"); }}, "Abrir")},
        abertas.length ? e(TabelaP,{cols:[{t:"Urgência", w:84}, {t:"Atividade"}, {t:"Grupo", w:84}]}, abertas.slice(0, 8).map(function(a){ return e(Tr,{key:a.id}, e("td",{className:"h-8 truncate border-b border-border px-2.5 font-semibold", style:{color:URG[a.urg]||"#fff"}}, a.urg), e(Td,null, a.texto), e(Td,null, a.cat)); })) : Vazio("Nada aberto."))));
}

// ---------------- Faturamento: recebido e faturado, mês a mês (uma tabela por ano escolhido)
function Recebimentos(p){
  var s = p.s, anos = anosComDados(s), mesAt = hojeMes(), anoAt = mesAt.slice(0,4);
  var sa = useState(anos.indexOf(anoAt)>=0 ? anoAt : String(anos[anos.length-1] || anoAt)), ano = sa[0], setAno = sa[1];
  var ra = resumoAno(s, ano);
  var linhas = ra.linhas.filter(function(l){ return !(ano===anoAt && l.mes>mesAt && l.rec==null && l.fat==null); });
  var cel = function(l, campo){ return e("td",{className:"h-8 border-b border-border px-1"}, e(MoneyInput,{value:l[campo]||0, label:campo==="rec" ? "Recebido" : "Faturado", sm:true, className:"w-full text-[13px]!", onChange:function(v){ lancarRecebimento(l.mes, campo==="rec" ? (v||0) : (l.rec||0), campo==="fat" ? (v||0) : (l.fat||0)); }})); };
  var texto = function(){ return anos.map(function(a){ var r = resumoAno(s, a); return neg("Ano "+a)+" — recebido "+neg(R(r.rec))+" · faturado "+neg(R(r.fat))+" ("+pct(r.pct)+")\n"+r.linhas.filter(function(l){ return l.rec!=null || l.fat!=null; }).map(function(l){ return l.nome+": recebido "+neg(R(l.rec||0))+" · faturado "+neg(R(l.fat||0))+" · "+pct(l.pct); }).join("\n"); }).join("\n\n"); };
  return e("div",{className:"flex flex-col gap-3"},
    Cab("Faturamento", e(BtnCopiar,{fn:texto})),
    e(BlocoFiltros,{onLimpar:ano!==anoAt && anos.indexOf(anoAt)>=0 ? function(){ setAno(anoAt); } : null}, e(CampoSel,{t:"Ano", id:"mf-ano", value:ano, onChange:setAno, opcoes:(anos.length ? anos : [anoAt]).map(function(a){ return [String(a), String(a)]; })})),
    e(FaixaTotais,{itens:[{t:"Recebido", v:R(ra.rec), cor:COR.entra}, {t:"Faturado", v:R(ra.fat)}, {t:"Percentual", v:pct(ra.pct)}, {t:"Média recebido", v:R(ra.mediaRec)}, {t:"Média faturado", v:R(ra.mediaFat)}]}),
    e(TabelaP,{cols:[{t:"Mês"}, {t:"Recebido", n:true, w:190}, {t:"Faturado", n:true, w:190}, {t:"%", n:true, w:90}], minW:560},
      linhas.map(function(l){ return e("tr",{key:l.mes}, e(Td,{forte:true}, l.nome), cel(l, "rec"), cel(l, "fat"), e(Td,{n:true}, pct(l.pct))); }).concat([
        e(Tr,{key:"t", total:true}, e(Td,null, "Total "+ano), e(Td,{n:true, cor:COR.entra}, R(ra.rec)), e(Td,{n:true}, R(ra.fat)), e(Td,{n:true}, pct(ra.pct)))])));
}

// ---------------- Patrimônio e dívidas
function Patrimonio(p){
  var s = p.s, pt = patrimonio(s), ed = useState(null), edit = ed[0], setEdit = ed[1], ab = useState("bens"), aba = ab[0], setAba = ab[1];
  var TIPOS = [["carro","Carro"],["imovel","Imóvel"],["invest","Investimento"],["outro","Outro"]];
  var rot = {carro:"Carro", imovel:"Imóvel", invest:"Investimento", outro:"Outro"};
  var camposBem = [{k:"nome", l:"Nome"}, {k:"tipo", l:"Tipo", t:"sel", ops:TIPOS}, {k:"valor", l:"Valor de mercado", t:"din"}, {k:"saldo", l:"Falta pagar (financiamento)", t:"din"}, {k:"parcela", l:"Parcela por mês", t:"din"}, {k:"obs", l:"Observação", t:"area"}];
  var camposDiv = [{k:"nome", l:"Dívida"}, {k:"credor", l:"Credor"}, {k:"saldo", l:"Saldo devedor", t:"din"}, {k:"parcela", l:"Parcela por mês", t:"din"}, {k:"obs", l:"Observação", t:"area"}];
  var camposCred = [{k:"banco", l:"Banco"}, {k:"situacao", l:"Situação", t:"area"}];
  var vazio = function(x){ return x==null ? "—" : R(x); };
  var texto = function(){
    if(aba==="bens") return neg("Bens")+"\n"+s.bens.map(function(b){ return "• "+neg(b.nome)+" ("+(rot[b.tipo]||b.tipo)+"): valor "+neg(R(b.valor||0))+(b.saldo!=null ? " · falta pagar "+R(b.saldo) : "")+(b.parcela ? " · parcela "+R(b.parcela) : ""); }).join("\n")+"\nTotal em bens: "+neg(R(pt.bens));
    if(aba==="dividas") return neg("Dívidas no meu CPF")+"\n"+s.dividas.map(function(d){ return "• "+neg(d.nome)+" ("+(d.credor||"—")+"): saldo "+neg(d.saldo!=null ? R(d.saldo) : "a informar")+(d.parcela ? " · parcela "+R(d.parcela) : ""); }).join("\n");
    return neg("Propostas de crédito")+"\n"+s.credito.map(function(c){ return "• "+neg(c.banco)+": "+c.situacao; }).join("\n");
  };
  var base = {bens:{tipo:"imovel", nome:"", valor:null, saldo:null, parcela:null}, dividas:{nome:"", credor:"", saldo:null, parcela:null}, credito:{banco:"", situacao:""}};
  var titulo = {bens:"Bem", dividas:"Dívida", credito:"Proposta de crédito"};
  var semInfo = pt.semSaldo || s.bens.some(function(b){ return b.parcela && b.saldo==null; });
  var tabela = aba==="bens" ? e(TabelaP,{cols:[{t:"Bem"}, {t:"Tipo", w:110}, {t:"Valor", n:true, w:130}, {t:"Falta pagar", n:true, w:130}, {t:"Parcela/mês", n:true, w:120}, {t:"Obs.", w:180}, COL_ED], minW:880},
      s.bens.map(function(b){ return e(Tr,{key:b.id}, e(Td,{forte:true}, b.nome), e(Td,null, rot[b.tipo]||b.tipo), e(Td,{n:true}, R(b.valor||0)), e(Td,{n:true}, vazio(b.saldo)), e(Td,{n:true}, b.parcela ? R(b.parcela) : "—"), e(Td,null, b.obs||""), e("td",{className:"h-8 border-b border-border px-1 text-right"}, Editar(function(){ setEdit({lista:"bens", valor:b, t:"Bem"}); }))); }).concat([
        e(Tr,{key:"t", total:true}, e(Td,null, "Total"), e(Td,null, ""), e(Td,{n:true}, R(pt.bens)), e(Td,{n:true, cor:COR.sai}, R(s.bens.reduce(function(a, b){ return a+(b.saldo||0); }, 0))), e(Td,{n:true}, R(s.bens.reduce(function(a, b){ return a+(b.parcela||0); }, 0))), e(Td,null, ""), e(Td,null, ""))]))
    : aba==="dividas" ? e(TabelaP,{cols:[{t:"Dívida"}, {t:"Credor", w:160}, {t:"Saldo devedor", n:true, w:140}, {t:"Parcela/mês", n:true, w:120}, {t:"Obs.", w:180}, COL_ED], minW:800},
      s.dividas.map(function(d){ return e(Tr,{key:d.id}, e(Td,{forte:true}, d.nome), e(Td,null, d.credor), e(Td,{n:true, cor:d.saldo ? COR.sai : ""}, vazio(d.saldo)), e(Td,{n:true}, d.parcela ? R(d.parcela) : "—"), e(Td,null, d.obs||""), e("td",{className:"h-8 border-b border-border px-1 text-right"}, Editar(function(){ setEdit({lista:"dividas", valor:d, t:"Dívida"}); }))); }).concat([
        e(Tr,{key:"t", total:true}, e(Td,null, "Total"), e(Td,null, ""), e(Td,{n:true, cor:COR.sai}, R(s.dividas.reduce(function(a, d){ return a+(d.saldo||0); }, 0))), e(Td,{n:true}, R(s.dividas.reduce(function(a, d){ return a+(d.parcela||0); }, 0))), e(Td,null, ""), e(Td,null, ""))]))
    : e(TabelaP,{cols:[{t:"Banco", w:200}, {t:"Situação"}, COL_ED], minW:560}, s.credito.map(function(c){ var ok = /concedido/i.test(c.situacao), no = /recusado/i.test(c.situacao);
        return e(Tr,{key:c.id}, e(Td,{forte:true}, c.banco), e(Td,{cor:ok ? COR.entra : no ? COR.sai : ""}, c.situacao), e("td",{className:"h-8 border-b border-border px-1 text-right"}, Editar(function(){ setEdit({lista:"credito", valor:c, t:"Proposta de crédito"}); }))); }));
  return e("div",{className:"flex flex-col gap-3"},
    Cab("Patrimônio e dívidas", [e(BtnCopiar,{key:"c", fn:texto}), e("span",{key:"n"}, Novo(function(){ setEdit({lista:aba, valor:base[aba], t:"Novo — "+titulo[aba].toLowerCase()}); }, "+ Novo"))]),
    e(FaixaTotais,{itens:[{t:"Bens", v:R(pt.bens)}, {t:"Dívidas", v:R(pt.dividas), cor:COR.sai}, {t:"Líquido", v:R(pt.liquido), cor:corSinal(pt.liquido)}, {t:"Parcelas por mês", v:R(pt.parcelas)}]}),
    semInfo ? e("p",{className:"text-[13px] text-foreground"}, "Faltam saldos em alguns itens (aparecem com —). Preencha para o líquido ficar certo.") : null,
    e(AbasTela,{abas:[["bens","Bens"],["dividas","Dívidas no CPF"],["credito","Crédito nos bancos"]], atual:aba, onMudar:setAba}),
    tabela,
    edit && e(Editor,{t:edit.t, valor:edit.valor, fechar:function(){ setEdit(null); }, campos:edit.lista==="bens" ? camposBem : edit.lista==="dividas" ? camposDiv : camposCred,
      onSalvar:function(v){ gravar(edit.lista, v, edit.lista[0]); }, onExcluir:edit.valor.id ? function(v){ remover(edit.lista, v.id); } : null}));
}

// ---------------- Contas do mês
function Contas(p){
  var s = p.s, ms = useState(hojeMes()), mes = ms[0], setMes = ms[1], ed = useState(null), edit = ed[0], setEdit = ed[1], sv = useState("todas"), vis = sv[0], setVis = sv[1], ab = useState("lista"), aba = ab[0], setAba = ab[1];
  var cs = contasDoMes(s, mes), sm = somaContas(cs), ehHoje = mes===hojeMes(), dia = new Date().getDate();
  var porConta = {}; cs.forEach(function(c){ if(c.pago) return; var k = c.conta || "Sem conta definida"; porConta[k] = (porConta[k]||0)+c.valor; });
  var chaves = Object.keys(porConta).sort(function(a, b){ return porConta[b]-porConta[a]; });
  var lista = cs.filter(function(c){ return vis==="todas" || (vis==="falta" ? !c.pago : c.pago); });
  var meses = []; for(var i=-6; i<=6; i++) meses.push(mesMais(hojeMes(), i));
  if(meses.indexOf(mes)<0) meses.push(mes);
  var campos = [{k:"desc", l:"Descrição"}, {k:"valor", l:"Valor", t:"din"}, {k:"dia", l:"Dia do vencimento", t:"num"}, {k:"conta", l:"De onde sai (conta ou cartão)"}, {k:"mensal", t:"check", l:"Repete todo mês"}];
  var nova = {desc:"", valor:null, dia:dia, conta:"", mensal:false, mes:mes};
  var texto = function(){ return aba==="lista"
    ? neg("Contas de "+nomeMes(mes))+"\nTotal "+neg(R(sm.total))+" · pago "+neg(R(sm.pago))+" · falta "+neg(R(sm.falta))+"\n"+cs.map(function(c){ return (c.pago ? "✅ " : "⏳ ")+"Dia "+c.dia+" · "+neg(c.desc)+" · "+R(c.valor)+(c.conta ? " ("+c.conta+")" : ""); }).join("\n")
    : neg("O que falta pagar, por conta")+"\n"+chaves.map(function(k){ return "• "+neg(k)+": "+R(porConta[k]); }).join("\n"); };
  return e("div",{className:"flex flex-col gap-3"},
    Cab("Contas do mês", [e(BtnCopiar,{key:"c", fn:texto}), e("span",{key:"n"}, Novo(function(){ setEdit({valor:nova}); }, "+ Nova conta"))]),
    e(BlocoFiltros,{onLimpar:mes!==hojeMes() || vis!=="todas" ? function(){ setMes(hojeMes()); setVis("todas"); } : null},
      e(CampoSel,{t:"Mês", id:"mc-mes", value:mes, onChange:setMes, opcoes:meses.map(function(m){ return [m, nomeMes(m)]; })}),
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Situação", id:"mc-sit"}), e(Segmentado,{opcoes:[["todas","Todas"],["falta","Falta"],["pagas","Pagas"]], atual:vis, onMudar:setVis}))),
    e(FaixaTotais,{itens:[{t:"Total", v:R(sm.total)}, {t:"Pago", v:R(sm.pago), cor:COR.entra}, {t:"Falta", v:R(sm.falta), cor:sm.falta ? COR.sai : ""}, {t:"Contas", v:String(cs.length)}]}),
    e(AbasTela,{abas:[["lista","Lista"],["conta","Falta por conta"]], atual:aba, onMudar:setAba}),
    aba==="lista" ? (lista.length ? e(TabelaP,{cols:[{t:"Dia", w:56}, {t:"Conta"}, {t:"Onde sai", w:170}, {t:"Valor", n:true, w:130}, {t:"Pago", w:56, c:true}, COL_ED], minW:640},
      lista.map(function(c){ var atraso = ehHoje && !c.pago && c.dia<dia;
        return e(Tr,{key:c.id, apagado:c.pago, alerta:atraso}, e(Td,{forte:true}, String(c.dia)), e(Td,{title:c.desc}, c.desc+(c.mensal ? " · mensal" : "")), e(Td,null, c.conta||"—"), e(Td,{n:true}, R(c.valor)),
          e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, e("input",{type:"checkbox", checked:c.pago, "aria-label":"Pago", onChange:function(ev){ marcarPago(c.id, mes, ev.target.checked); }, className:"size-4 cursor-pointer"})),
          e("td",{className:"h-8 border-b border-border px-1 text-right"}, Editar(function(){ setEdit({valor:c}); }))); }).concat([e(Tr,{key:"t", total:true}, e(Td,null, ""), e(Td,null, "Total"), e(Td,null, ""), e(Td,{n:true}, R(lista.reduce(function(a, c){ return a+c.valor; }, 0))), e(Td,null, ""), e(Td,null, ""))]))
      : Vazio("Nenhuma conta neste filtro."))
    : (chaves.length ? e(TabelaP,{cols:[{t:"Conta ou cartão"}, {t:"Falta", n:true, w:150}], minW:360}, chaves.map(function(k){ return e(Tr,{key:k}, e(Td,{forte:true}, k), e(Td,{n:true}, R(porConta[k]))); }).concat([e(Tr,{key:"t", total:true}, e(Td,null, "Total"), e(Td,{n:true}, R(sm.falta)))])) : Vazio("Tudo pago neste mês.")),
    edit && e(Editor,{t:"Conta", valor:edit.valor, campos:campos, fechar:function(){ setEdit(null); }, onSalvar:function(v){ gravar("contas", Object.assign({}, v, {mes:v.mes||mes, dia:v.dia||1, valor:v.valor||0}), "c"); }, onExcluir:edit.valor.id ? function(v){ remover("contas", v.id); } : null}));
}

// ---------------- Acessos (senhas ficam escondidas até clicar)
function Acessos(p){
  var s = p.s, f = useState({cat:"Todos", q:""}), flt = f[0], setF = f[1], vs = useState({}), ver = vs[0], setVer = vs[1], ed = useState(null), edit = ed[0], setEdit = ed[1], edp = useState(null), editP = edp[0], setEditP = edp[1], ab = useState("acessos"), aba = ab[0], setAba = ab[1];
  var lista = s.acessos.filter(function(a){ return (flt.cat==="Todos" || a.cat===flt.cat) && (!flt.q || (a.plat+" "+a.login+" "+a.obs).toLowerCase().indexOf(flt.q.toLowerCase())>=0); });
  var campos = [{k:"cat", l:"Grupo", t:"sel", ops:[["Plataformas","Plataformas"],["Bancos","Bancos"]]}, {k:"plat", l:"Plataforma"}, {k:"login", l:"Login / usuário"}, {k:"senha", l:"Senha"}, {k:"obs", l:"Observação", t:"area"}];
  var camposP = [{k:"nome", l:"Nome"}, {k:"link", l:"Link"}];
  var limpar = flt.cat!=="Todos" || flt.q;
  return e("div",{className:"flex flex-col gap-3"},
    Cab("Acessos e senhas", Novo(function(){ if(aba==="acessos") setEdit({cat:"Plataformas", plat:"", login:"", senha:"", obs:""}); else setEditP({nome:"", link:""}); }, aba==="acessos" ? "+ Novo acesso" : "+ Nova planilha")),
    aba==="acessos" && e(BlocoFiltros,{onLimpar:limpar ? function(){ setF({cat:"Todos", q:""}); } : null},
      e(CampoBusca,{id:"ma-q", placeholder:"Plataforma ou login", value:flt.q, onChange:function(v){ setF({cat:flt.cat, q:v}); }}),
      e(CampoSel,{t:"Grupo", id:"ma-cat", value:flt.cat, onChange:function(v){ setF({cat:v, q:flt.q}); }, opcoes:[["Todos","Todos"],["Plataformas","Plataformas"],["Bancos","Bancos"]]})),
    e(FaixaTotais,{itens:[{t:"Acessos", v:String(s.acessos.length)}, {t:"Mostrando", v:String(lista.length)}, {t:"Planilhas", v:String(s.planilhas.length)}]}),
    e(AbasTela,{abas:[["acessos","Logins e senhas"],["planilhas","Planilhas"]], atual:aba, onMudar:setAba}),
    aba==="acessos" ? (lista.length ? e(TabelaP,{cols:[{t:"Plataforma", w:180}, {t:"Login", w:260}, {t:"Senha", w:230}, {t:"Obs."}, COL_ED], minW:900}, lista.map(function(a){ var aberto = !!ver[a.id];
      return e(Tr,{key:a.id}, e(Td,{forte:true}, a.plat),
        e("td",{className:"h-8 border-b border-border px-2.5"}, e("div",{className:"flex items-center gap-1.5"}, e("span",{className:"truncate", title:a.login}, a.login||"—"), a.login && Mini("copiar", function(){ copiar(a.login); }, "Copiar login"))),
        e("td",{className:"h-8 border-b border-border px-2.5"}, a.senha ? e("div",{className:"flex items-center gap-1.5"}, e("span",{className:"truncate tabular-nums"}, aberto ? a.senha : "••••••••"), Mini(aberto ? "ocultar" : "revelar", function(){ var n = Object.assign({}, ver); if(aberto) delete n[a.id]; else n[a.id] = 1; setVer(n); }), Mini("copiar", function(){ copiar(a.senha); }, "Copiar senha")) : "—"),
        e(Td,null, a.obs||""), e("td",{className:"h-8 border-b border-border px-1 text-right"}, Editar(function(){ setEdit(a); }))); })) : Vazio("Nenhum acesso neste filtro."))
    : (s.planilhas.length ? e(TabelaP,{cols:[{t:"Planilha"}, {t:"Link"}, COL_ED], minW:520}, s.planilhas.map(function(pl){ return e(Tr,{key:pl.id}, e(Td,{forte:true}, pl.nome), e("td",{className:"h-8 truncate border-b border-border px-2.5"}, pl.link ? e("a",{href:pl.link, target:"_blank", rel:"noreferrer", className:"underline", title:pl.link}, "Abrir planilha") : "—"), e("td",{className:"h-8 border-b border-border px-1 text-right"}, Editar(function(){ setEditP(pl); }))); })) : Vazio("Nenhuma planilha.")),
    edit && e(Editor,{t:"Acesso", valor:edit, campos:campos, fechar:function(){ setEdit(null); }, onSalvar:function(v){ gravar("acessos", v, "a"); }, onExcluir:edit.id ? function(v){ remover("acessos", v.id); } : null}),
    editP && e(Editor,{t:"Planilha", valor:editP, campos:camposP, fechar:function(){ setEditP(null); }, onSalvar:function(v){ gravar("planilhas", v, "p"); }, onExcluir:editP.id ? function(v){ remover("planilhas", v.id); } : null}));
}

// ---------------- Atividades (kanban)
var COLS = [["nova","Não iniciada","#94A3B8"],["andamento","Em andamento","#60A5FA"],["aprovacao","Aprovação","#FBBF24"],["parada","Parada","#F97316"],["concluida","Concluída","#4ADE80"]];
function Atividades(p){
  var s = p.s, f = useState("Todas"), cat = f[0], setCat = f[1], ed = useState(null), edit = ed[0], setEdit = ed[1];
  var itens = s.atividades.filter(function(a){ return cat==="Todas" || a.cat===cat; });
  var colunas = COLS.map(function(c){ return {k:c[0], titulo:c[1], cor:c[2], itens:itens.filter(function(a){ return a.status===c[0]; })}; });
  var abertas = itens.filter(function(a){ return a.status!=="concluida"; }), urgentes = abertas.filter(function(a){ return a.urg==="Urgente" || a.urg==="Alta"; });
  var campos = [{k:"texto", l:"Atividade", t:"area"}, {k:"urg", l:"Urgência", t:"sel", ops:["Urgente","Alta","Média","Baixa","OK"].map(function(x){ return [x, x]; })}, {k:"cat", l:"Categoria", t:"sel", ops:[["Empresa","Empresa"],["Pessoal","Pessoal"]]}, {k:"quem", l:"Quem está vendo"}, {k:"status", l:"Situação", t:"sel", ops:COLS.map(function(c){ return [c[0], c[1]]; })}, {k:"obs", l:"Observação", t:"area"}];
  return e("div",{className:"flex flex-col gap-3"},
    Cab("Atividades", Novo(function(){ setEdit({texto:"", urg:"Média", cat:"Pessoal", quem:"Marcus", status:"nova", obs:""}); }, "+ Nova atividade")),
    e(BlocoFiltros,{onLimpar:cat!=="Todas" ? function(){ setCat("Todas"); } : null}, e("div",{className:"min-w-0"}, e(Rotulo,{t:"Grupo", id:"mt-cat"}), e(Segmentado,{opcoes:[["Todas","Todas"],["Empresa","Empresa"],["Pessoal","Pessoal"]], atual:cat, onMudar:setCat}))),
    e(FaixaTotais,{itens:[{t:"Abertas", v:String(abertas.length)}, {t:"Urgentes e altas", v:String(urgentes.length), cor:urgentes.length ? COR.sai : ""}, {t:"Concluídas", v:String(itens.length-abertas.length), cor:COR.entra}]}),
    e(Kanban,{colunas:colunas, unidade:["atividade","atividades"], vazio:"Nada nesta etapa.", onAbrir:function(it){ setEdit(it); },
      onMover:function(it, de, para){ gravar("atividades", Object.assign({}, it, {status:para}), "t"); },
      card:function(it){ return e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-[11px] font-semibold", style:{color:URG[it.urg]||"#fff"}}, it.urg+" · "+it.cat), e("p",{className:"break-words text-[13px] leading-snug"}, it.texto.length>150 ? it.texto.slice(0,150)+"…" : it.texto), (it.quem || it.mes) && e("span",{className:"text-[11px]"}, [it.quem, it.mes].filter(Boolean).join(" · "))); }}),
    edit && e(Editor,{t:"Atividade", valor:edit, campos:campos, fechar:function(){ setEdit(null); }, onSalvar:function(v){ gravar("atividades", v, "t"); }, onExcluir:edit.id ? function(v){ remover("atividades", v.id); } : null}));
}

// ---------------- Dados pessoais, empresas, carros
function Dados(p){
  var s = p.s, ed = useState(null), edit = ed[0], setEdit = ed[1], vs = useState({}), ver = vs[0], setVer = vs[1], ab = useState("pessoais"), aba = ab[0], setAba = ab[1];
  var camposPes = [{k:"k", l:"Informação"}, {k:"v", l:"Valor"}];
  var camposEmp = [{k:"nome", l:"Nome curto"}, {k:"razao", l:"Razão social"}, {k:"cnpj", l:"CNPJ"}, {k:"end", l:"Endereço"}, {k:"cep", l:"CEP"}, {k:"ie", l:"Inscrição estadual/municipal"}, {k:"socio", l:"Sócio"}, {k:"cpf", l:"CPF do sócio"}, {k:"email", l:"E-mail"}];
  var camposCar = [{k:"nome", l:"Veículo"}, {k:"ano", l:"Ano"}, {k:"renavam", l:"Renavam"}, {k:"placa", l:"Placa"}, {k:"dono", l:"Proprietário (Marcus = meu carro)"}, {k:"cpf", l:"CPF do proprietário"}];
  var cp = function(t){ return t ? Mini("copiar", function(){ copiar(t); }, "Copiar") : null; };
  var cel = function(t){ return e("td",{className:"h-8 border-b border-border px-2.5"}, e("div",{className:"flex items-center gap-1.5"}, e("span",{className:"truncate tabular-nums", title:t}, t||"—"), cp(t))); };
  var edTd = function(lista, v){ return e("td",{className:"h-8 border-b border-border px-1 text-right"}, Editar(function(){ setEdit({lista:lista, valor:v}); })); };
  var salvarLista = {pessoais:"d", empresas:"e", carros:"v"};
  // empresas no nome do Marcus: só a H&O e a Mayz
  var minhas = s.empresas.filter(function(m){ return /h&o|mayz/i.test((m.nome||"")+" "+(m.razao||"")); });
  var meusCarros = s.carros.filter(function(c){ return /marcus/i.test(c.dono||""); }), carrosFam = s.carros.filter(function(c){ return !/marcus/i.test(c.dono||""); });
  var textoCarros = function(tit, ls){ return neg(tit)+"\n"+ls.map(function(c){ return "• "+neg(c.nome)+(c.ano ? " "+c.ano : "")+" · placa "+neg(c.placa||"—")+" · renavam "+(c.renavam||"—")+" · dono "+neg(c.dono||"—"); }).join("\n"); };
  var texto = function(){ return aba==="pessoais" ? neg("Dados pessoais")+"\n"+s.pessoais.filter(function(d){ return !/e-?cac/i.test(d.k); }).map(function(d){ return d.k+": "+neg(d.v); }).join("\n")
    : aba==="empresas" ? neg("Empresas no meu nome")+"\n"+minhas.map(function(m){ return "• "+neg(m.nome)+(m.razao ? " — "+m.razao : "")+"\nCNPJ "+neg(m.cnpj||"—")+(m.end ? "\n"+m.end : "")+(m.ie ? "\nInscrição "+m.ie : ""); }).join("\n")
    : textoCarros("Meus carros", meusCarros)+"\n\n"+textoCarros("Carros da família", carrosFam); };
  var base = {pessoais:{k:"", v:""}, empresas:{nome:"", razao:"", cnpj:"", end:"", cep:"", ie:"", socio:"Marcus Vinicius Hess de Oliveira", cpf:"", email:""}, carros:{nome:"", ano:"", renavam:"", placa:"", dono:"Marcus", cpf:""}};
  var tabCarros = function(ls){ return e(TabelaP,{cols:[{t:"Veículo"}, {t:"Ano", w:64}, {t:"Placa", w:130}, {t:"Renavam", w:170}, {t:"Proprietário", w:150}, {t:"CPF", w:170}, COL_ED], minW:960}, ls.map(function(c){
    return e(Tr,{key:c.id}, e(Td,{forte:true}, c.nome), e(Td,null, c.ano), cel(c.placa), cel(c.renavam), e(Td,null, c.dono), cel(c.cpf), edTd("carros", c)); })); };
  var corpo = aba==="pessoais" ? e(TabelaP,{cols:[{t:"Informação", w:240}, {t:"Valor"}, COL_ED], minW:520}, s.pessoais.map(function(d){ var sec = /e-?cac/i.test(d.k), aberto = !!ver[d.id];
      return e(Tr,{key:d.id}, e(Td,{forte:true}, d.k), e("td",{className:"h-8 border-b border-border px-2.5"}, e("div",{className:"flex items-center gap-1.5"}, e("span",{className:"truncate tabular-nums", title:sec && !aberto ? "" : d.v}, sec && !aberto ? "••••••••" : d.v), sec && Mini(aberto ? "ocultar" : "revelar", function(){ var n = Object.assign({}, ver); if(aberto) delete n[d.id]; else n[d.id] = 1; setVer(n); }), cp(d.v))), edTd("pessoais", d)); }))
    : aba==="empresas" ? e(TabelaP,{cols:[{t:"Empresa", w:130}, {t:"CNPJ", w:190}, {t:"Sócio", w:200}, {t:"CPF", w:170}, {t:"Endereço"}, {t:"Inscrição", w:130}, COL_ED], minW:1100}, minhas.map(function(m){
      return e(Tr,{key:m.id}, e(Td,{forte:true, title:m.razao}, m.nome), cel(m.cnpj), e(Td,null, m.socio), cel(m.cpf), e(Td,null, m.end), e(Td,null, m.ie), edTd("empresas", m)); }))
    : e("div",{className:"flex flex-col gap-3"}, e(Bloco,{t:"Meus carros"}, tabCarros(meusCarros)), e(Bloco,{t:"Carros da família"}, tabCarros(carrosFam)));
  return e("div",{className:"flex flex-col gap-3"},
    Cab("Dados", [e(BtnCopiar,{key:"c", fn:texto}), e("span",{key:"n"}, Novo(function(){ setEdit({lista:aba, valor:base[aba]}); }, "+ Novo"))]),
    e(FaixaTotais,{itens:[{t:"Dados pessoais", v:String(s.pessoais.length)}, {t:"Empresas", v:String(minhas.length)}, {t:"Meus carros", v:String(meusCarros.length)}, {t:"Carros da família", v:String(carrosFam.length)}]}),
    e(AbasTela,{abas:[["pessoais","Pessoais"],["empresas","Empresas no meu nome"],["carros","Carros"]], atual:aba, onMudar:setAba}),
    corpo,
    e("div",{className:"flex justify-end"}, e(Botao,{title:"Apaga o que foi mexido neste navegador e volta aos dados do arquivo local", onClick:function(){ if(window.confirm("Voltar tudo ao que veio da planilha? O que você lançou depois neste navegador será perdido.")) zerarTudo(); }}, "Voltar aos dados")),
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
  return e(Pagina, null, e("style",null, ESTILO), e("div",{className:"mx flex flex-col gap-3"}, e(p.Comp,{s:s, ir:function(aba){ d({type:"ABA", aba:aba}); }})));
}
var tela = function(Comp){ return function(){ return e(Tela,{Comp:Comp}); }; };
var AbaMarcus = tela(Resumo);
var AbaMarcusFat = tela(Recebimentos);
var AbaMarcusPat = tela(Patrimonio);
var AbaMarcusContas = tela(Contas);
var AbaMarcusAtiv = tela(Atividades);
var AbaMarcusAcessos = tela(Acessos);
var AbaMarcusDados = tela(Dados);
export { ESTILO, BtnCopiar, AbaMarcus, AbaMarcusFat, AbaMarcusPat, AbaMarcusContas, AbaMarcusAtiv, AbaMarcusAcessos, AbaMarcusDados };
