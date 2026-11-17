// Sorelly Admin · montagem — pages/compras/EstoqueMaterial.js
// Materiais & Estoque → "Estoque de material": uma tabela por fornecedor (padrão azul de 17/11/2026) com contagem, entrada/saída/ajuste, carrinho de compra, andamento da compra, foto, histórico e edição.
// Regras no domínio (domain/compras-estoque.js, estado s.ce, ações CE). Aqui só se desenha e se chamam as ações. Cor do setor: azul.
import { Janela, Pagina, ESTADO, degrade } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { ANDAMENTOS, ROTULO_ANDAMENTO, ROTULO_SITUACAO, ROTULO_UNIDADE, UNIDADES, agruparPorStatus, alertasDoTipo, formatarDataHora, formatarDia, formatarReais, hojeSP, historicoMaterial, materialVisto, proximaContagem, resumoAba } from "@/apps/montagem/domain/compras-estoque";
import { Bt, BtMini, Editor, Ic, Nivel, Num, Painel, Selo, Vazio, useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { BotaoFoto, EscolherFoto, FotoMaterial } from "@/apps/montagem/components/foto-material";
import { normal, useCompras } from "@/apps/montagem/pages/compras/pecas";
import { useAcoes } from "@/apps/montagem/pages/compras/janelas";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var COR_STATUS = {CRITICO:"ruim", ATENCAO:"alerta", OK:"ok"};
var IC_STATUS = {CRITICO:"warning-octagon", ATENCAO:"warning", OK:"check-circle"};
var ROT_STATUS = {CRITICO:"Crítico", ATENCAO:"Atenção", OK:"OK"};
// ANDAMENTO DA COMPRA (16/11/2026): selo ao lado da situação do estoque, lido da compra ligada (domain: andamentoMaterial)
var COR_AND = {SOLICITADO:"alerta", COTACAO:"alerta", APROVACAO:"alerta", A_COMPRAR:"info", ENTREGA:"info", RECEBIDO:"ok"};
var IC_AND = {SOLICITADO:"paper-plane-tilt", COTACAO:"magnifying-glass", APROVACAO:"hourglass-medium", A_COMPRAR:"lock-open", ENTREGA:"truck", RECEBIDO:"package"};
function SeloAndamento(p){
  var a = p.and, et = a.etapa;
  return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, title:et ? "Andamento da compra: abrir"+(a.extra ? " (há "+(a.extra+1)+" compras abertas)" : "") : "Sem compra em andamento: ver o histórico de compras", className:"cursor-pointer rounded-full hover:brightness-125"},
    e(Selo,{cor:et ? COR_AND[et] : "neutro", ic:et ? IC_AND[et] : "minus-circle"}, a.rotulo+(a.extra ? " +"+a.extra : "")));
}
var ACOES_HIST = {COMPRA_PEDIDA:["Compra pedida", "shopping-cart-simple"], ANDAMENTO:["Andamento da compra", "arrow-right"], RECEBIMENTO:["Recebimento", "package"], FOTO_INCLUIDA:["Foto incluída", "image"], FOTO_TROCADA:["Foto trocada", "image"], FOTO_REMOVIDA:["Foto removida", "image-broken"],
  CRIADO:["Cadastrado", "plus-circle"], EDITADO:["Editado", "pencil-simple"], OBSERVACAO:["Observação", "note"], EXCLUIDO:["Excluído", "trash"], contagem:["Contagem", "list-checks"], entrada:["Entrada", "arrow-fat-down"], saida:["Saída", "arrow-fat-up"], ajuste:["Ajuste", "sliders-horizontal"]};

// ───────────── dados do material (coluna "já preenchida" das janelas) ─────────────
function DadosMaterial(p){
  var m = p.m, c = ESTADO[COR_STATUS[m.status]];
  return e("div",{className:"flex flex-col items-center gap-1.5"},
    p.semFoto ? null : e(FotoMaterial,{foto:m.foto, rot:m.material, tam:"g"}),
    e("b",{className:"text-[14px] leading-tight"}, m.material), e("span",{className:"text-[12px] text-white/70"}, [m.categoriaNome, m.unidade].filter(Boolean).join(" · ")),
    e("div",{className:"grid w-full grid-cols-2 gap-1.5"}, e(Num,{t:"Saldo", v:m.estoqueAtual, cor:COR_STATUS[m.status]}), e(Num,{t:"Mínimo", v:m.estoqueMinimo})),
    e(Selo,{cor:COR_STATUS[m.status], ic:IC_STATUS[m.status]}, ROT_STATUS[m.status]),
    m.fornecedor && e("span",{className:"text-[12px] text-white/70"}, "Fornecedor: "+m.fornecedor),
    e("span",{className:"text-[12px] text-white/70"}, m.ultimaContagem ? "Última contagem em "+formatarDia(m.ultimaContagem) : "Sem contagem registrada"),
    m.ultimoCusto!=null && e("span",{className:"text-[12px] text-white/70"}, "Último custo: "+formatarReais(m.ultimoCusto)),
    m.parado && e(Selo,{cor:"neutro", ic:"archive"}, "Material parado"));
}

