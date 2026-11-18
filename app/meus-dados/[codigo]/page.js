import Formulario from "./formulario";

// Formulário dos funcionários (18/11/2026): página PÚBLICA, sem login, só com o link de cada pessoa. Não é indexada pelos buscadores.
export const metadata = { title: "Meus dados · Sorelly", robots: { index: false, follow: false } };

export default async function Page({ params }) {
  const { codigo } = await params;
  return <Formulario codigo={codigo} />;
}
