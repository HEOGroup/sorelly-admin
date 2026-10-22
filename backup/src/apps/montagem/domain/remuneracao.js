// Sorelly Admin · montagem — domain/remuneracao.js
// Relatório de remuneração mês a mês de cada funcionária (holerite resumido: salário-base, adiantamento, salário, horas extras, VR, VT, 13º), passado pelo Marcus / RH.
// Aparece dentro da pessoa na aba Contas a pagar → Funcionários e representantes. Os valores reais ficam SÓ em remuneracao.local.js (gitignored: o repositório é público).
// Formato: { "nome sem acento em minúsculo": { fonte:"...", observacoes:["..."], meses:[{ ym:"2026-07", salarioBase, adiantamento, salario, heHoras:"17:01", heValor, dif, vr, vt, decimo, total }] } }
var LOCAL = (function(){ try { var m = import.meta.glob("./remuneracao.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : {}; } catch(e){ return {}; } })();
var REMUNERACAO = LOCAL || {};
export { REMUNERACAO };
