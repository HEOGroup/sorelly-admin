// Apoio das rotas de serviço do app da representante (05/11/2026): leitura dos módulos antigos e tradução código → nome.
import { consulta } from "../db.js";
import { recusa } from "../servico.js";

// conteúdo de um módulo do atalho estado_modulo (agend, gr, kn...) — só leitura
export async function lerModulo(modulo) {
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = $1", [modulo]);
  return (r.rows[0] && r.rows[0].conteudo) || {};
}

// grava chaves de 1º nível num módulo do atalho (mesmo SQL da rota /api/estado, sem a regra da carga inicial: é o servidor gravando)
export async function gravarModulo(modulo, chaves, por = "app-rep") {
  await consulta(
    `insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ($1, $2::jsonb, 1, $3)
     on conflict (modulo) do update set conteudo = sorelly.estado_modulo.conteudo || excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
    [modulo, JSON.stringify(chaves), por]);
}

const sem = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Representante pelo código do vendedor da DevMaster (= representantes.cod do backend do app).
// O nome das telas é o de agend.config.representantes (ex.: "Dayanne"); listagens e acertos guardam esse nome em "rep".
// Sem cadastro no Agendamento, usa o nome que veio do app (repNome) para não perder o registro.
export async function representante(cod, repNome) {
  const c = String(cod || "").trim();
  if (!c) throw recusa("Representante não informada.", 400);
  const ag = await lerModulo("agend");
  const lista = ((ag.config && ag.config.representantes) || []).filter((r) => r && r.ativo !== false);
  const achada = lista.find((r) => String(r.codigo || "").trim() === c);
  const nome = achada ? achada.nome : String(repNome || "").trim().split(/\s+/)[0] || c;
  return { cod: c, nome, grupo: achada && achada.grupo ? achada.grupo : null, cadastrada: !!achada };
}

// código DevMaster da revendedora: 6 dígitos (o id do usuário no app, com zeros à esquerda)
export function revCodDe(revendedoraId, revCod) {
  const c = String(revCod || "").replace(/\D/g, "");
  if (c) return c.padStart(6, "0");
  const n = Number(revendedoraId);
  return Number.isInteger(n) && n > 0 ? String(n).padStart(6, "0") : "";
}

export { sem };
