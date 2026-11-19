// Sorelly Admin · montagem — lib/contas-saida.js
// Contas de onde um pagamento pode sair, na MESMA árvore do Direcionar, SEGUINDO A REGRA (Marcus, 12/11/2026):
//   · Conta de um CNPJ (34, 46, 59, 67, H&O) só se paga com contas DESSE MESMO CNPJ (e com o Dinheiro). Nunca aparece conta de outro CNPJ.
//   · Conta "Por fora" (consórcio, despesa pessoal, família) se paga com as contas da Família e sócios, Marco PJ e Dinheiro. Nunca com conta de CNPJ.
// Os nomes seguem a regra única de lib/nome-conta.js. Vale para o SeletorConta: nos = [folha | {nome, itens}], folha {nome, id, conta, cols}.
import { dataReferencia, posicaoEm } from "@/apps/montagem/domain/saldos-contas";
import { hojeIso } from "@/apps/montagem/domain/financeiro-familiar";
import { bancoDeConta, nomePropio } from "@/apps/montagem/lib/nome-conta";
import { BKC } from "@/apps/montagem/lib/format";

var saldoTxt = function(v){ return v==null ? "—" : v<0 ? "−"+BKC(-v) : BKC(v); };
var DE_CNPJ = {"34":1, "46":1, "59":1, "67":1, "ho":1};   // as empresas com CNPJ; "fora" é tudo que não é delas

function nosContasSaida(s, filialDaConta){
  var fil = String(filialDaConta || "").toLowerCase(), porFora = !DE_CNPJ[fil];
  var sc = s.saldosContas, ref = sc ? dataReferencia(sc, hojeIso()) : null, blocos = ref ? posicaoEm(sc, ref).blocos : [];
  // ORDEM (Marcus, 12/11/2026): as contas de pagar vêm primeiro, com o maior saldo no alto; Aplicação (investimento) e Rotativo (cheque especial) vão para o fim.
  var ultimas = function(x){ return /aplica[cç][aã]o|rotativo/i.test(x.conta.nome) ? 1 : 0; };
  var folhas = function(cs){
    cs = cs.slice().sort(function(a, b){ return ultimas(a)-ultimas(b) || b.saldo-a.saldo || String(a.conta.nome).localeCompare(String(b.conta.nome)); });
    var bks = cs.map(function(x){ return bancoDeConta(x.conta.nome); });
    return cs.map(function(x, i){ var b = bks[i], unico = b && bks.filter(function(z){ return z===b; }).length===1;
      return {nome:x.conta.nome, id:String(x.conta.id), conta:x.conta.nome, cols:[unico ? b : nomePropio(x.conta.nome), saldoTxt(x.saldo)], w:[62, 38], heads:["Conta", "Saldo"], cores:[null, x.saldo>0 ? "var(--positivo)" : x.saldo<0 ? "var(--negativo)" : null]}; });
  };
  var proprias = [], marcoPj = [], dinheiro = [];
  blocos.forEach(function(b){
    var id = String(b.id).toLowerCase(), cs = b.contas.filter(function(x){ return !x.conta.bloqueada; });
    if(id==="bloq" || !cs.length) return;
    if(id==="din"){ dinheiro = dinheiro.concat(folhas(cs)); return; }
    if(id==="itm"){ marcoPj = marcoPj.concat(folhas(cs)); return; }
    if(!porFora && id===fil) proprias = proprias.concat(folhas(cs));   // só o MESMO CNPJ da conta
  });
  if(!porFora) return proprias.concat(dinheiro.length ? [{nome:"Dinheiro", itens:dinheiro}] : []);
  var ORDEM_PESSOAS = ["marcus", "anamaria", "marco", "anabeatriz", "lucas"], pos = function(c){ var k = ORDEM_PESSOAS.indexOf(c.personaId); return k<0 ? 99 : k; };   // a mesma ordem das Chaves Pix
  var fam = ((s.ff || {}).contasBanc || []).filter(function(c){ return c.ativo!==false; }).sort(function(a, b){ return pos(a)-pos(b) || String(a.nome).localeCompare(String(b.nome)); }).map(function(c){ return {nome:nomePropio(c.nome), id:"ff:"+c.id, conta:c.nome}; });
  return [
    {nome:"Marco PJ", itens:marcoPj},
    {nome:"Dinheiro", itens:dinheiro},
    {nome:"Família e sócios", itens:fam}
  ].filter(function(g){ return g.itens.length; });
}

export { nosContasSaida };
