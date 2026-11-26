export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// MULTAS AUTOMÁTICAS DO ACERTO (26/11/2026, Marcus: "as representantes só clicam em qualquer coisa pra passar rápido"). O sistema calcula; a representante só confirma.
//   GET /api/representante/multas?cod=002130  -> {achou, atrasoDias, referencia, remarcacoes:{total, cobraveis, isentas}}
// Fonte: o atendimento interno (módulo "ri": agenda, histórico e registro de contatos da revendedora) e os feriados do RH (módulo "rh"). Só leitura.
//   atrasoDias   = dias úteis depois do primeiro dia marcado do ciclo (a regra dos 5 dias úteis sem multa fica no cálculo do acerto, atrasoAcerto)
//   remarcacoes  = remarcou, não veio ou desmarcou desde o último acerto; "cobraveis" = as que pesam (sem isenção)
import { consulta } from "@/server/db";
import { erro, json, rota } from "@/server/http";
import { definirFeriadosAgenda, diasUteisDepois, referenciaPrazo, resumoMulta } from "@/apps/montagem/domain/revendedoras-internas";

const hojeSP = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());

export const GET = rota(async (req, { url }) => {
  const cod = String(url.searchParams.get("cod") || "").replace(/\D/g, "").padStart(6, "0");
  if (!/^\d{6}$/.test(cod) || cod === "000000") return erro("Informe ?cod=código da revendedora.", 400);
  const [ri, rh] = await Promise.all([
    consulta("select e as r from sorelly.estado_modulo, jsonb_array_elements(conteudo->'revInternas') e where modulo = 'ri' and e->>'devmaster' = $1 limit 1", [cod]),
    consulta("select conteudo->'config'->'feriados' as f from sorelly.estado_modulo where modulo = 'rh'"),
  ]);
  const r = ri.rows[0] && ri.rows[0].r;
  if (!r) return json({ achou: false, atrasoDias: 0, referencia: "", remarcacoes: { total: 0, cobraveis: 0, isentas: 0 } });
  definirFeriadosAgenda((rh.rows[0] && rh.rows[0].f) || []);
  const hoje = hojeSP(), ref = referenciaPrazo(r) || "";
  const m = resumoMulta(r.registro, (r.hist && r.hist[0] && r.hist[0].data) || null, hoje);
  return json({ achou: true, atrasoDias: ref ? diasUteisDepois(ref, hoje) : 0, referencia: ref, remarcacoes: { total: m.total, cobraveis: m.cobraveis, isentas: m.isentas } });
});
