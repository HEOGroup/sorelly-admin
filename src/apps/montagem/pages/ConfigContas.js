// Sorelly Admin · montagem — pages/ConfigContas.js
// Financeiro › Contas bancárias › Mais › Contas (cadastro). Cadastro das contas bancárias: CNPJ (bloco), tipo, limite, bloqueada e NUMERÁRIO da DevMaster.
// Mesma estrutura da tela Numerários (planilha compacta, 10 px, filtro no cabeçalho de cada coluna). Regra do numerário e do banco: docs/regras/NUMERARIOS-ADMIN-X-DEVMASTER.md (R1, R9).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { AvisoMini, BarraMini, BuscaMini, CampoMini, CLS_FINA_ESPACO, PAGINA_CHEIA, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TIPOS_CONTA } from "@/apps/montagem/domain/saldos-contas";
import { BKC } from "@/apps/montagem/lib/format";
import { opcoesNumerario, useNumerarios } from "@/apps/montagem/lib/numerarios";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var semAc = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var slug = function(t){ return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")+"_"+Math.random().toString(36).slice(2,6); };
var dinheiro = function(t){ return Number(String(t).replace(/\D/g, "").slice(0, 10) || 0)/100; };
var TIPOS_OPS = Object.keys(TIPOS_CONTA).map(function(k){ return [k, TIPOS_CONTA[k]]; });

// campo de texto que só grava ao sair dele (nome e limite): evita gravar a cada letra
function CampoTexto(p){
  var sv = useState(null), v = sv[0], setV = sv[1];
  return e("span",{onBlur:function(){ if(v!==null && v!==p.valor) p.aoGravar(v); setV(null); }}, e(BuscaMini,{valor:v===null ? p.valor : v, aoMudar:setV, rotulo:p.rotulo, ph:p.rotulo, larg:p.larg || "w-40"}));
}

function ConfigContas(){
  var cx = use(), sc = cx.state.saldosContas, nm = useNumerarios();
  var sb = useState(""), busca = sb[0], sbl = useState(""), blocoF = sbl[0], sn = useState("todas"), numF = sn[0];
  var nv = useState({nome:"", bloco:sc.blocos[0] ? sc.blocos[0].id : "", tipo:"PJ"}), novo = nv[0], setNovo = nv[1];
  var nbs = useState(""), novoBloco = nbs[0], setNovoBloco = nbs[1];
  var q = semAc(busca.trim());
  var salvar = function(c, patch){ cx.dispatch({type:"SALDO_CONTA", conta:Object.assign({}, c, patch)}); };
  var nomeBloco = function(id){ var b = sc.blocos.filter(function(x){ return x.id===id; })[0]; return b ? b.nome : id; };
  var porId = {}; sc.contas.forEach(function(c){ porId[c.id] = c; });
  var todas = sc.contas.map(function(c){
    var n = c.numerario ? nm.lista.filter(function(x){ return x.cod===c.numerario; })[0] : null;   // o banco vem do numerário (R9)
    return {id:c.id, nome:c.nome, bloco:c.bloco, cnpj:nomeBloco(c.bloco), tipo:c.tipo, tipoNome:TIPOS_CONTA[c.tipo] || c.tipo, limite:c.limite || 0, bloqueada:c.bloqueada ? "Sim" : "Não",
      numerario:c.numerario || "", numerarioNome:c.numerarioNome || "", banco:c.numerario ? (n ? (n.banco || "Sem banco ligado") : (nm.carregou ? "Numerário inativo" : "Lendo")) : "—"};
  });
  var semNum = todas.filter(function(l){ return !l.numerario && l.tipo==="PJ" && l.bloco!=="BLOQ"; }).length;
  var linhas = todas.filter(function(l){
    return (!blocoF || l.bloco===blocoF) && (numF==="todas" || (numF==="sem" ? !l.numerario : !!l.numerario))
      && (!q || semAc([l.nome, l.cnpj, l.tipoNome, l.numerarioNome, l.numerario, l.banco].join(" ")).indexOf(q)>=0);
  });
  var cols = [
    {k:"cnpj", t:"CNPJ"},
    {k:"nome", t:"Conta", render:function(v, l){ return e(CampoTexto,{valor:l.nome, rotulo:"Nome da conta", aoGravar:function(x){ if(x.trim()) salvar(porId[l.id], {nome:x.trim()}); }}); }},
    {k:"tipoNome", t:"Tipo", render:function(v, l){ return e(CampoMini,{valor:l.tipo, aoMudar:function(x){ salvar(porId[l.id], {tipo:x}); }, rotulo:"Tipo de "+l.nome, ops:TIPOS_OPS}); }},
    {k:"limite", t:"Limite", fmt:BKC, render:function(v, l){ return e(CampoTexto,{valor:BKC(l.limite), rotulo:"Limite de "+l.nome, larg:"w-24", aoGravar:function(x){ salvar(porId[l.id], {limite:dinheiro(x)}); }}); }},
    {k:"bloqueada", t:"Bloqueada", render:function(v, l){ return e(CampoMini,{valor:v, aoMudar:function(x){ salvar(porId[l.id], {bloqueada:x==="Sim"}); }, rotulo:"Bloqueada: "+l.nome, ops:[["Não", "Não"], ["Sim", "Sim"]]}); }},
    {k:"numerarioNome", t:"Numerário na DevMaster", cor:function(l){ return !l.numerario && l.tipo==="PJ" && l.bloco!=="BLOQ" ? "text-warning" : ""; }, render:function(v, l){
      return e(CampoMini,{valor:l.numerario, aoMudar:function(x){ var n = nm.lista.filter(function(y){ return y.cod===x; })[0]; salvar(porId[l.id], {numerario:x, numerarioNome:n ? n.nome : ""}); }, rotulo:"Numerário de "+l.nome, ops:opcoesNumerario(nm.lista, l.numerario ? {cod:l.numerario, nome:l.numerarioNome || l.numerario} : null)}); }},
    {k:"banco", t:"Banco na DevMaster"},
    {k:"acao", t:"Excluir", render:function(v, l){ return e("button",{type:"button", className:"text-[10px] underline", "aria-label":"Excluir "+l.nome, onClick:function(){ if(window.confirm("Excluir a conta "+l.nome+" e os saldos dela?")) cx.dispatch({type:"SALDO_CONTA_DEL", id:l.id}); }}, "Excluir"); }}];
  var adicionar = function(){ if(!novo.nome.trim()) return; cx.dispatch({type:"SALDO_CONTA", conta:{id:slug(novo.nome), nome:novo.nome.trim(), bloco:novo.bloco, tipo:novo.tipo, limite:0, bloqueada:novo.bloco==="BLOQ"}}); setNovo(Object.assign({}, novo, {nome:""})); };
  var addBloco = function(){ if(!novoBloco.trim()) return; cx.dispatch({type:"SALDO_BLOCO", bloco:{id:slug(novoBloco), nome:novoBloco.trim()}}); setNovoBloco(""); };
  var opsBloco = sc.blocos.map(function(b){ return [b.id, b.nome]; });
  return e(BlocoPainel,{titulo:"Contas bancárias: cadastro", compacto:true},
    e(BarraMini,null,
      e(BuscaMini,{key:"b", valor:busca, aoMudar:sb[1], ph:"Buscar: conta, numerário, banco...", rotulo:"Buscar nas contas"}),
      e(CampoMini,{key:"c", valor:blocoF, aoMudar:sbl[1], rotulo:"CNPJ", ops:[["", "Todos os CNPJs"]].concat(opsBloco)}),
      e(CampoMini,{key:"n", valor:numF, aoMudar:sn[1], rotulo:"Numerário", ops:[["todas", "Todas"], ["sem", "Sem numerário"], ["com", "Com numerário"]]}),
      semNum ? e(AvisoMini,{key:"av", erro:true}, semNum+" contas de empresa sem numerário") : null,
      !nm.carregou ? e(AvisoMini,{key:"lendo"}, "Lendo os numerários da DevMaster") : null),
    e(BarraMini,null,
      e(BuscaMini,{key:"nn", valor:novo.nome, aoMudar:function(x){ setNovo(Object.assign({}, novo, {nome:x})); }, ph:"Nome da nova conta", rotulo:"Nome da nova conta", larg:"w-48"}),
      e(CampoMini,{key:"nb", valor:novo.bloco, aoMudar:function(x){ setNovo(Object.assign({}, novo, {bloco:x})); }, rotulo:"CNPJ da nova conta", ops:opsBloco}),
      e(CampoMini,{key:"nt", valor:novo.tipo, aoMudar:function(x){ setNovo(Object.assign({}, novo, {tipo:x})); }, rotulo:"Tipo da nova conta", ops:TIPOS_OPS}),
      e("button",{key:"na", type:"button", onClick:adicionar}, "Adicionar conta"),
      e(BuscaMini,{key:"bn", valor:novoBloco, aoMudar:setNovoBloco, ph:"Novo CNPJ, ex.: Nova empresa · 80", rotulo:"Novo CNPJ", larg:"w-56"}),
      e("button",{key:"ba", type:"button", onClick:addBloco}, "Adicionar CNPJ")),
    e("div",{ref:refCheia({"Numerário na DevMaster":"Forma de pagamento que a funcionária escolhe na DevMaster ao pagar por esta conta (lista da tela Numerários)", "Banco na DevMaster":"Banco ou caixa que a DevMaster liga ao numerário. Vem do numerário: não se escolhe à parte", "Limite":"Cheque especial: entra no saldo disponível"}), className:CLS_FINA_ESPACO+" [&_tbody_td_select]:!h-[18px] [&_tbody_td_select]:!leading-[12px] [&_tbody_td_input]:!h-[18px]"},
      e(TabelaPlanilha,{key:blocoF+numF, fina:true, cols:cols, linhas:linhas, chave:"id", grade:true, centro:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true, limite:300, vazio:"Nenhuma conta neste filtro."})));
}

// tela própria: Financeiro › Contas bancárias › Bancos
function AbaContasCadastro(){ return e(Pagina,{className:PAGINA_CHEIA+" [&_*]:!normal-case"}, e(ConfigContas,{})); }

export { ConfigContas, AbaContasCadastro };
