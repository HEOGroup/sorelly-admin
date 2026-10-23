// Sorelly Admin · montagem — pages/fiscal/VisaoGeral.js
// Fiscal → Visão geral: consolidado do grupo no ano, avisos de risco e de conflito, "Ainda cabe" por CNPJ e o resumo fiscal para o WhatsApp.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Indicador, Mosaico, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { fxAindaCabe, fxResumoTexto, fxVisaoGeral, MESES } from "@/apps/montagem/domain/fiscal";
import { COR, Aviso, Bt, Campo, Chip, Grade, Jan, Mini, Selo, Vazio, copiar, corCls, fmt, useFx } from "@/apps/montagem/pages/fiscal/visual";
import { ESTADO } from "@/apps/montagem/components/padrao";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

// cartão "Ainda cabe" de um CNPJ: barra de uso do sublimite + números + mensagem
function CartaoCabe(p){
  var x = p.x, pct = x.sublimite>0 ? Math.max(0, Math.min(1, x.vendaAno/x.sublimite)) : 0, cs = ESTADO[corCls(x.sub.cls)], cc = corCls(x.capSt.cls);
  return e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-2.5 ring-1 ring-white/10"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, e("h3",{className:"font-heading text-[14px] font-bold"}, x.nome),
      e(Selo,{cor:corCls(x.sub.cls), titulo:"Situação do sublimite"}, "Sublimite: "+fmt.cap(x.sub.txt.toLowerCase())),
      x.capSt.cls!=="grey" && e(Selo,{cor:cc, titulo:"As contas futuras cabem no que resta do sublimite?"}, "Contas: "+fmt.cap(x.capSt.txt.toLowerCase()))),
    e("div",{className:"flex flex-col gap-0.5", title:"Uso do sublimite anual"},
      e("div",{className:"h-2.5 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:(pct*100)+"%", background:"linear-gradient(90deg,"+cs+"99,"+cs+")"}})),
      e("span",{className:MONO+" text-center text-[11px] text-white/80"}, fmt.pct(x.sublimite>0 ? x.vendaAno/x.sublimite : 0)+" do sublimite usado")),
    e("div",{className:"grid grid-cols-2 gap-1.5"},
      e(Mini,{t:"Vendas no ano", v:fmt.brl(x.vendaAno), cor:"cian"}),
      e(Mini,{t:"Restante do sublimite", v:fmt.brl(x.restante), cor:x.restante>=0 ? "ok" : "ruim"}),
      e(Mini,{t:"Máximo por mês", v:fmt.brl(Math.max(0, x.maxPorMes)), cor:"total", sub:x.mesesRestantes+(x.mesesRestantes===1 ? " mês restante" : " meses restantes")}),
      e(Mini,{t:"Média mensal", v:fmt.brl(x.mediaMes), cor:"info"}),
      e(Mini,{t:"Projeção no ano", v:fmt.brl(x.projecao), cor:corCls(x.sub.cls)}),
      e(Mini,{t:"Contas futuras", v:fmt.brl(x.contasFuturas), cor:"total"}),
      e(Mini,{t:"Folga", v:fmt.brl(x.folga), cor:x.contasFuturas>0 ? (x.folga>=0 ? "ok" : "ruim") : "neutro"}),
      e(Mini,{t:"ILF no ano", v:fmt.pct(x.ilf), cor:corCls(x.ilfSt.cls), sub:x.ilfSt.txt==="—" ? "" : fmt.cap(x.ilfSt.txt.toLowerCase())})),
    e("p",{className:"text-center text-[12px] text-white/75"}, x.mensagem));
}

// janela de conferência do texto para o WhatsApp: mês escolhível, texto visível, copiar
function JanelaResumo(p){
  var f = p.f, st = useState(p.mesInicial), mes = st[0], texto = fxResumoTexto(f.s, p.ano, mes);
  var copia = function(){ copiar(texto, function(ok){ f.aviso(ok ? "Resumo fiscal copiado. Já pode colar no WhatsApp." : "Não foi possível copiar. Selecione o texto e copie manualmente.", ok ? "ok" : "alerta"); }); };
  return e(Jan,{t:"Resumo fiscal", sub:"Confira o texto antes de enviar. A linha de vendas do mês segue o mês escolhido.", fechar:p.fechar,
    colunas:[
      e("div",{key:"m", className:"flex flex-col gap-2"}, e("p",{className:"text-center text-[12px] font-bold uppercase tracking-wide text-white/75"}, "Mês de referência"),
        e("div",{className:"flex flex-wrap justify-center gap-1.5"}, MESES.map(function(m, i){ return e(Chip,{key:i, on:mes===i+1, onClick:function(){ st[1](i+1); }, className:"w-24"}, fmt.cap(m)); }))),
      e("div",{key:"t", className:"flex flex-col gap-2"}, e("p",{className:"text-center text-[12px] font-bold uppercase tracking-wide text-white/75"}, "Texto para o WhatsApp"),
        e("textarea",{readOnly:true, value:texto, rows:Math.min(18, texto.split("\n").length+1), "aria-label":"Texto do resumo fiscal", className:"w-full rounded-lg border border-input bg-input/30 p-3 text-[13px] leading-relaxed outline-none"}))],
    rodape:[e(Bt,{key:"c", tipo:"forte", ic:"copy", onClick:copia}, "Copiar resumo fiscal"), e(Bt,{key:"f", onClick:p.fechar}, "Fechar")]});
}

