// Sorelly Admin · montagem — pages/rh/FichaExperiencia.js
// Ficha de experiência de uma colaboradora (100 pontos). Abre pelo Controle de experiência. Regras em domain/rh-ficha.js; ações "ficha_*" em domain/rh.js.
// O RH lança as ocorrências; gestor e Direção veem; quem é avaliada nunca vê (a tela só existe no admin). Autorizações: rh_ficha_lanca e rh_ficha_nota.
import { Bloco, Botao, CAMPO, CampoSel, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { DECISOES, ORIGENS, ROTULO_REC, ehGestorDe, fichaCfg, fichaDe, resultadoFicha, supervisoresDe } from "@/apps/montagem/domain/rh-ficha";
import { FUNCIONARIOS_POR_SETOR } from "@/apps/montagem/domain/pessoas";
import { br, diasEntre, experienciaLista, hojeIso, ocorrenciasDaPresenca } from "@/apps/montagem/domain/rh";
import { imprimirFicha } from "@/apps/montagem/lib/ficha-impressao";
import { Avatar, Janela, Ph } from "@/apps/montagem/components/chat/chat-ui";
import { idPorNome } from "@/apps/montagem/domain/chat-contatos";
import { e, useState } from "@/shared/react";

// foto da colaboradora (a mesma do perfil no SorellyChat) ao lado do nome; sem foto, as iniciais
// clicar na foto abre um card grande com a foto, o nome e o setor (Esc ou clique fora fecha)
function FotoPessoa(p){
  var op = useState(false), aberta = op[0], setAberta = op[1], cid = idPorNome(p.nome);
  return e("span",{className:"inline-flex"},
    e("button",{type:"button", onClick:function(){ setAberta(true); }, "aria-label":"Ver a foto de "+p.nome, title:"Ver a foto", className:"rounded-full"}, e(Avatar,{id:cid, nome:p.nome, s:p.s || 28})),
    aberta && e(Janela,{titulo:p.nome, fechar:function(){ setAberta(false); }, largura:420},
      e("div",{className:"flex flex-col items-center gap-3 px-6 py-6"}, e(Avatar,{id:cid, nome:p.nome, s:320}), e("b",{className:"text-[13px]"}, p.nome), e("span",{className:"text-[13px]"}, [p.setor, p.funcao].filter(Boolean).join(" · ")))));
}
function Pessoa(p){
  return e("span",{className:"flex items-center justify-start gap-3"}, e(FotoPessoa,{nome:p.nome, setor:p.setor, funcao:p.funcao, s:p.s}), e("span",{className:"text-[13px] "+(p.forte ? "font-semibold" : "")}, p.nome));
}
// botão quadrado de 32 px com ícone (confirmar, descartar, remover); o nome da ação fica no title e no aria-label
function BotaoIcone(p){
  return e("button",{type:"button", onClick:p.onClick, title:p.rotulo, "aria-label":p.rotulo, className:"grid size-8 place-items-center rounded-md border border-border bg-card hover:bg-white/10 "+(p.cls||"")}, e(Ph,{n:p.icone, s:18, fill:true}));
}
// dados da colaboradora que ajudam a decidir: vêm do cadastro do RH, da Presença diária (tudo desde a admissão, confirmado ou não) e das Advertências
function informacoes(c, colab, cfg, lin){
  var rh = c.rh, hoje = hojeIso(), cont = {F:0, AJ:0, AT:0, atraso:0};
  Object.keys(rh.presenca || {}).forEach(function(iso){ if(iso<colab.admissao || iso>hoje) return; var x = rh.presenca[iso][colab.id]; if(!x) return; if(cont[x.c]!==undefined) cont[x.c]++; if(x.atraso) cont.atraso++; });
  var adv = (rh.adv || []).filter(function(a){ return a.colabId===colab.id; }), esc = rh.config.escalas.find(function(x){ return x.id===colab.escalaId; }), gestor = supervisoresDe(cfg)[colab.setor] || [];
  var dias = colab.admissao ? diasEntre(colab.admissao, hoje) : null;
  return [["Função", colab.funcao || "—"], ["Setor", colab.setor], ["Admissão", br(colab.admissao)], ["Dias de empresa", dias===null ? "—" : String(dias)],
    ["Plano", lin ? lin.plano.nome : "Sem plano"], ["1ª avaliação", br(lin && lin.a1)], ["2ª avaliação", br(lin && lin.a2)], ["Efetivação", br(lin && lin.ef)],
    ["Entrada", colab.entrada || "—"], ["Escala", esc ? esc.nome : "—"], ["Gestor", gestor.length ? gestor.join(", ") : "Sem gestor"], ["Advertências", String(adv.length)],
    ["Faltas sem justificativa", String(cont.F)], ["Faltas com aviso", String(cont.AJ)], ["Atestados", String(cont.AT)], ["Atrasos", String(cont.atraso)]];
}
var num = function(n){ return n===null || n===undefined ? "—" : String(n).replace(".", ","); };
var COR_REC = {pendente:"text-foreground", aprovar:"text-success", acompanhar:"text-warning", nao:"text-destructive"};

// ───────── Ficha de uma pessoa ─────────
// Layout B3 (Marcus, 04/11/2026): cartão de identidade no topo (foto grande, informações em 3 grupos, anel da nota), Nova ocorrência em linha única e 3 colunas de trabalho.
// Dourado só no título dos blocos (nenhuma tabela aqui, para não empilhar duas barras douradas). Nova ocorrência fica sempre no topo.
function Linhas(p){ return e("div",{className:"flex flex-col text-left"}, p.itens.map(function(x){ return e("div",{key:x[0], className:"flex items-center justify-between gap-3 border-b border-border py-1 last:border-b-0"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, x[0]), e("b",{className:"text-[13px] font-semibold"}, x[1])); })); }
function GrupoInfo(p){ return e("div",{className:"min-w-0"}, e("div",{className:"mb-1 border-b border-primary pb-0.5 text-left text-[11px] font-bold uppercase tracking-[.08em] text-primary"}, p.t), e(Linhas,{itens:p.itens})); }
function Barra(p){ return e("div",{className:"h-2 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full bg-primary", style:{width:Math.max(0, Math.min(100, p.pct))+"%"}})); }

