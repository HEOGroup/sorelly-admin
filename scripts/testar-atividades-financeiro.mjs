// Teste: Financeiro › Atividades (18/11/2026). Contas da tela com dados INVENTADOS e acesso só do Marcus. Uso: node scripts/testar-atividades-financeiro.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const af = await jiti.import("@/apps/montagem/domain/atividades-fin");
const srv = await jiti.import("@/server/atividades-fin.js");
const { ABAS } = await jiti.import("@/apps/montagem/navigation/abas");
const slugs = await jiti.import("@/apps/montagem/router/slugs");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
t("só o Marcus (16) abre, na tela e no servidor", af.PESSOAS_ATIVIDADES_FIN.join()==="16" && srv.LEITORES_ATIVIDADES_FIN.join()==="16" && srv.podeVerAtividadesFin({pessoaId:16}) && !srv.podeVerAtividadesFin({pessoaId:28}) && !srv.podeVerAtividadesFin({perfil:"ADMIN"}));
t("a aba existe na lista de telas", ABAS.some(a => a[0]==="finativ" && a[1]==="Atividades"));
t("a aba tem endereço", JSON.stringify(slugs).includes("atividades-do-financeiro"));
// dias úteis: quarta 18/11/2026
t("hoje = 0 dias úteis", af.diasUteisDesde("2026-11-18", "2026-11-18")===0);
t("ontem = 1 dia útil", af.diasUteisDesde("2026-11-17", "2026-11-18")===1);
t("sexta vista na segunda = 1 dia útil (fim de semana não conta)", af.diasUteisDesde("2026-11-13", "2026-11-16")===1);
t("terça da semana passada vista na quarta = 6 dias úteis", af.diasUteisDesde("2026-11-10", "2026-11-18")===6);
t("situação: em dia", af.situacaoDe("2026-11-17", "2026-11-18")==="Em dia");
t("situação: parada", af.situacaoDe("2026-11-10", "2026-11-18")==="Parada há 6 dias úteis");
t("situação: sem registro", af.situacaoDe("", "2026-11-18")==="Sem registro no período");
t("situação informativa não acusa atraso", af.situacaoDe("2026-11-01", "2026-11-18", true)==="—");
t("cor da situação", af.corSituacao({sit:"Em dia"})==="text-success" && af.corSituacao({sit:"Parada há 6 dias úteis"})==="text-warning");
// o que foi feito no Sorelly Admin
const ts = (iso) => new Date(iso).getTime();
const s = { dp:{pix:[
    {id:"a", status:"direcionado", confirmadoEm:ts("2026-11-18T10:00:00"), confirmadoPor:"Lucas", valor:100},
    {id:"b", status:"direcionado", confirmadoEm:ts("2026-11-18T15:30:00"), confirmadoPor:"Lucas", valor:50.5},
    {id:"c", status:"fila", valor:999},
    {id:"d", status:"direcionado", confirmadoEm:ts("2026-11-01T10:00:00"), confirmadoPor:"Lucas", valor:1}]},
  cpe:{hist:[{ts:ts("2026-11-18T09:00:00"), por:16, acao:"Deu baixa", valor:300}]},
  ff:{hist:[{em:ts("2026-11-17T08:00:00"), por:16, acao:"Editou dívida", area:"Prestadores"}]},
  saldosContas:{saldos:{"2026-11-17":{c1:10}, "2026-11-18":{c1:""}, "2026-11-10":{c1:5, c2:null}}} };
const ls = af.linhasDoAdmin(s, "2026-11-12");
const pix = ls.find(l => l.tipo==="Pix direcionado");
t("Pix direcionados do dia somados por pessoa", pix && pix.n===2 && pix.valor===150.5 && pix.pessoa==="Lucas" && pix.de==="10:00" && pix.ate==="15:30", JSON.stringify(pix));
t("Pix na fila e Pix fora do período não entram", ls.filter(l => l.tipo==="Pix direcionado").length===1);
t("baixa do Contas a pagar entra", ls.some(l => l.tipo==="Contas a pagar: deu baixa" && l.n===1 && l.valor===300));
t("Financeiro familiar entra por área", ls.some(l => l.tipo==="Financeiro familiar: prestadores" && l.dia==="2026-11-17"));
t("dias com saldo lançado (dia vazio não conta)", af.diasComSaldo(s).join()==="2026-11-10,2026-11-17");
console.log(ok+" ok, "+falha+" falha"); process.exit(falha ? 1 : 0);
