// Encomendas e reposições › PEDIDO POR LINK (17/11/2026, Marcus: "o WhatsApp assim está inviável; link nosso, ligado direto no sistema; 48 horas; o link é o nome dela, nem toda vendedora pode").
// A funcionária do setor gera um link com o NOME da revendedora (vale 48 h). A revendedora abre a página pública, manda as fotos (cor + observação curta) e aceita a taxa.
// O envio fica guardado aqui (tabela sorelly.pedido_link) e a tela do Funil traz para dentro do sistema como pedido (um clique de "reivindicar" evita duplicar).
// As fotos vão para sorelly.anexo_modulo (módulo "er"), com por = "link:<código>", e o pedido guarda só a chave.
import { randomBytes } from "node:crypto";
import { consulta } from "./db.js";
import { garantirTabelaAnexo, chaveAnexoValida, urlAnexoValida } from "./anexos.js";

export const HORAS_VALIDADE = 48;
export const MAX_FOTOS_LINK = 12;
const COR = ["dourado", "prata", "os dois"];

let pronta = null;
export function garantirTabelaLink() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.pedido_link (
    id text primary key, revendedora text not null, cod text, representante text, telefone text, cidade text, media numeric, taxa numeric not null default 0,
    criado_por text, criado_em timestamptz not null default now(), expira_em timestamptz not null,
    status text not null default 'aberto', enviado_em timestamptz, dados jsonb, importado_em timestamptz, importado_por text, uf text)`).then(() => consulta("alter table sorelly.pedido_link add column if not exists uf text")).then(() => consulta("alter table sorelly.pedido_link add column if not exists empresa boolean not null default false")).catch((e) => { pronta = null; throw e; });
  return pronta;
}

const semAcento = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = (nome) => semAcento(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "revendedora";
export const codigoValido = (c) => typeof c === "string" && /^[a-z0-9-]{12,80}$/.test(c);

/** Cria o link da revendedora: nome + código aleatório (o código é o que protege; o nome só deixa o endereço legível). */
export async function criarLink({ nome, cod, representante, telefone, cidade, uf, media, taxa, empresa, por }) {
  await garantirTabelaLink();
  const n = String(nome || "").trim().slice(0, 120);
  if (!n) throw Object.assign(new Error("Dados inválidos: informe a revendedora."), { statusCode: 400 });
  const id = slug(n)+"-"+randomBytes(5).toString("hex");
  await consulta(`insert into sorelly.pedido_link (id, revendedora, cod, representante, telefone, cidade, media, taxa, criado_por, uf, empresa, expira_em)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $11, $12, now() + ($10 || ' hours')::interval)`,
    [id, n, String(cod || "").slice(0, 20), String(representante || "").slice(0, 120), String(telefone || "").slice(0, 30), String(cidade || "").slice(0, 80), Number.isFinite(Number(media)) && media !== "" && media !== null ? Number(media) : null, Number(taxa) > 0 ? Number(taxa) : 0, String(por || "").slice(0, 80), String(HORAS_VALIDADE), String(uf || "").trim().toUpperCase().slice(0, 2), empresa === true]);
  return id;
}

/** Estado do link para a página pública: aberto, enviado, expirado ou inexistente. */
export async function lerLink(id) {
  if (!codigoValido(id)) return null;
  await garantirTabelaLink();
  const r = (await consulta("select id, revendedora, taxa, uf, empresa, status, expira_em, enviado_em, (expira_em < now()) as vencido from sorelly.pedido_link where id = $1", [id])).rows[0];
  if (!r) return null;
  const estado = r.status !== "aberto" ? "enviado" : r.vencido ? "expirado" : "aberto";
  const forcaEncomenda = !!(r.uf && r.uf !== "PR");   // outro estado: só encomenda (vai no próximo kit)
  return { id: r.id, primeiroNome: String(r.revendedora).trim().split(/\s+/)[0], taxa: Number(r.taxa) || 0, estado, expiraEm: r.expira_em, forcaEncomenda, podeEmpresa: r.empresa === true && !forcaEncomenda };
}

/** Guarda UMA foto do link (a página manda uma por vez, já reduzida). */
export async function gravarFoto(id, { nome, url }) {
  const l = await lerLink(id);
  if (!l) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  if (l.estado !== "aberto") throw Object.assign(new Error(l.estado === "expirado" ? "Este link expirou." : "Este pedido já foi enviado."), { statusCode: 410 });
  if (!urlAnexoValida(url) || url.length > 4 * 1024 * 1024) throw Object.assign(new Error("Dados inválidos: foto."), { statusCode: 400 });
  await garantirTabelaAnexo();
  const por = "link:" + id;
  const n = (await consulta("select count(*)::int as n from sorelly.anexo_modulo where por = $1", [por])).rows[0].n;
  if (n >= MAX_FOTOS_LINK) throw Object.assign(new Error("Dados inválidos: máximo de " + MAX_FOTOS_LINK + " fotos."), { statusCode: 400 });
  const key = "an_" + randomBytes(7).toString("hex").slice(0, 12);
  await consulta("insert into sorelly.anexo_modulo (id, modulo, nome, mime, url, tamanho, por) values ($1, 'er', $2, $3, $4, $5, $6)", [key, String(nome || "foto").slice(0, 120), String(url.slice(5, url.indexOf(";"))), url, url.length, por]);
  return key;
}

/** Fecha o pedido: confere que as fotos são deste link e grava. Só vale uma vez. */
const HORARIOS = ["manhã (8h às 12h)", "tarde (13h às 18h)", "qualquer horário"];
export async function enviarPedido(id, { tipo, fotos, textos, obs, aceite, entrega, forma, retirada }) {
  const l = await lerLink(id);
  if (!l) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  if (l.estado !== "aberto") throw Object.assign(new Error(l.estado === "expirado" ? "Este link expirou." : "Este pedido já foi enviado."), { statusCode: 410 });
  const lista = (Array.isArray(fotos) ? fotos : []).filter((f) => f && chaveAnexoValida(f.key)).slice(0, MAX_FOTOS_LINK);
  const donas = lista.length ? new Set((await consulta("select id from sorelly.anexo_modulo where por = $1 and id = any($2)", ["link:" + id, lista.map((f) => f.key)])).rows.map((x) => x.id)) : new Set();
  const limpas = lista.filter((f) => donas.has(f.key)).map((f) => ({ key: f.key, cor: COR.includes(f.cor) ? f.cor : "", obs: String(f.obs || "").trim().slice(0, 160) }));
  const soTexto = (Array.isArray(textos) ? textos : []).slice(0, 12).map((t) => ({ cor: COR.includes(t && t.cor) ? t.cor : "", obs: String((t && t.obs) || "").trim().slice(0, 160) })).filter((t) => t.obs);
  if (!limpas.length && !soTexto.length) throw Object.assign(new Error("Dados inválidos: mande ao menos uma foto ou uma descrição."), { statusCode: 400 });
  const tp = l.forcaEncomenda || tipo === "encomenda" ? "encomenda" : "reposicao";
  if (!aceite) throw Object.assign(new Error("Dados inválidos: é preciso aceitar as condições."), { statusCode: 400 });
  const t = (v, n) => String((v) || "").trim().slice(0, n);
  let ent = null, ret = null;
  if (tp === "reposicao" && forma === "empresa") {   // ela mesma retira na empresa (só quem tem direito: Top 50 ou média de R$ 2.000 ou mais): precisa de dia e hora
    if (!l.podeEmpresa) throw Object.assign(new Error("Dados inválidos: a retirada na empresa não está liberada para este link."), { statusCode: 400 });
    const r = retirada && typeof retirada === "object" ? retirada : {};
    ret = { dia: t(r.dia, 10), hora: t(r.hora, 5) };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ret.dia) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(ret.hora)) throw Object.assign(new Error("Dados inválidos: informe o dia e a hora da retirada."), { statusCode: 400 });
  } else if (tp === "reposicao") {   // reposição é entregue: precisa de endereço e horário
    const e = entrega && typeof entrega === "object" ? entrega : {};
    ent = { rua: t(e.rua, 120), bairro: t(e.bairro, 80), cidade: t(e.cidade, 80), complemento: t(e.complemento, 120), horario: HORARIOS.includes(e.horario) ? e.horario : "", horarioObs: t(e.horarioObs, 120) };
    if (!ent.rua || !ent.cidade || !ent.horario) throw Object.assign(new Error("Dados inválidos: informe o endereço e o horário da entrega."), { statusCode: 400 });
  }
  const dados = { tipo: tp, fotos: limpas, textos: soTexto, obs: t(obs, 300), aceite: true, entrega: ent, retirada: ret };
  const r = await consulta("update sorelly.pedido_link set status = 'enviado', enviado_em = now(), dados = $2 where id = $1 and status = 'aberto' and expira_em > now() returning id", [id, JSON.stringify(dados)]);
  if (!r.rows.length) throw Object.assign(new Error("Este link não aceita mais envio."), { statusCode: 410 });
  return true;
}

// ---------- lado do sistema (funcionárias) ----------
export async function listarLinks() {
  await garantirTabelaLink();
  return (await consulta(`select id, revendedora, status, criado_por, criado_em, expira_em, enviado_em, importado_em, (expira_em < now()) as vencido
    from sorelly.pedido_link order by criado_em desc limit 40`)).rows.map((x) => ({
    id: x.id, revendedora: x.revendedora, criadoPor: x.criado_por, criadoEm: x.criado_em, expiraEm: x.expira_em, enviadoEm: x.enviado_em,
    estado: x.status === "importado" ? "no funil" : x.status === "importando" ? "chegando" : x.status === "enviado" ? "enviado" : x.vencido ? "expirado" : "aberto" }));
}

export async function recebidos() {
  await garantirTabelaLink();
  return (await consulta("select id, revendedora, cod, representante, telefone, cidade, media, taxa, dados, enviado_em from sorelly.pedido_link where status = 'enviado' or (status = 'importando' and importado_em < now() - interval '3 minutes') order by enviado_em limit 20")).rows.map((x) => ({
    id: x.id, revendedora: x.revendedora, cod: x.cod || "", representante: x.representante || "", telefone: x.telefone || "", cidade: x.cidade || "", media: x.media === null ? null : Number(x.media), taxa: Number(x.taxa) || 0, dados: x.dados, enviadoEm: x.enviado_em }));
}

/** Quem chega primeiro leva: devolve true uma única vez por link (evita duas telas criarem o mesmo pedido). */
export async function reivindicar(id, por, desfazer = false, confirmar = false) {
  if (!codigoValido(id)) return false;
  await garantirTabelaLink();
  if (confirmar) {
    const c = await consulta("update sorelly.pedido_link set status = 'importado', importado_em = now() where id = $1 and status in ('importando', 'enviado') returning id", [id]);
    return c.rows.length > 0;
  }
  if (desfazer) {
    const d = await consulta("update sorelly.pedido_link set status = 'enviado', importado_em = null, importado_por = null where id = $1 and status in ('importado', 'importando') returning id", [id]);
    return d.rows.length > 0;
  }
  const r = await consulta("update sorelly.pedido_link set status = 'importando', importado_em = now(), importado_por = $2 where id = $1 and (status = 'enviado' or (status = 'importando' and importado_em < now() - interval '3 minutes')) returning id", [id, String(por || "").slice(0, 80)]);
  return r.rows.length > 0;
}
