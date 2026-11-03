import { stagger } from "../stagger";

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading rooms">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card skeleton" style={stagger(i)}>
          <div className="sk-line sk-title" />
          <div className="sk-line sk-short" />
          <div className="sk-line sk-short" />
          <div className="sk-btn" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <ul className="list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="list-item skeleton" style={stagger(i)}>
          <div className="sk-stack">
            <div className="sk-line sk-title" />
            <div className="sk-line sk-short" />
          </div>
          <div className="sk-pill" />
        </li>
      ))}
    </ul>
  );
}

export function SkeletonStats({ count = 3 }) {
  return (
    <div className="stats" aria-busy="true" aria-label="Loading overview">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="stat skeleton" style={stagger(i)}>
          <div className="sk-line sk-title" />
          <div className="sk-line sk-short" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="skeleton sk-header" aria-busy="true" aria-label="Loading room">
      <div className="sk-line sk-title" />
      <div className="sk-line sk-short" />
      <div className="sk-line" />
      <div className="sk-line sk-short" />
    </div>
  );
}
