import { ImageResponse } from "next/og";

export const alt = "Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File";
export const size = { width: 1200, height: 630 };
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            ☁️
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 72, fontWeight: 700 }}>Free Clouds</div>
            <div style={{ fontSize: 28, color: "#94a5fd" }}>
              freeclouds.cloud
            </div>
          </div>
        </div>
        <div style={{ fontSize: 36, textAlign: "center", padding: "0 80px" }}>
          Lưu trữ đám mây an toàn, được vận hành bởi Telegram
        </div>
        <div
          style={{
            marginTop: 32,
            padding: "12px 32px",
            borderRadius: 999,
            background: "rgba(59,130,246,0.35)",
            border: "1px solid rgba(147,197,253,0.5)",
            fontSize: 24,
          }}
        >
          Tải lên · Tổ chức · Chia sẻ
        </div>
      </div>
    ),
    size
  );
}