import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { MqttConnectionProvider } from "../contexts/mqtt";
import { ThemeProvider } from "../components/theme-provider";
import { ThemeModeToggle } from "../components/theme-mode-toggle";
import { Logo } from "../components/compositions/Logo/Logo";

export const Route = createRootRoute({
	component: RootRoute,
});

function RootRoute() {
	console.log("root route");

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div className="flex flex-col h-dvh">
				<header className="flex flex-row items-center justify-between p-1">
					<div className="flex flex-grow w-[50%]">&nbsp;</div>
					<Logo />
					<div className="flex flex-grow w-[50%] justify-end">
						<ThemeModeToggle />
					</div>
				</header>

				{/* <div className="p-2 flex gap-2">
				<Link to="/admin" className="[&.active]:font-bold">
					Admin
				</Link>{" "}
				<Link to="/drawer" className="[&.active]:font-bold">
					Drawer
				</Link>
			</div> */}

				<MqttConnectionProvider>
					<main className="flex flex-col flex-grow h-full">
						<Outlet />
					</main>
					<TanStackRouterDevtools />
				</MqttConnectionProvider>
			</div>
		</ThemeProvider>
	);
}
