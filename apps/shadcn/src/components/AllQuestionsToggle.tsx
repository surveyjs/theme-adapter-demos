"use client";

import { usePathname } from "next/navigation";
import { isActiveRoute, routes } from "@adapter/schemas";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAllQuestionsMode } from "./AllQuestionsMode";

export function AllQuestionsToggle() {
  const pathname = usePathname();
  const { readOnly, setReadOnly } = useAllQuestionsMode();

  if (!isActiveRoute(pathname, routes.allQuestions)) return null;

  return (
    <Label htmlFor="all-questions-readonly" className="gap-2">
      <Switch
        id="all-questions-readonly"
        checked={readOnly}
        onCheckedChange={setReadOnly}
      />
      <span className="hidden sm:inline">Read-only</span>
    </Label>
  );
}
