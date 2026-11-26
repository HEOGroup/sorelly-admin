// Compras × SorellyChat (Mudança 2, 18/11/2026).
// 1. Um GRUPO do chat por pedido (id "compra_<id>", "Compra #id · título"). Membros: o solicitante e quem agiu no pedido (aprovou, analisou, devolveu, escreveu). O financeiro inteiro NÃO entra.
// 2. AVISOS: o domínio (domain/compras-estoque.js, marcaAviso) marca no histórico do pedido um evento {aviso:{aid, texto...}} a cada mudança de etapa.
//    Aqui o servidor lê o pedido JÁ GRAVADO no banco (módulo ce) e grava o aviso como mensagem do grupo, com id = aid. Como o id é fixo, gravar de novo não duplica (on conflict do nothing).
//    O aviso só informa: nada aqui aprova, libera ou move pedido. Falha no chat não desfaz a ação (o pedido já está gravado).
// 3. CONVERSA DO PEDIDO = o próprio grupo do chat: a tela do pedido lê e escreve nas mensagens dele, e o que o solicitante responde no chat aparece no pedido. Não há cópia, então não há ciclo.
// Destinatário: SEMPRE pelo id da pessoa (pedido.solicitanteId → conta com aquele pessoa_id → contato do chat da própria conta). Nunca por aproximação de nome.
import { consulta } from "@/server/db";
import { contatoDaConta } from "@/server/chat";
import { contato } from "@/apps/montagem/domain/chat-contatos";

// conversa pessoal de avisos de compras (26/11/2026): uma por pessoa, criada só quando chega o primeiro aviso para ela
export const convPessoal = (cid) => "cpav_" + String(cid).replace(/[^A-Za-z0-9_.:-]/g, "");
async function garantirConvPessoal(cid) {
  const id = convPessoal(cid), ja = (await consulta("select 1 from sorelly.chat_conv where id = $1", [id])).rows[0];
  if (ja) return id;
  const agora = Date.now(), dados = { id, tipo: "grupo", nome: "Avisos de compras", membros: [cid], admins: [], criada: agora, base: agora - 1000, fixaPor: {}, descr: "Avisos das compras em que você precisa agir. Abra o pedido pelo botão do aviso." };
  await consulta("insert into sorelly.chat_conv (id, dados, membros) values ($1, $2, $3) on conflict (id) do nothing", [id, dados, [cid]]);
  return id;
}
export const convDoPedido = (id) => "compra_" + String(id).replace(/[^A-Za-z0-9_.:-]/g, "");

// contato do chat de uma pessoa do sistema (pessoa_id), pela conta ATIVA dela. Mais de uma conta ativa com contatos diferentes = ambíguo: não entrega.
export async function cidDaPessoa(pessoaId) {
  if (pessoaId == null || pessoaId === "") return null;
  const r = await consulta("select cid, pessoa_id from sorelly.conta where pessoa_id::text = $1 and status = 'ativo'", [String(pessoaId)]);
  const cids = [...new Set(r.rows.map((x) => contatoDaConta({ cid: x.cid, pessoaId: x.pessoa_id })).filter(Boolean))];
  return cids.length === 1 ? cids[0] : null;
}

async function lerPedidos() {
  const r = await consulta("select conteudo->'pedidos' as p from sorelly.estado_modulo where modulo = 'ce'");
  return (r.rows[0] && r.rows[0].p) || [];
}
export async function lerPedido(id) { return (await lerPedidos()).find((p) => String(p.id) === String(id)) || null; }

// cria o grupo do pedido ou acrescenta membros (nunca tira ninguém). Devolve a lista de membros.
export async function garantirConv(p, novos) {
  const id = convDoPedido(p.id), atual = (await consulta("select dados, membros from sorelly.chat_conv where id = $1", [id])).rows[0];
  const membros = [...new Set([...(atual ? atual.membros : []), ...novos.filter(Boolean)])];
  if (!membros.length) return [];
  const nome = "Compra #" + p.id + " · " + (p.titulo || "Sem título");
  if (atual && membros.length === atual.membros.length && atual.dados && atual.dados.nome === nome) return membros;
  const agora = Date.now();
  const dados = Object.assign({ id, tipo: "grupo", admins: [], criada: agora, base: agora - 1000, fixaPor: {} }, atual ? atual.dados : {},
    { id, nome, membros, compra: p.id, descr: "Conversa do pedido de compra #" + p.id + ". Os avisos de cada etapa chegam aqui. Abra o pedido em Materiais e estoque › Compras." });
  await consulta(`insert into sorelly.chat_conv (id, dados, membros) values ($1, $2, $3)
    on conflict (id) do update set dados = $2, membros = $3, seq = nextval('sorelly.chat_seq')`, [id, dados, membros]);
  return membros;
}

