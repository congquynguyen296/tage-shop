// Ambient type declarations for stylesheet imports (CSS, SCSS, SASS)
// Image module types (*.png, *.jpg, *.jpeg, *.webp, *.svg) are provided by next/image-types/global in next-env.d.ts

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.sass" {
  const content: { [className: string]: string };
  export default content;
}
