// Sorelly Admin · montagem — pages/MaterialGrafico.js
// Setor MATERIAL GRÁFICO, fase 1 (17/11/2026, Marcus: "menos abas"): menu de 6 palavras — Painel · Compras · Tabela de preços · Estoque · Kits · Vendas.
// Painel, Compras, Tabela de preços e Estoque estão prontos; Kits (padrão e à venda) e Vendas ficam para as fases 2 e 3.
// Os pedidos, a tabela de preços e o estoque são os de Materiais & Estoque (s.ce): aqui o setor só VÊ e USA. O que nasce aqui é o funil de ORÇAMENTOS (domain/material-grafico.js).
// Padrão do Financeiro: bloco azul (BlocoPainel), uma faixa azul no alto, tabela com filtro nas colunas, 11/13 px, sem chips e sem faixa de totais.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { BTN, SEL } from "@/apps/montagem/components/faixa-azul";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ROTULO_STATUS, formatarDia, formatarReais, materialVisto } from "@/apps/montagem/domain/compras-estoque";
import { ETAPAS, MODELOS, ROTULO_ETAPA, descricao, ehCategoriaGrafica, mensagemOrcamento, modeloDe, miles } from "@/apps/montagem/domain/material-grafico";
import { AbaEstoqueMaterial } from "@/apps/montagem/pages/compras/EstoqueCadastros";
import { AbaTabelaPrecos } from "@/apps/montagem/pages/compras/TabelaPrecos";
import { useAcoes } from "@/apps/montagem/pages/compras/janelas";
import { Dialogo, normal, useCompras } from "@/apps/montagem/pages/compras/pecas";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var CAMPO = "h-8 w-full rounded-lg border border-input bg-input/30 px-2 text-center text-[13px] outline-none";
var FINAIS = ["ENTREGUE", "NEGADA", "CANCELADA"];
var porId = function(l, id){ return (l || []).filter(function(x){ return String(x.id)===String(id); })[0] || null; };
var reais = function(v){ return v==null ? "—" : formatarReais(v); };
var prazoTxt = function(d){ return d==null ? "—" : d+(d===1 ? " dia" : " dias"); };

// o fornecedor "Office Graff" (com ou sem o nome da pessoa na frente) é o principal do setor
var ehOffice = function(nome){ return /office\s*graf/i.test(String(nome || "")); };
function fornecedoresDoSetor(ce){ return (ce.fornecedores || []).filter(function(f){ return f.ativo!==false; }); }
function useGf(){
  var c = useCompras(), x = c.ce, ops = c.opera || c.dir;
  var exec = function(op, dados){ return c.exec(Object.assign({op:op}, dados || {})); };
  return {c:c, ce:x, orc:(x.orcamentos || []), pode:ops, exec:exec, forn:fornecedoresDoSetor(x)};
}
var nomeForn = function(ce, id){ var f = porId(ce.fornecedores, id); return f ? normal(f.nome) : "Sem fornecedor"; };

// pedido de Materiais e estoque que é do setor gráfico: veio de um orçamento, é de fornecedor gráfico ou leva material de categoria gráfica
function pedidoGrafico(ce, p){
  if(String(p.observacao || "").indexOf("Material gráfico")>=0 || ehOffice(p.fornecedorNome)) return true;
  return (p.itens || []).some(function(i){ var m = i.materialId!=null ? porId(ce.materiais, i.materialId) : null, cat = m ? porId(ce.matCategorias, m.categoriaId) : null; return cat && ehCategoriaGrafica(cat.nome); });
}

