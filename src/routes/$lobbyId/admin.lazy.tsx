import { createLazyFileRoute, useParams } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { useMqttClient } from "../../contexts/mqtt";

import { useEffect, useState } from "react";
import CanvasDraw from "react-canvas-draw";
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
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../../components/ui/resizable";
import {
	lobbyNavigateController,
	lobbyPingController,
	startGameController,
} from "../../contexts/mqttControllersDictonary";
import { useToast } from "../../hooks/use-toast";
import { useConnectionMatrix } from "../../hooks/useConnectionMatrix";
import { Cursor } from "../../components/compositions/Cursor/Cursor";

export const Route = createLazyFileRoute("/$lobbyId/admin")({
	component: AdminPage,
});

function AdminPage() {
	const { lobbyId } = useParams({ from: "/$lobbyId/admin" });
	const { toast } = useToast();
	const [sessionRunning, setSessionRunning] = useState(false);

	const mqtt = useMqttClient();

	const [_, setCount] = useState(0);

	const { connections, reset, matrix, columns, setColumns, idsMatrix } =
		useConnectionMatrix({
			update: rerender,
		});

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
					<div className="h-[300px] p-2">
						<h2 className="pb-1 mb-2 border-b font-bold">
							Current Connections{" "}
							<Badge className="text-xs" variant="secondary">
								{connections.current.length}
							</Badge>
						</h2>

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
								<h2 className="pb-1 mb-2 border-b font-bold">Controls</h2>

								<div className="flex flex-col gap-1">
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
															This action cannot be undone. This will
															permanently delete the current drawings.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => {
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

													startGameController.sendMessage(mqtt, {
														params: { lobbyId },
														payload: {
															matrix: idsMatrix,
														},
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
													onClick={() => {
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
							</div>
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel defaultSize={50}>
							<div className="p-2">
								<h2 className="pb-1 mb-2 border-b font-bold">Controls</h2>

								<Label htmlFor="colCount">Column Count</Label>
								<Input
									className="mt-1"
									name="colCount"
									value={columns}
									type="number"
									onChange={(event) => {
										event.preventDefault();
										setColumns(Number(event.target.value));
									}}
								/>
							</div>
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
			</ResizablePanelGroup>

			<h2 className="p-4 mb-2 border-b font-bold">Drawings</h2>

			<div className="mb-24">
				{matrix.map((row) => (
					<div
						key={`row-${row.map((connection) => connection.uuid).join(".")}`}
						className="flex flex-row w-[200px] h-[200px] scale-[0.4] relative
					top-[-40px] left-[-40px]"
					>
						{row.map((connection) => (
							<div className="h-[200px] relative" key={connection.uuid}>
								<CanvasDraw
									canvasWidth={500}
									canvasHeight={500}
									ref={connection.canvas}
									hideGrid
									hideInterface
									backgroundColor="#f5f5f5"
								/>

								<Cursor connection={connection} />
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
