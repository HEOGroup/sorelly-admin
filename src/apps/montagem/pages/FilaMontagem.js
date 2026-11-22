// Sorelly Admin · montagem — pages/FilaMontagem.js
// Kits › Fila de montagem (migrada do admin antigo em 18/11/2026; servidor em src/server/montagem-kit.js).
// Em cima: os kits das listagens abertas (montando agora e os próximos); clicar abre a janela de montar da própria listagem.
// Depois: TODAS as revendedoras do app com o resumo das preferências do kit, pendentes primeiro ("já montado" = montagem concluída depois da
// última atualização das preferências; se ela atualizar de novo, volta a pendente). Clicar abre a área de montar (pages/fila-montagem/Montar.js).
// Embaixo: os últimos registros de montagem. Filtro e ordem no nome de cada coluna (TabelaPlanilha). Dinheiro só para a supervisão e a diretoria.
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Aviso, Botao, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { AnaliseGeral } from "@/apps/montagem/pages/fila-montagem/Analise";
import { MontarKit } from "@/apps/montagem/pages/fila-montagem/Montar";
import { SemServidor, dataBR, dataHoraBR, diaSP, duracao, horaSP, pct, useServidor, veDinheiro } from "@/apps/montagem/pages/fila-montagem/comum";
import { CampoDin } from "@/apps/montagem/pages/trafego/comum";
import { e, useEffect, useMemo, useState } from "@/shared/react";

// botão pequeno de contorno branco para a barra azul, igual ao da tela Listagens
var BTN_BARRA = "inline-flex h-7 items-center justify-center whitespace-nowrap rounded-md border border-white/50 bg-[#14233f] px-2.5 text-[13px] font-semibold normal-case text-white hover:bg-white/15";   // padrao-ok: controle de 28 px na barra azul, como a Listagens e o Contas a pagar (Marcus aprovou 28 px em 16/11/2026)
var VERDE = "text-emerald-400", AMARELO = "text-amber-300";
var SIT = {pendente:"Pendente", montado:"Já montado", sem:"Sem preferências"};
var COR_SIT = {pendente:AMARELO+" font-semibold", montado:VERDE+" font-semibold", sem:""};

// Nome em letra normal (Marcus, 19/11/2026: nada em caixa alta): "MIRYANNE DO ROCIO" vira "Miryanne do Rocio"; de, da, do, das, dos e e ficam em minúscula
var LIGA = {de:1, da:1, do:1, das:1, dos:1, e:1};
function nomeBonito(t){
  return String(t || "").trim().toLowerCase().split(/\s+/).map(function(w, i){ return w && (i>0 && LIGA[w] ? w : w.charAt(0).toUpperCase()+w.slice(1)); }).join(" ");
}

// linhas da tabela de revendedoras: pendentes primeiro, depois as que atualizaram por último (como no admin antigo)
function linhasRevendedoras(lista){
  var ordem = {pendente:0, montado:1, sem:2};
  return (lista || []).map(function(r){ var sit = !r.temPreferencias ? "sem" : r.jaMontado ? "montado" : "pendente";
    return {id:r.id, nome:nomeBonito(r.nome), sitK:sit, sit:SIT[sit], cidade:nomeBonito(r.cidade), estado:r.estado || "", telefone:r.telefone || "", at:r.atualizadoEm || "",
      dia:diaSP(r.atualizadoEm), hora:horaSP(r.atualizadoEm), categorias:r.categorias || 0, ouro:r.ouro, prata:r.prata, montagem:diaSP(r.ultimaMontagem)}; })
    .sort(function(a, b){ return ordem[a.sitK]-ordem[b.sitK] || (a.at<b.at ? 1 : a.at>b.at ? -1 : 0) || a.nome.localeCompare(b.nome, "pt-BR"); });
}

// supervisão completa o valor do kit de um registro feito sem valor (a montadora não vê dinheiro)
function JanelaValor(p){
  var sv = useState(null), se = useState(""), sg = useState(false);
  var salvar = function(){
    if(sv[0]==null){ se[1]("Informe o valor do kit."); return; }
    sg[1](true);
    chamar("PATCH", "/montagem/registros/"+p.reg.id, {valorKit:sv[0]}).then(function(){ p.salvo(); }).catch(function(x){ se[1](x.message || "Não foi possível salvar."); sg[1](false); });
  };
  return e(Janela,{t:"Valor do kit", sub:p.reg.resellerNome+", montado por "+p.reg.staffNome+" em "+dataHoraBR(p.reg.concluidoEm)+".", fechar:p.fechar,
    colunas:[e("div",{key:"v", className:"col-span-full mx-auto w-full max-w-xs"}, e(CampoDin,{t:"Valor do kit", id:"fmValor", value:sv[0], onChange:sv[1]}), se[0] && e("div",{className:"pt-2"}, e(Aviso,{tom:"vermelho"}, se[0])))],
    rodape:[e(Botao,{key:"c", onClick:p.fechar}, "Cancelar"), e(Botao,{key:"s", principal:true, desabilitado:sg[0], onClick:salvar}, "Salvar valor")]});
}

