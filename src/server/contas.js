// Contas de acesso do sistema novo (tabela sorelly.conta). A pessoa cria a própria conta e fica "aguardando"; a Diretoria libera,
// liga a conta a uma pessoa do sistema (pessoa_id = id em domain/equipe.js) e escolhe os setores. Não mexe na tabela "user" do admin antigo.
import { consulta } from "./db.js";
import { SETORES_VALIDOS } from "./permissoes.js";
import { invalido } from "./http.js";

export const STATUS = ["aguardando", "ativo", "bloqueado"];
export const PERFIS = ["ADMIN", "MEMBER"];
// grupos de acesso do menu (os mesmos de navigation/perfis.js; "basico" = só Início, Rotina e Chat)
export const GRUPOS_VALIDOS = ["supervisao", "familia", "supervisora", "agendamento", "financeiro", "inadimplencia", "bipadora", "montadora", "listagens", "kitnovo", "cadastropecas", "linkcadastro", "basico"];

export const paraConta = (r) => ({ id: r.id, nome: r.nome, email: r.email, status: r.status, perfil: r.perfil, setores: r.setores || [], pessoaId: r.pessoa_id, criadoEm: r.criado_em, aprovadoPor: r.aprovado_por || "", login: r.login || "", abas: r.abas || null, ocultar: r.ocultar || null, grupo: r.grupo || null, cid: r.cid || null, senhaProvisoria: r.senha_provisoria || "" });   // só a lista da Diretoria usa paraConta

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
  if (b.login !== undefined) {
    if (b.login === null || b.login === "") o.login = null;
    else { const l = normalizarLogin(b.login); if (l.length < 2 || l.length > 40) throw invalido("login (2 a 40 letras)"); o.login = l; }
  }
  if (b.grupo !== undefined) { if (b.grupo === null || b.grupo === "") o.grupo = null; else if (!GRUPOS_VALIDOS.includes(b.grupo)) throw invalido("grupo"); else o.grupo = b.grupo; }
  if (b.cid !== undefined) { if (b.cid === null || b.cid === "") o.cid = null; else if (typeof b.cid !== "string" || !/^[a-z0-9_]{2,80}$/.test(b.cid)) throw invalido("cid"); else o.cid = b.cid; }
  for (const k of ["abas", "ocultar"]) {
    if (b[k] === undefined) continue;
    if (b[k] === null) { o[k] = null; continue; }
    if (!Array.isArray(b[k]) || b[k].length > 300 || !b[k].every((x) => typeof x === "string" && /^[a-z0-9_]{1,40}$/.test(x))) throw invalido(k);
    o[k] = [...new Set(b[k])];
  }
  return o;
}

// Login pelo nome: minúsculas, sem acento e SEM espaço ("Michele Brito" vira "michelebrito"; quem digita com espaço também entra).
export const normalizarLogin = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9._-]/g, "");

export const contaPorEmail = async (email) => (await consulta("select * from sorelly.conta where lower(email) = lower($1)", [email])).rows[0];
// Quem entra pode digitar o e-mail ou o login (nome). Sem a coluna "login" no banco, só vale o e-mail.
export async function contaPorIdentificador(texto) {
  const t = String(texto || "").trim();
  if (t.includes("@")) return contaPorEmail(t);
  try { return (await consulta("select * from sorelly.conta where login = $1", [normalizarLogin(t)])).rows[0]; } catch (e) { return undefined; }
}
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
