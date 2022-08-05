import { FileDownload } from "../Downloader.js";
import { FileInfo } from "../Shared.js";
import { createNodeTree, toFileSize } from "../Utils.js";

export default
class DownloadStatus
{
	element: HTMLElement;

	private _fileDownload: FileDownload;
	private _elHooks:
	{
		fileName: HTMLElement,
		fileSize: HTMLElement,

		progressText: HTMLElement,
		progresBg: HTMLElement,

		speed: HTMLElement,
		size: HTMLElement
	};

	private _name: string;
	private _progress: number | string;
	private _size: number;
	private _speed: number;

	constructor(fileDownload: FileDownload)
	{
		this._fileDownload = fileDownload;

		this.element = createNodeTree(
		{
			name: "div", attributes: { class: "downloadStatus fileDownload" },
			childNodes:
			[
				{ name: "button", attributes: { class: "close" }, listeners: { click: () => this.element.remove() } },
				{ name: "div", attributes: { class: "fileName" }, childNodes: [ " " ] },
				{
					name: "div", attributes: { class: "progressBar" },
					childNodes:
					[
						{ name: "div", attributes: { class: "progressBarBg" } },
						{ name: "span", childNodes: [ "Waiting for download..." ] }
					]
				},
				{
					name: "div", attributes: { class: "footer" },
					childNodes:
					[
						{ name: "div", attributes: { class: "downloadSpeed" }, childNodes: [ "0 B/s" ] },
						{ name: "div", attributes: { class: "totalSize" }, childNodes: [ " " ] }
					]
				}
			]
		});

		this._elHooks =
		{
			fileName: this.element.querySelector(".fileName"),
			fileSize: this.element.querySelector(".fileSize"),
	
			progressText: this.element.querySelector(".progressBar span"),
			progresBg:    this.element.querySelector(".progressBar .progressBarBg"),
	
			speed: this.element.querySelector(".downloadSpeed"),
			size:  this.element.querySelector(".totalSize")
		};

		this.bindEvents();
	}

	set fileName(newValue: string)
	{
		if (this._name == newValue)
			return;

		this._name = newValue;
		this._elHooks.fileName.innerHTML = "";
		this._elHooks.fileName.title = newValue;
		this._elHooks.fileName.append(newValue);
	}

	set progress(newValue: number | string)
	{
		if (this._progress == newValue)
			return;

		this._progress = newValue;
		
		if (typeof newValue == "number")
		{
			this._elHooks.size.innerHTML = "";
			this._elHooks.size.append(`${ toFileSize(newValue) } / ${ toFileSize(this._size) }`);

			this._elHooks.progressText.innerHTML = "";
			this._elHooks.progressText.append(`${ (newValue / this._size * 100).toFixed(2) }%`);
			this._elHooks.progresBg.style.width = `${ newValue / this._size * 100 }%`;
			this._elHooks.progresBg.classList.remove("animation");
		}
		else
		{
			this._elHooks.progressText.innerHTML = "";
			this._elHooks.progresBg.style.width = "100%";

			switch(newValue)
			{
				case "saving":
					this._elHooks.progressText.append("Saving to file...");
					this._elHooks.progresBg.classList.add("animation");
					break;
				case "finished":
					this._elHooks.progressText.append("Finished!");
					this._elHooks.progresBg.classList.remove("animation");
					break;
				default:
					this._elHooks.progressText.append(newValue);
					this._elHooks.progresBg.classList.add("animation");
					break;
			}
		}
	}

	set size(newValue: number)
	{
		if (this._size == newValue)
			return;

		this._size = newValue;
		this._elHooks.size.innerHTML = "";
		if (typeof this._progress == "number")
			this._elHooks.size.append(`${ toFileSize(this._progress) } / ${ toFileSize(this._size) }`);
	}

	set speed(newValue: number)
	{
		if (this._speed == newValue)
			return;

		this._speed = newValue;
		this._elHooks.speed.innerHTML = "";
		this._elHooks.speed.append(`${ toFileSize(newValue) }/s`);
	}

	private bindEvents()
	{
		this._fileDownload.on("fileInfo", (fileInfo: FileInfo) =>
		{
			this.fileName = fileInfo.name;
			this.size = fileInfo.size;
		});

		this._fileDownload.on("savingToFile", () =>
		{
			this.progress = "saving";
		});

		this._fileDownload.on("progress", progress =>
		{
			this.size = progress.total;
			this.progress = progress.current;

			this.speed = progress.speed;
		});

		this._fileDownload.on("finished", () =>
		{
			this.progress = "finished";
		});

		this._fileDownload.on("savingNotPermitted", () => this.element.remove());
	}
}
