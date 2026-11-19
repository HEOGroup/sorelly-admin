// Primeiro pagamento em joias da tela RH › Pagamento em joias (17/11/2026, pedido do Marcus): a Ana Paula (RH) é a modelo das fotos da semana de 16 a 20/11,
// pago em joias: R$ 500,00 a preço de venda (custo de 20%, R$ 100,00), mesma proposta da semana anterior (3 dias de fotos). Já autorizado pelo Marcus; falta separar e retirar.
// Os dados reais ficam só no servidor (o repositório é público). Pode rodar de novo: não repete o registro.
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/jp-ana-paula-semana-16-11.mjs
import { consulta, pool } from "../../src/server/db.js";

const ID = "jp-ana-paula-2026-11-16";
const agora = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" }).format(new Date()).replace(" ", "T");
const item = {
  id: ID, pessoa: "Ana Paula de Almeida Fernandes", setor: "Marketing", motivo: "Modelo para fotos",
  descricao: "Modelo nas fotos de catálogo da semana de 16 a 20/11/2026 (mesma proposta da semana anterior: R$ 500,00 em peças)",
  valor: 500, custoPct: 20, pecas: "", situacao: "Autorizado", criadoPor: "Claude (pedido do Marcus)", criadoEm: agora, mes: agora.slice(0, 7),
  autorizadoPor: "Marcus", autorizadoEm: agora,
  historico: [{ em: agora, por: "Claude (pedido do Marcus)", ato: "Pedido criado" }, { em: agora, por: "Marcus", ato: "Autorizado" }],
};
const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'jp'");
const atual = r.rows[0] ? r.rows[0].conteudo || {} : {};
const itens = Array.isArray(atual.itens) ? atual.itens : [];
if (itens.some((x) => x && x.id === ID)) console.log("já existe | " + ID);
else {
  const novo = Object.assign({ v: 1 }, atual, { itens: [item].concat(itens) });
  await consulta(
    "insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ('jp', $1::jsonb, 1, 'Claude') on conflict (modulo) do update set conteudo = excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = 'Claude', atualizado_em = now()",
    [JSON.stringify(novo)]);
  console.log("registrado | " + item.pessoa + " | R$ 500,00 | Autorizado");
}
await pool().end();
