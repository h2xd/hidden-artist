import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";

import CanvasDraw from "react-canvas-draw";
import { useMqttClient } from "@/contexts/mqtt";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { useToast } from "../../../hooks/use-toast";

export const Route = createFileRoute("/$lobbyId/drawer/")({
	component: DrawerPage,
});

function DrawerPage() {
	const mqtt = useMqttClient();
	const { lobbyId } = useParams({
		from: "/$lobbyId/drawer/",
	});
	const navigate = useNavigate({ from: "/$lobbyId/drawer" });
	const { toast } = useToast();

	useEffect(() => {
		mqtt.addSubscription({
			topicName: `lobby/${lobbyId}/navigate`,
			qos: 2,
			handler(topic, message) {
				console.log("topic", topic, message);
				switch (message) {
					case "lobby": {
						navigate({ to: "/$lobbyId", params: { lobbyId } });

						toast({
							title: "Redirecting to lobby",
							description:
								"You are being redirected to the lobby, session was stopped",
						});
						break;
					}
				}
			},
		});
	});

	return (
		<Card className="w-[502px] h-[502px] rounded-none shadow-lg mx-auto">
			<CanvasDraw
				canvasWidth={500}
				canvasHeight={500}
				gridSizeX={20}
				gridSizeY={20}
				onChange={(event) => {
					console.log("event", event);

					console.log("save data", event.getSaveData());

					mqtt.nextMessage({
						topic: `lobby/${lobbyId}/${mqtt.uuid}/draw`,
						payload: event.getSaveData(),
						qos: 0,
					});
				}}
			/>
		</Card>
	);
}
