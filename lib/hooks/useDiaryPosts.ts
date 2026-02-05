"use client";

import { useEffect, useMemo, useState } from "react";

import { posts as seedPosts } from "@/data/posts";
import { localDiaryRepository } from "@/lib/repositories/diaryRepository";
import { DiaryPost } from "@/lib/types";

export const useDiaryPosts = () => {
  const [posts, setPosts] = useState<DiaryPost[]>(seedPosts);

  useEffect(() => {
    setPosts(localDiaryRepository.getAll());
  }, []);

  const refresh = () => {
    setPosts(localDiaryRepository.getAll());
  };

  return { posts, setPosts, refresh };
};

export const usePublishedDiaryPosts = () => {
  const { posts, refresh } = useDiaryPosts();
  const published = useMemo(
    () =>
      posts
        .filter((post) => post.status === "published")
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [posts]
  );

  return { posts: published, refresh };
};
