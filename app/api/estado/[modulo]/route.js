export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Estado dos módulos: cada módulo do sistema (rh, cf, ce...) guarda o seu conteúdo todo como um JSON na tabela sorelly.estado_modulo.
// É o ATALHO combinado com o Leonardo: todo mundo passa a ver os mesmos dados já, e depois cada módulo é desmembrado nas tabelas finais (as 168 do schema sorelly), um por vez.
// O conteúdo de um módulo é um objeto com chaves de primeiro nível (ex.: rh = {config, colaboradores, presenca...}). O PUT manda só as chaves que mudaram e o servidor junta com o que já existe:
// duas pessoas mexendo em chaves diferentes não se atrapalham; na mesma chave vale a última gravação.
// Regras: só abre o módulo quem tem o setor dele (permissoes.js); a PRIMEIRA gravação de um módulo (carga inicial) só a Diretoria faz, para um navegador de funcionário com dados de demonstração nunca subir por cima.
import { json, erro, rota, corpo, invalido } from "@/server/http";
import { consulta } from "@/server/db";
import { podeModulo } from "@/server/permissoes";
import { donoDaChave, ehModuloItens, gravarItens, lerItens, versaoItens } from "@/server/estado-itens";
import { protegerSaldos } from "@/server/trava-saldos";

const MODULO = /^[a-z][a-zA-Z0-9_]{0,29}$/;
const nega = () => erro("Você não tem acesso a este módulo.", 403);

// Módulos "por item" (rpo, rpf: ligação com o app real da representante, src/server/estado-itens.js): uma linha por chave.
// GET ?desde=<versão> devolve só as chaves que mudaram depois (o navegador junta). PUT grava SÓ as chaves do admin (lx_, kx_, ax_);
// as do app (gravadas pelas rotas de serviço) são ignoradas aqui: um navegador com cópia velha nunca apaga o que o app mandou.
async function getItens(modulo, desde) {
  const v = await versaoItens(modulo);
  const parcial = desde !== undefined && desde > 0 && desde <= v;
  const r = await lerItens(modulo, parcial ? desde : undefined);
  if (parcial && r.vazio) return json({ modulo, versao: Math.max(v, desde), igual: true });
  return json({ modulo, versao: Math.max(r.versao, v), conteudo: r.conteudo, parcial });
}
async function putItens(modulo, chaves, eu) {
  const doAdmin = {}, ignoradas = [];
  Object.entries(chaves).forEach(([k, v]) => { if (donoDaChave(k) === "admin") doAdmin[k] = v; else ignoradas.push(k); });
  const versao = Object.keys(doAdmin).length ? await gravarItens(modulo, doAdmin, "admin", eu.id) : await versaoItens(modulo);
  return json({ ok: true, versao, ignoradas });
}

// ?desde=<versão que o navegador já tem>: se não mudou, responde só {igual:true} (poupa banda: a consulta roda a cada 20 s)
export const GET = rota(async (req, { eu, params, url }) => {
  const modulo = params.modulo;
  if (!MODULO.test(modulo)) throw invalido("módulo");
  const q = url.searchParams.get("desde");
  if (q !== null && !/^-?\d+$/.test(q)) throw invalido("desde");
  const desde = q === null ? undefined : Number(q);
  if (!podeModulo(eu, modulo)) return nega();
  if (ehModuloItens(modulo)) return getItens(modulo, desde);
  const v = await consulta("select versao from sorelly.estado_modulo where modulo = $1", [modulo]);
  const versao = v.rows[0] ? v.rows[0].versao : 0;
  if (desde !== undefined && versao > 0 && versao === desde) return json({ modulo, versao, igual: true });
  const r = await consulta("select conteudo, versao, atualizado_em from sorelly.estado_modulo where modulo = $1", [modulo]);
  const l = r.rows[0];
  return json({ modulo, versao: l ? l.versao : 0, conteudo: l ? l.conteudo : {}, atualizadoEm: l ? l.atualizado_em : null });
});

