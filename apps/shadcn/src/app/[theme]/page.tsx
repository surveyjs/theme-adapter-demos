"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { navItems, themedPath } from "@adapter/schemas";
import { DEFAULT_STYLE_ID, isVisualStyleId } from "@/lib/styles";

export default function HomePage() {
  const params = useParams<{ theme: string }>();
  const theme = isVisualStyleId(params.theme) ? params.theme : DEFAULT_STYLE_ID;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {navItems.map((item) => (
        <Card key={item.id} className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle>{item.label}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={themedPath(theme, item.path)}>
                Open {item.label}
                <ArrowRightIcon />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
