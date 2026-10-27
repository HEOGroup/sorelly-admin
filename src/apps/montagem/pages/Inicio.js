// Sorelly Admin · montagem — pages/Inicio.js
// PÁGINA INICIAL de todo mundo (aprovada pelo Marcus em 27/10/2026, "layout B" com cruz): foto grande, "Olá, <nome>. Seja bem-vindo!", uma mensagem de fé que muda a cada 2 horas,
// os setores que a pessoa pode abrir e, embaixo, o dia dela: rotina de hoje, comunicados da Diretoria, equipe agora (foto e situação) e telas visitadas.
// A Diretoria ainda vê "Para você decidir hoje". Mensagens em domain/mensagens-fe.js; foto e situação em lib/perfil.js; setores e visitas em lib/inicio-setores.js.
import { rotDoDia, daPessoa, rotResumo } from "@/apps/montagem/domain/rotina";
import { nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { mensagemDaVez, msAteTrocar } from "@/apps/montagem/domain/mensagens-fe";
import { apiAtiva, chamar, ehAdmin } from "@/apps/montagem/lib/api";
import { setoresInicio, visitados } from "@/apps/montagem/lib/inicio-setores";
import { lerFavoritas } from "@/apps/montagem/lib/favoritas";
import { ORDEM_SIT, SITUACOES, reduzirFoto, salvarEu, usePerfil } from "@/apps/montagem/lib/perfil";
import { ABAS } from "@/apps/montagem/navigation/abas";
import { caminhoDaAba } from "@/apps/montagem/router/slugs";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";
import { useNavigate } from "react-router-dom";

var pad = function(n){ return String(n).padStart(2, "0"); };
var isoDia = function(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); };
var primeiroNome = function(n){ return String(n||"").trim().split(/\s+/)[0] || ""; };
var saudacao = function(){ var h = new Date().getHours(); return h<12 ? "Bom dia" : h<18 ? "Boa tarde" : "Boa noite"; };
var nomeAba = function(aba){ var a = ABAS.find(function(x){ return x[0]===aba; }); return a ? a[1] : aba; };
var haQuanto = function(em){ var m = Math.round((Date.now()-em)/60000); if(m<1) return "agora"; if(m<60) return "há "+m+" min"; var h = Math.round(m/60); if(h<24) return "há "+h+" h"; var d = Math.round(h/24); return d===1 ? "ontem" : "há "+d+" dias"; };

// primeiro setor com tela de verdade (as "em breve" ficam por último), como o menu lateral faz
function primeiraTela(st){
  var todas = st.direto ? [st.direto] : [].concat.apply([], (st.areas||[]).map(function(ar){ return ar.telas; }));
  return todas.find(function(t){ return !t.breve; }) || todas[0];
}

