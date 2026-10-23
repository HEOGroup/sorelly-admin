// Sorelly Admin · montagem — pages/compras/EstoqueMaterial.js
// Materiais & Estoque → aba "Estoque de material": materiais por aba (tipo) e categoria, em cartões num mosaico, com contagem, entrada/saída/ajuste, pedido de compra, histórico e edição.
// Regras no domínio (domain/compras-estoque.js, estado s.ce, ações CE). Aqui só se desenha e se chamam as ações. Cor do setor: azul.
import { Abas, BarraFiltros, Faixa, Janela, Mosaico, Pagina, Tab, Td, ESTADO, degrade } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { ROTULO_SITUACAO, ROTULO_SOL, SITUACOES, agruparPorStatus, alertasDoTipo, formatarDataHora, formatarDia, formatarReais, hojeSP, historicoMaterial, materialVisto, proximaContagem, resumoAba } from "@/apps/montagem/domain/compras-estoque";
import { Bt, BtMini, Busca, Editor, Ic, Ind, Nivel, Num, Painel, Selo, Sel, Vazio, useCe, AZUL } from "@/apps/montagem/pages/compras/visualCompras";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var COR_STATUS = {CRITICO:"ruim", ATENCAO:"alerta", OK:"ok"};
var IC_STATUS = {CRITICO:"warning-octagon", ATENCAO:"warning", OK:"check-circle"};
var ROT_STATUS = {CRITICO:"Crítico", ATENCAO:"Atenção", OK:"OK"};
var ACOES_HIST = {CRIADO:["Cadastrado", "plus-circle"], EDITADO:["Editado", "pencil-simple"], OBSERVACAO:["Observação", "note"], EXCLUIDO:["Excluído", "trash"], contagem:["Contagem", "list-checks"], entrada:["Entrada", "arrow-fat-down"], saida:["Saída", "arrow-fat-up"], ajuste:["Ajuste", "sliders-horizontal"]};

