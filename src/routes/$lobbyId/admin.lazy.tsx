import { createLazyFileRoute, useParams } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { useMqttClient } from "../../contexts/mqtt";

import { createRef, useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { Connection } from "../../@types/connection";
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
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../../components/ui/resizable";
import {
	lobbyDrawController,
	lobbyNavigateController,
	lobbyPingController,
	lobbyPongController,
} from "../../contexts/mqttControllersDictonary";
import { useToast } from "../../hooks/use-toast";
import { useConnectionMatrix } from "../../hooks/useConnectionMatrix";

export const Route = createLazyFileRoute("/$lobbyId/admin")({
	component: AdminPage,
});

function AdminPage() {
	const { nextMessage } = useMqttClient();

	const { lobbyId } = useParams({ from: "/$lobbyId/admin" });
	const { toast } = useToast();
	const [sessionRunning, setSessionRunning] = useState(false);

	const mqtt = useMqttClient();

	const [_, setCount] = useState(0);

	const { connections, reset } = useConnectionMatrix({ update: rerender });

	function rerender() {
		setCount((count) => count + 1);
	}

	function revalidateConnections(delay = 1000) {
		reset();

		window.setTimeout(() => {
			lobbyPingController.sendMessage(mqtt, {
				params: { lobbyId },
				payload: "",
			});
		}, delay);
	}

	useEffect(() => {
		if (!mqtt.isConnected) {
			return;
		}

		revalidateConnections();

		// const interval = window.setInterval(() => {
		// 	if (sessionRunning) return;

		// 	revalidateConnections();
		// }, 10000);

		// return () => {
		// 	window.clearInterval(interval);
		// };
	}, [mqtt.isConnected]);

	return (
		<div className="mt-16">
			<ResizablePanelGroup direction="horizontal" className="border">
				<ResizablePanel defaultSize={50}>
					<div className="h-[300px]">
						<h2>Current Connections</h2>
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

															lobbyNavigateController.sendMessage(mqtt, {
																params: { lobbyId },
																payload: "lobby",
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

												lobbyNavigateController.sendMessage(mqtt, {
													params: { lobbyId },
													payload: "drawer",
												});

												toast({
													title: `Revalidation request sent for ${lobbyId}`,
													description: "The session has started",
													duration: 2000,
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
												duration: 2000,
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
													lobbyNavigateController.sendMessage(mqtt, {
														params: { lobbyId },
														payload: "lobby",
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
						<ResizablePanel defaultSize={50} />
					</ResizablePanelGroup>
				</ResizablePanel>
			</ResizablePanelGroup>

			<div className="flex flex-row">
				<div className="object-scale-down w-[100px] h-[100px] scale-[0.2] relative top-[-40px] left-[-40px]">
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
