import { NextResponse } from "next/server";
import { createPost, getAllPosts } from "@/lib/posts";
import { postInputSchema } from "@/lib/validators";

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = postInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid payload",
        errors: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const post = await createPost(parsed.data);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 }
    );
  }
}
