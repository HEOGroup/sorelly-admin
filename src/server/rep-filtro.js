// CONTA DE REPRESENTANTE (17/11/2026, Marcus: a representante entra no Admin normal e vê SÓ o que é dela).
// A conta ganha o código do vendedor (sorelly.conta.rep_cod, ex.: "9S"). Para essa conta o servidor:
//  - só abre os módulos de MODULOS_REP (permissoes.js);
//  - devolve rpo e rpf FILTRADOS por esta função (listagens, kits e acertos dela; nada das outras representantes);
//  - recusa gravação em /api/estado e recusa toda rota fora de ROTAS_REP (http.js).
// Chave de cada módulo por item (ver docs/app-sorelly/INTEGRACAO-APP-REPRESENTANTE.md): l_/lx_ = listagem, k_/kx_/ke_/en_/eb_ = kit, a_/ax_/ar_ = acerto.
import { consulta } from "./db.js";
import { garantirTabela, versaoItens } from "./estado-itens.js";

export const MODULOS_REP = ["rpo", "rpf", "inicio", "rc", "pag", "comis"];   // pag = pedidos de conta (Direcionar Pix): só os dos kits dela (src/server/rep-pag.js)
export const ROTAS_REP = ["/api/estado", "/api/auth/eu", "/api/saude", "/api/representante", "/api/perfil/eu"];   // /api/perfil/eu = a própria representante troca a foto dela (23/11/2026)   // /api/representante/* (revendedoras, condicionais, eu): cada rota confere o código dela (23/11/2026)
export const rotaPermitidaRep = (caminho) => ROTAS_REP.some((p) => caminho === p || caminho.startsWith(p + "/"));

const sem = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const cacheNome = (globalThis.__sorellyRepNome = globalThis.__sorellyRepNome || new Map());
// nome que as telas usam para o código (o do Agendamento: "Vanessa"); registros antigos só têm o nome, não o código
export async function nomeDaRep(cod) {
  const c = cacheNome.get(cod);
  if (c && Date.now() - c.em < 60000) return c.nome;
  const r = await consulta("select conteudo->'config'->'representantes' as reps from sorelly.estado_modulo where modulo = 'agend'");
  const lista = (r.rows[0] && r.rows[0].reps) || [];
  const x = lista.find((y) => y && String(y.codigo || "").trim().toUpperCase() === String(cod).toUpperCase());
  const nome = x ? String(x.nome || "") : "";
  cacheNome.set(cod, { nome, em: Date.now() });
  return nome;
}

