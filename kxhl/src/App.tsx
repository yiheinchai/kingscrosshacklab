import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
  Outlet,
  Link,
} from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import MakemorePage from "./components/MakemorePage";

// Root Layout Component
function RootLayout() {
  const logoRef = useRef<HTMLAnchorElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const originalLogoText = "KXHL";

  const glitchText = (element: HTMLElement, originalText: string) => {
    const glitchChars = "!<>-_\\/[]{}—=+*^?#@$%&";
    let iteration = 0;

    const interval = setInterval(() => {
      element.textContent = originalText
        .split("")
        .map((_letter, index) => {
          if (index < iteration) {
            return originalText[index];
          }
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        })
        .join("");

      if (iteration >= originalText.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 40);
  };

  const handleLogoMouseEnter = () => {
    if (logoRef.current) {
      logoRef.current.style.textShadow = `
        3px 0 var(--accent-red),
        -3px 0 var(--accent-blue),
        0 0 30px var(--accent),
        0 0 60px var(--accent)
      `;
      glitchText(logoRef.current, originalLogoText);
    }
  };

  const handleLogoMouseLeave = () => {
    if (logoRef.current) {
      logoRef.current.style.textShadow = "none";
      logoRef.current.textContent = originalLogoText;
    }
  };

  useEffect(() => {
    // Create particles periodically
    const createParticle = () => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";

      const colors = [
        "var(--accent)",
        "var(--accent-red)",
        "var(--accent-blue)",
        "var(--accent-purple)",
      ];
      particle.style.background =
        colors[Math.floor(Math.random() * colors.length)];

      const size = Math.random() * 6 + 2;
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.animationDuration = Math.random() * 15 + 10 + "s";
      particle.style.animationDelay = Math.random() * 5 + "s";

      document.body.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 25000);
    };

    const particleInterval = setInterval(createParticle, 4000);

    return () => {
      clearInterval(particleInterval);
    };
  }, []);

  return (
    <>
      <div className="grid-background"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>

      <header>
        <nav className="container">
          <Link
            to="/"
            className="logo"
            ref={logoRef}
            onMouseEnter={handleLogoMouseEnter}
            onMouseLeave={handleLogoMouseLeave}
          >
            KXHL
          </Link>
          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
            <li>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/projects" onClick={() => setMobileMenuOpen(false)}>
                Projects
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="container">
          <p>© 2025 Kings Cross Hack Lab — Every Wednesday</p>
        </div>
      </footer>
    </>
  );
}

