// @ts-check

import registerDownloadStatus, { DownloadStatus } from "./GUI/DownloadStatus.js";
import FileContainer from "./GUI/FileContainer.js";
import Networking from "./Networking.js";
import Shared from "./Shared.js";

registerDownloadStatus();

//===== Network management =====//

const network: Networking = new Networking(location.hash ? `fileShare_${ location.hash.substring(1) }` : null);

network.on("connectionNew", async con =>
{
	console.log("New connection!", network.connections, con);

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
		const downloadStatus = <DownloadStatus>document.createElement("download-status");
		downloadStatus.fileName = file.name;

		document.querySelector("#downloadList")?.append(downloadStatus);

		// @ts-ignore
		con.downloadFile(file.path, (...data) => downloadStatus.handleStatusUpdate(...data));
	});

	fileContainer.on("clickNavigation", async path => fileContainer.directory = await con.getDirectory(path) );

	con.on("sharesUpdate", async directory => fileContainer.directory = directory );

	let conSharesEl = fileContainer.element;

	con.on("disconnected", () =>
	{
		conNameEl.remove();
		conSharesEl.remove();
	});

	document.querySelector("#remoteFileList")?.append(conNameEl, conSharesEl);
});


// @ts-ignore
window.network = network;
// @ts-ignore
window.Shared = Shared;


//===== Local Files =====//

const localFileContainer = new FileContainer();

// @ts-ignore
localFileContainer.on("clickDir", async directory => localFileContainer.directory = await Shared.getDirectory(directory.path) );
// @ts-ignore
localFileContainer.on("clickNavigation", async path => localFileContainer.directory = await Shared.getDirectory(path) );

document.getElementById("fileList")?.append(localFileContainer.element);


document.getElementById("dirChooser")?.addEventListener("click", async () =>
{
	await Shared.requestDirectory();
	const shares = await Shared.getDirectory();
	// @ts-ignore
	localFileContainer.directory = shares;
	network.sendData("sharesUpdate", shares);
});

document.getElementById("fileChooser")?.addEventListener("click", async () =>
{
	await Shared.requestFile();
	const shares = await Shared.getDirectory();
	// @ts-ignore
	localFileContainer.directory = shares;
	network.sendData("sharesUpdate", shares);
});