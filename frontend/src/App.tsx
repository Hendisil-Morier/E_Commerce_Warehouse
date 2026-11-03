
import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "@/services/healthService";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkBackend = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getHealth();

      setHealth(result);
    } catch {
      setHealth(null);
      setError("Không thể kết nối đến Backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkBackend();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>E-Commerce Warehouse System</h1>

      <h2>Backend Connection Status</h2>

      {loading && <p>Đang kiểm tra kết nối...</p>}

      {health && (
        <div>
          <p>Trạng thái: {health.status}</p>
          <p>Thông báo: {health.message}</p>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={() => void checkBackend()}>
        Kiểm tra lại kết nối
      </button>
    </main>
  );
}

export default App;
