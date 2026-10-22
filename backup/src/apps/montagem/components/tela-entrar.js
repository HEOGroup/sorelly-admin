// Sorelly Admin · montagem — components/tela-entrar.js
// Entrada com e-mail e senha, só quando o sistema está ligado ao servidor (lib/api.js). Sem servidor, o sistema abre direto como antes.
import { chamar, entrar, sair } from "@/apps/montagem/lib/api";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function TelaEntrar(p){
  var sf = useState({email:"", senha:""}), f = sf[0], setF = sf[1], se = useState(""), erro = se[0], setErro = se[1], sc = useState(false), carregando = sc[0], setCarregando = sc[1];
  var troca = function(k){ return function(ev){ var c = Object.assign({}, f); c[k] = ev.target.value; setF(c); setErro(""); }; };
  var enviar = function(ev){
    ev.preventDefault(); if(carregando) return; setCarregando(true); setErro("");
    entrar(f.email, f.senha).then(function(u){
      if(u.pessoaId==null){ sair(); setErro("Sua conta ainda não está ligada a uma pessoa do sistema. Peça à Diretoria."); setCarregando(false); return; }
      p.onEntrou(u);
    }).catch(function(x){ setErro(x.message); setCarregando(false); });
  };
  return e("div",{className:"grid min-h-screen place-items-center bg-background p-4"},
    e("form",{onSubmit:enviar, className:"flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-card p-6 ring-2 ring-[#E8B84B]/40"},
      e("h1",{className:"text-center font-heading text-2xl font-semibold tracking-wide text-primary"}, "Sorelly Admin"),
      e("p",{className:"text-center text-[13px] text-muted-foreground"}, "Entre com o seu e-mail e a sua senha."),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "E-mail", e("input",{type:"email", autoComplete:"username", required:true, value:f.email, onChange:troca("email"), className:INPUT+" h-11!"})),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Senha", e("input",{type:"password", autoComplete:"current-password", required:true, value:f.senha, onChange:troca("senha"), className:INPUT+" h-11!"})),
      erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro),
      e(Btn,{v:"primary", type:"submit", disabled:carregando}, carregando ? "Entrando…" : "Entrar")));
}
export { TelaEntrar };
