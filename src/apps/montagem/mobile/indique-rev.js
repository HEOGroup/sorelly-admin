// Sorelly Admin · montagem — mobile/indique-rev.js
// Tela "Indique & Ganhe" do app da revendedora. Lê e grava no módulo Indicações do admin (s.ind; op "ind_add" com origem "app"):
// saldo de moedas, botão "Indicar uma amiga" (aparece no Funil do admin), "Minhas indicações" e "Como funciona" (só o que o domínio diz).
// Troca de moedas por prêmio NÃO existe no app ainda: o texto avisa para falar com a Sorelly. Props: k (a revendedora), onVoltar.
import { formatarMoedas, formatarTelefone, rotuloFunil, saldoDe, semDdi } from "@/apps/montagem/domain/indicacoes";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var CAMPO = "h-11 w-full rounded-xl bg-white px-3 text-[14px] text-[#111827] outline-none ring-1 ring-[#E5E7EB] focus:ring-[#C9A13B]";
var BR = "txt-branco";
var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
// etapa do funil em linguagem simples, do ponto de vista da revendedora
var TEXTO_ETAPA = {criado:"Recebemos a indicação", em_andamento:"Estamos conversando com ela", cadastro_aprovado:"Cadastro aprovado", finalizado:"Kit entregue", cancelado:"Não seguiu adiante"};
var COR_ETAPA = {criado:["#F3F4F6", "#374151"], em_andamento:["#DBEAFE", "#1D4ED8"], cadastro_aprovado:["#FEF3C7", "#B45309"], finalizado:["#DCFCE7", "#15803D"], cancelado:["#F3F4F6", "#6B7280"]};

