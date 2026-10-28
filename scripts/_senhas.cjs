// Tela de senhas (Contas): a Diretoria vê login + senha provisória e copia a mensagem pronta. Marcus, 27/10/2026.
const fs = require("fs");
const raiz = process.argv[2];
const edita = (f, regras) => { let t = fs.readFileSync(raiz + "/" + f, "utf8"); regras.forEach(([a, b]) => { if (!t.includes(a)) throw new Error(f + ": nao achou " + a.slice(0, 80)); t = t.replace(a, () => b); }); fs.writeFileSync(raiz + "/" + f, t); };

edita("src/server/contas.js", [["grupo: r.grupo || null, cid: r.cid || null });", 'grupo: r.grupo || null, cid: r.cid || null, senhaProvisoria: r.senha_provisoria || "" });   // só a lista da Diretoria usa paraConta']]);
edita("app/api/contas/[id]/route.js", [['  if (a.senha !== undefined) poe("senha_hash", await criarHash(a.senha));', '  if (a.senha !== undefined) { poe("senha_hash", await criarHash(a.senha)); poe("senha_provisoria", a.senha); }   // a Diretoria que redefine pode reenviar a senha']]);
edita("app/api/perfil/senha/route.js", [["update sorelly.conta set senha_hash = $2, atualizado_em = now() where", "update sorelly.conta set senha_hash = $2, senha_provisoria = null, atualizado_em = now() where"]]);

edita("src/apps/montagem/pages/ContasAcesso.js", [
  ['import { EQUIPE } from "@/apps/montagem/domain/equipe";', 'import { EQUIPE } from "@/apps/montagem/domain/equipe";\nimport { PAPEL_LB } from "@/apps/montagem/navigation/perfis";'],
  ["function LinhaConta(p){", `var ENDERECO = "https://sorelly-admin.vercel.app/";
function mensagemAcesso(c){ var nome = (c.nome || "").split(" ")[0]; return "Oi, " + nome + "! Este é o seu acesso ao sistema da Sorelly.\\n\\nEndereço: " + ENDERECO + "\\nUsuário: " + c.login + "\\nSenha: " + c.senhaProvisoria + "\\n\\nSe esquecer a senha, é só falar comigo."; }
function novaSenha(){ return "sorelly" + (1000 + Math.floor(Math.random() * 9000)); }

// Tela de senhas: login + senha provisória de cada conta, mensagem pronta para copiar e nova senha com um clique
function BlocoSenhas(p){
  var sb = useState(""), busca = sb[0], setBusca = sb[1], sc = useState(""), copiado = sc[0], setCopiado = sc[1];
  var l = p.contas.filter(function(c){ return c.login && c.status!=="aguardando" && (!busca || (c.nome+" "+c.login).toLowerCase().indexOf(busca.toLowerCase())>=0); });
  var copia = function(c){ try { navigator.clipboard.writeText(mensagemAcesso(c)); setCopiado(c.id); setTimeout(function(){ setCopiado(""); }, 2000); } catch(x){} };
  var COL = "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto] items-center gap-3 px-3";
  return e(Bloco,{t:"Senhas para enviar"},
    e("div",{className:"flex flex-col gap-2 p-2"},
      e("input",{className:CAMPO, value:busca, placeholder:"Buscar nome ou usuário…", "aria-label":"Buscar", onChange:function(ev){ setBusca(ev.target.value); }}),
      e("div",{className:COL+" h-[30px] text-[11px] font-bold uppercase tracking-[.05em]"}, e("span",null,"Nome"), e("span",null,"Usuário"), e("span",null,"Senha"), e("span",null,"")),
      l.map(function(c){
        return e("div",{key:c.id, className:COL+" h-8 border-t border-border/60 text-[13px]"},
          e("span",{className:"truncate", title:c.nome}, c.nome),
          e("span",{className:"truncate font-mono", title:c.login}, c.login),
          e("span",{className:"truncate font-mono "+(c.senhaProvisoria ? "" : "text-muted-foreground")}, c.senhaProvisoria || "já trocou"),
          e("span",{className:"flex gap-1.5"},
            c.senhaProvisoria && e(Botao,{onClick:function(){ copia(c); }}, copiado===c.id ? "Copiado" : "Copiar mensagem"),
            e(Botao,{onClick:function(){ if(window.confirm("Gerar uma senha nova para "+c.nome+"? A senha atual deixa de valer.")) p.onMudar(c.id, {senha:novaSenha()}); }}, "Nova senha")));
      }),
      !l.length && e("p",{className:"px-3 py-2 text-[13px]"}, "Nenhuma conta com usuário.")));
}

function LinhaConta(p){`],
  ["    e(Bloco,{t:\"Contas\"},", "    contas && contas.length ? e(BlocoSenhas,{contas:contas, onMudar:muda}) : null,\n    e(Bloco,{t:\"Contas\"},"]
]);
console.log("ok");
