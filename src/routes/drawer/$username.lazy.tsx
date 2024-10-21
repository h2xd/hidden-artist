import { createLazyFileRoute, useParams } from "@tanstack/react-router";

import CanvasDraw from "react-canvas-draw";
import { useMqttClient } from "@/contexts/mqtt";
import { Card } from "@/components/ui/card";

export const Route = createLazyFileRoute("/drawer/$username")({
	component: DrawerPage,
});

function DrawerPage() {
	const mqtt = useMqttClient();
	const { username } = useParams({ from: "/drawer/$username" });

	return (
		<Card className="w-[502px] h-[502px] rounded-none shadow-lg mx-auto mt-8">
			<CanvasDraw
				canvasWidth={500}
				canvasHeight={500}
				gridSizeX={20}
				gridSizeY={20}
				onChange={(event) => {
					console.log("event", event);

					console.log("save data", event.getSaveData());

					mqtt.nextMessage({
						topic: `12345/${username}/draw`,
						payload: event.getSaveData(),
						qos: 0,
					});
				}}
			/>
		</Card>
	);
}
