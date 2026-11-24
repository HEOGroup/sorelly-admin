// Sorelly Admin · montagem — pages/producao/ProdNotas.js
// Produção › ENVIO E DEVOLUÇÃO (Marcus, 24/11/2026: "faz uma tela no admin para elas preencherem... tem que ter uma nota de saída"): a ficha de papel virou tela.
// ENVIO: data do envio, nome de quem está levando, código das peças, quantidade enviada, responsável pelo envio. DEVOLUÇÃO: data, nome de quem devolve, código, peças produzidas, devolvidas sem produzir, com defeito, responsável pelo recebimento.
// Cada registro vira uma NOTA numerada (NS-0001 de saída, ND-0001 de devolução) que pode ser copiada para o WhatsApp. O envio entra no estoque da pessoa; a devolução dá baixa no estoque e as peças produzidas (e com defeito) viram lançamento da produção externa.
// Quem preenche: Diretoria e quem tiver a autorização producao_envio (a Crisbele e a Deysiane, por exemplo; o RH ajusta em Acessos e autorizações).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarDia, formatarInteiro, hojeSP, listaExternas, prReduz } from "@/apps/montagem/domain/producao";
import { Aviso, BtFaixa, CAMPO_FAIXA, FaixaAzul, MIUDA, Raiz, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

var CEL = "h-[22px] w-full rounded border border-white/40 bg-white/15 px-1 text-center text-[11px] text-white outline-none placeholder:text-white/60";   // padrao-ok: campo de 22 px das linhas da nota (Marcus, 24/11/2026)
var n0 = function(v){ return formatarInteiro(v); };
var linhaEnv = function(k){ return {k:k, codigo:"", qtd:""}; };
var linhaDev = function(k){ return {k:k, codigo:"", prod:"", sem:"", def:""}; };
var num = function(v){ return Math.max(0, parseInt(v, 10) || 0); };

function textoNota(n){
  var cab = n.tipo==="envio" ? "*NOTA DE SAÍDA "+n.numero+"*" : "*NOTA DE DEVOLUÇÃO "+n.numero+"*";
  var linhas = (n.itens||[]).map(function(i){ return n.tipo==="envio" ? "• "+i.codigo+": "+n0(i.qtd)+" peças" : "• "+i.codigo+": produzidas "+n0(i.produzidas)+" · sem produzir "+n0(i.semProduzir)+" · com defeito "+n0(i.defeito); });
  var total = n.tipo==="envio" ? "*Total: "+n0(n.total)+" peças*" : "*Total: "+n0(n.produzidas)+" produzidas · "+n0(n.semProduzir)+" sem produzir · "+n0(n.defeito)+" com defeito*";
  return [cab, "Data: "+formatarDia(n.dia), (n.tipo==="envio" ? "Levou: " : "Devolveu: ")+n.func, (n.tipo==="envio" ? "Responsável pelo envio: " : "Responsável pelo recebimento: ")+n.resp, ""].concat(linhas, ["", total, "", "Assinatura: ______________________"]).join("\n");
}

function AbaProdNotas(){
  var x = usePr(), hoje = hojeSP(), pessoas = listaExternas(x.pr), pode = x.admin || x.envia;
  var sEnv = useState(function(){ return {dia:hoje, func:"", resp:x.por || "", linhas:[linhaEnv(1), linhaEnv(2), linhaEnv(3)], seq:3}; });
  var sDev = useState(function(){ return {dia:hoje, func:"", resp:x.por || "", linhas:[linhaDev(1), linhaDev(2), linhaDev(3)], seq:3}; });
  var sMsg = useState(""), sCop = useState("");
  if(!pode && !x.leitura) return e(Raiz,null, e(BlocoPainel,{titulo:"Envio e devolução", compacto:true}, e(Aviso,null, "Somente quem tem a autorização de envio e devolução acessa.")));
  var env = sEnv[0], dev = sDev[0];
  var muda = function(st, cur, k, campo, v){ st[1](Object.assign({}, cur, {linhas:cur.linhas.map(function(l){ if(l.k!==k) return l; var o = {}; o[campo] = v; return Object.assign({}, l, o); })})); };
  var add = function(st, cur, nova){ st[1](Object.assign({}, cur, {seq:cur.seq+1, linhas:cur.linhas.concat([nova(cur.seq+1)])})); };
  var del = function(st, cur, k){ if(cur.linhas.length<=1) return; st[1](Object.assign({}, cur, {linhas:cur.linhas.filter(function(l){ return l.k!==k; })})); };
  var registrar = function(op, dados, depois){
    var a = Object.assign({type:"PR", op:op, por:x.por, admin:x.admin}, dados), r = prReduz(x.s, a);
    if(!(r.patch && r.patch.pr)){ sMsg[1]("⚠ "+(r.msg || "Não foi possível registrar.")); return; }
    x.exec(op, dados); sMsg[1]("✓ "+r.msg); depois();
  };
  var enviar = function(){ registrar("nota_envio", {dia:env.dia, func:env.func, resp:env.resp, itens:env.linhas.map(function(l){ return {codigo:l.codigo, qtd:num(l.qtd)}; })}, function(){ sEnv[1](Object.assign({}, env, {func:"", linhas:[linhaEnv(env.seq+1), linhaEnv(env.seq+2), linhaEnv(env.seq+3)], seq:env.seq+3})); }); };
  var devolver = function(){ registrar("nota_devolucao", {dia:dev.dia, func:dev.func, resp:dev.resp, itens:dev.linhas.map(function(l){ return {codigo:l.codigo, produzidas:num(l.prod), sem:num(l.sem), defeito:num(l.def)}; })}, function(){ sDev[1](Object.assign({}, dev, {func:"", linhas:[linhaDev(dev.seq+1), linhaDev(dev.seq+2), linhaDev(dev.seq+3)], seq:dev.seq+3})); }); };
  var campoTxt = function(rot, valor, aoMudar, tipo, ph){ return e("label",{key:rot, className:"flex items-center gap-2 text-[11px] font-semibold text-white"}, rot, e("input",{type:tipo || "text", value:valor, placeholder:ph, "aria-label":rot, onChange:function(ev){ aoMudar(ev.target.value); }, className:CAMPO_FAIXA+(tipo==="date" ? "" : " w-44")})); };
  var campoPessoa = function(rot, valor, aoMudar){ return e("label",{key:rot, className:"flex items-center gap-2 text-[11px] font-semibold text-white"}, rot, e("select",{value:valor, "aria-label":rot, onChange:function(ev){ aoMudar(ev.target.value); }, className:CAMPO_FAIXA+" w-40 cursor-pointer"}, e("option",{value:""}, "Escolha"), pessoas.map(function(n){ return e("option",{key:n, value:n}, n); }))); };
  var entrada = function(valor, aoMudar, rot, tipo){ return e("input",{type:tipo || "text", min:tipo==="number" ? 0 : undefined, inputMode:tipo==="number" ? "numeric" : undefined, value:valor, "aria-label":rot, placeholder:rot, onChange:function(ev){ aoMudar(tipo==="number" ? ev.target.value : ev.target.value.toUpperCase()); }, className:CEL+(tipo==="number" ? " tabular-nums" : "")}); };
  var botX = function(aoClicar){ return e("button",{type:"button", onClick:aoClicar, "aria-label":"Tirar a linha", title:"Tirar a linha", className:"h-[22px] w-full text-[11px] font-semibold hover:text-primary"}, "×"); };
  var colsEnv = [{k:"n", t:"Linha", w:"2.5rem"}, {k:"codigo", t:"Código das peças", render:function(v, r){ return entrada(r.l.codigo, function(t){ muda(sEnv, env, r.l.k, "codigo", t); }, "Código"); }}, {k:"qtd", t:"Quantidade de peças enviadas", render:function(v, r){ return entrada(r.l.qtd, function(t){ muda(sEnv, env, r.l.k, "qtd", t); }, "Quantidade", "number"); }}, {k:"x", t:"", w:"2.5rem", render:function(v, r){ return botX(function(){ del(sEnv, env, r.l.k); }); }}];
  var colsDev = [{k:"n", t:"Linha", w:"2.5rem"}, {k:"codigo", t:"Código das peças", render:function(v, r){ return entrada(r.l.codigo, function(t){ muda(sDev, dev, r.l.k, "codigo", t); }, "Código"); }}, {k:"prod", t:"Peças produzidas", render:function(v, r){ return entrada(r.l.prod, function(t){ muda(sDev, dev, r.l.k, "prod", t); }, "Produzidas", "number"); }}, {k:"sem", t:"Devolvidas sem produzir", render:function(v, r){ return entrada(r.l.sem, function(t){ muda(sDev, dev, r.l.k, "sem", t); }, "Sem produzir", "number"); }}, {k:"def", t:"Peças com defeito", render:function(v, r){ return entrada(r.l.def, function(t){ muda(sDev, dev, r.l.k, "def", t); }, "Defeito", "number"); }}, {k:"x", t:"", w:"2.5rem", render:function(v, r){ return botX(function(){ del(sDev, dev, r.l.k); }); }}];
  var linhasEnv = env.linhas.map(function(l, i){ return {id:"e"+l.k, n:i+1, l:l}; }), linhasDev = dev.linhas.map(function(l, i){ return {id:"d"+l.k, n:i+1, l:l}; });
  var totEnv = env.linhas.reduce(function(t, l){ return t+num(l.qtd); }, 0);
  var rodEnv = function(){ return ["", "TOTAL", n0(totEnv), ""]; };
  var rodDev = function(){ var s = function(c){ return dev.linhas.reduce(function(t, l){ return t+num(l[c]); }, 0); }; return ["", "TOTAL", n0(s("prod")), n0(s("sem")), n0(s("def")), ""]; };

  // notas registradas (mais novas primeiro)
  var notas = (x.pr.notas || []).slice().sort(function(a, b){ return a.dia<b.dia ? 1 : a.dia>b.dia ? -1 : b.id-a.id; }).map(function(n){
    return {id:String(n.id), n:n, numero:n.numero, tipo:n.tipo==="envio" ? "Saída" : "Devolução", dia:formatarDia(n.dia), func:n.func, resp:n.resp, resumo:n.tipo==="envio" ? n0(n.total)+" peças enviadas" : n0(n.produzidas)+" produzidas · "+n0(n.semProduzir)+" sem produzir · "+n0(n.defeito)+" com defeito", itens:(n.itens||[]).map(function(i){ return i.codigo; }).join(", ")};
  });
  var copiar = function(n){ var t = textoNota(n); try{ navigator.clipboard.writeText(t).then(function(){ sCop[1](n.numero); setTimeout(function(){ sCop[1](""); }, 2500); }); }catch(er){ window.prompt("Copie a nota:", t); } };
  var colsNotas = [{k:"numero", t:"Nota"}, {k:"tipo", t:"Tipo"}, {k:"dia", t:"Data"}, {k:"func", t:"Pessoa"}, {k:"resp", t:"Responsável"}, {k:"resumo", t:"Resumo"}, {k:"itens", t:"Códigos"},
    {k:"ac", t:"Ação", semFiltro:true, render:function(v, r){ return e("span",{className:"inline-flex items-center justify-center gap-3"},
      e("button",{type:"button", onClick:function(){ copiar(r.n); }, className:"text-[11px] font-semibold underline hover:text-primary"}, sCop[0]===r.n.numero ? "Copiada ✓" : "Copiar nota"),
      x.admin && e("button",{type:"button", onClick:function(){ if(window.confirm("Apagar a nota "+r.n.numero+" e o que ela criou (estoque ou lançamentos)?")) x.exec("nota_apagar", {id:r.n.id}); }, className:"text-[11px] font-semibold underline hover:text-danger"}, "Apagar")); }}];

  return e(Raiz,{cls:MIUDA},
    pode && e(BlocoPainel,{key:"env", titulo:"Envio · produção externa", dir:sMsg[0] || "", compacto:true},
      e(FaixaAzul,null,
        campoTxt("Data do envio", env.dia, function(v){ sEnv[1](Object.assign({}, env, {dia:v})); }, "date"),
        campoPessoa("Nome de quem está levando", env.func, function(v){ sEnv[1](Object.assign({}, env, {func:v})); }),
        campoTxt("Responsável pelo envio", env.resp, function(v){ sEnv[1](Object.assign({}, env, {resp:v})); }, "text", "Quem entregou"),
        e("span",{className:"flex-1"}),
        e(BtFaixa,{onClick:function(){ add(sEnv, env, linhaEnv); }}, "+ Linha"), e(BtFaixa,{onClick:enviar}, "Registrar envio")),
      e(TabelaPlanilha,{key:"tenv"+env.linhas.length, fina:true, cols:colsEnv, linhas:linhasEnv, chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, totalRodape:rodEnv})),
    pode && e(BlocoPainel,{key:"dev", titulo:"Devolução · produção externa", compacto:true},
      e(FaixaAzul,null,
        campoTxt("Data da devolução", dev.dia, function(v){ sDev[1](Object.assign({}, dev, {dia:v})); }, "date"),
        campoPessoa("Nome de quem está devolvendo", dev.func, function(v){ sDev[1](Object.assign({}, dev, {func:v})); }),
        campoTxt("Responsável pelo recebimento", dev.resp, function(v){ sDev[1](Object.assign({}, dev, {resp:v})); }, "text", "Quem recebeu"),
        e("span",{className:"flex-1"}),
        e(BtFaixa,{onClick:function(){ add(sDev, dev, linhaDev); }}, "+ Linha"), e(BtFaixa,{onClick:devolver}, "Registrar devolução")),
      e(TabelaPlanilha,{key:"tdev"+dev.linhas.length, fina:true, cols:colsDev, linhas:linhasDev, chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, totalRodape:rodDev})),
    e(BlocoPainel,{key:"notas", titulo:"Notas registradas", dir:notas.length+(notas.length===1 ? " nota" : " notas"), compacto:true},
      e(TabelaPlanilha,{key:"tnotas", fina:true, cols:colsNotas, linhas:notas, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:"Nenhuma nota registrada ainda."})));
}
export { AbaProdNotas };
