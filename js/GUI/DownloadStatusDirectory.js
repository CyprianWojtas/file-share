import { createNodeTree, toFileSize } from "../Utils.js";
export default class DownloadStatusDirectory {
    constructor(directoryDownload) {
        this._directoryDownload = directoryDownload;
        this.element = createNodeTree({
            name: "div", attributes: { class: "downloadStatus" },
            childNodes: [
                { name: "button", attributes: { class: "close" }, listeners: { click: () => this.element.remove() } },
                { name: "div", attributes: { class: "dirName" }, childNodes: [" "] },
                {
                    name: "div", attributes: { class: "file" },
                    childNodes: [
                        { name: "div", attributes: { class: "fileName" }, childNodes: [" "] },
                        { name: "div", attributes: { class: "fileSize" }, childNodes: [" "] }
                    ]
                },
                {
                    name: "div", attributes: { class: "progressBar progressBarFile" },
                    childNodes: [
                        { name: "div", attributes: { class: "progressBarBg" } },
                        { name: "span", childNodes: ["Waiting for download..."] }
                    ]
                },
                {
                    name: "div", attributes: { class: "progressBar progressBarTotal" },
                    childNodes: [
                        { name: "div", attributes: { class: "progressBarBg" } },
                        { name: "span", childNodes: ["Waiting for download..."] }
                    ]
                },
                {
                    name: "div", attributes: { class: "footer" },
                    childNodes: [
                        { name: "div", attributes: { class: "downloadSpeed" }, childNodes: ["0 B/s"] },
                        { name: "div", attributes: { class: "totalSize" }, childNodes: [" "] }
                    ]
                }
            ]
        });
        this._elHooks =
            {
                dirName: this.element.querySelector(".dirName"),
                fileName: this.element.querySelector(".fileName"),
                fileSize: this.element.querySelector(".fileSize"),
                fileProgressText: this.element.querySelector(".progressBarFile span"),
                fileProgresBg: this.element.querySelector(".progressBarFile .progressBarBg"),
                progressText: this.element.querySelector(".progressBarTotal span"),
                progresBg: this.element.querySelector(".progressBarTotal .progressBarBg"),
                speed: this.element.querySelector(".downloadSpeed"),
                size: this.element.querySelector(".totalSize")
            };
        this.bindEvents();
    }
    set dirName(newValue) {
        if (this._dirName == newValue)
            return;
        this._dirName = newValue;
        this._elHooks.dirName.innerHTML = "";
        this._elHooks.dirName.append(newValue);
    }
    set fileName(newValue) {
        if (this._fileName == newValue)
            return;
        this._fileName = newValue;
        this._elHooks.fileName.innerHTML = "";
        this._elHooks.fileName.title = newValue;
        this._elHooks.fileName.append(newValue);
    }
    set fileSize(newValue) {
        if (this._fileSize == newValue)
            return;
        this._fileSize = newValue;
        this._elHooks.fileSize.innerHTML = "";
        this._elHooks.fileSize.append(`${toFileSize(newValue)}`);
    }
    set fileProgress(newValue) {
        if (this._fileProgress == newValue)
            return;
        this._fileProgress = newValue;
        if (typeof newValue == "number") {
            this._elHooks.fileProgressText.innerHTML = "";
            this._elHooks.fileProgressText.append(`${(newValue / this._fileSize * 100).toFixed(2)}%`);
            this._elHooks.fileProgresBg.style.width = `${newValue / this._fileSize * 100}%`;
            this._elHooks.fileProgresBg.classList.remove("animation");
        }
        else {
            this._elHooks.fileProgressText.innerHTML = "";
            this._elHooks.fileProgresBg.style.width = "100%";
            switch (newValue) {
                case "saving":
                    this._elHooks.fileProgressText.append("Saving to file...");
                    this._elHooks.fileProgresBg.classList.add("animation");
                    break;
                case "finished":
                    this._elHooks.fileProgressText.append("Finished!");
                    this._elHooks.fileProgresBg.classList.remove("animation");
                    break;
                default:
                    this._elHooks.fileProgressText.append(newValue);
                    this._elHooks.fileProgresBg.classList.add("animation");
                    break;
            }
        }
    }
    set size(newValue) {
        if (this._size == newValue)
            return;
        this._size = newValue;
        this._elHooks.size.innerHTML = "";
        if (typeof this._progress == "number")
            this._elHooks.size.append(`${toFileSize(this._progress)} / ${toFileSize(this._size)}`);
    }
    set progress(newValue) {
        if (this._progress == newValue)
            return;
        this._progress = newValue;
        if (typeof newValue == "number") {
            this._elHooks.progressText.innerHTML = "";
            this._elHooks.progressText.append(`${(newValue / this._size * 100).toFixed(2)}%`);
            this._elHooks.progresBg.style.width = `${newValue / this._size * 100}%`;
            this._elHooks.progresBg.classList.remove("animation");
            this._elHooks.size.innerHTML = "";
            this._elHooks.size.append(`${toFileSize(newValue)} / ${toFileSize(this._size)}`);
        }
        else {
            this._elHooks.fileProgressText.innerHTML = "";
            this._elHooks.fileProgresBg.style.width = "100%";
            switch (newValue) {
                case "saving":
                    this._elHooks.fileProgressText.append("Saving...");
                    this._elHooks.fileProgresBg.classList.add("animation");
                    break;
                case "finished":
                    this._elHooks.fileProgressText.append("Finished!");
                    this._elHooks.fileProgresBg.classList.remove("animation");
                    break;
                default:
                    this._elHooks.fileProgressText.append(newValue);
                    this._elHooks.fileProgresBg.classList.add("animation");
                    break;
            }
        }
    }
    set speed(newValue) {
        if (this._speed == newValue)
            return;
        this._speed = newValue;
        this._elHooks.speed.innerHTML = "";
        this._elHooks.speed.append(`${toFileSize(newValue)}/s`);
    }
    bindEvents() {
        this._directoryDownload.on("directoryInfo", (dirInfo) => {
            this.dirName = dirInfo.name;
        });
        this._directoryDownload.on("fileInfo", (fileInfo) => {
            this.fileName = fileInfo.name;
            this.fileSize = fileInfo.size;
        });
        this._directoryDownload.on("savingToFile", () => {
            this.fileProgress = "saving";
        });
        this._directoryDownload.on("progress", progress => {
            this.fileSize = progress.fileTotal;
            this.fileProgress = progress.fileCurrent;
            this.size = progress.total;
            this.progress = progress.current;
            this.speed = progress.speed;
        });
        this._directoryDownload.on("finished", () => {
            this.progress = "finished";
            this.fileProgress = "finished";
        });
        this._directoryDownload.on("savingNotPermitted", () => this.element.remove());
    }
}
