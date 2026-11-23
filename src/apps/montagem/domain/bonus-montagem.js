// Sorelly Admin · montagem — domain/bonus-montagem.js
// BÔNUS DA MONTAGEM DE KITS (12/11/2026, Marcus). Regra da planilha Bonus_outubro_2026.xlsx, a mesma que estava gravada no admin antigo (montagem_bonus_config):
//   · conta POR DIA e por colaboradora, nunca somando dias nem pessoas;
//   · kit normal = até o limite (R$ 12.000,00); especial = acima;
//   · normal: bateu a meta do dia (8 kits) = base (R$ 15,00) + extra (R$ 2,00) por kit acima da meta; abaixo da meta = R$ 0,00;
//   · especial: meta 6 kits = base R$ 15,00 + R$ 3,00 por kit acima;
//   · a NOTA vem da REVENDEDORA (avalia o kit no app quando recebe): abaixo de 2,5 estrelas não paga, de 2,5 a 3,5 paga metade, acima paga tudo
//     (na planilha: 0,5 e 0,7 da nota máxima); colaboradora sem avaliação no mês não é cortada;
//   · supervisão: por colaboradora que bate a meta no dia, R$ 2,00 + R$ 1,00 por kit normal extra (especial: R$ 2,00 + R$ 1,50). A supervisão normal vai para a Maria Vitória;
//     a especial ainda não tem destinatária (supEspecialPara vazio = "a definir").
// Estado s.bm, ação BM, módulo "bm" no servidor. Guarda só os TOTAIS por dia e colaboradora (kits normais e especiais): nenhum nome de revendedora.
// Dados reais do mês (planilha) entram por domain/bonus-montagem.local.js (fora do Git). Este arquivo é PURO (sem import): o teste scripts/testar-bonus-montagem.mjs roda as mesmas contas.

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
var int = function(v){ var n = Math.floor(Number(v)); return isFinite(n) && n>0 ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var ehMes = function(v){ return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v||"")); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")) && !isNaN(Date.parse(v+"T00:00:00Z")); };

var CFG_PADRAO = {limiteEspecial:12000,
  metaNormal:8, baseNormal:15, extraNormal:2, metaEspecial:6, baseEspecial:15, extraEspecial:3,
  supBaseNormal:2, supExtraNormal:1, supBaseEspecial:2, supExtraEspecial:1.5, supNormalPara:"Maria Vitória", supEspecialPara:"",
  usarNota:true, notaZero:2.5, notaMetade:3.5};
// quem monta kits hoje (nomes curtos, como a equipe usa). Os nomes completos ficam em domain/pessoas.js.
var PESSOAS_PADRAO = ["Ivanete", "Pamela", "Paula Melissa", "Larissa", "Jenifer Mariah", "Letícia", "Tainara", "Milenna Rafaela", "Eduarda Helena", "Rakiely", "Jordana", "Maria Vitória"];

function mesVazio(){ return {dias:[], notas:{}, fonte:"", notasFonte:""}; }
function limpaMes(m){
  var o = mesVazio(); m = m || {};
  (Array.isArray(m.dias) ? m.dias : []).forEach(function(x){ if(x && ehDia(x.d) && String(x.c||"").trim() && (int(x.n) || int(x.e))) o.dias.push({d:x.d, c:String(x.c).trim(), n:int(x.n), e:int(x.e)}); });
  Object.keys(m.notas || {}).forEach(function(c){ var x = m.notas[c]; if(x && int(x.q) && isFinite(Number(x.nota))) o.notas[c] = {q:int(x.q), nota:r2(x.nota)}; });
  o.fonte = String(m.fonte||""); o.notasFonte = String(m.notasFonte||"");
  return o;
}
// cria vazio ou completa campos novos. local = dados reais deste computador (bonus-montagem.local.js): cada mês entra UMA vez (semeados), para não voltar depois de corrigido na tela.
function bmMigrar(bm, local){
  var o = bm && typeof bm==="object" ? clone(bm) : {};
  o.v = o.v || 1;
  o.cfg = Object.assign({}, CFG_PADRAO, o.cfg || {});
  o.pessoas = Array.isArray(o.pessoas) && o.pessoas.length ? o.pessoas : PESSOAS_PADRAO.slice();
  var meses = {}; Object.keys(o.meses || {}).forEach(function(k){ if(ehMes(k)) meses[k] = limpaMes(o.meses[k]); }); o.meses = meses;
  o.semeados = o.semeados && typeof o.semeados==="object" ? o.semeados : {};
  return bmSemear(o, local);
}
// Põe os meses reais deste computador que ainda não entraram (cada mês UMA vez). NÃO reorganiza o resto: o que veio do servidor fica como veio.
// (O servidor guarda em jsonb e devolve os campos em outra ordem; reorganizar aqui fazia a tela achar diferença e regravar a cada 20 s.)
function bmSemear(bm, local){
  if(!bm || !local || !local.meses) return bm;
  var falta = Object.keys(local.meses).filter(function(k){ return ehMes(k) && !(bm.semeados || {})[k]; });
  if(!falta.length) return bm;
  var o = Object.assign({}, bm, {meses:Object.assign({}, bm.meses), semeados:Object.assign({}, bm.semeados)});
  falta.forEach(function(k){ if(!o.meses[k] || !(o.meses[k].dias || []).length) o.meses[k] = limpaMes(local.meses[k]); o.semeados[k] = 1; });
  return o;
}

