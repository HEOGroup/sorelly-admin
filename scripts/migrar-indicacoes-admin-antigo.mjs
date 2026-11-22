// Copia do admin antigo (sorelly-admin) para o protótipo o que as Indicações guardam FORA do app (19/11/2026):
//   indicacao_resgate_operacao  dados de balcão de cada pedido de prêmio (peças, valor em venda, data da retirada, em contato, maleta...)
//   indicacao_historico_legado  a planilha antiga de indicações (antes do app), mostrada em Indicações › Histórico
// O resto (funil, pedidos, moedas, prêmios) mora no app e é lido ao vivo por src/server/indicacoes.js.
// Rodar de novo atualiza sem duplicar: vale a linha com updatedAt mais novo (o que a equipe mexer aqui depois não é sobrescrito por linha velha do antigo). Nada é apagado.
// A mesma cópia roda sozinha no servidor (a cada 2 minutos, só o balcão) quando ADMIN_ANTIGO_DATABASE_URL está nas variáveis dele.
//
// Uso (no terminal, na pasta sorelly-prototipo):
//   $env:ADMIN_ANTIGO_DATABASE_URL = "postgresql://...banco do admin antigo..."   (PowerShell)
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env scripts/migrar-indicacoes-admin-antigo.mjs              # só mostra o relatório
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env scripts/migrar-indicacoes-admin-antigo.mjs --aplicar    # grava no banco do protótipo (DATABASE_URL)
import { pool } from "../src/server/db.js";
import { copiarDoAntigo } from "../src/server/indicacoes.js";

const aplicar = process.argv.includes("--aplicar");
const urlAntigo = (process.env.ADMIN_ANTIGO_DATABASE_URL || "").trim();
if (!urlAntigo) { console.error("Falta ADMIN_ANTIGO_DATABASE_URL (o banco do admin antigo). Veja o uso no começo do arquivo."); process.exit(1); }
if (urlAntigo === (process.env.DATABASE_URL || "").trim()) { console.error("ADMIN_ANTIGO_DATABASE_URL é o mesmo banco do protótipo. Confira as variáveis."); process.exit(1); }

console.log(aplicar ? "== GRAVANDO no banco do protótipo ==" : "== SIMULAÇÃO (nada é gravado; use --aplicar para gravar) ==");
const r = await copiarDoAntigo(urlAntigo, { aplicar });
console.log("Balcão dos pedidos: " + r.balcaoNoAntigo + " no antigo, " + r.balcaoNovo + " ainda não estão aqui." + (r.aplicado ? " Agora aqui: " + r.balcaoAqui + "." : ""));
console.log("Planilha antiga: " + r.planilhaNoAntigo + " linhas no antigo; aqui: " + r.planilhaAqui + ".");
await pool().end();
