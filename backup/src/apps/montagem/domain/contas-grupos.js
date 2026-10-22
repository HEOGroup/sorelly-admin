// Sorelly Admin — domain/contas-grupos.js
// Em que grupo cada CONTA de pagamento cai no Consolidado das representantes. A tabela começa pelos CNPJs, depois as contas SEM FATURAMENTO
// (pagamentos que não faturam: dinheiro, Pix banho, Tucano, prestadores de serviço…) e por último a FAMÍLIA.
// Contas novas que ainda não estão aqui caem em "Sem faturamento" até alguém classificar (basta acrescentar a linha em CONTA_GRUPO).
// Cores dos CNPJs = as do cadastro de CNPJs (domain/cnpjs.js).

var GRUPOS_CONTA = [
  {id:"34",   nome:"CNPJ 34 · Sorelly Atacadista", cor:"#D9A93A"},
  {id:"46",   nome:"CNPJ 46 · Mayz",               cor:"#F472B6"},
  {id:"59",   nome:"CNPJ 59 · Serenity",           cor:"#2DD4BF"},
  {id:"67",   nome:"CNPJ 67 · Axis",               cor:"#60A5FA"},
  {id:"ho",   nome:"H&O Apps",                     cor:"#A78BFA"},
  {id:"sem",  nome:"Sem faturamento",              cor:"#FB923C"},
  {id:"fam",  nome:"Família",                      cor:"#A3E635"}];

var CONTA_GRUPO = {
  // ── CNPJ 34 · Sorelly Atacadista
  "PIX SAFRA 34":"34", "LINK - SICREDI - SORELLY - 34":"34", "CRÉDITO - SICREDI - SORELLY - 34":"34", "CRÉDITO - SAFRA - SORELLY - 34":"34", "DÉBITO - SAFRA - SORELLY - 34":"34",
  // ── CNPJ 46 · Mayz
  "PIX - CAIXA - 46":"46", "PIX - SAFRA - SHOPPING - 46":"46", "PIX - STONE - 46":"46", "PIX - UNICRED - 46":"46", "PIX - SICREDI - SHOPPING 46":"46",
  "LINK - SICREDI - SORELLY - 46":"46", "CRÉDITO - SAFRA - 46":"46", "DÉBITO - SAFRA - 46":"46",
  // ── CNPJ 59 · Serenity
  "PIX - ITAÚ - 59":"59", "PIX - SAFRA - SERENITY - 59":"59", "PIX - SICREDI - SERENITY - 59":"59", "LINK - SICREDI - SERENITY - 59":"59",
  "CRÉDITO - SICREDI - SERENITY - 59":"59", "CRÉDITO - BRADESCO CIELO - SERENITY - 59":"59", "CRÉDITO - SAFRA - SERENITY 59":"59", "CRÉDITO - ITAÚ - SERENITY":"59",
  "DÉBITO - SICREDI - SERENITY - 59":"59", "DÉBITO - BRADESCO CIELO - SERENITY - 59":"59", "DÉBITO - ITAÚ - SERENITY":"59", "DÉBITO - SAFRA - SERENITY 59":"59",
  // ── CNPJ 67 · Axis  /  H&O Apps
  "PIX - SICREDI - AXIS":"67", "PIX H&O":"ho",
  // ── Família (pessoa física)
  "PIX - LUCAS - PF":"fam", "PIX - ANA BEATRIZ - PF":"fam", "PIX - MARCUS HESS - PF":"fam", "PIX - ITAÚ PF - MARCO ANTÔNIO":"fam",
  "PIX - CAIXA ECONÔMICA - ANAMARIA":"fam", "PIX - SANTANDER - ANAMARIA":"fam", "CAIXA ECONÔMICA HABITAÇÃO":"fam",
  // ── Sem faturamento (não entram no faturamento de nenhum CNPJ)
  "DINHEIRO":"sem", "PIX - ITAÚ PJ - MARCO":"sem", "PIX - BANHO":"sem", "PIX - TUCANO":"sem", "PIX PRESTADORES DE SERVIÇOS":"sem", "PIX - 3D ACRILICOS":"sem", "PIX CHARME":"sem", "PIX ELLOS BRUTOS":"sem", "PIX ART ELLO":"sem",
  "PIX - MADEIRA COR":"sem", "PIX LINDA":"sem", "PIX - OFFICE GRAF LTDA":"sem", "PIX - DEVMASTER":"sem", "PIX - POINT":"sem", "PIX REPRESENTANTES":"sem",
  "CRÉDITO - CIELO - P":"sem", "CRÉDITO - GETNET - P":"sem", "DÉBITO - CIELO - P":"sem", "DÉBITO - GETNET - P":"sem"};

function grupoDaConta(conta){ return CONTA_GRUPO[conta] || "sem"; }

export { GRUPOS_CONTA, CONTA_GRUPO, grupoDaConta };
