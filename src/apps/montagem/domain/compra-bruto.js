// Sorelly Admin · montagem — domain/compra-bruto.js
// Cadastro de peças → Compras (06/11/2026, pedido do Marcus): o fornecedor de bruto (hoje só o Adereço, apelido Point) manda as FOTOS, o Marcus escolhe, o fornecedor gera o ROMANEIO (PDF) e a Sorelly
// leva a foto até o fim: 1 Adereço (fotos + romaneio) → 2 Banho (Pontual) → 3 Recebido (para a Rayssa). Sem tela aqui: só contas puras, testáveis em node.
//   lerRomaneio(linhasDeTexto)   → {controle, emissao, linhas, qtd, total, descPct}   (cada linha: ref, desc, qtd, unM, liqM, total)
//   agruparLinhas(itens)         → linhas de texto a partir dos itens do pdf.js (agrupa pela altura, tolerância de 2,5 pt)
//   ligarFotos(linhas, fotos)    → {linhaId: fotoId}   (código da foto = ref. do romaneio; escolha manual vence)
//   Dinheiro: total em CENTAVOS inteiros; preço unitário e líquido em MILÉSIMOS de real (o romaneio traz 7,425), para não perder casa.
var BANHOS_PADRAO = ["Prata", "Ouro flash", "Ouro 1", "Ouro 2", "Ouro 3", "Ouro 4", "Ouro 5"];
var DESC_PADRAO = 0.25;   // desconto do romaneio do Adereço (25%); a compra guarda o valor lido do PDF

function brNum(t){   // "3.175,20" → 3175.2 ; "7,425" → 7.425 ; "504" → 504 ; lixo → NaN
  var s = String(t==null ? "" : t).trim(); if(!/^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$/.test(s)) return NaN;
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}
function centavos(n){ return Math.round(n*100); }
function milesimos(n){ return Math.round(n*1000); }

// itens do pdf.js [{s, x, y}] → linhas de texto. Cada produto do romaneio sai em DUAS linhas quase juntas (~1 pt de diferença): a tolerância de 2,5 pt as junta.
function agruparLinhas(itens){
  var ordem = itens.filter(function(i){ return String(i.s).trim(); }).sort(function(a, b){ return b.y-a.y || a.x-b.x; }), grupos = [];
  ordem.forEach(function(i){
    var g = grupos.length ? grupos[grupos.length-1] : null;
    if(g && Math.abs(g.y-i.y) <= 2.5) g.it.push(i); else grupos.push({y:i.y, it:[i]});
  });
  return grupos.map(function(g){ return g.it.sort(function(a, b){ return a.x-b.x; }).map(function(i){ return String(i.s).trim(); }).join(" ").replace(/\s+/g, " ").trim(); });
}

