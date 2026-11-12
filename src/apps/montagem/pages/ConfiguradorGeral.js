// Sorelly Admin — pages/ConfiguradorGeral.js
// UM configurador só para todos os setores (Tecnologia → Configurador geral): montagem e bipagem, representantes, kit novo, avisos e quem bipa os retornos.
// Os configuradores antigos saíram do menu e viraram seções aqui dentro.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { tabelasFunc, validarTabelasFunc } from "@/apps/montagem/domain/comissao-funcionarias";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { SETORES_LOGIN } from "@/apps/montagem/components/seletor-acesso";
import { BIPA_RETORNO_PADRAO } from "@/apps/montagem/domain/equipe";
import { quemBipa } from "@/apps/montagem/domain/retornos";
import { PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { AbaConfig } from "@/apps/montagem/pages/Config";
import { AbaConfigAvisos } from "@/apps/montagem/pages/ConfigAvisos";
import { AbaConfigRepresentantes } from "@/apps/montagem/pages/ConfigRepresentantes";
import { AbaConfigTrafego } from "@/apps/montagem/pages/trafego/ConfigTrafego";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

// Quem bipa os retornos dos kits: pessoas marcadas aqui abrem o Consolidado e o Controle de kits (sem ver os totais em dinheiro) e dão o OK na fila de bipagem.
function ConfigQuemBipa(){
  var cx = use(), s = cx.state, d = cx.dispatch, ids = quemBipa(s, BIPA_RETORNO_PADRAO());
  var alterna = function(id){ d({type:"BIPA_RETORNO_SET", ids: ids.indexOf(id)>=0 ? ids.filter(function(x){ return x!==id; }) : ids.concat([id])}); };
  return e(BlocoBarra,{t:"Quem bipa os retornos", sub:ids.length+" pessoas · marque quem pode bipar os kits que voltam das representantes"},
    e("div",{className:"flex flex-col gap-3 p-3"},
      e("p",{className:"text-[13px] text-white/80"},"Quem estiver marcado abre o Consolidado e o Controle de kits e dá o OK de cada retorno bipado. O resultado por representante e os totais em dinheiro continuam só da diretoria. Cadastro, encomendas e outros setores que ajudam entram aqui quando tiverem usuário."),
      e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"}, SETORES_LOGIN().filter(function(g){ return g[1].length; }).map(function(g){
        return e("div",{key:g[0], className:"flex flex-col gap-1.5 rounded-xl bg-black/25 p-2.5"},
          e("b",{className:"text-[11px] uppercase tracking-wide text-primary"}, PAPEL_LB[g[0]]),
          g[1].map(function(p){ var on = ids.indexOf(p.id)>=0;
            return e("label",{key:p.id, className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:on, onChange:function(){ alterna(p.id); }, className:"size-4"}), p.nome); })); }))));
}

// Configurador do kit novo (é de outro módulo, precisa carregar os dados dele antes)
function ConfigKitNovo(){
  var st = useState(null), Comp = st[0], setComp = st[1];
  useEffect(function(){ var vivo = true;
    import("@/apps/kits-novos/data/dados").then(function(m){ return m.carregarDados(); })
      .then(function(){ return import("@/apps/montagem/pages/KitsNovosEmbutido"); }).then(function(m){ if(vivo) setComp(function(){ return m.AbaConfigKNEmbutido; }); });
    return function(){ vivo = false; }; }, []);
  return Comp ? e(Comp) : e("p",{className:"p-4 text-center text-[13px] text-white/70"},"Carregando o configurador do kit novo…");
}

