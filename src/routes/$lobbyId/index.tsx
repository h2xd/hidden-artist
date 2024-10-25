import { createFileRoute, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

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
	lobbyCursorController,
	lobbyDrawController,
	lobbyNavigateController,
	lobbyPingController,
	lobbyPongController,
	startGameController,
} from "../../contexts/mqttControllersDictonary";
import { useConnectionMatrix } from "../../hooks/useConnectionMatrix";
// import { Cursor } from "../../components/compositions/Cursor/Cursor";

export const Route = createFileRoute("/$lobbyId/")({
	component: LobbyPage,
});

const MOUSE_MOVE_THRESHOLD = 20;

function LobbyPage() {
	const { lobbyId } = useParams({ from: "/$lobbyId/" });

	const mqtt = useMqttClient();
	const { toast } = useToast();
	const [activeView, setActiveView] = useState<"lobby" | "drawer">("lobby");
	const mouseMoveCount = useRef(0);

	const usernameRef = useRef("");
	const [username, setUsername] = useState("");

	const [_, setCount] = useState(0);

	const rerender = useCallback(() => {
		setCount((count) => count + 1);
	}, []);

	const { connections, reset, setIdsMatrix, neighbors } = useConnectionMatrix({
		update: rerender,
	});

	useEffect(() => {
		usernameRef.current = username;
	}, [username]);

	useEffect(() => {
		if (!mqtt.isConnected) {
			return;
		}

		const cleanUpLobbyPingController = lobbyPingController.addHandler(() => {
			if (activeView === "drawer") return;
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

		const cleanUpStartGameController = startGameController.addHandler(
			(_, { matrix }) => {
				setActiveView("drawer");

				console.log("start game", matrix);

				setIdsMatrix(matrix);
			},
		);

		const cleanUpDrawController = lobbyDrawController.addHandler(
			({ userId }, payload) => {
				if (userId === mqtt.uuid) {
					return;
				}

				const neighbor = Object.values(neighbors).find((neighbor) => {
					if (!neighbor) return;

					return neighbor.uuid === userId;
				});

				if (!neighbor) {
					return;
				}

				neighbor.canvas?.current?.loadSaveData(payload);
			},
		);

		mqtt.addMqttNetworkController(lobbyPingController);
		// @ts-expect-error - TODO: needs to be fixed
		mqtt.addMqttNetworkController(lobbyNavigateController);
		// @ts-expect-error - TODO: needs to be fixed
		mqtt.addMqttNetworkController(startGameController);
		mqtt.addMqttNetworkController(lobbyDrawController);

		lobbyPingController.sendMessage(mqtt, {
			params: { lobbyId },
			payload: "",
		});

		return () => {
			cleanUpLobbyPingController();
			cleanUpNavigateController();
			cleanUpStartGameController();
			cleanUpDrawController();
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
			{neighbors.top && (
				<div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-150%] opacity-80">
					<CanvasDraw
						canvasWidth={500}
						canvasHeight={500}
						gridSizeX={20}
						gridSizeY={20}
						hideInterface
						ref={neighbors.top.canvas}
					/>

					{/* <Cursor connection={neighbors.top} /> */}
				</div>
			)}

			{neighbors.bottom && (
				<div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[50%] opacity-80">
					<CanvasDraw
						canvasWidth={500}
						canvasHeight={500}
						gridSizeX={20}
						gridSizeY={20}
						hideInterface
						ref={neighbors.bottom.canvas}
					/>

					{/* <Cursor connection={neighbors.bottom} /> */}
				</div>
			)}

			{neighbors.left && (
				<div className="fixed top-[50%] left-[50%] translate-x-[-150%] translate-y-[-50%] opacity-80">
					<CanvasDraw
						canvasWidth={500}
						canvasHeight={500}
						gridSizeX={20}
						gridSizeY={20}
						hideInterface
						ref={neighbors.left.canvas}
					/>

					{/* <Cursor connection={neighbors.left} /> */}
				</div>
			)}

			{neighbors.right && (
				<div className="fixed top-[50%] left-[50%] translate-x-[50%] translate-y-[-50%] opacity-80">
					<CanvasDraw
						canvasWidth={500}
						canvasHeight={500}
						gridSizeX={20}
						gridSizeY={20}
						hideInterface
						ref={neighbors.right.canvas}
					/>

					{/* <Cursor connection={neighbors.right} /> */}
				</div>
			)}

			<Card
				className="w-[502px] h-[502px] rounded-none fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] shadow-none"
				onMouseMove={(event) => {
					mouseMoveCount.current += 1;

					if (mouseMoveCount.current % MOUSE_MOVE_THRESHOLD === 0) {
						const rect = event.currentTarget.getBoundingClientRect();

						lobbyCursorController.sendMessage(mqtt, {
							params: { lobbyId, userId: mqtt.uuid },
							payload: {
								x: event.clientX - rect.x,
								y: event.clientY - rect.y,
							},
						});
					}
				}}
			>
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
