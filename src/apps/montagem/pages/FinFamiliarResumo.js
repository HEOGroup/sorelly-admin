// Sorelly Admin · montagem — pages/FinFamiliarResumo.js
// Financeiro familiar → Sócios → Resumo (21/10/2026, pedido do Marcus: igual ao admin familiar antigo, em dourado degradê).
// Mostra, para o sócio e o período escolhidos: total pago, Pix de revendedoras recebido (com a meta), pró-labore, "Por categoria" em barras e a tabela de Pagamentos
// (descrição, pessoa, categoria, valor, data, conta pagadora, forma) com filtros e o TOTAL PAGO NO PERÍODO. O pagamento conta no mês da parcela (competência), como no admin antigo.
// Os dados são os mesmos do Financeiro familiar (domain/financeiro-familiar.js: contas e parcelas com pagamentos).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { FORMAS, baixaDividas, br, chaveCategoria, hojeYm, janela, r2 } from "@/apps/montagem/domain/financeiro-familiar";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var DOURADO = "linear-gradient(90deg,#B8862B,#E3B341 55%,#F4E2B0)";
var num = function(v){ var n = Number(String(v||"").replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var sel = function(rot, val, set, ops, w){ return e("select",{value:val, "aria-label":rot, className:INPUT+" h-10! cursor-pointer "+(w||"w-48"), style:{borderColor:"#B8862B88"}, onChange:function(ev){ set(ev.target.value); }}, ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };

function Cartao(p){ return e("div",{className:"flex min-w-0 flex-col items-center justify-center rounded-xl px-3 py-2.5 text-center", style:{background:"#ffffff0a", boxShadow:"inset 0 0 0 1.5px #B8862B88"}},
  e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide", style:{color:"#E3B341"}}, p.t), e("b",{className:MONO+" text-[22px] leading-tight", style:{color:p.cor||"#fff"}}, p.v), p.sub && e("span",{className:"text-[12px] text-white/75"}, p.sub)); }

// Editar pagamento: valor, data, forma, conta pagadora, categoria e observação; excluir. Mês passado é travado: o botão libera o mês e salva.
function EditarPag(p){
  var cx = use(), x = p.x, ff = p.ff, travado = x.ym<hojeYm() && ff.liberados.indexOf(x.ym)<0;
  var s1 = useState(x.valor.toFixed(2).replace(".", ",")), valor = s1[0], setValor = s1[1], s2 = useState(x.data), data = s2[0], setData = s2[1], s3 = useState(x.forma), forma = s3[0], setForma = s3[1], s4 = useState(x.conta==="—" ? "" : x.conta), conta = s4[0], setConta = s4[1], s5 = useState(x.obs||""), obs = s5[0], setObs = s5[1], s6 = useState(x.cat), cat = s6[0], setCat = s6[1], s7 = useState(""), nova = s7[0], setNova = s7[1], s8 = useState("");
  var erro = s8[0], setErro = s8[1];
  var D = function(a){ cx.dispatch(Object.assign({type:"FF", por:"Marcus"}, a)); };
  var contas = ff.contasBanc.filter(function(c){ return c.ativo!==false; }).map(function(c){ return c.nome; }).sort(); if(conta && contas.indexOf(conta)<0) contas.unshift(conta);
  var formas = FORMAS.slice(); if(forma && formas.indexOf(forma)<0) formas.unshift(forma);
  var campo = function(rot, el, cls){ return e("label",{className:"flex flex-col gap-1 "+(cls||"")}, e("span",{className:"text-[13px] font-bold"}, rot), el); };
  var salvar = function(){
    if(!(num(valor)>0)) return setErro("Informe o valor pago."); if(!data) return setErro("Informe a data do pagamento.");
    var categoria = cat; if(cat==="__nova"){ var nm = nova.trim(); if(!nm) return setErro("Escreva o nome da nova categoria."); var ch = chaveCategoria(nm); if(!ff.categorias.some(function(c){ return c.chave===ch; })) D({op:"cat_add", nome:nm}); categoria = ch; }
    if(travado) D({op:"mes_liberar", ym:x.ym});
    D({op:"pag_edit", id:x.cid, ym:x.ym, pagId:x.pgid, valor:num(valor), em:data, forma:forma, contaTxt:conta, obs:obs, categoria:categoria}); p.fechar(); };
  var excluir = function(){ if(!window.confirm("Excluir o pagamento de "+BK(x.valor)+" ("+x.desc+")? A parcela volta para Contas a pagar.")) return; if(travado) D({op:"mes_liberar", ym:x.ym}); D({op:"pag_del", id:x.cid, ym:x.ym, pagId:x.pgid}); p.fechar(); };
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4", onClick:p.fechar},
    e("div",{className:"flex w-full max-w-md flex-col gap-3 rounded-2xl p-5", style:{background:"#161616", boxShadow:"inset 0 0 0 1.5px #B8862B88"}, onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",null, e("h3",{className:"text-[18px] font-bold"}, "Editar pagamento"), e("p",{className:"text-[13px] text-white/70"}, x.desc+" · parcela de "+x.ym.slice(5)+"/"+x.ym.slice(0, 4))), e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"rounded-lg px-2 text-[20px] hover:bg-white/10"}, "×")),
      campo("Valor pago (R$) *", e("input",{value:valor, className:INPUT+" h-11!", onChange:function(ev){ setValor(ev.target.value.replace(/[^\d,.]/g, "")); }})),
      e("div",{className:"grid grid-cols-2 gap-3"}, campo("Data do pagamento *", e("input",{type:"date", value:data, className:INPUT+" h-11!", onChange:function(ev){ setData(ev.target.value); }})), campo("Forma *", e("select",{value:forma, className:INPUT+" h-11! cursor-pointer", onChange:function(ev){ setForma(ev.target.value); }}, formas.map(function(k){ return e("option",{key:k, value:k}, k); })))),
      campo("Conta pagadora", e("select",{value:conta, className:INPUT+" h-11! cursor-pointer", onChange:function(ev){ setConta(ev.target.value); }}, e("option",{value:""}, "Não informar"), contas.map(function(k){ return e("option",{key:k, value:k}, k); }))),
      campo("Categoria (vale para a conta inteira)", e("select",{value:cat, className:INPUT+" h-11! cursor-pointer", onChange:function(ev){ setCat(ev.target.value); }}, ff.categorias.map(function(c){ return e("option",{key:c.chave, value:c.chave}, c.nome); }), e("option",{value:"__nova"}, "+ Nova categoria…"))),
      cat==="__nova" && campo("Nome da nova categoria", e("input",{value:nova, placeholder:"Ex.: Pix Anamaria (PF)", className:INPUT+" h-11!", onChange:function(ev){ setNova(ev.target.value); }})),
      campo("Observação", e("input",{value:obs, placeholder:"Opcional", className:INPUT+" h-11!", onChange:function(ev){ setObs(ev.target.value); }})),
      travado && e("p",{className:"rounded-lg px-3 py-2 text-[12.5px]", style:{background:"#F59E0B22", boxShadow:"inset 0 0 0 1px #F59E0B"}}, "Este mês já passou e está travado. Ao salvar ou excluir, o mês é liberado para correção."),
      erro && e("p",{className:"text-[13px] font-bold text-[#fca5a5]"}, erro),
      e("div",{className:"flex items-center justify-between gap-2 pt-1"}, e("button",{type:"button", onClick:excluir, className:"h-10 rounded-lg px-4 text-[13px] font-bold text-white", style:{background:"#DC262699"}}, "Excluir pagamento"),
        e("div",{className:"flex gap-2"}, e(Btn,{onClick:p.fechar}, "Cancelar"), e("button",{type:"button", onClick:salvar, className:"h-10 rounded-xl px-5 text-[14px] font-bold", style:{background:"#E3B341", color:"#1a1204"}}, "Salvar alterações")))));
}

function ResumoSocio(p){
  var ff = p.ff, pid = p.pid, ym = p.ym, M = ym ? [ym] : janela();
  var sc = useState(""), cat = sc[0], setCat = sc[1], sco = useState(""), conta = sco[0], setConta = sco[1], sf = useState(""), forma = sf[0], setForma = sf[1], sb = useState(""), busca = sb[0], setBusca = sb[1], sap = useState({}), abre = sap[0], setAbre = sap[1], se = useState(null), editando = se[0], setEditando = se[1], so = useState("data"), ord = so[0], setOrd = so[1], sd = useState(true), desc = sd[0], setDesc = sd[1];
  var nomeCat = {}; ff.categorias.forEach(function(c){ nomeCat[c.chave] = c.nome; });
  // todos os pagamentos do sócio no período (competência = mês da parcela)
  var todos = [];
  ff.contas.filter(function(c){ return c.personaId===pid; }).forEach(function(c){ var ps = ff.parcelas[c.id] || {};
    M.forEach(function(m){ var par = ps[m]; if(par) (par.pagamentos||[]).forEach(function(g){ todos.push({id:g.id, cid:c.id, ym:m, pgid:g.id, desc:c.descricao, cat:c.categoria, valor:g.valor, data:g.em, conta:g.conta||"—", forma:g.forma||c.forma||"—", obs:g.obs||""}); }); }); });
  var linhas = todos.filter(function(x){ return (!cat || x.cat===cat) && (!conta || x.conta===conta) && (!forma || x.forma===forma) && (!busca || norm(x.desc+" "+x.valor.toFixed(2)+" "+x.valor.toFixed(2).replace(".", ",")+" "+x.conta).indexOf(norm(busca))>=0); });
  linhas.sort(function(a, b){ var r = ord==="valor" ? a.valor-b.valor : ord==="desc" ? a.desc.localeCompare(b.desc) : ord==="cat" ? (nomeCat[a.cat]||a.cat).localeCompare(nomeCat[b.cat]||b.cat) : ord==="conta" ? a.conta.localeCompare(b.conta) : a.data.localeCompare(b.data); return desc ? -r : r; });
  var total = r2(linhas.reduce(function(t, x){ return t+x.valor; }, 0)), totalTodos = r2(todos.reduce(function(t, x){ return t+x.valor; }, 0));
  var porCat = {}; linhas.forEach(function(x){ porCat[x.cat] = r2((porCat[x.cat]||0)+x.valor); });
  var DOBRA = ["COMPRA", "FINANCIAMENTO"];   // parcelas de carro e compras parceladas não aparecem separadas: somam em Outros (assim como o que for menor que 2%)
  Object.keys(porCat).forEach(function(k){ if(k!=="OUTROS" && (DOBRA.indexOf(k)>=0 || (total>0 && porCat[k]/total<0.02))){ porCat.OUTROS = r2((porCat.OUTROS||0)+porCat[k]); delete porCat[k]; } });
  var cats = Object.keys(porCat).sort(function(a, b){ return a==="OUTROS" ? 1 : b==="OUTROS" ? -1 : porCat[b]-porCat[a]; });
  var pro = r2(linhas.filter(function(x){ return x.cat==="PRO_LABORE"; }).reduce(function(t, x){ return t+x.valor; }, 0)), pixRevPago = r2(linhas.filter(function(x){ return x.cat==="PIX_REVENDEDORA"; }).reduce(function(t, x){ return t+x.valor; }, 0));
  var opCat = [["", "Todas as categorias"]].concat(Object.keys(todos.reduce(function(o, x){ o[x.cat] = 1; return o; }, {})).sort(function(a, b){ return (nomeCat[a]||a).localeCompare(nomeCat[b]||b); }).map(function(k){ return [k, nomeCat[k]||k]; }));
  var opConta = [["", "Todas as contas"]].concat(Object.keys(todos.reduce(function(o, x){ o[x.conta] = 1; return o; }, {})).sort().map(function(k){ return [k, k]; }));
  var opForma = [["", "Todas as formas"]].concat(Object.keys(todos.reduce(function(o, x){ o[x.forma] = 1; return o; }, {})).sort().map(function(k){ return [k, k]; }));
  var th = function(rot, k, al){ var on = ord===k; return e("th",{key:rot, onClick:k ? function(){ if(ord===k) setDesc(!desc); else { setOrd(k); setDesc(true); } } : undefined, className:"whitespace-nowrap border-b px-3 py-1.5 text-"+(al||"center")+" text-[12.5px] font-bold uppercase tracking-wide "+(k ? "cursor-pointer select-none hover:text-[#F4E2B0]" : ""), style:{borderColor:"#B8862B55", color:on ? "#E3B341" : "#fff"}}, rot, k && e("span",{className:"ml-1 text-[11px] opacity-70"}, on ? (desc ? "↓" : "↑") : "↕")); };
  var filtros = e("div",{className:"flex flex-wrap items-center gap-2"}, sel("Categoria", cat, setCat, opCat), sel("Conta pagadora", conta, setConta, opConta, "w-64"), sel("Forma", forma, setForma, opForma, "w-44"),
    e("input",{value:busca, placeholder:"Buscar descrição ou valor…", "aria-label":"Buscar", className:INPUT+" h-10! w-64", style:{borderColor:"#B8862B88"}, onChange:function(ev){ setBusca(ev.target.value); }}),
    e("span",{className:"ml-auto rounded-xl px-4 py-2 text-[13px] font-bold", style:{background:"#ffffff0d", boxShadow:"inset 0 0 0 1.5px #B8862B88"}}, linhas.length+" pagamento"+(linhas.length===1 ? "" : "s")));
  // Pix de revendedoras: o que caiu nas contas do sócio × o que foi direto para prestadores de serviço (conta do prestador, ou repasse manual)
  var noP = function(iso){ return M.indexOf(iso.slice(0, 7))>=0; }, contaPor = {}; ff.contasBanc.forEach(function(c){ contaPor[c.id] = c; });
  var minhas = {}, prests = {}, totMinhas = 0, totPrest = 0;
  ff.pix.filter(function(x){ return x.personaId===pid && noP(x.data) && x.auditoria!=="REJEITADO"; }).forEach(function(x){ var c = contaPor[x.contaId];
    if(c && c.prestadorId){ prests[c.prestadorId] = r2((prests[c.prestadorId]||0)+x.valor); totPrest = r2(totPrest+x.valor); }
    else { var k = c ? c.nome.replace(/^Conta\s+/i, "") : "Sem conta informada"; minhas[k] = r2((minhas[k]||0)+x.valor); totMinhas = r2(totMinhas+x.valor); } });
  ff.repasses.filter(function(x){ return x.origemPixPersonaId===pid && !x.origemPixLancId && noP(x.data); }).forEach(function(x){ prests[x.prestId] = r2((prests[x.prestId]||0)+x.valor); totPrest = r2(totPrest+x.valor); });
  var totPix = r2(totMinhas+totPrest), nomePrest = function(id){ var q = ff.prest.find(function(k){ return k.id===id; }); return q ? q.nome : "—"; };
  var ordena = function(o){ return Object.keys(o).sort(function(a, b){ return o[b]-o[a]; }); };
  var pc = function(v, tot){ return tot>0 ? Math.round(v/tot*100)+"%" : "—"; };
  // linha empilhada: nome, percentual e valor, com a barra dourada embaixo (um item em cima do outro)
  var linha = function(rot, v, tot, o){ o = o||{}; return e(o.fn ? "button" : "div",{key:rot, type:o.fn ? "button" : undefined, onClick:o.fn, className:"flex w-full flex-col gap-0.5 rounded-md px-2 py-1 text-left "+(o.fn ? "hover:bg-white/10" : ""), style:o.recuo ? {paddingLeft:"1.25rem"} : undefined},
    e("span",{className:"flex items-baseline justify-between gap-3"}, e("span",{className:o.forte ? "text-[14px] font-bold" : "text-[13px]"}, (o.fn ? e("span",{className:"mr-1.5 text-[11px]", style:{color:"#E3B341"}}, o.aberto ? "▾" : "▸") : null), rot), e("span",{className:"flex items-baseline gap-3"}, e("span",{className:"text-[11.5px] text-white/60"}, pc(v, tot)), e("b",{className:MONO+" text-[13.5px]", style:{color:o.cor}}, BK(v))))); };
  var recebido = totPix, meta = p.meta, pctMeta = meta>0 ? Math.round(recebido/meta*100) : 0;
  // UM bloco só (à esquerda), em 3 partes separadas por linha: ENTROU nas minhas contas · PAGO DIRETO (não passa pela minha conta) · SAIU (contas pagas). Clicar em qualquer linha abre os detalhes logo embaixo.
  var ab = abre, alterna = function(k){ var o = Object.assign({}, ab); o[k] = !ab[k]; setAbre(o); };
  var EXCL = ["PRO_LABORE", "PIX_ITAU_BLACK", "PIX_REVENDEDORA", "DINHEIRO"], nomeConta = function(c){ return String(c||"—").replace(/^Conta\s+/i, "").replace(/^(Marcus|Marco Antonio|Anamaria|Ana Beatriz|Lucas)\s*[—-]\s*/, ""); };
  var soma = function(l){ return r2(l.reduce(function(s, x){ return s+x.valor; }, 0)); };
  var proL = linhas.filter(function(x){ return x.cat==="PRO_LABORE"; }), itauL = linhas.filter(function(x){ return x.cat==="PIX_ITAU_BLACK"; }), dinL = linhas.filter(function(x){ return x.cat==="DINHEIRO"; }), pixPagoL = linhas.filter(function(x){ return x.cat==="PIX_REVENDEDORA"; });
  var contasL = linhas.filter(function(x){ return EXCL.indexOf(x.cat)<0; }), daItau = contasL.filter(function(x){ return /ita[úu]/i.test(x.conta); }), minhasL = contasL.filter(function(x){ return !/ita[úu]/i.test(x.conta); });
  var porConta = {}; minhasL.forEach(function(x){ var k = nomeConta(x.conta); porConta[k] = r2((porConta[k]||0)+x.valor); });
  var entrouTot = r2(totMinhas+soma(proL)+soma(itauL)+soma(dinL)), restoPix = r2(soma(pixPagoL)-totPrest), diretoTot = r2(totPrest+soma(daItau)), saiuTot = r2(soma(minhasL)+restoPix);
  var det = function(key, rot, v, fn, nivel){ return e(fn ? "button" : "div",{key:key, type:fn ? "button" : undefined, onClick:fn, className:"flex w-full items-baseline justify-between gap-3 rounded py-0.5 pr-2 text-left text-[12.5px] text-white/85 "+(fn ? "hover:bg-white/10" : ""), style:{paddingLeft:(nivel||2.25)+"rem"}}, e("span",null, rot), e("b",{className:MONO}, BK(v))); };
  var lista = function(k, itens, vazio){ return ab[k] && (itens.length ? itens : e("p",{key:"v"+k, className:"pl-9 text-[12.5px] text-white/60"}, vazio||"Nada neste período.")); };
  var pagLinhas = function(prefixo, arr){ return arr.slice().sort(function(x, y){ return y.valor-x.valor; }).map(function(x, i){ return det(prefixo+i, x.desc+" · "+br(x.data)+" · "+nomeConta(x.conta), x.valor); }); };
  var sep = function(k, rot, v, cor){ return e("div",{key:k, className:"mt-2 flex items-baseline justify-between gap-3 border-t px-2 pt-2 text-[14px] font-bold", style:{borderColor:"#B8862B"}}, e("span",{style:{color:"#E3B341"}}, rot), e("span",{className:MONO+" text-[15px]", style:{color:cor}}, BK(v))); };
  // prestador aberto ali mesmo: dívidas e o que foi enviado no período
  var abreP = ab.p || {}, togglePrest = function(id){ var o = Object.assign({}, ab); o.p = Object.assign({}, abreP); o.p[id] = !abreP[id]; setAbre(o); };
  var prestAberto = function(id){ var bx = baixaDividas(ff, id), envs = ff.repasses.filter(function(r){ return r.prestId===id && M.indexOf(r.data.slice(0, 7))>=0; }).sort(function(x, y){ return y.data.localeCompare(x.data); });
    return e("div",{key:"pa"+id, className:"mb-1 ml-12 mr-2 flex flex-col gap-0.5 rounded-md bg-black/30 px-2 py-1.5 text-[12px]"},
      bx.lista.length ? bx.lista.map(function(y){ var q = bx.porId[y.id]; return e("div",{key:y.id, className:"flex items-baseline justify-between gap-3"}, e("span",null, (y.codigo||y.descricao||br(y.data))+(y.codigo && y.descricao ? " · "+y.descricao : "")), e("span",{className:MONO}, BK(y.valor)+" · pago "+BK(q.pago)+(q.falta>0.005 ? " · falta "+BK(q.falta) : " · quitada"))); }) : e("span",{className:"text-white/60"}, "Sem dívida cadastrada."),
      e("div",{className:"mt-1 border-t pt-1 text-white/70", style:{borderColor:"#ffffff22"}}, "Enviado no período: "+BK(soma(envs.map(function(r){ return {valor:r.valor}; })))), envs.slice(0, 8).map(function(r){ return e("div",{key:r.id, className:"flex items-baseline justify-between gap-3 text-white/80"}, e("span",null, br(r.data)+" · "+(r.origem||"").replace(/ \(Pix automático\)/, "")), e("span",{className:MONO}, BK(r.valor))); }), envs.length>8 && e("span",{className:"text-white/50"}, "+ "+(envs.length-8)+" envios")); };
  var prestLinhas = ordena(prests).map(function(id){ return [det("pp"+id, e("span",null, e("span",{className:"mr-1.5 text-[11px]", style:{color:"#E3B341"}}, abreP[id] ? "▾" : "▸"), nomePrest(id)+" · "+pc(prests[id], totPrest)), prests[id], function(){ togglePrest(id); }), abreP[id] && prestAberto(id)]; });
  var blocoUnico = e(BlocoBarra,{cor:"ouro", compacto:true, t:"Resumo "+p.persona.nome+(ym ? " · "+ym.slice(5)+"/"+ym.slice(0, 4) : " · todos os meses"), dir:"total pago "+BK(total)}, e("div",{className:"flex flex-col p-1.5"},
    e("div",{key:"ponte", className:"mb-1 flex flex-col gap-0.5 rounded-md bg-black/30 px-2 py-1.5 text-[12.5px]"}, e("div",{className:"flex items-baseline justify-between gap-3 text-[14px] font-bold"}, e("span",{style:{color:"#E3B341"}}, "TOTAL PAGO (igual ao admin antigo)"), e("span",{className:MONO+" text-[15px]", style:{color:"#4ade80"}}, BK(total))),
      e("div",{className:"flex justify-between gap-3 text-white/85"}, e("span",null, "Contas pagas (pago direto + saiu)"), e("b",{className:MONO}, BK(r2(diretoTot+saiuTot)))), e("div",{className:"flex justify-between gap-3 text-white/85"}, e("span",null, "+ Pró-labore"), e("b",{className:MONO}, BK(soma(proL)))), e("div",{className:"flex justify-between gap-3 text-white/85"}, e("span",null, "+ Pix Itaú Black"), e("b",{className:MONO}, BK(soma(itauL)))), e("div",{className:"flex justify-between gap-3 text-white/85"}, e("span",null, "+ Dinheiro (retiradas)"), e("b",{className:MONO}, BK(soma(dinL))))),
    sep("h1", "ENTROU NAS MINHAS CONTAS", entrouTot, "#4ade80"),
    linha("Pix de revendedoras", totMinhas, entrouTot, {recuo:true, fn:function(){ alterna("pixconta"); }, aberto:ab.pixconta}),
    lista("pixconta", ordena(minhas).map(function(k){ return det("mc"+k, nomeConta(k)+" · "+pc(minhas[k], totMinhas), minhas[k]); }), "Nenhum Pix nas suas contas."),
    linha("Pró-labore", soma(proL), entrouTot, {recuo:true, fn:function(){ alterna("pro"); }, aberto:ab.pro}), lista("pro", pagLinhas("pl", proL)),
    linha("Pix Itaú Black (dos meus pais)", soma(itauL), entrouTot, {recuo:true, fn:function(){ alterna("itau"); }, aberto:ab.itau}), lista("itau", pagLinhas("it", itauL)),
    linha("Dinheiro (retiradas do caixa)", soma(dinL), entrouTot, {recuo:true, fn:function(){ alterna("din"); }, aberto:ab.din}), lista("din", pagLinhas("dn", dinL)),
    sep("h2", "PAGO DIRETO, SEM PASSAR PELA MINHA CONTA", diretoTot, "#E3B341"),
    linha("Pix de revendedoras para prestadores", totPrest, diretoTot, {recuo:true, fn:function(){ alterna("prest"); }, aberto:ab.prest}),
    ab.prest && (prestLinhas.length ? prestLinhas : e("p",{key:"np", className:"pl-9 text-[12.5px] text-white/60"}, "Nada foi direto para prestadores.")),
    linha("Contas pagas pelo Itaú (conta dos meus pais)", soma(daItau), diretoTot, {recuo:true, fn:function(){ alterna("daitau"); }, aberto:ab.daitau}), lista("daitau", pagLinhas("di", daItau)),
    sep("h3", "SAIU: CONTAS QUE PAGUEI", saiuTot, "#fff"),
    linha("Contas pagas nas minhas contas", soma(minhasL), saiuTot, {recuo:true, fn:function(){ alterna("minhas"); }, aberto:ab.minhas}),
    lista("minhas", ordena(porConta).map(function(k){ return det("pc"+k, k+" · "+pc(porConta[k], soma(minhasL)), porConta[k]); })),
    linha("Pix revendedora pago a outras pessoas", restoPix, saiuTot, {recuo:true, fn:function(){ alterna("pixpago"); }, aberto:ab.pixpago}), lista("pixpago", pagLinhas("pp", pixPagoL))));
  var barras = e(BlocoBarra,{cor:"ouro", compacto:true, t:"Por categoria", dir:BK(total)}, e("div",{className:"flex flex-col gap-1 p-2"}, cats.length ? cats.map(function(k){ return e("div",{key:k, className:"flex flex-col px-2 py-0.5"}, e("div",{className:"flex items-baseline justify-between gap-3"}, e("span",{className:"text-[13px]"}, nomeCat[k]||k, e("span",{className:"ml-2 text-[12px] text-white/55"}, total>0 ? Math.round(porCat[k]/total*100)+"%" : "")), e("b",{className:MONO+" text-[13.5px]"}, BK(porCat[k])))); }) : e("p",{className:"py-4 text-center text-[14px] text-white/70"}, "Nenhum pagamento neste período.")));
  // gráfico em pizza no final: as mesmas categorias do bloco "Por categoria"
  var CORES = ["#E3B341", "#8C6A1F", "#F4E2B0", "#B8862B", "#FFD27A", "#C9B27A", "#D99A2B", "#6F520F", "#A67C1A", "#EBD9A0"], acum = 0;
  var fatias = cats.map(function(k, i){ var fr = total>0 ? porCat[k]/total : 0, a0 = acum*2*Math.PI-Math.PI/2, a1 = (acum+fr)*2*Math.PI-Math.PI/2; acum += fr;
    var pt = function(a){ return (80+72*Math.cos(a)).toFixed(2)+" "+(80+72*Math.sin(a)).toFixed(2); };
    return cats.length===1 ? e("circle",{key:k, cx:80, cy:80, r:72, fill:CORES[0], stroke:"#0b0b0b", strokeWidth:1.5}) : e("path",{key:k, d:"M80 80 L"+pt(a0)+" A72 72 0 "+(fr>0.5 ? 1 : 0)+" 1 "+pt(a1)+" Z", fill:CORES[i%CORES.length], stroke:"#0b0b0b", strokeWidth:1.5}, e("title",null, (nomeCat[k]||k)+": "+BK(porCat[k]))); });
  var pizza = e(BlocoBarra,{cor:"ouro", compacto:true, t:"Gráfico · para onde foi o dinheiro", dir:BK(total)}, e("div",{className:"flex flex-wrap items-center justify-center gap-6 p-3"},
    e("svg",{viewBox:"0 0 160 160", width:190, height:190, role:"img", "aria-label":"Pizza por categoria"}, fatias),
    e("div",{className:"flex min-w-[15rem] flex-col gap-1"}, cats.map(function(k, i){ return e("div",{key:k, className:"flex items-center justify-between gap-4 text-[13px]"}, e("span",null, e("span",{className:"mr-2 inline-block size-2.5 rounded-sm align-middle", style:{background:CORES[i%CORES.length]}}), (nomeCat[k]||k)+" · "+(total>0 ? Math.round(porCat[k]/total*100) : 0)+"%"), e("b",{className:MONO}, BK(porCat[k]))); }))));
  var tabela = e(BlocoBarra,{cor:"ouro", t:"Pagamentos", sub:ym ? ym.slice(5)+"/"+ym.slice(0, 4) : "todos os meses"}, e("div",{className:"overflow-x-auto", style:{background:"#0b0b0b"}}, e("table",{className:"w-full min-w-[56rem] border-collapse text-[14px]"},
    e("thead",null, e("tr",null, th("Descrição", "desc"), th("Pessoa"), th("Categoria", "cat"), th("Valor", "valor"), th("Data pagamento", "data"), th("Conta pagadora", "conta"), th("Forma"), th(""))),
    e("tbody",null, linhas.length ? linhas.map(function(x, i){ return e("tr",{key:x.id||i, className:"border-b hover:bg-white/5", style:{borderColor:"#ffffff14"}},
      e("td",{className:"px-3 py-1.5 text-center font-medium"}, x.desc), e("td",{className:"px-3 py-1.5 text-center font-bold", style:{color:"#E3B341"}}, "• "+p.persona.nome),
      e("td",{className:"px-3 py-1.5 text-center"}, e("span",{className:"inline-block whitespace-nowrap rounded-full px-3 py-1 text-[12.5px] font-medium", style:{background:"#ffffff14", boxShadow:"inset 0 0 0 1px #ffffff22"}}, nomeCat[x.cat]||x.cat)),
      e("td",{className:MONO+" whitespace-nowrap px-3 py-1.5 text-center font-bold", style:{color:"#4ade80"}}, BK(x.valor)), e("td",{className:MONO+" whitespace-nowrap px-3 py-1.5 text-center"}, br(x.data)), e("td",{className:"px-3 py-1.5 text-center"}, x.conta), e("td",{className:"px-3 py-1.5 text-center"}, x.forma), e("td",{className:"px-2 py-1.5 text-center"}, e("button",{type:"button", title:"Editar ou excluir este pagamento", "aria-label":"Editar pagamento", onClick:function(){ setEditando(x); }, className:"rounded-lg px-2.5 py-1 text-[15px] font-bold hover:bg-white/15", style:{color:"#E3B341"}}, "✎"))); })
      : e("tr",null, e("td",{colSpan:8, className:"px-3 py-8 text-center text-white/70"}, "Nenhum pagamento neste filtro.")))),
    e("div",{className:"flex items-center justify-end gap-3 px-4 py-3", style:{background:"#2a2112"}}, e("b",{className:"text-[13px] uppercase tracking-wide"}, "Total pago no período"), e("b",{className:MONO+" text-[22px]", style:{color:"#4ade80"}}, BK(total)))));
  return e("div",{className:"flex flex-col gap-3"}, e("div",{className:"grid grid-cols-1 items-start gap-3 lg:grid-cols-2"}, blocoUnico, barras), filtros, tabela, pizza, editando && e(EditarPag,{key:editando.pgid, ff:ff, x:editando, fechar:function(){ setEditando(null); }}));
}

export { ResumoSocio };
