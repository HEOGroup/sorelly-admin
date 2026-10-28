// Sorelly Admin · montagem — lib/api.js
// Conversa com o servidor (pasta servidor/). LIGADO só quando existe o endereço do servidor: variável VITE_API_URL na hora de gerar o sistema, ou (para testar) localStorage "sorelly_api_url".
// Sem endereço = modo antigo: tudo guardado no navegador, sem login. O token do login fica no navegador e vai em cada pedido.
var CHAVE_TOKEN = "sorelly_token";

function base(){
  try { var o = localStorage.getItem("sorelly_api_url"); if(o) return o.replace(/\/$/, ""); } catch(x){}
  return String((process.env.NEXT_PUBLIC_API_URL) || "").replace(/\/$/, "");
}
function apiAtiva(){ return !!base(); }
function token(){ try { return localStorage.getItem(CHAVE_TOKEN) || ""; } catch(x){ return ""; } }
function guardaToken(t){ try { if(t) localStorage.setItem(CHAVE_TOKEN, t); else localStorage.removeItem(CHAVE_TOKEN); } catch(x){} }

// metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; devolve o JSON ou joga Error com a mensagem do servidor
async function chamar(metodo, caminho, corpo){
  var h = {"content-type":"application/json"}; if(token()) h.authorization = "Bearer "+token();
  var r;
  try { r = await fetch(base()+caminho, {method:metodo, headers:h, body:corpo!==undefined ? JSON.stringify(corpo) : undefined}); }
  catch(x){ throw new Error("Sem conexão com o servidor."); }
  var j = await r.json().catch(function(){ return {}; });
  if(r.status===401 && caminho!=="/auth/login"){ guardaToken(""); window.dispatchEvent(new Event("sorelly-saiu")); }
  if(!r.ok) throw new Error(j.erro || ("Erro "+r.status));
  return j;
}
// Perfil da conta que entrou (ADMIN = Diretoria). Só serve para a tela decidir se mostra a troca de pessoa; quem manda de verdade é o servidor.
// Conta que entrou, guardada para a tela decidir o que mostrar (ADMIN = Diretoria; abas = telas liberadas; ocultar = setores escondidos). Quem manda de verdade é o servidor.
var CHAVE_CONTA = "sorelly_conta";
function lerConta(){ try { return JSON.parse(localStorage.getItem(CHAVE_CONTA) || "null") || {}; } catch(x){ return {}; } }
function guardaPerfil(p, pessoaId, extra){ try { if(!p){ localStorage.removeItem(CHAVE_CONTA); return; } localStorage.setItem(CHAVE_CONTA, JSON.stringify({perfil:p, pessoa:pessoaId==null ? "" : String(pessoaId), abas:(extra && extra.abas) || null, ocultar:(extra && extra.ocultar) || null, grupo:(extra && extra.grupo) || null, cid:(extra && extra.cid) || null, nome:(extra && extra.nome) || ""})); } catch(x){} }
function contaTexto(){ try { return localStorage.getItem(CHAVE_CONTA) || ""; } catch(x){ return ""; } }
// id da pessoa ligada à conta que entrou (não muda quando a Diretoria usa o sistema "como" outra pessoa)
function pessoaDaConta(){ return lerConta().pessoa || ""; }
function ehAdmin(){ return lerConta().perfil==="ADMIN"; }
function grupoDaConta(){ return lerConta().grupo || ""; }
function cidDaConta(){ return lerConta().cid || ""; }
function nomeDaConta(){ return lerConta().nome || ""; }
function abasDaConta(){ var l = lerConta().abas; return Array.isArray(l) ? l : null; }
function ocultosDaConta(){ var l = lerConta().ocultar; return Array.isArray(l) ? l : null; }
async function entrar(email, senha){ var j = await chamar("POST", "/auth/login", {email:email, senha:senha}); guardaToken(j.token); var u = j.usuario || {}; guardaPerfil(u.perfil, u.pessoaId, {abas:u.abas, ocultar:u.ocultar, grupo:u.grupo, cid:u.cid, nome:u.nome}); return j.usuario; }
function sair(){ guardaToken(""); guardaPerfil(""); window.dispatchEvent(new Event("sorelly-saiu")); }

export { apiAtiva, token, chamar, entrar, sair, guardaPerfil, contaTexto, pessoaDaConta, ehAdmin, abasDaConta, ocultosDaConta, grupoDaConta, cidDaConta, nomeDaConta };
