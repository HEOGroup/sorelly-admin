// Sorelly Admin · montagem — lib/inicio-setores.js
// Ponte entre o App e a página inicial: o App informa quais setores a pessoa pode abrir (o mesmo cálculo do menu lateral) e registra as telas visitadas.
// Fica fora da tela para a página inicial não repetir a regra de acesso.
var dados = {setores:[]};

// setores já filtrados pelo acesso da pessoa (não inclui o próprio Início)
function definirSetoresInicio(lista){ dados.setores = lista || []; }
function setoresInicio(){ return dados.setores; }

// Telas visitadas recentemente, por pessoa, neste navegador (as 8 últimas).
var chave = function(usuario){ return "sorelly_visitados_"+usuario; };
function registrarVisita(usuario, aba){
  if(!aba || aba==="inicio" || aba==="breve") return;
  try {
    var l = JSON.parse(localStorage.getItem(chave(usuario)) || "[]").filter(function(x){ return x.aba!==aba; });
    l.unshift({aba:aba, em:Date.now()});
    localStorage.setItem(chave(usuario), JSON.stringify(l.slice(0, 8)));
  } catch(x){}
}
function visitados(usuario){ try { return JSON.parse(localStorage.getItem(chave(usuario)) || "[]"); } catch(x){ return []; } }

export { definirSetoresInicio, setoresInicio, registrarVisita, visitados };
