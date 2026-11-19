import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/producao.js
// Produção de peças (fábrica), trazido do SorellyAdmin (docs/modulos/producao.md). NÃO é a Montagem de kits nem a Premiação da montagem.
// Registro diário do que cada funcionária fabricou (código, quantidade, valor unitário, unidade Sorelly/Serenity); painel por período, categoria
// (pelo prefixo do código), funcionária, resumo do dia para o WhatsApp e bônus mensal por faixa de peças (Premiação, só diretoria).
// Estado s.pr (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/producao.local.js (gitignored):
//   export default {funcionarias:["Nome", ...], codigos:{A:"Anéis", AP:"Anel Prata 925"}, faixas:[{min:6000,max:6399,valor:150}], lancamentos:{"2026-10-15":[{func,codigo,qtd,valor,unidade}]}, ajustes:[{func,ano,mes,valor}]}
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16"), dinheiro em reais. Faixas do bônus são FIXAS no código (FAIXAS_BONUS, por % da meta; Marcus, 16/11/2026): não há tela para editar.
// Funcionárias e códigos são TEXTO nos lançamentos (sem vínculo): renomear não mexe no histórico, a menos que se peça (a.propagar).

import { hojeSP, somaDias, ultimoDiaDoMes } from "./cadastro-leads";
import { padronizarNome } from "./producao-nomes";
import { DESDE as CASA_CONTROLE_DESDE, situacaoPorCodigo, validarEnvio } from "./producao-casa";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/producao.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(typeof v==="string" ? v.replace(",", ".") : v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };
var utcDe = function(dia){ var a = String(dia).split("-").map(Number); return Date.UTC(a[0], a[1]-1, a[2]); };

// ---------- vocabulário ----------
var UNIDADES = ["SORELLY", "SERENITY", "CASA"];   // CASA = produção feita em casa (16/11/2026, Marcus): entra na grade e no filtro de filial, mas fica FORA do bônus (paga por dia)
// quem NÃO ganha bônus nem aparece na Premiação (Marcus, 16/11/2026: "Taxa não ganha nada"); só se muda aqui, no código
// 18/11/2026 (Marcus: "a Dávila está fora do bônus"): ela é da produção externa; mesmo se um dia dela voltar como Sorelly, não entra no bônus. Ela aparece PRIMEIRO na grade da Produção (só para a Diretoria).
var EXTERNAS = {"Davila Aline":1, "Didi":1};   // só fazem produção em casa (Dávila e Didi, tia do Marcus); a Leci é funcionária e só tem as linhas de unidade Externa como casa
var SEM_BONUS = {'Ingred "Taxa"':1, "Davila Aline":1, "Didi":1};
function ehExterna(nome){ return !!EXTERNAS[trim(nome)]; }
var PADRAO_EXTERNA = "Davila Aline";   // envios antigos (sem nome) são dela
/** quem faz produção em casa: as três de sempre mais qualquer nome com linha Externa ou envio anotado */
function listaExternas(pr){
  var out = ["Davila Aline", "Leci", "Didi"], tem = function(n){ return out.some(function(o){ return trim(o).toLowerCase()===trim(n).toLowerCase(); }); };
  (pr.movCasa||[]).forEach(function(m){ var n = trim(m.func) || PADRAO_EXTERNA; if(!tem(n)) out.push(n); });
  Object.keys(pr.lancamentos||{}).forEach(function(d){ (pr.lancamentos[d]||[]).forEach(function(l){ if(l.unidade==="CASA" && trim(l.func) && !tem(l.func)) out.push(trim(l.func)); }); });
  return out;
}
/** linha da produção externa: filial Casa OU funcionária externa (mesmo se um dia voltou como Sorelly) */
function eCasa(l){ return l.unidade==="CASA" || ehExterna(l.func); }
// PAGAMENTOS (16/11/2026, Marcus: "pagar toda sexta-feira"): produção em casa = R$ 130,00 por dia trabalhado (dia com peça lançada na filial Casa), paga na sexta que fecha a semana (sábado a sexta); bônus do mês = primeira sexta a partir do dia 5 do mês seguinte. Só se muda no código.
var CASA_DIARIA = 130;   // até 15/11/2026 a casa era paga por DIA
var CASA_POR_PECA = 0.45;   // 16/11/2026 (Marcus: "muda para R$ 0,45 por peça, a partir de hoje"): dia trabalhado desta data em diante vale peças × R$ 0,45; dias antes ficam em R$ 130,00 por dia
var CASA_PECA_DESDE = "2026-11-16";
var BONUS_DIA_PAGAMENTO = 5;
var CUSTO_DIA_INTERNA = 172.12;   // custo completo estimado por dia de uma funcionária interna da Produção (salário médio do RH + encargos, 22 dias); só para o comparativo com a produção em casa, se muda no código
var LIMITE_EXCEDENTE = 100;   // Marcus, 17/11/2026: o Pix de revendedora vem em valores fechados; se passar um pouco do devido, o excedente vira CRÉDITO da próxima semana. O Lucas tenta não passar de R$ 100,00.
var BONUS_DESDE = "2026-11";   // bônus de meses antes da regra nova (meta diária, novembro/2026) não entram na lista de pagamentos
var ROTULO_UNIDADE = {SORELLY:"Sorelly", SERENITY:"Serenity", CASA:"Externa"};   // nome que aparece na tela (Marcus, 16/11/2026: "não coloca casa, é produção externa"); a chave CASA é interna e não muda
var PERIODOS = ["semana", "mes", "tudo"];
var ROTULO_PERIODO = {semana:"Semana", mes:"Mês", tudo:"Tudo"};
var DIAS_SEMANA = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
// FAIXAS DO BÔNUS (Marcus, 16/11/2026: meta DIÁRIA, "tem dia que elas não vão lá", e "não pode alterar essas faixas, só alterar no código"): cada dia que a funcionária vem é um jogo, bateu a meta do dia (300) ou não.
// O bônus vem da % dos DIAS TRABALHADOS em que ela bateu: 60% dos dias = R$ 150; 80% = R$ 175; 100% = R$ 250. Valores e percentuais de partida (sugestão do Claude, Marcus mandou decidir), FIXOS AQUI NO CÓDIGO (sem tela para editar).
// 18/11/2026 (Marcus: "zera os bônus de todas"): enquanto a meta não é definida, o bônus vale R$ 0,00 para todas. Os valores de verdade ficam abaixo; para voltar, troque BONUS_LIGADO para true.
var BONUS_LIGADO = false;
var FAIXAS_BONUS = [{pct:60, valor:150}, {pct:80, valor:175}, {pct:100, valor:250}].map(function(f){ return {pct:f.pct, valor:BONUS_LIGADO ? f.valor : 0}; });
// 18/11/2026 (Marcus: "o bônus é pelo dia mesmo: 300 peças R$ 15, 350 R$ 20, 400 R$ 25"; pagamento no dia 11 do mês seguinte): REGRA NOVA, vale no lugar das faixas por % dos dias acima.
// Cada dia vale por si: 300 a 349 peças = R$ 15,00 · 350 a 399 = R$ 20,00 · 400 ou mais = R$ 25,00 · menos de 300 = nada. O bônus do mês é a SOMA dos dias. Só se muda AQUI.
var BONUS_DIAS = [{min:400, valor:25}, {min:350, valor:20}, {min:300, valor:15}];
var BONUS_PAGA_DIA = 11;   // dia do mês seguinte em que o bônus é pago
function bonusDoDia(pecas){ var q = Number(pecas)||0; if(q<DIA_MINIMO) return 0; for(var i=0; i<BONUS_DIAS.length; i++){ if(q>=BONUS_DIAS[i].min) return BONUS_DIAS[i].valor; } return 0; }
var DIA_MINIMO = 100;   // DIA SÓ CONTA COMO TRABALHADO com pelo menos 100 peças no dia (Marcus, 16/11/2026: "só com um mínimo"); quem passa o dia ajudando e faz pouco não puxa a meta. Só se muda AQUI.
var META_DIA_PADRAO = 300;   // META DE PEÇAS POR DIA TRABALHADO (Marcus, 16/11/2026: 300; "pode retirar o campo da tela"): vale para todas e só se muda AQUI no código
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
// funcionárias do cadastro SEM nenhum lançamento nos últimos `dias` dias (padrão 30; compara sem diferenciar maiúscula e minúscula): candidatas a sair do cadastro.
// 16/11/2026: a carga do admin antigo trouxe ~150 nomes e quase todos têm algum lançamento antigo, então "nunca lançou" quase não tira ninguém; o que importa é quem produz AGORA.
function semProducaoRecente(pr, dias){
  var corte = somaDias(hojeSP(), -(dias || 30)), usados = {};
  Object.keys(pr.lancamentos||{}).forEach(function(d){ if(d>=corte) (pr.lancamentos[d]||[]).forEach(function(l){ usados[trim(l.func).toLowerCase()] = 1; }); });
  return (pr.funcionarias||[]).filter(function(f){ return !usados[trim(f.nome).toLowerCase()]; });
}
function nomesParaLancamento(pr){ var v = {}, out = []; (pr.funcionarias||[]).concat([]).sort(function(a, b){ return a.posicao-b.posicao; }).forEach(function(f){ if(!v[f.nome]){ v[f.nome] = 1; out.push(f.nome); } }); return out; }
// categoria de um código digitado (para mostrar ao lado da linha): {rotulo} | {rotulo:"? X", desconhecida:true} | {rotulo:"Sem código"}
function categoriaDaLinha(pr, codigo){ var c = trim(codigo).toUpperCase(); if(!c) return {rotulo:"Sem código", desconhecida:false}; var cat = categoriaDe(c, montarMapa(pr.codigos)); return cat ? {rotulo:cat.rotulo, chave:cat.chave, desconhecida:false} : {rotulo:"? "+c, desconhecida:true}; }

