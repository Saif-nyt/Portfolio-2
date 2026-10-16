import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

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
          padding: "72px",
          background:
            "radial-gradient(70% 60% at 78% 10%, rgba(99,245,231,0.22), transparent 60%), radial-gradient(60% 50% at 10% 40%, rgba(22,70,63,0.75), transparent 70%), #07110F",
          color: "#F2F5EF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              border: "1.5px solid rgba(99,245,231,0.6)",
              background: "rgba(99,245,231,0.12)",
              color: "#63F5E7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            SI
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 600 }}>T. M. Saiful Islam</div>
            <div style={{ fontSize: 20, color: "#A8B9B2" }}>
              Full-Stack Web Developer &amp; Digital Growth Specialist
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 940,
            }}
          >
            Building Digital Experiences Beyond the Ordinary.
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 24, color: "#63F5E7" }}>
            <span>Web Development</span>
            <span style={{ color: "#A8B9B2" }}>·</span>
            <span>E-commerce</span>
            <span style={{ color: "#A8B9B2" }}>·</span>
            <span>Meta Ads</span>
            <span style={{ color: "#A8B9B2" }}>·</span>
            <span>Conversion Tracking</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
