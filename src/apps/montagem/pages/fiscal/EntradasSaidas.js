// Sorelly Admin · montagem — pages/fiscal/EntradasSaidas.js
// Fiscal → Entradas (notas de entrada e classificação para o ILF) e Saídas (venda, brindes e trocas em 3 períodos de 10 dias por mês).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BarraFiltros, Dinheiro, Faixa, Indicador, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { CLASSIFICACOES, ROTULO_CLASSIFICACAO, ROTULO_PERIODO, MESES, fxNotasDe, fxSaidasDoMes, yearMonth } from "@/apps/montagem/domain/fiscal";
import { CLASSE_COR, COR, ENTRADA, EXPLICA, Bt, Campo, Chip, Jan, Selo, Vazio, baixarCsv, fmt, hoje, useFx } from "@/apps/montagem/pages/fiscal/visual";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";

var num = function(v){ return Number(v) || 0; };
var rotCl = function(c){ return fmt.cap(ROTULO_CLASSIFICACAO[c].toLowerCase()); };

// ───────────── Entradas ─────────────
// janela de lançamento: 3 colunas (empresa e documento | fornecedor e local | valor e classificação)
function JanelaNota(p){
  var f = p.f, emps = f.fx.empresas, st = useState({empresaId:p.empresaId || (emps[0] && emps[0].id) || "", data:hoje(), nf:"", fornecedor:"", cfop:"", uf:"", valor:0, classificacao:"LASTRO"}), v = st[0];
  var set = function(o){ st[1](Object.assign({}, v, o)); };
  var valido = v.empresaId && /^\d{4}-\d{2}-\d{2}$/.test(v.data) && v.valor>0;
  var lancar = function(continuar){
    if(!valido) return;
    f.envia(Object.assign({op:"nota_add"}, v));
    if(continuar) set({nf:"", valor:0}); else p.fechar();
  };
  return e(Jan,{t:"Lançar nota de entrada", sub:"Compras de mercadoria e demais entradas por empresa.", fechar:p.fechar,
    colunas:[
      e("div",{key:"a", className:"flex flex-col gap-2"},
        e(Campo,{t:"Empresa"}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, emps.map(function(x){ return e(Chip,{key:x.id, on:v.empresaId===x.id, onClick:function(){ set({empresaId:x.id}); }}, x.nome); }))),
        e(Campo,{t:"Data da nota"}, e("input",{type:"date", value:v.data, "aria-label":"Data da nota", onChange:function(ev){ set({data:ev.target.value}); }, className:ENTRADA})),
        e(Campo,{t:"Número da NF"}, e("input",{value:v.nf, "aria-label":"Número da NF", onChange:function(ev){ set({nf:ev.target.value}); }, className:ENTRADA+" "+MONO}))),
      e("div",{key:"b", className:"flex flex-col gap-2"},
        e(Campo,{t:"Fornecedor"}, e("input",{value:v.fornecedor, "aria-label":"Fornecedor", onChange:function(ev){ set({fornecedor:ev.target.value}); }, className:ENTRADA})),
        e(Campo,{t:"CFOP"}, e("input",{value:v.cfop, inputMode:"numeric", maxLength:5, "aria-label":"CFOP", onChange:function(ev){ set({cfop:ev.target.value.replace(/[^\d.]/g,"")}); }, className:ENTRADA+" "+MONO})),
        e(Campo,{t:"UF de origem"}, e("input",{value:v.uf, maxLength:2, "aria-label":"UF de origem", onChange:function(ev){ set({uf:ev.target.value.toUpperCase().replace(/[^A-Z]/g,"")}); }, className:ENTRADA+" uppercase"}))),
      e("div",{key:"c", className:"flex flex-col gap-2"},
        e(Campo,{t:"Valor da nota"}, e(Dinheiro,{value:v.valor, label:"Valor da nota", onChange:function(n){ set({valor:num(n)}); }})),
        e(Campo,{t:"Classificação"}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, CLASSIFICACOES.map(function(c){ return e(Chip,{key:c, on:v.classificacao===c, onClick:function(){ set({classificacao:c}); }}, rotCl(c)); }))),
        e("p",{className:"rounded-lg bg-black/25 px-3 py-2 text-center text-[12.5px] text-white/85 ring-1 ring-white/10"}, EXPLICA[v.classificacao]))],
    rodape:[e(Bt,{key:"l", tipo:"forte", ic:"check-circle", disabled:!valido, titulo:valido ? "" : "Informe empresa, data e valor", onClick:function(){ lancar(false); }}, "Lançar nota"),
      e(Bt,{key:"n", ic:"plus", disabled:!valido, onClick:function(){ lancar(true); }}, "Lançar e continuar"), e(Bt,{key:"x", onClick:p.fechar}, "Cancelar")]});
}

