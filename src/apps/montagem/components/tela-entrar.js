// Sorelly Admin · montagem — components/tela-entrar.js
// Entrada com e-mail e senha, só quando o sistema está ligado ao servidor (lib/api.js). Sem servidor, o sistema abre direto como antes.
// "Criar conta": a pessoa se cadastra e a conta fica aguardando; a Diretoria libera e escolhe os setores (RH → Acessos e autorizações → Contas).
// Visual (27/10/2026, aprovado pelo Marcus): logo e "Clique para entrar"; o clique abre um mosaico de diamantes a partir do ponto clicado e mostra o bloco de login
// sobre estrelas que fogem do mouse. O desenho fica em components/entrada-visual.js.
import { chamar, entrar, sair } from "@/apps/montagem/lib/api";
import { CSS_ENTRADA, GRAVURA, iniciarBrilhos, iniciarPoeira, montarMosaico } from "@/apps/montagem/components/entrada-visual";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";

function TelaEntrar(p){
  var sm = useState("entrar"), modo = sm[0], setModo = sm[1];
  var sf = useState({nome:"", email:"", senha:"", senha2:""}), f = sf[0], setF = sf[1], se = useState(""), erro = se[0], setErro = se[1], sc = useState(false), carregando = sc[0], setCarregando = sc[1];
  var sa = useState(""), aviso = sa[0], setAviso = sa[1], sab = useState(false), aberto = sab[0], setAberto = sab[1];
  var raiz = useRef(null), cPoeira = useRef(null), cBrilho = useRef(null), mosaico = useRef(null), mouse = useRef({x:-999, y:-999});
  var criando = modo==="criar";

  useEffect(function(){
    var parar = [iniciarPoeira(cPoeira.current, raiz.current), iniciarBrilhos(cBrilho.current, raiz.current, mouse.current)];
    return function(){ parar.forEach(function(x){ x(); }); };
  }, []);

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

  var mexeu = function(ev){
    var el = raiz.current; if(!el) return; var r = el.getBoundingClientRect(); mouse.current.x = ev.clientX-r.left; mouse.current.y = ev.clientY-r.top;
    el.style.setProperty("--mx", (mouse.current.x/r.width*100)+"%"); el.style.setProperty("--my", (mouse.current.y/r.height*100)+"%");
  };
  var saiu = function(){ mouse.current.x = -999; mouse.current.y = -999; };
  var abrir = function(px, py){
    if(aberto) return; var el = raiz.current; if(!el) return;
    montarMosaico(mosaico.current, el.clientWidth, el.clientHeight, px, py);
    setAberto(true);
    setTimeout(function(){ var c = document.getElementById("ent-email"); if(c) c.focus(); }, 1900);
  };
  var clicou = function(ev){ var r = raiz.current.getBoundingClientRect(); abrir(ev.clientX-r.left, ev.clientY-r.top); };
  var tecla = function(ev){ if(!aberto && (ev.key==="Enter" || ev.key===" ")){ ev.preventDefault(); abrir(raiz.current.clientWidth/2, raiz.current.clientHeight/2); } };

  var campo = function(rotulo, k, tipo, auto, id){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, rotulo, e("input",{id:id, type:tipo, autoComplete:auto, required:true, value:f[k], onChange:troca(k), className:INPUT+" h-11!"})); };

  return e("div",{ref:raiz, className:"ent-raiz"+(aberto?" ent-aberto":""), onClick:aberto?undefined:clicou, onMouseMove:mexeu, onMouseLeave:saiu, onKeyDown:tecla, tabIndex:aberto?-1:0, role:aberto?undefined:"button", "aria-label":aberto?undefined:"Abrir a entrada do sistema"},
    e("style",{dangerouslySetInnerHTML:{__html:CSS_ENTRADA}}),
    e("div",{className:"ent-fundo", "aria-hidden":true}),
    e("div",{className:"ent-spot", "aria-hidden":true}),
    e("canvas",{ref:cPoeira, className:"ent-tela", "aria-hidden":true}),
    e("div",{className:"ent-marca"},
      e("img",{src:"/logo-sorelly.png", alt:"Sorelly", className:"ent-logo"}),
      e("span",{className:"ent-dica"}, "Clique para entrar")),
    e("div",{className:"ent-revela", "aria-hidden":true}, e("canvas",{ref:cBrilho, className:"ent-tela"}), e("div",{className:"ent-vinheta"})),
    e("div",{ref:mosaico, className:"ent-mosaico", "aria-hidden":true}),
    e("div",{className:"ent-centro"},
      e("div",{className:"ent-painel"},
        e("div",{className:"ent-gravura", style:{backgroundImage:GRAVURA}, "aria-hidden":true}),
        e("div",{className:"ent-luz", "aria-hidden":true}),
        e("form",{onSubmit:enviar, className:"ent-conteudo flex w-full flex-col gap-3"},
          e("img",{src:"/logo-sorelly.png", alt:"Sorelly", className:"mx-auto h-[140px] w-auto"}),
          e("p",{className:"text-center text-[13px] text-white"}, criando ? "Crie a sua conta. A Diretoria libera o acesso do seu setor." : "Entre com o seu e-mail e a sua senha."),
          criando && campo("Nome completo", "nome", "text", "name"),
          campo("E-mail", "email", "email", "username", "ent-email"),
          campo("Senha", "senha", "password", criando ? "new-password" : "current-password"),
          criando && campo("Repita a senha", "senha2", "password", "new-password"),
          aviso && e("p",{role:"status", className:"rounded-lg bg-success/15 px-3 py-2 text-center text-[13px] font-semibold text-success"}, aviso),
          erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro),
          e(Btn,{v:"primary", type:"submit", disabled:carregando}, criando ? (carregando ? "Criando…" : "Criar conta") : (carregando ? "Entrando…" : "Entrar")),
          e("button",{type:"button", onClick:function(){ trocaModo(criando ? "entrar" : "criar"); }, className:"text-center text-[13px] font-semibold text-primary hover:underline"}, criando ? "Já tenho conta: entrar" : "Não tenho conta: criar agora")))));
}
export { TelaEntrar };
