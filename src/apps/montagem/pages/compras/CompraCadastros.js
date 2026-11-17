// Sorelly Admin · montagem — pages/compras/CompraCadastros.js
// Materiais & Estoque → aba "Cadastros": fornecedores, contas por CNPJ, catálogo de itens, setores, categorias de compra e categorias do estoque.
// PADRÃO AZUL (Marcus, 17/11/2026: "refaz cadastros e configurações no mesmo padrão"): um bloco azul com UMA faixa (menu suspenso com o cadastro e o botão Novo) e UMA tabela com filtro e ordem em cada coluna; cada linha abre a janela com colunas (Editor). Regras no domínio (forn_*, conta_*, catalogo_*, setor_*, cat_*, mcat_*).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { SEL } from "@/apps/montagem/components/faixa-azul";
import { normal } from "@/apps/montagem/pages/compras/pecas";
import { FORMAS_PAGAMENTO, PAGAVEL_STATUS, ROTULO_FORMA, ROTULO_UNIDADE, UNIDADES, formatarDia, formatarReais, opcoesCnpj, rotuloConta, rotuloCnpj, totalDaCompra } from "@/apps/montagem/domain/compras-estoque";
import { Editor, Num, useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var idv = function(s){ return s==="" || s==null ? null : isNaN(Number(s)) ? s : Number(s); };
var digitos = function(v){ return String(v||"").replace(/\D/g, ""); };
var IC_FORMA = {CARTAO:"credit-card", PIX:"qr-code", DINHEIRO:"coins", BOLETO:"barcode"};

// estatística do fornecedor: compras efetuadas, total no ano e última compra (pedidos do módulo de compras)
function statsForn(ce, f){
  var ano = String(new Date().getFullYear()), ps = ce.pedidos.filter(function(p){ return String(p.fornecedorId)===String(f.id) && PAGAVEL_STATUS.indexOf(p.status)>=0; });
  var doAno = ps.filter(function(p){ return String(p.compradoEm||p.solicitadoEm).slice(0, 4)===ano; }), ult = ps.map(function(p){ return String(p.compradoEm||p.solicitadoEm).slice(0, 10); }).sort().pop();
  return {n:doAno.length, total:doAno.reduce(function(t, p){ return t+(totalDaCompra(p)||0); }, 0), ultima:ult||""};
}

function AbaCompraCadastros(pr){
  var x = useCe(), ce = x.ce, cfg = x.cfg, sJ = useState((pr && pr.janIni) || null), sCad = useState("forn");
  var jan = sJ[0], ok = x.cadastros, fechar = function(){ sJ[1](null); }, abrir = function(k, id, extra){ sJ[1](Object.assign({k:k, id:id==null ? null : id}, extra)); };
  var acha = function(lista, id){ return lista.filter(function(z){ return String(z.id)===String(id); })[0] || null; };
  var classOps = cfg.classificacoes.map(function(c){ return [c.id, c.nome]; });

  // ----- um cadastro por vez, cada um numa tabela (colunas = o que antes aparecia nos cartões)
  var CADASTROS = [["forn", "Fornecedores", ce.fornecedores.length, "Novo fornecedor"], ["conta", "Contas por CNPJ", ce.contas.length, "Nova conta"], ["catalogo", "Catálogo de itens", ce.catalogo.length, "Novo item"],
    ["setor", "Setores solicitantes", ce.setores.length, "Novo setor"], ["cat", "Categorias de compra", ce.categorias.length, "Nova categoria"], ["mcat", "Categorias do estoque", ce.matCategorias.length, "Nova categoria"]];
  var tela = CADASTROS.some(function(c){ return c[0]===sCad[0]; }) ? sCad[0] : "forn", atual = CADASTROS.filter(function(c){ return c[0]===tela; })[0];
  var porNome = function(a, b){ return String(a.nome).localeCompare(String(b.nome), "pt-BR"); };
  var porOrdem = function(a, b){ return (a.ordem-b.ordem) || porNome(a, b); };
  var colSit = {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Ativo" || l.sit==="Ativa" ? "text-success" : ""; }};
  var cols, linhas;
  if(tela==="forn"){
    cols = [{k:"nome", t:"Fornecedor"}, {k:"doc", t:"Documento"}, {k:"tel", t:"Telefone ou e-mail"}, {k:"contato", t:"Contato"}, {k:"n", t:"Compras no ano"}, {k:"total", t:"Total no ano"}, {k:"ultima", t:"Última compra", fmt:formatarDia}, colSit];
    linhas = ce.fornecedores.slice().sort(porNome).map(function(f){ var st = statsForn(ce, f);
      return {id:f.id, nome:normal(f.nome), doc:f.documento || "—", tel:f.telefone || f.email || "—", contato:f.contato || "—", n:String(st.n), total:formatarReais(st.total), ultima:st.ultima || "", sit:f.ativo===false ? "Inativo" : "Ativo"}; });
  } else if(tela==="conta"){
    cols = [{k:"nome", t:"Conta"}, {k:"tipo", t:"Tipo"}, {k:"titular", t:"Titular"}, {k:"cnpj", t:"CNPJ pagador"}, colSit];
    linhas = ce.contas.slice().sort(function(a, b){ return String(a.cnpjId||"~").localeCompare(String(b.cnpjId||"~")); }).map(function(c){
      return {id:c.id, nome:c.rotulo || rotuloConta(c), tipo:ROTULO_FORMA[c.tipo] || c.tipo || "—", titular:c.titular || "—", cnpj:c.cnpjId ? rotuloCnpj(c.cnpjId, "", cfg) : "Sem CNPJ definido", sit:c.ativa===false ? "Inativa" : "Ativa"}; });
  } else if(tela==="catalogo"){
    cols = [{k:"nome", t:"Item"}, {k:"un", t:"Unidade"}, {k:"ref", t:"Preço de referência"}, {k:"cat", t:"Categoria de compra"}, {k:"cls", t:"Classificação"}, {k:"est", t:"Ligado ao estoque"}, {k:"apelidos", t:"Outros nomes"}];
    linhas = ce.catalogo.slice().sort(porNome).map(function(c){ var cl = cfg.classificacoes.filter(function(z){ return z.id===c.classificacao; })[0], ct = acha(ce.categorias, c.categoriaId);
      return {id:c.id, nome:normal(c.nome), un:ROTULO_UNIDADE[c.unidade] || c.unidade || "—", ref:c.precoRef!=null ? formatarReais(c.precoRef) : "—", cat:ct ? ct.nome : "—", cls:cl ? cl.nome : c.classificacao || "—", est:c.materialId!=null ? "Sim" : "Não", apelidos:(c.apelidos||[]).join(", ") || "—"}; });
  } else if(tela==="setor" || tela==="cat"){
    var ehS = tela==="setor";
    cols = [{k:"nome", t:ehS ? "Setor" : "Categoria"}].concat(ehS ? [{k:"cor", t:"Cor", render:function(v, l){ return e("span",{className:"inline-flex items-center justify-center gap-1.5"}, e("span",{"aria-hidden":true, className:"size-3 rounded-sm border border-white/40", style:{background:l.corHex}}), v); }}] : [], [{k:"ordem", t:"Ordem"}]);
    linhas = (ehS ? ce.setores : ce.categorias).slice().sort(porOrdem).map(function(it){ return {id:it.id, nome:normal(it.nome), cor:it.cor || "#3B82F6", corHex:it.cor || "#3B82F6", ordem:String(it.ordem)}; });
  } else {
    cols = [{k:"nome", t:"Categoria"}, {k:"aba", t:"Aba do estoque"}, {k:"qtd", t:"Materiais"}, {k:"ordem", t:"Ordem"}];
    linhas = ce.matCategorias.slice().sort(function(a, b){ return String(a.tipoId).localeCompare(String(b.tipoId)) || porOrdem(a, b); }).map(function(c){ var t = cfg.tipos.filter(function(z){ return z.id===c.tipoId; })[0];
      return {id:c.id, nome:normal(c.nome), aba:t ? t.nome : "—", qtd:String(ce.materiais.filter(function(m){ return String(m.categoriaId)===String(c.id); }).length), ordem:String(c.ordem)}; });
  }
  var tabela = e(TabelaPlanilha,{key:"cad"+tela, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, limite:300, aoClicar:function(l){ abrir(tela, l.id); }, vazio:"Nenhum cadastro nesta lista."});
  var faixa = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("select",{"aria-label":"Cadastro", value:tela, onChange:function(ev){ sCad[1](ev.target.value); }, className:SEL+" w-auto shrink-0"}, CADASTROS.map(function(c){ return e("option",{key:c[0], value:c[0]}, c[1]+" · "+c[2]); })),
    e("button",{type:"button", disabled:!ok, onClick:function(){ abrir(tela, null); }, title:ok ? "Cadastrar" : "Sem autorização", className:"ml-auto h-7 shrink-0 whitespace-nowrap rounded-md border border-white/50 bg-white px-2.5 text-[13px] font-semibold text-[#14233f] disabled:opacity-40"}, atual[3]));   // padrao-ok: botão menor na faixa azul, como no Funil de compras

  // ----- janelas
  var janela = null;
  if(jan){
    var k = jan.k, novo = jan.id==null;
    if(k==="forn"){ var f = novo ? null : acha(ce.fornecedores, jan.id), st = f ? statsForn(ce, f) : null;
      janela = (novo || f) && e(Editor,{t:novo ? "Novo fornecedor" : "Fornecedor", sub:f ? f.nome : "Cadastro de fornecedor", fechar:fechar, semAut:!ok, salvarRot:novo ? "Cadastrar fornecedor" : "Salvar alterações", titulos:["Identificação", "Contato e situação"],
        dados:st && e("div",{className:"flex flex-col items-center gap-1.5"}, e("div",{className:"grid w-full grid-cols-2 gap-1.5"}, e(Num,{t:"Compras no ano", v:st.n}), e(Num,{t:"Total no ano", v:formatarReais(st.total)})), e("span",{className:"text-[12px] text-white/70"}, st.ultima ? "Última compra em "+formatarDia(st.ultima) : "Sem compras registradas")), tDados:"Indicadores",
        ini:{nome:novo ? "" : f.nome, documento:novo ? "" : f.documento, telefone:novo ? "" : f.telefone, email:novo ? "" : f.email, contato:novo ? "" : f.contato, observacao:novo ? "" : f.observacao, ativo:novo ? true : f.ativo!==false},
        campos:[{k:"nome", rot:"Nome", tipo:"texto", obrig:true}, {k:"documento", rot:"CNPJ ou CPF", tipo:"texto", dica:"Opcional"}, {k:"telefone", rot:"Telefone ou WhatsApp", tipo:"texto"}, {k:"email", rot:"E-mail", tipo:"texto"}, {k:"contato", rot:"Pessoa de contato", tipo:"texto"}, {k:"observacao", rot:"Observações", tipo:"area"}, {k:"ativo", rot:"Fornecedor ativo", tipo:"bool"}],
        valida:function(v){ var d = digitos(v.documento); return d && d.length!==11 && d.length!==14 ? "Documento inválido: informe 11 dígitos (CPF) ou 14 dígitos (CNPJ)." : ""; },
        onSalvar:function(v){ return x.exec(novo ? "forn_add" : "forn_set", Object.assign({id:novo ? undefined : f.id}, v)); },
        onExcluir:novo ? null : function(){ return x.exec("forn_del", {id:f.id}); }}); }
    if(k==="conta"){ var c = novo ? null : acha(ce.contas, jan.id);
      janela = (novo || c) && e(Editor,{t:novo ? "Nova conta" : "Conta pagadora", sub:c ? rotuloConta(c) : "Conta vinculada a um CNPJ", fechar:fechar, semAut:!ok, salvarRot:novo ? "Cadastrar conta" : "Salvar alterações", titulos:["Conta", "Identificação"],
        ini:{tipo:novo ? "PIX" : c.tipo, titular:novo ? "" : c.titular, cnpjId:novo || !c.cnpjId ? "" : c.cnpjId, banco:novo ? "" : c.banco, documento:novo ? "" : c.documento, finalOuChave:novo ? "" : c.finalOuChave, rotulo:novo ? "" : c.rotulo, ativa:novo ? true : c.ativa!==false},
        campos:[{k:"tipo", rot:"Tipo", tipo:"botoes", ops:FORMAS_PAGAMENTO.map(function(z){ return [z, ROTULO_FORMA[z]]; })}, {k:"titular", rot:"Titular", tipo:"texto", obrig:true}, {k:"cnpjId", rot:"CNPJ pagador", tipo:"select", ops:opcoesCnpj(x.s).map(function(o){ return [o.id, o.rotulo]; }), vazio:"Sem CNPJ definido"},
          {k:"banco", rot:"Banco", tipo:"texto"}, {k:"documento", rot:"Documento do titular", tipo:"texto"}, {k:"finalOuChave", rot:"Final do cartão ou chave Pix", tipo:"texto"}, {k:"rotulo", rot:"Nome de exibição", tipo:"texto", dica:"Opcional"}, {k:"ativa", rot:"Conta ativa", tipo:"bool"}],
        onSalvar:function(v){ return x.exec(novo ? "conta_add" : "conta_set", Object.assign({id:novo ? undefined : c.id}, v, {cnpjId:v.cnpjId || null})); },
        onExcluir:novo ? null : function(){ return x.exec("conta_del", {id:c.id}); }}); }
    if(k==="setor" || k==="cat"){ var ehS = k==="setor", it = novo ? null : acha(ehS ? ce.setores : ce.categorias, jan.id), op = ehS ? "setor" : "cat";
      janela = (novo || it) && e(Editor,{t:(novo ? "Novo " : "")+(ehS ? "setor solicitante" : "categoria de compra"), sub:it ? it.nome : "Cadastro", fechar:fechar, semAut:!ok, salvarRot:novo ? "Cadastrar" : "Salvar alterações",
        ini:{nome:novo ? "" : it.nome, cor:novo ? "#3B82F6" : (it.cor || "#3B82F6"), ordem:novo ? String((ehS ? ce.setores : ce.categorias).length) : String(it.ordem)},
        campos:[{k:"nome", rot:"Nome", tipo:"texto", obrig:true}].concat(ehS ? [{k:"cor", rot:"Cor", tipo:"cor"}] : [], [{k:"ordem", rot:"Ordem de exibição", tipo:"num", min:0}]),
        onSalvar:function(v){ var d = {nome:v.nome, ordem:Number(v.ordem)||0}; if(ehS) d.cor = v.cor; if(!novo) d.id = it.id; return x.exec(op+(novo ? "_add" : "_set"), d); },
        onExcluir:novo ? null : function(){ return x.exec(op+"_del", {id:it.id}); }}); }
    if(k==="catalogo"){ var ci = novo ? null : acha(ce.catalogo, jan.id);
      janela = (novo || ci) && e(Editor,{t:novo ? "Novo item do catálogo" : "Item do catálogo", sub:ci ? ci.nome : "Cadastro de item de compra", fechar:fechar, semAut:!ok, salvarRot:novo ? "Cadastrar item" : "Salvar alterações", titulos:["Item", "Classificação e ligações"],
        ini:{nome:novo ? "" : ci.nome, unidade:novo ? "UNID" : ci.unidade, classificacao:novo ? (classOps[0] ? classOps[0][0] : "") : ci.classificacao, categoriaId:novo || ci.categoriaId==null ? "" : String(ci.categoriaId), materialId:novo || ci.materialId==null ? "" : String(ci.materialId), precoRef:novo || ci.precoRef==null ? 0 : ci.precoRef, apelidos:novo ? "" : (ci.apelidos||[]).join(", ")},
        campos:[{k:"nome", rot:"Item", tipo:"texto", obrig:true}, {k:"unidade", rot:"Unidade", tipo:"select", ops:UNIDADES.map(function(z){ return [z, ROTULO_UNIDADE[z]]; })}, {k:"precoRef", rot:"Preço de referência", tipo:"dinheiro"}, {k:"apelidos", rot:"Outros nomes", tipo:"texto", dica:"Separados por vírgula"},
          {k:"classificacao", rot:"Classificação", tipo:"select", ops:classOps, obrig:true, dica:"Define se entra no estoque de material"}, {k:"categoriaId", rot:"Categoria de compra", tipo:"select", ops:ce.categorias.map(function(z){ return [String(z.id), z.nome]; }), vazio:"Sem categoria"},
          {k:"materialId", rot:"Material do estoque", tipo:"select", ops:ce.materiais.map(function(z){ return [String(z.id), z.material]; }), vazio:"Sem ligação"}],
        onSalvar:function(v){ return x.exec(novo ? "catalogo_add" : "catalogo_set", Object.assign({id:novo ? undefined : ci.id}, {nome:v.nome, unidade:v.unidade, classificacao:v.classificacao, categoriaId:idv(v.categoriaId), materialId:idv(v.materialId), precoRef:v.precoRef>0 ? v.precoRef : "", apelidos:String(v.apelidos||"").split(",")})); },
        onExcluir:novo ? null : function(){ return x.exec("catalogo_del", {id:ci.id}); }}); }
    if(k==="mcat"){ var mc = novo ? null : acha(ce.matCategorias, jan.id);
      janela = (novo || mc) && e(Editor,{t:novo ? "Nova categoria do estoque" : "Categoria do estoque", sub:mc ? mc.nome : "Cadastro", fechar:fechar, semAut:!ok, salvarRot:novo ? "Cadastrar categoria" : "Salvar alterações",
        ini:{nome:novo ? "" : mc.nome, tipoId:novo ? (jan.tipoId || cfg.tipos[0].id) : mc.tipoId, ordem:novo ? "" : String(mc.ordem)},
        campos:[{k:"nome", rot:"Nome", tipo:"texto", obrig:true}, {k:"tipoId", rot:"Aba do estoque", tipo:"select", ops:cfg.tipos.map(function(t){ return [t.id, t.nome]; }), obrig:true}, {k:"ordem", rot:"Ordem de exibição", tipo:"num", min:0, se:function(){ return !novo; }}],
        onSalvar:function(v){ return novo ? x.exec("mcat_add", {tipoId:v.tipoId, nome:v.nome}) : x.exec("mcat_set", {id:mc.id, tipoId:v.tipoId, nome:v.nome, ordem:Number(v.ordem)||0}); },
        onExcluir:novo ? null : function(){ return x.exec("mcat_del", {id:mc.id}); }}); }
  }

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:atual[1], compacto:true, dir:!ok ? "Somente consulta" : undefined}, faixa, tabela),
    janela);
}

export { AbaCompraCadastros };
