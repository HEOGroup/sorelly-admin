// Sorelly Admin · montagem — pages/Pontual.js
// PONTUAL (06/11/2026, pedido do Marcus): admin da Pontual, empresa de banho do Valdir, dentro do admin da Sorelly. Tudo é DEMONSTRAÇÃO (250 clientes inventados, ver domain/pontual.js).
// Telas: Clientes (lista + ficha), Tabelas de preço (inicial e por cliente), Inadimplência, Pós-venda (cliente sem banhar) e Regras.
// Visual: layout D das tabelas (TabelaCampos), filtros no topo, sem faixa de totais. A ficha do cliente abre numa Janela em colunas: dados, banho e cobrança, tabela de preço, negociação.
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Botao, BlocoFiltros, CAMPO, CampoBusca, CampoSel, FileiraCampos, Segmentado, TabelaCampos, Tile, brl } from "@/apps/montagem/components/padrao-fin";
import { CORTES, DIAS_RISCO, DIAS_SEM, SERVICOS, STATUS_COB, STATUS_POS, dataBr, mensagemPos, rotulosMeses, usePontual } from "@/apps/montagem/domain/pontual";
import { e, useMemo, useState } from "@/shared/react";

var TOPO = "-mt-4 gap-2";
var VERDE = "#4ADE80", AMARELO = "#FBBF24", VERMELHO = "#EF4444";
var CORSIT = {"Em dia":VERDE, "Em risco":AMARELO, "Sem banhar":VERMELHO};
var norm = function(t){ return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var pct = function(v){ return (v > 0 ? "+" : "") + v.toFixed(1).replace(".", ",") + "%"; };
var OPC_CLASSE = [["", "Todas"], ["Grande", "Grande"], ["Médio", "Médio"], ["Pequeno", "Pequeno"]];
var opcoes = function(l){ return l.map(function(x){ return e("option", {key:x, value:x}, x); }); };

function Cabeca(p){
  return e("div", {className:"flex items-center gap-2"},
    e("img", {src:"/pontual-marca.svg", alt:"Pontual", className:"size-8"}),
    e("h1", {className:"font-heading text-xl font-semibold leading-none"}, p.t));
}
function Titulo(p){ return e("h3", {className:"text-center text-[11px] font-semibold uppercase tracking-[.05em] text-foreground"}, p.t); }

// campo de preço: grava ao sair do campo; aceita "2,40" ou "2.40"
function CampoPreco(p){
  var txt = function(v){ return "R$ " + v.toFixed(2).replace(".", ","); };
  return e("input", {key:p.chave + "|" + p.valor, defaultValue:txt(p.valor), inputMode:"decimal", "aria-label":p.rotulo, className:CAMPO + " text-center tabular-nums", style:{width:p.largura || "6rem"},
    onBlur:function(ev){ var n = parseFloat(ev.target.value.replace(/[^\d,.]/g, "").replace(",", ".")); if(n > 0) p.grava(Math.round(n * 100) / 100); else ev.target.value = txt(p.valor); }});
}

// ficha do cliente (Janela em colunas)
function Ficha(p){
  var c = p.c, a = p.acoes, ini = p.inicial, meses = rotulosMeses(), ind = c.modo === "Individual";
  var dados = e("section", {key:"dados", className:"flex flex-col gap-1.5"}, e(Titulo, {t:"Dados"}),
    e(Tile, {tit:"Código"}, c.id), e(Tile, {tit:"Contato"}, c.contato), e(Tile, {tit:"Telefone"}, c.fone), e(Tile, {tit:"Cidade"}, c.cidade),
    e(Tile, {tit:"Cliente desde"}, String(c.desde)), e(Tile, {tit:"Pagamento"}, c.cond), e(Tile, {tit:"Classe"}, c.classe), e(Tile, {tit:"Média mensal"}, brl(c.media)));
  var banho = e("section", {key:"banho", className:"flex flex-col gap-1.5"}, e(Titulo, {t:"Banho e cobrança"}),
    e(Tile, {tit:"Último banho"}, dataBr(c.dias) + " (" + c.dias + " dias)"),
    e(Tile, {tit:"Situação"}, e("b", {style:{color:CORSIT[c.situacao]}}, c.situacao)),
    e(Tile, {tit:"Ciclo normal"}, c.ciclo + " dias"),
    e(Tile, {tit:"A vencer"}, brl(c.aVencer)),
    e(Tile, {tit:"Vencido"}, e("b", {style:c.vencido > 0 ? {color:VERMELHO} : undefined}, brl(c.vencido))),
    e(Tile, {tit:"Maior atraso"}, c.maiorAtraso + " dias"),
    e(Titulo, {t:"Últimos 6 meses"}),
    e(TabelaCampos, {cols:[{t:"Mês", w:"50%"}, {t:"Banhado"}]},
      meses.map(function(m, i){ return e(FileiraCampos, {key:m, cells:[m, brl(c.meses[i])]}); }),
      e(FileiraCampos, {total:true, cells:["Média", brl(c.media)]})));
  var preco = e("section", {key:"preco", className:"flex flex-col gap-1.5"}, e(Titulo, {t:"Tabela de preço"}),
    e("div", {className:"flex justify-center"}, e(Segmentado, {opcoes:[["Inicial", "Inicial"], ["Individual", "Individual"]], atual:c.modo, onMudar:function(v){ a.setModo(c.id, v); }})),
    e(TabelaCampos, {cols:[{t:"Serviço", w:"38%"}, {t:"Inicial", w:"30%"}, {t:"Cliente"}]},
      SERVICOS.map(function(sv){
        var v = c.precos[sv.id];
        return e(FileiraCampos, {key:sv.id, cells:[sv.nome, brl(ini[sv.id]), ind ? e(CampoPreco, {chave:c.id + sv.id, valor:v, rotulo:"Preço de " + sv.nome, grava:function(n){ a.setPreco(c.id, sv.id, n); }, largura:"5rem"}) : brl(v)]});
      })),
    e("p", {className:"text-center text-[13px]"}, ind ? "Preços próprios deste cliente, por grama banhada." : "Este cliente usa a tabela inicial. Mude para Individual para dar preço próprio."));
  var nego = e("section", {key:"nego", className:"flex flex-col gap-1.5"}, e(Titulo, {t:"Negociação particular"}),
    e("textarea", {key:c.id, rows:7, defaultValue:c.nota, placeholder:"Escreva o acordo combinado com este cliente", "aria-label":"Negociação particular",
      onBlur:function(ev){ a.setNota(c.id, ev.target.value); }, className:"w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}),
    e("p", {className:"text-center text-[13px]"}, "O texto grava sozinho ao sair do campo."));
  return e(Janela, {t:c.nome, sub:c.id + " · " + c.cidade, fechar:p.fechar, colunas:[dados, banho, preco, nego]});
}

// Segmentado com contagem + filtros comuns: devolve os dois campos de classe/busca
function Filtros(p){
  var f = p.f;
  return e(BlocoFiltros, {onLimpar:p.limpar},
    e(CampoBusca, {id:p.id + "-q", value:f.q, placeholder:"Nome, código, cidade ou contato", onChange:function(v){ p.set("q", v); }}),
    e(CampoSel, {id:p.id + "-classe", t:"Classe", value:f.classe, opcoes:OPC_CLASSE, onChange:function(v){ p.set("classe", v); }}),
    p.extra);
}
function useFiltros(inicial){
  var s = useState(inicial), f = s[0], setF = s[1];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; setF(n); };
  return [f, set, function(){ setF(inicial); }];
}
var casa = function(c, f){ var q = norm(f.q); return (!q || norm(c.nome + " " + c.id + " " + c.cidade + " " + c.contato).indexOf(q) >= 0) && (!f.classe || c.classe === f.classe); };

// ── Clientes ──
function AbaPontualClientes(){
  var P = usePontual(), ff = useFiltros({q:"", classe:"", tab:"", sit:""}), f = ff[0], sel = useState(""), id = sel[0], setId = sel[1];
  var lista = useMemo(function(){
    return P.clientes.filter(function(c){ return casa(c, f) && (!f.tab || c.modo === f.tab) && (!f.sit || (f.sit === "Vencido" ? c.vencido > 0 : c.situacao === f.sit)); })
      .sort(function(a, b){ return b.media - a.media; });
  }, [P, f]);
  var aberto = id ? P.clientes.filter(function(c){ return c.id === id; })[0] : null;
  return e(Pagina, {className:TOPO}, e(Cabeca, {t:"Clientes"}),
    e(Filtros, {id:"pc", f:f, set:ff[1], limpar:ff[2], extra:[
      e(CampoSel, {key:"tab", id:"pc-tab", t:"Tabela de preço", value:f.tab, opcoes:[["", "Todas"], ["Inicial", "Inicial"], ["Individual", "Individual"]], onChange:function(v){ ff[1]("tab", v); }}),
      e(CampoSel, {key:"sit", id:"pc-sit", t:"Situação", value:f.sit, opcoes:[["", "Todas"], ["Em dia", "Em dia"], ["Em risco", "Em risco"], ["Sem banhar", "Sem banhar"], ["Vencido", "Com valor vencido"]], onChange:function(v){ ff[1]("sit", v); }})]}),
    e(TabelaCampos, {cols:[{t:"Código", w:"6%"}, {t:"Cliente", w:"19%"}, {t:"Cidade", w:"15%"}, {t:"Classe", w:"7%"}, {t:"Média mensal", w:"11%"}, {t:"Último banho", w:"10%"}, {t:"Dias sem banhar", w:"9%"}, {t:"Vencido", w:"11%"}, {t:"Tabela", w:"7%"}, {t:"Situação"}], minW:"84rem"},
      lista.map(function(c){
        return e(FileiraCampos, {key:c.id, onClick:function(){ setId(c.id); }, title:"Abrir a ficha de " + c.nome,
          cells:[c.id, c.nome, c.cidade, c.classe, brl(c.media), dataBr(c.dias), String(c.dias), {v:c.vencido > 0 ? brl(c.vencido) : "—", cor:c.vencido > 0 ? VERMELHO : undefined}, c.modo, {v:c.situacao, cor:CORSIT[c.situacao]}]});
      })),
    e("p", {className:"text-center text-[13px]"}, "Mostrando " + lista.length + " de " + P.clientes.length + " clientes. Dados de demonstração (clientes e preços inventados). Clique numa linha para abrir a ficha."),
    aberto && e(Ficha, {c:aberto, acoes:P.acoes, inicial:P.inicial, fechar:function(){ setId(""); }}));
}

// ── Tabelas de preço ──
function AbaPontualPrecos(){
  var P = usePontual(), s = useState("inicial"), aba = s[0], setAba = s[1], ff = useFiltros({q:"", classe:""}), f = ff[0], sel = useState(""), id = sel[0], setId = sel[1];
  var inds = useMemo(function(){ return P.clientes.filter(function(c){ return c.modo === "Individual"; }); }, [P]);
  var lista = useMemo(function(){ return inds.filter(function(c){ return casa(c, f); }).sort(function(a, b){ return b.desconto - a.desconto; }); }, [inds, f]);
  var aberto = id ? P.clientes.filter(function(c){ return c.id === id; })[0] : null;
  var cabPreco = SERVICOS.map(function(sv){ return {t:sv.nome, w:"9%"}; });
  return e(Pagina, {className:TOPO}, e(Cabeca, {t:"Tabelas de preço"}),
    e(AbasTela, {abas:[["inicial", "Tabela inicial"], ["clientes", "Por cliente"]], atual:aba, onMudar:setAba}),
    aba === "inicial" ? e("div", {className:"flex flex-col gap-2"},
      e(TabelaCampos, {cols:[{t:"Serviço", w:"22%"}, {t:"Unidade", w:"16%"}, {t:"Preço inicial", w:"20%"}, {t:"Menor preço individual", w:"22%"}, {t:"Maior desconto"}], minW:"46rem"},
        SERVICOS.map(function(sv){
          var ini = P.inicial[sv.id], menor = inds.reduce(function(m, c){ return Math.min(m, c.precos[sv.id]); }, ini);
          return e(FileiraCampos, {key:sv.id, cells:[sv.nome, "Por grama", e(CampoPreco, {chave:"i" + sv.id, valor:ini, rotulo:"Preço inicial de " + sv.nome, grava:function(n){ P.acoes.setInicial(sv.id, n); }}), brl(menor), pct((menor / ini - 1) * 100)]});
        })),
      e("p", {className:"text-center text-[13px]"}, (P.clientes.length - inds.length) + " clientes usam a tabela inicial e " + inds.length + " têm tabela individual. Cliente novo começa na tabela inicial. Mudar um preço aqui não muda a tabela individual."))
    : e("div", {className:"flex flex-col gap-2"},
      e(Filtros, {id:"pp", f:f, set:ff[1], limpar:ff[2]}),
      e(TabelaCampos, {cols:[{t:"Cliente", w:"17%"}, {t:"Classe", w:"7%"}].concat(cabPreco, [{t:"Desconto médio", w:"9%"}, {t:"Pagamento"}]), minW:"84rem"},
        lista.map(function(c){
          return e(FileiraCampos, {key:c.id, onClick:function(){ setId(c.id); }, title:"Abrir a ficha de " + c.nome,
            cells:[c.nome, c.classe].concat(SERVICOS.map(function(sv){ return brl(c.precos[sv.id]); }), [pct(-c.desconto), c.cond])});
        })),
      e("p", {className:"text-center text-[13px]"}, "Mostrando " + lista.length + " de " + inds.length + " clientes com tabela individual. Preço por grama banhada. Clique numa linha para ajustar os preços e a negociação.")),
    aberto && e(Ficha, {c:aberto, acoes:P.acoes, inicial:P.inicial, fechar:function(){ setId(""); }}));
}

// ── Inadimplência ──
var FAIXAS = {"":[0, 9999], "15":[1, 15], "30":[16, 30], "60":[31, 60], "61":[61, 9999]};
function AbaPontualInadimplencia(){
  var P = usePontual(), ff = useFiltros({q:"", classe:"", faixa:""}), f = ff[0], sel = useState(""), id = sel[0], setId = sel[1];
  var lista = useMemo(function(){
    var fx = FAIXAS[f.faixa];
    return P.clientes.filter(function(c){ return c.vencido > 0 && casa(c, f) && c.maiorAtraso >= fx[0] && c.maiorAtraso <= fx[1]; }).sort(function(a, b){ return b.vencido - a.vencido; });
  }, [P, f]);
  var tv = lista.reduce(function(t, c){ return t + c.vencido; }, 0), tav = lista.reduce(function(t, c){ return t + c.aVencer; }, 0), tt = lista.reduce(function(t, c){ return t + c.titulos; }, 0);
  var aberto = id ? P.clientes.filter(function(c){ return c.id === id; })[0] : null;
  return e(Pagina, {className:TOPO}, e(Cabeca, {t:"Inadimplência"}),
    e(Filtros, {id:"pi", f:f, set:ff[1], limpar:ff[2], extra:e(CampoSel, {key:"faixa", id:"pi-faixa", t:"Maior atraso", value:f.faixa, opcoes:[["", "Todos"], ["15", "Até 15 dias"], ["30", "16 a 30 dias"], ["60", "31 a 60 dias"], ["61", "Mais de 60 dias"]], onChange:function(v){ ff[1]("faixa", v); }})}),
    e(TabelaCampos, {cols:[{t:"Cliente", w:"19%"}, {t:"Classe", w:"8%"}, {t:"Vencido", w:"12%"}, {t:"A vencer", w:"12%"}, {t:"Maior atraso", w:"11%"}, {t:"Títulos", w:"7%"}, {t:"Pagamento", w:"10%"}, {t:"Cobrança"}], minW:"70rem"},
      lista.map(function(c){
        return e(FileiraCampos, {key:c.id, cells:[e("button", {type:"button", onClick:function(){ setId(c.id); }, title:"Abrir a ficha de " + c.nome, className:"hover:underline"}, c.nome), c.classe,
          {v:brl(c.vencido), cor:VERMELHO}, brl(c.aVencer), {v:c.maiorAtraso + " dias", cor:c.maiorAtraso > 60 ? VERMELHO : c.maiorAtraso > 15 ? AMARELO : undefined}, String(c.titulos), c.cond,
          e("select", {value:c.cob, "aria-label":"Cobrança de " + c.nome, onChange:function(ev){ P.acoes.setCob(c.id, ev.target.value); }, className:CAMPO, style:{width:"10rem"}}, opcoes(STATUS_COB))]});
      }),
      e(FileiraCampos, {total:true, cells:["Total", String(lista.length) + " clientes", {v:brl(tv), cor:VERMELHO}, brl(tav), "", String(tt), "", ""]})),
    e("p", {className:"text-center text-[13px]"}, "A lista começa pelo maior valor vencido. Dados de demonstração."),
    aberto && e(Ficha, {c:aberto, acoes:P.acoes, inicial:P.inicial, fechar:function(){ setId(""); }}));
}

// ── Pós-venda: cliente sem banhar ──
var FINAL = ["Voltou", "Perdido"];
function AbaPontualPosVenda(){
  var P = usePontual(), sv = useState("sem"), vis = sv[0], setVis = sv[1], ff = useFiltros({q:"", classe:""}), f = ff[0], sc = useState(""), cop = sc[0], setCop = sc[1], sel = useState(""), id = sel[0], setId = sel[1];
  var grupos = useMemo(function(){
    var g = {sem:[], risco:[], feitos:[]};
    P.clientes.forEach(function(c){
      if(!casa(c, f)) return;
      if(FINAL.indexOf(c.pos) >= 0) g.feitos.push(c);
      else if(c.dias >= DIAS_SEM) g.sem.push(c);
      else if(c.dias >= DIAS_RISCO) g.risco.push(c);
    });
    Object.keys(g).forEach(function(k){ g[k].sort(function(a, b){ return b.media - a.media; }); });
    return g;
  }, [P, f]);
  var copia = function(c){
    var ok = function(){ setCop(c.id); }, falha = function(){ setCop(""); };
    try{ navigator.clipboard.writeText(mensagemPos(c)).then(ok, falha); }catch(x){ falha(); }
  };
  var lista = grupos[vis], aberto = id ? P.clientes.filter(function(c){ return c.id === id; })[0] : null;
  return e(Pagina, {className:TOPO}, e(Cabeca, {t:"Pós-venda"}),
    e(Filtros, {id:"pv", f:f, set:ff[1], limpar:ff[2], extra:e("div", {key:"vis", className:"col-span-2 flex flex-col"}, e("span", {className:"mb-0.5 block h-4 text-[11px] font-medium uppercase tracking-[.05em] text-foreground"}, "Visão"),
      e("div", null, e(Segmentado, {opcoes:[["sem", "Sem banhar · " + grupos.sem.length], ["risco", "Em risco · " + grupos.risco.length], ["feitos", "Concluídos · " + grupos.feitos.length]], atual:vis, onMudar:setVis})))}),
    e(TabelaCampos, {cols:[{t:"Cliente", w:"17%"}, {t:"Classe", w:"7%"}, {t:"Contato", w:"13%"}, {t:"Telefone", w:"11%"}, {t:"Último banho", w:"9%"}, {t:"Dias sem banhar", w:"9%"}, {t:"Ciclo normal", w:"8%"}, {t:"Média mensal", w:"10%"}, {t:"Status", w:"11%"}, {t:"Mensagem"}], minW:"84rem"},
      lista.map(function(c){
        return e(FileiraCampos, {key:c.id, cells:[e("button", {type:"button", onClick:function(){ setId(c.id); }, title:"Abrir a ficha de " + c.nome, className:"hover:underline"}, c.nome), c.classe, c.contato, c.fone, dataBr(c.dias), {v:String(c.dias), cor:CORSIT[c.situacao]}, c.ciclo + " dias", brl(c.media),
          e("select", {value:c.pos, "aria-label":"Status de " + c.nome, onChange:function(ev){ P.acoes.setPos(c.id, ev.target.value); }, className:CAMPO, style:{width:"8.5rem"}}, opcoes(STATUS_POS)),
          e(Botao, {onClick:function(){ copia(c); }}, cop === c.id ? "Copiado" : "Copiar")]});
      })),
    e("p", {className:"text-center text-[13px]"}, "Sem banhar = " + DIAS_SEM + " dias ou mais. Em risco = de " + DIAS_RISCO + " a " + (DIAS_SEM - 1) + " dias. Os maiores clientes aparecem primeiro. Dados de demonstração."),
    aberto && e(Ficha, {c:aberto, acoes:P.acoes, inicial:P.inicial, fechar:function(){ setId(""); }}));
}

// ── Regras ──
function AbaPontualRegras(){
  var linhas = [
    ["Classe do cliente", "Média do valor banhado por mês, nos últimos 6 meses"],
    ["Grande", "A partir de " + brl(CORTES.grande) + " por mês"],
    ["Médio", "De " + brl(CORTES.medio) + " a " + brl(CORTES.grande - 0.01) + " por mês"],
    ["Pequeno", "Abaixo de " + brl(CORTES.medio) + " por mês"],
    ["Em risco", DIAS_RISCO + " dias sem banhar"],
    ["Pós-venda", DIAS_SEM + " dias sem banhar: o cliente entra na lista de contato"],
    ["Tabela inicial", "Todo cliente novo começa nela"],
    ["Tabela individual", "Preço combinado com o cliente; vale no lugar da inicial"],
    ["Inadimplência", "Cliente com título vencido; a lista começa pelo maior valor"]
  ];
  return e(Pagina, {className:TOPO}, e(Cabeca, {t:"Regras"}),
    e(TabelaCampos, {cols:[{t:"Regra", w:"22%"}, {t:"Vale"}], minW:"46rem"}, linhas.map(function(l){ return e(FileiraCampos, {key:l[0], cells:l}); })),
    e("p", {className:"text-center text-[13px]"}, "Os cortes são de teste: o Valdir define os valores finais. Todos os clientes e preços são inventados."));
}

export { AbaPontualClientes, AbaPontualPrecos, AbaPontualInadimplencia, AbaPontualPosVenda, AbaPontualRegras };
