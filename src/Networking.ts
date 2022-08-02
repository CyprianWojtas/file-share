// @ts-check

import Connection, { dataType } from "./Connection.js";
import EventObject from "./EventObject.js";
import { generateId, generateName } from "./Utils.js";

import * as PeerJS from "peerjs";

export
const APP_NAME = "FileShare v0.0.1";

if (!location.hash)
	location.hash = generateId(12, 36);

let peer = null;
let peerId = `fileShare_${ location.hash.substring(1) }`;

function getPeer(): Promise<PeerJS.Peer>
{
	return new Promise(ret =>
	{
		if (peer?.open)
			ret(peer);
		
		// @ts-ignore
		peer = new Peer(peerId);
		
		peer.on("open", () =>
		{
			ret(peer);
		});
		peer.on("error", async err =>
		{
			if (err.type == "unavailable-id")
			{
				peerId = null;
				ret(await getPeer());
			}
			else
				console.error("Connection error:", err);
		});
	});
}


type Events =
[
	[ event: "connectionNew", callback: (conn: Connection) => void ],
	[ event: "connectionClosed", callback: () => void ],
	[ event: "usernameUpdate", callback: (userName: string) => void ]
];

export default
class Networking extends EventObject<Events>
{
	peer: PeerJS.Peer = null;
	connections: {[key: string]: Connection} = {};

	private _userName: string;

	constructor(id: string)
	{
		super();

		this.userName = generateName();

		this.connect(id);
	}

	get userName() { return this._userName; }

	set userName(newName)
	{
		this._userName = newName;
		this._fireEvent("usernameUpdate", newName);

		for (const connId in this.connections)
			this.connections[connId].sendData("username", newName);
	}

	async connect(id: string): Promise<Connection | null>
	{
		if (!this.peer?.open)
		{
			this.peer = await getPeer();
			this._bindEvents();
		}

		if (this.peer.id != id)
		{
			let dataConnection = this.peer.connect(id, { metadata: { app: APP_NAME }, reliable : true, serialization: "json" });
			return this.handleNewConnection(dataConnection);
		}

		return null;
	}

	private _bindEvents()
	{
		this.peer.on("connection", dataConnection => this.handleNewConnection(dataConnection));
	}

	handleNewConnection(dataConnection: PeerJS.DataConnection): Promise<Connection>
	{
		return new Promise(ret =>
		{
			dataConnection.on("open", () =>
			{
				const connId = dataConnection.peer;
				
				let connection = this.connections[connId];

				if (dataConnection.metadata?.app != APP_NAME)
				{
					dataConnection.close();
					return ret(connection);
				}

				if (connection)
				{
					connection.bindDataConnection(dataConnection);
					return ret(connection);
				}

				connection = new Connection(dataConnection, this);

				if (this.connections[connId])
					return ret(connection);


				this.connections[connId] = connection;
				this._fireEvent("connectionNew", connection);

				connection.on("disconnected", () =>
				{
					this._fireEvent("connectionClosed", connection);
					delete this.connections[dataConnection.peer];
				});

				ret(connection);
			});
		});
	}

	async sendData(dataType: dataType, data: any)
	{
		for (const connId in this.connections)
			this.connections[connId].sendData(dataType, data);
	}
}
