export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading restaurant">
      <header className="topbar">
        <span className="brand">
          <span className="brand__mark" aria-hidden="true">
            Z
          </span>
          <span className="brand__name">
            zomato<span className="brand__lite">lite</span>
          </span>
        </span>
      </header>

      <main>
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--heading" />
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--heading" />
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
      </main>
    </div>
  );
}
