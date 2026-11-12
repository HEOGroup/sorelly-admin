// Sorelly Admin · montagem — pages/Modelas.js
// Encomendas e reposições › Modelos (11/11/2026, pedido do Marcus): planilha particular das mulheres que recebem joias e kits.
// Três grupos na barra do topo: Sorelly (modelos da Sorelly: conteúdo, negociação e ida na empresa), Marcus (amigas do Marcus) e Influencers (só enviamos kits).
// Linhas finas, foto grande (clique para ver em tela cheia). Só quem tem a autorização `modelos_ver` (padrão Marcus).
// Regras em domain/modelas.js; estado s.mod, ação MOD. Tabela no layout D (TabelaCampos).
import { Botao, CampoSel, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { Pagina } from "@/apps/montagem/components/padrao";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { GRUPOS, limpaInsta, situacoesDe } from "@/apps/montagem/domain/modelas";
import { CampoDin, CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ALTO = 170;   // altura da fileira com foto
var COR_TOPO = "#14B8A6";   // cor do setor Encomendas: cabeçalho da tabela tingido, com barra grossa em cima
// título do jeito 1 (escolhido pelo Marcus em 11/11/2026): ícone + palavra, com a linha da cor do topo indo até o fim do título
var TITULO_JEITO1 = e("span",{className:"inline-flex flex-col gap-1.5"}, e("span",{className:"flex items-center gap-2"}, e("span",{className:"grid size-7 place-items-center rounded-lg text-[13px]", style:{background:COR_TOPO+"33", color:COR_TOPO}}, "★"), "Modelos"), e("span",{className:"h-0.5 w-full rounded", style:{background:COR_TOPO}}));
// colunas que se ajustam à largura da tela (nada de rolar para o lado em tela normal); mínimo de cada uma em px. Cada grupo mostra só as colunas que servem a ele.
var TODAS = {foto:{t:"Foto", w:"150px"}, nome:{t:"Nome", w:"minmax(170px,1fr)"}, insta:{t:"Instagram", w:"minmax(130px,1fr)"}, tel:{t:"Telefone", w:"140px"}, end:{t:"Endereço", w:"minmax(170px,2fr)"}, link:{t:"Link", w:"100px"}, trouxe:{t:"Trouxe", w:"140px"}, premio:{t:"Prêmio", w:"minmax(130px,1fr)"}, valor:{t:"Liberado por mês", w:"150px"}, emp:{t:"Na empresa", w:"115px"}, envio:{t:"Último envio", w:"120px"}, sit:{t:"Situação", w:"minmax(210px,1fr)"}};
var CHAVES = {Sorelly:["foto", "nome", "insta", "tel", "end", "valor", "emp", "envio", "sit"], Marcus:["foto", "nome", "insta", "tel", "end", "valor", "envio", "sit"], Influencers:["foto", "nome", "insta", "tel", "end", "link", "trouxe", "premio", "envio", "sit"]};
var VAZIO = {id:null, nome:"", insta:"", tel:"", endereco:"", valor:null, ultimoEnvio:"", grupo:GRUPOS[0], naEmpresa:"", link:"", meta:null, trouxe:null, premio:"", situacao:"", foto:""};
var COR_SIT = {Cadastrada:"#FFFFFF", Ativa:"#22C55E", Enviada:"#22C55E", "Em pausa":"#EF4444", "Negociação a confirmar":"#FFFFFF", "Negociação confirmada":"#22C55E", "Agendada na empresa":"#22C55E", "Visitou a empresa":"#22C55E", "Kit enviado":"#22C55E", Postou:"#22C55E"};
// divisórias da tabela na cor do bloco e mais grossas (pedido do Marcus, 11/11/2026): fio vertical entre as colunas e fio horizontal entre as linhas
var CSS_FIOS = ".modtab td,.modtab th{border-color:"+COR_TOPO+" !important} .modtab td,.modtab th{border-left-width:2px !important;border-right-width:0 !important;border-bottom-width:2px !important} .modtab td:first-child,.modtab th:first-child{border-left-width:0 !important} .modtab table{background:"+COR_TOPO+"14 !important} .modtab th{background:"+COR_TOPO+"33 !important}";
var TXT = "text-[15px]";   // padrao-ok · o Marcus pediu a letra da tabela maior (11/11/2026)
// letra própria da tabela (o Marcus não gostou da Inter ali, 11/11/2026): fonte do Windows, mais aberta e redonda
var FONTE = {fontFamily:"'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif", letterSpacing:".01em"};
var SUBLINHADO = "underline decoration-2 underline-offset-[5px]";   // o fio mostra que dá para clicar
var dataBr = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; };

// reduz a foto para no máximo 700 px (JPEG) antes de guardar: o servidor guarda o texto da imagem
function reduzFoto(arquivo, ok){
  var rd = new FileReader();
  rd.onload = function(){ var im = new Image(); im.onload = function(){ var k = Math.min(1, 700/Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width*k); c.height = Math.round(im.height*k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.82)); }; im.src = rd.result; };
  rd.readAsDataURL(arquivo);
}