// ───────────── dados do material (coluna "já preenchida" das janelas) ─────────────
function DadosMaterial(p){
  var m = p.m, c = ESTADO[COR_STATUS[m.status]];
  return e("div",{className:"flex flex-col items-center gap-1.5"},
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
  var aguarda = m.aguardandoDecisao, chega = m.comprasChegando;
  return e("div",{className:"flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center", style:degrade(COR_STATUS[m.status])},
    e("button",{type:"button", onClick:function(){ p.abrir("hist", m.id); }, title:"Abrir o histórico", className:"cursor-pointer text-[13.5px] font-bold leading-tight hover:underline"}, m.material),
    e("span",{className:"text-[11.5px] leading-tight text-white/65"}, [m.unidade, m.fornecedor].filter(Boolean).join(" · ")),
    e("div",{className:"grid w-full grid-cols-2 gap-1.5"}, e(Num,{t:"Saldo", v:m.estoqueAtual, cor:COR_STATUS[m.status]}), e(Num,{t:"Mínimo", v:m.estoqueMinimo})),
    e(Nivel,{atual:m.estoqueAtual, minimo:m.estoqueMinimo, cor:cor}),
    e("div",{className:"flex flex-wrap justify-center gap-1"},
      e(Selo,{cor:COR_STATUS[m.status], ic:IC_STATUS[m.status]}, ROT_STATUS[m.status]),
      m.situacao!=="NAO_PRECISA_COMPRAR" && e(Selo,{cor:aguarda ? "alerta" : chega ? "info" : "neutro"}, ROTULO_SITUACAO[m.situacao]||m.situacao),
      chega>0 && e(Selo,{cor:"info", ic:"truck", titulo:"Compras aprovadas a caminho"}, chega)),
    e("span",{className:"text-[11px] text-white/55"}, m.ultimaContagem ? "Contado em "+formatarDia(m.ultimaContagem) : "Sem contagem"),
    e("div",{className:"flex flex-wrap justify-center gap-1"},
      e(Ic,{ic:"list-checks", titulo:"Contar", disabled:!pode.contagem, semAut:true, forte:true, onClick:function(){ p.abrir("contar", m.id); }}),
      e(Ic,{ic:"arrows-left-right", titulo:"Entrada, saída ou ajuste", disabled:!pode.contagem, semAut:true, onClick:function(){ p.abrir("mov", m.id); }}),
      e(Ic,{ic:"shopping-cart-simple", titulo:"Pedir compra", disabled:!pode.compra, semAut:true, onClick:function(){ p.abrir("pedir", m.id); }}),
      e(Ic,{ic:"clock-counter-clockwise", titulo:"Histórico", onClick:function(){ p.abrir("hist", m.id); }}),
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

// ───────────── janela de pedido de compra (solicitação) ─────────────
function JanelaPedir(p){
  var m = p.m, x = p.x, abertas = m.solicitacoes.filter(function(s){ return s.status==="SOLICITADO" || s.status==="APROVADO"; });
  return e(Editor,{t:"Pedido de compra", sub:m.material, fechar:p.fechar, dados:e("div",{className:"flex flex-col items-center gap-2"}, e(DadosMaterial,{m:m}),
      abertas.length>0 && e("div",{className:"flex flex-col items-center gap-1"}, e("span",{className:"text-[11px] font-bold uppercase text-white/70"}, "Solicitações em andamento"),
        abertas.map(function(s){ return e(Selo,{key:s.id, cor:s.status==="APROVADO" ? "info" : "alerta"}, ROTULO_SOL[s.status]+" · "+s.quantidade); }))), tDados:"Material", salvarRot:"Solicitar compra", icSalvar:"shopping-cart-simple", semAut:!p.pode.compra,
    ini:{quantidade:"", fornecedorId:m.fornecedorId==null ? "" : String(m.fornecedorId), observacao:""},
    campos:[{k:"quantidade", rot:"Quantidade", tipo:"num", min:1, obrig:true}, {k:"fornecedorId", rot:"Fornecedor", tipo:"select", vazio:"Sem fornecedor definido", ops:x.ce.fornecedores.filter(function(f){ return f.ativo!==false; }).map(function(f){ return [String(f.id), f.nome]; })}, {k:"observacao", rot:"Observação", tipo:"area", ph:"Opcional"}],
    valida:function(v){ return Number(v.quantidade)<1 ? "A quantidade deve ser de 1 em diante." : ""; },
    onSalvar:function(v){ return x.exec("sol_add", {materialId:m.id, quantidade:Number(v.quantidade), fornecedorId:v.fornecedorId==="" ? undefined : isNaN(Number(v.fornecedorId)) ? v.fornecedorId : Number(v.fornecedorId), observacao:v.observacao}); }});
}

// ───────────── janela de cadastro e edição do material ─────────────
function JanelaMaterial(p){
  var m = p.m, x = p.x, novo = !m, cats = x.ce.matCategorias.filter(function(c){ return c.tipoId===p.tipo; }), nc = useState("");
  var catOps = cats.map(function(c){ return [String(c.id), c.nome]; });
  var fornOps = x.ce.fornecedores.filter(function(f){ return f.ativo!==false; }).map(function(f){ return [String(f.id), f.nome]; });
  var idv = function(s){ return s==="" ? undefined : isNaN(Number(s)) ? s : Number(s); };
  return e(Editor,{t:novo ? "Novo material" : "Editar material", sub:novo ? "Cadastro por categoria do estoque" : m.material, fechar:p.fechar, dados:novo ? null : e(DadosMaterial,{m:m}), tDados:"Situação atual", salvarRot:novo ? "Cadastrar material" : "Salvar alterações", semAut:!p.pode.compra,
    ini:{material:novo ? "" : m.material, unidade:novo ? "" : m.unidade, estoqueMinimo:novo ? "0" : String(m.estoqueMinimo), categoriaId:novo ? (cats[0] ? String(cats[0].id) : "") : String(m.categoriaId), fornecedorId:novo || m.fornecedorId==null ? "" : String(m.fornecedorId), observacoes:novo ? "" : (m.observacoes||"")},
    campos:[{k:"material", rot:"Material", tipo:"texto", obrig:true}, {k:"unidade", rot:"Unidade", tipo:"texto", obrig:true, ph:"Ex.: unid, caixa, pacote"}, {k:"estoqueMinimo", rot:"Estoque mínimo", tipo:"num", min:0, obrig:true},
      {k:"categoriaId", rot:"Categoria", tipo:"select", ops:catOps, obrig:true, vazio:catOps.length ? "Selecione" : "Cadastre uma categoria abaixo"}, {k:"fornecedorId", rot:"Fornecedor", tipo:"select", ops:fornOps, vazio:"Sem fornecedor definido"}, {k:"observacoes", rot:"Observações", tipo:"area"}],
    lateral:function(){ return novo && e(Painel,{t:"Nova categoria", ic:"plus"}, e("input",{type:"text", value:nc[0], placeholder:"Nome da categoria", "aria-label":"Nome da nova categoria", onChange:function(ev){ nc[1](ev.target.value); }, className:"h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-center text-[13px] outline-none"}),
      e(Bt,{ic:"plus", disabled:!nc[0].trim() || !p.pode.compra, semAut:true, onClick:function(){ if(x.exec("mcat_add", {tipoId:p.tipo, nome:nc[0]})) nc[1](""); }}, "Criar categoria")); },
    valida:function(v){ if(Number(v.estoqueMinimo)<0) return "O estoque mínimo deve ser de 0 em diante."; return ""; },
    onSalvar:function(v){ var base = {material:v.material, unidade:v.unidade, estoqueMinimo:Number(v.estoqueMinimo), categoriaId:idv(v.categoriaId), fornecedorId:v.fornecedorId==="" ? null : idv(v.fornecedorId), observacoes:v.observacoes};
      return novo ? x.exec("mat_add", base) : x.exec("mat_set", Object.assign({id:m.id}, base)); },
    onExcluir:novo ? null : function(){ return x.exec("mat_del", {id:m.id}); }});
}

// ───────────── janela do histórico (dados | linha do tempo | ações) ─────────────
function JanelaHistorico(p){
  var m = p.m, x = p.x, mais = useState(false), linha = historicoMaterial(x.s, m.id), lim = mais[0] ? linha.length : 25, pode = p.pode;
  var sols = m.solicitacoes.slice().sort(function(a, b){ return b.solicitadoEm.localeCompare(a.solicitadoEm); });
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
      sols.length>0 && e("div",{className:"flex flex-col items-center gap-1 border-t border-white/10 pt-2"}, e("span",{className:"text-[11px] font-bold uppercase text-white/70"}, "Solicitações de compra"),
        sols.slice(0, 6).map(function(s){ return e("span",{key:s.id, className:"text-[12px]"}, formatarDia(String(s.solicitadoEm).slice(0, 10))+" · "+s.quantidade+" · "+(ROTULO_SOL[s.status]||s.status)); }))),
  ]});
}

