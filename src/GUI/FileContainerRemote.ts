import Connection from "../Connection.js";
import Shared from "../Shared.js";
import { createNodeTree } from "../Utils.js";
import { DownloadStatus } from "./DownloadStatus.js";
import FileContainer from "./FileContainer.js";


export default
class FileContainerRemote
{
	fileContainer: FileContainer;
	element: HTMLElement;

	private _conntection: Connection;

	constructor(conntection: Connection)
	{
		this._conntection = conntection;

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
	
		this.fileContainer.on("clickDir", async directory => this.fileContainer.directory = await this._conntection.getDirectory(directory.path) );
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
		const downloadStatus = <DownloadStatus>document.createElement("download-status");
		downloadStatus.fileName = file.name;

		document.querySelector("#downloadList")?.append(downloadStatus);

		// @ts-ignore
		this._conntection.downloadFile(file.path, (...data) => downloadStatus.handleStatusUpdate(...data));
	}
}