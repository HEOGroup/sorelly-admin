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
const agoraBR = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" }).format(new Date()).replace(" ", "T");
const hojeBR = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// TODOS os produtos da DevMaster (com e sem foto), sem limite de data (18/11/2026; 19/11/2026: passou a trazer também os sem foto, para a bipagem achar qualquer código): peças antigas que o sistema já controla e ganharam foto lá não eram vistas, porque a leitura normal só olha os últimos 120 dias. Cache de 10 minutos.
async function codigosComFoto() {
  const c = (G.__sorellyFotosDmTodos = G.__sorellyFotosDmTodos || {});
  if (c.mapa && Date.now() - c.em < 10 * 60 * 1000) return c.mapa;
  const linhas = await todasAsPaginas("dmaaa", { campos: ["aaa_codigo", "aaa_descricao", "aaa_datacadastro", "aaa_foto"] });
  const mapa = new Map();   // código -> { dia, desc, foto }
  linhas.forEach((x) => { const cod = String(x.aaa_codigo || "").trim().toUpperCase(); if (cod) mapa.set(cod, { dia: String(x.aaa_datacadastro || "").slice(0, 10), desc: String(x.aaa_descricao || "").trim(), foto: !!String(x.aaa_foto || "").trim() }); });
  c.mapa = mapa; c.em = Date.now();
  return mapa;
}

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

