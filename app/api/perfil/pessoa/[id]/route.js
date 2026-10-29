export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A Diretoria (e o Marketing) coloca ou troca a foto de qualquer pessoa, para todos verem no sistema e no SorellyChat.
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";

const LIMITE_FOTO = 60000;   // a tela reduz a foto para 160 px (uns 10 KB)

export const PATCH = rota(async (req, { eu, params }) => {
  const marketing = Array.isArray(eu.setores) && eu.setores.includes("marketing");
  if (eu.perfil !== "ADMIN" && !marketing) return erro("Só a Diretoria e o Marketing mudam a foto de outra pessoa.", 403);
  const pessoaId = Number(params.id);
  if (!Number.isInteger(pessoaId)) throw invalido("pessoa");
  const b = await corpo(req, 128 * 1024);
  if (b.foto !== "" && !(typeof b.foto === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(b.foto) && b.foto.length <= LIMITE_FOTO)) throw invalido("foto");
  const r = await consulta("update sorelly.conta set foto = $2, perfil_em = now() where pessoa_id = $1 and status = 'ativo' returning pessoa_id, nome, foto, situacao, perfil_em", [pessoaId, b.foto || null]);
  const x = r.rows[0];
  if (!x) return erro("Esta pessoa ainda não tem conta no sistema. A foto fica só neste computador.", 404);
  return json({ ok: true, pessoa: { pessoaId: x.pessoa_id, nome: x.nome, foto: x.foto || "", situacao: x.situacao || "disponivel", em: x.perfil_em } });
});
