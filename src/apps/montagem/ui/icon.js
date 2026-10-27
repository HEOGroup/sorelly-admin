// Sorelly Admin · montagem e bipagem — ui/icon.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { e } from "@/shared/react";

var P = {
  gem:["M6 3h12l4 6-10 13L2 9z","M11 3 8 9l4 13 4-13-3-6","M2 9h20"],
  grid:["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"],
  chart:["M3 3v18h18","M18 17V9","M13 17V5","M8 17v-3"],
  wallet:["M21 12V7H5a2 2 0 0 1 0-4h14v4","M3 5v14a2 2 0 0 0 2 2h16v-5","M18 12a2 2 0 0 0 0 4h4v-4Z"],
  list:["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"],
  settings:["M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  clock:["M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z","M12 6v6l4 2"],
  star:["m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  check:["M20 6 9 17l-5-5"],
  x:["M18 6 6 18","m6 6 12 12"],
  logout:["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","m16 17 5-5-5-5","M21 12H9"],
  pause:["M6 4h4v16H6z","M14 4h4v16h-4z"],
  play:["m6 3 14 9-14 9V3z"],
  undo:["M9 14 4 9l5-5","M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"],
  sunmoon:["M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4","M12 2v2","M12 20v2","m4.9 4.9 1.4 1.4","m17.7 17.7 1.4 1.4","M2 12h2","M20 12h2","m6.3 17.7-1.4 1.4","m19.1 4.9-1.4 1.4"],
  menu:["M4 12h16","M4 6h16","M4 18h16"],
  inbox:["M22 12h-6l-2 3h-4l-2-3H2","M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],
  chevron:["m9 18 6-6-6-6"],
  chevrondown:["m6 9 6 6 6-6"], chevronup:["m18 15-6-6-6 6"],
  alert:["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z","M12 9v4","M12 17h.01"],
  scan:["M3 7V5a2 2 0 0 1 2-2h2","M17 3h2a2 2 0 0 1 2 2v2","M21 17v2a2 2 0 0 1-2 2h-2","M7 21H5a2 2 0 0 1-2-2v-2","M7 12h10"],
  phone:["M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z","M12 18h.01"],
  plus:["M5 12h14","M12 5v14"],
  search:["M11 3a8 8 0 1 0 0 16 8 8 0 1 0 0-16z","m21 21-4.3-4.3"],
  lock:["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z","M7 11V7a5 5 0 0 1 10 0v4"],
  unlock:["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z","M7 11V7a5 5 0 0 1 9.9-1"],
  user:["M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8z","M20 21a8 8 0 0 0-16 0"],
  send:["m22 2-7 20-4-9-9-4Z","M22 2 11 13"],
  box:["m7.5 4.27 9 5.15","M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z","m3.3 7 8.7 5 8.7-5","M12 22V12"],
  coins:["M8 2a6 6 0 1 0 0 12A6 6 0 1 0 8 2z","M18.09 10.37A6 6 0 1 1 10.34 18","M7 6h1v4","m16.71 13.88.7.71-2.82 2.82"],
  pencil:["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z","m15 5 4 4"],
  trash:["M3 6h18","M8 6V4h8v2","M19 6l-1 14H6L5 6","M10 11v6","M14 11v6"],
  history:["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8","M3 3v5h5","M12 7v5l4 2"],
  save:["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"],
  book:["M4 19.5A2.5 2.5 0 0 1 6.5 17H20","M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"]
};
var PH = {gem:"diamond", grid:"clipboard-text", chart:"chart-bar", wallet:"wallet", list:"list-checks", settings:"gear-six", clock:"clock",
  star:"star", check:"check-circle", x:"x-circle", pause:"pause-circle", play:"play-circle", undo:"arrow-counter-clockwise", sunmoon:"moon-stars",
  menu:"list", inbox:"archive", chevron:"caret-right", chevrondown:"caret-down", chevronup:"caret-up", alert:"warning", scan:"barcode", phone:"device-mobile",
  plus:"plus-circle", search:"magnifying-glass", lock:"lock-simple", unlock:"lock-simple-open", user:"user-circle", send:"paper-plane-tilt",
  box:"package", coins:"coins", pencil:"pencil-simple", trash:"trash", history:"clock-counter-clockwise", save:"floppy-disk", book:"book-open-text",
  users:"users-three", equipe:"users-three", trofeu:"trophy", registro:"notebook", novas:"user-plus", montadora:"hand-heart", bipagem:"barcode",
  representante:"briefcase", revendedora:"handbag", calendario:"calendar-dots", whats:"whatsapp-logo", presente:"gift", grafico:"chart-line-up",
  lista:"clipboard-text", arquivo:"archive", config:"gear-six", celular:"device-mobile", kitnovo:"sparkle", caixa:"package",
  ia:"robot", calc:"calculator", espera:"hourglass-medium", grid4:"squares-four", chamado:"envelope-simple-open", coroa:"crown-simple", banco:"bank",
  cubos:"cube", cadastro:"identification-card", agenda:"calendar-check", escudo:"shield-check", maleta:"briefcase", vassoura:"broom", m_admin:"database", m_pronto:"stack", m_integ:"seal-check", m_criar:"hammer", m_proto:"flask", megafone:"megaphone", caminhao:"truck", fechar:"x", dashboard:"gauge",
  seta:"arrow-right", pontilhado:"circle-dashed", sino:"bell", copiar:"copy"};
function Icon(p){
  var nm = PH[p.n];
  if(nm) return e("i",{className:"ph-"+(p.peso||"duotone")+" ph-"+nm+" inline-block shrink-0 leading-none "+(p.className||""), style:{fontSize:(p.s||16)+2}, "aria-hidden":true});
  var d = P[p.n]; if(!d) return null;
  return e("svg",{viewBox:"0 0 24 24", width:p.s||16, height:p.s||16, fill:"none", stroke:"currentColor",
    strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round", className:"shrink-0 "+(p.className||""), "aria-hidden":true},
    d.map(function(x,i){ return e("path",{key:i, d:x}); }));
}

export { P, PH, Icon };
