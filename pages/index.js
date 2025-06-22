import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function fetchGame() {
    setError("");
    setResult(null);

    const res = await fetch(`/api/latest-activity?username=${username}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Unknown error");
      return;
    }

    setResult(data);
  }

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>RBX Activity Tracker</h1>

      <input
        type="text"
        placeholder="Enter Roblox username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          padding: "10px",
          fontSize: "16px",
          width: "300px",
          marginRight: "10px"
        }}
      />
      <button onClick={fetchGame} style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
      }}>
        🔍 Find Game
      </button>

      {error && <p style={{ color: "red", marginTop: 20 }}>❌ {error}</p>}

      {result && (
        <div style={{
          marginTop: "2rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9"
        }}>
          <h2>🎮 Game Info</h2>
          <p><strong>Game Name:</strong> {result.gameName}</p>
          <p><strong>Description:</strong> {result.gameDescription || "No description available."}</p>
          <p><strong>Latest Badge:</strong> {result.latestBadge}</p>
          <p><strong>Badge Awarded At:</strong> {new Date(result.badgeAwardedAt).toLocaleString()}</p>
          <a
            href={result.gameLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 10,
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: 4
            }}
          >
            🔗 Go to Game
          </a>
        </div>
      )}
    </main>
  );
}
