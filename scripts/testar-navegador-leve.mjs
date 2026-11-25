// Teste do "navegador leve" (25/11/2026, aviso "Sem espaço para salvar neste navegador").
// Confere: (1) todos os acertos de verdade sobem para o banco (antes só os do atendimento interno de 09/11 em diante);
// (2) o navegador NÃO guarda pagamento nem acerto que o banco já confirmou, e GUARDA o que ainda não chegou ou mudou depois.
// Uso: node scripts/testar-navegador-leve.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const S = await jiti.import("@/apps/montagem/lib/sync-modulos");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const img = "data:image/png;base64,"+"A".repeat(50000);
const ac = (id, extra) => Object.assign({ id, origem:"interno", internoId:"i"+id, data:"2026-11-20", assinatura:img }, extra);
const st = {
  acertosConsignado:[ac("1"), ac("2", { data:"2026-10-01" }), ac("3", { origem:"rep", internoId:null }), ac("4", { demo:true })],
  lancFin:[{ id:"L1", linhas:[{ partes:[{ comprovante:{ url:img } }] }] }, { id:"L2", linhas:[] }],
  outra:"fica",
};

console.log("1. Todos os acertos de verdade sobem");
const fa = S.fatiaDoModulo(st, "aci");
t("sobe o do atendimento novo, o antigo (antes de 09/11) e o de representante", !!fa.a_1 && !!fa.a_2 && !!fa.a_3);
t("demonstração não sobe", !fa.a_4);

console.log("2. Navegador guarda só o que o banco ainda não confirmou");
const j = (x) => JSON.stringify(x);
const snaps = { aci:{ a_1:j(st.acertosConsignado[0]), a_2:j(Object.assign({}, st.acertosConsignado[1], { data:"2026-09-30" })) }, pag:{ lf_L1:j(st.lancFin[0]) } };
const leve = S.soNaoConfirmados(st, snaps);
t("acerto já no banco (igual) sai do navegador", !leve.acertosConsignado.some((x) => x.id==="1"));
t("acerto mudado depois (diferente do banco) fica no navegador", leve.acertosConsignado.some((x) => x.id==="2"));
t("acerto que ainda não chegou ao banco fica no navegador", leve.acertosConsignado.some((x) => x.id==="3"));
t("demonstração (não sobe) fica no navegador", leve.acertosConsignado.some((x) => x.id==="4"));
t("pagamento com foto já no banco sai do navegador", !leve.lancFin.some((x) => x.id==="L1"));
t("pagamento ainda não enviado fica", leve.lancFin.some((x) => x.id==="L2"));
t("o resto do estado não muda e o original não é alterado", leve.outra==="fica" && st.acertosConsignado.length===4 && st.lancFin.length===2);
t("sem nada confirmado (sem internet / sem login): guarda tudo", S.soNaoConfirmados(st, {})===st);
const antes = j(st).length, depois = j(leve).length;
t("o que vai para o navegador encolhe (fotos e assinaturas do banco saem)", depois<antes*0.7, antes+" → "+depois);

console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
