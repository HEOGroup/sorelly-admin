// Sorelly Admin · montagem — lib/pdf-pedido.js
// PDF da reposição para a revendedora (17/11/2026, Marcus: "botão que baixa direto o PDF"): o que ela pediu, o que foi separado (foto, código, nome e preço da DevMaster)
// e, para cada foto que ela mandou, a peça que achamos (igual, parecido ou não achou). Sem biblioteca: as páginas são desenhadas num canvas (A4) e viram um PDF simples (uma imagem JPEG por página).
//   gerarPdfPedido(dados)  → Promise<Blob>
//   baixarBlob(blob, nome) → baixa o arquivo na hora
// dados = {titulo, nome, data, atende, pedido:[texto de cada item], grupos:[{nome, pecas:[peca]}], total:{qtd, valor}, imagem:{anexo(key), peca(cod)}}  (versão simples: fotos inteiras, três por linha; peça sem foto sai só como texto)
// peca = {cod, desc, preco, achou, anexo (foto do celular, opcional)}   (imagem.* devolvem Promise de data URL ou "")
var L = 1240, A = 1754, M = 70, CW = L - 2*M;
var AZUL = "#1d2c4d", OURO = "#E8B84B", TEXTO = "#14233f", SUAVE = "#5a6578", LINHA = "#d5d9e2", FUNDO = "#f4f6fa";
var COR_RES = {igual:"#15803d", parecido:"#b45309", nao:"#b91c1c"}, ROT_RES = {igual:"ACHOU IGUAL", parecido:"ACHOU PARECIDO", nao:"NÃO ACHOU"};
var FONTE = "Inter, Arial, Helvetica, sans-serif";

