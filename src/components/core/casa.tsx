import { cn } from "@/lib/utils";

/**
 * Motivo das linhas em forma de "casa" (chevron), como o contorno do logo do hospital:
 * várias casas concêntricas em contorno fino. Puramente decorativo.
 */
export function LinhasCasa({ className, cor = "var(--verde-escuro)", linhas = 7, opacidade = 0.55 }: { className?: string; cor?: string; linhas?: number; opacidade?: number }) {
  // Casa base: telhado em 60×34, paredes até 100. Cada linha cresce a partir do mesmo centro.
  const casas = Array.from({ length: linhas }, (_, i) => {
    const k = 1 + i * 0.32;
    const w = 50 * k;
    const topo = 50 - 46 * k;
    const beiral = 50 - 18 * k;
    const base = 50 + 50 * k;
    return `M${50 - w},${base} L${50 - w},${beiral} L50,${topo} L${50 + w},${beiral} L${50 + w},${base}`;
  });
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="-100 -100 300 300"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none block", className)}
    >
      {casas.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={cor} strokeWidth={1.25}strokeLinejoin="miter" vectorEffect="non-scaling-stroke" opacity={opacidade * (1 - i / (linhas * 1.6))} />
      ))}
    </svg>
  );
}
