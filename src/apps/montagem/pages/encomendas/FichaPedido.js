// Sorelly Admin · montagem — pages/encomendas/FichaPedido.js
// FICHA DO PEDIDO da reposição entregue pelo João, igual ao MODELO 1 aprovado (docs/ideias/ficha-pedido-4-modelos.html, Marcus: "cartão bonito, maior para os lados do que para cima, fotos lado a lado"; 17/11/2026).
// Cartão largo (1180 px) com topo azul e fundo em degradê, três zonas: Revendedora | fotos lado a lado (4 por linha, origem em cima e nota embaixo) e o que procurar | Andamento (etapas na vertical, taxa e botões).
// Visão limpa por padrão: só o que se lê e as caixas "Separada". O botão Editar (no topo) mostra o que muda coisas: origem e nota das fotos, tirar foto, adicionar fotos, tirar item, novo item e quem atende.
// Fotos vão para o servidor (lib/anexo.js, módulo er); o pedido guarda só a chave. Cola com Ctrl+V ou escolhe do computador (até 20). Regras em domain/encomendas.js (ops ped_item_*, ped_foto_*, ped_taxa, ped_bipar).
import { Botao, CAMPO } from "@/apps/montagem/components/padrao-fin";
import { FINAIS, ROTULO_STATUS, acessoReposicao, caminhoDe, qtdMes, revPorNome, formatarDataHora, formatarReais, fotoDaRevendedora, mensagemTexto, proximaEtapa } from "@/apps/montagem/domain/encomendas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { abrirAnexo, enviarAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { baixarArquivo, salvarArquivo } from "@/apps/montagem/lib/arquivos";
import { baixarBlob, gerarPdfPedido } from "@/apps/montagem/lib/pdf-pedido";
import { Foto } from "@/apps/montagem/pages/encomendas/Atencao";
import { avancarPedido } from "@/apps/montagem/pages/encomendas/Quadro";
import { baseLink, copiar, copiarDepois } from "@/apps/montagem/pages/encomendas/visual";
import { e, useEffect, useRef, useState } from "@/shared/react";

var EQUIPE = ["Agatha", "Elen", "Eduarda Gabriela"];
var RESULTADOS = [["", "Resultado"], ["igual", "Achou igual"], ["parecido", "Achou parecido"], ["nao", "Não achou"]];
var ROTULO_RES = {igual:"Achou igual", parecido:"Achou parecido", nao:"Não achou"};
var COR_RES = {igual:"border-[#4ade80] text-[#bbf7d0]", parecido:"border-[#fbbf24] text-[#fde68a]", nao:"border-[#f87171] text-[#fecaca]"};
var LISTA_REV = null;   // revendedoras da DevMaster (uma leitura só); quem não tem acesso fica sem preenchimento automático
function listaRevendedoras(){ if(!LISTA_REV) LISTA_REV = chamar("GET", "/revendedoras").then(function(j){ return j.itens || []; }, function(x){ LISTA_REV = null; throw x; }); return LISTA_REV; }
var semAc = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var FOTOS_DM = {};   // código → Promise do data URL da foto da peça na DevMaster (desce uma vez)
function fotoDm(cod){
  if(!FOTOS_DM[cod]) FOTOS_DM[cod] = chamar("GET", "/encomendas/pecas/foto?cod="+encodeURIComponent(cod)).then(function(r){ return r.url || ""; }, function(x){ delete FOTOS_DM[cod]; throw x; });
  return FOTOS_DM[cod];
}
// foto da peça achada, lida da DevMaster pelo código que a funcionária digitou
function FotoDm(p){
  var st = useState(""), u = st[0], sl = useState(true), carrega = sl[0];
  useEffect(function(){ var vivo = true; st[1](""); sl[1](true); fotoDm(p.cod).then(function(x){ if(vivo){ st[1](x); sl[1](false); } }, function(){ if(vivo) sl[1](false); }); return function(){ vivo = false; }; }, [p.cod]);   // eslint-disable-line react-hooks/exhaustive-deps
  return u ? e("img",{src:u, alt:p.alt, className:p.cls}) : e("span",{className:"grid place-items-center px-2 text-center text-[11px] "+p.cls}, carrega ? "Carregando" : "Sem foto na DevMaster");
}
// código da peça achada: grava ao sair do campo e já busca o nome na DevMaster
function CodigoAchado(p){
  var st = useState(null), v = st[0], atual = p.v || "";
  var sb = useState(""), aviso = sb[0];
  var grava = function(){
    if(v===null) return; var c = String(v).trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); st[1](null); if(c===atual) return;
    if(!c){ sb[1](""); p.on("", ""); return; }
    sb[1]("Buscando na DevMaster");
    chamar("GET", "/encomendas/pecas?cods="+c).then(function(r){ var d = (r.pecas || [])[0]; sb[1](d && d.existe ? "" : "Código não encontrado na DevMaster"); p.on(c, d && d.existe ? d.desc : ""); }, function(){ sb[1]("Sem conexão com a DevMaster"); p.on(c, ""); });
  };
  return e("div",{className:"flex min-w-0 flex-col gap-1"},
    e("div",{className:"flex min-w-0 gap-1"},
      e("input",{type:"text", value:v===null ? atual : v, placeholder:"Código da peça", "aria-label":"Código da peça achada", onChange:function(ev){ st[1](ev.target.value); }, onBlur:grava, onKeyDown:function(ev){ if(ev.key==="Enter") ev.currentTarget.blur(); }, className:CAMPO+" min-w-0 flex-1 px-2 text-[11px]! uppercase placeholder:normal-case"}),
      e("button",{type:"button", onMouseDown:function(ev){ ev.preventDefault(); grava(); }, className:"h-8 shrink-0 rounded-md border border-border bg-card px-2 text-[11px] font-semibold hover:bg-white/10"}, "Buscar")),
    aviso && e("span",{className:"text-center text-[11px]"}, aviso));
}
var AREA = "w-full min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
var BTN_S = "h-8 w-full min-w-0 whitespace-nowrap rounded-md border px-2 text-[11px]";
var BTN_V ="h-8 min-w-24 max-w-full rounded-md border border-[#f87171]/60 bg-[#f87171]/15 px-3.5 text-[13px] font-semibold text-[#fecaca] hover:bg-[#f87171]/25";

// moldura: cartão largo, barra azul no topo (com o botão Editar) e fundo em degradê simples
function Moldura(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:(p.compacto ? "flex max-h-[min(94vh,960px)] w-full max-w-[880px] flex-col overflow-hidden rounded-xl border-2 border-[var(--bloco-titulo)] shadow-2xl" : "flex h-[min(94vh,960px)] w-full max-w-[1580px] flex-col overflow-hidden rounded-xl border-2 border-[var(--bloco-titulo)] shadow-2xl"), style:{background:"linear-gradient(180deg, #1d2c4d 0%, #12151c 58%)"}},
      e("div",{className:"relative flex shrink-0 items-center justify-center bg-[var(--bloco-titulo)] px-24 py-1 text-white"},
        e("h2",{className:"text-[11px] font-bold uppercase leading-tight"}, p.t),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-[13px] font-bold leading-none hover:bg-white/15"}, "×")),
      // esquerda FIXA (revendedora, andamento e ações) e direita que rola (pedido × peças, fotos, histórico)
      e("div",{className:"grid min-h-0 gap-2.5 py-2.5 pl-1.5 pr-2.5 lg:grid-cols-[256px_minmax(0,1fr)] "+(p.compacto ? "overflow-y-auto" : "flex-1")},
        e("div",{className:"flex min-h-0 flex-col gap-2 overflow-y-auto [&>*]:shrink-0"}, p.colunas[0]),
        // direita: o pedido dela fica FIXO no topo (texto + fotos com zoom); embaixo, o trabalho rola
        e("div",{className:"flex min-h-0 min-w-0 flex-col gap-2"}, p.fixoDir,
          e("div",{className:"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5 [&>*]:shrink-0"}, p.colunas[1], p.rodape)))));
}
// caixa com a faixa dos nomes das colunas no alto (igual ao HTML do modelo 1)
function Caixa(p){
  return e("section",{className:"overflow-hidden rounded-lg border border-white/20 bg-black/20 shadow-[0_0_0_.5px_rgba(255,255,255,.55)]"},
    e("h3",{onClick:p.aoTitulo, className:"flex items-center justify-between gap-2 bg-[var(--bloco-colunas)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.05em]"+(p.aoTitulo ? " cursor-pointer select-none hover:brightness-125" : "")}, e("span",null, p.t), p.dir),
    p.semCorpo ? null : e("div",{className:"px-2.5 py-2"+(p.grade ? " grid items-start gap-x-6 gap-y-1.5 sm:grid-cols-2" : "")}, p.children));
}
function Par(p){ return e("div",{className:"flex justify-between gap-3.5 border-b border-white/20 py-[3px] last:border-b-0 "+(p.leve ? "text-[11px]" : "text-[13px]")}, e("span",{className:p.leve ? "" : "font-medium"}, p.t),e("span",{className:"text-right tabular-nums "+(p.cor || "")}, p.v)); }

