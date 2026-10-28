export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A própria pessoa muda a sua foto e a sua situação. Nome e e-mail NÃO mudam por aqui (só a Diretoria, na aba Contas).
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";

const SITUACOES = ["disponivel", "reuniao", "ausente"];
const LIMITE_FOTO = 60000;   // a tela reduz a foto para 160 px (uns 10 KB); acima disso é recusada

export const PATCH = rota(async (req, { eu }) => {
  if (!eu.conta) return erro("Esta conta não permite mudar a foto.", 400);
  const b = await corpo(req, 128 * 1024);
  const sets = [], vals = [eu.id];
  if (b.situacao !== undefined) {
    if (![16, 17, 28].includes(eu.pessoaId)) return erro("Só Marcus, Nickolas e Lucas podem mudar a situação.", 400);   // os demais ficam sempre disponíveis e sempre recebem os avisos
    if (!SITUACOES.includes(b.situacao)) throw invalido("situacao");
    vals.push(b.situacao); sets.push("situacao = $" + vals.length);
  }
  if (b.foto !== undefined) {
    if (b.foto !== "" && !(typeof b.foto === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(b.foto) && b.foto.length <= LIMITE_FOTO)) throw invalido("foto");
    vals.push(b.foto || null); sets.push("foto = $" + vals.length);
  }
  if (!sets.length) throw invalido("nada para mudar");
  const r = await consulta("update sorelly.conta set " + sets.join(", ") + ", perfil_em = now() where id = $1 returning pessoa_id, nome, foto, situacao, perfil_em", vals);
  const x = r.rows[0];
  return json({ ok: true, pessoa: { pessoaId: x.pessoa_id, nome: x.nome, foto: x.foto || "", situacao: x.situacao, em: x.perfil_em } });
});
