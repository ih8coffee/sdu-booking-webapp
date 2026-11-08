import { useEffect, useState } from "react";
import { OFFLINE_EVENT, isOffline } from "../api";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(isOffline());

  useEffect(() => {
    const onOffline = () => setOffline(true);
    window.addEventListener(OFFLINE_EVENT, onOffline);
    return () => window.removeEventListener(OFFLINE_EVENT, onOffline);
  }, []);

  if (!offline) return null;
  return (
    <div className="banner">
      Can't reach the backend, so sample data is shown and sign in won't work. Check that the
      server is running and that <code>VITE_API_URL</code> is correct.
    </div>
  );
}
