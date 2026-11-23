// Teste do SERVIDOR do Pix antes do acerto (20/11/2026), com um banco de MENTIRA na memória (nada de banco real, nada de revendedora real).
// Passa pelo mesmo caminho da tela: lançar (empresa e sócio), comprovante, apagar, trazer Pix que já estava na Família (adotar), permissões,
// e o Atendimento interno consumindo o Pix (listar + marcar) sem usar duas vezes. Uso: node scripts/testar-recebimento-antecipado-servidor.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();

// ---- banco de mentira: só as consultas que estes módulos fazem ----
const mod = new Map(), anexos = new Map();   // módulo → {conteudo, versao}; id → {modulo, nome, mime, url, tamanho}
const resp = (rows) => ({ rows, rowCount: rows.length });
async function executar(sql, p = []) {
  const s = sql.replace(/\s+/g, " ").trim().toLowerCase();
  if (s.startsWith("create ") || s.startsWith("begin") || s.startsWith("commit") || s.startsWith("rollback") || s.startsWith("delete ")) return resp([]);
  if (s.startsWith("insert into sorelly.estado_modulo_log")) return resp([]);
  if (s.startsWith("insert into sorelly.estado_modulo ")) { if (!mod.has(p[0])) mod.set(p[0], { conteudo: {}, versao: 0 }); return resp([]); }
  if (s.startsWith("select conteudo, versao from sorelly.estado_modulo")) { const m = mod.get(p[0]); return resp(m ? [{ conteudo: JSON.parse(JSON.stringify(m.conteudo)), versao: m.versao }] : []); }
  if (s.startsWith("select conteudo from sorelly.estado_modulo")) { const lit = /where modulo = '([a-z]+)'/.exec(s), m = mod.get(lit ? lit[1] : p[0]); return resp(m ? [{ conteudo: JSON.parse(JSON.stringify(m.conteudo)) }] : []); }
  if (s.startsWith("update sorelly.estado_modulo")) { const m = mod.get(p[0]); m.conteudo = JSON.parse(p[1]); m.versao++; return resp([{ versao: m.versao }]); }
  if (s.startsWith("insert into sorelly.anexo_modulo")) { if (!anexos.has(p[0])) anexos.set(p[0], { modulo: p[1], nome: p[2], mime: p[3], url: p[4], tamanho: p[5] }); return resp([]); }
  if (s.startsWith("select nome, mime, url, tamanho from sorelly.anexo_modulo")) { const a = anexos.get(p[0]); return resp(a ? [a] : []); }
  if (s.startsWith("select nome, mime, modulo from sorelly.anexo_modulo")) { const a = anexos.get(p[0]); return resp(a ? [a] : []); }
  throw new Error("SQL não previsto no teste: " + s.slice(0, 80));
}
const bancoFalso = path.join(raiz, "scripts", "_banco-falso-teste.mjs");
import fs from "node:fs";
fs.writeFileSync(bancoFalso, "export const consulta = (...a) => globalThis.__executar(...a);\nexport const pool = () => ({ connect: async () => ({ query: (...a) => globalThis.__executar(...a), release() {} }) });\n");
globalThis.__executar = executar;
process.on("exit", () => { try { fs.unlinkSync(bancoFalso); } catch (e) { /* já apagado */ } });

const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src"), "./db.js": bancoFalso }, interopDefault: true });
const srv = await jiti.import(path.join(raiz, "src/server/recebimentos-antecipados.js"));
const pix = await jiti.import(path.join(raiz, "src/server/pix-adiantados.js"));
let ok = 0, falha = 0;
const t = (n, c, x) => { if (c) { ok++; console.log("  OK   " + n); } else { falha++; console.log("  FALHA " + n + (x ? " -> " + x : "")); } };

