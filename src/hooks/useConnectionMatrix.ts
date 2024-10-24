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

	const [matrix, setMatrix] = useState<Connection[][]>([]);
	const [idsMatrix, setIdsMatrix] = useState<string[][]>([]);

	const [columns, setColumns] = useState(1);

	console.log({ idsMatrix });

	function updateMatrix() {
		console.log("updateMatrix");
		const matrix: Connection[][] = [];

		for (let i = 0; i < connections.current.length; i += columns) {
			matrix.push(connections.current.slice(i, i + columns));
		}

		setMatrix(matrix);
		setIdsMatrix(matrix.map((row) => row.map((connection) => connection.uuid)));
	}

	const neighbors = useMemo(() => {
		const selfRow = matrix.findIndex((row) =>
			row.find((connection) => connection.uuid === mqtt.uuid),
		);
		const selfColumn = matrix[selfRow]?.findIndex(
			(connection) => connection.uuid === mqtt.uuid,
		);

		return {
			top: matrix[selfRow - 1]?.[selfColumn]?.uuid,
			right: matrix[selfRow]?.[selfColumn + 1]?.uuid,
			bottom: matrix[selfRow + 1]?.[selfColumn]?.uuid,
			left: matrix[selfRow]?.[selfColumn - 1]?.uuid,
		};
	}, [matrix, mqtt.uuid]);

	console.log(neighbors);

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
		columns,
		setColumns,
		matrix,
		idsMatrix,
		setIdsMatrix,
		neighbors,
	};
}
