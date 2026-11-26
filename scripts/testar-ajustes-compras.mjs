// Teste da Mudança 2 das Compras (18/11/2026): "Novo orçamento / ajustes", reenvio para aprovação, espera com motivo, vínculo do solicitante,
// avisos do SorellyChat (um por ação, só da ação concluída, sem duplicar) e a conversa do pedido ligada ao chat.
// Roda as regras de verdade e o código do servidor com um BANCO SIMULADO na memória: nada vai para o banco real nem para o chat de ninguém.
// Uso: node scripts/testar-ajustes-compras.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };

// banco simulado: estado_modulo (ce), conta, chat_conv, chat_msg. "falhar" simula o chat fora do ar.
const BANCO = { ce:null, contas:[], conv:new Map(), msg:new Map(), falhar:false };
const mock = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "sorelly-teste-")), "db-falso.mjs");
fs.writeFileSync(mock, `export const pool = () => ({});
export async function consulta(sql, p){ const B = globalThis.__BANCO;
  if(/from sorelly.estado_modulo/.test(sql)) return { rows:[{ p: B.ce ? B.ce.pedidos : [] }] };
  if(/from sorelly.conta/.test(sql)) return { rows: B.contas.filter((c) => String(c.pessoa_id)===String(p[0]) && c.status==="ativo") };
  if(B.falhar && /chat_/.test(sql)) throw new Error("chat fora do ar");
  if(/select id from sorelly.chat_msg/.test(sql)) return { rows: p[0].filter((id) => B.msg.has(id)).map((id) => ({ id })) };
  if(/select dados, membros from sorelly.chat_conv/.test(sql) || /select membros from sorelly.chat_conv/.test(sql)) { const c = B.conv.get(p[0]); return { rows: c ? [c] : [] }; }
  if(/select 1 from sorelly.chat_conv/.test(sql)) return { rows: B.conv.has(p[0]) ? [{}] : [] };   // conversa pessoal "Avisos de compras" (26/11/2026)
  if(/insert into sorelly.chat_conv/.test(sql)) { B.conv.set(p[0], { dados:p[1], membros:p[2] }); return { rows:[] }; }
  if(/insert into sorelly.chat_msg/.test(sql)) { if(!B.msg.has(p[0])) B.msg.set(p[0], { conv:p[1], dados:p[p.length-1] }); return { rows:[] }; }
  if(/select dados from sorelly.chat_msg/.test(sql)) return { rows: [...B.msg.values()].filter((m) => m.conv===p[0]).map((m) => ({ dados:m.dados })) };
  throw new Error("SQL não simulado: "+sql); }`);
globalThis.__BANCO = BANCO;
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@/server/db": mock, "@": path.join(raiz, "src") }, interopDefault: true });
const D = await jiti.import("@/apps/montagem/domain/compras-estoque");
const S = await jiti.import("@/server/compras-chat");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
let s = { ce: D.ceDemo() };
const hoje = D.hojeSP();
const run = (op, dados, quem) => { const r = D.ceReduz(s, Object.assign({ type:"CE", op, por:quem===61 ? "Solicitante Teste" : "Financeiro Teste", porId:quem || 29, podeAutorizar:true }, dados)); if(r.patch && r.patch.ce) s = { ce:r.patch.ce }; return r; };
const passou = (r) => !!(r.patch && r.patch.ce);
const ped = (id) => s.ce.pedidos.find((p) => p.id===id);
const ultimo = () => s.ce.pedidos[s.ce.pedidos.length-1];
const avisos = (id) => D.avisosDoPedido(ped(id));
const FD = { opcoes:{ pix_empresa:{ condicao:"à vista" }, boleto:{ parcelas:1, prazos:"30", ref:"emissao_nf" } } };
const novo = () => { run("pedido_add", { fornecedorNome:"Gráfica X", itens:[{ titulo:"Envelope", quantidade:100, unidade:"UNID", valorUnitario:1, classificacao:"material" }], formasDisp:FD }, 61); return ultimo().id; };
const grava = () => { BANCO.ce = JSON.parse(JSON.stringify(s.ce)); };   // = a gravação do módulo chegou ao banco
BANCO.contas.push({ pessoa_id:61, cid:"f_solicitante", status:"ativo" }, { pessoa_id:29, cid:"f_financeiro", status:"ativo" });

