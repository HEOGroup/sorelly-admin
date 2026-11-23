// Pix antes do acerto, lançado em CONTAS A RECEBER (Marcus, 20/11/2026). Regras e formato dos dados: domain/recebimentos-antecipados.js.
// Lugar dos dados: módulo `contasreceber` (Financeiro e Diretoria). O Pix de sócio também nasce no módulo ff (Financeiro familiar, só sócios), por isso quem grava passa por aqui.
// Toda gravação trava o módulo (gravarModulo) e refaz a conta em cima do que está guardado agora: dois lançamentos juntos não se perdem.
import { consulta } from "./db.js";
import { gravarModulo } from "./estado-modulo.js";
import { garantirTabelaAnexo, chaveAnexoValida } from "./anexos.js";
import { podeModulo } from "./permissoes.js";
import { rotuloDestino, rotuloPrestadorFamilia, nomePropio, contaRecebePix } from "../apps/montagem/lib/nome-conta.js";
import { vazio, garantir, validarLancamento, linhasAntecipados, espelharNaFamilia, comprovanteNaFamilia, contasParaLista, contasProprias, resolverDestino, rotuloLeaf } from "../apps/montagem/domain/recebimentos-antecipados.js";

const lerModulo = async (m) => { const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = $1", [m]); return r.rowCount ? r.rows[0].conteudo : null; };
const nomeDe = (eu) => String((eu && (eu.nome || eu.id)) || "");
const hojeIso = () => new Date().toISOString().slice(0, 10);
const chaveNova = () => "an_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);

// copia o arquivo para outro módulo (a Família abre o módulo ff, o Financeiro abre contasreceber): o mesmo comprovante, com chave nova, valendo nos dois lugares
async function copiarAnexo(key, modulo, por) {
  await garantirTabelaAnexo();
  const r = await consulta("select nome, mime, url, tamanho from sorelly.anexo_modulo where id = $1", [key]);
  if (!r.rowCount) throw new Error("Comprovante não encontrado.");
  const novo = chaveNova(), a = r.rows[0];
  await consulta("insert into sorelly.anexo_modulo (id, modulo, nome, mime, url, tamanho, por) values ($1, $2, $3, $4, $5, $6, $7) on conflict (id) do nothing", [novo, modulo, a.nome, a.mime, a.url, a.tamanho, por]);
  return { key: novo, nome: a.nome, tipo: a.mime };
}
// o arquivo existe e foi enviado para o módulo esperado (ninguém aponta o Pix para o arquivo de outro módulo)
async function anexoDoModulo(key, modulo) {
  if (!chaveAnexoValida(key)) return null;
  await garantirTabelaAnexo();
  const r = await consulta("select nome, mime, modulo from sorelly.anexo_modulo where id = $1", [key]);
  return r.rowCount && r.rows[0].modulo === modulo ? r.rows[0] : null;
}

// Tudo que a tela precisa: as linhas e (só para quem abre a Família) as pessoas e contas para escolher o destino.
export async function listar(eu) {
  const verFf = podeModulo(eu, "ff"), [rcb, ff] = await Promise.all([lerModulo("contasreceber"), lerModulo("ff")]);
  const itens = linhasAntecipados(rcb, ff, { verFf });
  const destinos = verFf && ff ? {
    pessoas: (ff.personas || []).filter((p) => p.ativo !== false && p.tipo !== "FAMILIAR" && p.id !== "familia").map((p) => ({ id: p.id, nome: p.nome })),
    contas: contasParaLista((ff.contasBanc || []).filter((c) => c.ativo)),
    proprias: contasProprias(ff),   // contas PF de cada sócio (Nubank, Caixa...): o Pix grava a conta e cai na caixa dela na Família
  } : { pessoas: [], contas: [], proprias: [] };
  return { itens, destinos, verFf };
}

// Lança um Pix antes do acerto. destino "socio": grava também no Financeiro familiar (só quem abre a Família).
// A revendedora SEMPRE vem do sistema (Marcus, 20/11/2026): chega o código (cod) e o servidor confere se é uma revendedora ATIVA da DevMaster; o nome gravado é o do cadastro, nunca o digitado.
// deps.ativas = função que devolve [{cod, nome}] (nos testes, uma lista de mentira; na tela, a lista da DevMaster).
export async function lancar(eu, b, deps) {
  const por = nomeDe(eu);
  // PEDIDO DE PIX (Marcus, 23/11/2026): o Lucas manda a conta à representante ANTES de o Pix existir. Só a conta é obrigatória; revendedora e valor são opcionais e entram depois em "completar".
  const ehPedido = b.tipo === "pedido";
  let ativas = [];
  if (!(ehPedido && !b.cod)) { try { ativas = await ((deps && deps.ativas) || (await import("./revendedoras.js")).revendedorasAtivasBasico)(); } catch (e) { return { erro: "Não consegui ler as revendedoras da DevMaster agora. Tente de novo em um minuto." }; } }
  const rv = (ativas || []).find((x) => String(x.cod) === String(b.cod || ""));
  if (!rv && !(ehPedido && !b.cod)) return { erro: "Escolha a revendedora na lista (só as ativas aparecem)." };
  // a conta que recebeu vem do MESMO menu do Direcionar (cp.destinos): o servidor descobre se fica só aqui (empresa) ou também na Família (sócio ou prestador da família)
  const [cp, ffAtual] = await Promise.all([lerModulo("cp"), lerModulo("ff")]);
  const dCp = ((cp && cp.destinos) || []).find((d) => d.id === String(b.destinoId || "") && d.ativo !== false);
  // conta que existe na aba Chaves Pix (funcionária, fornecedor, representante...) mas não é um destino do Direcionar: entra como recebimento da EMPRESA com o nome dela (Marcus, 23/11/2026: a lista Conta que recebeu vem da aba Chaves Pix)
  const nomeSem = !dCp && b.semDestino === true ? String(b.destinoNome || "").replace(/\s+/g, " ").trim().slice(0, 120) : "", semDest = nomeSem.length >= 2;
  // CNPJ da empresa: a conta (banco) escolhida vem dos blocos de saldos (módulo sc), a mesma lista do Direcionar; o rótulo sai igual ao dele (CNPJ · empresa · banco)
  let contaNome = "";
  if (dCp && dCp.tipo === "CNPJ" && b.contaNome) {
    const scMod = await lerModulo("sc"), sd = (scMod && scMod.saldosContas) || {};
    if (!(sd.contas || []).some((c) => c.bloco === dCp.cnpjId && !c.bloqueada && contaRecebePix(c.nome) && c.nome === String(b.contaNome))) return { erro: "Essa conta não é deste CNPJ. Escolha de novo." };
    contaNome = String(b.contaNome);
  }
  const rd = semDest ? { destino: "empresa", personaId: "", contaId: "", contaTxt: nomeSem, nome: nomeSem } : resolverDestino(dCp, ffAtual, (d, c) => rotuloLeaf(d, (cp && cp.destinos) || [], { rotuloDestino, rotuloPrestadorFamilia, nomePropio }, c || contaNome), String(b.contaId || ""));
  if (rd.erro) return { erro: rd.erro };
  if (ehPedido) {   // pedido: não entra em acerto (valor 0), não vai para a Família e não cruza com nada até ser completado
    const ped = { id: "ra" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), data: hojeIso(), valor: 0, rev: rv ? rv.nome : "", revCod: rv ? String(rv.cod) : "", repNome: rv ? String(rv.representante || "") : "", destino: rd.destino, tipo: "pedido", destinoId: dCp ? dCp.id : "", destinoNome: rd.nome, personaId: "", contaId: "", contaTxt: rd.nome, pagador: "", valorCombinado: Number(b.valorCombinado) > 0 && Number(b.valorCombinado) <= 1000000 ? Math.round(Number(b.valorCombinado) * 100) / 100 : 0, repPediu: String(b.repPediu || "").replace(/\s+/g, " ").trim().slice(0, 80), compKey: "", compNome: "", compTipo: "", ffPixId: "", por, em: new Date().toISOString(), pedidoDest: { destinoId: dCp ? dCp.id : "", semDestino: semDest, destinoNome: nomeSem, leaf: String(b.leaf || "").slice(0, 200), contaNome, contaId: String(b.contaId || ""), casa: String(b.casa || "") } };
    await gravarModulo("contasreceber", {}, "patch", por, (guardado, novo) => { const g = garantir(guardado); return Object.assign({}, novo, { antecipados: g.antecipados.concat([ped]), usados: g.usados, adotados: g.adotados }); });
    return { ok: true, id: ped.id, pedido: true };
  }
  const v = validarLancamento(Object.assign({}, b, { rev: rv.nome, destino: rd.destino, personaId: rd.personaId, contaId: rd.contaId, contaTxt: rd.contaTxt, destinoId: dCp ? dCp.id : "", destinoNome: rd.nome }), hojeIso(), ((await lerModulo("contasreceber")) || {}).antecipados);
  if (v.erro) return { erro: v.erro };
  const item = v.item; item.por = por; item.em = new Date().toISOString(); item.revCod = String(rv.cod);
  item.repNome = String(rv.representante || "");   // quem faz o acerto dela: "Sorelly" = atendimento interno; outro nome = representante
  item.pagador = String(b.pagador || "").replace(/\s+/g, " ").trim().slice(0, 80);   // vazio = o Pix veio no nome da própria revendedora; senão, o nome de quem fez o Pix (ex.: pai dela)
  if (b.key) {   // comprovante já enviado para o módulo contasreceber
    let chave = String(b.key), an = await anexoDoModulo(chave, "contasreceber");
    if (!an && podeModulo(eu, "ff") && (an = await anexoDoModulo(chave, "ff"))) chave = (await copiarAnexo(chave, "contasreceber", por)).key;   // reaproveita um comprovante que já estava guardado na Família
    if (!an) return { erro: "Comprovante não encontrado. Anexe de novo." };
    item.compKey = chave; item.compNome = String(b.nome || an.nome || "").slice(0, 120); item.compTipo = String(b.compTipo || an.mime || "").slice(0, 60);   // compTipo = tipo do ARQUIVO (b.tipo é o tipo do lançamento)
  }
  if (item.destino === "socio") {
    let cp = null; if (item.compKey) cp = await copiarAnexo(item.compKey, "ff", por);
    let falha = null, pixId = "";
    await gravarModulo("ff", {}, "patch", por, (guardado, novo) => {
      const r = espelharNaFamilia(guardado, { personaId: item.personaId, contaId: item.contaId, data: item.data, valor: item.valor, origem: item.rev, por, divida: String(b.divida || "").slice(0, 120), semAcerto: item.tipo === "outro", casa: item.casa, compKey: cp && cp.key, compNome: cp && cp.nome, compTipo: cp && cp.tipo });
      if (r.erro) { falha = r.erro; return novo; }
      pixId = r.pixId;
      return Object.assign({}, novo, r.dividaId ? { pix: r.ff.pix, repasses: r.ff.repasses, dividas: r.ff.dividas, hist: r.ff.hist } : { pix: r.ff.pix, repasses: r.ff.repasses, hist: r.ff.hist });   // só as listas que o Pix mexe (com dívida junto, também a das dívidas)
    });
    if (falha) return { erro: falha };
    item.ffPixId = pixId;
  }
  await gravarModulo("contasreceber", {}, "patch", por, (guardado, novo) => {
    const g = garantir(guardado);
    if (g.antecipados.some((x) => x.id === item.id)) return novo;
    return Object.assign({}, novo, { antecipados: g.antecipados.concat([item]), usados: g.usados, adotados: g.adotados });
  });
  return { ok: true, id: item.id };
}

