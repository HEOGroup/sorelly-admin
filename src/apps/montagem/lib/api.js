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
function guardaPerfil(p, pessoaId){ try { if(p) localStorage.setItem("sorelly_perfil", p); else localStorage.removeItem("sorelly_perfil"); if(pessoaId!=null && p) localStorage.setItem("sorelly_pessoa", String(pessoaId)); else localStorage.removeItem("sorelly_pessoa"); } catch(x){} }
// id da pessoa ligada à conta que entrou (não muda quando a Diretoria usa o sistema "como" outra pessoa)
function pessoaDaConta(){ try { return localStorage.getItem("sorelly_pessoa") || ""; } catch(x){ return ""; } }
function ehAdmin(){ try { return localStorage.getItem("sorelly_perfil")==="ADMIN"; } catch(x){ return false; } }
async function entrar(email, senha){ var j = await chamar("POST", "/auth/login", {email:email, senha:senha}); guardaToken(j.token); guardaPerfil(j.usuario && j.usuario.perfil, j.usuario && j.usuario.pessoaId); return j.usuario; }
function sair(){ guardaToken(""); guardaPerfil(""); window.dispatchEvent(new Event("sorelly-saiu")); }

export { apiAtiva, token, chamar, entrar, sair, guardaPerfil, pessoaDaConta, ehAdmin };
