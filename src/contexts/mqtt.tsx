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

type MqttClientContextState = {
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
};

export const MqttClientState = {
	ESTABLISHING_CONNECTION: "ESTABLISHING_CONNECTION",
	CONNECTION_IS_ESTABLISHED: "CONNECTION_IS_ESTABLISHED",
	CONNECTION_CLOSED: "CONNECTION_CLOSED",
} as const;

export type MqttClientState =
	(typeof MqttClientState)[keyof typeof MqttClientState];

export type MqttSubscription<T = unknown> = {
	topicName: string;
	qos: MqttQualityOfService;
	handler: (payload: T) => unknown;
};

export type MqttQualityOfService = 0 | 1 | 2;

// TODO: Enforce for now version 4
export type MqttProtocolVersion = 4;

const MQTT_CLIENT_DEFAULT_STATE = {
	connectionState: MqttClientState.CONNECTION_CLOSED,
	isConnected: false,
	isConnecting: false,
	connect: async () => void 0,
	disconnect: async () => void 0,
	addSubscription: async () => void 0,
	removeSubscription: async () => void 0,
	nextMessage: async () => void 0,
} satisfies MqttClientContextState;

const DEFAULT_NEXT_MESSAGE_OPTIONS = {
	qos: 0,
} as const;

export const MqttClientContext = createContext<MqttClientContextState>(
	MQTT_CLIENT_DEFAULT_STATE,
);

export function MqttConnectionProvider({ children }: PropsWithChildren) {
	const mqttClient = useRef<MqttClient | undefined>(undefined);

	const [connectionState, setConnectionState] = useState<
		MqttClientContextState["connectionState"]
	>(MqttClientState.CONNECTION_CLOSED);

	const [topicSubscriptions, setTopicSubscriptions] = useState<
		MqttSubscription[]
	>([]);

	async function connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			setConnectionState(MqttClientState.ESTABLISHING_CONNECTION);

			mqttClient.current = mqtt.connect({
				clientId: "admin-client",
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

			mqttClient.current.on("message", (_topic, _payload, _packet) => {
				console.log(_topic, _payload, _packet);
				// TODO: queue into resolver
			});
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
			const isTopicAlreadySubscribed = topicSubscriptions.some(
				(subscription) => {
					return subscription.topicName === topicSubscription.topicName;
				},
			);

			if (isTopicAlreadySubscribed) {
				return;
			}
			// TODO: add processing for the handler and existing subscription prevent duplicated event handler
			setTopicSubscriptions((previous) => [...previous, topicSubscription]);

			mqttClient.current?.subscribe(topicSubscription.topicName, {
				qos: topicSubscription.qos,
			});
		},
		[topicSubscriptions],
	);

	const removeSubscription = useCallback(
		async (subscriptions: MqttSubscription) => {
			const topicIndex = topicSubscriptions.findIndex(
				(topic) => topic.topicName === subscriptions.topicName,
			);

			if (topicIndex === -1) {
				return;
			}

			const newTopics = [...topicSubscriptions];
			newTopics.splice(topicIndex, 1);

			setTopicSubscriptions(newTopics);
			mqttClient.current?.unsubscribe(subscriptions.topicName);
		},
		[topicSubscriptions],
	);

	function subscribeToAllTopics() {
		for (const topic of topicSubscriptions) {
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
		connectionState,
		connect,
		disconnect,
		isConnected,
		isConnecting,
		addSubscription,
		removeSubscription,
		nextMessage,
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
