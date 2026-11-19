// Sorelly Admin · montagem — lib/prefs-app.js
// Preferências do kit lidas DIRETO do app da revendedora (só leitura), para a janela de montagem e o celular da montadora.
// 16/11/2026 (Marcus: "precisa se conectar para pegar as preferências"): antes a montagem só enxergava 31 revendedoras (módulo s.pk); o app tem 2.045 com respostas e 308 com fotos.
// Uma leitura só para todas as telas: GET /api/preferencias-app (o servidor guarda no banco e relê o app no máximo 1 vez por dia). Fica só em memória; relê a cada 10 minutos.
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEffect, useState } from "@/shared/react";

var PRAZO = 10 * 60 * 1000;
var C = {mapa:null, quando:0, carregando:false, ouvintes:[]};
var chave = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };
var avisa = function(){ C.ouvintes.slice().forEach(function(f){ f(); }); };

function carregarPrefsApp(){
  if(!apiAtiva() || C.carregando || (C.mapa && Date.now()-C.quando < PRAZO)) return;
  C.carregando = true;
  chamar("GET", "/preferencias-app").then(function(j){
    var m = {};
    ((j && j.revendedoras) || []).forEach(function(r){ if(r && r.nome && r.preferencias && !m[chave(r.nome)]) m[chave(r.nome)] = {id:r.id, nome:r.nome, cidade:r.cidade||"", estado:r.estado||"", preferencias:r.preferencias}; });
    C.mapa = m; C.quando = (j && j.status && j.status.rodando) ? Date.now()-PRAZO+30000 : Date.now();   // lendo o app agora: pergunta de novo em 30 s
    C.carregando = false; avisa();
  }).catch(function(){ C.carregando = false; C.quando = Date.now()-PRAZO+60000; if(!C.mapa) C.mapa = {}; avisa(); });
}

// a revendedora do app com preferências respondidas (pelo nome, sem acento nem caixa), ou null
function prefDoApp(nome){ return C.mapa ? (C.mapa[chave(nome)] || null) : null; }

// usar dentro do componente: relê a tela quando a leitura do app chega
function usePrefsApp(){
  var st = useState(0);
  useEffect(function(){
    var f = function(){ st[1](function(n){ return n+1; }); };
    C.ouvintes.push(f); carregarPrefsApp();
    return function(){ C.ouvintes = C.ouvintes.filter(function(x){ return x!==f; }); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- st é estado fixo
  return C.mapa !== null;
}

export { prefDoApp, usePrefsApp, carregarPrefsApp };
