"use client";

import { useOptimistic, useTransition } from "react";
import { updateCartItemAction } from "@/app/actions/cart";
import { QtyStepper } from "./ProductPurchase";

export function CartQty({ variantId, quantity, max }: { variantId: string; quantity: number; max: number }) {
  const [pending, start] = useTransition();
  const [q, setQ] = useOptimistic(quantity);
  return (
    <div className={pending ? "opacity-70" : ""}>
      <QtyStepper
        value={q}
        max={max}
        onChange={(n) =>
          start(async () => {
            setQ(n);
            const fd = new FormData();
            fd.set("variantId", variantId);
            fd.set("quantity", String(n));
            await updateCartItemAction(fd);
          })
        }
      />
    </div>
  );
}
