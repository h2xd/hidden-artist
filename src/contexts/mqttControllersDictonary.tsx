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
>(
	// @ts-expect-error - TODO: needs to be fixed
	{
		topicName: "lobby/+lobbyId/navigate",
		qos: 2,
		...stringHandlers,
	},
);

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

export const startGameController = createMqttNetworkController<
	"lobby/+lobbyId/start",
	{ matrix: string[][]; columns: number; prompt: string }
>({
	topicName: "lobby/+lobbyId/start",
	qos: 2,
	...jsonHandlers,
});

export const lobbyCursorController = createMqttNetworkController<
	"lobby/+lobbyId/+userId/cursor",
	{ x: number; y: number }
>({
	topicName: "lobby/+lobbyId/+userId/cursor",
	qos: 1,
	...jsonHandlers,
});

export const lobbyPromptController = createMqttNetworkController<
	"lobby/+lobbyId/prompt",
	string
>({
	topicName: "lobby/+lobbyId/prompt",
	qos: 1,
	...stringHandlers,
});
