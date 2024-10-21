import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ThemeProvider } from "../components/theme-provider";
import { MqttConnectionProvider } from "../contexts/mqtt";

import { Header } from "../components/compositions/Header/Header";

export const Route = createRootRoute({
	component: RootRoute,
});

function RootRoute() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			{/* <div className="p-2 flex gap-2">
				<Link to="/admin" className="[&.active]:font-bold">
					Admin
				</Link>{" "}
				<Link to="/drawer" className="[&.active]:font-bold">
					Drawer
				</Link>
			</div> */}

			<MqttConnectionProvider>
				<Header />
				<main className="flex flex-col flex-grow h-full mt-8">
					<Outlet />
				</main>
				<TanStackRouterDevtools />
			</MqttConnectionProvider>
		</ThemeProvider>
	);
}
