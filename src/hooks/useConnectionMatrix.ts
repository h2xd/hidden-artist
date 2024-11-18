import {
	MutableRefObject,
	createRef,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import CanvasDraw from "react-canvas-draw";
import { useMqttClient } from "../contexts/mqtt";
import {
	lobbyCursorController,
	lobbyDrawController,
	lobbyPongController,
} from "../contexts/mqttControllersDictonary";

export type Connection = {
	uuid: string;
	username?: string;
	canvas?: MutableRefObject<CanvasDraw | null>;
	pointer?: {
		x: number;
		y: number;
	};
};

type UseConnectionMatrix = {
	update: () => void;
};

export function useConnectionMatrix({ update }: UseConnectionMatrix) {
	const mqtt = useMqttClient();
	const connections = useRef<Connection[]>([]);

	const [matrix, setMatrix] = useState<Connection[][]>([]);
	const [idsMatrix, setIdsMatrix] = useState<string[][]>([]);

	const [columns, setColumns] = useState(1);

	function updateMatrix() {
		const matrix: Connection[][] = [];

		for (let i = 0; i < connections.current.length; i += columns) {
			matrix.push(connections.current.slice(i, i + columns));
		}

		setMatrix(matrix);
		console.log("matrix", matrix);

		setIdsMatrix(matrix.map((row) => row.map((connection) => connection.uuid)));
	}

	function findConnection(uuid: string) {
		if (!uuid) {
			return;
		}

		return connections?.current?.find((connection) => connection.uuid === uuid);
	}

	const neighbors = useMemo(() => {
		const selfRow = idsMatrix.findIndex((row) =>
			row.find((uuid) => uuid === mqtt.uuid),
		);
		const selfColumn = idsMatrix[selfRow]?.findIndex(
			(uuid) => uuid === mqtt.uuid,
		);

		return {
			top: findConnection(idsMatrix[selfRow - 1]?.[selfColumn]),
			right: findConnection(idsMatrix[selfRow]?.[selfColumn + 1]),
			bottom: findConnection(idsMatrix[selfRow + 1]?.[selfColumn]),
			left: findConnection(idsMatrix[selfRow]?.[selfColumn - 1]),
		};
	}, [idsMatrix, mqtt.uuid]);

	useEffect(updateMatrix, [columns, connections.current]);

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

				if (!connection) {
					return;
				}

				connection.canvas?.current?.clear();
				connection.canvas?.current?.loadSaveData(saveData, true);
			},
		);

		const cleanUpPointerController = lobbyCursorController.addHandler(
			({ userId }, payload) => {
				console.log("pointer", userId, payload);
				console.log("connections", connections);

				const connection = connections.current.find(
					(connection) => connection.uuid === userId,
				);

				if (!connection) {
					return;
				}

				connections.current = connections.current.map((connection) => {
					if (connection.uuid !== userId) {
						return connection;
					}

					return {
						...connection,
						pointer: payload,
					};
				});

				update();
			},
		);

		// @ts-expect-error - TODO: needs to be fixed
		mqtt.addMqttNetworkController(lobbyPongController);
		mqtt.addMqttNetworkController(lobbyDrawController);
		// @ts-expect-error - TODO: needs to be fixed
		mqtt.addMqttNetworkController(lobbyCursorController);

		return () => {
			cleanupLobbyPongController();
			cleanUpDrawController();
			cleanUpPointerController();
		};
	}, [mqtt.isConnected]);

	function reset() {
		connections.current = [];
		update();
	}

	return {
		connections,
		reset,
		columns,
		setColumns,
		matrix,
		idsMatrix,
		setIdsMatrix,
		neighbors,
	};
}
