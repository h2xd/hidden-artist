export function Logo() {
	return (
		<div className="inline-flex flex-row text-2xl font-black gap-1">
			<div className="flex flex-row gap-2 items-center relative">
				<div className="text-gray-900 dark:text-gray-200 leading-4">HDDEN</div>
				<div className="absolute w-[calc(100%-2px)] h-[6px] top-[50%] left-[1px] translate-y-[-50%] bg-purple-500" />
			</div>
			<div className="text-gray-600 dark:text-gray-400">Artist</div>
		</div>
	);
}
