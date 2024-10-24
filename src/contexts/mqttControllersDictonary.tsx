import { createMqttNetworkController } from "./mqtt";

const stringHandlers = {
	encodePayload(payload: string) {
		return payload;
	},
	decodePayload(payload: string) {
		return payload;
	},
};

const jsonHandlers = {
	encodePayload(payload: object) {
		return JSON.stringify(payload);
	},
	decodePayload(payload: string) {
		return JSON.parse(payload);
	},
};

export const lobbyPingController = createMqttNetworkController<
	"lobby/+lobbyId/ping",
	string
>({
	topicName: "lobby/+lobbyId/ping",
	qos: 1,
	...stringHandlers,
});

export const lobbyNavigateController = createMqttNetworkController<
	"lobby/+lobbyId/navigate",
	"lobby" | "drawer"
>({
	topicName: "lobby/+lobbyId/navigate",
	qos: 2,
	...stringHandlers,
});

export const lobbyPongController = createMqttNetworkController<
	"lobby/+lobbyId/+userId/pong",
	{ username: string }
>({
	topicName: "lobby/+lobbyId/+userId/pong",
	qos: 1,
	...jsonHandlers,
});

export const lobbyDrawController = createMqttNetworkController<
	"lobby/+lobbyId/+userId/draw",
	string
>({
	topicName: "lobby/+lobbyId/+userId/draw",
	qos: 1,
	...stringHandlers,
});
