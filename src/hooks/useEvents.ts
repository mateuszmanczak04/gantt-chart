import { set } from 'date-fns';
import { useState } from 'react';

export type Event = {
	id: number;
	name: string;
	start: Date;
	end: Date;
	color: string;
};

export const useEvents = () => {
	const [events, setEvents] = useState<Event[]>([
		{
			id: 1,
			name: 'The most important event',
			start: set(new Date(0), {
				year: 2024,
				month: 10,
				date: 12,
				hours: 10,
				minutes: 0,
				seconds: 0,
				milliseconds: 0,
			}),
			end: set(new Date(0), {
				year: 2024,
				month: 10,
				date: 16,
				hours: 15,
				minutes: 0,
				seconds: 0,
				milliseconds: 0,
			}),
			color: 'blue',
		},
		{
			id: 2,
			name: 'Second event',
			start: set(new Date(0), {
				year: 2024,
				month: 10,
				date: 10,
				hours: 18,
				minutes: 0,
				seconds: 0,
				milliseconds: 0,
			}),
			end: set(new Date(0), {
				year: 2024,
				month: 10,
				date: 13,
				hours: 0,
				minutes: 0,
				seconds: 0,
				milliseconds: 0,
			}),
			color: 'green',
		},
		{
			id: 3,
			name: 'Do some programming',
			start: set(new Date(0), {
				year: 2024,
				month: 10,
				date: 16,
				hours: 6,
				minutes: 0,
				seconds: 0,
				milliseconds: 0,
			}),
			end: set(new Date(0), {
				year: 2024,
				month: 10,
				date: 17,
				hours: 22,
				minutes: 0,
				seconds: 0,
				milliseconds: 0,
			}),
			color: 'orange',
		},
	]);

	const updateEvent = ({ id, start, end }: { id: number; start: Date; end: Date }) => {
		setEvents((prev) =>
			prev.map((event) => {
				if (event.id === id) {
					return { ...event, start, end };
				}
				return event;
			}),
		);
	};

	const getEvent = (id: number) => {
		return events.find((event) => event.id === id);
	};

	return { events, updateEvent, getEvent };
};
