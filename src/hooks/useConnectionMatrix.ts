import { MutableRefObject, createRef, useEffect, useRef } from "react";
import CanvasDraw from "react-canvas-draw";
import { useMqttClient } from "../contexts/mqtt";
import {
	lobbyDrawController,
	lobbyPongController,
} from "../contexts/mqttControllersDictonary";

export type Connection = {
	uuid: string;
	username?: string;
	canvas?: MutableRefObject<CanvasDraw | null>;
};

type UseConnectionMatrix = {
	update: () => void;
};

export function useConnectionMatrix({ update }: UseConnectionMatrix) {
	const mqtt = useMqttClient();
	const connections = useRef<Connection[]>([]);

	useEffect(() => {
		if (!mqtt.isConnected) {
			return;
		}

		const cleanupLobbyPongController = lobbyPongController.addHandler(
			(topicParameters, payload) => {
				const connectionExists = connections.current.find(
					(connection) => connection.uuid === topicParameters.userId,
				);

				if (!connectionExists) {
					connections.current = [
						...connections.current,
						{
							uuid: topicParameters.userId,
							username: payload.username,
							canvas: createRef(),
						},
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

				update();
			},
		);

		const cleanUpDrawController = lobbyDrawController.addHandler(
			({ userId }, saveData) => {
				const connection = connections.current.find(
					(connection) => connection.uuid === userId,
				);

				console.log({ userId, saveData }, connections, connection);

				if (!connection) {
					return;
				}

				connection.canvas?.current?.clear();
				connection.canvas?.current?.loadSaveData(saveData, true);
			},
		);

		mqtt.addMqttNetworkController(lobbyPongController);
		mqtt.addMqttNetworkController(lobbyDrawController);

		return () => {
			cleanupLobbyPongController();
			cleanUpDrawController();
		};
	}, [mqtt.isConnected]);

	function reset() {
		connections.current = [];
		update();
	}

	return {
		connections,
		reset,
	};
}
