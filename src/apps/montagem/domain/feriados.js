// Sorelly Admin · montagem — domain/feriados.js
// DIAS SEM EXPEDIENTE (Marcus, 02/11/2026): domingo e feriado (o sábado tem acerto). O calendário do Agendamento pinta esses dias de outra cor; os demais ficam na cor padrão.
// Feriados nacionais fixos, os que dependem da Páscoa (Carnaval, Sexta-feira Santa, Corpus Christi) e os de Curitiba/Paraná. Ajuste a lista aqui quando a empresa decidir outro dia.
var FIXOS = [["01-01", "Confraternização Universal"], ["04-21", "Tiradentes"], ["05-01", "Dia do Trabalho"], ["09-07", "Independência"], ["10-12", "Nossa Senhora Aparecida"], ["11-02", "Finados"], ["11-15", "Proclamação da República"], ["11-20", "Consciência Negra"], ["12-25", "Natal"],
  ["03-29", "Aniversário de Curitiba"], ["09-08", "Nossa Senhora da Luz (Curitiba)"], ["12-19", "Emancipação do Paraná"]];
var iso = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };
// Páscoa (algoritmo de Meeus/Jones/Butcher)
function pascoa(ano){
  var a = ano%19, b = Math.floor(ano/100), c = ano%100, d = Math.floor(b/4), e = b%4, f = Math.floor((b+8)/25), g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15)%30, i = Math.floor(c/4), k = c%4, l = (32+2*e+2*i-h-k)%7, m = Math.floor((a+11*h+22*l)/451), mes = Math.floor((h+l-7*m+114)/31), dia = ((h+l-7*m+114)%31)+1;
  return new Date(ano, mes-1, dia);
}
var cache = {};
function feriadosDe(ano){
  ano = Number(ano); if(cache[ano]) return cache[ano];
  var out = {}, p = pascoa(ano), soma = function(n){ return new Date(p.getFullYear(), p.getMonth(), p.getDate()+n); };
  FIXOS.forEach(function(x){ out[ano+"-"+x[0]] = x[1]; });
  out[iso(soma(-48))] = "Carnaval (segunda)"; out[iso(soma(-47))] = "Carnaval (terça)"; out[iso(soma(-2))] = "Sexta-feira Santa"; out[iso(soma(60))] = "Corpus Christi";
  cache[ano] = out; return out;
}
// tipo do dia: "feriado" | "domingo" | "" (dia com expediente, sábado inclusive). nome só no feriado.
function tipoDoDia(isoDia){
  var nome = feriadosDe(isoDia.slice(0, 4))[isoDia]; if(nome) return {tipo:"feriado", nome:nome};
  var w = new Date(isoDia+"T00:00:00").getDay(); return w===0 ? {tipo:"domingo", nome:""} : {tipo:"", nome:""};   // sábado TEM expediente (Marcus, 02/11/2026): só domingo e feriado ficam de fora
}
// Marcus, 02/11/2026: acerto marcado para domingo ou feriado PASSA para o próximo dia com expediente (segunda, ou terça se a segunda for feriado; o sábado não passa). Só a contagem do calendário muda; a data da DevMaster continua a mesma.
function diaEfetivo(isoDia){
  if(!isoDia) return isoDia; var d = new Date(isoDia+"T00:00:00"), guarda = 0;
  while(tipoDoDia(iso(d)).tipo && guarda++<14) d.setDate(d.getDate()+1);
  return iso(d);
}
// mapa {data: quantidade} → {eff: contagem já com os dias úteis somados, saiu: {data não útil: {n, para}}, entra: {dia útil: quanto chegou}}
function redistribuirContagem(mapa){
  var eff = {}, saiu = {}, entra = {};
  Object.keys(mapa || {}).forEach(function(k){ var n = mapa[k] || 0; if(!n) return; var alvo = diaEfetivo(k); eff[alvo] = (eff[alvo] || 0)+n; if(alvo!==k){ saiu[k] = {n:n, para:alvo}; entra[alvo] = (entra[alvo] || 0)+n; } });
  return {eff:eff, saiu:saiu, entra:entra};
}
export { feriadosDe, tipoDoDia, diaEfetivo, redistribuirContagem };
