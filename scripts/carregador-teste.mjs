// Carregador só para testes no Node: o domínio importa sem ".js" e usa o apelido "@/" (= src/) do Next. Aqui o "@/lib/glob-local" vira um vazio, "@/" aponta para src/ e o ".js" é completado.
//   node --import ./scripts/registrar-carregador.mjs scripts/testar-producao-trava.mjs
import { pathToFileURL } from "node:url";
import path from "node:path";
const SRC = path.resolve(import.meta.dirname, "..", "src");
export async function resolve(specifier, context, next) {
  if (specifier === "@/lib/glob-local") return { url: "data:text/javascript,export function globLocal(){return {}}", shortCircuit: true };
  if (specifier.startsWith("@/")) specifier = pathToFileURL(path.join(SRC, specifier.slice(2))).href;
  if ((specifier.startsWith(".") || specifier.startsWith("file:")) && !/\.[a-z]+$/i.test(specifier)) {
    try { return await next(specifier + ".js", context); } catch (e) { /* tenta como veio */ }
  }
  return next(specifier, context);
}