// ───────────── cartão do material ─────────────
function CartaoMaterial(p){
  var m = p.m, cor = ESTADO[COR_STATUS[m.status]], pode = p.pode;
  return e("div",{className:"flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center", style:degrade(COR_STATUS[m.status])},
    e("button",{type:"button", onClick:function(){ p.abrir("hist", m.id); }, title:"Abrir o histórico", className:"cursor-pointer text-[13.5px] font-bold leading-tight hover:underline"}, m.material),
    e("span",{className:"text-[11.5px] leading-tight text-white/65"}, [m.unidade, m.fornecedor].filter(Boolean).join(" · ")),
    e("div",{className:"grid w-full grid-cols-2 gap-1.5"}, e(Num,{t:"Saldo", v:m.estoqueAtual, cor:COR_STATUS[m.status]}), e(Num,{t:"Mínimo", v:m.estoqueMinimo})),
    e(Nivel,{atual:m.estoqueAtual, minimo:m.estoqueMinimo, cor:cor}),
    e("div",{className:"flex flex-wrap justify-center gap-1"},
      e(Selo,{cor:COR_STATUS[m.status], ic:IC_STATUS[m.status], titulo:"Situação do estoque (saldo e mínimo)"}, ROT_STATUS[m.status]),
      e(SeloAndamento,{and:m.andamento, onClick:function(){ p.verCompra(m); }}),
      m.nota && e(Selo,{cor:"neutro", ic:"note", titulo:"Anotação manual"}, m.nota)),
    e("span",{className:"text-[11px] text-white/55"}, m.ultimaContagem ? "Contado em "+formatarDia(m.ultimaContagem) : "Sem contagem"),
    e("div",{className:"flex flex-wrap justify-center gap-1"},
      e(Ic,{ic:"list-checks", titulo:"Contar", disabled:!pode.contagem, semAut:true, forte:true, onClick:function(){ p.abrir("contar", m.id); }}),
      e(Ic,{ic:"arrows-left-right", titulo:"Entrada, saída ou ajuste", disabled:!pode.contagem, semAut:true, onClick:function(){ p.abrir("mov", m.id); }}),
      e(Ic,{ic:"shopping-cart-simple", titulo:"Pedir compra", disabled:!pode.compra, semAut:true, onClick:function(){ p.abrir("pedir", m.id); }}),
      e(Ic,{ic:"clock-counter-clockwise", titulo:"Histórico", onClick:function(){ p.abrir("hist", m.id); }}),
      e(BotaoFoto,{foto:m.foto, rot:m.material}),   // só aparece com foto: o cartão não cresce
      e(Ic,{ic:"pencil-simple", titulo:"Editar", disabled:!pode.compra, semAut:true, onClick:function(){ p.abrir("edit", m.id); }}),
      e(Ic,{ic:"archive", titulo:"Marcar como parado", disabled:!pode.aprovacao, semAut:true, onClick:function(){ p.parar(m, true); }})));
}

// ───────────── janela de contagem ─────────────
function JanelaContar(p){
  var m = p.m, x = p.x;
  return e(Editor,{t:"Contagem de estoque", sub:m.material, fechar:p.fechar, dados:e(DadosMaterial,{m:m}), tDados:"Material", salvarRot:"Registrar contagem", icSalvar:"list-checks", semAut:!p.pode.contagem,
    ini:{valor:"", quem:x.por, data:hojeSP(), motivo:""},
    campos:[{k:"valor", rot:"Quantidade contada", tipo:"num", min:0, obrig:true}, {k:"quem", rot:"Quem contou", tipo:"texto", obrig:true}, {k:"data", rot:"Data da contagem", tipo:"data", max:hojeSP(), obrig:true}, {k:"motivo", rot:"Observação", tipo:"area", ph:"Opcional"}],
    lateral:function(v){ var n = Number(v.valor), dif = v.valor==="" || isNaN(n) ? null : n-m.estoqueAtual;
      return e(Painel,{t:"Resultado esperado", estado:dif==null ? undefined : "atual"}, dif==null ? e("span",{className:"text-[12.5px] text-white/65"}, "Informe a quantidade contada.") :
        e("div",{className:"flex flex-col items-center gap-1"}, e("b",{className:MONO+" text-[19px] leading-none", style:{color:dif<0 ? ESTADO.ruim : dif>0 ? ESTADO.ok : ESTADO.neutro}}, (dif>0 ? "+" : "")+dif),
          e("span",{className:"text-[11.5px] text-white/75"}, dif<0 ? "Consumo apurado" : dif>0 ? "Sobra em relação ao saldo" : "Igual ao saldo esperado")));
    },
    onSalvar:function(v){ return x.exec("estoque_contagem", {id:m.id, valor:Number(v.valor), quem:v.quem, data:v.data, motivo:v.motivo}); }});
}

