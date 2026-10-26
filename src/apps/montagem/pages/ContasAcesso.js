// Sorelly Admin · montagem — pages/ContasAcesso.js
// RH → Acessos e autorizações → aba "Contas": quem criou conta no sistema. A Diretoria libera, liga a conta a uma pessoa do sistema e escolhe os setores.
// Só funciona com o servidor ligado (lib/api.js). Quem não é da Diretoria recebe aviso do próprio servidor. Código do servidor: src/server/contas.js e app/api/contas.
import { Botao, Bloco, CAMPO, FaixaTotais } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { EQUIPE } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { reabrirEscolha, restaurarCopiaAntesServidor, temCopiaAntesServidor } from "@/apps/montagem/lib/sync-modulos";
import { e, useEffect, useState } from "@/shared/react";

// mesmos nomes do servidor (src/server/permissoes.js → SETORES_VALIDOS)
var SETORES = [["rh","RH"], ["cobranca","Cobrança"], ["socios","Sócios"], ["financeiro","Financeiro"], ["linkpag","Link de pagamento"], ["agendamento","Agendamento"], ["cadastro","Cadastro"], ["kitsnovos","Kits novos"], ["montagem","Montagem"], ["producao","Produção"], ["encomendas","Encomendas"], ["pecas","Peças"], ["marketing","Marketing"], ["garantia","Garantia"]];
var ROTULO_STATUS = {aguardando:"Aguardando", ativo:"Ativo", bloqueado:"Bloqueado"};
var COR_STATUS = {aguardando:"text-warning", ativo:"text-success", bloqueado:"text-destructive"};

function pessoasDoSistema(){ return EQUIPE.map(function(p){ return {id:p.id, nome:p.nome}; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); }); }
function dataCurta(t){ try { return new Date(t).toLocaleDateString("pt-BR"); } catch(x){ return ""; } }

function LinhaConta(p){
  var c = p.c, ativo = c.status==="ativo";
  var muda = function(corpo){ p.onMudar(c.id, corpo); };
  var alterna = function(k){ var l = c.setores.indexOf(k)>=0 ? c.setores.filter(function(x){ return x!==k; }) : c.setores.concat([k]); muda({setores:l}); };
  return e("div",{className:"flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-3"},
    e("div",{className:"flex flex-wrap items-center gap-x-4 gap-y-1"},
      e("div",{className:"min-w-0 flex-1"},
        e("div",{className:"truncate text-[14px] font-semibold", title:c.nome}, c.nome),
        e("div",{className:"truncate text-[13px] text-foreground", title:c.email}, c.email+" · criada em "+dataCurta(c.criadoEm))),
      e("span",{className:"text-[13px] font-semibold uppercase tracking-[.05em] "+COR_STATUS[c.status]}, ROTULO_STATUS[c.status]),
      c.status!=="ativo" && e(Botao,{principal:true, desabilitado:c.pessoaId==null, title:c.pessoaId==null ? "Escolha a pessoa do sistema antes de liberar" : "Liberar o acesso", onClick:function(){ muda({status:"ativo"}); }}, c.status==="bloqueado" ? "Reativar" : "Liberar"),
      c.status!=="bloqueado" && e(Botao,{onClick:function(){ muda({status:"bloqueado"}); }}, "Bloquear")),
    e("div",{className:"grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-4"},
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Pessoa do sistema",
        e("select",{className:CAMPO, value:c.pessoaId==null ? "" : String(c.pessoaId), onChange:function(ev){ muda({pessoaId:ev.target.value==="" ? null : parseInt(ev.target.value)}); }},
          e("option",{value:""}, "Escolher…"), pessoasDoSistema().map(function(x){ return e("option",{key:x.id, value:String(x.id)}, x.nome); }))),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Perfil",
        e("select",{className:CAMPO, value:c.perfil, onChange:function(ev){ muda({perfil:ev.target.value}); }},
          e("option",{value:"MEMBER"}, "Setor"), e("option",{value:"ADMIN"}, "Diretoria")))),
    c.perfil==="ADMIN"
      ? e("p",{className:"text-[13px] text-foreground"}, "Diretoria abre todos os módulos. Os setores abaixo não mudam nada.")
      : e("div",{className:"flex flex-col gap-1"},
          e("span",{className:"text-[12px] font-semibold"}, "Setores (módulos que a pessoa abre no servidor)"),
          e("div",{className:"flex flex-wrap gap-1.5"}, SETORES.map(function(s){ var on = c.setores.indexOf(s[0])>=0;
            return e("button",{key:s[0], type:"button", "aria-pressed":on, onClick:function(){ alterna(s[0]); },
              className:"h-8 rounded-md border px-3 text-[13px] "+(on ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border bg-card text-foreground hover:bg-white/10")}, s[1]); }))),
    ativo && c.aprovadoPor && e("p",{className:"text-[12px] text-foreground"}, "Liberada por "+c.aprovadoPor+"."));
}

function AbaContas(){
  var sc = useState(null), contas = sc[0], setContas = sc[1], se = useState(""), erro = se[0], setErro = se[1];
  var carrega = function(){ chamar("GET", "/contas").then(function(j){ setContas(j.contas); setErro(""); }).catch(function(x){ setErro(x.message); }); };
  useEffect(function(){ if(apiAtiva()) carrega(); }, []);
  var muda = function(id, corpo){ chamar("PATCH", "/contas/"+id, corpo).then(function(j){ setContas(function(l){ return l.map(function(c){ return c.id===id ? j.conta : c; }); }); setErro(""); }).catch(function(x){ setErro(x.message); }); };
  if(!apiAtiva()) return e(Pagina,null, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "As contas só existem com o sistema ligado ao servidor (sem servidor não há login)."));
  var l = contas || [], n = function(st){ return l.filter(function(c){ return c.status===st; }).length; };
  return e(Pagina,null,
    erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro),
    e(Bloco,{t:"Dados deste navegador"},
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("span",{className:"text-[13px]"}, "Escolher de novo qual cópia dos dados vale (a deste navegador ou a do servidor)."),
        e(Botao,{onClick:reabrirEscolha}, "Escolher de novo"),
        temCopiaAntesServidor() && e(Botao,{onClick:restaurarCopiaAntesServidor, title:"Devolve à tela o que estava neste navegador antes de você usar o servidor"}, "Voltar a cópia de antes"))),
    e(FaixaTotais,{itens:[{t:"Aguardando", v:String(n("aguardando")), cor:n("aguardando") ? "text-warning" : undefined}, {t:"Ativas", v:String(n("ativo"))}, {t:"Bloqueadas", v:String(n("bloqueado"))}]}),
    e(Bloco,{t:"Contas"},
      contas===null && !erro ? e("p",{className:"p-3 text-[13px]"}, "Carregando…")
      : !l.length && !erro ? e("p",{className:"p-3 text-[13px]"}, "Ninguém criou conta ainda. Quem criar na tela de entrada aparece aqui como Aguardando.")
      : e("div",{className:"flex flex-col gap-2 p-2"}, l.map(function(c){ return e(LinhaConta,{key:c.id, c:c, onMudar:muda}); }))));
}
export { AbaContas };
