import { createFileRoute } from "@tanstack/react-router";
import { ForgeGame } from "@/components/forge-game";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ForgeGame />;
}
