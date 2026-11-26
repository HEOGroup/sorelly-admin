// Sorelly Admin · montagem — pages/compras/CompraConfig.js
// Materiais & Estoque → "Configurações": alçadas e prazos de Compras, regras do estoque, abas do estoque, classificações ("entra no estoque?"), motivos de negativa, texto de regras,
// aprovadores e acesso ao estoque por pessoa. Regras no domínio (config_set, regras_set, motivo_*, acesso_set); aqui só se desenha.
// PADRÃO AZUL (Marcus, 17/11/2026: "refaz cadastros e configurações no mesmo padrão"): uma barra azul no topo e duas colunas de blocos azuis (BlocoPainel). Cada bloco é uma lista de linhas
// "nome do campo à esquerda, campo à direita", todas iguais (13 px, campo de 32 px). Sem pílulas: motivos, aprovadores e acessos são linhas com o botão Remover.
// GRADE DE FAIXAS, a mesma regra TRAVADA da Visão geral (Marcus, 17/11/2026: "aba de configurações sem nenhum padrão, acabei de falar da padronização"): os blocos da mesma faixa têm a mesma
// altura e as bordas alinhadas (constante FAIXA), a faixa é largura inteira ou duas metades iguais, o botão Salvar fica sempre na borda de baixo do bloco. Nada de colunas empilhadas com alturas soltas.
import { Dinheiro, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { CAPS_ESTOQUE, ROTULO_CAP_ESTOQUE, ROTULO_UNIDADE, UNIDADES, padronizarFornecedor, padronizarUnidade, textoOrcamentos } from "@/apps/montagem/domain/compras-estoque";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { EQUIPE } from "@/apps/montagem/domain/equipe";
import { Bt } from "@/apps/montagem/pages/compras/pecas";
import { useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
var CAMPO_LARGO = CAMPO+" w-48 text-center";   // o mesmo campo em todos os blocos
var pessoaDe = function(id){ var p = EQUIPE.filter(function(z){ return String(z.id)===String(id); })[0]; return p ? p.nome : String(id); };

var FAIXA = "flex min-w-0 [&>section]:min-w-0 [&>section]:flex-1";   // o bloco estica até a altura da faixa: bordas de cima e de baixo alinhadas com o vizinho
// bloco azul com o corpo em linhas; o corpo ocupa a altura toda e o rodapé (Salvar) fica na borda de baixo
function Bloco(p){ return e("div",{className:FAIXA}, e(BlocoPainel,{titulo:p.t, compacto:true, dir:p.dir}, e("div",{className:"flex min-h-0 flex-1 flex-col gap-1.5 p-2 text-[13px]"}, p.children))); }
// uma linha: nome à esquerda, o que se preenche à direita; a dica vai embaixo em 11 px
function Linha(p){
  return e("div",{className:"flex flex-col gap-0.5 border-b border-white/10 pb-1.5 last:border-b-0 last:pb-0"},
    e("div",{className:"flex items-center justify-between gap-3"}, e("span",{className:"text-left"}, p.rot), e("div",{className:"flex shrink-0 items-center justify-end gap-1.5"}, p.children)),
    p.dica && e("span",{className:"text-left text-[11px]"}, p.dica));
}
function Rodape(p){ return e("div",{className:"mt-auto flex flex-wrap justify-end gap-1.5 pt-0.5"}, p.children); }

// bloco de campos simples com rascunho e botão Salvar. campos = [{k, rot, tipo:"dinheiro"|"num"|"texto"|"bool"|"dias", dica}]
function BlocoForm(p){
  var st = useState(function(){ var o = {}; p.campos.forEach(function(c){ o[c.k] = p.cfg[c.k]; }); return o; }), v = st[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var salvar = function(){ var d = {}; p.campos.forEach(function(c){ d[c.k] = c.tipo==="num" ? Number(v[c.k]) : v[c.k]; }); p.x.exec("config_set", d); };
  return e(Bloco,{t:p.t},
    p.campos.map(function(c){
      var dica = typeof c.dica==="function" ? c.dica(v) : c.dica;
      if(c.tipo==="bool") return e(Linha,{key:c.k, rot:c.rot, dica:dica}, e("input",{type:"checkbox", className:"size-4 cursor-pointer", checked:!!v[c.k], disabled:!p.ok, "aria-label":c.rot, onChange:function(ev){ set(c.k, ev.target.checked); }}));
      if(c.tipo==="dias") return e(Linha,{key:c.k, rot:c.rot, dica:dica}, DIAS.map(function(d, i){ var on = (v[c.k]||[]).indexOf(i)>=0;
        return e("button",{key:i, type:"button", "aria-pressed":on, disabled:!p.ok, onClick:function(){ set(c.k, on ? v[c.k].filter(function(z){ return z!==i; }) : (v[c.k]||[]).concat([i]).sort()); }, className:"h-8 w-11 rounded-md border text-[13px] font-semibold disabled:opacity-40 "+(on ? "border-white/60 bg-[var(--bloco-titulo)]" : "border-white/20 hover:bg-white/10")}, d); }));
      return e(Linha,{key:c.k, rot:c.rot, dica:dica}, c.tipo==="dinheiro" ? e("div",{className:"w-48 [&_input]:!h-8 [&_input]:!text-[13px]"}, e(Dinheiro,{value:v[c.k], label:c.rot, disabled:!p.ok, onChange:function(x){ set(c.k, x); }}))
        : e("input",{type:c.tipo==="num" ? "number" : "text", step:c.tipo==="num" ? 1 : undefined, min:c.tipo==="num" ? 0 : undefined, disabled:!p.ok, "aria-label":c.rot, value:v[c.k]==null ? "" : v[c.k], onChange:function(ev){ set(c.k, ev.target.value); }, className:CAMPO_LARGO}));
    }),
    e(Rodape,null, e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!p.ok, semAut:true, onClick:salvar}, "Salvar")));
}

// lista editável (abas do estoque e classificações): rascunho com nome + extra, linhas novas e remoção; Salvar manda a lista toda
function BlocoLista(p){
  var st = useState(function(){ return JSON.parse(JSON.stringify(p.itens)); }), l = st[0];
  var troca = function(i, k, x){ st[1](function(o){ var n = JSON.parse(JSON.stringify(o)); n[i][k] = x; return n; }); };
  return e(Bloco,{t:p.t, dir:l.length},
    p.dica && e("p",{className:"text-left text-[11px]"}, p.dica),
    l.length ? l.map(function(it, i){ return e("div",{key:i, className:"flex items-center gap-1.5 border-b border-white/10 pb-1.5 last:border-b-0"},
      e("input",{type:"text", value:it.nome, placeholder:"Nome", "aria-label":"Nome", disabled:!p.ok, onChange:function(ev){ troca(i, "nome", ev.target.value); }, className:CAMPO+" min-w-0 flex-1 text-center"}),
      p.extra(it, i, troca), e(Bt,{disabled:!p.ok, semAut:true, tipo:"perigo", titulo:"Remover", onClick:function(){ st[1](l.filter(function(z, j){ return j!==i; })); }}, "Remover")); })
      : e("p",{className:"py-1 text-center"}, "Nenhum item cadastrado."),
    e(Rodape,null, e(Bt,{ic:"plus", disabled:!p.ok, semAut:true, onClick:function(){ st[1](l.concat([p.novo()])); }}, p.novoRot), e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!p.ok, semAut:true, onClick:function(){ p.salvar(l); }}, "Salvar")));
}