export const PUT = rota(async (req, { eu, params }) => {
  const modulo = params.modulo;
  if (!MODULO.test(modulo)) throw invalido("módulo");
  const b = await corpo(req, 20 * 1024 * 1024);
  if (!b.chaves || typeof b.chaves !== "object" || Array.isArray(b.chaves) || !Object.keys(b.chaves).length) throw invalido("chaves");
  if (!podeModulo(eu, modulo)) return nega();
  if (ehModuloItens(modulo)) return putItens(modulo, b.chaves, eu);
  if (eu.perfil !== "ADMIN" && modulo !== "mel" && modulo !== "kn" && modulo !== "pag" && modulo !== "int" && modulo !== "agrev" && modulo !== "rhsol" && modulo !== "finativ") {   // mel e kn: qualquer funcionário pode criar o módulo ao enviar o 1º pedido / 1º kit novo
    const ja = await consulta("select 1 from sorelly.estado_modulo where modulo = $1", [modulo]);
    if (!ja.rowCount) return erro("Este módulo ainda não recebeu a carga inicial. Peça à Diretoria.", 403);
  }
  // GUARDA TEMPORÁRIA (09/11/2026, Cadastro de peças): uma tela ANTIGA que ficou aberta (sem o cabeçalho x-sorelly-build) ainda roda a correção velha de 03/11 a cada atualização e devolve para "Banho"
  // os pedidos que a Rayssa mudou para "Chegou no banho" (a marca do erro é o statusEm igual à data de chegada). Aqui o servidor desfaz só isso. Pode sair quando todas as telas forem atualizadas (uns dias).
  if (modulo === "cpc" && !req.headers.get("x-sorelly-build") && Array.isArray(b.chaves.pedidos)) {
    const at = await consulta("select conteudo->'pedidos' as p from sorelly.estado_modulo where modulo = 'cpc'");
    const velhos = {};
    ((at.rows[0] && at.rows[0].p) || []).forEach((p) => { velhos[p.id] = p; });
    b.chaves.pedidos = b.chaves.pedidos.map((p) => {
      const o = velhos[p.id];
      return o && o.status === "Chegou no banho" && p.status === "Banho" && p.statusEm && p.statusEm === (p.chegPontual || p.chegEllos) ? { ...p, status: o.status, statusEm: o.statusEm } : p;
    });
  }
  // TRAVA DOS SALDOS (10/11/2026): na sexta 06/11 uma tela que ainda não tinha baixado o servidor gravou o modelo vazio de saldosContas e apagou todos os saldos lançados.
  // Aqui o servidor NUNCA deixa um dia (ou fechamento, aporte, ajuste) que já existe sumir por uma gravação que não o traz: o que faltar no que chegou é devolvido do que já está guardado.
  // O que a tela manda para um dia que ela traz vale (editar um dia, tirar uma conta). Para excluir um dia de propósito a tela grava o dia vazio ({}); telas antigas que apagam a chave não conseguem mais.
  if (modulo === "sc" && b.chaves.saldosContas && typeof b.chaves.saldosContas === "object" && !Array.isArray(b.chaves.saldosContas)) {
    const at = await consulta("select conteudo->'saldosContas' as s from sorelly.estado_modulo where modulo = 'sc'");
    const velho = at.rows[0] && at.rows[0].s;
    const devolvidos = protegerSaldos(velho, b.chaves.saldosContas);
    if (devolvidos) console.warn("[trava sc] gravação de " + eu.id + " não trazia " + devolvidos + " item(ns) de saldo já guardados; devolvidos");
  }
  const r = await consulta(
    `insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ($1, $2::jsonb, 1, $3)
     on conflict (modulo) do update set conteudo = sorelly.estado_modulo.conteudo || excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = excluded.atualizado_por, atualizado_em = now()
     returning versao`,
    [modulo, JSON.stringify(b.chaves), eu.id]);
  return json({ ok: true, versao: r.rows[0].versao });
});
