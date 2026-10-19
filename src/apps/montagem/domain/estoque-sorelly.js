// Estoque Sorelly (Financeiro): estoque GERAL de peças (joias prontas), interno + com revendedoras, preenchido mês a mês.
// Trazido do SorellyAdmin (docs/modulos/estoque.md). NÃO é o estoque de materiais (esse é compras-estoque.js).
// Estado s.es = {config, posicoes[], fechamentos[]}. Nasce VAZIO; dados reais só em domain/estoque-sorelly.local.js (gitignored):
//   export default {config:{recebimentoPct:55,...,ajuda:{}}, posicoes:[...], fechamentos:[...]}
// Dinheiro em reais; datas ISO no fuso America/Sao_Paulo; mês de 1 a 12 (cuidado: o Faturamento antigo usava 0 a 11).
// Cada linha tem id "AAAA-MM". A FOTO (posição) é do mês M; o FECHAMENTO lançado junto vai para o mês ANTERIOR (M-1).
// esReduz(s,a) → {patch,msg}: patch vazio + msg = recusado. Toda ação guarda a.por (nome). a.admin = true quando quem age é
// administrador (diretoria): a tela passa isso. Lançar é do setor Estoque/Financeiro (a tela confere); editar, remover, travar e
// configurar são só do administrador.

