import { NextResponse } from "next/server";
import { deletePost, getPostBySlug, updatePost } from "@/lib/posts";
import { postInputSchema } from "@/lib/validators";

type Params = {
  params: { slug: string };
};

export async function GET(_: Request, { params }: Params) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}

export async function PUT(request: Request, { params }: Params) {
  const json = await request.json();
  const parsed = postInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await updatePost(params.slug, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await deletePost(params.slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
