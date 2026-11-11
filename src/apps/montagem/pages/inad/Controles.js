// Sorelly Admin · montagem — pages/inad/Controles.js
// Inadimplência › Pagamentos, Serasa e Kits em atraso (11/11/2026). Três planilhas com filtro no nome da coluna; a linha abre a janela de edição.
// Pagamento novo é lançado na ficha da dívida (aba Dívidas), porque todo pagamento pertence a uma dívida. Contas em domain/inadimplencia.js (estado s.inad, ação INAD).
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { Bloco, Botao, CampoSel, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { NOTAS, formatarDia, hojeIso, mesDoPagamento, rotuloMes } from "@/apps/montagem/domain/inadimplencia";
import { FichaDivida } from "@/apps/montagem/pages/inad/Dividas";
import { CampoDin, CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useMemo, useState } from "@/shared/react";

var R$ = function(v){ return v==null ? "" : brl(v); }, dia = function(v){ return formatarDia(v); };
var op = function(l){ return l.map(function(x){ return [x, x]; }); };
var semDados = function(cab){ return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados da Inadimplência indisponíveis.")); };
var comAtual = function(lista, v){ return op(v && lista.indexOf(v)<0 ? [v].concat(lista) : lista); };

// ---------- Pagamentos ----------
function AbaInadPagamentos(){
  var ctx = use(), s = ctx.state, d = ctx.dispatch, inad = s.inad, por = porDe(s), mesAtual = hojeIso().slice(0, 7);
  var sv = useState("baixar"), vista = sv[0], sf = useState(null), ficha = sf[0];
  var todas = useMemo(function(){ return inad ? (inad.pagamentos||[]).slice().sort(function(a, b){ return String(b.data || b.mes || "").localeCompare(String(a.data || a.mes || "")); }).map(function(p){ return {id:p.id, data:p.data||"", mes:rotuloMes(mesDoPagamento(p)), mesK:mesDoPagamento(p), nome:p.nome, valor:p.valor, tipo:p.tipo||"", quem:p.quem||"", comissao:p.comissao||"", conta:p.conta||"",
    confirmado:p.novo && !p.confirmado ? "A confirmar" : "Confirmado", baixado:p.baixado ? "Baixado" : "Falta baixar", comprovante:p.comprovante||"", obs:[p.obs, p.extra].filter(Boolean).join(" · "), dataDivida:p.dataDivida||"", dividaId:p.dividaId||"", ligada:p.dividaId ? "Ligado" : "Sem dívida"}; }) : []; }, [inad]);
  var linhas = useMemo(function(){ return vista==="baixar" ? todas.filter(function(l){ return l.baixado==="Falta baixar" || l.confirmado==="A confirmar"; }) : vista==="mes" ? todas.filter(function(l){ return l.mesK===mesAtual; }) : todas; }, [todas, vista, mesAtual]);
  var cab = e(PageHead,{t:"Pagamentos", sub:"Tudo o que entrou. Cada pagamento mostra quem recuperou, a conta e se já foi baixado na DevMaster. O pagamento novo é lançado na ficha da dívida."},
    e(Segmentado,{opcoes:[["baixar", "Falta baixar ou confirmar"], ["mes", "Mês atual"], ["tudo", "Tudo"]], atual:vista, onMudar:sv[1]}));
  if(!inad) return semDados(cab);
  var marca = function(l, campo, valor){ var c = {}; c[campo] = valor; d({type:"INAD", op:"pag_campos", id:l.id, campos:c, por:por}); };
  var cols = [{k:"data", t:"Data do pagamento", fmt:dia}, {k:"nome", t:"Devedora"}, {k:"valor", t:"Valor pago", fmt:R$, cor:function(){ return "text-emerald-400"; }}, {k:"tipo", t:"Tipo"}, {k:"quem", t:"Quem recuperou"}, {k:"comissao", t:"Comissão da rep."}, {k:"conta", t:"Conta de recebimento"},
    {k:"confirmado", t:"Recebimento", cor:function(l){ return l.confirmado==="Confirmado" ? "text-emerald-400" : "text-amber-300"; }, render:function(v, l){ return v==="Confirmado" ? v : e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); marca(l, "confirmado", true); }, className:"h-8 rounded-md border border-primary px-2 text-[13px] text-primary hover:bg-primary/20"}, "Confirmar"); }},
    {k:"baixado", t:"DevMaster", cor:function(l){ return l.baixado==="Baixado" ? "text-emerald-400" : "text-red-400"; }, render:function(v, l){ return e("label",{onClick:function(ev){ ev.stopPropagation(); }, className:"inline-flex h-8 cursor-pointer items-center gap-2"}, e("input",{type:"checkbox", checked:v==="Baixado", onChange:function(ev){ marca(l, "baixado", ev.target.checked); }, className:"size-4 accent-[#E8B84B]"}), v); }},
    {k:"dataDivida", t:"Data da dívida", fmt:dia}, {k:"comprovante", t:"Comprovante"}, {k:"obs", t:"Observação"}, {k:"ligada", t:"Dívida"}, {k:"mes", t:"Mês"}];
  var total = function(ls){ var v = 0; ls.forEach(function(l){ v += l.valor||0; }); return ["Total", ls.length.toLocaleString("pt-BR")+" pagamentos", R$(v), "", "", "", "", "", "", "", "", "", "", ""]; };
  return e(Pagina,null, cab,
    e(TabelaPlanilha,{key:vista, cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, limite:100, totalLinha:total, aoClicar:function(l){ if(l.dividaId) sf[1](l.dividaId); }, vazio:vista==="baixar" ? "Nenhum pagamento esperando baixa ou confirmação." : "Nenhum pagamento nesta visão."}),
    ficha && e(FichaDivida,{id:ficha, fechar:function(){ sf[1](null); }}));
}

