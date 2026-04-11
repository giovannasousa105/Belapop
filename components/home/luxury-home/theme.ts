import { Noto_Serif } from "next/font/google";

export const headlineFont = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap"
});
