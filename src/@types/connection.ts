import { MutableRefObject } from "react";
import CanvasDraw from "react-canvas-draw";

export type Connection = {
	uuid: string;
	username?: string;
	canvas?: MutableRefObject<CanvasDraw | null>;
};
