// Encomendas › Separar peças (13/11/2026, Marcus): a funcionária tira ~20 peças do estoque e manda os CÓDIGOS. O servidor busca a foto e o nome de cada código na DevMaster (só leitura)
// e a IA (Claude) compara as peças com as FOTOS dos pedidos em aberto (fotos aleatórias das revendedoras, não de catálogo) para dizer qual peça vai para quem. Quem decide é a pessoa: a IA só sugere.
//   pecasDaMao(codigos)      → [{cod, desc, existe, temFoto}]   (nome e se há foto na DevMaster)
//   fotoDaPeca(cod)          → {url:"data:image/jpeg;base64,..."} | null   (cache de 30 min por código)
//   casarComIA({fotos, pecas, extras}) → resultados por foto de pedido
// A chave da IA fica SÓ no .env.local do servidor (ANTHROPIC_API_KEY); nunca vai para a tela nem para o Git.
import Anthropic from "@anthropic-ai/sdk";
import https from "node:https";
import tls from "node:tls";
import { consulta } from "./db.js";
import { consultarTabela, fotoDoProduto } from "./devmaster2.js";

const MODELO = "claude-sonnet-5-5";
const G = globalThis;
const TTL_FOTO = 30 * 60 * 1000;
const MAX_PECAS = 40, MAX_FOTOS = 40;
const CODIGO = /^[A-Z0-9]{2,20}$/;

export const limpaCodigos = (lista) => [...new Set((Array.isArray(lista) ? lista : []).map((c) => String(c || "").trim().toUpperCase()).filter((c) => CODIGO.test(c)))].slice(0, MAX_PECAS);

export async function pecasDaMao(codigos) {
  const cods = limpaCodigos(codigos);
  if (!cods.length) return [];
  const r = await consultarTabela("dmaaa", { campos: ["aaa_codigo", "aaa_descricao", "aaa_foto"], filtro: { aaa_codigo: { in: cods } }, registros: 500 });
  const por = {};
  for (const x of r.itens) por[String(x.aaa_codigo || "").trim().toUpperCase()] = x;
  return cods.map((cod) => { const x = por[cod]; return { cod, desc: x ? String(x.aaa_descricao || "").trim() : "", existe: !!x, temFoto: !!(x && String(x.aaa_foto || "").trim()) }; });
}

export async function fotoDaPeca(cod) {
  const c = String(cod || "").trim().toUpperCase();
  if (!CODIGO.test(c)) return null;
  const cache = (G.__sorellyFotoPeca = G.__sorellyFotoPeca || new Map());
  const hit = cache.get(c);
  if (hit && Date.now() - hit.em < TTL_FOTO) return hit.f;
  const f = await fotoDoProduto(c);
  const dados = f ? { url: "data:" + f.mime + ";base64," + f.base64, mime: f.mime, base64: f.base64 } : null;
  if (cache.size > 120) cache.clear();
  cache.set(c, { f: dados, em: Date.now() });
  return dados;
}

// anexos do módulo "er" (fotos dos pedidos, fotos que a funcionária tirou): chave → {mime, base64}
async function anexos(chaves) {
  const ks = [...new Set(chaves)].filter((k) => /^an_[a-z0-9]{6,40}$/.test(k));
  if (!ks.length) return {};
  const r = await consulta("select id, mime, url from sorelly.anexo_modulo where modulo = 'er' and id = any($1)", [ks]);
  const out = {};
  for (const l of r.rows) {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s.exec(l.url || "");
    if (m) out[l.id] = { mime: m[1], base64: m[2] };
  }
  return out;
}

function clienteIa() {
  const chave = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!chave) throw Object.assign(new Error("A IA ainda não está ligada no servidor (falta ANTHROPIC_API_KEY no .env.local)."), { statusCode: 503 });
  let ca; try { ca = [...tls.getCACertificates("default"), ...tls.getCACertificates("system")]; } catch (x) { ca = undefined; }   // mesmo jeito da DevMaster: o antivírus do Windows troca o certificado
  return new Anthropic({ apiKey: chave, ...(ca ? { fetchOptions: { agent: new https.Agent({ ca, keepAlive: true }) } } : {}), maxRetries: 2, timeout: 110000 });
}

