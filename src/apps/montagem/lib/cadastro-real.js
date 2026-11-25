// Sorelly Admin · montagem — lib/cadastro-real.js
// Cadastro de revendedoras AO VIVO (25/11/2026): as telas de Aprovação e de Desempenho do cadastro deixam de usar candidatas digitadas à mão (s.cl.leads)
// e passam a usar os leads reais da Kommo, guardados pelo admin antigo (rotas /api/cadastro/*, src/server/cadastro-aprovacao.js e cadastro-relatorios.js).
// As contas dos painéis continuam as de domain/cadastro-leads.js: aqui só se troca a lista de leads (useCadastroReal) e se buscam o funil da Kommo e as
// campanhas da Meta (useRelatorio). A lista é compartilhada entre as telas e só é baixada de novo quando muda (pergunta a versão a cada 10 s).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { useEffect, useState } from "@/shared/react";

var G = {leads:null, versao:"", ligado:null, gravar:false, erro:"", ouvintes:[], buscando:null};
function avisar(){ var t = Date.now(); G.ouvintes.slice().forEach(function(f){ f(t); }); }
function atualizar(forcar){
  if(!apiAtiva() || !token()){ G.ligado = false; avisar(); return Promise.resolve(); }
  if(G.buscando) return G.buscando;
  G.buscando = chamar("GET", "/cadastro/leads"+(G.versao && !forcar ? "?versao="+encodeURIComponent(G.versao) : ""))
    .then(function(r){ G.ligado = !!r.ligado; G.gravar = !!r.gravar; G.erro = ""; if(!r.igual){ G.leads = r.leads||[]; G.versao = r.versao||""; } })
    .catch(function(e){ G.erro = (e && e.message) || "Não consegui ler os cadastros."; })
    .then(function(){ G.buscando = null; avisar(); });
  return G.buscando;
}

// usar no alto das telas: var r = useCadastroReal(s.cl) → r.cl (o s.cl com os leads reais), r.ligado, r.gravar, r.erro, r.carregando, r.recarregar()
function useCadastroReal(clLocal, intervalo){
  var st = useState(0), set = st[1];
  useEffect(function(){
    G.ouvintes.push(set); atualizar();
    var t = setInterval(function(){ atualizar(); }, intervalo || 10000);
    return function(){ clearInterval(t); G.ouvintes = G.ouvintes.filter(function(x){ return x!==set; }); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return {cl:Object.assign({}, clLocal, {leads:G.leads || []}), ligado:G.ligado, gravar:G.gravar, erro:G.erro, carregando:G.leads===null && G.ligado!==false && !G.erro, recarregar:function(){ return atualizar(true); }};
}

// decisão: acao = "aprovar" | "reprovar" | "desfazer" (aprovar leva opcao, valorCasa, valorEmpresa e nota). Grava na Kommo e no admin antigo; depois relê a lista.
function decidirCadastro(id, dados){ return chamar("POST", "/cadastro/leads/"+id, dados).then(function(r){ return atualizar(true).then(function(){ return r; }); }); }
// cadastro completo (fotos e observações) de um lead antigo, que a lista traz resumido
function buscarCadastro(id){ return chamar("GET", "/cadastro/leads/"+id); }

// relatórios ao vivo (funil da Kommo, campanhas e anúncios da Meta): guarda 5 minutos por endereço
var R = {};
function lerRelatorio(caminho, forcar){
  var c = R[caminho];
  if(c && !forcar && (c.buscando || Date.now()-c.em < 300000)) return c.buscando || Promise.resolve(c);
  var novo = R[caminho] = {dados:c ? c.dados : null, erro:"", em:0};
  novo.buscando = chamar("GET", caminho).then(function(d){ novo.dados = d; novo.erro = ""; }).catch(function(e){ novo.erro = (e && e.message) || "Não consegui ler."; })
    .then(function(){ novo.em = Date.now(); novo.buscando = null; avisar(); return novo; });
  return novo.buscando;
}
// caminho null = nada a buscar. Devolve {dados, erro, carregando, recarregar}
function useRelatorio(caminho){
  var st = useState(0), set = st[1];
  useEffect(function(){ G.ouvintes.push(set); return function(){ G.ouvintes = G.ouvintes.filter(function(x){ return x!==set; }); }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(caminho && apiAtiva() && token()) lerRelatorio(caminho); }, [caminho]);
  var c = caminho ? R[caminho] : null;
  return {dados:c ? c.dados : null, erro:c ? c.erro : "", carregando:!!caminho && (!c || !!c.buscando), recarregar:function(){ if(caminho) lerRelatorio(caminho, true); }};
}
// período das telas ({from, to, tudo}) → "?de=&ate=" (sem datas = tudo)
function qsPeriodo(j){ return j && !j.tudo && j.from && j.to ? "?de="+j.from+"&ate="+j.to : ""; }

export { useCadastroReal, decidirCadastro, buscarCadastro, useRelatorio, qsPeriodo };
