// @ts-check
var _a, _b, _c;
import registerDownloadStatus from "./GUI/DownloadStatus.js";
import FileContainer from "./GUI/FileContainer.js";
import Networking from "./Networking.js";
import Shared from "./Shared.js";
registerDownloadStatus();
//===== Network management =====//
const network = new Networking(location.hash ? `fileShare_${location.hash.substring(1)}` : null);
network.on("connectionNew", async (con) => {
    var _a;
    console.log("New connection!", network.connections, con);
    let conNameEl = document.createElement("h2");
    conNameEl.title = con.peer;
    con.on("usernameUpdate", username => {
        conNameEl.innerHTML = "";
        conNameEl.append(username);
    });
    let resp = await con.getShares();
    let fileContainer = new FileContainer(resp);
    fileContainer.on("clickDir", async (directory) => fileContainer.directory = await con.getDirectory(directory.path));
    fileContainer.on("clickFile", async (file) => {
        var _a;
        const downloadStatus = document.createElement("download-status");
        downloadStatus.fileName = file.name;
        (_a = document.querySelector("#downloadList")) === null || _a === void 0 ? void 0 : _a.append(downloadStatus);
        // @ts-ignore
        con.downloadFile(file.path, (...data) => downloadStatus.handleStatusUpdate(...data));
    });
    fileContainer.on("clickNavigation", async (path) => fileContainer.directory = await con.getDirectory(path));
    con.on("sharesUpdate", async (directory) => fileContainer.directory = directory);
    let conSharesEl = fileContainer.element;
    con.on("disconnected", () => {
        conNameEl.remove();
        conSharesEl.remove();
    });
    (_a = document.querySelector("#remoteFileList")) === null || _a === void 0 ? void 0 : _a.append(conNameEl, conSharesEl);
});
// @ts-ignore
window.network = network;
// @ts-ignore
window.Shared = Shared;
//===== Local Files =====//
const localFileContainer = new FileContainer();
// @ts-ignore
localFileContainer.on("clickDir", async (directory) => localFileContainer.directory = await Shared.getDirectory(directory.path));
// @ts-ignore
localFileContainer.on("clickNavigation", async (path) => localFileContainer.directory = await Shared.getDirectory(path));
(_a = document.getElementById("fileList")) === null || _a === void 0 ? void 0 : _a.append(localFileContainer.element);
(_b = document.getElementById("dirChooser")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", async () => {
    await Shared.requestDirectory();
    const shares = await Shared.getDirectory();
    // @ts-ignore
    localFileContainer.directory = shares;
    network.sendData("sharesUpdate", shares);
});
(_c = document.getElementById("fileChooser")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", async () => {
    await Shared.requestFile();
    const shares = await Shared.getDirectory();
    // @ts-ignore
    localFileContainer.directory = shares;
    network.sendData("sharesUpdate", shares);
});