// entrega os avisos ainda não entregues. ids = lista de pedidos (vazio = todos os avisos dos últimos 7 dias, depois de qualquer gravação do módulo ce).
// Devolve {[pedidoId]: {vinculo:bool, entregues:[aid], pendentes:[aid]}}
export async function entregarAvisos(ids) {
  const pedidos = await lerPedidos(), lim = Date.now() - 7 * 86400000, out = {};
  const alvo = pedidos.filter((p) => (ids && ids.length ? ids.some((x) => String(x) === String(p.id)) : true));
  const lista = [];
  alvo.forEach((p) => (p.eventos || []).forEach((ev) => {
    if (!ev.aviso || !ev.aviso.aid) return;
    if (!(ids && ids.length) && !(Date.parse(String(ev.em).replace(" ", "T")) >= lim)) return;
    lista.push({ p, ev });
  }));
  if (!lista.length) { alvo.forEach((p) => { out[p.id] = { vinculo: p.solicitanteId != null, entregues: [], pendentes: [] }; }); return out; }
  const porPedido = new Map(); lista.forEach((x) => { if (!porPedido.has(x.p.id)) porPedido.set(x.p.id, []); porPedido.get(x.p.id).push(x.ev); });
  let ja;
  try { ja = new Set((await consulta("select id from sorelly.chat_msg where id = any($1)", [lista.map((x) => x.ev.aviso.aid)])).rows.map((r) => r.id)); }
  catch (e) {   // chat fora do ar: nada é desfeito; todos os avisos ficam pendentes para "Tentar de novo"
    console.warn("[compras-chat] chat indisponível: " + (e && e.message));
    for (const [pid, evs] of porPedido) { const p = alvo.find((x) => x.id === pid); out[pid] = { vinculo: p.solicitanteId != null, entregues: [], pendentes: evs.map((ev) => ev.aviso.aid), erro: "Chat indisponível" }; }
    return out;
  }
  for (const [pid, evs] of porPedido) {
    const p = alvo.find((x) => x.id === pid), sol = await cidDaPessoa(p.solicitanteId), r = { vinculo: !!sol, entregues: [], pendentes: [] };
    out[pid] = r;
    const falta = evs.filter((ev) => !ja.has(ev.aviso.aid));
    evs.filter((ev) => ja.has(ev.aviso.aid)).forEach((ev) => r.entregues.push(ev.aviso.aid));
    if (!falta.length) continue;
    if (!sol) { falta.forEach((ev) => r.pendentes.push(ev.aviso.aid)); continue; }   // sem vínculo: o aviso fica no pedido, sinalizado
    try {
      const quem = await Promise.all([...new Set(evs.map((ev) => ev.aviso.porId).filter((x) => x != null))].map(cidDaPessoa));
      await garantirConv(p, [sol, ...quem]);
      for (const ev of falta) {
        const t = Date.parse(String(ev.em).replace(" ", "T")) || Date.now();
        // avisos pessoais ANTES do grupo: se falharem, o aviso fica pendente e tenta de novo (o id fixo evita duplicar)
        for (const pid2 of (ev.aviso.pessoas || [])) {
          const cidP = await cidDaPessoa(pid2); if (!cidP) continue;
          const convP = await garantirConvPessoal(cidP);
          const dP = { id: ev.aviso.aid + "_" + cidP, de: "sistema", t, tipo: "sistema", aviso: true, texto: ev.aviso.texto, compra: { id: p.id, titulo: p.titulo }, status: "lido", reacoes: {}, mencoes: [] };
          await consulta("insert into sorelly.chat_msg (id, conv, de, t, dados) values ($1, $2, 'sistema', $3, $4) on conflict (id) do nothing", [dP.id, convP, t, dP]);
        }
        const dados = { id: ev.aviso.aid, de: "sistema", t, tipo: "sistema", aviso: true, texto: ev.aviso.texto, compra: { id: p.id, titulo: p.titulo }, status: "lido", reacoes: {}, mencoes: [] };
        await consulta("insert into sorelly.chat_msg (id, conv, de, t, dados) values ($1, $2, 'sistema', $3, $4) on conflict (id) do nothing", [dados.id, convDoPedido(p.id), t, dados]);
        r.entregues.push(ev.aviso.aid);
      }
    } catch (e) {
      console.warn("[compras-chat] aviso do pedido " + pid + " não entregue: " + (e && e.message));
      falta.forEach((ev) => { if (!r.entregues.includes(ev.aviso.aid)) r.pendentes.push(ev.aviso.aid); });
    }
  }
  return out;
}

// mensagens da conversa do pedido (avisos + mensagens de pessoas), com o nome de quem escreveu
export async function mensagensDoPedido(id) {
  const r = await consulta("select dados from sorelly.chat_msg where conv = $1 order by t limit 500", [convDoPedido(id)]);
  const conv = (await consulta("select membros from sorelly.chat_conv where id = $1", [convDoPedido(id)])).rows[0];
  return { membros: conv ? conv.membros.map((c) => ({ cid: c, nome: contato(c).nome })) : [],
    msgs: r.rows.map((x) => x.dados).filter((m) => m.apag !== "todos").map((m) => ({ id: m.id, de: m.de, nome: m.de === "sistema" ? "Aviso automático" : contato(m.de).nome, t: m.t, texto: m.texto || "", aviso: !!m.aviso, tipo: m.tipo })) };
}

// mensagem escrita na Conversa do pedido: vai para o grupo do pedido com o autor real. Quem escreve entra no grupo, junto com o solicitante.
export async function escreverNoPedido(p, eu, texto, msgId) {
  const cid = contatoDaConta(eu);
  if (!cid) throw Object.assign(new Error("Sua conta ainda não está ligada a uma pessoa do chat. Fale com a Diretoria."), { statusCode: 400 });
  const sol = await cidDaPessoa(p.solicitanteId);
  await garantirConv(p, [sol, cid]);
  const t = Date.now(), dados = { id: msgId, de: cid, t, tipo: "texto", texto, resp: null, enc: false, dec: null, status: "enviado", reacoes: {}, mencoes: [], compra: { id: p.id, titulo: p.titulo } };
  await consulta("insert into sorelly.chat_msg (id, conv, de, t, dados) values ($1, $2, $3, $4, $5) on conflict (id) do nothing", [msgId, convDoPedido(p.id), cid, t, dados]);
  return { entregueAoSolicitante: !!sol };
}
