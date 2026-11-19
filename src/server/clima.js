// Pesquisa de clima (18/11/2026, plano da NR-1 da Maria (RH): fazer a primeira e depois repetir a cada trimestre).
// Formulário PÚBLICO e ANÔNIMO (/pesquisa-de-clima, sem login) enquanto houver uma RODADA aberta; resultado só para quem está em LEITORES_CLIMA, conferido no servidor.
// Anonimato: não guarda nome, IP nem aparelho. O setor é opcional e o resultado por setor só aparece com 5 respostas ou mais.
// Limite conhecido: sem login, uma pessoa pode responder mais de uma vez (só há limite de envios por hora por endereço, na memória do servidor).
// As perguntas são um modelo simples de clima e riscos psicossociais; o técnico de Segurança do Trabalho confirma se o modelo atende a NR-1. Não é aconselhamento jurídico.
import { consulta } from "./db.js";

// quem VÊ o resultado e abre/encerra rodadas (pessoaId): Marcus 16 e Maria Claudia (RH) 38. Para liberar outra pessoa, acrescente aqui E em PESSOAS_CLIMA (domain/nr1.js).
export const LEITORES_CLIMA = [16, 38];
export const podeVerClima = (eu) => !!eu && eu.pessoaId != null && LEITORES_CLIMA.includes(Number(eu.pessoaId));

export const PERGUNTAS = [
  { k: "respeito", t: "Me sinto respeitado(a) por colegas e líderes." },
  { k: "assedio", t: "Sei a quem recorrer se presenciar ou sofrer assédio ou desrespeito." },
  { k: "lider", t: "Meu líder me ouve e me orienta quando preciso." },
  { k: "comunicacao", t: "Recebo as informações de que preciso para trabalhar bem." },
  { k: "carga", t: "Minha carga de trabalho cabe no meu horário." },
  { k: "metas", t: "As metas e os prazos são possíveis de cumprir sem sofrimento." },
  { k: "ambiente", t: "Meu local de trabalho (mesa, cadeira, luz, limpeza) permite trabalhar com conforto." },
  { k: "seguranca", t: "Me sinto seguro(a) no meu dia a dia de trabalho." },
  { k: "reconhecimento", t: "Meu trabalho é reconhecido." },
  { k: "satisfacao", t: "No geral, estou satisfeito(a) em trabalhar na Sorelly." },
];
export const SETORES = ["Atendimento", "Montagem de kits", "Produção", "Estoque", "Agendamento", "Pós-venda", "Inadimplência", "Financeiro", "Marketing", "Jurídico", "RH", "Direção", "Outros"];
const MIN_SETOR = 5;   // setor com menos respostas que isso não aparece no resultado (protege o anonimato)

let pronta = null;
export function garantirTabelasClima() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.clima_rodada (
    id bigserial primary key, nome text not null, aberta boolean not null default true, criada_em timestamptz not null default now(), encerrada_em timestamptz)`)
    .then(() => consulta(`create table if not exists sorelly.clima_resposta (
      id bigserial primary key, rodada_id bigint not null, criada_em timestamptz not null default now(), setor text not null default '', notas jsonb not null, bom text not null default '', melhorar text not null default '')`))
    .catch((e) => { pronta = null; throw e; });
  return pronta;
}

const aparar = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const erroDe = (m) => Object.assign(new Error(m), { statusCode: 400 });

// limite por endereço, só na memória do servidor: 10 envios por hora
const G = globalThis;
export function limiteClima(chave) {
  const mapa = (G.__sorellyClima = G.__sorellyClima || new Map()), agora = Date.now();
  const lista = (mapa.get(chave) || []).filter((t) => agora - t < 3600 * 1000);
  if (lista.length >= 10) return false;
  lista.push(agora); mapa.set(chave, lista);
  if (mapa.size > 2000) mapa.clear();
  return true;
}

export async function rodadaAberta() {
  await garantirTabelasClima();
  const r = await consulta("select id, nome from sorelly.clima_rodada where aberta order by id desc limit 1");
  return r.rows[0] || null;
}

export async function gravarResposta(b) {
  const rodada = await rodadaAberta();
  if (!rodada) throw erroDe("A pesquisa está encerrada no momento.");
  const notas = {};
  for (const p of PERGUNTAS) {
    const n = Number(b.notas && b.notas[p.k]);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw erroDe("Responda todas as perguntas de 1 a 5.");
    notas[p.k] = n;
  }
  const setor = SETORES.includes(b.setor) ? b.setor : "";
  await consulta("insert into sorelly.clima_resposta (rodada_id, setor, notas, bom, melhorar) values ($1, $2, $3::jsonb, $4, $5)", [rodada.id, setor, JSON.stringify(notas), aparar(b.bom, 2000), aparar(b.melhorar, 2000)]);
}

export async function listarRodadas() {
  await garantirTabelasClima();
  const r = await consulta(`select r.id, r.nome, r.aberta, r.criada_em, r.encerrada_em, (select count(*)::int from sorelly.clima_resposta x where x.rodada_id = r.id) as respostas from sorelly.clima_rodada r order by r.id desc`);
  return r.rows;
}

// abre uma rodada nova e encerra a que estava aberta (só uma por vez)
export async function abrirRodada(nome) {
  await garantirTabelasClima();
  const n = aparar(nome, 80); if (n.length < 3) throw erroDe("Dê um nome à rodada (ex.: Clima 4º trimestre 2026).");
  await consulta("update sorelly.clima_rodada set aberta = false, encerrada_em = now() where aberta");
  const r = await consulta("insert into sorelly.clima_rodada (nome) values ($1) returning id", [n]);
  return r.rows[0].id;
}
export async function encerrarRodada(id) {
  await garantirTabelasClima();
  const r = await consulta("update sorelly.clima_rodada set aberta = false, encerrada_em = now() where id = $1 and aberta returning id", [id]);
  return r.rowCount > 0;
}

const media = (v) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : 0);

export async function resultadoRodada(id) {
  await garantirTabelasClima();
  const r = await consulta("select setor, notas, bom, melhorar from sorelly.clima_resposta where rodada_id = $1 order by id", [id]);
  const linhas = r.rows;
  const porPergunta = PERGUNTAS.map((p) => {
    const v = linhas.map((x) => Number(x.notas[p.k])).filter((n) => n >= 1 && n <= 5);
    return { k: p.k, t: p.t, respostas: v.length, media: media(v), favoravel: v.length ? Math.round((100 * v.filter((n) => n >= 4).length) / v.length) : 0 };
  });
  const grupos = {};
  linhas.forEach((x) => { const s = x.setor || ""; if (!s) return; (grupos[s] = grupos[s] || []).push(x); });
  const porSetor = Object.keys(grupos).filter((s) => grupos[s].length >= MIN_SETOR).map((s) => {
    const v = []; grupos[s].forEach((x) => PERGUNTAS.forEach((p) => { const n = Number(x.notas[p.k]); if (n >= 1 && n <= 5) v.push(n); }));
    return { setor: s, respostas: grupos[s].length, media: media(v) };
  }).sort((a, b) => a.media - b.media);
  const escondidos = Object.keys(grupos).filter((s) => grupos[s].length < MIN_SETOR).length;
  const comentarios = linhas.filter((x) => x.bom || x.melhorar).map((x) => ({ bom: x.bom, melhorar: x.melhorar }));
  return { total: linhas.length, porPergunta, porSetor, setoresEscondidos: escondidos, minSetor: MIN_SETOR, comentarios };
}
