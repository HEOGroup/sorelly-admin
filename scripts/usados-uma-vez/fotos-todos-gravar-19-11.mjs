// GRAVA (uma vez, a pedido do Marcus em 19/11/2026): traz para o sistema de fotos TODOS os códigos da DevMaster que ainda não estavam lá
import { sincronizarFotosDm } from "../../src/server/fotos-dm.js";
import { pool } from "../../src/server/db.js";
console.log(JSON.stringify(await sincronizarFotosDm({ antigas: true })));
await pool().end();