function AbaFxVisao(p){
  var f = useFx(), s = f.s, ano = p.ano, vg = fxVisaoGeral(s, ano), c = vg.consolidado, av = vg.avisos;
  var jan = useState(false);
  if(!vg.porEmpresa.length) return e(Vazio,{ic:"buildings", acao:e(Bt,{tipo:"forte", ic:"gear", onClick:function(){ p.ir("config"); }}, "Cadastrar empresas")}, "Nenhuma empresa cadastrada no Fiscal.");
  var cabe = fxAindaCabe(s, ano).filter(function(x){ return x.ativo; });
  var copiaDireto = function(){ copiar(fxResumoTexto(s, ano), function(ok){ f.aviso(ok ? "Resumo fiscal copiado. Já pode colar no WhatsApp." : "Não foi possível copiar. Use a janela de conferência.", ok ? "ok" : "alerta"); }); jan[1](true); };
  var semAviso = !av.risco.length && !av.conflito.length;
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"copy", onClick:copiaDireto, titulo:"Copia o texto e abre a janela de conferência"}, "Copiar resumo fiscal")),
    e(Grade,null,
      e(Indicador,{t:"Venda no ano", v:fmt.brl(c.venda), cor:"cian", sub:"Grupo, "+ano}),
      e(Indicador,{t:"ILF do grupo", v:fmt.pct(c.ilf), cor:corCls(c.ilfSt.cls), sub:c.ilfSt.txt==="—" ? "Sem venda" : fmt.cap(c.ilfSt.txt.toLowerCase())+" · meta "+fmt.pct(vg.config.metaIlf, 0)}),
      e(Indicador,{t:"Gap de lastro", v:fmt.brl(c.gapLastro), cor:c.gapLastro>0 ? "alerta" : "ok", sub:"Lastro que falta para a meta"}),
      e(Indicador,{t:"Sobra", v:fmt.brl(c.sobra), cor:c.sobra>=0 ? "ok" : "ruim", sub:"Venda menos contas pagas"}),
      e(Indicador,{t:"Cobertura", v:c.contasDec>0 ? c.cobertura.toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2})+"×" : "—", cor:c.contasDec>0 ? (c.cobertura>=1 ? "ok" : "ruim") : "neutro", sub:"Venda sobre contas pagas"}),
      e(Indicador,{t:"Folga", v:fmt.brl(c.folga), cor:c.contasFut>0 ? (c.folga>=0 ? "ok" : "ruim") : "neutro", sub:"Capacidade menos contas futuras"})),
    e(BlocoBarra,{cor:"turquesa", t:"Avisos", compacto:true, dir:av.risco.length+av.conflito.length || undefined},
      e("div",{className:"flex flex-col gap-2 p-2.5"},
        semAviso && e(Aviso,{cor:"ok", ic:"check-circle"}, "Nenhum aviso de risco ou de conflito em "+ano+"."),
        av.risco.map(function(a){ return e(Aviso,{key:"r"+a.empresaId, cor:"ruim"}, a.texto); }),
        av.conflito.map(function(a){ return e(Aviso,{key:"c"+a.empresaId, cor:"ruim", ic:"scales"}, a.texto); }),
        av.textoGrupo && e(Aviso,{cor:"info", ic:"info"}, av.textoGrupo))),
    e(BlocoBarra,{cor:"turquesa", t:"Ainda cabe no sublimite", compacto:true, dir:cabe.length || undefined},
      e("div",{className:"p-2.5"}, cabe.length ? e(Mosaico,{min:"21rem"}, cabe.map(function(x){ return e(CartaoCabe,{key:x.empresaId, x:x}); })) : e(Vazio,{ic:"chart-bar"}, "Nenhum CNPJ com movimento no ano."))),
    vg.semMovimento.length>0 && e(BlocoBarra,{cor:"turquesa", t:"CNPJs sem movimento", compacto:true, dir:vg.semMovimento.length},
      e("div",{className:"p-2"}, e(Tab,{cols:["Empresa","CNPJ","Venda no ano","Situação"]}, vg.semMovimento.map(function(x){ return e("tr",{key:x.empresa.id, className:LINHA},
        e(Td,{forte:true}, x.empresa.nome), e(Td,{dinheiro:true}, x.empresa.cnpj || "—"), e(Td,{dinheiro:true}, fmt.brl(x.k.acum)), e(Td,null, e(Selo,{cor:"neutro"}, "Abaixo de "+fmt.brl(vg.config.minimoAtivo)))); })))),
    vg.semCnpj.length>0 && e(BlocoBarra,{cor:"turquesa", t:"Sem CNPJ", compacto:true, dir:vg.semCnpj.length},
      e("div",{className:"flex flex-col gap-1.5 p-2"}, e("p",{className:"text-center text-[12px] text-white/70"}, "Empresas em abertura não entram nos avisos nem no resumo fiscal."),
        e(Tab,{cols:["Empresa","Venda no ano"]}, vg.semCnpj.map(function(x){ return e("tr",{key:x.empresa.id, className:LINHA}, e(Td,{forte:true}, x.empresa.nome), e(Td,{dinheiro:true}, fmt.brl(x.k.acum))); })))),
    jan[0] && e(JanelaResumo,{f:f, ano:ano, mesInicial:vg.dec, fechar:function(){ jan[1](false); }}));
}
export { AbaFxVisao, JanelaResumo };
