import EventObject from "../EventObject.js";
import { DirectoryInfo, FileInfo } from "../Shared.js";
import { MIMETYPE_ICONS, MIMETYPE_NAMES } from "../Strings.js";
import { createElement, createNodeTree, toFileSize } from "../Utils.js";


type Events =
[
	[ "clickNavigation", (path: string[]) => any ],
	[ "clickFile", (file: FileInfo) => any ],
	[ "clickDir",  (file: DirectoryInfo) => any ]
];

export default
class FileContainer extends EventObject<Events>
{
	element: HTMLElement;

	private _itemsEl: HTMLElement;
	private _pathEl: HTMLElement;
	private _contents: any;
	private _path: any[];

	constructor(dirContents: { directories?: DirectoryInfo[]; files?: FileInfo[]; } = {}, path: string[] = [])
	{
		super();

		this._itemsEl = createElement("div", { class: "items" });
		this._pathEl  = createElement("div", { class: "path" });

		this.element = createNodeTree(
		{
			name: "div", attributes: { class: "fileContainer" },
			childNodes:
			[
				this._pathEl,
				{
					name: "div", attributes: { class: "fileContainerItems" },
					childNodes:
					[
						{
							name: "div", attributes: { class: "containerHeader" },
							childNodes:
							[
								{ name: "div", attributes: { class: "header" }, childNodes: [ "" ] },
								{ name: "div", attributes: { class: "header" }, childNodes: [ "Name" ] },
								{ name: "div", attributes: { class: "header" }, childNodes: [ "Type" ] },
								{ name: "div", attributes: { class: "header" }, childNodes: [ "Size" ] },
								{ name: "div", attributes: { class: "header" }, childNodes: [ "Modification date" ] }
							]
						},
						this._itemsEl
					]
				}
			]
		});

		this._contents = null;
		this._path = [];
		
		this.path = path;
		this.contents = dirContents;
	}

	get contents() { return this._contents || {}; }

	set contents(dirContents: { directories?: DirectoryInfo[]; files?: FileInfo[]; })
	{
		this._contents = dirContents;
		
		this._itemsEl.innerHTML = "";

		for (const directory of dirContents?.directories || [])
			this._itemsEl.append(this.generateDirElement(directory));

		for (const file of dirContents?.files || [])
			this._itemsEl.append(this.generateFileElement(file));
	}


	get path() { return this._path; }

	set path(newPath)
	{
		this._path = newPath;

		this._pathEl.innerHTML = "";

		const pathHomeEl = createNodeTree(
		{
			name: "button", listeners: { click: () => this._fireEvent("clickNavigation", []) },
			childNodes: [ "Home" ]
		});
		this._pathEl.append(pathHomeEl, "/");

		for (let i = 0; i < newPath.length; i++)
		{
			const pathPartEl = createNodeTree(
			{
				name: "button", listeners: { click: () => this._fireEvent("clickNavigation", newPath.slice(0, i + 1)) },
				childNodes: [ newPath[i] ]
			});
			this._pathEl.append(pathPartEl, "/");
		}
	}

	set directory(newDirectory: DirectoryInfo)
	{
		this.path = newDirectory.path;
		this.contents = { directories: newDirectory.directories, files: newDirectory.files };
	}

	generateFileElement(file: FileInfo)
	{
		const fileEl = createNodeTree(
		{
			name: "label", attributes: { class: "file" },
			childNodes:
			[
				{
					name: "div", attributes: { class: "fileIcon" },
					childNodes: [ { name: "img", attributes: { src: MIMETYPE_ICONS[file.type] || MIMETYPE_ICONS.unknown, alt: "" } } ]
				},
				{
					name: "div", attributes: { class: "fileName" },
					childNodes:
					[
						{
							name: "button",
							listeners: { click: () => this._fireEvent("clickFile", file) },
							childNodes: [ file.name ]
						}
					]
				},
				{
					name: "div", attributes: { class: "fileType", title: file.type },
					childNodes: [ MIMETYPE_NAMES[file.type] || MIMETYPE_NAMES.unknown ]
				},
				{
					name: "div", attributes: { class: "fileSize" },
					childNodes: [ toFileSize(file.size) ]
				},
				{
					name: "div", attributes: { class: "fileModificationDate" },
					childNodes: [ (new Date(file.lastModified)).toLocaleString() ]
				}
			]
		});

		return fileEl;
	}

	generateDirElement(directory: DirectoryInfo)
	{
		const dirEl = createNodeTree(
		{
			name: "label", attributes: { class: "directory" },
			childNodes:
			[
				{
					name: "div", attributes: { class: "fileIcon" },
					childNodes: [ { name: "img", attributes: { src: MIMETYPE_ICONS.directory, alt: "" } } ]
				},
				{
					name: "div", attributes: { class: "fileName" },
					childNodes:
					[
						{
							name: "button",
							listeners: { click: () => this._fireEvent("clickDir", directory) },
							childNodes: [ directory.name ]
						}
					]
				},
				{
					name: "div", attributes: { class: "fileType" },
					childNodes: [ MIMETYPE_NAMES.directory ]
				},
				{
					name: "div", attributes: { class: "fileSize" }
				},
				{
					name: "div", attributes: { class: "fileModificationDate" }
				}
			]
		});

		return dirEl;
	}
}