function TelaIndiqueRev(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, ind = s.ind;
  var fs = useState(false), aberto = fs[0], setAberto = fs[1];
  var vs = useState({nome:"", whatsapp:""}), v = vs[0], setV = vs[1];
  var es = useState(""), erro = es[0], setErro = es[1];
  var os = useState(""), okMsg = os[0], setOk = os[1];
  var cfg = ind.config, minha = ind.revendedoras.find(function(r){ return norm(r.nome)===norm(k.rev); }) || null;
  var saldo = minha ? saldoDe(ind, minha.id) : {saldo:0, proximoVencimento:null};
  var minhas = minha ? ind.indicacoes.filter(function(i){ return String(i.revendedoraId)===String(minha.id); }).sort(function(a, b){ return (b.criadoEm||"").localeCompare(a.criadoEm||""); }) : [];
  var indicar = function(){
    var dg = semDdi(v.whatsapp);
    if(!v.nome.trim()) return setErro("Informe o nome da sua amiga.");
    if(dg.length<10) return setErro("WhatsApp incompleto (com DDD).");
    if(ind.indicacoes.some(function(i){ return i.etapa!=="cancelado" && semDdi(i.indicadaWhatsapp)===dg; })) return setErro("Esse WhatsApp já foi indicado.");
    d({type:"IND", op:"ind_add", por:k.rev+" (app)", revendedoraNome:k.rev, nome:v.nome.trim(), whatsapp:v.whatsapp, origem:"app", observacao:"Origem: app da revendedora"});
    setOk(v.nome.trim()+" foi indicada. Avisaremos o andamento aqui."); setV({nome:"", whatsapp:""}); setErro(""); setAberto(false);
  };
  return [e(CabecaTela,{key:"h", t:"Indique & Ganhe", onVoltar:p.onVoltar}), e(FolhaTela,{key:"c"},
    e("div",{className:"flex items-center gap-3 rounded-xl bg-[#1B1409] p-3 "+BR},
      e("span",{className:"grid size-10 shrink-0 place-items-center rounded-full bg-[#B8862B]"}, e(Icon,{n:"coins", s:18})),
      e("div",{className:"min-w-0 flex-1"}, e("span",{className:"block text-[11px] opacity-70"}, "Seu saldo"), e("b",{className:"block truncate whitespace-nowrap text-[20px] leading-tight"}, formatarMoedas(saldo.saldo)))),
    okMsg && !aberto && e("p",{className:"rounded-xl bg-[#DCFCE7] p-2.5 text-center text-[12.5px] font-semibold text-[#15803D]"}, okMsg),
    aberto ? e("div",{className:"flex flex-col gap-2 rounded-xl bg-[#FBF7EC] p-3 ring-1 ring-[#E8D9AE]"},
        e("b",{className:"text-[13px] text-[#5B4A1E]"}, "Indicar uma amiga"),
        e("input",{className:CAMPO, placeholder:"Nome da amiga", value:v.nome, onChange:function(x){ setV({nome:x.target.value, whatsapp:v.whatsapp}); setErro(""); }}),
        e("input",{className:CAMPO, placeholder:"WhatsApp com DDD", inputMode:"tel", value:v.whatsapp, onChange:function(x){ setV({nome:v.nome, whatsapp:x.target.value}); setErro(""); }}),
        erro && e("span",{className:"text-[12px] font-semibold text-[#B91C1C]"}, erro),
        e("div",{className:"flex gap-2"},
          e("button",{onClick:function(){ setAberto(false); setErro(""); }, className:"h-10 flex-1 rounded-xl bg-white text-[13px] font-bold text-[#374151] ring-1 ring-[#E5E7EB]"}, "Cancelar"),
          e("button",{onClick:indicar, className:"h-10 flex-1 rounded-xl bg-[#B8862B] text-[13px] font-bold "+BR}, "Indicar")))
      : e("button",{onClick:function(){ setAberto(true); setOk(""); }, className:"flex h-11 items-center justify-center gap-2 rounded-xl bg-[#B8862B] text-[14px] font-bold "+BR}, e(Icon,{n:"plus", s:16}), "Indicar uma amiga"),
    e("b",{className:"mt-1 text-[13px] text-[#111827]"}, "Minhas indicações"),
    minhas.length===0 ? e("p",{className:"rounded-xl bg-[#F9FAFB] p-4 text-center text-[12.5px] text-[#6B7280]"}, "Você ainda não indicou ninguém.")
      : minhas.map(function(i){ var c = COR_ETAPA[i.etapa] || COR_ETAPA.criado;
          return e("div",{key:i.id, className:"flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-[#E5E7EB]"},
            e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[13.5px] text-[#111827]"}, i.indicadaNome), e("span",{className:"block truncate whitespace-nowrap text-[11.5px] text-[#6B7280]"}, formatarTelefone(i.indicadaWhatsapp)+(i.moedasCreditadas>0 ? " · +"+formatarMoedas(i.moedasCreditadas) : ""))),
            e("span",{title:rotuloFunil(i.etapa), className:"shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold", style:{background:c[0], color:c[1]}}, TEXTO_ETAPA[i.etapa] || rotuloFunil(i.etapa))); }),
    e("b",{className:"mt-1 text-[13px] text-[#111827]"}, "Como funciona"),
    e("ol",{className:"flex flex-col gap-1.5 rounded-xl bg-[#F9FAFB] p-3 text-[12.5px] leading-snug text-[#374151]"},
      e("li",null, "1. Você indica uma amiga com o nome e o WhatsApp dela."),
      e("li",null, "2. A Sorelly conversa com ela e acompanha o cadastro."),
      cfg.creditarAoFinalizar ? e("li",null, "3. Quando o kit dela for entregue, você ganha "+formatarMoedas(cfg.moedasPorKit)+".") : e("li",null, "3. As moedas são lançadas pela Sorelly."),
      e("li",null, "4. Para trocar as moedas por prêmio, fale com a Sorelly."+(cfg.aplicarValidade && cfg.validadeDias>0 ? " As moedas valem "+cfg.validadeDias+" dias." : ""))))];
}
export { TelaIndiqueRev };
