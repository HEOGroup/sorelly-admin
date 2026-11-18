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
import { foto, fotoDoMaterial, novosMateriais, fotoEhReferencia, fotoDoOrcamento, fotoDoPedido, fotosExtras, gruposDoCatalogo, materialDoItem, materialDoModelo, modeloDoNome, nomePadrao, ORDEM_TIPOS, precoDoMaterial, producaoDoMaterial, tipoDoMaterial } from "@/apps/montagem/domain/catalogo-grafico";
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
var reaisUnit = function(v){ return v==null ? "—" : "R$ "+Number(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:3}); };   // preço unitário: até 3 casas (R$ 1,298)
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
        var pst = ped ? (ROTULO_STATUS[ped.status] || ped.status) : "";
        return e(CardMaterial,{key:o.id, titulo:descricao(o), sub:miles(o.quantidade)+" unidades · "+nomeForn(g.ce, o.fornecedorId), foto:fotoDoOrcamento(o), aoClicar:function(){ s4[1](o.id); }, dica:"Abrir o orçamento",
          dados:ref ? [{r:"Valor", v:reais(ref.valorUnit)+" cada"}, {r:"Prazo", v:prazoTxt(ref.prazoDias)}] : [{r:"Sem proposta ainda", v:""}],
          sit:ped ? {t:"Pedido #"+ped.id, d:pst, cls:"text-success"} : null});
      }) : e("div",{className:"py-3 text-center text-[11px]"}, "Nada aqui"));
  }));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Funil de compras · material gráfico", compacto:true}, faixa, colunas),
    novo && e(JanelaNovoOrcamento,{g:g, fechar:function(){ s3[1](false); }}),
    aberto!=null && e(JanelaOrcamento,{g:g, id:aberto, fechar:function(){ s4[1](null); }}),
    ac.janelas && ac.janelas());
}

