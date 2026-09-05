import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function proxy(
  request: NextRequest,
  context: { params?: { path?: string[] } }
) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
  const subPath = (context.params?.path || []).join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${backendUrl}/api/${subPath}${search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const method = request.method;
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
      // @ts-expect-error Node.js duplex streaming option
      duplex: "half",
      signal: AbortSignal.timeout(300000), // 5-minute timeout prevents premature socket hang-up
    });

    const resHeaders = new Headers(res.headers);
    resHeaders.delete("content-encoding");

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Backend proxy error",
        target: targetUrl,
        details: error?.message || String(error),
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
