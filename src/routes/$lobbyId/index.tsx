import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { MqttSubscription, useMqttClient } from "../../contexts/mqtt";
import { useCallback, useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";
import { Connection } from "../../@types/connection";
import { exec } from "mqtt-pattern";

export const Route = createFileRoute("/$lobbyId/")({
	component: LobbyPage,
});

function LobbyPage() {
	const { lobbyId } = useParams({ from: "/$lobbyId/" });
	const navigate = useNavigate({ from: "/$lobbyId" });
	const mqtt = useMqttClient();
	const { toast } = useToast();

	const [username, setUsername] = useState("");

	const [currentConnections, setCurrentConnections] = useState<Connection[]>(
		[],
	);

	const sendUsername = useCallback(() => {
		mqtt.nextMessage({
			topic: `lobby/${lobbyId}/${mqtt.uuid}/username`,
			payload: username,
			qos: 2,
		});
	}, [username]);

	useEffect(() => {
		const lobbyPongSubscription: MqttSubscription = {
			topicName: `lobby/${lobbyId}/connection`,
			qos: 2,
			handler(topic, message) {
				console.log("topic", topic, message);
				switch (message) {
					case "ping": {
						setCurrentConnections([]);

						window.setTimeout(() => {
							mqtt.nextMessage({
								topic: `lobby/${lobbyId}/${mqtt.uuid}/connection`,
								payload: "pong",
								qos: 2,
							});
						}, 500);

						window.setTimeout(() => {
							sendUsername();
						}, 500);

						break;
					}
				}
			},
		};

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
		mqtt.addSubscription(lobbyPongSubscription);

		return () => {
			mqtt.nextMessage({
				topic: `lobby/${lobbyId}/${mqtt.uuid}/connect`,
				payload: "disconnect",
				qos: 2,
			});

			mqtt.removeSubscription(lobbyNavigateSubscription);
			mqtt.removeSubscription(lobbyPongSubscription);
		};
	}, [lobbyId]);

	useEffect(() => {
		const connectionSubscription: MqttSubscription = {
			topicName: "lobby/+/+/connection",
			qos: 2,
			handler(topic, message) {
				const result = exec("lobby/+lobbyId/+userId/connection", topic);

				switch (message) {
					case "connect":
					case "pong": {
						if (
							result &&
							currentConnections.every((user) => user.uuid !== result.userId)
						) {
							setCurrentConnections((currentConnections) => [
								...currentConnections,
								{
									uuid: result.userId,
									username: message,
								},
							]);
						}

						break;
					}
					case "disconnect": {
						if (result) {
							setCurrentConnections((currentConnections) =>
								currentConnections.filter(
									(user) => user.uuid !== result.userId,
								),
							);
						}
						break;
					}
				}
			},
		};

		const usernameSubscription: MqttSubscription = {
			topicName: "lobby/+/+/username",
			qos: 2,
			handler(topic, message) {
				const result = exec("lobby/+lobbyId/+userId/username", topic);

				if (!result) {
					return;
				}

				const connection = currentConnections.find(
					(connection) => connection.uuid === result.userId,
				);

				if (!connection) {
					return;
				}

				setCurrentConnections((currentConnections) => {
					return currentConnections.map((user) => {
						if (user.uuid === result.userId) {
							return {
								...user,
								username: message || user.uuid,
							};
						}

						return user;
					});
				});
			},
		};

		mqtt.addSubscription(usernameSubscription);
		mqtt.addSubscription(connectionSubscription);

		return () => {
			mqtt.removeSubscription(usernameSubscription);
			mqtt.removeSubscription(connectionSubscription);
		};
	}, [currentConnections]);

	useEffect(() => {
		mqtt.nextMessage({
			topic: `lobby/${lobbyId}/${mqtt.uuid}/connection`,
			payload: "connect",
			qos: 2,
		});
	}, []);

	return (
		<div className="mx-auto min-w-[500px]">
			<h1 className="font-black">Lobby 🤝</h1>
			<p className="text-gray-600 dark:text-gray-300">
				You will be joining the fun soon!
			</p>

			<form
				className="mt-4"
				onSubmit={(event) => {
					event.preventDefault();

					toast({
						title: "Username has been submitted",
						description: `Hello ${username}! 💍`,
					});

					mqtt.nextMessage({
						topic: `lobby/${lobbyId}/${mqtt.uuid}/username`,
						payload: username,
						qos: 2,
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

			<hr className="mt-8" />

			<div className="mt-4">
				<h2 className="text-lg font-bold">Participants</h2>

				<ul className="mt-4 flex flex-col divide-y gap-">
					{currentConnections.map((connection) => (
						<li
							key={connection.uuid}
							className={`${connection.uuid === mqtt.uuid ? "font-bold" : "text-gray-700 dark:text-gray-300"}`}
						>
							{connection.username || connection.uuid}
							{connection.uuid === mqtt.uuid ? " 👑" : ""}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
