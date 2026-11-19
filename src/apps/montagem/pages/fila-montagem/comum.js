// Sorelly Admin · montagem — pages/fila-montagem/comum.js
// Peças e contas comuns da Fila de montagem e da Produtividade da montagem (migradas do admin antigo em 18/11/2026).
// Servidor: src/server/montagem-kit.js (rotas em app/api/montagem/*). Regras de negócio ficam lá; aqui só leitura, datas e formatos.
import { Aviso } from "@/apps/montagem/components/padrao-fin";
import { papelDe } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";

// Dinheiro (valor do kit e bônus) só a supervisão e a diretoria veem; a montadora nunca vê valor (regra do protótipo).
function veDinheiro(s){ var p = papelDe(s.usuario); return p==="supervisao" || p==="familia"; }

// GET no servidor: {dados, erro, carregando, recarregar}. caminho vazio = não lê.
function useServidor(caminho){
  var sd = useState(null), se = useState(""), sc = useState(false), sn = useState(0);
  useEffect(function(){
    if(!caminho || !apiAtiva()) return undefined;
    var vivo = true; sc[1](true);
    chamar("GET", caminho).then(function(j){ if(vivo){ sd[1](j); se[1](""); } })
      .catch(function(x){ if(vivo) se[1](x.message || "Não foi possível ler o servidor."); })
      .finally(function(){ if(vivo) sc[1](false); });
    return function(){ vivo = false; };
  }, [caminho, sn[0]]);   // eslint-disable-line react-hooks/exhaustive-deps -- sd/se/sc são estados fixos
  return {dados:sd[0], erro:se[0], carregando:sc[0], recarregar:function(){ sn[1](function(n){ return n+1; }); }};
}

// datas e horas no fuso de Brasília (o servidor guarda em UTC)
var FD = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo", year:"numeric", month:"2-digit", day:"2-digit"});
var FH = new Intl.DateTimeFormat("en-GB", {timeZone:"America/Sao_Paulo", hour:"2-digit", minute:"2-digit", hour12:false});
var diaSP = function(iso){ return iso ? FD.format(new Date(iso)) : ""; };            // "2026-11-18"
var horaSP = function(iso){ return iso ? FH.format(new Date(iso)) : ""; };           // "14:30"
var hojeSP = function(){ return FD.format(new Date()); };
var dataBR = function(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dia || ""); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; };
var dataHoraBR = function(iso){ return iso ? dataBR(diaSP(iso))+" "+horaSP(iso) : ""; };
// "HH:MM" de hoje em Brasília (UTC-3 fixo, como no admin antigo) → ISO
var isoDeHora = function(hhmm){ return new Date(hojeSP()+"T"+hhmm+":00-03:00").toISOString(); };
var p2 = function(n){ return String(n).padStart(2, "0"); };
function duracao(ms){ var min = Math.max(0, Math.round(ms/60000)); if(min<60) return min+" min"; var h = Math.floor(min/60), r = min%60; return r ? h+"h"+p2(r)+"min" : h+"h"; }
function relogio(ms){ var t = Math.max(0, Math.floor(ms/1000)), h = Math.floor(t/3600); return (h ? p2(h)+":" : "")+p2(Math.floor(t%3600/60))+":"+p2(t%60); }
var pct = function(v){ return v==null ? "" : (Math.round(v*10)/10).toLocaleString("pt-BR")+"%"; };

// horário em que clicaram "Iniciar montagem": fica neste navegador, por revendedora, até concluir (igual ao admin antigo)
var CH_INI = "sorelly_montagem_inicio_";
function lerInicio(id){ try { return localStorage.getItem(CH_INI+id) || null; } catch(x){ return null; } }
function gravarInicio(id, iso){ try { if(iso) localStorage.setItem(CH_INI+id, iso); else localStorage.removeItem(CH_INI+id); } catch(x){ /* sem espaço ou modo privado: o cronômetro fica só na tela */ } }

// aviso de sistema sem servidor (modo navegador): estas telas leem tudo do servidor
function SemServidor(){ return e(Aviso,null, "Sem servidor ligado: a Fila de montagem e a Produtividade leem tudo do servidor."); }

export { veDinheiro, useServidor, diaSP, horaSP, hojeSP, dataBR, dataHoraBR, isoDeHora, duracao, relogio, pct, lerInicio, gravarInicio, SemServidor };
