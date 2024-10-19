import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { useMqttClient } from "../contexts/mqtt";

import CanvasDraw from "react-canvas-draw";
import { useEffect, useRef } from "react";

export const Route = createLazyFileRoute("/admin")({
	component: AdminPage,
});

function AdminPage() {
	const { isConnected, nextMessage } = useMqttClient();
	const canvas = useRef<CanvasDraw>();

	const mqtt = useMqttClient();

	useEffect(() => {
		mqtt.addSubscription<Uint8Array>({
			topicName: "12345/username/draw",
			qos: 0,
			handler(message) {
				console.log("message", message);

				const saveData = new TextDecoder().decode(message);

				console.log("image", saveData);

				canvas.current?.clear()
				canvas.current?.loadSaveData(saveData, true)
			},
		});
	}, [mqtt.addSubscription]);

	return (
		<div>
			<h1>Admin Page</h1>
			<p>
				MQTT connection status: {isConnected ? "Connected" : "Disconnected"}
			</p>

			<Button
				variant="destructive"
				onClick={() => {
					nextMessage({
						topic: "test",
						payload: "Hello, World!",
						qos: 0,
					});
				}}
			>
				Click me
			</Button>

			<CanvasDraw ref={canvas} />
		</div>
	);
}