function AbaFilaMontagem(){
  var cx = use(), s = cx.state, dinheiro = veDinheiro(s);
  var sq = useState(""), fila = useServidor(apiAtiva() ? "/montagem/fila"+sq[0] : ""), regs = useServidor(apiAtiva() ? "/montagem/registros?page=1&pageSize=10" : "");
  var ssel = useState(null), sel = ssel[0], san = useState(false), sv = useState(null);
  var revs = useMemo(function(){ return linhasRevendedoras(fila.dados && fila.dados.revendedoras); }, [fila.dados]);
  var atualizar = function(){ if(sq[0]) fila.recarregar(); else sq[1]("?atualizar=1"); };
  // primeira leitura completa do app em andamento: pergunta de novo a cada 5 s até terminar
  var lendo = !!(fila.dados && fila.dados.lendoApp);
  useEffect(function(){ if(!lendo) return undefined; var t = setTimeout(fila.recarregar, 5000); return function(){ clearTimeout(t); }; }, [lendo, fila.dados]);   // eslint-disable-line react-hooks/exhaustive-deps -- fila.recarregar muda a cada render
  var voltar = function(registrou){ ssel[1](null); if(registrou){ fila.recarregar(); regs.recarregar(); } };

  if(sel) return e(Pagina,null, e(MontarKit,{key:sel, id:sel, voltar:voltar}));

  var dados = fila.dados;
  var sub = !apiAtiva() ? "Sem servidor ligado."
    : fila.erro ? "Não foi possível ler as revendedoras: "+fila.erro
    : !dados ? "Lendo as revendedoras do app…"
    : dados.lendoApp ? "Lendo todas as revendedoras do app; a lista completa aparece em alguns minutos."
    : "";
  var colsReg = [{k:"rev", t:"Revendedora"}, {k:"quem", t:"Montado por"}].concat(dinheiro ? [{k:"valor", t:"Valor do kit", fmt:function(v){ return v>0 ? brl(v) : "A definir"; },
      render:function(v, l){ return v>0 ? brl(v) : e(Botao,{onClick:function(ev){ ev.stopPropagation(); sv[1](l.reg); }}, "Definir valor"); }}] : [],
    [{k:"prefs", t:"Preferências"}, {k:"dur", t:"Duração"}, {k:"dia", t:"Concluído em", data:true, fmt:dataBR}, {k:"hora", t:"Hora"}]);
  var linhasReg = ((regs.dados && regs.dados.data) || []).map(function(r){ return {id:r.id, reg:r, rev:nomeBonito(r.resellerNome), quem:nomeBonito(r.staffNome), valor:r.valorKit, prefs:r.usouPreferencias ? "Sim" : "Não",
    dur:duracao(Date.parse(r.concluidoEm)-Date.parse(r.iniciadoEm)), dia:diaSP(r.concluidoEm), hora:horaSP(r.concluidoEm)}; });

  // 100% igual à tela Listagens (Marcus, 19/11/2026): sem título grande no topo, blocos com barra azul, botões dentro da barra, tabelas finas
  var botoes = apiAtiva() ? e("div",{className:"flex items-center gap-1.5"},
    e("button",{type:"button", className:BTN_BARRA, disabled:fila.carregando, onClick:atualizar}, fila.carregando ? "Lendo o app…" : "Atualizar do app"),
    e("button",{type:"button", className:BTN_BARRA, onClick:function(){ san[1](true); }}, "Análise geral")) : null;
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    !apiAtiva() && e(SemServidor,null),
    sub && e("p",{className:"px-3 py-1 text-center text-[13px]"}, sub),
    apiAtiva() && e(BlocoPainel,{titulo:"Fila de montagem", compacto:true, alta:true, dir:botoes},
      e(TabelaPlanilha,{fina:true, grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true, limite:100, paginas:true, aoClicar:function(l){ ssel[1](l.id); }, vazio:dados ? "Nenhuma revendedora no app." : "Lendo…",
        cols:[{k:"sit", t:"Situação", cor:function(l){ return COR_SIT[l.sitK]; }}, {k:"nome", t:"Revendedora"}, {k:"cidade", t:"Cidade"}, {k:"estado", t:"UF"}, {k:"telefone", t:"Telefone"},
          {k:"dia", t:"Atualização", data:true, fmt:dataBR}, {k:"hora", t:"Hora"}, {k:"categorias", t:"Categorias"}, {k:"ouro", t:"Ouro", fmt:pct}, {k:"prata", t:"Prata", fmt:pct},
          {k:"montagem", t:"Última montagem", data:true, fmt:dataBR}],
        linhas:revs})),
    apiAtiva() && e(BlocoPainel,{titulo:"Últimos registros de montagem", compacto:true, alta:true},
      e(TabelaPlanilha,{fina:true, grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true, cols:colsReg, linhas:linhasReg, vazio:regs.carregando ? "Lendo…" : "Nenhuma montagem registrada ainda."})),
    san[0] && e(AnaliseGeral,{fechar:function(){ san[1](false); }}),
    sv[0] && e(JanelaValor,{reg:sv[0], fechar:function(){ sv[1](null); }, salvo:function(){ sv[1](null); regs.recarregar(); }}));
}

export { AbaFilaMontagem };
