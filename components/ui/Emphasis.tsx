/**
 * Renders headline copy where *starred* words become the house emphasis:
 * serif italic in burgundy. e.g. "Principals We *Know*". Pass a className
 * (e.g. "text-ivory") for a quieter green emphasis.
 */
export function Emphasis({ text, className = "text-burgundy" }: { text: string; className?: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
          <em key={i} className={className}>
            {part.slice(1, -1)}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}
