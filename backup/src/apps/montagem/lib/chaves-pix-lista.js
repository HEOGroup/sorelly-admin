// Sorelly Admin · montagem — lib/chaves-pix-lista.js
// Lista única de TODAS as chaves Pix preenchidas (contas dos CNPJs, funcionários, fornecedores, sócios e prestadores), para o botão "Escolher chave Pix" de outras telas.
// As chaves moram em Financeiro → Bancos → Chaves Pix; aqui só se lê.
export function listaChavesPix(s){
  var out = [], sc = s.saldosContas || {}, px = s.px || {}, cp = s.cp || {}, ff = s.ff || {};
  var nomeCnpj = {"34":"CNPJ 34", "46":"CNPJ 46", "59":"CNPJ 59", "67":"CNPJ 67", "HO":"H&O Apps", "ho":"H&O Apps", "ITM":"Itaú Marco PJ", "PART":"Particular"};
  var add = function(grupo, rotulo, chave, tipo){ if(chave) out.push({grupo:grupo, rotulo:rotulo, chave:chave, tipo:tipo||""}); };
  (px.contas||[]).forEach(function(k){ if(!k.chave || !k.caixaId) return; var c = (sc.contas||[]).find(function(x){ return x.id===k.caixaId; }); if(c) add("CNPJs", (nomeCnpj[c.bloco] || c.bloco)+" · "+c.nome, k.chave, k.chaveTipo); });
  Object.keys(cp.func||{}).forEach(function(n){ add("Funcionários", n, cp.func[n].chave, cp.func[n].chaveTipo); });
  var rot = {forn:"Fornecedores", pes:"Sócios", prest:"Prestadores de serviço"};
  Object.keys(cp.chaves||{}).forEach(function(k){ var x = cp.chaves[k]; add(rot[x.grupo] || "Outros", x.nome+(x.banco ? " · "+x.banco : ""), x.chave, x.chaveTipo); });
  (ff.prest||[]).forEach(function(x){ if(x.ativo!==false) add("Prestadores de serviço", x.nome, x.chavePix, x.chavePixTipo); });
  return out;
}
