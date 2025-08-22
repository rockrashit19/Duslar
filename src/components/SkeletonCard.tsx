export default function SkeletonCard() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "64px 1fr",
        gap: 12,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 12,
        marginBottom: 10,
      }}
    >
      <div
        style={{ width: 64, height: 64, borderRadius: 8, background: "#eee" }}
      />
      <div>
        <div
          style={{
            height: 14,
            background: "#eee",
            borderRadius: 6,
            width: "60%",
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 12,
            background: "#f0f0f0",
            borderRadius: 6,
            width: "40%",
            marginBottom: 6,
          }}
        />
        <div
          style={{
            height: 12,
            background: "#f0f0f0",
            borderRadius: 6,
            width: "30%",
          }}
        />
      </div>
    </div>
  );
}
