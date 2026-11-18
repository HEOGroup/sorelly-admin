// Link de conferência do fornecedor (Lucas, 18/11/2026): página PÚBLICA, só leitura, sem login.
// O link é /f/<código> (acerto de uma data de pagamento) ou /f/cartao/<código> (listagem da Maquininha Banho de um mês).
// O código fica em pf.tokensAcerto (gerado ao abrir "Enviar acerto ao fornecedor"); sem o código certo, nada abre.
// A página mostra só o fechamento daquela data (ou as passadas daquele mês): nenhuma outra informação do sistema.
import { consulta } from "@/server/db";
import { gravarModulo } from "@/server/estado-modulo";
import { diff } from "@/apps/montagem/lib/estado-patch";
import { garantirTabelaAnexo } from "@/server/anexos";
import { htmlExtrato } from "@/apps/montagem/lib/pf-extrato-html";
import { htmlListagemMq } from "@/apps/montagem/pages/pf/mq-extrato";
import { lancDaJanela } from "@/apps/montagem/domain/pf";

const CODIGO_OK = /^[a-z0-9]{6,40}$/;

async function lerPf() {
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'pf'");
  return r.rowCount ? r.rows[0].conteudo : null;
}
// chave do token: "fornId|AAAA-MM-DD" (acerto) ou "mq|fornId|AAAA-MM|maquininha" (cartão)
const CHAVE_OK = /^(\d{1,6}\|\d{4}-\d{2}-\d{2}|mq\|\d{1,6}\|\d{4}-\d{2}\|[^"\\]{0,80})$/;
// Até 18/11/2026 a TELA gerava o código: duas telas abertas geravam dois códigos para a mesma data e o segundo apagava o primeiro (o link já enviado parava de abrir).
// Por isso um código que não está mais em pf.tokensAcerto é procurado no histórico de gravações: link enviado continua valendo para sempre.
async function chaveDoCodigo(pf, codigo) {
  if (!pf || !CODIGO_OK.test(codigo)) return null;
  const t = pf.tokensAcerto || {}, atual = Object.keys(t).find((k) => t[k] === codigo);
  if (atual) return atual;
  const r = await consulta("select dados from sorelly.estado_modulo_log where modulo = $1 and dados::text like $2 order by id desc limit 1", ["pf", "%" + codigo + "%"]);
  const o = r.rowCount && r.rows[0].dados && r.rows[0].dados.tokensAcerto;
  const mapa = o && (o.$o || o.$set || o);
  if (!mapa || typeof mapa !== "object") return null;
  return Object.keys(mapa).find((k) => { const v = mapa[k]; return v === codigo || (v && v.$set === codigo); }) || null;
}
// Código do link: criado SÓ AQUI, no servidor, uma vez por data (e nunca trocado). A tela pede por /api/pf/link.
export async function codigoDoLink(chave, por) {
  if (!CHAVE_OK.test(String(chave || ""))) return null;
  const pf = await lerPf(); if (!pf) return null;
  const antes = pf.tokensAcerto || {};
  if (antes[chave]) return antes[chave];
  const codigo = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
  const depois = Object.assign({}, antes, { [chave]: codigo });
  await gravarModulo("pf", { tokensAcerto: diff(antes, depois) }, "patch", por || "link de conferência");
  return codigo;
}

const PAGINA_ERRO = (titulo, texto) => '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + titulo + '</title>' +
  '<style>body{margin:0;background:#0f1012;color:#f2f2f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;padding:18px;text-align:center}' +
  '.c{max-width:420px;background:#17181c;border:1px solid #2a2c31;border-radius:12px;padding:24px}.e{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ffd633;font-weight:700}h1{font-size:18px;margin:8px 0}p{font-size:14px;opacity:.85;margin:0}</style></head>' +
  '<body><div class="c"><div class="e">Grupo Sorelly</div><h1>' + titulo + '</h1><p>' + texto + '</p></div></body></html>';

// HTML da página do acerto (ou null se o código não existe). origem = "https://..." para o endereço dos comprovantes ficar completo
export async function paginaAcerto(codigo, origem) {
  const pf = await lerPf(), chave = await chaveDoCodigo(pf, codigo);
  if (!chave || chave.indexOf("mq|") === 0) return null;
  const comp = (l) => (l.arqKey || String(l.arqData || "").indexOf("data:") === 0) ? origem + "/f/" + codigo + "/c/" + l.id : "";
  return htmlExtrato(pf, chave, comp);
}
export async function paginaCartao(codigo) {
  const pf = await lerPf(), chave = await chaveDoCodigo(pf, codigo);
  if (!chave || chave.indexOf("mq|") !== 0) return null;
  const p = chave.split("|");   // mq | fornId | mês | maquininha
  return htmlListagemMq(pf, p[2], p.slice(3).join("|"));
}
// comprovante de um Pix do acerto: só abre se o Pix for daquela data
export async function comprovanteAcerto(codigo, id) {
  const pf = await lerPf(), chave = await chaveDoCodigo(pf, codigo);
  if (!chave || chave.indexOf("mq|") === 0) return null;
  const l = lancDaJanela(pf, chave).find((x) => String(x.id) === String(id));
  if (!l) return null;
  let url = String(l.arqData || "").indexOf("data:") === 0 ? l.arqData : "", nome = l.arqNome || "comprovante";
  if (!url && l.arqKey) {
    await garantirTabelaAnexo();
    const r = await consulta("select nome, url from sorelly.anexo_modulo where id = $1 and modulo = 'pf'", [l.arqKey]);
    if (r.rowCount) { url = r.rows[0].url; nome = r.rows[0].nome || nome; }
  }
  const m = /^data:([^;,]+);base64,(.*)$/.exec(url);
  if (!m) return null;
  return { mime: m[1], nome, dados: Buffer.from(m[2], "base64") };
}
export { PAGINA_ERRO };
