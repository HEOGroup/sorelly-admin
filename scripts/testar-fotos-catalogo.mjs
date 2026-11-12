// Teste das Fotos de catálogo (Marketing, 10/11/2026): lançar códigos, etapas em ordem, desfazer, lote, resumos e tempos.
// Roda o reducer de verdade, sem navegador e sem servidor. Uso: node scripts/testar-fotos-catalogo.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
const F = await jiti.import("@/apps/montagem/domain/fotos-catalogo");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const FC = (s, a) => reducer(s, Object.assign({type:"FC", por:"Teste"}, a));
const hoje = F.hojeSP();

const base = inicial();
t("estado nasce com s.fc", !!base.fc && Array.isArray(base.fc.codigos));
const antigos = base.fc.codigos.filter(c => !c.dia);
if(antigos.length){   // só existe no PC com o arquivo local da planilha
  t("traz todos os códigos da planilha antiga (mais de 17 mil)", antigos.length>17000, String(antigos.length));
  t("planilha antiga: nenhum código repetido", new Set(antigos.map(c=>c.cod)).size===antigos.length);
  t("planilha antiga: status vêm da planilha", ["Na DevMaster","Sem foto"].every(x => antigos.some(c => F.statusDe(c)===x)) && antigos.every(c => F.STATUS.includes(F.statusDe(c))));
  t("planilha antiga: poucos códigos de início desconhecido (Outras, hoje 38)", F.linhasFotos(base.fc).filter(l=>!l.dia && l.cat==="Outras").length<60, JSON.stringify([...new Set(F.linhasFotos(base.fc).filter(l=>!l.dia&&l.cat==="Outras").map(l=>l.cod))].slice(0,8)));
  const mig = F.fcMigrar(JSON.parse(JSON.stringify(base.fc)));
  t("trazer de novo não duplica", mig.codigos.length===base.fc.codigos.length);
  const sem = F.fcMigrar({v:1, codigos:[{cod:"BB9999", dia:"2026-11-10"}]});
  t("estado do servidor antigo recebe os códigos da planilha", sem.codigos.length===base.fc.codigos.length+1 && sem.semeado===true);
}
let s = Object.assign({}, base, {fc:{v:1, categorias:[], historico:[], codigos:[], semeado:true}});   // a partir daqui, estado limpo
t("categoria pelo início do código", F.categoriaDe("BB1620")==="Brincos Select" && F.categoriaDe("CL2456C")==="Colares" && F.categoriaDe("2B0001")==="Brinco Duo" && F.categoriaDe("A2057")==="Anéis" && F.categoriaDe("AA0073")==="Collection AA" && F.categoriaDe("ZZ1")==="Outras");

s = FC(s, {op:"cod_add", texto:"BB1620\ncl2551, P2210 BB1620 xx"});
t("lança 3 códigos (repetido e inválido ignorados)", s.fc.codigos.length===3, JSON.stringify(s.fc.codigos.map(c=>c.cod)));
t("data do cadastro é hoje", s.fc.codigos.every(c=>c.dia===hoje));
t("status começa em Sem foto", s.fc.codigos.every(c=>F.statusDe(c)==="Sem foto"));
const antes = s.fc.codigos.length; s = FC(s, {op:"cod_add", texto:"BB1620"});
t("código repetido é recusado", s.fc.codigos.length===antes);

let r = FC(s, {op:"etapa", cod:"BB1620", etapa:"ed"});
t("não edita sem foto", r.fc.codigos.find(c=>c.cod==="BB1620").edEm==="");
r = FC(s, {op:"etapa", cod:"BB1620", etapa:"sub"});
t("não sobe sem editar", r.fc.codigos.find(c=>c.cod==="BB1620").subEm==="");

s = FC(s, {op:"etapa", cod:"BB1620", etapa:"foto"});
let c = s.fc.codigos.find(x=>x.cod==="BB1620");
t("foto grava quem e quando", c.fotoQuem==="Teste" && /^\d{4}-\d{2}-\d{2}T/.test(c.fotoEm) && F.statusDe(c)==="Fotografada");
s = FC(s, {op:"etapa", cod:"BB1620", etapa:"ed"}); s = FC(s, {op:"etapa", cod:"BB1620", etapa:"sub"});
c = s.fc.codigos.find(x=>x.cod==="BB1620");
t("edição e DevMaster em ordem", F.statusDe(c)==="Na DevMaster" && c.edQuem==="Teste" && c.subQuem==="Teste");

