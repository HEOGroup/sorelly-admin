// Sorelly Admin · montagem — lib/chave-do-destino.js
// Controle de pagamentos › Destinos: para cada destino, devolve a(s) chave(s) Pix, o banco, o favorecido e o texto "Escrever na folha" (rótulo da conta, ex.: PIX - ITAÚ PJ - MARCO).
// SÓ LEITURA. As chaves moram em Financeiro › Bancos › Chaves Pix; aqui nada é digitado de novo (10/11/2026, pedido do Marcus: o Lucas precisa ver a chave ao direcionar).
// Conta de CNPJ (destino com cnpjId): uma linha por conta bancária. Fornecedor, sócio, representante: acha pelo nome em s.cp.chaves e s.cp.func.
import { chaveAdminDaConta, contaDaCaixa, extrasSeed } from "@/apps/montagem/domain/pix-regras";
import { bancoDaConta } from "@/apps/montagem/lib/mensagem-pix";

var FAV_EMPRESA = {"34":"Sorelly Comércio Atacadista de Semijoias", "46":"Mayz Comércio de Moda Praia, Lingeries e Acessórios Ltda", "59":"Serenity", "67":"Axis Comércio de Joias e Acessórios Ltda", "HO":"H&O Apps", "ho":"H&O Apps", "ITM":"Marco Antônio de Oliveira"};
var FOLHA = {"ITM":"PIX - ITAÚ PJ - MARCO"};   // texto que se escreve na folha (rótulo da DevMaster), como o Marcus passou em 10/11/2026
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " "); };
var palavras = function(t){ return norm(t).split(/[^a-z0-9]+/).filter(function(w){ return w.length>2 && ["dos","das","del"].indexOf(w)<0; }); };
var tipoDe = function(ch){ var s = String(ch||"").trim(), d = s.replace(/\D/g, ""); if(!s) return ""; if(s.indexOf("@")>=0) return "EMAIL"; if(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return "ALEATORIA"; if(d.length===14) return "CNPJ"; if(d.length===11) return "CPF"; return "TELEFONE"; };

// devolve [{folha, banco, fav, chave, tipo}]; vazio = o destino ainda não tem chave cadastrada
export function chavesDoDestino(s, d){
  var sc = s.saldosContas || {}, px = s.px || {}, cp = s.cp || {}, out = [];
  if(d.cnpjId){
    (sc.contas||[]).filter(function(c){ return c.bloco===d.cnpjId && c.tipo!=="CAIXA" && !c.bloqueada && !/rotativo|garantida/i.test(c.nome); }).forEach(function(c){
      var k = contaDaCaixa(px, c.id) || {}, sd = !k.chave ? chaveAdminDaConta(c.nome) : null, chave = String(k.chave || (sd && sd.chave) || "").trim();
      if(chave) out.push({folha:FOLHA[d.cnpjId] || k.label || ("PIX - "+String(c.nome).toUpperCase()), banco:bancoDaConta(c.nome), fav:FAV_EMPRESA[d.cnpjId] || "", chave:chave, tipo:k.chaveTipo || (sd && sd.chaveTipo) || tipoDe(chave)});
    });
    return out;
  }
  var mine = palavras(d.nome); if(!mine.length) return out;
  var casa = function(nome){ var o = palavras(nome); return o.length && mine.every(function(w){ return o.indexOf(w)>=0; }); };
  var cch = Object.assign({}, cp.chaves || {});
  extrasSeed().forEach(function(x){ var cur = cch[x[0]] || {}; cch[x[0]] = Object.assign({}, cur, {nome:x[2] || cur.nome, banco:x[3] || cur.banco, favorecido:x[7] || cur.favorecido || ""}, cur.chave ? {} : {chaveTipo:x[5], chave:x[6]}); });   // arquivo local completa o que o estado salvo ainda não tem
  Object.keys(cch).forEach(function(id){ var x = cch[id]; if(x && x.chave && casa(x.nome)) out.push({folha:"", banco:x.banco || "", fav:x.favorecido || "", chave:String(x.chave).trim(), tipo:x.chaveTipo || tipoDe(x.chave)}); });
  Object.keys(cp.func||{}).forEach(function(n){ var x = cp.func[n]; if(x && x.chave && casa(n)) out.push({folha:"", banco:x.banco || "", fav:"", chave:String(x.chave).trim(), tipo:x.chaveTipo || tipoDe(x.chave)}); });
  return out;
}