function Rodape(p){ return e("div",{className:"flex flex-wrap justify-center gap-2"}, p.children); }
function BtnJ(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, className:"h-8 whitespace-nowrap rounded-md border border-border bg-card px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40 "+(p.className || "")}, p.children); }   // padrao-ok: botão do padrão de janelas das Compras
function Rot(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-white "+(p.className || "")}, p.t, p.children); }

async function copiar(c, texto){
  try{ await navigator.clipboard.writeText(texto); c.aviso("Mensagem copiada. É só colar no chat.", "ok"); }
  catch(err){ c.aviso("Não deu para copiar sozinho: selecione o texto e copie."); }
}

// ───────────── janela: novo orçamento ─────────────
function JanelaNovoOrcamento(p){
  var g = p.g, ini = g.forn.filter(function(f){ return ehOffice(f.nome); })[0];
  var s1 = useState("tag"), modeloId = s1[0], s2 = useState({}), campos = s2[0], s3 = useState(""), qtd = s3[0], s4 = useState(ini ? String(ini.id) : ""), fid = s4[0], s5 = useState(""), prazo = s5[0], s6 = useState(""), obs = s6[0];
  var m = modeloDe(modeloId), rascunho = {modeloId:modeloId, campos:campos, quantidade:Number(String(qtd).replace(/\./g, "")) || 0, prazoDesejado:prazo, obs:obs};
  var msg = mensagemOrcamento(rascunho, fid ? nomeForn(g.ce, fid) : "");
  var criar = function(){
    var ok = g.exec("orc_add", {modeloId:modeloId, campos:campos, quantidade:qtd, fornecedorId:fid || null, prazoDesejado:prazo, obs:obs});
    if(ok){ copiar(g.c, msg); p.fechar(); }
  };
  return e(Dialogo,{t:"Novo orçamento", sub:"Escolha o tipo, preencha e copie a mensagem para o chat", fechar:p.fechar, tam:"max-w-2xl",
    rodape:[e(BtnJ,{key:"c", onClick:p.fechar}, "Cancelar"), e(BtnJ,{key:"s", onClick:criar, disabled:!g.pode || !(Number(qtd)>0), className:"!bg-white !text-[#14233f]"}, "Criar e copiar mensagem")]},
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
      e(Rot,{t:"Tipo de material"}, e("select",{value:modeloId, className:CAMPO, onChange:function(ev){ s1[1](ev.target.value); s2[1]({}); }}, MODELOS.map(function(o){ return e("option",{key:o.id, value:o.id}, o.nome); }))),
      e(Rot,{t:"Fornecedor"}, e("select",{value:fid, className:CAMPO, onChange:function(ev){ s4[1](ev.target.value); }}, e("option",{value:""}, "Sem fornecedor definido"), g.forn.map(function(f){ return e("option",{key:f.id, value:String(f.id)}, normal(f.nome)); }))),
      m.campos.map(function(cp){ return e(Rot,{key:modeloId+cp.k, t:cp.rot}, cp.ops
        ? e("select",{value:campos[cp.k] || "", className:CAMPO, onChange:function(ev){ var n = Object.assign({}, campos); n[cp.k] = ev.target.value; s2[1](n); }}, e("option",{value:""}, "Selecione"), cp.ops.map(function(o){ return e("option",{key:o, value:o}, o); }))
        : e("input",{type:"text", value:campos[cp.k] || "", placeholder:cp.ph || "", className:CAMPO, onChange:function(ev){ var n = Object.assign({}, campos); n[cp.k] = ev.target.value; s2[1](n); }})); }),
      e(Rot,{t:"Quantidade"}, e("input",{type:"number", min:1, value:qtd, placeholder:"Ex.: 5000", className:CAMPO, onChange:function(ev){ s3[1](ev.target.value); }})),
      e(Rot,{t:"Prazo desejado"}, e("input",{type:"text", value:prazo, placeholder:"Ex.: até 20/12", className:CAMPO, onChange:function(ev){ s5[1](ev.target.value); }})),
      e(Rot,{t:"Observação", className:"sm:col-span-2"}, e("input",{type:"text", value:obs, className:CAMPO, onChange:function(ev){ s6[1](ev.target.value); }}))),
    e(Rot,{t:"Mensagem para o chat"}, e("textarea",{readOnly:true, value:msg, rows:7, className:"w-full rounded-lg border border-input bg-input/30 p-2 text-left text-[13px] outline-none"})));
}

