export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { json, rota } from "@/server/http";
import { consulta } from "@/server/db";

export const GET = rota(async () => { await consulta("select 1"); return json({ ok: true }); }, { publica: true });
