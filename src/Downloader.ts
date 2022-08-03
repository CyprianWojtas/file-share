import Connection from "./Connection.js";
import EventObject from "./EventObject.js";
import { DirectoryInfo, FileInfo, FSDirectoryHandle, FSFileHandle } from "./Shared.js";
import { toFileSize } from "./Utils.js";

/** size of chunk of uploaded data */
const CHUNK_SIZE: number = 1048576; // 1 MB

type FileDownloadEvents =
[
	[ event: "fileInfo",           callback: (fileInfo: FileInfo) => void ],
	[ event: "savingNotPermitted", callback: () => void ],
	[ event: "enqueued",           callback: () => void ],
	[ event: "progress",           callback: (progress: { current: number, total: number, speed: number }) => void ],
	[ event: "savingToFile",       callback: () => void ],
	[ event: "finished",           callback: () => void ]
];

export class FileDownload extends EventObject<FileDownloadEvents>
{
	path: string[];
	fileInfo: FileInfo;
	fileHandle: FSFileHandle;
	connection: Connection;
	downloader: Downloader;

	constructor(path: string[], connection: Connection, downloader: Downloader, fileHandle?: FSFileHandle, force: boolean = false)
	{
		super();

		this.path = path;
		this.connection = connection;
		this.downloader = downloader;

		this.fileHandle = fileHandle;

		this.download(force);
	}

	private async download(force: boolean)
	{
		this.fileInfo = await this.connection.getFile(this.path);
		this._fireEvent("fileInfo", this.fileInfo);

		if (!this.fileHandle)
		{
			try
			{
				// @ts-ignore
				this.fileHandle = await showSaveFilePicker({ suggestedName: this.fileInfo.name });
			}
			catch(err)
			{
				if (err instanceof DOMException)
					return this._fireEvent("savingNotPermitted");
				else
					throw(err);
			}
		}

		if (force)
		{
			await FileDownload._downloadEnqueued(this);
			return;
		}

		this.downloader.queue.push(this);

		if (this.downloader.downloading)
		{
			this._fireEvent("enqueued");
			return;
		}
		
		while (this.downloader.queue.length)
		{
			const toDownload = this.downloader.queue.shift();
			
			if (!toDownload)
				return;

			this.downloader.downloading = true;
			
			if (toDownload instanceof FileDownload)
				await FileDownload._downloadEnqueued(toDownload);
			else
				await DirectoryDownload._downloadEnqueued(toDownload);
			
			this.downloader.downloading = false;
		}
	}

	/* Download one of previusly enqueued files */
	static async _downloadEnqueued(fileToDownload: FileDownload)
	{
		let progress = 0;

		// @ts-ignore
		const fileWritable = await fileToDownload.fileHandle.createWritable();

		let writtingStatus: Promise<any> | null = null;

		let time = Date.now();
		let speed = 0;

		while (progress < fileToDownload.fileInfo.size)
		{
			let newTime = Date.now();
			if (newTime != time)
				speed = CHUNK_SIZE / (newTime - time) * 1000;
			time = newTime;

			fileToDownload.connection.sendData("statusUpdate",
			{
				text: `${ fileToDownload.fileInfo.name } — ${ (progress / fileToDownload.fileInfo.size * 100 ).toFixed(2) }% (${ toFileSize(speed) }/s)`,
				title: `${ toFileSize(progress) }/${ toFileSize(fileToDownload.fileInfo.size) }`,
				progress: progress / fileToDownload.fileInfo.size
			});

			fileToDownload._fireEvent("progress", { current: progress, total: fileToDownload.fileInfo.size, speed });

			let data = await fileToDownload.connection.readFile(fileToDownload.path, progress, progress + CHUNK_SIZE);
			progress += CHUNK_SIZE;

			await writtingStatus;
			writtingStatus = fileWritable.write(data);
		}

		fileToDownload.connection.sendData("statusUpdate", { text: `${ fileToDownload.fileInfo.name } — Saving...`, title: "", progress: 1 });
		fileToDownload._fireEvent("savingToFile");
		
		await fileWritable.close();

		fileToDownload.connection.sendData("statusUpdate", { text: "", title: "" });
		fileToDownload._fireEvent("finished");
	}
}


type DirectoryDownloadEvents =
[
	[ event: "directoryInfo",      callback: (directoryInfo: DirectoryInfo) => void ],
	[ event: "fileInfo",           callback: (fileInfo: FileInfo) => void ],
	[ event: "savingNotPermitted", callback: () => void ],
	[ event: "enqueued",           callback: () => void ],
	[ event: "progress",           callback: (progress: { current: number, total: number, fileCurrent: number, fileTotal: number, speed: number }) => void ],
	[ event: "savingToFile",       callback: () => void ],
	[ event: "finished",           callback: () => void ]
];

