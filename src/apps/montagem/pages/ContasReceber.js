// Sorelly Admin · montagem — pages/ContasReceber.js
// Financeiro › Receber › Contas a receber (Marcus, 27/10/2026): quanto entrou em cada conta com os acertos e quem NÃO pagou. Lido da DevMaster pelo servidor (src/server/contas-receber.js), só leitura.
// Regra do Marcus: venda com a forma "Acerto - loja" (ACE/ACI) = não pagou, mesmo que pague depois. "Recebido nas contas" = Pix, link, cartão e dinheiro.
// Layout (3ª versão): filtros (a atualização da DevMaster é pequena, ao lado do mês) → MAPA DO DINHEIRO de ponta a ponta (nenhum nome em cima do outro)
// → tabela "CNPJs e contas bancárias" (cada CNPJ com todas as suas contas) → blocos com listas completas (nada abreviado) → LISTA DE TODOS OS PAGAMENTOS do mês,
// linha por linha, com botão para agrupar por revendedora. O mês escolhido vale para TUDO.
// Suposições a confirmar: o titular de cada conta sai do nome dela (CNPJ 34, 46, 59, Axis, família...); a carteira "Inadimplência" aparece como uma linha de representante.
import { Pagina } from "@/apps/montagem/components/padrao";
import { H, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { Painel, Sel } from "@/apps/montagem/pages/RevendedorasAtivas";
import { e, useEffect, useRef, useState } from "@/shared/react";

var MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
var MES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var ORD = ["CNPJ 34", "CNPJ 46", "CNPJ 59", "Axis", "H&O", "Família e sócios", "Maquininhas P", "Caixas internos", "Pix a fornecedor", "Outros"];
var FORMAS = ["Pix", "Link", "Cartão", "Dinheiro", "Outros"];
var rs = function(v){ return "R$ "+Math.round(v).toLocaleString("pt-BR"); };
var pct = function(a, b){ return b ? (Math.round(a/b*1000)/10).toLocaleString("pt-BR")+"%" : "0%"; };
var soma = function(a, idx){ return idx.reduce(function(t, i){ return t+(a[i] || 0); }, 0); };
var somaK = function(ls, k){ return ls.reduce(function(t, l){ return t+(l[k] || 0); }, 0); };
var bonito = function(n){ if(!n) return "Sem nome"; return n.replace(/ - /g, " ").split(/\s+/).map(function(w){ return /^\d|^(PF|PJ|H&O|P)$/.test(w) ? w : w.charAt(0)+w.slice(1).toLowerCase(); }).join(" "); };
var hojeIso = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };
var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : ""; };
var diasAtraso = function(venc){ return venc ? Math.round((new Date(hojeIso()+"T12:00:00")-new Date(venc+"T12:00:00"))/86400000) : 0; };
var vermelho = function(t){ return e("span",{className:"font-semibold text-destructive"}, t); };

// Linha de lista dos blocos: o texto QUEBRA em duas linhas quando não cabe (nada é cortado nem abreviado)
var Lw = function(cols, vals, cab, k, onClick, extra){
  return e("div",{key:k, onClick:onClick, className:"grid min-h-8 items-center border-b border-border text-center text-[13px] last:border-b-0 "+(cab ? "bg-white/5 text-[11px] font-medium uppercase tracking-[.02em] " : "")+(onClick ? "cursor-pointer hover:bg-white/10 " : "")+(extra || ""), style:{gridTemplateColumns:cols}},
    vals.map(function(v, i){ return e("span",{key:i, className:"min-w-0 break-words px-1 py-0.5 tabular-nums"}, v); })); };
var Mais = function(aberto, setAberto, n, nome){ return e("button",{key:"mais", type:"button", onClick:function(){ setAberto(!aberto); }, className:"h-8 w-full text-[13px] font-semibold text-primary hover:bg-white/10"}, aberto ? "Mostrar só as maiores" : "Ver todas as "+n+" "+nome); };

