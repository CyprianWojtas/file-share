var _a;
import ConnectionMenuItem from "./GUI/ConnectionMenuItem.js";
import FileContainerLocal from "./GUI/FileContainerLocal.js";
import FileContainerRemote from "./GUI/FileContainerRemote.js";
import Networking from "./Networking.js";
import Shared from "./Shared.js";
import { MIMETYPE_ICONS } from "./Strings.js";
import { createNodeTree } from "./Utils.js";
//===== Side menu =====//
let menuSelectedEl = document.querySelector(".menuMyFiles");
const menuMyFilesEl = document.querySelector(".menuMyFiles");
//===== Network management =====//
const network = new Networking(location.hash ? `fileShare_${location.hash.substring(1)}` : null);
network.on("connectionNew", async (con) => {
    var _a;
    console.log("New connection!", network.connections, con);
    // document.querySelector("#connections")?.append(conNameEl, conSharesEl);
    const connectionMenuItem = new ConnectionMenuItem(con);
    (_a = document.querySelector("#connections")) === null || _a === void 0 ? void 0 : _a.append(connectionMenuItem.element);
    connectionMenuItem.element.addEventListener("click", () => {
        menuSelectedEl.classList.remove("selected");
        menuSelectedEl = connectionMenuItem.element;
        menuSelectedEl.classList.add("selected");
        const remoteFileContainer = new FileContainerRemote(con);
        const mainPage = document.querySelector(".mainPage");
        mainPage.innerHTML = "";
        mainPage.append(remoteFileContainer.element);
    });
});
//===== Local Files =====//
const localFileContainer = new FileContainerLocal(network);
(_a = document.querySelector(".mainPage")) === null || _a === void 0 ? void 0 : _a.append(localFileContainer.element);
menuSelectedEl = menuMyFilesEl;
menuSelectedEl.classList.add("selected");
menuMyFilesEl.addEventListener("click", () => {
    menuSelectedEl.classList.remove("selected");
    menuSelectedEl = menuMyFilesEl;
    menuSelectedEl.classList.add("selected");
    const mainPage = document.querySelector(".mainPage");
    mainPage.innerHTML = "";
    mainPage.append(localFileContainer.element);
});
localFileContainer.on("sharesUpdate", shares => {
    const localFilesMenuListEl = document.querySelector("#yourFiles");
    localFilesMenuListEl.innerHTML = "";
    for (const directory of (shares === null || shares === void 0 ? void 0 : shares.directories) || [])
        localFilesMenuListEl.append(createNodeTree({
            name: "div", attributes: { class: "file" },
            childNodes: [
                { name: "img", attributes: { src: MIMETYPE_ICONS.directory, alt: "" } },
                directory.name
            ]
        }));
    for (const file of (shares === null || shares === void 0 ? void 0 : shares.files) || [])
        localFilesMenuListEl.append(createNodeTree({
            name: "div", attributes: { class: "file" },
            childNodes: [
                { name: "img", attributes: { src: MIMETYPE_ICONS[file.type] || MIMETYPE_ICONS.unknown, alt: "" } },
                file.name
            ]
        }));
});
//===== Username field =====//
const usernameInputEl = document.querySelector("#username");
usernameInputEl.value = network.userName;
usernameInputEl.addEventListener("input", () => {
    network.userName = usernameInputEl.value;
});
//===== Global access =====//
// @ts-ignore
window.network = network;
// @ts-ignore
window.Shared = Shared;
