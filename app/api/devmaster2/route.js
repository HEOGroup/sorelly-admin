export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// DevMaster API 2: quais tabelas e relatórios o token libera (só a Diretoria). Leitura somente.
import { json, rota } from "@/server/http";
import { liberadoNoToken } from "@/server/devmaster2";

export const GET = rota(async () => json(liberadoNoToken()), { diretoria: true });
