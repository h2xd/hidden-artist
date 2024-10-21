import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/drawer/")({
	component: () => <div>Hello /drawer/!</div>,
});