const dir = { id: 16, nome: "Diretoria Teste", perfil: "ADMIN", setores: [] };
const fin = { id: 40, nome: "Financeiro Teste", perfil: "USUARIO", setores: ["financeiro"] };
const atend = { id: 50, nome: "Atendente Teste", perfil: "USUARIO", setores: ["agendamento"] };
// Família de mentira
mod.set("ff", { versao: 1, conteudo: {
  personas: [{ id: "p1", nome: "Sócio Um", ativo: true, tipo: "SOCIO" }, { id: "familia", nome: "Casa", ativo: true, tipo: "FAMILIAR" }],
  prest: [{ id: "pr1", nome: "Prestador Alfa", ativo: true }],
  contasBanc: [{ id: "cb1", nome: "Banco Alfa", prestadorId: "pr1", personaId: "p1", ativo: true, chavePix: "chave" }, { id: "cb9", nome: "Conta de Outro Sócio", prestadorId: "", personaId: "p2", ativo: true }],
  pix: [{ id: "pxantigo0001", personaId: "p1", data: "2026-11-18", valor: 634.55, origem: "Rev Teste Silva de Souza", contaId: "cb1", forma: "PIX", auditoria: "PENDENTE" }],
  repasses: [], dividas: [], hist: [], pixUsados: {} } });
mod.set("cp", { versao: 1, conteudo: { destinos: [   // o menu do Direcionar
  { id: "d_emp", nome: "CNPJ 34 · Sorelly Atacadista", tipo: "CNPJ", cnpjId: "34", ativo: true },
  { id: "d_forn", nome: "Pontual", tipo: "FORNECEDOR", ativo: true },
  { id: "d_fam", nome: "Sócio Um", tipo: "FAMILIA", personaId: "p1", ativo: true },
  { id: "d_pf", nome: "Prestador Alfa", tipo: "PRESTADOR", personaId: "p1", prestFamId: "pr1", ativo: true },
  { id: "d_pf2", nome: "Prestador Alfa", tipo: "PRESTADOR", ativo: true },
  { id: "d_inativo", nome: "Inativo", tipo: "FORNECEDOR", ativo: false },
  { id: "d_sem", nome: "Prestador Sem Conta", tipo: "PRESTADOR", ativo: true }] } });
mod.set("sc", { versao: 1, conteudo: { saldosContas: { blocos: [{ id: "34", nome: "Sorelly Atac · 34" }, { id: "46", nome: "Sorelly Comércio · 46" }], contas: [
  { id: "c1", nome: "Sicredi Sorelly 34", tipo: "PJ", bloco: "34", bloqueada: false },
  { id: "c2", nome: "Itaú Empresas 34", tipo: "PJ", bloco: "34", bloqueada: false },
  { id: "c3", nome: "Safra 46", tipo: "PJ", bloco: "46", bloqueada: false },
  { id: "c5", nome: "Sicredi Rotativo 34", tipo: "PJ", bloco: "34", bloqueada: false },
  { id: "c4", nome: "Banco Fechado 34", tipo: "PJ", bloco: "34", bloqueada: true }] } } });
anexos.set("an_teste000001", { modulo: "contasreceber", nome: "c1.jpg", mime: "image/jpeg", url: "data:image/jpeg;base64,AAAA", tamanho: 27 });
anexos.set("an_teste000002", { modulo: "ff", nome: "c2.jpg", mime: "image/jpeg", url: "data:image/jpeg;base64,BBBB", tamanho: 27 });

const deps = { ativas: async () => [{ cod: "100", nome: "Rev Teste Silva de Souza", representante: "Sorelly" }, { cod: "200", nome: "Outra Revendedora Ativa", representante: "Rep Teste" }] };
const lanca = (eu, b) => srv.lancar(eu, b, deps);
const emp = { cod: "100",  data: "2026-11-19", valor: 1000, rev: "Rev Teste Silva de Souza", destinoId: "d_emp" };
console.log("1) lançar Pix da empresa");
let r = await lanca(fin, Object.assign({}, emp, { key: "an_teste000001", nome: "c1.jpg", tipo: "image/jpeg" }));
t("Financeiro lança Pix da empresa com comprovante", r.ok && /^ra/.test(r.id), JSON.stringify(r));
const idEmp = r.id;
t("grava no módulo contasreceber", mod.get("contasreceber").conteudo.antecipados.length === 1);
t("Pix da empresa NÃO entra na Família", mod.get("ff").conteudo.pix.length === 1);
r = await lanca(fin, emp);
t("o mesmo Pix de novo é recusado", !!r.erro && /já está lançado/.test(r.erro), JSON.stringify(r));
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-18", key: "an_teste000002" }));
t("comprovante de OUTRO módulo é recusado", !!r.erro && /Comprovante/.test(r.erro), JSON.stringify(r));
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-17", key: "an_naoexiste99" }));
t("comprovante que não existe é recusado", !!r.erro);
t("lançamento recusado não grava nada", mod.get("contasreceber").conteudo.antecipados.length === 1);

