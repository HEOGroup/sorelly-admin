// Sorelly Admin · montagem — pages/fila-montagem/Montar.js
// Área de montar da Fila de montagem (era /projetos/montagem/montar/:id no admin antigo, migrada em 18/11/2026).
// Mostra a revendedora e as preferências dela bloco a bloco (lidas AGORA do app), com OK por bloco e o modo compacto.
// "Iniciar montagem" marca o horário (fica neste navegador até concluir); abrir a tela não inicia nada. Depois de 2 minutos sem iniciar aparece um lembrete.
// "Concluir montagem" registra quem montou (equipe ativa), o valor do kit (só a supervisão vê e digita), início, término e se usou as preferências.
import { PAGINA_CHEIA } from "@/apps/montagem/components/planilha-cheia";
import { Janela } from "@/apps/montagem/components/padrao";
import { Aviso, Bloco, Botao, CampoSel, Rotulo, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { pkBlocos, pkExibirResposta } from "@/apps/montagem/domain/preferencias-kit";
import { sugerido } from "@/apps/montagem/domain/vendas";
import { chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { Bolinha } from "@/apps/montagem/pages/preferencias-kit/visual";
import { CampoDin, CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { dataHoraBR, duracao, gravarInicio, horaSP, isoDeHora, lerInicio, relogio, useServidor, veDinheiro } from "@/apps/montagem/pages/fila-montagem/comum";
import { e, useEffect, useState } from "@/shared/react";

var VERDE = "#4ADE80", VERMELHO = "#F87171", BRANCO = "#FFFFFF";
var horaAgora = function(){ return horaSP(new Date().toISOString()); };

// rótulo à esquerda e valor à direita, numa linha baixa
function Linha(p){
  return e("div",{className:"flex items-center justify-between gap-3 border-b border-white/30 px-2 py-1 leading-tight "+(p.g ? "min-h-11 text-[16px]" : "min-h-7 text-[13px]")},   // padrao-ok: respostas da categoria em 16 px, pedido do Marcus de 24/11/2026 (a montadora lê de longe)
    e("span",{className:"font-semibold"}, p.r), e("span",{className:"text-right tabular-nums", style:p.cor ? {color:p.cor} : undefined}, p.children));
}

// VISUAL DE SISTEMA (Marcus aprovou a versão B em 24/11/2026, desenho em docs/ideias/montar-kit-visual-sistema.html): painéis claros e separados, cantos redondos, pouca linha, ouro só como destaque.
// Quatro painéis: Revendedora | Categorias (círculo de marcar + progresso) | Fotos (2 lado a lado, 3 = 2 em cima e 1 embaixo, borda do tamanho da foto) | Respostas dela (anéis em gráfico de barras).
var PN = "rounded-xl border border-[#e1e5ef] bg-[#f6f7fb] text-[#141b2e]", MUT = "text-[#5d6a85]", OURO = "#b8860b", VERDE2 = "#15803d", VERM2 = "#b91c1c", LINHA2 = "border-[#e1e5ef]";
var G16 = "text-[16px]";   // padrao-ok: nome, respostas e valores em 16 px, pedido do Marcus de 24/11/2026 (a montadora lê de longe)
var G15 = "text-[15px]";   // padrao-ok: nome da revendedora em 15 px, desenho aprovado pelo Marcus em 24/11/2026
var BTN = "flex h-8 w-full items-center justify-center rounded-lg border border-[#d3d9e6] bg-white text-[13px] font-semibold text-[#141b2e] hover:bg-[#eef1f8] disabled:opacity-40";
var BTNP = "flex h-8 w-full items-center justify-center rounded-lg border border-[#e8b84b] bg-[#e8b84b] text-[13px] font-semibold text-[#111] hover:brightness-105 disabled:opacity-40";
var corMetal = function(t){ var q = String(t || ""); return /ouro/i.test(q) ? OURO : /prata/i.test(q) ? "#475569" : undefined; };
var pct1 = function(n){ return String(Math.round(Number(n) * 10) / 10).replace(".", ","); };

function Painel(p){
  return e("section",{className:"flex min-h-0 min-w-0 flex-col overflow-hidden "+PN+" "+(p.cls || "")},
    e("div",{className:"flex shrink-0 items-center justify-between gap-2 border-b "+LINHA2+" px-3.5 py-2.5 text-[13px] font-semibold"}, e("span",{className:"min-w-0"}, p.t), p.s && e("span",{className:"shrink-0 text-[11px] font-normal "+MUT}, p.s)),
    p.children);
}
function Corpo(p){ return e("div",{className:"flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-3.5 py-3 "+(p.cls || "")}, p.children); }
function Rot(p){ return e("div",{className:"mb-1 text-[11px] "+MUT}, p.children); }
function Def(p){ return e("div",{className:"flex items-baseline justify-between gap-3 text-[13px]"}, e("span",{className:"whitespace-nowrap "+MUT}, p.r), e("span",{className:"whitespace-nowrap text-right tabular-nums", style:p.cor ? {color:p.cor} : undefined}, p.children)); }
function BarraOuro(p){
  return e("div",null,
    e("div",{className:"flex h-2.5 overflow-hidden rounded-full bg-[#cfd6e4]"}, e("i",{className:"block h-full", style:{width:p.ouro+"%", background:"#e8b84b"}})),
    e("div",{className:"mt-1 flex justify-between text-[11px] "+MUT}, e("span",null, "Ouro "+pct1(p.ouro)+"%"), e("span",null, "Prata "+pct1(100-p.ouro)+"%")));
}

// anéis: vendidos nos últimos 4 meses (DevMaster) em barras, do mais vendido para o menos; número dourado = tamanho que ela escolheu no app
function AneisB(p){
  var a = p.dados, pedidos = []; (p.pedidos || []).forEach(function(v){ var n = String(Number(v)); if(pedidos.indexOf(n)<0) pedidos.push(n); });
  var vend = a && a.tamanhos ? a.tamanhos.filter(function(t){ return t.tam!=="Sem tamanho"; }) : [], semT = a && a.tamanhos ? a.tamanhos.find(function(t){ return t.tam==="Sem tamanho"; }) : null;
  var soPediu = pedidos.filter(function(v){ return !vend.some(function(t){ return t.tam===v; }); }).sort(function(x, y){ return Number(x)-Number(y); }).map(function(v){ return {tam:v, qtd:0}; });
  var celulas = vend.concat(soPediu, semT ? [semT] : []), max = Math.max.apply(null, [1].concat(celulas.map(function(t){ return t.qtd; })));
  var resumo = !a ? "carregando…" : a.erro ? "não carregou agora" : a.semCadastro ? "sem cadastro na DevMaster" : a.total ? a.total+(a.total===1 ? " anel" : " anéis")+" em "+a.vendas+(a.vendas===1 ? " venda" : " vendas") : "nenhum anel vendido";
  return e("div",null, e(Rot,null, "Vendidos nos últimos 4 meses · "+resumo),
    e("div",{className:"flex flex-col gap-1.5"}, celulas.map(function(t){ var pedido = pedidos.indexOf(t.tam)>=0, nome = t.tam==="Sem tamanho";
      return e("div",{key:t.tam, className:"grid grid-cols-[4.25rem_minmax(0,1fr)_5.25rem] items-center gap-2"},
        e("b",{className:nome ? "text-[13px]" : G16+" tabular-nums", style:pedido ? {color:OURO} : undefined}, t.tam),
        e("div",{className:"h-2.5 overflow-hidden rounded-full bg-[#e1e5ef]"}, e("i",{className:"block h-full rounded-full", style:{width:(t.qtd/max*100)+"%", background:"#e8b84b"}})),
        e("span",{className:"text-right text-[11px] tabular-nums "+MUT}, t.qtd>0 ? t.qtd+(t.qtd===1 ? " vendido" : " vendidos") : "não vendeu")); })),
    pedidos.length>0 && e("div",{className:"mt-1.5 text-[11px] "+MUT}, "Número dourado = tamanho que ela escolheu no app."));
}

// respostas da categoria (formato do app, contas em domain/preferencias-kit.js)
function RespostaB(p){
  var b = p.b, x = pkExibirResposta(b, p.r), cs = [];
  if(x.vazio) return e("p",{className:"text-[13px] "+MUT}, "Sem resposta para esta categoria.");
  if(x.vende!==null) cs.push(e("div",{key:"v", className:"mb-3.5"}, e(Rot,null, "Disponibilidade"), e("div",{className:G16+" font-semibold", style:{color:x.vende ? VERDE2 : VERM2}}, x.vende ? "Vende" : "Não vende")));
  if(x.ouroPct!=null) cs.push(e("div",{key:"m", className:"mb-3.5"}, e(Rot,null, "Ouro e prata"), e(BarraOuro,{ouro:x.ouroPct})));
  if(p.ehAneis) cs.push(e("div",{key:"an", className:"mb-3.5"}, e(AneisB,{dados:p.aneis, pedidos:p.pedidos})));
  x.linhas.forEach(function(l, i){
    if(p.ehAneis && /tamanho/i.test(l.rotulo) && l.valores.length) return;
    if(l.valores.length){
      cs.push(e("div",{key:"l"+i, className:"mb-3.5"}, e(Rot,null, l.rotulo.split(" (selecione")[0]+" · "+l.valores.length+(l.valores.length===1 ? " escolhida" : " escolhidas")),
        e("div",{className:G16+" flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold"}, l.valores.map(function(v, j){ var hex = l.hex && l.hex[j]; return e("span",{key:j, className:"inline-flex items-center gap-1.5"}, hex && e(Bolinha,{cor:hex, s:12}), v); }))));
      return;
    }
    var val = l.vende!=null ? (l.vende ? (l.metal || "Vende") : "Não vende") : (l.metal || "");
    cs.push(e("div",{key:"l"+i, className:"flex items-center justify-between gap-3 border-b "+LINHA2+" py-1.5 last:border-b-0"}, e("b",{className:G16}, l.rotulo), e("span",{className:G16+" font-semibold", style:{color:l.vende===false ? VERM2 : corMetal(l.metal)}}, val)));
  });
  if(b.type==="letras") cs.push(e("div",{key:"n", className:"mt-2 text-[11px] "+MUT}, "Letras escolhidas: "+x.linhas.length+" de "+(b.maxLetters || 26)));
  return e("div",null, cs);
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
      .then(function(r){ gravarInicio(p.rev.id, null); sr[1](r); if(p.kitId && p.dispatch) p.dispatch({type:"CONCLUIR_M", id:p.kitId}); })   // vindo da Listagens: conclui também o kit dela (a regra das condicionais continua valendo)
      .catch(function(x){ se[1](x.message || "Não foi possível registrar a montagem."); })
      .finally(function(){ sv[1](false); });
  };
  if(resumo) return e(Janela,{t:"Montagem registrada", sub:"Kit de "+p.rev.nome+" registrado nas Listagens.", fechar:p.concluido,
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
  var si = useState(function(){ return lerInicio(p.id); }), inicio = si[0];
  var sa = useState(Date.now()), sj = useState(false), so = useState({}), feitos = so[0];
  useEffect(function(){ if(!inicio) return undefined; var t = setInterval(function(){ sa[1](Date.now()); }, 1000); return function(){ clearInterval(t); }; }, [inicio]);   // eslint-disable-line react-hooks/exhaustive-deps -- sa é estado fixo
  var iniciar = function(){ var iso = new Date().toISOString(); gravarInicio(p.id, iso); si[1](iso);
    if(p.kitId) cx.dispatch({type:"INICIAR_M", id:p.kitId, montId:s.usuario}); };   // vindo da Listagens: o kit mostra quem iniciou e o cronômetro (como na listagem antiga)
  var marca = function(k){ var o = Object.assign({}, feitos); o[k] = !o[k]; so[1](o); };
  var ssel = useState(0), szm = useState(null);
  var sv = useState(null), vd = sv[0], nomeRev = d ? d.nome : "";
  var sa2 = useState(null), aneis = sa2[0];
  useEffect(function(){ if(!nomeRev) return undefined; var vivo = true; chamar("GET", "/montagem/revendedoras/"+p.id+"/aneis?nome="+encodeURIComponent(nomeRev)).then(function(j){ if(vivo) sa2[1](j || {erro:true}); }).catch(function(){ if(vivo) sa2[1]({erro:true}); }); return function(){ vivo = false; }; }, [nomeRev, p.id]);   // eslint-disable-line react-hooks/exhaustive-deps -- sa2 é estado fixo
  useEffect(function(){ if(!dinheiro || !nomeRev) return undefined; var vivo = true; chamar("GET", "/montagem/revendedoras/"+p.id+"/vendas?nome="+encodeURIComponent(nomeRev)).then(function(j){ if(vivo) sv[1](j || {}); }).catch(function(){ if(vivo) sv[1]({erro:true}); }); return function(){ vivo = false; }; }, [dinheiro, nomeRev, p.id]);   // eslint-disable-line react-hooks/exhaustive-deps -- sv é estado fixo

  if(det.erro && !d) return e("div",{className:"flex flex-col gap-2.5"}, e(PageHead,{t:"Montar kit"}, e(Botao,{onClick:p.voltar}, "Voltar para as listagens")), e(Aviso,{tom:"vermelho"}, "Não foi possível carregar a revendedora: "+det.erro));
  if(!d) return e("div",{className:"flex flex-col gap-2.5"}, e(PageHead,{t:"Montar kit", sub:"Lendo as preferências no app…"}, e(Botao,{onClick:p.voltar}, "Voltar para as listagens")));

  var pf = d.preferencias || {}, m = (pf.resumoGeral || [])[0], ans = pf.answers || {}, temPrefs = !!pf.temPreferencias;
  var regiao = [d.regiao && d.regiao.cidade, d.regiao && d.regiao.estado].filter(Boolean).join(" / ") || "Região não informada";
  var blocos = pkBlocos(s, {apenasAtivos:true}).filter(function(b){ return b.type!=="observacoes"; });
  var sit = !temPrefs ? ["Sem preferências", undefined] : d.jaMontado ? ["Já montado", VERDE] : ["Pendente de montagem", BRANCO];
  // valor do kit: o definido na listagem; sem ele, o sugerido pela tabela (média das últimas vendas). Só quem vê dinheiro.
  var kit = p.kitId ? (s.kits||[]).find(function(x){ return x.id===p.kitId; }) : null;
  var vs3 = vd && vd.v ? vd.v : [], vapp = vd && vd.vapp!=null ? vd.vapp : null;
  var baseMedia = vapp!==null && vapp>=500 ? [vapp].concat(vs3.slice(0, 2).map(function(x){ return x.v; })) : vs3.map(function(x){ return x.v; });   // regra do Top 100: venda do app de R$ 500 ou mais entra com as 2 últimas da DevMaster
  var mediaV = baseMedia.length ? Math.round(baseMedia.reduce(function(t, x){ return t+x; }, 0)/baseMedia.length*100)/100 : null, kitSug = mediaV!==null ? sugerido([mediaV], s.cfg) : null;
  var kitDef = !!(kit && kit.valor>0), valorKit = kitDef ? kit.valor : kitSug;
  var dBr = function(x){ var q = String(x||"").slice(0, 10).split("-"); return q.length===3 ? q[2]+"/"+q[1]+"/"+q[0] : ""; };
  var obs = String(pf.observations || "").replace(/\n\s*\n+/g, "\n").trim() || "Sem observações.";
  var iniciais = String(d.nome || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(function(w){ return w.charAt(0); }).join("").toUpperCase();
  var tem = temPrefs && blocos.length>0, sel = tem ? Math.min(ssel[0], blocos.length-1) : 0, b = tem ? blocos[sel] : null;
  var x = b ? pkExibirResposta(b, ans[b.key]) : null, imgs = x && !x.vazio ? x.imagens : [], okSel = !!(b && feitos[b.key]);
  var feitosN = blocos.filter(function(k){ return feitos[k.key]; }).length;
  var ehAneis = !!(b && /^an[eé]is$/i.test(String(b.title || "").trim())), pedidos = [];
  if(ehAneis && x) x.linhas.forEach(function(l){ if(/tamanho/i.test(l.rotulo)) l.valores.forEach(function(v){ pedidos.push(v); }); });
  var vai = function(i){ ssel[1](Math.max(0, Math.min(blocos.length-1, i))); };
  var nFotos = function(bl){ var r = pkExibirResposta(bl, ans[bl.key]); return r.vazio ? 0 : r.imagens.length; };
  var aviso = d.doCache ? "O app não respondeu agora: as preferências são a última cópia guardada." : d.configSync===false ? "A configuração do kit não respondeu: as respostas podem incluir blocos já removidos." : "";

  var painelRev = e(Painel,{t:"Revendedora", s:"Listagens"},
    e(Corpo,null,
      e("button",{type:"button", onClick:p.voltar, className:BTN}, "‹ Voltar para as listagens"),
      e("div",{className:"flex items-center gap-3"},
        e("div",{className:"flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8b84b] font-bold text-[#111] "+G15}, iniciais),
        e("div",{className:"min-w-0"}, e("div",{className:G15+" font-semibold leading-tight"}, d.nome), e("div",{className:"text-[13px] "+MUT}, regiao))),
      dinheiro && e("div",{className:"rounded-lg border "+LINHA2+" bg-white px-3.5 py-3"},
        e(Rot,null, kitDef ? "Valor do kit" : "Valor do kit sugerido"),
        e("div",{className:"text-[20px] font-bold tabular-nums", style:{color:valorKit>0 ? OURO : VERM2}}, valorKit>0 ? brl(valorKit) : (!vd ? "…" : "Não definido")),
        mediaV!==null && e("div",{className:"mt-0.5 text-[11px] tabular-nums "+MUT}, "Média das últimas vendas: "+brl(mediaV))),
      e("div",{className:"flex flex-col gap-1.5"},
        e(Def,{r:"Telefone"}, d.telefone || "Não informado"),
        e(Def,{r:"Salvas em"}, pf.atualizadoEm ? dataHoraBR(pf.atualizadoEm) : "Sem preferências"),
        e(Def,{r:"Categorias respondidas"}, String(pf.categoriasRespondidas || 0)),
        e(Def,{r:"Situação", cor:sit[1]===VERDE ? VERDE2 : undefined}, sit[0]),
        e(Def,{r:"Última montagem"}, d.ultimaMontagem ? dataHoraBR(d.ultimaMontagem) : "Nenhuma"),
        vd && vd.prev && e(Def,{r:"Acerto previsto"}, dBr(vd.prev)),
        dinheiro && vd && (vapp!==null || vd.appMes) && e(Def,{r:vapp===null ? "Venda no app (mês)" : "Venda no app"}, brl(vapp!==null ? vapp : vd.appMes.total))),
      m && e("div",null, e(Rot,null, "Ouro e prata"), e(BarraOuro,{ouro:m.ouro})),
      e("div",null, e(Rot,null, "Observações"), e("p",{className:"whitespace-pre-wrap text-[13px] leading-snug"}, obs)),
      e("div",{className:"mt-auto flex flex-col gap-2 pt-1"},
        inicio ? e("div",{className:"flex h-8 items-center justify-center rounded-lg border "+LINHA2+" bg-white text-[13px] font-semibold tabular-nums", style:{color:VERDE2}}, "Montando há "+relogio(sa[0]-Date.parse(inicio)))
               : e("button",{type:"button", onClick:iniciar, className:BTN}, "Iniciar montagem"),
        e("button",{type:"button", onClick:function(){ sj[1](true); }, className:BTNP}, "Concluir montagem"))));

  var painelCats = tem && e(Painel,{t:"Categorias", s:feitosN+" de "+blocos.length},
    e("div",{className:"shrink-0 px-3.5 pt-2.5"}, e("div",{className:"h-1.5 overflow-hidden rounded-full bg-[#e1e5ef]"}, e("i",{className:"block h-full rounded-full", style:{width:(feitosN/blocos.length*100)+"%", background:"#16a34a"}}))),
    e("div",{className:"flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5"}, blocos.map(function(bl, i){ var f2 = !!feitos[bl.key], n = nFotos(bl), atual = i===sel;
      return e("div",{key:bl.key, className:"relative flex min-h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 "+(atual ? "bg-[#fff4d6]" : "hover:bg-white")},
        atual && e("span",{className:"absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#e8b84b]"}),
        e("button",{type:"button", onClick:function(){ marca(bl.key); }, "aria-pressed":f2, title:f2 ? "Desmarcar este bloco" : "Marcar este bloco como montado", className:"flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] "+(f2 ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#93a0ba]")}, f2 ? "✓" : ""),
        e("button",{type:"button", onClick:function(){ vai(i); }, className:"flex min-h-8 min-w-0 flex-1 items-center justify-between gap-2 text-left text-[13px]"}, e("span",{className:"min-w-0 "+(atual ? "font-semibold" : "")}, bl.title), e("span",{className:"shrink-0 text-[11px] "+MUT}, n ? n+(n===1 ? " foto" : " fotos") : ""))); })));

  var painelFotos = tem && e(Painel,{t:b.title, s:imgs.length ? imgs.length+(imgs.length===1 ? " foto" : " fotos") : "Sem fotos"},
    e("div",{className:"flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-3.5"},
      imgs.length
        ? e("div",{className:"grid w-full items-center justify-items-center gap-3", style:{gridTemplateColumns:"repeat("+Math.min(imgs.length, 2)+", minmax(0, 1fr))"}}, imgs.map(function(u, i){
            var altMax = "calc((100vh - 15rem) / "+(imgs.length>2 ? 2 : 1)+")", ultimaSozinha = imgs.length>2 && imgs.length%2===1 && i===imgs.length-1;
            return e("button",{key:i, type:"button", onClick:function(){ szm[1](u); }, title:"Abrir foto em tela cheia", "aria-label":"Abrir foto "+(i+1), className:"inline-flex max-w-full overflow-hidden rounded-[10px] border border-[#e1e5ef] bg-white "+(ultimaSozinha ? "col-span-2" : "")},
              e("img",{src:u, alt:"Foto "+(i+1)+" enviada pela revendedora", style:{display:"block", maxWidth:"100%", maxHeight:altMax, width:"auto", height:"auto"}})); }))
        : e("p",{className:"text-[13px] "+MUT}, "Nenhuma foto enviada para esta categoria.")),
    e("div",{className:"grid shrink-0 grid-cols-[1fr_2fr_1fr] gap-2 border-t "+LINHA2+" p-3"},
      e("button",{type:"button", onClick:function(){ vai(sel-1); }, disabled:sel===0, className:BTN}, "‹ Anterior"),
      e("button",{type:"button", onClick:function(){ marca(b.key); if(!okSel && sel<blocos.length-1) vai(sel+1); }, "aria-pressed":okSel, title:okSel ? "Desmarcar este bloco" : "Marcar como montado e ir para a próxima categoria", className:okSel ? "flex h-8 w-full items-center justify-center rounded-lg border border-[#16a34a] bg-[#16a34a] text-[13px] font-semibold text-white hover:brightness-105" : BTNP}, okSel ? "✓ Montado (desmarcar)" : "Marcar como montado"),
      e("button",{type:"button", onClick:function(){ vai(sel+1); }, disabled:sel===blocos.length-1, className:BTN}, "Próxima ›")));

  var painelResp = tem && e(Painel,{t:"Respostas dela", s:b.title, cls:"lg:col-span-full xl:col-span-1"}, e(Corpo,null, e(RespostaB,{b:b, r:ans[b.key], ehAneis:ehAneis, aneis:aneis, pedidos:pedidos})));

  return e("div",{className:PAGINA_CHEIA+" [&_*]:!normal-case flex flex-col bg-[#c99b2b] p-2 xl:h-[calc(100vh-3.4rem)]"},
    aviso && e("div",{className:"mb-2 shrink-0 rounded-lg bg-[#fff4d6] px-3 py-1.5 text-[13px] text-[#141b2e]"}, aviso),
    e("div",{className:"grid min-h-0 flex-1 gap-2 lg:grid-cols-[18rem_14rem_minmax(0,1fr)] xl:grid-cols-[18.5rem_15rem_minmax(0,1fr)_21.5rem]"},
      painelRev, painelCats, painelFotos, painelResp,
      !tem && e("p",{className:"col-span-full text-center text-[13px]"}, temPrefs ? "Nenhum bloco ativo no formulário do app." : "Esta revendedora ainda não salvou preferências de kit. Dá para montar e concluir mesmo assim.")),
    szm[0] && e("div",{className:"fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4", onClick:function(){ szm[1](null); }}, e("img",{src:szm[0], alt:"Foto ampliada", style:{maxWidth:"92vw", maxHeight:"88vh", objectFit:"contain"}})),
    sj[0] && e(ConcluirMontagem,{kitId:p.kitId, dispatch:cx.dispatch, rev:{id:d.id, nome:d.nome}, temPrefs:temPrefs, inicio:inicio, equipe:equipe.dados, dinheiro:dinheiro,
      fechar:function(){ sj[1](false); }, concluido:function(){ si[1](null); sj[1](false); p.voltar(true); }}));
}

export { MontarKit };
