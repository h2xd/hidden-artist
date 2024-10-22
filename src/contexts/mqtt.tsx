import mqtt, { type MqttClient } from "mqtt";

import {
	createContext,
	useRef,
	useState,
	useMemo,
	useCallback,
	useContext,
	type PropsWithChildren,
	useEffect,
} from "react";

import { exec, clean, type MqttParameters, matches } from "mqtt-pattern";

import areTopicsMatching from "mqtt-match";

type MqttClientContextState = {
	uuid: string;
	connectionState: MqttClientState;
	// Computed Values
	isConnected: boolean;
	isConnecting: boolean;
	// Actions
	disconnect(): Promise<void>;
	connect(): Promise<void>;
	addSubscription(subscriptions: MqttSubscription): Promise<void>;
	removeSubscription(subscriptions: MqttSubscription): Promise<void>;
	nextMessage(options: {
		topic: string;
		payload: string;
		qos: MqttQualityOfService;
	}): Promise<void>;
	addMqttNetworkController: (controller: MqttNetworkController) => void;
};

export const MqttClientState = {
	ESTABLISHING_CONNECTION: "ESTABLISHING_CONNECTION",
	CONNECTION_IS_ESTABLISHED: "CONNECTION_IS_ESTABLISHED",
	CONNECTION_CLOSED: "CONNECTION_CLOSED",
} as const;

export type MqttClientState =
	(typeof MqttClientState)[keyof typeof MqttClientState];

export type MqttSubscription = {
	topicName: string;
	qos: MqttQualityOfService;
	handler: (topic: string, payload: string) => unknown;
};

export type MqttQualityOfService = 0 | 1 | 2;

// TODO: Enforce for now version 4
export type MqttProtocolVersion = 4;

const MQTT_CLIENT_DEFAULT_STATE = {
	uuid: "",
	connectionState: MqttClientState.CONNECTION_CLOSED,
	isConnected: false,
	isConnecting: false,
	connect: async () => void 0,
	disconnect: async () => void 0,
	addSubscription: async () => void 0,
	removeSubscription: async () => void 0,
	nextMessage: async () => void 0,
	addMqttNetworkController: async () => void 0,
} satisfies MqttClientContextState;

const DEFAULT_NEXT_MESSAGE_OPTIONS = {
	qos: 0,
} as const;

export const MqttClientContext = createContext<MqttClientContextState>(
	MQTT_CLIENT_DEFAULT_STATE,
);