// campos do card na mesma pegada da tabela: borda verde-água, fundo levemente verde, nomes dos campos em verde-água claro
var CSS_CARD = ".modform input,.modform select{border-color:"+COR_TOPO+" !important;background:"+COR_TOPO+"14 !important} .modform label{color:#2DD4BF !important;font-weight:600}";

function Formulario(p){
  var st = useState(p.inicial), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var sel = f.grupo;
  var foto = e("label",{className:"flex h-[250px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl text-[13px] hover:brightness-110", style:{boxShadow:"0 0 0 2px "+COR_TOPO, background:COR_TOPO+"14"}}, f.foto ? e("img",{src:f.foto, alt:"", className:"h-full w-full object-cover", style:{objectPosition:"50% 20%"}}) : "+ Foto",
    e("input",{type:"file", accept:"image/*", className:"hidden", onChange:function(ev){ var a = ev.target.files && ev.target.files[0]; if(a) reduzFoto(a, function(d){ set({foto:d}); }); }}));
  var campo = function(c, span){ return e("div",{className:span ? "col-span-2" : ""}, c); };
  // card no meio da tela (o fundo escuro fecha ao clicar)
  return e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick:p.onFechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"modform flex max-h-[94vh] w-full max-w-[780px] flex-col overflow-hidden rounded-xl border-2 bg-[#101214]", style:{borderColor:COR_TOPO}},
      e("style",null,CSS_CARD),
      // faixa do título, igual ao cabeçalho da tabela
      e("div",{className:"flex h-8 shrink-0 items-center justify-between px-4 text-[13px] font-bold uppercase tracking-[.08em]", style:{background:COR_TOPO+"40", boxShadow:"inset 0 3px 0 "+COR_TOPO}}, e("span",null, f.id ? "Editar modelo" : "Nova modelo"), e("button",{type:"button", onClick:p.onFechar, "aria-label":"Fechar", className:"grid size-8 place-items-center rounded-md hover:bg-white/10"}, "✕")),
      // grupos na mesma barra do bloco
      e("div",{role:"group", className:"flex shrink-0", style:{background:COR_TOPO+"1F", borderBottom:"2px solid "+COR_TOPO}}, GRUPOS.map(function(g, k){ var on = g===sel;
        return e("button",{key:g, type:"button", "aria-pressed":on, onClick:function(){ set({grupo:g, situacao:situacoesDe(g)[0]}); }, className:"h-8 whitespace-nowrap px-5 text-[13px] font-bold hover:bg-white/5", style:{borderLeft:k ? "2px solid "+COR_TOPO : "none", background:on ? COR_TOPO+"55" : undefined}}, g); })),
      e("div",{className:"grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-[210px_1fr]"},
        foto,
        e("div",{className:"grid grid-cols-2 content-start gap-3"},
          campo(e(CampoTexto,{t:"Nome", id:"mod-nome", value:f.nome, maxLength:80, onChange:function(v){ set({nome:v}); }}), true),
          e(CampoTexto,{t:"Instagram", id:"mod-insta", value:f.insta, placeholder:"usuario ou link", onChange:function(v){ set({insta:v}); }}),
          e(CampoTexto,{t:"Telefone", id:"mod-tel", value:f.tel, onChange:function(v){ set({tel:v}); }}),
          campo(e(CampoTexto,{t:"Endereço", id:"mod-end", value:f.endereco, onChange:function(v){ set({endereco:v}); }}), true),
          e(CampoSel,{t:"Situação", id:"mod-sit", value:f.situacao, opcoes:situacoesDe(f.grupo).map(function(x){ return [x, x]; }), onChange:function(v){ set({situacao:v}); }}),
          e(CampoTexto,{t:"Último envio", id:"mod-envio", tipo:"date", value:f.ultimoEnvio, onChange:function(v){ set({ultimoEnvio:v}); }}),
          f.grupo!=="Influencers" && e(CampoDin,{t:"Liberado por mês", id:"mod-valor", value:f.valor, onChange:function(v){ set({valor:v}); }}),
          f.grupo==="Sorelly" && e(CampoTexto,{t:"Na empresa (data agendada)", id:"mod-emp", tipo:"date", value:f.naEmpresa, onChange:function(v){ set({naEmpresa:v}); }}),
          f.grupo==="Influencers" && campo(e(CampoTexto,{t:"Link da influencer", id:"mod-link", value:f.link, placeholder:"https://...", onChange:function(v){ set({link:v}); }}), true),
          f.grupo==="Influencers" && e(CampoTexto,{t:"Meta (revendedoras)", id:"mod-meta", tipo:"number", min:0, value:f.meta==null ? "" : f.meta, onChange:function(v){ set({meta:v}); }}),
          f.grupo==="Influencers" && e(CampoTexto,{t:"Trouxe", id:"mod-trouxe", tipo:"number", min:0, value:f.trouxe==null ? "" : f.trouxe, onChange:function(v){ set({trouxe:v}); }}),
          f.grupo==="Influencers" && campo(e(CampoTexto,{t:"Prêmio ao bater a meta", id:"mod-premio", value:f.premio, placeholder:"porta-joia, dinheiro...", onChange:function(v){ set({premio:v}); }}), true))),
      e("div",{className:"flex shrink-0 flex-wrap items-center justify-end gap-2 p-3", style:{borderTop:"2px solid "+COR_TOPO}}, f.id && e("span",{className:"mr-auto"}, e(Botao,{onClick:function(){ if(window.confirm("Excluir "+f.nome+"?")) p.onExcluir(f.id); }}, "Excluir")), e(Botao,{onClick:p.onFechar}, "Cancelar"), e(Botao,{principal:true, onClick:function(){ p.onSalvar(f); }}, "Salvar"))));
}

