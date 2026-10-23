import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/producao.js
// Produção de peças (fábrica), trazido do SorellyAdmin (docs/modulos/producao.md). NÃO é a Montagem de kits nem a Premiação da montagem.
// Registro diário do que cada funcionária fabricou (código, quantidade, valor unitário, unidade Sorelly/Serenity); painel por período, categoria
// (pelo prefixo do código), funcionária, resumo do dia para o WhatsApp e bônus mensal por faixa de peças (Premiação, só diretoria).
// Estado s.pr (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/producao.local.js (gitignored):
//   export default {funcionarias:["Nome", ...], codigos:{A:"Anéis", AP:"Anel Prata 925"}, faixas:[{min:6000,max:6399,valor:150}], lancamentos:{"2026-10-15":[{func,codigo,qtd,valor,unidade}]}, ajustes:[{func,ano,mes,valor}]}
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16"), dinheiro em reais. Faixas do bônus moram em s.pr.faixas (vazio = vale FAIXAS_PADRAO, igual ao original).
// Funcionárias e códigos são TEXTO nos lançamentos (sem vínculo): renomear não mexe no histórico, a menos que se peça (a.propagar).

import { hojeSP, somaDias, ultimoDiaDoMes } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/producao.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(typeof v==="string" ? v.replace(",", ".") : v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };
var utcDe = function(dia){ var a = String(dia).split("-").map(Number); return Date.UTC(a[0], a[1]-1, a[2]); };

// ---------- vocabulário ----------
var UNIDADES = ["SORELLY", "SERENITY"];
var ROTULO_UNIDADE = {SORELLY:"Sorelly", SERENITY:"Serenity"};
var PERIODOS = ["semana", "mes", "tudo"];
var ROTULO_PERIODO = {semana:"Semana", mes:"Mês", tudo:"Tudo"};
var DIAS_SEMANA = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
// faixas do bônus quando nenhuma foi cadastrada (valores da doc; o Configurador manda)
var FAIXAS_PADRAO = [{min:6000, max:6399, valor:150}, {min:6400, max:6799, valor:175}, {min:6800, max:null, valor:250}];
// mapa de códigos do mockup original (categoria pelo prefixo). Só entra se alguém pedir (op "cod_padrao"); nasce vazio.
var CODIGOS_PADRAO = {A:"Anéis", AP:"Anel Prata 925", AA:"Collection", AX:"Joias Axis", B:"Brincos", BB:"Brincos Select", BC:"Brincos Collection", BL:"Brincos Borboleta", BR:"Brindes", BT:"Bracelete", BBB:"Brincos Borboleta (canc.)", BBC:"Colares Select", BBA:"Anéis Select", BBP:"Pulseiras Select", BBI:"Infantil Select", BCC:"Conjuntos Select", BBT:"Tornozeleiras Select", BBRT:"Braceletes Select", BBCK:"Choker Select", CC:"Conjuntos", CL:"Colares", CK:"Choker", COL:"Collection", I:"Infantil", P:"Pulseiras", T:"Tornozeleiras", MP:"Suporte", M:"Masculino", ES:"Religiosos", PI:"Pingentes", MU:"Material de uso geral", SP:"Sorelly Premium", DUO:"Duo de Brincos", "2B":"Brinco Duo", EX:"Expositores", SN:"Joias Serenety", "3K":"Peças p/ Rev. +3K"};