export class DirectoryDownload extends EventObject<DirectoryDownloadEvents>
{
	path: string[];
	directoryInfo: DirectoryInfo;
	directoryHandle: FSDirectoryHandle;

	fileQueue: [ FileInfo, FSFileHandle ][] = [];
	fileCount: number = 0;
	fileTotalSize: number = 0;
	fileDownloadedSize: number = 0;

	connection: Connection;
	downloader: Downloader;

	constructor(path: string[], connection: Connection, downloader: Downloader)
	{
		super();

		this.path = path;
		this.connection = connection;
		this.downloader = downloader;

		this.download();
	}

	private async download()
	{
		this.directoryInfo = await this.connection.getDirectory(this.path);
		this._fireEvent("directoryInfo", this.directoryInfo);

		try
		{
			// @ts-ignore
			this.directoryHandle = await showDirectoryPicker({ mode: "readwrite" });
			this.directoryHandle = await this.directoryHandle.getDirectoryHandle(this.directoryInfo.name, { create: true });
		}
		catch(err)
		{
			if (err instanceof DOMException)
				return this._fireEvent("savingNotPermitted");
			else
				throw(err);
		}

		this.downloader.queue.push(this);

		if (this.downloader.downloading)
		{
			this._fireEvent("enqueued");
			return;
		}
		
		while (this.downloader.queue.length)
		{
			const toDownload = this.downloader.queue.shift();
			
			if (!toDownload)
				return;

			this.downloader.downloading = true;
			if (toDownload instanceof DirectoryDownload)
				await DirectoryDownload._downloadEnqueued(toDownload);
			else
				await FileDownload._downloadEnqueued(toDownload);
			this.downloader.downloading = false;
		}
	}

	/* Download one of previusly enqueued files */
	static async _downloadEnqueued(directoryToDownload: DirectoryDownload)
	{
		const connection = directoryToDownload.connection;
		const downloader = directoryToDownload.downloader;

		// Creating directory tree
		const parseTree = async (dirHandle: FSDirectoryHandle, dirInfo: DirectoryInfo) =>
		{
			for (const directory of dirInfo.directories || [])
			{
				const subdirHandle = await dirHandle.getDirectoryHandle(directory.name, { create: true });
				const subdirInfo: DirectoryInfo = await connection.getDirectory(directory.path);
				parseTree(subdirHandle, subdirInfo);
			}

			for (const fileInfo of dirInfo.files || [])
			{
				const fileHandle = await dirHandle.getFileHandle(fileInfo.name, { create: true });
				directoryToDownload.fileQueue.push([fileInfo, fileHandle]);
				directoryToDownload.fileCount++;
				directoryToDownload.fileTotalSize += fileInfo.size;
			}
		}

		await parseTree(directoryToDownload.directoryHandle, directoryToDownload.directoryInfo);

		while(directoryToDownload.fileQueue.length)
			await new Promise<void>(ret =>
			{
				const [ fileInfo, fileHandle ] = directoryToDownload.fileQueue.shift();

				const fileDownload = new FileDownload(fileInfo.path, connection, downloader, fileHandle, true);

				
				fileDownload.on("fileInfo", info => directoryToDownload._fireEvent("fileInfo", info));
				fileDownload.on("progress", progress =>
				{
					directoryToDownload._fireEvent("progress",
					{
						current: directoryToDownload.fileDownloadedSize + progress.current,
						total: directoryToDownload.fileTotalSize,
						fileCurrent: progress.current,
						fileTotal: progress.total,
						speed: progress.speed
					});
				});
				fileDownload.on("savingToFile", () => directoryToDownload._fireEvent("savingToFile"));
				fileDownload.on("finished", () =>
				{
					directoryToDownload.fileDownloadedSize += fileInfo.size;

					// console.log(`Downloaded ${fileInfo.name}! ${ (directoryToDownload.fileDownloadedSize / directoryToDownload.fileTotalSize * 100).toFixed(2) }%`);
					ret();
				});			
			});

		console.log("Directory downloaded!");
		directoryToDownload._fireEvent("finished");
	}
}


export default
class Downloader
{
	connection: Connection;

	queue: (FileDownload | DirectoryDownload)[] = [];
	downloading: boolean;

	constructor(connection: Connection)
	{
		this.connection = connection;
	}

	downloadFile(path: string[]): FileDownload
	{
		return new FileDownload(path, this.connection, this);
	}

	downloadDirectory(path: string[]): DirectoryDownload
	{
		return new DirectoryDownload(path, this.connection, this);
	}
}