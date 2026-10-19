// Sorelly Admin · montagem — pages/Cnpjs.js
// Cadastro das empresas da Sorelly: quatro blocos (2 a 2) e, ao clicar num CNPJ, a tela cheia com todos os dados, sócio, funcionários, fiscal e documentos anexados.
// O fiscal e a projeção completos ficam em Limite de faturamento. Cadastro editado fica em state.cnpjs; documentos em state.cnpjDocs (arquivo guardado como mídia).
import { CAMPOS_CNPJ, CAMPOS_EXTRA, DOCS_CNPJ, cnpjsDe, mensagemCnpj, fiscalAtual, indicadoresFiscais, SUBLIMITE_ANUAL } from "@/apps/montagem/domain/cnpjs";
import { DIRETORIA } from "@/apps/montagem/domain/equipe";
import { funcionarios } from "@/apps/montagem/domain/pessoas";
import { guardarMidia, lerMidia, uid } from "@/apps/montagem/domain/chat-store";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var NOMES = {copiar:"copy", pessoas:"users-three", banco:"bank", calendario:"calendar-dots", relatorio:"chart-bar", documento:"file-text", clipe:"paperclip", lixeira:"trash", setadireita:"arrow-right", setaesquerda:"arrow-left"};
function Icon(p){ return e(Ph,{n:NOMES[p.n] || p.n, s:p.s, fill:p.peso==="fill", className:p.className}); }
var EDIT_INPUT = INPUT+" h-9! w-full border-white/30! bg-black/25! text-white!";
var porCnpj = function(id){ return funcionarios().filter(function(f){ return f.cnpj===id; }); };

// linha com traço embaixo: nome do dado à esquerda, valor à direita
function Linha(p){
  return e("div",{className:"grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 border-b border-white/10 py-1.5 last:border-b-0"},
    e("span",{className:"pt-0.5 text-[11px] font-semibold uppercase leading-tight tracking-wide text-white/60"}, p.t),
    p.edit ? p.edit : e("span",{className:"min-w-0 break-words text-[13.5px] font-medium text-white"}, p.v || "—"));
}
function Secao(p){
  return e("section",{className:"overflow-hidden rounded-xl border bg-black/30", style:{borderColor:p.cor+"88"}},
    e("div",{className:"flex items-center gap-2 px-3 py-2", style:{background:p.cor+"55", borderBottom:"1px solid "+p.cor+"88"}}, p.ic && e(Icon,{n:p.ic, s:16, peso:"fill"}), e("h3",{className:"font-heading text-[14px] font-bold text-white"}, p.t), p.dir && e("span",{className:"ml-auto"}, p.dir)),
    e("div",{className:"flex flex-col px-3 py-1.5"}, p.children));
}

// copiar a mensagem pronta (WhatsApp)
function copiarMsg(d, c){ var t = mensagemCnpj(c); if(!t){ d({type:"AVISO", txt:"Este CNPJ ainda não tem número"}); return; } try{ navigator.clipboard.writeText(t); d({type:"AVISO", txt:"Mensagem do "+c.nome+" copiada"}); }catch(x){ d({type:"AVISO", txt:"Não consegui copiar. Selecione e copie o texto."}); } }

// bloco da lista (tela 1): as informações que mais se manda para banco, e os botões de copiar e abrir
function BlocoCnpj(p){
  var d = use().dispatch, c = p.c, n = porCnpj(c.id).length;
  var info = [["Razão social", c.razao], ["CNPJ", c.cnpj], ["Inscrição estadual", c.ie], ["Inscrição municipal", c.im], ["Endereço", [c.endereco, c.bairro].filter(Boolean).join(" · ")], ["CEP", c.cep], ["E-mail", c.email], ["Telefone", c.telefone], ["Sócio", c.socio], ["Contrato social", c.contrato]].filter(function(x){ return x[1]; });
  return e("section",{className:"flex flex-col overflow-hidden rounded-2xl border shadow-lg", style:{borderColor:c.cor, background:"linear-gradient(180deg,"+c.cor+"33,rgba(0,0,0,.35))"}},
    e("button",{onClick:p.abrir, className:"flex items-center gap-3 px-4 py-2.5 text-left", style:{background:c.cor}},
      e("span",{className:"grid size-10 place-items-center rounded-xl bg-black/25 font-heading text-[15px] font-bold text-white"}, c.num || "H&O"),
      e("div",{className:"min-w-0 flex-1"}, e("h2",{className:"truncate font-heading text-[18px] font-bold leading-tight text-white"}, c.nome), e("p",{className:"truncate text-[11.5px] text-white/85"}, c.cnpj || "CNPJ a informar")),
      e("span",{className:"flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[12px] font-bold text-white", title:"Funcionários neste CNPJ"}, e(Icon,{n:"pessoas", s:14, peso:"fill"}), n)),
    e("div",{className:"flex flex-col px-4 py-1.5"}, info.map(function(x){ return e(Linha,{key:x[0], t:x[0], v:x[1]}); })),
    e("div",{className:"mt-auto flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2"},
      e("button",{onClick:function(){ copiarMsg(d, c); }, className:"flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-black/50"}, e(Icon,{n:"copiar", s:14}), "Copiar mensagem pronta"),
      e("button",{onClick:p.abrir, className:"flex items-center gap-1.5 text-[12.5px] font-semibold text-white/80 hover:text-white"}, "Abrir tudo em tela cheia", e(Icon,{n:"setadireita", s:14}))));
}

