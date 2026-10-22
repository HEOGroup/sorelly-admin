// Sorelly Admin · montagem — pages/compras/CompraCadastros.js
// Materiais & Estoque → aba "Cadastros": fornecedores, contas por CNPJ, catálogo de itens, setores, categorias de compra e categorias do estoque.
// Blocos azuis lado a lado num mosaico; cada cadastro abre em janela com colunas (Editor). Regras no domínio (forn_*, conta_*, catalogo_*, setor_*, cat_*, mcat_*).
import { Mosaico, Pagina, ESTADO, degrade } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { FORMAS_PAGAMENTO, PAGAVEL_STATUS, ROTULO_FORMA, ROTULO_UNIDADE, UNIDADES, formatarDia, formatarReais, opcoesCnpj, rotuloConta, rotuloCnpj, totalDaCompra } from "@/apps/montagem/domain/compras-estoque";
import { Bt, BtMini, Busca, Editor, Num, Selo, Vazio, useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var idv = function(s){ return s==="" || s==null ? null : isNaN(Number(s)) ? s : Number(s); };
var digitos = function(v){ return String(v||"").replace(/\D/g, ""); };
var IC_FORMA = {CARTAO:"credit-card", PIX:"qr-code", DINHEIRO:"coins", BOLETO:"barcode"};

// cartão clicável de um cadastro: título, linhas pequenas, selos
function CartaoCad(p){
  return e("button",{type:"button", onClick:p.onClick, title:"Abrir o cadastro", className:"flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl p-2.5 text-center transition hover:brightness-125 "+(p.inativo ? "opacity-55" : ""), style:degrade(p.cor || "info")},
    p.cabeca, e("b",{className:"max-w-full break-words text-[13.5px] leading-tight"}, p.t), (p.linhas||[]).filter(Boolean).map(function(l, i){ return e("span",{key:i, className:"max-w-full break-words text-[11.5px] leading-tight text-white/70"}, l); }), p.rodape);
}
var GRADE = {display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(11rem, 1fr))"};
function Barra(p){ return e("div",{className:"flex flex-wrap items-center justify-center gap-2 p-2 pb-0"}, p.children); }

// estatística do fornecedor: compras efetuadas, total no ano e última compra (pedidos do módulo de compras)
function statsForn(ce, f){
  var ano = String(new Date().getFullYear()), ps = ce.pedidos.filter(function(p){ return String(p.fornecedorId)===String(f.id) && PAGAVEL_STATUS.indexOf(p.status)>=0; });
  var doAno = ps.filter(function(p){ return String(p.compradoEm||p.solicitadoEm).slice(0, 4)===ano; }), ult = ps.map(function(p){ return String(p.compradoEm||p.solicitadoEm).slice(0, 10); }).sort().pop();
  return {n:doAno.length, total:doAno.reduce(function(t, p){ return t+(totalDaCompra(p)||0); }, 0), ultima:ult||""};
}

function AbaCompraCadastros(pr){
  var x = useCe(), ce = x.ce, cfg = x.cfg, sJ = useState((pr && pr.janIni) || null), sQf = useState(""), sQc = useState(""), sMais = useState(24);
  var jan = sJ[0], ok = x.cadastros, fechar = function(){ sJ[1](null); }, abrir = function(k, id, extra){ sJ[1](Object.assign({k:k, id:id==null ? null : id}, extra)); };
  var acha = function(lista, id){ return lista.filter(function(z){ return String(z.id)===String(id); })[0] || null; };
  var novoBt = function(rot, k, extra){ return e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", disabled:!ok, semAut:true, onClick:function(){ abrir(k, null, extra); }}, rot); };
  var classOps = cfg.classificacoes.map(function(c){ return [c.id, c.nome]; });

  // ----- fornecedores
  var alvoF = norm(sQf[0]), forns = ce.fornecedores.filter(function(f){ return !alvoF || norm([f.nome, f.documento, f.contato, f.telefone].join(" ")).indexOf(alvoF)>=0; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var blocoForn = e(BlocoBarra,{key:"f", cor:"azul", compacto:true, t:"Fornecedores", dir:ce.fornecedores.length},
    e(Barra,null, e(Busca,{v:sQf[0], set:sQf[1], ph:"Buscar fornecedor, documento ou contato"}), novoBt("Novo fornecedor", "forn")),
    e("div",{className:"p-2"}, forns.length ? e("div",{className:"gap-2", style:GRADE}, forns.map(function(f){ var st = statsForn(ce, f);
      return e(CartaoCad,{key:f.id, t:f.nome, inativo:f.ativo===false, onClick:function(){ abrir("forn", f.id); }, linhas:[f.documento, f.telefone || f.email, f.contato, st.n ? st.n+(st.n===1 ? " compra" : " compras")+" no ano · "+formatarReais(st.total) : "Sem compras no ano", st.ultima ? "Última compra em "+formatarDia(st.ultima) : ""],
        rodape:f.ativo===false && e(Selo,{cor:"neutro"}, "Inativo")}); }))
      : e(Vazio,{ic:"storefront"}, ce.fornecedores.length ? "Nenhum fornecedor encontrado." : "Nenhum fornecedor cadastrado.")));

  // ----- contas por CNPJ
  var contas = ce.contas.slice().sort(function(a, b){ return String(a.cnpjId||"~").localeCompare(String(b.cnpjId||"~")); });
  var blocoContas = e(BlocoBarra,{key:"k", cor:"azul", compacto:true, t:"Contas por CNPJ", dir:ce.contas.length},
    e(Barra,null, novoBt("Nova conta", "conta")),
    e("div",{className:"p-2"}, contas.length ? e("div",{className:"gap-2", style:GRADE}, contas.map(function(c){
      return e(CartaoCad,{key:c.id, t:c.rotulo || rotuloConta(c), inativo:c.ativa===false, onClick:function(){ abrir("conta", c.id); }, cabeca:e(Ph,{n:IC_FORMA[c.tipo]||"bank", s:20, className:"text-white/80"}),
        linhas:[c.rotulo ? rotuloConta(c) : "", "Titular: "+c.titular, c.cnpjId ? rotuloCnpj(c.cnpjId, "", cfg) : "Sem CNPJ definido"], rodape:c.ativa===false && e(Selo,{cor:"neutro"}, "Inativa")}); }))
      : e(Vazio,{ic:"bank"}, "Nenhuma conta cadastrada.")));

  // ----- catálogo
  var alvoC = norm(sQc[0]), cat = ce.catalogo.filter(function(c){ return !alvoC || norm([c.nome].concat(c.apelidos||[]).join(" ")).indexOf(alvoC)>=0; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var blocoCat = e(BlocoBarra,{key:"c", cor:"azul", compacto:true, t:"Catálogo de itens", dir:ce.catalogo.length},
    e(Barra,null, e(Busca,{v:sQc[0], set:sQc[1], ph:"Buscar item do catálogo"}), novoBt("Novo item", "catalogo")),
    e("div",{className:"p-2"}, cat.length ? e("div",{className:"flex flex-col items-center gap-2"}, e("div",{className:"w-full gap-2", style:GRADE}, cat.slice(0, sMais[0]).map(function(c){ var cl = cfg.classificacoes.filter(function(z){ return z.id===c.classificacao; })[0];
      return e(CartaoCad,{key:c.id, t:c.nome, onClick:function(){ abrir("catalogo", c.id); }, linhas:[(ROTULO_UNIDADE[c.unidade]||c.unidade)+(c.precoRef!=null ? " · Ref. "+formatarReais(c.precoRef) : ""), acha(ce.categorias, c.categoriaId) ? acha(ce.categorias, c.categoriaId).nome : ""],
        rodape:e("div",{className:"flex flex-wrap justify-center gap-1"}, e(Selo,{cor:cl && cl.entraEstoque ? "ok" : "neutro"}, cl ? cl.nome : c.classificacao), c.materialId!=null && e(Selo,{cor:"info", ic:"package", titulo:"Ligado a um material do estoque"}, "Estoque"))}); })),
      cat.length>sMais[0] && e(Bt,{onClick:function(){ sMais[1](sMais[0]+24); }}, "Ver mais "+Math.min(24, cat.length-sMais[0])))
      : e(Vazio,{ic:"books"}, ce.catalogo.length ? "Nenhum item encontrado." : "Nenhum item no catálogo.")));

  // ----- setores e categorias de compra
  var lista = function(chave, titulo, k, itens, icone, comCor){
    return e(BlocoBarra,{key:chave, cor:"azul", compacto:true, t:titulo, dir:itens.length},
      e(Barra,null, novoBt(chave==="s" ? "Novo setor" : "Nova categoria", k)),
      e("div",{className:"p-2"}, itens.length ? e("div",{className:"flex flex-wrap justify-center gap-2"}, itens.slice().sort(function(a, b){ return (a.ordem-b.ordem) || a.nome.localeCompare(b.nome); }).map(function(it){
        return e("button",{key:it.id, type:"button", onClick:function(){ abrir(k, it.id); }, title:"Abrir o cadastro", className:"inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-[13px] font-bold ring-1 ring-white/15 hover:bg-white/20"},
          comCor ? e("span",{"aria-hidden":true, className:"size-3 rounded-full", style:{background:it.cor || "#3B82F6"}}) : e(Ph,{n:icone, s:14, className:"text-white/70"}), it.nome, e("span",{className:MONO+" text-[11px] text-white/55"}, it.ordem)); }))
        : e(Vazio,{ic:icone}, chave==="s" ? "Nenhum setor cadastrado." : "Nenhuma categoria cadastrada.")));
  };
  var blocoSetores = lista("s", "Setores solicitantes", "setor", ce.setores, "buildings", true);
  var blocoCatCompra = lista("g", "Categorias de compra", "cat", ce.categorias, "tag", false);

  // ----- categorias do estoque, por aba
  var blocoMcat = e(BlocoBarra,{key:"m", cor:"azul", compacto:true, t:"Categorias do estoque", dir:ce.matCategorias.length},
    e("div",{className:"flex flex-col gap-2 p-2"}, cfg.tipos.map(function(t){ var cs = ce.matCategorias.filter(function(c){ return c.tipoId===t.id; }).sort(function(a, b){ return (a.ordem-b.ordem) || a.nome.localeCompare(b.nome); });
      return e("div",{key:t.id, className:"flex flex-col items-center gap-1.5 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"}, e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide text-white/75"}, t.nome),
        e("div",{className:"flex flex-wrap justify-center gap-1.5"}, cs.map(function(c){ return e("button",{key:c.id, type:"button", onClick:function(){ abrir("mcat", c.id); }, title:"Abrir o cadastro", className:"cursor-pointer rounded-lg bg-white/10 px-2.5 py-1 text-[12.5px] font-bold ring-1 ring-white/15 hover:bg-white/20"}, c.nome); }),
          cs.length===0 && e("span",{className:"text-[12px] text-white/55"}, "Nenhuma categoria nesta aba."), e(BtMini,{ic:"plus", forte:true, disabled:!ok, titulo:ok ? "Nova categoria nesta aba" : "Sem autorização", onClick:function(){ abrir("mcat", null, {tipoId:t.id}); }}, "Nova"))); })));

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

  return e(Pagina,null,
    !ok && e("p",{className:"rounded-xl bg-[#FBBF24]/15 px-3 py-2 text-center text-[12.5px] font-bold text-[#FBBF24]"}, "Os cadastros estão disponíveis para consulta. A alteração exige autorização de Compras ou do estoque."),
    e(Mosaico,{min:"30rem"}, blocoForn, blocoContas, blocoCat, blocoSetores, blocoCatCompra, blocoMcat),
    janela);
}

export { AbaCompraCadastros };
