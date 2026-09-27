import Image from "next/image";
import * as sprites from "@/lib/domain/signature-pokemon";

// An archetype shown by its Signature Pokémon, in place of its name. The slot
// is always two sprites wide, so a column of them lines up whether the deck
// has one Pokémon, two, or the Substitute. The name is the label, read aloud
// once and shown on hover.
export function SignaturePokemon({
  name,
  signaturePokemon,
}: {
  name: string | null;
  signaturePokemon: string[] | null;
}) {
  const label = name ?? "Unknown archetype";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex w-12 shrink-0 items-center"
    >
      {sprites.listSpriteUrls(signaturePokemon).map((url, index) => (
        <Image
          // Two of the same Pokémon would share a URL.
          key={index}
          src={url}
          alt=""
          width={33}
          height={33}
          // Sprites are a few hundred bytes of pixel art; resizing only blurs.
          unoptimized
          className="pixelated size-6 object-contain"
        />
      ))}
    </span>
  );
}