var CSS = [
  ".ini{margin:-16px;color:#fff;background:radial-gradient(ellipse at 50% 0%,#201808 0%,#0a0806 55%,#050403 100%)}@media(min-width:768px){.ini{margin:-24px}}",
  ".ini-pg{display:flex;flex-direction:column;min-height:inherit;padding:40px 48px 56px}@media(max-width:700px){.ini-pg{padding:24px 16px 40px}}",
  ".ini-hero{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;min-height:56vh;padding:12px 0 8px}",
  ".ini-foto{position:relative;display:grid;place-items:center;width:160px;height:160px;margin:0 auto 18px;border-radius:50%;background:linear-gradient(145deg,#f1cd75,#b8892a) center/cover;color:#1a1405;font-weight:800;font-size:64px;border:3px solid #E8B84B;box-shadow:0 0 0 6px rgba(232,184,75,.12),0 0 40px rgba(232,184,75,.25)}",
  ".ini-foto button{position:absolute;right:0;bottom:0;width:34px;height:34px;border-radius:50%;background:#14110b;border:1px solid rgba(232,184,75,.4);color:#E8B84B;cursor:pointer;display:grid;place-items:center}",
  ".ini-selo{display:inline-flex;border:1px solid rgba(232,184,75,.3);border-radius:999px;padding:4px 12px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#E8B84B;background:#1b1710}",
  ".ini-nome{font-weight:700;letter-spacing:-.03em;line-height:1.08;margin:16px 0 0;font-size:60px}@media(max-width:700px){.ini-nome{font-size:30px}.ini-vtxt{font-size:17px}}",
  ".ini-ouro{color:#E8B84B}",
  ".ini-cruz{display:block;margin:14px auto 8px;filter:drop-shadow(0 0 14px rgba(232,184,75,.45));animation:ini-br 4s ease-in-out infinite}",
  "@keyframes ini-br{0%,100%{filter:drop-shadow(0 0 8px rgba(232,184,75,.35))}50%{filter:drop-shadow(0 0 22px rgba(232,184,75,.8))}}",
  ".ini-vers{transition:opacity .5s}.ini-vers.some{opacity:0}",
  ".ini-vtxt{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:25px;line-height:1.5;max-width:900px;margin:0 auto}",
  ".ini-ref{margin-top:10px;color:#E8B84B;font-weight:700}",
  ".ini-pontos{display:flex;justify-content:center;gap:6px;margin:14px 0 4px}.ini-pontos i{width:6px;height:6px;border-radius:50%;background:#3b3220}.ini-pontos i.on{background:#E8B84B}",
  ".ini-rot{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#E8B84B;font-weight:700;margin:26px 0 10px;display:flex;align-items:center;gap:10px}",
  ".ini-rot:after{content:'';flex:1;height:1px;background:rgba(232,184,75,.28)}",
  ".ini-setores{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}",
  ".ini-setor{border:1px solid rgba(232,184,75,.28);border-radius:12px;background:#110e08;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;cursor:pointer;text-align:left;color:#fff}",
  ".ini-setor:hover{border-color:#E8B84B}.ini-setor b{font-size:14px}.ini-setor small{color:#bdb39d}",
  ".ini-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center}",
  ".ini-cols{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:14px}@media(max-width:900px){.ini-cols{grid-template-columns:1fr}}",
  ".ini-bx{border:1px solid rgba(232,184,75,.28);border-radius:14px;background:#110e08;padding:14px 16px;min-width:0}",
  ".ini-bx h4{margin:0 0 10px;font-size:13px;display:flex;align-items:center;justify-content:space-between;gap:8px}.ini-bx h4 small{font-weight:500;color:#bdb39d}",
  ".ini-vazio{color:#bdb39d;padding:6px 0}",
  ".ini-ck{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(232,184,75,.12)}.ini-ck:last-child{border:0}",
  ".ini-ck button{width:20px;height:20px;border-radius:5px;border:1.5px solid rgba(232,184,75,.45);background:none;color:#1a1405;cursor:pointer;display:grid;place-items:center;flex:none;padding:0}",
  ".ini-ck.ok button{background:#3ecf8e;border-color:#3ecf8e}.ini-ck.ok span{color:#8d8574;text-decoration:line-through}.ini-ck.atr em{color:#ff8a8a}",
  ".ini-ck span{min-width:0;flex:1}.ini-ck em{font-style:normal;color:#bdb39d;font-size:12px;flex:none}",
  ".ini-av{display:flex;align-items:center;gap:10px;padding:6px 0;min-width:0}",
  ".ini-av .c{position:relative;width:34px;height:34px;border-radius:50%;background:linear-gradient(145deg,#f1cd75,#b8892a) center/cover;color:#1a1405;font-weight:800;display:grid;place-items:center;flex:none}",
  ".ini-av .c u{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;border:2px solid #110e08}",
  ".ini-av div{min-width:0}.ini-av b{display:block;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ini-av small{color:#bdb39d}",
  ".ini-aviso{border:1px solid rgba(232,184,75,.28);border-top:3px solid #E8B84B;border-radius:10px;background:#0d0a06;padding:10px 12px;margin-bottom:8px;position:relative}",
  ".ini-aviso b{display:block;margin:0 0 2px;padding-right:22px}.ini-aviso small{color:#cfcfcf;white-space:pre-line}.ini-aviso button{position:absolute;right:8px;top:8px;background:none;border:0;color:#bdb39d;cursor:pointer}",
  ".ini-novo{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}",
  ".ini-novo input,.ini-novo textarea{border-radius:8px;border:1px solid #3a3a40;background:#0e0e11;color:#fff;padding:7px 10px;font:inherit}",
  ".ini-btn{height:32px;border-radius:8px;border:1px solid rgba(232,184,75,.4);background:#1b1710;color:#E8B84B;font:inherit;font-weight:600;padding:0 12px;cursor:pointer}",
  ".ini-chips{display:flex;flex-wrap:wrap;gap:8px}",
  ".ini-chip{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 14px;border:1px solid rgba(232,184,75,.28);border-radius:999px;background:#100d08;font-weight:600;cursor:pointer;color:#fff}.ini-chip small{color:#bdb39d;font-weight:400}",
  ".ini-pend{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}",
  ".ini-p{border:1px solid rgba(232,184,75,.28);border-radius:12px;background:#110e08;padding:12px 14px;text-align:left;color:#fff;cursor:pointer}.ini-p b{display:block;font-size:22px;color:#E8B84B}.ini-p.v b{color:#ff8a8a}",
].join("");

