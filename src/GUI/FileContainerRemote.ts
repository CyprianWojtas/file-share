import Connection from "../Connection.js";
import Downloader from "../Downloader.js";
import { createNodeTree } from "../Utils.js";
import DownloadStatus from "./DownloadStatus.js";
import DownloadStatusDirectory from "./DownloadStatusDirectory.js";
import FileContainer from "./FileContainer.js";


export default
class FileContainerRemote
{
	fileContainer: FileContainer;
	element: HTMLElement;

	private _conntection: Connection;
	private _downloader: Downloader;

	constructor(conntection: Connection)
	{
		this._conntection = conntection;
		this._downloader = new Downloader(conntection);

		this.fileContainer = new FileContainer();

		this.element = createNodeTree(
		{
			name: "div", attributes: { class: "localFileContainer" },
			childNodes:
			[
				{
					name: "h1", childNodes: [ `${ this._conntection.userName }'s Files` ]
				},
				this.fileContainer.element
			]
		});
	
		this.fileContainer.on("clickDir", async (directory, e) => this.clickDirectory(directory, e) );
		this.fileContainer.on("clickNavigation", async path => this.fileContainer.directory = await this._conntection.getDirectory(path) );

		this.fileContainer.on("clickFile", file => this.clickFile(file));
	
		this._conntection.on("sharesUpdate", async directory => this.fileContainer.directory = directory );
		this._conntection.on("usernameUpdate", name =>
		{
			this.element.querySelector("h1").innerHTML = "";
			this.element.querySelector("h1").append(`${ name }'s Files`);
		});

		this._conntection.on("disconnected", () => this.element.remove());

		(async () =>
		{
			this.fileContainer.directory = await this._conntection.getShares();
		})();
	}

	async clickFile(file)
	{
		const fileDownload = this._downloader.downloadFile(file.path);
		const downloadStatus = new DownloadStatus(fileDownload);
		document.querySelector("#downloadList")?.append(downloadStatus.element);
	}

	async clickDirectory(directory, e: MouseEvent)
	{
		if (e.ctrlKey)
		{
			const fileDownload = this._downloader.downloadDirectory(directory.path);
	
			const downloadStatus = new DownloadStatusDirectory(fileDownload);
			document.querySelector("#downloadList")?.append(downloadStatus.element);
		}
		else
		{
			this.fileContainer.directory = await this._conntection.getDirectory(directory.path);
		}
	}
}