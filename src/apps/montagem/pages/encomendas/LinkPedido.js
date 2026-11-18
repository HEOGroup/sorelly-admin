// Sorelly Admin · montagem — pages/encomendas/LinkPedido.js
// Encomendas e reposições › Funil de pedidos › "Link do pedido" (17/11/2026, Marcus: "o WhatsApp assim está inviável; link nosso, ligado direto no sistema; 48 horas; o link é o nome dela, nem toda vendedora pode").
// Cartãozinho que abre na hora (18/11/2026, Marcus: "não precisa ser assim, abre um bloco na hora para gerar, faz bonito"): busca a revendedora, gera o link (vale 48 horas, só dela) e copia a mensagem.
// Quando a revendedora envia as fotos pela página pública, o pedido cai sozinho no Funil (Separando, ou Confirmar taxa se ela não aceitou a taxa).
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { acessoReposicao, formatarDataHora, formatarReais, mensagemTexto, qtdMes, revPorNome, valorMaximo } from "@/apps/montagem/domain/encomendas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { baseLink, copiar } from "@/apps/montagem/pages/encomendas/visual";
import { e, useEffect, useState } from "@/shared/react";

var semAcento = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var media3 = function(r){ var v = (r.vendas || []).slice(0, 3); return v.length ? Math.round(v.reduce(function(t, x){ return t+(Number(x.v) || 0); }, 0)/v.length*100)/100 : null; };
var COR_ESTADO = {aberto:"text-[#fde68a]", enviado:"text-[#bbf7d0]", "no funil":"text-[#bbf7d0]", expirado:"text-[#fecaca]"};
var CAMPO_B = "h-8 w-full rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground outline-none placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-[var(--bloco-titulo)]";