s = FC(s, {op:"desfazer", cod:"BB1620"});
c = s.fc.codigos.find(x=>x.cod==="BB1620");
t("desfazer tira só a última etapa", F.statusDe(c)==="Editada" && c.subEm==="" && !!c.edEm);

r = FC(s, {op:"cod_del", cod:"BB1620"});
t("não exclui código que já tem foto", r.fc.codigos.some(x=>x.cod==="BB1620"));
s = FC(s, {op:"cod_del", cod:"P2210"});
t("exclui código sem foto", !s.fc.codigos.some(x=>x.cod==="P2210"));

s = FC(s, {op:"cod_add", texto:"BB1700 BB1701 BB1702"});
s = FC(s, {op:"etapa_lote", etapa:"foto", texto:"BB1700 BB1701 NAOEXISTE9 BB1620"});
t("lote marca só quem estava pronto", F.statusDe(s.fc.codigos.find(x=>x.cod==="BB1700"))==="Fotografada" && F.statusDe(s.fc.codigos.find(x=>x.cod==="BB1702"))==="Sem foto");
r = FC(s, {op:"etapa_lote", etapa:"sub", texto:"BB1702"});
t("lote respeita a ordem das etapas", F.statusDe(r.fc.codigos.find(x=>x.cod==="BB1702"))==="Sem foto");

const h = F.resumoHoje(s.fc, hoje);
t("resumo de hoje", h.cadastrados===5 && h.fotografados===3 && h.semFoto===2 && h.faltaEditar===2 && h.faltaSubir===1, JSON.stringify(h));
const linhas = F.linhasFotos(s.fc);
t("linhas da planilha trazem texto de data e status", linhas.length===5 && linhas.every(l=>l.diaTxt && l.status), JSON.stringify(linhas[0]));
const d = F.resumoDoDia(s.fc, hoje);
t("resumo do dia (linha de grupo)", d.cadastrados===5 && d.fotografados===3 && d.editados===1 && d.naDevmaster===0, JSON.stringify(d));

// tempos médios: dados montados à mão
const f2 = {codigos:[{cod:"X1", dia:"2026-11-10", fotoEm:"2026-11-10T09:00:00", edEm:"2026-11-10T10:30:00", subEm:"2026-11-10T11:00:00"}, {cod:"X2", dia:"2026-11-10", fotoEm:"2026-11-10T09:00:00", edEm:"2026-11-10T09:30:00", subEm:""}]};
const tm = F.temposMedios(f2);
t("tempo da foto à edição = média (90 e 30 min)", tm.aEdicao==="1 h", tm.aEdicao);
t("tempo da edição à DevMaster = 30 min", tm.aDevmaster==="30 min", tm.aDevmaster);
t("duração em horas, dias e vazio", F.duracao(135)==="2 h 15 min" && F.duracao(null)==="—" && F.duracao(60*30)==="1 dia e 6 h");

const prod = F.producaoDias({historico:[{dia:"2026-11-09", fotos:47, editadas:30, sistema:28}], codigos:[]}, 5);
t("produção usa o histórico da planilha", prod.length===1 && prod[0].fotos===47);

// DevMaster: código novo entra sozinho; foto colocada lá (pela Ana, depois de editar) marca o Sistema
let z = Object.assign({}, base, {fc:{v:1, categorias:[], historico:[], codigos:[{cod:"BB1700", dia:hoje}], semeado:true}});
z = reducer(z, {type:"FC", op:"dm_sync", por:"DevMaster", itens:[{id:1, cod:"BB1700", dia:hoje, foto:true}, {id:2, cod:"CL2763", dia:hoje, foto:false}, {id:3, cod:"B5221", dia:hoje, foto:true}, {id:4, cod:"x", dia:hoje, foto:true}]});
t("DevMaster: 2 códigos novos entram (o inválido não)", z.fc.codigos.length===3, JSON.stringify(z.fc.codigos.map(c=>c.cod)));
t("DevMaster: foto colocada lá marca o Sistema (código que já existia)", F.statusDe(z.fc.codigos.find(c=>c.cod==="BB1700"))==="Na DevMaster");
t("DevMaster: código novo sem foto fica Sem foto", F.statusDe(z.fc.codigos.find(c=>c.cod==="CL2763"))==="Sem foto");
t("DevMaster: código novo já com foto vai direto para o Sistema", F.statusDe(z.fc.codigos.find(c=>c.cod==="B5221"))==="Na DevMaster");
const antesZ = JSON.stringify(z.fc.codigos);
z = reducer(z, {type:"FC", op:"dm_sync", por:"DevMaster", itens:[{id:1, cod:"BB1700", dia:hoje, foto:true}, {id:2, cod:"CL2763", dia:hoje, foto:false}]});
t("DevMaster: ler de novo não duplica nem muda nada", JSON.stringify(z.fc.codigos)===antesZ);
z = reducer(z, {type:"FC", op:"dm_sync", por:"DevMaster", itens:[{id:2, cod:"CL2763", dia:hoje, foto:true}]});
t("DevMaster: foto que chegou depois marca o Sistema", F.statusDe(z.fc.codigos.find(c=>c.cod==="CL2763"))==="Na DevMaster");
t("DevMaster: o que vem de lá aparece sem data (célula em branco)", F.linhasFotos(z.fc).find(l=>l.cod==="CL2763").subEm==="");

