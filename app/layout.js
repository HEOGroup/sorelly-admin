import "@/styles/theme.css";

export const metadata = { title: "Sorelly Admin" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Geist:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
