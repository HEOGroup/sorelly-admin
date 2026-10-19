// Sorelly Admin · montagem — pages/avaliacoes/Configurador.js
// Avaliações → Configurador: perguntas das representantes e do kit (com prévia do app), critérios dos funcionários, supervisores por setor, diretoria e limites de nota.
// Só a diretoria edita; os demais veem em leitura. Todas as regras ficam em domain/avaliacoes.js (ações AV).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Mosaico } from "@/apps/montagem/components/padrao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { EQUIPE } from "@/apps/montagem/domain/equipe";
import { FUNCIONARIOS_POR_SETOR } from "@/apps/montagem/domain/pessoas";
import { MIN_OPCOES, OPCAO_MAX, TEXTO_MAX, TIPOS, avFuncCriterios, avPerguntas, avTodasPerguntas, rotuloTipo } from "@/apps/montagem/domain/avaliacoes";
import { Bt, BtMini, Colunas, Janela, Painel, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { COR, Area, Campo, Entrada, ErroAv, Escolha, Texto, Vazio, cap, useAv } from "@/apps/montagem/pages/avaliacoes/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var num = function(v){ var n = Number(String(v).replace(",", ".")); return isFinite(n) ? n : 0; };
var pessoas = EQUIPE.filter(function(x, i, v){ return v.findIndex(function(y){ return y.id===x.id; })===i; });
var nomeId = function(id){ var p = pessoas.find(function(x){ return String(x.id)===String(id); }); return p ? p.nome : String(id); };

// botão pequeno de seta (ordem) e de interruptor (ativo)
function Seta(p){ return e("button",{type:"button", disabled:p.ro || p.off, onClick:p.onClick, title:p.t, "aria-label":p.t, className:"grid size-6 place-items-center rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30"}, e(Ph,{n:p.ic, s:12})); }
function Liga(p){ return e("button",{type:"button", disabled:p.ro, onClick:p.onClick, title:p.on ? "Desativar" : "Ativar", "aria-label":p.on ? "Desativar" : "Ativar", className:"inline-flex h-6 w-10 items-center rounded-full p-0.5 transition disabled:opacity-50 "+(p.on ? "justify-end bg-[#22C55E]/70" : "justify-start bg-white/15")}, e("span",{className:"size-5 rounded-full bg-white"})); }

// ---------- pergunta: criar e editar, com a prévia do app ao lado ----------
function PerguntaJanela(p){
  var a = useAv(), q = p.q, s0 = useState(q ? q.texto : ""), s1 = useState(q ? q.tipo : "estrela5"), s2 = useState(q ? (q.opcoes||[]).join("\n") : ""), s3 = useState(q ? String(q.peso).replace(".", ",") : "1");
  var texto = s0[0], tipo = s1[0], opcoes = s2[0], peso = s3[0], travaTipo = q && q.temRespostas;
  var lista = opcoes.split("\n");
  var salvar = function(){
    var dados = {texto:texto, tipo:tipo, opcoes:tipo==="multipla" ? lista : [], peso:num(peso)};
    var ok = q ? a.agir(Object.assign({op:"perg_edit", id:q.id}, dados)) : a.agir(Object.assign({op:"perg_add", categoria:p.categoria}, dados));
    if(ok) p.fechar();
  };
  var previa = {id:"previa", texto:texto || "Texto da pergunta", tipo:tipo, opcoes:lista.map(function(x){ return x.trim(); }).filter(Boolean)};
  return e(Janela,{t:q ? "Editar pergunta" : "Nova pergunta", sub:p.categoria==="kit" ? "Pergunta sobre o kit" : "Pergunta sobre a representante", fechar:p.fechar, tam:"lg"},
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}),
    e(Colunas,{n:2},
      e(Painel,{t:"Dados da pergunta", ic:"pencil-simple", estado:texto.trim() ? "feito" : "atual"},
        e(Campo,{r:"Texto"}, e(Texto,{v:texto, set:s0[1], max:TEXTO_MAX, ph:"Texto da pergunta"})),
        e(Campo,{r:"Tipo"+(travaTipo ? " (travado: já há respostas)" : "")}, e("div",{className:"flex flex-wrap justify-center gap-1"}, Object.keys(TIPOS).map(function(k){ return e(Escolha,{key:k, ro:travaTipo, on:tipo===k, onClick:function(){ s1[1](k); }}, TIPOS[k].rotulo); }))),
        tipo==="multipla" && e(Campo,{r:"Opções (uma por linha)"}, e(Area,{v:opcoes, set:s2[1], linhas:4, ph:"Pelo menos "+MIN_OPCOES+" opções, até "+OPCAO_MAX+" caracteres cada"}),
          travaTipo && e("span",{className:"text-[11px] text-white/60"}, "Com respostas, só é possível acrescentar opções.")),
        e(Campo,{r:"Peso na nota geral"}, e(Texto,{v:peso, set:s3[1], ph:"Peso"}))),
      e(Painel,{t:"Prévia no app da revendedora", ic:"device-mobile"}, e(Entrada,{q:previa, valor:{}, set:function(){}, leitura:true}))),
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"check-circle", onClick:salvar}, q ? "Salvar alterações" : "Criar pergunta")));
}