// ───────────── janela: ficha do orçamento (mensagem, rodadas, fechar, pedido) ─────────────
function JanelaOrcamento(p){
  var g = p.g, o = porId(g.orc, p.id);
  var s1 = useState(""), vu = s1[0], s2 = useState(""), pz = s2[0], s3 = useState(""), ob = s3[0], s4 = useState(""), quem = s4[0];
  if(!o) return null;
  var emNeg = o.etapa==="ORCAMENTO" || o.etapa==="NEGOCIANDO", ped = o.pedidoId!=null ? porId(g.ce.pedidos, o.pedidoId) : null;
  var msg = mensagemOrcamento(o, o.fornecedorId ? nomeForn(g.ce, o.fornecedorId) : "");
  var rodada = function(){ if(g.exec("orc_rodada", {id:o.id, valorUnit:vu, prazoDias:pz, obs:ob, quem:quem})){ s1[1](""); s2[1](""); s3[1](""); } };
  var linhas = o.rodadas.map(function(r){ return {id:r.n, n:r.n, quando:formatarDia(String(r.em).slice(0, 10)), valor:reais(r.valorUnit), total:reais(Math.round(r.valorUnit*o.quantidade*100)/100), prazo:prazoTxt(r.prazoDias), quem:r.quem || r.por, obs:r.obs || "—"}; });
  var botoes = [];
  if(emNeg) botoes.push(e(BtnJ,{key:"f", onClick:function(){ g.exec("orc_fechar", {id:o.id}); }, disabled:!g.pode || !o.rodadas.length, className:"!bg-white !text-[#14233f]"}, "Fechar com a última rodada"));
  if(o.etapa==="FECHADO") botoes.push(e(BtnJ,{key:"p", onClick:function(){ if(g.exec("orc_pedido", {id:o.id})) p.fechar(); }, disabled:!g.pode, className:"!bg-white !text-[#14233f]"}, "Criar pedido em Compras"));
  if(o.etapa==="FECHADO" || o.etapa==="CANCELADO") botoes.push(e(BtnJ,{key:"r", onClick:function(){ g.exec("orc_reabrir", {id:o.id}); }, disabled:!g.pode}, "Reabrir"));
  if(o.etapa!=="PEDIDO" && o.etapa!=="CANCELADO") botoes.push(e(BtnJ,{key:"x", onClick:function(){ if(window.confirm("Cancelar este orçamento?")) g.exec("orc_cancelar", {id:o.id}); }, disabled:!g.pode}, "Cancelar orçamento"));
  botoes.push(e(BtnJ,{key:"z", onClick:p.fechar}, "Fechar janela"));
  return e(Dialogo,{t:"Orçamento #"+o.id, sub:descricao(o)+" · "+miles(o.quantidade)+" unidades", fechar:p.fechar, tam:"max-w-3xl", rodape:botoes},
    e("div",{className:"flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px]"},
      e("span",null, "Etapa: ", e("b",null, ROTULO_ETAPA[o.etapa])), e("span",null, "Fornecedor: ", e("b",null, o.fornecedorId ? nomeForn(g.ce, o.fornecedorId) : "Sem fornecedor")),
      o.prazoDesejado && e("span",null, "Prazo desejado: ", e("b",null, o.prazoDesejado)),
      o.final && e("span",null, "Fechado: ", e("b",null, reais(o.final.valorUnit)+" por unidade · total "+reais(o.final.total)+" · prazo "+prazoTxt(o.final.prazoDias))),
      ped && e("span",null, "Pedido #"+ped.id+": ", e("b",null, ROTULO_STATUS[ped.status] || ped.status))),
    e(Rot,{t:"Mensagem enviada ao fornecedor"}, e("textarea",{readOnly:true, value:msg, rows:6, className:"w-full rounded-lg border border-input bg-input/30 p-2 text-left text-[13px] outline-none"})),
    e(Rodape,null, e(BtnJ,{onClick:function(){ copiar(g.c, msg); }}, "Copiar mensagem")),
    e(Rot,{t:"Rodadas de negociação"}, linhas.length
      ? e(TabelaPlanilha,{chave:"id", semContagem:true, semFiltro:true, compacta:true, linhas:linhas, cols:[{k:"n", t:"Rodada"}, {k:"quando", t:"Data"}, {k:"valor", t:"Valor unitário"}, {k:"total", t:"Total"}, {k:"prazo", t:"Prazo"}, {k:"quem", t:"Quem"}, {k:"obs", t:"Observação"}]})
      : e("span",{className:"text-[13px] normal-case"}, "Nenhuma resposta registrada ainda.")),
    emNeg && e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-4"},
      e(Rot,{t:"Valor unitário (R$)"}, e("input",{type:"text", inputMode:"decimal", value:vu, placeholder:"Ex.: 1,43", className:CAMPO, onChange:function(ev){ s1[1](ev.target.value); }})),
      e(Rot,{t:"Prazo (dias)"}, e("input",{type:"text", inputMode:"numeric", value:pz, placeholder:"Ex.: 20", className:CAMPO, onChange:function(ev){ s2[1](ev.target.value); }})),
      e(Rot,{t:"Quem respondeu"}, e("input",{type:"text", value:quem, className:CAMPO, onChange:function(ev){ s4[1](ev.target.value); }})),
      e(Rot,{t:"Observação"}, e("input",{type:"text", value:ob, className:CAMPO, onChange:function(ev){ s3[1](ev.target.value); }})),
      e("div",{className:"col-span-2 flex justify-center sm:col-span-4"}, e(BtnJ,{onClick:rodada, disabled:!g.pode || vu===""}, "Registrar resposta do fornecedor"))));
}