// {modulo, versao, conteudo, parcial} só com as chaves da representante. Mesmo formato de respostaItens (estado-itens.js).
export async function respostaItensRep(modulo, desde, repCod) {
  if (!MODULOS_REP.includes(modulo) || (modulo !== "rpo" && modulo !== "rpf")) return { modulo, versao: 0, conteudo: {}, parcial: false };
  await garantirTabela();
  const cods = [].concat(repCod).map(String).filter(Boolean);   // conta com mais de um cadastro (Thalita: BI, CU, CV): vê o que é de qualquer um deles
  const nomes = (await Promise.all(cods.map((c) => nomeDaRep(c)))).map(sem).filter(Boolean);
  const v = await versaoItens(modulo);
  const parcial = desde !== undefined && desde > 0 && desde <= v;
  const seq = "($3::bigint is null or seq > $3::bigint or atualizado_em > now() - interval '1 minute')";   // $3 vazio = leitura completa
  const meu = `(valor->>'repCod' = any($1::text[]) or (coalesce(valor->>'repCod', '') = '' and cardinality($2::text[]) > 0 and lower(valor->>'rep') = any($2::text[])))`;
  const ids = (pref) => `(select substr(chave, ${pref.length + 1}) from sorelly.estado_item where modulo = $4 and left(chave, ${pref.length}) = '${pref}' and ${meu})`;
  const filtro = modulo === "rpo"
    ? `(left(chave,2)='l_' and substr(chave,3) in ${ids("l_")}) or (left(chave,3)='lx_' and substr(chave,4) in ${ids("l_")})
       or (left(chave,2)='k_' and substr(chave,3) in ${ids("k_")}) or (left(chave,3) in ('kx_','ke_','en_','eb_') and substr(chave,4) in ${ids("k_")})
       or (left(chave,3) in ('pa_','pr_','pd_') and valor->>'repCod' = any($1::text[]))`
    : `(left(chave,2)='a_' and substr(chave,3) in ${ids("a_")}) or (left(chave,3) in ('ax_','ar_') and substr(chave,4) in ${ids("a_")})
       or (left(chave,3) in ('km_','gv_') and valor->>'repCod' = any($1::text[]))`;
  const params = [cods, nomes, parcial ? desde : null, modulo];
  const lapides = modulo === "rpo" ? "left(chave,2) in ('l_','k_')" : "left(chave,2) = 'a_'";   // lápide não tem dono escrito: desce só a marca {_apagado}, sem dado nenhum
  const r = await consulta(`select chave, case when valor->>'_apagado' = 'true' then '{"_apagado":true}'::jsonb else valor end as valor, seq from sorelly.estado_item where modulo = $4 and ${seq} and ((${filtro}) or (valor->>'_apagado' = 'true' and ${lapides}))`, params);
  const conteudo = {}; let versao = desde || 0;
  // Mais de um cadastro: a tela dela compara o NOME ("Thalita Torazzi") para achar listagem, atendimento e kit dela. Os de CU e CV vêm com o nome do cadastro deles ("Thalita - SC"),
  // então entregam para ela com o nome principal (só na resposta; o banco não muda aqui). Sem isso o servidor mandava e a tela escondia.
  const nomePrincipal = cods.length > 1 ? await nomeDaRep(cods[0]) : "";
  r.rows.forEach((l) => {
    let v = l.valor;
    if (nomePrincipal && v && typeof v === "object" && typeof v.rep === "string" && v.rep && v.rep !== nomePrincipal) v = Object.assign({}, v, { rep: nomePrincipal });
    conteudo[l.chave] = v; versao = Math.max(versao, Number(l.seq));
  });
  if (parcial && !r.rows.length) return { modulo, versao: Math.max(v, desde), igual: true };
  return { modulo, versao: Math.max(versao, v), conteudo, parcial };
}

// COMISSÕES para a conta de representante (23/11/2026): só a configuração geral (percentual padrão, datas, corte, gasolina, valores fixos) e o que é DELA
// (o percentual dela, o km e os pagamentos lançados para ela). Nunca o percentual nem o pagamento de outra representante.
const GERAIS_COMIS = ["pctPadrao", "ciclos", "corteHora", "corteDias", "kitNovo", "kitNovoExpo", "reposicao", "exigirProm", "kmPorLitro", "fixoV", "v2", "gasolinaPR", "gasolina", "termos"];
export async function respostaComisRep(desde, repCod) {
  const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'comis'");
  const l = r.rows[0], versao = l ? Number(l.versao) : 0;
  if (desde !== undefined && versao > 0 && versao === desde) return { modulo: "comis", versao, igual: true };
  const c = (l && l.conteudo) || {}, conteudo = {};
  const nomes = (await Promise.all([].concat(repCod).map((x) => nomeDaRep(String(x))))).filter(Boolean);   // todos os cadastros dela
  GERAIS_COMIS.forEach((k) => { if (c[k] !== undefined) conteudo[k] = c[k]; });
  conteudo.reps = (Array.isArray(c.reps) ? c.reps : []).filter((x) => x && nomes.includes(x.nome));
  conteudo.fech = {}; Object.keys(c.fech || {}).forEach((k) => { if (nomes.some((n) => k.endsWith("|" + n))) conteudo.fech[k] = c.fech[k]; });
  return { modulo: "comis", versao, conteudo };
}
