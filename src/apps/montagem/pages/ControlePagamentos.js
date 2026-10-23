// Sorelly Admin · montagem — pages/ControlePagamentos.js
// Financeiro → Hoje → Pagamentos. REFEITA no padrão do Financeiro (22/10/2026, regra fixa do Marcus; sem cores soltas, sem cartões em degradê): título · faixa de totais · abas visíveis ·
// tabelas de layout fixo (R$ em todo valor, números à direita, linhas de 32 px). Cor só no estado: Atrasada em amarelo, Completa em verde.
// Para onde vai o Pix das revendedoras: o Financeiro cria orientações ("direcionar R$ X para tal conta até tal data"), o sistema mostra quanto falta e sugere o destino de cada Pix que chega;
// o Lucas confirma ou troca. Também é aqui que se define a conta dos pagamentos do atendimento interno (aba Atendimento). Contexto: docs/negocio/FLUXO-DE-PAGAMENTOS.md. Versão antiga guardada fora do projeto.
import { AbasTela, BlocoFiltros, Botao, CAMPO, CampoSel, FaixaTotais, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { PagamentosAConferir } from "@/apps/montagem/components/pagamentos-conferir";
import { TIPOS_DESTINO, direcionado, faltaDe, hojeIsoCp, sugestoes } from "@/apps/montagem/domain/controle-pagamentos";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { BKC } from "@/apps/montagem/lib/format";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var br = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7) : "—"; };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var tipoNome = function(t){ return (TIPOS_DESTINO[t] || ["—"])[0]; };
var destinoDe = function(cp, id){ return cp.destinos.find(function(x){ return x.id===id; }) || {nome:"(destino removido)", tipo:"CNPJ", chavePix:""}; };
var campoDin = function(valor, rot, onChange){ return e(CampoDinheiro,{value:valor || null, label:rot, className:CAMPO+" text-right tabular-nums", onChange:function(v){ onChange(v || 0); }}); };

function useCP(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, cp:s.cp, por:nomeDe(s.usuario), edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario)}; }
function acao(c, op, extra){ c.d(Object.assign({type:"CP", op:op, por:c.por}, extra)); }
function Janela(p){
  return e("div",{className:"fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:"w-full max-w-2xl rounded-2xl border border-white/15 bg-[#14171c] p-4 shadow-2xl"},
      e("div",{className:"mb-3 flex items-center"}, e("h3",{className:"truncate text-[16px] font-semibold text-foreground"}, p.t), e("button",{type:"button", onClick:p.fechar, className:"ml-auto h-8 rounded-md border border-border px-3 text-[13px] text-foreground hover:bg-white/10"}, "Fechar")), p.children));
}
var situacaoDe = function(o, hoje){
  if(o.status==="concluida") return ["Concluída", ""]; if(o.status==="cancelada") return ["Cancelada", ""];
  if(faltaDe(o)<=0.004) return ["Completa", "text-success"];
  return o.ate && o.ate<hoje ? ["Atrasada", "text-warning"] : ["Em aberto", ""];
};

// ── Registrar Pix de uma orientação (e ver / remover os já lançados)
function JanelaPix(p){
  var c = p.c, o = p.o, d = destinoDe(c.cp, o.destinoId), a = useState(0), valor = a[0], setValor = a[1], b = useState(""), origem = b[0], setOrigem = b[1], g = useState(""), conta = g[0], setConta = g[1];
  var ffs = c.s.ff || {}, contasSocio = d.personaId ? (ffs.contasBanc||[]).filter(function(x){ return x.personaId===d.personaId && x.ativo!==false; }) : [];
  var registra = function(){ acao(c, "orient_lanc", {id:o.id, valor:valor, origem:origem}); if(d.personaId && conta) c.d({type:"FF", op:"pix_add", por:c.por, personaId:d.personaId, data:hojeIsoCp(), valor:valor, origem:origem, contaId:conta, forma:"PIX"}); setValor(0); setOrigem(""); setConta(""); };
  return e(Janela,{t:"Pix · "+d.nome, fechar:p.fechar},
    e("div",{className:"flex flex-col gap-3"},
      e(FaixaTotais,{itens:[{t:"Valor", v:BKC(o.valor)},{t:"Direcionado", v:BKC(direcionado(o))},{t:"Falta", v:BKC(Math.max(0, faltaDe(o)))}]}),
      c.edita && o.status==="aberta" && e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"Valor do Pix", id:"pix-v"}), campoDin(valor, "Valor do Pix", setValor)),
        e("div",{className:"min-w-0 md:col-span-2"}, e(Rotulo,{t:"Revendedora", id:"pix-o"}), e("input",{id:"pix-o", type:"text", value:origem, onChange:function(ev){ setOrigem(ev.target.value); }, placeholder:"Opcional", className:CAMPO})),
        e("div",{className:"flex items-end"}, e(Botao,{principal:true, desabilitado:!(valor>0) || (contasSocio.length>0 && !conta), onClick:registra}, "Registrar")),
        contasSocio.length>0 && e(CampoSel,{t:"Para onde foi o dinheiro", id:"pix-c", value:conta, cls:"col-span-2 md:col-span-4", onChange:setConta, opcoes:[["", "Escolha a conta"]].concat(contasSocio.map(function(x){ return [x.id, "Pix "+d.nome+" · "+String(x.nome).replace(/^Contas+/i, "")+(x.banco ? " ("+x.banco+")" : "")]; }))})),
      o.lanc.length ? e(TabelaP,{minW:580, cols:[{t:"Data", w:80},{t:"Revendedora"},{t:"Quem", w:120},{t:"Valor", n:true, w:130},{t:"", w:90}]},
        o.lanc.slice().reverse().map(function(x){ return e(Tr,{key:x.id}, e(Td,null, br(x.data)), e(Td,null, x.origem || "—"), e(Td,null, x.por), e(Td,{n:true}, BKC(x.valor)),
          e("td",{className:"h-8 border-b border-border px-2 text-right"}, c.edita ? e("button",{type:"button", onClick:function(){ acao(c, "lanc_del", {id:o.id, lancId:x.id}); }, className:"h-7 rounded-md border border-border px-2 text-[12px] text-foreground hover:bg-white/10"}, "Remover") : null)); }))
        : e("p",{className:"rounded-lg border border-border px-4 py-4 text-center text-[13px] text-foreground"}, "Nenhum Pix registrado nesta orientação.")));
}