// ---------- contas ----------
function bonusDoDia(n, e, c){
  n = int(n); e = int(e);
  var normal = n>=c.metaNormal ? c.baseNormal + c.extraNormal*(n-c.metaNormal) : 0;
  var especial = e>=c.metaEspecial ? c.baseEspecial + c.extraEspecial*(e-c.metaEspecial) : 0;
  return {normal:r2(normal), especial:r2(especial), total:r2(normal+especial)};
}
function supervisaoDoDia(n, e, c){
  n = int(n); e = int(e);
  var normal = n>=c.metaNormal ? c.supBaseNormal + c.supExtraNormal*(n-c.metaNormal) : 0;
  var especial = e>=c.metaEspecial ? c.supBaseEspecial + c.supExtraEspecial*(e-c.metaEspecial) : 0;
  return {normal:r2(normal), especial:r2(especial)};
}
// nota = média de 1 a 5 estrelas das perguntas do KIT respondidas pela revendedora; null = sem avaliação (não corta)
function fatorDaNota(nota, c){
  if(!c.usarNota || nota===null || nota===undefined) return 1;
  return nota<c.notaZero ? 0 : nota<c.notaMetade ? 0.5 : 1;
}
function mesesDe(bm){ return Object.keys((bm && bm.meses) || {}).filter(function(k){ return bm.meses[k].dias.length>0; }).sort().reverse(); }

// resumo do mês: uma linha por colaboradora (como a aba "Resumo por colaboradora" da planilha) + totais
// notas = {colaboradora: {q, nota}}: a nota do kit dada pelas revendedoras, vinda de UMA fonte só (notasDoMes de domain/avaliacoes-kits.js, a mesma da aba Avaliações › Kits).
// Sem notas = ninguém é cortado. (As notas que ficaram gravadas dentro de bm.meses[..].notas no primeiro dia não são mais lidas.)
function resumoMes(bm, mes, notas){
  var c = bm.cfg, m = (bm.meses && bm.meses[mes]) || mesVazio(), porC = {}, supN = 0, supE = 0, nts = notas || {};
  var pega = function(nome){ return porC[nome] || (porC[nome] = {c:nome, n:0, e:0, dias:0, diasBonus:0, bNormal:0, bEspecial:0}); };
  m.dias.forEach(function(x){
    var b = bonusDoDia(x.n, x.e, c), sp = supervisaoDoDia(x.n, x.e, c), o = pega(x.c);
    o.n += x.n; o.e += x.e; o.dias++; if(b.total>0) o.diasBonus++;
    o.bNormal = r2(o.bNormal+b.normal); o.bEspecial = r2(o.bEspecial+b.especial);
    supN = r2(supN+sp.normal); supE = r2(supE+sp.especial);
  });
  // quem recebe a supervisão aparece mesmo sem ter montado no mês
  if(supN>0 && c.supNormalPara) pega(c.supNormalPara);
  if(supE>0 && c.supEspecialPara) pega(c.supEspecialPara);
  var linhas = Object.keys(porC).map(function(k){
    var o = porC[k], nt = nts[k], nota = nt && nt.q>0 ? nt.nota : null, fator = fatorDaNota(nota, c);
    o.bruto = r2(o.bNormal+o.bEspecial); o.aval = nt ? nt.q : 0; o.nota = nota; o.fator = fator; o.pagar = r2(o.bruto*fator);
    o.sup = r2((k===c.supNormalPara ? supN : 0) + (c.supEspecialPara && k===c.supEspecialPara ? supE : 0));
    o.total = r2(o.pagar+o.sup);
    return o;
  }).sort(function(a, b){ return b.bruto-a.bruto || b.n-a.n || a.c.localeCompare(b.c); });
  var soma = function(k){ return r2(linhas.reduce(function(t, o){ return t+o[k]; }, 0)); };
  var tot = {n:soma("n"), e:soma("e"), diasBonus:soma("diasBonus"), bNormal:soma("bNormal"), bEspecial:soma("bEspecial"), bruto:soma("bruto"), aval:soma("aval"), pagar:soma("pagar"), sup:soma("sup"), total:soma("total")};
  return {mes:mes, linhas:linhas, tot:tot, supNormal:supN, supEspecial:supE, supSemDestino:c.supEspecialPara ? 0 : supE, fonte:m.fonte};
}
// dia a dia. colaboradora vazia = um dia por linha (todas somadas); com nome = os dias dela
function diasDoMes(bm, mes, colaboradora){
  var c = bm.cfg, m = (bm.meses && bm.meses[mes]) || mesVazio(), porD = {};
  m.dias.forEach(function(x){
    if(colaboradora && x.c!==colaboradora) return;
    var b = bonusDoDia(x.n, x.e, c), sp = supervisaoDoDia(x.n, x.e, c);
    var o = porD[x.d] || (porD[x.d] = {d:x.d, pessoas:0, comBonus:0, n:0, e:0, bNormal:0, bEspecial:0, bonus:0, sup:0});
    o.pessoas++; if(b.total>0) o.comBonus++; o.n += x.n; o.e += x.e;
    o.bNormal = r2(o.bNormal+b.normal); o.bEspecial = r2(o.bEspecial+b.especial); o.bonus = r2(o.bonus+b.total); o.sup = r2(o.sup+sp.normal+sp.especial);
  });
  var linhas = Object.keys(porD).sort().map(function(k){ return porD[k]; });
  var soma = function(k){ return r2(linhas.reduce(function(t, o){ return t+o[k]; }, 0)); };
  return {linhas:linhas, tot:{pessoas:soma("pessoas"), comBonus:soma("comBonus"), n:soma("n"), e:soma("e"), bNormal:soma("bNormal"), bEspecial:soma("bEspecial"), bonus:soma("bonus"), sup:soma("sup")}};
}
// o que já está lançado num dia: {colaboradora: {n, e}}
function lancadoNoDia(bm, data){
  var m = (bm.meses && bm.meses[String(data||"").slice(0, 7)]) || mesVazio(), o = {};
  m.dias.forEach(function(x){ if(x.d===data) o[x.c] = {n:x.n, e:x.e}; });
  return o;
}

