// Sorelly Admin · montagem — lib/indicacoes-servidor.js
// Indicações AO VIVO (19/11/2026): com servidor e login, o estado s.ind vem de /api/indicacoes/estado (app + banco deste sistema), não do navegador nem do módulo "ind".
//   useIndAoVivo(ativo)        telas de Indicações e o Brinde de indicação do Atendimento Sorelly: lê ao abrir e a cada 60 s (aba escondida não lê)
//   enviarAcaoInd(a, d)        as ações {type:"IND", op, ...} vão para /api/indicacoes/acao; a resposta traz a mensagem e o estado novo (App.js desvia o dispatch para cá)
//   useBuscaRevendedoras(q, on) busca de revendedora no app (todas, não só as que têm moedas), com a DevMaster de reserva
// Sem servidor (modo navegador) nada muda: as telas usam o s.ind local, como antes.
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { abaVisivel } from "@/apps/montagem/lib/aba-visivel";
import { use } from "@/apps/montagem/state/context";
import { useEffect, useState } from "@/shared/react";

var G = {em:0, lendo:null, versaoArquivo:""};   // versaoArquivo: a planilha antiga só vem de novo quando muda
function indAoVivo(){ return apiAtiva() && !!token(); }
function carregarInd(d, forcar){
  if(!indAoVivo()) return Promise.resolve(false);
  if(G.lendo) return G.lendo;
  if(!forcar && Date.now()-G.em<30000) return Promise.resolve(true);
  var q = "/indicacoes/estado?arquivo="+encodeURIComponent(G.versaoArquivo||"")+(forcar ? "&atualizar=1" : "");
  G.lendo = chamar("GET", q).then(function(j){ G.em = Date.now(); if(j && j.ind){ G.versaoArquivo = j.ind.arquivoVersao||""; d({type:"IND_SERVIDOR", ind:j.ind}); } return true; },
    function(x){ G.em = Date.now(); d({type:"IND_SERVIDOR", erro:(x && x.message) || "Não foi possível ler as indicações."}); return false; })
    .then(function(r){ G.lendo = null; return r; });
  return G.lendo;
}
// ativo:false = a tela não precisa agora (ex.: atendimento que não é de indicação)
function useIndAoVivo(ativo){
  var cx = use(), on = ativo!==false && indAoVivo(), ind = cx.state.ind || {};
  useEffect(function(){
    if(!on) return undefined;
    carregarInd(cx.dispatch);
    var iv = setInterval(function(){ if(abaVisivel()) carregarInd(cx.dispatch); }, 60000);
    return function(){ clearInterval(iv); };
  }, [on]);   // eslint-disable-line react-hooks/exhaustive-deps
  return {aoVivo:on, pronto:!on || !!ind.aoVivo, erro:on ? (ind.erroServidor || null) : null, atualizar:function(){ return carregarInd(cx.dispatch, true); }};
}
// devolve uma promessa: true = deu certo (a tela pode fechar a janela ou seguir para o próximo passo)
function enviarAcaoInd(a, d){
  var corpo = Object.assign({}, a); delete corpo.type; corpo.arquivoVersao = G.versaoArquivo || "";
  return chamar("POST", "/indicacoes/acao", corpo).then(function(j){
    if(j && j.ind){ G.em = Date.now(); G.versaoArquivo = j.ind.arquivoVersao || G.versaoArquivo; }
    d({type:"IND_SERVIDOR", ind:(j && j.ind) || null, msg:j && j.msg});
    if(!(j && j.ind)) carregarInd(d, true);
    return true;
  }, function(x){ d({type:"IND_SERVIDOR", msg:(x && x.message) || "Não deu certo. Tente de novo.", tom:"alerta"}); return false; });
}
// q = texto digitado; on = só busca no servidor quando as Indicações estão ao vivo. Espera 350 ms depois da última tecla.
function useBuscaRevendedoras(q, on){
  var st = useState({itens:[], carregando:false, fonte:null}), v = st[0], t = String(q || "").trim();
  useEffect(function(){
    if(!on || t.length<2){ st[1]({itens:[], carregando:false, fonte:null}); return undefined; }
    var vivo = true; st[1](function(o){ return {itens:o.itens, carregando:true, fonte:o.fonte}; });
    var tm = setTimeout(function(){
      chamar("GET", "/indicacoes/revendedoras?busca="+encodeURIComponent(t)).then(function(j){ if(vivo) st[1]({itens:(j && j.itens) || [], carregando:false, fonte:j && j.fonte}); },
        function(){ if(vivo) st[1]({itens:[], carregando:false, fonte:null}); });
    }, 350);
    return function(){ vivo = false; clearTimeout(tm); };
  }, [t, on]);   // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

export { indAoVivo, carregarInd, useIndAoVivo, enviarAcaoInd, useBuscaRevendedoras };