function AbaFxEntradas(p){
  var f = useFx(), s = f.s, ano = p.ano, emps = f.fx.empresas;
  var fi = useState({emp:p.emp||"", mes:p.mes0||"", cl:"", q:""}), filtro = fi[0], setF = function(o){ fi[1](Object.assign({}, filtro, o)); setVer(30); };
  var vs = useState(30), ver = vs[0], setVer = vs[1];
  var jn = useState(false), cf = useState(null);
  // a confirmação de exclusão some sozinha depois de 4 segundos
  useEffect(function(){ if(!cf[0]) return; var t = setTimeout(function(){ cf[1](null); }, 4000); return function(){ clearTimeout(t); }; }, [cf[0]]);
  if(!emps.length) return e(Vazio,{ic:"buildings", acao:e(Bt,{tipo:"forte", ic:"gear", onClick:function(){ p.ir("config"); }}, "Cadastrar empresas")}, "Cadastre ao menos uma empresa para lançar notas.");
  var nomeEmp = {}; emps.forEach(function(x){ nomeEmp[x.id] = x.nome; });
  var base = [];
  emps.forEach(function(x){ if(!filtro.emp || filtro.emp===x.id) base = base.concat(fxNotasDe(s, x.id, filtro.mes ? 0 : ano)); });
  var q = filtro.q.trim().toLowerCase();
  var lista = base.filter(function(n){ return (!filtro.mes || String(n.data).slice(0,7)===filtro.mes) && (!filtro.cl || n.classificacao===filtro.cl) && (!q || (n.nf+" "+n.fornecedor+" "+n.cfop+" "+n.uf).toLowerCase().indexOf(q)>=0); })
    .sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
  var soma = function(fn){ return Math.round(lista.filter(fn).reduce(function(t, n){ return t+n.valor; }, 0)*100)/100; };
  var tot = soma(function(){ return true; }), lastro = soma(function(n){ return n.classificacao==="LASTRO"; });
  var ativo = !!(filtro.emp || filtro.mes || filtro.cl || filtro.q);
  var csv = function(){ baixarCsv("notas-de-entrada-"+(filtro.mes || ano)+".csv", [["Data","Empresa","NF","Fornecedor","CFOP","UF","Valor","Classificação"]].concat(lista.map(function(n){ return [fmt.data(n.data), nomeEmp[n.empresaId], n.nf, n.fornecedor, n.cfop, n.uf, String(n.valor.toFixed(2)).replace(".", ","), rotCl(n.classificacao)]; }))); };
  var excluir = function(id){ if(cf[0]===id){ f.envia({op:"nota_del", id:id}); cf[1](null); } else cf[1](id); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ jn[1](true); }}, "Lançar nota de entrada"), e(Bt,{ic:"download-simple", disabled:!lista.length, onClick:csv, titulo:"Baixar as notas filtradas em planilha"}, "Exportar CSV")),
    e(Faixa,{n:4},
      e(Indicador,{t:"Entradas", v:fmt.brl(tot), cor:"cian", sub:"Total do filtro"}), e(Indicador,{t:"Lastro", v:fmt.brl(lastro), cor:"ok"}),
      e(Indicador,{t:"Não lastro", v:fmt.brl(Math.round((tot-lastro)*100)/100), cor:"neutro"}), e(Indicador,{t:"Notas", v:lista.length, cor:"total"})),
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ fi[1]({emp:"", mes:"", cl:"", q:""}); setVer(30); }},
      !p.emp && e(Chip,{on:!filtro.emp, onClick:function(){ setF({emp:""}); }, ic:"buildings"}, "Todas"), !p.emp && emps.map(function(x){ return e(Chip,{key:x.id, on:filtro.emp===x.id, onClick:function(){ setF({emp:x.id}); }}, x.nome); }),
      e("input",{type:"month", value:filtro.mes, "aria-label":"Mês", onChange:function(ev){ setF({mes:ev.target.value}); }, className:INPUT+" h-9! w-40 text-center text-[13px]!"}),
      CLASSIFICACOES.map(function(c){ return e(Chip,{key:c, on:filtro.cl===c, onClick:function(){ setF({cl:filtro.cl===c ? "" : c}); }}, rotCl(c)); }),
      e("div",{className:"relative min-w-44 max-w-xs flex-1 basis-48"}, e(Ph,{n:"magnifying-glass", s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60"}),
        e("input",{type:"search", value:filtro.q, placeholder:"Buscar nota, fornecedor ou CFOP", "aria-label":"Buscar", onChange:function(ev){ setF({q:ev.target.value}); }, className:INPUT+" h-9! w-full pl-9 text-center text-[13px]!"}))),
    lista.length ? e(BlocoBarra,{cor:"turquesa", t:"Notas de entrada", compacto:true, dir:lista.length},
      e("div",{className:"p-2"}, e(Tab,{cols:["Data","Empresa","NF","Fornecedor","CFOP","UF","Valor","Classificação",""]}, lista.slice(0, ver).map(function(n){ var pede = cf[0]===n.id;
        return e("tr",{key:n.id, className:LINHA}, e(Td,{dinheiro:true}, fmt.data(n.data)), e(Td,{forte:true}, nomeEmp[n.empresaId]), e(Td,{dinheiro:true}, n.nf || "—"), e(Td,null, n.fornecedor || "—"), e(Td,{dinheiro:true}, n.cfop || "—"), e(Td,null, n.uf || "—"),
          e(Td,{dinheiro:true, forte:true}, fmt.brl(n.valor)), e(Td,null, e(Selo,{cor:CLASSE_COR[n.classificacao]}, rotCl(n.classificacao))),
          e(Td,null, e(Bt,{tipo:pede ? "perigo" : "normal", ic:pede ? "warning-circle" : "trash", rotulo:pede ? "Confirmar exclusão" : "Excluir nota", titulo:pede ? "Clique de novo para confirmar" : "Excluir nota", onClick:function(){ excluir(n.id); }, className:"h-8 px-2"}, pede ? "Confirmar" : null))); })),
        ver<lista.length && e("div",{className:"flex justify-center pt-2"}, e(Bt,{ic:"caret-down", onClick:function(){ setVer(ver+30); }}, "Ver mais ("+(lista.length-ver)+")")))) : e(Vazio,{ic:"receipt"}, ativo ? "Nenhuma nota encontrada para este filtro." : "Nenhuma nota de entrada lançada em "+ano+"."),
    jn[0] && e(JanelaNota,{f:f, empresaId:filtro.emp, fechar:function(){ jn[1](false); }}));
}

