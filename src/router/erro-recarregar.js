// Sorelly Admin — router/erro-recarregar.js
// Aba aberta antes de uma publicação pede um arquivo que não existe mais (ChunkLoadError).
// Aqui a tela recarrega sozinha, uma vez por minuto no máximo; outro erro mostra um aviso com o botão Recarregar.
import { e } from "@/shared/react";
import { useRouteError } from "react-router-dom";

const CHUNK = /Loading chunk|ChunkLoadError|dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i;
const CHAVE = "sorelly_recarga_chunk";

function recarregou() {
  try {
    const t = Number(sessionStorage.getItem(CHAVE) || 0);
    if (Date.now() - t < 60000) return false;
    sessionStorage.setItem(CHAVE, String(Date.now()));
  } catch (x) { /* sem sessionStorage: recarrega uma vez só pelo botão */ return false; }
  window.location.reload();
  return true;
}

function ErroRecarregar() {
  const erro = useRouteError();
  const msg = String((erro && (erro.message || erro.statusText)) || erro || "");
  const ehChunk = CHUNK.test(msg) || (erro && erro.name === "ChunkLoadError");
  if (ehChunk && typeof window !== "undefined" && recarregou()) return e("div", { className: "p-6 text-center text-[13px]" }, "Atualizando o sistema…");
  return e("div", { className: "mx-auto mt-16 flex max-w-md flex-col items-center gap-3 rounded-lg border border-border p-6 text-center text-[13px]" },
    e("div", { className: "text-[16px] font-bold" }, ehChunk ? "O sistema foi atualizado" : "Algo deu errado"),
    e("div", null, ehChunk ? "Clique em Recarregar para abrir a versão nova." : "Clique em Recarregar. Se repetir, avise o Marcus."),
    e("button", { type: "button", className: "h-8 rounded border border-border px-4 font-bold hover:bg-white/10", onClick: function () { window.location.reload(); } }, "Recarregar"));
}
export { ErroRecarregar };