// linha de uma lista de pessoas ou motivos: texto à esquerda e Remover à direita
function LinhaRemover(p){
  return e("div",{className:"flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 last:border-b-0"}, e("span",{className:"text-left font-semibold"}, p.t), e("div",{className:"flex items-center gap-2"}, p.meio, e(Bt,{tipo:"perigo", disabled:!p.ok, semAut:true, onClick:p.onClick, titulo:"Remover "+p.t}, "Remover")));
}

function AbaCompraConfig(){
  var x = useCe(), ce = x.ce, cfg = x.cfg, ok = x.cadastros;
  var sMot = useState(""), sReg = useState(ce.regras||""), sAp = useState(""), sAc = useState("");
  var key = function(o){ return JSON.stringify(o); };
  var aprovadores = cfg.aprovadores||[], acessos = ce.acessos.estoque||{}, chavesAc = Object.keys(acessos);
  var pessoas = EQUIPE.slice().sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var adicionar = function(valor, aoMudar, rot, opcoes, aoAdicionar){
    return e("div",{className:"flex items-center gap-1.5 pt-0.5"},
      e("select",{value:valor, "aria-label":rot, disabled:!ok, onChange:function(ev){ aoMudar(ev.target.value); }, className:CAMPO+" min-w-0 flex-1 cursor-pointer text-center"}, [e("option",{key:"", value:""}, "Adicionar pessoa")].concat(opcoes.map(function(p){ return e("option",{key:p.id, value:String(p.id)}, p.nome); }))),
      e(Bt,{tipo:"forte", ic:"plus", disabled:!ok || !valor, semAut:true, onClick:aoAdicionar}, "Adicionar"));
  };

  var blocoMotivos = e(Bloco,{key:"mot", t:"Motivos de negativa", dir:ce.motivosNegativa.length},
    ce.motivosNegativa.length ? ce.motivosNegativa.map(function(m){ return e(LinhaRemover,{key:m, t:m, ok:ok, onClick:function(){ x.exec("motivo_del", {nome:m}); }}); }) : e("p",{className:"py-1 text-center"}, "Nenhum motivo cadastrado."),
    e("div",{className:"flex items-center gap-1.5 pt-0.5"}, e("input",{type:"text", value:sMot[0], placeholder:"Novo motivo", "aria-label":"Novo motivo de negativa", disabled:!ok, onChange:function(ev){ sMot[1](ev.target.value); }, className:CAMPO+" min-w-0 flex-1 text-center"}),
      e(Bt,{tipo:"forte", ic:"plus", disabled:!ok || !sMot[0].trim(), semAut:true, onClick:function(){ if(x.exec("motivo_add", {nome:sMot[0]})) sMot[1](""); }}, "Adicionar")));

  var blocoRegras = e(Bloco,{key:"reg", t:"Regras de compras e estoque"},
    e("textarea",{value:sReg[0], rows:7, disabled:!ok, placeholder:"Texto das regras exibido a quem solicita compras e movimenta o estoque", "aria-label":"Texto das regras", onChange:function(ev){ sReg[1](ev.target.value); }, className:"min-h-28 w-full flex-1 resize-none rounded-md border border-border bg-card px-2.5 py-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}),
    e(Rodape,null, e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!ok, semAut:true, onClick:function(){ x.exec("regras_set", {texto:sReg[0]}); }}, "Salvar regras")));

  var blocoAprov = e(Bloco,{key:"apr", t:"Aprovadores de compras", dir:aprovadores.length || undefined},
    aprovadores.length ? aprovadores.map(function(id){ return e(LinhaRemover,{key:id, t:pessoaDe(id), ok:ok, onClick:function(){ x.exec("config_set", {aprovadores:aprovadores.filter(function(z){ return String(z)!==String(id); })}); }}); }) : e("p",{className:"py-1 text-center"}, "Nenhum aprovador definido. Vale a autorização Aprovar compras."),
    adicionar(sAp[0], sAp[1], "Pessoa para aprovadora", pessoas.filter(function(p){ return aprovadores.map(String).indexOf(String(p.id))<0; }), function(){ if(x.exec("config_set", {aprovadores:aprovadores.concat([Number(sAp[0])])})) sAp[1](""); }),
    e("p",{className:"text-left text-[11px]"}, "Com a lista vazia, decidem as pessoas com a autorização Aprovar compras."));

  var blocoAcesso = e(Bloco,{key:"ace", t:"Acesso ao estoque por pessoa", dir:chavesAc.length || undefined},
    chavesAc.length ? chavesAc.map(function(q){ var caps = acessos[q]||[];
      return e(LinhaRemover,{key:q, t:pessoaDe(q), ok:ok, onClick:function(){ x.exec("acesso_set", {setor:"estoque", quem:q, papeis:[]}); },
        meio:CAPS_ESTOQUE.map(function(c){ var on = caps.indexOf(c)>=0;
          return e("label",{key:c, className:"inline-flex cursor-pointer items-center gap-1 text-[11px]"}, e("input",{type:"checkbox", className:"size-4", checked:on, disabled:!ok, onChange:function(){ x.exec("acesso_set", {setor:"estoque", quem:q, papeis:on ? caps.filter(function(z){ return z!==c; }) : caps.concat([c])}); }}), ROTULO_CAP_ESTOQUE[c]); })}); })
      : e("p",{className:"py-1 text-center"}, "Nenhum acesso individual. A diretoria possui as três permissões."),
    adicionar(sAc[0], sAc[1], "Pessoa com acesso ao estoque", pessoas.filter(function(p){ return chavesAc.indexOf(String(p.id))<0; }), function(){ if(x.exec("acesso_set", {setor:"estoque", quem:sAc[0], papeis:["CONTAGEM"]})) sAc[1](""); }),
    e("p",{className:"text-left text-[11px]"}, "Contagem: contar e movimentar. Compra: cadastrar materiais e pedir compra. Aprovação: decidir compras, estornar e marcar parado."));

  // unidades de medida: a lista padrão e o que está escrito nos materiais hoje (cada jeito de escrever e para onde ele vai)
  var contaUn = ce.materiais.reduce(function(o, m){ var k = String(m.unidade==null ? "" : m.unidade); o[k] = (o[k] || 0)+1; return o; }, {});
  var linhasUn = Object.keys(contaUn).sort(function(a, b){ return contaUn[b]-contaUn[a]; }).map(function(k){ var novo = padronizarUnidade(k); return {id:k, hoje:k || "(vazio)", qtd:String(contaUn[k]), vira:novo || "—", muda:novo!==k ? "Muda" : "Certo"}; });
  var faltam = linhasUn.filter(function(l){ return l.muda==="Muda"; }).reduce(function(t, l){ return t+Number(l.qtd); }, 0);
  var blocoUnidades = e(Bloco,{key:"und", t:"Unidades de medida", dir:UNIDADES.length+" no padrão"},
    e("p",{className:"text-left text-[11px]"}, "Padrão único, escrito inteiro: "+UNIDADES.map(function(u){ return ROTULO_UNIDADE[u]; }).join(", ")+". Quem cadastra escolhe numa lista; o que foi digitado antes (un, UN, UNIDADES, pct, g...) vira o nome padrão."),
    faltam ? e(TabelaPlanilha,{cols:[{k:"hoje", t:"Escrito hoje"}, {k:"qtd", t:"Materiais"}, {k:"vira", t:"Vira"}, {k:"muda", t:"Situação", cor:function(l){ return l.muda==="Muda" ? "text-warning" : "text-success"; }}], linhas:linhasUn.filter(function(l){ return l.muda==="Muda"; }), chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nenhum material cadastrado."}) : e("p",{className:"py-1 text-center text-success"}, "Tudo padronizado: "+linhasUn.map(function(l){ return l.hoje+" ("+l.qtd+")"; }).join(" · ")),
    e(Rodape,null, e(Bt,{tipo:"forte", ic:"check-circle", disabled:!ok || !faltam, semAut:true, titulo:faltam ? "Regrava a unidade de "+faltam+" materiais; o texto antigo fica na linha do tempo de cada um" : "Todas as unidades já estão no padrão", onClick:function(){ x.exec("mat_unidades_padronizar", {}); }}, faltam ? "Padronizar "+faltam+" materiais" : "Tudo padronizado")));

  // fornecedores: cada jeito de escrever que existe hoje (cadastro, materiais e compras), para onde vai e se falta cadastrar
  var contaF = {}, ate = function(txt, campo){ var k = String(txt==null ? "" : txt).replace(/\s+/g, " ").trim(); if(!k) return; contaF[k] = contaF[k] || {cad:0, mat:0, ped:0}; contaF[k][campo]++; };
  ce.fornecedores.forEach(function(f){ ate(f.nome, "cad"); }); ce.materiais.forEach(function(m){ ate(m.fornecedor, "mat"); }); ce.pedidos.forEach(function(p){ ate(p.fornecedorId ? "" : p.fornecedorNome, "ped"); });
  var temCad = function(n){ var k = padronizarFornecedor(n).toLowerCase(); return ce.fornecedores.some(function(f){ return padronizarFornecedor(f.nome).toLowerCase()===k; }); };
  var linhasF = Object.keys(contaF).map(function(k){ var c0 = contaF[k], vira = padronizarFornecedor(k), onde = [c0.cad ? "cadastro" : "", c0.mat ? c0.mat+(c0.mat===1 ? " material" : " materiais") : "", c0.ped ? c0.ped+(c0.ped===1 ? " compra" : " compras") : ""].filter(Boolean).join(" · ");
    return {id:k, hoje:k, onde:onde, vira:vira || "—", sit:vira!==k ? "Muda" : (!temCad(k) ? "Cadastrar" : "Certo")}; }).sort(function(a, b){ return a.vira.localeCompare(b.vira, "pt-BR") || a.hoje.localeCompare(b.hoje, "pt-BR"); });
  var pendF = linhasF.filter(function(l){ return l.sit!=="Certo"; }).length;
  var blocoForn = e(Bloco,{key:"forn", t:"Fornecedores: um nome só", dir:linhasF.length+" nomes"},
    e("p",{className:"text-left text-[11px]"}, "Os nomes parecidos (Office graff, OfficeGraf, Edson - Office Graff...) viram um só. Quem falta no cadastro é cadastrado e cada material e compra fica ligado ao cadastro."),
    pendF ? e(TabelaPlanilha,{cols:[{k:"hoje", t:"Escrito hoje"}, {k:"onde", t:"Onde"}, {k:"vira", t:"Vira"}, {k:"sit", t:"Situação", cor:function(){ return "text-warning"; }}], linhas:linhasF.filter(function(l){ return l.sit!=="Certo"; }), chave:"id", grade:true, semContagem:true, semLimpar:true, limite:300, vazio:"Nenhum fornecedor."}) : e("p",{className:"py-1 text-center text-success"}, "Tudo padronizado: "+linhasF.length+" fornecedores, cada um com um nome só e ligado ao cadastro."),
    e(Rodape,null, e(Bt,{tipo:"forte", ic:"check-circle", disabled:!ok || !pendF, semAut:true, onClick:function(){ x.exec("fornecedores_padronizar", {}); }}, pendF ? "Padronizar "+pendF+(pendF===1 ? " nome" : " nomes") : "Tudo padronizado")));

  var topo = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "Configurações de compras e estoque"),
    e("span",{className:"ml-auto whitespace-nowrap text-[13px]"}, (!ok ? "Somente consulta (alterar exige autorização de Compras ou do estoque) · " : "")+"Quem aprova compras: RH → Acessos e autorizações"));

  var meio = function(){ return Array.prototype.slice.call(arguments); };
  var formAut = e(BlocoForm,{key:"a"+key([cfg.limiteAutorizacao, cfg.autorizacoesNecessarias, cfg.slaHoras]), t:"Autorização de compras", x:x, ok:ok, cfg:cfg, campos:[
    {k:"limiteAutorizacao", rot:"Limite para autorização adicional", tipo:"dinheiro", dica:"Pedidos a partir deste valor exigem autorização extra"}, {k:"autorizacoesNecessarias", rot:"Número de autorizações", tipo:"num"}, {k:"slaHoras", rot:"Prazo de resposta (horas)", tipo:"num", dica:"Após este prazo a solicitação é marcada como atrasada"}]});
  var formOrc = e(BlocoForm,{key:"o"+key([cfg.orcFaixa1Min, cfg.orcFaixa2Min]), t:"Faixas de orçamento", x:x, ok:ok, cfg:cfg, campos:[
    {k:"orcFaixa1Min", rot:"Início da faixa de 2 orçamentos", tipo:"dinheiro"}, {k:"orcFaixa2Min", rot:"Início da faixa de 3 orçamentos", tipo:"dinheiro", dica:function(v){ return textoOrcamentos({orcFaixa1Min:Number(v.orcFaixa1Min)||0, orcFaixa2Min:Number(v.orcFaixa2Min)||0}); }}]});
  var formPag = e(BlocoForm,{key:"p"+key([cfg.toleranciaPlano, cfg.parcelasMax, cfg.opcaoSemNota, cfg.motivoMax, cfg.paginaPedidos, cfg.pularFormaPagamento, cfg.retiradaPor]), t:"Pagamento e registro", x:x, ok:ok, cfg:cfg, campos:[
    {k:"toleranciaPlano", rot:"Tolerância do plano de pagamento", tipo:"dinheiro", dica:"Diferença aceita entre a soma das partes e o total"}, {k:"parcelasMax", rot:"Máximo de parcelas no cartão", tipo:"num"}, {k:"opcaoSemNota", rot:"Texto da opção sem nota fiscal", tipo:"texto"}, {k:"retiradaPor", rot:"Quem retira compras (separe por vírgula)", tipo:"texto", dica:"Aparece em Em transporte como Retirada por"},
    {k:"motivoMax", rot:"Limite de caracteres do motivo", tipo:"num"}, {k:"paginaPedidos", rot:"Compras por página", tipo:"num"}, {k:"pularFormaPagamento", rot:"Dispensar a etapa de conta pagadora", tipo:"bool"}]});
  var formEst = e(BlocoForm,{key:"e"+key([cfg.entradaAoReceber, cfg.bloquearContagemRetroativa, cfg.permitirSaldoNegativo, cfg.atencaoPct, cfg.topConsumo, cfg.diasContagem]), t:"Regras do estoque", x:x, ok:ok, cfg:cfg, campos:[
    {k:"atencaoPct", rot:"Atenção até (% do mínimo)", tipo:"num", dica:"Acima do mínimo e até este percentual, o material fica em atenção"}, {k:"topConsumo", rot:"Itens no ranking de consumo", tipo:"num"}, {k:"diasContagem", rot:"Dias de contagem", tipo:"dias", dica:"Lembrete de contagem periódica"},
    {k:"entradaAoReceber", rot:"Entrada no estoque ao receber a compra", tipo:"bool"}, {k:"bloquearContagemRetroativa", rot:"Bloquear contagem com data anterior à última", tipo:"bool"}, {k:"permitirSaldoNegativo", rot:"Permitir saldo negativo", tipo:"bool"}]});
  var listaAbas = e(BlocoLista,{key:"t"+key(cfg.tipos), t:"Abas do estoque", itens:cfg.tipos, ok:ok, dica:"Uma aba para cada grupo de materiais. O responsável é apenas informativo.", novoRot:"Nova aba", novo:function(){ return {id:"", nome:"", aprovador:""}; },
    extra:function(it, i, troca){ return e("input",{type:"text", value:it.aprovador||"", placeholder:"Responsável pela aprovação", "aria-label":"Responsável pela aprovação", disabled:!ok, onChange:function(ev){ troca(i, "aprovador", ev.target.value); }, className:CAMPO+" min-w-0 flex-1 text-center"}); },
    salvar:function(l){ x.exec("config_set", {tipos:l}); }});
  var listaCls = e(BlocoLista,{key:"c"+key(cfg.classificacoes), t:"Classificações de compra", itens:cfg.classificacoes, ok:ok, dica:"Material e consumo entram no estoque; patrimônio e serviço não.", novoRot:"Nova classificação", novo:function(){ return {id:"", nome:"", entraEstoque:false}; },
    extra:function(it, i, troca){ return e("label",{className:"inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 text-[13px]"}, e("input",{type:"checkbox", className:"size-4", checked:!!it.entraEstoque, disabled:!ok, onChange:function(ev){ troca(i, "entraEstoque", ev.target.checked); }}), "Entra no estoque"); },
    salvar:function(l){ x.exec("config_set", {classificacoes:l}); }});

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"}, formAut, formOrc),
    e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"}, formPag, formEst),
    e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"}, listaAbas, listaCls),
    e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"}, blocoUnidades, blocoForn),
    e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"}, blocoMotivos, e("div",{className:"flex min-w-0 flex-col gap-2 [&>div]:flex-1"}, blocoAprov, blocoAcesso, blocoRegras)));
}

export { AbaCompraConfig };