// ───────────── janela de movimento (entrada, saída, ajuste) ─────────────
function JanelaMov(p){
  var m = p.m, x = p.x;
  return e(Editor,{t:"Movimentação de estoque", sub:m.material, fechar:p.fechar, dados:e(DadosMaterial,{m:m}), tDados:"Material", salvarRot:"Lançar movimento", icSalvar:"arrows-left-right", semAut:!p.pode.contagem,
    ini:{tipo:"saida", qtd:"", quem:x.por, data:hojeSP(), motivo:"", custoUnit:0},
    campos:[{k:"tipo", rot:"Tipo", tipo:"botoes", ops:[["entrada", "Entrada"], ["saida", "Saída"], ["ajuste", "Ajuste"]]},
      {k:"qtd", rot:"Quantidade", tipo:"num", obrig:true, dica:"No ajuste, use o sinal de menos para retirar"}, {k:"quem", rot:"Quem retirou ou recebeu", tipo:"texto", obrig:true}, {k:"data", rot:"Data", tipo:"data", max:hojeSP(), obrig:true},
      {k:"custoUnit", rot:"Custo unitário", tipo:"dinheiro", se:function(v){ return v.tipo==="entrada"; }},
      {k:"motivo", rot:"Motivo", tipo:"area", obrig:function(v){ return v.tipo==="ajuste"; }, ph:"Obrigatório no ajuste"}],
    lateral:function(v){ var q = Number(v.qtd), ok = v.qtd!=="" && !isNaN(q), delta = !ok ? 0 : v.tipo==="saida" ? -Math.abs(q) : v.tipo==="entrada" ? Math.abs(q) : q, apos = m.estoqueAtual+delta, neg = ok && apos<0 && !x.cfg.permitirSaldoNegativo;
      return e(Painel,{t:"Saldo após o lançamento", estado:ok ? "atual" : undefined}, ok ? e("div",{className:"flex flex-col items-center gap-1"}, e("b",{className:MONO+" text-[19px] leading-none", style:{color:neg ? ESTADO.ruim : ESTADO.total}}, apos),
        e("span",{className:"text-[11.5px] "+(neg ? "font-bold text-[#F87171]" : "text-white/75")}, neg ? "Saldo insuficiente para esta saída" : "Variação de "+(delta>0 ? "+" : "")+delta)) : e("span",{className:"text-[12.5px] text-white/65"}, "Informe a quantidade."));
    },
    valida:function(v){ var q = Number(v.qtd); if(v.tipo!=="ajuste" && q<1) return "A quantidade deve ser de 1 em diante."; if(v.tipo==="ajuste" && q===0) return "O ajuste deve ser diferente de zero."; return ""; },
    onSalvar:function(v){ var q = Math.round(Number(v.qtd)); return x.exec("estoque_mov", {materialId:m.id, tipo:v.tipo, qtd:v.tipo==="ajuste" ? q : Math.abs(q), quem:v.quem, data:v.data, motivo:v.motivo, custoUnit:v.tipo==="entrada" && v.custoUnit>0 ? v.custoUnit : undefined}); }});
}

