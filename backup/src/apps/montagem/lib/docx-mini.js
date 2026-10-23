// Sorelly Admin — lib/docx-mini.js
// Gera um arquivo .docx (documento do Word) direto no navegador, sem biblioteca: converte o HTML do modelo de contrato em parágrafos e empacota num .zip simples.
// Suporta título (h1 a h3), parágrafo, negrito, itálico, sublinhado, alinhamento, listas (• e 1.), quebra de linha. Também troca as variáveis do modelo pelos valores digitados.

var NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
var esc = function(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };

// ---------- HTML do modelo: troca as variáveis <span data-variable-key="x"> pelo valor (ou [x] se vazio)
function mesclarVariaveis(html, valores){
  var doc = new DOMParser().parseFromString("<div id=\"raiz\">"+html+"</div>", "text/html"), raiz = doc.getElementById("raiz");
  raiz.querySelectorAll("span[data-variable-key]").forEach(function(sp){ var k = sp.getAttribute("data-variable-key") || "", v = String((valores||{})[k]||"").trim(); sp.replaceWith(doc.createTextNode(v || "["+k+"]")); });
  return raiz.innerHTML;
}

// ---------- HTML -> parágrafos
function runsDe(no, marcas){
  var out = [];
  no.childNodes.forEach(function(n){
    if(n.nodeType===3){ if(n.nodeValue) out.push({t:n.nodeValue, b:marcas.b, i:marcas.i, u:marcas.u}); return; }
    if(n.nodeType!==1) return; var tag = n.tagName.toUpperCase();
    if(tag==="BR"){ out.push({br:true}); return; }
    var m = {b:marcas.b || tag==="STRONG" || tag==="B", i:marcas.i || tag==="EM" || tag==="I", u:marcas.u || tag==="U"};
    out = out.concat(runsDe(n, m)); });
  return out;
}
var alinhamento = function(el){ var st = (el.getAttribute && el.getAttribute("style")) || "", m = /text-align:\s*(left|center|right|justify)/i.exec(st); return m ? m[1].toLowerCase() : (el.getAttribute && el.getAttribute("align")) || ""; };
function paragrafosDe(no){
  var out = [];
  no.childNodes.forEach(function(n){
    if(n.nodeType===3){ var t = n.nodeValue.trim(); if(t) out.push({tipo:"p", runs:[{t:t}]}); return; }
    if(n.nodeType!==1) return; var tag = n.tagName.toUpperCase();
    if(tag==="H1" || tag==="H2" || tag==="H3"){ out.push({tipo:tag.toLowerCase(), ali:alinhamento(n), runs:runsDe(n, {})}); return; }
    if(tag==="P"){ out.push({tipo:"p", ali:alinhamento(n), runs:runsDe(n, {})}); return; }
    if(tag==="UL" || tag==="OL"){ var k = 0; n.childNodes.forEach(function(li){ if(li.nodeType===1 && li.tagName.toUpperCase()==="LI"){ k++; out.push({tipo:"li", ali:alinhamento(li), prefixo:tag==="OL" ? k+". " : "• ", runs:runsDe(li, {})}); } }); return; }
    out = out.concat(paragrafosDe(n)); });   // div e outros: desce
  return out;
}

// ---------- parágrafos -> document.xml
var TAM = {h1:32, h2:28, h3:24};
function xmlRun(r){
  if(r.br) return "<w:r><w:br/></w:r>";
  var pr = (r.b ? "<w:b/>" : "")+(r.i ? "<w:i/>" : "")+(r.sz ? "<w:sz w:val=\""+r.sz+"\"/>" : "")+(r.u ? "<w:u w:val=\"single\"/>" : "");   // ordem exigida pelo Word: negrito, itálico, tamanho, sublinhado
  return "<w:r>"+(pr ? "<w:rPr>"+pr+"</w:rPr>" : "")+"<w:t xml:space=\"preserve\">"+esc(r.t)+"</w:t></w:r>";
}
function xmlParagrafo(p){
  var jc = {center:"center", right:"right", justify:"both"}[p.ali||""], pPr = "";
  if(p.tipo==="li") pPr += "<w:ind w:left=\"720\" w:hanging=\"360\"/>";
  if(TAM[p.tipo]) pPr += "<w:keepNext/><w:spacing w:before=\"240\" w:after=\"120\"/>";
  if(jc) pPr += "<w:jc w:val=\""+jc+"\"/>";
  var runs = p.runs.map(function(r){ return TAM[p.tipo] && !r.br ? Object.assign({}, r, {b:true, sz:TAM[p.tipo]}) : r; });
  if(p.prefixo) runs.unshift({t:p.prefixo});
  return "<w:p>"+(pPr ? "<w:pPr>"+pPr+"</w:pPr>" : "")+runs.map(xmlRun).join("")+"</w:p>";
}
function documentoXml(paras){
  return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document xmlns:w=\""+NS+"\"><w:body>"+(paras.length ? paras.map(xmlParagrafo).join("") : "<w:p/>")+"<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\"/><w:pgMar w:top=\"1417\" w:right=\"1134\" w:bottom=\"1417\" w:left=\"1134\" w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/></w:sectPr></w:body></w:document>";
}

// ---------- .zip (sem compressão)
function crc32(buf){
  var t = crc32.t || (crc32.t = (function(){ var a = [], c, n, k; for(n=0; n<256; n++){ c = n; for(k=0; k<8; k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1; a[n] = c>>>0; } return a; })()), c2 = 0xFFFFFFFF;
  for(var i=0; i<buf.length; i++) c2 = t[(c2^buf[i])&255]^(c2>>>8);
  return (c2^0xFFFFFFFF)>>>0;
}
function zip(arquivos, tipo){
  var enc = new TextEncoder(), partes = [], central = [], off = 0;
  arquivos.forEach(function(f){
    var nome = enc.encode(f.nome), dados = enc.encode(f.texto), crc = crc32(dados), tam = dados.length, lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, tam, true); lh.setUint32(22, tam, true); lh.setUint16(26, nome.length, true);
    partes.push(new Uint8Array(lh.buffer), nome, dados);
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, tam, true); ch.setUint32(24, tam, true); ch.setUint16(28, nome.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nome); off += 30+nome.length+tam; });
  var tamC = central.reduce(function(t, p){ return t+p.length; }, 0), eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true); eo.setUint16(8, arquivos.length, true); eo.setUint16(10, arquivos.length, true); eo.setUint32(12, tamC, true); eo.setUint32(16, off, true);
  return new Blob(partes.concat(central, [new Uint8Array(eo.buffer)]), {type:tipo});
}
function docxDeParagrafos(paras){
  return zip([
    {nome:"[Content_Types].xml", texto:"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/></Types>"},
    {nome:"_rels/.rels", texto:"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/></Relationships>"},
    {nome:"word/document.xml", texto:documentoXml(paras)}], "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}
// HTML (já com as variáveis trocadas) -> Blob .docx
function htmlParaDocx(html){
  var doc = new DOMParser().parseFromString("<div id=\"raiz\">"+html+"</div>", "text/html");
  return docxDeParagrafos(paragrafosDe(doc.getElementById("raiz")));
}
function baixarBlob(blob, nome){
  var url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
}

export { mesclarVariaveis, htmlParaDocx, docxDeParagrafos, documentoXml, baixarBlob };
