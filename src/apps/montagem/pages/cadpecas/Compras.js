// Sorelly Admin · montagem — pages/cadpecas/Compras.js
// Cadastro de peças → "Compras" (06/11/2026, pedido do Marcus; fica ANTES de Pedidos no menu). Hoje só com o fornecedor de bruto Adereço (apelido Point), ligado à Pontual (banho). Os outros fornecedores entram depois.
// Fluxo em 3 passos: 1 · Adereço (fotos + romaneio em PDF, a foto é ligada à linha pelo código) → 2 · Banho (o Marcus escolhe o banho de cada peça; PDF para a Pontual, sem preço)
// → 3 · Recebido (quantidade que a Pontual confirmou; PDF para a Rayssa, sem preço). As contas ficam em domain/compra-bruto.js; o HTML impresso em lib/romaneio-html.js; os dados em s.cpc.compras.
// Fotos: reduzidas para 720 px (JPEG) e guardadas no servidor (lib/anexo.js, módulo cpc); a compra guarda só a chave. Quem lança: o mesmo grupo dos pedidos de bruto (config.quem.pedidos_bruto) e a diretoria.
import { Janela } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, FileiraCampos, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { podeFazer } from "@/apps/montagem/domain/cadastro-pecas";
import { BANHOS_PADRAO, agruparLinhas, conferirRomaneio, diferenca, ehOuro, ligarFotos, lerRomaneio, liquidoDaFoto, precoDaFoto, recebidoDe, reais, reaisM, rotuloBanho } from "@/apps/montagem/domain/compra-bruto";
import { chamar } from "@/apps/montagem/lib/api";
import { abrirAnexo, enviarAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { htmlRomaneio } from "@/apps/montagem/lib/romaneio-html";
import { useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useRef, useState } from "@/shared/react";

var PASSOS = [["adereco", "1 · Adereço"], ["banho", "2 · Banho"], ["recebido", "3 · Recebido"]];
var PDFJS = "3.11.174";
var CACHE = {};   // chave do anexo → Promise do data URL (a foto só desce uma vez)
var ALTO_FOTO = 104;   // altura da fileira com foto (px)
function id(p){ return p+Math.random().toString(36).slice(2, 9); }
function dmy(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : ""; }
function plural(n, um, varios){ return n+" "+(n===1 ? um : varios); }

function urlAnexo(k){
  if(!CACHE[k]) CACHE[k] = chamar("GET", "/anexos/"+encodeURIComponent(k)).then(function(r){ return r.url; }, function(x){ delete CACHE[k]; throw x; });
  return CACHE[k];
}
function Foto(p){
  var st = useState(""), u = st[0], poe = st[1];
  useEffect(function(){ var vivo = true; if(p.k) urlAnexo(p.k).then(function(x){ if(vivo) poe(x); }, function(){}); return function(){ vivo = false; }; }, [p.k, poe]);
  var caixa = {height:p.h, width:p.w || p.h};
  return u ? e("img",{src:u, alt:p.alt || "Foto da peça", style:Object.assign({objectFit:"contain"}, caixa)})
    : e("span",{className:"grid place-items-center rounded-md border border-dashed border-border text-[11px]", style:caixa}, p.k ? "Carregando" : "Sem foto");
}

// foto da tela → JPEG de no máximo 720 px, qualidade 0,8
function reduzir(arq){
  return new Promise(function(res, rej){
    var r = new FileReader();
    r.onerror = function(){ rej(new Error("Não consegui ler "+arq.name+".")); };
    r.onload = function(){
      var img = new Image();
      img.onload = function(){ var k = Math.min(1, 720/Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width*k)); c.height = Math.max(1, Math.round(img.height*k)); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.8)); };
      img.onerror = function(){ rej(new Error("Não consegui abrir "+arq.name+".")); };
      img.src = String(r.result);
    };
    r.readAsDataURL(arq);
  });
}

