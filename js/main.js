import Downloader from "./Donwloader.js";
import FileContainer from "./GUI/FileContainer.js";
import Networking from "./Networking.js";
import Shared from "./Shared.js";

//===== Network management =====//

/** @type {Networking} */
const network = new Networking(location.hash ? `fileShare_${ location.hash.substring(1) }` : null);

network.on("consUpdated", e =>
{
	console.log("Connections updated!", network.connections);
});

network.on("newConnection", async con =>
{
	let conNameEl = document.createElement("h2");
	conNameEl.title = con.peer;

	con.on("usernameUpdate", username =>
	{
		conNameEl.innerHTML = "";
		conNameEl.append(username);
	});

	let resp = await con.getShares();
	let fileContainer = new FileContainer(resp);

	fileContainer.on("clickDir", async directory => fileContainer.directory = await con.getDirectory(directory.path) );
	fileContainer.on("clickFile", async file =>
	{
		Downloader.downloadFile(con, file.path);
	});

	fileContainer.on("clickNavigation", async path => fileContainer.directory = await con.getDirectory(path) );

	con.on("sharesUpdate", async directory => fileContainer.directory = directory );

	let conSharesEl = fileContainer.element;

	con.on("close", () =>
	{
		conNameEl.remove();
		conSharesEl.remove();
	});

	document.querySelector("#remoteFileList").append(conNameEl, conSharesEl);
});

window.network = network;


//===== File choosing =====//

const localFileContainer = new FileContainer();

localFileContainer.on("clickDir", async directory => localFileContainer.directory = await Shared.getDirectory(directory.path) );
localFileContainer.on("clickNavigation", async path => localFileContainer.directory = await Shared.getDirectory(path) );

document.getElementById("fileList").append(localFileContainer.element);

window.Shared = Shared;

document.getElementById("dirChooser")?.addEventListener("click", async () =>
{
	await Shared.requestDirectory();
	const shares = await Shared.getDirectory();
	localFileContainer.directory = shares;
	network.sendData("sharesUpdate", shares);
});

document.getElementById("fileChooser")?.addEventListener("click", async () =>
{
	await Shared.requestFile();
	const shares = await Shared.getDirectory();
	localFileContainer.directory = shares;
	network.sendData("sharesUpdate", shares);
});