// ---------- formatação ----------
function formatarReais(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatarInteiro(v){ return (Number(v)||0).toLocaleString("pt-BR"); }
function formatarDia(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function diaDaSemana(dia){ return ehDia(dia) ? DIAS_SEMANA[new Date(utcDe(dia)).getUTCDay()] : ""; }
function nomeMes(ano, mes){ return MESES[(mes||1)-1]+" de "+ano; }

// ---------- linhas, categoria e totais ----------
function valorLinha(l){ return r2((num(l.qtd))*(num(l.valor))); }
// normaliza uma linha digitada: trim em nome e código, código em MAIÚSCULAS, unidade válida. Devolve null se vazia
function limparLinha(l){
  l = l||{}; var cod = trim(l.codigo).toUpperCase(), q = num(l.qtd), v = num(l.valor);
  if(cod==="" && q<=0 && v<=0) return null;   // linha totalmente vazia é descartada
  return {func:trim(l.func), codigo:cod, qtd:q, valor:v, unidade:UNIDADES.indexOf(l.unidade)>=0 ? l.unidade : "SORELLY"};
}
function limparLinhas(ls){ return (ls||[]).map(limparLinha).filter(Boolean); }

// mapa {map:{PREFIXO:rótulo}, chaves:[prefixos do mais longo para o mais curto]} a partir de s.pr.codigos
function montarMapa(codigos){
  var map = {}; (codigos||[]).forEach(function(c){ var k = trim(c.codigo).toUpperCase(); if(k) map[k] = c.rotulo; });
  return {map:map, chaves:Object.keys(map).sort(function(a, b){ return b.length-a.length; })};
}
// categoria pelo prefixo mais longo; o resto do código precisa ser vazio ou começar com dígito (AP1203 → AP, não A). Sem casamento: null
function categoriaDe(codigo, mapa){
  var c = trim(codigo).toUpperCase(); if(!c) return null;
  for(var i=0; i<mapa.chaves.length; i++){ var k = mapa.chaves[i]; if(c.indexOf(k)===0){ var resto = c.slice(k.length); if(resto==="" || /^[0-9]/.test(resto)) return {chave:k, rotulo:mapa.map[k]}; } }
  return null;
}
// totais de um conjunto de linhas. Linha com qtd ≤ 0 e valor ≤ 0 não entra
function agregar(linhas, mapa){
  var t = {pecas:0, valor:0, modelos:0, ativas:0, porCategoria:{}, porFuncionaria:{}, porCodigo:{}}, cods = {}, nomes = {};
  (linhas||[]).forEach(function(l){
    var q = num(l.qtd), v = q*num(l.valor); if(q<=0 && v<=0) return;
    t.pecas += q; t.valor += v;
    var soma = function(o, k){ var x = o[k] || (o[k] = {pecas:0, valor:0}); x.pecas += q; x.valor += v; };
    if(l.codigo){ cods[l.codigo] = 1; soma(t.porCodigo, l.codigo); }
    if(l.func){ nomes[l.func] = 1; soma(t.porFuncionaria, l.func); }
    var cat = categoriaDe(l.codigo, mapa); soma(t.porCategoria, cat ? cat.rotulo : (l.codigo ? "? "+l.codigo : "Sem código"));
  });
  t.valor = r2(t.valor); t.modelos = Object.keys(cods).length; t.ativas = Object.keys(nomes).length;
  ["porCategoria", "porFuncionaria", "porCodigo"].forEach(function(g){ Object.keys(t[g]).forEach(function(k){ t[g][k].valor = r2(t[g][k].valor); }); });
  return t;
}
// variação % contra o período anterior (null se não há base ou é zero)
function tendencia(atual, anterior){ if(anterior==null || anterior===0) return null; return ((atual-anterior)/anterior)*100; }
// {k:{pecas,valor}} → [{nome,pecas,valor}] do maior valor para o menor (limite opcional)
function ranking(grupo, limite){ var l = Object.keys(grupo||{}).map(function(k){ return {nome:k, pecas:grupo[k].pecas, valor:grupo[k].valor}; }).sort(function(a, b){ return b.valor-a.valor || b.pecas-a.pecas || (a.nome<b.nome ? -1 : 1); }); return limite>0 ? l.slice(0, limite) : l; }

// ---------- períodos do painel ----------
// semana = últimos 7 dias até a referência; mês = mês do calendário inteiro; tudo = desde 2020 até a referência
function intervaloPeriodo(periodo, ref){
  ref = ref||hojeSP();
  if(periodo==="semana") return {from:somaDias(ref, -6), to:ref};
  if(periodo==="mes"){ var m = ref.slice(0,7); return {from:m+"-01", to:ultimoDiaDoMes(m)}; }
  return {from:"2020-01-01", to:ref};
}
// período imediatamente anterior para o comparativo (null em "tudo")
function intervaloAnterior(periodo, ref){
  ref = ref||hojeSP();
  if(periodo==="semana"){ var fim = somaDias(ref, -7); return {from:somaDias(fim, -6), to:fim}; }
  if(periodo==="mes"){ var a = ref.slice(0,7).split("-").map(Number), ano = a[1]===1 ? a[0]-1 : a[0], mes = a[1]===1 ? 12 : a[1]-1, m = ano+"-"+p2(mes); return {from:m+"-01", to:ultimoDiaDoMes(m)}; }
  return null;
}
function rotuloIntervalo(iv){ return formatarDia(iv.from)+" a "+formatarDia(iv.to); }

// ---------- leitura dos lançamentos ----------
function linhasDoDia(pr, dia, unidade){ var l = (pr.lancamentos||{})[dia] || []; return unidade && UNIDADES.indexOf(unidade)>=0 ? l.filter(function(x){ return x.unidade===unidade; }) : l; }
// todas as linhas entre duas datas (inclusive), com filtro opcional de filial (unidade)
function linhasDoPeriodo(pr, from, to, unidade){
  var out = [], lanc = pr.lancamentos||{};
  Object.keys(lanc).sort().forEach(function(d){ if(d>=from && d<=to) lanc[d].forEach(function(l){ if(!unidade || l.unidade===unidade) out.push(Object.assign({dia:d}, l)); }); });
  return out;
}
// dias que têm lançamento (para pular de dia em dia, mais recentes primeiro)
function diasComLancamento(pr){ return Object.keys(pr.lancamentos||{}).filter(function(d){ return (pr.lancamentos[d]||[]).length>0; }).sort().reverse(); }
function diaAnterior(dia){ return somaDias(dia, -1); }
function diaSeguinte(dia){ return somaDias(dia, 1); }

// Painel por período: KPIs, tendência contra o período anterior, valor por categoria e top códigos
// opts: {periodo:"semana"|"mes"|"tudo", ref:"2026-10-16", unidade:null|"SORELLY"|"SERENITY", topCodigos:8}
function painelPeriodo(pr, opts){
  opts = opts||{}; var periodo = PERIODOS.indexOf(opts.periodo)>=0 ? opts.periodo : "mes", ref = opts.ref||hojeSP(), mapa = montarMapa(pr.codigos);
  var iv = intervaloPeriodo(periodo, ref), ant = intervaloAnterior(periodo, ref);
  var agg = agregar(linhasDoPeriodo(pr, iv.from, iv.to, opts.unidade), mapa), aggAnt = ant ? agregar(linhasDoPeriodo(pr, ant.from, ant.to, opts.unidade), mapa) : null;
  return {periodo:periodo, intervalo:iv, rotulo:rotuloIntervalo(iv), anterior:ant, agg:agg, aggAnterior:aggAnt,
    tendPecas:aggAnt ? tendencia(agg.pecas, aggAnt.pecas) : null, tendValor:aggAnt ? tendencia(agg.valor, aggAnt.valor) : null,
    categorias:ranking(agg.porCategoria), topCodigos:ranking(agg.porCodigo, opts.topCodigos||8), funcionarias:ranking(agg.porFuncionaria)};
}
// Resumo de um dia (KPIs com tendência contra o dia anterior, por categoria e por funcionária) + texto do WhatsApp
function resumoDoDia(pr, dia, unidade){
  var mapa = montarMapa(pr.codigos), agg = agregar(linhasDoDia(pr, dia, unidade), mapa), antDia = diaAnterior(dia), aggAnt = agregar(linhasDoDia(pr, antDia, unidade), mapa);
  return {dia:dia, rotuloDia:formatarDia(dia), diaSemana:diaDaSemana(dia), agg:agg, aggAnterior:aggAnt, tendPecas:tendencia(agg.pecas, aggAnt.pecas), tendValor:tendencia(agg.valor, aggAnt.valor),
    categorias:ranking(agg.porCategoria), funcionarias:ranking(agg.porFuncionaria), texto:textoDoDia(dia, agg)};
}
function secaoTexto(titulo, grupo){ var l = ranking(grupo); if(!l.length) return []; var out = ["*"+titulo+"*"]; l.forEach(function(x){ out.push("• "+x.nome+": "+formatarInteiro(x.pecas)+" pç · "+formatarReais(x.valor)); }); return out; }
// texto para colar no WhatsApp (negrito com asterisco simples)
function textoDoDia(dia, agg){
  var l = ["📋 *PRODUÇÃO — "+formatarDia(dia)+"* ("+diaDaSemana(dia)+")", "", "Total: *"+formatarInteiro(agg.pecas)+"* peças · *"+formatarReais(agg.valor)+"*", "Funcionárias: "+formatarInteiro(agg.ativas)+" · Modelos: "+formatarInteiro(agg.modelos)];
  var f = secaoTexto("Por funcionária:", agg.porFuncionaria); if(f.length) l = l.concat([""], f);
  var c = secaoTexto("Por categoria:", agg.porCategoria); if(c.length) l = l.concat([""], c);
  return l.join("\n");
}
// nomes para sugerir no lançamento (todas as cadastradas, inclusive inativas, mais quem já lançou); a digitação livre também é aceita
function nomesParaLancamento(pr){ var v = {}, out = []; (pr.funcionarias||[]).concat([]).sort(function(a, b){ return a.posicao-b.posicao; }).forEach(function(f){ if(!v[f.nome]){ v[f.nome] = 1; out.push(f.nome); } }); return out; }
// categoria de um código digitado (para mostrar ao lado da linha): {rotulo} | {rotulo:"? X", desconhecida:true} | {rotulo:"Sem código"}
function categoriaDaLinha(pr, codigo){ var c = trim(codigo).toUpperCase(); if(!c) return {rotulo:"Sem código", desconhecida:false}; var cat = categoriaDe(c, montarMapa(pr.codigos)); return cat ? {rotulo:cat.rotulo, chave:cat.chave, desconhecida:false} : {rotulo:"? "+c, desconhecida:true}; }

// ---------- bônus mensal ----------
function ordenarFaixas(fs){ return (fs||[]).slice().sort(function(a, b){ return a.min-b.min; }); }
function faixasEfetivas(pr){ return pr.faixas && pr.faixas.length ? pr.faixas : FAIXAS_PADRAO; }
// primeira faixa com min ≤ peças ≤ max (max nulo = sem teto). Fora de faixa = R$ 0
function bonusDasPecas(pecas, faixas){ var o = ordenarFaixas(faixas); for(var i=0; i<o.length; i++){ var f = o[i]; if(pecas>=f.min && (f.max==null || pecas<=f.max)) return {valor:f.valor, faixa:f}; } return {valor:0, faixa:null}; }
// próxima faixa e quantas peças faltam (null = já no topo)
function proximaFaixa(pecas, faixas){ var o = ordenarFaixas(faixas); for(var i=0; i<o.length; i++){ if(pecas<o[i].min) return {faixa:o[i], faltam:o[i].min-pecas}; } return null; }
function topoBonus(faixas){ return Math.max.apply(null, [1].concat((faixas||[]).map(function(f){ return f.min; }))); }
function ajusteDoMes(pr, func, ano, mes){ return (pr.ajustes||[]).find(function(x){ return x.func===func && x.ano===ano && x.mes===mes; }) || null; }
// peças do mês por funcionária (Sorelly + Serenity juntas, sem filtro de unidade)
function pecasDoMes(pr, ano, mes){
  var m = ano+"-"+p2(mes), de = m+"-01", ate = ultimoDiaDoMes(m), por = {};
  linhasDoPeriodo(pr, de, ate, null).forEach(function(l){ var q = num(l.qtd), v = q*num(l.valor); if(q<=0 && v<=0) return; if(!l.func) return; por[l.func] = (por[l.func]||0)+q; });
  return por;
}
// Premiação do mês: todas as cadastradas + quem lançou, do maior para o menor. Ajuste manual vale no lugar do calculado
// Devolve {ano, mes, rotulo, topo, faixas, linhas:[{posicao, nome, cadastrada, pecas, calculado, faixa, proxima:{faixa,faltam}|null, progresso(0-1), ajuste:{id,valor,por,em}|null, valor}], totalBonus, totalPecas}
function premiacaoDoMes(pr, ano, mes){
  var faixas = faixasEfetivas(pr), por = pecasDoMes(pr, ano, mes), nomes = {}, lista = [];
  (pr.funcionarias||[]).forEach(function(f){ nomes[f.nome] = true; lista.push(f.nome); });
  Object.keys(por).forEach(function(n){ if(!nomes[n]){ nomes[n] = false; lista.push(n); } });
  var topo = topoBonus(faixas);
  var linhas = lista.map(function(n){
    var pecas = por[n]||0, b = bonusDasPecas(pecas, faixas), aj = ajusteDoMes(pr, n, ano, mes);
    return {nome:n, cadastrada:nomes[n], pecas:pecas, calculado:b.valor, faixa:b.faixa, proxima:proximaFaixa(pecas, faixas), progresso:Math.min(1, pecas/topo), ajuste:aj, valor:aj ? aj.valor : b.valor};
  }).sort(function(a, b){ return b.pecas-a.pecas || (a.nome<b.nome ? -1 : 1); });
  linhas.forEach(function(l, i){ l.posicao = i+1; });
  return {ano:ano, mes:mes, rotulo:nomeMes(ano, mes), topo:topo, faixas:ordenarFaixas(faixas), usaPadrao:!(pr.faixas && pr.faixas.length), linhas:linhas,
    totalBonus:r2(linhas.reduce(function(t, l){ return t+l.valor; }, 0)), totalPecas:linhas.reduce(function(t, l){ return t+l.pecas; }, 0)};
}

// ---------- estado ----------
function novoPr(){ return {v:1, seq:0, funcionarias:[], codigos:[], faixas:[], lancamentos:{}, ajustes:[], historico:[]}; }
function proximoId(s, p){ return p+(++s.seq); }
function prDemo(){
  var s = novoPr();
  if(LOCAL){
    (LOCAL.funcionarias||[]).forEach(function(f, i){ var nm = trim(typeof f==="string" ? f : f.nome); if(nm) s.funcionarias.push({id:proximoId(s, "f"), nome:nm, ativa:typeof f==="object" && f.ativa===false ? false : true, posicao:i}); });
    var cods = LOCAL.codigos||{}; (Array.isArray(cods) ? cods.map(function(c){ return [c.codigo, c.rotulo]; }) : Object.keys(cods).map(function(k){ return [k, cods[k]]; })).forEach(function(p){ var k = trim(p[0]).toUpperCase(); if(k && !s.codigos.some(function(c){ return c.codigo===k; })) s.codigos.push({id:proximoId(s, "c"), codigo:k, rotulo:trim(p[1])}); });
    (LOCAL.faixas||[]).forEach(function(f, i){ s.faixas.push({id:proximoId(s, "b"), min:num(f.min), max:f.max==null ? null : num(f.max), valor:r2(num(f.valor)), posicao:i}); });
    Object.keys(LOCAL.lancamentos||{}).forEach(function(d){ if(ehDia(d)){ var ls = limparLinhas(LOCAL.lancamentos[d]); if(ls.length) s.lancamentos[d] = ls; } });
    (LOCAL.ajustes||[]).forEach(function(a){ s.ajustes.push({id:proximoId(s, "a"), func:trim(a.func), ano:Math.round(num(a.ano)), mes:Math.round(num(a.mes)), valor:r2(num(a.valor)), por:a.por||"arquivo", em:a.em||null}); });
  }
  return s;
}
// completa campos que faltarem em um s.pr salvo (cria vazio se não existe)
function prMigrar(pr){
  if(!pr || typeof pr!=="object") return prDemo();
  var b = novoPr(); Object.keys(b).forEach(function(k){ if(pr[k]===undefined) pr[k] = b[k]; });
  return pr;
}

// ---------- reducer ----------
// ops: dia_salvar, func_add, func_edit, func_del, cod_add, cod_edit, cod_del, cod_padrao, faixa_add, faixa_edit, faixa_del, ajuste_set, ajuste_limpar
// Cada ação guarda a.por (quem fez). Devolve {patch, msg}; patch vazio + msg = recusa
function prReduz(s, a){
  var pr = clone(s.pr || novoPr()), por = a.por||"—", agora = a.agora||(hojeSP()), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{pr:pr}, msg:msg}; };
  var log = function(op, nota){ pr.historico.push({em:agora, por:por, op:op, nota:nota||""}); if(pr.historico.length>500) pr.historico = pr.historico.slice(-500); };
  var func1 = function(id){ return pr.funcionarias.find(function(x){ return String(x.id)===String(id); }); };
  var cod1 = function(id){ return pr.codigos.find(function(x){ return String(x.id)===String(id); }); };
  var faixa1 = function(id){ return pr.faixas.find(function(x){ return String(x.id)===String(id); }); };
  // valida uma faixa {min,max,valor}; devolve texto de erro ou null
  var erroFaixa = function(f){ if(f.min<0) return "O mínimo de peças não pode ser negativo."; if(f.max!=null && f.max<f.min) return "O máximo não pode ser menor que o mínimo."; if(f.valor<0) return "O valor do bônus não pode ser negativo."; return null; };
  var lerFaixa = function(base){ return {min:a.min!==undefined && a.min!=="" ? Math.round(num(a.min)) : base.min, max:a.max!==undefined ? (a.max===null || a.max==="" ? null : Math.round(num(a.max))) : base.max, valor:a.valor!==undefined && a.valor!=="" ? r2(num(a.valor)) : base.valor}; };
  switch(a.op){
    case "dia_salvar": {   // salvar um dia SUBSTITUI o dia inteiro; linhas vazias saem; dia sem linhas é apagado
      if(!ehDia(a.dia)) return recusa("Data inválida.");
      if(!Array.isArray(a.linhas)) return recusa("Faltam as linhas do dia.");
      var ls = limparLinhas(a.linhas), neg = ls.some(function(l){ return l.qtd<0 || l.valor<0; });
      if(neg) return recusa("Quantidade e valor não podem ser negativos.");
      if(ls.length) pr.lancamentos[a.dia] = ls; else delete pr.lancamentos[a.dia];
      log("dia_salvar", a.dia+" · "+ls.length+" linha"+(ls.length===1 ? "" : "s"));
      return ok(ls.length ? "Dia "+formatarDia(a.dia)+" salvo." : "Dia "+formatarDia(a.dia)+" sem lançamentos.");
    }
    case "func_add": {
      var nm = trim(a.nome); if(!nm) return recusa("Informe o nome da funcionária.");
      if(pr.funcionarias.some(function(f){ return f.nome.toLowerCase()===nm.toLowerCase(); })) return recusa("Já existe uma funcionária com esse nome.");   // (suposição: o original não barra duplicado)
      var pos = a.posicao!=null && a.posicao!=="" ? Math.round(num(a.posicao)) : pr.funcionarias.length;
      pr.funcionarias.push({id:proximoId(pr, "f"), nome:nm, ativa:a.ativa!==false, posicao:pos}); log("func_add", nm); return ok("Funcionária cadastrada.");
    }
    case "func_edit": {
      var f = func1(a.id); if(!f) return recusa("Funcionária não encontrada.");
      if(a.nome!==undefined){
        var n2 = trim(a.nome); if(!n2) return recusa("Informe o nome da funcionária.");
        if(pr.funcionarias.some(function(x){ return x!==f && x.nome.toLowerCase()===n2.toLowerCase(); })) return recusa("Já existe uma funcionária com esse nome.");
        if(a.propagar && n2!==f.nome){ var velho = f.nome; Object.keys(pr.lancamentos).forEach(function(d){ pr.lancamentos[d].forEach(function(l){ if(l.func===velho) l.func = n2; }); }); pr.ajustes.forEach(function(x){ if(x.func===velho) x.func = n2; }); }   // por padrão o histórico fica com o nome velho (igual ao original)
        f.nome = n2;
      }
      if(a.ativa!==undefined) f.ativa = !!a.ativa;   // só muda o visual: o lançamento continua listando todas
      if(a.posicao!==undefined && a.posicao!=="") f.posicao = Math.round(num(a.posicao));
      log("func_edit", f.nome); return ok("Funcionária atualizada.");
    }
    case "func_del": {   // não apaga lançamentos antigos
      var i1 = pr.funcionarias.findIndex(function(x){ return String(x.id)===String(a.id); }); if(i1<0) return recusa("Funcionária não encontrada.");
      var gone = pr.funcionarias.splice(i1, 1)[0]; log("func_del", gone.nome); return ok("Funcionária removida (os lançamentos antigos ficam).");
    }
    case "cod_add": {
      var k = trim(a.codigo).toUpperCase(), rot = trim(a.rotulo); if(!k) return recusa("Informe o prefixo do código."); if(!rot) return recusa("Informe a categoria.");
      if(pr.codigos.some(function(c){ return c.codigo===k; })) return recusa("Já existe um código com esse prefixo");
      pr.codigos.push({id:proximoId(pr, "c"), codigo:k, rotulo:rot}); log("cod_add", k); return ok("Código cadastrado.");
    }
    case "cod_edit": {
      var c = cod1(a.id); if(!c) return recusa("Código não encontrado.");
      if(a.codigo!==undefined){ var k2 = trim(a.codigo).toUpperCase(); if(!k2) return recusa("Informe o prefixo do código."); if(pr.codigos.some(function(x){ return x!==c && x.codigo===k2; })) return recusa("Já existe um código com esse prefixo"); c.codigo = k2; }
      if(a.rotulo!==undefined){ var r3 = trim(a.rotulo); if(!r3) return recusa("Informe a categoria."); c.rotulo = r3; }
      log("cod_edit", c.codigo); return ok("Código atualizado.");
    }
    case "cod_del": {   // não apaga lançamentos: eles passam a aparecer como "? código"
      var i2 = pr.codigos.findIndex(function(x){ return String(x.id)===String(a.id); }); if(i2<0) return recusa("Código não encontrado.");
      var gc = pr.codigos.splice(i2, 1)[0]; log("cod_del", gc.codigo); return ok("Código removido.");
    }
    case "cod_padrao": {   // carrega o mapa de códigos do mockup (só os que ainda não existem)
      var n = 0; Object.keys(CODIGOS_PADRAO).forEach(function(k3){ if(!pr.codigos.some(function(c3){ return c3.codigo===k3; })){ pr.codigos.push({id:proximoId(pr, "c"), codigo:k3, rotulo:CODIGOS_PADRAO[k3]}); n++; } });
      log("cod_padrao", n+" códigos"); return ok(n ? n+" códigos padrão carregados." : "Os códigos padrão já estão cadastrados.");
    }
    case "faixa_add": {
      var nf = lerFaixa({min:0, max:null, valor:0}); if(a.min===undefined || a.min==="") return recusa("Informe o mínimo de peças."); if(a.valor===undefined || a.valor==="") return recusa("Informe o valor do bônus.");
      var e1 = erroFaixa(nf); if(e1) return recusa(e1);
      pr.faixas.push({id:proximoId(pr, "b"), min:nf.min, max:nf.max, valor:nf.valor, posicao:pr.faixas.length}); log("faixa_add", nf.min+"-"+(nf.max==null ? "∞" : nf.max)); return ok("Faixa cadastrada.");
    }
    case "faixa_edit": {
      var fx = faixa1(a.id); if(!fx) return recusa("Faixa de bônus não encontrada.");
      var ef = lerFaixa(fx), e2 = erroFaixa(ef); if(e2) return recusa(e2);
      fx.min = ef.min; fx.max = ef.max; fx.valor = ef.valor; log("faixa_edit", fx.min+"-"+(fx.max==null ? "∞" : fx.max)); return ok("Faixa atualizada.");
    }
    case "faixa_del": {
      var i3 = pr.faixas.findIndex(function(x){ return String(x.id)===String(a.id); }); if(i3<0) return recusa("Faixa de bônus não encontrada.");
      pr.faixas.splice(i3, 1); log("faixa_del", String(a.id)); return ok(pr.faixas.length ? "Faixa removida." : "Faixa removida. Sem faixas, vale o padrão.");
    }
    case "ajuste_set": {   // um ajuste por funcionária/mês (upsert), com autor e data
      var fn = trim(a.func), ano = Math.round(num(a.ano)), mes = Math.round(num(a.mes)), val = num(a.valor);
      if(!fn) return recusa("Informe a funcionária."); if(ano<2000 || mes<1 || mes>12) return recusa("Mês inválido."); if(a.valor===undefined || a.valor==="" || val<0) return recusa("Informe um valor de bônus válido.");
      var aj = ajusteDoMes(pr, fn, ano, mes);
      if(aj){ aj.valor = r2(val); aj.por = por; aj.em = agora; } else pr.ajustes.push({id:proximoId(pr, "a"), func:fn, ano:ano, mes:mes, valor:r2(val), por:por, em:agora});
      log("ajuste_set", fn+" "+p2(mes)+"/"+ano+" = "+r2(val)); return ok("Bônus ajustado.");
    }
    case "ajuste_limpar": {   // volta ao valor calculado
      var i4 = pr.ajustes.findIndex(function(x){ return a.id!=null ? String(x.id)===String(a.id) : (x.func===trim(a.func) && x.ano===Math.round(num(a.ano)) && x.mes===Math.round(num(a.mes))); });
      if(i4<0) return recusa("Ajuste de bônus não encontrado.");
      var gone2 = pr.ajustes.splice(i4, 1)[0]; log("ajuste_limpar", gone2.func+" "+p2(gone2.mes)+"/"+gone2.ano); return ok("Ajuste removido: vale o valor calculado.");
    }
    default: return recusa("Operação desconhecida.");
  }
}

export { prDemo, prMigrar, prReduz, hojeSP, somaDias,
  UNIDADES, ROTULO_UNIDADE, PERIODOS, ROTULO_PERIODO, FAIXAS_PADRAO, CODIGOS_PADRAO, DIAS_SEMANA,
  formatarReais, formatarInteiro, formatarDia, diaDaSemana, nomeMes,
  valorLinha, limparLinha, limparLinhas, montarMapa, categoriaDe, agregar, tendencia, ranking,
  intervaloPeriodo, intervaloAnterior, rotuloIntervalo, linhasDoDia, linhasDoPeriodo, diasComLancamento, diaAnterior, diaSeguinte,
  painelPeriodo, resumoDoDia, textoDoDia, nomesParaLancamento, categoriaDaLinha,
  faixasEfetivas, ordenarFaixas, bonusDasPecas, proximaFaixa, topoBonus, ajusteDoMes, pecasDoMes, premiacaoDoMes };
