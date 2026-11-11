export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// LEITURA EM LOTE dos módulos (11/11/2026). Antes cada tela aberta fazia uma chamada por módulo (cerca de 40) a cada 20 s, e cada chamada é cobrada pela Vercel.
// Agora é UMA chamada: GET /api/estado?m=rh.12,ff.81,ce.0 (módulo.versão que a tela já tem; 0 = quero tudo).
// Resposta: {modulos: {rh:{versao, igual:true} | {versao, conteudo}}, semAcesso:[...]} — volta conteúdo só do que mudou. Mesmas regras de GET /api/estado/<módulo>.
import { json, rota, invalido } from "@/server/http";
import { consulta } from "@/server/db";
import { podeModulo } from "@/server/permissoes";
import { ehModuloItens, respostaItens } from "@/server/estado-itens";

const MODULO = /^[a-z][a-zA-Z0-9_]{0,29}$/;

export const GET = rota(async (req, { eu, url }) => {
  const pedidos = String(url.searchParams.get("m") || "").split(",").filter(Boolean);
  if (!pedidos.length || pedidos.length > 100) throw invalido("m");
  const desde = {}, semAcesso = [], normais = [], itens = [];
  pedidos.forEach((p) => {
    const [mod, v = "0"] = p.split(".");
    if (!MODULO.test(mod) || !/^\d+$/.test(v)) throw invalido("m");
    if (!podeModulo(eu, mod)) { semAcesso.push(mod); return; }
    desde[mod] = Number(v);
    (ehModuloItens(mod) ? itens : normais).push(mod);
  });
  const modulos = {};
  if (normais.length) {
    const vs = await consulta("select modulo, versao from sorelly.estado_modulo where modulo = any($1::text[])", [normais]);
    const versao = {}; vs.rows.forEach((l) => { versao[l.modulo] = l.versao; });
    const buscar = [];
    normais.forEach((m) => {
      const v = versao[m] || 0;
      if (desde[m] > 0 && v > 0 && v === desde[m]) modulos[m] = { versao: v, igual: true };
      else if (!v) modulos[m] = { versao: 0, conteudo: {} };
      else buscar.push(m);
    });
    if (buscar.length) {
      const r = await consulta("select modulo, conteudo, versao from sorelly.estado_modulo where modulo = any($1::text[])", [buscar]);
      r.rows.forEach((l) => { modulos[l.modulo] = { versao: l.versao, conteudo: l.conteudo || {} }; });
    }
  }
  for (const m of itens) modulos[m] = await respostaItens(m, desde[m] > 0 ? desde[m] : undefined);
  return json({ modulos, semAcesso });
});
