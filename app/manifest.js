// Permite instalar o Sorelly Admin como aplicativo no PC e no Android.
export default function manifest() {
  return {
    name: "Sorelly Admin",
    short_name: "Sorelly",
    start_url: "/",
    display: "standalone",
    background_color: "#14120e",
    theme_color: "#14120e",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
