import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/core/smooth-scroll";
import { Preloader } from "@/components/core/preloader";
import { PageTransition } from "@/components/core/page-transition";
import { Nav } from "@/components/nav/nav";
import { Footer } from "@/components/nav/footer";
import { PainelProvider, type PainelMeta } from "@/data/provider";
import snapshot from "@/data/snapshot.json";
import type { Snapshot } from "@/data/types";
import { NOTA_2025 } from "@/data/format";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-work-sans",
  display: "swap",
});

const s = snapshot as Snapshot;

const TITULO = "Hospital Santa Izabel · Relatório de Desempenho · Meta 2026";
const DESCRICAO =
  "Relatório de desempenho do Hospital Santa Izabel na Meta (Facebook e Instagram) em 2026: investimento, impressões, alcance, engajamento, campanhas, público e criativos de 1º de janeiro a 31 de outubro.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  applicationName: "Relatório de Desempenho · Hospital Santa Izabel",
  authors: [{ name: "Hospital Santa Izabel" }],
  creator: "Hospital Santa Izabel",
  publisher: "Hospital Santa Izabel",
  openGraph: { title: TITULO, description: DESCRICAO, siteName: "Hospital Santa Izabel", locale: "pt_BR", type: "website" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2EB038",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const painel: PainelMeta = {
    cliente: s.cliente,
    periodo: s.periodo,
    atualizadoEm: s.atualizadoEm,
    // Avisos do build só em dev (o rodapé não os mostra em produção, e nem chegam ao payload).
    avisos: process.env.NODE_ENV !== "production" ? s.avisos : [],
    notas: [NOTA_2025],
  };
  return (
    <html lang="pt-BR" className={cn(workSans.variable, "antialiased")}>
      <body className="flex min-h-svh flex-col">
        <PainelProvider value={painel}>
          <SmoothScroll>
            <Preloader />
            <PageTransition />
            <Nav />
            {children}
            <Footer />
          </SmoothScroll>
        </PainelProvider>
      </body>
    </html>
  );
}
