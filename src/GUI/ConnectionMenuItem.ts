import Connection from "../Connection.js";
import { DirectoryInfo } from "../Shared.js";
import { createElement, createNodeTree } from "../Utils.js";

export default
class ConnectionMenuItem
{
	element: HTMLElement;

	private _connection: Connection;

	constructor(connection: Connection)
	{
		this._connection = connection;

		this.element = createNodeTree(
		{
			name: "label", attributes: { class: "connectionMenuItem" },
			childNodes:
			[
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
					childNodes: [ { name: "div", attributes: { class: "statusProgrssBar" } } ]
				}
			]
		});

		this._connection.on("usernameUpdate", name =>
		{
			this.element.querySelector(".connectionName").innerHTML = "";
			this.element.querySelector(".connectionName").append(name);
		});

		this._connection.on("sharesUpdate", shares => this.updateShares(shares));

		const statusEl           = <HTMLElement>this.element.querySelector(".status");
		const statusProgrssEl    = <HTMLElement>this.element.querySelector(".statusProgrss");
		const statusProgrssBarEl = <HTMLElement>this.element.querySelector(".statusProgrssBar");

		this._connection.on("statusUpdate", status =>
		{
			statusEl.innerHTML = "";

			if (!status.text)
			{
				statusProgrssEl.classList.add("hidden");
				return;
			}
			
			statusEl.append(createElement("i", { class: "icon-download" }), " ", status.text);
			statusEl.title = status.title;

			if (status.progress)
			{
				statusProgrssEl.classList.remove("hidden");
				statusProgrssBarEl.style.width = `${ status.progress * 100 }%`;
			}
			else
				statusProgrssEl.classList.add("hidden");
		});

		this._connection.on("disconnected", () => this.element.remove());

		(async () =>
		{
			this.updateShares(await this._connection.getShares());
		})();
	}

	updateShares(shares: DirectoryInfo)
	{
		const sharesEl = this.element.querySelector(".shares");
		sharesEl.innerHTML = "";
		
		const files = shares.files?.length || 0;
		const directories = shares.directories?.length || 0;

		if (files && directories)
			sharesEl.append(createElement("i", { class: "icon-upload" }), " ", `${ files } file${ files > 1 ? "s" : "" } and ${ directories } director${ directories > 1 ? "ies" : "y" }`);
		else if (files)
			sharesEl.append(createElement("i", { class: "icon-upload" }), " ", `${ files } file${ files > 1 ? "s" : "" }`);
		else if (directories)
			sharesEl.append(createElement("i", { class: "icon-upload" }), " ", `${ directories } director${ directories > 1 ? "ies" : "y" }`);
	}
}