import { useMemo } from "react";
import { Connection } from "../../../hooks/useConnectionMatrix";

const randomColor = ["#FF6633", "#FFB399", "#FF33FF", "#FFFF99", "#00B3E6"];

export function Cursor({ connection }: { connection: Connection }) {
	const color = useMemo(() => {
		return randomColor[Math.floor(Math.random() * randomColor.length)];
	}, []);

	return (
		<div
			className="absolute"
			style={{
				top: `${connection.pointer?.y - 12}px`,
				left: `${connection.pointer?.x - 12}px`,

				transition: "all 0.2s ease-out",
			}}
		>
			<div
				style={{
					width: "20px",
					height: "20px",
					borderRadius: "50%",
					border: "12px solid black",
					borderColor: `transparent transparent ${color} transparent`,
					transform: "rotate(-45deg)",
				}}
			/>

			<div
				style={{
					position: "absolute",
					top: "18px",
					left: "18px",
					backgroundColor: color,
					borderRadius: "200px",
					color: "black",
					padding: "2px 8px",
				}}
			>
				{connection.username === connection.uuid
					? connection.uuid.slice(0, 5)
					: connection.username}
			</div>
		</div>
	);
}
