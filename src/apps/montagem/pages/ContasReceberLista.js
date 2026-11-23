// Sorelly Admin · montagem — pages/ContasReceberLista.js
// Financeiro › Receber › CONTAS A RECEBER (Marcus, 19/11/2026: "copiar a tela de Contas a pagar igual 100% e fazer um Contas a receber"). É o CLONE de pages/ContasPagarLista.js: UMA TABELA GIGANTE,
// controles numa faixa azul (Visão, Situação, Período, Busca, Colunas), filtro e ordenação no nome de cada coluna, colunas que cada pessoa abre, fecha e reordena, e a mesma coluna Comprovante ("Ver").
// Dados: DevMaster, só leitura (/api/contas-receber/titulos). Cada linha = um título de pagamento da revendedora. "A receber" = acerto - loja que ainda tem saldo (regra do Marcus de 27/10/2026); o resto é "Recebida".
// COMPROVANTE: vem do Atendimento interno (s.lancFin, o que a funcionária anexa); a ligação é feita por domain/comprovantes-receber.js (mesma revendedora, mesmo valor, data até 3 dias, par único).
// A tela antiga (mapa do dinheiro, CNPJs e contas) continua em pages/ContasReceber.js, no endereço /contas-a-receber-resumo.
import { Pagina, Dinheiro } from "@/apps/montagem/components/padrao";
import { abrirAnexo, enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { rotuloDestino, rotuloPrestadorFamilia, nomePropio, rotuloContaCnpj, contaRecebePix, bancoDeConta } from "@/apps/montagem/lib/nome-conta";
import { rotuloLeaf, nomeCurtoLeaf } from "@/apps/montagem/domain/recebimentos-antecipados";
import { blocosChavesPix } from "@/apps/montagem/pages/ChavesPixBancos";
import { contaDaCaixa } from "@/apps/montagem/domain/pix-regras";
import { chavesDoDestino } from "@/apps/montagem/lib/chave-do-destino";
import { mensagemPixDaChave, mensagemPixPessoa } from "@/apps/montagem/lib/mensagem-pix";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { MenuMulti } from "@/apps/montagem/components/padrao-fin";
import { BarraTabela, CelulaBarra, CampoMini, BuscaMini, AvisoMini } from "@/apps/montagem/components/planilha-cheia";
import { SeletorPeriodo, faixaDe, CNPJ_LETRA } from "@/apps/montagem/pages/ContasPagarLista";
import { comprovantesDosRecebidos } from "@/apps/montagem/domain/comprovantes-receber";
import { CASAS_PIX, hojeIso, hojeYm, nomeMes } from "@/apps/montagem/domain/financeiro-familiar";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { createPortal } from "react-dom";
import { e, useEffect, useRef, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(2, 4) : "—"; };
var CNPJ5 = {"34":"Sorelly", "46":"Mayz", "59":"Serenity", "67":"Axis"};   // primeiro nome do CNPJ de cada empresa (Marcus, 20/11/2026): 34 Sorelly (34.753), 46 Mayz (46.873), 59 Serenity (59.146), 67 Axis (67.702, do Lucas)
var cnpjCurto = function(t){ var m = /^CNPJ\s+(\d+)$/.exec(String(t || "").trim()); return m && CNPJ5[m[1]] ? CNPJ5[m[1]] : (t || "—"); };
var bonito2 = function(t){ return String(t).toLowerCase().split(/(\s+|-)/).map(function(w){ return w ? w.charAt(0).toUpperCase()+w.slice(1) : w; }).join("").replace(/\bPj\b/g, "PJ").replace(/ (De|Da|Do|Dos|Das) /g, function(m){ return m.toLowerCase(); }).replace(/\bDevmaster\b/, "DevMaster"); };
var bancoDe = function(t){ var p = String(t || "").split(" - ").map(function(x){ return x.replace(/[-\s]+$/, "").trim(); }).filter(Boolean); if(!p.length || /^acerto/i.test(p[0])) return "—"; if(/^(pix|link|cr[eé]dito|d[eé]bito)$/i.test(p[0]) && p[1]) return bonito2(p[1].replace(/\s+\d+$/, "")); return bonito2(String(t).replace(/^pix\s+/i, "")); };
// DONO da conta de entrada (Marcus, 20/11/2026): CNPJ da Sorelly = 5 primeiros dígitos; pessoa = nome exato; fornecedor/caixa = o nome dele. Nada de grupo genérico ("Família e sócios", "Axis", "Maquininhas P").
var donoDe = function(x){
  var t = String(x.titular || ""), n = limpa(x.forma).toUpperCase();
  if(/^CNPJ\s+\d+$/.test(t)) return cnpjCurto(t);
  if(t==="Axis") return CNPJ5["67"];
  if(t==="Maquininhas P") return "Pontual";
  if(/^PIX\s*-\s*BANHO$/.test(n)) return "Pontual";   // conferido na DevMaster (20/11/2026): a forma PIX - BANHO baixa em CAIXA PIX PONTUAL (504 de 504 em 180 dias); a Ellos tem a forma própria PIX ELLOS BRUTOS
  if(t==="Não pagou" || /^ACERTO/.test(n)) return "—";
  if(t==="Família e sócios"){ if(/MARCO/.test(n)) return /PJ/.test(n) ? "Marco PJ" : "Marco PF"; if(/ANA BEATRIZ/.test(n)) return "Ana Beatriz"; if(/MARCUS/.test(n)) return "Marcus"; if(/LUCAS/.test(n)) return "Lucas"; if(/ANAMARIA/.test(n)) return "Anamaria"; return bonito2(n.replace(/^PIX\s*-?\s*/, "").replace(/\s*-?\s*PF$/, "")); }
  return bonito2(n.replace(/^PIX\s*-?\s*/, "").replace(/\s*-\s*PF$/, "")) || "—";
};
var limpa = function(t){ return String(t || "").replace(/\s+/g, " ").trim(); };
// primeiro e segundo nome ("Lysie Karine Lenciori" → "Lysie Karine"; "Maria da Silva" → "Maria Silva"): coluna Representante curta (Marcus, 21/11/2026)
var doisNomes = function(n){ var w = String(n || "").trim().split(/\s+/).filter(function(x){ return x && !/^(de|da|do|dos|das|e)$/i.test(x); }); return w.length<=2 ? w.join(" ") || "—" : w[0]+" "+w[1]; };
var semAc = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var TEXTO_BUSCA = new WeakMap();   // texto de busca de cada linha, guardado (a busca fica rápida)
// menu suspenso COMPACTO da faixa azul (Marcus, 19/11/2026: "bem mais compacto e menor"): 28 px de altura e largura do texto
var menuMini = function(ops, atual, aoMudar, rotulo){ return e("select",{value:atual, "aria-label":rotulo, onChange:function(ev){ aoMudar(ev.target.value); }, style:{height:"18px", padding:"0 3px", lineHeight:"16px", textAlignLast:"center"}, className:"w-auto min-w-0 rounded border border-white/25 bg-white/10 text-center text-[10px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-primary"}, ops.map(function(o){ return e("option",{key:o[0], value:o[0], className:"bg-card text-foreground"}, o[1]); })); };   // padrao-ok: controles menores a pedido do Marcus (19/11 e 20/11/2026), como o seletor de período
// linha de grupo em AZUL suave (no lugar do preto) e letra branca; o seletor pega só as células da linha de grupo (a única com letra em negrito)
var CLS_FINA = "[&_table_td]:!text-[10px] [&_table_th]:!text-[10px] [&_table_td]:!h-[var(--lh,18px)] [&_table_tbody_tr]:[scroll-snap-align:start] [&_table_td]:!px-[10px] [&_table_th]:!px-[10px] [&_table_th_button]:!px-0 [&_table_th_button]:!gap-0.5 [&_table_th_button]:!tracking-normal [&_table_th_span]:!tracking-normal [&_table_th_button>span]:!hidden [&_table_td]:!py-0 [&_table_td]:!leading-none [&_table_th]:!h-[16px] [&_table_th_button]:!h-[14px] [&_table_th_button]:!py-0 [&_table_th_button]:!leading-none [&_table_th_button]:!text-[10px] [&_table_th_span]:!text-[10px] [&_table_th_span]:!leading-none [&_table_th]:!py-0 [&_table_tr]:!h-[var(--lh,18px)] [&_table_td_button]:!text-[10px] [&_table_td_a]:!text-[10px] [&_.overflow-x-auto]:!cursor-default [&_table_tr]:!cursor-default [&_table_td]:!cursor-default [&_table]:!border-b [&_table]:!border-white/30 [&_tbody_td]:!bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] [&_.overflow-x-auto]:!bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] [&_table_tfoot_td]:!bg-[var(--bloco-titulo)]";   // padrao-ok: tabela com a mesma fonte (9 px), linhas baixas (18 px) e cabeçalho de 16 px da barra de cima, pedido do Marcus (20/11/2026)
// coluna Revendedora travada à esquerda: fundo sem transparência, para o que rola por baixo não aparecer (Marcus, 21/11/2026)
var CLS_TRAVADA = "[&_tbody_td:first-child:not([class*=font-semibold])]:!bg-[#19263d]";
var CLS_GRUPO = "[&_td[class*=font-semibold]]:!bg-[#2f4f8f]/70 [&_td[class*=font-semibold]]:!text-white";
var corCnpj = function(v, l){ var m = /CNPJ (\d+)/.exec(String(v || "")); return e("span",{style:{color:(m && CNPJ_LETRA[m[1]]) || "#E2E8F0"}}, v); };   // só a LETRA muda de cor, igual à Contas a pagar

// meses (AAAA-MM) que o período escolhido cobre; sem período = os meses do ano até hoje. No máximo 36 (os mais recentes).
function mesesDoPeriodo(faixa, hoje){
  var ini = faixa ? faixa[0].slice(0, 7) : hoje.slice(0, 4)+"-01", fim = faixa ? faixa[1].slice(0, 7) : hoje.slice(0, 7), out = [];
  var a = Number(ini.slice(0, 4)), m = Number(ini.slice(5, 7));
  while((String(a)+"-"+String(m).padStart(2, "0"))<=fim && out.length<120){ if(a>=2022) out.push(a+"-"+String(m).padStart(2, "0")); m++; if(m>12){ m = 1; a++; } }
  return out.slice(-36);
}
// abre o comprovante (foto ou PDF guardado em texto) numa aba nova
function abrirComp(c){
  var w = window.open("about:blank", "_blank");
  fetch(c.url).then(function(r){ return r.blob(); }).then(function(b){ var u = URL.createObjectURL(b); if(w) w.location.href = u; else window.open(u, "_blank"); setTimeout(function(){ URL.revokeObjectURL(u); }, 120000); })
    .catch(function(){ if(w) w.close(); window.alert("Não consegui abrir o comprovante."); });
}

// chave estável do título (a mesma do servidor: src/server/cruzamento-pix.js); o id da linha muda a cada leitura da DevMaster
var chaveCz = function(x){ return [x.cod, x.nota, x.parc, x.d, x.forma, x.valor].join("|"); };

function AbaCtaReceber(){
  var cx = use(), s = cx.state;
  var hoje0 = hojeIso(), anoAtual = new Date().getFullYear();
  var sca = useState({}), cache = sca[0], setCache = sca[1], pedidos = useRef({}), ref = useRef({k:"", v:{}});
  var se = useState("recebidas"), escopo = se[0], setEscopo = se[1], sv = useState("lista"), vista = sv[0], setVista = sv[1], sq = useState("n"), quem = sq[0], setQuem = sq[1], sfo = useState("t"), fOrigem = sfo[0], setFOrigem = sfo[1], sfd = useState(String(s.usuario)==="29" ? "f" : "t"), fDest = sfd[0], setFDest = sfd[1];
  var sp = useState({modo:"meses", filtra:true, atras:false, dDe:hojeYm()+"-01", dAte:hoje0, mDe:hojeYm(), mAte:hojeYm(), aDe:anoAtual, aAte:anoAtual}), per = sp[0], setPerRaw = sp[1];
  var sg0 = useState(""), agr = sg0[0], setAgr = sg0[1], sgf = useState({}), grAb = sgf[0], setGrAb = sgf[1], sa = useState(null), aberta = sa[0], setAberta = sa[1], sbt = useState(""), buscaTxt = sbt[0], setBuscaTxt = sbt[1], sbu = useState(""), busca = sbu[0], setBusca = sbu[1];
  var chavePref = "sorelly_cre_colunas_v3_"+(s.usuario || "x");
  var scp = useState(function(){ try{ var g = JSON.parse(localStorage.getItem(chavePref) || "null"); if(g && typeof g==="object") return g; }catch(x){} return {}; }), prefCols = scp[0], setPrefCols = scp[1];
  var porPag = 6000;   // SEM páginas e sem "Mostrar mais" embaixo (Marcus, 21/11/2026): a lista corre inteira, igual à Contas a pagar
  useEffect(function(){ var t = setTimeout(function(){ setBusca(buscaTxt); }, 300); return function(){ clearTimeout(t); }; }, [buscaTxt]);   // eslint-disable-line react-hooks/exhaustive-deps -- espera parar de digitar (0,3 s) antes de procurar
  var setPer = function(mudanca){ setPerRaw(function(o){ return Object.assign({}, o, mudanca); }); };
  // PIX ANTES DO ACERTO (Marcus, 20/11/2026): lançado aqui, mostrado junto com os pagamentos da DevMaster; o acerto o usa como "já pago". Dados no servidor (/api/contas-receber/antecipados).
  var sant = useState({itens:[], destinos:{pessoas:[], contas:[]}, verFf:false, lido:false}), ant = sant[0], setAnt = sant[1], slan = useState(false), lancando = slan[0], setLancando = slan[1], scmp = useState(null), completando = scmp[0], setCompletando = scmp[1];
  var recarregarAnt = function(){ return chamar("GET", "/contas-receber/antecipados").then(function(d){ setAnt(Object.assign({}, d, {lido:true})); }).catch(function(){ setAnt(function(o){ return Object.assign({}, o, {lido:true, falhou:true}); }); }); };
  useEffect(function(){ if(!apiAtiva()) return undefined; recarregarAnt(); var iv = setInterval(recarregarAnt, 30000), foco = function(){ if(!document.hidden) recarregarAnt(); }; document.addEventListener("visibilitychange", foco); return function(){ clearInterval(iv); document.removeEventListener("visibilitychange", foco); }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- lê ao abrir, a cada 30 s e quando a aba volta ao foco: Pix lançado por outra pessoa ou em outra aba aparece sozinho
  var anexarAnt = function(a, arq){ if(!arq) return; lerAnexo(arq).then(function(f){ return enviarAnexo(a.compModulo, f); }).then(function(sv){ return chamar("POST", "/contas-receber/antecipados", {acao:"anexar", id:a.id, key:sv.key, nome:arq.name, tipo:arq.type}); }).then(recarregarAnt).catch(function(x){ window.alert((x && x.message) || "Não consegui anexar o comprovante."); }); };
  // COMPROVANTE DO PAGAMENTO DA DEVMASTER (Marcus, 21/11/2026): botão Anexar na coluna Comp.; o arquivo sobe por /api/anexos e a ligação com a linha fica em /api/contas-receber/comprovantes
  var scm = useState({}), cmap = scm[0], setCmap = scm[1];
  var recarregarCmap = function(){ return chamar("GET", "/contas-receber/comprovantes").then(function(d){ setCmap((d && d.mapa) || {}); }).catch(function(){}); };
  useEffect(function(){ if(apiAtiva()) recarregarCmap(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- lê uma vez ao abrir; depois de anexar lê de novo
  var anexarRec = function(chave, arq){ if(!arq) return; lerAnexo(arq).then(function(f){ return enviarAnexo("contasreceber", f); }).then(function(sv){ return chamar("POST", "/contas-receber/comprovantes", {chave:chave, key:sv.key, nome:arq.name, tipo:arq.type}); }).then(function(d){ setCmap((d && d.mapa) || {}); }).catch(function(x){ window.alert((x && x.message) || "Não consegui anexar o comprovante."); }); };
  var apagarAnt = function(a){ if(!window.confirm("Apagar este Pix lançado antes do acerto? Se ele está na Família, sai de lá também.")) return; chamar("POST", "/contas-receber/antecipados", {acao:"remover", id:a.id}).then(function(){ setAberta(null); return recarregarAnt(); }).catch(function(x){ window.alert((x && x.message) || "Não consegui apagar."); }); };
  var faixa = faixaDe(per), ABERTO = escopo!=="recebidas", PAGO = escopo!=="receber";

  // O QUE LER DA DEVMASTER: "A receber" lê todo o acerto - loja em aberto de uma vez; os outros leem um mês por vez (e o em aberto, se "+ Atrasadas" estiver marcado)
  var chaves = escopo==="receber" ? ["nao"] : mesesDoPeriodo(faixa, hoje0).concat(escopo==="todas" && per.atras ? ["nao"] : []);
  var chavesTxt = chaves.join(",");
  useEffect(function(){
    if(!apiAtiva()) return undefined;
    var vivo = true;
    (function proxima(i){
      if(!vivo || i>=chaves.length) return;
      var k = chaves[i];
      if(pedidos.current[k]){ proxima(i+1); return; }
      pedidos.current[k] = 1; setCache(function(c){ var o = Object.assign({}, c); o[k] = "lendo"; return o; });
      var rota = k==="nao" ? "/contas-receber/titulos?nao=1" : "/contas-receber/titulos?mes="+Number(k.slice(5, 7))+"&ano="+k.slice(0, 4);
      chamar("GET", rota).then(function(d){ setCache(function(c){ var o = Object.assign({}, c); o[k] = d.linhas || []; return o; }); }).catch(function(x){ delete pedidos.current[k]; setCache(function(c){ var o = Object.assign({}, c); o[k] = "erro: "+(x && x.message ? x.message : "falhou"); return o; }); }).then(function(){ proxima(i+1); });
    })(0);
    return function(){ vivo = false; };
  }, [chavesTxt]);   // eslint-disable-line react-hooks/exhaustive-deps
  // CRUZAMENTO COM A FAMÍLIA (Marcus, 21/11/2026): a DevMaster só diz "PIX - MARCUS HESS - PF"; a Família sabe a conta de verdade (Truck Plaza, Higor, Nubank...). O servidor liga cada título de Pix ao Pix da Família (revendedora, valor, data e sócio) e devolve só o nome da conta.
  var scz = useState({mapa:{}, sem:[], verFf:false, pronto:false, atualizando:false, geradoEm:""}), cz = scz[0], setCz = scz[1];
  // o servidor lê a DevMaster desde 2025-01 e GRAVA o resultado (não lê de novo a cada vez): a tela pede o gravado e, enquanto o servidor atualiza, pergunta de novo a cada 5 s
  useEffect(function(){
    if(!apiAtiva()) return undefined;
    var vivo = true, tm = null;
    var ler = function(){ chamar("GET", "/contas-receber/cruzamento").then(function(d){ if(!vivo) return; setCz({mapa:d.mapa || {}, sem:d.semTitulo || [], verFf:!!d.verFf, pronto:!!d.pronto, atualizando:!!d.atualizando, geradoEm:d.geradoEm || ""}); if(d.atualizando || !d.pronto) tm = setTimeout(ler, 5000); }).catch(function(){ if(vivo) tm = setTimeout(ler, 15000); }); };
    ler();
    return function(){ vivo = false; if(tm) clearTimeout(tm); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- lê o cruzamento gravado ao abrir; o servidor o mantém em dia
  if(!apiAtiva()) return e(Pagina,null, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  var lendo = chaves.filter(function(k){ return cache[k]==="lendo" || cache[k]===undefined; }).length, falhou = chaves.filter(function(k){ return typeof cache[k]==="string" && cache[k].indexOf("erro")===0; });

  // LINHAS: junta o que já foi lido (o em aberto só entra se ainda não veio pelo mês: não conta duas vezes)
  var vistos = {}, todas = [];
  var chv = function(x){ return [x.cod, x.nota, x.parc, x.d, x.forma, x.valor, x.saldo].join("|"); };
  chaves.filter(function(k){ return k!=="nao" && Array.isArray(cache[k]); }).concat(chaves.indexOf("nao")>=0 && Array.isArray(cache.nao) ? ["nao"] : []).forEach(function(k){
    cache[k].forEach(function(x){ var c = chv(x); if(k==="nao" && vistos[c]) return; if(k!=="nao") vistos[c] = 1; todas.push(Object.assign({}, x, {rid:k+"|"+x.id, aberto:!!(x.nao && x.saldo>0), cz:cz.mapa[chaveCz(x)]})); }); });
  // UM PAGAMENTO = UMA LINHA (Marcus, 21/11/2026): as parcelas do mesmo pagamento (mesma revendedora, venda, dia e forma) viram uma linha só, com o valor TOTAL; a coluna Parcelas mostra quantas foram (ex.: 4x)
  var gpar = {}, junto = [];
  todas.forEach(function(x){
    if(!x.nota){ junto.push(x); return; }
    var kg = [x.cod, x.nota, x.d, x.forma, x.cz ? x.cz.conta : ""].join("|"), g0 = gpar[kg];
    if(!g0){ g0 = gpar[kg] = Object.assign({}, x, {partes:[x]}); junto.push(g0); return; }
    g0.partes.push(x); if(x.cz && x.cz.certeza==="provavel" && g0.cz && g0.cz.certeza!=="provavel") g0.cz = Object.assign({}, g0.cz, {certeza:"provavel"}); g0.valor = r2(g0.valor+x.valor); g0.saldo = r2(g0.saldo+x.saldo); g0.nao = g0.nao || x.nao; g0.fn = g0.fn || x.fn;
    if(x.aberto){ if(!g0.aberto || (x.venc && x.venc<g0.venc)) g0.venc = x.venc; g0.aberto = true; }
  });
  var baseTit = junto.filter(function(x){ return quem==="t" || !x.fn; });
  var chaveCache = baseTit.length+"|"+(s.lancFin || []).length;
  if(ref.current.k!==chaveCache){ ref.current = {k:chaveCache, v:comprovantesDosRecebidos(baseTit.map(function(x){ return Object.assign({}, x, {id:x.rid}); }), s.lancFin || [], {}).mapa}; }   // o código da linha na tela é o rid (mês + código), igual ao que a ligação devolve
  var comps = ref.current.v;
  // Pix antes do acerto entra como um pagamento já recebido (mesmas colunas); o comprovante dele vem do servidor, não do Atendimento
  var antComoX = function(a){ return {id:"ant|"+a.id, rid:"ant|"+a.id, ant:a, rev:a.rev || (a.tipo==="pedido" ? "Pedido de Pix" : ""), rep:a.repNome || "—", nota:"—", parc:"—", cod:"—", d:a.data, venc:"", valor:a.valor, saldo:0, aberto:false, nao:false, fn:false, grupo:"Pix", forma:"PIX - "+a.conta, titular:a.destino==="socio" ? "Sócio" : "Empresa"}; };
  var famComoX = function(p){ return {id:"fam|"+p.pixId, rid:"fam|"+p.pixId, fam:p, cz:{conta:p.conta, certeza:"semtitulo"}, rev:p.rev || "—", rep:"—", nota:"—", parc:"—", cod:"—", d:p.data, venc:"", valor:p.valor, saldo:0, aberto:false, nao:false, fn:false, grupo:"Pix", forma:"PIX - "+String(p.dono || "").toUpperCase()+" - PF", titular:"Família e sócios"}; };   // Pix lançado na Família que ainda não tem título na DevMaster
  var base = baseTit.concat((ant.itens || []).map(antComoX), (cz.sem || []).map(famComoX));

  var dataBase = function(x){ return x.aberto ? (x.venc || x.d || "") : (x.d || ""); };
  var noMes = function(x){ var d = dataBase(x); if(!faixa) return true; return (d>=faixa[0] && d<=faixa[1]) || (per.atras && x.aberto && !!x.venc && x.venc<hoje0); };
  var buscando = String(busca || "").trim()!=="", termos = semAc(busca).split(/\s+/).filter(Boolean);
  var ehFam = function(x){ return x.ant ? x.ant.destino==="socio" : x.titular==="Família e sócios"; };   // quem recebeu: família (sócios) ou empresa
  var passaOrigem = function(x){ if(x.fam) return fOrigem==="f"; if(fOrigem==="f") return false; return fOrigem==="t" || (fOrigem==="a")===!!x.ant; };   // "Pix só na Família" mostra só os da Família sem título; as outras origens não os mostram
  var ls = base.filter(function(x){ return (escopo==="todas" || x.aberto===(escopo==="receber")) && (buscando || noMes(x)) && passaOrigem(x) && (fDest==="t" || (fDest==="f")===ehFam(x)); });
  if(termos.length) ls = ls.filter(function(x){
    var tx = TEXTO_BUSCA.get(x); if(tx===undefined){ tx = semAc([x.rev, x.rep, x.nota, limpa(x.forma), x.cz ? x.cz.conta : "", x.grupo, x.titular, x.cod, r2(x.valor).toFixed(2).replace(".", ","), r2(x.valor).toLocaleString("pt-BR", {minimumFractionDigits:2}), dm(x.d), dm(x.venc)].join(" ")); TEXTO_BUSCA.set(x, tx); }
    return termos.every(function(t0){ return tx.indexOf(t0)>=0; }); });
  ls = ls.slice().sort(function(a, b){ var p = dataBase(a), q = dataBase(b); return PAGO && !ABERTO ? q.localeCompare(p) || a.rev.localeCompare(b.rev) : (p||"9999").localeCompare(q||"9999") || a.rev.localeCompare(b.rev); });   // recebidas: a mais recente primeiro; a receber: vence primeiro no alto

  var atrasoDe = function(x){ return x.aberto && x.venc && x.venc<hoje0 ? Math.max(1, Math.round((new Date(hoje0+"T00:00:00") - new Date(x.venc+"T00:00:00")) / 86400000)) : 0; };
  var sitDe = function(x){ return x.fam ? "Só na Família" : x.ant ? (x.ant.tipo==="pedido" ? "Aguardando Pix" : x.ant.tipo==="outro" ? "Lançada" : x.ant.uso ? "Usado no acerto" : "Sem acerto") : x.aberto ? (atrasoDe(x)>0 ? "Atrasada · "+atrasoDe(x)+" dias" : "A receber") : x.nao ? "Recebida depois" : "Recebida"; };
  var acertoDe = function(x){ return x.ant ? (x.ant.tipo==="pedido" || x.ant.tipo==="outro" ? "—" : x.ant.uso ? "Usado "+dm((x.ant.uso.em || "").slice(0, 10)) : "Aguardando") : x.fam ? "—" : "Feito"; };   // coluna Acerto: o Pix antes do acerto espera o acerto da revendedora e depois é usado nele
  var contaDm = function(x){ return /^PIX\s*-\s*BANHO$/i.test(limpa(x.forma)) ? "Pontual" : bancoDe(limpa(x.forma)); };   // a forma PIX - BANHO baixa em CAIXA PIX PONTUAL (conferido na DevMaster em 20/11/2026): na coluna Conta vale o nome da empresa, Pontual, igual à coluna CNPJ
  var tituloDm = function(x){ return x.ant || x.fam ? "—" : bonito2(limpa(x.forma)).replace(/\bPf\b/g, "PF").replace(/\s-\s/g, " · "); };   // o nome que a DevMaster usa para este pagamento
  var ehPixFam = function(x){ return !x.ant && !x.fam && x.grupo==="Pix" && x.titular==="Família e sócios" && !/\bPJ\b/i.test(x.forma || ""); };   // Pix para conta de empresa (Itaú PJ do Marco) não é da Família: não entra no cruzamento
  var cruzDe = function(x){ return x.fam ? "Só na Família" : x.ant ? "—" : x.cz ? (x.cz.certeza==="certo" ? "Certo" : x.cz.certeza==="diferenca" ? "Valor diferente" : x.cz.certeza==="outraforma" ? "Outra forma" : "Provável") : ehPixFam(x) ? (cz.pronto ? "Sem par" : "Lendo") : "—"; };
  var difDe = function(x){ return x.cz && x.cz.certeza==="diferenca" ? (x.cz.dif<0 ? "− " : "+ ")+BKC(Math.abs(x.cz.dif)) : "—"; };   // DevMaster menos Família: "− R$ 15,00" = a DevMaster tem R$ 15,00 a menos que o Pix
  var linhas = ls.map(function(x){
    var c = comps[x.rid] || null, ehPix = /pix/i.test(x.forma || ""), ck = [x.cod, x.nota, x.parc, x.d, x.forma, x.valor].join("|");
    return {id:x.rid, it:x, comp:c, ck:ck, sit:sitDe(x), acerto:acertoDe(x), rec:x.aberto ? "—" : dm(x.d), venc:dm(x.venc), nome:x.rev, pagador:x.ant ? (x.ant.tipo==="pedido" ? "—" : (x.ant.pagador || "A própria revendedora")) : "—", valor:x.aberto ? x.saldo : x.valor, orig:x.valor, forma:x.grupo || "—", conta:x.ant ? x.ant.conta : x.cz ? x.cz.conta : contaDm(x), dmtit:tituloDm(x), cruz:cruzDe(x), dife:difDe(x), cnpj:x.ant ? (x.ant.destino==="socio" ? "Sócio" : "Empresa") : donoDe(x), rep:doisNomes(x.rep), repCheio:x.rep, nota:x.nota || "—", parc:x.partes && x.partes.length>1 ? x.partes.length+"x" : (x.parc || "—"),
      compro:x.fam ? "—" : x.ant ? (x.ant.compKey ? "Ver" : "Anexar") : c || cmap[ck] ? "Ver" : (!x.aberto && ehPix) ? "Anexar" : "—", abrir:"Abrir"}; });   // só o Pix do Atendimento interno (representante "Sorelly") tem comprovante lá; o das representantes não passa pelo Atendimento
  var corCruz = function(l){ return l.cruz==="Certo" ? "text-success" : l.cruz==="Lendo" || l.cruz==="—" ? "" : "text-warning"; };   // verde = par certo; amarelo = precisa de olho (provável, valor diferente, sem par)
  var corSit = function(l){ return l.it.fam ? "text-warning" : l.it.ant ? (l.it.ant.tipo==="pedido" ? "text-warning" : l.it.ant.uso ? "text-success" : "") : l.it.aberto ? (atrasoDe(l.it)>0 ? "text-warning" : "") : "text-success"; };
  var corAcerto = function(l){ return l.it.ant && l.it.ant.uso ? "text-success" : ""; };
  var botaoAnexarAnt = function(a){ return e("label",{className:"cursor-pointer underline", title:"Anexar o comprovante (foto ou PDF)", onClick:function(ev){ ev.stopPropagation(); }}, "Anexar", e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Anexar comprovante de "+BKC(a.valor), className:"hidden", onChange:function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; anexarAnt(a, f); }})); };
  var botaoAbrir = function(v, l){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); setAberta(l.it); }, className:"cursor-pointer text-[11px] font-semibold underline hover:text-primary"}, "Abrir"); };
  var verComp = function(v, l){ if(l.it.ant){ var a0 = l.it.ant; return v==="Ver" ? e("button",{type:"button", title:"Abrir o comprovante deste Pix", onClick:function(ev){ ev.stopPropagation(); abrirAnexo(a0.compKey).catch(function(){ window.alert("Não consegui abrir o comprovante."); }); }, className:"cursor-pointer underline"}, "Ver") : botaoAnexarAnt(a0); }
    if(v==="Ver" && !l.comp && cmap[l.ck]) return e("button",{type:"button", title:cmap[l.ck].nome || "Comprovante", onClick:function(ev){ ev.stopPropagation(); abrirAnexo(cmap[l.ck].key).catch(function(){ window.alert("Não consegui abrir o comprovante."); }); }, className:"cursor-pointer underline"}, "Ver");
    if(v==="Anexar") return e("label",{className:"cursor-pointer underline text-warning", title:"Anexar o comprovante (foto ou PDF)", onClick:function(ev){ ev.stopPropagation(); }}, "Anexar", e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Anexar comprovante de "+BKC(l.it.valor), className:"hidden", onChange:function(ev){ var f0 = ev.target.files && ev.target.files[0]; ev.target.value = ""; anexarRec(l.ck, f0); }}));
    if(v==="Ver" && l.comp) return e("button",{type:"button", title:l.comp.nome, onClick:function(ev){ ev.stopPropagation(); abrirComp(l.comp); }, className:"cursor-pointer underline"}, "Ver"); return v==="Falta anexar" ? e("span",{className:"text-warning"}, v) : v; };
  var cols = [{k:"nome", t:"Revendedora", fixa:true, semTopo:true}, {k:"rep", t:"Representante"}, {k:"sit", t:"Situação", cor:corSit}].concat(PAGO ? [{k:"rec", t:"Recebido"}] : [], escopo==="recebidas" ? [] : [{k:"venc", t:"Vence"}], [{k:"valor", t:"Valor", fmt:BKC}],
    escopo==="receber" ? [{k:"orig", t:"Valor original", fmt:BKC}] : [], [{k:"forma", t:"Forma"}, {k:"dmtit", t:"Título DevMaster"}, {k:"conta", t:"Conta"}, {k:"cruz", t:"Cruzamento", cor:corCruz}, {k:"dife", t:"Diferença", cor:corCruz}, {k:"cnpj", t:"CNPJ"}, {k:"compro", t:"Comp.", render:verComp}, {k:"pagador", t:"Pix em nome de"}],
    escopo!=="receber" ? [{k:"acerto", t:"Acerto", cor:corAcerto}] : [], [{k:"nota", t:"Venda"}, {k:"parc", t:"Parcelas"}]);   // ordem: quem atende (Representante), quem pagou (Revendedora), situação e valor, como entrou, cruzamento, comprovante, e por último o acerto
  // COLUNAS DO JEITO DE CADA UM (igual à Contas a pagar): abre/fecha pelo menu "Colunas" e muda a ordem segurando o título; fica neste navegador, por usuário
  var ordenaCols = function(lista){
    var od = prefCols.ordem || [], pos = [], ks = [], out = lista.slice();
    lista.forEach(function(c, ci){ if(!c.fixa && od.indexOf(c.k)>=0){ pos.push(ci); ks.push(c.k); } });
    ks.sort(function(a, b){ return od.indexOf(a)-od.indexOf(b); });
    pos.forEach(function(ci, j){ out[ci] = lista.filter(function(c){ return c.k===ks[j]; })[0]; });
    return out;
  };
  var colsOrdenadas = ordenaCols(cols), ocultas = prefCols.ocultas || [];
  cols = colsOrdenadas.filter(function(c){ return c.fixa || ocultas.indexOf(c.k)<0; });
  var opcoesCols = colsOrdenadas.filter(function(c){ return !c.fixa; });
  var mudaPref = function(novo){ var o = Object.assign({}, prefCols, novo); setPrefCols(o); try{ localStorage.setItem(chavePref, JSON.stringify(o)); }catch(x){} };
  var moverCol = function(de, para){
    if(de===para) return;
    var ks = opcoesCols.map(function(c){ return c.k; }), a = ks.indexOf(de), b = ks.indexOf(para); if(a<0 || b<0) return;
    ks.splice(a, 1); ks.splice(b, 0, de); mudaPref({ordem:ks});
  };
  // TOTAL por dia, mês ou ano (acompanha a aba do período), com uma coluna para cada CNPJ que aparece e o acumulado
  var mesHoje = hoje0.slice(0, 7), anoHoje = hoje0.slice(0, 4), tits = []; ls.forEach(function(x){ if(tits.indexOf(x.titular)<0) tits.push(x.titular); }); tits.sort(function(a, b){ return String(a).localeCompare(String(b), "pt-BR"); });
  var totaisPor = function(chaveDe, rotuloDe, sitDe2){ var gr = {}; ls.forEach(function(x){ var k = chaveDe(x); (gr[k] = gr[k] || []).push(x); });
    var ks = Object.keys(gr).filter(function(k){ return k; }).sort(); if(gr[""]) ks.push(""); var acum = 0;
    return ks.map(function(k){ var its = gr[k], tot = r2(its.reduce(function(t, x){ return t+(x.aberto ? x.saldo : x.valor); }, 0)), tudo = its.every(function(x){ return !x.aberto; }); acum = r2(acum+tot);
      var o = {id:"d"+k, dia:k ? rotuloDe(k) : "Sem data", qtd:its.length, total:tot, acum:acum, sit:tudo ? "Recebido" : !k ? "Sem data" : sitDe2(k)};
      tits.forEach(function(t, i){ o["t"+i] = r2(its.filter(function(x){ return x.titular===t; }).reduce(function(t0, x){ return t0+(x.aberto ? x.saldo : x.valor); }, 0)); }); return o; }); };
  var linhasDia = per.modo==="anos" ? totaisPor(function(x){ return dataBase(x).slice(0, 4); }, function(k){ return k; }, function(k){ return k<anoHoje ? "Atrasadas" : k===anoHoje ? "Ano atual" : "A vencer"; })
    : per.modo==="meses" ? totaisPor(function(x){ return dataBase(x).slice(0, 7); }, function(k){ return nomeMes(k); }, function(k){ return k<mesHoje ? "Atrasadas" : k===mesHoje ? "Mês atual" : "A vencer"; })
    : totaisPor(dataBase, dm, function(k){ return k<hoje0 ? "Atrasadas" : k===hoje0 ? "Hoje" : "A vencer"; });
  var corDia = function(l){ return l.sit.indexOf("Atrasadas")===0 ? "text-warning" : l.sit==="Recebido" ? "text-success" : ""; };
  var colsDia = [{k:"dia", t:per.modo==="anos" ? "Ano" : per.modo==="meses" ? "Mês" : escopo==="recebidas" ? "Recebido" : escopo==="receber" ? "Vence" : "Data", cor:corDia}, {k:"sit", t:"Situação", cor:corDia}, {k:"qtd", t:"Pagamentos"}]
    .concat(tits.map(function(t, i){ return {k:"t"+i, t:t || "Sem titular", fmt:BKC}; }), [{k:"total", t:"Total", fmt:BKC}, {k:"acum", t:"Acumulado", fmt:BKC}]);
  var resumoGr = {}; if(agr) linhas.forEach(function(l){ var k = l[agr], g1 = resumoGr[k] || (resumoGr[k] = {n:0, tot:0, orig:0, np:0}); g1.n++; g1.tot += l.valor; g1.orig += l.orig; if(l.it.aberto) g1.np++; });   // total de cada grupo com TODAS as linhas (o grupo fechado só mostra uma)

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-4 -mb-4 -mt-4 md:-mx-6 md:-mb-6 md:-mt-6 [&>section]:!rounded-none [&>section]:!border-l-[4px] [&>section]:!border-t-0 [&>section]:!border-r-[4px] [&>section]:!border-b-[4px]"},
    aberta && createPortal(e(Ficha,{key:aberta.rid, x:aberta, c:comps[aberta.rid] || null, sit:sitDe(aberta), fechar:function(){ setAberta(null); },
      compNode:aberta.ant ? (aberta.ant.compKey ? e("button",{type:"button", onClick:function(){ abrirAnexo(aberta.ant.compKey).catch(function(){ window.alert("Não consegui abrir o comprovante."); }); }, className:"cursor-pointer underline hover:bg-white/10"}, "Ver") : botaoAnexarAnt(aberta.ant)) : null,
      completar:aberta.ant && aberta.ant.tipo==="pedido" && aberta.ant.pedidoDest ? function(){ setCompletando(aberta.ant); setAberta(null); } : null,
      apagar:aberta.ant && aberta.ant.fonte==="rcb" && !aberta.ant.uso ? function(){ apagarAnt(aberta.ant); } : null}), document.body),
    completando && e(LancarPix,{key:"c"+completando.id, pedido:completando, destinos:ant.destinos, verFf:ant.verFf, fechar:function(){ setCompletando(null); }, depois:recarregarAnt, aoLancar:function(nome){ setEscopo("todas"); setBuscaTxt(nome); setBusca(nome); }}),
    lancando && e(LancarPix,{destinos:ant.destinos, verFf:ant.verFf, fechar:function(){ setLancando(false); }, depois:recarregarAnt, aoLancar:function(nome){ setEscopo("todas"); setBuscaTxt(nome); setBusca(nome); }}),
    e(BlocoPainel,{titulo:escopo==="receber" ? "Contas a receber" : escopo==="recebidas" ? "Contas recebidas" : "Contas a receber e recebidas", compacto:true},
      // BARRA EM FORMA DE TABELA, IGUAL À CONTAS A PAGAR (Marcus, 21/11/2026): cada controle numa célula com o título em cima; Buscar à esquerda (peças de components/planilha-cheia.js)
      e(BarraTabela,null,
        e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{larg:"w-44", valor:buscaTxt, aoMudar:setBuscaTxt, ph:"Nome, valor...", rotulo:"Buscar nas contas"})),
        e(CelulaBarra,{rotulo:"Situação"}, e(CampoMini,{valor:escopo, aoMudar:function(k){ setEscopo(k); setPer({atras:k==="receber"}); }, rotulo:"Situação", ops:[["receber", "A receber"], ["recebidas", "Recebidas"], ["todas", "Todas"]]})),
        e(CelulaBarra,{rotulo:"Período"}, e(SeletorPeriodo,{anoAtual:anoAtual, anos:[], carr:{}, per:per, setPer:setPer, comAtraso:escopo==="todas"})),
        e(CelulaBarra,{rotulo:"Visão"}, e(CampoMini,{valor:vista, aoMudar:setVista, rotulo:"Visão", ops:[["lista", "Separado"], ["dia", "Total"]]})),
        vista==="lista" && e(CelulaBarra,{rotulo:"Agrupar"}, e(CampoMini,{valor:agr, aoMudar:function(k){ setAgr(k); setGrAb({}); }, rotulo:"Agrupar", ops:[["", "Sem agrupar"], ["repCheio", "Por representante"], ["nome", "Por revendedora"]]})),
        e(CelulaBarra,{rotulo:"Quem"}, e(CampoMini,{valor:quem, aoMudar:setQuem, rotulo:"Quem", ops:[["n", "Sem funcionárias"], ["t", "Com funcionárias"]]})),
        e(CelulaBarra,{rotulo:"Origem"}, e(CampoMini,{valor:fOrigem, aoMudar:setFOrigem, rotulo:"Origem", ops:[["t", "Todas as origens"], ["a", "Lançadas aqui"], ["d", "DevMaster"]].concat(cz.verFf ? [["f", "Pix só na Família"]] : [])})),
        e(CelulaBarra,{rotulo:"Quem recebeu"}, e(CampoMini,{valor:fDest, aoMudar:setFDest, rotulo:"Quem recebeu", ops:[["t", "Empresa e família"], ["e", "Só empresa"], ["f", "Só família"]]})),
        vista==="lista" && e(CelulaBarra,{rotulo:"Colunas"}, e(MenuMulti,{cls:"w-20 [&>button]:h-[18px] [&>button]:px-1", rodape:{rotulo:"Voltar ao padrão", onClick:function(){ mudaPref({ordem:[], ocultas:[]}); }}, opcoes:opcoesCols.map(function(c){ return [c.k, c.t]; }), valor:opcoesCols.filter(function(c){ return ocultas.indexOf(c.k)<0; }).map(function(c){ return c.k; }), onChange:function(lista){ mudaPref({ocultas:opcoesCols.map(function(c){ return c.k; }).filter(function(k){ return lista.indexOf(k)<0; })}); }, plural:"colunas", vazio:"Nenhuma coluna"})),
        e("div",{role:"button", tabIndex:0, title:"Lançar um recebimento (empresa ou família)", onClick:function(){ setLancando(true); }, onKeyDown:function(ev){ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); setLancando(true); } }, className:"ml-auto flex min-w-[130px] flex-1 cursor-pointer items-center justify-center bg-[#E8B84B] px-3 text-[11px] font-semibold text-[#1a1306] outline-none hover:brightness-110 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white"}, "+ Lançar recebimento"),   // padrao-ok: botão da barra compacta (10 px), igual aos outros controles da barra
        cz.atualizando && e(CelulaBarra,{rotulo:"Cruzamento"}, e(AvisoMini,null, "Atualizando…")),
        lendo>0 && e(CelulaBarra,{rotulo:"Leitura"}, e(AvisoMini,null, "Lendo a DevMaster… "+lendo+(lendo===1 ? " mês" : " meses"))),
        falhou.length>0 && e(CelulaBarra,{rotulo:"Erro"}, e(AvisoMini,{erro:true}, "Não consegui ler "+falhou.length+(falhou.length===1 ? " mês." : " meses.")+" Mude o período e volte."))),
      vista!=="lista" ? e(TabelaPlanilha,{key:escopo+vista, cols:colsDia, linhas:linhasDia, chave:"id", grade:true, semContagem:true, vazio:"Nenhum pagamento."})
        : e("div",{ref:function(el){ if(el){ var ajusta = function(){ var sc = el.querySelector(".overflow-x-auto"); if(!sc) return; var t = sc.getBoundingClientRect().top; var th0 = sc.querySelector("thead th"), hh = th0 ? th0.getBoundingClientRect().height : 18, av = Math.max(120, window.innerHeight-t-4), n = Math.max(3, Math.floor((av-hh)/18)), lh = (av-hh)/n; el.style.setProperty("--lh", lh.toFixed(3)+"px"); sc.style.height = (av-1)+"px"; sc.style.maxHeight = (av-1)+"px"; sc.style.scrollSnapType = "y mandatory"; sc.style.scrollPaddingTop = hh+"px"; }; ajusta(); setTimeout(ajusta, 150); if(!el.__aj){ el.__aj = ajusta; window.addEventListener("resize", function(){ if(el.__aj) el.__aj(); }); } else el.__aj = ajusta; var b = [].slice.call(el.querySelectorAll("th button")).filter(function(x){ return x.textContent.trim().toLowerCase().indexOf("comp.")===0; })[0]; if(b) b.title = "Comprovante"; } }, className:"flex min-h-0 flex-1 flex-col "+(agr ? CLS_GRUPO+" " : "")+CLS_TRAVADA+" "+CLS_FINA}, e(TabelaPlanilha, Object.assign({key:escopo+agr, fina:true, cols:cols, aoClicar:function(l){ setAberta(l.it); }, aoMoverColuna:moverCol, alturaMax:"calc(100vh - 6.6rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, maozinha:true, vazio:lendo>0 ? "Lendo a DevMaster…" : "Nenhum pagamento neste filtro."},
          agr ? {agrupar:agr, faixaFina:true, limite:porPag, grupoAberto:function(v){ return buscando || !!grAb[v]; }, aoGrupo:function(v){ var o = Object.assign({}, grAb); o[v] = !grAb[v]; setGrAb(o); },
              grupoEsquerda:true, linhaGrupo:function(v){ var g0 = resumoGr[v] || {n:0, tot:0, orig:0, np:0}, ks = cols.map(function(c){ return c.k; }), iv = ks.indexOf("valor"), span = iv>0 ? iv : cols.length;
                var rot = ((buscando || grAb[v]) ? "▾ " : "▸ ")+(v || "Sem nome")+" · "+g0.n+(g0.n===1 ? " pagamento" : " pagamentos")+(g0.np ? " · "+g0.np+" a receber" : "");
                if(span===cols.length) return {span:span, rotulo:rot+" · "+BKC(r2(g0.tot))};
                return {span:span, rotulo:rot, resto:cols.slice(span).map(function(c){ return c.k==="valor" ? BKC(r2(g0.tot)) : c.k==="orig" ? BKC(r2(g0.orig)) : ""; })}; }}
            : {limite:porPag})))));
}

// FICHA do pagamento (botão Abrir): só leitura, com o comprovante do Atendimento quando existe
function Ficha(p){
  var x = p.x, c = p.c;
  // MESMO TOM DA JANELA "Lançar recebimento" (Marcus, 21/11/2026): fundo azul escuro, barras azuis do sistema, linhas finas, letra de 11 px, tudo centralizado e compacto
  var AZF = "var(--bloco-titulo)", FUNDOF = "#1b3463";
  // A VENDA DO PAGAMENTO (Marcus, 21/11/2026): qualquer pagamento abre a venda da revendedora: valor de venda, valor do acerto (soma de TODOS os pagamentos, pagos e em aberto), valor pago e cada pagamento da venda; o clicado vem em destaque e cartão/link mostram as parcelas
  var sv = useState(null), vdd = sv[0], setVdd = sv[1], sg = useState({}), abGr = sg[0], setAbGr = sg[1];
  useEffect(function(){
    if(x.ant || x.fam || !x.nota || !x.cod) return undefined;
    var vivo = true;
    chamar("GET", "/contas-receber/venda?cod="+encodeURIComponent(x.cod)+"&nota="+encodeURIComponent(x.nota)+"&data="+encodeURIComponent(x.d || "")).then(function(d){ if(vivo) setVdd(d); }).catch(function(){ if(vivo) setVdd({erro:true}); });
    return function(){ vivo = false; };
  }, [x.rid]);   // eslint-disable-line react-hooks/exhaustive-deps -- lê de novo só quando abre outro pagamento
  var faixaF = function(t){ return e("div",{key:"f"+t, className:"flex items-center justify-center px-2 text-[11px] font-semibold text-white", style:{height:"18px", background:AZF}}, t); };   // padrao-ok: barra de seção de 18 px, igual à janela Lançar recebimento
  var linhaF = function(t, v, cls){ return e("div",{key:t, className:"grid grid-cols-[8rem_1fr] items-stretch border-b border-white/25 text-center text-[11px] "+(cls || ""), style:{minHeight:"18px"}}, e("span",{className:"flex items-center justify-center px-1 font-semibold"}, t), e("span",{className:"flex items-center justify-center border-l border-white/25 px-1 leading-tight"}, v)); };
  // TÍTULO EM CIMA, VALOR EMBAIXO (Marcus, 21/11/2026: "não dá pra saber o que é do quê"): cada dado tem a sua coluna, com o título numa faixa azul
  var tabF = function(cols, tpl){ return e("div",{className:"grid border-b border-white/25 text-center text-[11px]", style:{gridTemplateColumns:tpl}},
    cols.map(function(c0, i){ return e("div",{key:"h"+c0[0], className:"flex items-center justify-center px-1 font-semibold", style:{background:AZF, minHeight:"16px"}}, c0[0]); }).concat(
      cols.map(function(c0, i){ return e("div",{key:"v"+c0[0], className:"flex items-center justify-center px-1 leading-tight "+(i>0 ? "border-l border-white/25" : ""), style:{minHeight:"18px"}}, c0[1]); }))); };   // padrao-ok: título de 16 px e valor de 18 px, letra de 11 px
  var parF = function(a, b){ return e("div",{key:a[0], className:"grid grid-cols-[6.5rem_1fr_6.5rem_1fr] items-stretch border-b border-white/25 text-center text-[11px]", style:{minHeight:"18px"}},
    e("span",{className:"flex items-center justify-center px-1 font-semibold"}, a[0]), e("span",{className:"flex items-center justify-center border-l border-white/25 px-1 leading-tight"}, a[1]),
    b ? e("span",{className:"flex items-center justify-center border-l border-white/25 px-1 font-semibold"}, b[0]) : e("span",{className:"border-l border-white/25"}), b ? e("span",{className:"flex items-center justify-center border-l border-white/25 px-1 leading-tight"}, b[1]) : e("span",{className:"border-l border-white/25"})); };   // padrao-ok: linha de 18 px e letra de 11 px, dois campos por linha   // padrao-ok: linha de 18 px e letra de 11 px
  var tit = (vdd && vdd.titulos) || [], grs = [], gi0 = {};
  tit.forEach(function(t){ var k = limpa(t.forma), g = gi0[k]; if(!g){ g = gi0[k] = {forma:k, grupo:t.grupo, itens:[], valor:0, saldo:0}; grs.push(g); } g.itens.push(t); g.valor = r2(g.valor+t.valor); g.saldo = r2(g.saldo+t.saldo); });
  var totAcerto = r2(grs.reduce(function(t, g){ return t+g.valor; }, 0)), totFalta = r2(grs.reduce(function(t, g){ return t+g.saldo; }, 0)), totPago = r2(totAcerto-totFalta), minha = limpa(x.forma);
  var blocoVenda = x.ant || x.fam ? null : e("div",{className:"flex flex-col"},
    faixaF("Venda "+(x.nota || "—")),
    !vdd ? e("div",{className:"py-1 text-center text-[11px]"}, "Lendo a venda…") : vdd.erro ? e("div",{className:"py-1 text-center text-[11px] text-warning"}, "Não consegui ler a venda.") : [
      e("div",{key:"res", className:"grid grid-cols-3 border-b border-white/25 text-center"},
        [["Valor de venda", vdd.venda ? BKC(vdd.venda.venda) : "—"], ["Valor do acerto", BKC(totAcerto)], ["Valor pago", BKC(totPago)]].map(function(c0, ci){ return e("div",{key:c0[0], className:"flex flex-col py-0.5 "+(ci>0 ? "border-l border-white/25" : "")}, e("span",{className:"text-[11px] font-semibold"}, c0[0]), e("span",{className:"text-[11px]"}, c0[1])); })),
      totFalta>0 && linhaF("Falta pagar", e("span",{className:"text-warning"}, BKC(totFalta)), "border-b"),
      faixaF("Pagamentos desta venda"),
      grs.map(function(g){
        var meu = g.forma===minha, aberto0 = abGr[g.forma]!==undefined ? abGr[g.forma] : meu, varias = g.itens.length>1;
        return e("div",{key:g.forma, className:"flex flex-col border-b border-white/25 "+(meu ? "bg-white/15" : "")},
          e("button",{type:"button", onClick:function(){ var o = Object.assign({}, abGr); o[g.forma] = !aberto0; setAbGr(o); }, "aria-expanded":aberto0, className:"flex cursor-pointer items-stretch pl-2 text-left text-[11px] hover:bg-white/10", style:{minHeight:"18px"}},
            e("span",{className:"flex-1 py-px"}, (aberto0 ? "▾ " : "▸ ")+g.grupo+" · "+bancoDe(g.forma)+(varias ? " · "+g.itens.length+"x" : "")+(meu ? " · este pagamento" : "")),
            e("span",{className:"flex w-24 items-center justify-center self-stretch border-l border-white/25 font-semibold "+(g.saldo>0 ? "text-warning" : "text-success")}, BKC(g.valor))),
          aberto0 && g.itens.map(function(t, ti){ return e("div",{key:t.parc, className:"grid grid-cols-[1fr_6rem_6rem_6rem] items-stretch border-t border-white/25 text-center text-[11px]", style:{minHeight:"18px"}}, e("span",{className:"flex items-center justify-center"}, "Parcela "+(ti+1)+" de "+g.itens.length), e("span",{className:"flex items-center justify-center border-l border-white/25"}, "vence "+dm(t.venc)), e("span",{className:"flex items-center justify-center border-l border-white/25"}, BKC(t.valor)), e("span",{className:"flex items-center justify-center border-l border-white/25 "+(t.saldo>0 ? "text-warning" : "text-success")}, t.saldo>0 ? "a receber" : "recebida")); }));
      })]);
  return e("div",{role:"dialog", "aria-modal":"true", "aria-label":"Pagamento", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }, className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"},
    e("div",{className:"flex max-h-[90vh] w-full max-w-xl flex-col overflow-auto rounded-md border-2 text-center text-white shadow-xl [&>*:last-child]:!border-b-0", style:{background:FUNDOF, borderColor:"#ffffff"}},
      e("div",{className:"relative flex items-center justify-center border-b border-white/40 px-2", style:{background:AZF, height:"22px"}}, e("b",{className:"text-[11px]"}, x.rev), e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"absolute right-1 rounded px-1 text-[11px] font-semibold underline hover:bg-white/20 active:bg-white/30"}, "Fechar")),   // padrao-ok: título de 11 px e botão de 11 px
      blocoVenda,
      faixaF("Informações"),
      tabF([["Situação", p.sit], ["Valor", BKC(x.aberto ? x.saldo : x.valor)]].concat(x.aberto ? [["Valor original", BKC(x.valor)]] : [], [["Emissão", dm(x.d)], ["Vence", dm(x.venc)], ["Forma", x.grupo || "—"]]), "repeat("+(x.aberto ? 6 : 5)+", 1fr)"),
      tabF([["Parcelas", x.partes && x.partes.length>1 ? x.partes.length+"x" : (x.parc || "—")], ["CNPJ", x.titular || "—"], ["Código", x.cod || "—"], ["Representante", x.rep || "—"], ["Venda", x.nota || "—"]], "4rem 6rem 4.5rem 1fr 6rem"),
      tabF([["Conta de entrada", limpa(x.forma) || "—"], ["Comprovante", p.compNode ? p.compNode : c ? e("button",{type:"button", onClick:function(){ abrirComp(c); }, className:"cursor-pointer underline hover:bg-white/10"}, "Ver") : "—"]], "1fr 8rem"),
      x.ant && linhaF("Acerto", x.ant.tipo==="pedido" ? "Aguardando o Pix da revendedora (pedido enviado)" : x.ant.tipo==="outro" ? "Outro recebimento (não entra em acerto)" : x.ant.uso ? "Usado no acerto de "+(x.ant.uso.rev || "uma revendedora")+" em "+dm((x.ant.uso.em || "").slice(0, 10)) : "Aguardando o acerto"),
      x.ant && x.ant.tipo!=="pedido" && linhaF("Pix em nome de", x.ant.pagador || "A própria revendedora"),
      x.ant && x.ant.repNome && linhaF("Acerto de", x.ant.repNome==="Sorelly" ? "Atendimento interno" : "Representante "+x.ant.repNome),
      x.ant && x.ant.por && linhaF("Lançado por", x.ant.por),
      x.cz && x.cz.certeza!=="semtitulo" && linhaF("Conta (Família)", x.cz.conta),
      x.cz && x.cz.certeza!=="semtitulo" && linhaF("Cruzamento", (x.cz.certeza==="certo" ? "Certo" : x.cz.certeza==="diferenca" ? "Valor diferente" : x.cz.certeza==="outraforma" ? "Outra forma" : "Provável")+" · Pix de "+dm(x.cz.data)+" na Família"),
      x.cz && x.cz.certeza==="diferenca" && linhaF("Valor na Família", BKC(x.cz.valorPix)),
      x.cz && x.cz.certeza==="diferenca" && linhaF("Diferença", x.cz.dif<0 ? "A DevMaster tem "+BKC(Math.abs(x.cz.dif))+" a menos" : "A DevMaster tem "+BKC(Math.abs(x.cz.dif))+" a mais"),
      x.cz && x.cz.motivo && linhaF("Motivo do par", x.cz.motivo),
      x.fam && linhaF("Conta (Família)", x.fam.conta),
      x.fam && linhaF("Situação do Pix", "Sem título na DevMaster"),
      p.completar && e("div",{className:"flex justify-center pt-1"}, e("button",{type:"button", onClick:p.completar, className:"cursor-pointer rounded border border-white/60 bg-[#3f6bb8] px-3 text-[11px] font-semibold text-white hover:brightness-125"}, "Completar pedido")),   // padrao-ok: botão de 11 px da ficha
      p.apagar && e("div",{className:"flex justify-center pt-1"}, e("button",{type:"button", onClick:p.apagar, className:"cursor-pointer rounded border border-white/40 px-3 text-[11px] font-semibold text-warning hover:bg-white/10"}, "Apagar lançamento"))));
}

// JANELA "Lançar recebimento" (botão da barra de Contas a receber). Toda em AZUL (Marcus, 20/11/2026: "sem preto, só azul escuro e um pouco azul mais claro, tudo centralizado e fonte menor"):
// fundo azul escuro (FUNDO), barras, campos e botões no azul do sistema (--bloco-titulo, o da barra de filtros), botão principal num azul um pouco mais claro. Letra branca de 10 px, tudo centralizado.
// Três partes: QUEM PAGOU (revendedora ativa da DevMaster e em nome de quem veio o Pix), PARA ONDE FOI (de quem é a conta paga e a conta que recebeu) e o PAGAMENTO.
// A revendedora é sempre escolhida da lista de ATIVAS (nunca digitada); o acerto dela (atendimento interno ou representante) vem do cadastro. Sócio também grava na Família (uma vez só, no servidor).
// Lista de escolha da janela (no lugar do menu nativo do navegador): abre sempre PARA BAIXO, linha fina entre as opções, azul do sistema; com mais de 10 opções ganha uma busca.
function CaixaEscolha(p){
  var so = useState(false), aberto = so[0], setAberto = so[1], sb = useState(""), busca = sb[0], setBusca = sb[1], ref = useRef(null);
  useEffect(function(){
    if(!aberto) return undefined;
    var fora = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setAberto(false); };
    var esc = function(ev){ if(ev.key==="Escape"){ ev.stopPropagation(); setAberto(false); } };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc, true);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc, true); };
  }, [aberto]);   // eslint-disable-line react-hooks/exhaustive-deps -- setAberto não muda
  var atual = p.ops.filter(function(o){ return o[0]===p.valor; })[0];
  var termos = semAc(busca).split(/\s+/).filter(Boolean);
  var vis = p.ops.filter(function(o){ var n = semAc(o[1]+" "+(o[2] || "")); return termos.every(function(x){ return n.indexOf(x)>=0; }); });
  var escolhe = function(v){ p.aoMudar(v); setAberto(false); setBusca(""); };
  return e("div",{ref:ref, className:"relative w-full"},
    e("button",{type:"button", "aria-label":p.rot, "aria-haspopup":"listbox", "aria-expanded":aberto, onClick:function(){ setAberto(!aberto); setBusca(""); }, className:p.cls+" relative flex items-center justify-center", style:p.estilo}, atual ? atual[1] : p.vazio, e("span",{"aria-hidden":true, className:"absolute right-1.5"}, aberto ? "▴" : "▾")),
    aberto && e("div",{role:"listbox", className:"absolute left-0 right-0 z-20 overflow-hidden rounded border border-white/40 text-white shadow-lg", style:{top:"24px", background:p.fundo}},
      p.ops.length>10 && e("input",{value:busca, autoFocus:true, "aria-label":"Buscar na lista", placeholder:"Buscar", className:p.campoCls, style:{height:"20px", lineHeight:"18px", borderRadius:0, textAlign:"left"}, onChange:function(ev){ setBusca(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter" && vis.length) escolhe(vis[0][0]); }}),
      e("div",{className:"overflow-y-auto", style:{maxHeight:"170px"}},
        vis.map(function(o, i){ var cab = o[2] && (i===0 || vis[i-1][2]!==o[2]) ? e("div",{key:"g"+o[2], className:"flex items-center px-1.5 text-[11px] font-semibold text-white", style:{height:"17px", background:"var(--bloco-titulo)"}}, o[2]) : null; return [cab, e("button",{type:"button", key:String(o[0]), role:"option", "aria-selected":o[0]===p.valor, onClick:function(){ escolhe(o[0]); }, className:"flex w-full items-center justify-start border-b border-white/15 px-1.5 text-left text-[11px] hover:bg-[var(--bloco-titulo)] active:brightness-125 "+(o[0]===p.valor ? "bg-[#3f6bb8]" : ""), style:{height:"17px"}}, o[1])]; }),   // padrao-ok: linha de 20 px com letra de 11 px, janela compacta
        !vis.length && e("div",{className:"flex items-center justify-start px-1.5 text-[11px]", style:{height:"17px"}}, "Nada encontrado"))));   // padrao-ok: aviso de 11 px
}

// Menu da conta que recebeu, por NÍVEIS: clicou em Empresa, some tudo e aparece só CNPJ e Fornecedor / Prestador; clicou num deles, aparece só a lista dele. "Voltar" sobe um nível. Letra normal, sem setinhas, abre para baixo, com busca.
function CaixaArvore(p){
  var so = useState(false), aberto = so[0], setAberto = so[1], sb = useState(""), busca = sb[0], setBusca = sb[1], sc = useState([]), caminho = sc[0], setCaminho = sc[1], ref = useRef(null);
  useEffect(function(){
    if(!aberto) return undefined;
    var fora = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setAberto(false); };
    var esc = function(ev){ if(ev.key==="Escape"){ ev.stopPropagation(); setAberto(false); } };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc, true);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc, true); };
  }, [aberto]);   // eslint-disable-line react-hooks/exhaustive-deps -- setAberto não muda
  var folhas = [];
  var anda = function(nos, trilha){ nos.forEach(function(n){ var t2 = trilha.concat([n.t]); (n.itens || []).forEach(function(it){ folhas.push({id:it[0], t:it[1], cheio:it[2] || it[1], trilha:t2}); }); if(n.filhos) anda(n.filhos, t2); }); };
  anda(p.arvore, []);
  var atual = folhas.filter(function(x){ return x.id===p.valor; })[0];
  var termos = semAc(busca).split(/\s+/).filter(Boolean);
  var achados = termos.length ? folhas.filter(function(x){ var n = semAc(x.t+" "+x.trilha.join(" ")); return termos.every(function(y){ return n.indexOf(y)>=0; }); }) : null;
  var escolhe = function(id){ p.aoMudar(id); setAberto(false); setBusca(""); };
  // o que mostrar agora: desce pelo caminho até o nível atual
  var nos = p.arvore, itens = [];
  caminho.forEach(function(titulo){ var n = nos.filter(function(x){ return x.t===titulo; })[0]; if(n){ nos = n.filhos || []; itens = n.itens || []; } else { nos = []; itens = []; } });
  var LINHA = "flex w-full items-center border-b border-white/15 last:border-b-0 px-2 text-left text-[13px] hover:bg-[var(--bloco-titulo)] active:brightness-125 ";   // padrao-ok: letra de 12 px na lista da janela (Marcus: "aumenta um pouco")
  var ALTURA = {height:"26px", scrollSnapAlign:"start"};
  var CAIXA = {maxHeight:"210px", scrollSnapType:"y mandatory"};   // 8 linhas de 26 px + a borda: nunca sobra meia linha
  var sa = useState(false), acima = sa[0], setAcima = sa[1];   // sem lugar embaixo (tela baixa), a lista abre PARA CIMA em vez de ficar cortada
  var abrir = function(){ if(!aberto){ setCaminho(atual ? atual.trilha : []); if(ref.current) setAcima(ref.current.getBoundingClientRect().bottom+260>window.innerHeight); } setAberto(!aberto); setBusca(""); };
  var lista = achados
    ? [e("div",{key:"cxb", className:"m-1 overflow-y-auto rounded border border-white/40", style:CAIXA}, achados.length ? achados.map(function(x){ return e("button",{type:"button", key:"b"+x.id, role:"option", onClick:function(){ escolhe(x.id); }, className:LINHA+"justify-between", style:ALTURA}, e("span",null, x.t), e("span",{className:"text-white/70"}, x.trilha.join(" › "))); }) : e("div",{className:"flex items-center px-2 text-[12px]", style:ALTURA}, "Nada encontrado"))]   // padrao-ok: letra de 12 px
    : [].concat(
        caminho.length ? [e("button",{type:"button", key:"voltar", onClick:function(){ setCaminho(caminho.slice(0, -1)); }, className:LINHA+"font-semibold", style:ALTURA}, "Voltar")] : [],
        [e("div",{key:"caixa", className:"m-1 overflow-y-auto rounded border border-white/40", style:CAIXA}, [].concat(nos.map(function(n){ return e("button",{type:"button", key:"n"+n.t, onClick:function(){ setCaminho(caminho.concat([n.t])); }, className:LINHA, style:ALTURA}, n.t); }),
        itens.map(function(it){ var sel = it[0]===p.valor; return e("button",{type:"button", key:"f"+it[0], role:"option", "aria-selected":sel, onClick:function(){ escolhe(it[0]); }, className:LINHA+(sel ? "bg-[#3f6bb8]" : ""), style:ALTURA}, it[1]); })))]);
  return e("div",{ref:ref, className:"relative w-full"},
    e("button",{type:"button", "aria-label":p.rot, "aria-haspopup":"listbox", "aria-expanded":aberto, onClick:abrir, className:p.cls+" relative flex items-center justify-center", style:p.estilo}, atual ? atual.cheio : p.vazio),
    aberto && e("div",{role:"listbox", className:"absolute left-0 right-0 z-20 overflow-hidden rounded border border-white/40 text-white shadow-lg", style:acima ? {bottom:"24px", background:p.fundo} : {top:"24px", background:p.fundo}},
      e("div",null, lista)));
}

