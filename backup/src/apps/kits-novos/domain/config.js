// Sorelly Admin · kits novos Curitiba — domain/config.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.

var CFG0 = {
  prazos:{cadastrada:1, liberado:1, solicitado:1, bipado:3},
  motivosCancel:["Revendedora n\u00e3o responde","N\u00e3o tem mais interesse","Fica desmarcando com a representante","Cadastro reprovado","Endere\u00e7o inv\u00e1lido"],
  ocultarApos:7, valorPadrao:7000, metaDias:7, maxDesmarcacoes:3, campanhas:{}
};
function nomeEntrada(c, cfg){ if(c.ent!=="An\u00fancio" || !c.entId) return c.ent; var n = cfg.campanhas[c.entId]; return n ? n : "An\u00fancio "+c.entId.slice(-4); }
var USUARIOS = [{id:"michele", nome:"Michele", papel:"Kits novos"},{id:"nickolas", nome:"Nickolas", papel:"Supervisor"},{id:"camilly", nome:"Camilly", papel:"Cadastro"}];
function listaDe(dados, campo){ var c = {}; dados.forEach(function(x){ if(x[campo]) c[x[campo]] = (c[x[campo]]||0)+1; });
  return Object.keys(c).sort(function(a,b){return c[b]-c[a];}); }

export { CFG0, nomeEntrada, USUARIOS, listaDe };
