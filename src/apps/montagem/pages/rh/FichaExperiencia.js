// Sorelly Admin · montagem — pages/rh/FichaExperiencia.js
// Ficha de experiência de uma colaboradora (100 pontos). Abre pelo Controle de experiência. Regras em domain/rh-ficha.js; ações "ficha_*" em domain/rh.js.
// O RH lança as ocorrências; gestor e Direção veem; quem é avaliada nunca vê (a tela só existe no admin). Autorizações: rh_ficha_lanca e rh_ficha_nota.
import { Bloco, Botao, CAMPO, CampoSel, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { DECISOES, ORIGENS, ROTULO_REC, ehGestorDe, fichaCfg, fichaDe, resultadoFicha, supervisoresDe } from "@/apps/montagem/domain/rh-ficha";
import { FUNCIONARIOS_POR_SETOR } from "@/apps/montagem/domain/pessoas";
import { br, hojeIso, ocorrenciasDaPresenca } from "@/apps/montagem/domain/rh";
import { Avatar } from "@/apps/montagem/components/chat/chat-ui";
import { idPorNome } from "@/apps/montagem/domain/chat-contatos";
import { e, useState } from "@/shared/react";

// foto da colaboradora (a mesma do perfil no SorellyChat) ao lado do nome; sem foto, as iniciais
function Pessoa(p){
  return e("span",{className:"flex items-center justify-start gap-3"}, e(Avatar,{id:idPorNome(p.nome), nome:p.nome, s:p.s || 28}), e("span",{className:"text-[13px] "+(p.forte ? "font-semibold" : "")}, p.nome));
}
var num = function(n){ return n===null || n===undefined ? "—" : String(n).replace(".", ","); };
var COR_REC = {pendente:"text-foreground", aprovar:"text-success", acompanhar:"text-warning", nao:"text-destructive"};

// ───────── Ficha de uma pessoa ─────────
function FichaExperiencia(p){
  var c = p.c, colab = p.colab, cfg = fichaCfg(c.rh), f = fichaDe(c.rh, colab.id), r = resultadoFicha(cfg, f);
  var lanca = temAutorizacao("rh_ficha_lanca", c.s.usuario), daNota = temAutorizacao("rh_ficha_nota", c.s.usuario) || ehGestorDe(cfg, nomeDe(c.s.usuario), colab.setor);
  var nv = useState({tipoId:"", data:hojeIso(), obs:""}), novo = nv[0], setNovo = nv[1];
  var tipos = {}; cfg.tipos.forEach(function(t){ tipos[t.id] = t; });
  var pend = ocorrenciasDaPresenca(c.s, colab), agir = p.agir;
  var ocs = f.ocorrencias.slice().sort(function(a, b){ return b.data.localeCompare(a.data); });
  var tipoSel = tipos[novo.tipoId];
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("div",{className:"flex items-center gap-3"}, e(Avatar,{id:idPorNome(colab.nome), nome:colab.nome, s:48}), e("div",{className:"flex flex-col"}, e("b",{className:"text-[13px]"}, colab.nome), e("span",{className:"text-[13px]"}, colab.setor+" · admissão "+br(colab.admissao)))),
      e("div",{className:"flex flex-wrap items-center gap-2"}, e(Botao,{onClick:function(){ window.print(); }}, "Imprimir ficha"), e(Botao,{onClick:p.voltar}, "Voltar"))),

    e(Bloco,{t:"Pontuação", dir:e("span",{className:"text-[13px] font-semibold "+COR_REC[r.recomendacao]}, ROTULO_REC[r.recomendacao])},
      e("div",{className:"mb-2 flex items-baseline justify-center gap-2"}, e("b",{className:"text-[20px] tabular-nums "+COR_REC[r.recomendacao]}, r.total===null ? "—" : num(r.total)), e("span",{className:"text-[13px]"}, "de 100 pontos · "+(r.descontado ? "−"+num(r.descontado)+" por ocorrências" : "nenhum desconto"))),
      e(TabelaP,{cols:[{t:"Categoria", c:true}, {t:"Pontos", w:110, c:true}, {t:"Máximo", w:110, c:true}, {t:"Nota do gestor", w:220, c:true}]},
        cfg.categorias.map(function(cat){ var x = r.porCat[cat.id];
          return e(Tr,{key:cat.id}, e(Td,{c:true, title:cat.sub}, cat.nome), e(Td,{c:true, forte:true, cor:cat.nota ? "" : (x.desc ? "text-destructive" : "text-success")}, num(x.pontos)), e(Td,{c:true}, String(cat.max)),
            e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, cat.nota ? (daNota ? e("select",{"aria-label":"Nota de "+cat.nome, value:x.nota===null ? "" : String(x.nota), className:CAMPO+" w-40", onChange:function(ev){ agir("ficha_nota", {colabId:colab.id, cat:cat.id, nota:ev.target.value}); }},
              e("option",{value:""}, "Sem nota"), [0,1,2,3,4,5,6,7,8,9,10].map(function(n){ return e("option",{key:n, value:String(n)}, String(n)); })) : e("span",{className:"text-[13px] tabular-nums"}, x.nota===null ? "Sem nota" : String(x.nota))) : e("span",{className:"text-[13px]"}, "Automático"))); }))),

    pend.length>0 && lanca && e(Bloco,{t:"A confirmar da Presença diária", dir:e("span",{className:"text-[13px]"}, pend.length+" sugestão(ões)")},
      e("div",{className:"mb-2 flex justify-center"}, e(Botao,{principal:true, onClick:function(){ agir("ficha_auto_ok", {colabId:colab.id}); }}, "Confirmar todas")),
      e(TabelaP,{cols:[{t:"Data", w:110, c:true}, {t:"Ocorrência", c:true}, {t:"Desconto", w:110, c:true}, {t:"Ações", w:220, c:true}]},
        pend.map(function(x){ var t = tipos[x.tipoId];
          return e(Tr,{key:x.chave}, e(Td,{c:true}, br(x.data)), e(Td,{c:true}, t ? t.nome : x.tipoId), e(Td,{c:true, cor:"text-destructive"}, "−"+num(t ? t.desc : 0)),
            e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, e("span",{className:"inline-flex gap-2"}, e(Botao,{onClick:function(){ agir("ficha_auto_ok", {colabId:colab.id, chaves:[x.chave]}); }}, "Confirmar"), e(Botao,{onClick:function(){ agir("ficha_auto_ignorar", {colabId:colab.id, chaves:[x.chave]}); }}, "Descartar")))); }))),

    lanca && e(Bloco,{t:"Nova ocorrência"},
      e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-4"},
        e(CampoSel,{t:"Tipo", id:"fx-tipo", value:novo.tipoId, cls:"col-span-2", onChange:function(v){ setNovo(Object.assign({}, novo, {tipoId:v})); }, opcoes:[["", "Escolha o tipo"]].concat(cfg.tipos.map(function(t){ return [t.id, t.nome+" (−"+num(t.desc)+")"]; }))}),
        e("div",{className:"min-w-0"}, e(Rotulo,{t:"Data", id:"fx-data"}), e("input",{id:"fx-data", type:"date", value:novo.data, className:CAMPO, onChange:function(ev){ setNovo(Object.assign({}, novo, {data:ev.target.value})); }})),
        e("div",{className:"flex justify-end"}, e(Botao,{principal:true, desabilitado:!novo.tipoId || !novo.data, onClick:function(){ agir("ficha_oc_add", novo); setNovo({tipoId:"", data:hojeIso(), obs:""}); }}, "Lançar")),
        e("div",{className:"col-span-2 min-w-0 md:col-span-4"}, e(Rotulo,{t:"Descrição (sem diagnóstico nem CID)", id:"fx-obs"}), e("input",{id:"fx-obs", value:novo.obs, maxLength:300, className:CAMPO, onChange:function(ev){ setNovo(Object.assign({}, novo, {obs:ev.target.value})); }}))),
      tipoSel && e("p",{className:"mt-2 text-center text-[13px]"}, "Desconto de "+num(tipoSel.desc)+" ponto(s) em "+(cfg.categorias.find(function(k){ return k.id===tipoSel.cat; }) || {}).nome+".")),

    e(Bloco,{t:"Ocorrências", dir:e("span",{className:"text-[13px]"}, ocs.length+" no período")}, ocs.length===0 ? e("p",{className:"py-3 text-center text-[13px]"}, "Nenhuma ocorrência lançada.") :
      e(TabelaP,{cols:[{t:"Data", w:110, c:true}, {t:"Ocorrência", c:true}, {t:"Descrição", c:true}, {t:"Origem", w:130, c:true}, {t:"Desconto", w:100, c:true}].concat(lanca ? [{t:"", w:110, c:true}] : [])},
        ocs.map(function(o){ var t = tipos[o.tipoId];
          return e(Tr,{key:o.id}, e(Td,{c:true}, br(o.data)), e(Td,{c:true}, t ? t.nome : "Tipo removido"), e(Td,{c:true}, o.obs || "—"), e(Td,{c:true}, ORIGENS[o.origem] || "RH"), e(Td,{c:true, cor:"text-destructive"}, "−"+num(t ? t.desc : 0)),
            lanca && e("td",{className:"h-8 border-b border-border px-2.5 text-center"}, e(Botao,{onClick:function(){ if(window.confirm("Remover esta ocorrência e devolver os pontos?")) agir("ficha_oc_del", {colabId:colab.id, id:o.id}); }}, "Remover"))); }))),

    e(Bloco,{t:"Parecer e decisão"},
      e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
        e(CampoSel,{t:"Decisão", id:"fx-dec", value:f.decisao, cls:"col-span-2", onChange:function(v){ if(lanca) agir("ficha_set", {colabId:colab.id, patch:{decisao:v}}); }, opcoes:DECISOES}),
        e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Data da avaliação", id:"fx-dtav"}), e("input",{id:"fx-dtav", type:"date", disabled:!lanca, defaultValue:f.dataAvaliacao, key:"d"+f.dataAvaliacao, className:CAMPO, onBlur:function(ev){ if(ev.target.value!==f.dataAvaliacao) agir("ficha_set", {colabId:colab.id, patch:{dataAvaliacao:ev.target.value}}); }})),
        e("div",{className:"col-span-2 min-w-0 md:col-span-4"}, e(Rotulo,{t:"Parecer do gestor e do RH", id:"fx-par"}), e("textarea",{id:"fx-par", disabled:!lanca, rows:3, maxLength:1800, defaultValue:f.parecer, key:"p"+f.parecer.length, className:CAMPO+" h-auto py-1.5", onBlur:function(ev){ if(ev.target.value!==f.parecer) agir("ficha_set", {colabId:colab.id, patch:{parecer:ev.target.value}}); }}))),
      e("p",{className:"mt-2 text-center text-[13px]"}, "A pontuação ajuda na decisão, mas não substitui a análise do RH. Esta ficha é de uso interno: a pessoa avaliada não vê.")));
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
