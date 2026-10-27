// Mostra quais módulos já foram para o banco (versão, tamanho, quando e quem). Só leitura. Uso: npm run ver-modulos
import { consulta, pool } from "../src/server/db.js";

const r = await consulta("select modulo, versao, pg_column_size(conteudo) as bytes, jsonb_object_keys_count(conteudo) as x from sorelly.estado_modulo order by modulo").catch(async () =>
  consulta("select modulo, versao, pg_column_size(conteudo) as bytes, atualizado_em, atualizado_por from sorelly.estado_modulo order by modulo"));
const PADRAO = ["rh", "eq", "cf", "ff", "ce", "pf", "cp", "px", "lp", "agend", "av", "cl", "ind", "pk", "pr", "ex", "cpc", "mk", "gr"];
const tem = new Map(r.rows.map((x) => [x.modulo, x]));
console.log("Módulo  Versão  Tamanho");
PADRAO.forEach((m) => { const x = tem.get(m); console.log(m.padEnd(8), x ? String(x.versao).padEnd(7) : "FALTA".padEnd(7), x ? (x.bytes / 1024).toFixed(0) + " KB" : ""); });
console.log(`\n${PADRAO.filter((m) => tem.has(m)).length} de ${PADRAO.length} módulos já estão no banco.`);
const maior = Math.max(0, ...r.rows.map((x) => x.bytes));
if (maior > 4 * 1024 * 1024) console.log("ATENÇÃO: há módulo acima de 4 MB (limite da Vercel é ~4,5 MB por pedido).");
await pool().end();
