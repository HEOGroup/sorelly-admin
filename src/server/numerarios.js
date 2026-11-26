// Financeiro › Cadastro › Numerários (Marcus, 25/11/2026).
// Cópia própria dos TIPOS DE NUMERÁRIO da DevMaster (Financeiro › Cadastro › Tipos de numerários, tabela dmacd), com o banco ligado (dmacd e dmaoq, relação numerário x bancos),
// as naturezas de pagamento e de recebimento, e o uso em PAGAMENTOS (baixas de contas a pagar, dmabf) dos últimos 90 dias.
// Só LEITURA na DevMaster. A cópia fica guardada no nosso banco (módulo "numerarios_dm") e é refeita pelo menos UMA vez por dia:
//   (a) pela rotina diária (automatico-dia.js, que o agendador da Vercel chama); (b) por quem abrir a tela depois da meia-noite, se a cópia for de outro dia; (c) pelo botão Atualizar.
// A ligação "numerário → banco → dono" é a que alinha o Admin com a DevMaster: toda baixa de pagamento grava o numerário e o banco (dmabf.abf_numerario, abf_banco).
import { consulta } from "./db.js";
import * as dm from "./devmaster2.js";
import { bonito, donoDoBanco, tipoDaForma } from "./cadastro-fin.js";

const MODULO = "numerarios_dm", G = globalThis;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const limpa = (t) => String(t || "").replace(/\s+/g, " ").trim();
const kb = (b, a, c) => [limpa(b), limpa(a), limpa(c)].join("|");
const iso = (d) => d.toISOString().slice(0, 10);
const diaBR = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const OPERACAO = { BOL: "Boleto", CHQ: "Cheque", CRN: "Carnê", DPM: "Duplicata mercantil", PRZ: "A prazo", RPG: "Link de pagamento", TEF: "TEF", PIX: "Pix" };
const FORMA = { "01": "Dinheiro", "02": "Cheque", "03": "Cartão de crédito", "04": "Cartão de débito", "05": "Cartão da loja", "10": "Vale alimentação", "11": "Vale refeição", "12": "Vale presente", "13": "Vale combustível", "14": "Duplicata", "15": "Boleto", "16": "Depósito", "17": "Pix (QR-Code dinâmico)", "18": "Transferência", "19": "Fidelidade e cashback", "20": "Pix (estático)", "21": "Crédito em loja", "22": "Não informado", "99": "Outros" };

