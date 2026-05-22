"use client";

import { useEffect, useMemo, useState } from "react";

import { productRepository } from "@/lib/repositories/productRepository";
import { Product } from "@/lib/types";

export const useStoredProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void productRepository
      .getAll()
      .then((data) => {
        if (active) setProducts(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    void productRepository
      .getAll()
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  return { products, setProducts, refresh, loading };
};

export const usePublishedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void productRepository
      .getPublished()
      .then((data) => {
        if (active) setProducts(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    void productRepository
      .getPublished()
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  return { products, refresh, loading };
};
