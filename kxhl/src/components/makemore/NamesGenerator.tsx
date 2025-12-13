import { useState, useCallback } from "react";
import { generateNames } from "../../services/api";

export default function NamesGenerator() {
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(1.0);
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const data = await generateNames("names", count, temperature);
      setGeneratedNames(data.names);
    } catch (err) {
      console.error("Failed to generate names:", err);
      setError("Failed to generate names. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [count, temperature]);

  return (
    <div className="generator-section">
      <div className="generator-header">
        <h2>Name Generator</h2>
        <p className="generator-description">
          Generate creative names using a character-level language model
        </p>
      </div>

      <div className="generator-content">
        <div className="generator-controls">
          <div className="control-group">
            <label htmlFor="names-count">
              Count <span className="control-value">{count}</span>
            </label>
            <input
              type="range"
              id="names-count"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="control-slider"
            />
          </div>

          <div className="control-group">
            <label htmlFor="names-temperature">
              Temperature{" "}
              <span className="control-value">{temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              id="names-temperature"
              min="0.1"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="control-slider"
            />
          </div>

          <button
            className="btn-primary generate-button"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Names"}
          </button>

          {error && <p className="error-message">⚠️ {error}</p>}
        </div>

        {generatedNames.length > 0 && (
          <div className="generated-results">
            <h3 className="results-title">Generated Names</h3>
            <div className="names-grid">
              {generatedNames.map((name, idx) => (
                <div key={idx} className="name-card">
                  <span className="name-text">{name || "(empty)"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
