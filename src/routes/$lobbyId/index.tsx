import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Connection } from "../../@types/connection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useMqttClient } from "../../contexts/mqtt";
import { useToast } from "../../hooks/use-toast";

import CanvasDraw from "react-canvas-draw";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	lobbyDrawController,
	lobbyNavigateController,
	lobbyPingController,
	lobbyPongController,
} from "../../contexts/mqttControllersDictonary";
import { useConnectionMatrix } from "../../hooks/useConnectionMatrix";

export const Route = createFileRoute("/$lobbyId/")({
	component: LobbyPage,
});

function LobbyPage() {
	const { lobbyId } = useParams({ from: "/$lobbyId/" });

	const mqtt = useMqttClient();
	const { toast } = useToast();
	const [activeView, setActiveView] = useState<"lobby" | "drawer">("lobby");

	const usernameRef = useRef("");
	const [username, setUsername] = useState("");

	const [_, setCount] = useState(0);

	const rerender = useCallback(() => {
		setCount((count) => count + 1);
	}, []);

	const { connections, reset } = useConnectionMatrix({ update: rerender });

	useEffect(() => {
		usernameRef.current = username;
	}, [username]);

	useEffect(() => {
		if (!mqtt.isConnected) {
			return;
		}

		const cleanUpLobbyPingController = lobbyPingController.addHandler(() => {
			reset();

			lobbyPongController.sendMessage(mqtt, {
				params: { lobbyId, userId: mqtt.uuid },
				payload: { username: usernameRef.current || mqtt.uuid },
			});
		});

		const cleanUpNavigateController = lobbyNavigateController.addHandler(
			(_, view) => {
				setActiveView(view);
			},
		);

		mqtt.addMqttNetworkController(lobbyPingController);
		mqtt.addMqttNetworkController(lobbyNavigateController);

		lobbyPingController.sendMessage(mqtt, {
			params: { lobbyId },
			payload: "",
		});

		return () => {
			cleanUpLobbyPingController();
			cleanUpNavigateController();
		};
	}, [mqtt.isConnected]);

	return activeView === "lobby" ? (
		<div className="mx-auto min-w-[500px] mt-16">
			<Card>
				<CardHeader>
					<CardTitle>
						<h1 className="font-black">Lobby 🤝</h1>
					</CardTitle>
					<CardDescription>You will be joining the fun soon!</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(event) => {
							event.preventDefault();

							toast({
								title: "Username has been submitted",
								description: `Hello ${username}! 💍`,
								duration: 2000,
							});

							lobbyPongController.sendMessage(mqtt, {
								params: { lobbyId, userId: mqtt.uuid },
								payload: { username },
							});
						}}
					>
						<Label htmlFor="username">Username</Label>
						<div className="flex flex-row gap-2">
							<Input
								id="username"
								type="text"
								onChange={(event) => {
									event.preventDefault();
									setUsername(event.target.value);
								}}
								value={username}
							/>
							<Button type="submit">Submit</Button>
						</div>
					</form>
				</CardContent>
				<CardContent>
					<h2 className="text-lg font-bold">Participants</h2>

					<ul className="mt-4 flex flex-col divide-y gap-">
						{connections.current.map((connection) => (
							<li
								key={connection.uuid}
								className={`${connection.uuid === mqtt.uuid ? "font-bold" : "text-gray-700 dark:text-gray-300"}`}
							>
								{connection.username || connection.uuid}
								{connection.uuid === mqtt.uuid ? " 👑" : ""}
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</div>
	) : (
		<>
			<Card className="w-[502px] h-[502px] rounded-none shadow-lg mx-auto">
				<CanvasDraw
					canvasWidth={500}
					canvasHeight={500}
					gridSizeX={20}
					gridSizeY={20}
					onChange={(event) => {
						lobbyDrawController.sendMessage(mqtt, {
							params: { lobbyId, userId: mqtt.uuid },
							payload: event.getSaveData(),
						});

						mqtt.nextMessage({
							topic: `lobby/${lobbyId}/${mqtt.uuid}/draw`,
							payload: event.getSaveData(),
							qos: 0,
						});
					}}
				/>
			</Card>
		</>
	);
}