// ---------- critério de funcionários ----------
function CriterioJanela(p){
  var a = useAv(), c = p.c, s0 = useState(c ? c.nome : ""), s1 = useState(c ? String(c.peso).replace(".", ",") : "1");
  var salvar = function(){ if(a.agir(c ? {op:"func_crit_edit", id:c.id, nome:s0[0], peso:num(s1[0])} : {op:"func_crit_add", nome:s0[0], peso:num(s1[0])})) p.fechar(); };
  return e(Janela,{t:c ? "Editar critério" : "Novo critério", sub:"Critério da avaliação de funcionários", fechar:p.fechar, tam:"sm"},
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}),
    e(Campo,{r:"Nome"}, e(Texto,{v:s0[0], set:s0[1], max:120, ph:"Nome do critério"})),
    e(Campo,{r:"Peso"}, e(Texto,{v:s1[0], set:s1[1], ph:"Peso"})),
    c && e("span",{className:"text-[11.5px] text-white/60"}, "O peso novo vale só para as avaliações novas."),
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"check-circle", onClick:salvar}, c ? "Salvar alterações" : "Criar critério")));
}

// ---------- escolher pessoas (supervisão de um setor ou diretoria) ----------
function PessoasJanela(p){
  var a = useAv(), st = useState((p.ids||[]).map(String)), sel = st[0];
  var alterna = function(id){ id = String(id); st[1](sel.indexOf(id)>=0 ? sel.filter(function(x){ return x!==id; }) : sel.concat([id])); };
  var salvar = function(){ if(a.agir(p.setor ? {op:"func_sup_set", setor:p.setor, ids:sel} : {op:"func_dir_set", ids:sel})) p.fechar(); };
  return e(Janela,{t:p.setor ? "Supervisão de "+p.setor : "Quem avalia todos os setores", sub:"Marque as pessoas autorizadas", fechar:p.fechar, tam:"md"},
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}),
    e("div",{className:"flex flex-wrap justify-center gap-1"}, pessoas.map(function(x){ return e(Escolha,{key:x.id, on:sel.indexOf(String(x.id))>=0, onClick:function(){ alterna(x.id); }}, x.nome); })),
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"check-circle", onClick:salvar}, "Salvar")));
}

// ---------- lista de perguntas de uma categoria ----------
function ListaPerguntas(p){
  var a = useAv(), lista = avTodasPerguntas(a.s, p.categoria), ro = !a.dir;
  var mover = function(i, delta){ var ids = lista.map(function(x){ return x.id; }), j = i+delta; if(j<0 || j>=ids.length) return; var t = ids[i]; ids[i] = ids[j]; ids[j] = t; a.agir({op:"perg_ordem", categoria:p.categoria, ids:ids}); };
  return e("div",{className:"flex flex-col gap-1.5 p-2"},
    lista.length ? lista.map(function(q, i){
      return e("div",{key:q.id, className:"flex flex-col items-center gap-1 rounded-xl bg-black/20 p-2 text-center ring-1 ring-white/10 "+(q.ativo ? "" : "opacity-60")},
        e("b",{className:"text-[13px]"}, cap(q.texto)),
        e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, e(Selo,{cor:COR}, rotuloTipo(q.tipo)), e("span",{className:MONO+" text-[11.5px] text-white/75"}, "Peso "+String(q.peso).replace(".", ",")),
          q.temRespostas && e(Selo,{cor:"#94A3B8", titulo:"Com respostas: o tipo fica travado"}, "Com respostas")),
        q.tipo==="multipla" && e("span",{className:"text-[11.5px] text-white/65"}, (q.opcoes||[]).join(" · ")),
        e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
          e(Seta,{ic:"arrow-up", t:"Subir", ro:ro, off:i===0, onClick:function(){ mover(i, -1); }}), e(Seta,{ic:"arrow-down", t:"Descer", ro:ro, off:i===lista.length-1, onClick:function(){ mover(i, 1); }}),
          e(Liga,{on:q.ativo, ro:ro, onClick:function(){ a.agir({op:"perg_edit", id:q.id, ativo:!q.ativo}); }}),
          !ro && e(BtMini,{titulo:"Editar", onClick:function(){ p.abre({t:"perg", categoria:p.categoria, q:q}); }}, e(Ph,{n:"pencil-simple", s:12}), "Editar"),
          !ro && e(BtMini,{titulo:q.temRespostas ? "Desativar (o histórico fica)" : "Excluir", onClick:function(){ a.agir({op:"perg_del", id:q.id}); }}, e(Ph,{n:"trash", s:12}), q.temRespostas ? "Desativar" : "Excluir"))); })
      : e(Vazio,{ic:"question"}, "Nenhuma pergunta cadastrada."),
    !ro && e("div",{className:"flex justify-center pt-1"}, e(Bt,{ic:"plus-circle", onClick:function(){ p.abre({t:"perg", categoria:p.categoria, q:null}); }}, "Nova pergunta")),
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}));
}