// nota da foto (só no modo Editar): grava ao sair do campo
function NotaFoto(p){
  var st = useState(null), v = st[0], atual = p.v || "";
  return e("input",{type:"text", value:v===null ? atual : v, placeholder:"O que é", "aria-label":"Nota da foto", onChange:function(ev){ st[1](ev.target.value); }, onBlur:function(){ if(v!==null && v!==atual) p.on(v); st[1](null); if(p.fim) p.fim(); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.currentTarget.blur(); }, autoFocus:!!p.auto, className:CAMPO+" w-full px-2 text-[11px]!"});
}

function frase(t){ var x = String(t || "").toLowerCase().replace(/\b(folhead[oa]s?|banhad[oa]s?)\b/g, " ").replace(/\s+/g, " ").trim(); return x.charAt(0).toUpperCase()+x.slice(1); }   // REGRA (Marcus, 17/11/2026): nome da peça em letra normal e SEM "folheado" nem "banhado" (todas são, não precisa escrever)
// TIPO da peça (17/11/2026, Marcus: "separa o que é pulseira, colar, brinco"): vem do NOME da DevMaster (primeira palavra); se não achar, do começo do código
var GRUPOS = ["Pulseiras", "Colares", "Brincos", "Anéis", "Conjuntos", "Tornozeleiras", "Pingentes", "Outras"];
function tipoDaPeca(y){
  var d = String((y && y.desc) || "").toUpperCase().trim(), c = String((y && y.cod) || "").toUpperCase(), p = d.split(/\s+/)[0] || "";
  if(/^(PULSEIRA|BRACELETE)/.test(p)) return "Pulseiras";
  if(/^(COLAR|CHOKER|GARGANTILHA|CORRENTE)/.test(p)) return "Colares";
  if(/^(BRINCO|ARGOLA)/.test(p)) return "Brincos";
  if(/^(ANEL|ANÉIS|ANEIS|ALIANÇA)/.test(p)) return "Anéis";
  if(/^(CONJUNTO|KIT|TRIO)/.test(p)) return "Conjuntos";
  if(/^TORNOZELEIRA/.test(p)) return "Tornozeleiras";
  if(/^PINGENTE/.test(p)) return "Pingentes";
  if(/PULSEIRA/.test(d)) return "Pulseiras"; if(/COLAR|CHOKER/.test(d)) return "Colares"; if(/BRINCO/.test(d)) return "Brincos"; if(/ANEL/.test(d)) return "Anéis";
  if(/^(CK|CL|COL)/.test(c)) return "Colares"; if(/^P\d/.test(c)) return "Pulseiras"; if(/^(BB|B\d)/.test(c)) return "Brincos"; if(/^(A\d|AA)/.test(c)) return "Anéis";
  return "Outras";
}
// uma cor para cada tipo (faixa do bloco, borda e fundo suave)
var COR_GRUPO = {Pulseiras:"#E8B84B", Colares:"#5B8DEF", Brincos:"#A78BFA", "Anéis":"#2DD4BF", Conjuntos:"#F472B6", Tornozeleiras:"#FB923C", Pingentes:"#A3E635", Outras:"#94A3B8"};
function agruparPecas(pecas){
  var por = {}; (pecas || []).forEach(function(y){ var t = tipoDaPeca(y); (por[t] = por[t] || []).push(y); });
  return GRUPOS.filter(function(g){ return por[g]; }).map(function(g){ return {nome:g, pecas:por[g]}; });
}

