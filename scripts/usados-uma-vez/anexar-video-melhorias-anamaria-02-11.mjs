// Anexa o vídeo-aula às duas respostas do Marcus para a Anamaria em Melhorias (02/11/2026). O balão mostra o vídeo (campo `video`).
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/anexar-video-melhorias-anamaria-02-11.mjs
import { consulta, pool } from "../../src/server/db.js";
const V = { mvva6zi015c: "/tutoriais/videos/pagas-por-dia.webm", mvvccrablyp: "/tutoriais/videos/excluir-lancamento.webm" };
const atual = (await consulta("select conteudo from sorelly.estado_modulo where modulo='mel'")).rows[0].conteudo;
const novo = {};
Object.keys(V).forEach((id) => { Object.keys(atual).filter((k) => k.startsWith("c_" + id + "_man")).forEach((k) => { novo[k] = Object.assign({}, atual[k], { video: V[id] }); }); });
const r = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_em = now() where modulo='mel' returning versao", [JSON.stringify(novo)]);
console.log("respostas com vídeo:", Object.keys(novo).length, "| versão", r.rows[0].versao);
await pool().end();
