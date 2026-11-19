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

// 18/11/2026 (Marcus: "conectar as chaves Pix aos fornecedores e prestadores, para o Direcionar puxar a chave"):
// 1) PRESTADOR DA FAMÍLIA (Greicy de cada sócio, Rebel Mode, 68 Gang...): a chave é a do cadastro do prestador (ff.prest[].chavePix), a MESMA que a tela Chaves Pix edita; se ainda não foi editada, vale a do arquivo local;
//    se não tiver, a da conta bancária ligada a ele. Texto que não é chave ("CPF", "A preencher") não vale.
// 2) FORNECEDOR e PRESTADOR da empresa: se o nome não bate por palavras, compara colado e pelo começo ("Mega Sul" x "MegaSul", "Art Ello Bruto" x "Art Ello"), SÓ quando a busca exata não achou nada.
var compacto = function(t){ return norm(t).replace(/[^a-z0-9]/g, ""); };
var NAO_CHAVE = /^(cpf|cnpj|a preencher|sem chave|-|—)$/i;
export function chaveValida(c){ var x = String(c || "").trim(); return x.length>=5 && !NAO_CHAVE.test(x); }
var casaFrouxa = function(a, b){ var ca = compacto(a), cb = compacto(b); if(ca.length<4 || cb.length<4) return false; if(ca===cb || ca.indexOf(cb)===0 || cb.indexOf(ca)===0) return true;
  var pa = palavras(a), pb = palavras(b); return pa.length>0 && pb.length>0 && (pa.every(function(w){ return pb.indexOf(w)>=0; }) || pb.every(function(w){ return pa.indexOf(w)>=0; })); };
// prestador da família do destino (pelo vínculo prestFamId ou pelo mesmo nome) e a chave dele
export function prestFamDoDestino(s, d){
  var ps = (s.ff && s.ff.prest) || []; if(!ps.length) return null;
  if(d.prestFamId){ var v = ps.find(function(x){ return x.id===d.prestFamId; }); if(v) return v; }
  if(d.tipo!=="PRESTADOR" && d.tipo!=="FAMILIA") return null;
  return ps.find(function(x){ return compacto(x.nome)===compacto(d.nome); }) || null;
}
// a Greicy de cada sócio é o MESMO Pix (a tela Chaves Pix mostra uma só, "universal"): as outras duas usam a chave dela
var IGUAL_AO = {"greicy anamaria":"greicy marcus", "greicy ana beatriz":"greicy marcus", "greyci ana beatriz":"greicy marcus"};
var NOME_ANTIGO = {"greicy marcus":"greicy", "greicy ana beatriz":"greyci ana beatriz"};   // nome de antes da padronização: o arquivo local de chaves ainda usa ele
var nomeSimples = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); };
export function chaveDoPrestFam(s, x, fundo){
  var sd = !x.chavePixEm ? extrasSeed().find(function(z){ return z[0]==="ffp|"+nomeSimples(x.nome) || z[0]==="ffp|"+(NOME_ANTIGO[nomeSimples(x.nome)] || "#"); }) : null;   // chave do arquivo local vale enquanto ninguém editou a chave na tela (mesma regra da tela Chaves Pix)
  var cb = ((s.ff && s.ff.contasBanc) || []).find(function(b){ return b.prestadorId===x.id && b.ativo!==false && chaveValida(b.chavePix); });
  var chave = chaveValida(x.chavePix) ? String(x.chavePix).trim() : (sd && chaveValida(sd[6])) ? String(sd[6]).trim() : cb ? String(cb.chavePix).trim() : "";
  if(!chave && !fundo && IGUAL_AO[nomeSimples(x.nome)]){ var base = ((s.ff && s.ff.prest) || []).find(function(z){ var nz = nomeSimples(z.nome); return nz===IGUAL_AO[nomeSimples(x.nome)] || nz==="greicy"; }); if(base) return chaveDoPrestFam(s, base, true); }
  if(!chave) return null;
  return {folha:"", banco:(sd && sd[3]) || (cb && (cb.banco || cb.nome)) || "", fav:(sd && sd[7]) || "", chave:chave, tipo:x.chavePixTipo || (sd && sd[5]) || tipoDe(chave)};
}

// prestadores da família em aberto que NÃO têm chave válida no cadastro, mas têm uma por outro caminho (arquivo local, conta ligada, ou a Greicy universal): a tela Prestadores grava essas chaves no servidor com um clique,
// para o Direcionar e o Atendimento do Lucas e das atendentes (outros computadores) puxarem a chave. Devolve [{id, nome, chave, tipo}].
export function chavesParaGravar(s){
  return ((s.ff && s.ff.prest) || []).filter(function(x){ return x.ativo!==false && !chaveValida(x.chavePix); }).map(function(x){ var k = chaveDoPrestFam(s, x); return k ? {id:x.id, nome:x.nome, chave:k.chave, tipo:k.tipo} : null; }).filter(Boolean);
}

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
  var pf = prestFamDoDestino(s, d); if(pf){ var kf = chaveDoPrestFam(s, pf); return kf ? [kf] : out; }   // prestador da família: a chave é a do cadastro dele
  var mine = palavras(d.nome); if(!mine.length) return out;
  var casa = function(nome){ var o = palavras(nome); return o.length && mine.every(function(w){ return o.indexOf(w)>=0; }); };
  var cch = Object.assign({}, cp.chaves || {});
  extrasSeed().forEach(function(x){ var cur = cch[x[0]] || {}; cch[x[0]] = Object.assign({}, cur, {nome:x[2] || cur.nome, banco:x[3] || cur.banco, favorecido:x[7] || cur.favorecido || ""}, cur.chave ? {} : {chaveTipo:x[5], chave:x[6]}); });   // arquivo local completa o que o estado salvo ainda não tem
  Object.keys(cch).forEach(function(id){ var x = cch[id]; if(x && x.chave && casa(x.nome)) out.push({folha:"", banco:x.banco || "", fav:x.favorecido || "", chave:String(x.chave).trim(), tipo:x.chaveTipo || tipoDe(x.chave)}); });
  Object.keys(cp.func||{}).forEach(function(n){ var x = cp.func[n]; if(x && x.chave && casa(n)) out.push({folha:"", banco:x.banco || "", fav:"", chave:String(x.chave).trim(), tipo:x.chaveTipo || tipoDe(x.chave)}); });
  if(!out.length && (d.tipo==="FORNECEDOR" || d.tipo==="PRESTADOR")){   // nome escrito diferente ("Mega Sul" x "MegaSul")
    Object.keys(cch).forEach(function(id){ var x = cch[id]; if(x && chaveValida(x.chave) && casaFrouxa(d.nome, x.nome)) out.push({folha:"", banco:x.banco || "", fav:x.favorecido || "", chave:String(x.chave).trim(), tipo:x.chaveTipo || tipoDe(x.chave)}); });
    Object.keys(cp.func||{}).forEach(function(n){ var x = cp.func[n]; if(x && chaveValida(x.chave) && casaFrouxa(d.nome, n)) out.push({folha:"", banco:x.banco || "", fav:"", chave:String(x.chave).trim(), tipo:x.chaveTipo || tipoDe(x.chave)}); });
  }
  return out;
}