// tela cheia de um CNPJ
function CnpjCheio(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, ed = useState(false), editando = ed[0], setEditando = ed[1], ep = useState(""), tipoDoc = ep[0], setTipoDoc = ep[1];
  var mostraCpf = s.usuario===29 || DIRETORIA.some(function(x){ return x.id===s.usuario; });
  var gente = porCnpj(c.id), porSetor = {}; gente.forEach(function(f){ (porSetor[f.setor] = porSetor[f.setor] || []).push(f); });
  var fisc = fiscalAtual(s.fiscal, c.id), ind = indicadoresFiscais(fisc), docs = (s.cnpjDocs||{})[c.id] || [];
  var campo = function(k, rot){ var v = c[k] || ""; return e(Linha,{key:k, t:rot, v:v, edit:editando ? e("input",{className:EDIT_INPUT+" max-w-[60%]", value:v, "aria-label":c.nome+" "+rot, onChange:function(ev){ d({type:"CNPJ_SET", id:c.id, campo:k, valor:ev.target.value}); }}) : null}); };
  var anexar = function(tipo, ev){
    var arq = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!arq) return;
    if(arq.size>3*1024*1024){ window.alert("O arquivo passa de 3 MB. Envie uma versão menor."); return; }
    var r = new FileReader(); r.onload = function(){ d({type:"CNPJ_DOC_ADD", id:c.id, doc:{id:uid("dc_"), tipo:tipo, nome:arq.name, tam:arq.size, ts:Date.now(), key:guardarMidia(r.result)}}); }; r.readAsDataURL(arq);
  };
  var baixar = function(doc){ var url = lerMidia(doc.key); if(!url){ window.alert("Este arquivo só ficou neste navegador até recarregar. Anexe de novo."); return; } var a = document.createElement("a"); a.href = url; a.download = doc.nome; a.click(); };
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 shadow-lg", style:{background:c.cor}},
      e("button",{onClick:p.voltar, className:"flex items-center gap-1.5 rounded-lg border border-white/40 bg-black/20 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-black/35"}, e(Icon,{n:"setaesquerda", s:15}), "Voltar"),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[11px] font-bold uppercase tracking-widest text-white/75"}, c.num ? "CNPJ "+c.num : "Empresa"), e("h2",{className:"truncate font-heading text-2xl font-bold text-white"}, c.nome), e("p",{className:"truncate text-[12.5px] text-white/85"}, (c.razao || "")+(c.cnpj ? " · "+c.cnpj : ""))),
      e("div",{className:"flex items-center gap-1.5 rounded-xl bg-black/25 px-4 py-2 text-white"}, e(Icon,{n:"pessoas", s:20, peso:"fill"}), e("span",{className:"font-heading text-[26px] font-bold leading-none"}, gente.length), e("span",{className:"text-[11px] font-semibold uppercase leading-tight"}, "funcionários\nneste CNPJ")),
      e("button",{onClick:function(){ setEditando(!editando); }, className:"rounded-lg border border-white/40 bg-black/20 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-black/35"}, editando ? "Pronto" : "Editar dados")),
    e("div",{className:"grid grid-cols-1 items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3"},
      e(Secao,{t:"Dados da empresa", ic:"banco", cor:c.cor, dir:e("button",{onClick:function(){ copiarMsg(d, c); }, className:"flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-1 text-[12px] font-bold text-white hover:bg-black/50"}, e(Icon,{n:"copiar", s:13}), "Copiar mensagem")}, CAMPOS_CNPJ.filter(function(x){ return ["email","socio","cpf"].indexOf(x[0])<0; }).concat(CAMPOS_EXTRA.filter(function(x){ return ["contador","alvaraVal","certVal"].indexOf(x[0])<0; })).map(function(x){ return campo(x[0], x[1]); })),
      e("div",{className:"flex flex-col gap-4"},
        e(Secao,{t:"Sócio e contatos", ic:"pessoas", cor:c.cor}, campo("socio","Sócio"), mostraCpf ? campo("cpf","CPF do sócio") : e(Linha,{t:"CPF do sócio", v:"só a diretoria vê"}), campo("email","E-mail"), campo("contador","Contador")),
        e(Secao,{t:"Validades", ic:"calendario", cor:c.cor}, campo("alvaraVal","Validade do alvará"), campo("certVal","Validade do certificado digital")),
        e(Secao,{t:"Fiscal (resumo)", ic:"relatorio", cor:c.cor, dir:e("span",{className:"text-[11px] text-white/70"}, fisc.data ? "em "+fisc.data.split("-").reverse().join("/") : "sem lançamento")},
          e(Linha,{t:"Faturamento do ano", v:BK(fisc.fatAnual)}), e(Linha,{t:"Limite anual", v:BK(SUBLIMITE_ANUAL)}), e(Linha,{t:"Já usou do limite", v:ind.pctSublimite.toFixed(1).replace(".", ",")+"%"}), e(Linha,{t:"Falta para o limite", v:BK(ind.falta)}))),
    ),
    e("div",{className:"grid grid-cols-1 items-start gap-4 lg:grid-cols-2"},
        e(Secao,{t:"Documentos anexados", ic:"documento", cor:c.cor, dir:e("span",{className:"text-[11px] text-white/70"}, docs.length+" arquivo"+(docs.length===1 ? "" : "s"))},
          DOCS_CNPJ.map(function(t){ var meus = docs.filter(function(x){ return x.tipo===t; });
            return e("div",{key:t, className:"flex flex-col gap-1 border-b border-white/10 py-1.5 last:border-b-0"},
              e("div",{className:"flex items-center gap-2"},
                e("span",{className:"min-w-0 flex-1 text-[13px] font-semibold text-white"}, t),
                e("span",{className:"rounded-full px-2 py-0.5 text-[10.5px] font-bold "+(meus.length ? "bg-emerald-500/25 text-emerald-200" : "bg-red-500/25 text-red-200")}, meus.length ? meus.length+" anexado"+(meus.length>1 ? "s" : "") : "falta"),
                e("label",{className:"cursor-pointer rounded-lg border border-white/30 bg-black/25 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-black/40"}, "Anexar", e("input",{type:"file", className:"hidden", onChange:function(ev){ anexar(t, ev); }}))),
              meus.map(function(x){ return e("div",{key:x.id, className:"flex items-center gap-2 pl-2 text-[12px] text-white/85"},
                e(Icon,{n:"clipe", s:13}), e("button",{onClick:function(){ baixar(x); }, className:"min-w-0 flex-1 truncate text-left underline-offset-2 hover:underline", title:"Baixar"}, x.nome),
                e("span",{className:"text-white/50"}, new Date(x.ts).toLocaleDateString("pt-BR")),
                e("button",{onClick:function(){ if(window.confirm("Remover este arquivo?")) d({type:"CNPJ_DOC_DEL", id:c.id, docId:x.id}); }, "aria-label":"Remover", className:"text-white/60 hover:text-red-300"}, e(Icon,{n:"lixeira", s:14}))); })); })),
      e(Secao,{t:"Funcionários deste CNPJ", ic:"pessoas", cor:c.cor, dir:e("b",{className:"text-[13px] text-white"}, gente.length)},
        gente.length===0 ? e("p",{className:"py-2 text-[13px] text-white/70"}, "Ninguém ligado a este CNPJ ainda.") :
        Object.keys(porSetor).sort().map(function(st){ return e("div",{key:st, className:"border-b border-white/10 py-1.5 last:border-b-0"},
          e("p",{className:"flex items-center justify-between text-[12px] font-bold uppercase tracking-wide text-white/70"}, st, e("span",null, porSetor[st].length)),
          e("p",{className:"text-[12.5px] text-white"}, porSetor[st].map(function(f){ return f.nome; }).join(" · "))); })))
  );
}

function AbaCnpjs(){
  var s = use().state, ab = useState(null), aberto = ab[0], setAberto = ab[1], lista = cnpjsDe(s.cnpjs), c = lista.find(function(x){ return x.id===aberto; });
  if(c) return e(React.Fragment,null, e(PageHead,{t:"CNPJs", sub:"Tudo de uma empresa em uma tela só."}), e(CnpjCheio,{c:c, voltar:function(){ setAberto(null); }}));
  return e(React.Fragment,null,
    e(PageHead,{t:"CNPJs", sub:"As empresas da Sorelly. Clique em uma para abrir tudo: dados, sócio, funcionários, fiscal e documentos."}),
    e("div",{className:"mx-auto grid w-full max-w-6xl grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] items-stretch gap-3"},
      lista.filter(function(x){ return x.num; }).map(function(x){ return e(BlocoCnpj,{key:x.id, c:x, abrir:function(){ setAberto(x.id); }}); })));
}

export { AbaCnpjs, Linha, Secao };
