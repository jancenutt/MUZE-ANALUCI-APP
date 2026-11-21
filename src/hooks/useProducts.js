import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_PRODUCTS, mergeProducts } from "@/lib/products";

// Pricing display: Product records (admin-editable), falling back to the built-in defaults.
export default function useProducts() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);

  useEffect(() => {
    let alive = true;
    base44.entities.Product.filter({ active: true }, { sort: "sort", limit: 100 })
      .then((page) => {
        if (alive) setProducts(mergeProducts(page.items));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return products;
}