console.log("1. Pedido novo guarda a conta do solicitante");
const A = novo();
t("solicitanteId = id de quem pediu (não o nome)", ped(A).solicitanteId===61);

console.log("2. Pedir novo orçamento");
t("sem motivo é recusado", !passou(run("pedido_novo_orcamento", { id:A, motivo:"", detalhe:"" })) && ped(A).status==="NAO_VERIFICADA");
t("sem as instruções do ajuste é recusado", !passou(run("pedido_novo_orcamento", { id:A, motivo:"ESPECIFICACAO_INCOMPLETA", detalhe:"" })));
const solicOriginal = ped(A).solicitadoOriginalEm, nEv = ped(A).eventos.length;
t("com motivo e ajustes: vai para Novo orçamento / ajustes", passou(run("pedido_novo_orcamento", { id:A, motivo:"ESPECIFICACAO_INCOMPLETA", detalhe:"Confirmar o setor dos envelopes" })) && ped(A).status==="AGUARDANDO_ORCAMENTO");
t("devolução registra quem, quando, motivo e ajustes", ped(A).devolucao && ped(A).devolucao.porId===29 && !!ped(A).devolucao.em && ped(A).devolucao.detalhe==="Confirmar o setor dos envelopes");
t("um aviso, com próxima ação \"Reenviar para aprovação\"", avisos(A).length===1 && /Reenviar para aprovação/.test(avisos(A)[0].texto) && /Pedido #/.test(avisos(A)[0].texto), avisos(A).map((x) => x.texto).join(" | "));

console.log("3. Correção e reenvio pelo solicitante");
t("salvar edição NÃO reenvia nem avisa", passou(run("pedido_set", { id:A, observacao:"Setor: Marketing" }, 61)) && ped(A).status==="AGUARDANDO_ORCAMENTO" && avisos(A).length===1);
t("editar itens NÃO reenvia", passou(run("pedido_itens_set", { id:A, itens:[{ titulo:"Envelope ofício", quantidade:120, unidade:"UNID", valorUnitario:1, classificacao:"material" }] }, 61)) && ped(A).status==="AGUARDANDO_ORCAMENTO");
t("mensagem na conversa NÃO reenvia", passou(run("pedido_msg", { id:A, texto:"Já corrigi" }, 61)) && ped(A).status==="AGUARDANDO_ORCAMENTO");
const r1 = run("pedido_reenviar", { id:A, nota:"Setor confirmado" }, 61);
t("reenviar volta para \"1 — Solicitada\" com o MESMO número", passou(r1) && ped(A).status==="NAO_VERIFICADA" && s.ce.pedidos.filter((p) => p.id===A).length===1, r1.msg);
t("mantém a data original e grava a do reenvio", ped(A).solicitadoOriginalEm===solicOriginal && !!ped(A).reenviadoEm && ped(A).reenvios===1);
t("histórico e conversa preservados (correções e reenvio registrados)", ped(A).eventos.length>nEv+2 && ped(A).mensagens.length===1 && ped(A).devolucoes.length===1 && ped(A).eventos.some((e) => /Reenviada para aprovação/.test(e.texto)));
t("reenvio gera aviso", avisos(A).length===2 && avisos(A)[1].acao==="reenviar");
run("pedido_add", { fornecedorNome:"", itens:[{ titulo:"Cola", quantidade:1, unidade:"UNID", valorUnitario:5, classificacao:"material" }], formasDisp:FD }, 61); const SF = ultimo().id;
run("pedido_novo_orcamento", { id:SF, motivo:"OUTRO", detalhe:"Diga o fornecedor" });
t("reenviar sem fornecedor é recusado e o pedido continua em ajustes", !passou(run("pedido_reenviar", { id:SF }, 61)) && ped(SF).status==="AGUARDANDO_ORCAMENTO");

console.log("4. Notificações de cada ação");
t("aprovar → aviso de análise financeira", passou(run("pedido_aprovar", { id:A })) && avisos(A).length===3 && /análise financeira/.test(avisos(A)[2].texto));
t("liberar → aviso de liberação", passou(run("pedido_liberar", { id:A, cnpjId:"34", plano:[{ forma:"pix_empresa", valor:120, vencimento:hoje }] })) && avisos(A).length===4 && avisos(A)[3].acao==="liberar");
const B = novo();
t("Aprovar e liberar → UM aviso só", passou(run("pedido_aprovar", { id:B, liberar:true, cnpjId:"34", plano:[{ forma:"pix_empresa", valor:100, vencimento:hoje }] })) && avisos(B).length===1 && avisos(B)[0].acao==="aprovar_liberar");
const B2 = novo();
t("Aprovar e liberar recusado → nenhum aviso", !passou(run("pedido_aprovar", { id:B2, liberar:true })) && avisos(B2).length===0);
const C = novo();
t("reprovar exige motivo", !passou(run("pedido_negar", { id:C, motivo:"" })));
t("reprovar → aviso com o motivo", passou(run("pedido_negar", { id:C, motivo:"Fora do orçamento" })) && /Motivo: Fora do orçamento/.test(avisos(C)[0].texto));
const E = novo();
t("cancelar exige motivo", !passou(run("pedido_cancelar", { id:E, motivo:"" })));
t("cancelar → aviso", passou(run("pedido_cancelar", { id:E, motivo:"Não precisa mais" })) && avisos(E).length===1);
const F = novo();
t("espera sem motivo é recusada", !passou(run("pedido_esperar", { id:F, responsavel:"Anamaria" })));
t("espera sem responsável é recusada", !passou(run("pedido_esperar", { id:F, motivo:"Aguardar a feira" })));
t("espera com motivo, responsável e revisão", passou(run("pedido_esperar", { id:F, motivo:"Aguardar a feira", responsavel:"Anamaria", ate:hoje })) && ped(F).status==="AGUARDANDO" && ped(F).espera.responsavel==="Anamaria");
t("espera NÃO vai para ajustes e avisa o próximo passo", ped(F).status!=="AGUARDANDO_ORCAMENTO" && /Próximo passo com Anamaria/.test(avisos(F)[0].texto));
t("compra efetuada → aviso", passou(run("pedido_comprar", { id:B, valorCompra:100, compradoEm:hoje })) && avisos(B).length===2 && avisos(B)[1].acao==="comprar");
t("códigos dos avisos são únicos", new Set(s.ce.pedidos.flatMap((p) => D.avisosDoPedido(p).map((a) => a.aid))).size===s.ce.pedidos.flatMap((p) => D.avisosDoPedido(p)).length);

console.log("5. Entrega no SorellyChat (banco simulado)");
grava();
let sit = await S.entregarAvisos([A]);
const conv = BANCO.conv.get("compra_"+A);
t("grupo do pedido criado: solicitante + quem agiu (sem o financeiro inteiro)", !!conv && conv.membros.includes("f_solicitante") && conv.membros.includes("f_financeiro") && conv.membros.length===2, conv && conv.membros.join(","));
t("avisos entregues ao grupo do pedido", sit[A].entregues.length===4 && sit[A].pendentes.length===0);
const qtd = BANCO.msg.size;
await S.entregarAvisos([A]); await S.entregarAvisos(null); await S.entregarAvisos([A]);
t("clicar de novo, recarregar ou tentar de novo NÃO duplica", [...BANCO.msg.values()].filter((m) => m.conv==="compra_"+A).length===4);
run("pedido_negar", { id:SF, motivo:"Sem fornecedor" }); let antes = BANCO.msg.size; await S.entregarAvisos([SF]);
t("aviso só da ação gravada: ação feita e ainda não gravada no banco não sai", BANCO.msg.size===antes);
grava(); await S.entregarAvisos([SF]);
t("depois de gravada, o aviso sai", BANCO.msg.size===antes+1);
t("o aviso traz número, título, ação, situação e link do pedido", (() => { const m = [...BANCO.msg.values()].find((x) => x.conv==="compra_"+A); return m && m.dados.aviso && m.dados.compra.id===A && /Pedido #/.test(m.dados.texto) && /Situação:/.test(m.dados.texto); })());

console.log("6. Falha no chat e pedido antigo sem vínculo");
const G = novo(); run("pedido_aprovar", { id:G }); grava();
BANCO.falhar = true;
let sitG; try { sitG = await S.entregarAvisos([G]); } catch(e) { sitG = null; }
t("chat fora do ar: a aprovação continua valendo e o aviso fica pendente", ped(G).status==="APROVADA" && sitG && sitG[G].pendentes.length===1);
BANCO.falhar = false;
sitG = await S.entregarAvisos([G]);
t("tentar de novo entrega sem duplicar", sitG[G].entregues.length===1 && sitG[G].pendentes.length===0 && [...BANCO.msg.values()].filter((m) => m.conv==="compra_"+G).length===1);
s.ce.pedidos.push(Object.assign(JSON.parse(JSON.stringify(ped(G))), { id:77777, solicitante:"Solicitante Teste", solicitanteId:undefined, eventos:[] }));
delete ped(77777).solicitanteId;
run("pedido_negar", { id:77777, motivo:"Teste antigo" }); grava();
let sitV = await S.entregarAvisos([77777]);
t("pedido antigo sem vínculo: nada é enviado (nem por nome parecido) e fica sinalizado", sitV[77777].vinculo===false && sitV[77777].pendentes.length===1 && !BANCO.conv.has("compra_77777"));
t("vincular exige escolher a pessoa", !passou(run("pedido_vincular", { id:77777 })));
t("vincular pelo id da pessoa e reenviar o aviso", passou(run("pedido_vincular", { id:77777, solicitanteId:61, solicitante:"Solicitante Teste" })) && (grava(), true));
sitV = await S.entregarAvisos([77777]);
t("depois do vínculo o aviso chega", sitV[77777].vinculo===true && sitV[77777].entregues.length===1);
BANCO.contas.push({ pessoa_id:62, cid:"f_x", status:"ativo" }, { pessoa_id:62, cid:"f_y", status:"ativo" });
t("pessoa com duas contas de chat diferentes: ambíguo, não entrega", (await S.cidDaPessoa(62))===null);

console.log("7. Conversa do pedido ligada ao chat (dois sentidos, sem ciclo)");
const eu = { cid:"f_financeiro", pessoaId:29 };
await S.escreverNoPedido(ped(A), eu, "Pode confirmar o setor?", "m_teste_1");
await S.escreverNoPedido(ped(A), eu, "Pode confirmar o setor?", "m_teste_1");   // mesma mensagem reenviada (clique duplo)
BANCO.msg.set("m_resposta_chat", { conv:"compra_"+A, dados:{ id:"m_resposta_chat", de:"f_solicitante", t:Date.now()+1000, tipo:"texto", texto:"Setor Marketing" } });   // resposta escrita no SorellyChat
const conversa = await S.mensagensDoPedido(A);
const pessoas = conversa.msgs.filter((m) => !m.aviso);
t("mensagem do pedido chega ao grupo do solicitante com o autor real", pessoas.some((m) => m.id==="m_teste_1" && m.de==="f_financeiro"));
t("clique duplo não duplica", pessoas.filter((m) => m.id==="m_teste_1").length===1);
t("resposta do solicitante no chat aparece na conversa do pedido", pessoas.some((m) => m.id==="m_resposta_chat" && m.de==="f_solicitante"));
t("sem ciclo: cada mensagem existe uma vez só (a conversa é a mesma, não há cópia)", conversa.msgs.length===new Set(conversa.msgs.map((m) => m.id)).size);
t("avisos e mensagens de pessoas vêm separados (marca aviso)", conversa.msgs.some((m) => m.aviso) && pessoas.length===2);

console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