function frase(t){ var x = String(t || "").toLowerCase().replace(/\b(folhead[oa]s?|banhad[oa]s?)\b/g, " ").replace(/\s+/g, " ").trim(); return x.charAt(0).toUpperCase()+x.slice(1); }   // REGRA (Marcus, 17/11/2026): nome da peça em letra normal e SEM "folheado" nem "banhado" (todas são, não precisa escrever)
function reais(n){ return "R$ "+Number(n || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

function carregar(url){
  return new Promise(function(res){
    if(!url) return res(null);
    var img = new Image(); img.onload = function(){ res(img); }; img.onerror = function(){ res(null); }; img.src = url;
  });
}

function Folha(titulo){
  var self = this; this.paginas = []; this.titulo = titulo; this.y = 0; this.c = null; this.cv = null;
  this.nova = function(primeira){
    var cv = document.createElement("canvas"); cv.width = L; cv.height = A;
    var c = cv.getContext("2d"); c.fillStyle = "#ffffff"; c.fillRect(0, 0, L, A);
    self.paginas.push(cv); self.cv = cv; self.c = c;
    if(!primeira){
      c.fillStyle = AZUL; c.fillRect(0, 0, L, 64);
      c.fillStyle = "#ffffff"; c.font = "bold 22px "+FONTE; c.textBaseline = "middle"; c.textAlign = "left"; c.fillText(self.titulo, M, 33);
      c.textAlign = "right"; c.fillStyle = OURO; c.fillText("Página "+self.paginas.length, L - M, 33);
      self.y = 110;
    }
  };
  this.cabe = function(h){ if(self.y + h > A - 70) self.nova(false); };
  // texto com quebra de linha; devolve a altura usada
  this.texto = function(t, x, y, o){
    o = o || {}; var c = self.c, tam = o.tam || 24, alt = o.alt || Math.round(tam*1.3), maxW = o.maxW || (CW - (x - M));
    c.font = (o.negrito ? "bold " : "")+tam+"px "+FONTE; c.fillStyle = o.cor || TEXTO; c.textBaseline = "top"; c.textAlign = o.centro ? "center" : "left";
    var palavras = String(t || "").split(/\s+/), linha = "", linhas = [];
    palavras.forEach(function(p){ var teste = linha ? linha+" "+p : p; if(c.measureText(teste).width > maxW && linha){ linhas.push(linha); linha = p; } else linha = teste; });
    if(linha) linhas.push(linha);
    if(o.maxLinhas && linhas.length > o.maxLinhas) linhas = linhas.slice(0, o.maxLinhas);
    linhas.forEach(function(l, i){ c.fillText(l, o.centro ? x + maxW/2 : x, y + i*alt); });
    return linhas.length*alt;
  };
  // foto cortada para preencher o quadro (sem deformar)
  this.foto = function(img, x, y, w, h){
    var c = self.c; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = FUNDO; c.fillRect(x, y, w, h);
    if(img){ var k = Math.max(w/img.width, h/img.height), dw = img.width*k, dh = img.height*k; c.drawImage(img, x + (w-dw)/2, y + (h-dh)/2, dw, dh); }
    c.restore(); c.strokeStyle = LINHA; c.lineWidth = 2; c.strokeRect(x, y, w, h);
  };
  this.titulo2 = function(t){
    self.cabe(90); var c = self.c;
    c.fillStyle = AZUL; c.fillRect(M, self.y, CW, 46); c.fillStyle = "#ffffff"; c.font = "bold 22px "+FONTE; c.textBaseline = "middle"; c.textAlign = "left"; c.fillText(t.toUpperCase(), M + 16, self.y + 24);
    self.y += 66;
  };
}

// data URL → bytes do JPEG
function bytesDe(dataUrl){ var b = atob(dataUrl.split(",")[1]), u = new Uint8Array(b.length); for(var i = 0; i<b.length; i++) u[i] = b.charCodeAt(i); return u; }

function montarPdf(paginas){
  var partes = [], pos = 0, offs = [];
  var enc = new TextEncoder();
  function poe(x){ var b = typeof x === "string" ? enc.encode(x) : x; partes.push(b); pos += b.length; }
  function obj(n, corpo){ offs[n] = pos; poe(n+" 0 obj\n"); poe(corpo); poe("\nendobj\n"); }
  poe("%PDF-1.4\n%âãÏÓ\n");
  var n = paginas.length, kids = [];
  for(var i = 0; i<n; i++) kids.push((3 + i*3)+" 0 R");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids ["+kids.join(" ")+"] /Count "+n+" >>");
  paginas.forEach(function(cv, i){
    var base = 3 + i*3, jpg = bytesDe(cv.toDataURL("image/jpeg", 0.86)), cont = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q";
    obj(base, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 "+(base+2)+" 0 R >> >> /Contents "+(base+1)+" 0 R >>");
    obj(base+1, "<< /Length "+cont.length+" >>\nstream\n"+cont+"\nendstream");
    offs[base+2] = pos; poe((base+2)+" 0 obj\n<< /Type /XObject /Subtype /Image /Width "+cv.width+" /Height "+cv.height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+jpg.length+" >>\nstream\n"); poe(jpg); poe("\nendstream\nendobj\n");
  });
  var total = 3 + n*3, xref = pos;
  poe("xref\n0 "+total+"\n0000000000 65535 f \n");
  for(var k = 1; k<total; k++) poe(String(offs[k]).padStart(10, "0")+" 00000 n \n");
  poe("trailer\n<< /Size "+total+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF");
  return new Blob(partes, {type:"application/pdf"});
}

export function baixarBlob(blob, nome){
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000);
}

export function gerarPdfPedido(d){
  var imagem = d.imagem, cacheP = {}, cacheA = {};
  var daPeca = function(cod){ if(!cacheP[cod]) cacheP[cod] = Promise.resolve(imagem.peca(cod)).then(carregar, function(){ return null; }); return cacheP[cod]; };
  var doAnexo = function(k){ if(!cacheA[k]) cacheA[k] = Promise.resolve(imagem.anexo(k)).then(carregar, function(){ return null; }); return cacheA[k]; };
  var f = new Folha("Sorelly Joias · Reposição de "+d.nome);
  f.nova(true);
  var c = f.c, GAP = 24, COL = (CW - 2*GAP)/3, FOTO_MAX = 340;   // três fotos por linha para o PDF ter poucas páginas
  // cabeçalho simples
  c.fillStyle = AZUL; c.fillRect(0, 0, L, 130);
  c.fillStyle = OURO; c.font = "bold 20px "+FONTE; c.textBaseline = "top"; c.textAlign = "left"; c.fillText("SORELLY JOIAS", M, 28);
  c.fillStyle = "#ffffff"; c.font = "bold 40px "+FONTE; c.fillText("Reposição para "+d.nome, M, 56);
  c.font = "22px "+FONTE; c.fillStyle = "#dfe6f5"; c.fillText(d.data+(d.atende ? " · separado por "+d.atende : "")+" · "+d.total.qtd+(d.total.qtd===1 ? " peça" : " peças")+" · "+reais(d.total.valor), M, 100);
  f.y = 160;
  // o que ela pediu, em poucas linhas
  if(d.pedido.length){
    f.y += f.texto("Você pediu: "+d.pedido.join("  ·  "), M, f.y, {tam:22, alt:30}) + 16;
  }
  // foto inteira, sem cortar e sem moldura preta: devolve o tamanho desenhado
  var fotoInteira = function(img, x, y){
    var k = Math.min(COL/img.width, FOTO_MAX/img.height), w = Math.round(img.width*k), h = Math.round(img.height*k);
    f.c.drawImage(img, x, y, w, h); f.c.strokeStyle = LINHA; f.c.lineWidth = 2; f.c.strokeRect(x, y, w, h);
    return h;
  };
  var corrente = Promise.resolve();
  d.grupos.forEach(function(g){
    corrente = corrente.then(function(){
      return Promise.all(g.pecas.map(function(p){ return p.anexo ? doAnexo(p.anexo) : daPeca(p.cod); })).then(function(imgs){
        var com = [], sem = [];
        g.pecas.forEach(function(p, i){ if(imgs[i]) com.push({p:p, img:imgs[i]}); else sem.push(p); });
        // título do tipo: uma linha (nunca sozinho no pé da página: precisa caber a primeira linha de fotos)
        f.cabe(com.length ? 480 : 160);
        f.c.fillStyle = TEXTO; f.c.fillRect(M, f.y, CW, 2); f.y += 8;
        f.y += f.texto(g.nome+"  ("+g.pecas.length+")", M, f.y, {tam:26, negrito:true}) + 10;
        // peças com foto: duas por linha, fotos grandes
        for(var i = 0; i<com.length; i += 3){
          var par = com.slice(i, i+3), alturas = par.map(function(it){ var k = Math.min(COL/it.img.width, FOTO_MAX/it.img.height); return Math.round(it.img.height*k) + 8 + 26 + 3*21 + 14; }), alt = Math.max.apply(null, alturas);
          f.cabe(alt);
          par.forEach(function(it, j){
            var x = M + j*(COL + GAP), y = f.y, h = fotoInteira(it.img, x, y);
            y += h + 8;
            f.texto(it.p.cod+(it.p.preco ? " · "+reais(it.p.preco) : ""), x, y, {tam:20, negrito:true, maxW:COL}); y += 26;
            f.texto(frase(it.p.desc), x, y, {tam:16, alt:21, cor:SUAVE, maxW:COL, maxLinhas:3});
          });
          f.y += alt;
        }
        // peças sem foto: só a descrição, em texto
        if(sem.length){
          f.cabe(60); f.y += 2;
          sem.forEach(function(p){
            var txt = p.cod+" · "+(p.desc ? frase(p.desc) : "Sem nome")+(p.preco ? " · "+reais(p.preco) : "");
            f.cabe(40); f.y += f.texto(txt, M + 6, f.y, {tam:18, alt:24, maxW:CW - 12}) + 5;
          });
        }
        f.y += 10;
      });
    });
  });
  // total
  corrente = corrente.then(function(){
    f.cabe(60); f.c.fillStyle = TEXTO; f.c.fillRect(M, f.y, CW, 2); f.y += 10;
    f.texto("Total: "+d.total.qtd+(d.total.qtd===1 ? " peça" : " peças")+" · "+reais(d.total.valor), M, f.y, {tam:26, negrito:true});
  });
  return corrente.then(function(){ return montarPdf(f.paginas); });
}