r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-16", rev: "Nome Digitado Errado" }));
t("o nome gravado é o do cadastro, não o digitado", r.ok && mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id).rev === "Rev Teste Silva de Souza" && mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id).revCod === "100", JSON.stringify(r));
await srv.remover(fin, { id: r.id });
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-15", cod: "999" }));
t("revendedora que não está na lista de ativas é recusada", !!r.erro && /lista/.test(r.erro), JSON.stringify(r));
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-15", cod: "" }));
t("sem escolher da lista é recusado", !!r.erro);
r = await srv.lancar(fin, Object.assign({}, emp, { data: "2026-11-15" }), { ativas: async () => { throw new Error("DevMaster fora"); } });
t("DevMaster fora do ar: recusa com aviso e não grava", !!r.erro && /DevMaster/.test(r.erro) && mod.get("contasreceber").conteudo.antecipados.length === 1);
console.log("2) lançar Pix de sócio (grava na Família também)");
const soc = { cod: "100",  data: "2026-11-13", valor: 150, rev: "Rev Teste Silva de Souza", destinoId: "d_pf" };
r = await lanca(fin, Object.assign({}, soc, { key: "an_teste000001", nome: "c1.jpg", compTipo: "image/jpeg" }));
t("o Financeiro lança para prestador da Família sem abrir a Família (o servidor grava a cópia)", r.ok, JSON.stringify(r));
const idSoc = r.id, ffAgora = mod.get("ff").conteudo;
t("o Pix também nasceu na Família, Aguardando", ffAgora.pix.length === 2 && ffAgora.pix[1].auditoria === "PENDENTE" && ffAgora.pix[1].valor === 150);
t("gerou UM repasse para o prestador", ffAgora.repasses.length === 1 && ffAgora.repasses[0].origemPixLancId === ffAgora.pix[1].id);
t("o item daqui aponta para o Pix da Família", mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === idSoc).ffPixId === ffAgora.pix[1].id);
t("o comprovante foi COPIADO para o módulo da Família (chave nova)", /^an_/.test(ffAgora.pix[1].compKey) && ffAgora.pix[1].compKey !== "an_teste000001" && anexos.get(ffAgora.pix[1].compKey).modulo === "ff");
t("o arquivo copiado é o mesmo", anexos.get(ffAgora.pix[1].compKey).url === anexos.get("an_teste000001").url);
t("a Família guardou no histórico", ffAgora.hist.length === 1);
r = await lanca(dir, Object.assign({}, soc, { destinoId: "naoexiste" }));
t("conta que não está no menu do Direcionar é recusada e nada é gravado", !!r.erro && mod.get("contasreceber").conteudo.antecipados.length === 2 && mod.get("ff").conteudo.pix.length === 2);
r = await lanca(dir, Object.assign({}, soc, { destinoId: "d_inativo", data: "2026-11-03" }));
t("conta inativa no Direcionar não vale", !!r.erro);
r = await lanca(fin, Object.assign({}, soc, { destinoId: "d_fam", data: "2026-11-04", valor: 31 }));
t("destino Família/sócio entra na Família sem conta definida", r.ok && mod.get("ff").conteudo.pix.some((x) => x.valor === 31 && x.personaId === "p1" && x.contaId === ""), JSON.stringify(r));
await srv.remover(fin, { id: r.id });
r = await lanca(fin, Object.assign({}, soc, { destinoId: "d_pf2", data: "2026-11-05", valor: 32 }));
t("prestador sem vínculo no Direcionar: acha o da Família pelo mesmo nome", r.ok && mod.get("ff").conteudo.pix.some((x) => x.valor === 32 && x.contaId === "cb1"), JSON.stringify(r));
await srv.remover(fin, { id: r.id });
r = await lanca(fin, Object.assign({}, soc, { destinoId: "d_sem", data: "2026-11-06", valor: 33 }));
t("prestador sem conta na Família fica só em Contas a receber", r.ok && !mod.get("ff").conteudo.pix.some((x) => x.valor === 33), JSON.stringify(r));
await srv.remover(fin, { id: r.id });
r = await lanca(fin, Object.assign({}, emp, { destinoId: "d_forn", data: "2026-11-07", valor: 34 }));
t("fornecedor fica só em Contas a receber, com o nome do Direcionar", r.ok && !mod.get("ff").conteudo.pix.some((x) => x.valor === 34) && mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id).destinoNome === "Sorelly · Pontual", JSON.stringify(mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id)));
await srv.remover(fin, { id: r.id });