// COMPLETAR um pedido (Marcus, 23/11/2026): chegou o Pix e o comprovante. Com revendedora, valor e data, o pedido vira um Pix lançado de verdade (a mesma conta que o Lucas escolheu no pedido) e o pedido some.
export async function completar(eu, b, deps) {
  const id = String(b.id || ""), rcb = garantir(await lerModulo("contasreceber")), ped = rcb.antecipados.find((x) => x.id === id && x.tipo === "pedido");
  if (!ped || !ped.pedidoDest) return { erro: "Pedido não encontrado (talvez já tenha sido completado)." };
  const r = await lancar(eu, Object.assign({}, b, { acao: "lancar", tipo: b.tipo === "outro" ? "outro" : "antes", destinoId: ped.pedidoDest.destinoId, semDestino: !!ped.pedidoDest.semDestino, destinoNome: ped.pedidoDest.destinoNome || "", leaf: ped.pedidoDest.leaf || "", contaNome: ped.pedidoDest.contaNome, contaId: ped.pedidoDest.contaId, casa: ped.pedidoDest.casa, key: b.key || ped.compKey || "", nome: b.nome || ped.compNome || "", compTipo: b.compTipo || ped.compTipo || "" }), deps);
  if (r.erro) return r;
  await gravarModulo("contasreceber", {}, "patch", nomeDe(eu), (guardado, novo) => { const g = garantir(guardado); return Object.assign({}, novo, { antecipados: g.antecipados.filter((x) => x.id !== id), usados: g.usados, adotados: g.adotados }); });
  return { ok: true, id: r.id };
}