// ---------- bônus mensal ----------
// bônus pela % de DIAS batidos: faixa mais alta que ela alcançou e quantos dias batidos a mais faltam para a próxima, mantendo os mesmos dias trabalhados (null = já na mais alta). Fora de faixa = R$ 0
function bonusPelosDias(batidos, dias){
  var pct = dias>0 ? batidos/dias*100 : 0, atual = null, prox = null;
  FAIXAS_BONUS.forEach(function(f){ if(dias>0 && batidos>=dias*f.pct/100-1e-9) atual = f; });
  for(var i=0; i<FAIXAS_BONUS.length; i++){ var f = FAIXAS_BONUS[i]; if(!(dias>0 && batidos>=dias*f.pct/100-1e-9)){ prox = {faixa:f, faltam:Math.max(1, Math.ceil(dias*f.pct/100-batidos-1e-9))}; break; } }
  return {pct:pct, faixa:atual, valor:atual ? atual.valor : 0, proxima:prox};
}
function ajusteDoMes(pr, func, ano, mes){ return (pr.ajustes||[]).find(function(x){ return x.func===func && x.ano===ano && x.mes===mes; }) || null; }
// peças do mês por funcionária (Sorelly + Serenity juntas, sem filtro de unidade)
function pecasDoMes(pr, ano, mes){
  var m = ano+"-"+p2(mes), de = m+"-01", ate = ultimoDiaDoMes(m), por = {};
  linhasDoPeriodo(pr, de, ate, null).forEach(function(l){ var q = num(l.qtd), v = q*num(l.valor); if(q<=0 && v<=0) return; if(!l.func || l.unidade==="CASA" || SEM_BONUS[l.func]) return; por[l.func] = (por[l.func]||0)+q; });   // produção em casa não entra no bônus
  return por;
}
// 16/11/2026 (Marcus: "refazer as metas, calcular pela quantidade de dias que elas vão lá"): a meta de cada funcionária passa a acompanhar os DIAS QUE ELA TRABALHOU no mês.
// Dia trabalhado = dia com peça lançada (conta quem foi, mesmo se for só um dia). Produção em casa (CASA) fica de fora, como no bônus.
/** por[nome][dia] = peças feitas naquele dia (Sorelly + Serenity; produção externa e "sem bônus" ficam fora) */
function pecasPorDia(pr, ano, mes){
  var m = ano+"-"+p2(mes), por = {};
  linhasDoPeriodo(pr, m+"-01", ultimoDiaDoMes(m), null).forEach(function(l){ var q = num(l.qtd); if(q<=0 || !l.func || l.unidade==="CASA" || SEM_BONUS[l.func]) return; var x = por[l.func] || (por[l.func] = {}); x[l.dia] = (x[l.dia]||0)+q; });
  return por;
}
function diasTrabalhados(pr, ano, mes){
  var por = pecasPorDia(pr, ano, mes);
  // dia válido = soma do dia ≥ DIA_MINIMO; dia BATIDO = dia válido com soma ≥ META_DIA_PADRAO; Melhor dia olha todos os dias
  var out = {}; Object.keys(por).forEach(function(n){ var ds = Object.keys(por[n]); out[n] = {dias:ds.filter(function(k){ return por[n][k]>=DIA_MINIMO; }).length, batidos:ds.filter(function(k){ return por[n][k]>=DIA_MINIMO && por[n][k]>=META_DIA_PADRAO; }).length, melhor:Math.max.apply(null, ds.map(function(k){ return por[n][k]; }))}; });
  return out;
}
// meta por dia trabalhado: fixa no código (META_DIA_PADRAO)
function metaPorDia(){ return META_DIA_PADRAO; }

