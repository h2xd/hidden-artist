import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { MqttConnectionProvider } from "../contexts/mqtt";
import { ThemeProvider } from "../components/theme-provider";
import { ThemeModeToggle } from "../components/theme-mode-toggle";

export const Route = createRootRoute({
	component: RootRoute,
});

function RootRoute() {
	console.log("root route");

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<ThemeModeToggle />
			<MqttConnectionProvider>
				<div className="p-2 flex gap-2">
					<Link to="/admin" className="[&.active]:font-bold">
						Admin
					</Link>{" "}
					<Link to="/drawer" className="[&.active]:font-bold">
						Drawer
					</Link>
				</div>
				<hr />
				<Outlet />
				<TanStackRouterDevtools />
			</MqttConnectionProvider>
		</ThemeProvider>
	);
}
