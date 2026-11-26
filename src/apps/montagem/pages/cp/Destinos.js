// Sorelly Admin · montagem — pages/cp/Destinos.js
// Financeiro › Pagamentos › Destinos (26/11/2026, Marcus: "sempre que se criar uma conta precisa conectar com a DevMaster nesses numerários").
// Cada destino de pagamento (conta da empresa, sócio, fornecedor, representante, prestador) liga a UM numerário da DevMaster.
// O numerário é o que a funcionária escolhe na DevMaster ao dar a baixa e o que se escreve na folha. A conta real (chave Pix) continua só para uso interno.
// Regras: docs/regras/NUMERARIOS-ADMIN-X-DEVMASTER.md. Lista de numerários: lib/numerarios.js (cópia diária da DevMaster).
// Visual: padrão compacto (components/planilha-cheia.js), igual a Formas de pagamento e Numerários.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { AvisoMini, BarraMini, BuscaMini, CampoMini, CLS_FINA, PAGINA_CHEIA, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TIPOS_DESTINO } from "@/apps/montagem/domain/controle-pagamentos";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { chavesDoDestino } from "@/apps/montagem/lib/chave-do-destino";
import { opcoesNumerario, useNumerarios } from "@/apps/montagem/lib/numerarios";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var semAc = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var tipoNome = function(t){ return (TIPOS_DESTINO[t] || ["—"])[0]; };

function AbaDestinos(){
  var cx = use(), s = cx.state, cp = s.cp, edita = podeConferirPag(s.usuario) || podeFinanceiro(s.usuario), por = nomeDe(s.usuario);
  var nm = useNumerarios(), sb = useState(""), busca = sb[0], st = useState(""), tipo = st[0], sn = useState("sem"), num = sn[0], sa = useState("ativo"), sit = sa[0];
  var q = semAc(busca.trim());
  var grava = function(id, cod){ var n = nm.lista.filter(function(x){ return x.cod===cod; })[0]; cx.dispatch({type:"CP", op:"destino_set", id:id, por:por, patch:{numerario:cod, numerarioNome:n ? n.nome : ""}}); };
  var todas = (cp && cp.destinos || []).map(function(d){
    var ch = chavesDoDestino(s, d)[0];
    var nu = d.numerario ? nm.lista.filter(function(x){ return x.cod===d.numerario; })[0] : null;   // banco vem do numerário (R9), nunca se escolhe à parte
    return {id:d.id, nome:d.nome, tipo:tipoNome(d.tipo), tipoCod:d.tipo, chave:ch ? ch.chave : "Sem chave Pix", numerario:d.numerario || "", numerarioNome:d.numerarioNome || "", banco:d.numerario ? (nu ? (nu.banco || "Sem banco ligado") : (nm.carregou ? "Numerário inativo" : "Lendo")) : "—", ativo:d.ativo ? "Ativo" : "Inativo"};
  });
  var semNum = todas.filter(function(l){ return !l.numerario && l.ativo==="Ativo"; }).length;
  var linhas = todas.filter(function(l){
    return (sit==="todos" || (sit==="ativo" ? l.ativo==="Ativo" : l.ativo==="Inativo")) && (!tipo || l.tipoCod===tipo) && (!num || (num==="sem" ? !l.numerario : !!l.numerario))
      && (!q || semAc([l.nome, l.tipo, l.numerarioNome, l.numerario].join(" ")).indexOf(q)>=0);
  }).sort(function(a, b){ return (a.numerario ? 1 : 0)-(b.numerario ? 1 : 0) || a.nome.localeCompare(b.nome); });   // quem está sem numerário vem primeiro
  var cols = [
    {k:"nome", t:"Destino"}, {k:"tipo", t:"Tipo"}, {k:"chave", t:"Chave Pix da conta", cor:function(l){ return l.chave==="Sem chave Pix" ? "text-warning" : ""; }},
    {k:"numerario", t:"Numerário na DevMaster", render:function(v, l){
      return edita ? e(CampoMini,{valor:v, aoMudar:function(x){ grava(l.id, x); }, rotulo:"Numerário de "+l.nome, ops:opcoesNumerario(nm.lista, v ? {cod:v, nome:l.numerarioNome} : null)}) : (l.numerarioNome || "Sem numerário"); }},
    {k:"banco", t:"Banco na DevMaster"},
    {k:"folha", t:"Escrever na folha", cor:function(l){ return l.numerario ? "" : "text-warning"; }, render:function(v, l){ return l.numerarioNome || "Sem numerário"; }},
    {k:"ativo", t:"Situação", render:function(v, l){
      return edita ? e(CampoMini,{valor:v, aoMudar:function(x){ cx.dispatch({type:"CP", op:"destino_set", id:l.id, por:por, patch:{ativo:x==="Ativo"}}); }, rotulo:"Situação de "+l.nome, ops:[["Ativo", "Ativo"], ["Inativo", "Inativo"]]}) : v; }}];
  return e(Pagina,{className:PAGINA_CHEIA+" [&_*]:!normal-case"},
    e(BlocoPainel,{titulo:"Destinos de pagamento", compacto:true},
      e(BarraMini,null,
        e(BuscaMini,{key:"b", valor:busca, aoMudar:sb[1], ph:"Buscar: destino, numerário...", rotulo:"Buscar nos destinos"}),
        e(CampoMini,{key:"t", valor:tipo, aoMudar:st[1], rotulo:"Tipo", ops:[["", "Todos os tipos"]].concat(Object.keys(TIPOS_DESTINO).map(function(t){ return [t, tipoNome(t)]; }))}),
        e(CampoMini,{key:"n", valor:num, aoMudar:sn[1], rotulo:"Numerário", ops:[["", "Todos"], ["sem", "Sem numerário"], ["com", "Com numerário"]]}),
        e(CampoMini,{key:"s", valor:sit, aoMudar:sa[1], rotulo:"Situação", ops:[["ativo", "Ativos"], ["inativo", "Inativos"], ["todos", "Todos"]]}),
        semNum ? e(AvisoMini,{key:"av", erro:true}, semNum+" destinos ativos sem numerário") : null,
        !nm.carregou ? e(AvisoMini,{key:"lendo"}, "Lendo os numerários da DevMaster") : null),
      e("div",{ref:refCheia({"Numerário na DevMaster":"Forma de pagamento que a funcionária escolhe na DevMaster ao dar a baixa (lista da tela Numerários)", "Banco na DevMaster":"Banco ou caixa Pix que a DevMaster liga a este numerário. Vem do numerário: não se escolhe à parte", "Escrever na folha":"Nome do numerário. É o que aparece na folha e no Consolidado, nunca o nome da conta real"}), className:CLS_FINA+" [&_tbody_td_select]:!h-[14px] [&_tbody_td_select]:!leading-[12px] [&_tbody_td_input]:!h-[14px]"},   // padrao-ok: menu suspenso compacto, pedido do Marcus 26/11/2026
        e(TabelaPlanilha,{key:sit+tipo+num, fina:true, cols:cols, linhas:linhas, chave:"id", grade:true, centro:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true, limite:800, vazio:"Nenhum destino neste filtro."}))));
}
export { AbaDestinos };
