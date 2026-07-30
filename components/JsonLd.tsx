/* Renders a schema.org JSON-LD block into the document.

   Safe despite the dangerouslySetInnerHTML: the input is always a plain object
   we serialise ourselves, and JSON.stringify escapes the only sequence that
   could break out of a <script> tag when the payload contains user data. */
export function JsonLd({ schema }: { schema: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
