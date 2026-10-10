import elevenLabsLogo from "../assets/sponsors/elevenlabs-logo-white.svg";
import lovableLogo from "../assets/sponsors/lovable-logo-white.svg";
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
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    url: "https://elevenlabs.io",
    logo: elevenLabsLogo,
    width: 694,
    height: 90,
    logoWidth: 220,
  },
  {
    id: "lovable",
    name: "Lovable",
    url: "https://lovable.dev",
    logo: lovableLogo,
    width: 950,
    height: 173,
    logoWidth: 210,
  },
];
