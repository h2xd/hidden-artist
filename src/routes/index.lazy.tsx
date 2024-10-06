import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
	component: IndexPage,
});

function IndexPage() {
	return <div>Nothing here!</div>;
}