// Premiação do mês: todas as cadastradas + quem lançou, da que mais fez para a que menos fez. Bônus pela % dos dias em que bateu a meta do dia (FAIXAS_BONUS). Ajuste manual vale no lugar do calculado.
// Devolve {ano, mes, rotulo, metaDia, faixas, linhas:[{posicao, nome, cadastrada, pecas, dias, batidos, pct (% dos dias), melhor, faixa, proxima:{faixa,faltam}|null, calculado, ajuste:{id,valor,por,em}|null, valor}], totalBonus, totalPecas}
function premiacaoDoMes(pr, ano, mes){
  var por = pecasDoMes(pr, ano, mes), dt = diasTrabalhados(pr, ano, mes), pd = pecasPorDia(pr, ano, mes), nomes = {}, lista = [];
  (pr.funcionarias||[]).forEach(function(f){ nomes[f.nome] = true; lista.push(f.nome); });
  Object.keys(por).forEach(function(n){ if(!nomes[n]){ nomes[n] = false; lista.push(n); } });
  var linhas = lista.map(function(n){
    var pecas = por[n]||0, t = dt[n] || {dias:0, batidos:0, melhor:0}, aj = ajusteDoMes(pr, n, ano, mes), dias = pd[n] || {}, bonusDia = {}, calc = 0, f15 = 0, f20 = 0, f25 = 0;
    Object.keys(dias).forEach(function(d){ var v = bonusDoDia(dias[d]); bonusDia[d] = v; calc += v; if(v===15) f15++; else if(v===20) f20++; else if(v===25) f25++; });
    return {nome:n, cadastrada:nomes[n], pecas:pecas, dias:t.dias, batidos:t.batidos, melhor:t.melhor, porDia:dias, bonusDia:bonusDia, f15:f15, f20:f20, f25:f25, calculado:r2(calc), ajuste:aj, valor:aj ? aj.valor : r2(calc)};
  }).sort(function(a, b){ return b.pecas-a.pecas || (a.nome<b.nome ? -1 : 1); });
  linhas.forEach(function(l, i){ l.posicao = i+1; });
  return {ano:ano, mes:mes, rotulo:nomeMes(ano, mes), metaDia:metaPorDia(), faixas:BONUS_DIAS, linhas:linhas,
    totalBonus:r2(linhas.reduce(function(t, l){ return t+l.valor; }, 0)), totalPecas:linhas.reduce(function(t, l){ return t+l.pecas; }, 0)};
}

// ---------- estado ----------
/** Valor de um dia trabalhado na produção em casa: antes de 16/11/2026 = R$ 130,00 por dia; de 16/11/2026 em diante = peças do dia × R$ 0,45. */
function valorDiaCasa(pr, func, dia){
  if(dia<CASA_PECA_DESDE) return CASA_DIARIA;
  var q = ((pr.lancamentos||{})[dia]||[]).filter(function(l){ return l.func===func && eCasa(l); }).reduce(function(t2, l){ return t2+num(l.qtd); }, 0);
  return r2(q*CASA_POR_PECA);
}
// ---------- média por pessoa e comparativo Casa × funcionárias (Marcus, 16/11/2026) ----------
// por pessoa no mês: dias com peça lançada, peças, média por dia e melhor dia
function estatisticasDoMes(pr, ano, mes){
  var m = ano+"-"+p2(mes), por = {};
  linhasDoPeriodo(pr, m+"-01", ultimoDiaDoMes(m), null).forEach(function(l){ var q = num(l.qtd); if(q<=0 || !l.func) return;
    var x = por[l.func] || (por[l.func] = {nome:l.func, casa:false, dias:{}, pecas:0}); if(eCasa(l)) x.casa = true; x.dias[l.dia] = (x.dias[l.dia]||0)+q; x.pecas += q; });
  return Object.keys(por).map(function(k){ var x = por[k], ds = Object.keys(x.dias), n = ds.length;
    return {nome:x.nome, casa:x.casa, dias:n, pecas:x.pecas, media:n ? Math.round(x.pecas/n) : 0, melhor:ds.reduce(function(t2, d){ return Math.max(t2, x.dias[d]); }, 0), valor:x.casa ? r2(ds.reduce(function(t2, d){ return t2+(d<CASA_PECA_DESDE ? CASA_DIARIA : x.dias[d]*CASA_POR_PECA); }, 0)) : null}; });
}
// linhas do comparativo: a produção em casa contra a média das funcionárias e contra a melhor delas; custo por dia e por peça
function comparativoCasa(est){
  var casa = est.filter(function(x){ return x.casa; }), fun = est.filter(function(x){ return !x.casa && !SEM_BONUS[x.nome]; });
  var soma = function(ls, k){ return ls.reduce(function(t2, x){ return t2+x[k]; }, 0); };
  var linha = function(quem, ls, custoDia){ var d = soma(ls, "dias"), pc = soma(ls, "pecas"), md = d ? pc/d : 0; if(ls.length && ls[0].valor!=null && d) custoDia = r2(soma(ls, "valor")/d);   // casa: custo real do mês (dias antigos a R$ 130,00 e dias novos a R$ 0,45 por peça)
    return {quem:quem, pessoas:ls.length, dias:d, pecas:pc, media:Math.round(md), melhor:ls.reduce(function(t2, x){ return Math.max(t2, x.melhor); }, 0), custoDia:custoDia, custoPeca:md>0 ? r2(custoDia/md) : 0}; };
  var melhor = fun.slice().sort(function(a, b){ return b.media-a.media; })[0];
  var out = [linha("Externa", casa, CASA_DIARIA), linha("Média das funcionárias", fun, CUSTO_DIA_INTERNA)];
  if(melhor) out.push(Object.assign(linha("Melhor média: "+melhor.nome, [melhor], CUSTO_DIA_INTERNA), {}));
  var a2 = out[0], b2 = out[1]; out.diferenca = a2.media>0 && b2.media>0 ? Math.round((a2.media/b2.media-1)*100) : null;
  return out;
}

