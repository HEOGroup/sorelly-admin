// Sorelly Admin · montagem — pages/fila-montagem/Montar.js
// Área de montar da Fila de montagem (era /projetos/montagem/montar/:id no admin antigo, migrada em 18/11/2026).
// Mostra a revendedora e as preferências dela bloco a bloco (lidas AGORA do app), com OK por bloco e o modo compacto.
// "Iniciar montagem" marca o horário (fica neste navegador até concluir); abrir a tela não inicia nada. Depois de 2 minutos sem iniciar aparece um lembrete.
// "Concluir montagem" registra quem montou (equipe ativa), o valor do kit (só a supervisão vê e digita), início, término e se usou as preferências.
import { Janela, Mosaico } from "@/apps/montagem/components/padrao";
import { Aviso, Bloco, Botao, CampoSel, Rotulo, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { Fotos } from "@/apps/montagem/components/fotos-pref";
import { pkBlocos, pkExibirResposta } from "@/apps/montagem/domain/preferencias-kit";
import { chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { BarraMetal, Bolinha, MCOR } from "@/apps/montagem/pages/preferencias-kit/visual";
import { CampoDin, CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { dataHoraBR, duracao, gravarInicio, horaSP, isoDeHora, lerInicio, relogio, useServidor, veDinheiro } from "@/apps/montagem/pages/fila-montagem/comum";
import { e, useEffect, useState } from "@/shared/react";

var VERDE = "#4ADE80", VERMELHO = "#F87171", AMARELO = "#FBBF24";
var CH_COMPACTO = "sorelly_montar_compacto";
var horaAgora = function(){ return horaSP(new Date().toISOString()); };

// rótulo à esquerda e valor à direita, numa linha baixa
function Linha(p){
  return e("div",{className:"flex items-center justify-between gap-3 border-b border-border py-1 text-[13px] last:border-b-0"},
    e("span",{className:"font-semibold"}, p.r), e("span",{className:"text-right tabular-nums", style:p.cor ? {color:p.cor} : undefined}, p.children));
}

// resposta de um bloco, no formato do app (contas em domain/preferencias-kit.js)
function Resposta(p){
  var b = p.b, x = pkExibirResposta(b, p.r);
  if(x.vazio) return e("p",{className:"py-1 text-center text-[13px]"}, "Sem resposta.");
  var itens = [];
  if(x.vende!==null) itens.push(e(Linha,{key:"v", r:"Disponibilidade", cor:x.vende ? VERDE : VERMELHO}, x.vende ? "Vende" : "Não vende"));
  if(x.ouroPct!=null) itens.push(e("div",{key:"m", className:"py-1"}, e(BarraMetal,{ouro:x.ouroPct})));
  x.linhas.forEach(function(l, i){
    var valor = l.valores.length
      ? e("span",{className:"inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5"}, l.valores.map(function(v, j){ var hex = l.hex && l.hex[j]; return e("span",{key:j, className:"inline-flex items-center gap-1"}, hex && e(Bolinha,{cor:hex, s:11}), v); }))
      : l.vende!=null ? (l.vende ? (l.metal || "Vende") : "Não vende") : (l.metal || "");
    var cor = l.vende===false ? VERMELHO : (l.metal ? MCOR[l.metal] : undefined);
    itens.push(e(Linha,{key:i, r:l.rotulo, cor:cor}, valor));
  });
  if(b.type==="letras") itens.push(e(Linha,{key:"n", r:"Letras escolhidas"}, x.linhas.length+" de "+(b.maxLetters || 26)));
  if(x.imagens.length) itens.push(e("div",{key:"f", className:"pt-1.5"}, e(Fotos,{lista:x.imagens})));
  return e("div",null, itens);
}

// janela de concluir: quem montou, valor, horários e se usou as preferências; depois mostra o resumo do que foi registrado
function ConcluirMontagem(p){
  var dinheiro = p.dinheiro, ativos = (p.equipe || []).filter(function(x){ return x.active; });
  var sf = useState({quem:"", valor:null, ini:p.inicio ? horaSP(p.inicio) : horaAgora(), fim:horaAgora(), usou:p.temPrefs ? "sim" : "nao"}), f = sf[0];
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; sf[1](o); };
  var se = useState(""), sv = useState(false), sr = useState(null), st = useState(Date.now()), resumo = sr[0];
  useEffect(function(){ if(!p.inicio || resumo) return undefined; var t = setInterval(function(){ st[1](Date.now()); }, 1000); return function(){ clearInterval(t); }; }, [p.inicio, resumo]);   // eslint-disable-line react-hooks/exhaustive-deps -- st é estado fixo
  var confirmar = function(){
    if(!f.quem){ se[1]("Selecione quem montou o kit."); return; }
    if(dinheiro && f.valor==null){ se[1]("Informe o valor do kit."); return; }
    var ini, fim;
    if(p.inicio){ ini = p.inicio; fim = new Date().toISOString(); }
    else {
      if(!f.ini || !f.fim){ se[1]("Informe o horário de início e término."); return; }
      ini = isoDeHora(f.ini); fim = isoDeHora(f.fim);
      if(fim < ini){ se[1]("O horário de término não pode ser antes do início."); return; }
    }
    sv[1](true); se[1]("");
    chamar("POST", "/montagem/registros", {resellerId:p.rev.id, resellerNome:p.rev.nome, staffNome:f.quem, iniciadoEm:ini, concluidoEm:fim, valorKit:dinheiro ? f.valor : 0, usouPreferencias:f.usou==="sim"})
      .then(function(r){ gravarInicio(p.rev.id, null); sr[1](r); })
      .catch(function(x){ se[1](x.message || "Não foi possível registrar a montagem."); })
      .finally(function(){ sv[1](false); });
  };
  if(resumo) return e(Janela,{t:"Montagem registrada", sub:"Kit de "+p.rev.nome+" registrado na Fila de montagem.", fechar:p.concluido,
    colunas:[e(Bloco,{key:"r", t:"Resumo", cls:"col-span-full"},
      e(Linha,{r:"Montado por"}, resumo.staffNome),
      dinheiro && e(Linha,{r:"Valor do kit"}, brl(resumo.valorKit)),
      e(Linha,{r:"Duração"}, duracao(Date.parse(resumo.concluidoEm)-Date.parse(resumo.iniciadoEm))),
      e(Linha,{r:"Usou as preferências"}, resumo.usouPreferencias ? "Sim" : "Não"))],
    rodape:[e(Botao,{key:"v", principal:true, onClick:p.concluido}, "Voltar para a fila")]});
  return e(Janela,{t:"Concluir montagem", sub:"Kit de "+p.rev.nome+": quem montou, valor do kit, início e término.", fechar:p.fechar,
    colunas:[e("div",{key:"f", className:"col-span-full grid gap-2.5 sm:grid-cols-2"},
      e(CampoSel,{t:"Quem montou", id:"cmQuem", value:f.quem, onChange:function(v){ set("quem", v); }, opcoes:[["", ativos.length ? "Selecione a colaboradora" : "Nenhuma colaboradora ativa"]].concat(ativos.map(function(x){ return [x.name, x.name]; }))}),
      dinheiro ? e(CampoDin,{t:"Valor do kit", id:"cmValor", value:f.valor, onChange:function(v){ set("valor", v); }})
        : e("div",{className:"min-w-0"}, e(Rotulo,{t:"Valor do kit"}), e("p",{className:"flex h-8 items-center text-[13px]"}, "A supervisão informa depois.")),
      p.inicio
        ? e("div",{className:"col-span-full flex h-8 items-center justify-between rounded-md border border-border px-3 text-[13px]"}, e("span",null, "Início às "+horaSP(p.inicio)+", cronômetro em andamento"), e("b",{className:"tabular-nums", style:{color:VERDE}}, relogio(st[0]-Date.parse(p.inicio))))
        : e(CampoTexto,{t:"Início", id:"cmIni", tipo:"time", value:f.ini, onChange:function(v){ set("ini", v); }}),
      !p.inicio && e(CampoTexto,{t:"Término", id:"cmFim", tipo:"time", value:f.fim, onChange:function(v){ set("fim", v); }}),
      !p.inicio && e("p",{className:"col-span-full text-[13px]"}, "O cronômetro não foi iniciado: informe os horários de hoje."),
      e("div",{className:"col-span-full flex flex-wrap items-center justify-between gap-2"}, e("span",{className:"text-[13px] font-semibold"}, "Usou as preferências do app?"),
        e(Segmentado,{opcoes:[["sim","Sim"], ["nao","Não"]], atual:f.usou, onMudar:function(v){ set("usou", v); }})),
      !ativos.length && e("div",{className:"col-span-full"}, e(Aviso,null, "A equipe da montagem está vazia. A Diretoria cadastra em Produtividade da montagem, aba Equipe.")),
      se[0] && e("div",{className:"col-span-full"}, e(Aviso,{tom:"vermelho"}, se[0])))],
    rodape:[e(Botao,{key:"c", onClick:p.fechar}, "Cancelar"), e(Botao,{key:"o", principal:true, desabilitado:sv[0], onClick:confirmar}, sv[0] ? "Registrando…" : "Registrar montagem")]});
}

function MontarKit(p){
  var cx = use(), s = cx.state, dinheiro = veDinheiro(s);
  var det = useServidor("/montagem/revendedoras/"+p.id), equipe = useServidor("/montagem/equipe"), d = det.dados;
  var sc = useState(function(){ try { return localStorage.getItem(CH_COMPACTO)==="1"; } catch(x){ return false; } }), compacto = sc[0];
  var si = useState(function(){ return lerInicio(p.id); }), inicio = si[0];
  var sa = useState(Date.now()), sj = useState(false), sl = useState(false), so = useState({}), feitos = so[0];
  useEffect(function(){ if(!inicio) return undefined; var t = setInterval(function(){ sa[1](Date.now()); }, 1000); return function(){ clearInterval(t); }; }, [inicio]);   // eslint-disable-line react-hooks/exhaustive-deps -- sa é estado fixo
  useEffect(function(){ if(inicio){ sl[1](false); return undefined; } var t = setTimeout(function(){ sl[1](true); }, 2*60*1000); return function(){ clearTimeout(t); }; }, [inicio]);   // eslint-disable-line react-hooks/exhaustive-deps -- sl é estado fixo
  var mudaCompacto = function(v){ var on = v==="compacto"; sc[1](on); try { localStorage.setItem(CH_COMPACTO, on ? "1" : "0"); } catch(x){ /* só nesta tela */ } };
  var iniciar = function(){ var iso = new Date().toISOString(); gravarInicio(p.id, iso); si[1](iso); sl[1](false); };
  var marca = function(k){ var o = Object.assign({}, feitos); o[k] = !o[k]; so[1](o); };

  if(det.erro && !d) return e("div",{className:"flex flex-col gap-2.5"}, e(PageHead,{t:"Montar kit"}, e(Botao,{onClick:p.voltar}, "Voltar para a fila")), e(Aviso,{tom:"vermelho"}, "Não foi possível carregar a revendedora: "+det.erro));
  if(!d) return e("div",{className:"flex flex-col gap-2.5"}, e(PageHead,{t:"Montar kit", sub:"Lendo as preferências no app…"}, e(Botao,{onClick:p.voltar}, "Voltar para a fila")));

  var pf = d.preferencias || {}, m = (pf.resumoGeral || [])[0], ans = pf.answers || {}, temPrefs = !!pf.temPreferencias;
  var regiao = [d.regiao && d.regiao.cidade, d.regiao && d.regiao.estado].filter(Boolean).join(" / ") || "Região não informada";
  var blocos = pkBlocos(s, {apenasAtivos:true}).filter(function(b){ return b.type!=="observacoes"; });
  var sit = !temPrefs ? ["Sem preferências", undefined] : d.jaMontado ? ["Já montado", VERDE] : ["Pendente de montagem", AMARELO];
  var acoes = [e(Botao,{key:"v", onClick:p.voltar}, "Voltar para a fila"), e(Segmentado,{key:"c", opcoes:[["normal","Normal"], ["compacto","Compacto"]], atual:compacto ? "compacto" : "normal", onMudar:mudaCompacto})];
  if(inicio) acoes.push(e("span",{key:"t", className:"inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-semibold tabular-nums", style:{borderColor:VERDE, color:VERDE}}, "Montando há "+relogio(sa[0]-Date.parse(inicio))));
  else acoes.push(e(Botao,{key:"i", onClick:iniciar}, "Iniciar montagem"));
  acoes.push(e(Botao,{key:"o", principal:true, onClick:function(){ sj[1](true); }}, "Concluir montagem"));

  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:d.nome, sub:"Montar kit · "+regiao}, acoes),
    d.doCache && e(Aviso,null, "O app não respondeu agora: as preferências abaixo são a última cópia guardada."),
    d.configSync===false && e(Aviso,null, "A configuração do kit não respondeu: as respostas podem incluir blocos já removidos."),
    e(Bloco,{t:"Revendedora"},
      e("div",{className:"grid gap-x-6 sm:grid-cols-2"},
        e(Linha,{r:"Região"}, regiao), e(Linha,{r:"Telefone"}, d.telefone || "Não informado"),
        e(Linha,{r:"Preferências salvas em"}, pf.atualizadoEm ? dataHoraBR(pf.atualizadoEm) : "Sem preferências salvas"),
        e(Linha,{r:"Categorias respondidas"}, String(pf.categoriasRespondidas || 0)),
        e(Linha,{r:"Situação", cor:sit[1]}, sit[0]), e(Linha,{r:"Última montagem"}, d.ultimaMontagem ? dataHoraBR(d.ultimaMontagem) : "Nenhuma")),
      m && e("div",{className:"pt-2"}, e(BarraMetal,{ouro:m.ouro, prata:m.prata})),
      e("div",{className:"pt-2"}, e(Rotulo,{t:"Observações da revendedora"}), e("p",{className:"whitespace-pre-wrap text-[13px]"}, String(pf.observations || "").trim() || "Sem observações."))),
    temPrefs && blocos.length
      ? e(Mosaico,{min:compacto ? "15rem" : "22rem"}, blocos.map(function(b, i){ var ok = !!feitos[b.key];
          return e(Bloco,{key:b.key, t:(i+1)+" · "+b.title, cls:ok ? "ring-2 ring-emerald-400/70" : "",
            dir:e("button",{type:"button", onClick:function(){ marca(b.key); }, "aria-pressed":ok, title:ok ? "Desmarcar este bloco" : "Marcar este bloco como montado",
              className:"h-8 min-w-12 rounded-md border px-2 text-[13px] font-semibold "+(ok ? "border-emerald-400 bg-emerald-500/20 text-emerald-300" : "border-border hover:bg-white/10")}, ok ? "✓ OK" : "OK")},
            e(Resposta,{b:b, r:ans[b.key]})); }))
      : e(Aviso,null, temPrefs ? "Nenhum bloco ativo no formulário do app." : "Esta revendedora ainda não salvou preferências de kit. Dá para montar e concluir mesmo assim."),
    sl[0] && !inicio && e(Janela,{t:"Não esqueça de iniciar a montagem", sub:"A tela está aberta há 2 minutos e o cronômetro não começou.", fechar:function(){ sl[1](false); },
      colunas:[e("p",{key:"t", className:"col-span-full text-center text-[13px]"}, "Clique em Iniciar montagem quando começar a montar o kit, para o tempo ser contado certo.")],
      rodape:[e(Botao,{key:"o", onClick:function(){ sl[1](false); }}, "Só estou olhando"), e(Botao,{key:"i", principal:true, onClick:iniciar}, "Iniciar montagem agora")]}),
    sj[0] && e(ConcluirMontagem,{rev:{id:d.id, nome:d.nome}, temPrefs:temPrefs, inicio:inicio, equipe:equipe.dados, dinheiro:dinheiro,
      fechar:function(){ sj[1](false); }, concluido:function(){ si[1](null); sj[1](false); p.voltar(true); }}));
}

export { MontarKit };
