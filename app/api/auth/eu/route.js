export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { json, rota } from "@/server/http";

export const GET = rota(async (req, { eu }) => json({ usuario: eu }));
