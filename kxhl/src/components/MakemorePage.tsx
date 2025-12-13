import { useState } from "react";
import { Link } from "@tanstack/react-router";
import NamesGenerator from "./makemore/NamesGenerator";
import DrugNameGenerator from "./makemore/DrugNameGenerator";
import DrugGuessGame from "./makemore/DrugGuessGame";

type TabType = "names" | "drugs" | "game";

export default function MakemorePage() {
  const [activeTab, setActiveTab] = useState<TabType>("names");

  return (
    <section className="project-detail makemore-page">
      <div className="container">
        <Link to="/projects" className="back-link">
          ← Back to Projects
        </Link>

        <div className="project-header">
          <h1>Makemore</h1>
          <p className="project-subtitle">
            Exploring character-level language models for creative generation
          </p>
        </div>

        <div className="makemore-tabs">
          <button
            className={`tab-button ${activeTab === "names" ? "active" : ""}`}
            onClick={() => setActiveTab("names")}
          >
            Name Generator
          </button>
          <button
            className={`tab-button ${activeTab === "drugs" ? "active" : ""}`}
            onClick={() => setActiveTab("drugs")}
          >
            Drug Names
          </button>
          <button
            className={`tab-button ${activeTab === "game" ? "active" : ""}`}
            onClick={() => setActiveTab("game")}
          >
            Guess Game
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "names" && <NamesGenerator />}
          {activeTab === "drugs" && <DrugNameGenerator />}
          {activeTab === "game" && <DrugGuessGame />}
        </div>
      </div>
    </section>
  );
}