// Anexa (ou troca) o comprovante de uma linha. fonte "rcb": arquivo no módulo contasreceber; fonte "ff" (Pix que já estava na Família): arquivo no módulo ff, só quem abre a Família.
export async function anexar(eu, b) {
  const por = nomeDe(eu), id = String(b.id || ""), key = String(b.key || "");
  const rcb = garantir(await lerModulo("contasreceber")), item = rcb.antecipados.find((x) => x.id === id);
  if (item) {
    const an = await anexoDoModulo(key, "contasreceber");
    if (!an) return { erro: "Comprovante não encontrado. Anexe de novo." };
    const nome = String(b.nome || an.nome || "").slice(0, 120), tipo = String(b.tipo || an.mime || "").slice(0, 60);
    if (item.destino === "socio" && item.ffPixId) {
      const cp = await copiarAnexo(key, "ff", por); let falha = null;
      await gravarModulo("ff", {}, "patch", por, (guardado, novo) => { const r = comprovanteNaFamilia(guardado, { pixId: item.ffPixId, key: cp.key, nome: cp.nome, tipo: cp.tipo }); if (r.erro) { falha = r.erro; return novo; } return Object.assign({}, novo, { pix: r.ff.pix }); });
      if (falha) return { erro: falha };
    }
    await gravarModulo("contasreceber", {}, "patch", por, (guardado, novo) => {
      const g = garantir(guardado);
      return Object.assign({}, novo, { antecipados: g.antecipados.map((x) => (x.id === id ? Object.assign({}, x, { compKey: key, compNome: nome, compTipo: tipo }) : x)), usados: g.usados, adotados: g.adotados });
    });
    return { ok: true };
  }
  if (!rcb.adotados.includes(id)) return { erro: "Pix não encontrado." };
  if (!podeModulo(eu, "ff")) return { erro: "Esse Pix está no Financeiro familiar: só quem abre a Família anexa o comprovante." };
  if (!(await anexoDoModulo(key, "ff"))) return { erro: "Comprovante não encontrado. Anexe de novo." };
  let falha = null;
  await gravarModulo("ff", {}, "patch", por, (guardado, novo) => { const r = comprovanteNaFamilia(guardado, { pixId: id, key, nome: String(b.nome || "").slice(0, 120), tipo: String(b.tipo || "").slice(0, 60) }); if (r.erro) { falha = r.erro; return novo; } return Object.assign({}, novo, { pix: r.ff.pix }); });
  return falha ? { erro: falha } : { ok: true };
}

