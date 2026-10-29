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

const MODULO = /^[a-z][a-zA-Z0-9_]{0,29}$/;
const nega = () => erro("Você não tem acesso a este módulo.", 403);

// ?desde=<versão que o navegador já tem>: se não mudou, responde só {igual:true} (poupa banda: a consulta roda a cada 20 s)
export const GET = rota(async (req, { eu, params, url }) => {
  const modulo = params.modulo;
  if (!MODULO.test(modulo)) throw invalido("módulo");
  const q = url.searchParams.get("desde");
  if (q !== null && !/^-?\d+$/.test(q)) throw invalido("desde");
  const desde = q === null ? undefined : Number(q);
  if (!podeModulo(eu, modulo)) return nega();
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
  if (eu.perfil !== "ADMIN" && modulo !== "mel" && modulo !== "kn" && modulo !== "agrev") {   // mel e kn: qualquer funcionário pode criar o módulo ao enviar o 1º pedido / 1º kit novo
    const ja = await consulta("select 1 from sorelly.estado_modulo where modulo = $1", [modulo]);
    if (!ja.rowCount) return erro("Este módulo ainda não recebeu a carga inicial. Peça à Diretoria.", 403);
  }
  const r = await consulta(
    `insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ($1, $2::jsonb, 1, $3)
     on conflict (modulo) do update set conteudo = sorelly.estado_modulo.conteudo || excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = excluded.atualizado_por, atualizado_em = now()
     returning versao`,
    [modulo, JSON.stringify(b.chaves), eu.id]);
  return json({ ok: true, versao: r.rows[0].versao });
});
