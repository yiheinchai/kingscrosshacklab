import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function MakemorePage() {
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(1.0);
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count, temperature }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedNames(data.names);
    } catch (err) {
      console.error("Failed to generate names:", err);
      setError("API unavailable");
    } finally {
      setIsGenerating(false);
    }
  }, [count, temperature]);

  return (
    <section className="project-detail">
      <div className="container">
        <Link to="/projects" className="back-link">
          ←
        </Link>

        <div className="project-header">
          <h1>Makemore</h1>
        </div>

        <div className="project-content">
          <div className="generator-container">
            <div className="generator-controls">
              <div className="control-group">
                <label htmlFor="count">Count</label>
                <input
                  type="range"
                  id="count"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
                <span className="control-value">{count}</span>
              </div>

              <div className="control-group">
                <label htmlFor="temperature">Temperature</label>
                <input
                  type="range"
                  id="temperature"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
                <span className="control-value">{temperature.toFixed(1)}</span>
              </div>

              <button
                className="cta-button generate-button"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? "..." : "Generate →"}
              </button>

              {error && <p className="error-message">⚠️ {error}</p>}
            </div>

            {generatedNames.length > 0 && (
              <div className="generated-names">
                <div className="names-grid">
                  {generatedNames.map((name, idx) => (
                    <div key={idx} className="generated-name">
                      <span className="name-text">{name || "(empty)"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