// Previsão de faturamento: quanto a média por acerto de novembro e dezembro sobe em relação à média atual do mês (só esses meses; os próximos usam a média histórica)
function ConfigPrevisao(){
  var cx = use(), s = cx.state, d = cx.dispatch, MESES = [[10,"Novembro",5],[11,"Dezembro",15]];
  var valor = function(i, padrao){ var a = s.altaMedia; if(a && Object.prototype.hasOwnProperty.call(a, i)) return a[i]===null ? "" : Math.round(a[i]*100); return padrao; };
  return e(BlocoBarra,{cor:"ouro", t:"Previsão de faturamento", sub:"alta da média por acerto sobre a média atual do mês · só novembro e dezembro"},
    e("div",{className:"flex flex-col gap-3 p-4"},
      MESES.map(function(x){ return e("label",{key:x[0], className:"flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2 text-[14px]"},
        e("span",null, e("b",null, x[1]), e("span",{className:"ml-2 text-[12px] text-white/65"}, "média atual do mês + o percentual ao lado (vazio = sem alta)")),
        e("span",{className:"flex items-center gap-1"}, "+", e("input",{type:"number", min:0, max:100, step:1, defaultValue:valor(x[0], x[2]), "aria-label":"Alta da média de "+x[1]+" em porcentagem", className:"h-9 w-20 rounded-lg border border-border bg-black/30 px-2 text-center outline-none focus:border-primary",
          onBlur:function(ev){ d({type:"ALTA_MEDIA_SET", mes:x[0], pct:ev.target.value}); }}), "%")); }),
      e("p",{className:"text-[12.5px] text-white/65"}, "Padrão combinado: novembro +5% e dezembro +15%. A Visão geral e a Previsão de faturamento usam estes valores na hora.")));
}

