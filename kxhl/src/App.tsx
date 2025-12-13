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
import logoImage from "./assets/logo.jpg";

// Root Layout Component
function RootLayout() {
  const logoRef = useRef<HTMLAnchorElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const originalLogoText = "KXHL";
  const expandedLogoText = "Kings Cross Hack Lab";

  const glitchText = (
    element: HTMLElement,
    targetText: string,
    onComplete?: () => void
  ) => {
    const glitchChars = "!<>-_\\/[]{}—=+*^?#@$%&";
    let iteration = 0;

    const interval = setInterval(() => {
      element.textContent = targetText
        .split("")
        .map((_letter, index) => {
          if (index < iteration) {
            return targetText[index];
          }
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        })
        .join("");

      if (iteration >= targetText.length) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }

      iteration += 1;
    }, 20);
  };

  const handleLogoMouseEnter = () => {
    if (logoRef.current) {
      logoRef.current.style.textShadow = `
        3px 0 var(--accent-red),
        -3px 0 var(--accent-blue),
        0 0 30px var(--accent),
        0 0 60px var(--accent)
      `;
      glitchText(logoRef.current, expandedLogoText, () => {
        if (logoRef.current) {
          logoRef.current.style.textShadow = "none";
        }
      });
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
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <header>
        <nav className="container">
          <Link to="/" className="logo-container">
            <img src={logoImage} alt="KXHL Logo" className="logo-image" />
            <span
              className="logo-text"
              ref={logoRef}
              onMouseEnter={handleLogoMouseEnter}
              onMouseLeave={handleLogoMouseLeave}
            >
              KXHL
            </span>
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
              <a href="#philosophy" onClick={() => setMobileMenuOpen(false)}>
                Philosophy
              </a>
            </li>
            <li>
              <a href="#community" onClick={() => setMobileMenuOpen(false)}>
                Community
              </a>
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
          <p>
            © 2025 Kings Cross Hack Lab — Where ideas become real, every
            Wednesday
          </p>
        </div>
      </footer>
    </>
  );
}

