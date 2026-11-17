export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Cópia de segurança do que ainda está só no navegador (17/11/2026). Corpo: { nav: "nv_...", partes: { chave: valor } }. Só grava; nada é lido de volta pela tela.
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { gravarCopia, navValido } from "@/server/copia-navegador";

export const POST = rota(async (req, { eu }) => {
  const b = await corpo(req, 4.4 * 1024 * 1024);
  if (!navValido(b.nav) || !b.partes || typeof b.partes !== "object" || Array.isArray(b.partes)) throw invalido("cópia");
  if (Object.keys(b.partes).length > 200) return erro("Partes demais numa chamada.", 400);
  const n = await gravarCopia(b.nav, eu, b.partes);
  return json({ ok: true, gravadas: n });
});
