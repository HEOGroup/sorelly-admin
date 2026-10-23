// Fontes servidas pelo próprio sistema (src/styles/fontes.css): sem pedido ao Google ao abrir a tela.
import "@/styles/fontes.css";
import "@/styles/theme.css";

export const metadata = { title: "Sorelly Admin" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
