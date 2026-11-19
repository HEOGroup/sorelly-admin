// Sorelly Admin — pages/RegrasConsignado.js
// A TELA DE EDITAR AS REGRAS DO CONSIGNADO FOI EXCLUÍDA (Marcus, 12/11/2026: "exclui essa tela, tudo para editar vai ser com código").
// Comissão, brinde, taxa, remarcação, pagamento e kit novo agora são definidos SÓ no código (domain/consignado.js) e valem iguais para todos os computadores.
// Para mudar uma regra: editar domain/consignado.js (FAIXAS_OFICIAIS, NOVAS_PADRAO, PRATA_FAIXAS...), conferir e subir. Sobrou aqui só o campo de dinheiro usado em outras telas.
import { MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

var CELULA = "w-full text-right "+MONO+" h-9! px-2.5! text-sm!";

// Dinheiro (R$ 7.000,00, digitando só números), com a mesma largura e alinhamento à direita.
function Din(p){ return e(MoneyInput,{value:p.value, label:p.label, onChange:p.onChange, className:CELULA}); }

export { Din };
