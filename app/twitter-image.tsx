// Re-export the OG image as the Twitter card image
// Note: `runtime` must be declared directly — Next.js cannot pick it up via re-export
export const runtime = "edge";
export { default, alt, size, contentType } from "./opengraph-image";
