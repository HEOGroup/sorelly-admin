// Sorelly Admin · montagem — domain/preferencias-relatorio.js
// Preferências do kit: TODAS as revendedoras do sistema (quem tem kit nas listagens + atendimento interno + quem já tem preferências), separadas por representante,
// com o valor de venda e se a preferência foi preenchida ou não. Também monta o relatório para baixar (CSV, abre no Excel).
import { listagemDe } from "./regras";
import { vendidoNoApp } from "./link-pagamento";
import { hojeSP } from "./preferencias-kit";
import { pkBlocos, pkExibirResposta, pkResumoRevendedora, pkSituacao, formatarDataHora } from "./preferencias-kit";

var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var GRUPO_INTERNO = "Atendimento Sorelly", GRUPO_OUTRAS = "Sem representante";
var temPrefs = function(r){ var p = r && r.preferencias; return !!(p && ((p.respostas && Object.keys(p.respostas).length) || String(p.observacoes||"").trim())); };

// [{nome, rep, venda, rev (registro de s.pk ou null), situacao: "sem"|"pendente"|"montado", categorias, ouro, prata, atualizadoEm, fonte}]
function pkLinhasSistema(s){
  var pk = s.pk || {revendedoras:[]}, achadas = {}, out = [];
  var rvDe = function(nome){ return (pk.revendedoras||[]).find(function(r){ return norm(r.nome)===norm(nome); }) || null; };
  var poe = function(nome, rep, venda){
    var k = norm(nome); if(!k || achadas[k]) return; achadas[k] = 1;
    var rv = rvDe(nome), sit = rv ? pkSituacao(s, rv) : "sem", rs = rv && temPrefs(rv) ? pkResumoRevendedora(s, rv) : null;
    out.push({nome:nome, rep:rep, venda:venda||0, rev:rv, situacao:sit, preenchido:!!rs, categorias:rs ? rs.categoriasRespondidas : 0, ouro:rs && rs.resumoGeral ? rs.resumoGeral.ouro : null, prata:rs && rs.resumoGeral ? rs.resumoGeral.prata : null,
      atualizadoEm:rv && rv.preferencias ? rv.preferencias.atualizadoEm : null, fonte:rv && rv.preferencias ? rv.preferencias.fonte : null});
  };
  (s.kits||[]).forEach(function(k){ var l = null; try { l = listagemDe(s, k); } catch(x){} poe(k.rev, l && l.rep ? l.rep : GRUPO_OUTRAS, ((k.vendas||[])[0]||0) + (s.lp ? vendidoNoApp(s.lp, k.rev, hojeSP().slice(0, 7)) : 0)); });
  (s.revInternas||[]).forEach(function(r){ var h = (r.hist||[]).find(function(x){ return x && x.venda>0; }); poe(r.nome, GRUPO_INTERNO, h ? h.venda : 0); });
  (pk.revendedoras||[]).forEach(function(r){ poe(r.nome, GRUPO_OUTRAS, 0); });
  return out;
}
// agrupa por representante (ordem alfabética; "Atendimento Sorelly" e "Sem representante" por último) com os totais de cada grupo
function pkPorRepresentante(linhas){
  var g = {};
  linhas.forEach(function(l){ (g[l.rep] = g[l.rep] || {rep:l.rep, itens:[]}).itens.push(l); });
  var peso = function(r){ return r===GRUPO_INTERNO ? 1 : r===GRUPO_OUTRAS ? 2 : 0; };
  return Object.keys(g).map(function(k){ var x = g[k]; x.itens.sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
    x.total = x.itens.length; x.preenchidas = x.itens.filter(function(i){ return i.preenchido; }).length; x.venda = x.itens.reduce(function(t, i){ return t+i.venda; }, 0); return x; })
    .sort(function(a, b){ return peso(a.rep)-peso(b.rep) || a.rep.localeCompare(b.rep, "pt-BR"); });
}
var ROTULO_SIT = {sem:"Não preencheu", pendente:"Preencheu · pendente de montagem", montado:"Preencheu · já montado"};
var csv = function(v){ var t = String(v==null ? "" : v); return /[";\n]/.test(t) ? "\""+t.replace(/"/g, "\"\"")+"\"" : t; };
var resumoResposta = function(b, r){ var x = pkExibirResposta(b, r); if(x.vazio) return ""; var p = [];
  if(x.vende!==null) p.push(x.vende ? "Vende" : "Não vende"); if(x.ouroPct!=null) p.push("Ouro "+x.ouroPct+"% / Prata "+(100-x.ouroPct)+"%");
  x.linhas.forEach(function(l){ var v = (l.valores||[]).join(", ") || l.metal || ""; p.push(l.rotulo+(v ? ": "+v : "")+((l.valores||[]).length && l.metal ? " ("+l.metal+")" : "")); }); return p.join(" | "); };
// relatório completo em CSV (separador ponto e vírgula, com acentos para o Excel): uma linha por revendedora, uma coluna por bloco do formulário
function pkRelatorioCSV(s, linhas){
  var blocos = pkBlocos(s, {apenasAtivos:true}).filter(function(b){ return b.type!=="observacoes"; });
  var cab = ["Representante", "Revendedora", "Venda do mês (R$)", "Preencheu", "Situação", "Categorias respondidas", "% Ouro", "% Prata", "Atualizado em", "Fonte"].concat(blocos.map(function(b){ return b.title; }), ["Observações"]);
  var rows = linhas.slice().sort(function(a, b){ return a.rep.localeCompare(b.rep, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"); }).map(function(l){
    var rs = (l.rev && l.rev.preferencias && l.rev.preferencias.respostas) || {};
    return [l.rep, l.nome, l.venda ? l.venda.toFixed(2).replace(".", ",") : "", l.preenchido ? "Sim" : "Não", ROTULO_SIT[l.situacao], l.categorias, l.ouro!=null ? String(l.ouro).replace(".", ",") : "", l.prata!=null ? String(l.prata).replace(".", ",") : "",
      l.atualizadoEm ? formatarDataHora(l.atualizadoEm) : "", l.fonte||""].concat(blocos.map(function(b){ return resumoResposta(b, rs[b.key]); }), [l.rev && l.rev.preferencias ? l.rev.preferencias.observacoes||"" : ""]); });
  return "﻿"+[cab].concat(rows).map(function(r){ return r.map(csv).join(";"); }).join("\r\n");
}
// preferências já respondidas de uma revendedora, em texto corrido e sem abreviar, para quem monta o kit: [{titulo, texto}]
function pkResumoParaMontagem(s, nome){
  var pk = s.pk, rv = pk && (pk.revendedoras||[]).find(function(r){ return norm(r.nome)===norm(nome); });
  if(!rv || !temPrefs(rv)) return [];
  var rs = (rv.preferencias && rv.preferencias.respostas) || {}, out = [];
  pkBlocos(s, {apenasAtivos:true}).forEach(function(b){
    if(b.type==="observacoes"){ var o = String(rv.preferencias.observacoes||"").trim(); if(o) out.push({titulo:"Observações", texto:o}); return; }
    var t = resumoResposta(b, rs[b.key]); if(t) out.push({titulo:b.title, texto:t.split(" | ").join(". ")});
  });
  return out;
}
export { pkResumoParaMontagem, GRUPO_INTERNO, GRUPO_OUTRAS, ROTULO_SIT, pkLinhasSistema, pkPorRepresentante, pkRelatorioCSV };
