export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div>
        <div className="skeleton-text skeleton-text--short" />
        <div className="skeleton-text skeleton-text--shorter" />
        <div className="skeleton-text skeleton-text--shortest" />
      </div>
    </div>
  );
}
