/** @module Connection */

import EventObject from "./EventObject.js";
import Networking, { APP_NAME } from "./Networking.js";
import Shared, { DirectoryInfo } from "./Shared.js";

import * as PeerJS from "peerjs";
import { toFileSize } from "./Utils.js";

export type requestType = "ping" | "getUsername" | "getShares" | "getFile" | "getDirectory" | "readFile";
export type dataType    = "username" | "sharesUpdate" | "statusUpdate";

interface Request
{
	/** request name */
	request: requestType;
	/** unique id of the request */
	requestId: number;
	/** data parsed to the request */
	data?: any;
}

export interface Status
{
	text: string;
	title?: string;
	progress?: number;
}

/** size of chunk of uploaded data */
const CHUNK_SIZE: number = 1048576; // 1 MB

type Events =
[
	[ event: "usernameUpdate", callback: (userName: string) => void ],
	[ event: "statusUpdate", callback: (status: Status) => void ],
	[ event: "sharesUpdate", callback: (data: DirectoryInfo) => void ],
	[ event: "close", callback: () => void ],
	[ event: "disconnected", callback: () => void ]
];


/** Class for communication between two users */
class Connection extends EventObject<Events>
{
	dataConnections: { json?: PeerJS.DataConnection, binary?: PeerJS.DataConnection } = {};
	network: Networking;
	userName: string = "";
	peer: string = "";

	status: Status;

	private _requestId: number = 1;
	private _pendingRequests = {};

	// File sending
	private _filePath: string[] = [];
	private _file: File = null;

	// File downloading
	private _downloading: boolean = false;
	private _downloadQueue: any[] = [];
	
	constructor(dataConnection: PeerJS.DataConnection, network: Networking)
	{
		super();
		this.network = network;

		this.status = { text: "", title: "" };

		this.bindDataConnection(dataConnection);
	}

	bindDataConnection(dataConnection: PeerJS.DataConnection)
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
			if (!this.dataConnections.binary?.open && !this.dataConnections.json?.open)
				this._fireEvent("disconnected");
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

	requestNewDataConnection(connType = "binary")
	{
		const newDataConnection = this.network.peer.connect(this.peer, { metadata: { app: APP_NAME }, reliable : true, serialization: connType });
		this.bindDataConnection(newDataConnection);
	}


	//=========================//
	//===== Communitation =====//
	//=========================//

	async send(data: any, connType = "json")
	{
		if (!this.dataConnections[connType]?.open)
			this.requestNewDataConnection(connType);
		
		while (!this.dataConnections[connType]?.open)
			await new Promise(ret => setTimeout(ret, 100));
		
		this.dataConnections[connType].send(data);
	}

	/* Incoming data listener and parser */
	private async _onIncomingData(data: any)
	{
		if (typeof data != "object")
			return console.warn("Recieved unknown data:", data, "from", this.peer);
		
		// Responding to a request
		if (data?.request && data?.requestId)
		{
			const resp = await this._onRequest(data);
			return this.send({ requestResponse: data.request, requestId: data.requestId, data: resp.data}, resp.connType);
		}
		
		// Getting a request response
		if (data?.requestResponse && data?.requestId)
		{
			if (!this._pendingRequests[data.requestId])
				console.warn("Request does not exists!", data);

			this._pendingRequests[data.requestId]?.(data?.data);
			delete this._pendingRequests[data.requestId];
			return;
		}

		// Parsing recieved data
		if (data?.dataType)
			return this._onData(data.dataType, data.data);
		
		console.warn("Recieved unknown data:", data, "from", this.peer);
	}

	async sendData(dataType: dataType, data: any)
	{
		await this.send({ dataType, data });
	}

	/* Parse incoming data */
	private async _onData(dataType: dataType, data: any)
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
			case "statusUpdate":
				this.status.text  = String(data.text);
				this.status.title = String(data.title);
				this.status.progress = parseFloat(data.progress);

				this._fireEvent("statusUpdate", this.status);
				break;
			default:
				console.warn("Recievied unknown data type: ", dataType, data);
		}
	}

	async sendRequest(request: requestType, data?: any): Promise<any>
	{
		let requestId = this._requestId++;

		await this.send({ request, data, requestId });

		return new Promise(ret =>
		{
			this._pendingRequests[requestId] = ret;
		});
	}
	
	/* Parse incoming requests */
	private async _onRequest(request: Request): Promise<{ data: any, connType: string }>
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

	async getDirectory(path: string[])
	{
		return this.sendRequest("getDirectory", { path });
	}

	async _requestGetDirectory(path?: string[])
	{
		return Shared.getDirectory(path);
	}

	async getFile(path: string[])
	{
		return this.sendRequest("getFile", { path });
	}

	async _requestGetFile(path?: string[])
	{
		return Shared.getFile(path);
	}

	async readFile(path: string[], start: number, end: number)
	{
		return this.sendRequest("readFile", { path, start, end });
	}

	async _requestReadFile(path: string[], start = 0, end = 1024)
	{
		if (!this._file || path != this._filePath)
		{
			let file = await Shared.readFile(path);
			if (!file)
				return null;
			
			this._file     = file;
			this._filePath = path;
		}
		
		return this._file.slice(start, end).arrayBuffer();
	}


	//============================//
	//===== File downloading =====//
	//============================//

	async downloadFile(path: string[], callback: (...rest: any[]) => any)
	{
		const fileInfo = await this.getFile(path);
		let fileHandle = null;
		callback?.("fileInfo", fileInfo);
		try
		{
			// @ts-ignore
			fileHandle = await showSaveFilePicker({ suggestedName: fileInfo.name });
		}
		catch(err)
		{
			if (err instanceof DOMException)
				return callback?.("savingNotPermitted");
			else
				throw(err);
		}

		this._downloadQueue.push([ path, callback, fileInfo, fileHandle ]);

		if (this._downloadQueue.length > 1 || this._downloading)
		{
			callback?.("enqueued");
			return;
		}
		
		while (this._downloadQueue.length)
			await this.downloadEnqueuedFile();
	}

	/* Download one of previusly enqueued files */
	private async downloadEnqueuedFile()
	{
		if (this._downloading || !this._downloadQueue.length)
			return;
		
		const [ path, callback, fileInfo, fileHandle ] = this._downloadQueue.shift();
		
		this._downloading = true;

		let progress = 0;

		const fileWritable = await fileHandle.createWritable();

		let writtingStatus: Promise<any> | null = null;

		let time = Date.now();
		let speed = 0;

		while (progress < fileInfo.size)
		{
			let newTime = Date.now();
			if (newTime != time)
				speed = CHUNK_SIZE / (newTime - time) * 1000;
			time = newTime;

			this.sendData("statusUpdate",
			{
				text: `${ fileInfo.name } — ${ (progress / fileInfo.size * 100 ).toFixed(2) }% (${ toFileSize(speed) }/s)`,
				title: `${ toFileSize(progress) }/${ toFileSize(fileInfo.size) }`,
				progress: progress / fileInfo.size
			});

			callback?.("progress", { current: progress, total: fileInfo.size, speed });

			let data = await this.readFile(path, progress, progress + CHUNK_SIZE);
			progress += CHUNK_SIZE;

			await writtingStatus;
			writtingStatus = fileWritable.write(data);
		}

		this.sendData("statusUpdate", { text: `${ fileInfo.name } — Saving...`, title: "", progress: 1 });
		callback?.("savingToFile");
		
		await fileWritable.close();

		this.sendData("statusUpdate", { text: "", title: "" });
		callback?.("finished");

		this._downloading = false;
	}
}

export default Connection;
