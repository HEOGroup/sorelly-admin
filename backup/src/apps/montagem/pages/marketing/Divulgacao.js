// Sorelly Admin · montagem — pages/marketing/Divulgacao.js
// Marketing → Divulgação: plano de artes do mês. Quadro (Kanban por status) ou tabela; formulário em Janela.
import { Faixa, Indicador, Janela, Pagina, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { CANAIS, STATUS, TIPOS, artesDoMes, formatarDia, formatarDiaCurto, mesAtual, resumoDivulgacao, rotuloCanal, rotuloStatus, rotuloTipo } from "@/apps/montagem/domain/marketing";
import { Botao, CAMPO, COR, Campo, Chip, Vazio, alternar, nomeDoLink, porDe } from "@/apps/montagem/pages/marketing/comum";
import { use } from "@/apps/montagem/state/context";
import { Kanban } from "@/shared/kanban";
import { e, useState } from "@/shared/react";

var COR_STATUS = {EM_PRODUCAO:"#94A3B8", AGENDADO:"#FBBF24", POSTADO:"#4ADE80"};
var p2 = function(n){ return String(n).padStart(2, "0"); };
var mimeDe = function(url){ var u = String(url).toLowerCase().split("?")[0]; return /\.(mp4)$/.test(u) ? "video/mp4" : /\.(mov)$/.test(u) ? "video/quicktime" : /\.(webm)$/.test(u) ? "video/webm" : /\.png$/.test(u) ? "image/png" : /\.gif$/.test(u) ? "image/gif" : /\.webp$/.test(u) ? "image/webp" : "image/jpeg"; };

// criar / editar arte
function JanelaArte(p){
  var cx = use(), s = cx.state, por = porDe(s), a = p.arte;
  var st = useState({nome:a ? a.nome : "", data:a ? a.data : p.dataPadrao, tipo:a ? a.tipo : "", canais:a ? a.canais : [], status:a ? a.status : "EM_PRODUCAO", videoLink:a && a.videoLink ? a.videoLink : ""}), f = st[0];
  var sl = useState(""), link = sl[0];
  var set = function(c){ st[1](Object.assign({}, f, c)); };
  var atual = a ? (s.mk.artes.find(function(x){ return x.id===a.id; }) || a) : null;
  var salvar = function(){
    if(a) cx.dispatch(Object.assign({type:"MK", op:"arte_edit", id:a.id, por:por}, f));
    else cx.dispatch(Object.assign({type:"MK", op:"arte_add", por:por}, f));
    p.fechar();
  };
  var anexar = function(){ if(!link.trim()) return; cx.dispatch({type:"MK", op:"anexo_add", arteId:a.id, por:por, anexos:[{url:link.trim(), nome:nomeDoLink(link), mime:mimeDe(link), tamanho:0}]}); sl[1](""); };
  var cabecalho = function(t){ return e("span",{className:"text-center text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, t); };
  return e(Janela,{t:a ? "Editar arte" : "Nova arte", fechar:p.fechar, colunas:[
    e("div",{key:"a", className:"flex flex-col gap-2.5"},
      e(Campo,{t:"Nome da arte"}, e("input",{value:f.nome, autoFocus:true, onChange:function(ev){ set({nome:ev.target.value}); }, className:CAMPO+" text-center"})),
      e(Campo,{t:"Data"}, e("input",{type:"date", value:f.data, onChange:function(ev){ set({data:ev.target.value}); }, className:CAMPO+" text-center"})),
      e(Campo,{t:"Link do vídeo (opcional)"}, e("input",{value:f.videoLink, placeholder:"https://", onChange:function(ev){ set({videoLink:ev.target.value}); }, className:CAMPO+" text-center"}))),
    e("div",{key:"b", className:"flex flex-col gap-2.5"},
      e("div",{className:"flex flex-col gap-1.5"}, cabecalho("Tipo"), e("div",{className:"flex flex-wrap justify-center gap-1.5"}, TIPOS.map(function(t){ return e(Chip,{key:t.valor, on:f.tipo===t.valor, onClick:function(){ set({tipo:t.valor}); }}, t.rotulo); }))),
      e("div",{className:"flex flex-col gap-1.5"}, cabecalho("Canais"), e("div",{className:"flex flex-wrap justify-center gap-1.5"}, CANAIS.map(function(t){ return e(Chip,{key:t.valor, on:f.canais.indexOf(t.valor)!==-1, onClick:function(){ set({canais:alternar(f.canais, t.valor)}); }}, t.rotulo); }))),
      e("div",{className:"flex flex-col gap-1.5"}, cabecalho("Status"), e("div",{className:"flex flex-wrap justify-center gap-1.5"}, STATUS.map(function(t){ return e(Chip,{key:t.valor, on:f.status===t.valor, onClick:function(){ set({status:t.valor}); }}, t.rotulo); })))),
    e("div",{key:"c", className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3 ring-1 ring-white/10"},
      e("b",{className:"text-center text-[13px]"}, "Arquivos da arte"),
      !atual ? e("p",{className:"text-center text-[12px] text-white/60"}, "Salve a arte para anexar arquivos por link.") : e("div",{className:"flex flex-col gap-2"},
        atual.anexos.length ? atual.anexos.map(function(n){ return e("div",{key:n.id, className:"flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2 py-1 text-[12px]"},
          e("a",{href:n.url, target:"_blank", rel:"noreferrer", className:"min-w-0 flex-1 truncate text-center hover:underline", title:n.url}, (String(n.mime).indexOf("video/")===0 ? "Vídeo · " : "Foto · ")+nomeDoLink(n.url)),
          e("button",{type:"button", onClick:function(){ cx.dispatch({type:"MK", op:"anexo_del", arteId:atual.id, id:n.id, por:por}); }, className:"rounded-md bg-red-500/20 px-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/35"}, "Remover")); })
          : e("p",{className:"text-center text-[12px] text-white/60"}, "Nenhum arquivo anexado."),
        e("input",{value:link, placeholder:"Link do arquivo (https://)", "aria-label":"Link do arquivo", onChange:function(ev){ sl[1](ev.target.value); }, className:CAMPO+" text-center"}),
        e(Botao,{desativado:!link.trim(), onClick:anexar}, "Anexar"),
        e("p",{className:"text-center text-[11px] text-white/55"}, "O envio de arquivos ainda não existe: use o link."))) ],
    rodape:[e(Botao,{key:"s", principal:true, desativado:!f.nome.trim() || !f.tipo || !f.canais.length || !f.data, onClick:salvar}, "Salvar"), e(Botao,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

function AbaMkDivulgacao(){
  var cx = use(), s = cx.state, por = porDe(s), h = mesAtual();
  var sm = useState(h.ano+"-"+p2(h.mes)), sv = useState("quadro"), sj = useState(null);   // sj: null | {arte|null}
  var ano = +sm[0].slice(0, 4), mes = +sm[0].slice(5, 7);
  var artes = artesDoMes(s, ano, mes), r = resumoDivulgacao(s, ano, mes);
  var mudaStatus = function(id, status){ cx.dispatch({type:"MK", op:"arte_status", id:id, status:status, por:por}); };
  var hoje = new Date(), dataPadrao = (hoje.getFullYear()===ano && hoje.getMonth()+1===mes) ? ano+"-"+p2(mes)+"-"+p2(hoje.getDate()) : ano+"-"+p2(mes)+"-01";
  var colunas = STATUS.map(function(t){ return {k:t.valor, titulo:t.rotulo, cor:COR_STATUS[t.valor], itens:artes.filter(function(x){ return x.status===t.valor; })}; });
  var card = function(x){
    return e("div",{className:"flex flex-col items-center gap-1"},
      e("b",{className:"text-[13px] leading-tight"}, x.nome),
      e("span",{className:"font-mono text-[11.5px] text-white/70"}, formatarDiaCurto(x.data)+" · "+rotuloTipo(x.tipo)),
      e("span",{className:"text-[11px] text-white/60"}, x.canais.map(rotuloCanal).join(" · ")),
      x.anexos.length ? e("span",{className:"text-[11px] text-white/60"}, x.anexos.length+(x.anexos.length===1 ? " arquivo" : " arquivos")) : null);
  };
  var abas = [["quadro", "Quadro"], ["tabela", "Tabela"]];
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e("input",{type:"month", value:sm[0], "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sm[1](ev.target.value); }, className:CAMPO}),
      abas.map(function(a){ return e(Chip,{key:a[0], on:sv[0]===a[0], onClick:function(){ sv[1](a[0]); }}, a[1]); }),
      e(Botao,{principal:true, onClick:function(){ sj[1]({arte:null}); }}, "+ Nova arte")),
    e(Faixa,{n:4}, e(Indicador,{t:"Artes no mês", v:String(r.total), cor:COR}), TIPOS.map(function(t){ return e(Indicador,{key:t.valor, t:t.rotulo, v:String(r.porTipo[t.valor]||0), cor:COR}); })),
    !artes.length ? e(Vazio,null, "Nenhuma arte neste mês.") :
    sv[0]==="quadro" ? e(Kanban,{colunas:colunas, card:card, unidade:["arte","artes"], vazio:"Nenhuma arte nesta etapa.", onMover:function(x, de, para){ mudaStatus(x.id, para); }, onAbrir:function(x){ sj[1]({arte:x}); }})
    : e(Tab,{cols:["Data", "Arte", "Tipo", "Canais", "Status", "Arquivos", ""]}, artes.map(function(x){
        return e("tr",{key:x.id, className:LINHA},
          e(Td,{dinheiro:true}, formatarDia(x.data)),
          e(Td,{forte:true}, e("button",{type:"button", onClick:function(){ sj[1]({arte:x}); }, title:"Abrir a arte", className:"hover:underline"}, x.nome)),
          e(Td,null, rotuloTipo(x.tipo)),
          e(Td,null, x.canais.map(rotuloCanal).join(", ")),
          e(Td,null, e("div",{className:"flex justify-center gap-1"}, STATUS.map(function(t){ return e("button",{key:t.valor, type:"button", onClick:function(){ if(x.status!==t.valor) mudaStatus(x.id, t.valor); }, title:"Marcar como "+t.rotulo.toLowerCase(), className:"rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 "+(x.status===t.valor ? "text-white" : "text-white/55 ring-white/10 hover:bg-white/10"), style:x.status===t.valor ? {background:COR_STATUS[t.valor]+"44", boxShadow:"inset 0 0 0 1px "+COR_STATUS[t.valor]} : undefined}, t.rotulo); }))),
          e(Td,{dinheiro:true}, String(x.anexos.length)),
          e(Td,null, e("button",{type:"button", onClick:function(){ cx.dispatch({type:"MK", op:"arte_del", id:x.id, por:por}); }, className:"rounded-md bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-300 hover:bg-red-500/35", title:"Excluir a arte"}, "Excluir")));
      })),
    sj[0] && e(JanelaArte,{key:sj[0].arte ? sj[0].arte.id : "nova", arte:sj[0].arte, dataPadrao:dataPadrao, fechar:function(){ sj[1](null); }}));
}
export { AbaMkDivulgacao };