// Mesma regra da ação dm_sync da tela: código que não existe entra com a data de cadastro; foto já na DevMaster marca Foto, Editada e Sistema como "dm" (a Ana coloca a foto lá depois de editar).
// Só grava as chaves que mudaram, com trava de versão (não pisa em quem está marcando uma etapa na tela ao mesmo tempo).
// gravar:false = só simula (conta o que mudaria, sem gravar nada). antigas:true = também olha as peças com mais de 120 dias (leitura pesada de uns 30 mil produtos; roda à parte, a cada 30 minutos, em /api/automatico/fotos-dm?antigas=1).
export async function sincronizarFotosDm({ dias = 120, gravar = true, antigas = false } = {}) {
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
      if (!c.dia) { c.dia = it.dia; alterou = true; }
      if (it.desc && !c.desc) { c.desc = String(it.desc).slice(0, 140); alterou = true; }
      if (it.foto && !c.subEm) { if (!c.dmFoto) c.dmFoto = agoraBR(); if (!c.fotoEm) c.fotoEm = "dm"; if (!c.edEm) c.edEm = "dm"; c.subEm = "dm"; if (c.esp) delete c.esp; alterou = true; subiram++; }   // o Castilho tira a foto, a Ana edita e coloca na DevMaster: só então o sistema enxerga a foto
      if (alterou) mudou[chave] = c;
    }
    // peças antigas (fora dos 120 dias) que o sistema já controla e já têm foto na DevMaster: marca Foto, Editada e Sistema como "dm". A data da foto é a do cadastro (antiga), então NÃO entra na meta da semana.
    let antigasMarcadas = 0, espPuladas = 0, comFotoMapa = null;
    if (antigas) {
      const comFoto = comFotoMapa = await codigosComFoto();
      for (const k of Object.keys(atual)) {
        if (k.indexOf("c_") !== 0) continue;
        const cod = k.slice(2);
        const info = comFoto.get(cod);
        if (!info || !info.foto) continue;
        const existente = mudou[k] || atual[k];
        if (!existente || typeof existente !== "object" || existente.subEm) continue;
        if (existente.esp) { espPuladas++; continue; }   // peça que a equipe marcou de propósito (Diversas, Aguardando, Repetido...): não mexe
        const c = JSON.parse(JSON.stringify(existente)), dia = info.dia;
        if (!c.dmFoto) c.dmFoto = (/^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : "2000-01-01") + "T00:00:00";
        if (!c.fotoEm) c.fotoEm = "dm";
        if (!c.edEm) c.edEm = "dm";
        c.subEm = "dm"; if (c.esp) delete c.esp;
        mudou[k] = c; antigasMarcadas++;
      }
    }
    // 19/11/2026 (Marcus): o sistema tem que conhecer TODOS os códigos da DevMaster. Peça antiga que não estava na lista entra aqui (a bipagem dava "Código não encontrado", ex.: CL2450J). Com foto na DevMaster: já entra como Sistema feito, com a data do cadastro (não conta na meta). Sem foto: entra pendente.
    let antigasNovas = 0;
    if (antigas) {
      for (const [cod, info] of comFotoMapa) {
        if (!/^[A-Z0-9]{2,12}$/.test(cod) || !/[0-9]/.test(cod)) continue;
        const k = "c_" + cod;
        if (mudou[k] || (atual[k] && typeof atual[k] === "object")) continue;
        const dia = /^d{4}-d{2}-d{2}$/.test(info.dia) && info.dia <= hoje ? info.dia : "2000-01-01";
        const c = { cod, dia, por: "DevMaster" };
        if (info.desc) c.desc = info.desc.slice(0, 140);
        if (info.foto) { c.dmFoto = dia + "T00:00:00"; c.fotoEm = "dm"; c.edEm = "dm"; c.subEm = "dm"; }
        mudou[k] = c; antigasNovas++;
      }
    }
    if (!gravar) return { novos, subiram, antigasMarcadas, antigasNovas, espPuladas, lidos: dm.itens.length, simulacao: true };
    // a hora da leitura vai junto (m.dmEm): é o "Última atualização" da tela. Sem nada novo, só regrava se a última hora tem mais de 4 minutos.
    const agora = agoraBR(), ultima = String(((atual.m || {}).dmEm) || "");
    if (!Object.keys(mudou).length && ultima && Date.now() - Date.parse(ultima + "-03:00") < 4 * 60 * 1000) return { novos: 0, subiram: 0, antigasMarcadas: 0, lidos: dm.itens.length };
    const u = await consulta("update sorelly.estado_modulo set conteudo = jsonb_set(conteudo || $1::jsonb, '{m,dmEm}', to_jsonb($3::text), true), versao = versao + 1, atualizado_por = 'automatico', atualizado_em = now() where modulo = 'fc' and versao = $2", [JSON.stringify(mudou), r.rows[0].versao, agora]);
    if (u.rowCount) return { novos, subiram, antigasMarcadas, antigasNovas, lidos: dm.itens.length };
  }
  return { novos: 0, subiram: 0, motivo: "Outra pessoa gravou ao mesmo tempo; tenta de novo na próxima." };
}

// Diário da leitura (18/11/2026): grava em m.dmTentativa a hora de cada tentativa do agendador e em m.dmErro o motivo, se falhou (vazio = deu certo). NÃO muda a versão do módulo (as telas não precisam receber isto); serve para saber, olhando o banco, se a rotina está rodando.
export async function registrarTentativa(erro) {
  try {
    await consulta("update sorelly.estado_modulo set conteudo = jsonb_set(jsonb_set(conteudo, '{m,dmTentativa}', to_jsonb($1::text), true), '{m,dmErro}', to_jsonb($2::text), true) where modulo = 'fc'", [agoraBR(), String(erro || "").slice(0, 300)]);
  } catch (e) { /* o diário nunca derruba a leitura */ }
}

// relógio do servidor: lê a DevMaster a cada 5 minutos (idempotente)
export function agendarFotosDm() {
  if (G.__sorellyFotosDmAgendado) return;
  G.__sorellyFotosDmAgendado = true;
  const rodar = async () => { try { const r = await sincronizarFotosDm(); if (r.novos || r.subiram || r.antigasMarcadas) console.log("[fotos-dm]", JSON.stringify(r)); } catch (e) { console.error("[fotos-dm] falhou:", e && e.message); } };
  setTimeout(rodar, 30000);
  setInterval(rodar, 5 * 60 * 1000);
}
