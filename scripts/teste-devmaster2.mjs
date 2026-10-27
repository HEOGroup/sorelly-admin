// Testa a API 2 do DevMaster só com LEITURA e SEM mostrar dados de clientes: mostra quais tabelas o token libera e a estrutura (nomes de campos) de uma tabela.
//   npm run teste-devmaster2            (dicionário)  |  npm run teste-devmaster2 -- dmaam   (campos da tabela)
import { consultarTabela, liberadoNoToken } from "../src/server/devmaster2.js";

const lib = liberadoNoToken();
console.log(`Token libera ${lib.tabelas.length} tabelas e ${lib.relatorios.length} relatórios. Expira em ${lib.expiraEm}.`);
const alvo = process.argv[2];
try {
  if (!alvo) {
    const d = await consultarTabela("dmzag", { registros: 3 });
    console.log("Dicionário de tabelas (dmzag): resposta ok. Campos de cada registro:", Object.keys(d.itens[0] || {}).join(", "));
  } else {
    const r = await consultarTabela(alvo, { registros: 1 });
    console.log(`Tabela ${alvo}: ok. ${r.registros} registro de amostra. Campos:`, Object.keys(r.itens[0] || {}).join(", "));
  }
} catch (e) { console.log("ERRO:", e.statusCode || "", e.message); }
