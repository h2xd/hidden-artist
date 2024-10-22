import { createMqttNetworkController } from "./mqtt";

export const lobbyPingController = createMqttNetworkController<
	"lobby/+lobbyid/+uuid/ping",
	{
		username: string;
	}
>({
	topicName: "lobby/+lobbyid/+uuid/ping",
	qos: 2,
	encode(payload) {
		return JSON.stringify(payload);
	},
	decode(payload) {
		return JSON.parse(payload);
	},
});
