export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Alterar uma conta (só a Diretoria): liberar ou bloquear, ligar a uma pessoa do sistema, escolher setores e perfil, trocar a senha.
import { json, erro, rota, corpo, invalido } from "@/server/http";
import { consulta } from "@/server/db";
import { criarHash } from "@/server/senha";
import { paraConta, validarAlteracao } from "@/server/contas";

export const PATCH = rota(async (req, { eu, params }) => {
  const a = validarAlteracao(await corpo(req));
  if (!Object.keys(a).length) throw invalido("nada para mudar");
  // a Diretoria não se tranca para fora do próprio sistema
  if (String(params.id) === String(eu.id) && ((a.status && a.status !== "ativo") || (a.perfil && a.perfil !== "ADMIN"))) return erro("Você não pode bloquear nem tirar a Diretoria da sua própria conta.", 400);
  const sets = ["atualizado_em = now()"], v = [String(params.id)];
  const poe = (col, val) => { v.push(val); sets.push(`${col} = $${v.length}`); };
  if (a.status !== undefined) { poe("status", a.status); if (a.status === "ativo") poe("aprovado_por", eu.nome); }
  if (a.perfil !== undefined) poe("perfil", a.perfil);
  if (a.setores !== undefined) poe("setores", a.setores);
  if (a.pessoaId !== undefined) poe("pessoa_id", a.pessoaId);
  if (a.nome !== undefined) poe("nome", a.nome);
  if (a.login !== undefined) poe("login", a.login);
  if (a.abas !== undefined) poe("abas", a.abas);
  if (a.ocultar !== undefined) poe("ocultar", a.ocultar);
  if (a.grupo !== undefined) poe("grupo", a.grupo);
  if (a.cid !== undefined) poe("cid", a.cid);
  if (a.senha !== undefined) { poe("senha_hash", await criarHash(a.senha)); poe("senha_provisoria", a.senha); }   // a Diretoria que redefine pode reenviar a senha
  let r;
  try { r = await consulta(`update sorelly.conta set ${sets.join(", ")} where id::text = $1 returning *`, v); }
  catch (x) { if (x && x.code === "23505") return erro("Este login já está em uso por outra pessoa.", 409); throw x; }
  return r.rows[0] ? json({ conta: paraConta(r.rows[0]) }) : erro("Conta não encontrada.", 404);
}, { diretoria: true });