async function montar() {
  const de90 = iso(new Date(Date.now() - 90 * 86400000));
  const [nums, bancos, rel, baixas, titulos] = await Promise.all([
    dm.todasAsPaginas("dmacd", { campos: ["acd_codigo", "acd_descricao", "acd_operacao", "acd_formapgto", "acd_natureza", "acd_natentrada", "acd_recebivel", "acd_status", "acd_pdvvisivel", "acd_banco", "acd_agencia", "acd_conta"] }),
    dm.todasAsPaginas("dmaap", { campos: ["aap_codigo", "aap_agencia", "aap_conta", "aap_nome", "aap_situacao"] }),
    dm.todasAsPaginas("dmaoq", { campos: ["aoq_numerario", "aoq_banco", "aoq_agencia", "aoq_conta"] }).catch(() => []),
    dm.todasAsPaginas("dmabf", { filtro: { abf_tipo: "S", abf_tpcontaorigem: "P", abf_datapgto: { gte: de90 + "T00:00:00" } }, campos: ["abf_numerario", "abf_valorreais", "abf_datapgto", "abf_banco", "abf_agencia", "abf_conta", "abf_estornado"] }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_emissao: { gte: de90 + "T00:00:00" } }, campos: ["abe_tipodoc", "abe_valorreais"] }).catch(() => null),
  ]);
  const porChave = new Map(bancos.map((b) => [kb(b.aap_codigo, b.aap_agencia, b.aap_conta), b]));
  const nomeDe = (k) => { const b = porChave.get(k); return b ? limpa(b.aap_nome) : ""; };

  const uso = {}, sem = { n: 0, v: 0 };
  for (const b of baixas) {
    if (b.abf_estornado === "S") continue;
    const c = limpa(b.abf_numerario), v = Number(b.abf_valorreais) || 0, d = String(b.abf_datapgto || "").slice(0, 10), k = kb(b.abf_banco, b.abf_agencia, b.abf_conta);
    if (!c) { sem.n++; sem.v += v; continue; }
    const u = (uso[c] = uso[c] || { n: 0, v: 0, ult: "", bancos: {} });
    u.n++; u.v += v; u.bancos[k] = (u.bancos[k] || 0) + 1;
    if (d > u.ult) u.ult = d;
  }
  const outrosBancos = {};
  for (const r of rel) { const c = limpa(r.aoq_numerario); (outrosBancos[c] = outrosBancos[c] || []).push(nomeDe(kb(r.aoq_banco, r.aoq_agencia, r.aoq_conta)) || limpa(r.aoq_banco)); }
  let titSem = null;
  if (titulos) { titSem = { n: 0, v: 0 }; for (const t of titulos) if (!limpa(t.abe_tipodoc)) { titSem.n++; titSem.v += Number(t.abe_valorreais) || 0; } }

  const linhas = nums.filter((n) => limpa(n.acd_descricao) && limpa(n.acd_descricao) !== "-").map((n) => {
    const cod = limpa(n.acd_codigo), desc = limpa(n.acd_descricao), kCad = n.acd_banco ? kb(n.acd_banco, n.acd_agencia, n.acd_conta) : "";
    const banco = kCad ? nomeDe(kCad) || "Banco não cadastrado" : "", u = uso[cod] || { n: 0, v: 0, ult: "", bancos: {} }, avisos = [];
    const outros = kCad ? Object.keys(u.bancos).filter((k) => k !== kCad) : [];
    if (!kCad && u.n) avisos.push("Sem banco ligado, mas teve " + u.n + " pagamentos");
    if (outros.length) avisos.push("Pagamentos em outro banco: " + outros.map((k) => bonito(nomeDe(k) || "sem banco") + " (" + u.bancos[k] + ")").join(", "));
    return { id: cod, cod, nome: bonito(desc), nomeDm: desc, operacao: OPERACAO[limpa(n.acd_operacao)] || "", forma: FORMA[limpa(n.acd_formapgto)] || "", tipo: tipoDaForma(desc, n.acd_formapgto),
      banco: banco ? bonito(banco) : "", dono: kCad ? donoDoBanco(banco) : "", tambem: (outrosBancos[cod] || []).map(bonito).join(" · "),
      natPagar: limpa(n.acd_natentrada), natReceber: limpa(n.acd_natureza), situacao: n.acd_status === "I" ? "Inativo" : "Ativo", pdv: n.acd_pdvvisivel === "S" ? "Sim" : "Não",
      n90: u.n, v90: r2(u.v), ult: u.ult, arrumar: avisos.join(" · ") };
  }).sort((a, b) => (a.situacao === b.situacao ? b.n90 - a.n90 || a.nome.localeCompare(b.nome, "pt-BR") : a.situacao === "Ativo" ? -1 : 1));
  return { dia: diaBR(), geradoEm: new Date().toISOString(), de90, linhas, baixasSemNumerario: { n: sem.n, v: r2(sem.v) }, titulosSemNumerario: titSem ? { n: titSem.n, v: r2(titSem.v) } : null };
}

async function lerGuardado() {
  try { const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = $1", [MODULO]); return r.rows[0] ? r.rows[0].conteudo : null; } catch (e) { return null; }
}
async function guardar(dados) {
  await consulta("insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ($1, $2::jsonb, 1, 'automatico') on conflict (modulo) do update set conteudo = excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = 'automatico', atualizado_em = now()", [MODULO, JSON.stringify(dados)]);
}

// Devolve a cópia do dia. Refaz quando não existe, quando é de outro dia (hora de Brasília) ou quando pedirem (forcar). Duas chamadas ao mesmo tempo usam a mesma leitura.
export async function numerariosDoDia({ forcar = false } = {}) {
  const atual = await lerGuardado();
  if (!forcar && atual && atual.dia === diaBR()) return { ...atual, atualizado: false };
  if (!G.__sorellyNumerarios) G.__sorellyNumerarios = montar().then(async (d) => { await guardar(d); return d; }).finally(() => { G.__sorellyNumerarios = null; });
  try { return { ...(await G.__sorellyNumerarios), atualizado: true }; }
  catch (x) { if (atual) return { ...atual, atualizado: false, aviso: "A DevMaster não respondeu; esta é a cópia de " + atual.dia.slice(8, 10) + "/" + atual.dia.slice(5, 7) + "." }; throw x; }
}

// Para a rotina diária (automatico-dia.js)
export async function atualizarNumerarios() {
  const r = await numerariosDoDia({ forcar: false });
  return { dia: r.dia, numerarios: r.linhas.length, atualizado: r.atualizado };
}
