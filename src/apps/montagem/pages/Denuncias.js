// Sorelly Admin · montagem — pages/Denuncias.js
// RH › Canal de denúncias (17/11/2026, Maria (RH) e Marcus, plano da NR-1): lista das denúncias enviadas pelo formulário público /canal-de-etica.
// ACESSO RESTRITO aos sócios e à Maria (RH): o servidor confere o pessoaId da conta (src/server/denuncias.js) e o menu esconde a tela das demais pessoas.
// Os dados NÃO ficam no estado do sistema nem no navegador: são lidos do servidor a cada abertura. Padrão azul do Financeiro.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { chamar } from "@/apps/montagem/lib/api";
import { Bt, Campo, Janela, Painel, Selo } from "@/apps/montagem/pages/compras/pecas";
import { use } from "@/apps/montagem/state/context";
import { e, useCallback, useEffect, useState } from "@/shared/react";

var SITUACOES = [["nova", "Nova"], ["analise", "Em análise"], ["concluida", "Concluída"]];
var COR_SIT = {nova:"alerta", analise:"info", concluida:"ok"};
var rotulo = function(k){ var x = SITUACOES.find(function(s){ return s[0]===k; }); return x ? x[1] : k; };
var dataHora = function(iso){ if(!iso) return "—"; var d = new Date(iso); if(isNaN(d)) return "—"; var z = function(n){ return (n<10 ? "0" : "")+n; }; return z(d.getDate())+"/"+z(d.getMonth()+1)+"/"+d.getFullYear()+" "+z(d.getHours())+":"+z(d.getMinutes()); };
var vazio = function(t){ return t ? t : "—"; };

// bloco de texto da janela: título pequeno e o texto inteiro (quebra de linha preservada)
function Texto(p){
  return e("div",{className:"rounded-md border border-white/20 px-2 py-1 text-left"},
    e("span",{className:"block text-[11px] font-semibold uppercase"}, p.t), e("span",{className:"whitespace-pre-wrap break-words text-[13px]"}, vazio(p.v)));
}

