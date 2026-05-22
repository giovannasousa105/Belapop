// Injeta JSON-LD no <head> via Next.js.
// Usar em server components para structured data (Product, Breadcrumb, etc.).

interface JsonLdProps {
  schema: object | object[];
}

export function JsonLd({ schema }: JsonLdProps) {
  const schemas = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}
