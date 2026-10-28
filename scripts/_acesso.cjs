// Acesso por GRUPO (e não por pessoa da lista de 43 nomes): cada conta tem grupo de acesso, contato do chat e nome próprios. Marcus, 27/10/2026.
const fs = require("fs");
const raiz = process.argv[2], B = raiz + "/src/apps/montagem/";
const edita = (f, regras) => { let t = fs.readFileSync(f, "utf8"); regras.forEach(([a, b]) => { const m = typeof a === "string" ? (t.includes(a) ? a : null) : (a.exec(t) || [null])[0]; if (!m) throw new Error(f + ": nao achou " + String(a).slice(0, 90)); t = t.replace(m, () => b); }); fs.writeFileSync(f, t); };

// ---------- servidor ----------
edita(raiz + "/src/server/contas.js", [
  ['login: r.login || "", abas: r.abas || null, ocultar: r.ocultar || null });', 'login: r.login || "", abas: r.abas || null, ocultar: r.ocultar || null, grupo: r.grupo || null, cid: r.cid || null });'],
  ["  for (const k of [\"abas\", \"ocultar\"]) {", `  if (b.grupo !== undefined) { if (b.grupo === null || b.grupo === "") o.grupo = null; else if (!GRUPOS_VALIDOS.includes(b.grupo)) throw invalido("grupo"); else o.grupo = b.grupo; }
  if (b.cid !== undefined) { if (b.cid === null || b.cid === "") o.cid = null; else if (typeof b.cid !== "string" || !/^[a-z0-9_]{2,80}$/.test(b.cid)) throw invalido("cid"); else o.cid = b.cid; }
  for (const k of ["abas", "ocultar"]) {`],
  ["export const PERFIS = [\"ADMIN\", \"MEMBER\"];", "export const PERFIS = [\"ADMIN\", \"MEMBER\"];\n// grupos de acesso do menu (os mesmos de navigation/perfis.js; \"basico\" = só Início, Rotina e Chat)\nexport const GRUPOS_VALIDOS = [\"supervisao\", \"familia\", \"supervisora\", \"agendamento\", \"financeiro\", \"inadimplencia\", \"bipadora\", \"montadora\", \"listagens\", \"kitnovo\", \"cadastropecas\", \"basico\"];"]
]);
edita(raiz + "/src/server/http.js", [['login: r.login || "", abas: r.abas || null, ocultar: r.ocultar || null };', 'login: r.login || "", abas: r.abas || null, ocultar: r.ocultar || null, grupo: r.grupo || null, cid: r.cid || null };']]);
edita(raiz + "/app/api/auth/login/route.js", [['login: c.login || "", abas: c.abas || null, ocultar: c.ocultar || null };', 'login: c.login || "", abas: c.abas || null, ocultar: c.ocultar || null, grupo: c.grupo || null, cid: c.cid || null };']]);
edita(raiz + "/app/api/contas/[id]/route.js", [['  if (a.ocultar !== undefined) poe("ocultar", a.ocultar);', '  if (a.ocultar !== undefined) poe("ocultar", a.ocultar);\n  if (a.grupo !== undefined) poe("grupo", a.grupo);\n  if (a.cid !== undefined) poe("cid", a.cid);']]);
edita(raiz + "/src/server/chat.js", [["export const contatoDaConta = (eu) => (eu && eu.pessoaId != null ? contatoDoLogin(eu.pessoaId) : null);", "// o contato do chat vem da própria conta (cid); sem ele, pela lista de pessoas do sistema\nexport const contatoDaConta = (eu) => (eu && eu.cid) || (eu && eu.pessoaId != null ? contatoDoLogin(eu.pessoaId) : null);"]]);

// ---------- regras de acesso (equipe.js) ----------
edita(B + "domain/equipe.js", [
  ["function nomeDe(id){ var p = EQUIPE.find(function(x){return x.id===id;}); return p ? p.nome : \"\\u2014\"; }",
   `// Contas com grupo de acesso próprio (funcionário que não está na lista de 43 nomes): o App informa o grupo e o nome da conta que entrou.
var GRUPO_CONTA = {}, NOME_CONTA = {};
function definirContaEquipe(id, grupo, nome){ if(id==null || isNaN(id)) return; if(grupo) GRUPO_CONTA[id] = grupo; else delete GRUPO_CONTA[id]; if(nome) NOME_CONTA[id] = nome; else delete NOME_CONTA[id]; }
function nomeDe(id){ var p = EQUIPE.find(function(x){return x.id===id;}); return p ? p.nome : (NOME_CONTA[id] || "\\u2014"); }`],
  ["function papelDe(id){\n", "function papelDe(id){\n  if(GRUPO_CONTA[id]) return GRUPO_CONTA[id]==='supervisora' ? 'supervisao' : GRUPO_CONTA[id];   // grupo definido na conta vale sobre a lista\n"],
  ["function grupoDe(id){\n", "function grupoDe(id){\n  if(GRUPO_CONTA[id]) return GRUPO_CONTA[id];\n"],
  ["var pessoaConhecida = function(id){ return EQUIPE.some(function(p){ return p.id===id; }); };", "var pessoaConhecida = function(id){ return !!GRUPO_CONTA[id] || EQUIPE.some(function(p){ return p.id===id; }); };"],
  ["export { pessoaConhecida,", "export { definirContaEquipe, pessoaConhecida,"]
]);
edita(B + "domain/chat-contatos.js", [
  ["function contatoDoLogin(idLogin){\n", "// contato do chat definido na conta (funcionário fora da lista de 43 nomes): o App informa\nvar CID_CONTA = {};\nfunction definirCidConta(id, cid){ if(id==null || isNaN(id)) return; if(cid) CID_CONTA[id] = cid; else delete CID_CONTA[id]; }\nfunction contatoDoLogin(idLogin){\n  if(CID_CONTA[idLogin]) return CID_CONTA[idLogin];\n"],
  ["export { registrarRevendedora,", "export { definirCidConta, registrarRevendedora,"]
]);
edita(B + "navigation/perfis.js", [
  ["  representante:[\"celrep\",\"painel\",\"consrep\",\"comissoes\"]};", "  representante:[\"celrep\",\"painel\",\"consrep\",\"comissoes\"],\n  basico:[]};   // acesso básico: só Início, Rotina e Chat (o App acrescenta)"],
  ["  representante:\"Representantes\"};", "  representante:\"Representantes\", basico:\"Acesso básico\"};"],
  ["representante:[\"#8B5CF6\",\"representante\"]};", "representante:[\"#8B5CF6\",\"representante\"], basico:[\"#64748B\",\"user\"]};"]
]);

