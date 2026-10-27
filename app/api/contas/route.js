export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Lista das contas de acesso (só a Diretoria).
import { json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { paraConta } from "@/server/contas";

export const GET = rota(async () => {
  const r = await consulta("select * from sorelly.conta order by (status = 'aguardando') desc, lower(nome)");
  return json({ contas: r.rows.map(paraConta) });
}, { diretoria: true });
