import { NextResponse } from "next/server";

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

export function middleware() {
  if (MAINTENANCE_MODE) {
    return new NextResponse(
      `<!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>Temporarily Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
            body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                height: 100vh;
                align-items: center;
                justify-content: center;
                margin: 0;
                background: #0f172a;
                color: white;
                text-align: center;
            }
            .box {
                max-width: 500px;
                padding: 24px;
            }
            h1 {
                margin-bottom: 12px;
            }
            p {
                opacity: 0.8;
            }
            </style>
        </head>
        <body>
            <div class="box">
            <h1>Temporarily Offline</h1>
            <p>We’re doing maintenance right now. Please check back shortly.</p>
            </div>
        </body>
        </html>`,
      {
        status: 503,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "retry-after": "3600",
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};