"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { resetDemoData } from "../actions";

export function ResetDemoDataButton() {
  const { run, pending } = useAction(resetDemoData, {
    successMessage: "Demo data reseeded.",
  });

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => run()}>
      <RotateCcw className="size-4" />
      {pending ? "Reseeding…" : "Reset demo data"}
    </Button>
  );
}
