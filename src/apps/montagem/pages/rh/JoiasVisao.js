// Sorelly Admin · montagem — pages/rh/JoiasVisao.js
// RH › Colaboradores, visão "Joias" e opção "Joias" dentro de Negociações (17/11/2026, pedido do Marcus).
// Visão Joias: uma pessoa por linha (combinado, pagamentos, valor, custo, retirado, a retirar); clicar abre o card com todos os pagamentos e o botão Novo pagamento.
// Também tem as visões Pagamentos (um registro por linha, com Autorizar, Separado, Retirado, Recibo, Cancelar, Apagar) e Resumo por mês e setor, que eram a tela Pagamento em joias.
// Negociações › Joias: o combinado de cada pessoa (motivo, valor a preço de venda, custo %, periodicidade). Fica em rh.negoc.joias (ações neg_joia_set e neg_joia_del em domain/rh.js).
// Pagamentos ficam em s.jp (ação JP, regras em domain/joias-pagamento.js).
import { Avatar } from "@/apps/montagem/components/chat/chat-ui";
import { FichaCaixa, FichaMoldura, FichaPar } from "@/apps/montagem/components/ficha-moldura";
import { Janela } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, CampoSel, Rotulo, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { CUSTO_PADRAO, MOTIVOS, SETORES, custoDe, jpMigrar, jpResumo, pctCusto } from "@/apps/montagem/domain/joias-pagamento";
import { colaboradoresRh } from "@/apps/montagem/domain/rh";
import { botoesJoia } from "@/apps/montagem/pages/PagamentoJoias";
import { CampoDin, CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { e, useState } from "@/shared/react";

var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };
var slug = function(t){ return norm(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
var dia = function(iso){ return iso ? String(iso).slice(8, 10)+"/"+String(iso).slice(5, 7)+"/"+String(iso).slice(0, 4) : "—"; };
var NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var mesTxt = function(m){ return m && m.length>=7 ? NOMES_MES[Number(m.slice(5, 7))-1]+"/"+m.slice(0, 4) : "—"; };
var COR_SIT = {Pedido:"", Autorizado:"text-amber-400", Separado:"text-amber-400", Retirado:"text-emerald-400", Cancelado:"text-red-400"};
var PERIODOS = [["", "A definir"], ["Por sessão", "Por sessão"], ["Semanal", "Semanal"], ["Quinzenal", "Quinzenal"], ["Mensal", "Mensal"], ["Avulso", "Avulso"]];
var jpOp = function(c, o){ c.d(Object.assign({type:"JP", por:c.por}, o)); };
var rhOp = function(c, op, extra){ c.d(Object.assign({type:"RH", op:op, por:c.por}, extra)); };
var soma = function(ls, k){ return ls.reduce(function(t, x){ return t+(x.situacao==="Cancelado" ? 0 : Number(x[k]) || 0); }, 0); };

// ---------- junção: pessoas dos pagamentos + pessoas com combinado ----------
function joiasGrupos(c){
  var j = jpMigrar(c.s.jp), neg = (c.rh.negoc && c.rh.negoc.joias) || [], colabs = colaboradoresRh(c.s), g = {};
  j.itens.forEach(function(x){ var k = norm(x.pessoa), o = g[k] = g[k] || {k:k, nome:x.pessoa, setor:x.setor, itens:[], neg:null, colabId:""}; o.itens.push(x); });
  neg.forEach(function(n){ var k = norm(n.nome), o = g[k] = g[k] || {k:k, nome:n.nome, setor:"", itens:[], neg:null, colabId:""}; o.neg = n; if(n.colabId) o.colabId = n.colabId; });
  Object.keys(g).forEach(function(k){ var o = g[k]; if(!o.colabId){ var achados = colabs.filter(function(y){ return norm(y.nome)===k; }); if(achados.length===1) o.colabId = achados[0].id; }
    var cb = o.colabId && colabs.find(function(y){ return y.id===o.colabId; }); if(cb && !o.setor) o.setor = cb.setor; });
  return Object.keys(g).map(function(k){ return g[k]; });
}
var idFoto = function(o){ return "f_"+String(o.colabId || slug(o.nome)).replace(/-/g, ""); };
var combinadoTxt = function(n){ return n ? (n.motivo || "Joias")+" · "+brl(n.valor||0)+(n.periodo ? " · "+n.periodo.toLowerCase() : "") : "—"; };

// ---------- visão Joias › Por pessoa ----------
function joiasPessoas(c){
  var grupos = joiasGrupos(c);
  var linhas = grupos.map(function(o){ var at = o.itens.filter(function(x){ return x.situacao!=="Cancelado"; }), valor = soma(o.itens, "valor"), custo = at.reduce(function(t, x){ return t+custoDe(x); }, 0), ret = at.filter(function(x){ return x.situacao==="Retirado"; }).reduce(function(t, x){ return t+(Number(x.valor)||0); }, 0);
    var pend = ["Pedido", "Autorizado", "Separado"].filter(function(s2){ return at.some(function(x){ return x.situacao===s2; }); })[0];
    var ult = o.itens.reduce(function(m, x){ return String(x.criadoEm||"")>m ? String(x.criadoEm) : m; }, "");
    return {id:o.k, nome:o.nome, setor:o.setor || "—", combinado:combinadoTxt(o.neg), qtd:at.length, valor:valor, custo:custo, retirado:ret, aRetirar:Math.max(0, valor-ret), ultimo:ult ? ult.slice(0, 10) : "", sit:pend || (at.length ? "Retirado" : "—")}; })
    .sort(function(a, b){ return b.aRetirar-a.aRetirar || a.nome.localeCompare(b.nome, "pt-BR"); });
  var cols = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"}, {k:"combinado", t:"Combinado"}, {k:"qtd", t:"Pagamentos"}, {k:"valor", t:"Valor (preço de venda)", fmt:brl}, {k:"custo", t:"Custo", fmt:brl}, {k:"retirado", t:"Já retirado", fmt:brl}, {k:"aRetirar", t:"A retirar", fmt:brl},
    {k:"ultimo", t:"Último pagamento", fmt:dia}, {k:"sit", t:"Situação", cor:function(l){ return COR_SIT[l.sit] || ""; }}];
  var totalLinha = function(ls){ var s = function(k){ return ls.reduce(function(t, x){ return t+(x[k]||0); }, 0); }; return ["Total", ls.length+" pessoas", "", String(s("qtd")), brl(s("valor")), brl(s("custo")), brl(s("retirado")), brl(s("aRetirar")), "", ""]; };
  return {cols:cols, linhas:linhas, totalLinha:totalLinha};
}

// ---------- visão Joias › Pagamentos (um registro por linha) ----------
function colunasPagamento(c, ctx, semPessoa){
  var cols = [{k:"criadoEm", t:"Data", fmt:dia}];
  if(!semPessoa) cols.push({k:"pessoa", t:"Pessoa"}, {k:"setor", t:"Setor"});
  return cols.concat([{k:"motivo", t:"Motivo"}, {k:"valor", t:"Valor (preço de venda)", fmt:brl}, {k:"custo", t:"Custo", fmt:brl}, {k:"custoPct", t:"Custo %", fmt:function(v){ return v+"%"; }}, {k:"pecas", t:"Peças", fmt:function(v){ return v || "—"; }}, {k:"autorizadoPor", t:"Autorizado por", fmt:function(v){ return v || "—"; }},
    {k:"situacao", t:"Situação", cor:function(l){ return COR_SIT[l.situacao] || ""; }}, {k:"acao", t:"Ação", render:function(v, l){ return botoesJoia(l, ctx); }}]);
}
var linhasPagamento = function(itens){ return itens.map(function(x){ return Object.assign({}, x, {custo:custoDe(x), custoPct:pctCusto(x.custoPct), acao:x.situacao}); }); };
function joiasPagamentos(c, ctx){
  var j = jpMigrar(c.s.jp), linhas = linhasPagamento(j.itens);
  return {cols:colunasPagamento(c, ctx, false), linhas:linhas, totalLinha:function(ls){ return ["Total", "", "", "", brl(soma(ls, "valor")), brl(soma(ls, "custo")), "", "", "", ""]; }};
}
function joiasResumo(c){
  var j = jpMigrar(c.s.jp), resumo = jpResumo(j);
  return {cols:[{k:"mes", t:"Mês", fmt:mesTxt}, {k:"setor", t:"Setor"}, {k:"qtd", t:"Pagamentos", fmt:function(v){ return String(v); }}, {k:"valor", t:"Valor (preço de venda)", fmt:brl}, {k:"custo", t:"Custo", fmt:brl}, {k:"retirado", t:"Já retirado (preço de venda)", fmt:brl}], linhas:resumo,
    totalLinha:function(ls){ var s = function(k){ return ls.reduce(function(t, x){ return t+x[k]; }, 0); }; return ["Total", "", String(s("qtd")), brl(s("valor")), brl(s("custo")), brl(s("retirado"))]; }};
}

// ---------- janela: novo pagamento ----------
function JoiasForm(pp){
  var c = pp.c, n = pp.neg, st = useState({pessoa:pp.pessoa||"", setor:pp.setor && SETORES.indexOf(pp.setor)>=0 ? pp.setor : "Marketing", motivo:n && MOTIVOS.indexOf(n.motivo)>=0 ? n.motivo : MOTIVOS[0], descricao:"", valor:n && n.valor ? n.valor : null, custoPct:String(n && n.custoPct!=null && n.custoPct!=="" ? n.custoPct : CUSTO_PADRAO), pecas:""}), f = st[0], setF = st[1];
  var set = function(p){ setF(Object.assign({}, f, p)); };
  var form = e("div",{key:"f", className:"grid gap-x-3 gap-y-2 md:grid-cols-4"},
    e(CampoTexto,{t:"Pessoa", id:"jf-pessoa", value:f.pessoa, maxLength:80, onChange:function(v){ set({pessoa:v}); }}),
    e(CampoSel,{t:"Setor", id:"jf-setor", value:f.setor, onChange:function(v){ set({setor:v}); }, opcoes:SETORES.map(function(x){ return [x, x]; })}),
    e(CampoSel,{t:"Motivo", id:"jf-motivo", value:f.motivo, onChange:function(v){ set({motivo:v}); }, opcoes:MOTIVOS.map(function(x){ return [x, x]; })}),
    e(CampoDin,{t:"Valor a preço de venda", id:"jf-valor", value:f.valor, onChange:function(v){ set({valor:v}); }}),
    e(CampoTexto,{t:"Custo (% do valor)", id:"jf-custo", tipo:"number", min:0, max:100, value:f.custoPct, onChange:function(v){ set({custoPct:v}); }}),
    e(CampoTexto,{t:"Descrição", id:"jf-desc", value:f.descricao, maxLength:200, cls:"md:col-span-2", onChange:function(v){ set({descricao:v}); }}),
    e(CampoTexto,{t:"Peças (códigos, se já souber)", id:"jf-pecas", value:f.pecas, onChange:function(v){ set({pecas:v}); }}));
  return e(Janela,{t:"Novo pagamento em joias", sub:n ? "Preenchido com o combinado da pessoa. Pode mudar." : "O valor é a preço de venda; o custo é de 20%, salvo outro combinado.", fechar:pp.fechar, colunas:[form],
    rodape:[e(Botao,{key:"c", onClick:pp.fechar}, "Cancelar"), e(Botao,{key:"s", principal:true, desabilitado:!f.pessoa.trim() || !(Number(f.valor)>0), onClick:function(){ jpOp(c, {op:"add", item:Object.assign({}, f, {id:"jp"+Date.now().toString(36)})}); pp.fechar(); }}, "Registrar")]});
}

// ---------- card da pessoa (visão Joias) ----------
function JoiasCard(pp){
  var c = pp.c, o = joiasGrupos(c).find(function(x){ return x.k===pp.k; }), autoriza = temAutorizacao("joias_autoriza", c.s.usuario), cp = useState(""), ctx = {autoriza:autoriza, op:function(x){ jpOp(c, x); }, copiado:cp[0], setCopiado:cp[1]};
  if(!o) return null;
  var at = o.itens.filter(function(x){ return x.situacao!=="Cancelado"; }), valor = soma(o.itens, "valor"), ret = at.filter(function(x){ return x.situacao==="Retirado"; }).reduce(function(t, x){ return t+(Number(x.valor)||0); }, 0), n = o.neg;
  var esquerda = [e(FichaCaixa,{key:"p", t:"Colaboradora"}, e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid place-items-center"}, e(Avatar,{id:idFoto(o), nome:o.nome, s:160})),
      e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Nome", v:o.nome}), e(FichaPar,{t:"Setor", v:o.setor || "—"}), e(FichaPar,{t:"Pagamentos", v:String(at.length)}), e(FichaPar,{t:"Valor (preço de venda)", v:brl(valor)}), e(FichaPar,{t:"Já retirado", v:brl(ret)}), e(FichaPar,{t:"A retirar", v:brl(Math.max(0, valor-ret))})))),
    e(FichaCaixa,{key:"n", t:"Combinado em joias"}, n ? e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Motivo", v:n.motivo || "—"}), e(FichaPar,{t:"Valor (preço de venda)", v:brl(n.valor||0)}), e(FichaPar,{t:"Custo", v:pctCusto(n.custoPct)+"%"}), e(FichaPar,{t:"Periodicidade", v:n.periodo || "A definir"}), n.obs && e(FichaPar,{t:"Observação", v:n.obs}))
      : e("span",{className:"text-[13px]"}, "Sem combinado (incluir na visão Negociações › Joias)."))];
  var direita = e(FichaCaixa,{t:"Pagamentos em joias", dir:e("button",{type:"button", onClick:function(){ pp.setAbrir("novo"); }, className:"h-5 rounded border border-white/45 bg-white/10 px-2 text-[11px] font-normal normal-case leading-none tracking-normal hover:bg-white/25"}, "Novo pagamento")},
    e(TabelaPlanilha,{cols:colunasPagamento(c, ctx, true), linhas:linhasPagamento(o.itens), chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, semMao:true, limite:100, vazio:"Nenhum pagamento em joias."}));
  return e("div",null, e(FichaMoldura,{t:"Joias · "+o.nome, largo:true, fechar:pp.fechar, esquerda:esquerda, direita:direita}),
    pp.abrir==="novo" && e(JoiasForm,{c:c, pessoa:o.nome, setor:o.setor, neg:n, fechar:function(){ pp.setAbrir(""); }}));
}
function JoiasJanelas(pp){
  return e("div",null, pp.pessoa && e(JoiasCard,{c:pp.c, k:pp.pessoa, fechar:pp.fecharPessoa, abrir:pp.abrir, setAbrir:pp.setAbrir}),
    !pp.pessoa && pp.abrir==="novo" && e(JoiasForm,{c:pp.c, fechar:function(){ pp.setAbrir(""); }}));
}

// ---------- Negociações › Joias ----------
function negJoiasDados(c){
  var neg = (c.rh.negoc && c.rh.negoc.joias) || [], colabs = colaboradoresRh(c.s);
  var linhas = neg.map(function(n){ var cb = n.colabId && colabs.find(function(y){ return y.id===n.colabId; }), pct = pctCusto(n.custoPct);
    return {id:n.id, nome:n.nome, setor:cb ? cb.setor : "—", motivo:n.motivo || "—", valor:Number(n.valor)||0, custoPct:pct, custo:Math.round((Number(n.valor)||0)*pct)/100, periodo:n.periodo || "A definir", obs:n.obs || ""}; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var cols = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"}, {k:"motivo", t:"Motivo"}, {k:"valor", t:"Valor (preço de venda)", fmt:brl}, {k:"custoPct", t:"Custo %", fmt:function(v){ return v+"%"; }}, {k:"custo", t:"Custo", fmt:brl}, {k:"periodo", t:"Periodicidade"}, {k:"obs", t:"Observação"}];
  return {cols:cols, linhas:linhas};
}
function NegJoiasCard(pp){
  var c = pp.c, n = ((c.rh.negoc && c.rh.negoc.joias) || []).find(function(x){ return x.id===pp.id; }), autoriza = temAutorizacao("joias_autoriza", c.s.usuario), cp = useState(""), ctx = {autoriza:autoriza, op:function(x){ jpOp(c, x); }, copiado:cp[0], setCopiado:cp[1]}, nf = useState(false), novo = nf[0], setNovo = nf[1];
  if(!n) return null;
  var colabs = colaboradoresRh(c.s), cb = n.colabId && colabs.find(function(y){ return y.id===n.colabId; }), o = joiasGrupos(c).find(function(x){ return x.k===norm(n.nome); }) || {itens:[]};
  var setN = function(patch){ rhOp(c, "neg_joia_set", {id:n.id, nome:n.nome, patch:patch}); };
  var esquerda = e(FichaCaixa,{key:"p", t:"Colaboradora"}, e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid place-items-center"}, e(Avatar,{id:"f_"+String(n.colabId || slug(n.nome)).replace(/-/g, ""), nome:n.nome, s:160})),
    e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Nome", v:n.nome}), e(FichaPar,{t:"Setor", v:cb ? cb.setor : "—"}), e(FichaPar,{t:"Função", v:cb && cb.funcao ? cb.funcao : "—"}))));
  var direita = [e(FichaCaixa,{key:"n", t:"Combinado em joias", dir:e("span",{className:"text-[11px] font-normal normal-case tracking-normal"}, "valor a preço de venda; o custo é de 20%, salvo outro combinado")}, e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      e(CampoSel,{t:"Motivo", id:"nj-motivo", value:MOTIVOS.indexOf(n.motivo)>=0 ? n.motivo : MOTIVOS[0], onChange:function(v){ setN({motivo:v}); }, opcoes:MOTIVOS.map(function(x){ return [x, x]; })}),
      e(CampoDin,{t:"Valor (preço de venda)", id:"nj-valor", value:n.valor ? Number(n.valor) : null, onChange:function(v){ setN({valor:v==="" || v===null || Number(v)===0 ? null : Number(v)}); }}),
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Custo (% do valor)", id:"nj-custo"}), e("input",{id:"nj-custo", type:"number", min:0, max:100, value:n.custoPct==null || n.custoPct==="" ? "" : n.custoPct, className:CAMPO+" text-center tabular-nums", onChange:function(ev){ setN({custoPct:ev.target.value===""  ? null : Number(ev.target.value)}); }})),
      e(CampoSel,{t:"Periodicidade", id:"nj-periodo", value:n.periodo || "", onChange:function(v){ setN({periodo:v}); }, opcoes:PERIODOS}),
      e(CampoTexto,{t:"Observação", id:"nj-obs", cls:"col-span-2 md:col-span-4", value:n.obs || "", onChange:function(v){ setN({obs:v}); }}))),
    e(FichaCaixa,{key:"pg", t:"Pagamentos já feitos", dir:e("button",{type:"button", onClick:function(){ setNovo(true); }, className:"h-5 rounded border border-white/45 bg-white/10 px-2 text-[11px] font-normal normal-case leading-none tracking-normal hover:bg-white/25"}, "Novo pagamento")},
      e(TabelaPlanilha,{cols:colunasPagamento(c, ctx, true), linhas:linhasPagamento(o.itens), chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, semMao:true, limite:100, vazio:"Nenhum pagamento em joias."}))];
  return e("div",null, e(FichaMoldura,{t:"Negociação em joias · "+n.nome, largo:true, fechar:pp.fechar, esquerda:esquerda, direita:direita,
      rodape:[e(Botao,{key:"d", onClick:function(){ if(window.confirm("Remover o combinado em joias de "+n.nome+"?")){ rhOp(c, "neg_joia_del", {id:n.id}); pp.fechar(); } }}, "Remover negociação"), e(Botao,{key:"f", principal:true, onClick:pp.fechar}, "Fechar")]}),
    novo && e(JoiasForm,{c:c, pessoa:n.nome, setor:cb ? cb.setor : "", neg:n, fechar:function(){ setNovo(false); }}));
}
function NegJoiasIncluir(pp){
  var c = pp.c, neg = (c.rh.negoc && c.rh.negoc.joias) || [], st = useState({id:"", nome:""}), f = st[0], setF = st[1], jaTem = {}; neg.forEach(function(n){ jaTem[n.id] = 1; });
  var colabs = colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO" && !jaTem[x.id]; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var outra = f.id==="__outra";
  var form = e("div",{key:"f", className:"grid grid-cols-1 gap-2 md:grid-cols-2"},
    e(CampoSel,{t:"Pessoa", id:"nji-p", value:f.id, onChange:function(v){ setF({id:v, nome:""}); }, opcoes:[["", "Escolha"]].concat(colabs.map(function(x){ return [x.id, x.nome+" · "+x.setor]; }), [["__outra", "Outra pessoa (prestador)"]])}),
    outra && e(CampoTexto,{t:"Nome da pessoa", id:"nji-n", value:f.nome, maxLength:80, onChange:function(v){ setF({id:f.id, nome:v}); }}));
  return e(Janela,{t:"Incluir pessoa em Negociações › Joias", fechar:pp.fechar, colunas:[form], rodape:[e(Botao,{key:"c", onClick:pp.fechar}, "Cancelar"),
    e(Botao,{key:"s", principal:true, desabilitado:!f.id || (outra && !f.nome.trim()), onClick:function(){ var cb = colabs.find(function(y){ return y.id===f.id; }); var nome = outra ? f.nome.trim() : (cb ? cb.nome : f.id);
      rhOp(c, "neg_joia_set", {id:outra ? slug(nome) : f.id, nome:nome, patch:Object.assign({motivo:MOTIVOS[0], custoPct:CUSTO_PADRAO, periodo:""}, outra ? {} : {colabId:f.id})}); pp.fechar(); }}, "Incluir")]});
}
function NegJoiasJanelas(pp){
  return e("div",null, pp.pessoa && e(NegJoiasCard,{c:pp.c, id:pp.pessoa, fechar:pp.fecharPessoa}), pp.abrir==="incluir" && e(NegJoiasIncluir,{c:pp.c, fechar:function(){ pp.setAbrir(""); }}));
}

export { joiasPessoas, joiasPagamentos, joiasResumo, JoiasJanelas, negJoiasDados, NegJoiasJanelas };