// ───────────── janela de pedido de compra (carrinho do cartão) ─────────────
// 16/11/2026: o carrinho cria um PEDIDO na área de Compras (ação estoque_pedir), ligado ao material, com o saldo e o mínimo de agora guardados.
// Compra já aberta: aviso com o acesso a ela; pedir outra só marcando "Sim, é outra compra" (não bloqueia, evita duplicar sem querer).
function ListaCompras(p){
  return e("div",{className:"flex flex-col items-center gap-1"}, p.lista.map(function(c){
    var rot = (c.tipo==="pedido" ? "Compra #" : "Pedido de material #")+c.id+" · "+c.quantidade+" · "+(c.aberta ? c.rotuloEtapa+(c.falta ? " · falta "+c.falta : "") : c.rotuloStatus);
    return c.tipo==="pedido" && p.ver ? e(BtMini,{key:c.tipo+c.id, ic:"arrow-square-out", titulo:"Abrir a compra em Compras", onClick:function(){ p.ver(c); }}, rot)
      : e(Selo,{key:c.tipo+c.id, cor:c.aberta ? COR_AND[c.etapa] : "neutro", ic:c.aberta ? IC_AND[c.etapa] : "check"}, rot);
  }));
}
function JanelaPedir(p){
  var m = p.m, x = p.x, abertas = m.andamento.abertas;
  var dados = e("div",{className:"flex flex-col items-center gap-2"}, e(DadosMaterial,{m:m}),
    abertas.length>0 && e("div",{className:"flex flex-col items-center gap-1.5 rounded-lg bg-[#F59E0B]/15 p-2 ring-1 ring-[#F59E0B]/40"},
      e("span",{className:"text-[11px] font-bold uppercase text-white"}, abertas.length===1 ? "Já existe uma compra em andamento" : "Já existem "+abertas.length+" compras em andamento"),
      e(ListaCompras,{lista:abertas, ver:p.verCompra})));
  return e(Editor,{t:"Pedido de compra", sub:m.material, fechar:p.fechar, dados:dados, tDados:"Material", salvarRot:"Solicitar compra", icSalvar:"shopping-cart-simple", semAut:!p.pode.compra,
    ini:{quantidade:"", fornecedorId:m.fornecedorId==null ? "" : String(m.fornecedorId), observacao:"", outra:"nao"},
    campos:[{k:"quantidade", rot:"Quantidade a comprar", tipo:"num", min:1, obrig:true, dica:"O comprador informa. O mínimo não é a quantidade a comprar."}, {k:"fornecedorId", rot:"Fornecedor", tipo:"select", vazio:"Sem fornecedor definido", ops:x.ce.fornecedores.filter(function(f){ return f.ativo!==false; }).map(function(f){ return [String(f.id), f.nome]; })}, {k:"observacao", rot:"Observação", tipo:"area", ph:"Opcional"},
      {k:"outra", rot:"Pedir outra compra mesmo assim?", tipo:"botoes", ops:[["nao", "Não"], ["sim", "Sim, é outra compra"]], se:function(){ return abertas.length>0; }}],
    valida:function(v){ if(Number(v.quantidade)<1) return "A quantidade deve ser de 1 em diante."; if(abertas.length && v.outra!=="sim") return "Já existe compra em andamento: abra a compra acima, ou marque \"Sim, é outra compra\"."; return ""; },
    onSalvar:function(v){ return x.exec("estoque_pedir", {materialId:m.id, quantidade:Number(v.quantidade), fornecedorId:v.fornecedorId==="" ? undefined : isNaN(Number(v.fornecedorId)) ? v.fornecedorId : Number(v.fornecedorId), observacao:v.observacao, forcar:abertas.length>0 && v.outra==="sim"}); }});
}

// ───────────── janela de cadastro e edição do material ─────────────
function JanelaMaterial(p){
  var m = p.m, x = p.x, novo = !m, cats = x.ce.matCategorias.filter(function(c){ return c.tipoId===p.tipo; }), nc = useState(""), ft = useState(null);   // ft = foto escolhida no cadastro novo (vai junto no mat_add)
  // foto (16/11/2026): no material que já existe, anexar/trocar/remover grava na hora (mat_foto); no novo, vai junto com o cadastro
  var painelFoto = e(Painel,{t:"Foto do material", ic:"image"},
    e(FotoMaterial,{foto:novo ? ft[0] : m.foto, rot:novo ? "Foto do material" : m.material, tam:"g"}),
    e(EscolherFoto,{foto:novo ? ft[0] : m.foto, disabled:!p.pode.compra, onFoto:function(f){ if(novo) ft[1](f); else x.exec("mat_foto", {id:m.id, foto:f}); }}));
  var catOps = cats.map(function(c){ return [String(c.id), c.nome]; });
  var fornOps = x.ce.fornecedores.filter(function(f){ return f.ativo!==false; }).map(function(f){ return [String(f.id), f.nome]; });
  var idv = function(s){ return s==="" ? undefined : isNaN(Number(s)) ? s : Number(s); };
  return e(Editor,{t:novo ? "Novo material" : "Editar material", sub:novo ? "Cadastro por categoria do estoque" : m.material, fechar:p.fechar, dados:novo ? null : e(DadosMaterial,{m:m}), tDados:"Situação atual", salvarRot:novo ? "Cadastrar material" : "Salvar alterações", semAut:!p.pode.compra,
    ini:{material:novo ? "" : m.material, unidade:novo ? "" : m.unidade, estoqueMinimo:novo ? "0" : String(m.estoqueMinimo), categoriaId:novo ? (cats[0] ? String(cats[0].id) : "") : String(m.categoriaId), fornecedorId:novo || m.fornecedorId==null ? "" : String(m.fornecedorId), observacoes:novo ? "" : (m.observacoes||"")},
    campos:[{k:"material", rot:"Material", tipo:"texto", obrig:true}, {k:"unidade", rot:"Unidade", tipo:"select", obrig:true, ops:UNIDADES.map(function(u){ return [ROTULO_UNIDADE[u], ROTULO_UNIDADE[u]]; }), vazio:"Selecione"}, {k:"estoqueMinimo", rot:"Estoque mínimo", tipo:"num", min:0, obrig:true},
      {k:"categoriaId", rot:"Categoria", tipo:"select", ops:catOps, obrig:true, vazio:catOps.length ? "Selecione" : "Cadastre uma categoria abaixo"}, {k:"fornecedorId", rot:"Fornecedor", tipo:"select", ops:fornOps, vazio:"Sem fornecedor definido"}, {k:"observacoes", rot:"Observações", tipo:"area"}],
    lateral:function(){ return !novo ? painelFoto : e("div",{className:"flex flex-col gap-2"}, painelFoto, e(Painel,{t:"Nova categoria", ic:"plus"}, e("input",{type:"text", value:nc[0], placeholder:"Nome da categoria", "aria-label":"Nome da nova categoria", onChange:function(ev){ nc[1](ev.target.value); }, className:"h-8 w-full rounded-lg border border-input bg-input/30 px-3 text-center text-[13px] outline-none"}),
      e(Bt,{ic:"plus", disabled:!nc[0].trim() || !p.pode.compra, semAut:true, onClick:function(){ if(x.exec("mcat_add", {tipoId:p.tipo, nome:nc[0]})) nc[1](""); }}, "Criar categoria"))); },
    valida:function(v){ if(Number(v.estoqueMinimo)<0) return "O estoque mínimo deve ser de 0 em diante."; return ""; },
    onSalvar:function(v){ var base = {material:v.material, unidade:v.unidade, estoqueMinimo:Number(v.estoqueMinimo), categoriaId:idv(v.categoriaId), fornecedorId:v.fornecedorId==="" ? null : idv(v.fornecedorId), observacoes:v.observacoes};
      return novo ? x.exec("mat_add", Object.assign({foto:ft[0] || undefined}, base)) : x.exec("mat_set", Object.assign({id:m.id}, base)); },
    onExcluir:novo ? null : function(){ return x.exec("mat_del", {id:m.id}); }});
}

