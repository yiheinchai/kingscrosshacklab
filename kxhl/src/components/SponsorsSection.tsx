import { sponsors } from "../data/sponsors";

export default function SponsorsSection() {
  return (
    <section
      id="sponsors"
      className="sponsors-section"
      aria-labelledby="sponsors-heading"
    >
      <div className="container">
        <h2 id="sponsors-heading" className="sponsors-heading">
          Supported by
        </h2>
        <ul className="sponsors-list">
          {sponsors.map((sponsor) => (
            <li key={sponsor.id}>
              <a
                className="sponsor-card"
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span
                  className={`sponsor-logo-frame sponsor-logo-frame--${sponsor.id}`}
                >
                  <img
                    className="sponsor-logo"
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={sponsor.width}
                    height={sponsor.height}
                    style={{ width: sponsor.logoWidth }}
                  />
                </span>
                <span className="sponsor-support">{sponsor.support}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
