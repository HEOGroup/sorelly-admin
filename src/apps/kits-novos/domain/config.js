// Sorelly Admin · kits novos Curitiba — domain/config.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.

var CFG0 = {
  prazos:{cadastrada:1, liberado:1, solicitado:1, aceito:1, contato:1, agendado:2, montando:1, bipado:3, retirado:1, entregue:3},
  motivosCancel:["Revendedora n\u00e3o responde","N\u00e3o tem mais interesse","Fica desmarcando com a representante","Cadastro reprovado","Endere\u00e7o inv\u00e1lido"],
  ocultarApos:7, valorPadrao:7000, metaDias:7, maxDesmarcacoes:3, campanhas:{},
  // recusas no app (ou por WhatsApp) que bloqueiam a representante para novos kits, contadas desde o último desbloqueio; repBloq = ajuste manual por representante
  // {nome:{bloq:true|null, desde:"AAAA-MM-DD"}} (true força o bloqueio; desde = último desbloqueio, recusas antes dele não contam). Como no admin antigo (25/11/2026).
  recusasBloqueio:2, repBloq:{}
};
// an\u00fancio: "An\u00fancio" + entId, ou o ID do an\u00fancio do Meta direto na entrada (como a planilha e a Kommo gravam: "120251989668640131")
function ehIdAnuncio(t){ return /^\d{12,}$/.test(String(t||"")); }
function nomeEntrada(c, cfg){ var id = ehIdAnuncio(c.ent) ? c.ent : c.ent==="An\u00fancio" ? c.entId : ""; if(!id) return c.ent; var n = ((cfg && cfg.campanhas) || {})[id]; return n ? n : "An\u00fancio "+String(id).slice(-4); }
var USUARIOS = [{id:"michele", nome:"Michele", papel:"Kits novos"},{id:"nickolas", nome:"Nickolas", papel:"Supervisor"},{id:"camilly", nome:"Camilly", papel:"Cadastro"}];
function listaDe(dados, campo){ var c = {}; dados.forEach(function(x){ if(x[campo]) c[x[campo]] = (c[x[campo]]||0)+1; });
  return Object.keys(c).sort(function(a,b){return c[b]-c[a];}); }

// Recusas gravadas nos kits (recs: pelo app, gravada pelo servidor, ou por WhatsApp, no diálogo Recusou): [{rep, iso, motivo, via, kit, nome}]
function recusasDosKits(dados){ var o = []; (dados||[]).forEach(function(c){ (c.recs||[]).forEach(function(r){ o.push(Object.assign({kit:c.id, nome:c.nome}, r)); }); }); return o; }
// Representante bloqueada para novos kits? Ajuste manual vence; sem ajuste, conta as recusas (lista {rep, iso}) desde o último desbloqueio.
function repBloqueada(nome, cfg, recusas){
  if(!nome || /^Sorelly/.test(nome)) return false;
  var aj = ((cfg && cfg.repBloq) || {})[nome];
  if(aj && aj.bloq===true) return true;
  if(aj && aj.bloq===false) return false;
  var desde = (aj && aj.desde) || "", limite = (cfg && cfg.recusasBloqueio) || 2;
  return (recusas||[]).filter(function(r){ return r.rep===nome && (!desde || String(r.iso||"")>=desde); }).length >= limite;
}

export { CFG0, ehIdAnuncio, nomeEntrada, recusasDosKits, repBloqueada, USUARIOS, listaDe };