function AbaModelas(){
  var cx = use(), s = cx.state, d = cx.dispatch, ed = useState(null), editando = ed[0], zm = useState(""), zoom = zm[0], gr = useState("Sorelly"), grupo = gr[0];
  var todas = (s.mod && s.mod.itens) || [], pode = temAutorizacao("modelos_ver", s.usuario);
  var contar = function(g){ return todas.filter(function(m){ return (m.grupo || "Marcus")===g; }).length; };
  // topo numa linha só: título e botão "+"; a barra dos grupos fica DENTRO do bloco, numa linha acima do cabeçalho da tabela
  var cab = e(PageHead,{t:TITULO_JEITO1, estilo:{fontWeight:600, color:"#fff"}},
    null);
  if(!pode) return e(Pagina,{className:"-mt-3"}, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Esta tela é particular. Você não tem acesso."));
  var itens = todas.filter(function(m){ return (m.grupo || "Marcus")===grupo; });

  var op = function(o){ d(Object.assign({type:"MOD", por:porDe(s)}, o)); };
  var salvar = function(f){ op({op:"salvar", item:Object.assign({}, f, {insta:limpaInsta(f.insta)})}); ed[1](null); };
  // células da tabela (a TabelaPlanilha filtra e ordena pelo TEXTO de cada coluna; o desenho vem do render)
  var celulas = function(m){
    var zap = function(tel){ var dg = String(tel||"").replace(/\D/g, ""); return dg.length>=10 ? "https://wa.me/"+(dg.slice(0, 2)==="55" && dg.length>=12 ? dg : "55"+dg) : null; };
    var cor = COR_SIT[m.situacao] || "#FFFFFF", pendente = cor==="#FFFFFF";
    var cel = {
      foto: m.foto ? e("img",{src:m.foto, alt:m.nome, title:"Ver a foto grande", onClick:function(ev){ ev.stopPropagation(); zm[1](m.foto); }, className:"my-2 w-[130px] cursor-zoom-in rounded-2xl object-cover", style:{height:ALTO-16, objectPosition:"50% 20%", boxShadow:"0 0 0 2px "+COR_TOPO+", 0 6px 16px rgba(0,0,0,.45)"}}) : "—",
      nome: e("span",{className:TXT+" whitespace-nowrap font-bold", style:FONTE}, m.nome),
      insta: m.insta ? e("a",{href:"https://www.instagram.com/"+m.insta+"/", target:"_blank", rel:"noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:TXT+" font-semibold "+SUBLINHADO+" hover:brightness-125", style:Object.assign({color:"#2DD4BF", textDecorationColor:COR_TOPO}, FONTE)}, "@"+m.insta) : "—",
      tel: zap(m.tel) ? e("a",{href:zap(m.tel), target:"_blank", rel:"noreferrer", title:"Abrir no WhatsApp", onClick:function(ev){ ev.stopPropagation(); }, className:TXT+" hover:underline", style:FONTE}, m.tel) : "—",
      end: m.endereco ? e("span",{className:TXT+" whitespace-normal text-center leading-snug", style:FONTE}, m.endereco) : "—",
      link: m.link ? e("a",{href:m.link, target:"_blank", rel:"noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:TXT+" font-semibold "+SUBLINHADO+" hover:brightness-125", style:Object.assign({color:"#2DD4BF", textDecorationColor:COR_TOPO}, FONTE)}, "Abrir link") : "—",
      trouxe: e("span",{className:TXT+" tabular-nums", style:Object.assign({color:m.meta>0 && m.trouxe>=m.meta ? "#22C55E" : "#FFFFFF"}, FONTE)}, m.meta>0 ? (m.trouxe>=m.meta ? "Meta batida · " : "")+(m.trouxe||0)+" de "+m.meta : String(m.trouxe||0)),
      premio: m.premio ? e("span",{className:TXT+" whitespace-normal text-center leading-snug", style:FONTE}, m.premio) : "—",
      valor: m.valor>0 ? e("span",{className:TXT+" tabular-nums", style:FONTE}, brl(m.valor)) : "—",
      emp: m.naEmpresa ? e("span",{className:TXT, style:FONTE}, dataBr(m.naEmpresa)) : "—",
      envio: e("span",{className:TXT, style:FONTE}, dataBr(m.ultimoEnvio)),
      // situação: verde (certo) e vermelho (parado) só para estado; pendente fica branco com a bolinha vazada
      sit: e("span",{className:TXT+" inline-flex items-center gap-2 whitespace-nowrap", style:Object.assign({color:cor}, FONTE)}, e("span",{className:"size-2.5 shrink-0 rounded-full", style:pendente ? {boxShadow:"inset 0 0 0 2px #fff"} : {background:cor}}), m.situacao)};
    return cel;
  };
  var linhas = itens.map(function(m){ return {id:m.id, _m:m, foto:m.foto ? "Com foto" : "Sem foto", nome:m.nome, insta:m.insta ? "@"+m.insta : "", tel:m.tel, end:m.endereco, link:m.link ? "Com link" : "", trouxe:m.meta>0 ? m.trouxe+" de "+m.meta : String(m.trouxe || 0), premio:m.premio, valor:m.valor>0 ? brl(m.valor) : "", emp:dataBr(m.naEmpresa), envio:dataBr(m.ultimoEnvio), sit:m.situacao}; });
  var colunas = CHAVES[grupo].map(function(k){ return {k:k, t:TODAS[k].t, corTopo:COR_TOPO, render:function(v, l){ return celulas(l._m)[k]; }}; });
  var barra = e("div",{role:"group", className:"flex", style:{background:COR_TOPO+"1F", borderBottom:"1px solid "+COR_TOPO}}, GRUPOS.map(function(g, i){ var on = g===grupo;
    return e("button",{key:g, type:"button", "aria-pressed":on, onClick:function(){ gr[1](g); }, className:"h-8 whitespace-nowrap px-5 text-[13px] font-bold hover:bg-white/5", style:{borderLeft:i ? "2px solid "+COR_TOPO : "none", background:on ? COR_TOPO+"55" : undefined}}, g+" · "+contar(g)); }), pode && e("button",{type:"button", title:"Nova modelo no grupo "+grupo, "aria-label":"Nova modelo", onClick:function(){ ed[1](Object.assign({}, VAZIO, {grupo:grupo, situacao:situacoesDe(grupo)[0]})); }, className:"ml-auto h-8 whitespace-nowrap px-5 text-[13px] font-bold hover:bg-white/10", style:{borderLeft:"2px solid "+COR_TOPO}}, "+ Nova modelo"));
  var bloco = function(corpo){ return e("div",{className:"modtab -mx-5 overflow-hidden rounded-lg border-2 [&_[data-sem-arrastar]]:rounded-none [&_[data-sem-arrastar]]:border-0", style:{borderColor:COR_TOPO, background:COR_TOPO+"14"}}, e("style",null,CSS_FIOS), barra, corpo); };
  return e(Pagina,{className:"-mt-3"}, cab,
    editando && e(Formulario,{key:editando.id || "novo", inicial:editando, onSalvar:salvar, onFechar:function(){ ed[1](null); }, onExcluir:function(id){ op({op:"excluir", id:id}); ed[1](null); }}),
    bloco(e(TabelaPlanilha,{cols:colunas, linhas:linhas, chave:"id", escura:true, grade:true, semContagem:true, aoClicar:function(l){ ed[1](l._m); }, vazio:"Nenhuma modelo neste grupo."})),
    zoom && e("div",{onClick:function(){ zm[1](""); }, className:"fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90"}, e("img",{src:zoom, alt:"Foto grande", className:"max-h-[94vh] max-w-[94vw] rounded-lg"})));
}

export { AbaModelas };
