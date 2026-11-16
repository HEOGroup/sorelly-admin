// Sorelly Admin · montagem — pages/compras/TabelaPrecos.js
// Compras e estoque de material → aba "Tabela de preços" (etapa 1 de 3, Nickolas, 16/11/2026).
// Lista por fornecedor (grupos que abrem e fecham) na peça única de tabela (TabelaPlanilha): busca e filtros ficam no título de cada coluna (trava 2j: nada de filtro no topo).
// No topo só Ativos | Arquivados | Todos e o botão de cadastrar. Clicar na linha abre as opções de preço (ordem crescente de quantidade).
// Regras e contas: domain/tabela-precos.js; gravação: ações preco_salvar, preco_situacao, preco_del e forn_condicoes (domain/compras-estoque.js). Cor do setor: azul.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Janela } from "@/apps/montagem/components/padrao";
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarDataHora, formatarDia } from "@/apps/montagem/domain/compras-estoque";
import { MODELOS_PRECO, PRAZO_UNIDADES, TIPOS_VALOR, UNIDADES_PRECO, calcOpcao, numero, opcoesOrdenadas, qtdTxt, reais, reaisUnit, rotuloDe, unidadeNome } from "@/apps/montagem/domain/tabela-precos";
import { Bt, Dialogo, Painel, useCompras } from "@/apps/montagem/pages/compras/pecas";
import { e, useState } from "@/shared/react";

var CAMPO = "h-8 w-full rounded-lg border border-input bg-input/30 px-2 text-center text-[13px] outline-none";
var ROT = "flex min-w-0 flex-col gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-white";
var porIdLista = function(l, id){ return (l || []).find(function(x){ return String(x.id)===String(id); }) || null; };
var txt = function(v){ return v==null ? "" : String(v).replace(".", ","); };   // número guardado → texto do campo (vírgula)
function Rot(p){ return e("label",{className:ROT+" "+(p.cls || "")}, p.t, p.children); }
function Sel(p){ return e("select",{value:p.v, onChange:function(ev){ p.set(ev.target.value); }, "aria-label":p.aria, className:CAMPO+" cursor-pointer"}, p.vazio && e("option",{value:""}, p.vazio), p.ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); }
function Inp(p){ return e("input",{type:"text", inputMode:p.num ? "decimal" : undefined, value:p.v, placeholder:p.ph || "", "aria-label":p.aria, onChange:function(ev){ p.set(ev.target.value); }, className:CAMPO}); }
function IcBt(p){ return e("button",{type:"button", title:p.t, "aria-label":p.t, disabled:p.disabled, onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, className:"grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 "+(p.perigo ? "hover:bg-[#EF4444]/30" : "")}, e(Ph,{n:p.ic, s:15})); }

// ───────────── opções de preço de um produto (o que abre embaixo da linha) ─────────────
function OpcoesProduto(p){
  var pr = p.pr, ops = opcoesOrdenadas(pr), un = unidadeNome(pr.unidade);
  var linhas = ops.map(function(o){ var c = calcOpcao(pr, o);
    return {id:o.id, qtd:c.rotulo, unidade:rotuloDe(UNIDADES_PRECO, pr.unidade), unit:reaisUnit(c.unit), total:c.total==null ? "—" : c.totalRef ? reais(c.total)+" (referência para "+qtdTxt(c.qtdRef)+")" : reais(c.total),
      prazo:o.prazo==null ? "—" : qtdTxt(o.prazo)+" "+rotuloDe(PRAZO_UNIDADES, o.prazoUn), custo:c.custoEstoque ? c.custoEstoque.txt : "—", obs:o.obs || "—"}; });
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-white"},
      e("span",null, "Modelo: ", e("b",null, rotuloDe(MODELOS_PRECO, pr.modelo))),
      e("span",null, "Preço por ", e("b",null, un)),
      pr.unidadesPorEmb!=null && e("span",null, "Cada ", un, " tem ", e("b",null, qtdTxt(pr.unidadesPorEmb)+" unidades")),
      pr.qtdMinima!=null && e("span",null, "Quantidade mínima: ", e("b",null, qtdTxt(pr.qtdMinima)+" "+unidadeNome(pr.unidade, pr.qtdMinima))),
      pr.obs && e("span",null, "Observações: "+pr.obs)),
    linhas.length ? e(TabelaPlanilha,{chave:"id", semContagem:true, semFiltro:true, compacta:true, linhas:linhas,
      cols:[{k:"qtd", t:"Quantidade ou faixa"}, {k:"unidade", t:"Unidade"}, {k:"unit", t:"Preço unitário"}, {k:"total", t:"Total ou total de referência"}, {k:"prazo", t:"Prazo"}, {k:"custo", t:"Custo por unidade de estoque"}, {k:"obs", t:"Observações"}]})
      : e("span",{className:"text-[13px] text-white"}, "Nenhuma opção de preço cadastrada."));
}