// A conta da DevMaster vem como "PIX - SICREDI - SORELLY - 34": forma = Pix, conta = Sicredi, CNPJ = 34 (coluna própria). "Sorelly" e o número não entram no nome da conta.
var FORMAS_FINAS = ["Pix", "Link", "Crédito", "Débito", "Dinheiro", "Outros"];
var partes = function(k){
  var d = String(k || "").toUpperCase().trim(); if(!d) return {forma:"Outros", banco:"Sem nome"};
  var m = /^(PIX|LINK|CR[ÉE]DITO|D[ÉE]BITO|DINHEIRO)/.exec(d), f = m ? m[1] : "";
  var forma = f==="PIX" ? "Pix" : f==="LINK" ? "Link" : /^CR/.test(f) ? "Crédito" : /^D[ÉE]B/.test(f) ? "Débito" : f==="DINHEIRO" ? "Dinheiro" : "Outros";
  var resto = d.replace(/^(PIX|LINK|CR[ÉE]DITO|D[ÉE]BITO|DINHEIRO)/, "").replace(/ - /g, " ").replace(/\b(SORELLY|SHOPPING|SERENITY|AXIS|34|46|59)\b/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
  return {forma:forma, banco:resto ? bonito(resto) : (forma==="Dinheiro" ? "Caixa" : "Sem banco")};
};

// Mapa do dinheiro de PONTA A PONTA: forma de pagamento (esquerda) → titular da conta (direita); faixa vermelha = acerto - loja (não pagou).
// A largura vem da tela (W em pixels, sem esticar o texto). Cada barra tem no mínimo 22 px de altura: assim nenhum nome fica em cima de outro.
function mapaSvg(L, a, W){
  var fv = {}, gv = {}, cx = {};
  L.forEach(function(x){ fv[x.f] = (fv[x.f] || 0)+x.v; gv[x.g] = (gv[x.g] || 0)+x.v; cx[x.f+"|"+x.g] = (cx[x.f+"|"+x.g] || 0)+x.v; });
  var fs = FORMAS.filter(function(f){ return fv[f]; }), gs = ORD.filter(function(g){ return gv[g]; });
  var T = L.reduce(function(s, x){ return s+x.v; }, 0)+a.v; if(!T) return "";
  var BW = 38, MINH = 22, gap = 8, H0 = 340, k = (H0-gap*8)/T, XF = 260, XG = Math.max(XF+BW+240, W-BW-330);
  var hF = function(v){ return Math.max(MINH, v*k); };
  var yF = {}, yG = {}, y = 0, yy = 0;
  fs.forEach(function(f){ yF[f] = y; y += hF(fv[f])+gap; }); var yA = y, hA = hF(a.v); y += hA;
  gs.forEach(function(g){ yG[g] = yy; yy += hF(gv[g])+gap; });
  var pg = Math.max(0, a.v-(a.s || 0)), sn = a.s || 0;   // acerto - loja lançado = recebido depois + não recebido (o que continua em aberto)
  var yP = yy, hP = hF(pg); yy += hP+gap; var yN = yy, hN = hF(sn); yy += hN;
  var Hs = Math.ceil(Math.max(y, yy))+8, oF = {}, oG = {}; fs.forEach(function(f){ oF[f] = 0; }); gs.forEach(function(g){ oG[g] = 0; });
  var s = '<svg width="'+W+'" height="'+Hs+'" viewBox="0 0 '+W+" "+Hs+'" role="img" aria-label="Mapa do dinheiro: da forma de pagamento até o titular da conta" style="display:block;font-size:13px">', mid = (XF+BW+XG)/2;
  fs.forEach(function(f){ gs.forEach(function(g){ var v = cx[f+"|"+g]; if(!v) return; var h = v*k, y1 = yF[f]+oF[f]+h/2, y2 = yG[g]+oG[g]+h/2; oF[f] += h; oG[g] += h;
    s += '<path d="M'+(XF+BW)+" "+y1+" C"+mid+" "+y1+" "+mid+" "+y2+" "+XG+" "+y2+'" fill="none" stroke="#d9a63a" stroke-opacity=".42" stroke-width="'+Math.max(1, h)+'"/>'; }); });
  var yp1 = yA+(pg*k)/2, yn1 = yA+pg*k+(sn*k)/2;
  if(pg>0) s += '<path d="M'+(XF+BW)+" "+yp1+" C"+mid+" "+yp1+" "+mid+" "+(yP+hP/2)+" "+XG+" "+(yP+hP/2)+'" fill="none" stroke="#4ade80" stroke-opacity=".5" stroke-width="'+Math.max(2, pg*k)+'"/>';
  if(sn>0) s += '<path d="M'+(XF+BW)+" "+yn1+" C"+mid+" "+yn1+" "+mid+" "+(yN+hN/2)+" "+XG+" "+(yN+hN/2)+'" fill="none" stroke="#ef4444" stroke-opacity=".55" stroke-width="'+Math.max(2, sn*k)+'"/>';
  fs.forEach(function(f){ var h = hF(fv[f]); s += '<rect x="'+XF+'" y="'+yF[f]+'" width="'+BW+'" height="'+h+'" rx="4" fill="#d9a63a"/><text x="'+(XF-10)+'" y="'+(yF[f]+h/2+5)+'" text-anchor="end" fill="#fff">'+f+" · "+rs(fv[f])+" · "+pct(fv[f], T)+"</text>"; });
  s += '<rect x="'+XF+'" y="'+yA+'" width="'+BW+'" height="'+hA+'" rx="4" fill="#ef4444"/><text x="'+(XF-10)+'" y="'+(yA+hA/2+5)+'" text-anchor="end" fill="#fca5a5">Acerto - loja lançado · '+rs(a.v)+" · "+pct(a.v, T)+"</text>";
  gs.forEach(function(g){ var h = hF(gv[g]); s += '<rect x="'+XG+'" y="'+yG[g]+'" width="'+BW+'" height="'+h+'" rx="4" fill="#d9a63a"/><text x="'+(XG+BW+10)+'" y="'+(yG[g]+h/2+5)+'" fill="#fff">'+g+" · "+rs(gv[g])+" · "+pct(gv[g], T)+"</text>"; });
  if(pg>0) s += '<rect x="'+XG+'" y="'+yP+'" width="'+BW+'" height="'+hP+'" rx="4" fill="#4ade80"/><text x="'+(XG+BW+10)+'" y="'+(yP+hP/2+5)+'" fill="#86efac">Recebido depois · '+rs(pg)+" · "+pct(pg, T)+"</text>";
  s += '<rect x="'+XG+'" y="'+yN+'" width="'+BW+'" height="'+hN+'" rx="4" fill="#ef4444"/><text x="'+(XG+BW+10)+'" y="'+(yN+hN/2+5)+'" fill="#fca5a5">Não recebido · '+rs(sn)+" · "+pct(sn, T)+"</text></svg>";
  return s;
}
function Mapa(p){
  var ref = useRef(null), sw = useState(1000), w = sw[0], setW = sw[1];
  useEffect(function(){ var el = ref.current; if(!el) return; var f = function(){ setW(Math.max(720, Math.floor(el.clientWidth)-16)); }; f(); var ro = new ResizeObserver(f); ro.observe(el); return function(){ ro.disconnect(); }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return e("div",{ref:ref, className:"overflow-x-auto p-2", dangerouslySetInnerHTML:{__html:mapaSvg(p.L, p.a, w)}});
}

// colunas da lista de pagamentos (uma linha por título da DevMaster)
var COLS_PAG = [{k:"d", t:"Emissão", fmt:dm}, {k:"rev", t:"Revendedora"}, {k:"rep", t:"Representante"}, {k:"nota", t:"Venda"}, {k:"forma", t:"Forma de pagamento"}, {k:"titular", t:"Titular da conta"},
  {k:"valor", t:"Valor", fmt:function(v){ return brl(v); }}, {k:"saldo", t:"Saldo em aberto", fmt:function(v){ return brl(v); }, cor:function(l){ return l.saldo>0 ? "text-destructive font-semibold" : ""; }}, {k:"venc", t:"Vencimento", fmt:dm},
  {k:"sit", t:"Situação do pagamento", cor:function(l){ return l.nao ? "text-destructive font-semibold" : "text-success"; }}];

function AbaContasReceber(){
  var sd = useState(null), dados = sd[0], setDados = sd[1], se = useState(""), erro = se[0], setErro = se[1];
  var sm = useState(""), mes = sm[0], setMes = sm[1], sq = useState("n"), quem = sq[0], setQuem = sq[1], sg = useState(""), tit = sg[0], setTit = sg[1];
  var sab = useState({}), abertos = sab[0], setAbertos = sab[1], ssi = useState(""), fSit = ssi[0], setFSit = ssi[1], sr = useState(false), todasRep = sr[0], setTodasRep = sr[1], sa = useState(false), todasAb = sa[0], setTodasAb = sa[1];
  var sl = useState(null), lin = sl[0], setLin = sl[1], sc = useState(false), carregandoLin = sc[0], setCarregandoLin = sc[1], sgp = useState(false), agrupar = sgp[0], setAgrupar = sgp[1];
  var carrega = function(forcar){ chamar("GET", "/contas-receber"+(forcar ? "?atualizar=1" : "")).then(function(d){ setDados(d); setErro(d.erro && !d.pronto ? d.erro : ""); }).catch(function(x){ setErro(x.message); }); };
  useEffect(function(){ if(apiAtiva()) carrega(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  // enquanto o servidor lê a DevMaster (primeira vez ou atualização), pergunta de novo a cada 4 segundos
  useEffect(function(){ if(!dados || (dados.pronto && !dados.atualizando)) return; var id = setTimeout(function(){ carrega(false); }, 4000); return function(){ clearTimeout(id); }; }, [dados]);   // eslint-disable-line react-hooks/exhaustive-deps
  // lista de pagamentos: do mês escolhido (com o ano inteiro, mostra o mês atual)
  // com o filtro "só acerto - loja" e o ano inteiro, a lista traz TODOS os meses (são poucas linhas); sem esse filtro, o ano inteiro mostra o mês atual
  var pronto = !!(dados && dados.pronto), soNao = fSit==="nao" || fSit==="aberto", mesLista = pronto ? (mes ? Number(mes) : (soNao ? 0 : dados.meses)) : 0;
  useEffect(function(){ if(!pronto) return; setCarregandoLin(true); chamar("GET", "/contas-receber/titulos?mes="+mesLista+(soNao ? "&nao=1" : "")).then(function(d){ setLin(d.linhas); setCarregandoLin(false); }).catch(function(x){ setErro(x.message); setCarregandoLin(false); }); }, [pronto, mesLista, soNao]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!apiAtiva()) return e(Pagina,null, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  if(erro && !dados) return e(Pagina,null, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro));
  if(!dados || !dados.pronto) return e(Pagina,null, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo os títulos a receber da DevMaster… "+(dados && dados.etapa ? dados.etapa+" · "+(dados.pct || 0)+"%" : "a primeira vez demora alguns minutos")));

  var q = dados.semFuncionarias ? "t" : quem, mi = mes ? Number(mes) : 0, todosMeses = Array.from({length:dados.meses}, function(_, i){ return i; }), idx = mi ? [mi-1] : todosMeses;
  var L0 = Object.keys(dados.C).map(function(k){ var c = dados.C[k]; return {k:k, n:bonito(k), g:c.g, f:c.f, bk:c.bk, a:c[q], v:soma(c[q], idx)}; }).filter(function(x){ return x.v>0; }).sort(function(a, b){ return b.v-a.v; });
  var L = tit ? L0.filter(function(x){ return x.g===tit; }) : L0, tot = somaK(L, "v"), tot0 = somaK(L0, "v");
  var A = dados.A[q], ac = {v:soma(A.v, idx), s:soma(A.s, idx)}, emAbertoAno = soma(A.s, todosMeses);
  var G = {}, Fm = {}, FmN = {}; L0.forEach(function(x){ var o = G[x.g] || (G[x.g] = {v:0, n:0, lista:[]}); o.v += x.v; o.n++; o.lista.push(x); }); L.forEach(function(x){ Fm[x.f] = (Fm[x.f] || 0)+x.v; FmN[x.f] = (FmN[x.f] || 0)+1; });
  var gs = ORD.filter(function(g){ return G[g] && (!tit || g===tit); }), gsTodos = ORD.filter(function(g){ return G[g]; }), fo = FORMAS.filter(function(f){ return Fm[f]; });
  var mesesOp = todosMeses.map(function(i){ return [String(i+1), MES_LONGO[i]]; });
  var porMes = todosMeses.map(function(i){ var rc = L0.reduce(function(s, x){ return s+(x.a[i] || 0); }, 0); return {m:i+1, rec:rc, ace:A.v[i], aberto:A.s[i], cx:(A.cx || [])[i] || 0}; }).filter(function(x){ return !mi || x.m===mi; });
  var ab = dados.ab[q].filter(function(x){ return !mi || x[1]===mi; });
  var rp = dados.RP[q][mi] || {}, R = Object.keys(rp).map(function(k){ var p = rp[k]; return {r:k, fat:p[0], ace:p[2], s:p[3], n:p[4], dev:p[5]}; }).filter(function(x){ return x.s>0; }).sort(function(a, b){ return b.s-a.s; });
  var temFiltro = !!(mes || tit || quem!=="n" || fSit);
  // lista de pagamentos: só o que o filtro de quem e de titular deixam passar
  var pags = (lin || []).filter(function(x){ return !(q==="n" && x.fn) && (!tit || x.titular===tit) && (!fSit || (fSit==="nao" ? x.nao : fSit==="aberto" ? (x.nao && x.saldo>0) : !x.nao)); }).map(function(x){ return Object.assign({}, x, {sit:x.nao ? (x.saldo>0 ? "Acerto - loja · não recebido" : "Acerto - loja · recebido depois") : "Recebido"}); });
  var totPag = function(ls){ return [{span:6, t:"TOTAL DO FILTRO · "+inteiro(ls.length)+(ls.length===1 ? " pagamento" : " pagamentos")}, brl(somaK(ls, "valor")), brl(somaK(ls, "saldo")), "", inteiro(ls.filter(function(l){ return l.nao && l.saldo>0; }).length)+" não recebidos"]; };
  var CC = "1.5fr 1.2fr .8fr 1.1fr .8fr", cn = {}, fm = {};
  L.forEach(function(x){ var p = partes(x.k), a = cn[x.g] || (cn[x.g] = {v:0, it:{}}), b = fm[p.forma] || (fm[p.forma] = {v:0, it:{}});
    a.v += x.v; var k1 = p.banco+"|"+p.forma, i1 = a.it[k1] || (a.it[k1] = {banco:p.banco, forma:p.forma, v:0}); i1.v += x.v;
    b.v += x.v; var k2 = p.banco+"|"+x.g, i2 = b.it[k2] || (b.it[k2] = {banco:p.banco, g:x.g, v:0}); i2.v += x.v; });
  var alterna = function(k){ var n = Object.assign({}, abertos); if(n[k]) delete n[k]; else n[k] = true; setAbertos(n); };
  var abreTodos = function(abrir){ var n = {}; if(abrir){ ORD.forEach(function(g){ if(cn[g]) n["c:"+g] = true; }); FORMAS_FINAS.forEach(function(f){ if(fm[f]) n["f:"+f] = true; }); } setAbertos(n); };
  var ordemV = function(o){ return Object.keys(o).map(function(k){ return o[k]; }).sort(function(a, b){ return b.v-a.v; }); };
  var cnGs = ORD.filter(function(g){ return cn[g]; }), fmFs = FORMAS_FINAS.filter(function(f){ return fm[f]; });
  var BotaoAbrir = e("div",{className:"flex justify-end gap-2 border-b border-border px-2 py-1"}, e("button",{type:"button", onClick:function(){ abreTodos(true); }, className:"h-7 rounded-md border border-border px-2.5 text-[13px] hover:bg-white/10"}, "Abrir todos"), e("button",{type:"button", onClick:function(){ abreTodos(false); }, className:"h-7 rounded-md border border-border px-2.5 text-[13px] hover:bg-white/10"}, "Fechar todos"));
  var periodo = mi ? MES_LONGO[mi-1] : "Ano "+dados.ano;
  var CB = "1.5fr 2fr 1.6fr .8fr 1.2fr .9fr", C3 = "1.4fr .6fr 1.2fr .8fr", C6 = "1fr 1.3fr 1.3fr 1.3fr 1.3fr .9fr", C7 = "1.7fr 1.5fr .6fr 1.1fr 1.1fr .9fr", C8 = "1.7fr 1fr .8fr 1.2fr 1.2fr 1.2fr .9fr";
  var totMes = {rec:somaK(porMes, "rec"), ace:somaK(porMes, "ace"), aberto:somaK(porMes, "aberto"), cx:somaK(porMes, "cx")};
  // O acerto - loja é pago aos poucos, todo mês. "Não recebido" = o SALDO que continua em aberto (de 2026 e de anos anteriores); "Recebido depois" = lançado - saldo.
  var antigoS = dados.antigo ? dados.antigo[q].s : 0, antigoN = dados.antigo ? dados.antigo[q].n : 0, lancAno = soma(A.v, todosMeses), abertoAno = soma(A.s, todosMeses);
  var C2 = "2.2fr 1.2fr .9fr", C6b = "1fr 1.2fr 1.2fr 1.3fr 1.2fr 1.2fr .9fr 1.4fr";

  return e(Pagina,null,
    // filtros: a atualização da DevMaster é pequena e fica ao lado do mês
    e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2"},
      Sel("Ano "+dados.ano, mes, mesesOp, setMes, "Mês"),
      e("button",{type:"button", title:"Atualizar da DevMaster", "aria-label":"Atualizar da DevMaster", onClick:function(){ carrega(true); }, className:H+" w-8 rounded-md border border-border text-[15px] hover:bg-white/10"}, "↻"),
      e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] "+(dados.atualizando ? "text-warning" : "text-muted-foreground"), role:"status"}, dados.atualizando ? "Atualizando da DevMaster… "+(dados.pct || 0)+"%" : "DevMaster · "+new Date(dados.geradoEm).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"})),
      Sel("Só não funcionárias", quem==="n" ? "" : quem, [["t", "Todos, com funcionárias"]], function(v){ setQuem(v || "n"); }, "Quem"),
      Sel("Todos os titulares", tit, gsTodos.map(function(g){ return [g, g]; }), setTit, "Titular da conta"),
      Sel("Todos os pagamentos", fSit, [["nao", "Só acerto - loja (não pagou)"], ["aberto", "Só acerto - loja em aberto"], ["rec", "Só recebido"]], setFSit, "Situação do pagamento na lista"),
      temFiltro && e("button",{type:"button", onClick:function(){ setMes(""); setQuem("n"); setTit(""); setFSit(""); }, className:H+" rounded-md border border-border px-3 text-[13px] hover:bg-white/10"}, "Limpar"),
      dados.semFuncionarias && e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-warning"}, "A lista de funcionárias não está neste servidor: os números incluem as compras delas")),
    e(Painel,{t:"Mapa do dinheiro · do faturado até a conta · "+(mi ? MES_LONGO[mi-1] : "Ano "+dados.ano), v:brl(tot0+ac.v)+" faturado"}, e(Mapa,{L:L0, a:ac})),
    e("div",{className:"grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(30rem,1fr))]"},
      e(Painel,{t:"CNPJs e contas · "+periodo, v:brl(tot)+" recebido"}, BotaoAbrir,
        Lw(CC, ["CNPJ / titular", "Conta", "Forma", "Recebido", "% do recebido"], true, "h"),
        [].concat.apply([], cnGs.map(function(g){ var o = cn[g], ab = !!abertos["c:"+g], its = ordemV(o.it);
          return [Lw(CC, [(ab ? "▾ " : "▸ ")+g, inteiro(its.length)+(its.length===1 ? " conta" : " contas"), "", brl(o.v), pct(o.v, tot)], false, "c-"+g, function(){ alterna("c:"+g); }, "bg-[#B8862B]/25 font-semibold")]
            .concat(ab ? its.map(function(x){ return Lw(CC, ["", x.banco, x.forma, brl(x.v), pct(x.v, tot)], false, "c-"+g+"-"+x.banco+x.forma); }) : []); })),
        Lw(CC, ["Total", "", "", brl(tot), "100%"], false, "t", null, "bg-[#B8862B]/20 font-semibold")),
      e(Painel,{t:"Forma de pagamento · "+periodo, v:brl(tot)+" recebido"}, BotaoAbrir,
        Lw(CC, ["Forma de pagamento", "Conta", "CNPJ / titular", "Recebido", "% do recebido"], true, "h"),
        [].concat.apply([], fmFs.map(function(f){ var o = fm[f], ab = !!abertos["f:"+f], its = ordemV(o.it);
          return [Lw(CC, [(ab ? "▾ " : "▸ ")+f, inteiro(its.length)+(its.length===1 ? " conta" : " contas"), "", brl(o.v), pct(o.v, tot)], false, "f-"+f, function(){ alterna("f:"+f); }, "bg-[#B8862B]/25 font-semibold")]
            .concat(ab ? its.map(function(x){ return Lw(CC, ["", x.banco, x.g, brl(x.v), pct(x.v, tot)], false, "f-"+f+"-"+x.banco+x.g); }) : []); })),
        Lw(CC, ["Total recebido", "", "", brl(tot), "100%"], false, "t", null, "bg-[#B8862B]/20 font-semibold"),
        Lw(CC, ["Acerto - loja lançado", "", "", brl(ac.v), pct(ac.v, tot+ac.v)], false, "ace", null, "bg-destructive/15 font-semibold"),
        Lw(CC, ["Recebido depois", "", "", brl(ac.v-ac.s), pct(ac.v-ac.s, ac.v)+" do lançado"], false, "ace1", null, "text-success"),
        Lw(CC, ["Não recebido", "", "", vermelho(brl(ac.s)), pct(ac.s, ac.v)+" do lançado"], false, "ace2"))),
    e("div",{className:"grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(30rem,1fr))]"},
      e(Painel,{t:"Quanto efetivamente não recebemos", v:brl(abertoAno+antigoS)+" não recebido", vermelho:true},
        Lw(C2, ["Acerto - loja", "Valor", "% do lançado"], true, "h"),
        Lw(C2, ["Lançado em "+dados.ano, brl(lancAno), "100%"], false, "l1"),
        Lw(C2, ["Já recebido depois (de "+dados.ano+")", brl(lancAno-abertoAno), pct(lancAno-abertoAno, lancAno)], false, "l2", null, "text-success"),
        Lw(C2, ["Não recebido de "+dados.ano+" (em aberto)", vermelho(brl(abertoAno)), pct(abertoAno, lancAno)], false, "l3"),
        Lw(C2, ["Dívida antiga, de anos anteriores ("+inteiro(antigoN)+(antigoN===1 ? " revendedora" : " revendedoras")+")", vermelho(brl(antigoS)), ""], false, "l4"),
        Lw(C2, ["Total que não recebemos, com a dívida antiga", vermelho(brl(abertoAno+antigoS)), ""], false, "l5", null, "bg-destructive/15 font-semibold"),
        Lw(C2, ["Entrou de acertos de qualquer ano · "+periodo, brl(totMes.cx), ""], false, "l6", null, "bg-[#B8862B]/20 font-semibold")),
      e(Painel,{t:mi ? "Mês de "+MES_LONGO[mi-1] : "Mês a mês", v:brl(totMes.aberto)+" não recebido"},
        Lw(C6b, ["Mês", "Faturado", "Recebido na venda", "Acerto - loja lançado", "Recebido depois", "Não recebido", "% não recebido", "Entrou de acerto - loja no mês"], true, "h"),
        porMes.map(function(x){ return Lw(C6b, [MES_LONGO[x.m-1], brl(x.rec+x.ace), brl(x.rec), brl(x.ace), brl(x.ace-x.aberto), vermelho(brl(x.aberto)), pct(x.aberto, x.rec+x.ace), brl(x.cx)], false, x.m, function(){ setMes(String(mi===x.m ? "" : x.m)); }, mi===x.m ? "bg-[#B8862B]/20 font-semibold" : ""); }),
        Lw(C6b, ["Total", brl(totMes.rec+totMes.ace), brl(totMes.rec), brl(totMes.ace), brl(totMes.ace-totMes.aberto), vermelho(brl(totMes.aberto)), pct(totMes.aberto, totMes.rec+totMes.ace), brl(totMes.cx)], false, "t", null, "bg-[#B8862B]/20 font-semibold")),
      e(Painel,{t:"Acerto - loja · quem ainda não pagou", v:brl(ac.s+(mi ? 0 : antigoS))+" em aberto"+(mi ? "" : " (com anos anteriores)"), vermelho:true},
        Lw(C7, ["Revendedora", "Representante", "Emissão", "Em aberto", "Vencimento", "Atraso"], true, "h"),
        ab.length ? (todasAb ? ab : ab.slice(0, 8)).map(function(x, i){ var d = diasAtraso(x[3]); return Lw(C7, [x[0], x[4], x[1] ? MES[x[1]-1] : "Anos anteriores", vermelho(brl(x[2])), dm(x[3]), d>0 ? vermelho(d+(d===1 ? " dia" : " dias")) : "No prazo"], false, x[0]+i); }) : Lw("1fr", ["Nenhuma neste período."], false, "vazio"),
        ab.length>8 && Mais(todasAb, setTodasAb, ab.length, "linhas")),
      e(Painel,{t:"Em aberto por representante · só "+dados.ano, v:brl(R.reduce(function(s, x){ return s+x.s; }, 0)), vermelho:true},
        Lw(C8, ["Representante", "Revendedoras", "Devendo", "Faturado", "Acerto - loja", "Em aberto", "% não recebido"], true, "h"),
        (todasRep ? R : R.slice(0, 8)).map(function(x){ return Lw(C8, [x.r, inteiro(x.n), inteiro(x.dev), brl(x.fat), brl(x.ace), vermelho(brl(x.s)), pct(x.ace, x.fat)], false, x.r); }),
        R.length>8 && Mais(todasRep, setTodasRep, R.length, "representantes"))),
    e(Painel,{t:"Pagamentos · linha por linha · "+(fSit ? ({nao:"só acerto - loja", aberto:"só acerto - loja em aberto", rec:"só recebido"})[fSit]+" · " : "")+(mesLista ? MES_LONGO[mesLista-1] : "todos os meses de "+dados.ano+" e anos anteriores em aberto"), v:inteiro(pags.length)+(pags.length===1 ? " pagamento" : " pagamentos")},
      e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-b border-border p-2"},
        e("span",{className:"text-[13px]"}, mes ? "Todos os títulos do mês escolhido, com os filtros de quem, de titular e de situação." : soNao ? "Todos os meses do ano e também o acerto - loja em aberto de anos anteriores. Use Agrupar por revendedora para ver quanto cada uma deve." : "Com o ano inteiro escolhido, a lista mostra o mês atual. Escolha um mês, ou \"Só acerto - loja\" para ver todos os meses."),
        e("button",{type:"button", "aria-pressed":agrupar, onClick:function(){ setAgrupar(!agrupar); }, className:H+" whitespace-nowrap rounded-md border px-3 text-[13px] "+(agrupar ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border hover:bg-white/10")}, "Agrupar por revendedora")),
      e("div",{className:"p-2"}, carregandoLin || !lin ? e("p",{className:"py-3 text-center text-[13px]"}, "Lendo os pagamentos do mês na DevMaster…")
        : e(TabelaPlanilha,{key:"pag-"+(agrupar ? "g" : "l")+mesLista+fSit, cols:COLS_PAG, linhas:pags, chave:"id", centro:true, agrupar:agrupar ? "rev" : "", totalLinha:totPag,
          linhaGrupo:function(v, ls){ var np = ls.filter(function(l){ return l.nao && l.saldo>0; }).length; return {span:6, rotulo:v+" · "+ls[0].rep+" · "+inteiro(ls.length)+(ls.length===1 ? " pagamento" : " pagamentos"), resto:[brl(somaK(ls, "valor")), brl(somaK(ls, "saldo")), "", np ? np+" não recebidos" : "Tudo recebido"]}; },
          vazio:"Nenhum pagamento com esses filtros."}))),
    erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro));
}
export { AbaContasReceber, Lw };
