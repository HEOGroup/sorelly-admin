// Sorelly Admin · montagem — pages/fiscal/ContasAnual.js
// Fiscal → Contas a pagar (grade mês × empresa, editável) e Dashboard anual (ILF mês a mês por CNPJ e gráfico da venda do grupo).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, ESTADO, Faixa, Indicador, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { MES_CURTO, MESES, fxDashboardAnual, fxGradeContas } from "@/apps/montagem/domain/fiscal";
import { COR, Aviso, Bt, Selo, Vazio, corCls, fmt, useFx } from "@/apps/montagem/pages/fiscal/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var ORIGEM = {financeiro:"Valor vindo do Financeiro (Contas a pagar, pago mais falta pagar). Não se edita aqui.", "contas-a-pagar":"Valor vindo de Contas a pagar por CNPJ. Edite aqui para sobrepor.", fiscal:"Valor lançado no Fiscal."};

// ───────────── Contas a pagar ─────────────
function AbaFxContas(p){
  var f = useFx(), ano = p.ano, grade = fxGradeContas(f.s, ano);
  var ed = useState(null), rascunho = useState(0);
  if(!grade.length) return e(Vazio,{ic:"buildings", acao:e(Bt,{tipo:"forte", ic:"gear", onClick:function(){ p.ir("config"); }}, "Cadastrar empresas")}, "Cadastre ao menos uma empresa para lançar contas.");
  var abrir = function(emp, m){ if(m.origem==="financeiro") return; ed[1]({id:emp.empresaId, ym:m.ym}); rascunho[1](m.valor); };
  var salvar = function(){ f.envia({op:"conta_set", empresaId:ed[0].id, yearMonth:ed[0].ym, total:Number(rascunho[0])||0}); ed[1](null); };
  var totalMes = function(i){ return Math.round(grade.reduce(function(t, g){ return t+g.meses[i].valor; }, 0)*100)/100; };
  var totalGeral = Math.round(grade.reduce(function(t, g){ return t+g.total; }, 0)*100)/100;
  var vindas = grade.some(function(g){ return g.meses.some(function(m){ return m.origem==="financeiro" || m.origem==="contas-a-pagar"; }); });
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:2}, e(Indicador,{t:"Contas do ano", v:fmt.brl(totalGeral), cor:"cian", sub:"Todas as empresas, "+ano}), e(Indicador,{t:"Empresas", v:grade.length, cor:"total"})),
    vindas && e(Aviso,{cor:"info", ic:"info"}, "As células com o ícone de vínculo vêm do Financeiro (Contas a pagar da empresa, sem a família) e se atualizam sozinhas. Só os meses sem dado do Financeiro aceitam lançamento à mão."),
    e(BlocoBarra,{cor:"turquesa", t:"Contas a pagar por empresa e mês", compacto:true},
      e("div",{className:"p-2"}, e(Tab,{cols:["Mês"].concat(grade.map(function(g){ return g.nome; }), ["Total do mês"])},
        MESES.map(function(m, i){
          return e("tr",{key:i, className:LINHA}, e(Td,{forte:true}, fmt.cap(m)),
            grade.map(function(g){ var c = g.meses[i], aberto = ed[0] && ed[0].id===g.empresaId && ed[0].ym===c.ym;
              if(aberto) return e(Td,{key:g.empresaId, className:"min-w-44"}, e("div",{className:"flex items-center justify-center gap-1"},
                e("div",{className:"w-36"}, e(Dinheiro,{value:rascunho[0], label:"Contas de "+g.nome+" em "+m, onChange:function(n){ rascunho[1](n||0); }})),
                e(Bt,{tipo:"forte", rotulo:"Salvar valor", ic:"check-circle", onClick:salvar, className:"h-8 px-2"}), e(Bt,{rotulo:"Cancelar", ic:"x", onClick:function(){ ed[1](null); }, className:"h-8 px-2"})));
              return e(Td,{key:g.empresaId, dinheiro:true},
                e("button",{type:"button", onClick:function(){ abrir(g, c); }, title:ORIGEM[c.origem] || "Clique para lançar", "aria-label":"Editar contas de "+g.nome+" em "+m, className:"inline-flex items-center justify-center gap-1 rounded-md px-2 py-0.5 hover:bg-white/10 "+(c.valor>0 ? "" : "text-white/40")},
                  (c.origem==="financeiro" || c.origem==="contas-a-pagar") && e(Ph,{n:"link-simple", s:12, style:{color:ESTADO.info}}), c.valor>0 ? fmt.brl(c.valor) : "—")); }),
            e(Td,{dinheiro:true, forte:true}, fmt.brl(totalMes(i)))); }),
        e("tr",{className:LINHA+" bg-white/5"}, e(Td,{forte:true}, "Total do ano"), grade.map(function(g){ return e(Td,{key:g.empresaId, dinheiro:true, forte:true}, fmt.brl(g.total)); }), e(Td,{dinheiro:true, forte:true, cor:"cian"}, fmt.brl(totalGeral)))))));
}

