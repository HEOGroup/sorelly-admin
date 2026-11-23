// Taxa de entrega da reposição (Marcus, 23/11/2026): quando a equipe confere o comprovante e clica em "Confirmar pagamento", a taxa PAGA vira
// UM lançamento nos dois lados: entra no Contas a receber (a revendedora pagou) e no Contas a pagar já paga (pago ao entregador), com o mesmo comprovante.
// Taxa não paga não lança nada. Regra escrita em docs/negocio/lancamento-universal/09-taxa-de-entrega-encomendas.md.
import { consulta } from "./db.js";
import { gravarModulo } from "./estado-modulo.js";
import { garantirTabelaAnexo } from "./anexos.js";
import { garantir } from "../apps/montagem/domain/recebimentos-antecipados.js";

const hojeIso = () => new Date().toISOString().slice(0, 10);
const chaveNova = () => "an_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
const falha = (msg, codigo) => Object.assign(new Error(msg), { statusCode: codigo || 400 });

export async function confirmarTaxa(eu, linkId) {
  const por = String((eu && (eu.nome || eu.id)) || "");
  if (!/^[a-z0-9-]{6,80}$/i.test(String(linkId || ""))) throw falha("Link inválido.");
  const l = (await consulta("select id, revendedora, cod, representante, taxa, dados from sorelly.pedido_link where id = $1", [linkId])).rows[0];
  if (!l) throw falha("Link não encontrado.", 404);
  const d = l.dados || {}, taxa = Math.round((Number(l.taxa) || 0) * 100) / 100;
  if (!(taxa > 0)) throw falha("Este pedido não tem taxa.");
  if (!d.separado) throw falha("As peças ainda não foram separadas.");
  if (!d.pagamento || !d.pagamento.key) throw falha("A revendedora ainda não enviou o comprovante.");
  if (d.pagamento.confirmado) throw falha("Este pagamento já foi confirmado.");
  await garantirTabelaAnexo();
  const an = (await consulta("select nome, mime, url, tamanho from sorelly.anexo_modulo where id = $1", [d.pagamento.key])).rows[0];
  if (!an) throw falha("Não achei o comprovante enviado.");
  const pixCfg = (await consulta("select conteudo->'config'->'pix' as pix from sorelly.estado_modulo where modulo = 'er'")).rows[0];
  const recebedor = String((pixCfg && pixCfg.pix && pixCfg.pix.recebedor) || "").trim() || "João Guilherme";

  // trava: só uma confirmação por pedido (duas pessoas clicando juntas não lançam duas vezes)
  const marca = await consulta("update sorelly.pedido_link set dados = jsonb_set(dados, '{pagamento,confirmado}', $2::jsonb) where id = $1 and dados->'pagamento'->'confirmado' is null returning id", [linkId, JSON.stringify({ em: new Date().toISOString(), por })]);
  if (!marca.rows.length) throw falha("Este pagamento já foi confirmado.");
  try {
    const hoje = hojeIso(), contaId = "taxa-" + linkId, nome = "Taxa de entrega · reposição · " + String(l.revendedora).trim();
    // 1) Contas a pagar: conta lançada e já paga (baixa com o comprovante)
    await gravarModulo("cpe", {}, "patch", por, (guardado, novo) => {
      const lanc = Array.isArray(guardado.lanc) ? guardado.lanc : [], baixas = Array.isArray(guardado.baixas) ? guardado.baixas : [], hist = Array.isArray(guardado.hist) ? guardado.hist : [];
      if (lanc.some((x) => x.id === contaId)) return novo;
      const item = { id: contaId, filial: "34", nat: "3.99.99.99", natNome: "Taxa de entrega (reposição)", pref: "PIX", forn: recebedor, nome, venc: hoje, valor: taxa, status: "apagar", fam: false, saida: "Pix", centro: "", hist: "Taxa paga pela revendedora direto ao entregador · pedido " + linkId, emissao: hoje, linkId };
      const bx = { id: "bx-" + contaId, chave: "l|" + contaId, data: hoje, forma: "Pix revendedora", conta: "", contaNome: "Pix revendedora", principal: taxa, juros: 0, multa: 0, desc: 0, obs: "Pago pela revendedora direto ao entregador", por, em: Date.now(), desc_txt: nome, comprovante: { url: an.url, nome: an.nome || "comprovante" } };
      return Object.assign({}, novo, { lanc: lanc.concat([item]), baixas: baixas.concat([bx]), hist: hist.concat([{ ts: bx.em, por, acao: "Deu baixa", chave: bx.chave, desc: nome, valor: taxa }]) });
    });
    // 2) Contas a receber: recebimento sem acerto (tipo "outro"), com o mesmo comprovante guardado também lá
    const chave = chaveNova();
    await consulta("insert into sorelly.anexo_modulo (id, modulo, nome, mime, url, tamanho, por) values ($1, 'contasreceber', $2, $3, $4, $5, $6) on conflict (id) do nothing", [chave, an.nome, an.mime, an.url, an.tamanho, por]);
    await gravarModulo("contasreceber", {}, "patch", por, (guardado, novo) => {
      const g = garantir(guardado), id = "taxa_" + linkId;
      if (g.antecipados.some((x) => x.id === id)) return novo;
      const item = { id, data: hoje, valor: taxa, rev: String(l.revendedora).trim(), destino: "empresa", tipo: "outro", destinoId: "", destinoNome: "Taxa de entrega · pago ao " + recebedor, personaId: "", contaId: "", casa: "", contaTxt: "", compKey: chave, compNome: an.nome || "comprovante", compTipo: an.mime || "", ffPixId: "", por, em: new Date().toISOString(), revCod: String(l.cod || ""), repNome: String(l.representante || ""), pagador: "", linkId };
      return Object.assign({}, novo, { antecipados: g.antecipados.concat([item]), usados: g.usados, adotados: g.adotados });
    });
  } catch (x) {
    await consulta("update sorelly.pedido_link set dados = dados #- '{pagamento,confirmado}' where id = $1", [linkId]).catch(() => {});
    throw x;
  }
  return { ok: true };
}
