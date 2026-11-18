// SIMULAÇÃO (não grava nada): o que a leitura da DevMaster mudaria no controle de Fotos de catálogo, com as peças antigas incluídas
import { sincronizarFotosDm } from "../../src/server/fotos-dm.js";
import { pool } from "../../src/server/db.js";
const r = await sincronizarFotosDm({ gravar: false });
console.log("SIMULAÇÃO:", JSON.stringify(r));
await pool().end();
