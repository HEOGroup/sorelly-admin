// Sorelly Admin · scripts/hook-padrao.mjs
// Guarda do padrão visual (pedido do Marcus, 26/10/2026: "preciso que o Claude nunca mais esqueça de ler o padrão"; ampliado em 29/10/2026: trava dura).
// Roda como hook do Claude Code (.claude/settings.json). Modos (1º argumento):
//   prompt  · UserPromptSubmit: lembra o padrão em toda mensagem do Marcus.
//   lido    · PostToolUse Read: se a conversa leu docs/design/PADRAO-VISUAL.md, grava a marca.
//   pre     · PreToolUse Edit|Write: BLOQUEIA a edição de tela se o padrão ainda não foi lido nesta conversa; se já foi, lembra as regras.
//   checar  · PostToolUse Edit|Write: confere as linhas NOVAS do arquivo com as regras de scripts/padrao-regras.mjs e devolve o erro ao Claude (saída 2).
// As regras em si ficam em scripts/padrao-regras.mjs (as mesmas do CI). Sem dependências; roda com o Node do projeto.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DOC, REGRAS, conferirLinhas, ehTela } from "./padrao-regras.mjs";

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
  var linhas = [], novo = false, conteudo = readFileSync(arquivo, "utf8");
  try{
    execFileSync("git", ["ls-files", "--error-unmatch", arquivo], {stdio:"ignore"});
    var d = execFileSync("git", ["diff", "HEAD", "-U0", "--", arquivo], {encoding:"utf8", maxBuffer:64*1024*1024});
    d.split("\n").forEach(function(l){ if(l[0]==="+" && l.slice(0, 3)!=="+++") linhas.push(l.slice(1)); });
  }catch(x){ linhas = conteudo.split("\n"); novo = true; }   // arquivo novo: confere tudo
  var erros = conferirLinhas(arquivo, linhas, {arquivoNovo:novo, conteudo:conteudo});
  if(erros.length){ process.stderr.write("FORA DO PADRÃO em " + arquivo + " (" + DOC + "). Corrija antes de seguir (exceção só com `padrao-ok` na linha e o Marcus de acordo):\n- " + erros.slice(0, 10).join("\n- ") + (erros.length > 10 ? "\n- … e mais " + (erros.length - 10) : "") + "\n"); process.exit(2); }
  process.exit(0);
}
process.exit(0);
