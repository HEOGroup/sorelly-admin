export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Cadastro: a pessoa cria a própria conta (nome, e-mail e senha). A conta nasce "aguardando": só entra depois que a Diretoria libera e escolhe os setores.
import { json, erro, rota, corpo } from "@/server/http";
import { consulta } from "@/server/db";
import { criarHash } from "@/server/senha";
import { validarCadastro, limiteCadastro } from "@/server/contas";

export const POST = rota(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!limiteCadastro(ip)) return erro("Muitos cadastros por aqui. Tente de novo mais tarde.", 429);
  const c = validarCadastro(await corpo(req));
  try {
    await consulta("insert into sorelly.conta (nome, email, senha_hash) values ($1, $2, $3)", [c.nome, c.email, await criarHash(c.senha)]);
  } catch (e) {
    if (e && e.code === "23505") return erro("Este e-mail já tem conta. Entre com a sua senha ou peça à Diretoria.", 409);
    throw e;
  }
  return json({ ok: true, mensagem: "Conta criada. Agora a Diretoria precisa liberar o seu acesso." }, 201);
}, { publica: true });
