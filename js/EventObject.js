export default class EventObject {
    constructor() {
        this._eventHandlers = {};
    }
    on(event, callback) {
        if (!this._eventHandlers[event])
            this._eventHandlers[event] = [];
        this._eventHandlers[event].push(callback);
    }
    _fireEvent(event, ...values) {
        for (const callback of this._eventHandlers[event] || []) {
            callback(...values);
        }
    }
}
