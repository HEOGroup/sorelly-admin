// Explora o DICIONÁRIO da DevMaster API 2 (só nomes de tabelas e campos, nunca dados de clientes). Leitura somente.
//   npm run explorar-devmaster2 -- kit consign condicional     (procura tabelas cujo título tem essas palavras)
//   npm run explorar-devmaster2 -- campos dmaam                (lista os campos de uma tabela)
import { consultarTabela, liberadoNoToken } from "../src/server/devmaster2.js";

const [a, ...resto] = process.argv.slice(2);
if (a === "campos") {
  const tab = resto[0];
  const r = await consultarTabela("dmzae", { registros: 500, filtro: { zae_tabela: tab } }).catch((e) => ({ erro: e.message }));
  if (r.erro) { console.log("ERRO", r.erro); process.exit(0); }
  console.log(`Campos de ${tab}: ${r.registros}`);
  r.itens.slice(0, 200).forEach((c) => console.log(" ", c.zae_nome, "|", c.zae_titulo || "", "|", c.zae_tipo || ""));
} else {
  const lib = new Set(liberadoNoToken().tabelas);
  const termos = [a, ...resto].filter(Boolean).map((s) => s.toLowerCase());
  const r = await consultarTabela("dmzag", { registros: 500, campos: ["zag_nome", "zag_titulo", "zag_descricao"] });
  const ach = r.itens.filter((t) => termos.some((x) => String(t.zag_titulo || "").toLowerCase().includes(x) || String(t.zag_descricao || "").toLowerCase().includes(x)));
  console.log(`${r.registros} tabelas no dicionário; ${ach.length} combinam com [${termos.join(", ")}]:`);
  ach.forEach((t) => console.log(" ", t.zag_nome, lib.has(t.zag_nome) ? "(liberada)" : "(NÃO liberada)", "-", t.zag_titulo));
}