// ---------- limites de nota (campos numéricos, um botão salva o grupo) ----------
function Limites(p){
  var a = useAv(), c = a.av.config, f = c.func, ro = !a.dir;
  var st = useState(null), v = st[0] || {rb:c.notaBoaPiso, rr:c.notaRuimTeto, lr:c.limiteRanking, me:c.mesesEvolucao, em:f.escalaMax, fb:f.notaBoa, fr:f.notaRuim, cm:f.comentarioMax};
  var muda = function(ch, x){ var n = Object.assign({}, v); n[ch] = x; st[1](n); };
  var campo = function(r, ch){ return e(Campo,{key:ch, r:r}, e(Texto,{v:String(v[ch]).replace(".", ","), set:function(x){ muda(ch, x); }, ph:r, ro:ro})); };
  var salvarRep = function(){ a.agir({op:"cfg_set", notaBoaPiso:num(v.rb), notaRuimTeto:num(v.rr), limiteRanking:num(v.lr), mesesEvolucao:num(v.me)}); };
  var salvarFunc = function(){ a.agir({op:"func_cfg_set", escalaMax:num(v.em), notaBoa:num(v.fb), notaRuim:num(v.fr), comentarioMax:num(v.cm)}); };
  return e("div",{className:"flex flex-col gap-2 p-2"},
    e(Painel,{t:"Representantes e kit (nota de 0 a 5)", ic:"star"}, e(Colunas,{n:2}, campo("Nota boa a partir de", "rb"), campo("Nota ruim abaixo de", "rr"), campo("Representantes em cada ranking", "lr"), campo("Meses na evolução", "me")),
      !ro && e("div",{className:"flex justify-center"}, e(Bt,{ic:"floppy-disk", onClick:salvarRep}, "Salvar limites"))),
    e(Painel,{t:"Funcionários", ic:"users"}, e(Colunas,{n:2}, campo("Escala máxima (2 a 10)", "em"), campo("Nota boa a partir de", "fb"), campo("Nota ruim abaixo de", "fr"), campo("Tamanho do comentário", "cm")),
      !ro && e("div",{className:"flex justify-center"}, e(Bt,{ic:"floppy-disk", onClick:salvarFunc}, "Salvar limites"))),
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}));
}

