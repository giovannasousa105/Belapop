"use client";

type CookiePreferencesButtonProps = {
  label?: string;
  className?: string;
};

export function CookiePreferencesButton({
  label = "Personalizar cookies",
  className
}: CookiePreferencesButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event("belapop:open-cookie-preferences"));
      }}
      className={className}
    >
      {label}
    </button>
  );
}
