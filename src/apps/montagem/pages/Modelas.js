// Sorelly Admin · montagem — pages/Modelas.js
// Marketing › Modelos (criada em 11/11/2026 nas Encomendas; passou para o Marketing em 12/11/2026, pedido do Marcus): planilha particular das mulheres que recebem joias e kits.
// Três grupos na barra do topo: Sorelly (modelos da Sorelly: conteúdo, negociação e ida na empresa), Marcus (amigas do Marcus) e Influencers (só enviamos kits).
// Linhas finas, foto grande (clique para ver em tela cheia). Só quem tem a autorização `modelos_ver` (padrão Marcus e Castilho).
// Regras em domain/modelas.js; estado s.mod, ação MOD. Tabela no layout D (TabelaCampos).
import { Botao, CampoSel, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { Pagina } from "@/apps/montagem/components/padrao";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { GRUPOS, REGRA_INFLUENCER, enviadoDe, faltamParaBonus, ganhoDe, limpaInsta, linkDe, situacoesDe } from "@/apps/montagem/domain/modelas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { CampoDin, CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var ALTO = 170;   // altura da fileira com foto
var COR_TOPO = "#14B8A6";   // cor do setor Encomendas: cabeçalho da tabela tingido, com barra grossa em cima
// título do jeito 1 (escolhido pelo Marcus em 11/11/2026): ícone + palavra, com a linha da cor do topo indo até o fim do título
var TITULO_JEITO1 = e("span",{className:"inline-flex flex-col gap-1.5"}, e("span",{className:"flex items-center gap-2"}, e("span",{className:"grid size-7 place-items-center rounded-lg text-[13px]", style:{background:COR_TOPO+"33", color:COR_TOPO}}, "★"), "Modelos"), e("span",{className:"h-0.5 w-full rounded", style:{background:COR_TOPO}}));
// colunas que se ajustam à largura da tela (nada de rolar para o lado em tela normal); mínimo de cada uma em px. Cada grupo mostra só as colunas que servem a ele.
var TODAS = {foto:{t:"Foto", w:"150px"}, nome:{t:"Nome", w:"minmax(170px,1fr)"}, insta:{t:"Instagram", w:"minmax(130px,1fr)"}, tel:{t:"Telefone", w:"140px"}, end:{t:"Endereço", w:"minmax(170px,2fr)"}, link:{t:"Link", w:"100px"}, trouxe:{t:"Aprovadas", w:"150px"}, ganhou:{t:"Ganhou em joias", w:"150px"}, falta:{t:"Falta enviar", w:"130px"}, valor:{t:"Liberado por mês", w:"150px"}, emp:{t:"Na empresa", w:"115px"}, envio:{t:"Último envio", w:"120px"}, sit:{t:"Situação", w:"minmax(210px,1fr)"}};
var CHAVES = {Sorelly:["foto", "nome", "insta", "tel", "end", "valor", "emp", "envio", "sit"], Marcus:["foto", "nome", "insta", "tel", "end", "valor", "envio", "sit"], Influencers:["foto", "nome", "insta", "tel", "end", "link", "trouxe", "ganhou", "falta", "envio", "sit"]};
var VAZIO = {id:null, nome:"", insta:"", tel:"", endereco:"", valor:null, ultimoEnvio:"", grupo:GRUPOS[0], naEmpresa:"", idApp:null, link:"", trouxe:null, situacao:"", foto:""};
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

var apenasDigitos = function(v){ return String(v || "").replace(/\D/g, ""); };
// 5512996407624 vira +55 (12) 99640-7624
var fmtZap = function(v){ var d = apenasDigitos(v); if(d.length===13 || d.length===12){ var ddd = d.slice(2, 4), n = d.slice(4); return "+55 ("+ddd+") "+n.slice(0, n.length-4)+"-"+n.slice(-4); } return v || "—"; };
var dataBrDe = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; };