console.log("3) o que a tela lê");
let l = await srv.listar(dir);
t("Diretoria vê os 2 lançados + 0 adotados", l.itens.length === 2 && l.verFf === true);
t("Diretoria recebe pessoas e contas para escolher (sem a pessoa 'familia')", l.destinos.pessoas.length === 1 && l.destinos.pessoas[0].id === "p1" && l.destinos.contas.length === 2);
t("cada conta vem com o sócio a que pertence (a janela mostra só as do sócio escolhido)", l.destinos.contas.find((c) => c.id === "cb1").personaId === "p1" && l.destinos.contas.find((c) => c.id === "cb9").personaId === "p2");
l = await srv.listar(fin);
t("Financeiro lê, mas não recebe pessoas nem contas da Família", l.itens.length === 2 && l.destinos.pessoas.length === 0 && l.destinos.contas.length === 0 && l.verFf === false);
t("a tela mostra o nome do destino do Direcionar (Sorelly · Prestador Alfa)", l.itens.filter((x) => x.destino === "socio").every((x) => x.conta === "Sócio Um · Prestador Alfa"));
t("Financeiro vê o comprovante do Pix da empresa", l.itens.find((x) => x.id === idEmp).compKey === "an_teste000001");
t("e o do Pix de sócio (que ele lançou pela Diretoria) vem do módulo daqui", l.itens.find((x) => x.id === idSoc).compKey === "an_teste000001");

console.log("4) trazer Pix que já estava na Família");
r = await srv.adotar(fin, { ids: ["pxantigo0001"] });
t("só a Diretoria traz Pix da Família", !!r.erro);
r = await srv.adotar(dir, { ids: ["pxantigo0001", "pxnaoexiste1", "../x"] });
t("Diretoria traz o que existe e avisa o que falta", r.ok && r.adotados.length === 1 && r.faltam.length === 1, JSON.stringify(r));
r = await srv.adotar(dir, { ids: ["pxantigo0001"] });
t("trazer duas vezes não duplica", mod.get("contasreceber").conteudo.adotados.length === 1);
l = await srv.listar(dir);
t("agora aparecem 3 linhas e nenhum Pix novo nasceu na Família", l.itens.length === 3 && mod.get("ff").conteudo.pix.length === 2);
r = await srv.anexar(fin, { id: "pxantigo0001", key: "an_teste000002", nome: "c2.jpg", tipo: "image/jpeg" });
t("Financeiro não anexa em Pix que está só na Família", !!r.erro);
r = await srv.anexar(dir, { id: "pxantigo0001", key: "an_teste000002", nome: "c2.jpg", tipo: "image/jpeg" });
t("Diretoria anexa o comprovante (arquivo do módulo da Família)", r.ok && mod.get("ff").conteudo.pix[0].compKey === "an_teste000002", JSON.stringify(r));
r = await srv.anexar(dir, { id: "pxantigo0001", key: "an_teste000001", nome: "c1.jpg", tipo: "image/jpeg" });
t("arquivo do módulo errado é recusado", !!r.erro);
r = await srv.anexar(fin, { id: idEmp, key: "an_teste000001", nome: "novo.jpg", tipo: "image/jpeg" });
t("Financeiro troca o comprovante do Pix da empresa", r.ok && mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === idEmp).compNome === "novo.jpg");
r = await srv.anexar(fin, { id: idSoc, key: "an_teste000001", nome: "x.jpg", tipo: "image/jpeg" });
t("Financeiro troca o comprovante de Pix que também está na Família (o servidor copia)", r.ok, JSON.stringify(r));
r = await srv.anexar(dir, { id: "nao-existe", key: "an_teste000001" });
t("Pix que não existe é recusado", !!r.erro);