function Ficha(p){
  var x = p.x, st = useState(x.situacao), sit = st[0], nt = useState(x.nota || ""), nota = nt[0], rs = useState(x.resposta || ""), resp = rs[0], ocup = useState(false);
  var mudou = sit!==x.situacao || nota!==(x.nota || "") || resp!==(x.resposta || "");
  var salvar = function(){ ocup[1](true); var patch = {situacao:sit, nota:nota}; if(resp!==(x.resposta || "")) patch.resposta = resp; p.salvar(x.id, patch).then(function(){ ocup[1](false); }); };
  var relato = e(Painel,{key:"relato", t:"Relato · "+x.protocolo, ic:"shield-check"},
    e("div",{className:"flex flex-col gap-1.5"},
      e(Texto,{t:"Motivo", v:x.categoria}), e(Texto,{t:"Descrição do ocorrido", v:x.relato}), e(Texto,{t:"Pessoas envolvidas", v:x.envolvidos}), e(Texto,{t:"Envolve sócio ou a direção", v:x.envolve_direcao}), e(Texto,{t:"Testemunhas", v:x.testemunhas})));
  var contexto = e(Painel,{key:"contexto", t:"Contexto", ic:"file-text"},
    e("div",{className:"flex flex-col gap-1.5"},
      e(Texto,{t:"Recebida em", v:dataHora(x.criado_em)}), e(Texto,{t:"Setor", v:x.setor}), e(Texto,{t:"Relação com o ocorrido", v:x.relacao}), e(Texto,{t:"Frequência", v:x.frequencia}),
      e(Texto,{t:"Quando ocorreu", v:x.periodo}), e(Texto,{t:"Evidência", v:x.evidencia}), e(Texto,{t:"Risco imediato", v:x.risco}),
      e(Texto,{t:"Identificação", v:x.identificado ? "Quer ser contatada: "+vazio(x.contato) : "Anônima"})));
  var andamento = e(Painel,{key:"andamento", t:"Andamento", ic:"clock"},
    e("div",{className:"flex flex-col gap-1.5"},
      e(Campo,{rot:"Situação"}, e("select",{value:sit, "aria-label":"Situação", onChange:function(ev){ st[1](ev.target.value); }, className:CAMPO}, SITUACOES.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
      e(Campo,{rot:"Resposta ao denunciante"}, e("textarea",{value:resp, "aria-label":"Resposta ao denunciante", rows:4, maxLength:2000, placeholder:"Aparece para quem consultar o protocolo. Sem nomes nem detalhes.", onChange:function(ev){ rs[1](ev.target.value); }, className:CAMPO+" h-auto min-h-20 py-1.5"})),
      e(Campo,{rot:"Nota interna (só a diretoria vê)"}, e("textarea",{value:nota, "aria-label":"Nota interna", rows:8, maxLength:6000, placeholder:"O que foi apurado e decidido", onChange:function(ev){ nt[1](ev.target.value); }, className:CAMPO+" h-auto min-h-32 py-1.5"})),
      x.atualizado_em && e("span",{className:"text-[11px]"}, "Última mudança: "+dataHora(x.atualizado_em)+" · "+vazio(x.atualizado_por)),
      e(Bt,{tipo:"forte", disabled:!mudou || ocup[0], onClick:salvar}, ocup[0] ? "Salvando andamento" : "Salvar andamento")));
  return e(Janela,{t:"Canal de denúncias", sub:x.protocolo+" · "+x.categoria, fechar:p.fechar, colunas:[relato, contexto, andamento]});
}

function AbaDenuncias(){
  var cx = use(), s = cx.state, d = cx.dispatch, lista = useState(null), itens = lista[0], er = useState(""), erroTxt = er[0], ab = useState(null), aberta = ab[0];
  var aviso = function(t, tom){ d({type:"AVISO", txt:t, tom:tom || "alerta"}); };
  var carregar = useCallback(function(){
    return chamar("GET", "/denuncias").then(function(j){ lista[1](j.denuncias || []); er[1](""); }).catch(function(x){ er[1](x && x.message || "Não consegui abrir o canal de denúncias."); });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ carregar(); }, [carregar]);
  // abriu a tela = leu: os alertas "Nova denúncia" pendentes desta pessoa somem (18/11/2026: o alerta não parava de subir)
  useEffect(function(){
    if(!itens) return;
    (s.alertas||[]).filter(function(a){ return a.tipo==="denuncia_nova" && (a.para||[]).indexOf(s.usuario)>=0 && (a.lidoPor||[]).indexOf(s.usuario)<0; }).forEach(function(a){ d({type:"ALERTA_LIDO", id:a.id, usuario:s.usuario}); });
  }, [itens]);   // eslint-disable-line react-hooks/exhaustive-deps
  var salvar = function(id, patch){
    return chamar("PATCH", "/denuncias/"+id, patch).then(function(){ aviso("Andamento salvo", "ok"); return carregar(); }).catch(function(x){ aviso(x && x.message || "Não consegui salvar."); });
  };
  var copiarLink = function(){
    var link = window.location.origin+"/canal-de-etica";
    try{ navigator.clipboard.writeText(link).then(function(){ aviso("Link do canal copiado", "ok"); }, function(){ aviso("Não consegui copiar o link."); }); }catch(x){ aviso("Não consegui copiar o link."); }
  };

  var linhas = (itens || []).map(function(x){ return {id:String(x.id), x:x, protocolo:x.protocolo, recebida:dataHora(x.criado_em), motivo:x.categoria, setor:vazio(x.setor), relacao:vazio(x.relacao), frequencia:vazio(x.frequencia), risco:vazio(x.risco), direcao:vazio(x.envolve_direcao), ident:x.identificado ? "Quer contato" : "Anônima", sit:rotulo(x.situacao)}; });
  var cols = [{k:"protocolo", t:"Protocolo"}, {k:"recebida", t:"Recebida"}, {k:"motivo", t:"Motivo"}, {k:"setor", t:"Setor"}, {k:"relacao", t:"Relação"}, {k:"frequencia", t:"Frequência"}, {k:"risco", t:"Risco imediato"}, {k:"direcao", t:"Envolve a direção"}, {k:"ident", t:"Identificação"},
    {k:"sit", t:"Situação", render:function(v, l){ return e(Selo,{cor:COR_SIT[l.x.situacao] || "neutro"}, v); }}];
  var novas = (itens || []).filter(function(x){ return x.situacao==="nova"; }).length;

  var topo = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "Canal de denúncias"),
    e("span",{className:"ml-auto whitespace-nowrap text-[13px] tabular-nums"}, itens ? novas+" novas de "+itens.length : ""),
    e(Bt,{tipo:"normal", onClick:copiarLink}, "Copiar link do canal"));
  var ficha = aberta && (itens || []).find(function(x){ return String(x.id)===aberta; });

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    erroTxt
      ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, erroTxt)
      : e(BlocoPainel,{titulo:"Denúncias recebidas", compacto:true},
          e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, aoClicar:function(l){ ab[1](l.id); }, vazio:itens ? "Nenhuma denúncia recebida." : "Carregando denúncias."}))),
    ficha && e(Ficha,{x:ficha, salvar:salvar, fechar:function(){ ab[1](null); }}));
}

export { AbaDenuncias };