// ── Aba Orientações: Pix que chegou → destino sugerido · nova orientação · lista
function AbaOrient(p){
  var c = p.c, cp = c.cp, hoje = hojeIsoCp();
  var sv = useState(0), valorPix = sv[0], setValorPix = sv[1], so = useState(""), origem = so[0], setOrigem = so[1];
  var sf = useState("aberta"), filtro = sf[0], setFiltro = sf[1], sn = useState({destinoId:"", valor:0, ate:"", obs:""}), nova = sn[0], setNova = function(x){ sn[1](Object.assign({}, nova, x)); };
  var sj = useState(null), janela = sj[0], setJanela = sj[1];
  var sug = sugestoes(cp), restante = valorPix;
  var direcionar = function(s){ var aplica = Math.min(restante, s.falta); acao(c, "orient_lanc", {id:s.o.id, valor:aplica, origem:origem}); setValorPix(r2(restante-aplica)>0.004 ? r2(restante-aplica) : 0); };
  var lista = cp.orientacoes.filter(function(o){ return filtro==="todas" || o.status===filtro; }).sort(function(a, b){ return (a.status==="aberta" ? 0 : 1)-(b.status==="aberta" ? 0 : 1) || (a.ate||"9999").localeCompare(b.ate||"9999"); });
  var destinos = [["", "Escolha o destino"]]; Object.keys(TIPOS_DESTINO).forEach(function(t){ cp.destinos.filter(function(d){ return d.ativo && d.tipo===t; }).forEach(function(d){ destinos.push([d.id, tipoNome(t)+" · "+d.nome]); }); });
  var joOrient = janela && cp.orientacoes.filter(function(o){ return o.id===janela; })[0];
  return e("div",{className:"flex flex-col gap-3"},
    joOrient && e(JanelaPix,{c:c, o:joOrient, fechar:function(){ setJanela(null); }}),
    c.edita && e(BlocoFiltros,{titulo:"Chegou um Pix? Para onde vai"},
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Valor do Pix", id:"cp-vp"}), campoDin(valorPix, "Valor do Pix", setValorPix)),
      e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Revendedora", id:"cp-orig"}), e("input",{id:"cp-orig", type:"text", value:origem, onChange:function(ev){ setOrigem(ev.target.value); }, placeholder:"Opcional", className:CAMPO})),
      e("div",{className:"col-span-2 min-w-0 md:col-span-4"},
        sug.length===0 ? e("p",{className:"rounded-lg border border-border px-4 py-3 text-center text-[13px] text-foreground"}, "Nenhuma orientação em aberto. Crie uma orientação abaixo.") :
        e(TabelaP,{minW:780, cols:[{t:"Destino"},{t:"Tipo", w:170},{t:"Até", w:80},{t:"Falta", n:true, w:130},{t:"", w:210}]},
          sug.slice(0, 6).map(function(s, i){ var d = destinoDe(cp, s.o.destinoId);
            return e(Tr,{key:s.o.id}, e(Td,{forte:true}, (i===0 ? "★ " : "")+d.nome), e(Td,null, tipoNome(d.tipo)), e(Td,{cor:s.atrasada ? "text-warning" : ""}, br(s.o.ate)), e(Td,{n:true}, BKC(s.falta)),
              e("td",{className:"h-8 border-b border-border px-2 text-right"}, e("button",{type:"button", disabled:!(restante>0), onClick:function(){ direcionar(s); }, className:"h-7 max-w-full truncate rounded-md border px-2 text-[12px] "+(i===0 ? "border-primary bg-primary/20 text-primary" : "border-border text-foreground")+(restante>0 ? " hover:bg-white/10" : " opacity-50")}, restante>0 ? "Direcionar "+BKC(Math.min(restante, s.falta)) : "Digite o valor"))); })))),
    c.edita && e(BlocoFiltros,{titulo:"Nova orientação"},
      e(CampoSel,{t:"Destino", id:"cp-nd", value:nova.destinoId, cls:"col-span-2", onChange:function(v){ setNova({destinoId:v}); }, opcoes:destinos}),
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Valor a direcionar", id:"cp-nv"}), campoDin(nova.valor, "Valor a direcionar", function(v){ setNova({valor:v}); })),
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Até quando", id:"cp-na"}), e("input",{id:"cp-na", type:"date", value:nova.ate, onChange:function(ev){ setNova({ate:ev.target.value}); }, className:CAMPO})),
      e("div",{className:"col-span-2 min-w-0 md:col-span-3"}, e(Rotulo,{t:"Observação", id:"cp-no"}), e("input",{id:"cp-no", type:"text", value:nova.obs, onChange:function(ev){ setNova({obs:ev.target.value}); }, placeholder:"Ex.: direcionar direto para o Safra", className:CAMPO})),
      e("div",{className:"flex items-end md:justify-end"}, e(Botao,{principal:true, desabilitado:!nova.destinoId || !(nova.valor>0), onClick:function(){ acao(c, "orient_add", {destinoId:nova.destinoId, valor:nova.valor, ate:nova.ate, obs:nova.obs}); setNova({valor:0, obs:""}); }}, "Criar orientação"))),
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"}, e(Segmentado,{opcoes:[["aberta","Em aberto"],["concluida","Concluídas"],["cancelada","Canceladas"],["todas","Todas"]], atual:filtro, onMudar:setFiltro}), e("span",{className:"text-[13px] text-foreground"}, lista.length+(lista.length===1 ? " orientação" : " orientações"))),
    lista.length===0 ? e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Nenhuma orientação neste filtro.") :
    e(TabelaP,{minW:1140, cols:[{t:"Destino"},{t:"Tipo", w:170},{t:"Até", w:80},{t:"Valor", n:true, w:120},{t:"Direcionado", n:true, w:120},{t:"Falta", n:true, w:120},{t:"Situação", w:100},{t:"", w:c.edita ? 250 : 0}].filter(function(x){ return x.w!==0; })},
      lista.map(function(o){ var d = destinoDe(cp, o.destinoId), sit = situacaoDe(o, hoje), falta = faltaDe(o);
        return e(Tr,{key:o.id, apagado:o.status!=="aberta"}, e(Td,{forte:true, title:o.obs ? d.nome+" · "+o.obs : d.nome}, d.nome), e(Td,null, tipoNome(d.tipo)), e(Td,null, br(o.ate)), e(Td,{n:true}, BKC(o.valor)), e(Td,{n:true}, BKC(direcionado(o))), e(Td,{n:true}, falta>0.004 ? BKC(falta) : "—"), e(Td,{cor:sit[1]}, sit[0]),
          c.edita && e("td",{className:"h-8 border-b border-border px-2"}, e("div",{className:"flex items-center justify-end gap-1.5"},
            e("button",{type:"button", onClick:function(){ setJanela(o.id); }, className:"h-7 rounded-md border border-border px-2 text-[12px] text-foreground hover:bg-white/10"}, o.status==="aberta" ? "Pix · "+o.lanc.length : "Ver Pix · "+o.lanc.length),
            e("select",{value:o.status, "aria-label":"Situação da orientação", onChange:function(ev){ acao(c, "orient_status", {id:o.id, status:ev.target.value}); }, className:"h-7 w-28 rounded-md border border-border bg-card px-1.5 text-[12px] text-foreground"}, e("option",{value:"aberta"}, "Em aberto"), e("option",{value:"concluida"}, "Concluída"), e("option",{value:"cancelada"}, "Cancelada")),
            e("button",{type:"button", "aria-label":"Excluir orientação", title:"Excluir", onClick:function(){ if(window.confirm("Excluir esta orientação e os Pix registrados nela?")) acao(c, "orient_del", {id:o.id}); }, className:"h-7 rounded-md border border-border px-2 text-[12px] text-foreground hover:bg-white/10"}, "Excluir")))); })));
}

