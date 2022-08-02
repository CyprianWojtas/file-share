var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
const fileHandles = {};
const directoryHandles = {};
let shareId = 1;
export default class Shared {
    static async files() {
        const fileList = [];
        for (const id in fileHandles) {
            const fileHandle = fileHandles[id];
            const fileInfo = await this.getFileInfo(fileHandle, [id]);
            fileList.push(fileInfo);
        }
        fileList.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1);
        return fileList;
    }
    static async directories() {
        const dirList = [];
        for (const id in directoryHandles) {
            const dirHandle = directoryHandles[id];
            const dirInfo = await this.getDirectoryInfo(dirHandle, [id]);
            dirList.push(dirInfo);
        }
        dirList.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1);
        return dirList;
    }
    static async requestFile() {
        try {
            // @ts-ignore
            const handles = await showOpenFilePicker({ multiple: true });
            for (let fileHandle of handles)
                this.addFile(fileHandle);
            return handles;
        }
        catch (e) {
            console.warn(e);
            return null;
        }
    }
    static addFile(fileHandle) {
        fileHandles[shareId++] = fileHandle;
    }
    static async requestDirectory() {
        try {
            // @ts-ignore
            let dirHandle = await showDirectoryPicker();
            this.addDirectory(dirHandle);
            return dirHandle;
        }
        catch (e) {
            console.warn(e);
            return null;
        }
    }
    static addDirectory(fileHandle) {
        directoryHandles[shareId++] = fileHandle;
    }
    static async getFileInfo(fileHandle, path = []) {
        const file = await fileHandle.getFile();
        return { name: file.name, path, size: file.size, type: file.type, lastModified: file.lastModified };
    }
    static async getDirectoryInfo(dirHandle, path = []) {
        var e_1, _a;
        /** @type {{ directories: DirectoryInfo[], files: FileInfo[] }} */
        const contents = { directories: [], files: [] };
        try {
            // @ts-ignore
            for (var _b = __asyncValues(dirHandle.values()), _c; _c = await _b.next(), !_c.done;) {
                const entry = _c.value;
                switch (entry.kind) {
                    case "directory":
                        contents.directories.push({ name: entry.name, path: [...path, entry.name] });
                        break;
                    case "file":
                        contents.files.push(Object.assign(Object.assign({}, await this.getFileInfo(entry)), { path: [...path, entry.name] }));
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        contents.files.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1);
        contents.directories.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1);
        return Object.assign(Object.assign({ name: dirHandle.name }, contents), { path });
    }
    static async getDirectoryHandle(path = []) {
        if (!path.length)
            return null;
        const shiftedPath = [...path];
        let currentDir = directoryHandles[shiftedPath.shift() || ""];
        try {
            while (shiftedPath.length) {
                // @ts-ignore
                currentDir = await currentDir.getDirectoryHandle(shiftedPath.shift());
            }
            return currentDir;
        }
        catch (err) {
            console.warn("Directory listning error:", err);
        }
        return null;
    }
    static async getFileHandle(path = []) {
        const dirPath = [...path];
        const fileName = dirPath.pop();
        if (!fileName)
            return null;
        if (!dirPath.length)
            return fileHandles[fileName] || null;
        const dirHandle = await this.getDirectoryHandle(dirPath);
        return await (dirHandle === null || dirHandle === void 0 ? void 0 : dirHandle.getFileHandle(fileName)) || null;
    }
    static async getDirectory(path = []) {
        if (!path.length)
            return {
                directories: await this.directories(),
                files: await this.files(),
                path: [],
                name: "All Files"
            };
        const dirHandle = await this.getDirectoryHandle(path);
        if (!dirHandle)
            return null;
        return await this.getDirectoryInfo(dirHandle, path);
    }
    static async getFile(path = []) {
        const fileHandle = await this.getFileHandle(path);
        if (fileHandle)
            return this.getFileInfo(fileHandle, path);
        return null;
    }
    static async readFile(path = []) {
        const fileHandle = await this.getFileHandle(path);
        const file = await (fileHandle === null || fileHandle === void 0 ? void 0 : fileHandle.getFile());
        return file || null;
    }
}
