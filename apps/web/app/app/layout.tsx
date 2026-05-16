import { Container } from "@/components/Container";
import { Nav } from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper">
      <Nav />
      <Container className="py-10">{children}</Container>
    </main>
  );
}
