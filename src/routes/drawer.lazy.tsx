import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/drawer")({
	component: DrawerPage,
});

function DrawerPage() {
	return (
		<div>
			<h1>Drawer Page</h1>
			<p>Drawer content goes here</p>
		</div>
	);
}
