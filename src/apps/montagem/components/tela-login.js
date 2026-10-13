// Sorelly Admin — components/tela-login.js
// Tela de entrada (usuário e senha) do painel e dos apps de montagem, bipagem e condicionais. É o mesmo site no celular de todas:
// o que muda de uma pessoa para outra é o que cada uma enxerga. As contas reais já existem na produção; aqui a SENHA É IGNORADA
// (protótipo): o usuário só precisa bater com uma pessoa da equipe (ex.: "marcushess" abre o Marcus).
import { SETORES_LOGIN } from "@/apps/montagem/components/seletor-acesso";
import { PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { e, useState } from "@/shared/react";
import React from "react";

// Conta de cada pessoa: usuário = nome completo junto, em minúsculo (Marcus tem o marcushess); senha padrão 123 para todos (até o login real do Leonardo).
var SENHA_PADRAO = "123", USUARIO_FIXO = {16:"marcushess", 24:"anamariaag"};   // 24 = Ana Maria do agendamento (a sócia Anamaria fica com "anamaria")
var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]/g,""); };
function usuarioDe(p){ return USUARIO_FIXO[p.id] || norm(p.completo || p.nome); }
function todasPessoas(){ var vistos = {}, lista = []; SETORES_LOGIN().forEach(function(g){ g[1].forEach(function(p){ if(p && !vistos[p.id]){ vistos[p.id] = 1; lista.push(Object.assign({grupo:g[0]}, p)); } }); }); return lista; }
// "marcushess" → Marcus · "natasha.ribeiro" → Natasha · só acha se houver UMA pessoa que combine
function acharPessoa(texto){
  var t = norm(texto); if(t.length<3) return null;
  var achou = todasPessoas().map(function(p){ var nomes = (USUARIO_FIXO[p.id] ? [usuarioDe(p)] : [p.nome, p.completo, usuarioDe(p)]).filter(Boolean).map(norm);
    var nota = nomes.reduce(function(m,n){ return n===t ? Math.max(m,100) : (t.indexOf(n)===0 && n.length>=3) ? Math.max(m,50+n.length) : (n.indexOf(t)===0 ? Math.max(m,10) : m); },0);
    return {p:p, nota:nota}; }).filter(function(x){ return x.nota>0; }).sort(function(a,b){ return b.nota-a.nota; });
  if(!achou.length) return null;
  if(achou.length>1 && achou[0].nota===achou[1].nota) return null;
  return achou[0].p;
}

