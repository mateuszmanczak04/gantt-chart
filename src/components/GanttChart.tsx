import { addDays, addMinutes, differenceInMinutes, eachDayOfInterval, set } from 'date-fns';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Event, useEvents } from '../hooks/useEvents';

const firstDayInTheView = set(new Date(0), {
	year: 2024,
	month: 10,
	date: 10,
	hours: 0,
	minutes: 0,
	seconds: 0,
	milliseconds: 0,
});

const amountOfDaysToSee = 10;
const gridColWidth = 128; // px
const rowHeight = 64; // px

const GanttChart = () => {
	const { events, updateEvent, getEvent } = useEvents();
	/** Used to calculate relative left offset regarding the container */
	const containerRef = useRef<HTMLDivElement | null>(null);
	/** Time of the first point with onMouseDown event */
	const [firstMouseDownTime, setFirstMouseDownTime] = useState<Date | null>(null);
	/** Currently dragged event */
	const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
	/** Canvas to draw arrows joining events */
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	/** Upcoming month */
	const days: Date[] = eachDayOfInterval({
		start: firstDayInTheView,
		end: addDays(new Date(), amountOfDaysToSee - 1),
	});

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
		const event = getEvent(id);
		if (!event) return;
		const x = e.pageX - (containerRef.current?.getBoundingClientRect().x || 0);
		const mouseTime = addMinutes(firstDayInTheView, (x / gridColWidth) * 24 * 60);
		setFirstMouseDownTime(mouseTime);
		setCurrentEvent(event);
	};

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!currentEvent || !firstMouseDownTime) return;
			const x = e.pageX - (containerRef.current?.getBoundingClientRect().x || 0);
			const mouseTime = addMinutes(firstDayInTheView, (x / gridColWidth) * 24 * 60);
			const difference = differenceInMinutes(mouseTime, firstMouseDownTime);
			const [newStartTime, newEndTime] = [
				addMinutes(currentEvent.start, difference),
				addMinutes(currentEvent.end, difference),
			];
			updateEvent({ id: currentEvent.id, start: newStartTime, end: newEndTime });
		},
		[firstMouseDownTime, currentEvent, updateEvent],
	);

	const handleMouseUp = () => {
		// TODO: Update external state, e.g. database
		setCurrentEvent(null);
		setFirstMouseDownTime(null);
	};

	useEffect(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [handleMouseMove]);

	/** Draw arrows on canvas */
	useEffect(() => {
		const ctx = canvasRef.current?.getContext('2d');
		if (!ctx) return;
		ctx.reset();
		for (let i = 0; i < events.length - 1; i++) {
			const [event1, event2] = [events[i], events[i + 1]];
			const startPosition = {
				x: (differenceInMinutes(event1.end, firstDayInTheView) / (60 * 24)) * gridColWidth,
				y: rowHeight / 2 + i * rowHeight,
			};
			const endPosition = {
				x:
					(differenceInMinutes(event2.start, firstDayInTheView) / (60 * 24)) *
					gridColWidth,
				y: rowHeight / 2 + (i + 1) * rowHeight,
			};
			// 1st case - second event starts before first ends (+1h)
			ctx.beginPath();
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 1;

			// Draw the main path
			ctx.moveTo(startPosition.x, startPosition.y);
			ctx.lineTo(startPosition.x + gridColWidth / 2, startPosition.y);
			ctx.lineTo(startPosition.x + gridColWidth / 2, startPosition.y + rowHeight / 2);
			ctx.lineTo(endPosition.x - gridColWidth / 2, startPosition.y + rowHeight / 2);
			ctx.lineTo(endPosition.x - gridColWidth / 2, endPosition.y);
			ctx.lineTo(endPosition.x, endPosition.y);
			ctx.stroke();

			// Draw the horizontally oriented triangle at the end of the path
			const triangleSize = 10; // Size of the triangle
			ctx.beginPath();
			ctx.moveTo(endPosition.x - triangleSize, endPosition.y - triangleSize / 2); // Start at the end of the line
			ctx.lineTo(endPosition.x, endPosition.y); // Top point of the triangle
			ctx.lineTo(endPosition.x - triangleSize, endPosition.y + triangleSize / 2); // Bottom point of the triangle
			ctx.closePath(); // Close the path to form a triangle
			ctx.fillStyle = 'black';
			ctx.fill();
		}
	}, [events]);

	return (
		<div style={{ width: `${gridColWidth * amountOfDaysToSee}px` }} ref={containerRef}>
			{/* Dates */}
			<div
				className='grid bg-neutral-200'
				style={{
					gridTemplateColumns: `repeat(${amountOfDaysToSee}, 1fr)`,
				}}>
				{days.map((day) => (
					<div
						key={day.toString()}
						className='grid h-16 place-content-center text-sm'
						style={{ width: `${gridColWidth}px` }}>
						{day.toDateString()}
					</div>
				))}
			</div>

			<div className='relative'>
				{/* Events (rows) */}
				{events.map((event) => (
					<div
						key={event.id}
						className={`relative grid overflow-x-hidden border-b bg-neutral-100`}
						style={{
							gridTemplateColumns: `repeat(${amountOfDaysToSee}, 1fr)`,
							width: `${gridColWidth * amountOfDaysToSee}px`,
						}}>
						{/* Background boxes */}
						{days.map((day) => (
							<div
								key={day.toString()}
								className='border-r'
								style={{
									width: `${gridColWidth}px`,
									height: `${rowHeight}px`,
								}}></div>
						))}

						{/* Event itself */}
						<div
							className='absolute top-1/4 flex select-none overflow-hidden rounded-md'
							style={{
								left: `${(differenceInMinutes(event.start, firstDayInTheView) / (60 * 24)) * gridColWidth}px`,
								width: `${(differenceInMinutes(event.end, event.start) / 60 / 24) * gridColWidth}px`,
								height: `${rowHeight * 0.5}px`,
								backgroundColor: event.color,
							}}>
							{/* Left resizer */}
							<div className='h-full w-4 cursor-ew-resize bg-white/25'></div>

							{/* Cener */}
							<div
								className='grid flex-1 cursor-move place-content-center text-sm text-white'
								onMouseDown={(e) => handleMouseDown(e, event.id)}>
								{event.name}
							</div>

							{/* Right resizer */}
							<div className='h-full w-4 cursor-ew-resize bg-white/25'></div>
						</div>
					</div>
				))}
				<canvas
					ref={canvasRef}
					width={amountOfDaysToSee * gridColWidth}
					height={events.length * rowHeight}
					className='pointer-events-none absolute left-0 top-0 z-10 h-full w-full'></canvas>
			</div>
		</div>
	);
};

export default GanttChart;
