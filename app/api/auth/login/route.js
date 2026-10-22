export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Login: e-mail + senha (tabela sorelly.usuario_login ligada à tabela "user" do banco). Devolve um token (JWT) que o sistema manda em cada pedido.
// Permissão: "user".role = ADMIN é a Diretoria (vê e edita tudo); MEMBER vê e marca só o que é dele. "user".sectors guarda os setores da pessoa.
import { json, erro, rota, corpo, assinar, invalido } from "@/server/http";
import { consulta } from "@/server/db";
import { conferirSenha } from "@/server/senha";

export const POST = rota(async (req) => {
  const b = await corpo(req);
  if (typeof b.email !== "string" || typeof b.senha !== "string") throw invalido("informe email e senha");
  const r = await consulta(
    `select u.id, u.name, u.email, u.role, l.setores, l.senha_hash, l.pessoa_id
       from public."user" u join sorelly.usuario_login l on l.user_id = u.id
      where lower(u.email) = lower($1)`, [b.email.trim()]);
  const u = r.rows[0];
  // mesma resposta para e-mail errado e senha errada (não revela quem existe)
  if (!u || !(await conferirSenha(b.senha, u.senha_hash))) return erro("E-mail ou senha incorretos.", 401);
  const usuario = { id: u.id, nome: u.name, email: u.email, perfil: u.role, setores: u.setores || [], pessoaId: u.pessoa_id };
  return json({ token: await assinar(usuario), usuario });
}, { publica: true });