export function MqttConnectionProvider({ children }: PropsWithChildren) {
	const mqttClient = useRef<MqttClient | undefined>(undefined);
	const uuid = useRef(window.crypto.randomUUID());

	const [connectionState, setConnectionState] = useState<
		MqttClientContextState["connectionState"]
	>(MqttClientState.CONNECTION_CLOSED);

	const topicSubscriptions = useRef<MqttSubscription[]>([]);
	const mqttNetworkControllers = useRef<
		MqttNetworkController<string, string>[]
	>([]);

	function addMqttNetworkController(
		controller: MqttNetworkController<string, string>,
	) {
		console.log("add controller", controller, clean(controller.topicName));

		mqttNetworkControllers.current = [
			...mqttNetworkControllers.current,
			controller,
		];

		console.log("has mqtt client", mqttClient.current, mqttNetworkControllers);

		mqttClient.current?.subscribe(clean(controller.topicName), {
			qos: controller.qos,
		});
	}

	const handleSubscriptions = useCallback(
		(topic: string, payload: Uint8Array) => {
			topicSubscriptions.current.map((subscription) => {
				if (areTopicsMatching(subscription.topicName, subscription.topicName)) {
					subscription.handler(topic, new TextDecoder().decode(payload));
				}
			});

			mqttNetworkControllers.current.map((controller) => {
				if (matches(controller.topicName, topic)) {
					controller.handlers.map((handler) => {
						const result = exec(controller.topicName, topic);

						handler(
							result || {},
							controller.decode(new TextDecoder().decode(payload)),
						);
					});
				}
			});
		},
		[topicSubscriptions],
	);

	async function connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			setConnectionState(MqttClientState.ESTABLISHING_CONNECTION);

			mqttClient.current = mqtt.connect({
				clientId: `client-${uuid.current}`,
				host: import.meta.env.VITE_PUBSUB_HOSTNAME,
				protocol: "wss",
				protocolVersion: 4,
				path: "/mqtt",
				resubscribe: false,
				username: import.meta.env.VITE_PUBSUB_USERNAME,
				password: import.meta.env.VITE_PUBSUB_PASSWORD,
				keepalive: 60,
				reconnectPeriod: 0,
				port: 8884,
				clean: true,
			});

			mqttClient.current.on("connect", () => {
				setConnectionState(MqttClientState.CONNECTION_IS_ESTABLISHED);
				subscribeToAllTopics();

				resolve();
			});

			mqttClient.current.on("end", () => {
				setConnectionState(MqttClientState.CONNECTION_CLOSED);

				reject();
			});

			mqttClient.current.on("close", async () => {
				setConnectionState(MqttClientState.CONNECTION_CLOSED);

				reject();
			});

			mqttClient.current?.on("message", handleSubscriptions);
		});
	}

	function disconnect(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!mqttClient.current) {
				reject();
				return;
			}

			mqttClient.current.end(true, () => {
				setConnectionState(MqttClientState.CONNECTION_CLOSED);

				resolve();
			});
		});
	}

	const isConnected = useMemo(
		() => connectionState === MqttClientState.CONNECTION_IS_ESTABLISHED,
		[connectionState],
	);

	const isConnecting = useMemo(
		() => connectionState === MqttClientState.ESTABLISHING_CONNECTION,
		[connectionState],
	);

	const addSubscription = useCallback(
		async (topicSubscription: MqttSubscription) => {
			topicSubscriptions.current = [
				...topicSubscriptions.current,
				topicSubscription,
			];

			mqttClient.current?.subscribe(topicSubscription.topicName, {
				qos: topicSubscription.qos,
			});
		},
		// [handleSubscriptions],
		[],
	);

	const removeSubscription = useCallback(
		async (subscriptions: MqttSubscription) => {
			const topicIndex = topicSubscriptions.current.findIndex(
				(topic) => topic.topicName === subscriptions.topicName,
			);

			if (topicIndex === -1) {
				return;
			}

			const newTopics = [...topicSubscriptions.current];
			newTopics.splice(topicIndex, 1);

			topicSubscriptions.current = newTopics;
			mqttClient.current?.unsubscribe(subscriptions.topicName);
		},
		[topicSubscriptions],
	);

	function subscribeToAllTopics() {
		for (const topic of topicSubscriptions.current) {
			mqttClient.current?.subscribe(topic.topicName, {
				qos: topic.qos,
			});
		}
	}

	async function nextMessage(options: {
		topic: string;
		payload: string;
		qos?: MqttQualityOfService;
	}) {
		if (!mqttClient.current) {
			return;
		}

		const { topic, payload, qos } = {
			...DEFAULT_NEXT_MESSAGE_OPTIONS,
			...options,
		};

		mqttClient.current.publish(topic, payload, { qos });
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: It should be only executed once
	useEffect(() => {
		connect();
	}, []);

	const value = {
		uuid: uuid.current,
		connectionState,
		connect,
		disconnect,
		isConnected,
		isConnecting,
		addSubscription,
		removeSubscription,
		nextMessage,
		addMqttNetworkController,
	} satisfies MqttClientContextState;

	return (
		<MqttClientContext.Provider value={value}>
			{children}
		</MqttClientContext.Provider>
	);
}

export function useMqttClient() {
	const context = useContext(MqttClientContext);

	if (context === undefined)
		throw new Error("useMqttClient must be used within a MqttClientProvider");

	return context;
}

type MqttNetworkConnectionHandler<T, P> = (
	topicParameters: MqttParameters<T>,
	payload: P,
) => void;

export function createMqttNetworkController<T extends string, P>({
	topicName,
	decode,
	encode,
	qos,
}: {
	topicName: T;
	qos: 0 | 1 | 2;
	encode: (payload: P) => string;
	decode: (payload: string) => P;
}) {
	let handlers: MqttNetworkConnectionHandler<T, any>[] = [];

	function addHandler(handler: MqttNetworkConnectionHandler<T, P>) {
		handlers.push(handler);
	}

	function removeHandler(handler: MqttNetworkConnectionHandler<T, P>) {
		handlers = handlers.filter((h) => h !== handler);
	}

	return {
		topicName,
		handlers,
		qos,
		addHandler,
		removeHandler,
		encode,
		decode,
	};
}

type MqttNetworkController<T, P> = ReturnType<
	typeof createMqttNetworkController<T, P>
>;
