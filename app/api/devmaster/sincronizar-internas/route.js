export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { json, rota, corpo, invalido } from "@/server/http";
import { consulta } from "@/server/db";
import { listaDevmaster, casaVendedor } from "@/server/devmaster";

// grava no banco as revendedoras internas (tabela atendimento_revendedora): cria as novas e atualiza nome e telefone das que já têm o mesmo código
export const POST = rota(async (req) => {
  const b = await corpo(req);
  if (typeof b.vendedor !== "string" || !b.vendedor.length) throw invalido("vendedor");
  const lista = (await listaDevmaster(true)).filter((i) => casaVendedor(i, b.vendedor));
  let criadas = 0, atualizadas = 0;
  for (const i of lista) {
    const contatos = JSON.stringify(i.celular ? [{ nome: "WhatsApp da revendedora", fone: i.celular }] : []);
    const ja = await consulta('select id from sorelly.atendimento_revendedora where "codigoExterno" = $1 limit 1', [i.codigo]);
    if (ja.rows[0]) {
      await consulta('update sorelly.atendimento_revendedora set nome = $2, contatos = case when $3::jsonb = \'[]\'::jsonb then contatos else $3::jsonb end, "updatedAt" = now() where id = $1', [ja.rows[0].id, i.nome, contatos]);
      atualizadas++;
    } else {
      await consulta('insert into sorelly.atendimento_revendedora (id, nome, "codigoExterno", contatos, "updatedAt") values (gen_random_uuid()::text, $1, $2, $3::jsonb, now())', [i.nome, i.codigo, contatos]);
      criadas++;
    }
  }
  return json({ vendedor: b.vendedor, encontradas: lista.length, criadas, atualizadas });
}, { diretoria: true });