const REGRAS = [
  "Você ajuda a equipe de uma fábrica de semijoias a separar peças do estoque para revendedoras.",
  "Abaixo vêm primeiro as PEÇAS que a funcionária tirou do estoque (cada uma com CÓDIGO e nome) e depois as FOTOS dos pedidos das revendedoras.",
  "As fotos dos pedidos são tiradas por revendedoras, de qualquer jeito (celular, ângulo diferente, mão, mesa, às vezes com o código escrito ou impresso na própria foto). Elas NÃO são fotos de catálogo.",
  "Para cada FOTO de pedido, diga qual das PEÇAS da lista é a mesma peça (mesmo modelo). Compare o tipo (colar, brinco, anel, pulseira...), o formato, as pedras, o desenho e o tamanho. Cor de banho (ouro ou prata) e brilho da câmera enganam: dê mais peso ao desenho.",
  "Se a foto mostrar um código legível (ex.: SP0615), use-o e confira com a lista.",
  "Se nenhuma peça da lista for a mesma, responda cod = null. Responder null é correto e melhor do que chutar. Uma peça pode servir para várias fotos.",
  "confianca: \"alta\" só quando o modelo é claramente o mesmo; \"media\" quando é provável; \"baixa\" quando é um palpite. Em alternativas, ponha até 2 outros códigos da lista que também poderiam ser.",
  "Responda SOMENTE com JSON, sem texto fora dele, neste formato: {\"fotos\":[{\"n\":1,\"cod\":\"SP0615\",\"confianca\":\"alta\",\"alternativas\":[\"AA0031\"],\"motivo\":\"frase curta em português\"}]} com uma entrada para CADA foto, na mesma numeração.",
].join("\n");

export async function casarComIA({ fotos, pecas, extras }) {
  const fs = (Array.isArray(fotos) ? fotos : []).slice(0, MAX_FOTOS);
  const ps = (Array.isArray(pecas) ? pecas : []).slice(0, MAX_PECAS);
  if (!fs.length) throw Object.assign(new Error("Não há fotos de pedido em aberto para comparar."), { statusCode: 400 });
  if (!ps.length) throw Object.assign(new Error("Coloque ao menos um código de peça."), { statusCode: 400 });
  const ex = extras && typeof extras === "object" ? extras : {};
  const cli = clienteIa();
  const baixadas = await anexos(fs.map((f) => f.key).concat(Object.values(ex).map(String)));
  const conteudo = [{ type: "text", text: REGRAS + "\n\n=== PEÇAS NA MÃO ===" }];
  const usadas = [];
  for (let i = 0; i < ps.length; i += 4) {   // busca as fotos da DevMaster de 4 em 4
    const lote = ps.slice(i, i + 4);
    const res = await Promise.all(lote.map(async (p) => { const d = ex[p.cod] && baixadas[String(ex[p.cod])] ? baixadas[String(ex[p.cod])] : await fotoDaPeca(p.cod); return { p, d }; }));
    for (const { p, d } of res) {
      conteudo.push({ type: "text", text: "PEÇA " + p.cod + " — " + (p.desc || "sem nome") + (d ? "" : " (SEM FOTO: compare só pelo nome)") });
      if (d) conteudo.push({ type: "image", source: { type: "base64", media_type: d.mime, data: d.base64 } });
      usadas.push(p.cod);
    }
  }
  conteudo.push({ type: "text", text: "=== FOTOS DOS PEDIDOS ===" });
  const lidas = [];
  fs.forEach((f) => {
    const d = baixadas[f.key]; if (!d) return;
    lidas.push(f);
    conteudo.push({ type: "text", text: "FOTO " + lidas.length + " (pedido de " + String(f.rev || "").slice(0, 60) + ")" });
    conteudo.push({ type: "image", source: { type: "base64", media_type: d.mime, data: d.base64 } });
  });
  if (!lidas.length) throw Object.assign(new Error("Não achei as fotos dos pedidos no servidor."), { statusCode: 400 });
  const r = await cli.messages.create({ model: MODELO, max_tokens: 8000, messages: [{ role: "user", content: conteudo }] });
  const texto = (r.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const i0 = texto.indexOf("{"), i1 = texto.lastIndexOf("}");
  let obj = null; try { obj = JSON.parse(texto.slice(i0, i1 + 1)); } catch (x) { /* resposta fora do formato */ }
  if (!obj || !Array.isArray(obj.fotos)) throw Object.assign(new Error("A IA respondeu fora do formato. Tente de novo."), { statusCode: 503 });
  const lista = new Set(usadas);
  const resultados = lidas.map((f, i) => {
    const x = obj.fotos.find((y) => Number(y && y.n) === i + 1) || {};
    const cod = x.cod && lista.has(String(x.cod).toUpperCase()) ? String(x.cod).toUpperCase() : null;
    return { id: f.id, rev: f.rev, key: f.key, cod, confianca: cod ? (["alta", "media", "baixa"].includes(x.confianca) ? x.confianca : "baixa") : "", alternativas: (Array.isArray(x.alternativas) ? x.alternativas : []).map((c) => String(c).toUpperCase()).filter((c) => lista.has(c) && c !== cod).slice(0, 2), motivo: String(x.motivo || "").slice(0, 200) };
  });
  return { resultados, fotosLidas: lidas.length, uso: r.usage ? { entrada: r.usage.input_tokens, saida: r.usage.output_tokens } : null };
}
