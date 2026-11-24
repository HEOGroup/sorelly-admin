// Sorelly Admin · montagem — pages/pf/JanelaEditarPag.js
// JANELA "Editar pagamento" do Resumo - Pagamentos (Marcus, 24/11/2026: "arruma isso dentro da padronização... e precisava abrir o valor da venda da vendedora").
// Mesmo desenho da "Lançar pagamento" (JanelaLancarPag.js) e da "Lançar recebimento" da Contas a receber: fundo azul, faixas numeradas, campos de 22 px, letra de 11 px, painel à direita e rodapé Cancelar / Salvar.
// À direita, além do resumo, a VENDA DA REVENDEDORA que fez o Pix (valor de venda, comissão e valor do acerto, lidos da DevMaster, só leitura): rota /api/contas-receber/venda-revendedora.
// Grava com a ação de sempre ("lanc_set" em domain/pf.js): nada muda nas contas.
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { CaixaEscolha } from "@/apps/montagem/components/caixa-escolha";
import { janelasDoForn } from "@/apps/montagem/domain/pf";
import { chamar } from "@/apps/montagem/lib/api";
import { enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { aviso, brl, dbr, op } from "@/apps/montagem/pages/pf/ui";
import { createPortal } from "react-dom";
import { e, useEffect, useState } from "@/shared/react";

var AZ = "var(--bloco-titulo)", FUNDO = "#1b3463";   // os mesmos azuis da Lançar recebimento
var CAMPO = "w-full rounded border border-white/30 bg-[var(--bloco-titulo)] px-1.5 text-center text-[11px] text-white outline-none placeholder:text-white/70 focus-visible:ring-1 focus-visible:ring-white [color-scheme:dark]";   // padrao-ok: janela compacta, letra de 11 px
var BTN = "rounded border border-white/40 bg-[var(--bloco-titulo)] px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60";   // padrao-ok: botão da janela
var BTN_AZ = "rounded border border-white/60 bg-[#3f6bb8] px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60";   // padrao-ok: botão principal da janela
var ALTO = {height:"22px", lineHeight:"20px"};   // padrao-ok: 22 px
var BLOCO = "mx-1.5 mt-1 rounded-md border-2 border-white/40";
var campo = function(rot, no, cls){ return e("label",{className:"flex flex-col items-center gap-0.5 text-center "+(cls || "")}, e("span",{className:"text-[11px] font-semibold leading-none text-white"}, rot), no); };   // padrao-ok: rótulo de 11 px
var faixa = function(t){ return e("div",{className:"flex items-center justify-center rounded-t-[4px] px-2 text-[11px] font-semibold text-white", style:{height:"18px", background:AZ}}, t); };   // padrao-ok: barra de seção de 18 px
var Lr = function(rot, val, cor){ return e("div",{key:rot, className:"flex justify-between gap-2 border-b border-white/15 py-0.5 text-[11px]"}, e("span",null, rot), e("b",{className:"text-right "+(cor || "")}, val || "—")); };   // padrao-ok: linha de 11 px do resumo
var barra = function(t){ return e("div",{key:"b"+t, className:"mt-1 flex items-center justify-center rounded px-2 text-[11px] font-semibold text-white", style:{height:"18px", background:AZ}}, t); };   // padrao-ok: barra de 18 px

function JanelaEditarPag(p){
  var c = p.c, l = p.l, datas = janelasDoForn(c.pf, l.fornId);
  var st = useState({data:l.data, rev:l.revendedora || "", valor:Number(l.valor).toFixed(2), conta:l.conta==="—" ? "" : (l.conta || ""), chavePix:l.chavePix || "", chave:l.chave, arq:null}), v = st[0], setV = st[1];
  var sm = useState(""), msg = sm[0], setMsg = sm[1], ss = useState(false), salvando = ss[0], setSalvando = ss[1];
  var sv = useState({estado:"lendo"}), venda = sv[0], setVenda = sv[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); setMsg(""); };
  var forn = c.pf.fornecedores.find(function(x){ return x.id===l.fornId; });
  // VENDA DA REVENDEDORA: lida de novo quando o nome ou a data mudam (só Financeiro e Diretoria enxergam)
  useEffect(function(){
    var vivo = true, nome = String(v.rev || "").trim(); if(nome.length<3){ setVenda({estado:"erro", txt:"Informe o nome da revendedora."}); return undefined; }
    setVenda({estado:"lendo"});
    var t = setTimeout(function(){ chamar("GET", "/contas-receber/venda-revendedora?nome="+encodeURIComponent(nome)+"&data="+encodeURIComponent(v.data || "")).then(function(d){ if(vivo) setVenda({estado:"ok", d:d}); }).catch(function(x){ if(vivo) setVenda({estado:"erro", txt:(x && x.message) || "Não consegui ler a venda."}); }); }, 450);
    return function(){ vivo = false; clearTimeout(t); };
  }, [v.rev, v.data]);   // eslint-disable-line react-hooks/exhaustive-deps -- só o nome e a data da venda
  var opcoes = datas.some(function(j){ return j.chave===l.chave; }) ? datas : [{chave:l.chave, limite:l.limite || l.chave.split("|")[1]}].concat(datas);
  var opsData = opcoes.map(function(j){ return [j.chave, dbr(j.limite)]; });
  var vNum = parseFloat(v.valor);
  var salvar = function(){
    if(salvando) return;
    if(!(vNum>0)){ setMsg("Informe o valor pago."); return; }
    if(!v.data){ setMsg("Informe a data do pagamento."); return; }
    if(!String(v.rev).trim()){ setMsg("Informe o nome da revendedora."); return; }
    var patch = {data:v.data, revendedora:v.rev, valor:vNum, conta:v.conta, chavePix:v.chavePix, chave:v.chave};
    setSalvando(true); setMsg("");
    var gravar = function(){ op(c, "lanc_set", {id:l.id, patch:patch}); p.fechar(); };
    if(!v.arq) return gravar();
    lerAnexo(v.arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(r){ patch.arqKey = r.key; patch.arqNome = v.arq.name; patch.arqTipo = v.arq.type; gravar(); },
      function(err){ setSalvando(false); aviso(c, ((err && err.message) ? err.message+" " : "")+"Não consegui enviar o comprovante.", "alerta"); });
  };
  var esq = e("div",{className:"pb-1"},
    e("div",{className:BLOCO}, faixa("1 · Pagamento"),
      e("div",{className:"grid w-full grid-cols-3 items-start gap-1 p-1.5"},
        campo("Data do pagamento", e("input",{type:"date", value:v.data, "aria-label":"Data do pagamento", className:CAMPO, style:ALTO, onChange:function(ev){ set("data", ev.target.value); }}), "w-full"),
        campo("Valor", e(Dinheiro,{value:v.valor, out:"ponto", label:"Valor pago", className:"w-full h-[22px]! rounded! border-white/30! bg-[var(--bloco-titulo)]! text-center text-[11px]! text-white!", onChange:function(x){ set("valor", x); }}), "w-full"),   // padrao-ok: campo de valor de 22 px
        campo("Entra no pagamento de", e(CaixaEscolha,{rot:"Entra no pagamento de", valor:v.chave, ops:opsData, vazio:"Escolha a data", aoMudar:function(x){ set("chave", x); }, cls:CAMPO, estilo:ALTO, fundo:FUNDO, campoCls:CAMPO}), "w-full"))),
    e("div",{className:BLOCO}, faixa("2 · Quem pagou"),
      e("div",{className:"grid w-full grid-cols-3 items-start gap-1 p-1.5"},
        campo("Nome da revendedora", e("input",{value:v.rev, "aria-label":"Nome da revendedora", className:CAMPO, style:ALTO, onChange:function(ev){ set("rev", ev.target.value); }}), "w-full"),
        campo("Conta", e("input",{value:v.conta, "aria-label":"Conta", placeholder:"Ex.: Pix - Bradesco Prime", className:CAMPO, style:ALTO, onChange:function(ev){ set("conta", ev.target.value); }}), "w-full"),
        campo("Chave Pix enviada", e("input",{value:v.chavePix, "aria-label":"Chave Pix enviada", placeholder:"Chave que recebeu o Pix", className:CAMPO, style:ALTO, onChange:function(ev){ set("chavePix", ev.target.value); }}), "w-full"))),
    e("div",{className:BLOCO}, faixa("3 · Comprovante"),
      e("div",{className:"grid w-full grid-cols-1 gap-1 p-1.5"},
        campo(l.arqKey || l.arqNome ? "Comprovante atual: "+(l.arqNome || "anexado") : "Sem comprovante", e("label",{className:"flex w-full cursor-pointer items-center justify-center rounded border border-white/30 px-1.5 text-center text-[11px] text-white hover:brightness-125 active:brightness-90", style:Object.assign({background:AZ}, ALTO)}, v.arq ? v.arq.name : (l.arqKey || l.arqNome ? "Trocar arquivo" : "Escolher foto ou PDF"), e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Comprovante", className:"hidden", onChange:function(ev){ var a = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(a) set("arq", a); }})), "w-full"))));   // padrao-ok: letra de 11 px da janela
  var vendas = venda.estado==="ok" ? (venda.d.vendas || []) : [];
  var dir = e("div",{className:"flex flex-col border-l border-white/15 bg-[#223f74] px-2.5 py-2"},
    e("div",{className:"pb-1 text-center text-[11px] font-semibold"}, "O que está lançado"),   // padrao-ok: título de 11 px
    Lr("Fornecedor", forn ? forn.nome : ""), Lr("Lançado", brl(l.valor)), Lr("Revendedora", l.revendedora), Lr("Data", dbr(l.data)),
    vNum>0 && Math.abs(vNum-Number(l.valor))>0.005 && Lr("Novo valor", brl(vNum), "text-warning"),
    barra("Venda da revendedora"),
    venda.estado==="lendo" && e("p",{className:"pt-1 text-center text-[11px]"}, "Lendo a venda na DevMaster…"),   // padrao-ok: aviso de 11 px
    venda.estado==="erro" && e("p",{className:"pt-1 text-center text-[11px] text-warning"}, venda.txt),   // padrao-ok: aviso de 11 px
    venda.estado==="ok" && Lr("Revendedora", venda.d.nome), venda.estado==="ok" && venda.d.representante && Lr("Representante", venda.d.representante),
    venda.estado==="ok" && !vendas.length && e("p",{className:"pt-1 text-center text-[11px]"}, "Sem venda perto desta data."),   // padrao-ok: aviso de 11 px
    vendas.map(function(x, i){ return e("div",{key:"v"+i, className:"mt-1 rounded border border-white/30"}, e("div",{className:"flex items-center justify-center text-[11px] font-semibold", style:{height:"16px", background:AZ}}, "Venda de "+dbr(x.data)), e("div",{className:"px-1.5"}, Lr("Valor de venda", brl(x.venda)), Lr("Comissão", brl(x.comissao)), Lr("Valor do acerto", brl(x.acerto)))); }));   // padrao-ok: letra de 11 px
  return createPortal(e("div",{role:"dialog", "aria-modal":"true", "aria-label":"Editar pagamento", onMouseDown:function(ev){ if(ev.target===ev.currentTarget && !salvando) p.fechar(); }, className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"},
    e("div",{className:"flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto rounded-lg border-2 pb-1.5 text-center text-white shadow-xl", style:{background:FUNDO, borderColor:AZ}},
      e("div",{className:"relative flex items-center justify-center rounded-t-md px-2 py-1 text-white", style:{background:AZ}}, e("b",{className:"text-[11px]"}, "Editar pagamento"), e("button",{type:"button", "aria-label":"Fechar", disabled:salvando, onClick:p.fechar, className:"absolute right-1 rounded px-1 text-[11px] font-semibold underline hover:bg-white/20 active:bg-white/30"}, "Fechar")),   // padrao-ok: título de 11 px e botão de 11 px
      e("div",{className:"grid", style:{gridTemplateColumns:"1.5fr 1fr"}}, esq, dir),
      e("div",{className:"flex flex-wrap items-center gap-1.5 border-t border-white/15 px-3 py-1.5"},
        msg && e("span",{role:"alert", className:"text-[11px] font-semibold text-warning"}, msg),   // padrao-ok: aviso de 11 px da janela
        e("span",{className:"ml-auto"}),
        e("button",{type:"button", disabled:salvando, onClick:p.fechar, style:ALTO, className:BTN+" min-w-20"}, "Cancelar"),
        e("button",{type:"button", disabled:salvando, onClick:salvar, style:ALTO, className:BTN_AZ+" min-w-20"}, salvando ? "Salvando" : "Salvar alteração")))), document.body);
}

export { JanelaEditarPag };
