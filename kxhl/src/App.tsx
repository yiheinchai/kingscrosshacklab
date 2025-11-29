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
  const originalLogoText = "KXHL";

  const glitchText = (element: HTMLElement, originalText: string) => {
    const glitchChars = "!<>-_\\/[]{}—=+*^?#________";
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
    }, 50);
  };

  const handleLogoMouseEnter = () => {
    if (logoRef.current) {
      logoRef.current.style.textShadow = `
        2px 0 var(--accent-red),
        -2px 0 var(--accent-blue),
        0 0 20px var(--accent),
        0 0 40px var(--accent)
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

      particle.style.width = Math.random() * 8 + 2 + "px";
      particle.style.height = particle.style.width;
      particle.style.animationDuration = Math.random() * 4 + 3 + "s";
      particle.style.animationDelay = Math.random() * 2 + "s";

      document.body.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 8000);
    };

    const particleInterval = setInterval(createParticle, 2000);

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
          <ul className="nav-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/projects">Projects</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="container">
          <p>
            &copy; 2025 Kings Cross Hack Lab. Every Wednesday. Ship or get
            shipped.
          </p>
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
      products: 156,
      sessions: 73,
      mrr: 337000,
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
                Weekly live-building sessions where founders, developers,
                designers, marketers, and product people ship together. Join a
                team, start your own, or intern with experienced builders. Every
                Wednesday. No excuses.
              </p>
              <a
                href="https://docs.google.com/document/d/1ex272JUd1d9c7ObC6LBO0F4B6KIyvTGj/edit?usp=sharing&ouid=114141808906371201855&rtpof=true&sd=true"
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
                  <span className="prompt">hacklab@live:~$</span>
                  <span className="command"> npm run build-product</span>
                </div>
                <div className="terminal-line output">
                  📈 Updating leaderboard position... #7 → #3
                </div>
                <div className="terminal-line">
                  <span className="prompt">hacklab@live:~$</span>
                  <span className="command"> git push origin feature/mvp</span>
                </div>
                <div className="terminal-line output">
                  🚀 Live stream viewers: 47 | Prediction market: 78% success
                </div>
                <div className="terminal-line">
                  <span className="prompt">hacklab@live:~$</span>
                  <span className="command"> ./launch.sh --wednesday</span>
                </div>
                <div className="terminal-line output">
                  💰 Revenue goal: $1,337 MRR | Status: SHIPPING
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
              Every Wednesday. Live-built. Publicly tracked. Mutually
              accountable. All roles welcome.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📺</div>
              <h3>Live Build Sessions</h3>
              <p>
                Code, design, and strategize live every Wednesday. Stream your
                progress across all disciplines.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Profitability Leaderboard</h3>
              <p>
                Track MRR, users, and growth metrics. Compete with fellow
                builders. Transparency breeds results.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Accountability System</h3>
              <p>
                Weekly goal setting and progress tracking. Miss your targets?
                Face the community's judgment.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Cross-Team Internships</h3>
              <p>
                No idea? No problem. Contribute to other projects while finding
                your own direction.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Launch Pipeline</h3>
              <p>
                From idea to product-market fit. Structured path combining tech,
                design, and growth expertise.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Prediction Market</h3>
              <p>
                Play-money prediction market where users trade on startup
                milestones. Public odds track progress and reward accurate
                forecasters.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats" id="stats">
        <div className="container">
          <div className="section-header">
            <h2>Live Leaderboard</h2>
            <p>
              Real builders. Real metrics. Real money. Updated every Wednesday.
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">
                {counters.builders.toLocaleString()}
              </span>
              <span className="stat-label">Active Builders</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {counters.products.toLocaleString()}
              </span>
              <span className="stat-label">Products Launched</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {counters.sessions.toLocaleString()}
              </span>
              <span className="stat-label">Live Sessions</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {counters.mrr.toLocaleString()}
              </span>
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