// leitor de PDF (pdf.js, cdnjs): carrega na hora de importar o primeiro romaneio
function carregaPdfJs(){
  if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise(function(res, rej){
    var s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/"+PDFJS+"/pdf.min.js";
    s.onload = function(){ window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/"+PDFJS+"/pdf.worker.min.js"; res(window.pdfjsLib); };
    s.onerror = function(){ rej(new Error("Não consegui carregar o leitor de PDF. Use \"Colar texto do romaneio\".")); };
    document.head.appendChild(s);
  });
}
async function linhasDoPdf(arq){
  var lib = await carregaPdfJs(), doc = await lib.getDocument({data:new Uint8Array(await arq.arrayBuffer())}).promise, linhas = [];
  for(var n = 1; n<=doc.numPages; n++){ var tc = await (await doc.getPage(n)).getTextContent(); linhas = linhas.concat(agruparLinhas(tc.items.map(function(i){ return {s:i.str, x:i.transform[4], y:i.transform[5]}; }))); }
  return linhas;
}

// fotos de teste (o Marcus pediu para simular): 3 linhas do romaneio 035339 + uma foto sem linha (PA3578-40cm); a linha CH7180 fica sem foto de propósito
var TESTE = [["CH6910", "9/90"], ["CH7056", "10/40"], ["CH7179", "9/90"], ["PA3578-40cm", "10/90"]];
function fotoTeste(cod, preco){
  var c = document.createElement("canvas"); c.width = 600; c.height = 600; var g = c.getContext("2d");
  g.fillStyle = "#E7E1D6"; g.fillRect(0, 0, 600, 600);
  g.strokeStyle = "#C9A24A"; g.lineWidth = 16; g.beginPath(); g.arc(300, 230, 120, 0, Math.PI*2); g.stroke();
  g.strokeStyle = "#B8903A"; g.lineWidth = 6; g.beginPath(); g.arc(300, 230, 70, 0, Math.PI*2); g.stroke();
  g.fillStyle = "#FFFFFF"; g.strokeStyle = "#555555"; g.lineWidth = 3; g.font = "bold 46px Arial"; g.textAlign = "center";
  [cod, preco, "peso: 4.0"].forEach(function(t, i){ g.strokeText(t, 300, 430+i*54); g.fillText(t, 300, 430+i*54); });
  return c.toDataURL("image/jpeg", 0.8);
}

function Campo(p){   // texto que grava ao sair do campo (ou Enter); "key" refaz o campo quando o valor de fora muda
  var ini = p.v==null ? "" : String(p.v);
  return e("input",{key:ini, defaultValue:ini, readOnly:p.off, placeholder:p.dica, "aria-label":p.rot, title:p.rot, "data-cod":p.cod ? "1" : undefined, inputMode:p.num ? "numeric" : "text",
    onBlur:function(ev){ var v = ev.target.value; if(p.num) v = v.replace(/\D/g, ""); if(!p.off && v!==ini) p.onSet(v); else if(p.num) ev.target.value = ini; },
    onKeyDown:function(ev){ if(ev.key==="Enter"){ var todos = p.cod ? [].slice.call(document.querySelectorAll("[data-cod]")) : [], i = todos.indexOf(ev.target); ev.target.blur(); if(i>=0 && todos[i+1]) todos[i+1].focus(); } },
    className:CAMPO+" text-center", style:p.w ? {width:p.w} : undefined});
}
function Sel(p){
  return e("select",{value:p.v, disabled:p.off, "aria-label":p.rot, title:p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:CAMPO+" cursor-pointer text-center", style:p.w ? {width:p.w} : undefined},
    p.opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
}
function Marca(p){ return e("input",{type:"checkbox", checked:!!p.on, disabled:p.off, "aria-label":p.rot, title:p.rot, onChange:function(ev){ p.set(ev.target.checked); }, className:"size-4 cursor-pointer accent-[#E8B84B]"}); }

function AbaCompras(){
  var x = useCpc(), c = x.c, pode = podeFazer(c, "pedidos_bruto", x.por, x.admin), lista = c.compras || [];
  var ss = useState(""), selId = ss[0], mg = useState(null), msg = mg[0], oc = useState(false), ocupado = oc[0];
  var mk = useState({}), marcas = mk[0], md = useState(null), modal = md[0];
  var cp = lista.find(function(k){ return k.id===selId; }) || lista[0] || null, vivo = useRef(null); vivo.current = cp;
  var aviso = function(t, tom){ mg[1]({t:t, tom:tom || ""}); };
  var ed = function(patch){ return vivo.current ? x.exec("compra_edit", Object.assign({id:vivo.current.id}, patch)) : false; };

  var barra = e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      lista.length>0 && e("select",{value:cp ? cp.id : "", "aria-label":"Compra", title:"Compra", onChange:function(ev){ ss[1](ev.target.value); mk[1]({}); }, className:CAMPO+" cursor-pointer text-center", style:{width:"20rem"}},
        lista.map(function(k){ return e("option",{key:k.id, value:k.id}, k.forn+" · "+(k.controle ? "controle "+k.controle : "sem romaneio")+" · "+dmy(k.criado)); })),
      cp && e(Segmentado,{opcoes:PASSOS, atual:cp.passo, onMudar:function(p){ ed({passo:p}); mk[1]({}); }})),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      cp && pode && e(Botao,{onClick:function(){ if(window.confirm("Remover esta compra (fotos e linhas)?")){ x.exec("compra_del", {id:cp.id}); ss[1](""); } }}, "Remover compra"),
      pode && e(Botao,{principal:true, onClick:function(){ if(x.exec("compra_add", {forn:"Adereço"})){ ss[1](""); mk[1]({}); aviso("Compra criada. Adicione as fotos e o romaneio.", "ok"); } }}, "Nova compra")));

  var corpo;
  if(!cp){ corpo = e("p",{className:"rounded-lg border border-border bg-card/60 px-3 py-6 text-center text-[13px]"}, "Nenhuma compra ainda. Clique em Nova compra."); }
  else {
    var lig = ligarFotos(cp.linhas, cp.fotos, cp.manual), fotoPorId = {}; cp.fotos.forEach(function(f){ fotoPorId[f.id] = f; });
    var usadas = {}; Object.keys(lig).forEach(function(k){ if(lig[k]) usadas[lig[k]] = true; });
    var semFoto = cp.linhas.filter(function(l){ return !lig[l.id]; }).length, pecas = cp.linhas.reduce(function(t, l){ return t+l.qtd; }, 0), total = cp.linhas.reduce(function(t, l){ return t+l.total; }, 0);
    var banhos = BANHOS_PADRAO.concat((cp.banhosExtra || []).filter(function(b){ return BANHOS_PADRAO.indexOf(b)<0; }));
    var comBanho = cp.linhas.filter(function(l){ return l.banho; }).length;
    var setLinha = function(lid, patch){ ed({linhas:vivo.current.linhas.map(function(l){ return l.id===lid ? Object.assign({}, l, patch) : l; })}); };
    var setFoto = function(fid, patch){ ed({fotos:vivo.current.fotos.map(function(f){ return f.id===fid ? Object.assign({}, f, patch) : f; })}); };
    var novoBanho = function(){ var n = (window.prompt("Nome do novo banho (ex.: Ouro 6):") || "").trim(); if(!n) return ""; if(banhos.indexOf(n)<0) ed({banhosExtra:(cp.banhosExtra || []).concat([n])}); return n; };
    var escolheBanho = function(v, depois){ if(v==="__outro"){ var n = novoBanho(); if(n) depois(n); } else depois(v); };
    var opBanho = [["", "Sem banho"]].concat(banhos.map(function(b){ return [b, b]; })).concat([["__outro", "Outro banho…"]]);
    var fotoDaLinha = function(l){ var f = fotoPorId[lig[l.id]]; return f ? f : null; };

    // ── passo 1: Adereço ──
    var importa = function(linhas, arq){
      var r = lerRomaneio(linhas);
      if(!r.linhas.length){ aviso("Não encontrei linhas de peças neste romaneio.", "ruim"); return; }
      var ls = r.linhas.map(function(l, i){ return {id:"ln"+(i+1)+id(""), cod:l.cod, ref:l.ref, desc:l.desc, qtd:l.qtd, unM:l.unM, liqM:l.liqM, total:l.total, banho:"", verniz:false, recebido:""}; });
      ed({controle:r.controle, emissao:r.emissao, descPct:r.descPct || 0.25, linhas:ls, manual:{}});
      var av = conferirRomaneio(linhas, r);
      aviso("Romaneio "+r.controle+" lido: "+plural(r.linhas.length, "linha", "linhas")+", "+r.qtd.toLocaleString("pt-BR")+" peças, R$ "+reais(r.total)+"."+(av.length ? " Atenção: "+av.join(" ") : ""), av.length ? "alerta" : "ok");
      if(arq) lerArquivo(arq).then(function(a){ return enviarAnexo("cpc", a); }).then(function(m){ ed({pdfArq:m}); }, function(){});
    };
    var lePdf = function(arq){ if(!arq) return; aviso("Lendo o romaneio…"); linhasDoPdf(arq).then(function(l){ importa(l, arq); }, function(er){ aviso(er.message, "ruim"); }); };
    var addFotos = async function(arqs){
      if(!arqs.length) return; oc[1](true); var novas = [], erros = 0;
      for(var i = 0; i<arqs.length; i++){
        try { var url = await reduzir(arqs[i]), m = await enviarAnexo("cpc", {nome:arqs[i].name.replace(/\.[a-z0-9]+$/i, "")+".jpg", mime:"image/jpeg", url:url}); novas.push({id:id("ft"), key:m.key, codigo:"", preco:"", nome:arqs[i].name}); }
        catch(er){ erros++; }
      }
      if(novas.length) ed({fotos:vivo.current.fotos.concat(novas)});
      oc[1](false); aviso(novas.length ? plural(novas.length, "foto adicionada", "fotos adicionadas")+". Digite o código de cada uma."+(erros ? " "+plural(erros, "não deu", "não deram")+" certo." : "") : "Nenhuma foto foi adicionada.", novas.length ? "ok" : "ruim");
    };
    var adicionaTeste = async function(){
      oc[1](true); var novas = [];
      for(var i = 0; i<TESTE.length; i++){
        try { var m = await enviarAnexo("cpc", {nome:TESTE[i][0]+".jpg", mime:"image/jpeg", url:fotoTeste(TESTE[i][0], TESTE[i][1])}); novas.push({id:id("ft"), key:m.key, codigo:TESTE[i][0], preco:TESTE[i][1], nome:TESTE[i][0]+" (teste)"}); } catch(er){}
      }
      if(novas.length) ed({fotos:vivo.current.fotos.concat(novas)});
      oc[1](false); aviso("Fotos de teste adicionadas ("+novas.length+").", "ok");
    };
    var tools = e("div",{className:"flex flex-wrap items-center gap-2"},
      e("label",{className:"inline-flex h-8 min-w-24 cursor-pointer items-center justify-center rounded-md border border-primary bg-primary/20 px-3.5 text-[13px] font-semibold text-primary hover:bg-primary/30"}, "Adicionar fotos", e("input",{type:"file", accept:"image/*", multiple:true, disabled:!pode || ocupado, className:"hidden", onChange:function(ev){ var f = [].slice.call(ev.target.files); ev.target.value = ""; addFotos(f); }})),
      e("label",{className:"inline-flex h-8 min-w-24 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-3.5 text-[13px] hover:bg-white/10"}, "Importar romaneio (PDF)", e("input",{type:"file", accept:"application/pdf,.pdf", disabled:!pode || ocupado, className:"hidden", onChange:function(ev){ var f = ev.target.files[0]; ev.target.value = ""; lePdf(f); }})),
      e(Botao,{desabilitado:!pode, onClick:function(){ md[1]({tipo:"colar", texto:""}); }}, "Colar texto do romaneio"),
      cp.pdfArq && e(Botao,{onClick:function(){ abrirAnexo(cp.pdfArq.key).catch(function(er){ aviso(er.message, "ruim"); }); }}, "Abrir o PDF"),
      pode && e(Botao,{desabilitado:ocupado, onClick:adicionaTeste, title:"Cria 4 fotos simuladas (CH6910, CH7056, CH7179 e PA3578-40cm) para testar a ligação"}, "Fotos de teste"));
    var resumo = e("p",{className:"text-[13px]"}, cp.linhas.length ? [
      "Controle ", e("b",{key:"c"}, cp.controle || "—"), " · "+(dmy(cp.emissao) || "sem data")+" · "+plural(cp.linhas.length, "linha", "linhas")+" · "+pecas.toLocaleString("pt-BR")+" peças · ", e("b",{key:"t"}, "R$ "+reais(total)), " · "+plural(cp.fotos.length, "foto", "fotos"),
      semFoto>0 && e("b",{key:"s", className:"text-warning"}, " · "+plural(semFoto, "linha sem foto", "linhas sem foto"))] : "Ainda sem romaneio. Importe o PDF ou cole o texto. "+plural(cp.fotos.length, "foto", "fotos")+".");
    var cartoes = cp.fotos.length>0 && e("div",{className:"grid gap-2", style:{gridTemplateColumns:"repeat(auto-fill, minmax(11.5rem, 1fr))"}}, cp.fotos.map(function(f){
      var linhaDela = cp.linhas.filter(function(l){ return lig[l.id]===f.id; }), pm = precoDaFoto(f.preco);
      return e("div",{key:f.id, className:"flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/60 p-2"},
        e(Foto,{k:f.key, h:150, w:"100%", alt:f.codigo}),
        e(Campo,{v:f.codigo, dica:"Código da foto", rot:"Código da foto", cod:true, off:!pode, onSet:function(v){ setFoto(f.id, {codigo:v}); }}),
        e(Campo,{v:f.preco, dica:"Preço, ex.: 11/30", rot:"Preço escrito na foto", off:!pode, onSet:function(v){ setFoto(f.id, {preco:v}); }}),
        pm>0 && e("span",{className:"text-[11px]"}, "Com "+Math.round(cp.descPct*100)+"% de desconto: R$ "+reaisM(liquidoDaFoto(pm, cp.descPct))),
        e("span",{className:"text-[13px] font-semibold "+(linhaDela.length ? "text-success" : "text-warning")}, linhaDela.length ? "Ligada a "+linhaDela.map(function(l){ return l.ref; }).join(", ") : "Sem linha"),
        pode && e("button",{type:"button", onClick:function(){ ed({fotos:vivo.current.fotos.filter(function(o){ return o.id!==f.id; })}); }, className:"text-[11px] underline hover:text-destructive"}, "Remover foto"));
    }));
    var tab1 = cp.linhas.length>0 && e(TabelaCampos,{cols:[{t:"Foto", w:"130px"}, {t:"Ref.", w:"11%"}, {t:"Descrição", w:"16%"}, {t:"Qtd.", w:"7%"}, {t:"Preço de lista", w:"11%"}, {t:"Líquido", w:"11%"}, {t:"Total", w:"12%"}, {t:"Situação"}], minW:"64rem"},
      cp.linhas.map(function(l){ var f = fotoDaLinha(l);
        return e(FileiraCampos,{key:l.id, alto:ALTO_FOTO, cells:[e(Foto,{k:f ? f.key : "", h:96, w:112}), l.ref, l.desc, l.qtd.toLocaleString("pt-BR"), "R$ "+reaisM(l.unM), "R$ "+reaisM(l.liqM), "R$ "+reais(l.total),
          f ? {v:"Ligada", cor:"#22C55E"} : e("span",{className:"flex items-center gap-2"}, e("b",{className:"text-warning"}, "Sem foto"), pode && cp.fotos.length>0 && e(Botao,{onClick:function(){ md[1]({tipo:"foto", lid:l.id}); }}, "Escolher foto"))]}); })
        .concat([e(FileiraCampos,{key:"tot", total:true, cells:["Total", "", "", pecas.toLocaleString("pt-BR"), "", "", "R$ "+reais(total), ""]})]));

    // ── passo 2: Banho ──
    var marcadas = cp.linhas.filter(function(l){ return marcas[l.id]; });
    var lote = (marcas.__banho !== undefined ? marcas.__banho : ""), loteVerniz = !!marcas.__verniz;
    var setLote = function(p){ mk[1](Object.assign({}, marcas, p)); };
    var aplica = function(){
      if(!marcadas.length){ aviso("Marque as linhas primeiro.", "alerta"); return; }
      if(!lote){ aviso("Escolha o banho.", "alerta"); return; }
      ed({linhas:cp.linhas.map(function(l){ return marcas[l.id] ? Object.assign({}, l, {banho:lote, verniz:ehOuro(lote) && loteVerniz}) : l; })});
      aviso(plural(marcadas.length, "linha recebeu", "linhas receberam")+" "+rotuloBanho(lote, loteVerniz)+".", "ok"); mk[1]({__banho:lote, __verniz:loteVerniz});
    };
    var marca = function(fn){ var m = {__banho:lote, __verniz:loteVerniz}; cp.linhas.forEach(function(l){ if(fn(l)) m[l.id] = true; }); mk[1](m); };
    var bar2 = e("div",{className:"flex flex-wrap items-center gap-2"},
      e(Sel,{v:lote, rot:"Banho para as marcadas", w:"12rem", opcoes:opBanho, set:function(v){ escolheBanho(v, function(n){ setLote({__banho:n, __verniz:ehOuro(n) ? loteVerniz : false}); }); }}),
      e("label",{className:"inline-flex h-8 items-center gap-1.5 text-[13px]"}, e(Marca,{on:loteVerniz && ehOuro(lote), off:!ehOuro(lote), rot:"Com verniz", set:function(v){ setLote({__verniz:v}); }}), "+ verniz"),
      e(Botao,{principal:true, desabilitado:!pode, onClick:aplica}, "Aplicar às marcadas"),
      e(Botao,{onClick:function(){ marca(function(l){ return !l.banho; }); }}, "Marcar as sem banho"),
      e(Botao,{onClick:function(){ marca(function(){ return true; }); }}, "Marcar todas"),
      e(Botao,{onClick:function(){ mk[1]({__banho:lote, __verniz:loteVerniz}); }}, "Desmarcar"),
      e("b",{className:"text-[13px] "+(comBanho===cp.linhas.length && cp.linhas.length ? "text-success" : "")}, comBanho+" de "+cp.linhas.length+" com banho"));
    var tab2 = cp.linhas.length>0 && e(TabelaCampos,{cols:[{t:"Marcar", w:"80px"}, {t:"Foto", w:"130px"}, {t:"Ref.", w:"12%"}, {t:"Descrição", w:"18%"}, {t:"Qtd.", w:"8%"}, {t:"Banho", w:"17%"}, {t:"Verniz"}], minW:"60rem"},
      cp.linhas.map(function(l){ var f = fotoDaLinha(l);
        return e(FileiraCampos,{key:l.id, alto:ALTO_FOTO, cells:[e(Marca,{on:marcas[l.id], rot:"Marcar "+l.ref, set:function(v){ var m = Object.assign({}, marcas); if(v) m[l.id] = true; else delete m[l.id]; mk[1](m); }}), e(Foto,{k:f ? f.key : "", h:96, w:112}), l.ref, l.desc, l.qtd.toLocaleString("pt-BR"),
          e(Sel,{v:l.banho || "", rot:"Banho de "+l.ref, off:!pode, w:"100%", opcoes:opBanho, set:function(v){ escolheBanho(v, function(n){ setLinha(l.id, {banho:n, verniz:ehOuro(n) ? l.verniz : false}); }); }}),
          ehOuro(l.banho) ? e("label",{className:"inline-flex items-center gap-1.5"}, e(Marca,{on:l.verniz, off:!pode, rot:"Verniz em "+l.ref, set:function(v){ setLinha(l.id, {verniz:v}); }}), "+ verniz") : "—"]}); }));

    // ── passo 3: Recebido ──
    var bar3 = e("div",{className:"flex flex-wrap items-center gap-2"},
      e(Botao,{desabilitado:!pode, onClick:function(){ ed({linhas:cp.linhas.map(function(l){ return Object.assign({}, l, {recebido:String(l.qtd)}); })}); aviso("Recebido igual ao pedido.", "ok"); }}, "Recebido = pedido"));
    var tab3 = cp.linhas.length>0 && e(TabelaCampos,{cols:[{t:"Foto", w:"130px"}, {t:"Ref.", w:"14%"}, {t:"Banho", w:"18%"}, {t:"Pedido", w:"12%"}, {t:"Recebido", w:"16%"}, {t:"Diferença"}], minW:"52rem"},
      cp.linhas.map(function(l){ var f = fotoDaLinha(l), d = diferenca(l);
        return e(FileiraCampos,{key:l.id, alto:ALTO_FOTO, cells:[e(Foto,{k:f ? f.key : "", h:96, w:112}), l.ref, rotuloBanho(l.banho, l.verniz) || "Sem banho", l.qtd.toLocaleString("pt-BR"),
          e(Campo,{v:l.recebido, dica:String(l.qtd), num:true, rot:"Recebido de "+l.ref, off:!pode, w:"7rem", onSet:function(v){ setLinha(l.id, {recebido:v}); }}),
          d===null ? "—" : d===0 ? {v:"Confere", cor:"#22C55E"} : {v:(d>0 ? "+" : "")+d, cor:"#EAB308"}]}); }));

    var imprimir = function(modo){
      var w = window.open("", "_blank"); if(!w){ aviso("O navegador bloqueou a janela do PDF. Libere pop-ups para este endereço.", "ruim"); return; }
      w.document.write("<p style=\"font-family:Arial\">Preparando o romaneio…</p>");
      var ids = cp.linhas.map(function(l){ return lig[l.id]; }).filter(function(v, i, a){ return v && a.indexOf(v)===i; });
      Promise.all(ids.map(function(fid){ return urlAnexo(fotoPorId[fid].key).then(function(u){ return [fid, u]; }, function(){ return [fid, ""]; }); })).then(function(pares){
        var urls = {}; pares.forEach(function(p){ urls[p[0]] = p[1]; });
        w.document.open(); w.document.write(htmlRomaneio(cp, modo, urls, lig)); w.document.close(); setTimeout(function(){ w.focus(); w.print(); }, 700);
      });
    };
    var gerarPontual = function(){
      var sem = cp.linhas.length-comBanho;
      if(!cp.linhas.length){ aviso("Importe o romaneio primeiro.", "alerta"); return; }
      if(sem>0 && !window.confirm(plural(sem, "linha está", "linhas estão")+" sem banho. Gerar mesmo assim?")) return;
      imprimir("pontual");
    };

    var rodape = cp.passo==="adereco" ? [e(Botao,{key:"v", principal:true, onClick:function(){ ed({passo:"banho"}); }}, "Ir para o banho")]
      : cp.passo==="banho" ? [e(Botao,{key:"a", onClick:function(){ ed({passo:"adereco"}); }}, "Voltar"), e(Botao,{key:"g", principal:true, onClick:gerarPontual}, "Gerar romaneio para a Pontual"), e(Botao,{key:"p", onClick:function(){ ed({passo:"recebido"}); }}, "Ir para o recebido")]
      : [e(Botao,{key:"a", onClick:function(){ ed({passo:"banho"}); }}, "Voltar"), e(Botao,{key:"g", principal:true, onClick:function(){ if(cp.linhas.length) imprimir("rayssa"); else aviso("Importe o romaneio primeiro.", "alerta"); }}, "Gerar romaneio para a Rayssa")];

    corpo = e("div",{className:"flex flex-col gap-2.5"},
      cp.passo==="adereco" && tools, cp.passo==="adereco" && resumo, cp.passo==="adereco" && cartoes, cp.passo==="adereco" && tab1,
      cp.passo==="banho" && bar2, cp.passo==="banho" && tab2,
      cp.passo==="recebido" && bar3, cp.passo==="recebido" && tab3,
      e("div",{className:"sticky bottom-0 flex flex-wrap justify-center gap-2 border-t border-border bg-background py-2"}, rodape),
      modal && modal.tipo==="foto" && e(Janela,{t:"Escolher foto", sub:"Linha "+((cp.linhas.find(function(l){ return l.id===modal.lid; }) || {}).ref || ""), fechar:function(){ md[1](null); }, colunas:[
        e("div",{key:"g", className:"grid gap-2", style:{gridColumn:"1 / -1", gridTemplateColumns:"repeat(auto-fill, minmax(10rem, 1fr))"}}, cp.fotos.map(function(f){
          return e("button",{key:f.id, type:"button", onClick:function(){ var m = Object.assign({}, cp.manual); m[modal.lid] = f.id; ed({manual:m}); md[1](null); }, className:"flex flex-col items-center gap-1 rounded-lg border border-border bg-card/60 p-2 text-[13px] hover:bg-white/10"}, e(Foto,{k:f.key, h:130, w:"100%"}), f.codigo || "Sem código", usadas[f.id] ? e("span",{className:"text-[11px]"}, "Já ligada") : null); }))]}),
      modal && modal.tipo==="colar" && e(Janela,{t:"Colar texto do romaneio", sub:"Cole o texto do PDF. Cada produto precisa estar numa linha só.", fechar:function(){ md[1](null); }, colunas:[
        e("div",{key:"c", className:"flex flex-col gap-2", style:{gridColumn:"1 / -1"}},
          e("textarea",{value:modal.texto, onChange:function(ev){ md[1]({tipo:"colar", texto:ev.target.value}); }, "aria-label":"Texto do romaneio", className:"w-full rounded-md border border-border bg-card p-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary", style:{height:"16rem"}}),
          e("div",{className:"flex justify-center"}, e(Botao,{principal:true, onClick:function(){ var l = modal.texto.split(/\r?\n/).map(function(t){ return t.replace(/\s+/g, " ").trim(); }).filter(Boolean); md[1](null); importa(l, null); }}, "Ler texto")))]}));
  }

  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Compras", sub:"Fornecedor de bruto, banho e recebimento, com a foto da peça do começo ao fim."}),
    barra,
    msg && e("p",{role:"status", className:"rounded-lg px-3 py-2 text-[13px] font-semibold "+(msg.tom==="ruim" ? "bg-destructive/15 text-destructive" : msg.tom==="alerta" ? "bg-warning/15 text-warning" : msg.tom==="ok" ? "bg-success/15 text-success" : "bg-card/60")}, msg.t),
    corpo);
}

export { AbaCompras };