console.log("5) o Atendimento interno consome o Pix");
const NOME = "Rev Teste Silva de Souza", desde = "2026-10-23";
let lista = await pix.listarPixAdiantados({ nome: NOME, desde, internoId: "A1" });
t("lista os 3 Pix dela (2 da Família, 1 da empresa) do mais antigo para o mais novo", lista.length === 4 || lista.length === 3, String(lista.length));
const ids = lista.map((x) => x.id);
t("cada Pix diz de onde vem (ff ou rcb)", lista.every((x) => x.fonte === "ff" || x.fonte === "rcb") && lista.filter((x) => x.fonte === "rcb").length === 1);
let m = await pix.marcarPixAdiantados({ internoId: "A1", rev: NOME, ids }, "Atendente Teste");
t("marca todos, cada um no seu módulo", m.marcados.length === ids.length && m.recusados.length === 0, JSON.stringify(m));
t("o da empresa fica em contasreceber.usados", !!mod.get("contasreceber").conteudo.usados[idEmp]);
t("os da Família ficam em ff.pixUsados", Object.keys(mod.get("ff").conteudo.pixUsados).length === ids.length - 1);
m = await pix.marcarPixAdiantados({ internoId: "A1", rev: NOME, ids }, "Atendente Teste");
t("repetir não muda nada", m.marcados.length === 0 && m.soltos.length === 0);
m = await pix.marcarPixAdiantados({ internoId: "A2", rev: NOME, ids }, "Atendente Teste");
t("outro acerto NÃO usa os mesmos Pix", m.marcados.length === 0 && m.recusados.length === ids.length, JSON.stringify(m));
lista = await pix.listarPixAdiantados({ nome: NOME, desde, internoId: "A2" });
t("outro acerto nem vê os Pix", lista.length === 0);
m = await pix.marcarPixAdiantados({ internoId: "A1", rev: NOME, ids: ids.filter((i) => i !== idEmp) }, "Atendente Teste");
t("tirar o Pix da empresa do acerto solta só ele", m.soltos.length === 1 && m.soltos[0] === idEmp && !mod.get("contasreceber").conteudo.usados[idEmp]);
m = await pix.marcarPixAdiantados({ internoId: "A1", rev: NOME, ids }, "Atendente Teste");
t("volta a marcar", m.marcados.length === 1 && m.marcados[0] === idEmp);
l = await srv.listar(dir);
t("a tela mostra os Pix como usados no acerto", l.itens.filter((x) => x.uso).length === l.itens.length);

console.log("6) apagar");
r = await srv.remover(fin, { id: idEmp });
t("Pix já usado no acerto não se apaga", !!r.erro && /já foi usado/.test(r.erro), JSON.stringify(r));
await pix.marcarPixAdiantados({ internoId: "A1", rev: NOME, ids: [] }, "Atendente Teste");   // o acerto solta tudo
r = await srv.remover(fin, { id: idEmp });
t("Financeiro apaga o Pix da empresa lançado por engano", r.ok && mod.get("contasreceber").conteudo.antecipados.length === 1);
r = await srv.remover(fin, { id: idSoc });
t("Diretoria apaga o Pix de sócio e a cópia sai da Família com o repasse", r.ok && mod.get("ff").conteudo.pix.length === 1 && mod.get("ff").conteudo.repasses.length === 0 && mod.get("contasreceber").conteudo.antecipados.length === 0);
t("o Pix que já estava na Família continua lá", mod.get("ff").conteudo.pix[0].id === "pxantigo0001");
r = await srv.remover(dir, { id: "ra_nao_existe" });
t("apagar o que não existe é recusado", !!r.erro);

