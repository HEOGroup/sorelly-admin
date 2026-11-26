// TRAVA do caminho pelo menu (Marcus, 25/11/2026: "não consegue travar isso?").
// Roda quando o Claude termina de responder (hook Stop). Se a ÚLTIMA linha da resposta não for um caminho
// "Setor › Grupo › Tela" com a tela existindo em navigation/setores.js, a resposta é devolvida para corrigir.
import { readFileSync } from "node:fs";
import { join } from "node:path";

let entrada = {};
try { entrada = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { process.exit(0); }
if (entrada.stop_hook_active) process.exit(0);   // já devolveu uma vez: não entra em laço

let texto = "";
try {
  const linhas = readFileSync(entrada.transcript_path, "utf8").split("\n").filter(Boolean);
  for (let i = linhas.length - 1; i >= 0 && !texto; i--) {
    let o; try { o = JSON.parse(linhas[i]); } catch { continue; }
    if (o.type !== "assistant") continue;
    const c = o.message && o.message.content;
    const partes = Array.isArray(c) ? c.filter((x) => x.type === "text").map((x) => x.text) : (typeof c === "string" ? [c] : []);
    texto = partes.join("\n").trim();
  }
} catch { process.exit(0); }
if (!texto) process.exit(0);

const ultima = texto.split("\n").map((l) => l.trim()).filter(Boolean).pop() || "";
const segs = ultima.split("›").map((s) => s.trim().replace(/[.`*]/g, "").trim());
let setores = "";
try { setores = readFileSync(join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), "src/apps/montagem/navigation/setores.js"), "utf8"); } catch { process.exit(0); }
const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const setoresN = norm(setores);
const ok = segs.length >= 2 && segs.every(Boolean) && setoresN.includes(norm(segs[segs.length - 1]));
if (ok) process.exit(0);

process.stdout.write(JSON.stringify({
  decision: "block",
  reason: "TRAVA DO CAMINHO (Marcus, 25/11/2026): a última linha da resposta precisa ser o caminho completo pelo menu, em texto normal, no formato Setor › Grupo › Tela (› Aba), com a tela conferida em src/apps/montagem/navigation/setores.js. Nunca só o setor. Acrescente essa linha agora, depois do texto, e não repita o resto da resposta."
}));
