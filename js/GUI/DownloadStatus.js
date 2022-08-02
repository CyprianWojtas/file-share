import { createElement, createNodeTree, toFileSize } from "../Utils.js";
const downloadStatusStyle = `
:host
{
	margin: 0.5rem 0;
}
.fileName
{
	overflow: hidden;
	text-overflow: ellipsis;
}

.progressBar
{
	background: #EEE;
	text-align: center;
	position: relative;
	border-radius: 0.25rem;
	z-index: -1;
	overflow: hidden;
}
.progressBarBackground
{
	background: #F66;
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	z-index: -1;
}
.progressBarBackground.animated
{
	background: repeating-linear-gradient(45deg, #F77, #F77 0.5rem, #F55 0.5rem, #F55 1rem);
	background-size: 2.828427124746190rem;
	animation: progressAnim 15s linear infinite;
}
@keyframes progressAnim
{
	100%
	{
		background-position: 100% 100%;
	}
}
button.close
{
	display: none;
	float: right;
	border: 1px solid #AAA;
	font-family: inherit;
	font-size: inherit;
	padding: 0 0.25rem;
	vertical-align: middle;
	margin-left: 0.25rem;
	background: #EEE;
	border-radius: 0.25rem;
	box-sizing: border-box;
	line-height: 1rem;
	height: 1rem;
}
.finished button.close
{
	display: inline-block;
}
`;
export class DownloadStatus extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "closed" });
        const style = document.createElement("style");
        style.innerHTML = downloadStatusStyle;
        this._fileNameEl = createElement("div", { class: "fileName" });
        this._progressBarBackgroundEl = createElement("div", { class: "progressBarBackground" });
        this._progressBarTextEl = createElement("span");
        this._progressBarSizeEl = createElement("div");
        this._progressBarEl = createNodeTree({
            name: "div", attributes: { class: "progressBar" },
            childNodes: [
                this._progressBarTextEl,
                this._progressBarBackgroundEl
            ]
        });
        this.rootElement = createNodeTree({
            name: "div", attributes: { class: "downloadStatus" },
            childNodes: [
                this._fileNameEl,
                {
                    name: "button", attributes: { class: "close" }, childNodes: ["×"],
                    listeners: { click: () => this.remove() }
                },
                this._progressBarEl,
                this._progressBarSizeEl
            ]
        });
        this._progress = 0;
        this._speed = 0;
        this.total = 1;
        shadow.append(style, this.rootElement);
    }
    get fileName() { return this._fileName; }
    set fileName(newName) {
        this._fileName = newName;
        this._fileNameEl.innerHTML = "";
        this._fileNameEl.append(newName);
    }
    get progress() { return this._progress; }
    set progress(value) {
        this._progress = value;
        this._progressBarSizeEl.innerHTML = `${toFileSize(this._progress)} / ${toFileSize(this._total)}`;
        this.updateProgressBar();
    }
    get total() { return this._total; }
    set total(value) {
        this._total = value;
        this._progressBarSizeEl.innerHTML = `${toFileSize(this._progress)} / ${toFileSize(this._total)}`;
        this.updateProgressBar();
    }
    get speed() { return this._speed; }
    set speed(value) {
        this._speed = value;
        this.updateProgressBar();
    }
    updateProgressBar() {
        this._progressBarBackgroundEl.classList.remove("animated");
        this._progressBarEl.classList.remove("customStatus");
        this._progressBarTextEl.innerHTML = "";
        this._progressBarTextEl.append((this._progress / this._total * 100).toFixed(2) + "% — " + toFileSize(this._speed) + "/s");
        this._progressBarBackgroundEl.style.width = `${this._progress / this._total * 100}%`;
    }
    customProgressStatus(status, finished = false, width = 100) {
        if (finished)
            this.rootElement.classList.add("finished");
        else
            this.rootElement.classList.remove("finished");
        this._progressBarEl.classList.add("customStatus");
        this._progressBarTextEl.innerHTML = "";
        this._progressBarTextEl.append(status);
        this._progressBarBackgroundEl.style.width = `${width}%`;
        if (!finished)
            this._progressBarBackgroundEl.classList.add("animated");
        else
            this._progressBarBackgroundEl.classList.remove("animated");
    }
    //===== Handling download status responses =====//
    handleStatusUpdate(eventName, data) {
        switch (eventName) {
            case "fileInfo":
                this.total = data.size;
                this.customProgressStatus("Waiting for download...", false, 0);
                break;
            case "progress":
                this.progress = data.current;
                this.speed = data.speed;
                break;
            case "savingToFile":
                this.customProgressStatus("Saving to file...", false);
                break;
            case "finished":
                this.customProgressStatus("Finished!", true);
                break;
            // Error handling
            case "savingNotPermitted":
                this.rootElement.remove();
                break;
        }
    }
}
export default function registerContextMenu() {
    customElements.define('download-status', DownloadStatus);
}