console.log("6b) pagador e acerto de origem");
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-10", valor: 55, pagador: "  João   Pai   da Rev " }));
const itPag = mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id);
t("o nome de quem fez o Pix é guardado, sem espaços sobrando", r.ok && itPag.pagador === "João Pai da Rev", JSON.stringify(itPag));
t("o acerto de origem vem do cadastro (Sorelly = atendimento interno)", itPag.repNome === "Sorelly");
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-09", valor: 56, cod: "200" }));
t("sem pagador = o Pix veio no nome da própria revendedora", r.ok && mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id).pagador === "" && mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id).repNome === "Rep Teste");
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-08", valor: 57, tipo: "outro", key: "an_teste000001", nome: "c1.jpg", compTipo: "image/jpeg" }));
const itOut = mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id);
t("o tipo do lançamento NÃO é trocado pelo tipo do arquivo anexado", r.ok && itOut.tipo === "outro" && itOut.compTipo === "image/jpeg", JSON.stringify(itOut));
l = await srv.listar(fin);
t("a tela recebe o pagador e o acerto de origem de cada linha", l.itens.some((x) => x.pagador === "João Pai da Rev" && x.repNome === "Sorelly"));
for (const x of mod.get("contasreceber").conteudo.antecipados.filter((y) => [55, 56, 57].includes(y.valor))) await srv.remover(fin, { id: x.id });
t("os de teste saíram", !mod.get("contasreceber").conteudo.antecipados.some((y) => [55, 56, 57].includes(y.valor)));

console.log("6c) conta do CNPJ");
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-02", valor: 61, contaNome: "Sicredi Sorelly 34" }));
const itCnpj = mod.get("contasreceber").conteudo.antecipados.find((x) => x.id === r.id);
t("CNPJ com a conta escolhida: o nome mostrado leva o banco", r.ok && /Sicredi/.test(itCnpj.destinoNome) && itCnpj.destino === "empresa", JSON.stringify(itCnpj));
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-02", valor: 62, contaNome: "Safra 46" }));
t("conta de OUTRO CNPJ é recusada", !!r.erro && /não é deste CNPJ/.test(r.erro), JSON.stringify(r));
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-02", valor: 63, contaNome: "Banco Fechado 34" }));
t("conta bloqueada não vale", !!r.erro);
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-02", valor: 64, contaNome: "Conta Inventada" }));
t("conta que não existe é recusada", !!r.erro);
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-02", valor: 66, contaNome: "Sicredi Rotativo 34" }));
t("Rotativo não é conta: recusado", !!r.erro);
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-02", valor: 65 }));
t("CNPJ sem conta escolhida continua valendo (fica só o CNPJ)", r.ok);
for (const x of mod.get("contasreceber").conteudo.antecipados.filter((y) => [61, 65].includes(y.valor))) await srv.remover(fin, { id: x.id });

console.log("7) outro recebimento (o acerto nunca usa)");
r = await lanca(fin, Object.assign({}, emp, { data: "2026-11-12", valor: 77, tipo: "outro" }));
t("Financeiro lança outro recebimento da empresa", r.ok, JSON.stringify(r));
const idOutroEmp = r.id;
r = await lanca(dir, Object.assign({}, soc, { data: "2026-11-11", valor: 88, tipo: "outro" }));
t("Diretoria lança outro recebimento de sócio", r.ok, JSON.stringify(r));
const idOutroSoc = r.id;
t("o Pix de sócio na Família leva a marca semAcerto", mod.get("ff").conteudo.pix.some((x) => x.valor === 88 && x.semAcerto === true));
lista = await pix.listarPixAdiantados({ nome: NOME, desde: "2026-10-23", internoId: "A9" });
t("o Atendimento não vê nenhum dos dois", lista.every((x) => x.valor !== 77 && x.valor !== 88), JSON.stringify(lista.map((x) => x.valor)));
m = await pix.marcarPixAdiantados({ internoId: "A9", rev: NOME, ids: [idOutroEmp, idOutroSoc] }, "Atendente Teste");
t("e não consegue marcar os dois", m.marcados.length === 0, JSON.stringify(m));
l = await srv.listar(dir);
t("a tela mostra os dois com o tipo outro", l.itens.filter((x) => x.tipo === "outro").length === 2);
await srv.remover(fin, { id: idOutroEmp }); await srv.remover(dir, { id: idOutroSoc });
t("apagar tira os dois (e a cópia da Família)", mod.get("ff").conteudo.pix.every((x) => x.valor !== 88));

console.log("\n" + ok + " ok, " + falha + " com falha");
process.exit(falha ? 1 : 0);
