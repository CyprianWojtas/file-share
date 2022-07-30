type eventCallback = (...args: any[]) => any;

type EventArray = {
    0: string
	1: (...any) => any
} & Array<any>

type EventList = EventArray[];

export default
abstract class EventObject<Events extends EventList>
{
	private _eventHandlers: { [key: string]: eventCallback[] };

	constructor()
	{
		this._eventHandlers = {};
	}

	on(event: Events[number][0], callback: eventCallback)
	{
		if (!this._eventHandlers[event])
			this._eventHandlers[event] = [];
		this._eventHandlers[event].push(callback);
	}
 
	protected _fireEvent<Ev extends Events[number]>(event: Ev[0], ...values: Parameters<Ev[1]>)
	{
		for (const callback of this._eventHandlers[event] || [])
		{
			callback(...values);
		}
	}
}
