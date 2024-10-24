import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { MqttSubscription, useMqttClient } from "../../contexts/mqtt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";
import { Connection } from "../../@types/connection";

import {
	lobbyNavigateController,
	lobbyPingController,
	lobbyPongController,
} from "../../contexts/mqttControllersDictonary";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";

export const Route = createFileRoute("/$lobbyId/")({
	component: LobbyPage,
});

function LobbyPage() {
	const { lobbyId } = useParams({ from: "/$lobbyId/" });
	const navigate = useNavigate({ from: "/$lobbyId" });
	const mqtt = useMqttClient();
	const { toast } = useToast();

	const usernameRef = useRef("");
	const [username, setUsername] = useState("");

	const connections = useRef<Connection[]>([]);
	const [_, setCount] = useState(0);

	const rerender = useCallback(() => {
		setCount((count) => count + 1);
	}, []);

	useEffect(() => {
		usernameRef.current = username;
	}, [username]);

	useEffect(() => {
		const lobbyNavigateSubscription: MqttSubscription = {
			topicName: `lobby/${lobbyId}/navigate`,
			qos: 2,
			handler(topic, message) {
				switch (message) {
					case "drawer": {
						navigate({ to: "/$lobbyId/drawer", params: { lobbyId } });

						break;
					}
				}
			},
		};

		mqtt.addSubscription(lobbyNavigateSubscription);

		return () => {
			mqtt.removeSubscription(lobbyNavigateSubscription);
		};
	}, [lobbyId]);

	useEffect(() => {
		if (!mqtt.isConnected) {
			return;
		}

		function sendPong() {
			connections.current = [];
			rerender();

			lobbyPongController.sendMessage(mqtt, {
				params: { lobbyId, userId: mqtt.uuid },
				payload: { username: usernameRef.current || mqtt.uuid },
			});
		}

		const cleanUpLobbyPingController = lobbyPingController.addHandler(() => {
			sendPong();
		});

		const cleanUpPongController = lobbyPongController.addHandler(
			(topicParameters, payload) => {
				const connectionExists = connections.current.find(
					(connection) => connection.uuid === topicParameters.userId,
				);

				if (!connectionExists) {
					connections.current = [
						...connections.current,
						{ uuid: topicParameters.userId, username: payload.username },
					];
				}

				connections.current = connections.current.map((connection) => {
					if (connection.uuid !== topicParameters.userId) {
						return connection;
					}

					return {
						...connection,
						username: payload.username,
					};
				});

				rerender();
			},
		);

		const cleanUpNavigateController = lobbyNavigateController.addHandler(
			(topicParameters, message) => {
				if (message === "lobby") {
					navigate({ to: "/$lobbyId", params: { lobbyId } });
				}
			},
		);

		mqtt.addMqttNetworkController(lobbyPingController);
		mqtt.addMqttNetworkController(lobbyPongController);
		mqtt.addMqttNetworkController(lobbyNavigateController);

		lobbyPingController.sendMessage(mqtt, {
			params: { lobbyId },
			payload: "",
		});

		return () => {
			cleanUpLobbyPingController();
			cleanUpPongController();
			cleanUpNavigateController();
		};
	}, [mqtt.isConnected]);

	return (
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
	);
}
