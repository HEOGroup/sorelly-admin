// Contas de acesso do sistema novo (tabela sorelly.conta). A pessoa cria a própria conta e fica "aguardando"; a Diretoria libera,
// liga a conta a uma pessoa do sistema (pessoa_id = id em domain/equipe.js) e escolhe os setores. Não mexe na tabela "user" do admin antigo.
import { consulta } from "./db.js";
import { SETORES_VALIDOS } from "./permissoes.js";
import { invalido } from "./http.js";

export const STATUS = ["aguardando", "ativo", "bloqueado"];
export const PERFIS = ["ADMIN", "MEMBER"];

export const paraConta = (r) => ({ id: r.id, nome: r.nome, email: r.email, status: r.status, perfil: r.perfil, setores: r.setores || [], pessoaId: r.pessoa_id, criadoEm: r.criado_em, aprovadoPor: r.aprovado_por || "" });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCadastro(b) {
  const nome = typeof b.nome === "string" ? b.nome.trim().replace(/\s+/g, " ") : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const senha = typeof b.senha === "string" ? b.senha : "";
  if (nome.length < 2 || nome.length > 80) throw invalido("informe o nome (2 a 80 letras)");
  if (!EMAIL.test(email) || email.length > 120) throw invalido("e-mail inválido");
  if (senha.length < 8 || senha.length > 100) throw invalido("a senha precisa ter de 8 a 100 caracteres");
  return { nome, email, senha };
}

// Alterações feitas pela Diretoria: só o que veio no corpo é validado e trocado.
export function validarAlteracao(b) {
  const o = {};
  if (b.status !== undefined) { if (!STATUS.includes(b.status)) throw invalido("status"); o.status = b.status; }
  if (b.perfil !== undefined) { if (!PERFIS.includes(b.perfil)) throw invalido("perfil"); o.perfil = b.perfil; }
  if (b.setores !== undefined) {
    if (!Array.isArray(b.setores) || !b.setores.every((x) => SETORES_VALIDOS.includes(x))) throw invalido("setores");
    o.setores = [...new Set(b.setores)];
  }
  if (b.pessoaId !== undefined) { if (b.pessoaId !== null && !Number.isInteger(b.pessoaId)) throw invalido("pessoaId"); o.pessoaId = b.pessoaId; }
  if (b.nome !== undefined) { if (typeof b.nome !== "string" || b.nome.trim().length < 2) throw invalido("nome"); o.nome = b.nome.trim(); }
  if (b.senha !== undefined) { if (typeof b.senha !== "string" || b.senha.length < 8 || b.senha.length > 100) throw invalido("a senha precisa ter de 8 a 100 caracteres"); o.senha = b.senha; }
  return o;
}

export const contaPorEmail = async (email) => (await consulta("select * from sorelly.conta where lower(email) = lower($1)", [email])).rows[0];
export const contaPorId = async (id) => (await consulta("select * from sorelly.conta where id::text = $1", [String(id)])).rows[0];

// Limite simples de cadastros por endereço (memória do servidor): 5 por hora.
const G = globalThis;
export function limiteCadastro(ip) {
  const mapa = (G.__sorellyCadastros = G.__sorellyCadastros || new Map()), agora = Date.now();
  const lista = (mapa.get(ip) || []).filter((t) => agora - t < 3600 * 1000);
  if (lista.length >= 5) return false;
  lista.push(agora); mapa.set(ip, lista);
  return true;
}
