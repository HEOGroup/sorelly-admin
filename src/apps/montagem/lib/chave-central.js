// Sorelly Admin · montagem — lib/chave-central.js
// CHAVE CENTRAL (Marcus, 24/11/2026): "a aba Chaves Pix é a tela principal". Qualquer tela que precisa da chave de uma pessoa ou empresa procura PRIMEIRO lá (cp.chaves e cp.func).
// Só se a chave não estiver lá usa a CÓPIA antiga: prestador da Família (ff.prest), conta bancária de prestador (ff.contasBanc) e destino do Direcionar (cp.destinos).
// A procura é por nome, sem acento e sem o que vem entre parênteses. "Higor (segurança)" acha "Higor Fernando Goulart"; "Marco Antonio de Oliveira" acha "Marco Antonio".
// Só LÊ. Quem grava as chaves é a aba Chaves Pix (hoje por scripts/cadastrar-chaves-pix.mjs).
var norm = function(t){ return String(t==null ? "" : t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " "); };
var palavras = function(t){ return norm(t).split(/[^a-z0-9]+/).filter(function(w){ return w.length>2 && ["dos","das","del"].indexOf(w)<0; }); };
var NAO_CHAVE = /^(cpf|cnpj|a preencher|a definir|sem chave|-|—)$/i;
var valida = function(c){ var x = String(c==null ? "" : c).trim(); return x.length>=5 && !NAO_CHAVE.test(x); };

// Nome A "casa" com nome B quando todas as palavras do mais curto estão no mais longo. Nome de UMA palavra só vale se for a primeira palavra do outro.
function nomesCasam(a, b){
  var pa = palavras(a), pb = palavras(b); if(!pa.length || !pb.length) return false;
  var curto = pa.length<=pb.length ? pa : pb, longo = curto===pa ? pb : pa;
  if(!curto.every(function(w){ return longo.indexOf(w)>=0; })) return false;
  return curto.length>1 || curto[0]===longo[0];
}

// opc.grupos = em quais grupos da aba procurar (func, forn, rep, prest, ffp, pes); opc.cch = chaves já mescladas com o arquivo local (se a tela tiver); opc.copias = false para não olhar as cópias antigas.
// Devolve {chave, tipo, banco, fav, origem, nome} ou null.
export function acharChaveCentral(s, nome, opc){
  var o = opc || {}, grupos = o.grupos || ["func", "prest", "ffp", "forn", "rep"], cp = (s && s.cp) || {}, ff = (s && s.ff) || {}, cch = o.cch || cp.chaves || {};
  if(!palavras(nome).length) return null;
  var pega = function(origem, nomeC, k){ return {chave:String(k.chave).trim(), tipo:k.chaveTipo || k.chavePixTipo || "", banco:k.banco || "", fav:k.favorecido || "", origem:origem, nome:nomeC}; };
  var i, ks, x;
  // 1) a aba Chaves Pix
  if(grupos.indexOf("func")>=0){ ks = Object.keys(cp.func || {}); for(i = 0; i<ks.length; i++){ x = cp.func[ks[i]]; if(x && valida(x.chave) && nomesCasam(nome, ks[i])) return pega("Chaves Pix › Funcionários", ks[i], x); } }
  ks = Object.keys(cch);
  for(i = 0; i<ks.length; i++){ x = cch[ks[i]]; if(x && grupos.indexOf(x.grupo)>=0 && valida(x.chave) && nomesCasam(nome, x.nome || ks[i])) return pega("Chaves Pix", x.nome || ks[i], x); }
  if(o.copias===false) return null;
  // 2) cópias antigas, só quando a aba não tem a chave
  var prest = (ff.prest || []).filter(function(p){ return valida(p.chavePix) && nomesCasam(nome, p.nome); })[0];
  if(prest) return pega("Prestador da Família", prest.nome, {chave:prest.chavePix, chaveTipo:prest.chavePixTipo});
  var cb = (ff.contasBanc || []).filter(function(c){ if(!c.prestadorId || !valida(c.chavePix)) return false; var p = (ff.prest || []).filter(function(q){ return q.id===c.prestadorId; })[0]; return p && nomesCasam(nome, p.nome); })[0];
  if(cb) return pega("Conta bancária do prestador", cb.nome, {chave:cb.chavePix, chaveTipo:cb.chavePixTipo, banco:cb.banco});
  var dst = (cp.destinos || []).filter(function(d){ return valida(d.chavePix) && nomesCasam(nome, d.nome); })[0];
  if(dst) return pega("Destino do Direcionar", dst.nome, {chave:dst.chavePix, banco:dst.banco});
  return null;
}
export { nomesCasam, valida as chaveValidaCentral };
