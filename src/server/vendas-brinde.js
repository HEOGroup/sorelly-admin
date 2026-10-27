// Composição de cada venda (acerto) da DevMaster: quanto é VENDA de verdade e quanto é brinde, troca, indicação ou premiação (Marcus, 27/10/2026).
// O "Valor de venda" da DevMaster (dmach.ach_valormerc) soma tudo isso. Os itens da venda (dmaci) trazem o TES de cada item:
//   VENDA (venda de mercadoria): até fevereiro/2026 S001, S002, S501, S502; de março em diante SOMENTE S001 e S002 (Marcus, 27/10/2026). S008 não é usado.
//   BRINDE (bonificação, brindes e prêmios): S009, S503
//   TROCA (remessa para troca): S006, S504
//   INDICAÇÃO: S007, S505
//   PREMIAÇÃO POR META: S011
//   OUTROS (industrialização, conserto, roubo, transferência): qualquer outro TES (ex.: S004 em jan–abr/2026)
// Venda sem brinde = valor de venda da DevMaster − brinde − troca − indicação − premiação − outros. Conferido nos casos Esthefanny (R$ 1.042,00) e Tayane (R$ 800,00).
// Só 2026. A carga roda em SEGUNDO PLANO e guarda o resultado no banco (sorelly.venda_composicao): venda fechada não muda, então
// cada atualização lê só as vendas novas e os últimos 60 dias (para pegar cancelamento). Primeira carga: cerca de 30 segundos.
import { todasAsPaginas } from "./devmaster2.js";
import { consulta } from "./db.js";

const G = globalThis;
const INICIO = "2026-01-01";
const TES_VENDA = ["S001", "S002"];            // venda em qualquer época
const TES_VENDA_ATE_FEV = ["S501", "S502"];      // venda só até FIM_TES_ANTIGO; depois disso vira "outros"
const FIM_TES_ANTIGO = "2026-02-28";
const CATEGORIA = { S009: "brinde", S503: "brinde", S006: "troca", S504: "troca", S007: "indicacao", S505: "indicacao", S011: "premiacao" };
const ACERTO_A_CADA = 20 * 60 * 1000;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const estado = () => (G.__sorellyBrinde = G.__sorellyBrinde || { rodando: false, etapa: "", pct: 0, erro: "", pronto: false, concluidaEm: 0, vendas: 0, verificouBanco: false });

async function garantirTabelas() {
  await consulta(`create table if not exists sorelly.venda_composicao (
    venda text primary key, cliente text not null, emissao date not null, venda_dm numeric not null default 0,
    brinde numeric not null default 0, troca numeric not null default 0, indicacao numeric not null default 0, premiacao numeric not null default 0, outros numeric not null default 0,
    atualizada_em timestamptz not null default now())`);
  await consulta("alter table sorelly.venda_composicao add column if not exists acerto_dm numeric, add column if not exists comissao numeric, add column if not exists faturada date");   // valor do acerto e comissão da DevMaster (27/10/2026)
  await consulta("create index if not exists venda_composicao_cliente on sorelly.venda_composicao (cliente)");
  await consulta("create table if not exists sorelly.venda_composicao_estado (id int primary key, concluida_em timestamptz, vendas int)");
}

function isoDiaBR(deslocaDias = 0) {
  const d = new Date(Date.now() + deslocaDias * 86400000);
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t).value;
  return g("year") + "-" + g("month") + "-" + g("day");
}
const cod6 = (n) => String(n).padStart(6, "0");

