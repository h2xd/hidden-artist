import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { useMqttClient } from "../contexts/mqtt";

export const Route = createLazyFileRoute("/admin")({
	component: AdminPage,
});

function AdminPage() {
	const { isConnected, nextMessage } = useMqttClient();

	return (
		<div>
			<h1>Admin Page</h1>
			<p>
				MQTT connection status: {isConnected ? "Connected" : "Disconnected"}
			</p>

			<Button
				variant="destructive"
				onClick={() => {
					nextMessage({
						topic: "test",
						payload: "Hello, World!",
						qos: 0,
					});
				}}
			>
				Click me
			</Button>
		</div>
	);
}