// ---------- controle da produção em casa: peças enviadas, devolvidas, sobras e erros (Marcus, 16/11/2026) ----------
// pr.controleCasa["AAAA-MM-DD"] = {enviadas, sobra, erros, quem, obs}. DEVOLVIDAS = peças lançadas na filial Casa naquele dia (vem da grade, ninguém digita).
// DIFERENÇA = enviadas - devolvidas - sobra: zero = bateu; positivo = faltou voltar (vermelho); negativo = voltou a mais.
function controleDaCasa(pr, ano, mes){
  var m = ano+"-"+p2(mes), dev = {}, cc = pr.controleCasa||{}, dias = {};
  linhasDoPeriodo(pr, m+"-01", ultimoDiaDoMes(m), null).forEach(function(l){ if(eCasa(l) && num(l.qtd)>0){ dev[l.dia] = (dev[l.dia]||0)+num(l.qtd); dias[l.dia] = 1; } });
  Object.keys(cc).forEach(function(d){ if(d.slice(0, 7)===m) dias[d] = 1; });
  return Object.keys(dias).sort().map(function(d){ var c = cc[d]||{}, env = num(c.enviadas), dv = dev[d]||0, so = num(c.sobra);
    return {dia:d, enviadas:env, devolvidas:dv, sobra:so, dif:env-dv-so, erros:num(c.erros), quem:c.quem||"", obs:c.obs||"", por:c.por||"", temEnvio:c.enviadas!==undefined && c.enviadas!==""}; });
}

/**
 * RESUMO DO MÊS DA PRODUÇÃO EXTERNA (Marcus, 18/11/2026: "já aparecer o quanto ela tem de valor a receber no mês, quanto já recebeu, quantas peças, quanto tem a receber").
 * valor = soma do que cada dia vale (valorDiaCasa: R$ 130,00 por dia até 15/11; peças × R$ 0,45 de 16/11 em diante); recebido = dias marcados como pagos (inclusive pagamento de dia que depois mudou); aReceber = valor − recebido;
 * enviadoFin = o que já subiu ao Financeiro e ainda não foi pago. pecas = peças devolvidas já prontas no mês.
 */
function resumoExterna(pr, ano, mes, func){
  var f = func ? trim(func).toLowerCase() : null, deles = function(n){ return !f || trim(n).toLowerCase()===f; };
  var m = ano+"-"+p2(mes), dias = {}, dp = pr.diasPagos||{}, r = {pecas:0, dias:0, valor:0, recebido:0, aReceber:0, enviadoFin:0};
  linhasDoPeriodo(pr, m+"-01", ultimoDiaDoMes(m), null).filter(eCasa).forEach(function(l){ var q = num(l.qtd); if(q<=0 || !l.func || !deles(l.func)) return; var k = l.func+"|"+l.dia, x = dias[k] || (dias[k] = {func:l.func, dia:l.dia, pecas:0}); x.pecas += q; });
  Object.keys(dias).forEach(function(k){ var d = dias[k], v = valorDiaCasa(pr, d.func, d.dia); r.pecas += d.pecas; r.dias++; r.valor += v; if(dp[k]) r.recebido += v; });
  Object.keys(dp).forEach(function(k){ var d = k.split("|")[1] || ""; if(!dias[k] && ehExterna(k.split("|")[0]) && deles(k.split("|")[0]) && d.slice(0, 7)===m){ var v = num(dp[k].valor); r.dias++; r.valor += v; r.recebido += v; } });   // dia pago que depois saiu da grade
  pagamentosDaProducao(pr, hojeSP()).forEach(function(q){ if(q.tipo==="Produção externa" && deles(q.func) && q.envio && !q.pago) r.enviadoFin += num(q.envio.valor); });
  r.diasPecas = Object.keys(dias).length; r.valor = r2(r.valor); r.recebido = r2(r.recebido); r.aReceber = r2(Math.max(0, r.valor-r.recebido)); r.enviadoFin = r2(r.enviadoFin);
  var sc = situacaoCasa(pr, func), sit = sc.tot; r.enviadoPecas = sit.enviado; r.devolvidoPecas = sit.devolvido; r.comEla = sit.comEla; r.codigosComEla = sc.linhas.filter(function(l){ return l.comEla>0; }).length;
  return r;
}

/** Situação por código da produção externa: enviado a ela, feitas, devolvido (da grade, filial Casa) e o que está com ela. Começa em 16/11/2026. */
function situacaoCasa(pr, func){
  var f = func ? trim(func).toLowerCase() : null, deles = function(n){ return !f || trim(n).toLowerCase()===f; };
  var dev = []; Object.keys(pr.lancamentos||{}).forEach(function(d){ if(d<CASA_CONTROLE_DESDE) return; (pr.lancamentos[d]||[]).forEach(function(l){ if(eCasa(l) && num(l.qtd)>0 && deles(l.func)) dev.push({dia:d, codigo:l.codigo, qtd:num(l.qtd)}); }); });
  return situacaoPorCodigo((pr.movCasa||[]).filter(function(m){ return deles(m.func || PADRAO_EXTERNA); }), dev);
}

