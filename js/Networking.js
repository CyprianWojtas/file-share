// @ts-check

import Connection from "./Connection.js";
import EventObject from "./EventObject.js";
import { generateName } from "./Utils.js";

export
const APP_NAME = "FileShare v0.0.1";

let peer = null;
let peerId = location.hash ? `fileShare_${ location.hash.substring(1) }` : null;

function getPeer()
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


export default
class Networking extends EventObject
{
	constructor(id)
	{
		super();

		this.peer = null;
		/** @type {{[key: string]: Connection}} */
		this.connections = {};

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

	/**
	 * 
	 * @param {string} id 
	 * @returns {Promise<?Connection>}
	 */
	async connect(id)
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

	/**
	 * @private
	 */
	_bindEvents()
	{
		this.peer.on("connection", dataConnection => this.handleNewConnection(dataConnection));
	}

	handleNewConnection(dataConnection)
	{
		return new Promise(ret =>
		{
			dataConnection.on("open", () =>
			{
				const connId = dataConnection.peer;
				
				let connection = this.connections[connId];
				if (!connection)
					connection = new Connection(dataConnection, this);
				else
					connection.bindDataConnection(dataConnection);

				if (dataConnection.metadata?.app != APP_NAME)
				{
					dataConnection.close();
					return;
				}

				this._fireEvent("consUpdated");

				if (this.connections[connId])
				{
					return ret(connection);
				}

				this.connections[connId] = connection;
				this._fireEvent("newConnection", connection);

				ret(connection);
			});

			dataConnection.on("close", () =>
			{
				const connection = this.connections[dataConnection.peer];
				delete this.connections[dataConnection.peer];
				this._fireEvent("conClosed", connection);
				this._fireEvent("consUpdated");
			});
		});
	}

	async sendData(dataType, data)
	{
		for (const connId in this.connections)
			this.connections[connId].sendData(dataType, data);
	}
	
}