// ── Aba Destinos: quem recebe os Pix das revendedoras
function AbaDestinos(p){
  var c = p.c, cp = c.cp, sq = useState(""), q = sq[0], setQ = sq[1], st = useState(""), tipo = st[0], setTipo = st[1], sn = useState({nome:"", tipo:"FORNECEDOR"}), nd = sn[0], setNd = function(x){ sn[1](Object.assign({}, nd, x)); };
  var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var lista = cp.destinos.filter(function(d){ return d.tipo!=="PRESTADOR" && (!tipo || d.tipo===tipo) && (!q || norm(d.nome).indexOf(norm(q))>=0); });
  var ed = function(d, patch){ acao(c, "destino_set", {id:d.id, patch:patch}); };
  return e("div",{className:"flex flex-col gap-3"},
    e(BlocoFiltros,{titulo:"Destinos", onLimpar:(q || tipo) ? function(){ setQ(""); setTipo(""); } : null},
      e(CampoSel,{t:"Tipo", id:"cd-t", value:tipo, onChange:setTipo, opcoes:[["", "Todos"]].concat(Object.keys(TIPOS_DESTINO).filter(function(t){ return t!=="PRESTADOR"; }).map(function(t){ return [t, tipoNome(t)]; }))}),
      e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Buscar", id:"cd-q"}), e("input",{id:"cd-q", type:"search", value:q, onChange:function(ev){ setQ(ev.target.value); }, placeholder:"Nome do destino", className:CAMPO}))),
    c.edita && e(BlocoFiltros,{titulo:"Novo destino"},
      e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Nome", id:"cd-n"}), e("input",{id:"cd-n", type:"text", value:nd.nome, onChange:function(ev){ setNd({nome:ev.target.value}); }, className:CAMPO})),
      e(CampoSel,{t:"Tipo", id:"cd-nt", value:nd.tipo, onChange:function(v){ setNd({tipo:v}); }, opcoes:Object.keys(TIPOS_DESTINO).map(function(t){ return [t, tipoNome(t)]; })}),
      e("div",{className:"flex items-end"}, e(Botao,{principal:true, desabilitado:!nd.nome.trim(), onClick:function(){ acao(c, "destino_add", {nome:nd.nome.trim(), tipo:nd.tipo, banco:"", chavePix:""}); setNd({nome:""}); }}, "Adicionar"))),
    lista.length ? e(TabelaP,{minW:480, cols:[{t:"Destino"},{t:"Tipo", w:200},{t:"Ativo", w:90}]},
      lista.map(function(d){ return e(Tr,{key:d.id, apagado:!d.ativo}, e(Td,{forte:true}, d.nome), e(Td,null, tipoNome(d.tipo)),
        e("td",{className:"h-8 border-b border-border px-2.5"}, e("input",{type:"checkbox", checked:!!d.ativo, disabled:!c.edita, "aria-label":"Ativo: "+d.nome, className:"h-4 w-4 cursor-pointer accent-[#d4af37]", onChange:function(ev){ ed(d, {ativo:ev.target.checked}); }}))); }))
    : e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Nenhum destino neste filtro."));
}

var ABAS = [["orient","Orientações"],["atend","Atendimento"],["dest","Destinos"]];
function AbaControlePagamentos(){
  var c = useCP(), cp = c.cp, hoje = hojeIsoCp(), sa = useState("orient"), aba = sa[0], setAba = sa[1];
  var abertas = cp.orientacoes.filter(function(o){ return o.status==="aberta"; });
  var falta = abertas.reduce(function(t, o){ return t+faltaDe(o); }, 0), atras = abertas.filter(function(o){ return o.ate && o.ate<hoje && faltaDe(o)>0; });
  var hojeDir = cp.orientacoes.reduce(function(t, o){ return t+o.lanc.filter(function(x){ return x.data===hoje; }).reduce(function(u, x){ return u+x.valor; }, 0); }, 0);
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex h-10 items-center justify-between gap-2"}, e("h1",{className:"truncate text-[16px] font-semibold text-foreground"}, "Pagamentos"), e(Botao,{onClick:function(){ c.d({type:"ABA", aba:"chavespix"}); }, title:"Regras que direcionam cada Pix"}, "Regras do Pix")),
    e(FaixaTotais,{itens:[{t:"Falta direcionar", v:BKC(falta)},{t:"Atrasadas", v:int(atras.length), cor:atras.length ? "text-warning" : ""},{t:"Direcionado hoje", v:BKC(hojeDir)},{t:"Destinos ativos", v:int(cp.destinos.filter(function(d){ return d.ativo; }).length)}]}),
    e(AbasTela,{abas:ABAS, atual:aba, onMudar:setAba}),
    aba==="orient" ? e(AbaOrient,{c:c}) : aba==="atend" ? e(PagamentosAConferir,{simples:true}) : e(AbaDestinos,{c:c}));
}

export { AbaControlePagamentos };
