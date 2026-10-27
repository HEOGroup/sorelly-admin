export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A própria pessoa troca a sua senha (precisa informar a atual). A Diretoria também pode redefinir a senha de qualquer conta, na aba Contas.
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { conferirSenha, criarHash } from "@/server/senha";

export const PATCH = rota(async (req, { eu }) => {
  if (!eu.conta) return erro("Esta conta não permite trocar a senha por aqui.", 400);
  const b = await corpo(req, 8 * 1024);
  if (typeof b.atual !== "string" || typeof b.nova !== "string") throw invalido("informe a senha atual e a nova");
  if (b.nova.length < 8 || b.nova.length > 100) throw invalido("a senha nova precisa ter de 8 a 100 caracteres");
  if (b.nova === b.atual) throw invalido("a senha nova precisa ser diferente da atual");
  const c = (await consulta("select senha_hash from sorelly.conta where id::text = $1", [String(eu.id)])).rows[0];
  if (!c || !(await conferirSenha(b.atual, c.senha_hash))) return erro("A senha atual está incorreta.", 400);
  await consulta("update sorelly.conta set senha_hash = $2, atualizado_em = now() where id::text = $1", [String(eu.id), await criarHash(b.nova)]);
  return json({ ok: true });
});