function Formulario(p){
  var st = useState(p.inicial), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var sa = useState("dados"), aba = sa[0], si = useState(null), indic = si[0], setIndic = si[1];
  var sn = useState({data:hojeSP(), valor:null, obs:""}), ne = sn[0], setNe = sn[1];
  var comAbas = f.grupo==="Influencers" && !!f.id;   // a influencer já cadastrada ganha as abas Indicadas e Envios de joias
  var vivo = p.vivo || f, calc = p.calc(vivo);
  // lista de quem ela indicou, lida do app pelo ID (só leitura)
  useEffect(function(){
    if(aba!=="indicadas" || !(Number(f.idApp)>0) || !apiAtiva()) return; var ativo = true;
    chamar("GET", "/modelos/indicacoes?indicadas="+Number(f.idApp)).then(function(j){ if(ativo) setIndic({lista:j.indicadas || []}); }).catch(function(x){ if(ativo) setIndic({erro:(x && x.message) || "O app não respondeu."}); });
    return function(){ ativo = false; };
  }, [aba, f.idApp, setIndic]);
  var foto = e("label",{className:"flex h-[250px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl text-[13px] hover:brightness-110", style:{boxShadow:"0 0 0 2px "+COR_TOPO, background:COR_TOPO+"14"}}, f.foto ? e("img",{src:f.foto, alt:"", className:"h-full w-full object-cover", style:{objectPosition:"50% 20%"}}) : "+ Foto",
    e("input",{type:"file", accept:"image/*", className:"hidden", onChange:function(ev){ var a = ev.target.files && ev.target.files[0]; if(a) reduzFoto(a, function(d){ set({foto:d}); }); }}));
  var campo = function(c, span){ return e("div",{className:span ? "col-span-2" : ""}, c); };
  var barraDe = function(lista, atual, muda){ return e("div",{role:"group", className:"flex shrink-0", style:{background:COR_TOPO+"1F", borderBottom:"2px solid "+COR_TOPO}}, lista.map(function(g, k){ var on = g[0]===atual;
    return e("button",{key:g[0], type:"button", "aria-pressed":on, onClick:function(){ muda(g[0]); }, className:"h-8 whitespace-nowrap px-5 text-[13px] font-bold hover:bg-white/5", style:{borderLeft:k ? "2px solid "+COR_TOPO : "none", background:on ? COR_TOPO+"55" : undefined}}, g[1]); })); };
  var dados = e("div",{className:"grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-[210px_1fr]"},
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
      f.grupo==="Influencers" && e(CampoTexto,{t:"ID no app", id:"mod-idapp", tipo:"number", min:0, value:f.idApp==null ? "" : f.idApp, placeholder:"conta no app", onChange:function(v){ set({idApp:v}); }}),
      f.grupo==="Influencers" && e(CampoTexto,{t:"Link (sai pronto com o ID)", id:"mod-link", value:Number(f.idApp)>0 ? linkDe(f) : f.link, placeholder:"https://...", onChange:function(v){ if(!(Number(f.idApp)>0)) set({link:v}); }}),
      f.grupo==="Influencers" && campo(e(CampoTexto,{t:"Aprovadas (à mão, sem ID)", id:"mod-trouxe", tipo:"number", min:0, value:f.trouxe==null ? "" : f.trouxe, onChange:function(v){ set({trouxe:v}); }}), true)));
  // aba Indicadas: quem ela indicou (nome e WhatsApp completos), com aviso de número repetido
  var indicadas = (function(){
    var aviso = function(txt){ return e("p",{className:"p-6 text-center text-[13px]"}, txt); };
    if(!(Number(f.idApp)>0)) return aviso("Coloque o ID no app, na aba Dados, para ler as indicadas.");
    if(!apiAtiva()) return aviso("As indicadas vêm do servidor. Entre no sistema pelo servidor para ver.");
    if(!indic) return aviso("Lendo o app...");
    if(indic.erro) return aviso(indic.erro);
    var minha = apenasDigitos(f.tel), conta = {}; indic.lista.forEach(function(x){ var d = apenasDigitos(x.whatsapp); if(d) conta[d] = (conta[d] || 0)+1; });
    var linhas = indic.lista.map(function(x){ var d = apenasDigitos(x.whatsapp), av = d && minha && (d===minha || d.slice(-10)===minha.slice(-10)) ? "Mesmo número da influencer" : (d && conta[d]>1 ? "Número repetido" : "");
      return {id:x.id, nome:x.nome || "—", whatsapp:fmtZap(x.whatsapp), situacao:x.statusLabel, data:dataBrDe((x.criadoEm || "").slice(0, 10)), aviso:av || "—"}; });
    return e("div",{className:"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4"},
      e("div",{className:"text-[13px]"}, indic.lista.length+" indicadas · "+calc.aprovadas+" aprovadas (cadastro aprovado ou kit entregue)"),
      e(TabelaPlanilha,{cols:[{k:"nome", t:"Nome"}, {k:"whatsapp", t:"WhatsApp"}, {k:"situacao", t:"Situação"}, {k:"data", t:"Indicada em"}, {k:"aviso", t:"Aviso"}], linhas:linhas, chave:"id", escura:true, grade:true, semContagem:true, vazio:"Ninguém se cadastrou pelo link dela ainda."}));
  })();
  // aba Envios de joias: cada envio (data, valor a preço de venda, observação); a soma é o "enviado"
  var envios = e("div",{className:"flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"},
    e("div",{className:"text-[13px]"}, "Ganhou "+brl(calc.ganhou)+" · Enviado "+brl(calc.enviado)+" · Falta enviar "+brl(calc.falta)+"  ("+brl(REGRA_INFLUENCER.porAprovada)+" por aprovada + "+brl(REGRA_INFLUENCER.bonus)+" a cada "+REGRA_INFLUENCER.aCada+")"),
    e("div",{className:"grid grid-cols-1 items-end gap-3 md:grid-cols-[150px_160px_1fr_auto]"},
      e(CampoTexto,{t:"Data do envio", id:"env-data", tipo:"date", value:ne.data, onChange:function(v){ setNe(Object.assign({}, ne, {data:v})); }}),
      e(CampoDin,{t:"Valor (preço de venda)", id:"env-valor", value:ne.valor, onChange:function(v){ setNe(Object.assign({}, ne, {valor:v})); }}),
      e(CampoTexto,{t:"O que foi enviado", id:"env-obs", value:ne.obs, maxLength:200, placeholder:"ex.: 3 colares e 2 pulseiras", onChange:function(v){ setNe(Object.assign({}, ne, {obs:v})); }}),
      e(Botao,{principal:true, desabilitado:!(Number(ne.valor)>0), onClick:function(){ p.op({op:"envio_add", id:f.id, data:ne.data, valor:ne.valor, obs:ne.obs}); setNe({data:hojeSP(), valor:null, obs:""}); }}, "Registrar envio")),
    e(TabelaPlanilha,{cols:[{k:"data", t:"Data"}, {k:"valor", t:"Valor"}, {k:"obs", t:"O que foi enviado"}, {k:"por", t:"Registrado por"}, {k:"tirar", t:"Remover", render:function(v, l){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); if(window.confirm("Remover este envio?")) p.op({op:"envio_del", id:f.id, envioId:l.id}); }, className:"h-8 px-3 text-[13px] underline hover:brightness-125"}, "Remover"); }}],
      linhas:(vivo.envios || []).slice().reverse().map(function(x){ return {id:x.id, data:dataBrDe(x.data), valor:brl(x.valor), obs:x.obs || "—", por:x.por || "—", tirar:"remover"}; }), chave:"id", escura:true, grade:true, semContagem:true, vazio:"Nenhum envio registrado."}));
  // card no meio da tela (o fundo escuro fecha ao clicar)
  return e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick:p.onFechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"modform flex max-h-[94vh] w-full max-w-[820px] flex-col overflow-hidden rounded-xl border-2 bg-[#101214]", style:{borderColor:COR_TOPO}},
      e("style",null,CSS_CARD),
      // faixa do título, igual ao cabeçalho da tabela
      e("div",{className:"flex h-8 shrink-0 items-center justify-between px-4 text-[13px] font-bold uppercase tracking-[.08em]", style:{background:COR_TOPO+"40", boxShadow:"inset 0 3px 0 "+COR_TOPO}}, e("span",null, f.id ? "Editar modelo" : "Nova modelo"), e("button",{type:"button", onClick:p.onFechar, "aria-label":"Fechar", className:"grid size-8 place-items-center rounded-md hover:bg-white/10"}, "✕")),
      // grupos na mesma barra do bloco
      barraDe(GRUPOS.map(function(g){ return [g, g]; }), f.grupo, function(g){ set({grupo:g, situacao:situacoesDe(g)[0]}); sa[1]("dados"); }),
      comAbas && barraDe([["dados", "Dados"], ["indicadas", "Indicadas"], ["envios", "Envios de joias"]], aba, sa[1]),
      !comAbas || aba==="dados" ? dados : (aba==="indicadas" ? indicadas : envios),
      e("div",{className:"flex shrink-0 flex-wrap items-center justify-end gap-2 p-3", style:{borderTop:"2px solid "+COR_TOPO}}, f.id && e("span",{className:"mr-auto"}, e(Botao,{onClick:function(){ if(window.confirm("Excluir "+f.nome+"?")) p.onExcluir(f.id); }}, "Excluir")), e(Botao,{onClick:p.onFechar}, aba==="dados" || !comAbas ? "Cancelar" : "Fechar"), (aba==="dados" || !comAbas) && e(Botao,{principal:true, onClick:function(){ p.onSalvar(f); }}, "Salvar"))));
}

