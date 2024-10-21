import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { useMqttClient } from "../contexts/mqtt";

import CanvasDraw from "react-canvas-draw";
import { useEffect, useRef } from "react";

export const Route = createLazyFileRoute("/admin")({
	component: AdminPage,
});

function AdminPage() {
	const { nextMessage } = useMqttClient();
	const canvas1 = useRef<CanvasDraw>();
	const canvas2 = useRef<CanvasDraw>();

	const mqtt = useMqttClient();

	useEffect(() => {
		mqtt.addSubscription<Uint8Array>({
			topicName: "12345/+/draw",
			qos: 0,
			handler(topic, message) {
				console.log("message", message);

				const saveData = new TextDecoder().decode(message);

				console.log("image", saveData);

				console.log("topic", topic);

				if (topic === "12345/1/draw") {
					canvas1.current?.clear();
					canvas1.current?.loadSaveData(saveData, true);
				}

				if (topic === "12345/2/draw") {
					canvas2.current?.clear();
					canvas2.current?.loadSaveData(saveData, true);
				}
			},
		});
	}, [mqtt.addSubscription]);

	return (
		<div>
			<h1>Admin Page</h1>

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

			<div className="flex flex-row">
				<CanvasDraw ref={canvas1} />
				<CanvasDraw ref={canvas2} />
			</div>
		</div>
	);
}
