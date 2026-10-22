// Login: e-mail + senha (tabela sorelly.usuario_login ligada à tabela "user" do banco). Devolve um token (JWT) que o sistema manda em cada pedido.
// Permissão: "user".role = ADMIN é a Diretoria (vê e edita tudo); MEMBER vê e marca só o que é dele. "user".sectors guarda os setores da pessoa.
import { consulta } from "./db.js";
import { conferirSenha } from "./senha.js";

export async function rotasAuth(app) {
  app.post("/auth/login", {
    config: { rateLimit: false },
    schema: { body: { type: "object", required: ["email", "senha"], properties: { email: { type: "string" }, senha: { type: "string" } } } }
  }, async (req, reply) => {
    const { email, senha } = req.body;
    const r = await consulta(
      `select u.id, u.name, u.email, u.role, l.setores, l.senha_hash, l.pessoa_id
         from public."user" u join sorelly.usuario_login l on l.user_id = u.id
        where lower(u.email) = lower($1)`, [email.trim()]);
    const u = r.rows[0];
    // mesma resposta para e-mail errado e senha errada (não revela quem existe)
    if (!u || !(await conferirSenha(senha, u.senha_hash))) return reply.code(401).send({ erro: "E-mail ou senha incorretos." });
    const usuario = { id: u.id, nome: u.name, email: u.email, perfil: u.role, setores: u.setores || [], pessoaId: u.pessoa_id };
    return { token: app.jwt.sign(usuario, { expiresIn: "12h" }), usuario };
  });

  app.get("/auth/eu", { onRequest: [app.autenticar] }, async (req) => ({ usuario: req.user }));
}

// Só a Diretoria passa. Usado nas rotas que mudam combinados.
export async function soDiretoria(req, reply) {
  if (req.user?.perfil !== "ADMIN") return reply.code(403).send({ erro: "Só a Diretoria pode fazer isso." });
}
