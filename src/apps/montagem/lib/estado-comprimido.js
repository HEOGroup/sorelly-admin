// Sorelly Admin · montagem — lib/estado-comprimido.js
// ESTADO DO SISTEMA NO NAVEGADOR, COMPRIMIDO (Marcus, 02/11/2026): o navegador só deixa guardar uns 5 milhões de letras, e o estado do Admin (dados reais de Link de pagamento, Pagamentos, Compras, Cobrança...) passou de 4 milhões:
// aparecia "Sem espaço para salvar neste navegador". Aqui o texto do estado é comprimido (LZW de 15 bits sobre UTF-8, sem biblioteca) antes de gravar e descomprimido ao ler: costuma ficar de 3 a 8 vezes menor.
// Estado pequeno continua em JSON puro. Quem LÊ a chave sorelly_montagem_v9 (store, Kits novos) usa lerEstado; quem GRAVA usa textoDoEstado. Os dois formatos são aceitos na leitura.
var MARCA = "LZ1:", LIMITE = 32767, CLEAR = 256, PRIMEIRO = 257;

function comprimirTexto(txt){
  var b = new TextEncoder().encode(txt), n = b.length; if(!n) return "";
  var dic = new Map(), prox = PRIMEIRO, saida = [], w = b[0];
  for(var i=1; i<n; i++){
    var c = b[i], k = w*256+c, v = dic.get(k);
    if(v!==undefined){ w = v; continue; }
    saida.push(w); dic.set(k, prox++);
    if(prox>=LIMITE){ saida.push(CLEAR); dic.clear(); prox = PRIMEIRO; }
    w = c;
  }
  saida.push(w);
  var partes = [], passo = 8192;
  for(var j=0; j<saida.length; j+=passo) partes.push(String.fromCharCode.apply(null, saida.slice(j, j+passo)));
  return partes.join("");
}

function descomprimirTexto(s){
  var n = s.length; if(!n) return "";
  var pre = new Int32Array(LIMITE+1), suf = new Uint8Array(LIMITE+1), prox = PRIMEIRO, prev = -1, saida = new Uint8Array(Math.max(1024, n*6)), len = 0, pilha = [];
  var garante = function(mais){ if(len+mais>saida.length){ var g = new Uint8Array(Math.max(saida.length*2, len+mais)); g.set(saida); saida = g; } };
  var expande = function(cod){ pilha.length = 0; while(cod>=PRIMEIRO){ pilha.push(suf[cod]); cod = pre[cod]; } pilha.push(cod); };   // pilha fica do fim para o começo
  for(var i=0; i<n; i++){
    var cod = s.charCodeAt(i);
    if(cod===CLEAR){ prox = PRIMEIRO; prev = -1; continue; }
    if(prev===-1){ garante(1); saida[len++] = cod; prev = cod; continue; }
    var primeiro;
    if(cod<prox){ expande(cod); primeiro = pilha[pilha.length-1]; }
    else { expande(prev); primeiro = pilha[pilha.length-1]; pilha.unshift(primeiro); }   // código ainda não definido: sequência anterior + o primeiro byte dela
    garante(pilha.length); for(var p=pilha.length-1; p>=0; p--) saida[len++] = pilha[p];
    pre[prox] = prev; suf[prox] = primeiro; prox++;
    prev = cod;
  }
  return new TextDecoder().decode(saida.subarray(0, len));
}

// texto pronto para gravar: JSON puro se for pequeno, comprimido se for grande
function textoDoEstado(obj){
  var j = JSON.stringify(obj);
  return j.length>150000 ? MARCA+comprimirTexto(j) : j;
}
// lê o que foi gravado (os dois formatos); devolve null se não der
function lerEstado(raw){
  if(!raw) return null;
  try { return JSON.parse(raw.indexOf(MARCA)===0 ? descomprimirTexto(raw.slice(MARCA.length)) : raw); } catch(x){ return null; }
}

export { comprimirTexto, descomprimirTexto, textoDoEstado, lerEstado };
