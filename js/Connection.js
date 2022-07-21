// @ts-check

import EventObject from "./EventObject.js";
import { APP_NAME } from "./Networking.js";
import Shared from "./Shared.js";

/**
 * @typedef {{
 * 		request: string,
 * 		data?: any,
 * 		requestId: number
 * }} Request
 */

export default
class Connection extends EventObject
{
	constructor(dataConnection, network)
	{
		super();

		this.dataConnections = { json: null, binary: null };
		this.network = network;

		this.userName = "";
		this.peer = "";

		this._requestId = 1;
		this._pendingRequests = {};

		this.bindDataConnection(dataConnection);
	}

	bindDataConnection(dataConnection)
	{
		const dataConnectionOpenEvent = async () =>
		{
			this.peer = dataConnection.peer;
			if (dataConnection?.options?.serialization)
				this.dataConnections[dataConnection.options.serialization] = dataConnection;

			if (!this.userName)
			{
				this.userName = String(await this.sendRequest("getUsername"));
				this._fireEvent("usernameUpdate", this.userName);
			}
		};

		dataConnection.on("open", dataConnectionOpenEvent);
		if (dataConnection.open)
			dataConnectionOpenEvent();

		dataConnection.on("close", () =>
		{
			this._fireEvent("close");
		});

		dataConnection.on("data", data =>
		{
			this._onIncomingData(data);
		});

		dataConnection.on("error", err =>
		{
			console.error(this, err);
		});
	}

	requestNewDataConnection(serialization = "binary")
	{
		const newDataConnection = this.network.peer.connect(this.peer, { metadata: { app: APP_NAME }, reliable : true, serialization });
		this.bindDataConnection(newDataConnection);
	}

	async send(data, connType = "json")
	{
		if (!this.dataConnections[connType]?.open)
			this.requestNewDataConnection(connType);
		
		while (!this.dataConnections[connType]?.open)
			await new Promise(ret => setTimeout(ret, 100));
		
		this.dataConnections[connType].send(data);
	}

	/**
	 * Incoming data listener and parser
	 * @private
	 * @param {any} data
	 */
	async _onIncomingData(data)
	{
		if (typeof data != "object")
			return console.warn("Recieved unknown data:", data, "from", this.peer);
		
		if (data?.request && data?.requestId)
		{
			const resp = await this._onRequest(data);
			return this.send({ requestResponse: data.request, requestId: data.requestId, data: resp.data}, resp.connType);
		}
		
		if (data?.requestResponse && data?.requestId)
		{
			if (!this._pendingRequests[data.requestId])
				console.warn("Request does not exists!", data);

			this._pendingRequests[data.requestId]?.(data?.data);
			delete this._pendingRequests[data.requestId];
			return;
		}

		if (data?.dataType)
			return this._onData(data.dataType, data.data);
		
		console.warn("Recieved unknown data:", data, "from", this.peer);
	}


	/**
	 * @param {string} dataType
	 * @param {any} data
	 */
	async sendData(dataType, data)
	{
		await this.send({ dataType, data });
	}
	/**
	 * Parse incoming data
	 * @private
	 * @param {string} dataType
	 * @param {any} data
	 */
	async _onData(dataType, data)
	{
		switch(dataType)
		{
			case "username":
				this.userName = String(data);
				this._fireEvent("usernameUpdate", this.userName);
				break;
			case "sharesUpdate":
				this._fireEvent("sharesUpdate", data);
				break;
			default:
				console.warn("Recievied unknown data type: ", dataType, data);
		}
	}


	async sendRequest(request, data)
	{
		let requestId = this._requestId++;

		await this.send({ request, data, requestId });

		return new Promise(ret =>
		{
			this._pendingRequests[requestId] = ret;
		});
	}
	/**
	 * Parse incoming requests
	 * @private
	 * @param {Request} request 
	 * @returns {Promise<{ data: any, connType: string }>}
	 */
	async _onRequest(request)
	{
		switch (request.request)
		{
			case "ping":     	 return { connType: "json",  data: "Pong!" };
			case "getUsername":  return { connType: "json",  data: this.network.userName };
			case "getShares":	 return { connType: "json",  data: await this._requestGetShares() };
			case "getFile":      return { connType: "json",  data: await this._requestGetFile(request.data?.path) };
			case "getDirectory": return { connType: "json",  data: await this._requestGetDirectory(request.data?.path) };
			case "readFile":     return { connType: "binary", data: await this._requestReadFile(request.data?.path, request.data?.start, request.data?.end) };
			default:
				console.warn(`Got unknown request from ${ this.peer }:`, request);
				return { connType: "json", data: "Unknown request!" };
		}
	}

	// File transfer
	async getShares()
	{
		return this.sendRequest("getShares");
	}

	async _requestGetShares()
	{
		return this._requestGetDirectory([]);
	}

	async getDirectory(path)
	{
		return this.sendRequest("getDirectory", { path });
	}

	async _requestGetDirectory(path)
	{
		return Shared.getDirectory(path);
	}

	async getFile(path)
	{
		return this.sendRequest("getFile", { path });
	}

	async _requestGetFile(path)
	{
		return Shared.getFile(path);
	}

	async readFile(path, start, end)
	{
		return this.sendRequest("readFile", { path, start, end });
	}

	async _requestReadFile(path, start, end)
	{
		return Shared.readFile(path, start, end);
	}
}