var RE_COD = /^\d\d\.\d{5}\.\d\.\d\d$/;
function lerRomaneio(linhas){
  var out = {controle:"", emissao:"", linhas:[], qtd:0, total:0, descPct:0}, texto = linhas.join("\n");
  var m = /Controle:\s*(\d+)/i.exec(texto); if(m) out.controle = m[1];
  m = /Data Emiss[ãa]o:\s*(\d\d)\/(\d\d)\/(\d{4})/i.exec(texto); if(m) out.emissao = m[3]+"-"+m[2]+"-"+m[1];
  linhas.forEach(function(ln){
    var t = ln.split(/\s+/); if(!RE_COD.test(t[0] || "")) return;
    // do fim para o começo: Total, V. Liq., Desc., Un., Peso Un, Peso Tot., Qtde. — o que sobra no meio é a ref. e a descrição
    var tail = t.slice(-7).map(brNum); if(tail.length<7 || tail.some(function(n){ return isNaN(n); })) return;
    var meio = t.slice(1, t.length-7); if(!meio.length) return;
    var qtd = tail[0], un = tail[3], desc = tail[4], liq = tail[5], tot = tail[6];
    if(qtd<=0 || Math.round(qtd)!==qtd) return;
    out.linhas.push({cod:t[0], ref:meio[0], desc:meio.slice(1).join(" "), qtd:qtd, unM:milesimos(un), liqM:milesimos(liq), total:centavos(tot), descPct:un>0 ? Math.round(desc/un*100)/100 : 0});
  });
  out.qtd = out.linhas.reduce(function(s, l){ return s+l.qtd; }, 0);
  out.total = out.linhas.reduce(function(s, l){ return s+l.total; }, 0);
  var ref = out.linhas.find(function(l){ return l.descPct>0; }); out.descPct = ref ? ref.descPct : 0;
  return out;
}
// bate com o rodapé do PDF ("Total: 9.468,00" e "Total 1260") — avisa quando a soma das linhas não fecha
function conferirRomaneio(linhas, rom){
  var texto = linhas.join("\n"), aviso = [], mt = /Total:\s*(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(texto), mq = /Total\s+(\d+)\s*$/m.exec(texto);
  if(mt && centavos(brNum(mt[1]))!==rom.total) aviso.push("A soma das linhas dá R$ "+reais(rom.total)+" e o PDF diz R$ "+mt[1]+".");
  if(mq && +mq[1]!==rom.qtd) aviso.push("A soma das peças dá "+rom.qtd+" e o PDF diz "+mq[1]+".");
  return aviso;
}

// ── fotos ──
function normCodigo(t){ return String(t||"").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/CM$/, ""); }
function baseCodigo(t){ return normCodigo(String(t||"").split("-")[0]); }
// 1) código com tamanho (PA3578-40cm = PA3578 40) · 2) código simples · 3) só o código-base da foto, se for único. Escolha manual (manual[linhaId] = fotoId ou "-") vence.
function ligarFotos(linhas, fotos, manual){
  var res = {}, man = manual || {};
  linhas.forEach(function(l){
    if(man[l.id]!==undefined){ res[l.id] = man[l.id]==="-" ? "" : man[l.id]; return; }
    var alvo = normCodigo(l.ref), f = fotos.find(function(x){ return normCodigo(x.codigo)===alvo; });
    if(!f){ var base = fotos.filter(function(x){ return baseCodigo(x.codigo)===alvo; }); if(base.length===1) f = base[0]; }
    if(!f){ var cand = fotos.filter(function(x){ var b = baseCodigo(x.codigo); return b && alvo.indexOf(b)===0 && alvo.length>b.length; }); if(cand.length===1) f = cand[0]; }   // foto só com o código-base, linha com tamanho
    res[l.id] = f ? f.id : "";
  });
  return res;
}

// ── dinheiro ──
function reais(c){ return (c/100).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function reaisM(m){ var n = m/1000, tres = Math.round(m)%10!==0; return n.toLocaleString("pt-BR", {minimumFractionDigits:tres ? 3 : 2, maximumFractionDigits:3}); }   // 7,425 mostra as 3 casas; 9,90 mostra 2
// o preço escrito na foto ("11/30" = R$ 11,30; "6/80" = R$ 6,80) em milésimos; vazio ou inválido = 0
function precoDaFoto(t){
  var s = String(t||"").trim().replace(",", "/").replace(/\./g, "/"), p = s.split("/");
  if(p.length===2 && /^\d+$/.test(p[0]) && /^\d{1,2}$/.test(p[1])) return milesimos(parseInt(p[0], 10)+parseInt((p[1]+"0").slice(0, 2), 10)/100);
  var n = brNum(s.replace("/", ",")); return isNaN(n) ? 0 : milesimos(n);
}
function liquidoDaFoto(precoM, descPct){ return Math.round(precoM*(1-descPct)); }

// ── banho ──
function ehOuro(b){ return /^ouro/i.test(String(b||"")); }
function rotuloBanho(b, verniz){ return !b ? "" : (verniz && ehOuro(b) ? b+" + verniz" : b); }

// ── recebido ──
function recebidoDe(l){ var v = l.recebido; return v===undefined || v===null || String(v).trim()==="" ? l.qtd : Math.max(0, Math.round(Number(v)||0)); }
function diferenca(l){ if(l.recebido===undefined || l.recebido===null || String(l.recebido).trim()==="") return null; return recebidoDe(l)-l.qtd; }

export { BANHOS_PADRAO, DESC_PADRAO, brNum, agruparLinhas, lerRomaneio, conferirRomaneio, normCodigo, baseCodigo, ligarFotos, reais, reaisM, precoDaFoto, liquidoDaFoto, ehOuro, rotuloBanho, recebidoDe, diferenca };
