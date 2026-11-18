import Formulario from "./formulario";

// Pesquisa de clima (18/11/2026): página PÚBLICA e anônima, sem login, só com o link. Não é indexada pelos buscadores.
export const metadata = { title: "Pesquisa de clima · Sorelly", robots: { index: false, follow: false } };

export default function Page() {
  return <Formulario />;
}