// ───────────── Saídas ─────────────
var CAMPOS = [["venda","Venda"], ["brindes","Brindes"], ["trocas","Trocas"]];
// formulário de UM mês de UMA empresa (recriado ao trocar empresa ou mês, por causa do key)
function FormSaidas(p){
  var f = p.f, sm = fxSaidasDoMes(f.s, p.empresaId, p.ym);
  var ini = [0,1,2].map(function(i){ var x = sm.periodos[i]; return {venda:x ? x.venda : 0, brindes:x ? x.brindes : 0, trocas:x ? x.trocas : 0}; });
  var st = useState(ini), d = st[0], sv = useState(false);
  var sujo = [0,1,2].some(function(i){ return CAMPOS.some(function(c){ return num(d[i][c[0]])!==ini[i][c[0]]; }); });
  var troca = function(i, k, v){ var n = d.map(function(x){ return Object.assign({}, x); }); n[i][k] = num(v); st[1](n); sv[1](false); };
  var salvar = function(){ [0,1,2].forEach(function(i){ if(CAMPOS.some(function(c){ return num(d[i][c[0]])!==ini[i][c[0]]; })) f.envia({op:"saida_set", empresaId:p.empresaId, yearMonth:p.ym, periodo:i, venda:num(d[i].venda), brindes:num(d[i].brindes), trocas:num(d[i].trocas)}); }); sv[1](true); };
  var t = function(k){ return Math.round(d.reduce(function(a, x){ return a+num(x[k]); }, 0)*100)/100; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"grid items-start gap-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 15rem), 1fr))"}}, [0,1,2].map(function(i){
      return e("section",{key:i, className:"flex flex-col gap-2 rounded-xl bg-black/20 p-2.5 ring-1 ring-white/10"},
        e("h3",{className:"flex items-center justify-center gap-1.5 text-center text-[12px] font-bold uppercase tracking-wide text-white/85"}, e(Ph,{n:"calendar-blank", s:15}), ROTULO_PERIODO[i]),
        CAMPOS.map(function(c){ return e(Campo,{key:c[0], t:c[1]}, e(Dinheiro,{value:d[i][c[0]], label:c[1]+", "+ROTULO_PERIODO[i], onChange:function(n){ troca(i, c[0], n); }})); }));
    })),
    e(Faixa,{n:4}, e(Indicador,{t:"Venda no mês", v:fmt.brl(t("venda")), cor:"cian"}), e(Indicador,{t:"Brindes", v:fmt.brl(t("brindes")), cor:"alerta"}), e(Indicador,{t:"Trocas", v:fmt.brl(t("trocas")), cor:"info"}), e(Indicador,{t:"Total de saídas", v:fmt.brl(Math.round((t("venda")+t("brindes")+t("trocas"))*100)/100), cor:"total"})),
    e("div",{className:"flex items-center justify-center gap-2"}, e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!sujo, onClick:salvar}, "Salvar saídas"),
      sv[0] && !sujo && e(Selo,{cor:"ok", ic:"check-circle"}, "Salvo"), sujo && e(Selo,{cor:"alerta", ic:"warning-circle"}, "Alterações não salvas")));
}

