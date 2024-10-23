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
	encodePayload(payload: string) {
		return payload;
	},
	decodePayload(payload: string) {
		return payload;
	},
};

export const lobbyPingController = createMqttNetworkController<
	"lobby/+lobbyId/ping",
	string
>({
	topicName: "lobby/+lobbyId/ping",
	qos: 2,
	...stringHandlers,
});

export const lobbyPongController = createMqttNetworkController<
	"lobby/+lobbyId/+userId/pong",
	{ username: string }
>({
	topicName: "lobby/+lobbyId/+userId/pong",
	qos: 2,
	encodePayload(payload) {
		return JSON.stringify(payload);
	},
	decodePayload(payload) {
		return JSON.parse(payload);
	},
});
