export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Funil "Cadastro" do Kommo: etapas e quantos leads em cada (só leitura, só Diretoria, cache de 5 min). 17/11/2026.
//   GET /api/kommo/cadastro        |   ?atualizar=1 ignora o cache
import { erro, json, rota } from "@/server/http";
import { kommoFunilCadastro } from "@/server/kommo";

export const GET = rota(async (req, { url }) => {
  try { return json(await kommoFunilCadastro({ forcar: url.searchParams.get("atualizar") === "1" })); }
  catch (x) { return erro(x.message, x.statusCode || 500); }
}, { diretoria: true });