function FichaExperiencia(p){
  var c = p.c, colab = p.colab, cfg = fichaCfg(c.rh), f = fichaDe(c.rh, colab.id), r = resultadoFicha(cfg, f);
  var lanca = temAutorizacao("rh_ficha_lanca", c.s.usuario), daNota = temAutorizacao("rh_ficha_nota", c.s.usuario) || ehGestorDe(cfg, nomeDe(c.s.usuario), colab.setor);
  var nv = useState({tipoId:"", data:hojeIso(), obs:""}), novo = nv[0], setNovo = nv[1];
  var tipos = {}; cfg.tipos.forEach(function(t){ tipos[t.id] = t; });
  var pend = ocorrenciasDaPresenca(c.s, colab), agir = p.agir;
  var ocs = f.ocorrencias.slice().sort(function(a, b){ return b.data.localeCompare(a.data); });
  var lin = experienciaLista(c.s).find(function(x){ return x.c.id===colab.id; });
  var inf = {}; informacoes(c, colab, cfg, lin).forEach(function(x){ inf[x[0]] = x[1]; });
  var pick = function(rotulos){ return rotulos.map(function(k){ return [k, inf[k]]; }); };
  var total = r.total===null ? "—" : num(r.total), pct = r.total===null ? 0 : r.total;
  return e("div",{className:"flex flex-col gap-2"},
    e(Bloco,{ouro:true, t:"Colaboradora", dir:e("span",{className:"text-[13px]"}, colab.nome+" · "+(colab.funcao || "Função não informada")+" · "+colab.setor)},
      e("div",{className:"grid items-center gap-4 lg:grid-cols-[200px_minmax(0,1fr)_230px]"},
        e("div",{className:"flex justify-center"}, e(FotoPessoa,{nome:colab.nome, setor:colab.setor, funcao:colab.funcao, s:190})),
        e("div",{className:"grid gap-x-6 gap-y-2 md:grid-cols-3"},
          e(GrupoInfo,{t:"Contrato", itens:pick(["Admissão", "Dias de empresa", "Plano", "Entrada", "Escala"])}),
          e(GrupoInfo,{t:"Avaliações", itens:pick(["1ª avaliação", "2ª avaliação", "Efetivação", "Gestor"])}),
          e(GrupoInfo,{t:"Presença no período", itens:pick(["Faltas sem justificativa", "Faltas com aviso", "Atestados", "Atrasos", "Advertências"])})),
        e("div",{className:"flex flex-col items-center gap-2"},
          e("div",{className:"grid size-28 place-items-center rounded-full", style:{background:"conic-gradient(#d4a84b 0 "+pct+"%, rgba(255,255,255,.12) "+pct+"% 100%)"}}, e("div",{className:"grid size-[84px] place-items-center rounded-full bg-card text-[20px] font-bold tabular-nums"}, total)),
          e("span",{className:"text-[13px] font-semibold "+COR_REC[r.recomendacao]}, ROTULO_REC[r.recomendacao]),
          e("div",{className:"flex gap-2"}, e(Botao,{onClick:function(){ imprimirFicha({colab:colab, cfg:cfg, ficha:f, res:r, hoje:hojeIso(), datas:lin ? {a1:lin.a1, a2:lin.a2, ef:lin.ef} : {}}); }}, "Imprimir"), e(Botao,{onClick:p.voltar}, "Voltar"))))),

    lanca && e(Bloco,{ouro:true, t:"Nova ocorrência"},
      e("div",{className:"grid items-end gap-2 md:grid-cols-[minmax(0,2fr)_9rem_minmax(0,3fr)_6rem]"},
        e(CampoSel,{t:"Tipo", id:"fx-tipo", value:novo.tipoId, onChange:function(v){ setNovo(Object.assign({}, novo, {tipoId:v})); }, opcoes:[["", "Escolha o tipo"]].concat(cfg.tipos.map(function(t){ return [t.id, t.nome+" (−"+num(t.desc)+")"]; }))}),
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"Data", id:"fx-data"}), e("input",{id:"fx-data", type:"date", value:novo.data, className:CAMPO, onChange:function(ev){ setNovo(Object.assign({}, novo, {data:ev.target.value})); }})),
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"Descrição (sem diagnóstico nem CID)", id:"fx-obs"}), e("input",{id:"fx-obs", value:novo.obs, maxLength:300, className:CAMPO, onChange:function(ev){ setNovo(Object.assign({}, novo, {obs:ev.target.value})); }})),
        e(Botao,{principal:true, desabilitado:!novo.tipoId || !novo.data, onClick:function(){ agir("ficha_oc_add", novo); setNovo({tipoId:"", data:hojeIso(), obs:""}); }}, "Lançar"))),

    e("div",{className:"grid items-start gap-2 lg:grid-cols-3"},
      e(Bloco,{ouro:true, t:"Pontuação", dir:e("span",{className:"text-[13px]"}, total+" / 100")},
        e("div",{className:"flex flex-col gap-2"}, cfg.categorias.map(function(cat){ var x = r.porCat[cat.id], cor = cat.nota ? "" : (x.desc ? "text-destructive" : "text-success");
          return e("div",{key:cat.id, className:"flex flex-col gap-1 text-left"},
            e("div",{className:"flex items-center justify-between gap-2"}, e("span",{className:"text-[13px]", title:cat.sub}, cat.nome), e("b",{className:"text-[13px] tabular-nums "+cor}, num(x.pontos)+" / "+cat.max)),
            e(Barra,{pct:x.pontos===null ? 0 : x.pontos*100/cat.max}),
            cat.nota && (daNota ? e("select",{"aria-label":"Nota de "+cat.nome, value:x.nota===null ? "" : String(x.nota), className:CAMPO, onChange:function(ev){ agir("ficha_nota", {colabId:colab.id, cat:cat.id, nota:ev.target.value}); }},
              e("option",{value:""}, "Nota do gestor: sem nota"), [0,1,2,3,4,5,6,7,8,9,10].map(function(n){ return e("option",{key:n, value:String(n)}, "Nota do gestor: "+n); })) : e("span",{className:"text-[13px]"}, "Nota do gestor: "+(x.nota===null ? "sem nota" : x.nota)))); }))),

      e("div",{className:"flex flex-col gap-2"},
        pend.length>0 && lanca && e(Bloco,{ouro:true, t:"A confirmar da Presença", dir:e(Botao,{onClick:function(){ agir("ficha_auto_ok", {colabId:colab.id}); }}, "Confirmar todas ("+pend.length+")")},
          e("div",{className:"flex flex-col"}, pend.map(function(x){ var t = tipos[x.tipoId];
            return e("div",{key:x.chave, className:"flex items-center justify-between gap-2 border-b border-border py-1.5 text-left last:border-b-0"},
              e("span",{className:"flex flex-col"}, e("b",{className:"text-[13px] font-semibold"}, t ? t.nome : x.tipoId), e("span",{className:"text-[11px]"}, br(x.data)+" · −"+num(t ? t.desc : 0)+" ponto(s)")),
              e("span",{className:"inline-flex gap-1.5"}, e(BotaoIcone,{icone:"check", rotulo:"Confirmar e descontar os pontos", cls:"text-success", onClick:function(){ agir("ficha_auto_ok", {colabId:colab.id, chaves:[x.chave]}); }}), e(BotaoIcone,{icone:"x", rotulo:"Descartar a sugestão", cls:"text-destructive", onClick:function(){ agir("ficha_auto_ignorar", {colabId:colab.id, chaves:[x.chave]}); }}))); }))),
        e(Bloco,{ouro:true, t:"Ocorrências", dir:e("span",{className:"text-[13px]"}, ocs.length+" no período")}, ocs.length===0 ? e("p",{className:"py-1 text-center text-[13px]"}, "Nenhuma ocorrência lançada.") :
          e("div",{className:"flex flex-col"}, ocs.map(function(o){ var t = tipos[o.tipoId];
            return e("div",{key:o.id, className:"flex items-center justify-between gap-2 border-b border-border py-1.5 text-left last:border-b-0"},
              e("span",{className:"flex min-w-0 flex-col"}, e("b",{className:"text-[13px] font-semibold"}, t ? t.nome : "Tipo removido"), e("span",{className:"text-[11px]"}, br(o.data)+" · "+(ORIGENS[o.origem] || "RH")+(o.obs ? " · "+o.obs : ""))),
              e("span",{className:"inline-flex items-center gap-2"}, e("b",{className:"text-[13px] tabular-nums text-destructive"}, "−"+num(t ? t.desc : 0)), lanca && e(BotaoIcone,{icone:"trash", rotulo:"Remover a ocorrência e devolver os pontos", cls:"text-destructive", onClick:function(){ if(window.confirm("Remover esta ocorrência e devolver os pontos?")) agir("ficha_oc_del", {colabId:colab.id, id:o.id}); }}))); })))),

      e(Bloco,{ouro:true, t:"Parecer e decisão"},
        e("div",{className:"grid grid-cols-2 gap-x-2 gap-y-1.5"},
          e(CampoSel,{t:"Decisão", id:"fx-dec", value:f.decisao, onChange:function(v){ if(lanca) agir("ficha_set", {colabId:colab.id, patch:{decisao:v}}); }, opcoes:DECISOES}),
          e("div",{className:"min-w-0"}, e(Rotulo,{t:"Data", id:"fx-dtav"}), e("input",{id:"fx-dtav", type:"date", disabled:!lanca, defaultValue:f.dataAvaliacao, key:"d"+f.dataAvaliacao, className:CAMPO, onBlur:function(ev){ if(ev.target.value!==f.dataAvaliacao) agir("ficha_set", {colabId:colab.id, patch:{dataAvaliacao:ev.target.value}}); }})),
          e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Parecer do gestor e do RH", id:"fx-par"}), e("textarea",{id:"fx-par", disabled:!lanca, rows:6, maxLength:1800, defaultValue:f.parecer, key:"p"+f.parecer.length, className:CAMPO+" h-auto py-1", onBlur:function(ev){ if(ev.target.value!==f.parecer) agir("ficha_set", {colabId:colab.id, patch:{parecer:ev.target.value}}); }}))),
        e("p",{className:"mt-2 text-center text-[13px]"}, "Uso interno: a colaboradora não vê."))));
}

