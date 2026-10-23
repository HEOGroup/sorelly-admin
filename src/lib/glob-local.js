// Troca do glob de arquivos do Vite: devolve {"./x.local.js": módulo} se o arquivo existir, senão {}.
// O registro vem de src/generated/locais.js (gerado por scripts/gerar-locais.mjs antes do dev/build).
import { LOCAIS } from "@/generated/locais";

export function globLocal(caminhoDesdeSrc) {
  var m = LOCAIS[caminhoDesdeSrc];
  if (!m) return {};
  var nome = caminhoDesdeSrc.split("/").pop();
  var r = {};
  r["./" + nome] = m;
  return r;
}
