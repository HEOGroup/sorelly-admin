export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// DevMaster API 2: lista os registros de uma tabela (só a Diretoria; leitura somente).
//   GET /api/devmaster2/dmaam?registros=20&pagina=0&campos=aam_codigo,aam_nome&ordem=aam_nome&filtro={"aam_ativo":true}&empresa=01
import { json, rota, invalido } from "@/server/http";
import { consultarTabela } from "@/server/devmaster2";

export const GET = rota(async (req, { params, url }) => {
  const q = (k) => url.searchParams.get(k);
  const num = (k) => (q(k) === null ? undefined : (/^\d+$/.test(q(k)) ? Number(q(k)) : (() => { throw invalido(k); })()));
  let filtro; if (q("filtro")) { try { filtro = JSON.parse(q("filtro")); } catch (x) { throw invalido("filtro precisa ser JSON"); } }
  const r = await consultarTabela(params.codigo, {
    pagina: num("pagina"), registros: num("registros"), ordem: q("ordem") || undefined, filtro,
    campos: q("campos") ? q("campos").split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    empresa: q("empresa") || undefined, filial: q("filial") || undefined,
  });
  return json(r);
}, { diretoria: true });
