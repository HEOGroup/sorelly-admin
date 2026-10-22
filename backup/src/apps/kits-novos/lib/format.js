// Sorelly Admin · kits novos Curitiba — lib/format.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.

function N1(n){ return Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1}); }
function BK(n){ return n==null ? "\u2014" : "R$ "+Number(n).toLocaleString("pt-BR",{maximumFractionDigits:0}); }

export { N1, BK };
