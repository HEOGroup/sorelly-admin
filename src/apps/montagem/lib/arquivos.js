// Sorelly Admin — lib/arquivos.js
// Guarda arquivos (PDF de contrato assinado, termos, .docx gerados) no próprio navegador (IndexedDB), fora do estado do sistema, que é pequeno.
// Enquanto o sistema não tem servidor, os arquivos ficam só neste computador. Quando for para produção, vão para o armazenamento (S3).

var DB = null;
function abrir(){
  return new Promise(function(res, rej){
    if(DB) return res(DB);
    var rq = indexedDB.open("sorelly_arquivos", 1);
    rq.onupgradeneeded = function(){ rq.result.createObjectStore("f"); };
    rq.onsuccess = function(){ DB = rq.result; res(DB); };
    rq.onerror = function(){ rej(rq.error); };
  });
}
function tx(modo, fn){
  return abrir().then(function(db){ return new Promise(function(res, rej){ var t = db.transaction("f", modo), r = fn(t.objectStore("f")); t.oncomplete = function(){ res(r ? r.result : undefined); }; t.onerror = function(){ rej(t.error); }; }); });
}
var salvarArquivo = function(id, blob){ return tx("readwrite", function(st){ return st.put(blob, id); }); };
var obterArquivo = function(id){ return tx("readonly", function(st){ return st.get(id); }); };
var apagarArquivo = function(id){ return tx("readwrite", function(st){ return st.delete(id); }).catch(function(){}); };
function baixarArquivo(id, nome){
  return obterArquivo(id).then(function(blob){ if(!blob) throw new Error("sem arquivo"); var url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1500); });
}

export { salvarArquivo, obterArquivo, apagarArquivo, baixarArquivo };