// ───────────── cadastro e edição do produto (dados | opções de preço) ─────────────
var opVazia = function(){ return {k:Math.random().toString(36).slice(2), id:null, qtd:"", de:"", ate:"", tipoValor:"unitario", valor:"", qtdRef:"", prazo:"", prazoUn:"uteis", obs:""}; };
function FormProduto(p){
  var c = p.c, ce = c.ce, pr = p.pr, novo = !pr;
  var st = useState(function(){ return novo ? {fornecedorId:p.fornIni ? String(p.fornIni) : "", nome:"", codigo:"", categoriaId:"", unidade:"UNID", unidadesPorEmb:"", qtdMinima:"", obs:"", ativo:true, modelo:"lote", opcoes:[]}
    : {fornecedorId:String(pr.fornecedorId), nome:pr.nome, codigo:pr.codigo || "", categoriaId:pr.categoriaId==null ? "" : String(pr.categoriaId), unidade:pr.unidade, unidadesPorEmb:txt(pr.unidadesPorEmb), qtdMinima:txt(pr.qtdMinima), obs:pr.obs || "", ativo:pr.ativo, modelo:pr.modelo,
      opcoes:opcoesOrdenadas(pr).map(function(o){ return {k:"o"+o.id, id:o.id, qtd:txt(o.qtd), de:txt(o.de), ate:txt(o.ate), tipoValor:o.tipoValor, valor:txt(o.valor), qtdRef:txt(o.qtdRef), prazo:txt(o.prazo), prazoUn:o.prazoUn || "uteis", obs:o.obs || ""}; })}; });
  var v = st[0], set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var setOp = function(i, k, x){ st[1](function(o){ var ops = o.opcoes.slice(); ops[i] = Object.assign({}, ops[i]); ops[i][k] = x; return Object.assign({}, o, {opcoes:ops}); }); };
  var idDe = function(lista, s){ var x = porIdLista(lista, s); return x ? x.id : s; };
  var faixa = v.modelo==="faixa", un = unidadeNome(v.unidade), unidadesTxt = numero(v.unidadesPorEmb);
  var fornOps = ce.fornecedores.filter(function(f){ return f.ativo!==false || String(f.id)===v.fornecedorId; }).map(function(f){ return [String(f.id), f.nome]; });
  var catOps = (ce.categorias || []).map(function(x){ return [String(x.id), x.nome]; });
  var salvar = function(){
    var dados = {op:"preco_salvar", opera:c.opera, id:novo ? undefined : pr.id, fornecedorId:idDe(ce.fornecedores, v.fornecedorId), nome:v.nome, codigo:v.codigo, categoriaId:v.categoriaId==="" ? null : idDe(ce.categorias, v.categoriaId), unidade:v.unidade,
      unidadesPorEmb:v.unidadesPorEmb, qtdMinima:v.qtdMinima, obs:v.obs, ativo:v.ativo, modelo:v.modelo,
      opcoes:v.opcoes.map(function(o){ return {id:o.id, qtd:o.qtd, de:o.de, ate:o.ate, tipoValor:o.tipoValor, valor:o.valor, qtdRef:o.qtdRef, prazo:o.prazo, prazoUn:o.prazoUn, obs:o.obs}; })};
    if(c.exec(dados)) p.fechar();
  };
  var dados = e(Painel,{key:"d", t:"Produto no fornecedor", ic:"package"},
    e(Rot,{t:"Fornecedor *"}, e(Sel,{v:v.fornecedorId, set:function(x){ set("fornecedorId", x); }, ops:fornOps, vazio:"Escolha o fornecedor", aria:"Fornecedor"})),
    e(Rot,{t:"Nome do produto no fornecedor *"}, e(Inp,{v:v.nome, set:function(x){ set("nome", x); }, aria:"Nome do produto"})),
    e("div",{className:"grid grid-cols-2 gap-2"},
      e(Rot,{t:"Código ou referência"}, e(Inp,{v:v.codigo, set:function(x){ set("codigo", x); }, ph:"Opcional", aria:"Código"})),
      e(Rot,{t:"Categoria"}, e(Sel,{v:v.categoriaId, set:function(x){ set("categoriaId", x); }, ops:catOps, vazio:"Sem categoria", aria:"Categoria"})),
      e(Rot,{t:"Unidade de compra *"}, e(Sel,{v:v.unidade, set:function(x){ set("unidade", x); }, ops:UNIDADES_PRECO, aria:"Unidade de compra"})),
      e(Rot,{t:"Unidades por "+un}, e(Inp,{v:v.unidadesPorEmb, num:true, set:function(x){ set("unidadesPorEmb", x); }, ph:v.unidade==="MILHEIRO" ? "1.000 (automático)" : "Quando houver", aria:"Unidades por embalagem"})),
      e(Rot,{t:"Quantidade mínima ("+unidadeNome(v.unidade, 2)+")"}, e(Inp,{v:v.qtdMinima, num:true, set:function(x){ set("qtdMinima", x); }, ph:"Opcional", aria:"Quantidade mínima"})),
      e(Rot,{t:"Situação"}, e(Sel,{v:v.ativo ? "1" : "0", set:function(x){ set("ativo", x==="1"); }, ops:[["1", "Ativo"], ["0", "Arquivado"]], aria:"Situação"}))),
    e(Rot,{t:"Observações"}, e("textarea",{value:v.obs, rows:2, "aria-label":"Observações", onChange:function(ev){ set("obs", ev.target.value); }, className:"w-full rounded-lg border border-input bg-input/30 px-2 py-1.5 text-center text-[13px] outline-none"})),
    e("span",{className:"text-[11px] text-white/70"}, "Ligação com o material do estoque e foto: na próxima etapa."));
  var opcoes = e(Painel,{key:"o", t:"Opções de quantidade e preço", ic:"currency-circle-dollar", estado:"atual"},
    e(Rot,{t:"Modelo da tabela"}, e(Segmentado,{opcoes:MODELOS_PRECO, atual:v.modelo, onMudar:function(x){ set("modelo", x); }})),
    e("span",{className:"text-[11px] text-white"}, "Os preços são por "+un+(unidadesTxt>0 ? " (cada "+un+" tem "+qtdTxt(unidadesTxt)+" unidades)" : v.unidade==="MILHEIRO" ? " (1.000 unidades)" : "")+"."),
    v.opcoes.map(function(o, i){
      var pv = calcOpcao({modelo:v.modelo, unidade:v.unidade, unidadesPorEmb:v.unidadesPorEmb}, o), alt = function(k){ return function(x){ setOp(i, k, x); }; };
      return e("div",{key:o.k, className:"flex flex-col gap-1.5 rounded-lg bg-black/25 p-2 ring-1 ring-white/10"},
        e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"text-[13px]"}, "Opção "+(i+1)),
          e(IcBt,{ic:"trash", t:"Remover esta opção", perigo:true, onClick:function(){ st[1](function(x){ return Object.assign({}, x, {opcoes:x.opcoes.filter(function(_, j){ return j!==i; })}); }); }})),
        e("div",{className:"grid grid-cols-2 gap-2"},
          faixa ? [e(Rot,{key:"de", t:"De ("+unidadeNome(v.unidade, 2)+")"}, e(Inp,{v:o.de, num:true, set:alt("de"), aria:"Faixa de"})), e(Rot,{key:"ate", t:"Até"}, e(Inp,{v:o.ate, num:true, set:alt("ate"), ph:"Vazio = sem limite", aria:"Faixa até"}))]
            : e(Rot,{t:"Quantidade do lote ("+unidadeNome(v.unidade, 2)+")", cls:"col-span-2"}, e(Inp,{v:o.qtd, num:true, set:alt("qtd"), aria:"Quantidade do lote"})),
          e(Rot,{t:"Valor informado"}, e(Sel,{v:o.tipoValor, set:alt("tipoValor"), ops:[["unitario", "Unitário (por "+un+")"], ["total", faixa ? "Total de referência" : "Total do lote"]], aria:"Tipo de valor"})),
          e(Rot,{t:"Valor (R$)"}, e(Inp,{v:o.valor, num:true, set:alt("valor"), ph:"0,00", aria:"Valor em reais"})),
          faixa && o.tipoValor==="total" && e(Rot,{t:"Quantidade de referência", cls:"col-span-2"}, e(Inp,{v:o.qtdRef, num:true, set:alt("qtdRef"), ph:"Dentro da faixa", aria:"Quantidade de referência"})),
          e(Rot,{t:"Prazo de entrega"}, e(Inp,{v:o.prazo, num:true, set:alt("prazo"), ph:"Opcional", aria:"Prazo de entrega"})),
          e(Rot,{t:"Prazo em"}, e(Sel,{v:o.prazoUn, set:alt("prazoUn"), ops:PRAZO_UNIDADES, aria:"Unidade do prazo"})),
          e(Rot,{t:"Observações", cls:"col-span-2"}, e(Inp,{v:o.obs, set:alt("obs"), ph:"Opcional", aria:"Observações da opção"}))),
        e("span",{className:"text-[11px] text-white"}, pv.unit==null ? "Preencha quantidade e valor para ver a conta." :
          "Unitário "+reaisUnit(pv.unit)+" por "+un+(pv.total!=null ? (pv.totalRef ? " · total de referência "+reais(pv.total)+" para "+qtdTxt(pv.qtdRef) : " · total "+reais(pv.total)) : "")+(pv.custoEstoque ? " · "+reaisUnit(pv.custoEstoque.valor)+" por unidade" : "")));
    }),
    e(Bt,{ic:"plus", tipo:"forte", className:"self-center", onClick:function(){ set("opcoes", v.opcoes.concat([opVazia()])); }}, "Adicionar opção de preço"));
  return e(Janela,{t:novo ? "Cadastrar produto e preço" : "Editar produto e preços", sub:novo ? "Produto de um fornecedor, com uma ou várias opções de quantidade e preço" : pr.nome, fechar:p.fechar, colunas:[dados, opcoes],
    rodape:[e(Bt,{key:"s", tipo:"forte", ic:"check", onClick:salvar}, novo ? "Cadastrar" : "Salvar alterações"), e(Bt,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

// ───────────── histórico do produto (data, quem, campo, antes e depois) ─────────────
function Historico(p){
  var c = p.c, l = (c.ce.logPrecos || []).filter(function(x){ return String(x.produtoId)===String(p.pr.id); }).slice().reverse()
    .map(function(x, i){ return {i:i, em:formatarDataHora(x.em), por:x.por, campo:x.campo, antes:x.antes, depois:x.depois}; });
  return e(Dialogo,{t:"Histórico do produto", sub:p.pr.nome, tam:"max-w-4xl", fechar:p.fechar},
    l.length ? e(TabelaPlanilha,{chave:"i", linhas:l, cols:[{k:"em", t:"Data e hora"}, {k:"por", t:"Quem"}, {k:"campo", t:"Campo"}, {k:"antes", t:"Antes"}, {k:"depois", t:"Depois"}]})
      : e("span",{className:"text-[13px]"}, "Nenhuma alteração registrada."));
}

// ───────────── condições comerciais do fornecedor (valor mínimo do pedido, uma vez só) ─────────────
function Condicoes(p){
  var c = p.c, f = p.f, st = useState({pm:txt(f.pedidoMinimo), obs:f.obsComercial || ""}), v = st[0];
  var hist = (c.ce.logPrecos || []).filter(function(x){ return x.produtoId==null && String(x.fornecedorId)===String(f.id); }).slice(-5).reverse();
  return e(Dialogo,{t:"Condições comerciais", sub:f.nome, fechar:p.fechar,
    rodape:[e(Bt,{key:"s", tipo:"forte", ic:"check", disabled:!c.opera, onClick:function(){ if(c.exec({op:"forn_condicoes", opera:c.opera, id:f.id, pedidoMinimo:v.pm, obsComercial:v.obs})) p.fechar(); }}, "Salvar"), e(Bt,{key:"c", onClick:p.fechar}, "Cancelar")]},
    e(Rot,{t:"Valor mínimo do pedido (R$)"}, e(Inp,{v:v.pm, num:true, set:function(x){ st[1](Object.assign({}, v, {pm:x})); }, ph:"Vazio = sem mínimo", aria:"Valor mínimo do pedido"})),
    e(Rot,{t:"Outras condições"}, e(Inp,{v:v.obs, set:function(x){ st[1](Object.assign({}, v, {obs:x})); }, ph:"Ex.: frete, forma de pagamento", aria:"Outras condições"})),
    e("span",{className:"text-[11px] text-white"}, "Vale para todos os produtos deste fornecedor. É diferente da quantidade mínima de cada produto e do estoque mínimo do material."),
    hist.length>0 && e("div",{className:"flex flex-col gap-1 border-t border-white/10 pt-2 text-[11px] text-white"}, hist.map(function(x){ return e("span",{key:x.id}, formatarDataHora(x.em)+" · "+x.por+" · "+x.campo+": "+x.antes+" → "+x.depois); })));
}

// ───────────── tela ─────────────
function AbaTabelaPrecos(){
  var c = useCompras(), ce = c.ce, sv = useState("ativos"), sit = sv[0], sj = useState(null), jan = sj[0], sg = useState({}), fechados = sg[0];
  var abrir = function(k, x){ sj[1]({k:k, x:x}); }, fechar = function(){ sj[1](null); };
  var precos = (ce.precos || []).filter(function(x){ return sit==="todos" || (sit==="ativos" ? x.ativo!==false : x.ativo===false); });
  var linhas = precos.map(function(x){ var f = porIdLista(ce.fornecedores, x.fornecedorId), cat = porIdLista(ce.categorias, x.categoriaId);
    return {id:x.id, fornecedor:f ? f.nome : "Fornecedor não encontrado", nome:x.nome, codigo:x.codigo || "", unidade:rotuloDe(UNIDADES_PRECO, x.unidade), qtdMin:x.qtdMinima==null ? "" : qtdTxt(x.qtdMinima)+" "+unidadeNome(x.unidade, x.qtdMinima),
      nOps:(x.opcoes || []).length, atualizado:formatarDia(x.atualizadoEm), atualizadoOrd:x.atualizadoEm || "", categoria:cat ? cat.nome : "", situacao:x.ativo===false ? "Arquivado" : "Ativo", pr:x, f:f}; });
  var excluir = function(x){ if(window.confirm("Excluir \""+x.nome+"\" da tabela de preços? Não dá para desfazer.")) c.exec({op:"preco_del", opera:c.opera, id:x.id}); };
  var cols = [
    {k:"nome", t:"Produto"}, {k:"codigo", t:"Código"}, {k:"unidade", t:"Unidade de compra"}, {k:"qtdMin", t:"Quantidade mínima"},
    {k:"nOps", t:"Opções de preço"}, {k:"atualizado", t:"Atualizado em"}, {k:"categoria", t:"Categoria"}, {k:"fornecedor", t:"Fornecedor"}]
    .concat(sit==="todos" ? [{k:"situacao", t:"Situação"}] : [])
    .concat([{k:"acoes", t:"Ações", render:function(_, l){ var x = l.pr;
      return e("div",{className:"flex justify-center gap-1"},
        e(IcBt,{ic:"clock-counter-clockwise", t:"Histórico", onClick:function(){ abrir("hist", x); }}),
        e(IcBt,{ic:"pencil-simple", t:"Editar produto e preços", disabled:!c.opera, onClick:function(){ abrir("form", x); }}),
        e(IcBt,{ic:x.ativo===false ? "arrow-counter-clockwise" : "archive", t:x.ativo===false ? "Reativar" : "Arquivar", disabled:!c.opera, onClick:function(){ c.exec({op:"preco_situacao", opera:c.opera, id:x.id, ativo:x.ativo===false}); }}),
        e(IcBt,{ic:"trash", t:"Excluir", perigo:true, disabled:!c.opera, onClick:function(){ excluir(x); }})); }}]);
  var linhaGrupo = function(nome, ls){ var f = ls[0] && ls[0].f;
    return {span:cols.length, rotulo:e("div",{className:"flex flex-wrap items-center justify-center gap-x-3 gap-y-1"},
      e(Ph,{n:fechados[nome] ? "caret-right" : "caret-down", s:14}), e("b",null, nome), e("span",null, ls.length+(ls.length===1 ? " produto" : " produtos")),
      f && f.pedidoMinimo!=null && e("span",null, "Pedido mínimo "+reais(f.pedidoMinimo)),
      f && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); abrir("cond", f); }, className:"inline-flex h-8 items-center gap-1 rounded-lg bg-white/10 px-2.5 text-[13px] font-bold hover:bg-white/20"}, e(Ph,{n:"pencil-simple", s:14}), "Condições"))};
  };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e(Segmentado,{opcoes:[["ativos", "Ativos"], ["arquivados", "Arquivados"], ["todos", "Todos"]], atual:sit, onMudar:sv[1]}),
      e(Bt,{tipo:"forte", ic:"plus", disabled:!c.opera, semAut:true, onClick:function(){ abrir("form", null); }}, "Cadastrar produto/preço")),
    e(TabelaPlanilha,{chave:"id", linhas:linhas, cols:cols, agrupar:"fornecedor", linhaGrupo:linhaGrupo, grupoAberto:function(g){ return !fechados[g]; },
      aoGrupo:function(g){ var n = Object.assign({}, fechados); n[g] = !n[g]; sg[1](n); }, detalhe:function(l){ return e(OpcoesProduto,{pr:l.pr}); },
      vazio:(ce.precos || []).length ? "Nenhum produto nesta situação." : "Nenhum produto cadastrado. Use \"Cadastrar produto/preço\"."}),
    jan && jan.k==="form" && e(FormProduto,{key:"f"+(jan.x ? jan.x.id : "novo"), c:c, pr:jan.x, fechar:fechar}),
    jan && jan.k==="hist" && e(Historico,{c:c, pr:jan.x, fechar:fechar}),
    jan && jan.k==="cond" && e(Condicoes,{c:c, f:jan.x, fechar:fechar}));
}

export { AbaTabelaPrecos };