// ───────── Configurador: tabela de descontos, pesos e faixas ─────────
function ConfigFicha(p){
  var c = p.c, cfg = fichaCfg(c.rh), tb = useState("descontos"), aba = tb[0], setAba = tb[1];
  var salvar = function(ficha){ p.agir("ficha_cfg", {ficha:ficha}); };
  var setTipo = function(id, k, v){ salvar(Object.assign({}, cfg, {tipos:cfg.tipos.map(function(t){ if(t.id!==id) return t; var o = Object.assign({}, t); o[k] = v; return o; })})); };
  var setCat = function(id, v){ salvar(Object.assign({}, cfg, {categorias:cfg.categorias.map(function(k){ return k.id===id ? Object.assign({}, k, {max:v}) : k; })})); };
  var soma = cfg.categorias.reduce(function(t, k){ return t+k.max; }, 0);
  var campoNum = function(chave, valor, fn){ return e("input",{key:chave+valor, "aria-label":chave, type:"number", min:0, step:"any", defaultValue:valor, className:CAMPO+" w-24 text-center", onBlur:function(ev){ var v = Number(ev.target.value); if(ev.target.value!=="" && v>=0 && v!==valor) fn(v); }}); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Segmentado,{atual:aba, onMudar:setAba, opcoes:[["descontos","Descontos"], ["pesos","Pesos e faixas"], ["gestores","Gestores por setor"]]}),
    aba==="gestores" && e(Bloco,{t:"Quem dá a nota em cada setor", dir:e("span",{className:"text-[13px]"}, "Setor sem nome: só Direção e RH dão a nota")},
      e(TabelaP,{cols:[{t:"Setor", w:240, c:true}, {t:"Gestor (nome completo; vários separados por vírgula)", c:true}]},
        FUNCIONARIOS_POR_SETOR.filter(function(x){ return x[0]!=="Sócios e família" && x[0]!=="PJ · prestadores" && x[0]!=="Representante" && x[0]!=="Equipe direção"; }).map(function(x){ var setor = x[0], atual = (supervisoresDe(cfg)[setor] || []).join(", ");
          return e(Tr,{key:setor}, e(Td,{c:true}, setor), e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, e("input",{key:setor+atual, "aria-label":"Gestor de "+setor, defaultValue:atual, placeholder:"Sem gestor", className:CAMPO, onBlur:function(ev){ if(ev.target.value===atual) return;
            var m = Object.assign({}, supervisoresDe(cfg)); var l = ev.target.value.split(",").map(function(t){ return t.trim(); }).filter(Boolean); if(l.length) m[setor] = l; else delete m[setor]; salvar(Object.assign({}, cfg, {supervisores:m})); }}))); }))),
    aba==="descontos" && e(Bloco,{t:"Pontos descontados por ocorrência"},
      e(TabelaP,{cols:[{t:"Ocorrência", c:true}, {t:"Categoria", w:200, c:true}, {t:"Desconto", w:140, c:true}]},
        cfg.tipos.map(function(t){ return e(Tr,{key:t.id}, e(Td,{c:true}, t.nome), e(Td,{c:true}, (cfg.categorias.find(function(k){ return k.id===t.cat; }) || {}).nome), e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, campoNum(t.id, t.desc, function(v){ setTipo(t.id, "desc", v); }))); }))),
    aba==="pesos" && e("div",{className:"grid gap-2.5 md:grid-cols-2"},
      e(Bloco,{t:"Pontos de cada categoria", dir:e("span",{className:"text-[13px] font-semibold "+(soma===100 ? "text-success" : "text-destructive")}, "Soma: "+soma+(soma===100 ? "" : " (deve ser 100)"))},
        e(TabelaP,{cols:[{t:"Categoria", c:true}, {t:"Pontos", w:140, c:true}]}, cfg.categorias.map(function(k){ return e(Tr,{key:k.id}, e(Td,{c:true}, k.nome), e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, campoNum(k.id, k.max, function(v){ setCat(k.id, v); }))); }))),
      e(Bloco,{t:"Faixas da recomendação"},
        e(TabelaP,{cols:[{t:"Faixa", c:true}, {t:"Pontos", w:140, c:true}]},
          e(Tr,null, e(Td,{c:true}, "Recomenda efetivar a partir de"), e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, campoNum("aprovar", cfg.faixaAprovar, function(v){ salvar(Object.assign({}, cfg, {faixaAprovar:v})); }))),
          e(Tr,null, e(Td,{c:true}, "Acompanhar a partir de"), e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, campoNum("acompanhar", cfg.faixaAcompanhar, function(v){ salvar(Object.assign({}, cfg, {faixaAcompanhar:v})); }))),
          e(Tr,null, e(Td,{c:true}, "Atraso curto vai até (minutos)"), e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, campoNum("atrasoLimite", cfg.atrasoLimite, function(v){ salvar(Object.assign({}, cfg, {atrasoLimite:v})); })))))));
}

export { FichaExperiencia, ConfigFicha, Pessoa };
