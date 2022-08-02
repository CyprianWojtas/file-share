import { createElement, createNodeTree } from "../Utils.js";
export default class ConnectionMenuItem {
    constructor(connection) {
        this._connection = connection;
        this.element = createNodeTree({
            name: "label", attributes: { class: "connectionMenuItem" },
            childNodes: [
                {
                    name: "button", attributes: { class: "connectionName", title: this._connection.peer }
                },
                {
                    name: "div", attributes: { class: "shares" }
                },
                {
                    name: "div", attributes: { class: "status" }
                },
                {
                    name: "div", attributes: { class: "statusProgrss hidden" },
                    childNodes: [{ name: "div", attributes: { class: "statusProgrssBar" } }]
                }
            ]
        });
        this._connection.on("usernameUpdate", name => {
            this.element.querySelector(".connectionName").innerHTML = "";
            this.element.querySelector(".connectionName").append(name);
        });
        this._connection.on("sharesUpdate", shares => this.updateShares(shares));
        const statusEl = this.element.querySelector(".status");
        const statusProgrssEl = this.element.querySelector(".statusProgrss");
        const statusProgrssBarEl = this.element.querySelector(".statusProgrssBar");
        this._connection.on("statusUpdate", status => {
            statusEl.innerHTML = "";
            if (!status.text) {
                statusProgrssEl.classList.add("hidden");
                return;
            }
            statusEl.append(createElement("i", { class: "icon-download" }), " ", status.text);
            statusEl.title = status.title;
            if (status.progress) {
                statusProgrssEl.classList.remove("hidden");
                statusProgrssBarEl.style.width = `${status.progress * 100}%`;
            }
            else
                statusProgrssEl.classList.add("hidden");
        });
        this._connection.on("disconnected", () => this.element.remove());
        (async () => {
            this.updateShares(await this._connection.getShares());
        })();
    }
    updateShares(shares) {
        var _a, _b;
        const sharesEl = this.element.querySelector(".shares");
        sharesEl.innerHTML = "";
        const files = ((_a = shares.files) === null || _a === void 0 ? void 0 : _a.length) || 0;
        const directories = ((_b = shares.directories) === null || _b === void 0 ? void 0 : _b.length) || 0;
        if (files && directories)
            sharesEl.append(createElement("i", { class: "icon-upload" }), " ", `${files} file${files > 1 ? "s" : ""} and ${directories} director${directories > 1 ? "ies" : "y"}`);
        else if (files)
            sharesEl.append(createElement("i", { class: "icon-upload" }), " ", `${files} file${files > 1 ? "s" : ""}`);
        else if (directories)
            sharesEl.append(createElement("i", { class: "icon-upload" }), " ", `${directories} director${directories > 1 ? "ies" : "y"}`);
    }
}