// Home Page Component
function HomePage() {
  const [counters, setCounters] = useState({
    builders: 0,
    products: 0,
    sessions: 0,
    mrr: 0,
  });

  useEffect(() => {
    const targets = {
      builders: 47,
      products: 8,
      sessions: 9,
      mrr: 0,
    };

    const duration = 2000;
    const steps = 100;
    const stepDuration = duration / steps;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;

      setCounters({
        builders: Math.floor(targets.builders * progress),
        products: Math.floor(targets.products * progress),
        sessions: Math.floor(targets.sessions * progress),
        mrr: Math.floor(targets.mrr * progress),
      });

      if (step >= steps) {
        clearInterval(interval);
        setCounters(targets);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Kings Cross
                <br />
                Hack Lab
              </h1>
              <p>
                A weekly builders collective. Founders, developers, designers
                ship together. Join a squad, start your own, or contribute to
                existing projects. Wednesday nights. Real products. Real
                accountability.
              </p>
              <a
                href="https://chat.whatsapp.com/IXipZBiXJSULQqLpfwVhCl?mode=wwt"
                className="cta-button"
              >
                <span>Join the Lab</span>
                <span>→</span>
              </a>
            </div>

            <div className="terminal">
              <div className="terminal-header">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-green"></div>
              </div>
              <div className="terminal-body">
                <div className="terminal-line">
                  <span className="prompt">$</span>
                  <span className="command"> npm run ship</span>
                </div>
                <div className="terminal-line output">
                  → Leaderboard updated: #7 → #3
                </div>
                <div className="terminal-line">
                  <span className="prompt">$</span>
                  <span className="command"> git push origin mvp</span>
                </div>
                <div className="terminal-line output">
                  → Viewers: 47 | Success odds: 78%
                </div>
                <div className="terminal-line">
                  <span className="prompt">$</span>
                  <span className="command"> ./launch --wednesday</span>
                </div>
                <div className="terminal-line output">
                  → Status: SHIPPING
                  <span className="cursor"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Ship or Get Shipped</h2>
            <p>
              Public accountability. Live building. All disciplines welcome.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📺</div>
              <h3>Live Sessions</h3>
              <p>
                Build in public every Wednesday. Stream your progress. Get
                real-time feedback.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Leaderboard</h3>
              <p>
                Track metrics that matter. MRR, users, growth. Compete openly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Accountability</h3>
              <p>
                Weekly goals. Public tracking. Miss targets? Face the community.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Internships</h3>
              <p>
                No idea yet? Contribute to others while finding your direction.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Launch Pipeline</h3>
              <p>
                Idea to PMF. Structured path combining tech, design, and growth.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Prediction Market</h3>
              <p>
                Trade on milestones. Public odds track progress. Skin in the
                game.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats" id="stats">
        <div className="container">
          <div className="section-header">
            <h2>Live Metrics</h2>
            <p>Real builders. Real numbers. Updated every Wednesday.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{counters.builders}</span>
              <span className="stat-label">Builders</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{counters.products}</span>
              <span className="stat-label">Launched</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{counters.sessions}</span>
              <span className="stat-label">Sessions</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">${counters.mrr}K</span>
              <span className="stat-label">Combined MRR</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Projects data
const projects = [
  {
    id: "hameem",
    name: "Hameem",
    description: "Resolve - A conflict resolution platform for teams",
    tags: ["Web", "Collaboration", "Communication"],
  },
  {
    id: "makemore",
    name: "Makemore",
    description:
      "Character-level language model for generating names using neural networks",
    tags: ["AI", "Machine Learning", "NLP"],
  },
  {
    id: "tinyworlds",
    name: "TinyWorlds",
    description:
      "World model for video games - generate game frames using deep learning",
    tags: ["AI", "Gaming", "Computer Vision"],
  },
];

// Projects Page Component
function ProjectsPage() {
  return (
    <section className="projects-page">
      <div className="container">
        <div className="section-header">
          <h2>Projects</h2>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="project-card"
            >
              <h3>{project.name}</h3>
              <div className="project-tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="project-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Project Detail Component
function ProjectDetailPage() {
  const { projectId } = projectDetailRoute.useParams();
  const project = projects.find((p) => p.id === projectId);

  // Use dedicated page for makemore
  if (projectId === "makemore") {
    return <MakemorePage />;
  }

  if (!project) {
    return (
      <section className="project-detail">
        <div className="container">
          <Link to="/projects" className="back-link">
            ← Back to Projects
          </Link>
          <div className="section-header">
            <h2>Project Not Found</h2>
            <p>The project you're looking for doesn't exist.</p>
          </div>
        </div>
      </section>
    );
  }

  // Project-specific content
  const projectContent: Record<string, React.ReactNode> = {
    hameem: (
      <div className="project-content">
        <p>Conflict resolution platform for teams.</p>
      </div>
    ),
    makemore: (
      <div className="project-content">
        <p>Character-level language model for generating names.</p>
      </div>
    ),
    tinyworlds: (
      <div className="project-content">
        <p>World model for video game frame generation.</p>
      </div>
    ),
  };

  return (
    <section className="project-detail">
      <div className="container">
        <Link to="/projects" className="back-link">
          ←
        </Link>
        <div className="project-header">
          <h1>{project.name}</h1>
        </div>
        {projectContent[projectId]}
      </div>
    </section>
  );
}

// Create Routes
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  component: ProjectDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  projectsRoute,
  projectDetailRoute,
]);

const router = createRouter({ routeTree });

// Type registration for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return <RouterProvider router={router} />;
}

export default App;
