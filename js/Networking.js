// @ts-check
import Connection from "./Connection.js";
import EventObject from "./EventObject.js";
import { generateId, generateName } from "./Utils.js";
export const APP_NAME = "FileShare v0.0.1";
if (!location.hash)
    location.hash = generateId(12, 36);
let peer = null;
let peerId = `fileShare_${location.hash.substring(1)}`;
function getPeer() {
    return new Promise(ret => {
        if (peer === null || peer === void 0 ? void 0 : peer.open)
            ret(peer);
        // @ts-ignore
        peer = new Peer(peerId);
        peer.on("open", () => {
            ret(peer);
        });
        peer.on("error", async (err) => {
            if (err.type == "unavailable-id") {
                peerId = null;
                ret(await getPeer());
            }
            else
                console.error("Connection error:", err);
        });
    });
}
export default class Networking extends EventObject {
    constructor(id) {
        super();
        this.peer = null;
        this.connections = {};
        this.userName = generateName();
        this.connect(id);
    }
    get userName() { return this._userName; }
    set userName(newName) {
        this._userName = newName;
        this._fireEvent("usernameUpdate", newName);
        for (const connId in this.connections)
            this.connections[connId].sendData("username", newName);
    }
    async connect(id) {
        var _a;
        if (!((_a = this.peer) === null || _a === void 0 ? void 0 : _a.open)) {
            this.peer = await getPeer();
            this._bindEvents();
        }
        if (this.peer.id != id) {
            let dataConnection = this.peer.connect(id, { metadata: { app: APP_NAME }, reliable: true, serialization: "json" });
            return this.handleNewConnection(dataConnection);
        }
        return null;
    }
    _bindEvents() {
        this.peer.on("connection", dataConnection => this.handleNewConnection(dataConnection));
    }
    handleNewConnection(dataConnection) {
        return new Promise(ret => {
            dataConnection.on("open", () => {
                var _a;
                const connId = dataConnection.peer;
                let connection = this.connections[connId];
                if (((_a = dataConnection.metadata) === null || _a === void 0 ? void 0 : _a.app) != APP_NAME) {
                    dataConnection.close();
                    return ret(connection);
                }
                if (connection) {
                    connection.bindDataConnection(dataConnection);
                    return ret(connection);
                }
                connection = new Connection(dataConnection, this);
                if (this.connections[connId])
                    return ret(connection);
                this.connections[connId] = connection;
                this._fireEvent("connectionNew", connection);
                connection.on("disconnected", () => {
                    this._fireEvent("connectionClosed", connection);
                    delete this.connections[dataConnection.peer];
                });
                ret(connection);
            });
        });
    }
    async sendData(dataType, data) {
        for (const connId in this.connections)
            this.connections[connId].sendData(dataType, data);
    }
}
