// SIMULAÇÃO (não grava): quantos códigos entrariam se a leitura trouxesse todos da DevMaster
import { sincronizarFotosDm } from "../../src/server/fotos-dm.js";
import { pool } from "../../src/server/db.js";
console.log(JSON.stringify(await sincronizarFotosDm({ antigas: true, gravar: false })));
await pool().end();
