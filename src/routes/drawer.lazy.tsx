import { createLazyFileRoute } from "@tanstack/react-router";

import CanvasDraw from "react-canvas-draw";
import { useMqttClient } from "../contexts/mqtt";

export const Route = createLazyFileRoute("/drawer")({
	component: DrawerPage,
});

function DrawerPage() {
	const mqtt = useMqttClient();

	return (
		<div>
			<h1>Drawer Page</h1>
			<p>Drawer content goes here</p>

			<CanvasDraw
				onChange={(event) => {
					console.log("event", event);

					console.log("save data", event.getSaveData());

					mqtt.nextMessage({
						topic: "12345/username/draw",
						payload: event.getSaveData(),
						qos: 0,
					});
				}}
			/>
		</div>
	);
}
