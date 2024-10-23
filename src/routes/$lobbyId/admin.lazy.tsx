import { createLazyFileRoute, useParams } from "@tanstack/react-router";
import { exec } from "mqtt-pattern";
import { Button } from "../../components/ui/button";
import { MqttSubscription, useMqttClient } from "../../contexts/mqtt";

import {
	MutableRefObject,
	createRef,
	useEffect,
	useRef,
	useState,
} from "react";
import CanvasDraw from "react-canvas-draw";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../../components/ui/resizable";
import { useToast } from "../../hooks/use-toast";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Connection } from "../../@types/connection";
import {
	lobbyPingController,
	lobbyPongController,
} from "../../contexts/mqttControllersDictonary";

export const Route = createLazyFileRoute("/$lobbyId/admin")({
	component: AdminPage,
});

function AdminPage() {
	const { nextMessage } = useMqttClient();

	const { lobbyId } = useParams({ from: "/$lobbyId/admin" });
	const { toast } = useToast();
	const [sessionRunning, setSessionRunning] = useState(false);

	const mqtt = useMqttClient();

	const connections = useRef<Connection[]>([]);
	const [_, setCount] = useState(0);

	function rerender() {
		setCount((count) => count + 1);
	}

	function revalidateConnections(delay = 1000) {
		connections.current = [];
		rerender();

		window.setTimeout(() => {
			lobbyPingController.sendMessage(mqtt, {
				params: { lobbyId },
				payload: "",
			});
		}, delay);
	}

	useEffect(() => {
		const drawSubscription: MqttSubscription = {
			topicName: "lobby/+/+/draw",
			qos: 0,
			handler(topic, saveData) {
				const result = exec("lobby/+lobbyId/+userId/draw", topic);

				if (!result) {
					return;
				}

				const connection = connections.current.find(
					(connection) => connection.uuid === result.userId,
				);

				if (!connection) {
					return;
				}

				connection.canvas?.current?.clear();
				connection.canvas?.current?.loadSaveData(saveData, true);
			},
		};

		mqtt.addSubscription(drawSubscription);

		return () => {
			mqtt.removeSubscription(drawSubscription);
		};
	}, [connections.current]);

	useEffect(() => {
		const cleanupLobbyPongController = lobbyPongController.addHandler(
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

				setCount((count) => count + 1);
			},
		);

		mqtt.addMqttNetworkController(lobbyPongController);

		return () => {
			cleanupLobbyPongController();
		};
	}, []);

	return (
		<div>
			<ResizablePanelGroup direction="horizontal" className="border">
				<ResizablePanel defaultSize={50}>
					<div className="h-[300px]">
						<h2 class="">Current Connections</h2>
						Count: {connections.current.length}
						<ul>
							{connections.current.map((connection) => (
								<li key={connection.uuid}>
									{connection.username || connection.uuid}
								</li>
							))}
						</ul>
					</div>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize={50}>
					<ResizablePanelGroup direction="vertical">
						<ResizablePanel defaultSize={50}>
							<div className="p-2">
								<h2 className="mb-2 border-b font-bold">Controls</h2>

								<div className="flex flex-row gap-1">
									{sessionRunning ? (
										<AlertDialog key="stop-session">
											<AlertDialogTrigger asChild>
												<Button variant="default">Stop Session</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Are you absolutely sure?
													</AlertDialogTitle>
													<AlertDialogDescription>
														This action cannot be undone. This will permanently
														delete the current drawings.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={(event) => {
															nextMessage({
																topic: `lobby/${lobbyId}/navigate`,
																payload: "lobby",
																qos: 2,
															});

															toast({
																title: "Session stopped",
																description: "The session has been stopped",
															});

															setSessionRunning(false);

															revalidateConnections();
														}}
													>
														Continue
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									) : (
										<Button
											variant="default"
											onClick={(event) => {
												event.preventDefault();

												nextMessage({
													topic: `lobby/${lobbyId}/navigate`,
													payload: "drawer",
													qos: 2,
												});

												toast({
													title: `Revalidation request sent for ${lobbyId}`,
													description: "The session has started",
												});

												setSessionRunning(true);
											}}
										>
											Start Session
										</Button>
									)}
									<Button
										variant="secondary"
										onClick={(event) => {
											event.preventDefault();

											revalidateConnections(0);

											toast({
												title: `Revalidation request sent for ${lobbyId}`,
												description:
													"The server will revalidate the connection",
											});
										}}
									>
										Revalidate
									</Button>
								</div>

								<AlertDialog key="enforce-restart">
									<AlertDialogTrigger asChild>
										<Button variant="destructive">Enforce Restart</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Are you absolutely sure?
											</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently
												delete the current drawings.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction
												onClick={(event) => {
													nextMessage({
														topic: `lobby/${lobbyId}/navigate`,
														payload: "lobby",
														qos: 2,
													});

													toast({
														title: "Session stopped",
														description: "The session has been stopped",
													});

													setSessionRunning(false);

													revalidateConnections();
												}}
											>
												Continue
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel defaultSize={50}></ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
			</ResizablePanelGroup>

			<div className="flex flex-row">
				hello
				<div className="scale-50">
					{connections.current.map((connection) => (
						<CanvasDraw
							canvasWidth={500}
							canvasHeight={500}
							ref={connection.canvas}
							key={connection.uuid}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
