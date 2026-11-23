// Sorelly Admin · montagem — pages/encomendas/PlanilhaRev.js
// PLANILHA DAS REVENDEDORAS (23/10/2026), refeita em 17/11/2026 no padrão do Financeiro (pedido do Marcus): bloco azul compacto, uma só peça de tabela (TabelaPlanilha), filtro e ordem no título de cada coluna,
// títulos em letra normal e nomes padronizados. Uma linha por revendedora, uma coluna por mês (de jul/2026 até o mês de hoje; no dia 1 do mês novo a coluna nova abre sozinha).
// VENDAS E MÉDIA VÊM DA DEVMASTER (17/11/2026, Marcus: "não pode editar ali"): nada se digita. Venda do mês = venda líquida (sem brinde); média = média das 3 últimas vendas pela regra da média (docs/negocio/MEDIA-DE-VENDAS.md).
// Rota /api/encomendas/vendas (src/server/encomendas-vendas.js). Sem a leitura da DevMaster (servidor fora ou carga ainda rodando), a tela mostra os valores que estavam guardados.
// No Top 100 há também a situação do kit (Pendente, Urgente, Montagem na empresa ou Finalizado), quem monta e a observação (chamado da Agatha, 16/11/2026). Usada no Funil (aba Revendedoras) e na tela Top 100.
// "Selecionada pelo Marcus" não entra no alerta. Retirar pede o motivo; se a revendedora é do Marcus, vira pedido de autorização (mensagem pronta).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Botao, CAMPO } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { KIT_STATUS, formatarReais, hojeSP, kitDe, mediaVendas, mesesColunas, rotuloMes } from "@/apps/montagem/domain/encomendas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";

var AZUL = "!h-[16px] !py-0 !text-[11px] !leading-none !border-white/40 !bg-[var(--bloco-titulo)] !font-normal !text-white";   // campos da planilha no azul do menu (Marcus, 23/11/2026)
var COR_KIT = {"Finalizado":"text-success", "Urgente":"text-destructive", "Pendente":"text-warning", "Montagem na empresa":"text-foreground"};
var vazio = function(x){ return x===undefined || x===null || x===""; };

