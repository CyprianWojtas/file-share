import Shared from "../Shared.js";
import { createNodeTree } from "../Utils.js";
import FileContainer from "./FileContainer.js";
export default class FileContainerLocal {
    constructor(network) {
        this._network = network;
        this.fileContainer = new FileContainer();
        this.element = createNodeTree({
            name: "div", attributes: { class: "localFileContainer" },
            childNodes: [
                {
                    name: "h1", childNodes: ["Your Files"]
                },
                {
                    name: "button", attributes: { class: "fileChooser" }, childNodes: ["Select Files"],
                    listeners: { click: () => this.chooseFiles() }
                },
                {
                    name: "button", attributes: { class: "fileChooser" }, childNodes: ["Select Directory"],
                    listeners: { click: () => this.chooseDirectory() }
                },
                this.fileContainer.element
            ]
        });
        // @ts-ignore
        this.fileContainer.on("clickDir", async (directory) => this.fileContainer.directory = await Shared.getDirectory(directory.path));
        // @ts-ignore
        this.fileContainer.on("clickNavigation", async (path) => this.fileContainer.directory = await Shared.getDirectory(path));
    }
    async chooseFiles() {
        await Shared.requestFile();
        const shares = await Shared.getDirectory();
        // @ts-ignore
        this.fileContainer.directory = shares;
        this._network.sendData("sharesUpdate", shares);
    }
    async chooseDirectory() {
        await Shared.requestDirectory();
        const shares = await Shared.getDirectory();
        // @ts-ignore
        this.fileContainer.directory = shares;
        this._network.sendData("sharesUpdate", shares);
    }
}
