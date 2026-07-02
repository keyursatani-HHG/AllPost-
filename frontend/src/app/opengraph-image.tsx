import { ImageResponse } from "next/og";

export const alt = "Postly — Post to all platforms instantly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static route -> Next generates this to a PNG at build time (served statically).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #5BC878, #22C55E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path d="M3 11.5L21 3l-8.5 18-2.4-7.1L3 11.5z" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontSize: 46, fontWeight: 800 }}>Postly</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Post to all platforms
          </div>
          <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#5BC878" }}>
            instantly.
          </div>
        </div>

        <div style={{ fontSize: 32, color: "#CBD5E1" }}>
          The all-in-one social media management platform
        </div>
      </div>
    ),
    { ...size }
  );
}
