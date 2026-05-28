"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "belapop_favorites";

function readFavorites() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Favoritos sao um conforto de UX; falha de storage nao deve quebrar compra.
    }
  }, [favorites, isLoaded]);

  const toggleFavorite = useCallback((slug: string) => {
    if (!slug) return;

    setFavorites((prev) =>
      prev.includes(slug)
        ? prev.filter((item) => item !== slug)
        : Array.from(new Set([...prev, slug])),
    );
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite, isLoaded };
}