// ---------- conta guardada no navegador ----------
edita(B + "lib/api.js", [
  ["ocultar:(extra && extra.ocultar) || null})); } catch(x){} }", "ocultar:(extra && extra.ocultar) || null, grupo:(extra && extra.grupo) || null, cid:(extra && extra.cid) || null, nome:(extra && extra.nome) || \"\"})); } catch(x){} }"],
  ["function abasDaConta(){", "function grupoDaConta(){ return lerConta().grupo || \"\"; }\nfunction cidDaConta(){ return lerConta().cid || \"\"; }\nfunction nomeDaConta(){ return lerConta().nome || \"\"; }\nfunction abasDaConta(){"],
  ["guardaPerfil(u.perfil, u.pessoaId, {abas:u.abas, ocultar:u.ocultar});", "guardaPerfil(u.perfil, u.pessoaId, {abas:u.abas, ocultar:u.ocultar, grupo:u.grupo, cid:u.cid, nome:u.nome});"],
  ["export { apiAtiva, token, chamar, entrar, sair, guardaPerfil, contaTexto, pessoaDaConta, ehAdmin, abasDaConta, ocultosDaConta };", "export { apiAtiva, token, chamar, entrar, sair, guardaPerfil, contaTexto, pessoaDaConta, ehAdmin, abasDaConta, ocultosDaConta, grupoDaConta, cidDaConta, nomeDaConta };"]
]);
edita(B + "App.js", [
  ["srv.guardaPerfil(j.usuario.perfil, j.usuario.pessoaId, {abas:j.usuario.abas, ocultar:j.usuario.ocultar});", "srv.guardaPerfil(j.usuario.perfil, j.usuario.pessoaId, {abas:j.usuario.abas, ocultar:j.usuario.ocultar, grupo:j.usuario.grupo, cid:j.usuario.cid, nome:j.usuario.nome});"],
  ["import { BIPA_RETORNO_PADRAO, definirBlocos, grupoDe, nomeDe, papelDe, pessoaConhecida, podeGerirAgend } from \"@/apps/montagem/domain/equipe\";", "import { BIPA_RETORNO_PADRAO, definirBlocos, definirContaEquipe, grupoDe, nomeDe, papelDe, pessoaConhecida, podeGerirAgend } from \"@/apps/montagem/domain/equipe\";\nimport { definirCidConta } from \"@/apps/montagem/domain/chat-contatos\";"],
  ["function App(){\n  var r = useReducer(reducer, null, inicial), s = r[0], d = r[1];", "function App(){\n  // a conta que entrou pode trazer o grupo de acesso, o nome e o contato do chat (funcionário fora da lista de 43 nomes)\n  if(srv.apiAtiva() && srv.pessoaDaConta()){ definirContaEquipe(Number(srv.pessoaDaConta()), srv.grupoDaConta(), srv.nomeDaConta()); definirCidConta(Number(srv.pessoaDaConta()), srv.cidDaConta()); }\n  var r = useReducer(reducer, null, inicial), s = r[0], d = r[1];"]
]);

// ---------- tela de Contas: grupo de acesso e contato do chat ----------
edita(B + "pages/ContasAcesso.js", [
  ['      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Login (usuário)",', `      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Grupo de acesso",
        e("select",{className:CAMPO, value:c.grupo||"", onChange:function(ev){ muda({grupo:ev.target.value || null}); }},
          e("option",{value:""}, "Pela lista do sistema"), GRUPOS_ACESSO.map(function(g){ return e("option",{key:g, value:g}, PAPEL_LB[g] || g); }))),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Contato do chat",
        e("input",{key:c.id+"-cid-"+(c.cid||""), className:CAMPO, defaultValue:c.cid||"", placeholder:"ex.: f_michelebrito", maxLength:80, onBlur:function(ev){ var v = ev.target.value.trim(); if(v!==(c.cid||"")) muda({cid:v}); }})),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Login (usuário)",`],
  ["function pessoasDoSistema(){", "var GRUPOS_ACESSO = [\"supervisao\",\"familia\",\"supervisora\",\"agendamento\",\"financeiro\",\"inadimplencia\",\"bipadora\",\"montadora\",\"listagens\",\"kitnovo\",\"cadastropecas\",\"basico\"];\nfunction pessoasDoSistema(){"],
  ["md:grid-cols-4", "md:grid-cols-3"]
]);
console.log("ok");
