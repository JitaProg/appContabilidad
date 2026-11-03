"use client";

import { useCategoryMap } from "@/lib/hooks";
import { Badge } from "@/components/ui";

export function CategoryBadge({
  categoryId,
  showEmoji = true,
}: {
  categoryId: string;
  showEmoji?: boolean;
}) {
  const categories = useCategoryMap();
  const category = categories.get(categoryId);

  if (!category) {
    return <Badge>Sin categoría</Badge>;
  }

  return (
    <Badge color={category.color}>
      {showEmoji ? <span aria-hidden>{category.emoji}</span> : null}
      {category.name}
    </Badge>
  );
}
