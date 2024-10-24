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
import {
	lobbyDrawController,
	lobbyNavigateController,
} from "../../../contexts/mqttControllersDictonary";

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
		if (!mqtt.isConnected) {
			return;
		}

		const cleanUpNavigateController = lobbyNavigateController.addHandler(
			(topicParameters, message) => {
				if (message === "lobby") {
					toast({
						title: "The session has ended",
					});

					navigate({ to: "/$lobbyId", params: { lobbyId } });
				}
			},
		);

		return () => {
			cleanUpNavigateController();
		};
	}, [mqtt.isConnected]);

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

					lobbyDrawController.sendMessage(mqtt, {
						params: { lobbyId, userId: mqtt.uuid },
						payload: event.getSaveData(),
					});

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
