// Sorelly Admin · montagem — lib/anexo.js
// Anexar arquivo a um módulo (04/11/2026; hoje o romaneio dos pedidos de bruto). O arquivo vai para o servidor (tabela sorelly.anexo_modulo, rota /api/anexos) e o módulo guarda só a chave.
//   lerArquivo(arq)            → Promise de {nome, mime, url}: foto vira JPEG pequeno; PDF segue como está. Recusa o que não é foto nem PDF e o que ficaria grande demais.
//   enviarAnexo(modulo, arq)   → Promise de {key, nome, mime, tam} depois de gravar no servidor
//   abrirAnexo(key)            → baixa o arquivo e abre numa aba nova
import { chamar } from "@/apps/montagem/lib/api";

var LIMITE = 3.8 * 1024 * 1024;   // caracteres do data URL; o servidor aceita até 3,9 milhões
function msg(t){ return new Error(t); }

function paraJpeg(url){
  return new Promise(function(res, rej){
    var img = new Image();
    img.onload = function(){
      var tentativas = [[1800, 0.82], [1400, 0.7], [1000, 0.6]], i = 0;
      (function tenta(){
        var k = Math.min(1, tentativas[i][0]/Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width*k)); c.height = Math.max(1, Math.round(img.height*k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        var u = c.toDataURL("image/jpeg", tentativas[i][1]);
        if(u.length <= LIMITE || i===tentativas.length-1){ if(u.length > LIMITE) rej(msg("A foto ficou grande demais. Tire outra com menos qualidade.")); else res(u); return; }
        i++; tenta();
      })();
    };
    img.onerror = function(){ rej(msg("Não consegui abrir essa imagem.")); };
    img.src = url;
  });
}

export function lerArquivo(arq){
  return new Promise(function(res, rej){
    if(!arq) return rej(msg("Nenhum arquivo escolhido."));
    var ehPdf = arq.type==="application/pdf" || /\.pdf$/i.test(arq.name||""), ehImg = /^image\//.test(arq.type||"");
    if(!ehPdf && !ehImg) return rej(msg("Só foto ou PDF."));
    var r = new FileReader();
    r.onerror = function(){ rej(msg("Não consegui ler o arquivo.")); };
    r.onload = function(){
      var url = String(r.result);
      if(ehPdf){ if(!/^data:application\/pdf;base64,/.test(url)) url = "data:application/pdf;base64,"+url.split(",")[1]; if(url.length > LIMITE) return rej(msg("O PDF é grande demais (máximo uns 2,8 MB). Reduza o arquivo ou envie uma foto.")); return res({nome:arq.name || "romaneio.pdf", mime:"application/pdf", url:url}); }
      paraJpeg(url).then(function(u){ res({nome:(arq.name || "romaneio").replace(/\.[a-z0-9]+$/i, "")+".jpg", mime:"image/jpeg", url:u}); }, rej);
    };
    r.readAsDataURL(arq);
  });
}

function chaveNova(){ return "an_"+Math.random().toString(36).slice(2, 12)+Date.now().toString(36).slice(-6); }

export function enviarAnexo(modulo, a){
  var key = chaveNova();
  return chamar("POST", "/anexos", {modulo:modulo, key:key, nome:a.nome, mime:a.mime, url:a.url}).then(function(){ return {key:key, nome:a.nome, mime:a.mime, tam:Math.round(a.url.length*0.75)}; });
}

export function abrirAnexo(key){
  return chamar("GET", "/anexos/"+encodeURIComponent(key)).then(function(r){
    return fetch(r.url).then(function(b){ return b.blob(); }).then(function(blob){
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.target = "_blank"; a.rel = "noopener"; a.download = ""; a.removeAttribute("download");
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000);
    });
  });
}