function LancarPix(p){
  var hoje = hojeIso(), cx = use(), cpd = (cx.state.cp && cx.state.cp.destinos) || [];
  var LIB_NOME = {rotuloDestino:rotuloDestino, rotuloPrestadorFamilia:rotuloPrestadorFamilia, nomePropio:nomePropio};
  var nomeLeaf = function(d){ return rotuloLeaf(d, cpd, LIB_NOME, ""); };   // o mesmo nome do Direcionar e da tabela: dono na frente, bolinha no lugar do traço   // CNPJ com o número; os outros só o nome
  var porTipo = function(tps){ var r = []; tps.forEach(function(tp){ cpd.filter(function(d){ return d.ativo!==false && d.tipo===tp; }).forEach(function(d){ r.push([d.id, nomeLeaf(d)]); }); }); return r; };
  var contasDoCnpj = function(d){ var sc = cx.state.saldosContas || {}; return (sc.contas || []).filter(function(c){ return c.bloco===d.cnpjId && !c.bloqueada && c.tipo!=="CAIXA" && contaRecebePix(c.nome); }); };   // as contas do CNPJ vêm dos blocos de saldos, como no Direcionar
  var noCnpj = function(d){ var cs = contasDoCnpj(d); return {t:rotuloDestino(d, ""), itens:cs.length ? cs.map(function(c){ return [d.id+"|"+c.nome, rotuloContaCnpj(c.nome, d.cnpjId), rotuloDestino(d, c.nome)]; }) : [[d.id, rotuloDestino(d, ""), rotuloDestino(d, "")]]}; };
  var ehFam = function(id){ var d0 = cpd.find(function(d){ return d.id===String(id).split("|")[0]; }); return !!d0 && d0.tipo==="FAMILIA"; };   // escolheu uma conta PF de sócio (o texto depois da barra é o id da conta, não o nome)
  var daFamilia = function(d){ return d.tipo==="PRESTADOR" && !!d.personaId; };   // prestador ligado a um sócio no Direcionar = prestador da família
  // A LISTA "Conta que recebeu" VEM DA ABA PAGAMENTOS › CHAVES PIX (Marcus, 23/11/2026: "tem todas as chaves Pix lá alinhadas"): fornecedores e prestadores, representantes e funcionárias saem da MESMA montagem da aba, e a chave da mensagem é a que está lá.
  var chv = blocosChavesPix(cx.state, cx.dispatch, "", false), folhas = {}, chvConta = {};
  chv.cnpjs.forEach(function(b){ b.rows.forEach(function(r){ chvConta[r.id] = r; }); });   // conta bancária de CNPJ → a linha dela na aba Chaves Pix (pelo código da conta, igual à aba)
  var itensChv = function(blocos, pref, rotulo){ var out = []; blocos.forEach(function(b){ b.rows.forEach(function(r){ var id = "x|"+pref+"|"+r.id, rot = rotulo(r); folhas[id] = {row:r, label:rot, pref:pref}; out.push([id, r.c2, rot]); }); }); return out; };
  var itensForn = itensChv(chv.forn, "forn", function(r){ return "Sorelly · "+r.c2; }), itensRep = itensChv(chv.rep, "rep", function(r){ return "Representante · "+r.c2; });
  var nosFunc = chv.func.map(function(b){ return {t:b.nome, itens:itensChv([b], "func", function(r){ return "Funcionário · "+r.c2; })}; });
  // Sócio: PRIMEIRO as contas PF dele (Nubank, Caixa...), cada uma grava a conta e cai na caixa dela na Família; EMBAIXO os prestadores. Sem conta cadastrada (ou sem acesso à Família) fica "Conta pessoal" (Marcus, 21/11/2026)
  var proprias = (p.destinos && p.destinos.proprias) || [];
  var socios = cpd.filter(function(s){ return s.ativo!==false && s.tipo==="FAMILIA"; }).map(function(s){ var cs = proprias.filter(function(c){ return c.personaId===s.personaId; }), its = cs.length ? cs.map(function(c){ return [s.id+"|"+c.id, bancoDeConta(c.banco || c.nome) || nomePropio(c.banco) || c.nome, rotuloLeaf(s, cpd, LIB_NOME, c.banco || c.nome)]; }) : [[s.id, "Conta pessoal", nomeLeaf(s)]]; cpd.filter(function(d){ return d.ativo!==false && daFamilia(d) && d.personaId===s.personaId; }).forEach(function(d){ its.push([d.id, nomeCurtoLeaf(d, cpd, LIB_NOME), nomeLeaf(d)]); }); return {t:nomePropio(s.nome), itens:its}; });
  var arvore = [{t:"Empresa", filhos:[{t:"CNPJ", filhos:cpd.filter(function(d){ return d.ativo!==false && d.tipo==="CNPJ"; }).map(noCnpj)}, {t:"Fornecedor / Prestador", itens:itensForn}, {t:"Representante", itens:itensRep}, {t:"Funcionário", filhos:nosFunc}]}, {t:"Sócios", filhos:socios}];   // as contas são as do Direcionar (cp.destinos)
  // MODO PEDIDO (Marcus, 23/11/2026): o Lucas manda a conta à representante ANTES de o Pix existir; só a conta é obrigatória e o lançamento fica "Aguardando Pix". Depois, na ficha, "Completar pedido" abre esta janela já na conta escolhida, com revendedora, valor, data e comprovante.
  var ped = p.pedido || null, destInicial = ped && ped.pedidoDest ? (ped.pedidoDest.leaf || ped.pedidoDest.destinoId+(ped.pedidoDest.contaNome ? "|"+ped.pedidoDest.contaNome : ped.pedidoDest.contaId ? "|"+ped.pedidoDest.contaId : "")) : "";
  var smo = useState(ped ? "recebido" : "pedido"), modo = smo[0], setModo = smo[1], pedidoModo = modo==="pedido";
  var sf = useState({data:hoje, valor:"", rev:null, tipo:"antes", outro:false, pagador:"", destId:destInicial, casa:"", arq:null}), f = sf[0], setF0 = sf[1], sm = useState(""), msg = sm[0], setMsg = sm[1], ss = useState(false), salvando = ss[0], setSalvando = ss[1];
  var sl = useState({itens:null, erro:false}), lista = sl[0], setLista = sl[1], sq = useState(""), q = sq[0], setQ = sq[1];
  var setF = function(o){ setF0(function(a){ return Object.assign({}, a, o); }); };
  // a lista de revendedoras fecha ao clicar fora do campo ou ao apertar Esc (Marcus, 23/11/2026); volta a abrir ao digitar
  var sla = useState(true), listaAberta = sla[0], setListaAberta = sla[1], refRev = useRef(null);
  useEffect(function(){
    if(!listaAberta) return undefined;
    var fora = function(ev){ if(refRev.current && !refRev.current.contains(ev.target)) setListaAberta(false); };
    var esc = function(ev){ if(ev.key==="Escape" && refRev.current && refRev.current.contains(document.activeElement)){ ev.stopPropagation(); setListaAberta(false); } };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc, true);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc, true); };
  }, [listaAberta]);   // eslint-disable-line react-hooks/exhaustive-deps -- setListaAberta não muda
  useEffect(function(){ var vivo = true; chamar("GET", "/contas-receber/revendedoras").then(function(d){ if(vivo) setLista({itens:d.itens || [], erro:false}); }).catch(function(){ if(vivo) setLista({itens:null, erro:true}); }); return function(){ vivo = false; }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- lê a lista uma vez ao abrir a janela
  var AZ = "var(--bloco-titulo)", FUNDO = "#1b3463", CLARO = "#3f6bb8";   // azul do sistema, azul escuro do fundo e azul um pouco mais claro do botão principal
  var CAMPO = "w-full rounded border border-white/30 bg-[var(--bloco-titulo)] px-1.5 text-center text-[11px] text-white outline-none placeholder:text-white/70 focus-visible:ring-1 focus-visible:ring-white [color-scheme:dark]";   // padrao-ok: janela compacta, letra de 11 px (pedido do Marcus, 20/11/2026), igual à barra de filtros
  var BTN = "rounded border border-white/40 bg-[var(--bloco-titulo)] px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60";   // padrao-ok: botão da janela
  var BTN_AZ = "rounded border border-white/60 bg-[#3f6bb8] px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60";   // padrao-ok: botão principal da janela
  var ALTO = {height:"22px", lineHeight:"20px"};   // padrao-ok: 22 px, pedido do Marcus (20/11/2026: "fonte menor")
  var campo = function(rot, no, cls){ return e("label",{className:"flex flex-col items-center gap-0.5 text-center "+(cls || "")}, e("span",{className:"text-[11px] font-semibold leading-none text-white"}, rot), no); };   // padrao-ok: rótulo de 11 px
  var BLOCO = "mx-1.5 mt-1.5 rounded-md border-2 border-white/40";   // cada parte da janela é um bloco com a sua borda
  var faixa = function(t){ return e("div",{className:"flex items-center justify-center rounded-t-[4px] px-2 text-[11px] font-semibold text-white", style:{height:"18px", background:AZ}}, t); };   // padrao-ok: barra de seção de 18 px
  var repRotulo = function(r){ return !r ? "" : r==="Sorelly" ? "Sorelly" : "Rep. "+r; };
  // revendedora: digita parte do nome ou o código e escolhe na lista (sem acento, várias palavras em qualquer ordem)
  var termos = semAc(q).split(/\s+/).filter(Boolean);
  var achadas = (lista.itens && termos.length) ? lista.itens.filter(function(x){ var n = semAc(x.nome+" "+x.cod); return termos.every(function(t){ return n.indexOf(t)>=0; }); }).slice(0, 8) : [];
  var escolher = function(x){ setF({rev:x}); setQ(""); setMsg(""); };
  var campoRev = f.rev
    ? e("div",{className:"flex w-full flex-wrap items-center justify-center gap-x-2 rounded border border-white/30 px-1.5 py-0.5 text-center text-[11px] text-white", style:{background:AZ, minHeight:"22px", lineHeight:"14px"}}, e("b",null, f.rev.nome), e("button",{type:"button", disabled:salvando, onClick:function(){ setF({rev:null}); }, className:"font-semibold underline hover:brightness-150"}, "Trocar"))   // padrao-ok: letra de 11 px da janela
    : e("div",{ref:refRev, className:"relative w-full"},
        e("input",{value:q, autoFocus:true, disabled:lista.itens===null, "aria-label":"Revendedora", placeholder:lista.erro ? "Não consegui ler as revendedoras" : lista.itens===null ? "Lendo as revendedoras ativas" : "Digite o nome ou o código e escolha", className:CAMPO+" block", style:ALTO, onChange:function(ev){ setQ(ev.target.value); setListaAberta(true); }, onFocus:function(){ setListaAberta(true); }, onKeyDown:function(ev){ if(ev.key==="Enter" && achadas.length) escolher(achadas[0]); }}),
        termos.length>0 && listaAberta && e("div",{role:"listbox", className:"absolute left-0 top-[24px] z-30 max-h-[260px] w-[32rem] max-w-[80vw] overflow-y-auto rounded-md border-2 border-white/60 text-white shadow-lg", style:{background:FUNDO}},
          achadas.length ? [e("div",{key:"cab", className:"sticky top-0 z-10 grid h-5 w-full grid-cols-[3fr_2fr] border-b border-white/40 text-center text-[11px] text-white", style:{background:AZ}}, e("span",{className:"flex items-center justify-center border-r border-white/40"}, "Revendedora"), e("span",{className:"flex items-center justify-center"}, "Representante"))].concat(achadas.map(function(x){ return e("button",{type:"button", key:x.cod, role:"option", onClick:function(){ escolher(x); }, style:{minHeight:"22px"}, className:"grid w-full grid-cols-[3fr_2fr] items-stretch border-b border-white/40 text-center text-[11px] leading-tight last:border-b-0 hover:bg-[var(--bloco-titulo)] active:brightness-125"}, e("span",{className:"flex items-center justify-center border-r border-white/40 px-2 py-1"}, x.nome), e("span",{className:"flex items-center justify-center px-2 py-1 text-white/60"}, x.representante==="Sorelly" ? "Sorelly" : String(x.representante || "").split(/\s+/).filter(function(w){ return w!=="-"; }).slice(0, 2).join(" "))); }))   // padrao-ok: letra de 11 px da janela
            : e("div",{className:"flex items-center justify-start px-1.5 text-[11px]", style:{height:"17px"}}, "Nenhuma revendedora ativa com esse nome")));   // padrao-ok: letra de 11 px da janela
  // fornecedor, representante e funcionária da aba Chaves Pix: se existe um destino do Direcionar com o mesmo nome, vai o id dele (o servidor trata como antes); se não, vai só o nome (recebimento da empresa)
  var destinoDeFolha = function(fol0){ var pw = function(x){ return semAc(x).split(/[^a-z0-9]+/).filter(function(w){ return w.length>2; }); }, a = pw(fol0.row.c2); return cpd.find(function(d){ if(d.ativo===false || ["FORNECEDOR", "PRESTADOR", "REPRESENTANTE"].indexOf(d.tipo)<0) return false; var b2 = pw(d.nome); return a.length>0 && b2.length>0 && (a.every(function(w){ return b2.indexOf(w)>=0; }) || b2.every(function(w){ return a.indexOf(w)>=0; })); }) || null; };
  var alvoDe = function(){ var fol0 = folhas[f.destId]; if(fol0){ var dd = destinoDeFolha(fol0); return {destinoId:dd ? dd.id : "", contaNome:"", contaId:"", semDestino:!dd, destinoNome:fol0.label, leaf:f.destId}; } return {destinoId:String(f.destId).split("|")[0], contaNome:ehFam(f.destId) ? "" : (String(f.destId).split("|")[1] || ""), contaId:ehFam(f.destId) ? (String(f.destId).split("|")[1] || "") : "", semDestino:false, destinoNome:"", leaf:f.destId}; };
  var enviar = function(){
    if(salvando) return;
    var alvo = alvoDe();
    if(pedidoModo){
      if(!f.destId){ setMsg("Escolha a conta que recebeu."); return; }
      setSalvando(true); setMsg("");
      chamar("POST", "/contas-receber/antecipados", {acao:"lancar", tipo:"pedido", cod:f.rev ? f.rev.cod : "", destinoId:alvo.destinoId, contaNome:alvo.contaNome, contaId:alvo.contaId, semDestino:alvo.semDestino, destinoNome:alvo.destinoNome, leaf:alvo.leaf, casa:ehFam(f.destId) ? f.casa : ""})
        .then(function(){ return p.depois(); }).then(function(){ p.aoLancar(f.rev ? f.rev.nome : ""); p.fechar(); })
        .catch(function(x){ setSalvando(false); setMsg((x && x.message) || "Não consegui lançar o pedido."); });
      return;
    }
    if(!f.rev){ setMsg("Escolha a revendedora na lista."); return; }
    if(f.outro && f.pagador.trim().length<3){ setMsg("Escreva o nome de quem fez o Pix."); return; }
    if(!(Number(f.valor)>0)){ setMsg("Informe o valor do Pix."); return; }
    if(!f.destId){ setMsg("Escolha a conta que recebeu."); return; }
    setSalvando(true); setMsg("");
    var pre = f.arq ? lerAnexo(f.arq).then(function(a){ return enviarAnexo("contasreceber", a); }) : Promise.resolve(null);
    pre.then(function(sv){ return chamar("POST", "/contas-receber/antecipados", {acao:ped ? "completar" : "lancar", id:ped ? ped.id : "", data:f.data, valor:Number(f.valor), cod:f.rev.cod, tipo:f.tipo, pagador:f.outro ? f.pagador.trim() : "", destinoId:alvo.destinoId, contaNome:alvo.contaNome, contaId:alvo.contaId, semDestino:alvo.semDestino, destinoNome:alvo.destinoNome, leaf:alvo.leaf, casa:ehFam(f.destId) ? f.casa : "", key:sv ? sv.key : "", nome:f.arq ? f.arq.name : "", compTipo:f.arq ? f.arq.type : ""}); })
      .then(function(){ return p.depois(); }).then(function(){ p.aoLancar(f.rev.nome); p.fechar(); })
      .catch(function(x){ setSalvando(false); setMsg((x && x.message) || "Não consegui lançar o Pix."); });
  };
  var sel = function(rot, valor, aoMudar, ops, vazio){ return campo(rot, e(CaixaEscolha,{rot:rot, valor:valor, ops:ops, vazio:vazio || "Escolha", aoMudar:aoMudar, cls:CAMPO, estilo:ALTO, fundo:FUNDO, campoCls:CAMPO}), "w-full"); };
  // BLOCO 4 · MENSAGEM PARA A REVENDEDORA (Marcus, 23/11/2026): ao escolher a conta que recebeu (Point, outro fornecedor, prestador, conta da empresa), abre embaixo o que o Lucas manda à revendedora:
  // o texto "Escrever na folha" (rótulo da conta no Direcionar) e a mensagem pronta com a chave Pix (a mesma do botão Copiar das Chaves Pix). Tudo lido do cadastro na hora; nada é digitado de novo.
  var idDest = String(f.destId || "").split("|")[0], nomeConta = String(f.destId || "").split("|")[1] || "";
  var destSel = f.destId ? cpd.find(function(d){ return d.id===idDest; }) : null, orient = null;
  var fol = f.destId ? folhas[f.destId] : null;
  if(fol){   // conta que veio da aba Chaves Pix: a chave é a da linha dela
    var rr = fol.row, dadosR = {nome:rr.c2, banco:rr.banco, favorecido:rr.fav, tipo:rr.tipo};
    orient = {folha:fol.label, chave:rr.chave || "", dados:dadosR, msg:rr.chave ? (mensagemPixDaChave(cx.state, rr.chave) || mensagemPixPessoa(Object.assign({}, dadosR, {chave:rr.chave}))) : ""};
    orient.texto = orient.msg ? "Escrever na folha: *"+orient.folha+"*"+"\n\n"+orient.msg : "";
  } else if(destSel && destSel.tipo!=="FAMILIA"){
    var ks = chavesDoDestino(cx.state, destSel), pal = function(t){ return semAc(t).split(/[^a-z0-9]+/).filter(Boolean); }, wn = pal(nomeConta);
    // conta de CNPJ: só vale a chave da PRÓPRIA conta escolhida (todas as palavras do nome dela no rótulo da chave); nunca a chave de outra conta
    // conta de CNPJ: a chave é a da linha dessa conta na aba Chaves Pix (achada pelo CÓDIGO da conta, nunca por parte do nome)
    var ctaSel = destSel.cnpjId && nomeConta ? (((cx.state.saldosContas || {}).contas) || []).find(function(c){ return c.bloco===destSel.cnpjId && c.nome===nomeConta; }) : null, rowC = ctaSel ? chvConta[ctaSel.id] : null;
    var k1 = (rowC && rowC.chave) ? {folha:((contaDaCaixa(cx.state.px, ctaSel.id) || {}).label) || ("PIX - "+String(ctaSel.nome).toUpperCase()), banco:rowC.c2, fav:rowC.fav, chave:rowC.chave, tipo:rowC.tipo} : (destSel.cnpjId && wn.length) ? (ks.filter(function(k){ var wf = pal(k.folha); return wn.every(function(w){ return wf.indexOf(w)>=0; }); })[0] || null) : (destSel.cnpjId && ks.length>1) ? null : ks[0];
    var dadosK = k1 ? {nome:destSel.nome, banco:k1.banco, favorecido:k1.fav, tipo:k1.tipo} : null;
    orient = {folha:(k1 && k1.folha) || nomeLeaf(destSel), chave:k1 ? k1.chave : "", dados:dadosK, msg:k1 ? (mensagemPixDaChave(cx.state, k1.chave) || mensagemPixPessoa(Object.assign({}, dadosK, {chave:k1.chave}))) : ""};
    orient.texto = orient.msg ? "Escrever na folha: *"+orient.folha+"*\n\n"+orient.msg : "";   // o texto da folha vai no INÍCIO da mensagem que o Lucas copia (Marcus, 23/11/2026)
  }
  // JANELA LATERAL (Marcus, 23/11/2026: "faz no mesmo estilo do Contas a pagar, mais lateral"): o mesmo desenho da janela Pagar conta: à esquerda os blocos 1 a 3;
  // à direita o painel "O que vai acontecer", com a mensagem para a revendedora (o que o Lucas copia e manda no WhatsApp); botões no rodapé.
  var sco = useState(0), copiado = sco[0], setCopiado = sco[1];
  var copiarMsg = function(){ var txt = orient ? orient.texto : ""; if(!txt) return; var fim = function(v){ setCopiado(v); setTimeout(function(){ setCopiado(0); }, 1800); }; var antigo = function(){ var ta = document.createElement("textarea"), certo = false; ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.focus(); ta.select(); try { certo = document.execCommand("copy"); } catch(x){} document.body.removeChild(ta); fim(certo ? 1 : 2); }; try { navigator.clipboard.writeText(txt).then(function(){ fim(1); }, antigo); } catch(x){ antigo(); } };
  var Lr = function(rot, val){ return e("div",{key:rot, className:"flex justify-between gap-2 border-b border-white/15 py-0.5 text-[11px]"}, e("span",null, rot), e("b",{className:"text-right"}, val || "—")); };   // padrao-ok: linha de 11 px do resumo
  var contaTxt = !f.destId ? "" : orient ? orient.folha : destSel ? nomeLeaf(destSel) : "";
  var valorOk = Number(f.valor)>0;
  var esq = e("div",{className:"pb-1"},
    !ped && e("div",{className:"mx-1.5 mt-1.5 grid grid-cols-2 gap-1"}, [["pedido", "Pedido de Pix"], ["recebido", "Pix recebido"]].map(function(o){ return e("button",{key:o[0], type:"button", disabled:salvando, onClick:function(){ setModo(o[0]); setMsg(""); }, style:ALTO, className:modo===o[0] ? BTN_AZ : BTN}, o[1]); })),
    e("div",{className:BLOCO}, faixa(pedidoModo ? "1 · Revendedora (se já souber)" : "1 · Quem pagou"),
      e("div",{className:"flex flex-col items-center gap-1 p-2"},
        e("div",{className:pedidoModo ? "grid w-full grid-cols-1 items-start gap-1" : "grid w-full grid-cols-2 items-start gap-1"},
          campo(pedidoModo ? "Revendedora (opcional, só as ativas)" : "Revendedora (só as ativas)", campoRev, "w-full"),
          !pedidoModo && sel("Pix em nome de", f.outro ? "outro" : "propria", function(v){ setF({outro:v==="outro", pagador:v==="outro" ? f.pagador : ""}); }, [["propria", "A própria revendedora"], ["outro", "Outra pessoa"]])),
        f.outro && !pedidoModo && campo("Nome de quem fez o Pix", e("input",{value:f.pagador, "aria-label":"Nome de quem fez o Pix", placeholder:"Ex.: João, pai dela", className:CAMPO, style:ALTO, onChange:function(ev){ setF({pagador:ev.target.value}); }}), "w-full"))),
    e("div",{className:BLOCO}, faixa("2 · Para onde foi"),
      e("div",{className:"grid w-full grid-cols-2 items-start gap-1 p-2"},
        campo("Conta que recebeu", ped ? e("div",{className:CAMPO+" flex items-center justify-center", style:{minHeight:"22px", lineHeight:"14px"}}, ped.conta || contaTxt) : e(CaixaArvore,{rot:"Conta que recebeu", valor:f.destId, arvore:arvore, vazio:"Escolha a conta", aoMudar:function(v){ setF({destId:v}); }, cls:CAMPO, estilo:ALTO, fundo:FUNDO, campoCls:CAMPO}), "w-full"),
        ehFam(f.destId) ? campo("Para qual casa?", e("select",{value:f.casa, "aria-label":"Para qual casa", className:CAMPO, style:ALTO, onChange:function(ev){ setF({casa:ev.target.value}); }}, e("option",{value:""}, "Sem casa (pessoal)"), CASAS_PIX.map(function(k){ return e("option",{key:k[0], value:k[0]}, k[1]); })), "w-full") : e("div",null))),
    !pedidoModo && e("div",{className:BLOCO}, faixa("3 · Pagamento"),
      e("div",{className:"grid w-full grid-cols-2 gap-1 p-2"},
        campo("Data do Pix", e("input",{type:"date", value:f.data, max:hoje, "aria-label":"Data do Pix", className:CAMPO, style:ALTO, onChange:function(ev){ setF({data:ev.target.value}); }}), "w-full"),
        campo("Valor", e(Dinheiro,{value:f.valor, out:"ponto", label:"Valor do Pix", className:"w-full h-[22px]! rounded! border-white/30! bg-[var(--bloco-titulo)]! text-center text-[11px]! text-white!", onChange:function(v){ setF({valor:v}); }}), "w-full"),   // padrao-ok: campo de valor de 22 px
        sel("Tipo", f.tipo, function(v){ setF({tipo:v}); }, [["antes", "Antes do acerto"], ["outro", "Outro recebimento"]]),
        campo("Comprovante (opcional)", e("label",{className:"flex w-full cursor-pointer items-center justify-center rounded border border-white/30 px-1.5 text-center text-[11px] text-white hover:brightness-125 active:brightness-90", style:Object.assign({background:AZ}, ALTO)}, f.arq ? f.arq.name : "Escolher foto ou PDF", e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Comprovante", className:"hidden", onChange:function(ev){ var a = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(a) setF({arq:a}); }})), "w-full"))));   // padrao-ok: letra de 11 px da janela
  var dir = e("div",{className:"flex flex-col border-l border-white/15 bg-[#223f74] px-2.5 py-2"},
    e("div",{className:"pb-1 text-center text-[11px] font-semibold"}, "O que vai acontecer"),   // padrao-ok: título de 11 px
    Lr("Revendedora", f.rev ? f.rev.nome : (pedidoModo ? "Ainda não sabe" : "")), f.rev && Lr("Representante", repRotulo(f.rev.representante)), !pedidoModo && Lr("Pix em nome de", f.outro ? f.pagador.trim() : (f.rev ? "A própria revendedora" : "")), Lr("Conta que recebeu", contaTxt), !pedidoModo && Lr("Valor", valorOk ? BKC(Number(f.valor)) : ""), !pedidoModo && Lr("Data", f.data ? dm(f.data) : ""),
    Lr("Situação", pedidoModo ? "Aguardando Pix" : f.arq ? "Com comprovante" : "Pendente: falta o comprovante"),
    e("div",{className:"pt-2 text-center text-[11px] font-semibold"}, "Mensagem para pagamento"),   // padrao-ok: título de 11 px
    !orient && e("p",{className:"pt-1 text-center text-[11px]"}, "Escolha a conta que recebeu para ver a mensagem com a chave Pix."),   // padrao-ok: aviso de 11 px
    orient && (orient.texto ? e("textarea",{readOnly:true, rows:12, value:orient.texto, "aria-label":"Mensagem para pagamento", onFocus:function(ev){ ev.target.select(); }, className:CAMPO+" mt-1 resize-none py-1 text-left leading-tight"}) : e("p",{className:"pt-1 text-center text-[11px] font-semibold text-warning"}, (destSel && destSel.cnpjId && ks && ks.length>1 && !wn.length) ? "Escolha a conta do banco em Conta que recebeu (Sicredi, Itaú...)." : "Este destino ainda não tem chave Pix cadastrada.")),   // padrao-ok: letra de 11 px da janela
    orient && orient.texto && e("div",{className:"flex justify-center pt-1"}, e("button",{type:"button", onClick:copiarMsg, style:ALTO, className:BTN+" min-w-24"}, copiado===1 ? "Copiado ✓" : copiado===2 ? "Não copiou" : "Copiar mensagem")));
  return createPortal(e("div",{role:"dialog", "aria-modal":"true", "aria-label":"Lançar recebimento", onMouseDown:function(ev){ if(ev.target===ev.currentTarget && !salvando) p.fechar(); }, className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"},
    e("div",{className:"flex max-h-[92vh] w-full max-w-5xl flex-col rounded-lg border-2 pb-1.5 text-center text-white shadow-xl", style:{background:FUNDO, borderColor:AZ}},
      e("div",{className:"relative flex items-center justify-center rounded-t-md px-2 py-1 text-white", style:{background:AZ}}, e("b",{className:"text-[11px]"}, ped ? "Completar pedido" : pedidoModo ? "Pedido de Pix" : "Lançar recebimento"), e("button",{type:"button", "aria-label":"Fechar", disabled:salvando, onClick:p.fechar, className:"absolute right-1 rounded px-1 text-[11px] font-semibold underline hover:bg-white/20 active:bg-white/30"}, "Fechar")),   // padrao-ok: título de 11 px e botão de 11 px
      e("div",{className:"grid", style:{gridTemplateColumns:"1.6fr 1fr"}}, esq, dir),   // sem rolagem aqui: ela cortava a lista da conta que recebeu
      e("div",{className:"flex flex-wrap items-center gap-1.5 border-t border-white/15 px-3 py-1.5"},
        msg && e("span",{role:"alert", className:"text-[11px] font-semibold text-warning"}, msg),   // padrao-ok: aviso de 11 px da janela
        e("span",{className:"ml-auto"}),
        e("button",{type:"button", disabled:salvando, onClick:p.fechar, style:ALTO, className:BTN+" min-w-20"}, "Cancelar"),
        e("button",{type:"button", disabled:salvando, onClick:enviar, style:ALTO, className:BTN_AZ+" min-w-20"}, salvando ? "Lançando" : ped ? "Completar pedido" : pedidoModo ? "Lançar pedido" : (f.arq ? "Lançar" : "Lançar sem comprovante"))))), document.body);
}

export { AbaCtaReceber, CLS_GRUPO, menuMini };   // a tela Contas bancárias (Caixa.js) usa a mesma faixa e o mesmo grupo azul
