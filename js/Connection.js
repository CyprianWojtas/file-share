/** @module Connection */
import EventObject from "./EventObject.js";
import { APP_NAME } from "./Networking.js";
import Shared from "./Shared.js";
/** Class for communication between two users */
class Connection extends EventObject {
    constructor(dataConnection, network) {
        super();
        this.dataConnections = {};
        this.userName = "";
        this.peer = "";
        this._requestId = 1;
        this._pendingRequests = {};
        // File sending
        this._filePath = [];
        this._file = null;
        this.network = network;
        this.status = { text: "", title: "" };
        this.bindDataConnection(dataConnection);
    }
    bindDataConnection(dataConnection) {
        const dataConnectionOpenEvent = async () => {
            var _a;
            this.peer = dataConnection.peer;
            if ((_a = dataConnection === null || dataConnection === void 0 ? void 0 : dataConnection.options) === null || _a === void 0 ? void 0 : _a.serialization)
                this.dataConnections[dataConnection.options.serialization] = dataConnection;
            if (!this.userName) {
                this.userName = String(await this.sendRequest("getUsername"));
                this._fireEvent("usernameUpdate", this.userName);
            }
        };
        dataConnection.on("open", dataConnectionOpenEvent);
        if (dataConnection.open)
            dataConnectionOpenEvent();
        dataConnection.on("close", () => {
            var _a, _b;
            this._fireEvent("close");
            if (!((_a = this.dataConnections.binary) === null || _a === void 0 ? void 0 : _a.open) && !((_b = this.dataConnections.json) === null || _b === void 0 ? void 0 : _b.open))
                this._fireEvent("disconnected");
        });
        dataConnection.on("data", data => {
            this._onIncomingData(data);
        });
        dataConnection.on("error", err => {
            console.error(this, err);
        });
    }
    requestNewDataConnection(connType = "binary") {
        const newDataConnection = this.network.peer.connect(this.peer, { metadata: { app: APP_NAME }, reliable: true, serialization: connType });
        this.bindDataConnection(newDataConnection);
    }
    //=========================//
    //===== Communitation =====//
    //=========================//
    async send(data, connType = "json") {
        var _a, _b;
        if (!((_a = this.dataConnections[connType]) === null || _a === void 0 ? void 0 : _a.open))
            this.requestNewDataConnection(connType);
        while (!((_b = this.dataConnections[connType]) === null || _b === void 0 ? void 0 : _b.open))
            await new Promise(ret => setTimeout(ret, 100));
        this.dataConnections[connType].send(data);
    }
    /* Incoming data listener and parser */
    async _onIncomingData(data) {
        var _a, _b;
        if (typeof data != "object")
            return console.warn("Recieved unknown data:", data, "from", this.peer);
        // Responding to a request
        if ((data === null || data === void 0 ? void 0 : data.request) && (data === null || data === void 0 ? void 0 : data.requestId)) {
            const resp = await this._onRequest(data);
            return this.send({ requestResponse: data.request, requestId: data.requestId, data: resp.data }, resp.connType);
        }
        // Getting a request response
        if ((data === null || data === void 0 ? void 0 : data.requestResponse) && (data === null || data === void 0 ? void 0 : data.requestId)) {
            if (!this._pendingRequests[data.requestId])
                console.warn("Request does not exists!", data);
            (_b = (_a = this._pendingRequests)[data.requestId]) === null || _b === void 0 ? void 0 : _b.call(_a, data === null || data === void 0 ? void 0 : data.data);
            delete this._pendingRequests[data.requestId];
            return;
        }
        // Parsing recieved data
        if (data === null || data === void 0 ? void 0 : data.dataType)
            return this._onData(data.dataType, data.data);
        console.warn("Recieved unknown data:", data, "from", this.peer);
    }
    async sendData(dataType, data) {
        await this.send({ dataType, data });
    }
    /* Parse incoming data */
    async _onData(dataType, data) {
        switch (dataType) {
            case "username":
                this.userName = String(data) || "Unknown";
                this._fireEvent("usernameUpdate", this.userName);
                break;
            case "sharesUpdate":
                this._fireEvent("sharesUpdate", data);
                break;
            case "statusUpdate":
                this.status.text = String(data.text);
                this.status.title = String(data.title);
                this.status.progress = parseFloat(data.progress);
                this._fireEvent("statusUpdate", this.status);
                break;
            default:
                console.warn("Recievied unknown data type: ", dataType, data);
        }
    }
    async sendRequest(request, data) {
        let requestId = this._requestId++;
        await this.send({ request, data, requestId });
        return new Promise(ret => {
            this._pendingRequests[requestId] = ret;
        });
    }
    /* Parse incoming requests */
    async _onRequest(request) {
        var _a, _b, _c, _d, _e;
        switch (request.request) {
            case "ping": return { connType: "json", data: "Pong!" };
            case "getUsername": return { connType: "json", data: this.network.userName };
            case "getShares": return { connType: "json", data: await this._requestGetShares() };
            case "getFile": return { connType: "json", data: await this._requestGetFile((_a = request.data) === null || _a === void 0 ? void 0 : _a.path) };
            case "getDirectory": return { connType: "json", data: await this._requestGetDirectory((_b = request.data) === null || _b === void 0 ? void 0 : _b.path) };
            case "readFile": return { connType: "binary", data: await this._requestReadFile((_c = request.data) === null || _c === void 0 ? void 0 : _c.path, (_d = request.data) === null || _d === void 0 ? void 0 : _d.start, (_e = request.data) === null || _e === void 0 ? void 0 : _e.end) };
            default:
                console.warn(`Got unknown request from ${this.peer}:`, request);
                return { connType: "json", data: "Unknown request!" };
        }
    }
    // File transfer
    async getShares() {
        return this.sendRequest("getShares");
    }
    async _requestGetShares() {
        return this._requestGetDirectory([]);
    }
    async getDirectory(path) {
        return this.sendRequest("getDirectory", { path });
    }
    async _requestGetDirectory(path) {
        return Shared.getDirectory(path);
    }
    async getFile(path) {
        return this.sendRequest("getFile", { path });
    }
    async _requestGetFile(path) {
        return Shared.getFile(path);
    }
    async readFile(path, start, end) {
        return this.sendRequest("readFile", { path, start, end });
    }
    async _requestReadFile(path, start = 0, end = 1024) {
        if (!this._file || path != this._filePath) {
            let file = await Shared.readFile(path);
            if (!file)
                return null;
            this._file = file;
            this._filePath = path;
        }
        return this._file.slice(start, end).arrayBuffer();
    }
}
export default Connection;