// ---------- pagamentos (toda QUARTA-FEIRA) ----------
// 16/11/2026 (Marcus: "enviar em Pix revendedora toda quarta-feira, daí sobe para o Lucas pagar no Direcionar"): o dia trabalhado é pago na primeira quarta-feira DEPOIS dele (dia de semana 3). Dia já pago fica marcado em pr.diasPagos e sai do valor a pagar.
function quartaApos(dia){ var dow = new Date(utcDe(dia)).getUTCDay(); return somaDias(dia, ((3-dow+7)%7) || 7); }
/** CICLO da produção externa (Marcus, 17/11/2026: "fecha na segunda com tudo que fez até domingo, paga na quarta"): semana de SEGUNDA a DOMINGO; o que foi feito na semana fecha na segunda seguinte e é pago na QUARTA seguinte (domingo + 3 dias). */
function quartaDaSemana(dia){ var dow = new Date(utcDe(dia)).getUTCDay(); return somaDias(dia, (dow===0 ? 0 : 7-dow)+3); }
/** Lista de pagamentos da produção: diária da produção em casa (por quarta) e bônus de mês fechado. pr.diasPagos = dias da casa já pagos; pr.pagos = bônus pagos; pr.envios = o que já foi enviado ao Financeiro. */
function pagamentosDaProducao(pr, hoje){
  var out = [], grupos = {}, dp = pr.diasPagos || {};
  Object.keys(pr.lancamentos||{}).sort().forEach(function(d){ (pr.lancamentos[d]||[]).forEach(function(l){
    if(!eCasa(l) || !l.func || num(l.qtd)<=0) return;
    var qa = quartaDaSemana(d), k = l.func+"|"+qa, x = grupos[k] || (grupos[k] = {func:l.func, data:qa, dias:{}}); x.dias[d] = 1; }); });
  Object.keys(grupos).forEach(function(k){ var x = grupos[k], ds = Object.keys(x.dias).sort(), pagos = ds.filter(function(d){ return dp[x.func+"|"+d]; }), falta = ds.filter(function(d){ return !dp[x.func+"|"+d]; }), br = function(d){ return d.slice(8)+"/"+d.slice(5, 7); };
    out.push({id:"casa|"+k, data:x.data, func:x.func, tipo:"Produção externa", dias:ds, diasPagos:pagos, diasFalta:falta,
      detalhe:(falta.length ? "A pagar: "+falta.map(br).join(", ") : "")+(falta.length && pagos.length ? " · " : "")+(pagos.length ? "Pagos: "+pagos.map(br).join(", ") : ""),
      valor:r2(falta.reduce(function(t2, d){ return t2+valorDiaCasa(pr, x.func, d); }, 0)), total:r2(ds.reduce(function(t2, d){ return t2+valorDiaCasa(pr, x.func, d); }, 0)), pago:!falta.length ? {em:(dp[x.func+"|"+pagos[pagos.length-1]]||{}).em||"", valor:r2(ds.reduce(function(t2, d){ return t2+valorDiaCasa(pr, x.func, d); }, 0))} : null}); });
  // SALDO DA PRODUÇÃO EXTERNA (pr.saldoExterna[nome]): positivo = pagamos a mais antes (desconta da próxima semana); negativo = pagamos a menos (soma na próxima)
  var saldos = {}; Object.keys(pr.saldoExterna||{}).forEach(function(n){ saldos[n] = num(pr.saldoExterna[n]); });
  out.filter(function(r){ return !r.pago; }).sort(function(a, b){ return a.data<b.data ? -1 : a.data>b.data ? 1 : 0; }).forEach(function(r){
    var s0 = saldos[r.func]||0; r.bruto = r.valor; r.credito = 0;
    if(s0>0.004){ r.credito = r2(Math.min(s0, r.valor)); r.valor = r2(r.valor-r.credito); saldos[r.func] = r2(s0-r.credito); }
    else if(s0<-0.004){ r.credito = r2(s0); r.valor = r2(r.valor-s0); saldos[r.func] = 0; }
    if(r.credito>0) r.detalhe += " · Desconto do excedente anterior: "+formatarReais(r.credito);
    else if(r.credito<0) r.detalhe += " · Acréscimo do que faltou pagar antes: "+formatarReais(-r.credito); });
  out.forEach(function(r){ if(r.bruto===undefined){ r.bruto = r.valor; r.credito = 0; } });
  var meses = {}; Object.keys(pr.lancamentos||{}).forEach(function(d){ meses[d.slice(0, 7)] = 1; });
  Object.keys(meses).sort().forEach(function(m){
    var ano = Number(m.slice(0, 4)), mes = Number(m.slice(5, 7)); if(m<BONUS_DESDE || m>=String(hoje||hojeSP()).slice(0, 7)) return;   // só mês fechado
    var seg = mes===12 ? (ano+1)+"-01" : ano+"-"+p2(mes+1);
    premiacaoDoMes(pr, ano, mes).linhas.forEach(function(l){ if(l.valor>0){ var id = "bonus|"+l.nome+"|"+m; out.push({id:id, data:seg+"-"+p2(BONUS_PAGA_DIA), func:l.nome, tipo:"Bônus", dias:[], diasPagos:[], diasFalta:[], detalhe:nomeMes(ano, mes)+" · "+(l.f15+l.f20+l.f25)+" dias com bônus (R$ 15: "+l.f15+" · R$ 20: "+l.f20+" · R$ 25: "+l.f25+")", valor:r2(l.valor), total:r2(l.valor), pago:(pr.pagos||{})[id] || null}); } }); });
  out.forEach(function(x){ x.envio = (pr.envios||{})[x.id] || null; });
  return out.sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : (a.func<b.func ? -1 : 1); });
}

