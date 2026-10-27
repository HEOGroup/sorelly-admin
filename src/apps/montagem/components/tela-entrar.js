// Sorelly Admin · montagem — components/tela-entrar.js
// Entrada com e-mail e senha, só quando o sistema está ligado ao servidor (lib/api.js). Sem servidor, o sistema abre direto como antes.
// "Criar conta": a pessoa se cadastra e a conta fica aguardando; a Diretoria libera e escolhe os setores (RH → Acessos e autorizações → Contas).
import { chamar, entrar, sair } from "@/apps/montagem/lib/api";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function TelaEntrar(p){
  var sm = useState("entrar"), modo = sm[0], setModo = sm[1];
  var sf = useState({nome:"", email:"", senha:"", senha2:""}), f = sf[0], setF = sf[1], se = useState(""), erro = se[0], setErro = se[1], sc = useState(false), carregando = sc[0], setCarregando = sc[1];
  var sa = useState(""), aviso = sa[0], setAviso = sa[1];
  var criando = modo==="criar";
  var troca = function(k){ return function(ev){ var c = Object.assign({}, f); c[k] = ev.target.value; setF(c); setErro(""); }; };
  var trocaModo = function(m){ setModo(m); setErro(""); setAviso(""); setF({nome:"", email:f.email, senha:"", senha2:""}); };
  var enviar = function(ev){
    ev.preventDefault(); if(carregando) return; setErro(""); setAviso("");
    if(criando){
      if(f.senha.length<8){ setErro("A senha precisa ter 8 letras ou mais."); return; }
      if(f.senha!==f.senha2){ setErro("As duas senhas não são iguais."); return; }
      setCarregando(true);
      chamar("POST", "/auth/cadastro", {nome:f.nome, email:f.email, senha:f.senha}).then(function(j){
        setCarregando(false); setModo("entrar"); setF({nome:"", email:f.email, senha:"", senha2:""}); setAviso(j.mensagem || "Conta criada. Agora a Diretoria precisa liberar o seu acesso.");
      }).catch(function(x){ setErro(x.message); setCarregando(false); });
      return;
    }
    setCarregando(true);
    entrar(f.email, f.senha).then(function(u){
      if(u.pessoaId==null){ sair(); setErro("Sua conta ainda não está ligada a uma pessoa do sistema. Peça à Diretoria."); setCarregando(false); return; }
      p.onEntrou(u);
    }).catch(function(x){ setErro(x.message); setCarregando(false); });
  };
  var campo = function(rotulo, k, tipo, auto){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, rotulo, e("input",{type:tipo, autoComplete:auto, required:true, value:f[k], onChange:troca(k), className:INPUT+" h-11!"})); };
  return e("div",{className:"grid min-h-screen place-items-center bg-background p-4"},
    e("form",{onSubmit:enviar, className:"flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-card p-6 ring-2 ring-[#E8B84B]/40"},
      e("h1",{className:"text-center font-heading text-2xl font-semibold tracking-wide text-primary"}, "Sorelly Admin"),
      e("p",{className:"text-center text-[13px] text-muted-foreground"}, criando ? "Crie a sua conta. A Diretoria libera o acesso do seu setor." : "Entre com o seu e-mail e a sua senha."),
      criando && campo("Nome completo", "nome", "text", "name"),
      campo("E-mail", "email", "email", "username"),
      campo("Senha", "senha", "password", criando ? "new-password" : "current-password"),
      criando && campo("Repita a senha", "senha2", "password", "new-password"),
      aviso && e("p",{role:"status", className:"rounded-lg bg-success/15 px-3 py-2 text-center text-[13px] font-semibold text-success"}, aviso),
      erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro),
      e(Btn,{v:"primary", type:"submit", disabled:carregando}, criando ? (carregando ? "Criando…" : "Criar conta") : (carregando ? "Entrando…" : "Entrar")),
      e("button",{type:"button", onClick:function(){ trocaModo(criando ? "entrar" : "criar"); }, className:"text-center text-[13px] font-semibold text-primary hover:underline"}, criando ? "Já tenho conta: entrar" : "Não tenho conta: criar agora")));
}
export { TelaEntrar };
