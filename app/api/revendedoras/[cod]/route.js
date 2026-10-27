export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Ficha de uma revendedora: cadastro e condicionais abertas, da última para a primeira, com o tipo de cada uma. Só a Diretoria; leitura somente.
import { json, rota } from "@/server/http";
import { fichaRevendedora } from "@/server/revendedoras";

export const GET = rota(async (req, { params }) => json(await fichaRevendedora(params.cod)), { diretoria: true });
