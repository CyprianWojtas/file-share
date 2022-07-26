import EventObject from "../EventObject.js";
import { MIMETYPE_ICONS, MIMETYPE_NAMES } from "../Strings.js";
import { createElement, createNodeTree, toFileSize } from "../Utils.js";
export default class FileContainer extends EventObject {
    constructor(dirContents = {}, path = []) {
        super();
        this._itemsEl = createElement("div", { class: "items" });
        this._pathEl = createElement("div", { class: "path" });
        this.element = createNodeTree({
            name: "div", attributes: { class: "fileContainer" },
            childNodes: [
                this._pathEl,
                {
                    name: "div", attributes: { class: "fileContainerItems" },
                    childNodes: [
                        {
                            name: "div", attributes: { class: "containerHeader" },
                            childNodes: [
                                { name: "div", attributes: { class: "header" }, childNodes: [""] },
                                { name: "div", attributes: { class: "header" }, childNodes: ["Name"] },
                                { name: "div", attributes: { class: "header" }, childNodes: ["Type"] },
                                { name: "div", attributes: { class: "header" }, childNodes: ["Size"] },
                                { name: "div", attributes: { class: "header" }, childNodes: ["Modification date"] }
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
    set contents(dirContents) {
        var _a, _b;
        this._contents = dirContents;
        this._itemsEl.innerHTML = "";
        for (const directory of (dirContents === null || dirContents === void 0 ? void 0 : dirContents.directories) || [])
            this._itemsEl.append(this.generateDirElement(directory));
        for (const file of (dirContents === null || dirContents === void 0 ? void 0 : dirContents.files) || [])
            this._itemsEl.append(this.generateFileElement(file));
        if (!((_a = dirContents === null || dirContents === void 0 ? void 0 : dirContents.files) === null || _a === void 0 ? void 0 : _a.length) && !((_b = dirContents === null || dirContents === void 0 ? void 0 : dirContents.directories) === null || _b === void 0 ? void 0 : _b.length)) {
            this._itemsEl.append(createNodeTree({
                name: "div", attributes: { class: "empty" },
                childNodes: ["Directory Empty"]
            }));
        }
    }
    get path() { return this._path; }
    set path(newPath) {
        this._path = newPath;
        this._pathEl.innerHTML = "";
        const pathHomeEl = createNodeTree({
            name: "button", listeners: { click: e => this._fireEvent("clickNavigation", [], e) },
            childNodes: ["Home"]
        });
        this._pathEl.append(pathHomeEl, "/");
        for (let i = 0; i < newPath.length; i++) {
            const pathPartEl = createNodeTree({
                name: "button", listeners: { click: e => this._fireEvent("clickNavigation", newPath.slice(0, i + 1), e) },
                childNodes: [newPath[i]]
            });
            this._pathEl.append(pathPartEl, "/");
        }
    }
    set directory(newDirectory) {
        this.path = newDirectory.path;
        this.contents = { directories: newDirectory.directories, files: newDirectory.files };
    }
    generateFileElement(file) {
        const fileEl = createNodeTree({
            name: "label", attributes: { class: "file" },
            childNodes: [
                {
                    name: "div", attributes: { class: "fileIcon" },
                    childNodes: [{ name: "img", attributes: { src: MIMETYPE_ICONS[file.type] || MIMETYPE_ICONS.unknown, alt: "" } }]
                },
                {
                    name: "div", attributes: { class: "fileName" },
                    childNodes: [
                        {
                            name: "button",
                            listeners: { click: e => this._fireEvent("clickFile", file, e) },
                            childNodes: [file.name]
                        }
                    ]
                },
                {
                    name: "div", attributes: { class: "fileType", title: file.type },
                    childNodes: [MIMETYPE_NAMES[file.type] || MIMETYPE_NAMES.unknown]
                },
                {
                    name: "div", attributes: { class: "fileSize" },
                    childNodes: [toFileSize(file.size)]
                },
                {
                    name: "div", attributes: { class: "fileModificationDate" },
                    childNodes: [(new Date(file.lastModified)).toLocaleString()]
                }
            ]
        });
        return fileEl;
    }
    generateDirElement(directory) {
        const dirEl = createNodeTree({
            name: "label", attributes: { class: "directory" },
            childNodes: [
                {
                    name: "div", attributes: { class: "fileIcon" },
                    childNodes: [{ name: "img", attributes: { src: MIMETYPE_ICONS.directory, alt: "" } }]
                },
                {
                    name: "div", attributes: { class: "fileName" },
                    childNodes: [
                        {
                            name: "button",
                            listeners: { click: e => this._fireEvent("clickDir", directory, e) },
                            childNodes: [directory.name]
                        }
                    ]
                },
                {
                    name: "div", attributes: { class: "fileType" },
                    childNodes: [MIMETYPE_NAMES.directory]
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
