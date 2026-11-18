import Formulario from "./formulario";

// Página PÚBLICA do pedido por link (17/11/2026): a revendedora entra sem login, só com o link do setor (vale 48 horas).
export const metadata = { title: "Pedido de reposição · Sorelly", robots: { index: false, follow: false } };

// tela do celular sem ampliar sozinha ao tocar num campo (Marcus pediu letras menores nos campos)
export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };

export default async function Page({ params }) {
  const p = await params;
  return <Formulario codigo={String(p.codigo || "")} />;
}