// leitura das vendas da DevMaster, guardada por 10 minutos para não repetir ao trocar de tela
var CACHE = null;
function useVendasDm(){
  var st = useState(CACHE ? CACHE.dados : null), dados = st[0];
  useEffect(function(){
    if(!apiAtiva() || (CACHE && Date.now()-CACHE.em<10*60*1000)) return;
    var vivo = true;
    chamar("GET", "/encomendas/vendas").then(function(j){ if(j && j.pronto){ CACHE = {em:Date.now(), dados:j}; } if(vivo) st[1](j); }).catch(function(){ if(vivo) st[1]({erro:true}); });
    return function(){ vivo = false; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return dados;
}

// campo de texto (observação): confirma ao sair do campo
function CampoTxt(p){
  var st = useState(null), v = st[0], atual = p.v || "", txt = v===null ? atual : v;
  return e("input",{type:"text", value:txt, placeholder:"—", "aria-label":p.rot, title:p.rot,
    onChange:function(ev){ st[1](ev.target.value); },
    onBlur:function(){ if(v!==null && v!==atual) p.on(v); st[1](null); },
    onKeyDown:function(ev){ if(ev.key==="Enter") ev.currentTarget.blur(); },
    className:CAMPO+" text-center "+AZUL});
}
// seleção dentro da célula; cor = classe de cor do texto
function Escolha(p){
  return e("select",{value:p.v, "aria-label":p.rot, title:p.rot, onChange:function(ev){ p.on(ev.target.value); }, className:CAMPO+" text-center "+AZUL},
    p.opcoes.map(function(o){ return e("option",{key:o, value:o, className:"bg-card text-foreground"}, o || "—"); }));
}

function TabelaRev(p){
  var E = p.E, er = E.er, cfg = E.cfg, hoje = hojeSP(), cols = mesesColunas(cfg, hoje), extra = p.grupo==="top50", min = cfg.top50.mediaMinima;
  var dm = useVendasDm(), carregou = !!(dm && dm.pronto);
  var resps = (cfg.atendentes || []).concat(["Setor de Montagem"]);
  var lista = er.revendedoras.filter(function(r){ return extra ? r.top50 : true; }).sort(function(a, b){ return (b.top50 ? 1 : 0)-(a.top50 ? 1 : 0) || a.nome.localeCompare(b.nome); });
  var linhas = lista.map(function(r){
    var d = carregou ? dm.itens[r.id] : null, guardada = mediaVendas(r, cfg, hoje);
    var vm = d ? d.vm : (r.vendas || {}), media = d ? d.media : (guardada.media!=null ? guardada.media : null), ult = d ? (d.v.length ? d.v[0].v : "") : (r.ultimaVenda>0 ? r.ultimaVenda : "");
    var alerta = !!(r.top50 && !r.marcus && media!=null && media<min);
    var semDm = carregou && !d;
    var tot3 = cols.slice(-3).reduce(function(t, m){ return t+(Number(vm[m]) || 0); }, 0);
    var o = {id:r.id, pos:0, tot3:tot3, nome:r.nome, rep:r.representante || "", tel:r.telefone || "", ult:ult, acerto:r.dataAcerto || "", kit:kitDe(r), resp:r.respMont || "", obs:r.obs || "",
      media:media!=null ? media : "", sit:alerta ? "Média abaixo" : semDm ? "Sem cadastro na DevMaster" : r.top50 ? (r.marcus ? "Top 100 · Marcus" : "Top 100") : "Fora do Top 100", marcus:r.marcus ? "Sim" : "Não", acao:r.top50 ? "Retirar" : "Incluir", _r:r, _alerta:alerta, _semDm:semDm};
    cols.forEach(function(m){ o["m_"+m] = vazio(vm[m]) ? "" : vm[m]; });
    return o;
  });
  if(extra){ linhas.slice().sort(function(a, b){ return b.tot3-a.tot3 || a.nome.localeCompare(b.nome); }).forEach(function(l, i){ l.pos = i+1; }); linhas.sort(function(a, b){ return a.pos-b.pos; }); }   // classificação: total das vendas dos 3 últimos meses (regra do Top 100)
  var marca = function(id, campos){ E.exec("rev_montagem", Object.assign({id:id}, campos)); };
  var C = (extra ? [{k:"pos", t:"Posição", w:"5rem", fixa:true}] : []).concat([{k:"nome", t:"Revendedora", w:"15rem", fixa:extra ? "5rem" : true}, {k:"rep", t:"Representante", w:"8.5rem"}].concat(extra ? [] : [{k:"tel", t:"Telefone", w:"8.5rem"}]));
  if(extra) C = C.concat([
    {k:"resp", t:"Responsável", w:"9.5rem", render:function(v, l){ return e(Escolha,{v:v, opcoes:[""].concat(resps, v && resps.indexOf(v)<0 ? [v] : []), rot:"Quem monta o kit de "+l.nome, on:function(x){ marca(l.id, {resp:x}); }}); }},
    {k:"obs", t:"Observação", w:"13rem", render:function(v, l){ return e(CampoTxt,{v:v, rot:"Observação de "+l.nome, on:function(x){ marca(l.id, {obs:x}); }}); }}]);
  C = C.concat(cols.map(function(m){ return {k:"m_"+m, t:rotuloMes(m), w:"7rem", fmt:function(v){ return formatarReais(v); }}; }));
  C = C.concat([
    {k:"media", t:"Média", w:"8.5rem", fmt:function(v){ return formatarReais(v); }, cor:function(l){ return l._alerta ? "text-destructive font-semibold" : ""; }},
    {k:"sit", t:"Situação", w:"11rem", cor:function(l){ return l._alerta ? "text-destructive font-semibold" : l._semDm ? "text-warning" : l._r.top50 ? "text-success" : ""; }},
    {k:"marcus", t:"Marcus", w:"5.5rem", render:function(v, l){ return e("input",{type:"checkbox", checked:!!l._r.marcus, disabled:!E.pode || !l._r.top50, "aria-label":"Selecionada pelo Marcus: "+l.nome, title:E.pode ? "Selecionada pelo Marcus: fica no Top 100 mesmo com média baixa" : "Só a diretoria marca",
      className:"size-4 accent-[#E8B84B]", onChange:function(ev){ E.exec("rev_marcus", {id:l.id, valor:ev.target.checked}); }}); }},
    {k:"acao", t:"Ação", w:"7.5rem", render:function(v, l){ return e(Botao,{onClick:function(){ p.ir({tipo:l._r.top50 ? "retirar" : "solicitar", id:l.id}); }}, v); }}]);
  var total = function(ls){ return C.map(function(c, i){
    if(i===0) return "Total";
    if(c.k==="rep") return ls.length.toLocaleString("pt-BR")+(ls.length===1 ? " revendedora" : " revendedoras");
    if(c.k==="kit") return ls.filter(function(l){ return l.kit==="Pendente" || l.kit==="Urgente"; }).length+" pendentes";
    if(c.k==="sit") return ls.filter(function(l){ return l._alerta; }).length+" abaixo da média";
    if(c.k==="marcus") return String(ls.filter(function(l){ return l._r.marcus; }).length);
    return ""; }); };
  return e(TabelaPlanilha,{fina:p.grupo==="top50", semMao:p.grupo==="top50", centro:p.grupo==="top50", cols:C, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, semContagem:true, barraGrossa:true, alturaMax:p.grupo==="top50" ? "calc(100vh - 13rem)" : "calc(100vh - 9rem)", totalRodape:total, vazio:"Nenhuma revendedora encontrada."});
}

// Planilha dentro do bloco azul do Financeiro (BlocoPainel compacto: letra de 11 px, linha baixa, campos como células). Funil › Revendedoras usa esta peça inteira.
function PlanilhaRev(p){
  return e("div",{className:PADRAO_BLOCOS}, e(BlocoPainel,{titulo:p.titulo || (p.grupo==="top50" ? "Top 100" : "Revendedoras"), compacto:true}, p.topo, e(TabelaRev,{E:p.E, grupo:p.grupo, ir:p.ir})));
}
export { PlanilhaRev, TabelaRev };