// ───────────── Dashboard anual ─────────────
function AbaFxAnual(p){
  var f = useFx(), ano = p.ano, dash = fxDashboardAnual(f.s, ano);
  if(!dash.porEmpresa.length) return e(Vazio,{ic:"chart-bar", acao:e(Bt,{tipo:"forte", ic:"gear", onClick:function(){ p.ir("config"); }}, "Cadastrar empresas")}, "Nenhuma empresa cadastrada no Fiscal.");
  var max = Math.max.apply(null, dash.grupo.map(function(m){ return m.venda; }).concat([1]));
  var tg = dash.totaisGrupo;
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:3}, e(Indicador,{t:"Venda do grupo", v:fmt.brl(tg.venda), cor:"cian", sub:"Ano "+ano}), e(Indicador,{t:"Lastro do grupo", v:fmt.brl(tg.lastro), cor:"ok"}),
      e(Indicador,{t:"ILF do grupo", v:fmt.pct(tg.ilf), cor:corCls(tg.ilfSt.cls), sub:tg.ilfSt.txt==="—" ? "Sem venda" : fmt.cap(tg.ilfSt.txt.toLowerCase())})),
    e(BlocoBarra,{cor:"turquesa", t:"ILF mês a mês por CNPJ", compacto:true, dir:"Meta "+fmt.pct(dash.meta, 0)},
      e("div",{className:"flex flex-col gap-2 p-2"},
        e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, e(Selo,{cor:"ok"}, "Ok: a partir de "+fmt.pct(dash.meta, 0)), e(Selo,{cor:"alerta"}, "Atenção: a partir de "+fmt.pct(dash.critico, 0)), e(Selo,{cor:"ruim"}, "Crítico: abaixo disso")),
        e(Tab,{cols:["Empresa"].concat(MES_CURTO, ["Venda no ano","ILF no ano","% do sublimite"])},
          dash.porEmpresa.map(function(x){ return e("tr",{key:x.empresaId, className:LINHA, style:x.ativo || !x.comCnpj ? undefined : {opacity:0.65}},
            e(Td,{forte:true}, x.nome), x.meses.map(function(m){ return e(Td,{key:m.mes, dinheiro:true, className:"px-1! text-[12px]!", cor:corCls(m.st.cls), title:fmt.brl(m.venda)}, m.venda>0 ? fmt.pct(m.ilf, 0) : "—"); }),
            e(Td,{dinheiro:true}, fmt.brl(x.totais.venda)), e(Td,{dinheiro:true, forte:true, cor:corCls(x.totais.ilfSt.cls)}, x.totais.venda>0 ? fmt.pct(x.totais.ilf) : "—"),
            e(Td,{dinheiro:true, cor:x.totais.pctSublimite>=1 ? "ruim" : x.totais.pctSublimite>=f.fx.config.riscoPct ? "alerta" : undefined}, fmt.pct(x.totais.pctSublimite))); }),
          e("tr",{className:LINHA+" bg-white/5"}, e(Td,{forte:true}, "Grupo"), dash.grupo.map(function(m){ return e(Td,{key:m.mes, dinheiro:true, forte:true, className:"px-1! text-[12px]!", cor:corCls(m.st.cls)}, m.venda>0 ? fmt.pct(m.ilf, 0) : "—"); }),
            e(Td,{dinheiro:true, forte:true}, fmt.brl(tg.venda)), e(Td,{dinheiro:true, forte:true, cor:corCls(tg.ilfSt.cls)}, tg.venda>0 ? fmt.pct(tg.ilf) : "—"), e(Td,null, "—"))))),
    e(BlocoBarra,{cor:"turquesa", t:"Venda mensal do grupo", compacto:true, dir:fmt.curto(tg.venda)},
      e("div",{className:"p-3"}, tg.venda>0 ? e("div",{className:"flex h-48 items-end justify-center gap-1.5 sm:gap-2.5", role:"img", "aria-label":"Venda mensal do grupo em "+ano},
        dash.grupo.map(function(m){ var h = Math.max(m.venda>0 ? 3 : 0, Math.round(m.venda/max*100));
          return e("div",{key:m.mes, className:"flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1", title:fmt.cap(MESES[m.mes-1])+": "+fmt.brl(m.venda)},
            e("span",{className:MONO+" whitespace-nowrap text-[9.5px] leading-none text-white/80"}, m.venda>0 ? fmt.curto(m.venda).replace("R$ ","") : ""),
            e("div",{className:"w-full max-w-10 rounded-t-md", style:{height:h+"%", background:"linear-gradient(180deg,#67E8F9,"+COR+"66)", boxShadow:"inset 0 0 0 1px "+COR+"99"}}),
            e("span",{className:"text-[10px] font-bold uppercase text-white/75"}, m.rotulo)); })) : e(Vazio,{ic:"chart-bar"}, "Nenhuma venda lançada em "+ano+"."))));
}
export { AbaFxContas, AbaFxAnual };