// ───────────── COMPRAS: funil de orçamentos ─────────────
function AbaGfCompras(){
  var g = useGf(), s1 = useState(""), fForn = s1[0], s2 = useState(""), fTipo = s2[0], s3 = useState(false), novo = s3[0], s4 = useState(null), aberto = s4[0], s5 = useState(false), cancel = s5[0];
  var ac = useAcoes(g.c);
  var lista = g.orc.filter(function(o){ return (cancel || o.etapa!=="CANCELADO") && (!fForn || String(o.fornecedorId)===fForn) && (!fTipo || o.modeloId===fTipo); });
  var sel = function(rot, v, set, ops){ return e("select",{"aria-label":rot, value:v, onChange:function(ev){ set(ev.target.value); }, className:SEL+" w-auto max-w-[11rem] shrink-0"}, e("option",{value:""}, rot), ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
  var fornUsados = g.forn.filter(function(f){ return g.orc.some(function(o){ return String(o.fornecedorId)===String(f.id); }); });
  var faixa = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    sel("Todos os fornecedores", fForn, s1[1], fornUsados.map(function(f){ return [String(f.id), normal(f.nome)]; })),
    sel("Todos os tipos", fTipo, s2[1], MODELOS.map(function(m){ return [m.id, m.nome]; })),
    e("button",{type:"button", onClick:function(){ s5[1](!cancel); }, className:BTN}, cancel ? "Esconder cancelados" : "Ver cancelados"),
    e("button",{type:"button", onClick:function(){ s3[1](true); }, className:BTN+" !bg-white !text-[#14233f] ml-auto shrink-0"}, "Novo orçamento"));
  var etapas = ETAPAS.concat(cancel ? ["CANCELADO"] : []);
  var colunas = e("div",{className:"grid gap-2 p-2 "+(cancel ? "grid-cols-5" : "grid-cols-4")}, etapas.map(function(et){
    var cs = lista.filter(function(o){ return o.etapa===et; });
    return e("div",{key:et, className:"flex min-w-0 flex-col gap-1.5"},
      e("div",{className:"rounded-md bg-[var(--bloco-colunas)] px-2 py-1 text-center text-[11px] font-bold uppercase"}, ROTULO_ETAPA[et]+" · "+cs.length),
      cs.length ? cs.map(function(o){
        var ped = o.pedidoId!=null ? porId(g.ce.pedidos, o.pedidoId) : null, ult = o.rodadas[o.rodadas.length-1], ref = o.final || ult;
        return e("button",{key:o.id, type:"button", onClick:function(){ s4[1](o.id); }, className:"flex min-w-0 flex-col gap-0.5 rounded-md border border-white/30 bg-card/60 p-1.5 text-center hover:bg-white/10"},
          e("span",{className:"break-words text-[13px] font-semibold leading-tight"}, descricao(o)),
          e("span",{className:"text-[11px]"}, miles(o.quantidade)+" un · "+nomeForn(g.ce, o.fornecedorId)),
          ref && e("span",{className:"text-[11px]"}, reais(ref.valorUnit)+" · "+prazoTxt(ref.prazoDias)),
          ped && e("span",{className:"text-[11px]"}, "Pedido #"+ped.id+" · "+(ROTULO_STATUS[ped.status] || ped.status)));
      }) : e("div",{className:"py-3 text-center text-[11px]"}, "Nada aqui"));
  }));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Funil de compras · material gráfico", compacto:true}, faixa, colunas),
    novo && e(JanelaNovoOrcamento,{g:g, fechar:function(){ s3[1](false); }}),
    aberto!=null && e(JanelaOrcamento,{g:g, id:aberto, fechar:function(){ s4[1](null); }}),
    ac.janelas && ac.janelas());
}

