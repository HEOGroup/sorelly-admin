// Canal de Ética e Denúncias (17/11/2026, pedido da Maria (RH) e do Marcus, parte do plano da NR-1).
// Formulário PÚBLICO (/canal-de-etica, sem login) que grava aqui; a leitura é RESTRITA aos sócios e à Maria (RH), conferida NO SERVIDOR pelo pessoaId da conta.
// Privacidade: a denúncia não guarda nome, e-mail, IP nem aparelho. O endereço (IP) só é usado na memória do servidor, por 1 hora, para limitar abuso, e nunca vai para o banco.
// O contato só existe se a pessoa digitar no campo opcional. Não é aconselhamento jurídico: o formato final do canal o técnico de Segurança do Trabalho e o contador confirmam.
import { randomBytes } from "node:crypto";
import { consulta } from "./db.js";

// quem LÊ e responde as denúncias (pessoaId): por ora SÓ o Marcus (16), decisão de 18/11/2026. Para liberar outra pessoa, acrescente o pessoaId aqui E em PESSOAS_DENUNCIAS (domain/nr1.js). Perfil ADMIN sozinho NÃO basta.
export const LEITORES_DENUNCIAS = [16];
const idDe = (eu) => (eu && eu.pessoaId != null ? Number(eu.pessoaId) : null);
// Denúncias que envolvem sócio ou a direção (pergunta do formulário): Marcus, 18/11/2026: quem lê essas é a Maria (RH), pessoaId 38.
// Enquanto LEITORES_RESERVADAS tiver alguém, os leitores gerais NÃO veem as marcadas "Sim" e quem só está nesta lista vê SÓ essas. Quem estiver nas duas listas vê tudo. Lista vazia = os leitores gerais veem tudo.
export const LEITORES_RESERVADAS = [38];
const geral = (eu) => LEITORES_DENUNCIAS.includes(idDe(eu));
const reservada = (eu) => LEITORES_RESERVADAS.includes(idDe(eu));
export const podeVerDenuncias = (eu) => !!eu && (geral(eu) || reservada(eu));
// recorte do que a pessoa lê (SQL): "" = tudo; senão só as não reservadas ou só as reservadas
const filtroReservadas = (eu) => {
  if (LEITORES_RESERVADAS.length === 0 || (geral(eu) && reservada(eu))) return "";
  return reservada(eu) ? " and envolve_direcao = 'Sim'" : " and envolve_direcao <> 'Sim'";
};
const ROTULO_SIT = { nova: "Recebida", analise: "Em análise", concluida: "Concluída" };

export const CATEGORIAS = ["Assédio moral", "Assédio sexual", "Discriminação ou preconceito", "Abuso de autoridade", "Agressão verbal ou física", "Constrangimento ou humilhação", "Sobrecarga ou pressão excessiva", "Condições inadequadas de trabalho", "Conduta antiética", "Outros"];
export const SETORES = ["Atendimento", "Montagem de kits", "Produção", "Estoque", "Agendamento", "Pós-venda", "Inadimplência", "Financeiro", "Marketing", "Jurídico", "RH", "Direção", "Outros", "Prefiro não informar"];
export const RELACOES = ["Aconteceu comigo", "Presenciei a situação", "Tenho conhecimento da situação", "Prefiro não informar"];
export const FREQUENCIAS = ["Uma única vez", "Algumas vezes", "Frequentemente", "Continua acontecendo", "Não sei informar"];
export const EVIDENCIAS = ["Sim", "Não", "Prefiro não informar"];
export const RISCOS = ["Sim", "Não", "Não sei informar"];
export const DIRECAO = ["Sim", "Não", "Prefiro não informar"];
export const SITUACOES_DEN = ["nova", "analise", "concluida"];

