// Root layout — locale routing is handled by middleware + app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
