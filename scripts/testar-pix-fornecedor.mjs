// Teste: Pix confirmado no Direcionar com destino FORNECEDOR vira pagamento do fornecedor (17/11/2026). Roda o reducer de verdade. Uso: node scripts/testar-pix-fornecedor.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
const pfm = await jiti.import("@/apps/montagem/domain/pf");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
let s = inicial();
const pf0 = pfm.pfMigrar ? s.pf : s.pf;
const forn = (s.pf.fornecedores||[]).find(f => f.tipo!=="prestador" && pfm.janelasDoForn && pfm.janelasDoForn(s.pf, f.id).length);
console.log("fornecedor de teste:", forn && forn.nome, "| lançamentos antes:", s.pf.lancamentos.length);
const dest = s.cp.destinos.find(d => d.tipo==="FORNECEDOR" && pfm.fornDoDestino(s.pf, d.nome));
console.log("destino:", dest && dest.nome);
t("destino fornecedor liga a um fornecedor do pf", !!dest);
if(dest){
  const fid = pfm.fornDoDestino(s.pf, dest.nome).id;
  const js = pfm.janelasDoForn(s.pf, fid);
  const antes = s.pf.lancamentos.length;
  s = Object.assign({}, s, { dp: Object.assign({}, s.dp || {}, { pix: [{id:"PT1", origem:"interno", quem:"TESTE", valor:100, pagos:[], divisoes:[{destinoId:dest.id, valor:100}], status:"fila", forma:"pix"}], regras:[] }) });
  s = reducer(s, {type:"DP", op:"confirma", id:"PT1", por:"Teste"});
  const novos = s.pf.lancamentos.filter(l => l.origemPix);
  t("criou 1 lançamento do fornecedor", novos.length===1 && s.pf.lancamentos.length===antes+1);
  t("sem comprovante: aguarda", novos[0] && novos[0].aguardaComp===true);
  const jan = js.slice().sort((a,b)=>a.limite.localeCompare(b.limite)).find(j => j.total-pfm.pagoJanela(s.pf, j.chave)>0.005) || js[js.length-1];
  t("caiu na janela mais antiga em aberto", novos[0] && novos[0].chave===jan.chave, novos[0] && novos[0].chave+" x "+jan.chave);
  s = reducer(s, {type:"DP", op:"reabre", id:"PT1"}); s = reducer(s, {type:"DP", op:"confirma", id:"PT1", por:"Teste"});
  t("reabrir e confirmar de novo não duplica", s.pf.lancamentos.filter(l => l.origemPix).length===1);
  s = reducer(s, {type:"DP", op:"confirma", id:"PT1", por:"Teste"});
  t("confirmar duas vezes não duplica", s.pf.lancamentos.filter(l => l.origemPix).length===1);
  const pagoAntes = pfm.pagoJanela(s.pf, jan.chave);
  s = reducer(s, {type:"PF", op:"lanc_comp", id:s.pf.lancamentos.find(l=>l.origemPix).id, arqNome:"c.pdf", arqKey:"k"});
  t("com comprovante passa a contar", pfm.pagoJanela(s.pf, jan.chave)-pagoAntes > 99.99 && !s.pf.lancamentos.find(l=>l.origemPix).aguardaComp);
  s = reducer(s, {type:"DP", op:"reabre", id:"PT1"});
  t("reabrir não remove o que já tem comprovante", s.pf.lancamentos.filter(l => l.origemPix).length===1);
}
// atendimento interno: comprovante anexado na Atendimento Sorelly liga sozinho ao pagamento do fornecedor
if(dest){
  const fid2 = pfm.fornDoDestino(s.pf, dest.nome).id;
  s = Object.assign({}, s, { lancFin:[{id:"LFT", internoId:"IT1", linhas:[{tipo:"pagamento", forma:"pix", valor:50, partes:[{descricao:"x", valor:50, comprovante:null, ok:false}]}]}], dp: Object.assign({}, s.dp, {pix:[{id:"PI1", origem:"interno", internoId:"IT1", quem:"TESTE2", valor:50, partes:[{forma:"pix", valor:50}], linhas:[0], pagos:[], divisoes:[{destinoId:dest.id, valor:50, parte:"pix#0"}], status:"fila", forma:"pix"}], regras:[]}) });
  s = reducer(s, {type:"DP", op:"confirma", id:"PI1", por:"Teste"});
  const l2 = s.pf.lancamentos.find(l => l.origemPix==="PI1#0");
  t("interno: nasce aguardando e com ligação ao lançamento", l2 && l2.aguardaComp && l2.lf && l2.lf.internoId==="IT1");
  s = reducer(s, {type:"FIN_LINHA", id:"LFT", i:0, patch:{partes:[{descricao:"x", valor:50, comprovante:{nome:"c.jpg", url:"data:image/jpeg;base64,AAAA"}, ok:false}]}});
  const l3 = s.pf.lancamentos.find(l => l.origemPix==="PI1#0");
  t("interno: comprovante anexado no atendimento libera o pagamento", l3 && !l3.aguardaComp && l3.arqNome==="c.jpg", JSON.stringify(l3));
}
// representante: o comprovante vem da calculadora de acerto (lancFin do acerto, linha com o pid)
if(dest){
  const { idPedidoRep } = await jiti.import("@/apps/montagem/domain/pagamento-rep");
  const mk = (id, pid, comp) => ({id:idPedidoRep("K"+id), origem:"rep", kitId:"K"+id, linhas:[{tipo:"pagamento", forma:"pix", valor:30, pid, partes:[{descricao:"", valor:30, comprovante:comp, ok:false}]}]});
  const pixRep = (id, pid) => ({id:id, origem:"rep", pid, kitId:"K"+id, quem:"Representante TESTE", repOrigem:"TESTE", valor:30, pagos:[], divisoes:[{destinoId:dest.id, valor:30}], status:"fila", forma:"pix"});
  // A) comprovante já anexado quando o Lucas direciona
  let a = Object.assign({}, s, {lancFin:[mk("RA","PA",{nome:"c.jpg", url:"data:image/jpeg;base64,AAAA"})], dp:Object.assign({}, s.dp, {pix:[pixRep("RA","PA")], regras:[]})});
  a = reducer(a, {type:"DP", op:"confirma", id:"RA", por:"Teste"});
  const la = a.pf.lancamentos.find(l => l.origemPix==="RA#0");
  t("representante: comprovante já anexado libera ao direcionar", la && !la.aguardaComp && la.arqNome==="c.jpg", JSON.stringify(la));
  // B) comprovante anexado depois, na calculadora de acerto
  let b = Object.assign({}, s, {lancFin:[mk("RB","PB",null)], dp:Object.assign({}, s.dp, {pix:[pixRep("RB","PB")], regras:[]})});
  b = reducer(b, {type:"DP", op:"confirma", id:"RB", por:"Teste"});
  const lb0 = b.pf.lancamentos.find(l => l.origemPix==="RB#0");
  t("representante: sem comprovante, aguarda", lb0 && lb0.aguardaComp===true);
  b = reducer(b, {type:"REP_PAG", op:"comprovante", kitId:"KRB", pid:"PB", anexo:{nome:"d.pdf", dados:"data:application/pdf;base64,AAAA"}});
  const lb = b.pf.lancamentos.find(l => l.origemPix==="RB#0");
  t("representante: anexou na calculadora, libera o pagamento", lb && !lb.aguardaComp && lb.arqNome==="d.pdf", JSON.stringify(lb));
}
console.log(ok+" ok, "+falha+" falha"); process.exit(falha ? 1 : 0);
