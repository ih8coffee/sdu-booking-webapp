export default function Status({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="msg err">
      <span>{error.message}</span>
      {onRetry && (
        <button className="secondary small" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