// ---------- ações (BM) ----------
// dia_set {data, itens:[{c, n, e}], hoje}: grava os kits do dia de cada colaboradora da lista (0 e 0 = tira o lançamento dela naquele dia)
function bmReduz(s, a){
  var bm = bmMigrar(s.bm), recusa = function(t){ return {patch:{}, msg:t}; };
  if(a.op==="dia_set"){
    if(!ehDia(a.data)) return recusa("Data inválida.");
    if(a.hoje && a.data>a.hoje) return recusa("A data não pode ser no futuro.");
    var itens = (Array.isArray(a.itens) ? a.itens : []).filter(function(x){ return x && String(x.c||"").trim(); });
    if(!itens.length) return recusa("Nenhuma colaboradora informada.");
    if(itens.some(function(x){ return !isFinite(Number(x.n)) || !isFinite(Number(x.e)) || Number(x.n)<0 || Number(x.e)<0 || Number(x.n)>99 || Number(x.e)>99; })) return recusa("A quantidade de kits vai de 0 a 99.");
    var mes = a.data.slice(0, 7), m = bm.meses[mes] || (bm.meses[mes] = mesVazio()), nomes = {};
    itens.forEach(function(x){ nomes[String(x.c).trim()] = 1; });
    m.dias = m.dias.filter(function(x){ return !(x.d===a.data && nomes[x.c]); });
    itens.forEach(function(x){ if(int(x.n) || int(x.e)) m.dias.push({d:a.data, c:String(x.c).trim(), n:int(x.n), e:int(x.e)}); });
    m.dias.sort(function(x, y){ return x.d<y.d ? -1 : x.d>y.d ? 1 : x.c.localeCompare(y.c); });
    if(!m.dias.length && !Object.keys(m.notas).length){ delete bm.meses[mes]; delete bm.semeados[mes]; }   // tirou o último lançamento: o mês vazio não fica guardado (nem a marca dele)
    else { if(!m.fonte) m.fonte = "Lançado no sistema"; bm.semeados[mes] = 1; }   // mês mexido na tela não é sobrescrito pela semente local
    return {patch:{bm:bm}, msg:"Kits do dia "+a.data.slice(8, 10)+"/"+a.data.slice(5, 7)+" gravados."};
  }
  return recusa("");
}

export { CFG_PADRAO, PESSOAS_PADRAO, bmMigrar, bmSemear, bmReduz, bonusDoDia, supervisaoDoDia, fatorDaNota, mesesDe, resumoMes, diasDoMes, lancadoNoDia, ehMes, ehDia };