// janela genérica de edição: campos = [[chave, rótulo, tipo, opções]]
function Editar(p){
  var st = useState(p.inicial), f = st[0], set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var form = e(Bloco,{key:"f", t:p.bloco}, e("div",{className:"grid grid-cols-2 gap-2 pt-1"}, p.campos.map(function(c){ var k = c[0], id = "ed_"+k;
    return c[2]==="sel" ? e(CampoSel,{key:k, t:c[1], id:id, value:f[k]||"", onChange:function(v){ set(k, v); }, opcoes:c[3](f[k])}) : c[2]==="din" ? e(CampoDin,{key:k, t:c[1], id:id, value:f[k], onChange:function(v){ set(k, v); }})
      : e(CampoTexto,{key:k, t:c[1], id:id, tipo:c[2]==="data" ? "date" : "text", cls:c[2]==="largo" ? "col-span-2" : "", value:f[k]||"", onChange:function(v){ set(k, v); }}); })));
  return e(Janela,{t:p.t, sub:p.sub, fechar:p.fechar, colunas:[form], rodape:[e(Botao,{key:"c", onClick:p.fechar}, "Cancelar"), e(Botao,{key:"s", principal:true, onClick:function(){ p.salvar(f); }}, "Salvar")]});
}

// ---------- Serasa ----------
var ST_SERASA = ["Negativada", "Será executada", "Advogado", "Negociação", "Pagou", "Baixada"], NOTIF = ["Pendente", "Enviada"];
function AbaInadSerasa(){
  var ctx = use(), s = ctx.state, d = ctx.dispatch, inad = s.inad, por = porDe(s), se = useState(null), ed = se[0];
  var linhas = useMemo(function(){ return inad ? (inad.serasa||[]).map(function(n){ return {id:n.id, condicional:n.condicional||"", dataDivida:n.dataDivida||"", dataNeg:n.dataNeg||"", mes:n.dataNeg ? rotuloMes(n.dataNeg.slice(0, 7)) : (n.secao||""), nome:n.nome, valor:n.valor, status:n.status||"", notificacao:n.notificacao||"", obs:n.obs||"", anotacao:[n.anotacao, n.extra].filter(Boolean).join(" · "), baixaEm:n.baixaEm||"", ligada:n.dividaId ? "Ligada" : "Sem dívida"}; }) : []; }, [inad]);
  var cab = e(PageHead,{t:"Serasa", sub:"Devedoras negativadas, notificação e baixa da restrição. A negativação nunca é automática: depende de análise do setor."}, e(Botao,{principal:true, onClick:function(){ se[1]({novo:true}); }}, "Nova negativação"));
  if(!inad) return semDados(cab);
  var cols = [{k:"dataNeg", t:"Negativação", fmt:dia}, {k:"nome", t:"Devedora"}, {k:"condicional", t:"Condicional"}, {k:"dataDivida", t:"Data da dívida", fmt:dia}, {k:"valor", t:"Valor negativado", fmt:R$},
    {k:"status", t:"Situação", cor:function(l){ return /pagou|baixad/i.test(l.status) ? "text-emerald-400" : /negocia/i.test(l.status) ? "text-amber-300" : "text-red-400"; }}, {k:"notificacao", t:"Notificação"}, {k:"obs", t:"Observação"}, {k:"anotacao", t:"Anotação"}, {k:"baixaEm", t:"Baixa da restrição", fmt:dia}, {k:"ligada", t:"Dívida"}, {k:"mes", t:"Mês"}];
  var total = function(ls){ var v = 0; ls.forEach(function(l){ v += l.valor||0; }); return ["Total", ls.length.toLocaleString("pt-BR")+" negativações", "", "", R$(v), "", "", "", "", "", "", ""]; };
  var reg = ed && !ed.novo ? (inad.serasa||[]).find(function(n){ return n.id===ed.id; }) : null;
  return e(Pagina,null, cab,
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, limite:100, totalLinha:total, aoClicar:function(l){ se[1]({id:l.id}); }, vazio:"Nenhuma negativação registrada."}),
    ed && ed.novo && e(Editar,{t:"Nova negativação", bloco:"Dados", inicial:{nome:"", condicional:"", dataDivida:"", dataNeg:hojeIso(), valor:null, notificacao:"Pendente", anotacao:""}, fechar:function(){ se[1](null); },
      campos:[["nome", "Devedora", "largo"], ["condicional", "Condicional"], ["valor", "Valor negativado", "din"], ["dataDivida", "Data da dívida", "data"], ["dataNeg", "Data da negativação", "data"], ["notificacao", "Notificação", "sel", function(){ return op(NOTIF); }], ["anotacao", "Anotação"]],
      salvar:function(f){ var dv = (inad.dividas||[]).filter(function(x){ return x.nome===String(f.nome).trim().toUpperCase(); }); d(Object.assign({type:"INAD", op:"ser_nova", por:por, dividaId:dv.length===1 ? dv[0].id : ""}, f)); if(String(f.nome).trim() && f.dataNeg) se[1](null); }}),
    reg && e(Editar,{t:reg.nome, sub:"Negativada em "+dia(reg.dataNeg), bloco:"Controle", inicial:{status:reg.status||"", notificacao:reg.notificacao||"", notificadaEm:reg.notificadaEm||"", baixaEm:reg.baixaEm||"", condicional:reg.condicional||"", obs:reg.obs||"", anotacao:reg.anotacao||""}, fechar:function(){ se[1](null); },
      campos:[["status", "Situação", "sel", function(v){ return comAtual(ST_SERASA, v); }], ["notificacao", "Notificação", "sel", function(v){ return comAtual(NOTIF, v); }], ["notificadaEm", "Data da notificação", "data"], ["baixaEm", "Baixa da restrição", "data"], ["condicional", "Condicional"], ["obs", "Observação"], ["anotacao", "Anotação", "largo"]],
      salvar:function(f){ d({type:"INAD", op:"ser_campos", id:reg.id, campos:f, por:por}); se[1](null); }}));
}

