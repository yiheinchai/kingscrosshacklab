import { useState, useCallback } from "react";
import { generateNames } from "../../services/api";

export default function DrugNameGenerator() {
  const [generatedDrugs, setGeneratedDrugs] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(1.0);
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const data = await generateNames("drugs", count, temperature);
      setGeneratedDrugs(data.names);
    } catch (err) {
      console.error("Failed to generate drug names:", err);
      setError("Failed to generate drug names. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [count, temperature]);

  return (
    <div className="generator-section">
      <div className="generator-header">
        <h2>Drug Name Generator</h2>
        <p className="generator-description">
          Generate pharmaceutical-style names using AI trained on real drug
          names
        </p>
      </div>

      <div className="generator-content">
        <div className="generator-controls">
          <div className="control-group">
            <label htmlFor="drugs-count">
              Count <span className="control-value">{count}</span>
            </label>
            <input
              type="range"
              id="drugs-count"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="control-slider"
            />
          </div>

          <div className="control-group">
            <label htmlFor="drugs-temperature">
              Temperature{" "}
              <span className="control-value">{temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              id="drugs-temperature"
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
            {isGenerating ? "Generating..." : "Generate Drug Names"}
          </button>

          {error && <p className="error-message">⚠️ {error}</p>}
        </div>

        {generatedDrugs.length > 0 && (
          <div className="generated-results">
            <h3 className="results-title">Generated Drug Names</h3>
            <div className="names-grid">
              {generatedDrugs.map((drug, idx) => (
                <div key={idx} className="name-card drug-name-card">
                  <span className="name-text">{drug || "(empty)"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
