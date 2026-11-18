// Formulário dos funcionários (18/11/2026, pedido do Marcus): cada funcionária recebe um LINK PRÓPRIO (/meus-dados/<código>), preenche os dados pessoais pelo celular, sem login,
// e as respostas ficam aqui para o RH CONFERIR e só depois APLICAR no cadastro (a resposta nunca muda o cadastro sozinha).
// Quem gera os links, lê as respostas e aplica: diretoria e quem é do setor RH (Maria). O código é aleatório e só serve para uma pessoa.
// O formulário NÃO pergunta o que a funcionária não sabe (CBO, PIS/NIS, tipo de contrato, jornada, exame admissional): esses o RH preenche.
// Dados sensíveis (CPF, RG, banco): a página pública só devolve o primeiro nome e a situação; as respostas só saem para o RH, conferido no servidor.
import { randomBytes } from "node:crypto";
import { consulta } from "./db.js";

export const podeFicha = (eu) => !!eu && (eu.perfil === "ADMIN" || (Array.isArray(eu.setores) && eu.setores.includes("rh")));

export const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
export const ESTADOS_CIVIS = ["Solteira(o)", "Casada(o)", "União estável", "Divorciada(o)", "Viúva(o)"];
export const ESCOLARIDADES = ["Fundamental incompleto", "Fundamental completo", "Médio incompleto", "Médio completo", "Superior incompleto", "Superior completo", "Pós-graduação"];
export const TIPOS_CONTA = ["Corrente", "Poupança", "Salário"];

// campo → regra. "t" = texto livre (máximo de letras); "sel" = uma opção da lista; "data" = AAAA-MM-DD; "num" = só dígitos (tamanho máximo)
export const CAMPOS_FICHA = {
  telefone: { t: "t", max: 20 }, email: { t: "t", max: 120 },
  cep: { t: "num", max: 8 }, rua: { t: "t", max: 120 }, numero: { t: "t", max: 12 }, complemento: { t: "t", max: 60 }, bairro: { t: "t", max: 80 }, cidade: { t: "t", max: 80 }, uf: { t: "sel", lista: UFS },
  emergNome: { t: "t", max: 100 }, emergFone: { t: "t", max: 20 }, emergParentesco: { t: "t", max: 40 },
  nascimento: { t: "data" }, estadoCivil: { t: "sel", lista: ESTADOS_CIVIS }, escolaridade: { t: "sel", lista: ESCOLARIDADES }, nomeMae: { t: "t", max: 120 }, naturalidade: { t: "t", max: 80 }, dependentes: { t: "num", max: 2 },
  cpf: { t: "num", max: 11 }, rg: { t: "t", max: 20 }, rgOrgao: { t: "t", max: 20 }, ctpsNumero: { t: "t", max: 20 }, ctpsSerie: { t: "t", max: 10 }, tituloEleitor: { t: "t", max: 20 }, cnh: { t: "t", max: 20 }, cnhCategoria: { t: "t", max: 5 },
  banco: { t: "t", max: 60 }, agencia: { t: "t", max: 12 }, conta: { t: "t", max: 20 }, tipoConta: { t: "sel", lista: TIPOS_CONTA }, pix: { t: "t", max: 100 },
};
export const CHAVES_FICHA = Object.keys(CAMPOS_FICHA);

const erroDe = (m) => Object.assign(new Error(m), { statusCode: 400 });
const aparar = (v, max) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);

// valida e limpa as respostas: só as chaves conhecidas entram, cada uma pela sua regra; o que sobra de fora é jogado fora
export function validarFicha(b) {
  const dados = {};
  for (const k of CHAVES_FICHA) {
    const r = CAMPOS_FICHA[k], v = b ? b[k] : undefined;
    if (v === undefined || v === null || String(v).trim() === "") continue;
    if (r.t === "t") dados[k] = aparar(v, r.max);
    else if (r.t === "num") { const d = String(v).replace(/\D/g, "").slice(0, r.max); if (d) dados[k] = d; }
    else if (r.t === "sel") { if (!r.lista.includes(String(v))) throw erroDe("Escolha uma opção válida em " + k + "."); dados[k] = String(v); }
    else if (r.t === "data") {
      const s = String(v).slice(0, 10), d = new Date(s + "T12:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(d.getTime()) || s < "1930-01-01" || s > new Date().toISOString().slice(0, 10)) throw erroDe("Confira a data de nascimento.");
      dados[k] = s;
    }
  }
  if (dados.cpf && dados.cpf.length !== 11) throw erroDe("O CPF precisa ter 11 números.");
  if (dados.cep && dados.cep.length !== 8) throw erroDe("O CEP precisa ter 8 números.");
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) throw erroDe("Confira o e-mail.");
  if (!Object.keys(dados).length) throw erroDe("Preencha pelo menos um campo.");
  return dados;
}