import { hojeSP, agoraSP } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = import.meta.glob("./estoque-sorelly.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var vazio = function(v){ return v===undefined || v===null || v===""; };
var pad2 = function(n){ return (n<10 ? "0" : "")+n; };

// ---------- campos ----------
// foto do estoque (posição)
var CAMPOS_POSICAO = ["qtdRevendedoras","internoPecas","internoCusto","internoVenda","revPecas","revCusto","revVenda"];
var ROTULO_POSICAO = {qtdRevendedoras:"Revendedoras ativas hoje", internoPecas:"Interno — peças", internoCusto:"Interno — custo (R$)", internoVenda:"Interno — preço de venda (R$)", revPecas:"Revendedoras — peças", revCusto:"Revendedoras — custo (R$)", revVenda:"Revendedoras — preço de venda (R$)"};
// fechamento do mês
var CAMPOS_FECHAMENTO = ["vendido","recebido","custoVendido","brindeValor","brindeCusto","revInicio","revEntraram","revSairam"];
var ROTULO_FECHAMENTO = {vendido:"Vendido na ponta (R$)", recebido:"Recebido pela Sorelly (R$)", custoVendido:"Custo Sorelly do vendido (R$)", brindeValor:"Brindes — valor (R$)", brindeCusto:"Brindes — custo (R$)", revInicio:"Revendedoras no início", revEntraram:"Entraram", revSairam:"Saíram"};
// campos que são contagem (inteiro); os demais são dinheiro (2 casas)
var INTEIROS = {qtdRevendedoras:1, internoPecas:1, revPecas:1, revInicio:1, revEntraram:1, revSairam:1};
// os 6 campos que fazem a foto ser "completa" (entra nas séries e gráficos)
var CAMPOS_COMPLETA = ["internoPecas","internoCusto","internoVenda","revPecas","revCusto","revVenda"];

var METRICAS = ["custo","venda","recv","margem"];
var ROTULO_METRICA = {custo:"Custo total", venda:"Preço de venda", recv:"Recebimento", margem:"Margem Sorelly"};

// textos de ajuda padrão (de onde puxar cada número na Devmaster); o administrador edita no Configurador
var AJUDA_PADRAO = {
  qtdRevendedoras: "Devmaster > Cadastro de Revendedoras > filtrar ATIVAS na data de hoje.\nFiltro: status ativo.",
  internoPecas: "Devmaster > Relatórios > Estoque > depósito SORELLY/interno > data de hoje > coluna Qtd peças.",
  internoCusto: "Mesmo relatório do estoque interno > coluna CUSTO total (preço de compra).",
  internoVenda: "Mesmo relatório do estoque interno > coluna VALOR DE VENDA / tabela.",
  revPecas: "Devmaster > Relatórios > Estoque em consignação (revendedoras) > coluna Qtd peças.",
  revCusto: "Estoque consignação > coluna CUSTO.",
  revVenda: "Estoque consignação > coluna VALOR DE VENDA / tabela.",
  vendido: "Devmaster > Faturamento do mês fechado > total vendido na ponta (varejo).",
  recebido: "Devmaster > Faturamento do mês fechado > total recebido pela Sorelly.",
  custoVendido: "Devmaster > custo do que foi vendido no mês.",
  brindeValor: "Relatório de brindes do mês > valor (a preço de tabela).",
  brindeCusto: "Relatório de brindes do mês > custo.",
  revInicio: "Cadastro de revendedoras > entradas e saídas do mês fechado.",
  revEntraram: "Cadastro de revendedoras > entradas e saídas do mês fechado.",
  revSairam: "Cadastro de revendedoras > entradas e saídas do mês fechado."
};

// recebimentoPct = % do preço de venda que vira recebimento (padrão 55); comissaoRepPct e metaKitMedio existem no original mas
// nenhum cálculo os usa hoje (guardados para quando o Marcus decidir).
var CONFIG_PADRAO = {recebimentoPct:55, comissaoRepPct:15, metaKitMedio:0, ajuda:AJUDA_PADRAO};

// ---------- meses ----------
function chaveMes(ano, mes){ return ano+"-"+pad2(mes); }
function lerMes(v){ var m = /^(\d{4})-(\d{1,2})/.exec(String(v||"")); if(!m) return null; var ano = +m[1], mes = +m[2]; return mes>=1 && mes<=12 && ano>=2000 && ano<=2100 ? {ano:ano, mes:mes} : null; }
function mesAnterior(ano, mes){ return mes===1 ? {ano:ano-1, mes:12} : {ano:ano, mes:mes-1}; }
function mesSeguinte(ano, mes){ return mes===12 ? {ano:ano+1, mes:1} : {ano:ano, mes:mes+1}; }
var NOMES_MES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function rotuloMes(ano, mes){ return NOMES_MES[mes-1]+"/"+ano; }
function mesAtual(hoje){ var m = lerMes(hoje || hojeSP()); return m || {ano:2026, mes:1}; }
function ordenar(lista){ return lista.slice().sort(function(a, b){ return a.ano-b.ano || a.mes-b.mes; }); }

// ---------- estado ----------
function esDemo(){
  var base = {config:clone(CONFIG_PADRAO), posicoes:[], fechamentos:[]};
  if(LOCAL){ try { base = esMigrar(clone(LOCAL)); } catch(e){} }
  return base;
}
// cria vazio ou completa campos que faltam (usado pelo store ao abrir)
function esMigrar(es){
  es = es && typeof es==="object" ? es : {};
  var cfg = Object.assign({}, CONFIG_PADRAO, es.config||{});
  cfg.ajuda = Object.assign({}, AJUDA_PADRAO, (es.config && es.config.ajuda) || {});
  var normaliza = function(r){ var o = Object.assign({simulados:[], travado:false, dia:1}, r); o.id = o.id || chaveMes(o.ano, o.mes); if(!Array.isArray(o.simulados)) o.simulados = []; return o; };
  es.config = cfg;
  es.posicoes = (es.posicoes||[]).map(normaliza);
  es.fechamentos = (es.fechamentos||[]).map(normaliza);
  return es;
}

// ---------- contas puras (cálculo igual ao original) ----------
// interno + revendedoras; null se faltar qualquer um dos dois lados
function totaisPosicao(p){
  var soma = function(a, b){ return a!=null && b!=null ? r2(a+b) : null; };
  return {pecas: p.internoPecas!=null && p.revPecas!=null ? p.internoPecas+p.revPecas : null, custo: soma(p.internoCusto, p.revCusto), venda: soma(p.internoVenda, p.revVenda)};
}
function posicaoCompleta(p){ return CAMPOS_COMPLETA.every(function(k){ return p[k]!=null; }); }
function temSimulado(r){ return !!(r && r.simulados && r.simulados.length); }
function vendaNoMes(posicoes, ano, mes){ var r = posicoes.filter(function(p){ return p.ano===ano && p.mes===mes; })[0]; return r ? totaisPosicao(r).venda : null; }
function achar(lista, ano, mes){ return lista.filter(function(r){ return r.ano===ano && r.mes===mes; })[0] || null; }

// Giro do último mês fechado (com "vendido") que tem foto no MESMO ano/mês. saída = vendido + brindes (tabela);
// giro% = saída ÷ estoque a preço de venda; meses de estoque = estoque ÷ saída. null se não houver mês elegível.
function calcularGiro(posicoes, fechamentos){
  var el = ordenar(fechamentos).filter(function(f){ return f.vendido!=null && vendaNoMes(posicoes, f.ano, f.mes)!=null; });
  var f = el[el.length-1]; if(!f) return null;
  var estoqueVenda = vendaNoMes(posicoes, f.ano, f.mes), saida = r2((f.vendido||0)+(f.brindeValor||0));
  return {fechamento:f, ano:f.ano, mes:f.mes, rotulo:rotuloMes(f.ano, f.mes), estoqueVenda:estoqueVenda, vendido:f.vendido||0, brindes:f.brindeValor||0, recebido:f.recebido, saida:saida,
    giroPct: estoqueVenda>0 ? saida/estoqueVenda*100 : 0, mesesDeEstoque: saida>0 ? estoqueVenda/saida : 0,
    brindePctDoVendido: f.brindeValor && f.vendido ? f.brindeValor/f.vendido*100 : null, mesesAlto: saida>0 && estoqueVenda/saida>6};
}
// recebimento esperado = venda × recebimentoPct; margem = recebimento − custo; markup = recebimento ÷ custo (original: "Markup s/ custo")
function valoresDerivados(t, pct){
  var recebimento = t.venda!=null ? r2(t.venda*pct) : null;
  var margem = recebimento!=null && t.custo!=null ? r2(recebimento-t.custo) : null;
  return {recebimento:recebimento, margem:margem, markup: recebimento!=null && t.custo ? recebimento/t.custo : null};
}
// Índice base 100 (custo, venda, margem) a partir da primeira foto completa. pct = fração (0,55).
function indiceBase100(completas, pct){
  if(!completas.length) return [];
  var b = totaisPosicao(completas[0]), bc = b.custo||0, bv = b.venda||0, bm = bv*pct-bc;
  return completas.map(function(p){ var t = totaisPosicao(p), c = t.custo||0, v = t.venda||0, m = v*pct-c;
    return {ano:p.ano, mes:p.mes, rotulo:rotuloMes(p.ano, p.mes), simulado:temSimulado(p), custo: bc ? c/bc*100 : 100, venda: bv ? v/bv*100 : 100, margem: bm ? m/bm*100 : 100}; });
}

// ---------- leitura para as telas ----------
function esPct(s){ return (Number(s.es.config.recebimentoPct)||0)/100; }
function esRotuloMes(ano, mes){ return rotuloMes(ano, mes); }
function esChave(ano, mes){ return chaveMes(ano, mes); }

// campos para a tela: o que já existe no mês (pré-preencher o formulário). anoMes = mês da FOTO; o fechamento mostrado é o do mês anterior
function esFormularioDoMes(s, anoMes){
  var m = lerMes(anoMes); if(!m) return null;
  var ant = mesAnterior(m.ano, m.mes), pos = achar(s.es.posicoes, m.ano, m.mes), fec = achar(s.es.fechamentos, ant.ano, ant.mes);
  var pega = function(r, campos){ var o = {}; campos.forEach(function(k){ o[k] = r && r[k]!=null ? r[k] : null; }); return o; };
  return {anoMes:chaveMes(m.ano, m.mes), rotuloFoto:rotuloMes(m.ano, m.mes), rotuloFechamento:rotuloMes(ant.ano, ant.mes), mesFechamento:chaveMes(ant.ano, ant.mes),
    posicao:pega(pos, CAMPOS_POSICAO), fechamento:pega(fec, CAMPOS_FECHAMENTO), posicaoTravada:!!(pos && pos.travado), fechamentoTravado:!!(fec && fec.travado),
    temPosicao:!!pos, temFechamento:!!fec, ajuda:s.es.config.ajuda};
}

// Resumo geral: KPIs da última foto, grupos (interno / revendedoras / total), giro do último mês fechado.
function esResumoGeral(s){
  var es = s.es, pct = esPct(s), lista = ordenar(es.posicoes), ult = lista[lista.length-1];
  if(!ult) return {vazio:true, config:es.config, mesesEstimados:[], giro:null};
  var t = totaisPosicao(ult), d = valoresDerivados(t, pct);
  var grupo = function(nome, pecas, custo, venda){ return {nome:nome, pecas:pecas, custo:custo, venda:venda, markup: venda!=null && custo ? venda/custo : null}; };
  var kitMedio = ult.qtdRevendedoras && ult.revVenda!=null ? r2(ult.revVenda/ult.qtdRevendedoras) : null;
  return {vazio:false, config:es.config, ano:ult.ano, mes:ult.mes, dia:ult.dia, rotulo:rotuloMes(ult.ano, ult.mes), dataFoto:chaveMes(ult.ano, ult.mes)+"-"+pad2(ult.dia||1), temEstimativa:temSimulado(ult),
    custo:t.custo, venda:t.venda, pecas:t.pecas, recebimento:d.recebimento, margem:d.margem, markup:d.markup, kitMedio:kitMedio, metaKitMedio:es.config.metaKitMedio||0, qtdRevendedoras:ult.qtdRevendedoras,
    grupos:[grupo("Interno (Sorelly)", ult.internoPecas, ult.internoCusto, ult.internoVenda), grupo("Com revendedoras", ult.revPecas, ult.revCusto, ult.revVenda), grupo("Total", t.pecas, t.custo, t.venda)],
    mesesEstimados:lista.filter(temSimulado).map(function(p){ return rotuloMes(p.ano, p.mes); }),
    giro:calcularGiro(es.posicoes, es.fechamentos)};
}

// Totais por grupo (interno, revendedoras, total) de um mês qualquer ({id,nome,pecas,custo,venda,markup,percentualVenda}). O original não tem categorias de peça.
function esTotaisPorGrupo(s, anoMes){
  var m = lerMes(anoMes); if(!m) return [];
  var p = achar(s.es.posicoes, m.ano, m.mes); if(!p) return [];
  var t = totaisPosicao(p), g = function(id, nome, pe, c, v){ return {id:id, nome:nome, pecas:pe, custo:c, venda:v, markup: v!=null && c ? v/c : null, percentualVenda: v!=null && t.venda ? v/t.venda*100 : null}; };
  return [g("interno","Interno (Sorelly)", p.internoPecas, p.internoCusto, p.internoVenda), g("rev","Com revendedoras", p.revPecas, p.revCusto, p.revVenda), g("total","Total", t.pecas, t.custo, t.venda)];
}

// Mês selecionado: foto do mês, fechamento que esse mês FECHA (lançado junto, no mês anterior ao da foto é o do mês M-1;
// aqui "fechamentoDoMes" é o fechamento do próprio mês M, que normalmente só é preenchido no mês seguinte) e comparação com o mês anterior.
function esMesSelecionado(s, anoMes){
  var m = lerMes(anoMes); if(!m) return null;
  var es = s.es, pct = esPct(s), ant = mesAnterior(m.ano, m.mes);
  var pos = achar(es.posicoes, m.ano, m.mes), fec = achar(es.fechamentos, m.ano, m.mes);
  // mês anterior mais próximo que tenha foto (normalmente o imediato)
  var antes = ordenar(es.posicoes).filter(function(p){ return p.ano<m.ano || (p.ano===m.ano && p.mes<m.mes); }), posAnt = antes[antes.length-1] || null;
  var t = pos ? totaisPosicao(pos) : null, d = t ? valoresDerivados(t, pct) : null, tA = posAnt ? totaisPosicao(posAnt) : null;
  var dif = function(a, b){ if(a==null || b==null) return null; return {valor:r2(a-b), pct: b ? (a-b)/b*100 : null}; };
  var comparacao = tA && t ? {mesAnterior:chaveMes(posAnt.ano, posAnt.mes), rotuloAnterior:rotuloMes(posAnt.ano, posAnt.mes), imediato:posAnt.ano===ant.ano && posAnt.mes===ant.mes,
    custo:dif(t.custo, tA.custo), venda:dif(t.venda, tA.venda), pecas:dif(t.pecas, tA.pecas), qtdRevendedoras:dif(pos.qtdRevendedoras, posAnt.qtdRevendedoras), margem:dif(d.margem, valoresDerivados(tA, pct).margem)} : null;
  var giroMes = null;
  if(pos && fec && fec.vendido!=null && t.venda!=null){ var saida = r2((fec.vendido||0)+(fec.brindeValor||0)); giroMes = {saida:saida, giroPct: t.venda>0 ? saida/t.venda*100 : 0, mesesDeEstoque: saida>0 ? t.venda/saida : 0}; }
  return {anoMes:chaveMes(m.ano, m.mes), ano:m.ano, mes:m.mes, rotulo:rotuloMes(m.ano, m.mes), posicao:pos, totais:t, derivados:d, completa:pos ? posicaoCompleta(pos) : false, simulado:temSimulado(pos), travada:!!(pos && pos.travado),
    fechamento:fec, fechamentoTravado:!!(fec && fec.travado), fechamentoSimulado:temSimulado(fec), comparacao:comparacao, giro:giroMes,
    saldoRevendedoras: fec && fec.revInicio!=null ? fec.revInicio+(fec.revEntraram||0)-(fec.revSairam||0) : null};
}

// Histórico mês a mês (mais novo primeiro, últimos `limite` meses, padrão 24). Junta foto e fechamento do MESMO mês.
function esHistorico(s, limite){
  var es = s.es, pct = esPct(s), n = limite==null ? 24 : limite, chaves = {};
  es.posicoes.forEach(function(p){ chaves[p.id] = {ano:p.ano, mes:p.mes}; });
  es.fechamentos.forEach(function(f){ chaves[f.id] = {ano:f.ano, mes:f.mes}; });
  var meses = ordenar(Object.keys(chaves).map(function(k){ return chaves[k]; })).reverse().slice(0, n);
  return meses.map(function(m){
    var pos = achar(es.posicoes, m.ano, m.mes), fec = achar(es.fechamentos, m.ano, m.mes), t = pos ? totaisPosicao(pos) : null, d = t ? valoresDerivados(t, pct) : null;
    return {anoMes:chaveMes(m.ano, m.mes), ano:m.ano, mes:m.mes, rotulo:rotuloMes(m.ano, m.mes), posicao:pos, fechamento:fec, totais:t, recebimento:d?d.recebimento:null, margem:d?d.margem:null,
      simulado:temSimulado(pos)||temSimulado(fec), travado:!!((pos && pos.travado)||(fec && fec.travado))};
  });
}

// Série do gráfico "Crescimento mensal": só fotos completas. metrica = custo | venda | recv | margem
function esSerieEvolucao(s, metrica){
  var pct = esPct(s);
  return ordenar(s.es.posicoes).filter(posicaoCompleta).map(function(p){ var t = totaisPosicao(p), v = 0;
    if(metrica==="venda") v = t.venda||0; else if(metrica==="recv") v = (t.venda||0)*pct; else if(metrica==="margem") v = (t.venda||0)*pct-(t.custo||0); else v = t.custo||0;
    return {ano:p.ano, mes:p.mes, rotulo:rotuloMes(p.ano, p.mes), valor:r2(v), simulado:temSimulado(p)}; });
}
// Índice base 100 do gráfico (custo, venda e margem juntos)
function esSerieIndice(s){ return indiceBase100(ordenar(s.es.posicoes).filter(posicaoCompleta), esPct(s)); }
// Gráfico "Faturamento × estoque": vendido de cada fechamento contra o estoque a preço de venda do mesmo mês
function esSerieFaturamentoEstoque(s){
  return ordenar(s.es.fechamentos).map(function(f){ return {ano:f.ano, mes:f.mes, rotulo:rotuloMes(f.ano, f.mes), vendido:f.vendido||0, estoqueVenda:vendaNoMes(s.es.posicoes, f.ano, f.mes)}; });
}
// Lembretes: foto do mês atual e fechamento do mês anterior (o fechamento mora no mês anterior)
function esPendencias(s, hoje){
  var m = mesAtual(hoje), ant = mesAnterior(m.ano, m.mes), out = [];
  if(!achar(s.es.posicoes, m.ano, m.mes)) out.push({tipo:"foto", anoMes:chaveMes(m.ano, m.mes), texto:"Falta a foto do estoque de "+rotuloMes(m.ano, m.mes)+"."});
  if(!achar(s.es.fechamentos, ant.ano, ant.mes)) out.push({tipo:"fechamento", anoMes:chaveMes(m.ano, m.mes), mesFechamento:chaveMes(ant.ano, ant.mes), texto:"Falta o fechamento de "+rotuloMes(ant.ano, ant.mes)+"."});
  return out;
}
// Quem pode o quê (a tela só mostra o botão; o reducer confere de novo)
function esPodeEditarLinha(row, admin){ return !!admin || !(row && row.travado); }
function esPodeAdministrar(admin){ return !!admin; }

// ---------- validação ----------
// lê um campo numérico: vazio → null; inválido → undefined (erro)
function lerNumero(k, v){
  if(vazio(v)) return null;
  var n = typeof v==="number" ? v : Number(String(v).replace(/\./g, "").replace(",", "."));
  if(typeof v==="number") n = v;
  if(!isFinite(n) || n<0) return undefined;
  if(INTEIROS[k]) return n===Math.floor(n) ? n : undefined;
  return r2(n);
}
// lê o bloco inteiro; devolve {valores} (todas as chaves, null onde vazio) ou {erro}
function lerBloco(campos, rotulos, dados){
  var out = {}; dados = dados || {};
  for(var i = 0; i<campos.length; i++){ var k = campos[i], v = lerNumero(k, dados[k]); if(v===undefined) return {erro:"Valor inválido em \""+rotulos[k]+"\": use número de zero em diante"+(INTEIROS[k] ? ", inteiro" : "")+"."}; out[k] = v; }
  return {valores:out};
}
var temValor = function(o){ return Object.keys(o).some(function(k){ return o[k]!=null; }); };
var MSG_TRAVADO = "Este mês está travado para edição. Fale com um administrador.";
var MSG_ADMIN = "Só um administrador pode fazer isso.";

// ---------- ações ----------
// ações: lancar {anoMes, posicao:{...}, fechamento:{...}, dia?} | editar_posicao / editar_fechamento {id, campos?, marcarSimulado?, desmarcarSimulado?, travado?}
//        | remover_posicao / remover_fechamento {id} | config {recebimentoPct?, comissaoRepPct?, metaKitMedio?, ajuda?:{campo:texto}} | ajuda_restaurar {campo?}
function esReduz(s, a){
  var es = clone(s.es), por = a.por || "—", agora = a.agora || agoraSP(), admin = !!a.admin;
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{es:es}, msg:msg}; };
  var op = a.op;
  // grava uma linha (foto ou fechamento) respeitando a trava; sobrescreve TODOS os campos do bloco (como o upsert original)
  var grava = function(lista, ano, mes, valores, dia){
    var id = chaveMes(ano, mes), ex = achar(lista, ano, mes);
    if(ex && ex.travado && !admin) return {erro:MSG_TRAVADO};
    if(ex){ Object.assign(ex, valores); ex.editadoPor = por; ex.editadoEm = agora; }
    else { var nova = Object.assign({id:id, ano:ano, mes:mes, dia:dia||1, simulados:[], travado:false, criadoPor:por, criadoEm:agora}, valores); lista.push(nova); }
    return {ok:true};
  };
  if(op==="lancar"){
    var m = lerMes(a.anoMes); if(!m) return recusa("Escolha o mês do lançamento (formato AAAA-MM).");
    var ant = mesAnterior(m.ano, m.mes), partes = [];
    var bp = lerBloco(CAMPOS_POSICAO, ROTULO_POSICAO, a.posicao); if(bp.erro) return recusa(bp.erro);
    var bf = lerBloco(CAMPOS_FECHAMENTO, ROTULO_FECHAMENTO, a.fechamento); if(bf.erro) return recusa(bf.erro);
    var temP = temValor(bp.valores), temF = temValor(bf.valores);
    if(!temP && !temF) return recusa("Preencha ao menos um campo.");
    var dia = a.dia!=null && a.dia!=="" ? Number(a.dia) : 1; if(!(dia>=1 && dia<=31 && dia===Math.floor(dia))) return recusa("Dia inválido.");
    // confere as duas travas antes de gravar qualquer um (não grava só metade)
    var exP = achar(es.posicoes, m.ano, m.mes), exF = achar(es.fechamentos, ant.ano, ant.mes);
    if((temP && exP && exP.travado && !admin) || (temF && exF && exF.travado && !admin)) return recusa(MSG_TRAVADO);
    if(temP){ grava(es.posicoes, m.ano, m.mes, bp.valores, dia); partes.push("foto do estoque de "+rotuloMes(m.ano, m.mes)); }
    if(temF){ grava(es.fechamentos, ant.ano, ant.mes, bf.valores); partes.push("fechamento de "+rotuloMes(ant.ano, ant.mes)); }
    return ok("Salvo: "+partes.join(" e ")+".");
  }
  if(op==="editar_posicao" || op==="editar_fechamento"){
    if(!admin) return recusa(MSG_ADMIN);
    var ehPos = op==="editar_posicao", lista = ehPos ? es.posicoes : es.fechamentos, linha = lista.filter(function(r){ return r.id===a.id; })[0];
    if(!linha) return recusa(ehPos ? "Foto de estoque não encontrada." : "Fechamento não encontrado.");
    var campos = ehPos ? CAMPOS_POSICAO : CAMPOS_FECHAMENTO, rot = ehPos ? ROTULO_POSICAO : ROTULO_FECHAMENTO, novos = {};
    if(a.campos){ for(var i = 0; i<campos.length; i++){ var k = campos[i]; if(a.campos[k]===undefined) continue; var v = lerNumero(k, a.campos[k]); if(v===undefined) return recusa("Valor inválido em \""+rot[k]+"\"."); novos[k] = v; } }
    Object.assign(linha, novos);
    var sim = linha.simulados.slice();
    (a.desmarcarSimulado||[]).forEach(function(k){ sim = sim.filter(function(x){ return x!==k; }); });
    (a.marcarSimulado||[]).forEach(function(k){ if(campos.indexOf(k)<0) return; if(sim.indexOf(k)<0) sim.push(k); });
    linha.simulados = sim;
    if(a.travado!==undefined) linha.travado = !!a.travado;
    linha.editadoPor = por; linha.editadoEm = agora;
    return ok((ehPos ? "Foto de " : "Fechamento de ")+rotuloMes(linha.ano, linha.mes)+" atualizado"+(a.travado!==undefined ? (a.travado ? " e travado." : " e destravado.") : "."));
  }
  if(op==="remover_posicao" || op==="remover_fechamento"){
    if(!admin) return recusa(MSG_ADMIN);
    var eP = op==="remover_posicao", lst = eP ? es.posicoes : es.fechamentos, ix = -1;
    for(var j = 0; j<lst.length; j++){ if(lst[j].id===a.id){ ix = j; break; } }
    if(ix<0) return recusa("Registro não encontrado.");
    var rem = lst.splice(ix, 1)[0];
    return ok((eP ? "Foto de " : "Fechamento de ")+rotuloMes(rem.ano, rem.mes)+" removido.");
  }
  if(op==="config"){
    if(!admin) return recusa(MSG_ADMIN);
    var cfg = es.config;
    if(a.recebimentoPct!==undefined){ var rp = Number(a.recebimentoPct); if(!isFinite(rp) || rp<0 || rp>100) return recusa("O recebimento precisa estar entre 0 e 100%."); cfg.recebimentoPct = rp; }
    if(a.comissaoRepPct!==undefined){ var cp = Number(a.comissaoRepPct); if(!isFinite(cp) || cp<0 || cp>100) return recusa("A comissão precisa estar entre 0 e 100%."); cfg.comissaoRepPct = cp; }
    if(a.metaKitMedio!==undefined){ var mk = Number(a.metaKitMedio); if(!isFinite(mk) || mk<0) return recusa("A meta do kit médio precisa ser zero ou mais."); cfg.metaKitMedio = r2(mk); }
    if(a.ajuda){ Object.keys(a.ajuda).forEach(function(k){ if(CAMPOS_POSICAO.indexOf(k)>=0 || CAMPOS_FECHAMENTO.indexOf(k)>=0) cfg.ajuda[k] = String(a.ajuda[k]==null ? "" : a.ajuda[k]); }); }
    return ok("Configurador do Estoque Sorelly salvo.");
  }
  if(op==="ajuda_restaurar"){
    if(!admin) return recusa(MSG_ADMIN);
    if(a.campo){ if(!AJUDA_PADRAO[a.campo]) return recusa("Campo não encontrado."); es.config.ajuda[a.campo] = AJUDA_PADRAO[a.campo]; }
    else es.config.ajuda = clone(AJUDA_PADRAO);
    return ok("Texto de ajuda restaurado.");
  }
  return recusa("Ação desconhecida.");
}

export { esDemo, esMigrar, esReduz, esResumoGeral, esMesSelecionado, esHistorico, esFormularioDoMes, esTotaisPorGrupo, esSerieEvolucao, esSerieIndice, esSerieFaturamentoEstoque, esPendencias,
  esPodeEditarLinha, esPodeAdministrar, esRotuloMes, esChave, esPct,
  totaisPosicao, posicaoCompleta, temSimulado, vendaNoMes, calcularGiro, valoresDerivados, indiceBase100, mesAnterior, mesSeguinte, lerMes,
  CAMPOS_POSICAO, CAMPOS_FECHAMENTO, ROTULO_POSICAO, ROTULO_FECHAMENTO, METRICAS, ROTULO_METRICA, AJUDA_PADRAO, CONFIG_PADRAO };