// ───────────── tela ─────────────
function AbaEstoqueMaterial(pr){
  var x = useCe(), s = x.s, cfg = x.cfg, tipos = cfg.tipos;
  var sT = useState(tipos[0].id), sQ = useState(""), sSt = useState(""), sSi = useState(""), sJ = useState((pr && pr.janIni) || null);
  var tipo = tipos.some(function(t){ return t.id===sT[0]; }) ? sT[0] : tipos[0].id, q = sQ[0], st = sSt[0], si = sSi[0], jan = sJ[0];
  var pode = {contagem:x.pode("CONTAGEM"), compra:x.pode("COMPRA"), aprovacao:x.pode("APROVACAO")};
  var res = resumoAba(s, tipo), alertas = alertasDoTipo(s, tipo);
  var grupos = agruparPorStatus(s, tipo, {q:q, status:st, situacao:si});
  var filtro = !!(q || st || si), visiveis = grupos.reduce(function(t, g){ return t+g.ativos.length; }, 0);
  var parados = [].concat.apply([], grupos.map(function(g){ return g.parados; }));
  var proxima = proximaContagem(cfg);
  var abrir = function(k, id){ sJ[1]({k:k, id:id}); }, fechar = function(){ sJ[1](null); };
  var parar = function(m, v){ x.exec("mat_parado", {id:m.id, parado:v}); };
  var limpar = function(){ sQ[1](""); sSt[1](""); sSi[1](""); };
  var mAtual = jan && jan.id!=null ? (function(){ var bruto = s.ce.materiais.filter(function(mm){ return String(mm.id)===String(jan.id); })[0]; return bruto ? materialVisto(s, bruto) : null; })() : null;
  var comuns = {m:mAtual, x:x, pode:pode, fechar:fechar, tipo:tipo};

  var blocos = grupos.filter(function(g){ return g.ativos.length; }).map(function(g){
    return e(BlocoBarra,{key:g.categoria.id, cor:"azul", compacto:true, t:g.categoria.nome, dir:g.ativos.length},
      e("div",{className:"grid gap-2 p-2", style:{gridTemplateColumns:"repeat(auto-fill, minmax(12.5rem, 1fr))"}}, g.ativos.map(function(m){ return e(CartaoMaterial,{key:m.id, m:m, pode:pode, abrir:abrir, parar:parar}); })));
  });

  return e(Pagina,null,
    e(Abas,{cor:AZUL, abas:tipos.map(function(t){ return [t.id, t.nome]; }), atual:tipo, onMudar:function(k){ sT[1](k); limpar(); }}),
    e(Faixa,{n:5},
      e(Ind,{t:"Críticos ou zerados", v:alertas.criticosOuZerados, cor:"ruim", on:st==="CRITICO", onClick:function(){ sSt[1](st==="CRITICO" ? "" : "CRITICO"); }}),
      e(Ind,{t:"Em atenção", v:alertas.atencao, cor:"alerta", on:st==="ATENCAO", onClick:function(){ sSt[1](st==="ATENCAO" ? "" : "ATENCAO"); }}),
      e(Ind,{t:"Aguardando aprovação", v:alertas.aguardandoAprovacao, cor:"cian", on:si==="SOLICITADO", onClick:function(){ sSi[1](si==="SOLICITADO" ? "" : "SOLICITADO"); }}),
      e(Ind,{t:"Compras chegando", v:alertas.comprasChegando, cor:"info", on:si==="AGUARDANDO_ENTREGA", onClick:function(){ sSi[1](si==="AGUARDANDO_ENTREGA" ? "" : "AGUARDANDO_ENTREGA"); }}),
      e(Ind,{t:"Itens na aba", v:res.totalItens, cor:"total", sub:res.ok+" em dia"})),
    e(BarraFiltros,{ativo:filtro, onLimpar:limpar},
      e(Busca,{v:q, set:sQ[1], ph:"Buscar material ou fornecedor"}),
      e(Sel,{v:st, set:sSt[1], rot:"Situação do estoque", todos:"Todas as situações do estoque", opcoes:[["CRITICO", "Crítico"], ["ATENCAO", "Atenção"], ["OK", "OK"]]}),
      e(Sel,{v:si, set:sSi[1], rot:"Situação da compra", todos:"Todas as situações da compra", opcoes:SITUACOES.map(function(k){ return [k, ROTULO_SITUACAO[k]]; })}),
      e("span",{className:"inline-flex h-9 items-center gap-1 rounded-lg bg-white/5 px-3 text-[12.5px] font-bold ring-1 ring-white/10"}, e("b",{className:MONO}, visiveis), visiveis===1 ? "material" : "materiais"),
      proxima && e("span",{className:"inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[12px] ring-1 ring-white/10", title:"Próxima contagem prevista"}, e(Ph,{n:"calendar-check", s:14}), "Próxima contagem: "+formatarDia(proxima)),
      e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", disabled:!pode.compra, semAut:true, onClick:function(){ abrir("novo", null); }}, "Novo material")),
    blocos.length ? e(Mosaico,{min:"26rem"}, blocos) : e(Vazio,{ic:"package"}, filtro ? "Nenhum material encontrado com os filtros aplicados." : "Nenhum material cadastrado nesta aba."),
    parados.length>0 && e(BlocoBarra,{cor:"prata", compacto:true, t:"Materiais parados", dir:parados.length},
      e("div",{className:"p-2"}, e(Tab,{cols:["Material", "Categoria", "Saldo", "Ações"]}, parados.map(function(m){ return e("tr",{key:m.id, className:"border-t border-white/10"},
        e(Td,{forte:true}, m.material), e(Td,null, m.categoriaNome), e(Td,{dinheiro:true}, m.estoqueAtual),
        e(Td,null, e("div",{className:"flex justify-center gap-1"}, e(BtMini,{ic:"clock-counter-clockwise", onClick:function(){ abrir("hist", m.id); }, titulo:"Histórico"}, "Histórico"), e(BtMini,{ic:"arrow-counter-clockwise", disabled:!pode.aprovacao, forte:true, onClick:function(){ parar(m, false); }, titulo:pode.aprovacao ? "Reativar" : "Sem autorização"}, "Reativar")))); })))),
    jan && jan.k==="novo" && e(JanelaMaterial,{m:null, x:x, pode:pode, fechar:fechar, tipo:tipo}),
    mAtual && jan.k==="contar" && e(JanelaContar,comuns),
    mAtual && jan.k==="mov" && e(JanelaMov,comuns),
    mAtual && jan.k==="pedir" && e(JanelaPedir,comuns),
    mAtual && jan.k==="edit" && e(JanelaMaterial,comuns),
    mAtual && jan.k==="hist" && e(JanelaHistorico,Object.assign({abrir:abrir, parar:parar}, comuns)));
}

export { AbaEstoqueMaterial };