var CAMPO = "h-[52px] w-full rounded-full border border-white/15 bg-[#121212] px-6 text-[16px] text-[#fff] outline-none placeholder:text-[#ffffff73] focus:border-[#E8B84B]";
var ESTILO_CAMPO = {background:"#121212", color:"#fff"};
function corpoLogin(p){
  var us = useState(p.usuarioInicial||""), usuario = us[0], setUsuario = us[1], ps = useState(p.senhaInicial||""), senha = ps[0], setSenha = ps[1];
  var er = useState(""), erro = er[0], setErro = er[1], cr = useState(false), criar = cr[0], setCriar = cr[1], ts = useState(false), teste = ts[0], setTeste = ts[1];
  var entrar = function(ev){ if(ev && ev.preventDefault) ev.preventDefault();
    var pes = acharPessoa(usuario); if(!pes || senha!==SENHA_PADRAO){ setErro("Usuário ou senha incorretos."); return; } p.onEntrar(pes); };
  var logo = (import.meta.env.BASE_URL||"/")+"logo-sorelly.png";
  return e("div",{className:"flex flex-col bg-[#070707] text-[#fff] "+(p.compacto ? "w-[calc(100%+2rem)] h-[679px] -mx-4 -mt-2 -mb-10 overflow-y-auto" : "w-full min-h-screen"), style:{fontFamily:"inherit"}},
    e("div",{className:"flex flex-col items-center gap-3 px-6 pb-8 pt-10", style:{background:"radial-gradient(ellipse at 50% 35%, #3a2d12 0%, #0b0a08 60%)"}},
      e("img",{src:logo, alt:"Sorelly Joias", draggable:false, className:(p.compacto ? "h-24" : "h-32")+" w-auto select-none"}),
      e("p",{className:"mt-2 text-center text-[13px] uppercase tracking-[0.35em] text-[#ffffffe6]"}, p.titulo || "Painel administrativo")),
    e("div",{className:"h-[3px] w-full", style:{background:"linear-gradient(90deg,#B8862B,#E8B84B,#F1E4C6)"}}),
    e("form",{onSubmit:entrar, className:"mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 pb-8 pt-8"},
      e("div",null, e("h1",{className:"text-[30px] font-bold leading-tight"},"Entrar"), e("p",{className:"mt-1 text-[15px] text-[#ffffffcc]"},"Acesse o painel com seu usuário e senha.")),
      e("label",{className:"flex flex-col gap-2 text-[15px] font-semibold"},"Usuário",
        e("input",{value:usuario, onChange:function(ev){ setUsuario(ev.target.value); setErro(""); }, placeholder:"ex.: marcushess", autoCapitalize:"none", autoCorrect:"off", autoComplete:"username", className:CAMPO, style:ESTILO_CAMPO})),
      e("label",{className:"flex flex-col gap-2 text-[15px] font-semibold"},"Senha",
        e("input",{type:"password", value:senha, onChange:function(ev){ setSenha(ev.target.value); }, placeholder:"••••••••", autoComplete:"current-password", className:CAMPO, style:ESTILO_CAMPO})),
      erro && e("p",{className:"-mt-2 text-center text-[13px] font-semibold text-[#F87171]"}, erro),
      e("button",{type:"submit", className:"h-[56px] rounded-full text-[18px] font-semibold text-[#1B1409] shadow-[0_8px_24px_-8px_#E8B84B99] active:translate-y-px", style:{background:"#DDAA3C"}},"Entrar"),
      e("p",{className:"text-center text-[14px] text-[#ffffffd9]"},"Não tem conta? ",
        e("button",{type:"button", onClick:function(){ setCriar(!criar); }, className:"font-bold text-[#fff] underline-offset-2 hover:underline"},"Criar agora")),
      criar && e("p",{className:"rounded-xl bg-[#ffffff0d] px-4 py-3 text-center text-[13px] text-[#ffffffd9]"},"O acesso é criado pelo RH ou pela diretoria. Peça a liberação do seu usuário."),
      // atalho de teste (protótipo): entrar como qualquer pessoa da equipe sem digitar
      p.teste !== false && e("div",{className:"flex flex-col gap-2 border-t border-white/10 pt-4"},
        e("button",{type:"button", onClick:function(){ setTeste(!teste); }, className:"text-[12.5px] font-semibold text-[#E8B84B]"}, teste ? "Esconder" : "Entrar como… (teste, sem digitar)"),
        teste && SETORES_LOGIN().map(function(g){ return e("div",{key:g[0], className:"flex flex-col gap-1"},
          e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-[#ffffff99]"}, PAPEL_LB[g[0]]),
          e("div",{className:"flex flex-wrap gap-1.5"}, g[1].map(function(x){ return e("button",{type:"button", key:x.id, onClick:function(){ p.onEntrar(x); },
            className:"rounded-full bg-[#ffffff1a] px-3 py-1 text-[12.5px] font-semibold hover:bg-[#ffffff33]"}, x.nome); }))); }))),
    e("p",{className:"pb-6 text-center text-[14px] text-[#ffffffcc]"},"© 2026 Sorelly Joias"));
}

// dentro do celular o tema claro estiliza o PRIMEIRO filho da tela (cabeçalho escuro com margens): um span escondido recebe esse estilo no lugar da tela de entrada
function TelaLogin(p){ var tela = corpoLogin(p); return p.compacto ? e(React.Fragment,null, e("span",{className:"hidden"}), tela) : tela; }

export { TelaLogin, acharPessoa, todasPessoas, usuarioDe, SENHA_PADRAO };