// Comissão das funcionárias: duas tabelas com data de início. Vale a mais recente que já começou, pela data do acerto. Quem é funcionária vem do RH (ativa) + CPF na DevMaster.
function ConfigFuncionarias(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var st = useState(function(){ return JSON.parse(JSON.stringify(tabelasFunc(s))); }), tabs = st[0], setTabs = st[1], sj = useState(false), sujo = sj[0], setSujo = sj[1], er = useState(""), erro = er[0], setErro = er[1];
  var lt = useState(null), lista = lt[0], setLista = lt[1];
  useEffect(function(){ if(!apiAtiva()) return undefined; var vivo = true; chamar("GET", "/funcionarias").then(function(r){ if(vivo) setLista(r); }).catch(function(){ if(vivo) setLista({erro:true}); }); return function(){ vivo = false; }; }, []);
  var muda = function(fn){ var n = JSON.parse(JSON.stringify(tabs)); fn(n); setTabs(n); setSujo(true); setErro(""); };
  var CAMPO_CF = "h-8 w-full rounded-md border border-foreground/25 bg-card px-2 text-center text-[13px]";
  var salvar = function(){ var m = validarTabelasFunc(tabs); if(m){ setErro(m); return; } d({type:"COMISSAO_FUNC_SET", tabelas:tabs.map(function(t){ return {id:t.id || ("t"+t.desde), nome:t.nome, desde:t.desde, faixas:t.faixas.map(function(f){ return {de:Number(f.de), pct:Number(f.pct)}; })}; }), por:""}); setSujo(false); };
  return e(BlocoBarra,{cor:"ouro", t:"Comissão das funcionárias", sub:"só para funcionária ativa no RH, e só no Atendimento Sorelly · vale a tabela que começou por último, pela data do acerto"},
    e("div",{className:"flex flex-col gap-3 p-3"},
      e("p",{className:"text-[13px]"}, "Faixa = a partir de R$ X, Y% de comissão. Abaixo da primeira faixa vale a comissão normal. Brinde, taxa e multas seguem a tabela normal. Saiu da Sorelly (RH desligou), a comissão volta para a normal sozinha."),
      tabs.map(function(t, i){ return e("div",{key:i, className:"flex flex-col gap-2 rounded-xl bg-black/25 p-3"},
        e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_11rem_auto]"},
          e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Nome da tabela"), e("input",{value:t.nome || "", maxLength:80, "aria-label":"Nome da tabela", className:CAMPO_CF, onChange:function(ev){ var v = ev.target.value; muda(function(n){ n[i].nome = v; }); }})),
          e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Vale a partir de"), e("input",{type:"date", value:t.desde || "", "aria-label":"Data em que a tabela começa a valer", className:CAMPO_CF, onChange:function(ev){ var v = ev.target.value; muda(function(n){ n[i].desde = v; }); }})),
          tabs.length>1 && e("button",{type:"button", onClick:function(){ muda(function(n){ n.splice(i, 1); }); }, className:"h-8 self-end rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "Remover tabela")),
        t.faixas.map(function(f, j){ return e("div",{key:j, className:"grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"},
          e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "A partir de"), e(CampoDinheiro,{value:f.de || null, label:"Valor inicial da faixa", className:CAMPO_CF, placeholder:"R$ 0,00", onChange:function(v){ muda(function(n){ n[i].faixas[j].de = v || 0; }); }})),
          e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Comissão (%)"), e("input",{type:"number", min:0, max:100, step:1, value:f.pct===undefined ? "" : f.pct, "aria-label":"Comissão da faixa em porcentagem", className:CAMPO_CF, onChange:function(ev){ var v = ev.target.value; muda(function(n){ n[i].faixas[j].pct = v==="" ? "" : Number(v); }); }})),
          t.faixas.length>1 && e("button",{type:"button", "aria-label":"Remover a faixa", onClick:function(){ muda(function(n){ n[i].faixas.splice(j, 1); }); }, className:"h-8 rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "Remover")); }),
        e("div",{className:"flex"}, e("button",{type:"button", onClick:function(){ muda(function(n){ n[i].faixas.push({de:0, pct:0}); }); }, className:"h-8 rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "+ Faixa"))); }),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("button",{type:"button", onClick:function(){ muda(function(n){ n.push({id:"", nome:"Nova tabela", desde:"", faixas:[{de:500, pct:35}]}); }); }, className:"h-8 rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "+ Nova tabela"),
        e("button",{type:"button", disabled:!sujo, onClick:salvar, className:"h-8 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, "Salvar tabelas"),
        !sujo && e("span",{className:"text-[13px]"}, "Salvo")),
      erro && e("p",{role:"alert", className:"text-[13px] font-semibold text-destructive"}, erro),
      e("div",{className:"flex flex-col gap-1 rounded-xl bg-black/25 p-3"},
        e("b",{className:"text-[13px]"}, "Quem está marcada como funcionária hoje"+(lista && lista.lista ? " · "+lista.lista.length : "")),
        !lista ? e("p",{className:"text-[13px]"}, "Lendo o RH e a DevMaster…")
          : lista.erro || !lista.lista ? e("p",{className:"text-[13px]"}, "Não consegui ler agora (precisa do servidor ligado e acesso do setor).")
          : e(React.Fragment,null,
              e("p",{className:"text-[13px]"}, lista.ativasNoRh+" ativas no RH · "+lista.comCpf+" com CPF · "+lista.achadas+" com cadastro de cliente na DevMaster (mesmo CPF). As outras não fazem acerto aqui ou não têm cadastro."),
              e("p",{className:"text-[13px] leading-relaxed"}, lista.lista.map(function(x){ return x.nome; }).join(" · "))))));
}

var SECOES = [["previsao","Previsão de faturamento", ConfigPrevisao], ["montagem","Montagem e bipagem", AbaConfig], ["rep","Representantes", AbaConfigRepresentantes], ["kn","Kit novo", ConfigKitNovo], ["avisos","Avisos e alertas", AbaConfigAvisos], ["bipa","Quem bipa os retornos", ConfigQuemBipa], ["func","Comissão das funcionárias", ConfigFuncionarias], ["trafego","Tráfego pago", AbaConfigTrafego]];

function AbaConfiguradorGeral(){
  var sc = useState(function(){ try{ var h = sessionStorage.getItem("sorelly_cfg_secao"); if(h){ sessionStorage.removeItem("sorelly_cfg_secao"); return h; } }catch(x){} return "montagem"; }), sec = sc[0], setSec = sc[1], atual = SECOES.find(function(x){ return x[0]===sec; }) || SECOES[0];
  return e(React.Fragment,null,
    e(PageHead,{t:"Configurador geral", sub:"Um só para todos os setores: escolha o setor abaixo."}),
    e("div",{className:"flex flex-wrap gap-1.5"}, SECOES.map(function(x){ return e("button",{key:x[0], onClick:function(){ setSec(x[0]); },
      className:"rounded-lg px-3 py-1.5 text-[13px] font-semibold ring-1 "+(sec===x[0] ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x[1]); })),
    e(atual[2], {key:sec}));
}

export { AbaConfiguradorGeral, ConfigQuemBipa, ConfigKitNovo, ConfigPrevisao };
