import elevenLabsLogo from "../assets/sponsors/elevenlabs-logo-white.svg";
import renderLogo from "../assets/sponsors/render-logo-white.svg";

/**
 * Homepage sponsors. To add one: drop the official logo into
 * src/assets/sponsors/ and append an entry here.
 *
 * The page background is dark, so use the official light/white wordmark.
 * Leave the SVG as published — do not recolor, crop, or redraw it.
 */
export type Sponsor = {
  id: string;
  name: string;
  url: string;
  logo: string;
  /** Intrinsic pixel size of the SVG, used so the image keeps its ratio. */
  width: number;
  height: number;
  /** On-page width in px. Height follows the artwork. */
  logoWidth: number;
  /** One line on what this sponsor is supporting. */
  support: string;
};

export const sponsors: Sponsor[] = [
  {
    id: "render",
    name: "Render",
    url: "https://render.com",
    logo: renderLogo,
    width: 2909,
    height: 1200,
    logoWidth: 200,
    support: "Deploy credits · 16, 23 & 30 Oct 2026",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    url: "https://elevenlabs.io",
    logo: elevenLabsLogo,
    width: 694,
    height: 90,
    logoWidth: 220,
    support: "23 Oct 2026 · API credits & project award",
  },
];