// ───────────── PAINEL: o que está andando no setor ─────────────
function AbaGfPainel(){
  var g = useGf(), s = g.c.s, ce = g.ce, ac = useAcoes(g.c), sj = useState(null), orcAberto = sj[0];
  var linhas = [];
  g.orc.filter(function(o){ return ["ORCAMENTO", "NEGOCIANDO", "FECHADO"].indexOf(o.etapa)>=0; }).forEach(function(o){ var ref = o.final || o.rodadas[o.rodadas.length-1];
    linhas.push({id:"o"+o.id, tipo:"Orçamento", item:descricao(o), forn:nomeForn(ce, o.fornecedorId), situacao:ROTULO_ETAPA[o.etapa], valor:ref ? reais(Math.round(ref.valorUnit*o.quantidade*100)/100) : "—", prazo:ref ? prazoTxt(ref.prazoDias) : "—", abrir:function(){ sj[1](o.id); }}); });
  (ce.pedidos || []).filter(function(p){ return FINAIS.indexOf(p.status)<0 && pedidoGrafico(ce, p); }).forEach(function(p){
    linhas.push({id:"p"+p.id, tipo:"Pedido", item:normal(p.titulo), forn:normal(p.fornecedorNome) || "Sem fornecedor", situacao:ROTULO_STATUS[p.status] || p.status, valor:reais(p.valorCompra!=null ? p.valorCompra : (p.valorEstimado || null)), prazo:p.previsaoEntrega ? formatarDia(p.previsaoEntrega) : "—", abrir:function(){ ac.abrir(p.id); }}); });
  (ce.materiais || []).forEach(function(m){ var cat = porId(ce.matCategorias, m.categoriaId); if(!cat || !ehCategoriaGrafica(cat.nome) || m.parado) return; var v = materialVisto(s, m);
    if(v.status==="OK") return;
    linhas.push({id:"m"+m.id, tipo:"Estoque", item:normal(m.material), forn:normal(v.fornecedor) || "Sem fornecedor", situacao:(v.status==="CRITICO" ? "Crítico" : "Atenção")+" · "+miles(v.estoqueAtual)+" de "+miles(v.estoqueMinimo)+" mínimo", valor:"—", prazo:"—", abrir:null}); });
  var cols = [{k:"tipo", t:"Tipo"}, {k:"item", t:"Item"}, {k:"forn", t:"Fornecedor"}, {k:"situacao", t:"Situação"}, {k:"valor", t:"Valor"}, {k:"prazo", t:"Prazo"}];
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Painel · material gráfico", compacto:true},
      e(TabelaPlanilha,{key:"gfpainel", cols:cols, linhas:linhas, chave:"id", semContagem:true, limite:200, aoClicar:function(l){ if(l.abrir) l.abrir(); }, vazio:"Nada em andamento no material gráfico."})),
    orcAberto!=null && e(JanelaOrcamento,{g:g, id:orcAberto, fechar:function(){ sj[1](null); }}),
    ac.janelas && ac.janelas());
}

// ───────────── TABELA DE PREÇOS e ESTOQUE: as mesmas telas de Materiais e estoque ─────────────
function Tela(t, sub, corpo){ return e("div",{className:"flex flex-col gap-2.5"}, e(PageHead,{t:t, sub:sub}), corpo); }
function AbaGfPrecos(){ return e(AbaTabelaPrecos,null); }
function AbaGfEstoque(){ return e(AbaEstoqueMaterial,{soGrafico:true}); }   // o bloco azul já tem o título; sem PageHead por cima (Marcus, 17/11/2026)
function EmBreve(t, txt){ return Tela(t, txt, e("div",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 p-6 text-center text-[13px]"}, "Em breve.")); }
function AbaGfKits(){ return EmBreve("Kits", "Fase 2: kits padrão (com custo) e kits à venda (com preço e margem)."); }
function AbaGfVendas(){ return EmBreve("Vendas", "Fase 3: venda de material gráfico."); }

export { AbaGfPainel, AbaGfCompras, AbaGfPrecos, AbaGfEstoque, AbaGfKits, AbaGfVendas };
