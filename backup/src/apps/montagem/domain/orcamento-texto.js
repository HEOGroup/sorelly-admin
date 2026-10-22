// Sorelly Admin · montagem — domain/orcamento-texto.js
// Dívidas de prestador por código de orçamento (ex.: 68 Gang, D#081026153030): ler a mensagem/PDF do prestador e montar a mensagem copiável (com *negrito* do WhatsApp).
// Ler = pegar código, total e pagamentos de um texto no formato que a 68 Gang manda; a mensagem gerada sai no mesmo formato.
import { br } from "@/apps/montagem/domain/financeiro-familiar";

var money = function(v){ return Number(v||0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"}); };
var numBr = function(t){ var n = Number(String(t||"").replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };
var p2 = function(n){ return String(n).padStart(2, "0"); };
var curto = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7) : ""; };

// "09/10" (ou "09/10/2026") → "2026-10-09"; sem ano vale o ano de referência
function dataIso(txt, ano){ var m = String(txt||"").match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/); if(!m) return ""; var y = m[3] ? (m[3].length===2 ? "20"+m[3] : m[3]) : String(ano || new Date().getFullYear()); return y+"-"+p2(m[2])+"-"+p2(m[1]); }

// lê o texto da mensagem (ou do PDF) e devolve {titulo, codigo, descricao, total, pagos, saldo, pagamentos:[{valor, origem, data}]}
function lerOrcamento(txt){
  var t = String(txt||"").replace(/\*/g, "").replace(/\r/g, ""), out = {titulo:"", codigo:"", descricao:"", data:"", placa:"", total:0, pagos:0, saldo:null, pagamentos:[]};
  var linhas = t.split("\n").map(function(l){ return l.trim(); }).filter(Boolean);
  var cab = linhas.find(function(l){ return / - /.test(l) && !/^(Orçamento|Total|Pagamento|Nome|Data|Saldo)/i.test(l); });
  if(cab) out.titulo = cab.split(" - ")[0].replace(/[^\wÀ-ÿ .#/-]/g, "").trim();
  var mo = t.match(/(?:Or[çc]amento|OS)\s*:?\s*(D#\s*\d+)(?:\s*\(([^)]*)\))?/i) || t.match(/(D#\s*\d+)/i);
  if(mo){ out.codigo = mo[1].replace(/\s/g, ""); out.descricao = (mo[2]||"").trim(); }
  var mt = t.match(/^\s*Total\s*:\s*R\$\s*([\d.,]+)/im) || t.match(/TOTAL GERAL\s*\|?\s*([\d.,]+)/i) || t.match(/L\S{0,3}QUIDO\s*\|?\s*([\d.,]+)/i); if(mt) out.total = numBr(mt[1]);
  // ordem de serviço em PDF (sistema da 68 Gang): abertura, veículo, placa e a observação do cliente
  var mab = t.match(/Abertura\s*:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i); if(mab) out.data = dataIso(mab[1]);
  var mv = t.match(/VE\S{0,3}CULO\s*:\s*\|\s*([^|\n]+)/i); if(mv && !out.titulo) out.titulo = mv[1].replace(/^[A-Z]\//, "").replace(/\b(BMW|VW|FIAT|FORD|CHEVROLET|HONDA|TOYOTA)\b\s*/i, "").replace(/\s*\d{4}\/\d{4}\s*$/, "").trim();
  var mpl = t.match(/PLACA\s*:\s*\|\s*([A-Z0-9-]+)/i); if(mpl) out.placa = mpl[1];
  var mob = t.match(/Info Complementar\s*\n([^\n]+)/i); if(mob && !out.descricao && !/^_+/.test(mob[1].trim())) out.descricao = mob[1].trim();
  var mp = t.match(/Total pago\s*:\s*R\$\s*([\d.,]+)/i); if(mp) out.pagos = numBr(mp[1]);
  var ms = t.match(/Saldo restante\s*:\s*R\$\s*([\d.,]+)/i); if(ms) out.saldo = numBr(ms[1]);
  var re = /Pagamento\s*\d+\s*:\s*R\$\s*([\d.,]+)\s*\n\s*Nome\s*:\s*(.+)\n\s*Data\s*:\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi, m;
  while((m = re.exec(t))) out.pagamentos.push({valor:numBr(m[1]), origem:m[2].trim(), data:m[3]});
  return out;
}

// mensagem pronta para o WhatsApp (negrito com asteriscos): cabeçalho, orçamento, total, cada pagamento, total pago e saldo
function msgDivida(prest, dv, bx, repasses){
  var pgs = []; ((bx && bx.cred) || []).forEach(function(c){ if(c.tipo==="desc") return; var r = repasses.find(function(x){ return x.id===c.rid; }); pgs.push({v:c.v, d:c.d, nome:r ? r.origem.replace(/ \(Pix automático\)/, "") : "—"}); });
  pgs.sort(function(a, b){ return a.d.localeCompare(b.d); });
  var desc = ((bx && bx.cred) || []).filter(function(c){ return c.tipo==="desc"; }).reduce(function(t, c){ return t+c.v; }, 0), pagoPix = pgs.reduce(function(t, p){ return t+p.v; }, 0), falta = bx ? Math.max(0, bx.falta) : dv.valor;
  var cab = ((dv.titulo || dv.descricao || "")+" - "+prest.nome.toUpperCase()).replace(/^ - /, "");
  var o = ["*"+cab+"*", ""];
  o.push("*Orçamento:* "+(dv.codigo || (dv.descricao || "—"))+(dv.codigo && dv.descricao ? " ("+dv.descricao+")" : ""));
  o.push("*Total:* "+money(dv.valor));
  if(desc>0.005) o.push("*Desconto:* "+money(desc));
  o.push("");
  pgs.forEach(function(p, k){ o.push("*Pagamento "+(k+1)+":* "+money(p.v)); o.push("*Nome:* "+p.nome); o.push("*Data:* "+curto(p.d)); o.push(""); });
  o.push("*Total pago:* "+money(pagoPix));
  o.push("*Saldo restante:* "+money(falta)+(falta<=0.005 ? " ✅ *QUITADA*" : ""));
  return o.join("\n");
}

// tira o texto de um PDF e devolve uma linha por posição vertical, colunas separadas por " | " (melhor esforço: PDF com texto; PDF escaneado como imagem volta vazio)
async function lerTextoPdf(arquivo){
  var buf = new Uint8Array(await arquivo.arrayBuffer()), bin = ""; for(var i = 0; i<buf.length; i += 8192) bin += String.fromCharCode.apply(null, buf.subarray(i, i+8192));
  var corpos = [bin], re = /stream\r?\n/g, m;
  while((m = re.exec(bin))){ var ini = m.index+m[0].length, fim = bin.indexOf("endstream", ini); if(fim<0) break; re.lastIndex = fim;
    try{ var bytes = Uint8Array.from(bin.slice(ini, fim), function(c){ return c.charCodeAt(0); }); corpos.push(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"))).text()); }catch(x){} }
  var hex = function(h){ var s = ""; for(var k = 0; k+1<h.length; k += 2) s += String.fromCharCode(parseInt(h.substr(k, 2), 16)); return s; };
  var itens = [];
  corpos.forEach(function(tx){ var bt = /BT([\s\S]*?)ET/g, b1; while((b1 = bt.exec(tx))){ var c = b1[1], td = c.match(/([\d.\-]+)\s+([\d.\-]+)\s+Td/), txt = "", op = /<([0-9a-fA-F]*)>\s*Tj|\[([\s\S]*?)\]\s*TJ|\(((?:\\.|[^\\)])*)\)\s*Tj/g, o;
      while((o = op.exec(c))){ if(o[1]!==undefined) txt += hex(o[1]); else if(o[3]!==undefined) txt += o[3].replace(/\\([()\\])/g, "$1"); else { var ar = /<([0-9a-fA-F]*)>|\(((?:\\.|[^\\)])*)\)/g, q; while((q = ar.exec(o[2]))) txt += q[1]!==undefined ? hex(q[1]) : q[2].replace(/\\([()\\])/g, "$1"); } }
      if(txt) itens.push({x:td ? +td[1] : 0, y:td ? +td[2] : 0, t:txt}); } });
  var linhas = {}; itens.forEach(function(it){ var k = Math.round(it.y/3); (linhas[k] = linhas[k] || []).push(it); });
  return Object.keys(linhas).map(Number).sort(function(a1, b1){ return b1-a1; }).map(function(k){ return linhas[k].sort(function(a1, b1){ return a1.x-b1.x; }).map(function(it){ return it.t; }).join(" | "); }).join("\n");
}

export { dataIso, lerOrcamento, msgDivida, lerTextoPdf, money, curto, br };
