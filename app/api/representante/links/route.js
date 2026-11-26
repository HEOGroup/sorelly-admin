export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// LINKS PAGOS DA REVENDEDORA NO ACERTO DO ADMIN DAS REPRESENTANTES (26/11/2026, Leonardo: "a representante não tem que anexar o comprovante, isso dá muito trabalho para ela";
// "o importante é o link: ele tem comprovante e foi pago, não pode ter divergência"). A conta de representante não abre o módulo lp (Link de pagamento).
// Esta rota entrega só o necessário de UMA revendedora: os links pagos (valor, SALDO ainda não usado em acerto, se já conta hoje, conta do link) e o comprovante que o setor de links anexou.
//   GET /api/representante/links?rev=Nome                    -> {itens:[{id, valor, saldo, usavel, parcelas, bandeira, pagoEm, cnpjId, meio, acertoId, comprovante:{nome, mime} | null}]}
//   GET /api/representante/links?rev=Nome&comprovante=<id>   -> {nome, mime, url (data URL)}
// saldo = valor do link − o que já entrou em acertos FINALIZADOS das representantes (rpf). O que sobra de um link maior que o acerto fica para o próximo acerto (mesma regra do Atendimento Sorelly).
// Representante: só revendedora de um kit dela (mesmos kits dos pedidos de conta, rep-pag.js). Equipe: quem abre o Link de pagamento ou a operação das representantes. Só leitura.
import { consulta } from "@/server/db";
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { codigosDe } from "@/server/rep-codigos";
import { revendedorasDaRep } from "@/server/rep-pag";
import { garantirTabelaAnexo } from "@/server/anexos";
import { hojeSP, linkUsavel, linksPagosDaRevendedora, nomeParecido, somaDias } from "@/apps/montagem/domain/link-pagamento";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// links pagos dos últimos 60 dias, sem os importados da planilha antiga (o nome parecido é conferido depois, pela mesma regra da tela)
async function pagosRecentes() {
  const [r, m, u] = await Promise.all([
    consulta(`select jsonb_build_object('id', e->'id', 'revendedora', e->'revendedora', 'valor', e->'valor', 'parcelas', e->'parcelas', 'bandeira', e->'bandeira', 'meioId', e->'meioId',
        'pagoEm', e->'pagoEm', 'geradoEm', e->'geradoEm', 'paraAtendimento', e->'paraAtendimento', 'status', e->'status',
        'acertoId', e->'acertoId', 'comprovante', e->'comprovante', 'temImg', coalesce(e->>'comprovanteImg', '') <> '') as x
      from sorelly.estado_modulo, jsonb_array_elements(conteudo->'solicitacoes') e
      where modulo = 'lp' and e->>'status' in ('pago', 'comprovante') and left(e->>'pagoEm', 10) >= $1
        and coalesce(e->>'importado', '') <> 'true' and coalesce(e->>'descontado', '') <> 'true'`, [somaDias(hojeSP(), -60)]),
    consulta(`select m->>'id' as id, m->>'nome' as nome, m->>'cnpjId' as cnpj from sorelly.estado_modulo, jsonb_array_elements(conteudo->'meios') m where modulo = 'lp'`),
    // quanto de cada link já entrou em acerto FINALIZADO das representantes (a conta dela não grava no módulo lp). Acerto = a_ (app) + ax_ (equipe): vale um registro por acerto, o que tem a lista de pagamentos
    consulta(`with ac as (
        select distinct on (substr(chave, strpos(chave, '_') + 1)) valor from sorelly.estado_item
        where modulo = 'rpf' and (left(chave, 2) = 'a_' or left(chave, 3) = 'ax_') and coalesce(valor->>'_apagado', '') <> 'true'
        order by substr(chave, strpos(chave, '_') + 1), (jsonb_typeof(valor->'pagamentos') = 'array') desc, (left(chave, 3) = 'ax_') desc)
      select p->>'linkSolId' as id, sum(case when jsonb_typeof(p->'valor') = 'number' then (p->>'valor')::numeric else 0 end) as usado
      from ac, jsonb_array_elements(case when jsonb_typeof(valor->'pagamentos') = 'array' then valor->'pagamentos' else '[]'::jsonb end) p
      where coalesce(p->>'linkSolId', '') <> '' group by 1`),
  ]);
  const meios = new Map(m.rows.map((l) => [String(l.id), l])), usado = new Map(u.rows.map((l) => [String(l.id), Number(l.usado) || 0]));
  return r.rows.map((l) => {
    const x = l.x, mm = meios.get(String(x.meioId || "")), saldo = x.acertoId ? 0 : Math.max(0, r2((Number(x.valor) || 0) - (usado.get(String(x.id)) || 0)));
    return Object.assign({}, x, { saldo, acertoId: x.acertoId || (saldo <= 0.009 ? "acerto" : ""), cnpjId: (mm && mm.cnpj) || "", meio: (mm && mm.nome) || "" });
  });
}

export const GET = rota(async (req, { eu, url }) => {
  const rev = String(url.searchParams.get("rev") || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!rev) return erro("Diga qual revendedora (?rev=nome).", 400);
  if (eu.repCod) {
    const nomes = await revendedorasDaRep(codigosDe(eu));
    if (!nomes.some((n) => nomeParecido(n, rev))) return erro("Esta revendedora não está nos seus kits.", 403);
  } else if (!podeModulo(eu, "lp") && !podeModulo(eu, "rpo")) return erro("Você não tem acesso aos links de pagamento.", 403);
  const links = linksPagosDaRevendedora(await pagosRecentes(), rev), hoje = hojeSP();
  const id = url.searchParams.get("comprovante");
  if (id === null) {
    return json({ itens: links.map((x) => ({ id: x.id, valor: x.valor, saldo: x.saldo, usavel: linkUsavel(x, hoje), parcelas: x.parcelas || 1, bandeira: x.bandeira || "", pagoEm: x.pagoEm || "",
      cnpjId: x.cnpjId, meio: x.meio, acertoId: x.acertoId || "",
      comprovante: x.comprovante && x.comprovante.key ? { nome: x.comprovante.nome || "comprovante", mime: x.comprovante.mime || "" } : x.temImg ? { nome: "comprovante.jpg", mime: "image/jpeg" } : null })) });
  }
  // o arquivo do comprovante: só de um link desta revendedora
  const x = links.find((y) => String(y.id) === String(id));
  if (!x) return erro("Link não encontrado para esta revendedora.", 404);
  let a = null;
  if (x.comprovante && x.comprovante.key) {
    await garantirTabelaAnexo();
    const r = await consulta("select nome, mime, url from sorelly.anexo_modulo where id = $1 and modulo = 'lp'", [x.comprovante.key]);
    a = r.rows[0] || null;
  } else if (x.temImg) {   // foto antiga, guardada dentro do pedido (link pago por fora)
    const r = await consulta("select e->>'comprovanteImg' as url from sorelly.estado_modulo, jsonb_array_elements(conteudo->'solicitacoes') e where modulo = 'lp' and e->>'id' = $1 limit 1", [String(x.id)]);
    a = r.rows[0] ? { nome: "comprovante.jpg", mime: "image/jpeg", url: r.rows[0].url } : null;
  }
  if (!a || !a.url) return erro("Este link ainda não tem comprovante.", 404);
  if (a.url.length > 3.4 * 1024 * 1024) return erro("Comprovante grande demais para abrir aqui. Peça ao setor de links uma foto menor.", 413);
  return json({ nome: a.nome, mime: a.mime, url: a.url });
});
