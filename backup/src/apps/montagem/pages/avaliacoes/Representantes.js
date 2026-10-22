// Sorelly Admin · montagem — pages/avaliacoes/Representantes.js
// Avaliações → Representantes (pelas revendedoras): mosaico por representante, detalhe em janela, lançamento manual (o app da revendedora não está ligado) e lista de quem avaliou.
// Avaliações → Representantes (pelo sistema): comparativo com a nota das revendedoras + a tela AbaAvalRep já existente (nota, recusas, dias parados, regras; representante não tem bônus).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Mosaico, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { avPerguntas, avPainelRep, avRepresentanteDetalhe, avRepresentantes, avRevendedoraDetalhe, avRevendedoras, formatarDia, formatarMes, formatarNota, hojeSP, percentualDaNota } from "@/apps/montagem/domain/avaliacoes";
import { AbaAvalRep } from "@/apps/montagem/pages/AvalRep";
import { Bt, BtMini, Busca, Colunas, Janela, Painel, BarraFiltros } from "@/apps/montagem/pages/indicacoes/visual";
import { COR, Campo, Cartao, Entrada, ErroAv, Escolha, LinhaBarra, Nota, Texto, Vazio, cap, corNota, useAv } from "@/apps/montagem/pages/avaliacoes/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

// nota 0 a 5 de um mês a partir das médias por pergunta (escala normalizada e pesada pelo peso)
function notaDoMes(medias, info){
  var soma = 0, pt = 0; medias.forEach(function(m){ var i = info[m.perguntaId]; if(!i || m.media==null) return; soma += m.media/i.max*5*i.peso; pt += i.peso; });
  return pt ? soma/pt : null;
}

// ---------- detalhe de uma representante ----------
function DetalheRep(p){
  var a = useAv(), d = avRepresentanteDetalhe(a.s, p.nome), cfg = a.av.config, st = useState(null), conf = st[0];
  var info = {}; d.medias.forEach(function(m){ info[m.perguntaId] = {max:m.max, peso:m.peso}; });
  var colunaMedias = e(Painel,{t:"Médias e distribuições", ic:"chart-bar"},
    d.medias.length ? d.medias.map(function(m){ return e(LinhaBarra,{key:m.perguntaId, t:m.texto, v:formatarNota(m.media), sub:"("+m.n+")", pct:percentualDaNota(m.media, m.max), cor:corNota(m.media, m.max, cfg)}); }) : e(Vazio,{ic:"chart-bar"}, "Sem notas ainda."),
    d.distribuicoes.map(function(x){ return e("div",{key:x.perguntaId, className:"flex flex-col gap-1.5 border-t border-white/10 pt-2"}, e("b",{className:"text-[12.5px]"}, cap(x.texto)),
      x.opcoes.map(function(o){ return e(LinhaBarra,{key:o.opcao, t:o.opcao, v:o.count, pct:x.total ? o.count/x.total*100 : 0}); })); }));
  var colunaTexto = e(Painel,{t:"Comentários", ic:"chat-circle-text"},
    d.comentarios.length ? d.comentarios.map(function(c, i){ return e("div",{key:i, className:"flex flex-col items-center gap-0.5 rounded-lg bg-black/20 p-2 text-[12.5px] ring-1 ring-white/10"},
      e("span",{className:"text-[11px] text-white/60"}, formatarDia(c.em)+" · "+c.revNome+" · "+c.pergunta), e("span",{className:"italic"}, "“"+c.texto+"”")); }) : e(Vazio,{ic:"chat-circle"}, "Nenhum comentário registrado."),
    d.historico.length ? e("div",{className:"border-t border-white/10 pt-2"}, e("b",{className:"text-[12.5px]"}, "Histórico mensal"),
      e(Tab,{cols:["Mês", "Nota"]}, d.historico.map(function(h){ var n = notaDoMes(h.medias, info); return e("tr",{key:h.mes, className:LINHA}, e(Td,{forte:true}, formatarMes(h.mes)), e(Td,{dinheiro:true, forte:true, cor:corNota(n, 5, cfg)}, formatarNota(n))); }))) : null);
  var colunaLista = e(Painel,{t:"Avaliações recebidas", ic:"list-checks"},
    d.avaliacoes.length ? d.avaliacoes.map(function(c){
      return e(Cartao,{key:c.id, c:c, cfg:cfg}, a.dir && e("div",{className:"flex justify-center"}, conf===c.id
        ? e(BtMini,{titulo:"Confirmar a exclusão", onClick:function(){ a.agir({op:"resp_del", id:c.id}); st[1](null); }}, e(Ph,{n:"trash", s:12}), "Confirmar exclusão")
        : e(BtMini,{titulo:"Excluir avaliação", onClick:function(){ st[1](c.id); }}, e(Ph,{n:"trash", s:12}), "Excluir"))); }) : e(Vazio,{ic:"star"}, "Nenhuma avaliação recebida."));
  return e(Janela,{t:d.nome, sub:d.total+(d.total===1 ? " avaliação" : " avaliações")+" · nota geral "+formatarNota(d.mediaGeral), fechar:p.fechar, tam:"xl"},
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}),
    e(Colunas,{n:3}, colunaMedias, colunaTexto, colunaLista));
}

