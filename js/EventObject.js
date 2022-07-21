export default
class EventObject
{
	constructor()
	{
		/** @type {{[name: string]: ((...any: any) => any)[]}} */
		this._eventHandlers = {};
	}

	/**
	 * 
	 * @param {string} event 
	 * @param {(...any: any) => any} callback 
	 */
	 on(event, callback)
	 {
		 if (!this._eventHandlers[event])
			 this._eventHandlers[event] = [];
		 this._eventHandlers[event].push(callback);
	 }
 
	 /**
	  * 
	  * @param {string} event 
	  * @param  {...any} values 
	  * @protected
	  */
	 _fireEvent(event, ...values)
	 {
		 for (const fn of this._eventHandlers[event] || [])
		 {
			 fn(...values);
		 }
	 }
}