// Sorelly Admin · montagem — domain/charme-linda.js
// Pedidos Charme e Linda de 25/11/2026 (Marcus): garante que existam em Negociações (pf) e em Contas a pagar (cpe) MESMO depois que o servidor devolve listas antigas.
// Confere pelo conteúdo (sem marca de "já feito"): o que faltar volta; o que existe não muda.
import { semearCharmeLinda } from "@/apps/montagem/domain/pf";

var DIVIDAS = [
  {id:"cl-charme-2026-11-27", filial:"67", nat:"5.01.01", natNome:"Bruto", pref:"PIX", forn:"Charme", nome:"Charme · Pix CNPJ 67 Axis (nota NF AXIS)", venc:"2026-11-27", valor:357.6, status:"apagar"},
  {id:"cl-linda-2026-11-27", filial:"67", nat:"5.01.01", natNome:"Bruto", pref:"PIX", forn:"Linda", nome:"Linda · Pix CNPJ 67 Axis (com nota)", venc:"2026-11-27", valor:1967, status:"apagar"}
];

function garantirCharmeLinda(s){
  if(!s) return s;
  var n = s;
  if(s.pf && Array.isArray(s.pf.pedidos) && Array.isArray(s.pf.fornecedores) && s.pf.seq){
    var pf = JSON.parse(JSON.stringify(s.pf));
    if(semearCharmeLinda(pf)) n = Object.assign({}, n, {pf:pf});
  }
  if(s.cpe && Array.isArray(s.cpe.lanc)){
    var tem = {}; s.cpe.lanc.forEach(function(x){ tem[x.id] = 1; });
    var falta = DIVIDAS.filter(function(d){ return !tem[d.id]; });
    if(falta.length) n = Object.assign({}, n, {cpe:Object.assign({}, s.cpe, {lanc:s.cpe.lanc.concat(falta)})});
  }
  return n;
}
export { garantirCharmeLinda };