// PEÇAS SEPARADAS (17/11/2026, Marcus): cola a lista de códigos; nome, foto e preço vêm da DevMaster (o preço digitado é ignorado). Cada peça liga a um item que ela pediu e marca igual ou parecido.
function PecasSeparadas(p){
  var x = p.x, pecas = x.pecas || [], itens = x.itens || [], edita = p.edita;
  var st = useState({txt:"", aviso:"", busca:false, itens:""}), v = st[0];
  var set = function(k, y){ st[1](function(o){ var n = Object.assign({}, o); n[k] = y; return n; }); };
  var soma = pecas.reduce(function(s, y){ return s+(y.preco || 0); }, 0);
  var sm = useState({}), mapa = sm[0];   // código → true/false: a DevMaster tem foto desta peça?
  useEffect(function(){
    var vivo = true;
    pecas.forEach(function(y){ if(y.anexo || mapa[y.cod]!==undefined) return; fotoDm(y.cod).then(function(u){ if(vivo) sm[1](function(o){ var n = Object.assign({}, o); n[y.cod] = !!u; return n; }); }, function(){}); });
    return function(){ vivo = false; };
  }, [pecas.length]);   // eslint-disable-line react-hooks/exhaustive-deps
  var buscar = function(){
    var vistos = {}, cods = (String(v.txt).toUpperCase().match(/[A-Z]{1,5}\d{3,9}/g) || []).filter(function(c){ if(vistos[c]) return false; vistos[c] = 1; return true; });
    if(!cods.length){ set("aviso", "Não achei nenhum código no texto."); return; }
    set("busca", true); set("aviso", "Buscando "+cods.length+" códigos na DevMaster");
    var lotes = []; for(var i = 0; i<cods.length; i += 40) lotes.push(cods.slice(i, i+40));
    Promise.all(lotes.map(function(l){ return chamar("GET", "/encomendas/pecas?cods="+l.join(",")); })).then(function(rs){
      var todas = [].concat.apply([], rs.map(function(r){ return r.pecas || []; })), boas = todas.filter(function(y){ return y.existe; }), ruins = todas.filter(function(y){ return !y.existe; }).map(function(y){ return y.cod; });
      if(boas.length) p.exec("ped_pecas_add", {id:x.id, pecas:boas.map(function(y){ return {cod:y.cod, desc:y.desc, preco:y.preco}; })});
      set("busca", false); set("txt", ""); set("aviso", ruins.length ? ruins.length+(ruins.length===1 ? " código não existe" : " códigos não existem")+" na DevMaster: "+ruins.join(", ") : "");
    }, function(err){ set("busca", false); set("aviso", err && err.message ? err.message : "Não consegui falar com a DevMaster."); });
  };
  var sel = CAMPO+" px-2 text-[11px]!";
  // cartão da peça: foto, código, preço e o resultado (igual ou parecido)
  var cartao = function(y, cor){
    var nLig = (p.fotos || []).findIndex(function(ft){ return ft.key===y.foto; }), emLigacao = p.ligando===y.cod;
    var sg = p.sug && p.sug[y.cod], nSug = sg ? (p.fotos || []).findIndex(function(ft){ return ft.key===sg.key; }) : -1;
    return e("div",{key:y.cod, draggable:true, onDragStart:function(ev){ ev.dataTransfer.setData("text/plain", "peca:"+y.cod); ev.dataTransfer.effectAllowed = "link"; }, title:(y.desc ? frase(y.desc) : "Sem nome")+" · arraste até a foto dela para ligar", className:"flex min-w-0 cursor-grab flex-col overflow-hidden rounded-md border bg-black/30 shadow-[0_0_0_.5px_rgba(255,255,255,.55)] "+(emLigacao ? "border-[#E8B84B]" : "border-white/20")},
      e("div",{className:"relative"}, y.anexo ? e(Foto,{k:y.anexo, cls:"block h-auto w-full", alt:"Foto da peça "+y.cod}) : e(FotoDm,{cod:y.cod, cls:"block h-auto min-h-[120px] w-full", alt:"Peça "+y.cod}),
        (p.fotos || []).length>0 && (nLig>=0
          ? e("button",{type:"button", title:"Desmarcar: tirar a ligação com a Foto "+(nLig+1), onClick:function(){ p.exec("ped_peca_edit", {id:x.id, cod:y.cod, foto:""}); }, style:{background:cor+"88", textShadow:"0 1px 2px rgba(0,0,0,.6)"}, className:"absolute bottom-1 right-1 h-5 rounded-[4px] px-1.5 text-[11px] font-bold leading-none text-white hover:brightness-125"}, "Foto "+(nLig+1)+" ✕")
          : (nSug>=0 && !emLigacao) ? e("button",{type:"button", title:"Sugestão da IA ("+(sg.conf==="alta" ? "alta" : sg.conf==="media" ? "média" : "baixa")+" confiança): clique para ligar à Foto "+(nSug+1), onClick:function(){ p.aceitarSug(y.cod); }, style:{background:"#4ade80cc", color:"#14233f"}, className:"absolute bottom-1 right-1 h-5 rounded-[4px] px-1.5 text-[11px] font-bold leading-none hover:brightness-110"}, "Foto "+(nSug+1)+" ✓"+(sg.conf==="alta" ? "" : "?"))
          : e("button",{type:"button", title:"Marcar: ligar esta peça a uma foto dela", onClick:function(){ p.setLigando(emLigacao ? "" : y.cod); }, style:{background:emLigacao ? "#E8B84Bdd" : cor+"88", textShadow:emLigacao ? "none" : "0 1px 2px rgba(0,0,0,.6)", color:emLigacao ? "#14233f" : "#fff"}, className:"absolute bottom-1 right-1 h-5 rounded-[4px] px-1.5 text-[11px] font-bold leading-none hover:brightness-125"}, emLigacao ? "Cancelar" : "Ligar")),
        // código e preço dentro da foto, no canto de baixo
        e("span",{style:{background:cor+"88", textShadow:"0 1px 2px rgba(0,0,0,.6)"}, className:"absolute bottom-1 left-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-bold leading-tight text-white"}, y.cod+" · "+(y.preco ? formatarReais(y.preco) : "Sem preço"))),
      edita && e("button",{type:"button", onClick:function(){ p.exec("ped_peca_del", {id:x.id, cod:y.cod}); }, className:"m-1 h-8 rounded-md border border-border bg-card text-[11px] hover:bg-white/10"}, "Tirar"));
  };
  // peça sem foto: uma linha compacta (código, preço, nome, resultado e botão da foto do celular)
  var linhaSem = function(y, cor){
    var nL = (p.fotos || []).findIndex(function(ft){ return ft.key===y.foto; });
    return e("div",{key:y.cod, className:(edita ? "grid-cols-[minmax(0,1fr)_52px_44px]" : "grid-cols-[minmax(0,1fr)_52px]")+" grid items-center gap-1.5 border-t py-0.5", style:{borderColor:cor+"55"}},
      // código e preço em cima; o nome da peça começa direto na linha de baixo
      e("div",{className:"min-w-0 text-[11px] leading-tight"}, e("div",null, e("b",null, y.cod), "  "+(y.preco ? formatarReais(y.preco) : "Sem preço"), nL>=0 && e("b",{className:"ml-2 text-[#bbf7d0]"}, "→ Foto "+(nL+1))), e("div",null, y.desc ? frase(y.desc) : "Sem nome")),
      // um botão só: anexar a foto do celular (a peça sobe para o bloco das fotos)
      e("label",{title:"Anexar a foto do celular", style:{borderColor:cor+"cc", background:cor+"22"}, className:"inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-dashed px-1 text-center text-[11px] leading-[1.1] hover:brightness-125"}, e("span",null, "Anexar", e("br"), "foto"),
        e("input",{type:"file", accept:"image/*", className:"hidden", onChange:function(ev){ p.enviarFoto(y.cod, ev.target.files); ev.target.value = ""; }})),
      edita && e("button",{type:"button", onClick:function(){ p.exec("ped_peca_del", {id:x.id, cod:y.cod}); }, className:"h-8 w-full rounded-md border border-border bg-card text-[11px] hover:bg-white/10"}, "Tirar"));
  };
  var grupos = agruparPecas(pecas);
  var campo = e("span",{className:"flex items-center gap-1.5 font-normal normal-case tracking-normal"},
    v.aviso && e("span",{className:"max-w-[320px] text-right text-[11px] leading-tight"}, v.aviso),
    e("input",{type:"text", value:v.txt, placeholder:"Código da peça (Enter)", title:"Digite o código e aperte Enter; pode colar vários de uma vez", "aria-label":"Código da peça separada", autoComplete:"off", onChange:function(ev){ set("txt", ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter" && v.txt.trim() && !v.busca){ ev.preventDefault(); buscar(); } }, className:CAMPO+" w-[190px] px-2 text-[11px]! uppercase placeholder:normal-case"}),
    e("button",{type:"button", disabled:!v.txt.trim() || v.busca, onClick:buscar, className:"h-8 rounded-md border border-border bg-card px-2.5 text-[11px] font-bold hover:bg-white/10 disabled:opacity-50"}, v.busca ? "Buscando" : "Buscar"),
    pecas.length>0 && e("span",{className:"ml-1 text-[11px] font-bold"}, pecas.length+" peças · "+formatarReais(soma)));
  return e(Caixa,{t:"Peças separadas", dir:campo, semCorpo:grupos.length===0},
    grupos.length>0 ? e("div",{className:"flex flex-col gap-2"}, grupos.map(function(g){
      var valor = g.pecas.reduce(function(t, y){ return t+(y.preco || 0); }, 0);
      var semFoto = g.pecas.filter(function(y){ return !y.anexo && mapa[y.cod]===false; }), comFoto = g.pecas.filter(function(y){ return y.anexo || mapa[y.cod]!==false; });
      var cor = COR_GRUPO[g.nome] || "#94A3B8";
      return e("div",{key:g.nome, className:"overflow-hidden rounded-lg border", style:{boxShadow:"0 0 0 .5px "+cor+"dd", borderColor:cor+"88", background:"linear-gradient(180deg, "+cor+"14 0%, rgba(0,0,0,.22) 100%)"}},
        e("div",{className:"flex items-center justify-between gap-2 px-2.5 py-0.5", style:{background:"linear-gradient(90deg, "+cor+"55 0%, "+cor+"14 100%)"}}, e("span",{className:"text-[13px] font-bold"}, g.nome),
          e("span",{className:"text-[11px]"}, g.pecas.length+(g.pecas.length===1 ? " peça" : " peças")+" · "+formatarReais(valor))),
        e("div",{className:"grid items-start gap-1.5 p-1.5 "+(comFoto.length>0 && semFoto.length>0 ? "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" : "")},
          comFoto.length>0 && e("div",{className:semFoto.length>0 ? "grid grid-cols-3 content-start items-start gap-1.5" : "grid grid-cols-[repeat(auto-fill,minmax(165px,1fr))] content-start items-start gap-2"}, comFoto.map(function(y){ return cartao(y, cor); })),
          semFoto.length>0 && e("div",{className:"flex min-w-0 flex-col rounded-md border px-2 py-1", style:{borderColor:cor+"99", boxShadow:"0 0 0 .5px "+cor+"cc", background:"linear-gradient(180deg, "+cor+"26 0%, "+cor+"0d 100%)"}},
            e("div",{className:"pb-1 text-[11px] font-bold", style:{color:cor}}, "Sem foto ("+semFoto.length+")"),
            semFoto.map(function(y){ return linhaSem(y, cor); }))));
    })) : null);
}

// anexo do servidor (foto que ela mandou) como data URL, para o PDF; arquivo grande vem em pedaços
function dadosAnexo(key){
  return chamar("GET", "/anexos/"+encodeURIComponent(key)).then(function(r){
    if(!r.partes) return r.url;
    var texto = "", pr = Promise.resolve();
    for(var i = 0; i<r.partes; i++){ (function(n){ pr = pr.then(function(){ return chamar("GET", "/anexos/"+encodeURIComponent(key)+"?parte="+n).then(function(z){ texto += z.pedaco; }); }); })(i); }
    return pr.then(function(){ return texto; });
  });
}

// quantas peças do item ela está enviando: grava ao sair do campo (vazio = nenhuma)
function QtdItem(p){
  var st = useState(null), v = st[0], atual = p.v===undefined || p.v===null ? "" : String(p.v);
  var grava = function(){ if(v===null) return; var t = String(v).trim(); st[1](null); if(t===atual) return; p.on(t==="" ? 0 : Number(t)); };
  return e("input",{type:"number", min:0, max:999, inputMode:"numeric", value:v===null ? atual : v, placeholder:"0", "aria-label":"Quantas peças está enviando", onChange:function(ev){ st[1](ev.target.value); }, onBlur:grava, onKeyDown:function(ev){ if(ev.key==="Enter") ev.currentTarget.blur(); }, className:CAMPO+" w-full px-1 text-center"});
}
// nota curta do item ("3 modelos, falta o 20")
function NotaItem(p){
  var st = useState(null), v = st[0], atual = p.v || "";
  return e("input",{type:"text", value:v===null ? atual : v, placeholder:"Ex.: 3 modelos, falta o 20", "aria-label":"Nota do item", onChange:function(ev){ st[1](ev.target.value); }, onBlur:function(){ if(v!==null && v!==atual) p.on(v); st[1](null); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.currentTarget.blur(); }, className:CAMPO+" w-full px-2 text-[11px]!"});
}

function FichaPedido(p){
  var E = p.E, x = E.er.pedidos.find(function(y){ return y.id===p.id; }), cfg = E.cfg;
  var st = useState({itens:"", nota:"", edita:false, hist:false}), v = st[0], se = useState(""), envio = se[0];
  var ocupado = useRef(false), ref = useRef(E);
  ref.current = E;
  var set = function(k, y){ st[1](function(o){ var n = Object.assign({}, o); n[k] = y; return n; }); };
  var enviar = function(arquivos){
    var lista = Array.prototype.slice.call(arquivos || []).filter(function(a){ return /^image\//.test(a.type || ""); });
    if(!lista.length || ocupado.current) return;
    ocupado.current = true; var total = lista.length, feitas = 0;
    (function proxima(){
      if(!lista.length){ ocupado.current = false; se[1](""); return; }
      var a = lista.shift(); feitas++; se[1]("Enviando foto "+feitas+" de "+total);
      lerArquivo(a).then(function(l){ return enviarAnexo("er", l); }).then(function(r){ ref.current.exec("ped_foto_add", {id:p.id, key:r.key, nome:r.nome}); }, function(x2){ se[1](x2 && x2.message ? x2.message : "Não consegui enviar a foto."); }).then(proxima);
    })();
  };
  var enviarAchada = function(chave, arquivos){
    var a = Array.prototype.slice.call(arquivos || []).filter(function(f){ return String(f.type || "").indexOf("image/")===0; })[0];
    if(!a || ocupado.current) return;
    ocupado.current = true; se[1]("Enviando foto da peça");
    lerArquivo(a).then(function(l){ return enviarAnexo("er", l); }).then(function(r){ ref.current.exec("ped_foto_edit", {id:p.id, key:chave, anexo:r.key}); se[1](""); }, function(x2){ se[1](x2 && x2.message ? x2.message : "Não consegui enviar a foto."); }).then(function(){ ocupado.current = false; });
  };
  var enviarPecaFoto = function(cod, arquivos){
    var a = Array.prototype.slice.call(arquivos || []).filter(function(f){ return String(f.type || "").indexOf("image/")===0; })[0];
    if(!a || ocupado.current) return;
    ocupado.current = true; se[1]("Enviando foto da peça "+cod);
    lerArquivo(a).then(function(l){ return enviarAnexo("er", l); }).then(function(r){ ref.current.exec("ped_peca_edit", {id:p.id, cod:cod, anexo:r.key}); se[1](""); }, function(x2){ se[1](x2 && x2.message ? x2.message : "Não consegui enviar a foto."); }).then(function(){ ocupado.current = false; });
  };
  var enviarPerfil = function(arquivos){
    var a = Array.prototype.slice.call(arquivos || []).filter(function(f){ return String(f.type || "").indexOf("image/")===0; })[0];
    if(!a || ocupado.current) return;
    ocupado.current = true; se[1]("Enviando foto da cliente");
    lerArquivo(a).then(function(l){ return enviarAnexo("er", l); }).then(function(r){ ref.current.exec("perfil_foto", {nome:ref.current.er.pedidos.find(function(y){ return y.id===p.id; }).revendedora, key:r.key}); se[1](""); }, function(x2){ se[1](x2 && x2.message ? x2.message : "Não consegui enviar a foto."); }).then(function(){ ocupado.current = false; });
  };
  useEffect(function(){
    var cola = function(ev){ var arq = []; Array.prototype.forEach.call((ev.clipboardData && ev.clipboardData.items) || [], function(it){ if(it.kind==="file" && /^image\//.test(it.type)){ var f = it.getAsFile(); if(f) arq.push(f); } }); if(arq.length){ ev.preventDefault(); enviar(arq); } };
    var esc = function(ev){ if(ev.key==="Escape") p.fechar(); };
    document.addEventListener("paste", cola); document.addEventListener("keydown", esc);
    return function(){ document.removeEventListener("paste", cola); document.removeEventListener("keydown", esc); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  // resposta da revendedora às peças publicadas no link dela (18/11/2026): confere ao abrir e a cada 20 segundos
  var linkRef = x ? x.linkId : "";
  useEffect(function(){
    if(!linkRef || !apiAtiva()) return undefined; var vivo = true;
    var ler = function(){ chamar("GET", "/encomendas/link/retorno?ids="+encodeURIComponent(linkRef)).then(function(j){ if(vivo) set("ret", j[linkRef] || null); }, function(){}); };
    ler(); var iv = setInterval(ler, 20000);
    return function(){ vivo = false; clearInterval(iv); };
  }, [linkRef]);   // eslint-disable-line react-hooks/exhaustive-deps
  // preenche sozinho código, cidade, telefone, média das 3 últimas vendas e o valor máximo da reposição (DevMaster) quando o pedido ainda não tem
  var faltaDado = !!x && (!x.cod || !x.cidade || !x.telefone || x.media3m==null);
  useEffect(function(){
    if(!faltaDado || !apiAtiva()) return undefined; var vivo = true;
    listaRevendedoras().then(function(lista){
      if(!vivo) return; var atual = ref.current.er.pedidos.find(function(y){ return y.id===p.id; }); if(!atual) return;
      var r = lista.filter(function(i){ return semAc(i.nome)===semAc(atual.revendedora); })[0]; if(!r) return;
      var vs = (r.vendas || []).slice(0, 3), media = vs.length ? Math.round(vs.reduce(function(t, y){ return t+(Number(y.v) || 0); }, 0)/vs.length*100)/100 : null;
      ref.current.exec("ped_dados", {id:p.id, cod:r.cod, cidade:r.cidade, telefone:r.celular, representante:r.representante, media3m:media});
    }, function(){ /* sem acesso à DevMaster: segue sem preencher */ });
    return function(){ vivo = false; };
  }, [p.id, faltaDado]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!x) return null;
  var edita = v.edita, fim = !!FINAIS[x.status], fotos = x.fotos || [];
  var media = x.media3m!=null ? formatarReais(x.media3m) : "—", prox = proximaEtapa(x), cam = caminhoDe(x), iAtual = cam.indexOf(x.status);
  var resps = EQUIPE.indexOf(x.responsavel)<0 && x.responsavel ? EQUIPE.concat([x.responsavel]) : EQUIPE;
  var entrega = x.tipo==="reposicao" && x.canal==="entrega", primeiro = String(x.revendedora || "").trim().split(" ")[0];
  var taxaTxt = x.taxaIsenta ? "Isenta" : x.taxa>0 ? formatarReais(x.taxa)+(x.comprovante ? " · paga" : " · sem comprovante") : "Sem taxa";
  var taxaCor = x.taxaIsenta || x.comprovante ? "text-success" : x.taxa>0 ? "text-[#fbbf24]" : "";
  var compacto = !fotos.length && !(x.pecas || []).length;   // pedido novo: a revendedora é quem preenche pelo link; aqui só se manda a mensagem
  // publica as peças encontradas no link da revendedora e copia a mensagem para ela ver e dar o OK
  var enviarPecas = function(){
    if(v.pub) return; set("pub", true); set("lkErro", "");
    var pecas = (x.pecas || []).map(function(y){ return {cod:y.cod, desc:y.desc, preco:y.preco, anexo:y.anexo || ""}; });
    var idP = x.linkId ? Promise.resolve(x.linkId) : chamar("POST", "/encomendas/link", {nome:x.revendedora, cod:x.cod || "", representante:x.representante || "", telefone:x.telefone || "", cidade:x.cidade || "", media:x.media3m, taxa:x.taxaIsenta ? 0 : cfg.reposicao.taxa}).then(function(j){ ref.current.exec("ped_dados", {id:x.id, linkId:j.id}); return j.id; });
    var texto = idP.then(function(id){ return chamar("POST", "/encomendas/link/publicar", {linkId:id, pecas:pecas}).then(function(){ return mensagemTexto(cfg, "link_pecas").split("{nome}").join(primeiro).split("{link}").join(baseLink()+"/pedido/"+id); }); });
    copiarDepois(texto).then(function(){ set("pub", false); set("pubOk", true); }, function(err){ set("pub", false); set("lkErro", err && err.message ? err.message : "Não consegui publicar as peças."); });
  };
  var copiarMsg = function(){
    set("lk", true); set("lkErro", "");
    var direitos = acessoReposicao(cfg, revPorNome(E.er, x.revendedora), x.media3m);   // retirar na empresa só para quem tem direito
    var texto = chamar("POST", "/encomendas/link", {nome:x.revendedora, cod:x.cod || "", representante:x.representante || "", telefone:x.telefone || "", cidade:x.cidade || "", media:x.media3m, taxa:x.taxaIsenta ? 0 : cfg.reposicao.taxa, empresa:direitos.canais.indexOf("empresa")>=0, limite:{max:x.valorMax, qtd:qtdMes(cfg, x.media3m, direitos.top50), tabela:cfg.valores, qtdRegra:cfg.qtd}}).then(function(j){
      return mensagemTexto(cfg, "link_pedido").split("{nome}").join(primeiro).split("{link}").join(baseLink()+"/pedido/"+j.id);
    });
    copiarDepois(texto).then(function(){ set("lk", false); set("lkOk", true); }, function(err){ set("lk", false); set("lkErro", err && err.message ? err.message : "Não consegui gerar o link."); });
  };

  // ESQUERDA FIXA (Marcus, 17/11/2026, estilo C): revendedora com foto pequena ao lado dos dados; embaixo Andamento e Ações
  var perfil = fotoDaRevendedora(E.er, x.revendedora), iniciais = String(x.revendedora || "").split(" ").filter(Boolean).slice(0, 2).map(function(w){ return w.charAt(0).toUpperCase(); }).join("");
  var avatar = e("div",{key:"av", className:"flex w-full shrink-0 flex-col gap-1"},
    perfil ? e("button",{type:"button", title:"Abrir a foto", onClick:function(){ abrirAnexo(perfil.key); }, className:"block w-full overflow-hidden rounded-lg border border-white/30"}, e(Foto,{k:perfil.key, cls:"block aspect-square w-full object-cover", alt:"Foto de "+x.revendedora}))
      : e("div",{className:"grid aspect-square w-full place-items-center rounded-lg border border-dashed border-white/40 text-[13px] font-bold"}, iniciais),
    edita && e("label",{className:"inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-white/40 bg-white/10 px-1 text-[11px] hover:bg-white/20"}, perfil ? "Trocar foto" : "Colocar foto", e("input",{type:"file", accept:"image/*", className:"hidden", onChange:function(ev){ enviarPerfil(ev.target.files); ev.target.value = ""; }})),
    edita && perfil && e("button",{type:"button", onClick:function(){ E.exec("perfil_foto_del", {nome:x.revendedora}); }, className:"h-8 rounded-md border border-white/40 bg-white/10 px-1 text-[11px] hover:bg-white/20"}, "Tirar foto"));
  var topo = e(Caixa,{key:"t", t:"Revendedora", dir:e("button",{type:"button", onClick:function(){ set("edita", !edita); }, "aria-pressed":edita, className:"h-5 rounded border px-2 text-[11px] font-normal normal-case leading-none tracking-normal "+(edita ? "border-white bg-white font-semibold text-[#14233f]" : "border-white/45 bg-white/10 hover:bg-white/25")}, edita ? "Pronto" : "Editar")},
    e("div",{className:"flex flex-col gap-2"}, avatar, e("div",{className:"flex min-w-0 flex-1 flex-col"},
      e(Par,{leve:true, t:"Código", v:x.cod || "—"}), e(Par,{leve:true, t:"Cidade", v:x.cidade || "—"}), e(Par,{leve:true, t:"Telefone", v:x.telefone || "—"}), e(Par,{leve:true, t:"Média 3", v:media}), x.tipo==="reposicao" && e(Par,{leve:true, t:"Valor máximo", v:x.valorMax>0 ? formatarReais(x.valorMax) : "—"}))),
    e("div",{className:"mt-1.5 flex flex-col"},
      e(Par,{leve:true, t:"Representante", v:x.representante || "—"}),
      edita ? e("div",{key:"qa", className:"flex items-center justify-between gap-3.5 border-b border-white/20 py-[3px] text-[11px]"}, e("span",null, "Quem atende"),
          e("select",{value:x.responsavel || "", "aria-label":"Quem atende", onChange:function(ev){ if(ev.target.value) E.exec("ped_responsavel", {id:x.id, responsavel:ev.target.value}); }, className:"h-8 min-w-0 rounded-md border border-border bg-card px-2 text-[11px]"}, [""].concat(resps).map(function(n){ return e("option",{key:n, value:n}, n || "Escolher"); })))
        : e(Par,{leve:true, t:"Quem atende", v:x.responsavel || "—"}),
      e(Par,{leve:true, t:"Aberto em", v:String(formatarDataHora(x.criadoEm)).split(" ")[0]+" · "+x.criadoPor}),
      x.observacao && e(Par,{leve:true, t:"Pediu", v:x.observacao}),
      x.enderecoEntrega && e("div",{className:"border-b border-white/20 py-[3px] text-[11px] leading-snug"}, e("b",null, "Entrega: "), x.enderecoEntrega, x.horarioEntrega ? " · "+x.horarioEntrega : "")));

  // LIGAÇÕES (Marcus, 17/11/2026): cada foto que ela mandou mostra as peças que a funcionária ligou a ela (arrastando a peça até a foto, ou pelo botão Ligar da peça)
  var sugerir = function(){
    if(v.sugBusy) return;
    var livres = (x.pecas || []).filter(function(y){ return !y.foto; }).slice(0, 40);
    if(!fotos.length || !livres.length){ set("sugMsg", !fotos.length ? "Ela não mandou fotos." : "Todas as peças já estão ligadas."); return; }
    set("sugBusy", true); set("sugMsg", "A IA está comparando as fotos…");
    var extras = {}; livres.forEach(function(y){ if(y.anexo) extras[y.cod] = y.anexo; });
    chamar("POST", "/encomendas/casar", {fotos:fotos.map(function(ft){ return {id:ft.key, rev:x.revendedora, key:ft.key}; }), pecas:livres.map(function(y){ return {cod:y.cod, desc:y.desc || ""}; }), extras:extras}).then(function(r){
      var sg = {}, n = 0;
      (r.resultados || []).forEach(function(z){
        if(z.cod){ sg[z.cod] = {key:z.key, conf:z.confianca || "baixa"}; n++; }
        (z.alternativas || []).forEach(function(c){ var cc = String(c || "").toUpperCase(); if(cc && !sg[cc] && livres.some(function(y){ return y.cod===cc; })){ sg[cc] = {key:z.key, conf:"baixa"}; n++; } });
      });
      st[1](function(o){ var m = Object.assign({}, o); m.sug = sg; m.sugBusy = false; m.sugMsg = n ? n+" sugestões: clique em Foto n ✓ na peça, ou em Aceitar todas." : "A IA não achou ligações."; return m; });
    }, function(err){ st[1](function(o){ var m = Object.assign({}, o); m.sugBusy = false; m.sugMsg = err && err.message ? err.message : "A IA não respondeu."; return m; }); });
  };
  var nSugs = Object.keys(v.sug || {}).filter(function(k){ return v.sug[k]; }).length;
  var aceitarTodas = function(){ var sg = v.sug || {}; Object.keys(sg).forEach(function(cod){ if(sg[cod] && sg[cod].conf!=="baixa") ref.current.exec("ped_peca_edit", {id:p.id, cod:cod, foto:sg[cod].key}); }); set("sug", {}); set("sugMsg", ""); };
  var ligar = function(cod, key){ ref.current.exec("ped_peca_edit", {id:p.id, cod:cod, foto:key}); set("ligando", ""); };

  var itens = x.itens || [];

  var pecasBloco = e(PecasSeparadas,{x:x, edita:edita, fotos:fotos, sug:v.sug || {}, aceitarSug:function(cod){ var g = (v.sug || {})[cod]; if(g) ligar(cod, g.key); set("sug", Object.assign({}, v.sug, (function(){ var o = {}; o[cod] = undefined; return o; })())); }, ligando:v.ligando || "", setLigando:function(c){ set("ligando", c); }, enviarFoto:enviarPecaFoto, exec:function(op, a){ return ref.current.exec(op, a); }});
  var ret = v.ret && v.ret.retorno ? v.ret.retorno : null;
  var respBloco = ret ? e(Caixa,{key:"rr", t:"Resposta da revendedora"},
    e("div",{className:"flex flex-col gap-1 text-[13px]"},
      e("p",null, e("b",{className:"text-[#bbf7d0]"}, "Quer: "), (ret.quer || []).length ? ret.quer.join(", ") : "nenhuma"),
      e("p",null, e("b",null, "Não quer: "), (ret.nao || []).length ? ret.nao.join(", ") : "nenhuma"),
      ret.notas && Object.keys(ret.notas).length>0 && e("div",{className:"flex flex-col gap-0.5"}, e("b",null, "Observações por peça:"), Object.keys(ret.notas).map(function(c){ return e("p",{key:c}, e("b",null, c+": "), ret.notas[c]); })),
      ret.obs && e("p",null, e("b",null, "Recado: "), ret.obs),
      e("p",{className:"text-[11px]"}, "Respondeu em "+formatarDataHora(ret.em)))) : (v.ret ? e("p",{key:"rp", className:"text-[11px]"}, "Peças publicadas no link. Aguardando a resposta da revendedora.") : null);
  var extras = v.ret && Array.isArray(v.ret.extras) ? v.ret.extras : [];
  var extrasBloco = extras.length ? e(Caixa,{key:"ex", t:"Pediu mais peças ("+extras.length+" de 2)"},
    e("div",{className:"flex flex-col gap-2 text-[13px]"}, extras.map(function(x, n){
      return e("div",{key:n, className:"flex flex-col gap-1 border-b border-white/20 pb-2 last:border-b-0"},
        e("p",{className:"text-[11px]"}, (n+1)+"º pedido extra, "+formatarDataHora(x.em)),
        (x.fotos || []).length>0 && e("div",{className:"flex flex-wrap gap-2"}, x.fotos.map(function(fo){ return e("div",{key:fo.key, className:"flex w-24 flex-col gap-0.5"}, e("button",{type:"button", title:"Abrir a foto", onClick:function(){ abrirAnexo(fo.key); }, className:"block w-24 overflow-hidden rounded-lg border border-white/30"}, e(Foto,{k:fo.key, cls:"block aspect-square w-full object-cover"})), e("span",{className:"text-[11px] leading-tight"}, (fo.cor ? fo.cor+(fo.obs?" · ":"") : "")+(fo.obs || ""))); })),
        (x.textos || []).map(function(t, i){ return e("p",{key:"t"+i}, e("b",null, "Descreveu: "), (t.cor ? t.cor+" · " : "")+t.obs); }),
        x.obs && e("p",null, e("b",null, "Recado: "), x.obs));
    }))) : null;
  // UMA mensagem de cada vez (Marcus, 18/11/2026): a que cabe na etapa em que o link está, já pronta para copiar
  var sepInfo = v.ret && v.ret.separado ? v.ret.separado : null, pagInfo = v.ret && v.ret.pagamento ? v.ret.pagamento : null;
  var etapaMsg = !x.linkId || fim ? "" : sepInfo ? "" : v.ret && v.ret.retorno ? "link_separado" : v.ret ? "link_pecas" : "link_pedido";
  var textoMsg = etapaMsg ? mensagemTexto(cfg, etapaMsg).split("{nome}").join(primeiro).split("{link}").join(baseLink()+"/pedido/"+x.linkId) : "";
  var tituloMsg = {link_pedido:"Mensagem 1 · pedido (o link para ela pedir)", link_pecas:"Mensagem 2 · peças encontradas (ela marca Quero ou Não quero)", link_separado:"Mensagem 3 · peças separadas (ela paga a taxa)"}[etapaMsg];
  // peças que ela quis; a funcionária desmarca a que não foi separada (acabou, quebrou etc.)
  var queroCods = v.ret && v.ret.retorno ? (v.ret.retorno.quer || []) : [];
  var peçasQuero = (x.pecas || []).filter(function(y){ return queroCods.indexOf(y.cod)>=0; });
  var desm = v.desm || {};
  var codsSep = queroCods.filter(function(c){ return !desm[c]; });
  var separar = function(){
    if(v.sep) return; set("sep", true); set("lkErro", "");
    chamar("POST", "/encomendas/link/separado", {linkId:x.linkId, cods:codsSep}).then(function(){ return chamar("GET", "/encomendas/link/retorno?ids="+encodeURIComponent(x.linkId)); }).then(function(j){ set("ret", j[x.linkId] || null); set("sep", false); copiar(textoMsg); }, function(err){ set("sep", false); set("lkErro", err && err.message ? err.message : "Não consegui avisar que separou."); });
  };
  var msgBloco = etapaMsg ? e(Caixa,{key:"msg", t:tituloMsg},
    e("div",{className:"flex flex-col gap-1.5 text-[13px]"},
      etapaMsg==="link_separado" && e("div",{className:"flex flex-col gap-0.5 rounded-md border border-white/25 bg-black/30 p-2"},
        e("p",{className:"text-[11px] font-bold uppercase"}, "Peças separadas ("+codsSep.length+" de "+queroCods.length+"): desmarque a que não foi separada"),
        peçasQuero.map(function(y){ return e("label",{key:y.cod, className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:!desm[y.cod], onChange:function(){ var o = Object.assign({}, desm); o[y.cod] = !o[y.cod]; set("desm", o); }}), e("span",null, y.cod+" · "+y.desc+(y.preco ? " · "+formatarReais(y.preco) : ""))); })),
      e("pre",{className:"whitespace-pre-wrap break-words rounded-md border border-white/25 bg-black/30 p-2 font-[inherit] text-[13px] leading-snug"}, textoMsg),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        etapaMsg==="link_separado" ? e("button",{type:"button", disabled:!!v.sep || !codsSep.length, title:"Libera a taxa e o Pix no link da revendedora e copia a mensagem", onClick:separar, className:"h-8 rounded-md border border-[#E8B84B] bg-[#E8B84B]/20 px-3 text-[13px] font-bold text-[#F5E7BE] disabled:opacity-50"}, v.sep ? "Liberando" : "Peças separadas: liberar a taxa e copiar")
        : e("button",{type:"button", onClick:function(){ copiar(textoMsg); }, className:"h-8 rounded-md border border-white/40 bg-white/10 px-3 text-[13px] font-bold hover:bg-white/20"}, "Copiar mensagem")))) : null;
  var taxaBloco = sepInfo ? e(Caixa,{key:"tx", t:"Taxa de entrega"},
    e("div",{className:"flex flex-col gap-1 text-[13px]"},
      e("p",null, "Peças separadas e taxa liberada no link em "+formatarDataHora(sepInfo.em)+"."),
      pagInfo ? e("div",{className:"flex flex-col gap-1"}, e("p",{className:"font-bold text-[#bbf7d0]"}, "Comprovante enviado pela revendedora em "+formatarDataHora(pagInfo.em)+". Confira o pagamento e avance o pedido."),
        e("button",{type:"button", title:"Abrir o comprovante", onClick:function(){ abrirAnexo(pagInfo.key); }, className:"block w-28 overflow-hidden rounded-lg border border-white/30"}, e(Foto,{k:pagInfo.key, cls:"block aspect-square w-full object-cover"})))
      : e("p",{className:"font-bold text-[#fbbf24]"}, "Aguardando o pagamento. Sem pagar, o pedido não é liberado para envio."))) : null;
  var colMeio = e("div",{key:"m", className:"flex min-w-0 flex-col gap-2"}, msgBloco, taxaBloco, respBloco, extrasBloco, pecasBloco);

  // NO TOPO (fixo): o que ela pediu em texto (uma linha por item) e as fotos que ela mandou, com botões para aumentar ou diminuir
  var TAMANHOS = [56, 80, 112, 160, 220], iz = v.zoom===undefined ? 3 : v.zoom, lado = TAMANHOS[iz];
  var zoom = function(d){ set("zoom", Math.max(0, Math.min(TAMANHOS.length-1, iz+d))); };
  var btnZ = "grid size-8 place-items-center rounded-md border border-white/40 bg-white/10 text-[13px] font-bold hover:bg-white/20 disabled:opacity-40";
  var fixoDir = e(Caixa,{t:"O que ela pediu", dir:e("span",{className:"flex items-center gap-1.5 text-[11px] font-normal normal-case tracking-normal"}, v.ligando && e("span",{className:"mr-2 font-bold text-[#E8B84B]"}, "Ligando "+v.ligando+": clique na foto dela ou arraste a peça"), v.ligando && (x.pecas || []).some(function(y){ return y.cod===v.ligando && y.foto; }) && e("button",{type:"button", onClick:function(){ ligar(v.ligando, ""); }, className:"mr-2 h-8 rounded-md border border-border bg-card px-2 text-[11px]"}, "Desligar"), v.ligando && e("button",{type:"button", onClick:function(){ set("ligando", ""); }, className:"mr-3 h-8 rounded-md border border-border bg-card px-2 text-[11px]"}, "Cancelar"), v.sugMsg && e("span",{className:"mr-2 max-w-[360px] text-right"}, v.sugMsg), nSugs>0 && e("button",{type:"button", onClick:aceitarTodas, title:"Liga só as de confiança alta ou média; as com ? você confirma uma a uma", className:"mr-2 h-8 rounded-md border border-[#4ade80] bg-[#4ade80]/15 px-2 text-[11px] font-bold text-[#bbf7d0]"}, "Aceitar todas"), e("button",{type:"button", disabled:!!v.sugBusy, onClick:sugerir, title:"A IA compara as fotos dela com as peças e sugere a ligação; quem confirma é você", className:"mr-3 h-8 rounded-md border border-border bg-card px-2 text-[11px] font-bold hover:bg-white/10 disabled:opacity-50"}, v.sugBusy ? "Analisando…" : "Sugerir ligações (IA)"), "Tamanho das fotos",
      e("button",{type:"button", "aria-label":"Diminuir as fotos", disabled:iz===0, onClick:function(){ zoom(-1); }, className:btnZ}, "−"),
      e("button",{type:"button", "aria-label":"Aumentar as fotos", disabled:iz===TAMANHOS.length-1, onClick:function(){ zoom(1); }, className:btnZ}, "+"))},
    e("div",{className:"grid max-h-[250px] gap-3 overflow-y-auto md:grid-cols-[190px_minmax(0,1fr)]"},
      e("div",{className:"flex min-w-0 flex-col"}, itens.length ? itens.map(function(i, n){ return e("div",{key:i.id, className:"flex items-center justify-between gap-2 border-b border-white/20 py-[2px] text-[11px] leading-tight last:border-b-0"}, e("span",{className:"min-w-0"}, (n+1)+". "+i.txt), edita && e("button",{type:"button", "aria-label":"Tirar item", onClick:function(){ E.exec("ped_item_del", {id:x.id, item:i.id}); }, className:"grid size-8 shrink-0 place-items-center rounded-md hover:bg-white/10"}, "×")); }) : e("span",{className:"text-[11px]"}, "Nenhum item anotado. Use Editar para anotar o que ela pediu."),
        x.observacao && e("div",{className:"mt-1 text-[11px]"}, "Pediu: "+x.observacao),
        edita && e("div",{className:"mt-2 flex flex-col gap-1.5"},
          e("textarea",{value:v.itens, rows:2, placeholder:"Novo item do pedido (um por linha)", "aria-label":"O que ela pediu", onChange:function(ev){ set("itens", ev.target.value); }, className:AREA}),
          e("div",{className:"flex justify-end"}, e(Botao,{desabilitado:!v.itens.trim(), onClick:function(){ if(E.exec("ped_item_add", {id:x.id, txt:v.itens})) set("itens", ""); }}, "Anotar itens")))),
      e("div",{className:"grid min-w-0 content-start items-start gap-1.5", style:{gridTemplateColumns:"repeat(5,minmax(0,"+lado+"px))"}}, fotos.length ? fotos.map(function(f, n){
        var qtd = (x.pecas || []).filter(function(y){ return y.foto===f.key; }).length;
        var editaNota = edita && v.notaEd===f.key;
        return e("div",{key:f.key, className:"relative min-w-0 overflow-hidden rounded-md border border-white/25 bg-black/30"},
          e("button",{type:"button", title:v.ligando ? "Ligar "+v.ligando+" a esta foto" : "Abrir a foto", onClick:function(){ if(v.ligando) ligar(v.ligando, f.key); else abrirAnexo(f.key); },
              onDragOver:function(ev){ ev.preventDefault(); }, onDrop:function(ev){ ev.preventDefault(); var t = ev.dataTransfer.getData("text/plain"); if(t.indexOf("peca:")===0) ligar(t.slice(5), f.key); },
              className:"relative block w-full bg-black "+(v.ligando ? "outline outline-2 outline-[#E8B84B]" : "")},
            e("div",{className:"aspect-square w-full"}, e(Foto,{k:f.key, cls:"block size-full object-cover", alt:f.nota || "Foto que ela mandou"})),
            e("span",{className:"absolute left-1 top-1 rounded-[4px] bg-black/75 px-1 text-[11px] font-bold leading-tight"}, "Foto "+(n+1)),
            qtd>0 && e("span",{className:"absolute bottom-1 right-1 rounded-[4px] border border-[#4ade80] bg-black/75 px-1 text-[11px] font-bold leading-tight text-[#bbf7d0]"}, qtd+(qtd===1 ? " peça" : " peças"))),
          edita && e("button",{type:"button", "aria-label":"Tirar esta foto", title:"Tirar esta foto", onClick:function(){ E.exec("ped_foto_del", {id:x.id, key:f.key}); }, className:"absolute right-1 top-1 grid size-6 place-items-center rounded-[4px] border border-white/50 bg-black/80 text-[13px] font-bold leading-none hover:bg-black"}, "×"),
          // bloco do texto, do mesmo tamanho da foto; só aparece se tiver texto (ou no Editar, para escrever)
          editaNota ? e("div",{className:"p-1"}, e(NotaFoto,{v:f.nota, auto:true, fim:function(){ set("notaEd", ""); }, on:function(y){ E.exec("ped_foto_edit", {id:x.id, key:f.key, nota:y}); }}))
            : /* padrao-ok: Marcus pediu 1 px menor (17/11/2026) */ (f.nota || edita) ? e(edita ? "button" : "div", {type:edita ? "button" : undefined, onClick:edita ? function(){ set("notaEd", f.key); } : undefined, title:edita ? "Clique para escrever" : undefined, className:"block min-h-[38px] w-full bg-white/[.07] py-1.5 pl-3 pr-2 text-left text-[10px] leading-tight"+(edita ? " hover:bg-white/[.12]" : "")}, f.nota || "Escrever texto") : null); })
        : e("span",{className:"text-[11px]"}, "Sem fotos. Use Editar para adicionar."),
        (edita || !fotos.length) && e("label",{title:"Escolha do computador ou cole com Ctrl+V", className:"col-span-5 inline-flex h-8 w-fit cursor-pointer items-center justify-center rounded-md border border-dashed border-white/40 px-3 text-[11px] hover:bg-white/10"}, "Adicionar fotos",
          e("input",{type:"file", accept:"image/*", multiple:true, className:"hidden", onChange:function(ev){ enviar(ev.target.files); ev.target.value = ""; }})))));

  // PDF para a revendedora: o que ela pediu, o que separamos (foto, código, nome, preço da DevMaster) e, foto a foto, o que achamos
  var baixarPdf = function(){
    if(v.pdf) return; set("pdf", true); se[1]("Montando o PDF");
    var pecas = x.pecas || [];
    var dados = {titulo:"Reposição para você", nome:x.revendedora, data:new Date().toLocaleDateString("pt-BR"), atende:x.responsavel || "",
      pedido:itens.map(function(i){ return i.txt; }),
      grupos:agruparPecas(pecas),
      fotos:fotos.map(function(f){ return {key:f.key, nota:f.nota || "", pecas:pecas.filter(function(y){ return y.foto===f.key; })}; }),
      total:{qtd:pecas.length, valor:pecas.reduce(function(s, y){ return s+(y.preco || 0); }, 0)},
      imagem:{anexo:dadosAnexo, peca:fotoDm}};
    gerarPdfPedido(dados).then(function(blob){ baixarBlob(blob, "Reposicao - "+String(x.revendedora || "pedido").replace(/[\\/:*?"<>|]/g, "-")+".pdf"); se[1](""); set("pdf", false); },
      function(err){ se[1](err && err.message ? err.message : "Não consegui montar o PDF."); set("pdf", false); });
  };

  // ANDAMENTO E AÇÕES: as etapas à esquerda e os botões à direita, esticados até a altura das etapas; embaixo, quando preciso, o Pix da taxa
  var precisaPix = entrega && x.taxa>0 && (x.status==="comprovante" || x.comprovante) && !fim;
  var btn = "min-h-8 w-full flex-1 whitespace-nowrap rounded-md border px-2 "+(compacto ? "text-[13px] " : "text-[11px] ");
  var colAndamento = e("div",{key:"a", className:"flex min-w-0 flex-col gap-2"},
    e(Caixa,{t:"Andamento e ações"},
      e("div",{className:"grid grid-cols-[auto_minmax(0,1fr)] items-stretch gap-2.5"},
        e("div",{className:"flex flex-col justify-between"},
          e("div",{className:"flex flex-col"}, cam.map(function(k, i){ var feita = iAtual>=0 && i<iAtual, atual = i===iAtual;
            return e("div",{key:k, className:"flex items-center gap-2 py-[3px] text-[11px] "+(atual ? "font-bold" : "")},
              e("span",{"aria-hidden":true, className:"size-2.5 shrink-0 rounded-full border-2 "+(feita ? "border-[#4ade80] bg-[#4ade80]" : atual ? "border-[#F5E7BE] bg-[#E8B84B]" : "border-white/50")}), ROTULO_STATUS[k]); })),
          null),
        e("div",{className:"flex min-w-0 flex-col gap-1.5"+(compacto ? " max-w-[300px]" : "")},
          !fim && prox && e("button",{type:"button", disabled:(x.status==="comprovante" && x.taxa>0 && !x.comprovante) || (x.status==="aceite" && x.taxa>0 && !x.taxaAceita) || (x.status==="bipagem" && entrega && !x.bipado), onClick:function(){ avancarPedido(E, x, p.ir); }, title:(x.status==="aceite" && x.taxa>0 && !x.taxaAceita) ? "Falta a revendedora aceitar a taxa" : (x.status==="comprovante" && x.taxa>0 && !x.comprovante) ? "Falta o comprovante da taxa" : (x.status==="bipagem" && entrega && !x.bipado) ? "Falta bipar as peças" : "", className:btn+"border-primary bg-primary/25 text-primary hover:bg-primary/35 disabled:opacity-60"}, e("span",{className:"flex flex-col items-center leading-tight"}, e("span",{className:"font-semibold"}, "Concluir etapa"), e("span",null, "› "+ROTULO_STATUS[prox]))),
          entrega && x.status==="bipagem" && !x.bipado && e("button",{type:"button", onClick:function(){ E.exec("ped_bipar", {id:x.id}); }, className:btn+"border-white/40 bg-white/10 hover:bg-white/20"}, "Bipei as peças"),
          entrega && x.bipado && x.status==="bipagem" && e("span",{className:"text-center text-[11px]"}, "Bipado por "+x.bipado.por),
          entrega && (x.status==="condicional" || x.status==="concluido") && e("button",{type:"button", onClick:function(){ copiar(mensagemTexto(cfg, "avaliacao").split("{nome}").join(primeiro)); }, className:btn+"border-white/40 bg-white/10 hover:bg-white/20"}, "Copiar avaliação"),
          !compacto && entrega && (x.status==="novo" || x.status==="aceite") && e("button",{type:"button", disabled:!!v.lk, title:"Gera o link só dela (vale 48 horas) e copia a mensagem para mandar", onClick:copiarMsg, className:btn+"border-white/40 bg-white/10 hover:bg-white/20 disabled:opacity-50"}, v.lk ? "Gerando link" : "Copiar mensagem"),
          v.lkErro && e("span",{className:"text-[11px] font-bold text-[var(--negativo)]"}, v.lkErro),
          (x.pecas || []).length>0 && !fim && e("button",{type:"button", disabled:!!v.pub, title:"Publica as peças encontradas no link da revendedora e copia a mensagem para ela ver e dar o OK", onClick:enviarPecas, className:btn+"!border-[#E8B84B] !bg-[#E8B84B]/20 !text-[#F5E7BE] disabled:opacity-50"}, v.pub ? "Publicando" : v.pubOk ? "Mensagem copiada ✓ (peças publicadas)" : "Enviar peças para ela ver"),
          !compacto && e("button",{type:"button", disabled:!x.telefone, title:x.telefone ? "Copia "+x.telefone : "Telefone ainda não encontrado", onClick:function(){ copiar(x.telefone); }, className:btn+"border-white/40 bg-white/10 hover:bg-white/20 disabled:opacity-50"}, "Copiar telefone"),
          v.lkErro && e("span",{className:"text-[11px] font-bold text-[var(--negativo)]"}, v.lkErro),
          !compacto && e("button",{type:"button", disabled:!!v.pdf, onClick:baixarPdf, className:btn+"border-white/40 bg-white/10 hover:bg-white/20 disabled:opacity-50"}, v.pdf ? "Montando PDF" : "Baixar PDF"),
          !fim && entrega && E.pode && e("button",{type:"button", onClick:function(){ E.exec("ped_taxa", {id:x.id, isenta:!x.taxaIsenta}); }, className:btn+"border-white/40 bg-white/10 hover:bg-white/20"}, x.taxaIsenta ? "Cobrar taxa" : "Isentar taxa"),
          !fim && x.tipo==="reposicao" && e("button",{type:"button", title:"Se a solicitação era de encomenda (próximo kit): tira a taxa e o prazo de 24 horas", onClick:function(){ if(window.confirm("Mudar este pedido para ENCOMENDA?\n\nEle perde a taxa de entrega e o prazo de 24 horas.")) E.exec("ped_tipo", {id:x.id}); }, className:btn+"border-white/40 bg-white/10 hover:bg-white/20"}, "Mudar para encomenda"),
          !fim && e("button",{type:"button", onClick:function(){ E.exec("ped_aguardando", {id:x.id, ligar:!x.aguardando}); }, title:x.aguardando ? "Aguardando peças desde "+formatarDataHora(x.aguardando.em)+" (por "+x.aguardando.por+"). Clique para voltar a contar o prazo." : "O pedido continua aberto, mas deixa de contar como atrasado", className:btn+(x.aguardando ? "border-[#fbbf24] bg-[#fbbf24]/20 text-[#fde68a] hover:bg-[#fbbf24]/30" : "border-white/40 bg-white/10 hover:bg-white/20")}, x.aguardando ? "Voltar a contar prazo" : "Aguardando peças"),
          !fim && e("button",{type:"button", onClick:function(){ p.ir({tipo:"motivo", id:x.id}); }, className:btn+"border-[#f87171]/60 bg-[#f87171]/15 text-[#fecaca] hover:bg-[#f87171]/25"}, "Recusar"))),
      entrega && x.status==="aceite" && x.taxa>0 && e("div",{className:"mt-2 flex flex-col gap-1.5"},
        e("button",{type:"button", onClick:function(){ copiar(mensagemTexto(cfg, "taxa_aceite").split("{nome}").join(primeiro)); }, className:"h-8 w-full animate-pulse rounded-md border border-[#E8B84B] bg-[#E8B84B]/20 text-[11px] font-bold text-[#F5E7BE]"}, "Copiar msg de taxa"),
        e("button",{type:"button", onClick:function(){ E.exec("ped_taxa_aceita", {id:x.id}); }, className:"h-8 w-full animate-pulse rounded-md border border-[#4ade80] bg-[#4ade80]/20 text-[11px] font-bold text-[#bbf7d0]"}, "Revendedora aceitou pagar a taxa")),
      entrega && e("div",{className:"mt-2 flex items-center justify-between gap-2 border-t border-white/20 pt-1.5 text-[11px]"}, e("span",{className:"font-bold"}, "Taxa"), e("span",{className:"text-right font-semibold "+taxaCor}, taxaTxt))),
    precisaPix && e(Caixa,{t:"Pix da taxa"},
      e("div",{className:"flex flex-col items-center gap-1.5 text-[13px]"},
        e("span",{className:"text-center"}, (cfg.pix.recebedor || "Recebedor")+": "+(cfg.pix.tipo ? cfg.pix.tipo+" " : "")+(cfg.pix.chave || "chave não cadastrada")),
        e(Botao,{desabilitado:!cfg.pix.chave, onClick:function(){ copiar(cfg.pix.chave); }}, "Copiar chave"),
        x.comprovante && e(Botao,{onClick:function(){ baixarArquivo(x.comprovante.arquivoId, x.comprovante.nome || "comprovante"); }}, "Abrir comprovante"),
        e("label",{className:"inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-3.5 text-[13px] hover:bg-white/10"}, x.comprovante ? "Trocar comprovante" : "Anexar comprovante",
          e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ var arq = ev.target.files && ev.target.files[0]; if(!arq) return; var id = "er"+Date.now().toString(36)+Math.floor(Math.random()*999).toString(36);
            salvarArquivo(id, arq).then(function(){ E.exec("ped_comprovante", {id:x.id, arquivoId:id, nome:arq.name}); }); ev.target.value = ""; }}))))
  );

  // EMBAIXO: histórico e anotação, fechado por padrão (a ficha fica limpa como no modelo)
  var rodape = e("div",{className:"flex flex-col gap-2.5"}, e(Caixa,{t:"Histórico e anotação", aoTitulo:function(){ set("hist", !v.hist); }, dir:e("span",{"aria-hidden":true}, v.hist ? "▾" : "▸")},
    v.hist ? e("div",{className:"grid gap-3 md:grid-cols-2"},
      e("div",{className:"flex max-h-40 flex-col overflow-y-auto"}, x.historico.slice().reverse().map(function(h, i){
        return e("div",{key:i, className:"border-b border-white/20 py-0.5 text-[13px] last:border-b-0"}, e("span",{className:"font-medium"}, formatarDataHora(h.em)+" · "+h.por), e("div",null, (h.para && h.de!==h.para ? ROTULO_STATUS[h.para]+(h.nota ? " · " : "") : "")+(h.nota || ""))); })),
      e("div",{className:"flex flex-col gap-1.5"},
        e("textarea",{value:v.nota, rows:3, placeholder:"Anotação", "aria-label":"Anotação", onChange:function(ev){ set("nota", ev.target.value); }, className:AREA}),
        e("div",{className:"flex justify-end"}, e(Botao,{desabilitado:!v.nota.trim(), onClick:function(){ if(E.exec("ped_nota", {id:x.id, nota:v.nota})) set("nota", ""); }}, "Registrar anotação"))))
    : e("p",{className:"text-[13px]"}, x.historico.length+(x.historico.length===1 ? " registro" : " registros")+" · último: "+(x.historico.length ? formatarDataHora(x.historico[x.historico.length-1].em) : "—"))));

  // PEDIDO NOVO, SEM FOTO NEM PEÇA (Marcus, 18/11/2026: "aqui é só para mandar a mensagem para a revendedora, ela é que preenche"): bloco menor; à esquerda só a cliente, à direita os dois botões de enviar e embaixo o andamento
  var BC = "inline-flex h-7 w-full cursor-pointer items-center justify-center rounded-md border border-white/40 bg-white/10 px-2 text-center text-[13px] font-semibold hover:bg-white/20 disabled:cursor-default disabled:opacity-50";   // padrao-ok: botões menores, pedido do Marcus (18/11/2026)
  var pedidoC = e(Caixa,{key:"pc", t:"Enviar para a revendedora"},
    e("div",{className:"flex flex-col gap-2.5"},
      e("p",{className:"text-[13px] leading-snug"}, "É a "+primeiro+" quem preenche o pedido, pelo link dela (vale 48 horas). Copie a mensagem, mande pelo WhatsApp e espere: o que ela mandar aparece aqui."),
      e("div",{className:"grid grid-cols-2 gap-2"},
        e("button",{type:"button", disabled:!!v.lk, onClick:copiarMsg, title:"Gera o link só dela e copia a mensagem pronta", className:BC+" !border-[#E8B84B] !bg-[#E8B84B]/20 !text-[#F5E7BE]"}, v.lk ? "Gerando link" : v.lkOk ? "Mensagem copiada ✓" : "Copiar mensagem com o link"),
        e("button",{type:"button", disabled:!x.telefone, onClick:function(){ copiar(x.telefone); set("telOk", true); }, title:x.telefone ? "Copia "+x.telefone : "Telefone ainda não encontrado", className:BC}, !x.telefone ? "Sem telefone" : v.telOk ? "Telefone copiado ✓" : "Copiar telefone")),
      v.lkErro && e("span",{className:"text-center text-[11px] font-bold text-[var(--negativo)]"}, v.lkErro)));
  return e(Moldura,{compacto:compacto, t:x.revendedora+" · "+(x.tipo==="encomenda" ? "Encomenda para o próximo kit" : x.canal==="empresa" ? "Reposição com ida na empresa" : x.canal==="representante" ? "Reposição pela representante" : "Reposição pelo João"), fechar:p.fechar, editando:edita, alterna:function(){ set("edita", !edita); }, fixoDir:compacto ? pedidoC : fixoDir, colunas:compacto ? [e("div",{key:"e", className:"flex min-w-0 flex-col gap-2.5"}, topo), e("div",{key:"m", className:"flex min-w-0 flex-col gap-2"}, colAndamento, colMeio)] : [e("div",{key:"e", className:"flex min-w-0 flex-col gap-2.5"}, topo, colAndamento), colMeio], rodape:rodape});
}
export { FichaPedido };
