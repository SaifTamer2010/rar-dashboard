import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#030712",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <div style={{ fontSize: 80, color: "white", fontWeight: "bold" }}>
        Daily dashboard
      </div>
      <div
        style={{
          fontSize: 32,
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: 700,
        }}
      >
        Real-time sales leads tracker for high-performance teams
      </div>
    </div>,
    size,
  );
}