function AbaModelas(){
  var cx = use(), s = cx.state, d = cx.dispatch, ed = useState(null), editando = ed[0], zm = useState(""), zoom = zm[0], gr = useState("Sorelly"), grupo = gr[0];
  var todas = (s.mod && s.mod.itens) || [], pode = temAutorizacao("modelos_ver", s.usuario);
  // quantas revendedoras cada influencer trouxe, lido do app pelo ID dela (etapa 2 da ideia do Nickolas); sem servidor ou sem ID, vale o número lançado à mão
  var sc = useState({}), cont = sc[0], setCont = sc[1], ids = todas.filter(function(m){ return m.grupo==="Influencers" && m.idApp>0; }).map(function(m){ return m.idApp; }).sort().join(",");
  useEffect(function(){ if(!pode || !ids || !apiAtiva()) return; var vivo = true; chamar("GET", "/modelos/indicacoes?ids="+ids).then(function(j){ if(vivo) setCont(j.contagens || {}); }).catch(function(){}); return function(){ vivo = false; }; }, [ids, pode, setCont]);
  var contar = function(g){ return todas.filter(function(m){ return (m.grupo || "Marcus")===g; }).length; };
  // topo numa linha só: título e botão "+"; a barra dos grupos fica DENTRO do bloco, numa linha acima do cabeçalho da tabela
  var cab = e(PageHead,{t:TITULO_JEITO1, estilo:{fontWeight:600, color:"#fff"}},
    null);
  if(!pode) return e(Pagina,{className:"-mt-3"}, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Esta tela é particular. Você não tem acesso."));
  var itens = todas.filter(function(m){ return (m.grupo || "Marcus")===grupo; });

  var op = function(o){ d(Object.assign({type:"MOD", por:porDe(s)}, o)); };
  var salvar = function(f){ op({op:"salvar", item:Object.assign({}, f, {insta:limpaInsta(f.insta)})}); ed[1](null); };
  var doApp = function(m){ var c = m.idApp>0 ? cont[m.idApp] : null; return c && !c.erro ? c : null; };
  var trouxeDe = function(m){ var c = doApp(m); return c ? c.trouxe : (m.trouxe || 0); };
  var faltaDe = function(m){ return Math.max(0, ganhoDe(trouxeDe(m)) - enviadoDe(m)); };
  var calc = function(m){ return {aprovadas:trouxeDe(m), ganhou:ganhoDe(trouxeDe(m)), enviado:enviadoDe(m), falta:faltaDe(m)}; };
  var trouxeDica = function(m){ var c = doApp(m); return c ? "Do app: "+c.cadastro_aprovado+" cadastro aprovado, "+c.finalizado+" kit entregue, "+c.em_andamento+" em andamento, "+c.criado+" novas, "+c.cancelado+" canceladas" : (m.idApp>0 ? "Lendo o app..." : "Lançado à mão"); };
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
      link: linkDe(m) ? e("a",{href:linkDe(m), target:"_blank", rel:"noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:TXT+" font-semibold "+SUBLINHADO+" hover:brightness-125", style:Object.assign({color:"#2DD4BF", textDecorationColor:COR_TOPO}, FONTE)}, "Abrir link") : "—",
      trouxe: e("span",{className:TXT+" tabular-nums", title:trouxeDica(m), style:FONTE}, trouxeDe(m)+" · faltam "+faltamParaBonus(trouxeDe(m))+" para o bônus"),
      ganhou: e("span",{className:TXT+" tabular-nums", title:brl(REGRA_INFLUENCER.porAprovada)+" por indicação aprovada + "+brl(REGRA_INFLUENCER.bonus)+" a cada "+REGRA_INFLUENCER.aCada+" aprovadas (em joias, a preço de venda)", style:FONTE}, brl(ganhoDe(trouxeDe(m)))),
      falta: e("span",{className:TXT+" tabular-nums", style:Object.assign({color:faltaDe(m)>0 ? "#FFFFFF" : "#22C55E"}, FONTE)}, ganhoDe(trouxeDe(m))>0 && faltaDe(m)<=0 ? "Em dia" : brl(faltaDe(m))),
      valor: m.valor>0 ? e("span",{className:TXT+" tabular-nums", style:FONTE}, brl(m.valor)) : "—",
      emp: m.naEmpresa ? e("span",{className:TXT, style:FONTE}, dataBr(m.naEmpresa)) : "—",
      envio: e("span",{className:TXT, style:FONTE}, dataBr(m.ultimoEnvio)),
      // situação: verde (certo) e vermelho (parado) só para estado; pendente fica branco com a bolinha vazada
      sit: e("span",{className:TXT+" inline-flex items-center gap-2 whitespace-nowrap", style:Object.assign({color:cor}, FONTE)}, e("span",{className:"size-2.5 shrink-0 rounded-full", style:pendente ? {boxShadow:"inset 0 0 0 2px #fff"} : {background:cor}}), m.situacao)};
    return cel;
  };
  var linhas = itens.map(function(m){ return {id:m.id, _m:m, foto:m.foto ? "Com foto" : "Sem foto", nome:m.nome, insta:m.insta ? "@"+m.insta : "", tel:m.tel, end:m.endereco, link:linkDe(m) ? "Com link" : "", trouxe:String(trouxeDe(m)), ganhou:brl(ganhoDe(trouxeDe(m))), falta:brl(faltaDe(m)), valor:m.valor>0 ? brl(m.valor) : "", emp:dataBr(m.naEmpresa), envio:dataBr(m.ultimoEnvio), sit:m.situacao}; });
  var colunas = CHAVES[grupo].map(function(k){ return {k:k, t:TODAS[k].t, corTopo:COR_TOPO, render:function(v, l){ return celulas(l._m)[k]; }}; });
  var barra = e("div",{role:"group", className:"flex", style:{background:COR_TOPO+"1F", borderBottom:"1px solid "+COR_TOPO}}, GRUPOS.map(function(g, i){ var on = g===grupo;
    return e("button",{key:g, type:"button", "aria-pressed":on, onClick:function(){ gr[1](g); }, className:"h-8 whitespace-nowrap px-5 text-[13px] font-bold hover:bg-white/5", style:{borderLeft:i ? "2px solid "+COR_TOPO : "none", background:on ? COR_TOPO+"55" : undefined}}, g+" · "+contar(g)); }), pode && e("button",{type:"button", title:"Nova modelo no grupo "+grupo, "aria-label":"Nova modelo", onClick:function(){ ed[1](Object.assign({}, VAZIO, {grupo:grupo, situacao:situacoesDe(grupo)[0]})); }, className:"ml-auto h-8 whitespace-nowrap px-5 text-[13px] font-bold hover:bg-white/10", style:{borderLeft:"2px solid "+COR_TOPO}}, "+ Nova modelo"));
  var bloco = function(corpo){ return e("div",{className:"modtab -mx-5 overflow-hidden rounded-lg border-2 [&_[data-sem-arrastar]]:rounded-none [&_[data-sem-arrastar]]:border-0", style:{borderColor:COR_TOPO, background:COR_TOPO+"14"}}, e("style",null,CSS_FIOS), barra, corpo); };
  return e(Pagina,{className:"-mt-3"}, cab,
    editando && e(Formulario,{key:editando.id || "novo", inicial:editando, vivo:editando.id ? todas.find(function(m){ return m.id===editando.id; }) : null, calc:calc, op:op, onSalvar:salvar, onFechar:function(){ ed[1](null); }, onExcluir:function(id){ op({op:"excluir", id:id}); ed[1](null); }}),
    bloco(e(TabelaPlanilha,{cols:colunas, linhas:linhas, chave:"id", escura:true, grade:true, semContagem:true, aoClicar:function(l){ ed[1](l._m); }, vazio:"Nenhuma modelo neste grupo."})),
    zoom && e("div",{onClick:function(){ zm[1](""); }, className:"fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90"}, e("img",{src:zoom, alt:"Foto grande", className:"max-h-[94vh] max-w-[94vw] rounded-lg"})));
}

export { AbaModelas };
