import type { Metadata } from "next";
import { PostComposer } from "@/components/admin/post-composer";

export const metadata: Metadata = {
  title: "发布文章 · Admin",
};

export default function PublishPage() {
  return <PostComposer />;
}