// Quadro de foto. Passar o mouse mostra a foto GRANDE logo abaixo (ou acima, se faltar espaço); clicar abre a foto numa janela com o X para fechar (Marcus, 18/11/2026).
function QuadroFoto(p){
  var t = p.tam || 88, h = useState(null), pos = h[0], setPos = h[1], j = useState(false), aberta = j[0], setAberta = j[1];
  var mostra = function(ev){ if(!p.url) return; var r = ev.currentTarget.getBoundingClientRect(), G = 380, abaixo = r.bottom+G+16 < window.innerHeight; setPos({top:abaixo ? r.bottom+6 : Math.max(8, r.top-G-14), left:Math.max(8, Math.min(window.innerWidth-G-16, r.left+r.width/2-G/2))}); };
  var caixa = e("div",{onMouseEnter:mostra, onMouseLeave:function(){ setPos(null); }, onClick:p.url && !p.semClique ? function(ev){ ev.stopPropagation(); setPos(null); setAberta(true); } : undefined, 
    className:"mx-auto grid shrink-0 place-items-center overflow-hidden rounded-md bg-white/5 "+(p.cheia ? "self-stretch p-px " : "p-1 ")+(p.compacto ? "" : "my-1.5 ")+(p.url && !p.semClique ? " cursor-zoom-in" : ""), style:p.cheia ? {width:t+"px"} : {width:t+"px", height:t+"px"}, title:p.url && p.daRef ? "Foto de referência (modelo parecido)" : (p.url && !p.semClique ? "Clique para ampliar" : undefined)},
    p.url ? e("img",{src:p.url, alt:p.alt || "", loading:"lazy", style:p.cheia ? {maxWidth:(t-2)+"px", height:"100%", maxHeight:"100%"} : {maxWidth:(t-8)+"px", maxHeight:(t-8)+"px"}, className:p.cheia ? "w-auto object-contain" : "h-auto w-auto object-contain"}) : e("span",{className:"text-[13px] leading-none", title:"Sem foto"}, "×"));
  return e("span",{className:"contents"}, caixa,
    pos && e("div",{className:"pointer-events-none fixed z-50 grid place-items-center rounded-lg border-2 border-[var(--bloco-titulo)] bg-card p-2 shadow-2xl", style:{top:pos.top+"px", left:pos.left+"px", width:"364px", height:"364px"}}, e("img",{src:p.url, alt:p.alt || "", className:"max-h-full max-w-full object-contain"})),
    aberta && e(Dialogo,{t:p.alt || "Foto", fechar:function(){ setAberta(false); }, tam:"max-w-3xl"}, e("div",{className:"grid place-items-center p-2"}, e("img",{src:p.url, alt:p.alt || "", className:"max-h-[75vh] w-auto max-w-full object-contain"}))));
}
// CARD do material gráfico (Marcus, 18/11/2026): a mesma peça no Painel e no funil de Compras.
// Foto à esquerda; à direita, alinhado à esquerda: nome, fornecedor, números e a situação (bolinha na cor do estado, sem barra colorida).
// Letra de 10 px nos detalhes: o Marcus pediu fonte bem menor dentro do card (exceção padrao-ok, 18/11/2026).
var DOT = {"text-pink-300":"bg-pink-300", "text-white":"bg-slate-300", "text-success":"bg-success", "text-warning":"bg-warning", "text-orange-400":"bg-orange-400", "text-destructive":"bg-destructive"};
function CardMaterial(p){
  var quebra = {whiteSpace:"normal", overflowWrap:"normal", wordBreak:"normal", lineHeight:"1.25"};
  var q1 = useState(false), fotoAberta = q1[0], acao = p.aoClicar || (p.foto ? function(){ q1[1](true); } : null), clica = !!acao;   // sem ação própria, clicar no card amplia a foto
  var nl = nomePadrao(p.titulo), tit = nl[1] ? nl[0]+" / "+nl[1] : nl[0];   // nome padronizado em 2 linhas: "Tag Man / Mini" e "Azul / Padrão"
  var detalhes = p.sit ? (Array.isArray(p.sit.d) ? p.sit.d : (p.sit.d ? [p.sit.d] : [])) : [];
  var dadosEl = p.dados && e("div",{className:"flex flex-wrap gap-x-3 text-[10px]"}, p.dados.map(function(d){ return e("span",{key:d.r}, d.r+" ", e("b",{className:"tabular-nums "+(d.cls || "")}, d.v)); }));   // padrao-ok: card compacto, fonte menor pedida pelo Marcus
  var sitEl = p.sit && e("div",{className:"flex items-start gap-1 text-[10px]"}, e("span",{className:"mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full "+(DOT[p.sit.cls] || "bg-white/40")}), e("span",{}, e("b",{className:p.sit.cls}, p.sit.t), detalhes.length ? " · "+detalhes.join(" · ") : ""));   // padrao-ok: card compacto, fonte menor pedida pelo Marcus
  var linha = "border-l border-white/25 pl-2.5";   // linha fina entre o nome, a quantidade e a análise
  var wide = e("div",{className:"grid min-w-0 flex-1 items-stretch gap-x-0 py-0.5 text-left md:justify-start", style:Object.assign({}, quebra, {gridTemplateColumns:p.grade || "11rem 7.5rem 12.5rem"})},
    e("div",{className:"flex min-w-0 flex-col justify-center gap-0.5 pr-2"}, e("span",{className:"text-[11px] font-semibold"}, nl[0]), nl[1] && e("span",{className:"text-[11px] font-semibold"}, nl[1]), p.sub && e("span",{className:"text-[10px]"}, p.sub), p.extra && e("span",{className:"text-[10px]"}, e("b",{className:p.extra.cls}, p.extra.t))),   // padrao-ok: card compacto, fonte menor pedida pelo Marcus
    e("div",{className:"flex min-w-0 flex-col justify-center gap-0.5 pr-2 text-[10px] "+linha}, (p.dados || []).map(function(d){ return e("span",{key:d.r}, d.r+" ", e("b",{className:"tabular-nums "+(d.cls || "")}, d.v)); })),   // padrao-ok: card compacto, fonte menor pedida pelo Marcus
    e("div",{className:"flex min-w-0 flex-col justify-center gap-0.5 text-[10px] "+linha}, p.sit && e("span",{className:"flex items-start gap-1"}, e("span",{className:"mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full "+(DOT[p.sit.cls] || "bg-white/40")}), e("b",{className:p.sit.cls}, p.sit.t)), detalhes.map(function(t){ return e("span",{key:t, className:"pl-2.5"}, t); })));   // padrao-ok: card compacto, fonte menor pedida pelo Marcus
  var cartao = e("div",{role:clica ? "button" : undefined, tabIndex:clica ? 0 : undefined, title:p.dica || (clica ? "Ampliar a foto" : undefined), onClick:clica ? acao : undefined,
    style:{background:p.fundo || "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)"}, className:"flex min-w-0 items-stretch gap-3 rounded-lg border-2 p-0.5 "+(p.borda || "border-white/25")+" shadow-[0_2px_5px_rgba(0,0,0,0.35)]"+(clica ? " cursor-pointer select-none transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.28)] active:translate-y-0 active:shadow-[0_1px_3px_rgba(0,0,0,0.6)]" : "")},
    e(QuadroFoto,{url:p.foto, alt:p.titulo, tam:40, compacto:true, cheia:true, daRef:p.fotoRef}),
    wide);
  return e("div",{className:"contents"}, cartao, fotoAberta && e(Dialogo,{t:p.titulo, fechar:function(){ q1[1](false); }, tam:"max-w-3xl"}, e("div",{className:"grid place-items-center p-2"}, e("img",{src:p.foto, alt:p.titulo, className:"max-h-[75vh] w-auto max-w-full object-contain"}))));
}
// ───────────── PAINEL: o que está andando no setor ─────────────
function AbaGfPainel(){
  var g = useGf(), s = g.c.s, ce = g.ce, ac = useAcoes(g.c);
  var m2 = useState(""), fCat = m2[0], m3 = useState({}), mais = m3[0], m4 = useState(null), orcAberto = m4[0], m5 = useState(""), fFoto = m5[0], m6 = useState(""), fCol = m6[0], m8 = useState(""), ordem = m8[0], m9 = useState(""), fMod = m9[0], m7 = useState(function(){ try { return localStorage.getItem("sorelly_gf_parados")==="1"; } catch(x){ return false; } }), mostrarPar = m7[0], m13 = useState(function(){ try { return localStorage.getItem("sorelly_gf_vazias")==="1"; } catch(x){ return false; } }), fecharVazias = m13[0];
  var alternaVazias = function(){ var n = !fecharVazias; m13[1](n); try { localStorage.setItem("sorelly_gf_vazias", n ? "1" : "0"); } catch(x){} };
  var alterna = function(){ var n = !mostrarPar; m7[1](n); try { localStorage.setItem("sorelly_gf_parados", n ? "1" : "0"); } catch(x){} };
  // KANBAN POR NÍVEL DE ESTOQUE (Marcus, 18/11/2026): cada material é um card; ele anda da esquerda para a direita conforme o estoque cai.
  // Sem estoque (zero) -> Abaixo do mínimo -> Perto do mínimo (até 130% do mínimo) -> OK, que fica na ÚLTIMA coluna, à direita. Material sem mínimo definido fica em OK.
  // ANTES do estoque, duas colunas do FLUXO de compra, em LARGURA TOTAL (2 por linha): SOLICITADO AO FINANCEIRO (pedido esperando aprovação e orçamentos abertos) e PRODUZINDO (pedido aprovado, em transporte ou recebido). Material que já tem pedido vai para elas; as outras colunas são só o que ainda precisa de ação.
  var COLUNAS = [{k:"parado", t:"Não pedir mais", grade:"11rem 7.2rem 9.5rem", larg:"33rem", cor:"bg-slate-400", txt:"text-white", borda:"border-slate-400/40", fundo:"linear-gradient(135deg, rgba(148,163,184,0.16) 0%, rgba(148,163,184,0.03) 100%)"}, {k:"novo", t:"Novos materiais", grade:"11rem 8.5rem 11rem", larg:"34rem", txt:"text-pink-300", borda:"border-pink-400/45", fundo:"linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(244,114,182,0.03) 100%)", fluxo:true}, {k:"orc", t:"Solicitado ao financeiro", grade:"11rem 7.2rem 11rem", larg:"34rem", txt:"text-sky-300", borda:"border-sky-400/45", fundo:"linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.03) 100%)", fluxo:true}, {k:"prod", t:"Produzindo", grade:"11rem 7.2rem 12.3rem", larg:"35.5rem", txt:"text-violet-300", borda:"border-violet-400/45", fundo:"linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.03) 100%)", fluxo:true}, {k:"zero", t:"Sem estoque", grade:"11rem 7.2rem 9.5rem", larg:"33rem", cor:"bg-destructive", txt:"text-destructive", borda:"border-destructive/45", fundo:"linear-gradient(135deg, rgba(248,113,113,0.22) 0%, rgba(248,113,113,0.03) 100%)"}, {k:"abaixo", t:"Abaixo do mínimo", grade:"11rem 7.2rem 9.5rem", larg:"33rem", cor:"bg-orange-500", txt:"text-orange-400", borda:"border-orange-500/45", fundo:"linear-gradient(135deg, rgba(249,115,22,0.22) 0%, rgba(249,115,22,0.03) 100%)"}, {k:"perto", t:"Perto do mínimo", grade:"11rem 7.2rem 9.5rem", larg:"33rem", cor:"bg-warning", txt:"text-warning", borda:"border-warning/45", fundo:"linear-gradient(135deg, rgba(232,184,75,0.2) 0%, rgba(232,184,75,0.03) 100%)"}, {k:"ok", t:"Estoque OK", grade:"11rem 7.2rem 9.5rem", larg:"33rem", cor:"bg-success", txt:"text-success", borda:"border-success/40", fundo:"linear-gradient(135deg, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0.03) 100%)"}];
  var cards = [];
  (ce.materiais || []).forEach(function(m){ var cat = porId(ce.matCategorias, m.categoriaId); if(!cat || !ehCategoriaGrafica(cat.nome) ) return;
    var v = materialVisto(s, m), saldo = Number(v.estoqueAtual) || 0, minimo = Number(v.estoqueMinimo) || 0, forn = normal(v.fornecedor) || "Sem fornecedor";
    if(fCat && tipoDoMaterial(m, cat.nome)!==fCat) return;
    if(m.parado){ cards.push({id:m.id, col:"parado", nome:normal(m.material), forn:forn, foto:fotoDoMaterial(ce, m), fotoRef:fotoEhReferencia(ce, m), saldo:saldo, minimo:minimo, sit:{t:"Não pedir mais", cls:"text-white", d:["pode voltar a pedir"]}, pedido:null}); return; }   // parado: fica na última coluna, fora do que precisa de compra
    if(producaoDoMaterial(ce, m).pedidos.length) return;   // já tem pedido: aparece em Orçamento ou Produzindo
    var col = minimo<=0 ? "ok" : saldo<=0 ? "zero" : v.status==="CRITICO" ? "abaixo" : v.status==="ATENCAO" ? "perto" : "ok";
    var sit = col==="zero" ? {t:"Repor agora", cls:"text-destructive", d:["sem pedido aberto"]} : col==="abaixo" ? {t:"Repor agora", cls:"text-orange-400", d:["sem pedido aberto"]} : col==="perto" ? {t:"Repor em breve", cls:"text-warning", d:["sem pedido aberto"]} : {t:"Estoque OK", cls:"text-success", d:["sem pedido aberto"]};   // quem já tem pedido aberto está nas colunas do fluxo
    cards.push({id:m.id, col:col, nome:normal(m.material), forn:forn, foto:fotoDoMaterial(ce, m), fotoRef:fotoEhReferencia(ce, m), saldo:saldo, minimo:minimo, sit:sit, pedido:null}); });
  // cards do fluxo: um por item de pedido aberto e um por orçamento aberto. Cada card mostra também o NÍVEL DE ESTOQUE do material (ex.: "Estoque 0 · Sem estoque"), porque a mesma tag pode estar abaixo do mínimo e já ter pedido.
  var nivelDe = function(v){ var saldo = Number(v.estoqueAtual) || 0, minimo = Number(v.estoqueMinimo) || 0, col = minimo<=0 ? "ok" : saldo<=0 ? "zero" : v.status==="CRITICO" ? "abaixo" : v.status==="ATENCAO" ? "perto" : "ok", r = {zero:["Sem estoque", "text-destructive"], abaixo:["Abaixo do mínimo", "text-orange-400"], perto:["Perto do mínimo", "text-warning"], ok:["Estoque OK", "text-success"]}[col]; return {t:"Estoque "+miles(saldo)+" · "+r[0], cls:r[1]}; };
  var ORC_PED = ["NAO_VERIFICADA", "AGUARDANDO_ORCAMENTO", "AGUARDANDO"];
  var linhaPed = function(p){ return "Pedido "+(p.solicitadoEm ? formatarDia(p.solicitadoEm) : "—")+(p.solicitante ? " por "+p.solicitante : ""); };
  var quemPed = function(p){ return p.previsaoEntrega ? "Previsão "+formatarDia(p.previsaoEntrega).slice(0, 5) : "Sem previsão"; };
  var passa = function(forn, titulo){ if(fCat && tipoDoMaterial({material:titulo}, "")!==fCat) return false; return true; };
  (ce.pedidos || []).filter(function(p){ return FINAIS.indexOf(p.status)<0 && pedidoGrafico(ce, p); }).forEach(function(p){
    var forn = normal(p.fornecedorNome) || "Sem fornecedor", col = ORC_PED.indexOf(p.status)>=0 ? "orc" : "prod";
    (p.itens || []).forEach(function(i, ix){ var nome = normal(i.titulo || p.titulo); if(!passa(forn, i.titulo || p.titulo)) return;
      var mat = materialDoItem(ce, i), v = mat ? materialVisto(s, mat) : null, q = Number(i.quantidade) || 0, valor = i.valorUnitario!=null ? Math.round(q*Number(i.valorUnitario)*100)/100 : null;
      var dados = [{r:"Quantidade", v:miles(q)}]; if(i.valorUnitario!=null) dados.push({r:"Unitário", v:reaisUnit(Number(i.valorUnitario))}); if(valor!=null) dados.push({r:"Valor", v:reais(valor)});
      cards.push({id:"p"+p.id+"-"+ix, col:col, qtd:q, valor:valor, previsao:p.previsaoEntrega || "", pedidoEm:p.solicitadoEm || "", por:p.solicitante || "", extra:v ? nivelDe(v) : null, nome:nome, forn:forn, foto:fotoDoPedido(ce, {itens:[i], titulo:i.titulo}) || (mat ? fotoDoMaterial(ce, mat) : ""), dados:dados, ordem:p.previsaoEntrega || "9999",
        sit:col==="orc" ? {t:"Aguardando o financeiro", cls:"text-warning", d:[linhaPed(p), quemPed(p)].filter(Boolean)} : {t:ROTULO_STATUS[p.status] || p.status, cls:"text-success", d:[linhaPed(p), quemPed(p)+(p.aprovadoPor ? " · aprovado "+p.aprovadoPor : "")].filter(Boolean)}, pedido:p.id}); }); });
  novosMateriais(g.orc).forEach(function(m){ var forn = m.painel.forn; if(!passa(forn, m.painel.titulo)) return;   // produto novo, ainda sem material no estoque e sem pedido lançado
    cards.push({id:"n"+m.id, col:"novo", nome:m.painel.titulo, forn:forn, foto:foto(m), dados:m.painel.dados, ordem:"0", sit:{t:"Novo material", cls:"text-pink-300", d:["sem pedido no sistema"]}}); });
  g.orc.filter(function(o){ return ["ORCAMENTO", "NEGOCIANDO", "FECHADO"].indexOf(o.etapa)>=0; }).forEach(function(o){
    var forn = nomeForn(ce, o.fornecedorId), ref = o.final || o.rodadas[o.rodadas.length-1]; if(!passa(forn, descricao(o))) return;
    cards.push({id:"o"+o.id, col:"orc", qtd:o.quantidade, valor:ref ? Math.round(ref.valorUnit*o.quantidade*100)/100 : null, por:o.por || "", nome:(o.campos && o.campos.titulo) || descricao(o), forn:forn, foto:fotoDoOrcamento(o), ordem:"9999", orcamento:o.id,
      dados:[{r:"Quantidade", v:miles(o.quantidade)}].concat(ref ? [{r:"Unitário", v:reaisUnit(ref.valorUnit)}, {r:"Valor", v:reais(Math.round(ref.valorUnit*o.quantidade*100)/100)}] : []),
      sit:{t:ROTULO_ETAPA[o.etapa], cls:"text-sky-300", d:[ref ? "prazo "+prazoTxt(ref.prazoDias) : "sem proposta ainda"]}}); });
  cards.forEach(function(c){ c.mod = modeloDoNome(c.nome); });
  cards = cards.filter(function(c){ return !fFoto || (fFoto==="com" ? !!c.foto : !c.foto); });   // filtro de foto
  var opMod = []; cards.forEach(function(c){ if(c.mod && opMod.indexOf(c.mod)<0) opMod.push(c.mod); }); opMod.sort(function(x, y){ return x.localeCompare(y, "pt-BR"); });   // os modelos oferecidos dependem do tipo escolhido
  cards = cards.filter(function(c){ return !fMod || c.mod===fMod; });
  var cats = [];
  (ce.materiais || []).forEach(function(m){ var cat = porId(ce.matCategorias, m.categoriaId); if(!cat || !ehCategoriaGrafica(cat.nome)) return; var tp = tipoDoMaterial(m, cat.nome); if(cats.indexOf(tp)<0) cats.push(tp); });
  ["Tags", "Embalagens de presente", "Maletas"].forEach(function(t){ if(cats.indexOf(t)<0) cats.push(t); });   // os tipos principais aparecem sempre no filtro
  cats.sort(function(x, y){ return ORDEM_TIPOS.indexOf(x)-ORDEM_TIPOS.indexOf(y); });
  var CP = SEL+" !px-1.5 !text-[11px] w-auto max-w-[13rem] shrink-0";   // menus de 11 px, compactos
  var selp = function(rot, v, set, pares){ return e("select",{"aria-label":rot, value:v, onChange:function(ev){ set(ev.target.value); }, className:CP}, e("option",{value:""}, rot), pares.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
  var BT = BTN+" !px-1.5 !text-[11px]";
  var nParados = cards.filter(function(c){ return c.col==="parado"; }).length;
  var faixa = e("div",{className:"flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    selp("Tipo: todos", fCat, m2[1], cats.map(function(t){ return [t, t]; })),
    selp("Modelo: todos", fMod, m9[1], opMod.map(function(t){ return [t, t]; })),
    selp("Foto: com e sem", fFoto, m5[1], [["com", "Só com foto"], ["sem", "Só sem foto"]]),
    selp("Coluna: todas", fCol, m6[1], COLUNAS.map(function(c){ return [c.k, c.t]; })),
    selp("Ordenar: padrão", ordem, m8[1], [["qtd_desc", "Maior quantidade pedida"], ["qtd_asc", "Menor quantidade pedida"], ["est_asc", "Menor estoque"], ["est_desc", "Maior estoque"], ["falta_desc", "Maior falta"], ["valor_desc", "Maior valor"], ["prev_asc", "Previsão mais próxima"], ["ped_desc", "Pedido mais recente"], ["nome", "Nome de A a Z"]]),
    e("button",{type:"button", onClick:alternaVazias, className:BT}, fecharVazias ? "Mostrar colunas vazias" : "Fechar colunas vazias"),
    e("button",{type:"button", onClick:alterna, className:BT}, mostrarPar ? "Ocultar não pedir mais" : "Mostrar não pedir mais · "+nParados),
    (fCat || fMod || fFoto || fCol || ordem) && e("button",{type:"button", onClick:function(){ m2[1](""); m5[1](""); m6[1](""); m8[1](""); m9[1](""); }, className:BT}, "Limpar"),
    e("span",{className:"ml-auto shrink-0 text-[11px] font-semibold"}, cards.length+(cards.length===1 ? " item" : " itens")));
  var LIMITE = 20;
  var card = function(c, col){
    var base = [{r:"Estoque", v:miles(c.saldo), cls:col.txt}, {r:"Mínimo", v:miles(c.minimo)}];
    if(c.minimo>0) base.push(c.saldo<c.minimo ? {r:"Falta", v:miles(c.minimo-c.saldo)} : {r:"Sobra", v:miles(c.saldo-c.minimo)});
    return e(CardMaterial,{key:c.id, grade:col.grade, titulo:c.nome, sub:c.forn, extra:c.extra, foto:c.foto, fotoRef:c.fotoRef, borda:col.borda, fundo:col.fundo, aoClicar:c.orcamento!=null ? function(){ m4[1](c.orcamento); } : c.pedido!=null ? function(){ ac.abrir(c.pedido); } : null, dica:c.orcamento!=null ? "Abrir o orçamento" : c.pedido!=null ? "Abrir o pedido" : undefined,
      dados:c.dados || base, sit:c.sit});
  };
  // ORDEM dentro de cada coluna (menu "Ordem padrão"): [campo, sentido (1 sobe, -1 desce), texto?]. Card sem o dado vai para o fim.
  var ORDENS = {qtd_desc:[function(c){ return c.qtd; }, -1], qtd_asc:[function(c){ return c.qtd; }, 1], est_asc:[function(c){ return c.saldo; }, 1], est_desc:[function(c){ return c.saldo; }, -1],
    falta_desc:[function(c){ return c.minimo>0 ? c.minimo-c.saldo : null; }, -1], valor_desc:[function(c){ return c.valor; }, -1], prev_asc:[function(c){ return c.previsao || null; }, 1, true], ped_desc:[function(c){ return c.pedidoEm || null; }, -1, true], nome:[function(c){ return c.nome; }, 1, true]};
  var comparador = function(col){
    var o = ORDENS[ordem];
    if(!o) return function(x, y){ if(col.fluxo) return String(x.ordem).localeCompare(String(y.ordem)); var rx = x.minimo>0 ? x.saldo/x.minimo : 1e9, ry = y.minimo>0 ? y.saldo/y.minimo : 1e9; return rx-ry; };
    return function(x, y){ var a = o[0](x), b = o[0](y), va = a==null || a==="", vb = b==null || b===""; if(va) return vb ? 0 : 1; if(vb) return -1; return (o[2] ? String(a).localeCompare(String(b), "pt-BR") : Number(a)-Number(b))*o[1]; };
  };
  var renderCol = function(col){
    var cs = cards.filter(function(c){ return c.col===col.k; }).sort(comparador(col)), qtd = mais[col.k] || (col.fluxo ? 80 : LIMITE);
    return e("div",{key:col.k, className:"flex shrink-0 flex-col gap-1.5", style:{width:col.larg || "21.5rem"}},
      e("div",{className:"flex items-center justify-center gap-2 rounded-md border-t-4 bg-[var(--bloco-colunas)] px-2 py-1 text-center text-[11px] font-bold uppercase "+col.txt.replace("text-", "border-")}, col.t+" · "+cs.length, col.k==="parado" && e("button",{type:"button", onClick:alterna, className:"rounded border border-white/40 px-1.5 text-[11px] font-semibold normal-case hover:bg-white/10"}, "Ocultar")),
      cs.length ? cs.slice(0, qtd).map(function(c){ return card(c, col); }) : e("div",{className:"py-3 text-center text-[11px]"}, "Nada aqui"),
      cs.length>qtd && e("button",{type:"button", onClick:function(){ var n = Object.assign({}, mais); n[col.k] = qtd+LIMITE; m3[1](n); }, className:BTN}, "Ver mais "+(cs.length-qtd)));
  };
  var colunas = e("div",{className:"flex items-start gap-1.5 overflow-x-auto p-1"}, COLUNAS.filter(function(c){ return (!fCol || c.k===fCol) && (c.k!=="parado" || mostrarPar || fCol==="parado") && (!fecharVazias || cards.some(function(k){ return k.col===c.k; })); }).map(renderCol));   // as 6 colunas lado a lado; o quadro rola para o lado
  return e("div",{className:"flex flex-col gap-2.5 "+PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},   // sem Pagina: aqui não há número correndo, e a varredura deixava o mouse pesado
    e(BlocoPainel,{titulo:"Painel · material gráfico", compacto:true}, faixa, colunas),
    orcAberto!=null && e(JanelaOrcamento,{g:g, id:orcAberto, fechar:function(){ m4[1](null); }}),
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
