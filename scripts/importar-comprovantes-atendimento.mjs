// Importa para o Financeiro familiar os comprovantes que as funcionárias já anexaram no Atendimento interno (Marcus, 19/11/2026).
// Casa o comprovante de cada pagamento Pix do acerto (módulo pag, lf_...) com o Pix de ff.pix: mesma revendedora (nome parecido), mesmo valor, data até 3 dias de diferença.
// SÓ casa par ÚNICO dos dois lados; dúvida vai para "ambíguos" e não é gravada. Nunca apaga nada e nunca troca comprovante que já existe.
//
//   node --env-file=.env.local scripts/importar-comprovantes-atendimento.mjs            → só RELATÓRIO (não grava nada). Mostrar a lista ao Marcus antes de gravar.
//   node --env-file=.env.local scripts/importar-comprovantes-atendimento.mjs --gravar   → grava os casados (imagem em sorelly.anexo_modulo, só a chave no Pix de ff.pix)
//   --tolerancia=N muda os dias de diferença (padrão 3)
// Roda no computador que tem o .env.local com DATABASE_URL (banco REAL). A imagem nunca aparece no relatório.
import { consulta } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
import { garantirTabelaAnexo } from "../src/server/anexos.js";
import { casarComprovantes } from "../src/apps/montagem/domain/comprovantes-importar.js";

const gravar = process.argv.includes("--gravar");
const tolArg = process.argv.find((a) => a.startsWith("--tolerancia=")), tolerancia = tolArg ? Number(tolArg.split("=")[1]) : 3;
const lerModulo = async (m) => { const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = $1", [m]); return r.rowCount ? r.rows[0].conteudo : null; };
const reais = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const br = (iso) => iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4);

const [pag, ff] = await Promise.all([lerModulo("pag"), lerModulo("ff")]);
if (!pag || !ff) { console.error("Módulo pag ou ff não encontrado no servidor."); process.exit(1); }
const r = casarComprovantes(pag, ff, { tolerancia });
const pixPor = Object.fromEntries((ff.pix || []).map((x) => [x.id, x]));
console.log(`Comprovantes de Pix com imagem no Atendimento: ${r.total} (sem imagem/PDF ignorados: ${r.semImagem})`);
console.log(`\nCASADOS (par único) — ${r.casados.length}`);
r.casados.forEach((c) => console.log(`  ${br(c.data)} ${reais(c.valor)}  ${c.rev}  →  Pix ${c.pixId} (${br(pixPor[c.pixId].data)}, ${pixPor[c.pixId].origem})  [${c.arquivo}]`));
console.log(`\nAMBÍGUOS (não grava) — ${r.ambiguos.length}`);
r.ambiguos.forEach((c) => console.log(`  ${br(c.data)} ${reais(c.valor)}  ${c.rev}  — ${c.motivo}: ${c.pixIds.join(", ")}`));
console.log(`\nSEM PIX CORRESPONDENTE em ff.pix — ${r.semPix.length} (normal: a maioria dos pagamentos do acerto vai para contas da empresa, não para o Financeiro familiar)`);
if (!gravar) { console.log("\nRELATÓRIO apenas. Nada foi gravado. Para gravar os casados: acrescente --gravar (depois do OK do Marcus)."); process.exit(0); }

await garantirTabelaAnexo();
const chaveNova = () => "an_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
const marcas = {};
for (const c of r.casados) {
  const [k, pos] = c.ref.split("#"), [i, j] = pos.split(".").map(Number), comp = pag[k].linhas[i].partes[j].comprovante;
  const key = chaveNova(), mime = comp.url.slice(5, comp.url.indexOf(";"));
  await consulta("insert into sorelly.anexo_modulo (id, modulo, nome, mime, url, tamanho, por) values ($1, 'ff', $2, $3, $4, $5, 'importação do Atendimento') on conflict (id) do nothing", [key, String(comp.nome || "comprovante").slice(0, 120), mime, comp.url, comp.url.length]);
  marcas[c.pixId] = { key, nome: String(comp.nome || "").slice(0, 120), tipo: mime };
}
await gravarModulo("ff", {}, "patch", "importação de comprovantes", (guardado, novo) => {   // dentro da transação, em cima do que está guardado agora; só preenche Pix SEM comprovante
  const pix = (guardado.pix || []).map((x) => (marcas[x.id] && !x.compKey) ? Object.assign({}, x, { compKey: marcas[x.id].key, compNome: marcas[x.id].nome, compTipo: marcas[x.id].tipo }) : x);
  return Object.assign({}, novo, { pix });
});
console.log(`\nGRAVADO: ${Object.keys(marcas).length} comprovante(s) anexados aos Pix do Financeiro familiar.`);
process.exit(0);