let pronta = null;
export function garantirTabelaDenuncia() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.denuncia (
    id bigserial primary key, protocolo text not null unique, criado_em timestamptz not null default now(),
    categoria text not null, setor text, relacao text, frequencia text, periodo text, envolvidos text, relato text not null, testemunhas text,
    evidencia text, risco text, identificado boolean not null default false, contato text,
    situacao text not null default 'nova', nota text not null default '', atualizado_em timestamptz, atualizado_por text)`)
    .then(() => consulta("alter table sorelly.denuncia add column if not exists envolve_direcao text not null default ''"))
    .then(() => consulta("alter table sorelly.denuncia add column if not exists resposta text not null default ''"))
    .then(() => consulta("alter table sorelly.denuncia add column if not exists resposta_em timestamptz"))
    .then(() => consulta("alter table sorelly.denuncia add column if not exists vista_em timestamptz"))   // quando um leitor abriu a lista pela primeira vez: depois disso a denúncia não gera mais alerta
    .catch((e) => { pronta = null; throw e; });
  return pronta;
}

const aparar = (v, max) => String(v == null ? "" : v).replace(/\s+\n/g, "\n").trim().slice(0, max);
const dentro = (v, lista) => (lista.includes(v) ? v : "");
const erroDe = (m) => Object.assign(new Error(m), { statusCode: 400 });

export function validarDenuncia(b) {
  const categoria = dentro(b.categoria, CATEGORIAS), relato = aparar(b.relato, 6000);
  if (!categoria) throw erroDe("Escolha o motivo da denúncia.");
  if (relato.length < 10) throw erroDe("Descreva o ocorrido (mínimo de 10 letras).");
  const identificado = typeof b.identificacao === "string" && b.identificacao.startsWith("Sim");
  return {
    categoria, relato, setor: dentro(b.setor, SETORES), relacao: dentro(b.relacao, RELACOES), frequencia: dentro(b.frequencia, FREQUENCIAS),
    periodo: aparar(b.periodo, 200), envolvidos: aparar(b.envolvidos, 2000), testemunhas: aparar(b.testemunhas, 2000),
    evidencia: dentro(b.evidencia, EVIDENCIAS), risco: dentro(b.risco, RISCOS), envolveDirecao: dentro(b.envolveDirecao, DIRECAO), identificado, contato: identificado ? aparar(b.contato, 300) : "",
  };
}

// limite por endereço, só na memória do servidor (nunca no banco): 5 envios por hora
const G = globalThis;
export function limiteDenuncia(chave, max = 5, nome = "__sorellyDenuncias") {
  const mapa = (G[nome] = G[nome] || new Map()), agora = Date.now();
  const lista = (mapa.get(chave) || []).filter((t) => agora - t < 3600 * 1000);
  if (lista.length >= max) return false;
  lista.push(agora); mapa.set(chave, lista);
  if (mapa.size > 2000) mapa.clear();
  return true;
}

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // sem letras que se confundem (I, L, O, 0, 1)
const novoProtocolo = () => "DEN-" + Array.from(randomBytes(8), (x) => ALFABETO[x % ALFABETO.length]).join("");

export async function gravarDenuncia(d) {
  await garantirTabelaDenuncia();
  for (let i = 0; i < 4; i++) {
    const p = novoProtocolo();
    try {
      await consulta(`insert into sorelly.denuncia (protocolo, categoria, setor, relacao, frequencia, periodo, envolvidos, relato, testemunhas, evidencia, risco, identificado, contato, envolve_direcao)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [p, d.categoria, d.setor, d.relacao, d.frequencia, d.periodo, d.envolvidos, d.relato, d.testemunhas, d.evidencia, d.risco, d.identificado, d.contato, d.envolveDirecao]);
      return p;
    } catch (e) { if (!(e && e.code === "23505")) throw e; }
  }
  throw new Error("Não consegui gerar o protocolo.");
}

const COLUNAS = "id, protocolo, criado_em, categoria, setor, relacao, frequencia, periodo, envolvidos, relato, testemunhas, evidencia, risco, identificado, contato, situacao, nota, atualizado_em, atualizado_por, envolve_direcao, resposta, resposta_em";

export async function listarDenuncias(eu) {
  await garantirTabelaDenuncia();
  const r = await consulta(`select ${COLUNAS} from sorelly.denuncia where true${filtroReservadas(eu)} order by criado_em desc limit 1000`);
  // abriu a lista = viu: as denúncias que esta pessoa pode ler deixam de gerar alerta (em qualquer aparelho)
  await consulta(`update sorelly.denuncia set vista_em = now() where vista_em is null${filtroReservadas(eu)}`);
  return r.rows;
}

// só os números das denúncias ainda não tratadas (situação "nova"): o navegador de quem lê pergunta de tempos em tempos e mostra o alerta
export async function novasDenuncias(eu) {
  await garantirTabelaDenuncia();
  const r = await consulta(`select id from sorelly.denuncia where situacao = 'nova' and vista_em is null${filtroReservadas(eu)} order by id`);
  return r.rows.map((x) => x.id);
}

// consulta pública pelo protocolo: devolve SÓ a situação e a resposta do RH ao denunciante. Nunca o relato, a nota interna nem quem mexeu.
export async function consultarProtocolo(protocolo) {
  await garantirTabelaDenuncia();
  const p = String(protocolo || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  if (!/^DEN-[A-Z0-9]{8}$/.test(p)) return null;
  const r = await consulta("select situacao, resposta, resposta_em, criado_em from sorelly.denuncia where protocolo = $1", [p]);
  const x = r.rows[0]; if (!x) return null;
  return { situacao: ROTULO_SIT[x.situacao] || "Recebida", resposta: x.resposta || "", respondida_em: x.resposta_em, recebida_em: x.criado_em };
}

export async function atualizarDenuncia(id, patch, por, eu) {
  await garantirTabelaDenuncia();
  const sets = [], v = [];
  if (patch.situacao !== undefined) { if (!SITUACOES_DEN.includes(patch.situacao)) throw erroDe("Situação inválida."); v.push(patch.situacao); sets.push(`situacao = $${v.length}`); }
  if (patch.nota !== undefined) { v.push(aparar(patch.nota, 6000)); sets.push(`nota = $${v.length}`); }
  if (patch.resposta !== undefined) { v.push(aparar(patch.resposta, 2000)); sets.push(`resposta = $${v.length}`, "resposta_em = now()"); }
  if (!sets.length) throw erroDe("Nada para salvar.");
  v.push(String(por || "")); sets.push(`atualizado_por = $${v.length}`, "atualizado_em = now()");
  v.push(id);
  const r = await consulta(`update sorelly.denuncia set ${sets.join(", ")} where id = $${v.length}${filtroReservadas(eu)} returning id`, v);
  return r.rowCount > 0;
}
