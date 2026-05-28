type Props = {
  name: string;
  imageSrc?: string;
  imageAlt?: string;
  size?: number;
};

const gradients = [
  "linear-gradient(135deg, #F5D0A9, #C9956A)",
  "linear-gradient(135deg, #D4E4FF, #7BA7FF)",
  "linear-gradient(135deg, #D1FAE5, #34D399)",
  "linear-gradient(135deg, #FDE8FF, #C084FC)",
  "linear-gradient(135deg, #FEF3C7, #FBBF24)",
  "linear-gradient(135deg, #FFE4E6, #F87171)"
];

function gradientIndex(name: string) {
  return Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
}

export function SellerAvatar({ name, size = 48 }: Props) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl font-semibold text-[rgba(26,23,20,0.70)]"
      style={{
        width: size,
        height: size,
        background: gradients[gradientIndex(name)],
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: size * 0.33
      }}
    >
      {initials}
    </div>
  );
}
