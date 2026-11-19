import Tabela from "./tabela";

// Página PÚBLICA com a tabela de valores de reposição pela média de vendas (Marcus, 18/11/2026): a revendedora abre pelo link dela e vê o que está liberado para ela.
export const metadata = { title: "Valores de reposição · Sorelly", robots: { index: false, follow: false } };

export default async function Page({ params }) {
  const p = await params;
  return <Tabela codigo={String(p.codigo || "")} />;
}