// Home Page Component
function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-new">
        <div className="container">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            Kings Cross, London
          </div>

          <h1 className="hero-title">
            Optimize for <span className="gradient-text">Fun.</span>
          </h1>

          <p className="hero-description">
            The Sanctuary for Passion Projects. It doesn't have to be useful. It
            doesn't have to make money. It just has to be yours.
          </p>

          <div className="hero-cta">
            <a
              href="https://chat.whatsapp.com/IXipZBiXJSULQqLpfwVhCl?mode=hqrc"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Start Building
            </a>
            <a href="#philosophy" className="btn-secondary">
              Read the Manifesto
            </a>
          </div>
        </div>

        <svg className="hero-decorative-line" preserveAspectRatio="none">
          <path
            d="M0,50 C300,150 600,-50 1440,100"
            stroke="#D98E73"
            strokeWidth="2"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="philosophy-section">
        <div className="container">
          <div className="philosophy-grid">
            <div className="philosophy-content">
              <h2>
                The Anti-ROI <br />
                <span className="accent-text">Mindset</span>
              </h2>
              <div className="philosophy-text">
                <p className="highlight">
                  The world is obsessed with utility. "How does this scale?"
                  "What's the business model?"
                </p>
                <p className="strong">We don't care.</p>
                <p>
                  The pursuit doesn't have to make money. It doesn't even have
                  to be useful to the world. As long as you are passionate about
                  it, you love what you do, and you find it immensely fun, this
                  is the place to pursue it.
                </p>
                <blockquote>
                  "We prioritize 'doing'. Whether you have a vague interest, a
                  wild idea, or a niche rabbit hole you want to dig into, here
                  is the place to make it happen."
                </blockquote>
              </div>
            </div>

            <div className="philosophy-cards">
              <div className="glass-card">
                <div className="card-icon">⚡</div>
                <h3>Pure Passion</h3>
                <p>
                  Unshackle your creativity from the constraints of capitalism.
                  Build because you must.
                </p>
              </div>
              <div className="glass-card offset">
                <div className="card-icon accent">🐰</div>
                <h3>Rabbit Holes</h3>
                <p>
                  Dive deep into the niche, the obscure, and the wonderfully
                  complex.
                </p>
              </div>
              <div className="glass-card">
                <div className="card-icon accent">🔨</div>
                <h3>Just Build</h3>
                <p>
                  Less talking, more doing. We turn the "someday" projects into
                  "today".
                </p>
              </div>
              <div className="glass-card offset">
                <div className="card-icon">😄</div>
                <h3>Optimize Fun</h3>
                <p>
                  If it's not fun, why are we doing it? Joy is our primary
                  metric.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="community-section">
        <div className="container">
          <div className="section-header">
            <h2>Who belongs here?</h2>
            <p>
              We are a collective of makers. No matter your medium, if you have
              the itch to create, you have a seat at our table.
            </p>
          </div>

          <div className="community-grid">
            <div className="community-card">
              <div className="card-gradient-overlay"></div>
              <div className="card-visual">
                <svg
                  className="visual-svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 10 0 L 0 0 0 10"
                        fill="none"
                        stroke="#D98E73"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>
              <div className="card-content">
                <div className="card-icon-circle">
                  <span>💻</span>
                </div>
                <h3>Builders & Engineers</h3>
                <p>
                  Hardware hackers, software poets, and system architects. If it
                  compiles or solders, bring it here.
                </p>
              </div>
            </div>

            <div className="community-card">
              <div className="card-gradient-overlay"></div>
              <div className="card-visual">
                <svg className="visual-svg" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F2C5B0"
                    strokeWidth="1"
                    fill="none"
                  />
                  <circle
                    cx="30"
                    cy="70"
                    r="20"
                    stroke="#F2C5B0"
                    strokeWidth="1"
                    fill="none"
                  />
                  <circle
                    cx="70"
                    cy="30"
                    r="20"
                    stroke="#F2C5B0"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="card-content">
                <div className="card-icon-circle">
                  <span>🎨</span>
                </div>
                <h3>Artists & Designers</h3>
                <p>
                  Digital artists, sculptors, and UI wizards. We believe form is
                  just as important as function.
                </p>
              </div>
            </div>

            <div className="community-card">
              <div className="card-gradient-overlay"></div>
              <div className="card-visual">
                <svg className="visual-svg" viewBox="0 0 100 100">
                  <path
                    d="M10,90 Q50,10 90,90"
                    fill="none"
                    stroke="#5E3A2F"
                    strokeWidth="2"
                  />
                  <path
                    d="M10,10 Q50,90 90,10"
                    fill="none"
                    stroke="#5E3A2F"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="card-content">
                <div className="card-icon-circle">
                  <span>💡</span>
                </div>
                <h3>Thinkers & Tinkers</h3>
                <p>
                  Got a niche idea? A weird obsession? We help you turn that
                  fleeting thought into reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accountability Section */}
      <section className="accountability-section">
        <div className="container">
          <h2>
            Where ideas go to <span className="italic accent-text">live</span>.
          </h2>
          <p className="subtitle">
            Too many people have an idea and forget about it. We exist to break
            that cycle.
          </p>

          <div className="steps-grid">
            <div className="step">
              <h4>01. Commit</h4>
              <p>
                State your goal. Whether it's building a weird clock or coding a
                game engine. Put it on the board.
              </p>
            </div>
            <div className="step">
              <h4>02. Accountability</h4>
              <p>
                We check in. We push you. Not like a boss, but like a gym buddy
                for your brain.
              </p>
            </div>
            <div className="step">
              <h4>03. Reality</h4>
              <p>
                Walk away with something real. A prototype, a finished piece, a
                story.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="join" className="join-section">
        <div className="container">
          <h2>Ready to dig into your rabbit hole?</h2>

          <p className="join-description">
            Join our WhatsApp community and start building every Wednesday at
            Kings Cross, London.
          </p>

          <a
            href="https://chat.whatsapp.com/IXipZBiXJSULQqLpfwVhCl?mode=hqrc"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient join-button"
          >
            Join WhatsApp Community
          </a>
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
    description:
      "A platform helping teams navigate conflict and communicate better",
    tags: ["Communication", "Teams", "Wellbeing"],
  },
  {
    id: "makemore",
    name: "Makemore",
    description:
      "An exploration of how AI can generate creative names — learning by building",
    tags: ["AI", "Learning", "Creative"],
  },
  {
    id: "tinyworlds",
    name: "TinyWorlds",
    description:
      "Imagining new video game worlds — what if AI could dream up game scenes?",
    tags: ["AI", "Games", "Imagination"],
  },
];

// Projects Page Component
function ProjectsPage() {
  return (
    <section className="projects-page">
      <div className="container">
        <div className="section-header">
          <h2>Our Projects</h2>
          <p>
            Passion projects from our community — built for fun, learning, and
            the joy of creation.
          </p>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="project-card glass-card"
            >
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="project-tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="project-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="project-arrow">→</span>
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
          ← Back to Projects
        </Link>
        <div className="project-header">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
          <div className="project-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="project-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="project-content-wrapper">
          {projectContent[projectId]}
        </div>
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
