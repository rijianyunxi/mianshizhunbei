import { randomUUID } from "node:crypto";
import type { AnalyticsSummary, Post } from "./types";
import type { PostInput } from "./validators";

const baseAuthor = {
  name: "Song Jintao",
  role: "Design Technologist",
};

const initialPosts: Post[] = [
  {
    id: "1",
    title: "打造极简主义的 AI 原生博客体验",
    slug: "crafting-ai-native-blog",
    excerpt:
      "这篇文章拆解了我们在打造 AI 原生博客体验时用到的三层架构：内容原子化、设计系统、智能分发。",
    content: `## 设计目标

我们希望新的博客系统能够让写作的人保持“沉浸感”，让阅读的人获得“效率与愉悦感”。

### 内容原子化

- 用 Markdown 组织信息
- 用 Frontmatter 存储结构化数据

### 代码高亮

\`\`\`ts
export async function generateMetadata() {
  const article = await getFeaturedArticle();
  return {
    title: article.title,
    description: article.excerpt,
  };
}
\`\`\`

> 这就是一个我们在后台控台中实时预览的片段。`,
    coverImage: "https://images.unsplash.com/photo-1522199710521-72d69614c702",
    tags: ["AI", "Design", "Next.js"],
    author: baseAuthor,
    status: "published",
    publishedAt: "2024-10-23T09:00:00.000Z",
    updatedAt: "2024-10-23T09:00:00.000Z",
    readingTime: "4 min read",
    views: 1820,
    comments: 24,
  },
  {
    id: "2",
    title: "多终端一致的设计系统实践",
    slug: "unified-design-system",
    excerpt:
      "通过 tokens + 模块化组件的组合，我们让 Web、移动端与小程序共享相同的视觉 DNA。",
    content: `### Token 构建

在 Tailwind v4 中，我们使用 \`@theme inline\` 快速声明色彩体系，再结合 CSS 变量完成主题切换。

### 组件抽象

1. 先定义语义
2. 再抽象交互
3. 最后联动数据`,
    tags: ["Design System", "Tailwind"],
    author: baseAuthor,
    status: "published",
    publishedAt: "2024-09-10T09:00:00.000Z",
    updatedAt: "2024-09-10T09:00:00.000Z",
    readingTime: "6 min read",
    views: 980,
    comments: 12,
  },
  {
    id: "3",
    title: "建设面向未来的内容运营后台",
    slug: "future-proof-cms",
    excerpt:
      "后台不仅要能写文章，还要承担素材管理、版本控制、工作流等职责，我们是怎么设计的？",
    content: `- 富文本 + Markdown 自由切换
- 实时预览
- 草稿箱 / 发布流`,
    tags: ["CMS", "Product"],
    author: baseAuthor,
    status: "draft",
    publishedAt: "2024-08-01T09:00:00.000Z",
    updatedAt: "2024-08-01T09:00:00.000Z",
    readingTime: "3 min read",
    views: 320,
    comments: 4,
  },
];

let postStore = [...initialPosts];

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function slugify(title: string, ignoreId?: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  let slug = base;
  let counter = 1;
  while (postStore.some((post) => post.slug === slug && post.id !== ignoreId)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

function computeReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 260));
  return `${minutes} min read`;
}

export async function getAllPosts() {
  await delay();
  return [...postStore].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function getPostBySlug(slug: string) {
  await delay();
  return postStore.find((post) => post.slug === slug) ?? null;
}

export async function createPost(input: PostInput) {
  await delay();
  const now = new Date();
  const newPost: Post = {
    id: randomUUID(),
    title: input.title,
    slug: slugify(input.title),
    excerpt: input.excerpt,
    content: input.content,
    coverImage: input.coverImage,
    tags: input.tags,
    author: baseAuthor,
    status: input.status ?? "draft",
    publishedAt: input.publishedAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    readingTime: computeReadingTime(input.content),
    views: 0,
    comments: 0,
  };

  postStore = [newPost, ...postStore];
  return newPost;
}

export async function updatePost(slug: string, input: PostInput) {
  await delay();
  const index = postStore.findIndex((post) => post.slug === slug);
  if (index === -1) throw new Error("Post not found");

  const updated: Post = {
    ...postStore[index],
    ...input,
    slug: slugify(input.title, postStore[index].id),
    updatedAt: new Date().toISOString(),
    readingTime: computeReadingTime(input.content),
  };

  postStore[index] = updated;
  return updated;
}

export async function deletePost(slug: string) {
  await delay();
  postStore = postStore.filter((post) => post.slug !== slug);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  await delay();
  const totalPosts = postStore.length;
  const publishedPosts = postStore.filter((post) => post.status === "published")
    .length;
  const draftPosts = postStore.filter((post) => post.status === "draft").length;
  const archivedPosts = postStore.filter((post) => post.status === "archived")
    .length;

  const totalViews = postStore.reduce((acc, post) => acc + post.views, 0);
  const totalComments = postStore.reduce(
    (acc, post) => acc + post.comments,
    0
  );

  const monthlyMap = new Map<
    string,
    {
      posts: number;
      views: number;
    }
  >();

  postStore.forEach((post) => {
    const date = new Date(post.publishedAt);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { posts: 0, views: 0 });
    }
    const entry = monthlyMap.get(key)!;
    entry.posts += 1;
    entry.views += post.views;
  });

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort((a, b) => {
      const [aYear, aMonth] = a[0].split("-").map(Number);
      const [bYear, bMonth] = b[0].split("-").map(Number);
      if (aYear === bYear) {
        return aMonth - bMonth;
      }
      return aYear - bYear;
    })
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      return {
        label: `${year}.${month.padStart(2, "0")}`,
        ...value,
      };
    });

  const publishFrequency =
    monthlyTrend.length === 0
      ? "0 篇/月"
      : `${(publishedPosts / monthlyTrend.length).toFixed(1)} 篇/月`;

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    totalViews,
    totalComments,
    publishFrequency,
    monthlyTrend,
  };
}
