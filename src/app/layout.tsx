import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Realm Weaver — AI Text Adventure RPG",
  description:
    "A split-screen text-based adventure RPG driven by AI. Choose any universe, create your character, and embark on an epic quest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
