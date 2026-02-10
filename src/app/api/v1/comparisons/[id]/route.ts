import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Comparisons are stateless in MVP — this endpoint returns
  // placeholder info since comparisons are created on-the-fly via POST
  return NextResponse.json({
    id,
    message: "Use POST /api/v1/comparisons with startupIds to create a comparison",
  });
}