function LinkPedido(p){
  var E = p.E, cfg = E.cfg;
  var st = useState({busca:"", rev:null, id:"", validade:"", gerando:false, msg:"", ver:false, isenta:false}), f = st[0];
  var sl = useState(null), lista = sl[0];   // revendedoras da DevMaster (só a diretoria lê; as outras pessoas digitam o nome)
  var sk = useState(null), links = sk[0];   // últimos links gerados
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var carregarLinks = function(){ chamar("GET", "/encomendas/link").then(function(j){ sk[1](j.links || []); }).catch(function(){ sk[1]([]); }); };
  useEffect(function(){
    if(!apiAtiva()) return undefined; var vivo = true;
    chamar("GET", "/revendedoras").then(function(j){ if(vivo) sl[1](j.itens || []); }).catch(function(){ if(vivo) sl[1]([]); });
    carregarLinks();
    var esc = function(ev){ if(ev.key==="Escape") p.fechar(); };
    document.addEventListener("keydown", esc);
    return function(){ vivo = false; document.removeEventListener("keydown", esc); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var q = semAcento(f.busca), achadas = lista && !f.rev && q.length>=3 ? lista.filter(function(r){ return semAcento(r.nome).indexOf(q)>=0; }).slice(0, 6) : [];
  var nome = f.rev ? f.rev.nome : f.busca.trim();
  var gerar = function(){
    set("gerando", true); set("msg", "");
    var r = f.rev || {}, m = r.cod ? media3(r) : null;
    // retirar na empresa só para quem tem direito (regra de 21/10/2026): Top 50 ou média de R$ 2.000 ou mais
    var ac = acessoReposicao(cfg, revPorNome(E.er, nome), m), empresa = ac.canais.indexOf("empresa")>=0;
    chamar("POST", "/encomendas/link", {nome:nome, cod:r.cod || "", representante:r.representante || "", telefone:r.celular || "", cidade:r.cidade || "", uf:r.uf || "", media:m, taxa:f.isenta && E.pode ? 0 : cfg.reposicao.taxa, empresa:empresa, limite:{max:valorMaximo(cfg, m, ac.top50), qtd:qtdMes(cfg, m, ac.top50), tabela:cfg.valores, qtdRegra:cfg.qtd}}).then(function(j){
      var ate = new Date(Date.now()+(j.validadeHoras || 48)*3600*1000);
      st[1](function(o){ return Object.assign({}, o, {id:j.id, gerando:false, validade:ate.toLocaleDateString("pt-BR", {day:"2-digit", month:"2-digit"})+" às "+ate.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})}); }); carregarLinks();
    }, function(x){ st[1](function(o){ return Object.assign({}, o, {gerando:false, msg:x && x.message ? x.message : "Não consegui gerar o link."}); }); });
  };
  var url = f.id ? baseLink()+"/pedido/"+f.id : "";
  var primeiro = String(nome).trim().split(" ")[0];
  var novo = function(){ st[1](function(o){ return Object.assign({}, o, {busca:"", rev:null, id:"", validade:"", msg:""}); }); };

  var corpo = f.id
    // 2) link pronto
    ? e("div",{className:"flex flex-col gap-2.5"},
        e("div",{className:"rounded-lg border border-[#4ade80]/50 bg-[#4ade80]/10 px-3 py-2 text-center"},
          e("p",{className:"text-[13px] font-bold text-[#bbf7d0]"}, "Link de "+nome+" pronto"),
          e("p",{className:"text-[11px]"}, "Só dela. Vale até "+f.validade+" (48 horas) e aceita um envio."+(f.isenta && E.pode ? " Taxa de entrega: ISENTA." : " Taxa de entrega: "+formatarReais(cfg.reposicao.taxa)+"."))),
        e("input",{readOnly:true, value:url, "aria-label":"Link do pedido", onFocus:function(ev){ ev.target.select(); }, className:CAMPO_B+" text-[11px]"}),
        e("div",{className:"grid grid-cols-3 gap-2"},
          e(Botao,{onClick:function(){ copiar(url); }}, "Copiar link"),
          e(Botao,{onClick:function(){ window.open(url, "_blank", "noopener"); }}, "Abrir o link"),
          e(Botao,{principal:true, onClick:function(){ copiar(mensagemTexto(cfg, "link_pedido").split("{nome}").join(primeiro).split("{link}").join(url)); }}, "Copiar mensagem")),
        e("button",{type:"button", onClick:novo, className:"h-8 rounded-md text-[11px] underline decoration-white/40 underline-offset-2 hover:decoration-white"}, "Gerar link de outra revendedora"))
    // 1) escolher a revendedora
    : e("div",{className:"flex flex-col gap-2.5"},
        e("input",{id:"lpB", type:"text", autoFocus:true, autoComplete:"off", "aria-label":"Buscar pela revendedora", value:f.busca, placeholder:lista===null && apiAtiva() ? "Carregando a lista da DevMaster" : "Nome da revendedora (3 letras ou mais)", onChange:function(ev){ var v = ev.target.value; st[1](function(o){ return Object.assign({}, o, {busca:v, rev:null, msg:""}); }); }, className:CAMPO_B}),
        achadas.length>0 && e("div",{className:"flex flex-col gap-1"}, achadas.map(function(r){
          return e("button",{key:r.cod, type:"button", onClick:function(){ st[1](function(o){ return Object.assign({}, o, {rev:r, busca:r.nome}); }); }, className:"flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-[13px] hover:bg-white/10"},
            e("span",{className:"min-w-0 font-medium"}, r.nome), e("span",{className:"shrink-0 text-[11px]"}, (r.cidade || "—")+" · "+r.cod)); })),
        lista && !f.rev && q.length>=3 && !achadas.length && e("p",{className:"text-center text-[11px]"}, "Ninguém com esse nome na DevMaster. O link vai com o nome digitado."),
        f.rev && e("div",{className:"rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-[11px] leading-snug"},
          e("b",{className:"block text-[13px]"}, f.rev.nome), "Código "+f.rev.cod+" · "+(f.rev.cidade || "—")+(f.rev.uf ? "/"+f.rev.uf : "")+" · rep. "+(f.rev.representante || "—")),
        nome && E.pode && e("div",{className:"flex items-center justify-between gap-3 text-[13px]"}, e("label",{htmlFor:"lpTx", className:"font-medium"}, "Taxa de entrega"),
          e("select",{id:"lpTx", value:f.isenta ? "isentar" : "cobrar", onChange:function(ev){ set("isenta", ev.target.value==="isentar"); }, className:CAMPO_B+" !w-44 text-center"}, e("option",{value:"cobrar"}, "Cobrar "+formatarReais(cfg.reposicao.taxa)), e("option",{value:"isentar"}, "Isentar (sem taxa)"))),
        f.msg && e("p",{className:"text-center text-[11px] font-bold text-[var(--negativo)]"}, f.msg),
        e(Botao,{principal:true, desabilitado:!nome || f.gerando, onClick:gerar}, f.gerando ? "Gerando" : "Gerar link de 48 horas"));

  var recentes = links && links.length>0 && e("div",{className:"mt-3 border-t border-white/15 pt-2"},
    e("button",{type:"button", "aria-expanded":f.ver, onClick:function(){ set("ver", !f.ver); }, className:"flex w-full items-center justify-between text-[11px] font-bold"}, e("span",null, "Últimos links ("+links.length+")"), e("span",{"aria-hidden":true}, f.ver ? "▾" : "▸")),
    f.ver && e("div",{className:"mt-1 flex max-h-44 flex-col overflow-y-auto"}, links.slice(0, 12).map(function(l){
      return e("div",{key:l.id, className:"flex items-center justify-between gap-3 border-b border-white/15 py-1 text-[11px] last:border-b-0"},
        e("span",{className:"min-w-0"}, e("b",{className:"text-[13px] font-medium"}, l.revendedora), e("span",{className:"block"}, formatarDataHora(l.criadoEm)+" · "+(l.criadoPor || "—"))),
        e("span",{className:"shrink-0 font-bold "+(COR_ESTADO[l.estado] || "")}, l.estado)); })));

  return e("div",{className:"fixed inset-0 z-50 grid place-items-start justify-items-center bg-black/60 p-3 pt-[12vh]", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"w-full max-w-[460px] overflow-hidden rounded-xl border-2 border-[var(--bloco-titulo)] shadow-2xl", style:{background:"linear-gradient(180deg, #1d2c4d 0%, #12151c 70%)"}},
      e("div",{className:"relative flex items-center justify-center bg-[var(--bloco-titulo)] px-10 py-1.5 text-white"},
        e("h2",{className:"text-[13px] font-bold uppercase leading-tight"}, "Nova solicitação"),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-[13px] font-bold hover:bg-white/15"}, "×")),
      e("div",{className:"p-3"},
        e("p",{className:"mb-2.5 text-center text-[11px]"}, "Procure a revendedora e gere o link: ela manda as peças e aceita as condições por ele. O link é só dela e vale 48 horas."),
        corpo,
        p.aoMao && !f.id && e("button",{type:"button", onClick:p.aoMao, className:"mt-2 h-8 w-full rounded-md text-[11px] underline decoration-white/40 underline-offset-2 hover:decoration-white"}, "Registrar à mão, sem link"),
        recentes)));
}
export { LinkPedido };
