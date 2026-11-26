// Sorelly Admin · montagem — mobile/protecao-rep.js
// Rede de segurança do app da representante (24/11/2026): se uma tela quebrar, o rascunho do atendimento é apagado e ela volta ao Início com um toque.
// Sem isso, o rascunho restaurado levaria à mesma tela quebrada a cada recarga, sem saída. A mensagem do erro aparece pequena para ela poder avisar.
import { e } from "@/shared/react";
import React from "react";

var CHAVE_RASCUNHO = "sorelly_rep_rascunho_v1";

class ProtecaoRep extends React.Component {
  constructor(p){ super(p); this.state = {erro:null, n:0}; }
  static getDerivedStateFromError(x){ return {erro:x}; }
  componentDidCatch(x){ try{ console.error("App da representante:", x); }catch(y){} }   // 26/11/2026 (Lucas): NÃO apaga mais o rascunho (o acerto da Crislaine se perdeu assim); a cópia do acerto fica no servidor até finalizar
  render(){
    if(!this.state.erro) return React.createElement(React.Fragment, {key:this.state.n}, this.props.children);
    var msg = String((this.state.erro && this.state.erro.message) || this.state.erro || "").slice(0, 140);
    var self = this;
    return e("div",{className:"flex flex-col items-center gap-3 p-6 text-center text-[13px]"},
      e("b",{className:"text-[16px]"}, "Algo deu errado nesta tela"),
      e("p",null, "Toque no botão para voltar ao início. O que você já enviou está salvo."),
      e("button",{type:"button", onClick:function(){ self.setState({erro:null, n:self.state.n+1}); }, className:"h-12 w-full max-w-[320px] rounded-2xl bg-[#C9A13B] text-[16px] font-bold text-[#1F1B0E]"}, "Voltar ao início"),
      msg && e("p",{className:"max-w-[320px] break-words text-[11px] opacity-80"}, "Código do erro: "+msg));
  }
}

export { ProtecaoRep };
