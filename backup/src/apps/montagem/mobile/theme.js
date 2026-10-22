// Sorelly Admin · montagem e bipagem — mobile/theme.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { e } from "@/shared/react";

var IOS_VARS = {"--background":"#F2F3F5", "--foreground":"#111827", "--card":"#FFFFFF", "--card-foreground":"#111827",
  "--muted":"#F3F4F6", "--muted-foreground":"#6B7280", "--border":"#E5E7EB", "--input":"#D1D5DB",
  "--success":"oklch(0.55 0.15 155)", "--warning":"oklch(0.6 0.14 70)", "--info":"oklch(0.52 0.16 255)", "--destructive":"oklch(0.56 0.21 27)",
  "--primary":"oklch(0.66 0.13 85)", "--purple":"oklch(0.5 0.19 300)", color:"#111827"};
var CORES_CEL = [{grad:"from-[#B8862B] via-[#E8B84B] to-[#F1E4C6]", txt:"text-amber-200", bar:"bg-amber-400"}];
var PONTO_CEL = {primary:"bg-yellow-400", success:"bg-emerald-400", info:"bg-sky-400", warning:"bg-amber-400",
  destructive:"bg-rose-500", purple:"bg-violet-400", muted:"bg-zinc-500"};
function corDe(i){ return CORES_CEL[i % CORES_CEL.length]; }
function Avatar(p){
  return e("span",{className:"grid shrink-0 place-items-center rounded-full bg-linear-to-br font-bold text-[#1B1409] "+corDe(p.i).grad+" "+(p.className||"size-10 text-base")}, p.nome.charAt(0));
}

export { IOS_VARS, CORES_CEL, PONTO_CEL, corDe, Avatar };
