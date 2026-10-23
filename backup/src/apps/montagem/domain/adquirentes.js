// Sorelly Admin · montagem — domain/adquirentes.js
// Adquirentes e taxas (Sicredi por CNPJ, Getnet e Cielo da Pontual). Os dados reais ficam SÓ em domain/adquirentes.local.js (gitignored; repositório público); sem o arquivo a tela abre vazia.
// Aplica as taxas de CRÉDITO da Sicredi nos meios do Link de pagamento (Link 34/46/59 e a maquininha do 59) quando eles ainda não têm taxa. "Não informado" nunca vira zero aqui.
var LOCAL = (function(){ try { var m = import.meta.glob("./adquirentes.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
var ADQ = LOCAL || null;
var numero = function(t){ var n = Number(String(t==null ? "" : t).replace(",", ".")); return isNaN(n) || t==="" ? null : n; };
var linhaDe = function(f, mod){ var r = null; (f.tabelas||[]).forEach(function(t){ if(!r) (t.linhas||[]).forEach(function(l){ if(!r && l.mod===mod) r = l; }); }); return r; };
// taxas no formato do meio: {todas:{n:%}, Visa:{n:%}, Mastercard:{n:%}} só com o que foi informado
function taxasDaFicha(f){
  var t = {todas:{}, Visa:{}, Mastercard:{}}, poe = function(l, ns){ if(!l) return; var vm = numero(l.vm), dem = numero(l.dem); ns.forEach(function(n){ if(vm!=null){ t.Visa[String(n)] = vm; t.Mastercard[String(n)] = vm; } if(dem!=null) t.todas[String(n)] = dem; }); };
  poe(linhaDe(f, "Crédito à vista"), [1]); poe(linhaDe(f, "Parcelado de 2x a 6x"), [2, 3, 4, 5, 6]);
  return t;
}
var semTaxa = function(m){ var t = m.taxas || {}; return !Object.keys(t).some(function(b){ return Object.keys(t[b]||{}).length; }); };
// migração única (lp.taxasAdqV): preenche só meios SEM taxa, não sobrescreve o que o Financeiro já digitou
function aplicarTaxasAdq(lp){
  if(!ADQ || !lp || lp.taxasAdqV===1) return lp;
  var tocados = [];
  (lp.meios||[]).forEach(function(m){ var f = (ADQ.fichas||[]).find(function(x){ return x.cnpj && x.cnpj===m.cnpjId && x.adq==="Sicredi"; }); if(!f || !semTaxa(m)) return; m.taxas = taxasDaFicha(f); tocados.push(m.nome); });
  lp.taxasAdqV = 1;
  if(tocados.length && lp.log) lp.log.push({em:Date.now(), por:"importação", op:"taxas_adq", txt:"Taxas de crédito da Sicredi (condição de "+ADQ.taxasEm+") aplicadas em: "+tocados.join(", ")});
  return lp;
}
export { ADQ, aplicarTaxasAdq, taxasDaFicha, numero };
