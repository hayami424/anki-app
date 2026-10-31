import { CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReviewPhase } from "@/lib/types";

// フェーズが進むほど濃い色にして、定着度がひと目でわかるようにする
const phaseClassNames: Record<ReviewPhase, string> = {
  1: "bg-primary/10 text-primary",
  2: "bg-primary/20 text-primary",
  3: "bg-primary/30 text-primary",
  4: "bg-success/15 text-success",
};

export function PhaseBadge({ phase }: { phase: ReviewPhase }) {
  return (
    <Badge className={cn(phaseClassNames[phase])}>
      {phase === 4 && <CircleCheck aria-hidden="true" />}
      フェーズ{phase}
    </Badge>
  );
}
