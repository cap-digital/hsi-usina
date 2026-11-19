import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  /** "verde" sobre fundo claro, "branco" sobre o verde. */
  cor?: "verde" | "branco";
  /** Altura em px (a largura segue a proporção do logo, 934×1043). */
  altura?: number;
  priority?: boolean;
}

const SRC = { verde: "/logo-hsi-verde.png", branco: "/logo-hsi-branco.png" } as const;

/** Logo oficial do Hospital Santa Izabel (PNG transparente). */
export function LogoHSI({ className, cor = "verde", altura = 48, priority = false }: LogoProps) {
  const largura = Math.round((altura * 934) / 1043);
  return (
    <Image
      src={SRC[cor]}
      alt="Hospital Santa Izabel"
      width={largura}
      height={altura}
      priority={priority}
      className={cn("block select-none", className)}
      style={{ width: largura, height: altura }}
    />
  );
}
