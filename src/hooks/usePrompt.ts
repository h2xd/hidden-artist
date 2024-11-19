import { useEffect, useState } from "react";
import { useMqttClient } from "../contexts/mqtt";
import { lobbyPromptController } from "../contexts/mqttControllersDictonary";
import { useToast } from "./use-toast";

export function usePrompt({ lobbyId }: { lobbyId: string }) {
	const mqtt = useMqttClient();
	const [prompt, setPrompt] = useState("");
	const { toast } = useToast();

	useEffect(() => {
		if (!mqtt.isConnected) {
			return;
		}

		const cleanUpPromptController = lobbyPromptController.addHandler(
			(_, prompt) => {
				setPrompt(prompt);

				toast({
					title: "New Prompt!",
					description: prompt,
					duration: 4_000,
				});
			},
		);

		mqtt.addMqttNetworkController(lobbyPromptController);

		return () => {
			cleanUpPromptController();
		};
	}, [mqtt.isConnected]);

	function sendPrompt() {
		lobbyPromptController.sendMessage(mqtt, {
			params: { lobbyId },
			payload: prompt,
		});
	}

	return {
		prompt,
		setPrompt,
		sendPrompt,
	};
}