// meta de fotos: foto marcada na tela ou que apareceu na DevMaster depois do início conta no dia dela
const M = {id:"t", nome:"Teste", ini:"2026-11-10", fim:"2026-11-13", alvo:4, bonus:250};
const fm = {codigos:[{cod:"A1", dia:"2026-11-09", fotoEm:"2026-11-10T09:00:00"}, {cod:"A2", dia:"2026-11-09", fotoEm:"dm", dmFoto:"2026-11-11T10:00:00"}, {cod:"A3", dia:"2026-11-09", fotoEm:"ant"}, {cod:"A4", dia:"2026-11-09", fotoEm:"2026-11-09T09:00:00"}, {cod:"A5", dia:"2026-11-09", fotoEm:"2026-11-11T09:00:00", dmFoto:"2026-11-12T09:00:00"}]};
const mp = F.metaProgresso(fm, M, "2026-11-11");
t("meta: conta marcada e DevMaster com data dentro do período (A1, A2, A5)", mp.feitas===3 && mp.falta===1, JSON.stringify(mp));
t("meta: foto antiga e fora do período não contam", mp.linhas.find(l=>l.dia==="2026-11-10").fotos===1 && mp.linhas.find(l=>l.dia==="2026-11-11").fotos===2);
t("meta: ritmo por dia e situação", mp.restam===3 && mp.porDia===1 && mp.situacao==="Em andamento" && F.metaProgresso(fm, Object.assign({}, M, {alvo:3}), "2026-11-11").situacao==="Batida" && F.metaProgresso(fm, M, "2026-11-14").situacao==="Não batida");
const fv = {codigos:[{cod:"V1", dia:"2026-10-20", fotoEm:"dm", dmFoto:"2026-11-11T08:00:00"}, {cod:"V2", fotoEm:"dm", dmFoto:"2026-11-11T08:00:00"}, {cod:"V3", dia:"2026-11-05", fotoEm:"dm", dmFoto:"2026-11-11T08:00:00"}]};
t("meta: foto nova na DevMaster conta de qualquer mês (peça de outubro, sem data ou de novembro)", F.metaProgresso(fv, M, "2026-11-11").feitas===3);
t("meta: foto vista na DevMaster antes da hora de corte não conta", F.metaProgresso(fv, Object.assign({}, M, {dmDesde:"2026-11-11T07:00:00"}), "2026-11-11").feitas===3 && F.metaProgresso(fv, Object.assign({}, M, {dmDesde:"2026-11-11T08:00:01"}), "2026-11-11").feitas===0);
let w = Object.assign({}, base, {fc:{v:1, categorias:[], historico:[], codigos:[{cod:"BB1900", dia:hoje}], semeado:true}});
w = reducer(w, {type:"FC", op:"dm_sync", por:"DevMaster", itens:[{id:9, cod:"BB1900", desc:"BRINCO TESTE", dia:hoje, foto:true}]});
const cw = w.fc.codigos.find(c=>c.cod==="BB1900");
t("DevMaster: foto nova grava o dia (dmFoto) e a descrição", /^\d{4}-\d{2}-\d{2}T/.test(cw.dmFoto) && cw.desc==="BRINCO TESTE", JSON.stringify(cw));

