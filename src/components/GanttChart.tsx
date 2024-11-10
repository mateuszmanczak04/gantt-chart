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

const GanttChart = () => {
	const { events, updateEvent, getEvent } = useEvents();
	/** Used to calculate relative left offset regarding the container */
	const containerRef = useRef<HTMLDivElement | null>(null);
	/** Time of the first point with onMouseDown event */
	const [firstMouseDownTime, setFirstMouseDownTime] = useState<Date | null>(null);
	/** Currently dragged event */
	const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

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
			console.table({ difference, newStartTime, newEndTime });
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
						<div key={day.toString()} className='h-16 w-32 border-r'></div>
					))}

					{/* Event itself */}
					<div
						className='absolute top-2 flex h-12 select-none overflow-hidden rounded-md'
						style={{
							left: `${(differenceInMinutes(event.start, firstDayInTheView) / (60 * 24)) * gridColWidth}px`,
							width: `${(differenceInMinutes(event.end, event.start) / 60 / 24) * gridColWidth}px`,
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
		</div>
	);
};

export default GanttChart;
