// Sorelly Admin · montagem — lib/perfil.js
// Foto e situação (disponível, em reunião, ausente) de cada pessoa, guardadas no servidor (tabela sorelly.conta). Todo mundo logado vê os colegas; cada um muda só a própria.
// Nome e e-mail NÃO mudam por aqui (decisão do Marcus, 27/10/2026): só a Diretoria, na aba Contas.
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { useEffect, useState } from "@/shared/react";

var SITUACOES = {disponivel:["Disponível", "#3ecf8e"], reuniao:["Em reunião", "#f5a524"], ausente:["Ausente", "#8b8b8b"]};
var ORDEM_SIT = ["disponivel", "reuniao", "ausente"];
var memoria = {pessoas:{}, desde:"", meuId:null, ouvintes:[]};   // pessoas: pessoaId -> {nome, foto, situacao, em}
var avisar = function(){ memoria.ouvintes.forEach(function(f){ f(); }); };

function mesclar(lista){
  (lista || []).forEach(function(p){
    if(p.pessoaId==null) return;
    memoria.pessoas[p.pessoaId] = p;
    if(p.em && p.em>memoria.desde) memoria.desde = p.em;
  });
}
// busca só o que mudou desde a última vez (a primeira busca traz todo mundo)
function carregar(){
  if(!apiAtiva() || !token()) return Promise.resolve();
  // cada pedido é independente: se a lista da equipe falhar (ex.: banco ainda sem as colunas do perfil), a barra de cima ainda sabe quem sou eu
  var equipe = chamar("GET", "/perfil/equipe"+(memoria.desde ? "?desde="+encodeURIComponent(memoria.desde) : "")).then(function(r){ mesclar(r.pessoas); }).catch(function(){});
  var eu = memoria.meuId!=null ? Promise.resolve() : chamar("GET", "/auth/eu").then(function(r){ if(r.usuario && r.usuario.pessoaId!=null) memoria.meuId = r.usuario.pessoaId; }).catch(function(){});
  return Promise.all([equipe, eu]).then(avisar);
}
function salvarEu(patch){
  return chamar("PATCH", "/perfil/eu", patch).then(function(r){ mesclar([r.pessoa]); avisar(); return r.pessoa; });
}
// Lê o arquivo e devolve uma foto quadrada de 160 px (JPEG), pequena o bastante para ir ao servidor.
function reduzirFoto(arquivo){
  return new Promise(function(ok, falha){
    var leitor = new FileReader();
    leitor.onerror = function(){ falha(new Error("Não consegui ler a foto.")); };
    leitor.onload = function(){
      var img = new Image();
      img.onerror = function(){ falha(new Error("Este arquivo não é uma imagem.")); };
      img.onload = function(){
        var lado = Math.min(img.width, img.height), c = document.createElement("canvas"); c.width = 160; c.height = 160;
        c.getContext("2d").drawImage(img, (img.width-lado)/2, (img.height-lado)/2, lado, lado, 0, 0, 160, 160);
        ok(c.toDataURL("image/jpeg", 0.78));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// Hook: devolve {pessoas, meuId} e mantém a lista atualizada (a cada 30 s).
function usePerfil(){
  var st = useState(0), tick = st[1];
  useEffect(function(){
    var f = function(){ tick(function(x){ return x+1; }); };
    memoria.ouvintes.push(f);
    carregar();
    var iv = setInterval(carregar, 30000);
    return function(){ memoria.ouvintes = memoria.ouvintes.filter(function(x){ return x!==f; }); clearInterval(iv); };
  }, []);
  return {pessoas:memoria.pessoas, meuId:memoria.meuId};
}

// situação de quem está logado (só Marcus, Nickolas e Lucas podem mudar; os demais ficam sempre disponíveis)
function minhaSituacao(){ var p = memoria.meuId!=null ? memoria.pessoas[memoria.meuId] : null; return (p && p.situacao) || "disponivel"; }
export { minhaSituacao, SITUACOES, ORDEM_SIT, usePerfil, salvarEu, reduzirFoto, carregar };
