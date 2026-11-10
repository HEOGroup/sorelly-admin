// Fotos de catálogo × DevMaster (10/11/2026, pedido do Marcus: "todo dia, na hora que entrar código novo que a Rayssa cadastra, atualiza").
// Lê da DevMaster API 2 (SÓ LEITURA) a tabela de produtos dmaaa: código, descrição, data de cadastro e o caminho da foto (aaa_foto: preenchido = a foto já está no sistema DevMaster).
//   produtosRecentes()        lista os produtos dos últimos N dias (cache de 2 minutos; a tela usa pela rota /api/fotos/dm)
//   sincronizarFotosDm()      grava direto no módulo "fc" (um registro por código, c_<código>), SEM depender de tela aberta. Mesma regra da ação dm_sync da tela (domain/fotos-catalogo.js).
//   agendarFotosDm()          relógio do servidor (a cada 5 minutos), ligado em instrumentation.js
// Quem chama também: /api/automatico/fotos-dm (agendador da Vercel ou pessoa logada) e rodarAutomaticoDoDia (automatico-dia.js).
import { consulta } from "./db.js";
import { todasAsPaginas } from "./devmaster2.js";

const TTL = 2 * 60 * 1000;
const G = globalThis;

function inicioDaJanela(dias) {
  const d = new Date(Date.now() - dias * 86400000);
  return d.toISOString().slice(0, 10) + "T00:00:00";
}
const hojeBR = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// produtos cadastrados nos últimos N dias: [{id, cod, desc, dia:"2026-11-09", foto:true|false}]
export async function produtosRecentes({ dias = 60, forcar = false } = {}) {
  const chave = String(dias), c = (G.__sorellyFotosDm = G.__sorellyFotosDm || {});
  if (!forcar && c[chave] && Date.now() - c[chave].em < TTL) return c[chave].dados;
  const linhas = await todasAsPaginas("dmaaa", { campos: ["dm_id", "aaa_codigo", "aaa_descricao", "aaa_datacadastro", "aaa_foto"], filtro: { aaa_datacadastro: { gte: inicioDaJanela(dias) } } });
  const itens = linhas
    .map((x) => ({ id: x.dm_id, cod: String(x.aaa_codigo || "").trim().toUpperCase(), desc: String(x.aaa_descricao || "").trim(), dia: String(x.aaa_datacadastro || "").slice(0, 10), foto: !!String(x.aaa_foto || "").trim() }))
    .filter((x) => x.cod && /^\d{4}-\d{2}-\d{2}$/.test(x.dia));
  const dados = { dias, geradoEm: new Date().toISOString(), itens };
  c[chave] = { em: Date.now(), dados };
  return dados;
}

// Mesma regra da ação dm_sync da tela: código que não existe entra com a data de cadastro; foto já na DevMaster marca Foto, Editada e Sistema como "dm".
// Só grava as chaves que mudaram, com trava de versão (não pisa em quem está marcando uma etapa na tela ao mesmo tempo).
export async function sincronizarFotosDm({ dias = 60 } = {}) {
  const dm = await produtosRecentes({ dias, forcar: true }), hoje = hojeBR();
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'fc'");
    if (!r.rows[0]) return { novos: 0, subiram: 0, motivo: "O módulo das fotos ainda não existe: abra a tela Fotos de catálogo uma vez." };
    const atual = r.rows[0].conteudo || {}, mudou = {};
    let novos = 0, subiram = 0;
    for (const it of dm.itens) {
      if (!/^[A-Z0-9]{2,12}$/.test(it.cod) || !/[0-9]/.test(it.cod) || it.dia > hoje) continue;
      const chave = "c_" + it.cod, existente = mudou[chave] || atual[chave];
      const tem = existente && typeof existente === "object";
      const c = tem ? JSON.parse(JSON.stringify(existente)) : { cod: it.cod, dia: it.dia, por: "DevMaster" };
      let alterou = !tem;
      if (!tem) novos++;
      if (it.foto && !c.subEm) { if (!c.fotoEm) c.fotoEm = "dm"; if (!c.edEm) c.edEm = "dm"; c.subEm = "dm"; if (c.esp) delete c.esp; alterou = true; subiram++; }
      if (alterou) mudou[chave] = c;
    }
    if (!Object.keys(mudou).length) return { novos: 0, subiram: 0, lidos: dm.itens.length };
    const u = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_por = 'automatico', atualizado_em = now() where modulo = 'fc' and versao = $2", [JSON.stringify(mudou), r.rows[0].versao]);
    if (u.rowCount) return { novos, subiram, lidos: dm.itens.length };
  }
  return { novos: 0, subiram: 0, motivo: "Outra pessoa gravou ao mesmo tempo; tenta de novo na próxima." };
}

// relógio do servidor: lê a DevMaster a cada 5 minutos (idempotente)
export function agendarFotosDm() {
  if (G.__sorellyFotosDmAgendado) return;
  G.__sorellyFotosDmAgendado = true;
  const rodar = async () => { try { const r = await sincronizarFotosDm(); if (r.novos || r.subiram) console.log("[fotos-dm]", JSON.stringify(r)); } catch (e) { console.error("[fotos-dm] falhou:", e && e.message); } };
  setTimeout(rodar, 30000);
  setInterval(rodar, 5 * 60 * 1000);
}