function AbaFxSaidas(p){
  var f = useFx(), s = f.s, ano = p.ano, emps = f.fx.empresas;
  var st = useState({emp:"", mes:Math.min(12, Math.max(1, Number(hoje().slice(5,7))))}), v = st[0];
  if(!emps.length) return e(Vazio,{ic:"buildings", acao:e(Bt,{tipo:"forte", ic:"gear", onClick:function(){ p.ir("config"); }}, "Cadastrar empresas")}, "Cadastre ao menos uma empresa para lançar saídas.");
  var emp = emps.filter(function(x){ return x.id===v.emp; })[0] || emps[0], ym = yearMonth(ano, v.mes);
  var resumo = [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){ return fxSaidasDoMes(s, emp.id, yearMonth(ano, i+1)); });
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BarraFiltros,null, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, emps.map(function(x){ return e(Chip,{key:x.id, on:x.id===emp.id, ic:"buildings", onClick:function(){ st[1](Object.assign({}, v, {emp:x.id})); }}, x.nome); }))),
    e("div",{className:"flex flex-wrap justify-center gap-1.5"}, MESES.map(function(m, i){ return e(Chip,{key:i, on:v.mes===i+1, onClick:function(){ st[1](Object.assign({}, v, {emp:emp.id, mes:i+1})); }, className:"w-24"}, fmt.cap(m.slice(0,3))+(resumo[i].venda>0 ? " ●" : "")); })),
    e(BlocoBarra,{cor:"turquesa", t:emp.nome+" · "+fmt.cap(MESES[v.mes-1])+" de "+ano, compacto:true}, e("div",{className:"p-2.5"}, e(FormSaidas,{key:emp.id+ym, f:f, empresaId:emp.id, ym:ym}))),
    e(BlocoBarra,{cor:"turquesa", t:"Saídas do ano · "+emp.nome, compacto:true},
      e("div",{className:"p-2"}, e(Tab,{cols:["Mês","Venda","Brindes","Trocas","Total"]}, resumo.map(function(r, i){ var on = v.mes===i+1;
        return e("tr",{key:i, onClick:function(){ st[1](Object.assign({}, v, {emp:emp.id, mes:i+1})); }, className:LINHA+" cursor-pointer hover:bg-white/10", style:on ? {background:COR+"22"} : undefined},
          e(Td,{forte:true}, fmt.cap(MESES[i])), e(Td,{dinheiro:true, cor:r.venda>0 ? "cian" : undefined}, fmt.brl(r.venda)), e(Td,{dinheiro:true}, fmt.brl(r.brindes)), e(Td,{dinheiro:true}, fmt.brl(r.trocas)), e(Td,{dinheiro:true, forte:true}, fmt.brl(r.total))); })))));
}
export { AbaFxEntradas, AbaFxSaidas, JanelaNota };