// ---------- lançar avaliação (manual) ----------
function LancarAvaliacao(p){
  var a = useAv(), s0 = useState(""), s1 = useState(p.rep || ""), s2 = useState(""), s3 = useState(hojeSP()), s4 = useState({});
  var rev = s0[0], rep = s1[0], kit = s2[0], dia = s3[0], resp = s4[0];
  var qRep = rep ? avPerguntas(a.s, "representante") : [], qKit = avPerguntas(a.s, "kit");
  var muda = function(id, v){ var n = Object.assign({}, resp); n[id] = v; s4[1](n); };
  var enviar = function(){
    var rs = [];
    qRep.concat(qKit).forEach(function(q){ var v = resp[q.id]; if(!v) return;
      if(q.tipo==="estrela5" || q.tipo==="nota10"){ if(v.num!=null) rs.push({perguntaId:q.id, valorNumerico:v.num}); }
      else if(v.txt && String(v.txt).trim()) rs.push({perguntaId:q.id, valorTexto:v.txt}); });
    if(a.agir({op:"resp_add", revNome:rev, repNome:rep, kit:kit, enviadaEm:dia===hojeSP() ? undefined : dia+"T12:00:00", respostas:rs})) p.fechar();
  };
  var bloco = function(t, ic, lista, vazio){ return e(Painel,{t:t, ic:ic}, lista.length ? lista.map(function(q){ return e(Entrada,{key:q.id, q:q, valor:resp[q.id], set:function(v){ muda(q.id, v); }}); }) : e(Vazio,{ic:ic}, vazio)); };
  return e(Janela,{t:"Lançar avaliação", sub:"Registro manual de uma avaliação de revendedora", fechar:p.fechar, tam:"xl"},
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}),
    e(Colunas,{n:3},
      e(Painel,{t:"Identificação", ic:"identification-card", estado:rev.trim() ? "feito" : "atual"},
        e(Campo,{r:"Revendedora"}, e(Texto,{v:rev, set:s0[1], ph:"Nome da revendedora", max:120})),
        e(Campo,{r:"Representante"}, e("div",{className:"flex flex-wrap justify-center gap-1"},
          a.reps.map(function(r){ return e(Escolha,{key:r, on:rep===r, onClick:function(){ s1[1](rep===r ? "" : r); }}, r); }))),
        e(Campo,{r:"Kit (opcional)"}, e(Texto,{v:kit, set:s2[1], ph:"Número ou nome do kit", max:80})),
        e(Campo,{r:"Data"}, e(Texto,{tipo:"date", v:dia, set:s3[1], ph:"Data"}))),
      bloco("Sobre a representante", "user-circle", qRep, rep ? "Nenhuma pergunta ativa para a representante." : "Escolha a representante para responder."),
      bloco("Sobre o kit", "package", qKit, "Nenhuma pergunta ativa para o kit.")),
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"paper-plane-tilt", onClick:enviar}, "Lançar avaliação")));
}

// ---------- revendedoras que avaliaram ----------
function RevendedorasQueAvaliaram(p){
  var a = useAv(), sb = useState(""), ss = useState(null), cfg = a.av.config;
  var lista = avRevendedoras(a.s, sb[0]), det = ss[0]!=null ? avRevendedoraDetalhe(a.s, ss[0]) : null;
  return e(Janela,{t:"Revendedoras que avaliaram", sub:avRevendedoras(a.s, "").length+" revendedoras com avaliação", fechar:p.fechar, tam:"lg"},
    e(Colunas,{n:2},
      e(Painel,{t:"Revendedoras", ic:"users"}, e(Busca,{v:sb[0], set:sb[1], ph:"Buscar revendedora"}),
        lista.length ? lista.map(function(r){ var k = r.revId || r.revNome;
          return e("button",{key:k, type:"button", onClick:function(){ ss[1](k); }, className:"flex flex-wrap items-center justify-center gap-x-3 rounded-lg px-2 py-1.5 text-[13px] ring-1 hover:bg-white/10 "+(ss[0]===k ? "bg-white/10 ring-[#F97316]" : "bg-white/5 ring-white/10")},
            e("b",null, r.revNome), e(Nota,{v:r.notaMedia, cor:corNota(r.notaMedia, 5, cfg)}), e("span",{className:"text-[11.5px] text-white/60"}, r.avaliacoes+" · "+formatarDia(r.ultimaEm))); })
          : e(Vazio,{ic:"users"}, "Nenhuma revendedora avaliou até o momento.")),
      e(Painel,{t:det ? det.revNome : "Avaliações", ic:"star"},
        det ? det.cartoes.map(function(c){ return e(Cartao,{key:c.id, c:c, cfg:cfg}); }) : e(Vazio,{ic:"hand-pointing"}, "Selecione uma revendedora."))));
}