let pronta = null;
export function garantirTabelaFicha() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.ficha_funcionario (
    colab_id text primary key, nome text not null, codigo text not null unique, criado_em timestamptz not null default now(),
    situacao text not null default 'pendente', enviada_em timestamptz, dados jsonb not null default '{}'::jsonb, aplicada_em timestamptz, aplicada_por text)`)
    .catch((e) => { pronta = null; throw e; });
  return pronta;
}

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";   // sem letras que se confundem
export const novoCodigo = () => Array.from(randomBytes(16), (x) => ALFABETO[x % ALFABETO.length]).join("");

const COLUNAS = "colab_id, nome, codigo, criado_em, situacao, enviada_em, dados, aplicada_em, aplicada_por";

export async function listarFichas() {
  await garantirTabelaFicha();
  const r = await consulta(`select ${COLUNAS} from sorelly.ficha_funcionario order by nome limit 2000`);
  return r.rows;
}

// cria o link de quem ainda não tem (quem já tem fica como está) e devolve a lista completa
export async function gerarLinks(pessoas) {
  await garantirTabelaFicha();
  for (const p of (Array.isArray(pessoas) ? pessoas : []).slice(0, 500)) {
    const id = aparar(p && p.id, 80), nome = aparar(p && p.nome, 120);
    if (!id || !nome) continue;
    for (let i = 0; i < 4; i++) {
      try { await consulta("insert into sorelly.ficha_funcionario (colab_id, nome, codigo) values ($1,$2,$3) on conflict (colab_id) do nothing", [id, nome, novoCodigo()]); break; }
      catch (e) { if (!(e && e.code === "23505")) throw e; }
    }
  }
  return listarFichas();
}

// página pública: SÓ o primeiro nome e a situação. Nada de dados.
export async function lerPublico(codigo) {
  await garantirTabelaFicha();
  const c = aparar(codigo, 40);
  if (!/^[A-Za-z0-9]{16,40}$/.test(c)) return null;
  const r = await consulta("select nome, situacao from sorelly.ficha_funcionario where codigo = $1", [c]);
  const x = r.rows[0]; if (!x) return null;
  return { nome: String(x.nome).split(" ")[0], situacao: x.situacao };
}

// grava a resposta (pode mandar de novo até o RH aplicar; depois de aplicada o link não aceita mais)
export async function gravarResposta(codigo, b) {
  await garantirTabelaFicha();
  const c = aparar(codigo, 40);
  if (!/^[A-Za-z0-9]{16,40}$/.test(c)) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
  const dados = validarFicha(b);
  const r = await consulta("update sorelly.ficha_funcionario set dados = $2::jsonb, situacao = 'enviada', enviada_em = now() where codigo = $1 and situacao in ('pendente','enviada') returning colab_id", [c, JSON.stringify(dados)]);
  if (!r.rowCount) {
    const x = await consulta("select situacao from sorelly.ficha_funcionario where codigo = $1", [c]);
    if (!x.rows[0]) throw Object.assign(new Error("Link não encontrado."), { statusCode: 404 });
    throw erroDe("Este link já foi usado e conferido pelo RH. Fale com o RH se precisar mudar algo.");
  }
  return true;
}

export async function marcarAplicada(colabId, por) {
  await garantirTabelaFicha();
  const r = await consulta("update sorelly.ficha_funcionario set situacao = 'aplicada', aplicada_em = now(), aplicada_por = $2 where colab_id = $1 and situacao = 'enviada' returning colab_id", [aparar(colabId, 80), aparar(por, 80)]);
  return r.rowCount > 0;
}

// limite por endereço, só na memória do servidor: 10 envios por hora
const G = globalThis;
export function limiteFicha(chave, max = 10) {
  const mapa = (G.__sorellyFichaFunc = G.__sorellyFichaFunc || new Map()), agora = Date.now();
  const lista = (mapa.get(chave) || []).filter((t) => agora - t < 3600 * 1000);
  if (lista.length >= max) return false;
  lista.push(agora); mapa.set(chave, lista);
  if (mapa.size > 2000) mapa.clear();
  return true;
}
