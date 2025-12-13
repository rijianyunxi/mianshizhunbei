import type { Metadata } from "next";
import { PostTable } from "@/components/admin/post-table";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "文章管理 · Admin",
};

export default async function AdminPostsPage() {
  const posts = await getAllPosts();
  return <PostTable posts={posts} loading={false} error={false} />;
}
