"use client";

import { useEffect, useMemo, useState } from "react";

import { productRepository } from "@/lib/repositories/productRepository";
import { Product } from "@/lib/types";

export const useStoredProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    void productRepository.getAll().then((data) => {
      if (active) setProducts(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = () => {
    void productRepository.getAll().then(setProducts);
  };

  return { products, setProducts, refresh };
};

export const usePublishedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    void productRepository.getPublished().then((data) => {
      if (active) setProducts(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = () => {
    void productRepository.getPublished().then(setProducts);
  };

  return { products, refresh };
};