// ---------- aba: Representantes (pelas revendedoras) ----------
function AbaAvRepsRev(){
  var a = useAv(), sb = useState(""), sj = useState(null), cfg = a.av.config;
  var todas = avRepresentantes(a.s, a.reps), b = sb[0].trim().toLowerCase();
  var lista = todas.filter(function(r){ return !b || r.nome.toLowerCase().indexOf(b)>=0; });
  var com = todas.filter(function(r){ return r.mediaGeral!=null; }), total = todas.reduce(function(t, r){ return t+r.totalAvaliacoes; }, 0);
  var media = com.length ? com.reduce(function(t, r){ return t+r.mediaGeral; }, 0)/com.length : null;
  var abre = function(j){ sj[1](j); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:3}, e(Indicador,{t:"Representantes", v:todas.length, cor:"total"}), e(Indicador,{t:"Avaliações recebidas", v:total, cor:"info"}), e(Indicador,{t:"Média das representantes", v:formatarNota(media), cor:corNota(media, 5, cfg)})),
    e(BarraFiltros,null, e(Busca,{v:sb[0], set:sb[1], ph:"Buscar representante"}),
      e(Bt,{tipo:"forte", ic:"plus-circle", className:"h-9 py-0!", onClick:function(){ abre({t:"lancar"}); }}, "Lançar avaliação"),
      e(Bt,{ic:"users", className:"h-9 py-0!", onClick:function(){ abre({t:"revs"}); }}, "Revendedoras que avaliaram")),
    lista.length ? e(Mosaico,{min:"15rem"}, lista.map(function(r){
      var c = corNota(r.mediaGeral, 5, cfg);
      return e("button",{key:r.nome, type:"button", onClick:function(){ abre({t:"rep", nome:r.nome}); }, title:"Abrir o detalhe", className:"flex w-full flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition hover:brightness-125",
          style:{background:"linear-gradient(135deg,"+c+"30,"+c+"0d 78%)", boxShadow:"inset 0 0 0 1px "+c+"44"}},
        e("b",{className:"text-[14px]"}, r.nome), e("b",{className:MONO+" text-[19px] leading-none", style:{color:c}}, formatarNota(r.mediaGeral)),
        e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, r.totalAvaliacoes+(r.totalAvaliacoes===1 ? " avaliação" : " avaliações")),
        e("div",{className:"w-full"}, e("div",{className:"h-1.5 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:percentualDaNota(r.mediaGeral, 5)+"%", background:c}})))); }))
      : e(Vazio,{ic:"user-list"}, todas.length ? "Nenhuma representante encontrada." : "Nenhuma representante cadastrada."),
    sj[0] && sj[0].t==="rep" && e(DetalheRep,{nome:sj[0].nome, fechar:function(){ sj[1](null); }}),
    sj[0] && sj[0].t==="lancar" && e(LancarAvaliacao,{fechar:function(){ sj[1](null); }}),
    sj[0] && sj[0].t==="revs" && e(RevendedorasQueAvaliaram,{fechar:function(){ sj[1](null); }}));
}

// ---------- aba: Representantes (pelo sistema) ----------
function AbaAvRepsSis(){
  var a = useAv(), cfg = a.av.config;
  var linhas = a.reps.map(function(r){ return avPainelRep(a.s, r); });
  var dif = function(x){ return x==null ? "—" : (x>0 ? "+" : x<0 ? "−" : "")+formatarNota(Math.abs(x)); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BlocoBarra,{cor:"laranja", t:"Revendedoras e sistema, lado a lado", sub:"Nota das revendedoras e nota calculada pelo sistema (com recusas e dias parados)", compacto:true},
      linhas.length ? e("div",{className:"p-1.5"}, e(Tab,{cols:["Representante", "Avaliações das revendedoras", "Nota das revendedoras", "Nota do sistema", "Diferença"]}, linhas.map(function(l){
        return e("tr",{key:l.nome, className:LINHA}, e(Td,{forte:true}, l.nome), e(Td,{dinheiro:true}, l.revendedoras.total),
          e(Td,{dinheiro:true, forte:true, cor:corNota(l.revendedoras.nota, 5, cfg)}, formatarNota(l.revendedoras.nota)),
          e(Td,{dinheiro:true, forte:true, cor:corNota(l.sistema.pontos, 5, cfg)}, formatarNota(l.sistema.pontos)),
          e(Td,{dinheiro:true, cor:l.diferenca==null ? "neutro" : Math.abs(l.diferenca)>=0.5 ? "alerta" : "ok"}, dif(l.diferenca))); }))) : e(Vazio,{ic:"user-list"}, "Nenhuma representante cadastrada.")),
    // a tela existente traz o próprio título; aqui o título da aba já explica, então o primeiro bloco (cabeçalho) fica escondido
    e("div",{className:"flex flex-col gap-2.5 [&>div:first-child]:hidden"}, e(AbaAvalRep,null)));
}

export { AbaAvRepsRev, AbaAvRepsSis, DetalheRep, LancarAvaliacao, RevendedorasQueAvaliaram };