function Cruz(p){
  return e("svg",{className:"ini-cruz", width:p.w||40, height:p.h||56, viewBox:"0 0 46 64", "aria-hidden":true},
    e("defs",null, e("linearGradient",{id:"ini-og", x1:"0", y1:"0", x2:"1", y2:"1"}, e("stop",{offset:"0", stopColor:"#ffe9a8"}), e("stop",{offset:".5", stopColor:"#E8B84B"}), e("stop",{offset:"1", stopColor:"#b8892a"}))),
    e("path",{d:"M20 0h6v18h18v6H26v40h-6V24H2v-6h18z", fill:"url(#ini-og)"}), e("path",{d:"M22.2 4h1.6v56h-1.6zM6 20.2h34v1.6H6z", fill:"#fff", opacity:".28"}));
}

function AbaInicio(){
  var cx = use(), s = cx.state, d = cx.dispatch, eu = s.usuario, navigate = useNavigate();
  var pf = usePerfil(), eMeu = pf.meuId!=null && pf.meuId===eu, diretor = papelDe(eu)==="supervisao";
  var sv = useState(0), forcar = sv[1], sf = useState(false), some = sf[0], setSome = sf[1], sa = useState(0), contasAguardando = sa[0], setContas = sa[1];
  var sn = useState(false), novoAberto = sn[0], setNovoAberto = sn[1], st = useState({titulo:"", texto:""}), novo = st[0], setNovo = st[1], arq = useRef(null), se = useState(""), erro = se[0], setErro = se[1];

  // a mensagem troca sozinha na hora certa (a cada 2 horas)
  var msg = mensagemDaVez();
  useEffect(function(){
    var t = setTimeout(function(){ setSome(true); setTimeout(function(){ forcar(function(x){ return x+1; }); setSome(false); }, 450); }, msAteTrocar()+500);
    return function(){ clearTimeout(t); };
  }, [msg.i]);

  // Diretoria: quantas contas esperam liberação
  useEffect(function(){
    if(!diretor || !apiAtiva() || !ehAdmin()) return;
    chamar("GET", "/contas").then(function(r){ setContas((r.contas||[]).filter(function(c){ return c.status==="aguardando"; }).length); }).catch(function(){});
  }, [diretor]);

  var hojeIso = isoDia(new Date()), agora = new Date(), hm = pad(agora.getHours())+":"+pad(agora.getMinutes());
  var lista = rotDoDia(s.rot, hojeIso), minhas = daPessoa(lista, eu), resTodos = rotResumo(lista, hojeIso, hojeIso, hm), resMinhas = rotResumo(minhas, hojeIso, hojeIso, hm);
  var marcar = function(i, feito){
    var local = function(){ d({type:"ROT", op:"marcar", id:i.id, data:hojeIso, feito:feito, por:nomeDe(eu), porId:eu, diretoria:diretor, em:Date.now()}); };
    if(!apiAtiva()) return local();
    chamar("PUT", "/rotina/registros", {itemId:i.id, data:hojeIso, feito:feito}).then(local).catch(function(x){ window.alert(x.message); });
  };

  var eu_p = pf.pessoas[eu] || {}, nome = primeiroNome(nomeDe(eu)) || primeiroNome(eu_p.nome);
  var trocarFoto = function(ev){
    var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!f) return;
    setErro(""); reduzirFoto(f).then(function(url){ return salvarEu({foto:url}); }).catch(function(x){ setErro(x.message); });
  };

  var avisos = ((s.inicio||{}).avisos || []).slice().sort(function(a, b){ return (b.em||0)-(a.em||0); }).slice(0, 5);
  var gravaAvisos = function(l){ d({type:"SYNC_MODULO", chave:"inicio", conteudo:{avisos:l}}); };
  var publicar = function(){
    var t = novo.titulo.trim(), x = novo.texto.trim(); if(!t) return;
    gravaAvisos(((s.inicio||{}).avisos || []).concat([{id:"a"+Date.now(), titulo:t, texto:x, em:Date.now(), por:nomeDe(eu)}]));
    setNovo({titulo:"", texto:""}); setNovoAberto(false);
  };

  var equipe = Object.keys(pf.pessoas).map(function(k){ return pf.pessoas[k]; }).filter(function(p){ return String(p.pessoaId)!==String(eu) || true; })
    .sort(function(a, b){ return ORDEM_SIT.indexOf(a.situacao)-ORDEM_SIT.indexOf(b.situacao) || String(a.nome).localeCompare(String(b.nome), "pt-BR"); });
  var disponiveis = equipe.filter(function(p){ return p.situacao==="disponivel"; }).length;

  var abrirAba = function(aba){ navigate(caminhoDaAba(aba)); };
  var setores = setoresInicio();
  var sfv = useState(0), favTick = sfv[1];
  useEffect(function(){ var f = function(){ favTick(function(x){ return x+1; }); }; window.addEventListener("sorelly-favoritas", f); return function(){ window.removeEventListener("sorelly-favoritas", f); }; }, []);
  var favoritas = lerFavoritas("admin").filter(function(f){ return f.aba && f.aba!=="inicio"; });
  var slot = Math.floor(agora.getHours()/2);
  var raiz = useRef(null);
  useEffect(function(){ var ajusta = function(){ var el = raiz.current; if(!el) return; var topo = el.getBoundingClientRect().top; el.style.minHeight = Math.max(480, window.innerHeight-Math.max(topo, 0))+"px"; }; ajusta(); window.addEventListener("resize", ajusta); return function(){ window.removeEventListener("resize", ajusta); }; }, []);

  return e("div",{className:"ini", ref:raiz},
    e("style",{dangerouslySetInnerHTML:{__html:CSS}}),
    e("div",{className:"ini-pg"},
      // alto: foto, saudação, cruz e mensagem
      e("div",{className:"ini-hero"},
        e("div",{className:"ini-foto", style:eu_p.foto ? {backgroundImage:"url("+eu_p.foto+")"} : undefined}, eu_p.foto ? null : e("b",null, (nome||"?").charAt(0).toUpperCase()),
          eMeu && e("button",{type:"button", onClick:function(){ arq.current.click(); }, "aria-label":"Trocar minha foto", title:"Trocar minha foto"}, e(Icon,{n:"pencil", s:15}))),
        e("input",{ref:arq, type:"file", accept:"image/*", className:"hidden", onChange:trocarFoto}),
        erro && e("p",{role:"alert", style:{color:"#ff8a8a", fontWeight:600}}, erro),
        e("span",{className:"ini-selo"}, "Central Sorelly"),
        e("h1",{className:"ini-nome"}, saudacao()+", "+nome+". ", e("span",{className:"ini-ouro"}, "Seja bem-vindo!")),
        e(Cruz,null),
        e("div",{className:"ini-vers"+(some ? " some" : "")}, e("div",{className:"ini-vtxt"}, msg.texto), e("div",{className:"ini-ref"}, msg.ref)),
        e("div",{className:"ini-pontos", title:"Mensagens de hoje (uma a cada 2 horas)"}, Array.from({length:12}, function(_, k){ return e("i",{key:k, className:k===slot ? "on" : ""}); }))),

      // setores
      e("div",{className:"ini-rot"}, "Seus setores"),
      e("div",{className:"ini-setores"}, setores.length===0 ? e("p",{className:"ini-vazio"}, "Nenhum setor liberado ainda. Peça à Diretoria.") : setores.map(function(st){
        var t = primeiraTela(st); if(!t) return null;
        return e("button",{key:st.id, type:"button", className:"ini-setor", onClick:function(){ if(t.breve) return; abrirAba(t.aba); }},
          e("span",{className:"ini-ic", style:{background:st.cor+"33", color:st.cor, boxShadow:"inset 0 0 0 1px "+st.cor+"66"}}, e(Icon,{n:st.ic, s:17, peso:"duotone"})),
          e("b",null, String(st.nome).replace("\n"," ")), e("small",null, t.nome || nomeAba(t.aba))); })),

      // telas favoritas (estrela nas abas do topo), na ordem escolhida
      favoritas.length>0 && e("div",null, e("div",{className:"ini-rot"}, "Minhas favoritas"),
        e("div",{className:"ini-chips"}, favoritas.map(function(f){ return e("button",{key:f.k, type:"button", className:"ini-chip", onClick:function(){ abrirAba(f.aba); }}, e("span",{style:{color:"#F5D68A"}}, "★"), f.nome, f.setor && f.setor!==f.nome ? e("small",null, f.setor) : null); }))),

      // Diretoria: o que decidir hoje
      diretor && e("div",null,
        e("div",{className:"ini-rot"}, "Para você decidir hoje"),
        e("div",{className:"ini-pend"},
          apiAtiva() && e("button",{type:"button", className:"ini-p"+(contasAguardando>0 ? " v" : ""), onClick:function(){ abrirAba("acessos"); }}, e("b",null, String(contasAguardando)), "Contas aguardando liberação"),
          e("button",{type:"button", className:"ini-p"+(resTodos.atrasados>0 ? " v" : ""), onClick:function(){ abrirAba("rotina"); }}, e("b",null, String(resTodos.atrasados)), "Combinados atrasados hoje"),
          e("button",{type:"button", className:"ini-p", onClick:function(){ abrirAba("rotina"); }}, e("b",null, resTodos.feitos+" de "+resTodos.total), "Combinados feitos hoje"))),

      // o dia da pessoa
      e("div",{className:"ini-rot"}, "Seu dia"),
      e("div",{className:"ini-cols"},
        e("div",{className:"ini-bx"}, e("h4",null, "Minha rotina de hoje", e("small",null, resMinhas.total ? resMinhas.feitos+" de "+resMinhas.total : "")),
          minhas.length===0 ? e("p",{className:"ini-vazio"}, "Nenhum combinado seu para hoje.") : minhas.map(function(i){
            var atr = !i.feito && i.hora && i.hora<=hm;
            return e("div",{key:i.id, className:"ini-ck"+(i.feito ? " ok" : atr ? " atr" : "")},
              e("button",{type:"button", "aria-label":i.feito ? "Desmarcar" : "Marcar como feito", onClick:function(){ marcar(i, !i.feito); }}, i.feito ? e(Icon,{n:"check", s:12}) : null),
              e("span",{style:{cursor:i.rota ? "pointer" : "default"}, onClick:function(){ if(i.rota) abrirAba(i.rota); }}, i.nome), e("em",null, i.hora||"")); })),
        e("div",{className:"ini-bx"}, e("h4",null, "Comunicados", diretor ? e("button",{type:"button", className:"ini-btn", onClick:function(){ setNovoAberto(!novoAberto); }}, novoAberto ? "Cancelar" : "+ Novo aviso") : e("small",null, "da Diretoria")),
          diretor && novoAberto && e("div",{className:"ini-novo"},
            e("input",{value:novo.titulo, maxLength:80, placeholder:"Título do aviso", onChange:function(ev){ setNovo({titulo:ev.target.value, texto:novo.texto}); }}),
            e("textarea",{value:novo.texto, rows:3, maxLength:600, placeholder:"Texto do aviso", onChange:function(ev){ setNovo({titulo:novo.titulo, texto:ev.target.value}); }}),
            e("button",{type:"button", className:"ini-btn", onClick:publicar}, "Publicar")),
          avisos.length===0 ? e("p",{className:"ini-vazio"}, "Nenhum comunicado no momento.") : avisos.map(function(a){
            return e("div",{key:a.id, className:"ini-aviso"}, e("b",null, a.titulo), a.texto ? e("small",null, a.texto) : null,
              diretor && e("button",{type:"button", "aria-label":"Apagar aviso", onClick:function(){ gravaAvisos(((s.inicio||{}).avisos||[]).filter(function(x){ return x.id!==a.id; })); }}, e(Icon,{n:"x", s:13}))); })),
        e("div",{className:"ini-bx"}, e("h4",null, "Equipe agora", e("small",null, disponiveis+(disponiveis===1 ? " disponível" : " disponíveis"))),
          equipe.length===0 ? e("p",{className:"ini-vazio"}, "Ninguém por aqui ainda.") : equipe.slice(0, 8).map(function(p){
            var sit = SITUACOES[p.situacao] || SITUACOES.disponivel, curto = primeiroNome(nomeDe(p.pessoaId)) || primeiroNome(p.nome);
            return e("div",{key:p.pessoaId, className:"ini-av"},
              e("span",{className:"c", style:p.foto ? {backgroundImage:"url("+p.foto+")"} : undefined}, p.foto ? null : (curto||"?").charAt(0).toUpperCase(), e("u",{style:{background:sit[1]}})),
              e("div",null, e("b",null, curto), e("small",null, sit[0]))); }))),

      // telas visitadas
      e("div",{className:"ini-rot"}, "Visitados recentemente"),
      e("div",{className:"ini-chips"}, visitados(eu).length===0 ? e("p",{className:"ini-vazio"}, "As telas que você abrir aparecem aqui.") : visitados(eu).slice(0, 6).map(function(v){
        return e("button",{key:v.aba, type:"button", className:"ini-chip", onClick:function(){ abrirAba(v.aba); }}, nomeAba(v.aba), e("small",null, haQuanto(v.em))); }))));
}
export { AbaInicio };