// ───────────── janela do histórico (dados | linha do tempo | ações) ─────────────
function JanelaHistorico(p){
  var m = p.m, x = p.x, mais = useState(false), linha = historicoMaterial(x.s, m.id), lim = mais[0] ? linha.length : 25, pode = p.pode;
  var compras = m.andamento.todas;   // todas as compras do material (abertas primeiro na lista do selo; aqui da mais nova para a mais antiga), inclusive as encerradas
  return e(Janela,{t:"Histórico do material", sub:m.material, fechar:p.fechar, colunas:[
    e(Painel,{key:"d", t:"Dados", estado:"feito"}, e(DadosMaterial,{m:m}), m.observacoes && e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[12px] text-white/80"}, m.observacoes)),
    e(Painel,{key:"l", t:"Linha do tempo", ic:"clock-counter-clockwise", estado:"atual"},
      linha.length ? e("div",{className:"flex flex-col gap-1.5"}, linha.slice(0, lim).map(function(h){ var a = ACOES_HIST[h.acao] || [h.acao, "circle"];
        return e("div",{key:h.id, className:"flex flex-col items-center gap-0.5 rounded-lg bg-white/5 px-2 py-1.5 text-center ring-1 ring-white/10"},
          e(Selo,{cor:h.acao==="saida" ? "alerta" : h.acao==="entrada" ? "ok" : "info", ic:a[1]}, a[0]), e("span",{className:"text-[12px]"}, h.texto || "—"), e("span",{className:"text-[11px] text-white/55"}, formatarDataHora(h.em)+" · "+(h.por||"—"))); }),
        linha.length>lim && e(BtMini,{onClick:function(){ mais[1](true); }}, "Ver mais "+(linha.length-lim))) : e(Vazio,{ic:"clock-counter-clockwise"}, "Nenhum registro para este material.")),
    e(Painel,{key:"a", t:"Ações", ic:"gear"},
      e(Bt,{tipo:"forte", ic:"list-checks", disabled:!pode.contagem, semAut:true, onClick:function(){ p.abrir("contar", m.id); }}, "Contar"),
      e(Bt,{ic:"arrows-left-right", disabled:!pode.contagem, semAut:true, onClick:function(){ p.abrir("mov", m.id); }}, "Entrada, saída ou ajuste"),
      e(Bt,{ic:"shopping-cart-simple", disabled:!pode.compra, semAut:true, onClick:function(){ p.abrir("pedir", m.id); }}, "Pedir compra"),
      e(Bt,{ic:"pencil-simple", disabled:!pode.compra, semAut:true, onClick:function(){ p.abrir("edit", m.id); }}, "Editar"),
      e(Bt,{ic:"archive", disabled:!pode.aprovacao, semAut:true, onClick:function(){ p.parar(m, !m.parado); }}, m.parado ? "Reativar material" : "Marcar como parado"),
      e("div",{className:"flex flex-col items-center gap-1.5 border-t border-white/10 pt-2"}, e("span",{className:"text-[11px] font-bold uppercase text-white"}, "Compras deste material"),
        e(SeloAndamento,{and:m.andamento, onClick:function(){ if(m.andamento.principal && m.andamento.principal.tipo==="pedido") p.verCompra(m.andamento.principal); }}),
        compras.length ? e(ListaCompras,{lista:compras, ver:p.verCompra}) : e("span",{className:"text-[11px] text-white/70"}, "Nenhuma compra registrada.")),
      e("div",{className:"flex flex-col items-center gap-1.5 border-t border-white/10 pt-2"}, e("span",{className:"text-[11px] font-bold uppercase text-white"}, "Foto do material"),
        e(EscolherFoto,{foto:m.foto, disabled:!pode.compra, onFoto:function(f){ x.exec("mat_foto", {id:m.id, foto:f}); }}))),
  ]});
}

// ───────────── tela ─────────────
// ESTOQUE DE MATERIAL no padrão do Funil de compras (Marcus, 17/11/2026), JUNTO com o trabalho do Nickolas (16/11/2026: andamento da compra, foto e carrinho):
// bloco azul, uma faixa de menus suspensos e UMA tabela com filtro e ordem em cada coluna. Os três tipos aparecem juntos (sem filtro de tipo) e a tabela fica separada por fornecedor.
// Os números que ficavam em cartões (críticos, em atenção, esperando decisão, compras chegando) foram para dentro das opções dos filtros; a próxima contagem fica na barra azul.
// Do Nickolas continuam: o Andamento da compra (coluna; clicar abre a compra em Compras), a foto (coluna Foto: ícone que amplia), o carrinho (Pedir compra) e as janelas de contar, mover, editar e histórico.
var num = function(n){ return Number(n || 0).toLocaleString("pt-BR"); };
var CLASSE_STATUS = {CRITICO:"text-destructive", ATENCAO:"text-warning", OK:"text-success"};
var CLASSE_AND = {alerta:"text-warning", ok:"text-success", info:"", neutro:""};   // andamento da compra na tabela: texto simples, sem pílula (cor só para estado)
function AbaEstoqueMaterial(pr){
  var x = useCe(), s = x.s, cfg = x.cfg, tipos = cfg.tipos;
  var sC = useState(""), sF = useState(""), sSt = useState(""), sSi = useState(""), sMo = useState("ativos"), sJ = useState((pr && pr.janIni) || null);
  var st = sSt[0], si = sSi[0], modo = sMo[0], jan = sJ[0];
  var pode = {contagem:x.pode("CONTAGEM"), compra:x.pode("COMPRA"), aprovacao:x.pode("APROVACAO")};
  var res = {totalItens:0, ok:0}, alertas = {criticosOuZerados:0, atencao:0, comprasChegando:0, aguardandoAprovacao:0};
  tipos.forEach(function(t){ var r = resumoAba(s, t.id), a = alertasDoTipo(s, t.id); res.totalItens += r.totalItens; res.ok += r.ok; Object.keys(alertas).forEach(function(k){ alertas[k] += a[k]; }); });
  var grupos = [].concat.apply([], tipos.map(function(t){ return agruparPorStatus(s, t.id, {q:"", status:st, situacao:si}); }));
  var doGrupo = function(g){ return modo==="parados" ? g.parados : g.ativos; };
  var catOps = grupos.filter(function(g){ return doGrupo(g).length; }).map(function(g){ return [String(g.categoria.id), normal(g.categoria.nome)+" · "+doGrupo(g).length]; }).sort(function(a, b){ return a[1].localeCompare(b[1], "pt-BR"); }), cat = catOps.some(function(o){ return o[0]===sC[0]; }) ? sC[0] : "";
  var todos = [].concat.apply([], grupos.filter(function(g){ return !cat || String(g.categoria.id)===cat; }).map(function(g){ return doGrupo(g).map(function(m){ return {m:m, cat:g.categoria.nome, forn:normal(m.fornecedor) || "Sem fornecedor"}; }); }));
  var contaForn = todos.reduce(function(o, z){ o[z.forn] = (o[z.forn] || 0)+1; return o; }, {});
  var fornOps = Object.keys(contaForn).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(n){ return [n, n+" · "+contaForn[n]]; }), forn = fornOps.some(function(o){ return o[0]===sF[0]; }) ? sF[0] : "";
  var mats = todos.filter(function(z){ return !forn || z.forn===forn; }).sort(function(a, b){ return a.forn.localeCompare(b.forn, "pt-BR") || normal(a.m.material).localeCompare(normal(b.m.material), "pt-BR"); });   // separado por fornecedor: ordem de fornecedor e, dentro dele, de material
  var nParados = tipos.reduce(function(t, tp){ return t+agruparPorStatus(s, tp.id, {q:"", status:st, situacao:si}).reduce(function(n, g){ return n+g.parados.length; }, 0); }, 0);
  var proxima = proximaContagem(cfg), filtro = !!(cat || forn || st || si);
  var abrir = function(k, id){ sJ[1]({k:k, id:id}); }, fechar = function(){ sJ[1](null); };
  var parar = function(m, v){ x.exec("mat_parado", {id:m.id, parado:v}); };
  // abrir a compra ligada (16/11/2026, Nickolas): a MESMA janela da área de Compras, com as mesmas ações e permissões (mudar o andamento aqui muda o mesmo registro)
  var cc = useCompras(), ac = useAcoes(cc);
  var verCompra = function(alvo){
    if(alvo && alvo.tipo==="pedido") return ac.abrir(alvo.id);
    if(alvo && alvo.tipo==="sol") return;
    var and = alvo && alvo.andamento; if(!and) return;
    if(and.abertas.length===1 && and.principal.tipo==="pedido") return ac.abrir(and.principal.id);
    abrir("hist", alvo.id);   // várias compras, só antigas ou nenhuma: a lista completa fica no histórico
  };
  var limpar = function(){ sC[1](""); sF[1](""); sSt[1](""); sSi[1](""); };
  var mAtual = jan && jan.id!=null ? (function(){ var bruto = s.ce.materiais.filter(function(mm){ return String(mm.id)===String(jan.id); })[0]; return bruto ? materialVisto(s, bruto) : null; })() : null;
  var catAtual = cat ? s.ce.matCategorias.filter(function(c){ return String(c.id)===cat; })[0] : null;
  var tipo = (mAtual && mAtual.tipoId) || (catAtual && catAtual.tipoId) || tipos[0].id;   // a janela de cadastro mostra as categorias do tipo do material (ou da categoria escolhida no filtro)
  var comuns = {m:mAtual, x:x, pode:pode, fechar:fechar, tipo:tipo, verCompra:verCompra};

  // filtros compactos (Marcus, 17/11/2026: "compacta mais esses filtros, fonte menor"): letra de 11 px e largura só do necessário
  var SEL_P = "h-7 w-auto max-w-[11rem] shrink-0 rounded-md border border-white/50 bg-[#14233f] px-1.5 text-[11px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white";   // padrao-ok: filtros menores na faixa azul (Marcus, 17/11/2026)
  var BTN_P = "h-7 shrink-0 whitespace-nowrap rounded-md border border-white/50 bg-[#14233f] px-2 text-[11px] font-semibold text-white hover:bg-white/15";   // padrao-ok: botões menores na faixa azul (Marcus, 17/11/2026)
  var sel = function(rotulo, valor, aoMudar, opcoes, semTodos){ return e("select",{"aria-label":rotulo, value:valor, onChange:function(ev){ aoMudar(ev.target.value); }, className:SEL_P}, !semTodos && e("option",{value:""}, rotulo), opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
  var opAnd = [["SEM", "Sem compra em andamento"], ["DECISAO", "Esperando decisão · "+alertas.aguardandoAprovacao]].concat(ANDAMENTOS.map(function(k){ return [k, ROTULO_ANDAMENTO[k]+(k==="ENTREGA" ? " · "+alertas.comprasChegando : "")]; }), [["VERIFICAR", ROTULO_SITUACAO.VERIFICAR], ["VERIFICAR_UNIDADE", ROTULO_SITUACAO.VERIFICAR_UNIDADE]]);
  var faixa = e("div",{className:"flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    sel("Todos os fornecedores", forn, sF[1], fornOps),
    sel("Todas as categorias", cat, sC[1], catOps),
    sel("Todos os estoques", st, sSt[1], [["CRITICO", "Crítico · "+alertas.criticosOuZerados], ["ATENCAO", "Atenção · "+alertas.atencao], ["OK", "OK · "+res.ok]]),
    sel("Todo andamento da compra", si, sSi[1], opAnd),
    sel("Materiais", modo, sMo[1], [["ativos", "Ativos · "+res.totalItens], ["parados", "Parados · "+nParados]], true),
    filtro && e("button",{type:"button", onClick:limpar, className:BTN_P}, "Limpar"),
    e("button",{type:"button", disabled:!pode.compra, onClick:function(){ abrir("novo", null); }, title:pode.compra ? "Cadastrar um material" : "Sem autorização", className:"ml-auto h-7 shrink-0 whitespace-nowrap rounded-md border border-white/50 bg-white px-2 text-[11px] font-semibold text-[#14233f] disabled:opacity-40"}, "Novo material"));   // padrao-ok: botão menor na faixa azul (Marcus, 17/11/2026)

  var linhas = mats.map(function(o){ var m = o.m, a = m.andamento || {rotulo:"—", extra:0};
    return {id:m.id, _m:m, forn:o.forn, material:normal(m.material), cat:normal(o.cat), un:m.unidade || "—", saldo:num(m.estoqueAtual), min:num(m.estoqueMinimo), estoque:m.parado ? "Parado" : ({CRITICO:"Crítico", ATENCAO:"Atenção", OK:"OK"})[m.status], st:m.parado ? "" : m.status,
      compra:a.rotulo+(a.extra ? " +"+a.extra : "")+(m.nota ? " · "+m.nota : ""), contagem:m.ultimaContagem || ""}; });
  var cols = [{k:"forn", t:"Fornecedor"}, {k:"material", t:"Material"}, {k:"foto", t:"Foto", render:function(v, l){ return l._m.foto ? e(BotaoFoto,{foto:l._m.foto, rot:l._m.material}) : ""; }}, {k:"cat", t:"Categoria"}, {k:"un", t:"Unidade"},
    {k:"saldo", t:"Saldo", cor:function(l){ return CLASSE_STATUS[l.st] || ""; }}, {k:"min", t:"Mínimo"}, {k:"estoque", t:"Estoque", cor:function(l){ return CLASSE_STATUS[l.st] || ""; }},
    {k:"compra", t:"Compra", render:function(v, l){ var a = l._m.andamento; return a && a.etapa ? e("button",{type:"button", title:"Abrir a compra", onClick:function(ev){ ev.stopPropagation(); verCompra(l._m); }, className:"cursor-pointer font-semibold hover:underline "+(CLASSE_AND[COR_AND[a.etapa]] || "")}, v) : v; }},
    {k:"contagem", t:"Última contagem", fmt:formatarDia},
    {k:"acoes", t:"Ações", render:function(v, l){ var m = l._m;
      // um menu suspenso com o nome de cada ação (antes eram 6 ícones sem nome); a opção sem autorização aparece desligada
      var ops = m.parado
        ? [["hist", "Ver histórico", true], ["reativar", "Reativar material", pode.aprovacao]]
        : [["contar", "Contar", pode.contagem], ["mov", "Entrada, saída ou ajuste", pode.contagem], ["pedir", "Pedir compra", pode.compra], ["hist", "Ver histórico", true], ["edit", "Editar material", pode.compra], ["parar", "Marcar como parado", pode.aprovacao]];
      var vai = function(k){ if(k==="reativar") parar(m, false); else if(k==="parar") parar(m, true); else if(k) abrir(k, m.id); };
      return e("select",{value:"", "aria-label":"Ações de "+m.material, onClick:function(ev){ ev.stopPropagation(); }, onChange:function(ev){ vai(ev.target.value); ev.target.value = ""; }, className:"cursor-pointer text-center"},
        e("option",{value:""}, "Ações"), ops.map(function(o){ return e("option",{key:o[0], value:o[0], disabled:!o[2]}, o[1]+(o[2] ? "" : " (sem autorização)")); })); }}];
  var tabela = e(TabelaPlanilha,{key:"est"+cat+forn+st+si+modo, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, limite:300, aoClicar:function(l){ abrir("hist", l._m.id); }, vazio:filtro ? "Nenhum material encontrado com os filtros aplicados." : modo==="parados" ? "Nenhum material parado." : "Nenhum material cadastrado nesta aba."});

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Estoque de material", compacto:true, dir:proxima ? "Próxima contagem: "+formatarDia(proxima) : undefined}, faixa, tabela),
    jan && jan.k==="novo" && e(JanelaMaterial,{m:null, x:x, pode:pode, fechar:fechar, tipo:tipo}),
    mAtual && jan.k==="contar" && e(JanelaContar,comuns),
    mAtual && jan.k==="mov" && e(JanelaMov,comuns),
    mAtual && jan.k==="pedir" && e(JanelaPedir,comuns),
    mAtual && jan.k==="edit" && e(JanelaMaterial,comuns),
    mAtual && jan.k==="hist" && e(JanelaHistorico,Object.assign({abrir:abrir, parar:parar}, comuns)),
    ac.janelas());   // janela da compra (a mesma de Compras), por cima das do estoque
}


export { AbaEstoqueMaterial, JanelaPedir };   // JanelaPedir também é usada pelo Painel (PainelComprasEstoque.js)
