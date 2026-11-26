// Bipado automático dos Kits novos pela DevMaster (26/11/2026). Sem argumento = só simula e mostra o relatório. Com --aplicar = grava (módulo kndados).
//   node --env-file-if-exists=.env.local scripts/kits-novos-bipado-devmaster.mjs [--aplicar]
import { sincronizarBipadoDevMaster } from "../src/server/kits-novos-devmaster.js";
import { pool } from "../src/server/db.js";

const aplicar = process.argv.includes("--aplicar");
const r = await sincronizarBipadoDevMaster({ simular: !aplicar });
console.log(aplicar ? "GRAVANDO" : "SIMULAÇÃO (nada gravado)");
console.log(JSON.stringify({ bipados: r.bipados, gravados: r.gravados, semKit: r.semKit, semCadastro: (r.semCadastro || []).length, duvida: r.duvida, erros: r.erros, versao: r.versao }, null, 1));
console.log("Exemplos:", JSON.stringify(r.exemplos, null, 1));
await pool().end();