// Traz para a Contas a receber Pix que já estavam na Família (ex.: os da Karine). Só a Diretoria. Não cria Pix: só passa a mostrar.
export async function adotar(eu, b) {
  if (eu?.perfil !== "ADMIN") return { erro: "Só a Diretoria traz Pix da Família para cá." };
  const ids = (Array.isArray(b.ids) ? b.ids : []).filter((x) => typeof x === "string" && /^[A-Za-z0-9_-]{3,40}$/.test(x)).slice(0, 50);
  const ff = await lerModulo("ff"), existentes = new Set(((ff && ff.pix) || []).map((x) => x.id));
  const bons = ids.filter((x) => existentes.has(x)), faltam = ids.filter((x) => !existentes.has(x));
  if (!bons.length) return { erro: "Nenhum desses Pix existe no Financeiro familiar.", faltam };
  await gravarModulo("contasreceber", {}, "patch", nomeDe(eu), (guardado, novo) => {
    const g = garantir(guardado), set = new Set(g.adotados);
    bons.forEach((x) => set.add(x));
    return Object.assign({}, novo, { antecipados: g.antecipados, usados: g.usados, adotados: Array.from(set) });
  });
  return { ok: true, adotados: bons, faltam };
}

// Apaga um lançamento feito aqui (engano), enquanto o acerto ainda não usou. Se tem cópia na Família, ela também sai, com o repasse automático.
export async function remover(eu, b) {
  const por = nomeDe(eu), id = String(b.id || "");
  const rcb = garantir(await lerModulo("contasreceber")), item = rcb.antecipados.find((x) => x.id === id);
  if (!item) return { erro: "Pix não encontrado." };
  const ff = await lerModulo("ff");
  const usado = item.destino === "socio" ? ((ff && ff.pixUsados) || {})[item.ffPixId] : rcb.usados[id];
  if (usado) return { erro: "Esse Pix já foi usado no acerto de " + (usado.rev || "uma revendedora") + ". Solte-o no acerto antes de apagar." };
  if (item.destino === "socio" && item.ffPixId) {
    await gravarModulo("ff", {}, "patch", por, (guardado, novo) => {
      if ((guardado.pixUsados || {})[item.ffPixId]) return novo;
      const g = JSON.parse(JSON.stringify(guardado));
      return Object.assign({}, novo, { pix: (g.pix || []).filter((x) => x.id !== item.ffPixId), repasses: (g.repasses || []).filter((r) => r.origemPixLancId !== item.ffPixId) });
    });
  }
  await gravarModulo("contasreceber", {}, "patch", por, (guardado, novo) => { const g = garantir(guardado); return Object.assign({}, novo, { antecipados: g.antecipados.filter((x) => x.id !== id), usados: g.usados, adotados: g.adotados }); });
  return { ok: true };
}

export { vazio };
