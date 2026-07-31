/* mammoth ships types for its Node entry point but not for the pre-bundled
   browser build, which is the one we want: it avoids pulling Node polyfills
   into the client bundle. Only the single function we call is declared. */
declare module "mammoth/mammoth.browser.min.js" {
  export function convertToHtml(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<{ value: string; messages: unknown[] }>;
}
