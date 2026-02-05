"use client";

import { posts as seedPosts } from "@/data/posts";
import { readStorageRaw, storageKeys, writeStorage } from "@/lib/storage";
import { DiaryPost } from "@/lib/types";

export interface DiaryRepository {
  getAll: () => DiaryPost[];
  saveAll: (posts: DiaryPost[]) => void;
  getById: (id: string) => DiaryPost | undefined;
  getBySlug: (slug: string) => DiaryPost | undefined;
  upsert: (post: DiaryPost) => DiaryPost[];
  remove: (id: string) => DiaryPost[];
}

const normalizeContent = (content: DiaryPost["content"] | string[] | undefined) => {
  if (!content) return "";
  return Array.isArray(content) ? content.join("\n\n") : content;
};

const normalizeSeed = (): DiaryPost[] =>
  seedPosts.map((post) => ({
    ...post,
    content: normalizeContent(post.content),
    tags: post.tags ?? [],
    status: post.status ?? "draft",
    updatedAt: post.updatedAt ?? new Date().toISOString()
  }));

const normalizePosts = (posts: DiaryPost[]) =>
  posts.map((post) => ({
    ...post,
    content: normalizeContent(post.content),
    tags: post.tags ?? [],
    status: post.status ?? "draft",
    updatedAt: post.updatedAt ?? new Date().toISOString()
  }));

export const localDiaryRepository: DiaryRepository = {
  getAll: () => {
    const raw = readStorageRaw(storageKeys.diary);
    if (!raw) {
      const seeded = normalizeSeed();
      writeStorage(storageKeys.diary, seeded);
      return seeded;
    }
    try {
      const parsed = JSON.parse(raw) as DiaryPost[];
      const normalized = normalizePosts(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        writeStorage(storageKeys.diary, normalized);
      }
      return normalized;
    } catch {
      const seeded = normalizeSeed();
      writeStorage(storageKeys.diary, seeded);
      return seeded;
    }
  },
  saveAll: (posts: DiaryPost[]) => writeStorage(storageKeys.diary, posts),
  getById: (id: string) =>
    localDiaryRepository.getAll().find((post) => post.id === id),
  getBySlug: (slug: string) =>
    localDiaryRepository.getAll().find((post) => post.slug === slug),
  upsert: (post: DiaryPost) => {
    const posts = localDiaryRepository.getAll();
    const existingIndex = posts.findIndex((item) => item.id === post.id);
    if (existingIndex >= 0) {
      const next = [...posts];
      next[existingIndex] = post;
      localDiaryRepository.saveAll(next);
      return next;
    }
    const next = [post, ...posts];
    localDiaryRepository.saveAll(next);
    return next;
  },
  remove: (id: string) => {
    const posts = localDiaryRepository.getAll();
    const next = posts.filter((post) => post.id !== id);
    localDiaryRepository.saveAll(next);
    return next;
  }
};
