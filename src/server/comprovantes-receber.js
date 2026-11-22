// Comprovante dos pagamentos da DevMaster na tela CONTAS A RECEBER (Marcus, 21/11/2026: "precisa do botão anexar").
// O Pix que não passou pelo Atendimento interno (ex.: representante) ganha o comprovante aqui. O arquivo sobe antes por /api/anexos (módulo "contasreceber"); aqui fica só a ligação linha → arquivo.
import { consulta } from "./db.js";
import { garantirTabelaAnexo, chaveAnexoValida } from "./anexos.js";

let pronta = null;
function garantirTabela() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.comprovante_receber (
    chave text primary key, anexo text not null, nome text, tipo text, por text, criado_em timestamptz not null default now())`).catch((e) => { pronta = null; throw e; });
  return pronta;
}

export async function listarComprovantes() {
  await garantirTabela();
  const r = await consulta("select chave, anexo, nome, tipo from sorelly.comprovante_receber");
  const mapa = {};
  r.rows.forEach((x) => { mapa[x.chave] = { key: x.anexo, nome: x.nome || "", tipo: x.tipo || "" }; });
  return { mapa };
}

export async function anexarComprovante(eu, b) {
  const chave = String((b && b.chave) || ""), key = String((b && b.key) || "");
  if (!chave || chave.length > 300) return { erro: "Pagamento inválido." };
  if (!chaveAnexoValida(key)) return { erro: "Comprovante inválido." };
  await garantirTabelaAnexo(); await garantirTabela();
  const a = await consulta("select modulo from sorelly.anexo_modulo where id = $1", [key]);
  if (!a.rowCount || a.rows[0].modulo !== "contasreceber") return { erro: "Comprovante não encontrado." };
  const por = String((eu && (eu.nome || eu.id)) || "");
  await consulta(`insert into sorelly.comprovante_receber (chave, anexo, nome, tipo, por) values ($1, $2, $3, $4, $5)
    on conflict (chave) do update set anexo = excluded.anexo, nome = excluded.nome, tipo = excluded.tipo, por = excluded.por, criado_em = now()`, [chave, key, String(b.nome || "").slice(0, 120), String(b.tipo || "").slice(0, 60), por]);
  return listarComprovantes();
}
