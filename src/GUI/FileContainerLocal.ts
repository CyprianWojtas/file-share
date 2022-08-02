import EventObject from "../EventObject.js";
import Networking from "../Networking.js";
import Shared, { DirectoryInfo } from "../Shared.js";
import { createNodeTree } from "../Utils.js";
import FileContainer from "./FileContainer.js";

type Events =
[
	[ event: "sharesUpdate", callback: (shares: DirectoryInfo) => void ]
];

export default
class FileContainerLocal extends EventObject<Events>
{
	fileContainer: FileContainer;
	element: HTMLElement;

	private _network: Networking;

	constructor(network: Networking)
	{
		super();

		this._network = network;

		this.fileContainer = new FileContainer();

		this.element = createNodeTree(
		{
			name: "div", attributes: { class: "localFileContainer" },
			childNodes:
			[
				{
					name: "h1", childNodes: [ "Your Files" ]
				},
				{
					name: "button", attributes: { class: "fileChooser" }, childNodes: [ "Select Files" ],
					listeners: { click: () => this.chooseFiles() }
				},
				{
					name: "button", attributes: { class: "fileChooser" }, childNodes: [ "Select Directory" ],
					listeners: { click: () => this.chooseDirectory() }
				},
				this.fileContainer.element
			]
		});

		// @ts-ignore
		this.fileContainer.on("clickDir", async directory => this.fileContainer.directory = await Shared.getDirectory(directory.path) );
		// @ts-ignore
		this.fileContainer.on("clickNavigation", async path => this.fileContainer.directory = await Shared.getDirectory(path) );

		//===== Drag & drop file handling =====//
		this.fileContainer.element.addEventListener("dragover", e => e.preventDefault());
		this.fileContainer.element.addEventListener("drop", async e =>
		{
			// Prevent navigation.
			e.preventDefault();

			const items = [ ...e.dataTransfer.items ];

			console.log(items);
		
			// Process all of the items.
			for (const item of items)
			{
				// kind will be 'file' for file/directory entries.
				if (item.kind === 'file')
				{
					// @ts-ignore
					const entry = await item.getAsFileSystemHandle();

					if (entry.kind === 'file')
						Shared.addFile(entry);
					else if (entry.kind === 'directory')
						Shared.addDirectory(entry);
				}
			}

			await this.updateShares();
		});
	}

	async chooseFiles()
	{
		await Shared.requestFile();
		await this.updateShares();
	}

	async chooseDirectory()
	{
		await Shared.requestDirectory();
		await this.updateShares();
	}

	async updateShares()
	{
		const shares = await Shared.getDirectory();
		// @ts-ignore
		this.fileContainer.directory = shares;
		this._network.sendData("sharesUpdate", shares);

		this._fireEvent("sharesUpdate", shares);
	}
}