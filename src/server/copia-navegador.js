// Cópia de segurança do que ainda está SÓ no navegador (Fase 1 de "tudo no banco", Nickolas, 17/11/2026).
// Cada navegador manda, uma vez por dia, as partes do estado que ainda não têm módulo no servidor. Fica uma linha por navegador e por parte (a mais nova vale).
// Serve para: (1) nada se perder quando o navegador deixar de guardar dados (Fase 3); (2) ver o que é dado de verdade, de quem é e o tamanho (Fase 2).
// Não muda nenhuma tela nem nenhum módulo: só copia.
import { consulta } from "./db.js";

let pronta = null;
export function garantirTabela() {
  if (!pronta) pronta = consulta(`CREATE TABLE IF NOT EXISTS sorelly.copia_navegador (
      nav_id text NOT NULL,
      chave text NOT NULL,
      conta_id text,
      nome text,
      tamanho integer NOT NULL,
      conteudo jsonb,
      em timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (nav_id, chave))`).catch((e) => { pronta = null; throw e; });
  return pronta;
}

export const navValido = (v) => typeof v === "string" && /^nv_[a-z0-9]{8,40}$/.test(v);
export const chaveValida = (k) => typeof k === "string" && /^[A-Za-z][A-Za-z0-9_]{0,60}$/.test(k);

// grava as partes que chegaram (upsert). partes = {chave: valor}. Devolve quantas gravou.
export async function gravarCopia(navId, eu, partes) {
  await garantirTabela();
  let n = 0;
  for (const [k, v] of Object.entries(partes)) {
    if (!chaveValida(k)) continue;
    const txt = JSON.stringify(v === undefined ? null : v);
    await consulta(
      "insert into sorelly.copia_navegador (nav_id, chave, conta_id, nome, tamanho, conteudo, em) values ($1, $2, $3, $4, $5, $6::jsonb, now()) " +
      "on conflict (nav_id, chave) do update set conta_id = excluded.conta_id, nome = excluded.nome, tamanho = excluded.tamanho, conteudo = excluded.conteudo, em = now()",
      [navId, k, eu && eu.id != null ? String(eu.id) : null, (eu && eu.nome) || null, txt.length, txt]);
    n++;
  }
  return n;
}
