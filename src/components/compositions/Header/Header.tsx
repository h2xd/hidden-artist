import { useMqttClient } from "../../../contexts/mqtt";
import { ThemeModeToggle } from "../../theme-mode-toggle";
import { Logo } from "../Logo/Logo";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../../ui/tooltip";

export function Header() {
	const { isConnected } = useMqttClient();

	return (
		<header className="fixed top-2 left-[50%] translate-x-[-50%] shadow-md rounded-md flex flex-row divide-x border border-gray-100 dark:border-gray-700">
			<div className="mr-[1px]">
				<Logo />
			</div>
			<div className="flex px-[1px]">
				<ThemeModeToggle />
			</div>
			<div className="flex px-[1px]">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger className="px-2">
							<span
								className={`inline-block size-3 rounded-full border ${isConnected ? "bg-emerald-500 border-emerald-600" : "bg-red-500 border-red-700"}`}
							/>
						</TooltipTrigger>
						<TooltipContent className="text-xs">
							MQTT Connection: {isConnected ? "Established" : "Disconnected"}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</header>
	);
}
