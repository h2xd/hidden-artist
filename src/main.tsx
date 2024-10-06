import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { createRouter, RouterProvider } from "@tanstack/react-router";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = window.document.getElementById("root");

if (rootElement && !rootElement?.innerHTML) {
	const root = createRoot(rootElement);

	console.log("render?");

	root.render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
}