// ---------- Kits em atraso ----------
var ST_KIT = ["Verificar", "Entrei em contato", "Juridico", "Kit recuperado"];
function AbaInadKits(){
  var ctx = use(), s = ctx.state, d = ctx.dispatch, inad = s.inad, por = porDe(s), se = useState(null), ed = se[0];
  var linhas = useMemo(function(){ return inad ? (inad.kits||[]).map(function(k){ return {id:k.id, data:k.data||"", nome:k.nome, rep:k.rep||"", quemPassou:k.quemPassou||"", atraso:k.atraso||"", status:k.status||"", condicional:k.condicional||"", valor:k.valor, nota:k.nota||"", notaCom:k.notaCom||"", obs:k.extra||"", secao:k.secao||""}; }) : []; }, [inad]);
  var cab = e(PageHead,{t:"Kits em atraso", sub:"Acertos em atraso e kits não devolvidos. Mostra a situação, a nota promissória e com quem ela está."}, e(Botao,{principal:true, onClick:function(){ se[1]({novo:true}); }}, "Novo kit em atraso"));
  if(!inad) return semDados(cab);
  var cols = [{k:"data", t:"Data", fmt:dia}, {k:"nome", t:"Revendedora"}, {k:"rep", t:"Representante"}, {k:"quemPassou", t:"Quem passou"}, {k:"atraso", t:"Atraso"},
    {k:"status", t:"Situação", cor:function(l){ return /recuperad/i.test(l.status) ? "text-emerald-400" : /jur/i.test(l.status) ? "text-red-400" : "text-amber-300"; }}, {k:"condicional", t:"Condicional"}, {k:"valor", t:"Valor do kit", fmt:R$},
    {k:"nota", t:"Nota promissória", cor:function(l){ return /^assinada$/i.test(l.nota) ? "" : "text-red-400"; }}, {k:"notaCom", t:"Nota está com"}, {k:"obs", t:"Observação"}, {k:"secao", t:"Mês"}];
  var total = function(ls){ var v = 0; ls.forEach(function(l){ v += l.valor||0; }); return ["Total", ls.length.toLocaleString("pt-BR")+" kits", "", "", "", "", "", R$(v), "", "", "", ""]; };
  var reg = ed && !ed.novo ? (inad.kits||[]).find(function(k){ return k.id===ed.id; }) : null;
  var campos = [["nome", "Revendedora", "largo"], ["data", "Data", "data"], ["valor", "Valor do kit", "din"], ["rep", "Representante"], ["quemPassou", "Quem passou"], ["status", "Situação", "sel", function(v){ return comAtual(ST_KIT, v); }], ["nota", "Nota promissória", "sel", function(v){ return comAtual(NOTAS, v); }], ["condicional", "Condicional"], ["notaCom", "Nota está com"], ["atraso", "Atraso", "largo"], ["obs", "Observação", "largo"]];
  return e(Pagina,null, cab,
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, limite:100, totalLinha:total, aoClicar:function(l){ se[1]({id:l.id}); }, vazio:"Nenhum kit em atraso registrado."}),
    ed && ed.novo && e(Editar,{t:"Novo kit em atraso", bloco:"Dados", inicial:{nome:"", data:hojeIso(), valor:null, rep:"", quemPassou:"", status:"Verificar", nota:"Verificar", condicional:"", notaCom:"", atraso:"", obs:""}, campos:campos, fechar:function(){ se[1](null); },
      salvar:function(f){ d(Object.assign({type:"INAD", op:"kit_novo", por:por}, f)); if(String(f.nome).trim() && f.data) se[1](null); }}),
    reg && e(Editar,{t:reg.nome, sub:reg.rep ? "Representante "+reg.rep : "", bloco:"Controle", inicial:{nome:reg.nome, data:reg.data||"", valor:reg.valor, rep:reg.rep||"", quemPassou:reg.quemPassou||"", status:reg.status||"", nota:reg.nota||"", condicional:reg.condicional||"", notaCom:reg.notaCom||"", atraso:reg.atraso||"", obs:reg.extra||""}, campos:campos, fechar:function(){ se[1](null); },
      salvar:function(f){ var c = Object.assign({}, f, {extra:f.obs}); delete c.obs; d({type:"INAD", op:"kit_campos", id:reg.id, campos:c, por:por}); se[1](null); }}));
}

export { AbaInadPagamentos, AbaInadSerasa, AbaInadKits };
