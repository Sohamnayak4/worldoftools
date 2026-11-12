// pdfjs-dist ships its bundler entry without types. It re-exports the
// main build, so it has the same types.
declare module "pdfjs-dist/webpack.mjs" {
  export * from "pdfjs-dist";
}
