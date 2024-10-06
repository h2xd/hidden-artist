import { useState } from "react";
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import "./App.css";
import { Button } from "./components/ui/button";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeModeToggle } from "./components/theme-mode-toggle";

function App() {
	const [count, setCount] = useState(0);

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<ThemeModeToggle />
			<div>
				<Button variant="destructive">Click me</Button>
			</div>
		</ThemeProvider>
	);
}

export default App;