function novoPr(){ return {v:1, seq:0, funcionarias:[], codigos:[], lancamentos:{}, ajustes:[], pagos:{}, diasPagos:{}, envios:{}, controleCasa:{}, movCasa:[], saldoExterna:{}, historico:[]}; }
function proximoId(s, p){ return p+(++s.seq); }
function prDemo(){
  var s = novoPr();
  if(LOCAL){
    (LOCAL.funcionarias||[]).forEach(function(f, i){ var nm = trim(typeof f==="string" ? f : f.nome); if(nm) s.funcionarias.push({id:proximoId(s, "f"), nome:nm, ativa:typeof f==="object" && f.ativa===false ? false : true, posicao:i}); });
    var cods = LOCAL.codigos||{}; (Array.isArray(cods) ? cods.map(function(c){ return [c.codigo, c.rotulo]; }) : Object.keys(cods).map(function(k){ return [k, cods[k]]; })).forEach(function(p){ var k = trim(p[0]).toUpperCase(); if(k && !s.codigos.some(function(c){ return c.codigo===k; })) s.codigos.push({id:proximoId(s, "c"), codigo:k, rotulo:trim(p[1])}); });
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

// ---------- lançamento da funcionária: preço automático e dia travado (Marcus, 18/11/2026) ----------
// "ela lança os códigos e a quantidade, o sistema já puxa o preço; lançou o dia, fica travado; lançou errado, tem que me mandar."
/** último preço e unidade de cada código (o dia mais novo vence); produção externa não entra */
function precoPorCodigo(pr){
  var out = {}; Object.keys(pr.lancamentos||{}).sort().forEach(function(d){ (pr.lancamentos[d]||[]).forEach(function(l){ if(l.codigo && num(l.valor)>0 && !eCasa(l)) out[l.codigo] = {valor:num(l.valor), unidade:l.unidade}; }); });
  return out;
}
/** funcionárias (nome em minúsculas) que já têm linhas lançadas no dia: para quem não é da Diretoria, esse dia delas fica travado */
function travadasDoDia(pr, dia){
  var t = {}; ((pr.lancamentos||{})[dia]||[]).forEach(function(l){ if(num(l.qtd)>0 && !eCasa(l)) t[trim(l.func).toLowerCase()] = 1; });
  return t;
}

/** DIAS ABERTOS PARA A FUNCIONÁRIA (Marcus, 19/11/2026: "trava os dias, ninguém pode mexer"): só o dia de hoje e o dia útil anterior (sábado e domingo não contam); qualquer dia mais antigo só a Diretoria altera. */
function diaAbertoFuncionaria(dia, hoje){
  hoje = hoje || hojeSP(); if(dia>hoje) return false;
  var ant = somaDias(hoje, -1); for(var g = 0; g<7 && (diaDaSemana(ant)==="sábado" || diaDaSemana(ant)==="domingo"); g++) ant = somaDias(ant, -1);
  return dia>=ant;
}

// ---------- reducer ----------
// ops: dia_salvar, func_add, func_edit, func_del, func_limpar, cod_add, cod_edit, cod_del, cod_padrao, nomes_padronizar, ajuste_set, ajuste_limpar
// Cada ação guarda a.por (quem fez). Devolve {patch, msg}; patch vazio + msg = recusa
function prReduz(s, a){
  var pr = clone(s.pr || novoPr()), por = a.por||"—", agora = a.agora||(hojeSP()), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{pr:pr}, msg:msg}; };
  var log = function(op, nota){ pr.historico.push({em:agora, por:por, op:op, nota:nota||""}); if(pr.historico.length>500) pr.historico = pr.historico.slice(-500); };
  var func1 = function(id){ return pr.funcionarias.find(function(x){ return String(x.id)===String(id); }); };
  var cod1 = function(id){ return pr.codigos.find(function(x){ return String(x.id)===String(id); }); };
  // valida uma faixa {min,max,valor}; devolve texto de erro ou null
  switch(a.op){
    case "dia_salvar": {   // salvar um dia SUBSTITUI o dia inteiro; linhas vazias saem; dia sem linhas é apagado
      if(!ehDia(a.dia)) return recusa("Data inválida.");
      if(!Array.isArray(a.linhas)) return recusa("Faltam as linhas do dia.");
      var ls = limparLinhas(a.linhas).map(function(l){ return Object.assign({}, l, {func:padronizarNome(s, l.func)}); }), neg = ls.some(function(l){ return l.qtd<0 || l.valor<0; });
      if(neg) return recusa("Quantidade e valor não podem ser negativos.");
      if(a.admin!==true && !diaAbertoFuncionaria(a.dia, agora)) return recusa("Este dia está travado. Só a Diretoria altera dias que já passaram.");
      if(a.admin!==true){   // 18/11/2026 (Marcus): as funcionárias só anotam a produção; a produção externa (a que faz em casa) é só da Diretoria. As linhas dela ficam como estão e não entram nem saem pela tela da funcionária.
        if(ls.some(function(l){ return l.unidade==="CASA" || ehExterna(l.func); })) return recusa("A produção externa é só da Diretoria.");
        // DIA TRAVADO: quem já tem linhas lançadas no dia não muda mais pela tela da funcionária (só a Diretoria corrige); o preço vem do último lançamento do mesmo código, nunca do que veio digitado
        var trav = travadasDoDia(pr, a.dia), eTrav = function(l){ return !!trav[trim(l.func).toLowerCase()]; }, chv = function(l){ return trim(l.func).toLowerCase()+"|"+l.codigo+"|"+l.qtd; };
        var antes = (pr.lancamentos[a.dia]||[]).filter(function(l){ return !eCasa(l) && eTrav(l); });
        if(ls.filter(eTrav).map(chv).sort().join(";")!==antes.map(chv).sort().join(";")) return recusa("Este dia já foi lançado para essa funcionária e está travado. Peça a correção ao Marcus.");
        var precos = precoPorCodigo(pr);
        ls = ls.filter(function(l){ return !eTrav(l); }).map(function(l){ var r = precos[l.codigo], un = l.unidade==="SERENITY" ? "SERENITY" : "SORELLY"; return Object.assign({}, l, {valor:r ? r.valor : 0, unidade:un}); }).concat(antes);
        ls = ls.concat((pr.lancamentos[a.dia]||[]).filter(function(l){ return eCasa(l); }));
      }
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
    case "nomes_padronizar": {   // 16/11/2026 (Marcus: "arruma tudo padronizado, puxa do RH"): troca o nome de quem está lançado/cadastrado pelo nome padronizado (mapa {antigo:novo}, calculado na tela a partir do RH). Junta repetidas no cadastro; lançamentos e ajustes mantêm tudo, só muda o nome.
      var mp = a.mapa||{}, ks = Object.keys(mp).filter(function(k){ return trim(mp[k]) && mp[k]!==k; }); if(!ks.length) return recusa("Todos os nomes já estão padronizados.");
      var nl = 0; Object.keys(pr.lancamentos).forEach(function(dd){ (pr.lancamentos[dd]||[]).forEach(function(l){ if(mp[l.func]!==undefined && mp[l.func]!==l.func){ l.func = trim(mp[l.func]); nl++; } }); });
      var vistos = {}; pr.funcionarias = pr.funcionarias.map(function(f){ return mp[f.nome]!==undefined ? Object.assign({}, f, {nome:trim(mp[f.nome])}) : f; }).filter(function(f){ var k = trim(f.nome).toLowerCase(); if(vistos[k]) return false; vistos[k] = 1; return true; });
      (pr.ajustes||[]).forEach(function(aj){ if(mp[aj.func]!==undefined) aj.func = trim(mp[aj.func]); });
      log("nomes_padronizar", ks.length+" nomes, "+nl+" linhas: "+ks.map(function(k){ return k+" → "+mp[k]; }).join("; ").slice(0, 900)); return ok(ks.length+" nomes padronizados em "+nl+" linhas.");
    }
    case "func_dados_excluir": {   // 16/11/2026 (Marcus): apaga os lançamentos de quem ele não quer mais. Com a.dias, apaga SÓ as linhas desses dias (o resto do histórico da pessoa fica); sem a.dias, apaga tudo dela e tira do cadastro e dos ajustes. O que saiu fica no histórico.
      var nomesX = (a.nomes||[]).map(trim).filter(Boolean); if(!nomesX.length) return recusa("Nenhum nome informado.");
      var setX = {}, soDias = Array.isArray(a.dias) && a.dias.length ? a.dias.filter(ehDia) : null, setD = {}; nomesX.forEach(function(n){ setX[n] = 1; }); if(soDias) soDias.forEach(function(d){ setD[d] = 1; });
      var nLinhas = 0; Object.keys(pr.lancamentos).forEach(function(dd){ if(soDias && !setD[dd]) return; var antes = pr.lancamentos[dd]||[], resto = antes.filter(function(l){ return !setX[l.func]; }); nLinhas += antes.length-resto.length; if(resto.length) pr.lancamentos[dd] = resto; else delete pr.lancamentos[dd]; });
      if(!soDias){ pr.funcionarias = pr.funcionarias.filter(function(f){ return !setX[f.nome]; }); pr.ajustes = (pr.ajustes||[]).filter(function(x){ return !setX[x.func]; }); }
      log("func_dados_excluir", nomesX.length+" pessoas, "+nLinhas+" linhas"+(soDias ? " (dias "+soDias.join(", ")+")" : "")+": "+nomesX.join(", ").slice(0, 800)); return ok(nomesX.length+" pessoas e "+nLinhas+" lançamentos excluídos.");
    }
    case "casa_salvar": {   // grava SÓ os campos enviados na ação: a funcionária lança enviadas e sobra; o Marcus lança erros, quem errou e observação; um não apaga o do outro
      if(!ehDia(a.dia)) return recusa("Data inválida.");
      pr.controleCasa = pr.controleCasa || {}; var cx = Object.assign({}, pr.controleCasa[a.dia]), campos = [];
      var inteiro = function(v){ var n = Math.round(num(v)); return n; };
      if(a.enviadas!==undefined){ if(trim(a.enviadas)==="") delete cx.enviadas; else { cx.enviadas = inteiro(a.enviadas); if(cx.enviadas<0) return recusa("Os números não podem ser negativos."); } campos.push("enviadas "+(cx.enviadas===undefined ? "—" : cx.enviadas)); }
      if(a.sobra!==undefined){ cx.sobra = trim(a.sobra)==="" ? 0 : inteiro(a.sobra); if(cx.sobra<0) return recusa("Os números não podem ser negativos."); campos.push("sobra "+cx.sobra); }
      if(a.erros!==undefined){ cx.erros = trim(a.erros)==="" ? 0 : inteiro(a.erros); if(cx.erros<0) return recusa("Os números não podem ser negativos."); campos.push("erros "+cx.erros); if(!cx.erros) cx.quem = ""; }
      if(a.quem!==undefined) cx.quem = num(cx.erros)>0 ? padronizarNome(s, a.quem) : "";
      if(a.obs!==undefined) cx.obs = trim(a.obs);
      if(!campos.length && a.quem===undefined && a.obs===undefined) return recusa("Nada para gravar.");
      cx.por = por; cx.em = agora; pr.controleCasa[a.dia] = cx;
      log("casa_salvar", a.dia+" · "+(campos.join(", ") || "texto")); return ok("Controle do dia "+formatarDia(a.dia)+" salvo.");
    }
    case "mov_add": {   // 18/11/2026 (Marcus): anota o que é ENVIADO a ela, por código (a devolução vem da grade)
      var vm = validarEnvio(a); if(vm.erro) return recusa(vm.erro);
      pr.movCasa = pr.movCasa || []; pr.seq = (pr.seq||0)+1;
      var nv = Object.assign({id:pr.seq, por:por, em:agora}, vm.mov, {func:trim(vm.mov.func) || PADRAO_EXTERNA}); pr.movCasa.push(nv);
      log("mov_add", nv.func+" · "+nv.dia+" · "+nv.codigo+" · "+nv.qtd+" enviadas, "+nv.feitas+" feitas"); return ok("Envio de "+nv.qtd+" peças ("+nv.codigo+") anotado.");
    }
    case "mov_lote": {   // 19/11/2026 (Marcus: "é lançamento do dia, elas sempre lançam mais de uma peça"): vários códigos de uma vez, todos com a mesma data; se uma linha estiver errada, nada é gravado
      var itens = Array.isArray(a.itens) ? a.itens : []; if(!itens.length) return recusa("Informe ao menos um código e a quantidade.");
      var novos = []; for(var li=0; li<itens.length; li++){ var vl = validarEnvio({dia:a.dia, func:a.func, codigo:itens[li].codigo, qtd:itens[li].qtd, feitas:0, obs:itens[li].obs || a.obs}); if(vl.erro) return recusa("Linha "+(li+1)+": "+vl.erro); novos.push(vl.mov); }
      pr.movCasa = pr.movCasa || []; var totalLote = 0;
      novos.forEach(function(m2){ pr.seq = (pr.seq||0)+1; pr.movCasa.push(Object.assign({id:pr.seq, por:por, em:agora}, m2, {func:trim(m2.func) || PADRAO_EXTERNA})); totalLote += m2.qtd; });
      log("mov_lote", (trim(a.func) || PADRAO_EXTERNA)+" · "+a.dia+" · "+novos.length+" códigos, "+totalLote+" peças enviadas"); return ok("Envio de "+totalLote+" peças ("+novos.length+" códigos) anotado.");
    }
    case "mov_feitas": {   // quantas ela já fez daquele envio (ela informa)
      var mv = (pr.movCasa||[]).find(function(x){ return String(x.id)===String(a.id); }); if(!mv) return recusa("Envio não encontrado.");
      var fv = Math.round(num(a.feitas)); if(fv<0 || fv>mv.qtd) return recusa("As feitas precisam ficar entre 0 e "+mv.qtd+".");
      var antesF = mv.feitas; mv.feitas = fv; mv.por = por; mv.em = agora; log("mov_feitas", mv.codigo+" · "+antesF+" → "+fv); return ok("Feitas de "+mv.codigo+": "+fv+".");
    }
    case "mov_del": {
      var iv = (pr.movCasa||[]).findIndex(function(x){ return String(x.id)===String(a.id); }); if(iv<0) return recusa("Envio não encontrado.");
      var dx = pr.movCasa.splice(iv, 1)[0]; log("mov_del", dx.dia+" · "+dx.codigo+" · "+dx.qtd); return ok("Envio apagado.");
    }
    case "casa_apagar": {
      if(!pr.controleCasa || !pr.controleCasa[a.dia]) return recusa("Esse dia não tem controle.");
      delete pr.controleCasa[a.dia]; log("casa_apagar", String(a.dia)); return ok("Controle do dia apagado.");
    }
    case "func_limpar": {   // 16/11/2026 (Marcus): tira do cadastro quem NÃO produziu nos últimos 30 dias (gente de outros setores que veio na carga do admin antigo). Os lançamentos não mudam; dá para cadastrar de novo. O nome de cada uma fica no histórico.
      var fora = semProducaoRecente(pr, 30); if(!fora.length) return recusa("Nenhuma funcionária sem produção nos últimos 30 dias.");
      var ids = {}; fora.forEach(function(f){ ids[f.id] = 1; });
      pr.funcionarias = pr.funcionarias.filter(function(f){ return !ids[f.id]; });
      log("func_limpar", fora.length+" removidas (sem produção nos últimos 30 dias): "+fora.map(function(f){ return f.nome; }).join(", ")); return ok(fora.length+" funcionárias sem produção nos últimos 30 dias foram removidas do cadastro.");
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
    case "pag_marcar": {   // marca como pago: na casa, todos os dias que faltam do grupo; no bônus, o valor inteiro (guarda o valor na hora, para não mudar depois)
      var lp = pagamentosDaProducao(pr, hojeSP()).find(function(x){ return x.id===a.id; }); if(!lp) return recusa("Pagamento não encontrado.");
      if(lp.pago) return recusa("Este pagamento já está pago.");
      if(lp.diasFalta.length){   // produção externa: o valor pago pode passar (ou faltar); a diferença vira saldo da próxima semana
        var vp = (a.valorPago===undefined || a.valorPago==="") ? lp.valor : r2(num(a.valorPago)); if(vp<0) return recusa("O valor pago não pode ser negativo.");
        pr.saldoExterna = pr.saldoExterna || {}; var s1 = num(pr.saldoExterna[lp.func]);
        pr.saldoExterna[lp.func] = r2(s1-lp.credito+(vp-lp.valor));
      }
      if(lp.diasFalta.length){ pr.diasPagos = pr.diasPagos || {}; lp.diasFalta.forEach(function(d){ pr.diasPagos[lp.func+"|"+d] = {em:agora, por:por, valor:valorDiaCasa(pr, lp.func, d)}; }); }
      else { pr.pagos = pr.pagos || {}; pr.pagos[lp.id] = {em:agora, por:por, valor:lp.valor}; }
      log("pag_marcar", lp.func+" · "+lp.tipo+" · "+lp.valor); return ok("Pagamento marcado como pago.");
    }
    case "dia_pago": {   // um dia da produção em casa pago (ou desfeito), pelo nome e pela data do dia trabalhado
      var fnm = trim(a.func); if(!fnm || !ehDia(a.dia)) return recusa("Dia ou nome inválido.");
      pr.diasPagos = pr.diasPagos || {};
      if(a.pago===false) delete pr.diasPagos[fnm+"|"+a.dia]; else pr.diasPagos[fnm+"|"+a.dia] = {em:agora, por:por, valor:valorDiaCasa(pr, fnm, a.dia)};
      log("dia_pago", fnm+" · "+a.dia+" · "+(a.pago===false ? "desfeito" : "pago")); return ok(a.pago===false ? "Dia voltou para a pagar." : "Dia marcado como pago.");
    }
    case "pag_enviado": {   // guarda que o valor já foi enviado ao Financeiro (Prestadores de serviço) e qual pedido nasceu lá
      if(!a.id) return recusa("Pagamento não informado.");
      pr.envios = pr.envios || {}; pr.envios[a.id] = {em:agora, por:por, valor:r2(num(a.valor)), pedId:a.pedId||null, numero:a.numero||""}; log("pag_enviado", String(a.id)+" · "+r2(num(a.valor))); return ok("Envio registrado.");
    }
    case "pag_desmarcar": {
      if(!pr.pagos || !pr.pagos[a.id]) return recusa("Pagamento não está marcado como pago.");
      delete pr.pagos[a.id]; log("pag_desmarcar", String(a.id)); return ok("Pagamento voltou para a pagar.");
    }
    default: return recusa("Operação desconhecida.");
  }
}

export { situacaoCasa, CASA_CONTROLE_DESDE, prDemo, prMigrar, prReduz, hojeSP, somaDias, quartaApos, quartaDaSemana, LIMITE_EXCEDENTE, controleDaCasa, valorDiaCasa, CASA_POR_PECA, CASA_PECA_DESDE, estatisticasDoMes, comparativoCasa, CUSTO_DIA_INTERNA, pagamentosDaProducao, CASA_DIARIA,
  UNIDADES, ROTULO_UNIDADE, PERIODOS, ROTULO_PERIODO, FAIXAS_BONUS, META_DIA_PADRAO, DIA_MINIMO, CODIGOS_PADRAO, DIAS_SEMANA,
  formatarReais, formatarInteiro, formatarDia, diaDaSemana, nomeMes,
  valorLinha, limparLinha, limparLinhas, montarMapa, categoriaDe, agregar, tendencia, ranking,
  intervaloPeriodo, intervaloAnterior, rotuloIntervalo, linhasDoDia, linhasDoPeriodo, diasComLancamento, diaAnterior, diaSeguinte,
  painelPeriodo, resumoDoDia, textoDoDia, nomesParaLancamento, semProducaoRecente, categoriaDaLinha,
  diaAbertoFuncionaria, listaExternas, ehExterna, eCasa, resumoExterna, precoPorCodigo, travadasDoDia, BONUS_DIAS, BONUS_PAGA_DIA, bonusDoDia, pecasPorDia, bonusPelosDias, ajusteDoMes, pecasDoMes, diasTrabalhados, metaPorDia, premiacaoDoMes };