// ---------- aba ----------
function AbaAvConfig(){
  var a = useAv(), sj = useState(null), jan = sj[0], ro = !a.dir, cfg = a.av.config, crits = avFuncCriterios(a.s, false);
  var abre = function(j){ sj[1](j); }, fecha = function(){ sj[1](null); };
  var movC = function(i, delta){ var ids = crits.map(function(x){ return x.id; }), j = i+delta; if(j<0 || j>=ids.length) return; var t = ids[i]; ids[i] = ids[j]; ids[j] = t; a.agir({op:"func_crit_ordem", ids:ids}); };
  var previaCat = function(cat){ var qs = avPerguntas(a.s, cat); return qs.length ? qs.map(function(q){ return e(Entrada,{key:q.id, q:q, valor:{}, set:function(){}, leitura:true}); }) : e(Vazio,{ic:"question"}, "Sem perguntas ativas."); };
  var setores = FUNCIONARIOS_POR_SETOR.map(function(x){ return x[0]; });
  return e("div",{className:"flex flex-col gap-2.5"},
    ro && e("div",{className:"flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-center text-[12.5px] text-white/80 ring-1 ring-white/10"}, e(Ph,{n:"lock-simple", s:15}), "Somente leitura: apenas a diretoria altera as configurações."),
    e(Mosaico,{min:"23rem"},
      e(BlocoBarra,{cor:"laranja", t:"Perguntas das representantes", compacto:true}, e(ListaPerguntas,{categoria:"representante", abre:abre})),
      e(BlocoBarra,{cor:"laranja", t:"Perguntas do kit", compacto:true}, e(ListaPerguntas,{categoria:"kit", abre:abre})),
      e(BlocoBarra,{cor:"laranja", t:"Prévia no app da revendedora", compacto:true}, e("div",{className:"flex flex-col gap-2 p-2"},
        e(Painel,{t:"Sobre a representante", ic:"user-circle"}, previaCat("representante")), e(Painel,{t:"Sobre o kit", ic:"package"}, previaCat("kit")))),
      e(BlocoBarra,{cor:"laranja", t:"Critérios dos funcionários", compacto:true}, e("div",{className:"flex flex-col gap-1.5 p-2"},
        crits.length ? crits.map(function(c, i){ return e("div",{key:c.id, className:"flex flex-col items-center gap-1 rounded-xl bg-black/20 p-2 text-center ring-1 ring-white/10 "+(c.ativo ? "" : "opacity-60")},
          e("b",{className:"text-[13px]"}, cap(c.nome)), e("span",{className:MONO+" text-[11.5px] text-white/75"}, "Peso "+String(c.peso).replace(".", ",")),
          e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
            e(Seta,{ic:"arrow-up", t:"Subir", ro:ro, off:i===0, onClick:function(){ movC(i, -1); }}), e(Seta,{ic:"arrow-down", t:"Descer", ro:ro, off:i===crits.length-1, onClick:function(){ movC(i, 1); }}),
            e(Liga,{on:c.ativo, ro:ro, onClick:function(){ a.agir({op:"func_crit_edit", id:c.id, ativo:!c.ativo}); }}),
            !ro && e(BtMini,{titulo:"Editar", onClick:function(){ abre({t:"crit", c:c}); }}, e(Ph,{n:"pencil-simple", s:12}), "Editar"),
            !ro && e(BtMini,{titulo:c.temNotas ? "Desativar (o histórico fica)" : "Excluir", onClick:function(){ a.agir({op:"func_crit_del", id:c.id}); }}, e(Ph,{n:"trash", s:12}), c.temNotas ? "Desativar" : "Excluir"))); })
          : e(Vazio,{ic:"list-checks"}, "Nenhum critério cadastrado."),
        !ro && e("div",{className:"flex justify-center pt-1"}, e(Bt,{ic:"plus-circle", onClick:function(){ abre({t:"crit", c:null}); }}, "Novo critério")),
        e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}))),
      e(BlocoBarra,{cor:"laranja", t:"Supervisores por setor", compacto:true}, e("div",{className:"flex flex-col gap-1.5 p-2"},
        e("div",{className:"flex flex-col items-center gap-1 rounded-xl bg-black/20 p-2 text-center ring-1 ring-[#F97316]/40"}, e("b",{className:"text-[12.5px]"}, "Quem avalia todos os setores"),
          e("span",{className:"text-[12px] text-white/75"}, (cfg.diretoria.length ? cfg.diretoria.map(nomeId).join(", ") : "Somente a diretoria (Marcus, Nickolas e Lucas)")),
          !ro && e(BtMini,{onClick:function(){ abre({t:"pessoas", setor:null, ids:cfg.diretoria}); }}, e(Ph,{n:"users-three", s:12}), "Definir")),
        setores.map(function(s){ var ids = cfg.supervisores[s] || [];
          return e("div",{key:s, className:"flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-black/20 px-2 py-1.5 text-center ring-1 ring-white/10"}, e("b",{className:"text-[12.5px]"}, s),
            e("span",{className:"text-[12px] "+(ids.length ? "text-white/80" : "text-white/45")}, ids.length ? ids.map(nomeId).join(", ") : "Sem supervisor"),
            !ro && e(BtMini,{titulo:"Definir supervisores de "+s, onClick:function(){ abre({t:"pessoas", setor:s, ids:ids}); }}, e(Ph,{n:"pencil-simple", s:12}), "Definir")); }))),
      e(BlocoBarra,{cor:"laranja", t:"Limites de nota", compacto:true}, e(Limites,{key:[cfg.notaBoaPiso, cfg.notaRuimTeto, cfg.limiteRanking, cfg.mesesEvolucao, cfg.func.escalaMax, cfg.func.notaBoa, cfg.func.notaRuim, cfg.func.comentarioMax].join("|")}))),
    jan && jan.t==="perg" && e(PerguntaJanela,{key:jan.q ? jan.q.id : "nova"+jan.categoria, categoria:jan.categoria, q:jan.q, fechar:fecha}),
    jan && jan.t==="crit" && e(CriterioJanela,{key:jan.c ? jan.c.id : "novo", c:jan.c, fechar:fecha}),
    jan && jan.t==="pessoas" && e(PessoasJanela,{key:jan.setor || "dir", setor:jan.setor, ids:jan.ids, fechar:fecha}));
}

export { AbaAvConfig, PerguntaJanela, CriterioJanela, PessoasJanela };
