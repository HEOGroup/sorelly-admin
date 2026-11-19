// Encomendas e reposições › PEDIDO POR LINK (17/11/2026, Marcus: "o WhatsApp assim está inviável; link nosso, ligado direto no sistema; 48 horas; o link é o nome dela, nem toda vendedora pode").
// A funcionária do setor gera um link com o NOME da revendedora (vale 48 h). A revendedora abre a página pública, manda as fotos (cor + observação curta) e aceita a taxa.
// O envio fica guardado aqui (tabela sorelly.pedido_link) e a tela do Funil traz para dentro do sistema como pedido (um clique de "reivindicar" evita duplicar).
// As fotos vão para sorelly.anexo_modulo (módulo "er"), com por = "link:<código>", e o pedido guarda só a chave.
import { randomBytes } from "node:crypto";
import { consulta } from "./db.js";
import { garantirTabelaAnexo, chaveAnexoValida, urlAnexoValida } from "./anexos.js";
import { fotoDaPeca } from "./separar-pecas.js";

export const HORAS_VALIDADE = 48;
export const MAX_FOTOS_LINK = 10;   // máximo de peças por pedido (Marcus, 18/11/2026)
const COR = ["dourado", "prata", "os dois"];

let pronta = null;
export function garantirTabelaLink() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.pedido_link (
    id text primary key, revendedora text not null, cod text, representante text, telefone text, cidade text, media numeric, taxa numeric not null default 0,
    criado_por text, criado_em timestamptz not null default now(), expira_em timestamptz not null,
    status text not null default 'aberto', enviado_em timestamptz, dados jsonb, importado_em timestamptz, importado_por text, uf text)`).then(() => consulta("alter table sorelly.pedido_link add column if not exists uf text")).then(() => consulta("alter table sorelly.pedido_link add column if not exists empresa boolean not null default false")).then(() => consulta("alter table sorelly.pedido_link add column if not exists publicadas jsonb, add column if not exists retorno jsonb, add column if not exists publicado_em timestamptz")).then(() => consulta("alter table sorelly.pedido_link add column if not exists limite jsonb")).catch((e) => { pronta = null; throw e; });
  return pronta;
}

const semAcento = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = (nome) => semAcento(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "revendedora";
export const codigoValido = (c) => typeof c === "string" && /^[a-z0-9-]{12,80}$/.test(c);

/** Cria o link da revendedora: nome + código aleatório (o código é o que protege; o nome só deixa o endereço legível). */
export async function criarLink({ nome, cod, representante, telefone, cidade, uf, media, taxa, empresa, limite, por }) {
  await garantirTabelaLink();
  const n = String(nome || "").trim().slice(0, 120);
  if (!n) throw Object.assign(new Error("Dados inválidos: informe a revendedora."), { statusCode: 400 });
  const id = slug(n)+"-"+randomBytes(5).toString("hex");
  await consulta(`insert into sorelly.pedido_link (id, revendedora, cod, representante, telefone, cidade, media, taxa, criado_por, uf, empresa, expira_em)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $11, $12, now() + ($10 || ' hours')::interval)`,
    [id, n, String(cod || "").slice(0, 20), String(representante || "").slice(0, 120), String(telefone || "").slice(0, 30), String(cidade || "").slice(0, 80), Number.isFinite(Number(media)) && media !== "" && media !== null ? Number(media) : null, Number(taxa) > 0 ? Number(taxa) : 0, String(por || "").slice(0, 80), String(HORAS_VALIDADE), String(uf || "").trim().toUpperCase().slice(0, 2), empresa === true]);
  // limite liberado para ela (valor máximo por reposição e reposições por mês): aparece na página dela (Marcus, 18/11/2026)
  const mx = limite && Number(limite.max) > 0 ? Math.round(Number(limite.max) * 100) / 100 : 0, qt = limite && Number(limite.qtd) > 0 ? Math.round(Number(limite.qtd)) : 0;
  // a tabela inteira (média → valor máximo) e a regra de quantas por mês, para a página "Valores de reposição" do link
  const tabela = (limite && Array.isArray(limite.tabela) ? limite.tabela : []).slice(0, 12).map((x) => ({ de: Number(x && x.de) || 0, max: Number(x && x.max) || 0 })).filter((x) => x.max > 0);
  const qr = limite && limite.qtdRegra && typeof limite.qtdRegra === "object" ? limite.qtdRegra : null;
  const qtdRegra = qr ? { limiteMedia: Number(qr.limiteMedia) || 0, abaixo: Number(qr.abaixo) || 0, acima: Number(qr.acima) || 0, top50: Number(qr.top50) || 0 } : null;
  if (mx > 0) await consulta("update sorelly.pedido_link set limite = $2 where id = $1", [id, JSON.stringify({ max: mx, qtd: qt, tabela, qtdRegra })]);
  return id;
}

/** Estado do link para a página pública: aberto, enviado, expirado ou inexistente. */
export const MAX_EXTRAS = 2;   // regra do Marcus (18/11/2026): depois das peças encontradas, ela pode pedir mais peças no máximo 2 vezes
/** Pix da taxa de entrega (config do módulo er, preenchida em Encomendas → Regras). Só sai para o link depois que o setor avisa que separou. */
async function pixDaTaxa() {
  try { const r = (await consulta("select conteudo->'config'->'pix' as pix from sorelly.estado_modulo where modulo = 'er'")).rows[0]; const p = r && r.pix; return p && p.chave ? { chave: String(p.chave), tipo: String(p.tipo || ""), titular: String(p.titular || ""), recebedor: String(p.recebedor || "") } : null; } catch (x) { return null; }
}
export async function lerLink(id) {
  if (!codigoValido(id)) return null;
  await garantirTabelaLink();
  const r = (await consulta("select id, revendedora, taxa, uf, empresa, status, expira_em, enviado_em, publicadas, retorno, limite, dados, (expira_em < now()) as vencido from sorelly.pedido_link where id = $1", [id])).rows[0];
  if (!r) return null;
  const temPecas = Array.isArray(r.publicadas) && r.publicadas.length > 0;
  const estado = temPecas ? (r.vencido ? "expirado" : "acompanhar") : r.status !== "aberto" ? "enviado" : r.vencido ? "expirado" : "aberto";
  const acompanhar = temPecas && !r.vencido ? { pecas: r.publicadas.map((x) => ({ cod: x.cod, desc: x.desc || "", preco: x.preco == null ? null : Number(x.preco) })), retorno: r.retorno || null } : null;
  // o que ELA pediu (para ela rever em outra aba: "às vezes nem ela lembra", Marcus 18/11/2026)
  const d = r.dados && typeof r.dados === "object" ? r.dados : null;
  const pedido = d ? { tipo: d.tipo || "", em: r.enviado_em || null, obs: d.obs || "", fotos: (Array.isArray(d.fotos) ? d.fotos : []).filter((f) => f && chaveAnexoValida(f.key)).map((f) => ({ key: f.key, cor: f.cor || "", obs: f.obs || "" })), textos: (Array.isArray(d.textos) ? d.textos : []).map((t) => ({ cor: (t && t.cor) || "", obs: (t && t.obs) || "" })) } : null;
  const extras = d && Array.isArray(d.extras) ? d.extras.map((x) => ({ em: x.em || "", obs: x.obs || "", fotos: (Array.isArray(x.fotos) ? x.fotos : []).filter((f) => f && chaveAnexoValida(f.key)).map((f) => ({ key: f.key, cor: f.cor || "", obs: f.obs || "" })), textos: (Array.isArray(x.textos) ? x.textos : []).map((t) => ({ cor: (t && t.cor) || "", obs: (t && t.obs) || "" })) })) : [];
  // peças separadas (18/11/2026, Marcus): o setor avisa, o MESMO link passa a pedir a taxa de entrega por Pix; sem pagamento o pedido não é liberado
  const sepPecas = d && d.separado && Array.isArray(d.separado.pecas) ? d.separado.pecas.map((x) => ({ cod: x.cod, desc: x.desc || "", preco: x.preco == null ? null : Number(x.preco) })) : [];
  const sep = d && d.separado ? { em: d.separado.em || "", pecas: sepPecas, total: Math.round(sepPecas.reduce((t, x) => t + (Number(x.preco) || 0), 0) * 100) / 100, taxa: Number(r.taxa) || 0, pix: Number(r.taxa) > 0 ? await pixDaTaxa() : null, pago: d.pagamento ? { em: d.pagamento.em || "" } : null } : null;
  const forcaEncomenda = !!(r.uf && r.uf !== "PR");   // outro estado: só encomenda (vai no próximo kit)
  return { id: r.id, primeiroNome: String(r.revendedora).trim().split(/\s+/)[0], taxa: Number(r.taxa) || 0, estado, expiraEm: r.expira_em, forcaEncomenda, podeEmpresa: r.empresa === true && !forcaEncomenda, acompanhar, limite: r.limite || null, pedido, extras, extrasMax: MAX_EXTRAS, separado: sep };
}

// ---------- peças encontradas pelo setor, para a revendedora aprovar no MESMO link (18/11/2026, Marcus) ----------
// A funcionária publica as peças separadas (código, descrição, preço e, quando a DevMaster não tem foto, a foto dela). A revendedora abre o link, vê as fotos e marca o que quer.
const CODIGO_PECA = /^[A-Z0-9]{2,20}$/;
/** Lado do sistema: guarda as peças que a revendedora vai ver e estende a validade do link em 5 dias. */
export async function publicarPecas(id, pecas) {
  if (!codigoValido(id)) throw Object.assign(new Error("Link inválido."), { statusCode: 400 });
  await garantirTabelaLink();
  const lista = (Array.isArray(pecas) ? pecas : []).slice(0, 120).map((x) => ({
    cod: String((x && x.cod) || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""), desc: String((x && x.desc) || "").trim().slice(0, 160),
    preco: x && Number(x.preco) > 0 ? Math.round(Number(x.preco) * 100) / 100 : null, anexo: x && chaveAnexoValida(x.anexo) ? x.anexo : "" })).filter((x) => CODIGO_PECA.test(x.cod));
  if (!lista.length) throw Object.assign(new Error("Nenhuma peça para publicar."), { statusCode: 400 });
  const r = await consulta("update sorelly.pedido_link set publicadas = $2, publicado_em = now(), retorno = null, expira_em = greatest(expira_em, now() + interval '120 hours') where id = $1 returning id", [id, JSON.stringify(lista)]);
  if (!r.rows.length) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  return lista.length;
}
/** Lado do sistema: resposta da revendedora para cada link pedido. */
export async function retornos(ids) {
  await garantirTabelaLink();
  const lista = (Array.isArray(ids) ? ids : []).filter(codigoValido).slice(0, 30);
  if (!lista.length) return {};
  const r = await consulta("select id, retorno, publicado_em, dados->'extras' as extras, dados->'separado' as separado, dados->'pagamento' as pagamento from sorelly.pedido_link where id = any($1) and publicadas is not null", [lista]);
  const o = {}; r.rows.forEach((x) => { o[x.id] = { retorno: x.retorno || null, publicadoEm: x.publicado_em, extras: Array.isArray(x.extras) ? x.extras : [], separado: x.separado || null, pagamento: x.pagamento || null }; }); return o;
}
/** Lado público: a revendedora diz quais peças quer. Vale a última resposta. */
export async function aprovarPecas(id, { quer, obs, notas }) {
  const l = await lerLink(id);
  if (!l) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  if (l.estado !== "acompanhar") throw Object.assign(new Error(l.estado === "expirado" ? "Este link expirou." : "Ainda não há peças para você ver."), { statusCode: 410 });
  const todas = l.acompanhar.pecas.map((p) => p.cod), sim = (Array.isArray(quer) ? quer : []).map((c) => String(c || "").toUpperCase()).filter((c) => todas.includes(c));
  const nt = {}; if (notas && typeof notas === "object") todas.forEach((c) => { const t = String(notas[c] || "").trim().slice(0, 160); if (t) nt[c] = t; });   // observação da revendedora em cada peça
  const retorno = { em: new Date().toISOString(), quer: Array.from(new Set(sim)), nao: todas.filter((c) => !sim.includes(c)), obs: String(obs || "").trim().slice(0, 300), notas: nt };
  await consulta("update sorelly.pedido_link set retorno = $2 where id = $1", [id, JSON.stringify(retorno)]);
  return retorno;
}
/** Lado do sistema: o setor separou as peças. O link passa a mostrar a taxa e o Pix. */
export async function marcarSeparado(id, por, cods) {
  if (!codigoValido(id)) throw Object.assign(new Error("Link inválido."), { statusCode: 400 });
  await garantirTabelaLink();
  const l = (await consulta("select publicadas from sorelly.pedido_link where id = $1", [id])).rows[0];
  const pub = l && Array.isArray(l.publicadas) ? l.publicadas : [];
  const querCods = new Set((Array.isArray(cods) ? cods : []).map((c) => String(c || "").toUpperCase()));
  const pecas = pub.filter((x) => querCods.has(x.cod)).map((x) => ({ cod: x.cod, desc: x.desc || "", preco: x.preco == null ? null : Number(x.preco) }));
  if (pub.length && !pecas.length) throw Object.assign(new Error("Marque ao menos uma peça separada."), { statusCode: 400 });
  const r = await consulta("update sorelly.pedido_link set dados = jsonb_set(coalesce(dados, '{}'::jsonb), '{separado}', $2::jsonb), expira_em = greatest(expira_em, now() + interval '120 hours') where id = $1 and publicadas is not null returning id", [id, JSON.stringify({ em: new Date().toISOString(), por: String(por || "").slice(0, 60), pecas })]);
  if (!r.rows.length) throw Object.assign(new Error("Publique as peças no link antes de avisar que separou."), { statusCode: 400 });
  return true;
}
/** Lado público: a revendedora manda o comprovante da taxa (a foto já subiu em /foto). Não libera nada sozinho: a equipe confere. */
export async function enviarComprovante(id, key) {
  const l = await lerLink(id);
  if (!l) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  if (!l.separado) throw Object.assign(new Error("Ainda não há taxa para pagar."), { statusCode: 410 });
  if (!chaveAnexoValida(key)) throw Object.assign(new Error("Dados inválidos: comprovante."), { statusCode: 400 });
  const dona = (await consulta("select id from sorelly.anexo_modulo where por = $1 and id = $2", ["link:" + id, key])).rows.length > 0;
  if (!dona) throw Object.assign(new Error("Dados inválidos: comprovante."), { statusCode: 400 });
  await consulta("update sorelly.pedido_link set dados = jsonb_set(coalesce(dados, '{}'::jsonb), '{pagamento}', $2::jsonb) where id = $1", [id, JSON.stringify({ key, em: new Date().toISOString() })]);
  return true;
}
/** Lado público: depois de ver as peças, a revendedora pede MAIS peças (fotos e/ou descrições). No máximo MAX_EXTRAS vezes por link. */
export async function maisPecas(id, { fotos, textos, obs }) {
  const l = await lerLink(id);
  if (!l) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  if (l.estado !== "acompanhar") throw Object.assign(new Error(l.estado === "expirado" ? "Este link expirou." : "Ainda não dá para pedir mais peças."), { statusCode: 410 });
  if (l.extras.length >= MAX_EXTRAS) throw Object.assign(new Error("Dados inválidos: você já fez " + MAX_EXTRAS + " pedidos extras neste link."), { statusCode: 400 });
  const lista = (Array.isArray(fotos) ? fotos : []).filter((f) => f && chaveAnexoValida(f.key)).slice(0, MAX_FOTOS_LINK);
  const usadas = new Set([...(l.pedido ? l.pedido.fotos : []).map((f) => f.key), ...l.extras.flatMap((x) => x.fotos.map((f) => f.key))]);
  const donas = lista.length ? new Set((await consulta("select id from sorelly.anexo_modulo where por = $1 and id = any($2)", ["link:" + id, lista.map((f) => f.key)])).rows.map((x) => x.id)) : new Set();
  const limpas = lista.filter((f) => donas.has(f.key) && !usadas.has(f.key)).map((f) => ({ key: f.key, cor: COR.includes(f.cor) ? f.cor : "", obs: String(f.obs || "").trim().slice(0, 160) }));
  const soTexto = (Array.isArray(textos) ? textos : []).slice(0, MAX_FOTOS_LINK).map((t) => ({ cor: COR.includes(t && t.cor) ? t.cor : "", obs: String((t && t.obs) || "").trim().slice(0, 160) })).filter((t) => t.obs);
  if (limpas.length + soTexto.length > MAX_FOTOS_LINK) throw Object.assign(new Error("Dados inválidos: cada pedido tem no máximo " + MAX_FOTOS_LINK + " peças."), { statusCode: 400 });
  if (!limpas.length && !soTexto.length) throw Object.assign(new Error("Dados inválidos: mande ao menos uma foto ou uma descrição."), { statusCode: 400 });
  const novo = { em: new Date().toISOString(), fotos: limpas, textos: soTexto, obs: String(obs || "").trim().slice(0, 300) };
  const r = await consulta("update sorelly.pedido_link set dados = jsonb_set(coalesce(dados, '{}'::jsonb), '{extras}', coalesce(dados->'extras', '[]'::jsonb) || $2::jsonb) where id = $1 and expira_em > now() and coalesce(jsonb_array_length(dados->'extras'), 0) < $3 returning id", [id, JSON.stringify([novo]), MAX_EXTRAS]);
  if (!r.rows.length) throw Object.assign(new Error("Este link não aceita mais pedido extra."), { statusCode: 410 });
  return l.extras.length + 1;
}
/** Lado público: foto que a PRÓPRIA revendedora mandou no pedido dela. Só serve chave que está no pedido deste link. */
export async function fotoDoPedido(id, key) {
  if (!codigoValido(id) || !chaveAnexoValida(key)) return null;
  await garantirTabelaLink();
  const r = (await consulta("select dados from sorelly.pedido_link where id = $1", [id])).rows[0];
  const lista = r && r.dados ? [...(Array.isArray(r.dados.fotos) ? r.dados.fotos : []), ...(Array.isArray(r.dados.extras) ? r.dados.extras.flatMap((x) => (Array.isArray(x.fotos) ? x.fotos : [])) : [])] : [];
  if (!lista.some((f) => f && f.key === key)) return null;
  await garantirTabelaAnexo();
  const a = (await consulta("select url from sorelly.anexo_modulo where id = $1 and modulo = 'er'", [key])).rows[0];
  const m = a ? /^data:(image[/][a-z0-9.+-]+);base64,(.+)$/i.exec(a.url) : null;
  return m ? { mime: m[1], bytes: Buffer.from(m[2], "base64") } : null;
}
/** Lado público: foto de uma peça publicada (a da funcionária ou a da DevMaster). Só serve peça que está na lista do link. */
export async function fotoPublicaDaPeca(id, cod) {
  if (!codigoValido(id)) return null;
  await garantirTabelaLink();
  const r = (await consulta("select publicadas from sorelly.pedido_link where id = $1", [id])).rows[0];
  const p = r && Array.isArray(r.publicadas) ? r.publicadas.find((x) => x.cod === String(cod || "").toUpperCase()) : null;
  if (!p) return null;
  let url = "";
  if (p.anexo) { await garantirTabelaAnexo(); const a = (await consulta("select url from sorelly.anexo_modulo where id = $1 and modulo = 'er'", [p.anexo])).rows[0]; url = a ? a.url : ""; }
  if (!url) { const f = await fotoDaPeca(p.cod); url = f ? f.url : ""; }
  const m = /^data:(image[/][a-z0-9.+-]+);base64,(.+)$/i.exec(url);
  return m ? { mime: m[1], bytes: Buffer.from(m[2], "base64") } : null;
}

/** Guarda UMA foto do link (a página manda uma por vez, já reduzida). */
export async function gravarFoto(id, { nome, url }) {
  const l = await lerLink(id);
  if (!l) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  if (l.estado !== "aberto" && l.estado !== "acompanhar") throw Object.assign(new Error(l.estado === "expirado" ? "Este link expirou." : "Este pedido já foi enviado."), { statusCode: 410 });
  if (!urlAnexoValida(url) || url.length > 4 * 1024 * 1024) throw Object.assign(new Error("Dados inválidos: foto."), { statusCode: 400 });
  await garantirTabelaAnexo();
  const por = "link:" + id;
  const n = (await consulta("select count(*)::int as n from sorelly.anexo_modulo where por = $1", [por])).rows[0].n;
  if (n >= MAX_FOTOS_LINK * (1 + MAX_EXTRAS)) throw Object.assign(new Error("Dados inválidos: máximo de " + MAX_FOTOS_LINK + " fotos."), { statusCode: 400 });
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
  const soTexto = (Array.isArray(textos) ? textos : []).slice(0, MAX_FOTOS_LINK).map((t) => ({ cor: COR.includes(t && t.cor) ? t.cor : "", obs: String((t && t.obs) || "").trim().slice(0, 160) })).filter((t) => t.obs);
  if (limpas.length + soTexto.length > MAX_FOTOS_LINK) throw Object.assign(new Error("Dados inválidos: cada pedido tem no máximo " + MAX_FOTOS_LINK + " peças."), { statusCode: 400 });
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