let q = Object.assign({}, base, {fc:{v:1, categorias:[], historico:[], codigos:[{cod:"BB1950", dia:"2026-10-05"}], semeado:true}});
q = FC(q, {op:"tem", cod:"BB1950", valor:"sim"});
t("tem a peça: grava quem e quando", q.fc.codigos[0].tem==="sim" && q.fc.codigos[0].temPor==="Teste" && /^\d{4}-/.test(q.fc.codigos[0].temEm));
q = FC(q, {op:"tem", cod:"BB1950", valor:"nao"});
t("não tem a peça", q.fc.codigos[0].tem==="nao" && F.linhasFotos(q.fc)[0].tem==="nao");
q = FC(q, {op:"tem", cod:"BB1950", valor:""});
t("tirar a marcação", q.fc.codigos[0].tem===undefined && q.fc.codigos[0].temEm===undefined);
// modelo e grade: A2357014 é o código inteiro; A2357 é o modelo e a foto é uma só para todos
let g = Object.assign({}, base, {fc:{v:1, categorias:[], historico:[], semeado:true, codigos:[{cod:"A2357", dia:"2026-11-03", desc:"ANEL SOLITARIO"}, {cod:"A2357013", dia:"2026-11-03", desc:"ANEL SOLITARIO 13"}, {cod:"A2357014", dia:"2026-11-03", desc:"ANEL SOLITARIO 14"}, {cod:"A9999018", dia:"2026-11-04", desc:"ANEL SEM MODELO 18"}, {cod:"A9999019", dia:"2026-11-04", desc:"ANEL SEM MODELO 19"}, {cod:"CL2763", dia:"2026-11-04"}]}});
t("modelo e grade: A2357014 vira o modelo A2357", F.modeloDe("A2357014")==="A2357" && F.modeloDe("BBA0001015")==="BBA0001" && F.modeloDe("A2357")==="A2357" && F.modeloDe("CL2763")==="CL2763" && F.modeloDe("2B0075")==="2B0075");
const lg = F.linhasFotos(g.fc);
t("modelo e grade: 3 linhas (A2357, A9999 sem registro do modelo, CL2763)", lg.length===3 && lg.some(l=>l.cod==="A2357") && lg.some(l=>l.cod==="A9999") && F.resumoGeral(g.fc).total===3, JSON.stringify(lg.map(l=>l.cod)));
t("modelo sem registro ganha a descrição da grade sem o número", lg.find(l=>l.cod==="A9999").desc==="ANEL SEM MODELO");
g = FC(g, {op:"etapa", cod:"A2357", etapa:"foto"});
t("marcar a foto do modelo vale para todas as grades", g.fc.codigos.filter(c=>c.cod.startsWith("A2357")).every(c=>c.fotoEm) && F.linhasFotos(g.fc).find(l=>l.cod==="A2357").fOk===true);
g = FC(g, {op:"desfazer", cod:"A2357"});
t("desfazer volta o modelo e as grades", g.fc.codigos.filter(c=>c.cod.startsWith("A2357")).every(c=>!c.fotoEm));
g = Object.assign({}, g, {fc:Object.assign({}, g.fc, {codigos:g.fc.codigos.map(c=>c.cod==="A2357014" ? Object.assign({}, c, {fotoEm:"dm", edEm:"dm", subEm:"dm"}) : c)})});
t("foto em qualquer grade vale para o modelo (uma foto só)", F.linhasFotos(g.fc).find(l=>l.cod==="A2357").sOk===true);
// marcação em lote (o Castilho marca o que fotografou; grade e modelo valem o mesmo)
let lt = Object.assign({}, base, {fc:{v:1, categorias:[], historico:[], semeado:true, codigos:[{cod:"A2357", dia:"2026-11-03"}, {cod:"A2357013", dia:"2026-11-03"}, {cod:"CL2771", dia:"2026-11-04"}, {cod:"M0802", dia:"2026-11-04"}]}});
lt = FC(lt, {op:"etapa_lote", etapa:"foto", texto:"a2357014 cl2771\nzz9999"});
t("lote: grade marca o modelo e as outras grades; código que não existe é ignorado", lt.fc.codigos.filter(c=>c.cod.startsWith("A2357")).every(c=>c.fotoEm) && !!lt.fc.codigos.find(c=>c.cod==="CL2771").fotoEm && !lt.fc.codigos.find(c=>c.cod==="M0802").fotoEm);
const lr = FC(lt, {op:"etapa_lote", etapa:"ed", texto:"M0802"});
t("lote: editar exige a foto antes", !lr.fc.codigos.find(c=>c.cod==="M0802").edEm);
lt = FC(lt, {op:"etapa_lote", etapa:"ed", texto:"A2357"});
t("lote: editada marca o modelo e as grades que já têm foto", lt.fc.codigos.filter(c=>c.cod.startsWith("A2357")).every(c=>c.edEm));
console.log("\n"+ok+" verificações OK, "+falha+" com falha.");
process.exit(falha ? 1 : 0);
