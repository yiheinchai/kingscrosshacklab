import { useState, useCallback, useEffect } from "react";
import { generateNames } from "../../services/api";
import realDrugsData from "../../data/drugs";

type GameState = "idle" | "playing" | "correct" | "incorrect";

export default function DrugGuessGame() {
  const [currentDrug, setCurrentDrug] = useState<string>("");
  const [isReal, setIsReal] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const getRandomRealDrug = () => {
    return realDrugsData[Math.floor(Math.random() * realDrugsData.length)];
  };

  const generateFakeDrug = async () => {
    try {
      const data = await generateNames("drugs", 1, 1.2);
      return data.names[0] || "fallbackdrugname";
    } catch (err) {
      console.error("Failed to generate fake drug:", err);
      return "fallbackdrugname";
    }
  };

  const startNewRound = useCallback(async () => {
    setIsLoading(true);
    setGameState("playing");

    const shouldBeReal = Math.random() > 0.5;
    let drugName: string;

    if (shouldBeReal) {
      drugName = getRandomRealDrug();
    } else {
      drugName = await generateFakeDrug();
    }

    setCurrentDrug(drugName);
    setIsReal(shouldBeReal);
    setIsLoading(false);
  }, []);

  const handleGuess = (guessedReal: boolean) => {
    const correct = guessedReal === isReal;
    setGameState(correct ? "correct" : "incorrect");
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    setTimeout(() => {
      startNewRound();
    }, 2000);
  };

  const resetGame = () => {
    setScore({ correct: 0, total: 0 });
    startNewRound();
  };

  useEffect(() => {
    if (gameState === "idle") {
      const initGame = async () => {
        await startNewRound();
      };
      void initGame();
    }
  }, [gameState, startNewRound]);

  const accuracy =
    score.total > 0 ? ((score.correct / score.total) * 100).toFixed(0) : 0;

  return (
    <div className="generator-section drug-game-section">
      <div className="generator-header">
        <h2>Drug Name Game</h2>
        <p className="generator-description">
          Can you tell which drug names are real and which are AI-generated?
        </p>
      </div>

      <div className="game-content">
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">
              {score.correct} / {score.total}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{accuracy}%</span>
          </div>
          <button className="btn-secondary reset-button" onClick={resetGame}>
            Reset
          </button>
        </div>

        <div className="game-card">
          {isLoading ? (
            <div className="drug-display loading">
              <span className="loading-text">Loading...</span>
            </div>
          ) : (
            <>
              <div className={`drug-display ${gameState}`}>
                <span className="drug-name">{currentDrug}</span>
                {gameState !== "playing" && (
                  <div className="feedback">
                    {gameState === "correct" ? (
                      <span className="feedback-correct">✓ Correct!</span>
                    ) : (
                      <span className="feedback-incorrect">
                        ✗ Wrong! It was {isReal ? "REAL" : "FAKE"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {gameState === "playing" && (
                <div className="game-buttons">
                  <button
                    className="game-btn real-btn"
                    onClick={() => handleGuess(true)}
                    disabled={isLoading}
                  >
                    Real Drug
                  </button>
                  <button
                    className="game-btn fake-btn"
                    onClick={() => handleGuess(false)}
                    disabled={isLoading}
                  >
                    AI Generated
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="game-hint">
          <p>
            💡 Tip: Real drugs often have unusual letter combinations like "x",
            "z", or "q"
          </p>
        </div>
      </div>
    </div>
  );
}