// Lê vendas novas (e os últimos 60 dias), soma os itens que NÃO são venda e grava. Nunca roda duas vezes ao mesmo tempo.
export async function sincronizarBrindes({ completo = false } = {}) {   // completo: relê 2026 inteiro (a regra de TES mudou)
  const s = estado();
  if (s.rodando) return;
  s.rodando = true; s.erro = ""; s.pct = 0; s.etapa = "Lendo as vendas";
  try {
    await garantirTabelas();
    const tem = await consulta("select count(*)::int as n from sorelly.venda_composicao");
    const semAcerto = await consulta("select count(*)::int as n from sorelly.venda_composicao where acerto_dm is null or faturada is null");   // linhas antigas, sem o valor do acerto: relê tudo uma vez
    const desde = !completo && tem.rows[0].n > 0 && semAcerto.rows[0].n === 0 ? (isoDiaBR(-60) < INICIO ? INICIO : isoDiaBR(-60)) : INICIO;
    const vendas = (await todasAsPaginas("dmach", { filtro: { ach_situacao: "F", ach_datafat: { gte: desde + "T00:00:00" } }, campos: ["ach_codigo", "ach_cliente", "ach_emissao", "ach_datafat", "ach_valormerc", "ach_valortotal", "ach_valordesc", "ach_datacanc"] })).filter((x) => !x.ach_datacanc);
    if (!vendas.length) { s.pronto = true; s.concluidaEm = Date.now(); return; }
    const codigos = vendas.map((x) => Number(x.ach_codigo)).filter(Number.isFinite), minC = Math.min(...codigos), maxC = Math.max(...codigos);
    // itens que NÃO são venda, em faixas de 1.000 códigos, 4 faixas por vez
    s.etapa = "Lendo os brindes, trocas e prêmios";
    const faixas = []; for (let a = minC; a <= maxC; a += 1000) faixas.push([a, Math.min(a + 999, maxC)]);
    const soma = new Map(), dataDe = new Map(vendas.map((x) => [x.ach_codigo, String(x.ach_datafat || x.ach_emissao).slice(0, 10)]));
    let feitas = 0;
    const lerFaixa = async ([a, b]) => {
      const it = await todasAsPaginas("dmaci", { filtro: { aci_tes: { notin: TES_VENDA }, aci_venda: { gte: cod6(a), lte: cod6(b) } }, campos: ["aci_venda", "aci_tes", "aci_valortotal"] });
      it.forEach((x) => { if (TES_VENDA_ATE_FEV.includes(x.aci_tes) && (dataDe.get(x.aci_venda) || "9999") <= FIM_TES_ANTIGO) return; const o = soma.get(x.aci_venda) || { brinde: 0, troca: 0, indicacao: 0, premiacao: 0, outros: 0 }; o[CATEGORIA[x.aci_tes] || "outros"] += Number(x.aci_valortotal) || 0; soma.set(x.aci_venda, o); });
      feitas++; s.pct = Math.round((feitas / faixas.length) * 90);
    };
    for (let k = 0; k < faixas.length; k += 4) await Promise.all(faixas.slice(k, k + 4).map(lerFaixa));
    // grava (em lotes de 500)
    s.etapa = "Guardando no banco";
    for (let k = 0; k < vendas.length; k += 500) {
      const lote = vendas.slice(k, k + 500), params = [], linhas = lote.map((x, i) => {
        const o = soma.get(x.ach_codigo) || { brinde: 0, troca: 0, indicacao: 0, premiacao: 0, outros: 0 }, b = i * 12;
        params.push(x.ach_codigo, x.ach_cliente, String(x.ach_emissao).slice(0, 10), r2(x.ach_valormerc), r2(o.brinde), r2(o.troca), r2(o.indicacao), r2(o.premiacao), r2(o.outros), r2(x.ach_valortotal), r2(x.ach_valordesc), String(x.ach_datafat || x.ach_emissao).slice(0, 10));
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12})`;
      });
      await consulta(`insert into sorelly.venda_composicao (venda, cliente, emissao, venda_dm, brinde, troca, indicacao, premiacao, outros, acerto_dm, comissao, faturada) values ${linhas.join(",")}
        on conflict (venda) do update set cliente = excluded.cliente, emissao = excluded.emissao, venda_dm = excluded.venda_dm, brinde = excluded.brinde, troca = excluded.troca, indicacao = excluded.indicacao, premiacao = excluded.premiacao, outros = excluded.outros, acerto_dm = excluded.acerto_dm, comissao = excluded.comissao, faturada = excluded.faturada, atualizada_em = now()`, params);
    }
    // venda cancelada depois: sai do banco (só dentro do período relido)
    await consulta("delete from sorelly.venda_composicao where coalesce(faturada, emissao) >= $1 and venda <> all($2::text[])", [desde, vendas.map((x) => x.ach_codigo)]);
    const n = await consulta("select count(*)::int as n from sorelly.venda_composicao");
    await consulta("insert into sorelly.venda_composicao_estado (id, concluida_em, vendas) values (1, now(), $1) on conflict (id) do update set concluida_em = now(), vendas = $1", [n.rows[0].n]);
    s.pronto = true; s.concluidaEm = Date.now(); s.vendas = n.rows[0].n; s.pct = 100; s.etapa = "Pronto";
  } catch (x) { s.erro = x.message || String(x); s.etapa = "Erro"; console.error("[vendas-brinde]", x); }
  finally { s.rodando = false; }
}

// Situação da carga. Na primeira chamada confere no banco se já houve uma carga completa.
export async function situacaoBrindes() {
  const s = estado();
  if (!s.verificouBanco) {
    s.verificouBanco = true;
    try { await garantirTabelas(); const r = await consulta("select concluida_em, vendas from sorelly.venda_composicao_estado where id = 1"); if (r.rows[0] && r.rows[0].concluida_em) { s.pronto = true; s.concluidaEm = new Date(r.rows[0].concluida_em).getTime(); s.vendas = r.rows[0].vendas; } }
    catch (x) { s.erro = x.message; }
  }
  return { pronto: s.pronto, rodando: s.rodando, pct: s.pct, etapa: s.etapa, erro: s.erro, concluidaEm: s.concluidaEm, vendas: s.vendas };
}

// Dispara a carga em segundo plano quando ainda não houve carga ou já passou o intervalo (ou quando o usuário pede para atualizar).
export function iniciarCargaBrindes({ forcar = false } = {}) {
  const s = estado();
  if (s.rodando) return;
  if (forcar || !s.pronto || Date.now() - s.concluidaEm > ACERTO_A_CADA) sincronizarBrindes().catch(() => {});
}

// Venda sem brinde = valor de venda da DevMaster − tudo o que não é venda. Valor do acerto (o que a revendedora paga) = valor do acerto da DevMaster − o mesmo.
const NAO_VENDA = "(brinde + troca + indicacao + premiacao + outros)";
const LIQ = "(venda_dm - " + NAO_VENDA + ")", ACE = "(coalesce(acerto_dm, 0) - " + NAO_VENDA + ")";

// Totais por revendedora: venda sem brinde, brinde, nº de acertos e valor dos acertos por mês; e as 3 últimas vendas (sem brinde). Só 2026.
export async function composicaoGeral() {
  const mensal = await consulta(`select cliente, to_char(coalesce(faturada, emissao), 'YYYY-MM') as mes, count(*)::int as n, sum(${LIQ}) as liquida, sum(${ACE}) as acerto, sum(brinde) as brinde, sum(troca) as troca, sum(indicacao) as indicacao, sum(premiacao) as premiacao
    from sorelly.venda_composicao group by 1, 2`);
  const ult = await consulta("select cliente, venda, coalesce(faturada, emissao) as emissao, venda_dm, brinde, troca, indicacao, premiacao, outros from sorelly.venda_composicao order by cliente, coalesce(faturada, emissao) desc, venda desc");
  const m = new Map();
  const de = (c) => m.get(c) || m.set(c, { vm: {}, bm: {}, tm: {}, nm: {}, am: {}, v: [] }).get(c);
  mensal.rows.forEach((x) => { const o = de(x.cliente); o.vm[x.mes] = r2(x.liquida); o.bm[x.mes] = r2(x.brinde); o.tm[x.mes] = r2(Number(x.troca) + Number(x.indicacao) + Number(x.premiacao)); o.nm[x.mes] = x.n; o.am[x.mes] = r2(x.acerto); });
  ult.rows.forEach((x) => { const o = de(x.cliente); if (o.v.length < 3) o.v.push({ d: new Date(x.emissao).toISOString().slice(0, 10), v: r2(Number(x.venda_dm) - Number(x.brinde) - Number(x.troca) - Number(x.indicacao) - Number(x.premiacao) - Number(x.outros)), b: r2(x.brinde) }); });
  return m;
}

// Resumo de TODAS as vendas (não só das revendedoras da lista): por mês de 2026, ou de um dia (dia = "2026-10-26").
export async function resumoVendas(dia) {
  const r = await consulta(`select ${dia ? "to_char(coalesce(faturada, emissao), 'YYYY-MM-DD')" : "to_char(coalesce(faturada, emissao), 'YYYY-MM')"} as per, count(*)::int as acertos, count(distinct cliente)::int as clientes,
      sum(venda_dm) as bruta, sum(${LIQ}) as venda, sum(${ACE}) as acerto, sum(coalesce(comissao, 0)) as comissao, sum(brinde) as brinde, sum(troca) as troca, sum(indicacao) as indicacao, sum(premiacao) as premiacao, sum(outros) as outros
    from sorelly.venda_composicao ${dia ? "where coalesce(faturada, emissao) = $1" : ""} group by 1 order by 1`, dia ? [dia] : []);
  return r.rows.map((x) => ({ periodo: x.per, acertos: x.acertos, clientes: x.clientes, bruta: r2(x.bruta), venda: r2(x.venda), acerto: r2(x.acerto), comissao: r2(x.comissao), brinde: r2(x.brinde), troca: r2(x.troca), indicacao: r2(x.indicacao), premiacao: r2(x.premiacao), outros: r2(x.outros) }));
}

// Composição de cada venda de UMA revendedora (para a ficha). Chave: código da venda.
export async function composicaoDoCliente(cliente) {
  const r = await consulta("select venda, venda_dm, brinde, troca, indicacao, premiacao, outros, acerto_dm from sorelly.venda_composicao where cliente = $1", [cliente]);
  const m = new Map();
  r.rows.forEach((x) => m.set(x.venda, { bruto: r2(x.venda_dm), brinde: r2(x.brinde), troca: r2(x.troca), indicacao: r2(x.indicacao), premiacao: r2(x.premiacao), outros: r2(x.outros), liquida: r2(Number(x.venda_dm) - Number(x.brinde) - Number(x.troca) - Number(x.indicacao) - Number(x.premiacao) - Number(x.outros)), acertoLiq: r2(Number(x.acerto_dm) - Number(x.brinde) - Number(x.troca) - Number(x.indicacao) - Number(x.premiacao) - Number(x.outros)) }));
  return m;
}
