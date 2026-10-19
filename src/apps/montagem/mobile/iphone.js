// Sorelly Admin · montagem e bipagem — mobile/iphone.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { hora } from "@/apps/montagem/lib/format";
import { IOS_VARS } from "@/apps/montagem/mobile/theme";
import { useAgora } from "@/apps/montagem/ui/relogio";
import { e } from "@/shared/react";

function IconesStatus(){
  return e("span",{className:"inline-flex items-center gap-1.5"},
    e("svg",{viewBox:"0 0 18 12", width:17, height:11, fill:"currentColor", "aria-hidden":true},
      e("rect",{x:0, y:8, width:3, height:4, rx:1}), e("rect",{x:5, y:5.5, width:3, height:6.5, rx:1}),
      e("rect",{x:10, y:3, width:3, height:9, rx:1}), e("rect",{x:15, y:0, width:3, height:12, rx:1})),
    e("svg",{viewBox:"0 0 16 12", width:15, height:11, fill:"currentColor", "aria-hidden":true},
      e("path",{d:"M8 2.2c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.6 10.6 0 0 0 8 .3 10.6 10.6 0 0 0 .5 3.4l1.3 1.3A8.8 8.8 0 0 1 8 2.2Z"}),
      e("path",{d:"M8 5.6c1.5 0 2.8.6 3.8 1.5l1.3-1.3A7.2 7.2 0 0 0 8 3.7c-2 0-3.8.8-5.1 2.1l1.3 1.3c1-.9 2.3-1.5 3.8-1.5Z"}),
      e("path",{d:"M8 9c.6 0 1.1.2 1.5.6L8 11.2 6.5 9.6C6.9 9.2 7.4 9 8 9Z"})),
    e("svg",{viewBox:"0 0 27 13", width:25, height:12, "aria-hidden":true},
      e("rect",{x:.5, y:.5, width:23, height:12, rx:3.5, fill:"none", stroke:"currentColor", strokeOpacity:.4}),
      e("rect",{x:2, y:2, width:20, height:9, rx:2, fill:"currentColor"}),
      e("path",{d:"M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z", fill:"currentColor", fillOpacity:.4})));
}
function IPhone15(p){
  var agora = useAgora();
  var botao = function(lado, top, h){ return e("span",{className:"absolute w-[3px] rounded-sm bg-[#2B2B2F] "+(lado==="e"?"-left-[3px]":"-right-[3px]"), style:{top:top, height:h}}); };
  return e("div",{className:"relative w-[356px] shrink-0 rounded-[62px] bg-[#0A0A0B] p-[10px] shadow-[0_0_0_2px_#2B2B2F,0_0_0_4px_#0A0A0B,0_40px_80px_-24px_rgba(0,0,0,.85)]"},
    botao("e",120,30), botao("e",176,56), botao("e",244,56), botao("d",206,90),
    // Padrão dos apps Sorelly (prints enviados): barra e cabeçalho escuros, conteúdo claro com cartões brancos e destaque dourado
    e("div",{className:"app-claro relative flex h-[733px] flex-col overflow-hidden rounded-[52px] bg-[#F2F3F5]", style:IOS_VARS},
      e("div",{className:"absolute left-1/2 top-[11px] z-20 flex h-[32px] w-[108px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3"},
        e("span",{className:"size-2.5 rounded-full bg-[#101624] ring-1 ring-[#1d2a44]"})),
      e("div",{className:"barra-status flex h-[54px] shrink-0 items-center justify-between bg-[#0D0D0F] px-8 pt-1 text-[15px] font-semibold"},
        e("span",null, hora(agora)), e(IconesStatus)),
      e("div",{id:"app-screen", className:"flex-1 overflow-y-auto px-4 pb-10 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}, p.children),
      !p.semIndicador && e("span",{className:"absolute bottom-2 left-1/2 h-[5px] w-[124px] -translate-x-1/2 rounded-full bg-[#111]"})));
}
// Moldura do iPhone 17 Pro Max (tela 6,9", proporção mais alongada que o 15): usada no app da representante.
function IPhone17ProMax(p){
  var agora = useAgora();
  var botao = function(lado, top, h){ return e("span",{className:"absolute w-[3px] rounded-sm bg-[#2B2B2F] "+(lado==="e"?"-left-[3px]":"-right-[3px]"), style:{top:top, height:h}}); };
  return e("div",{className:"relative w-[372px] shrink-0 rounded-[66px] bg-[#0A0A0B] p-[10px] shadow-[0_0_0_2px_#2B2B2F,0_0_0_4px_#0A0A0B,0_40px_80px_-24px_rgba(0,0,0,.85)]"},
    botao("e",126,32), botao("e",184,58), botao("e",254,58), botao("d",214,94),
    e("div",{className:"app-claro relative flex h-[774px] flex-col overflow-hidden rounded-[56px] bg-[#F2F3F5]", style:IOS_VARS},
      e("div",{className:"absolute left-1/2 top-[12px] z-20 flex h-[34px] w-[114px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3"},
        e("span",{className:"size-2.5 rounded-full bg-[#101624] ring-1 ring-[#1d2a44]"})),
      e("div",{className:"barra-status flex h-[56px] shrink-0 items-center justify-between bg-[#0D0D0F] px-8 pt-1 text-[15px] font-semibold"},
        e("span",null, hora(agora)), e(IconesStatus)),
      e("div",{id:"app-screen", className:"flex-1 overflow-y-auto px-4 pb-10 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}, p.children),
      e("span",{className:"absolute bottom-2 left-1/2 h-[5px] w-[130px] -translate-x-1/2 rounded-full bg-[#111]"})));
}

export { IconesStatus, IPhone15, IPhone17ProMax };
