// Sorelly Admin · montagem — pages/FinFamiliarSocios.js
// Financeiro familiar → Sócios (21/10/2026, no lugar da tela Prestadores). Duas telas dentro da mesma página, por sócio e com filtro de mês (ou "Geral"):
//  1) Consolidado: Pix recebido, salário e PARA ONDE FOI (nas contas do próprio sócio × para terceiros), com enviado no período, já enviado, falta pagar e data limite.
//  2) Prestadores: tabela com barra de progresso; clicar num prestador abre a TELA DELE: Dívida (uma linha por orçamento, com código), Enviado (cada Pix aponta para a dívida) e mensagem copiável para o prestador.
// Dados do Financeiro familiar (domain/financeiro-familiar.js): pix, repasses, dívidas, contas; a data limite fica em prestador.prazo; envio manual guarda socioId.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { ResumoSocio } from "@/apps/montagem/pages/FinFamiliarResumo";
import { Tab, Td, LINHA, ESTADO } from "@/apps/montagem/components/padrao";
import { FORMAS_REPASSE, baixaDividas, br, hojeIso, janela, nomeMes, pixDoMes, r2, totaisPersona } from "@/apps/montagem/domain/financeiro-familiar";
import { dataIso, lerOrcamento, lerTextoPdf, msgDivida } from "@/apps/montagem/domain/orcamento-texto";
import { baixarArquivo, salvarArquivo } from "@/apps/montagem/lib/arquivos";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var diasAte = function(iso){ return Math.round((new Date(iso+"T12:00:00") - new Date(hojeIso()+"T12:00:00"))/86400000); };
var pc = function(a, b){ return b>0.005 ? Math.round(a/b*100)+"%" : "—"; };
var num = function(t){ var n = Number(String(t||"").replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };
var chip = function(txt, cor){ return e("span",{className:"inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:cor+"26", color:cor}}, txt); };
var BTN = "h-10 rounded-lg px-5 text-[14px] font-bold ring-1 transition ";
var botao = function(on, rot, fn, k){ return e("button",{key:k||rot, type:"button", onClick:fn, className:BTN+(on ? "text-white ring-[#3B82F6]" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,#3B82F677,#3B82F622)"} : undefined}, rot); };
var campo = function(rot, el){ return e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, rot), el); };

function AbaFfSocios(){
  var cx = use(), s = cx.state, ff = s.ff, pode = temAutorizacao("financeiro_familia", s.usuario);
  var socios = ff.personas.filter(function(p){ return p.tipo==="SOCIO" && p.ativo!==false && p.id!=="sorelly"; });
  var sp = useState(socios.length ? (socios.find(function(p){ return p.id==="marcus"; }) || socios[0]).id : ""), pid = sp[0], setPid = sp[1], sm = useState(hojeIso().slice(0, 7)), ym = sm[0], setYm = sm[1];
  var sa = useState("resumo"), aba = sa[0], setAba = sa[1], ss = useState(null), selId = ss[0], setSelId = ss[1], sn = useState(null), novo = sn[0], setNovo = sn[1];
  // estado dos formulários fica aqui (sempre no mesmo lugar), para não perder o que foi digitado
  var sfn = useState({nome:"", banco:"", chave:"", dono:"minha", prest:"", servico:""}), fN = sfn[0], setFN = sfn[1], sfe = useState({data:hojeIso(), valor:"", conta:"", forma:"PIX", pixRev:false, div:""}), fE = sfe[0], setFE = sfe[1], sfd = useState({data:hojeIso(), valor:"", prazo:"", codigo:"", titulo:"", descricao:"", arquivoId:"", arquivoNome:"", msg:"", pags:[], aviso:""}), fD = sfd[0], setFD = sfd[1];
  var sfv = useState(""), fDiv = sfv[0], setFDiv = sfv[1], sed = useState(false), edDiv = sed[0], setEdDiv = sed[1], see = useState(false), edEnv = see[0], setEdEnv = see[1], sul = useState(""), ultimo = sul[0], setUltimo = sul[1], slc = useState(false), lancDiv = slc[0], setLancDiv = slc[1];
  if(!pode) return e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px]"}, "Esta tela é só dos sócios.");
  var persona = ff.personas.find(function(p){ return p.id===pid; }) || {nome:""}, acao = function(op, extra){ cx.dispatch(Object.assign({type:"FF", op:op, por:"Marcus"}, extra)); };
  var M = ym ? [ym] : janela(), noPeriodo = function(iso){ return !ym || iso.slice(0, 7)===ym; }, rotP = ym ? nomeMes(ym) : "todos os meses";
  // números do período
  var pix = r2(M.reduce(function(t, m){ return t+pixDoMes(ff, pid, m); }, 0)), meta = r2(M.reduce(function(t, m){ return t+(ff.pixMeta[pid+"|"+m]||0); }, 0)), tps = M.map(function(m){ return totaisPersona(ff, pid, m); });
  var salario = r2(tps.reduce(function(t, x){ return t+x.pro.recebido; }, 0)), contasRest = r2(tps.reduce(function(t, x){ return t+x.contas.restante; }, 0));
  var contaPor = {}; ff.contasBanc.forEach(function(c){ contaPor[c.id] = c; });
  var minhas = {};
  ff.pix.filter(function(x){ return x.personaId===pid && noPeriodo(x.data) && x.auditoria!=="REJEITADO"; }).forEach(function(x){ var c = contaPor[x.contaId]; if(c && c.prestadorId) return; var k = (c ? c.nome.replace(/^Conta\s+/i, "") : "Sem conta informada")+(c && c.banco ? " ("+c.banco+")" : ""); minhas[k] = r2((minhas[k]||0)+x.valor); });
  var totMin = r2(Object.keys(minhas).reduce(function(t, k){ return t+minhas[k]; }, 0));
  // prestadores do sócio: responsável, ou que receberam dele (Pix de revendedora ou envio manual)
  var doSocio = function(r, x){ return r.origemPixPersonaId===pid || r.socioId===pid || (!r.origemPixPersonaId && !r.socioId && x.responsavelId===pid); };
  var prests = ff.prest.filter(function(x){ return x.responsavelId===pid || ff.repasses.some(function(r){ return r.prestId===x.id && (r.origemPixPersonaId===pid || r.socioId===pid); }); }).map(function(x){
    var dv = ff.dividas.filter(function(y){ return y.prestId===x.id; }), comb = r2(dv.reduce(function(t, y){ return t+y.valor; }, 0)), rp = ff.repasses.filter(function(y){ return y.prestId===x.id; }), env = r2(rp.reduce(function(t, y){ return t+y.valor; }, 0));
    var noP = r2(rp.filter(function(y){ return noPeriodo(y.data) && doSocio(y, x); }).reduce(function(t, y){ return t+y.valor; }, 0));
    var bd = baixaDividas(ff, x.id), prazo = x.prazo || (dv.map(function(y){ return y.prazo; }).filter(Boolean).sort()[0] || ""), falta = bd.falta, pctv = comb>0 ? Math.min(100, env/comb*100) : (env>0 ? 100 : 0);
    var sit = bd.sobra>1 ? {t:"Pago a mais "+BK(bd.sobra), c:ESTADO.alerta} : falta<=1 ? {t:"Quitado", c:ESTADO.ok} : !prazo ? {t:"Sem data", c:ESTADO.neutro} : diasAte(prazo)<0 ? {t:"Vencido", c:ESTADO.ruim} : diasAte(prazo)<=7 ? {t:"Vence em "+diasAte(prazo)+" dias", c:ESTADO.alerta} : {t:"A pagar", c:ESTADO.neutro};
    return {x:x, comb:comb, env:env, noP:noP, falta:falta, prazo:prazo, pct:pctv, sit:sit, ordem:falta<=1 ? 3 : !prazo ? 2 : diasAte(prazo)<0 ? 0 : 1};
  }).filter(function(p){ return p.x.ativo!==false || p.comb>0 || p.env>0; }).filter(function(p){ return p.comb>0 || p.env>0 || p.x.responsavelId===pid; }).sort(function(a, b){ return a.ordem-b.ordem || (a.prazo||"9").localeCompare(b.prazo||"9") || b.falta-a.falta; });
  var tComb = r2(prests.reduce(function(t, p){ return t+p.comb; }, 0)), tEnv = r2(prests.reduce(function(t, p){ return t+p.env; }, 0)), tNoP = r2(prests.reduce(function(t, p){ return t+p.noP; }, 0)), tFalta = r2(prests.reduce(function(t, p){ return t+p.falta; }, 0));
  var linha = function(rot, v, cor, sub){ return e("div",{key:rot, className:"flex min-w-0 items-baseline justify-between gap-3 border-b border-white/10 px-4 py-1.5"}, e("span",{className:"truncate text-[14px]", title:rot}, rot, sub && e("span",{className:"ml-2 text-[12px] text-white/55"}, sub)), e("b",{className:MONO+" shrink-0 text-[16px]", style:{color:cor||"#fff"}}, v)); };
  var grade = function(itens){ return e("div",{className:"grid grid-cols-1 md:grid-cols-2 md:[&>*:nth-child(odd)]:border-r md:[&>*:nth-child(odd)]:border-white/10"}, itens); };
  var abrirPrest = function(id){ setSelId(id); setAba("prest"); };
  var prazoInput = function(p){ return e("input",{type:"date", value:p.prazo||"", "aria-label":"Data limite de "+p.x.nome, className:INPUT+" h-8! w-32 px-1! text-center text-[13px]!", onClick:function(ev){ ev.stopPropagation(); }, onChange:function(ev){ acao("prest_set", {id:p.x.id, patch:{prazo:ev.target.value}}); }}); };
  var barra = function(p){ return e("div",{className:"mx-auto flex w-28 items-center gap-2"}, e("div",{className:"h-2 flex-1 overflow-hidden rounded-full bg-white/15"}, e("div",{className:"h-full rounded-full", style:{width:Math.max(p.pct>0 ? 3 : 0, p.pct)+"%", background:p.falta<=1 ? ESTADO.ok : "#3B82F6"}})), e("span",{className:"text-[12px] text-white/80"}, Math.round(p.pct)+"%")); };
  var topo = e("div",{className:"flex flex-col gap-2"},
    e(PageHead,{t:"Sócios", sub:"Pix recebido, salário e o que foi enviado a cada prestador, por sócio"}),
    e("div",{className:"flex flex-wrap items-center gap-2"}, socios.map(function(p){ return botao(p.id===pid, p.nome, function(){ setPid(p.id); setSelId(null); }, p.id); }),
      e("select",{value:ym, "aria-label":"Mês", className:INPUT+" ml-auto h-10! w-52 cursor-pointer", onChange:function(ev){ setYm(ev.target.value); }}, e("option",{value:""}, "Geral (todos os meses)"), janela().map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); }))),
    e("div",{className:"flex flex-wrap items-center gap-2 border-b border-white/15"}, [["resumo", "Resumo"], ["cons", "Consolidado"], ["prest", "Prestadores"]].map(function(x){ var on = aba===x[0]; return e("button",{key:x[0], type:"button", onClick:function(){ setAba(x[0]); setSelId(null); }, className:"px-5 py-2.5 text-[15px] font-bold text-white transition "+(on ? "border-b-2 border-[#3B82F6]" : "opacity-70 hover:opacity-100")}, x[1]); }),
      e("span",{className:"flex-1"}), e(Btn,{sm:true, onClick:function(){ setNovo(novo==="conta" ? null : "conta"); }}, "+ Nova conta"), e(Btn,{sm:true, v:"primary", onClick:function(){ setAba("prest"); setSelId(null); setNovo(novo==="prest" ? null : "prest"); }}, "+ Novo prestador")));
  // formulários de cadastro (conta e prestador)
  var NovoForm = function(){
    var f = fN, setF = setFN, u = function(k, v){ var o = Object.assign({}, f); o[k] = v; setF(o); };
    if(novo==="prest") return e(BlocoBarra,{cor:"azul", compacto:true, t:"Novo prestador de "+persona.nome}, e("div",{className:"flex flex-wrap items-end gap-3 p-3"}, campo("Nome", e("input",{value:f.nome, className:INPUT+" h-9! w-56", onChange:function(ev){ u("nome", ev.target.value); }})), campo("Serviço", e("input",{value:f.servico, className:INPUT+" h-9! w-44", onChange:function(ev){ u("servico", ev.target.value); }})), campo("Chave Pix", e("input",{value:f.chave, className:INPUT+" h-9! w-52", onChange:function(ev){ u("chave", ev.target.value); }})),
      e(Btn,{v:"primary", disabled:!f.nome.trim(), onClick:function(){ acao("prest_add", {nome:f.nome, servico:f.servico, chavePix:f.chave, responsavelId:pid}); setNovo(null); }}, "Criar prestador")));
    if(novo==="conta") return e(BlocoBarra,{cor:"azul", compacto:true, t:"Nova conta"}, e("div",{className:"flex flex-wrap items-end gap-3 p-3"}, campo("De quem é", e("select",{value:f.dono, className:INPUT+" h-9! w-52 cursor-pointer", onChange:function(ev){ u("dono", ev.target.value); }}, e("option",{value:"minha"}, "Minha conta ("+persona.nome+")"), e("option",{value:"prest"}, "Conta de um prestador"))),
      f.dono==="prest" && campo("Prestador", e("select",{value:f.prest, className:INPUT+" h-9! w-52 cursor-pointer", onChange:function(ev){ u("prest", ev.target.value); }}, e("option",{value:""}, "Escolha…"), ff.prest.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
      campo("Nome da conta", e("input",{value:f.nome, className:INPUT+" h-9! w-48", onChange:function(ev){ u("nome", ev.target.value); }})), campo("Banco", e("input",{value:f.banco, className:INPUT+" h-9! w-36", onChange:function(ev){ u("banco", ev.target.value); }})), campo("Chave Pix", e("input",{value:f.chave, className:INPUT+" h-9! w-48", onChange:function(ev){ u("chave", ev.target.value); }})),
      e(Btn,{v:"primary", disabled:!f.nome.trim() || (f.dono==="prest" && !f.prest), onClick:function(){ acao("cb_add", {nome:f.nome, banco:f.banco, chavePix:f.chave, personaId:f.dono==="minha" ? pid : "", prestadorId:f.dono==="prest" ? f.prest : ""}); setNovo(null); }}, "Criar conta")));
    return null;
  };
  // ───── 1) CONSOLIDADO
  var consolidado = function(){
    var linhas = [];
    var grupo = function(rot, tot, cor){ linhas.push(e("tr",{key:"g"+rot, className:LINHA+" bg-white/10"}, e(Td,{forte:true, className:"text-left", cor:cor}, rot), e(Td,{dinheiro:true, forte:true}, BK(tot)), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""))); };
    grupo("Nas minhas contas", totMin, ESTADO.ok);
    Object.keys(minhas).sort(function(a, b){ return minhas[b]-minhas[a]; }).forEach(function(k){ linhas.push(e("tr",{key:"m"+k, className:LINHA}, e(Td,{className:"pl-6 text-left text-white/90"}, "↳ "+k), e(Td,{dinheiro:true}, BK(minhas[k])), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, pc(minhas[k], pix)))); });
    grupo("Para terceiros (prestadores)", tNoP, ESTADO.alerta);
    prests.filter(function(p){ return p.noP>0 || p.falta>1; }).forEach(function(p){ linhas.push(e("tr",{key:"t"+p.x.id, onClick:function(){ abrirPrest(p.x.id); }, title:"Abrir "+p.x.nome, className:LINHA+" cursor-pointer hover:bg-white/5"}, e(Td,{className:"pl-6 text-left text-white/90"}, "↳ "+p.x.nome), e(Td,{dinheiro:true}, p.noP>0 ? BK(p.noP) : "—"), e(Td,{dinheiro:true}, BK(p.env)), e(Td,{dinheiro:true, cor:p.falta>1 ? "alerta" : "ok", forte:true}, BK(p.falta)), e(Td,null, prazoInput(p)), e(Td,null, chip(p.sit.t, p.sit.c)))); });
    return e("div",{className:"flex flex-col gap-3"},
      e(BlocoBarra,{cor:"azul", compacto:true, t:persona.nome+" · "+rotP, dir:BK(r2(pix+salario))+" recebido"}, grade([
        linha("Pix de revendedoras recebido", BK(pix), ESTADO.ok, meta>0 ? "meta "+BK(meta)+" · "+pc(pix, meta) : ""), linha("Salário recebido (pró-labore líquido)", BK(salario), ESTADO.ok),
        linha("Do Pix, ficou nas minhas contas", BK(totMin), "#fff", pc(totMin, pix)), linha("Enviado a terceiros no período", BK(tNoP), ESTADO.alerta, "Pix de revendedora e Pix manual"), linha("Falta pagar aos prestadores", BK(tFalta), tFalta>1 ? ESTADO.alerta : ESTADO.ok), linha("Contas do período (a pagar)", BK(contasRest), contasRest>0 ? ESTADO.alerta : ESTADO.ok)])),
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Consolidado · para onde foi o dinheiro", dir:"clique num prestador para abrir"}, e("div",{className:"overflow-x-auto p-2"}, e(Tab,{normal:true, cols:["Destino", "Enviado no período", "Já enviado (total)", "Falta pagar", "Data limite", "Situação / %"]}, linhas))));
  };
  // ───── 2) PRESTADORES: lista e tela do prestador
  var lista = function(){ return e(BlocoBarra,{cor:"azul", compacto:true, t:"Prestadores de "+persona.nome, dir:"falta "+BK(tFalta)}, e("div",{className:"overflow-x-auto p-2"}, prests.length ? e(Tab,{normal:true, cols:["Prestador", "Combinado", "Enviado no período", "Já enviado", "Progresso", "Falta pagar", "Data limite", "Situação"]}, [].concat(prests.map(function(p){
    return e("tr",{key:p.x.id, onClick:function(){ setSelId(p.x.id); }, className:LINHA+" cursor-pointer hover:bg-white/5"}, e(Td,{forte:true, className:"text-left"}, p.x.nome, p.x.servico && e("span",{className:"ml-2 text-[11px] font-normal text-white/50"}, p.x.servico)), e(Td,{dinheiro:true}, BK(p.comb)), e(Td,{dinheiro:true}, p.noP>0 ? BK(p.noP) : "—"), e(Td,{dinheiro:true}, BK(p.env)), e(Td,null, barra(p)), e(Td,{dinheiro:true, cor:p.falta>1 ? "alerta" : "ok", forte:true}, BK(p.falta)), e(Td,null, prazoInput(p)), e(Td,null, chip(p.sit.t, p.sit.c))); }),
    [e("tr",{key:"t", className:LINHA+" bg-white/10"}, e(Td,{forte:true, className:"text-left"}, "Total"), e(Td,{dinheiro:true, forte:true}, BK(tComb)), e(Td,{dinheiro:true, forte:true}, BK(tNoP)), e(Td,{dinheiro:true, forte:true}, BK(tEnv)), e(Td,{forte:true}, pc(tEnv, tComb)), e(Td,{dinheiro:true, forte:true, cor:"alerta"}, BK(tFalta)), e(Td,null, ""), e(Td,null, ""))])) : e("p",{className:"px-2 py-4 text-center text-[14px] text-white/70"}, "Nenhum prestador ligado a este sócio."))); };
  var DetalhePrest = function(){
    var p = prests.find(function(q){ return q.x.id===selId; }), x = p ? p.x : ff.prest.find(function(q){ return q.id===selId; });
    var f = fE, setF = setFE, d = fD, setD = setFD;
    if(!x) return null; var info = p || {comb:0, env:0, noP:0, falta:0, prazo:x.prazo||"", pct:0, sit:{t:"—", c:ESTADO.neutro}};
    var bxAll = baixaDividas(ff, x.id), por = bxAll.porId, dvAll = bxAll.lista.slice().sort(function(a, b){ return b.data.localeCompare(a.data); });
    var descAll = ff.dividas.filter(function(y){ return y.prestId===x.id && y.valor<0; }), rpAll = ff.repasses.filter(function(y){ return y.prestId===x.id; });
    var rotDiv = function(y){ return y.codigo || y.descricao || br(y.data); };
    var dv = dvAll.filter(function(y){ return noPeriodo(y.data) || por[y.id].falta>0.005 || por[y.id].cred.some(function(c){ return noPeriodo(c.d); }); });
    var rp = rpAll.filter(function(y){ return noPeriodo(y.data) && (!fDiv || bxAll.liga[y.id]===fDiv); }).sort(function(a, b){ return b.data.localeCompare(a.data); });
    var minhasContas = ff.contasBanc.filter(function(c){ return c.personaId===pid && !c.prestadorId && c.ativo!==false; });
    var somaDv = r2(dv.reduce(function(t, y){ return t+y.valor+descAll.filter(function(z){ return z.divId===y.id; }).reduce(function(u, z){ return u+z.valor; }, 0); }, 0)), somaRp = r2(rp.reduce(function(t, y){ return t+y.valor; }, 0));
    var abertas = dvAll.filter(function(y){ return por[y.id].falta>0.005; }).sort(function(a, b){ return a.data.localeCompare(b.data); });
    var copiar = function(id){ var y = dvAll.find(function(k){ return k.id===id; }); if(!y) return; var txt = msgDivida(x, y, por[id], ff.repasses), ok = function(){ cx.dispatch({type:"AVISO", txt:"Mensagem copiada. Já pode colar no WhatsApp."}); };
      var alt = function(){ var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); ok(); }catch(er){} ta.remove(); };
      try{ navigator.clipboard.writeText(txt).then(ok, alt); }catch(er){ alt(); } };
    var enviar = function(){ var cb = ff.contasBanc.find(function(c){ return c.id===f.conta; }); setUltimo(f.div || (abertas[0] ? abertas[0].id : ""));
      acao("repasse_add", {prestId:x.id, data:f.data, valor:num(f.valor), origem:cb ? persona.nome+" · "+cb.nome.replace(/^Conta\s+/i, "") : (f.conta==="dinheiro" ? persona.nome+" · dinheiro" : persona.nome), forma:f.forma, contaTxt:cb ? cb.nome : "", pixRevendedora:f.pixRev, socioId:pid, divId:f.div}); setF(Object.assign({}, f, {valor:""})); };
    var th = function(t, c){ return e("th",{key:t+(c||""), className:"whitespace-nowrap border-b border-white/15 px-2 py-2 text-"+(c||"left")+" text-[11.5px] font-bold uppercase tracking-wide text-white/75"}, t); };
    var td = function(c, cls, st){ return e("td",{className:"px-2 py-1.5 "+(cls||""), style:st}, c); };
    var mini = function(rot, fn, tit, cor){ return e("button",{type:"button", title:tit||rot, onClick:function(ev){ ev.stopPropagation(); fn(); }, className:"whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-bold ring-1 ring-white/20 hover:bg-white/15 "+(cor||"bg-white/10")}, rot); };
    // campo de texto da edição: grava ao sair do campo
    var inp = function(k, val, w, grava, tipo){ return e("input",{key:k+"|"+val, type:tipo||"text", defaultValue:val, className:INPUT+" h-8! "+w+" px-1.5! text-[13px]!", onClick:function(ev){ ev.stopPropagation(); }, onBlur:function(ev){ if(ev.target.value!==String(val)) grava(ev.target.value); }}); };
    var dinheiro = function(v){ return Number(v).toFixed(2).replace(".", ","); };
    var barraAcoes = function(esq, ed, setEd){ return e("div",{className:"flex flex-wrap items-center justify-between gap-2"}, e("div",{className:"flex flex-wrap items-center gap-2"}, esq), e(Btn,{v:ed ? "primary" : "ghost", sm:true, onClick:function(){ setEd(!ed); }}, ed ? "✓ Concluir edição" : "✎ Editar")); };
    // lançar dívida: PDF ou mensagem do prestador, depois confere e lança
    var aplicarLeitura = function(o, arq){ var d1 = o.data || (o.pagamentos.length ? dataIso(o.pagamentos[0].data, new Date().getFullYear()) : d.data); setD(Object.assign({}, d, arq||{}, {codigo:o.codigo||d.codigo, titulo:o.titulo||d.titulo, descricao:o.descricao||d.descricao, valor:o.total>0 ? dinheiro(o.total) : d.valor, data:d1||d.data, pags:o.pagamentos.map(function(g){ return {valor:g.valor, origem:g.origem, data:dataIso(g.data, new Date().getFullYear())}; }), aviso:(o.codigo || o.total>0) ? "Li o orçamento"+(o.codigo ? " "+o.codigo : "")+(o.total>0 ? " de "+BK(o.total) : "")+(o.pagamentos.length ? " com "+o.pagamentos.length+" pagamento(s)." : ".")+" Confira e lance." : "Não consegui ler dados neste texto. Preencha à mão."})); };
    var lerArquivo = function(ev){ var arq = ev.target.files && ev.target.files[0]; if(!arq) return; var id = "ffdiv_"+Date.now().toString(36);
      salvarArquivo(id, arq).then(function(){ return lerTextoPdf(arq); }).then(function(txt){ aplicarLeitura(lerOrcamento(txt), {arquivoId:id, arquivoNome:arq.name}); }).catch(function(){ setD(Object.assign({}, d, {arquivoId:id, arquivoNome:arq.name, aviso:"PDF guardado, mas não consegui ler. Preencha código e valor à mão."})); }); };
    var lancar = function(){ var base = {prestId:x.id, data:d.data, valor:num(d.valor), codigo:d.codigo, titulo:d.titulo, descricao:d.descricao, arquivoId:d.arquivoId, arquivoNome:d.arquivoNome};
      if(d.pags && d.pags.length) acao("divida_import", Object.assign(base, {pagamentos:d.pags, socioId:pid})); else acao("divida_add", base);
      setD({data:hojeIso(), valor:"", prazo:"", codigo:"", titulo:"", descricao:"", arquivoId:"", arquivoNome:"", msg:"", pags:[], aviso:""}); setLancDiv(false); };
    var formDivida = e("div",{className:"flex flex-col gap-2 rounded-lg bg-black/25 p-3 ring-1 ring-white/10"},
      e("label",{className:"flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-[#3B82F6]/60 bg-[#3B82F6]/10 px-3 py-2 text-center hover:bg-[#3B82F6]/20", onDragOver:function(ev){ ev.preventDefault(); }, onDrop:function(ev){ ev.preventDefault(); lerArquivo({target:{files:ev.dataTransfer.files}}); }},
        e("span",{className:"text-[14px] font-bold"}, d.arquivoNome ? "📎 "+d.arquivoNome+" · clique para trocar" : "Arraste o PDF da ordem de serviço aqui ou clique para escolher"), e("span",{className:"text-[12px] text-white/65"}, "O sistema guarda o PDF e lê código, data, valor e serviço"), e("input",{type:"file", accept:"application/pdf", className:"hidden", onChange:lerArquivo})),
      e("div",{className:"flex flex-wrap items-end gap-2"}, campo("Ou cole a mensagem do prestador", e("textarea",{value:d.msg||"", rows:3, placeholder:"M2 COMPETITION - 68 GANG PERFORMANCE\nOrçamento: D#…\nTotal: R$ …", className:INPUT+" w-80 text-[12.5px]!", onChange:function(ev){ setD(Object.assign({}, d, {msg:ev.target.value})); }})), e(Btn,{sm:true, disabled:!(d.msg||"").trim(), onClick:function(){ aplicarLeitura(lerOrcamento(d.msg)); }}, "Ler mensagem")),
      d.aviso && e("p",{className:"text-[12.5px] "+(/^Li /.test(d.aviso) ? "text-[#4ade80]" : "text-[#fbbf24]")}, d.aviso),
      e("div",{className:"flex flex-wrap items-end gap-2"}, campo("Código", e("input",{value:d.codigo||"", placeholder:"D#…", className:INPUT+" h-9! w-40", onChange:function(ev){ setD(Object.assign({}, d, {codigo:ev.target.value})); }})), campo("Título", e("input",{value:d.titulo||"", placeholder:"M2 COMPETITION", className:INPUT+" h-9! w-40", onChange:function(ev){ setD(Object.assign({}, d, {titulo:ev.target.value})); }})), campo("Serviço", e("input",{value:d.descricao||"", placeholder:"troca de DRL", className:INPUT+" h-9! w-44", onChange:function(ev){ setD(Object.assign({}, d, {descricao:ev.target.value})); }})),
        campo("Data", e("input",{type:"date", value:d.data, className:INPUT+" h-9! w-36", onChange:function(ev){ setD(Object.assign({}, d, {data:ev.target.value})); }})), campo("Valor", e("input",{value:d.valor, placeholder:"0,00", className:INPUT+" h-9! w-28", onChange:function(ev){ setD(Object.assign({}, d, {valor:ev.target.value.replace(/[^\d,.]/g, "")})); }})),
        e(Btn,{v:"primary", sm:true, disabled:!(num(d.valor)>0), className:"whitespace-nowrap", onClick:lancar}, "Lançar dívida"+(d.pags && d.pags.length ? " + "+d.pags.length+" pgto" : ""))));
    // tabela da dívida
    var linhasDv = [];
    dv.forEach(function(y){ var b = por[y.id], on = fDiv===y.id, quit = b.falta<=0.005, linhaD = e("tr",{key:y.id, onClick:function(){ setFDiv(on ? "" : y.id); }, title:on ? "Mostrar todos os envios" : "Filtrar os envios desta dívida", className:"cursor-pointer border-t border-white/10 hover:bg-white/5 "+(on ? "bg-[#3B82F6]/20" : "")},
        td(edDiv ? inp("c"+y.id, y.codigo||"", "w-36", function(v){ acao("divida_set", {id:y.id, patch:{codigo:v}}); }) : e("b",null, y.codigo || "—"), "whitespace-nowrap"),
        td(edDiv ? inp("s"+y.id, ((y.titulo ? y.titulo+" · " : "")+(y.descricao||"")).replace(/ · $/, ""), "w-44", function(v){ acao("divida_set", {id:y.id, patch:{descricao:v, titulo:""}}); }) : e("span",{title:(y.titulo ? y.titulo+" · " : "")+(y.descricao||"")}, ((y.titulo ? y.titulo+" · " : "")+(y.descricao||"")).replace(/ · $/, "") || "—"), "max-w-[16rem] truncate"),
        td(edDiv ? inp("d"+y.id, y.data, "w-32", function(v){ if(v) acao("divida_set", {id:y.id, patch:{data:v}}); }, "date") : br(y.data), "whitespace-nowrap"),
        td(edDiv ? inp("v"+y.id, dinheiro(y.valor), "w-24 text-right", function(v){ acao("divida_set", {id:y.id, patch:{valor:num(v)}}); }) : BK(y.valor), MONO+" whitespace-nowrap text-right font-bold"),
        td(BK(b.pago), MONO+" whitespace-nowrap text-right"), td(b.falta<-0.005 ? "+"+BK(-b.falta) : BK(Math.max(0, b.falta)), MONO+" whitespace-nowrap text-right", {color:quit ? (b.falta<-0.005 ? ESTADO.alerta : ESTADO.ok) : ESTADO.alerta}),
        td(quit ? chip((b.falta<-0.005 ? "Pago a mais · " : "Quitada · ")+(b.fechouEm ? br(b.fechouEm) : ""), b.falta<-0.005 ? ESTADO.alerta : ESTADO.ok) : chip("Em aberto", ESTADO.alerta), "whitespace-nowrap"),
        td(e("div",{className:"flex items-center justify-end gap-1"}, mini("Copiar", function(){ copiar(y.id); }, "Copiar a mensagem desta dívida para o WhatsApp"), y.arquivoId && mini("PDF", function(){ baixarArquivo(y.arquivoId, y.arquivoNome || "orcamento.pdf").catch(function(){ cx.dispatch({type:"AVISO", txt:"PDF não está neste computador."}); }); }, "Baixar o PDF do orçamento"),
          edDiv && !quit && mini("Fechar", function(){ if(window.confirm("Fechar "+rotDiv(y)+" no valor atual? Faltam "+BK(b.falta)+" e isso passa a ser zero.")) acao("divida_fechar", {id:y.id}); }, "Fechar esta dívida no valor que falta"), edDiv && mini("Excluir", function(){ if(window.confirm("Excluir "+rotDiv(y)+"?")) acao("divida_del", {id:y.id}); }, "Excluir a dívida", "bg-[#ef4444]/25"))));
      linhasDv.push(linhaD);
      descAll.filter(function(z){ return z.divId===y.id; }).forEach(function(z){ linhasDv.push(e("tr",{key:z.id, className:"border-t border-white/5 text-white/80"}, td("↳ "+(z.descricao||"Desconto"), "pl-5", null), td("", ""), td(edDiv ? inp("dd"+z.id, z.data, "w-32", function(v){ if(v) acao("divida_set", {id:z.id, patch:{data:v}}); }, "date") : br(z.data), "whitespace-nowrap"), td("−"+BK(-z.valor), MONO+" whitespace-nowrap text-right", {color:ESTADO.ok}), td("", ""), td("", ""), td("", ""), td(edDiv ? e("div",{className:"flex justify-end"}, mini("Excluir", function(){ acao("divida_del", {id:z.id}); }, "Excluir o desconto", "bg-[#ef4444]/25")) : "", ""))); }); });
    var tabDv = dv.length ? e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full text-[13px]"}, e("thead",null, e("tr",null, th("Código"), th("Serviço"), th("Data"), th("Valor", "right"), th("Pago", "right"), th("Falta", "right"), th("Situação"), th(""))), e("tbody",null, linhasDv))) : e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Nenhuma dívida neste período.");
    var ult = ultimo ? dvAll.find(function(y){ return y.id===ultimo; }) : null;
    var avisoUlt = ult && e("div",{className:"flex flex-wrap items-center gap-3 rounded-lg bg-[#22c55e]/15 px-3 py-2 ring-1 ring-[#22c55e]/40"}, e("span",{className:"text-[13px]"}, "Pix lançado em ", e("b",null, rotDiv(ult)), " · falta ", e("b",{className:MONO}, BK(Math.max(0, por[ult.id].falta)))), e("span",{className:"flex-1"}), e(Btn,{v:"primary", sm:true, onClick:function(){ copiar(ult.id); }}, "Copiar mensagem"), mini("✕", function(){ setUltimo(""); }, "Fechar este aviso"));
    var selDiv = e("select",{value:fDiv, "aria-label":"Filtrar dívida", className:INPUT+" h-8! w-56 cursor-pointer text-[13px]!", onChange:function(ev){ setFDiv(ev.target.value); }}, e("option",{value:""}, "Todas as dívidas"), dvAll.map(function(y){ return e("option",{key:y.id, value:y.id}, rotDiv(y)+(y.codigo && y.descricao ? " · "+y.descricao : "")); }));
    var opcoesDiv = function(sel, onCh, w, auto){ return e("select",{value:sel||"", "aria-label":"Dívida", className:INPUT+" h-8! "+w+" cursor-pointer px-1! text-[13px]!", onClick:function(ev){ ev.stopPropagation(); }, onChange:function(ev){ onCh(ev.target.value); }}, e("option",{value:""}, auto), dvAll.map(function(y){ return e("option",{key:y.id, value:y.id}, rotDiv(y)+" · "+BK(Math.max(0, por[y.id].falta))+" falta"); })); };
    var tabRp = rp.length ? e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full text-[13px]"}, e("thead",null, e("tr",null, th("Data"), th("Dívida"), th("De onde saiu"), th("Forma"), th("Valor", "right"), th(""))), e("tbody",null, rp.map(function(y){ var dl = bxAll.liga[y.id], dd = dl ? dvAll.find(function(k){ return k.id===dl; }) : null, auto = !y.divId;
      return e("tr",{key:y.id, className:"border-t border-white/10"},
        td(edEnv && !y.origemPixLancId ? inp("rd"+y.id, y.data, "w-32", function(v){ if(v) acao("repasse_set", {id:y.id, patch:{data:v}}); }, "date") : br(y.data), "whitespace-nowrap"),
        td(edEnv ? opcoesDiv(y.divId, function(v){ acao("repasse_set", {id:y.id, patch:{divId:v}}); }, "w-44", "Automática") : (dd ? e("span",null, e("b",null, rotDiv(dd)), auto && e("span",{className:"ml-1 text-[11px] text-white/50"}, "auto")) : e("span",{className:"text-white/50"}, "—")), "whitespace-nowrap"),
        td(edEnv && !y.origemPixLancId ? inp("ro"+y.id, y.origem, "w-44", function(v){ acao("repasse_set", {id:y.id, patch:{origem:v}}); }) : y.origem+(y.origemPixLancId ? " (Pix automático)" : ""), "max-w-[16rem] truncate"),
        td(edEnv && !y.origemPixLancId ? e("select",{key:"rf"+y.id, defaultValue:y.forma, className:INPUT+" h-8! w-28 cursor-pointer px-1! text-[13px]!", onChange:function(ev){ acao("repasse_set", {id:y.id, patch:{forma:ev.target.value}}); }}, FORMAS_REPASSE.map(function(k){ return e("option",{key:k, value:k}, k); })) : y.forma, "whitespace-nowrap"),
        td(edEnv && !y.origemPixLancId ? inp("rv"+y.id, dinheiro(y.valor), "w-24 text-right", function(v){ acao("repasse_set", {id:y.id, patch:{valor:num(v)}}); }) : BK(y.valor), MONO+" whitespace-nowrap text-right font-bold"),
        td(edEnv && !y.origemPixLancId ? e("div",{className:"flex justify-end"}, mini("Excluir", function(){ if(window.confirm("Excluir este envio de "+BK(y.valor)+"?")) acao("repasse_del", {id:y.id}); }, "Excluir o envio", "bg-[#ef4444]/25")) : "", "")); })))) : e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Nenhum envio neste período.");
    return e("div",{className:"flex flex-col gap-3"},
      e("div",{className:"flex flex-wrap items-center gap-3"}, e(Btn,{onClick:function(){ setSelId(null); setFDiv(""); setUltimo(""); }}, "← Voltar aos prestadores"), e("h2",{className:"font-heading text-[22px] font-bold text-white"}, x.nome+(x.servico ? " · "+x.servico : "")), chip(info.sit.t, info.sit.c)),
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Resumo "+x.nome+" · "+rotP, dir:"falta "+BK(info.falta)}, grade([linha("Dívida", BK(info.comb)), linha("Enviado (todas as datas)", BK(info.env), ESTADO.ok, Math.round(info.pct)+"%"), linha("Enviado no período", BK(info.noP)), linha("Falta", BK(info.falta), info.falta>1 ? ESTADO.alerta : ESTADO.ok),
        e("div",{key:"dl", className:"flex items-center justify-between gap-3 border-b border-white/10 px-4 py-1"}, e("span",{className:"text-[14px]"}, "Data limite"), p ? prazoInput(p) : null)])),
      avisoUlt,
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Dívida", dir:BK(somaDv)}, e("div",{className:"flex flex-col gap-2 p-3"},
        barraAcoes(e(Btn,{v:"secondary", sm:true, onClick:function(){ setLancDiv(!lancDiv); }}, lancDiv ? "Fechar formulário" : "+ Lançar dívida"), edDiv, setEdDiv), lancDiv && formDivida, tabDv)),
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Enviado", dir:BK(somaRp)}, e("div",{className:"flex flex-col gap-2 p-3"},
        barraAcoes([e("span",{key:"l", className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, "Dívida"), e("span",{key:"s"}, selDiv), fDiv && e(Btn,{key:"c", v:"primary", sm:true, onClick:function(){ copiar(fDiv); }}, "Copiar mensagem")], edEnv, setEdEnv),
        e("div",{className:"flex flex-wrap items-end gap-2 rounded-lg bg-black/25 p-2 ring-1 ring-white/10"}, campo("Data", e("input",{type:"date", value:f.data, className:INPUT+" h-9! w-36", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }})), campo("Valor", e("input",{value:f.valor, placeholder:"0,00", className:INPUT+" h-9! w-28", onChange:function(ev){ setF(Object.assign({}, f, {valor:ev.target.value.replace(/[^\d,.]/g, "")})); }})),
          campo("Dívida", opcoesDiv(f.div, function(v){ setF(Object.assign({}, f, {div:v})); }, "w-52", "Automática (a mais antiga)")),
          campo("Saiu de", e("select",{value:f.conta, className:INPUT+" h-9! w-56 cursor-pointer", onChange:function(ev){ setF(Object.assign({}, f, {conta:ev.target.value})); }}, e("option",{value:""}, "Não informar"), minhasContas.map(function(c){ var n = c.nome.replace(/^Conta\s+/i, ""); return e("option",{key:c.id, value:c.id}, n+(c.banco && n.indexOf(c.banco)<0 ? " ("+c.banco+")" : "")); }), e("option",{value:"dinheiro"}, "Dinheiro"))),
          campo("Forma", e("select",{value:f.forma, className:INPUT+" h-9! w-32 cursor-pointer", onChange:function(ev){ setF(Object.assign({}, f, {forma:ev.target.value})); }}, FORMAS_REPASSE.map(function(k){ return e("option",{key:k, value:k}, k); }))),
          e("label",{className:"flex h-9 cursor-pointer items-center gap-1.5 text-[12.5px]"}, e("input",{type:"checkbox", checked:f.pixRev, className:"size-4", onChange:function(ev){ setF(Object.assign({}, f, {pixRev:ev.target.checked})); }}), "Pix de revendedora"),
          e(Btn,{v:"primary", sm:true, disabled:!(num(f.valor)>0), onClick:enviar, className:"whitespace-nowrap"}, "+ Lançar Pix")),
        tabRp)));
  };
  return e("div",{className:"flex flex-col gap-3"}, topo, NovoForm(), aba==="resumo" ? e(ResumoSocio,{key:pid+"|"+ym, ff:ff, pid:pid, ym:ym, persona:persona, pix:pix, meta:meta, abrir:abrirPrest}) : aba==="cons" ? consolidado() : (selId ? DetalhePrest() : lista()));
}

export { AbaFfSocios };
