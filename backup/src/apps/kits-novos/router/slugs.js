// Sorelly Admin · kits novos Curitiba — router/slugs.js
export const BASE = "/kits-novos";

export const SLUG_DA_ABA = {
  kits: "kits",
  pendencias: "pendencias",
  consolidado: "consolidado",
  regras: "regras",
  config: "configurador",
};

export const ABA_DO_SLUG = Object.keys(SLUG_DA_ABA).reduce(function (acc, aba) {
  acc[SLUG_DA_ABA[aba]] = aba;
  return acc;
}, {});

export const ABA_INICIAL = "kits";

export function caminhoDaAba(aba) {
  return BASE + "/" + (SLUG_DA_ABA[aba] || SLUG_DA_ABA[ABA_INICIAL]);
}

export function abaDoCaminho(pathname) {
  var partes = pathname.replace(BASE, "").split("/").filter(Boolean);
  return { aba: ABA_DO_SLUG[partes[0]] || ABA_INICIAL, breve: null };
}
