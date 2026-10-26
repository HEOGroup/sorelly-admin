// Sorelly Admin · scripts/hook-padrao.mjs
// Guarda do padrão visual (pedido do Marcus, 26/10/2026: "preciso que o Claude nunca mais esqueça de ler o padrão").
// Roda como hook do Claude Code (.claude/settings.json). Modos (1º argumento):
//   prompt  · UserPromptSubmit: lembra o padrão em toda mensagem do Marcus.
//   lido    · PostToolUse Read: se a conversa leu docs/design/PADRAO-VISUAL.md, grava a marca.
//   pre     · PreToolUse Edit|Write: BLOQUEIA a edição de tela se o padrão ainda não foi lido nesta conversa; se já foi, lembra as regras de fonte.
//   checar  · PostToolUse Edit|Write: confere as linhas NOVAS do arquivo (fonte com clamp/vw, texto acima de 20 px) e devolve o erro ao Claude.
// Só vale para telas e peças: src/apps/*/(pages|components|mobile) e src/shared. Sem dependências; roda com o Node do projeto.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

var DOC = "docs/design/PADRAO-VISUAL.md";
var REGRAS = "Padrão visual (docs/design/PADRAO-VISUAL.md): fonte Inter, texto de 13 px FIXO (nunca clamp/vw), campo e botão 32 px, linha de tabela 32 px, cabeçalho 30 px (11 px, caixa alta), rótulo 11 px, número até 20 px, todo valor em reais com R$, filtros no topo, abas visíveis, menu do setor no padrão `menu`.";
var ehTela = function(f){ return /[\\/]src[\\/](apps[\\/][^\\/]+[\\/](pages|components|mobile)|shared)[\\/].*\.js$/.test(String(f||"")); };
var modo = process.argv[2], entrada = {};
try{ entrada = JSON.parse(readFileSync(0, "utf8") || "{}"); }catch(x){}
var arquivo = (entrada.tool_input && entrada.tool_input.file_path) || "";
var marca = join(tmpdir(), "sorelly-padrao-lido-" + String(entrada.session_id || "x").replace(/[^\w-]/g, ""));
var saida = function(o){ process.stdout.write(JSON.stringify(o)); process.exit(0); };

if(modo==="prompt"){
  process.stdout.write("Lembrete do sistema: antes de criar ou mexer em QUALQUER tela, leia " + DOC + " com a ferramenta Read (sem isso as edições de tela são bloqueadas). " + REGRAS);
  process.exit(0);
}
if(modo==="lido"){
  if(/PADRAO-VISUAL\.md$/i.test(arquivo.replace(/\\/g, "/"))) writeFileSync(marca, String(Date.now()));
  process.exit(0);
}
if(modo==="pre"){
  if(!ehTela(arquivo)) process.exit(0);
  if(!existsSync(marca)) saida({hookSpecificOutput:{hookEventName:"PreToolUse", permissionDecision:"deny", permissionDecisionReason:"BLOQUEADO pelo padrão do Marcus: leia " + DOC + " com a ferramenta Read (e docs/design/GUIA-DE-ESCRITA-E-TIPOGRAFIA.md) ANTES de editar tela. Depois tente a edição de novo. " + REGRAS}});
  saida({hookSpecificOutput:{hookEventName:"PreToolUse", additionalContext:REGRAS}});
}
if(modo==="checar"){
  if(!ehTela(arquivo) || !existsSync(arquivo)) process.exit(0);
  var linhas = [];
  try{
    execFileSync("git", ["ls-files", "--error-unmatch", arquivo], {stdio:"ignore"});
    var d = execFileSync("git", ["diff", "HEAD", "-U0", "--", arquivo], {encoding:"utf8", maxBuffer:64*1024*1024});
    d.split("\n").forEach(function(l){ if(l[0]==="+" && l.slice(0, 3)!=="+++") linhas.push(l.slice(1)); });
  }catch(x){ linhas = readFileSync(arquivo, "utf8").split("\n"); }   // arquivo novo: confere tudo
  var erros = [];
  linhas.forEach(function(l){
    if(/text-\[(?:clamp\(|[^\]]*vw)/.test(l)) erros.push("fonte com clamp/vw (use 13px fixo): " + l.trim().slice(0, 110));
    var m, re = /text-\[(\d+(?:\.\d+)?)px\]/g;
    while((m = re.exec(l))){ if(parseFloat(m[1])>20) erros.push("texto de " + m[1] + " px (máximo 20 px, corpo 13 px): " + l.trim().slice(0, 110)); }
  });
  if(erros.length){ process.stderr.write("FONTE FORA DO PADRÃO em " + arquivo + " (" + DOC + "). Corrija antes de seguir:\n- " + erros.slice(0, 8).join("\n- ") + "\n"); process.exit(2); }
  process.exit(0);
}
process.exit(0);
