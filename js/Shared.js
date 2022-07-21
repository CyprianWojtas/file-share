// @ts-check

/**
 * @typedef {{
 * 		path: string[],
 * 		name: string,
 * 		size: number,
 * 		type: string,
 * 		lastModified: number
 * }} FileInfo
 * 
 * @typedef {{
 * 		path: string[],
 * 		name: string,
 * 		directories?: DirectoryInfo[],
* 		files?: FileInfo[]
 * }} DirectoryInfo
 */

/** @type {{[key: string]: FileSystemFileHandle}} */
const fileHandles = {};
/** @type {{[key: string]: FileSystemDirectoryHandle}} */
const dirHandles = {};

let shareId = 1;

export default
class Shared
{
	static async files()
	{
		/** @type {FileInfo[]} */
		const fileList = [];

		for (const id in fileHandles)
		{
			const fileHandle = fileHandles[id];
			const fileInfo = await this.getFileInfo(fileHandle, [ id ]);

			fileList.push(fileInfo);
		}

		fileList.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );

		return fileList;
	}

	static async directories()
	{
		const dirList = [];

		for (const id in dirHandles)
		{
			const dirHandle = dirHandles[id];
			const dirInfo = await this.getDirInfo(dirHandle, [ id ]);
			dirList.push(dirInfo);
		}

		dirList.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );

		return dirList;
	}

	static async requestFile()
	{
		try
		{
			/** @type {FileSystemFileHandle[]} */
			// @ts-ignore
			const handles = await showOpenFilePicker({ multiple: true });

			for (let fileHandle of handles)
				fileHandles[shareId++] = fileHandle;

			return handles;
		}
		catch(e)
		{
			console.warn(e);
			return null;
		}
	}

	static async requestDirectory()
	{
		try
		{
			/** @type {FileSystemDirectoryHandle} */
			// @ts-ignore
			let dirHandle = await showDirectoryPicker();

			dirHandles[shareId++] = dirHandle;

			return dirHandle;
		}
		catch(e)
		{
			console.warn(e);
			return null;
		}
	}


	/**
	 * 
	 * @param {FileSystemFileHandle} fileHandle 
	 * @returns {Promise<FileInfo>}
	 */
	static async getFileInfo(fileHandle, path = [])
	{
		const file = await fileHandle.getFile();
		return { name: file.name, path, size: file.size, type: file.type, lastModified: file.lastModified };
	}

	/**
	 * 
	 * @param {FileSystemDirectoryHandle} dirHandle
	 * @param {string[]} path
	 * @returns {Promise<DirectoryInfo>}
	 */
	static async getDirInfo(dirHandle, path = [])
	{
		/** @type {{ directories: DirectoryInfo[], files: FileInfo[] }} */
		const contents = { directories: [], files: [] };

		// @ts-ignore
		for await (const entry of dirHandle.values())
		{
			switch (entry.kind)
			{
				case "directory":
					contents.directories.push({ name: entry.name, path: [ ...path, entry.name ] });
					break;
				case "file":
					contents.files.push({ ...await this.getFileInfo(entry), path: [ ...path, entry.name ] });
			}
		}

		contents.files.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );
		contents.directories.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );

		return { name: dirHandle.name, ...contents, path };
	}

	/**
	 * @param {string[]} path
	 * @returns {Promise<FileSystemDirectoryHandle | null>}
	 */
	static async getDirectoryHandle(path = [])
	{
		if (!path.length)
			return null;
		
		const shiftedPath = [ ...path ];
		let currentDir = dirHandles[shiftedPath.shift() || ""];

		try
		{
			while (shiftedPath.length)
			{
				// @ts-ignore
				currentDir = await currentDir.getDirectoryHandle(shiftedPath.shift());
			}

			return currentDir;
		}
		catch(err)
		{
			console.warn("Directory listning error:", err);
		}

		return null;
	}


	/**
	 * @param {string[]} path
	 * @returns {Promise<DirectoryInfo | null>}
	 */
	static async getDirectory(path = [])
	{
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

		return await this.getDirInfo(dirHandle, path);
	}

	/**
	 * @param {string[]} path
	 * @returns {Promise<DirectoryInfo | null>}
	 */
	static async getFile(path = [])
	{
		const dirPath = [...path];
		const fileName = dirPath.pop();

		if (!fileName)
			return null;

		const dirHandle = await this.getDirectoryHandle(dirPath);
		const fileHandle = await dirHandle?.getFileHandle(fileName);

		if (fileHandle)
			return this.getFileInfo(fileHandle, path);

		return null;
	}

	/**
	 * 
	 * @param {string[]} path
	 * @returns 
	 */
	static async readFile(path = [], start = 0, end = 1024)
	{
		const dirPath = [...path];
		const fileName = dirPath.pop();

		if (!fileName)
			return null;

		const dirHandle = await this.getDirectoryHandle(dirPath);
		const fileHandle = await dirHandle?.getFileHandle(fileName);
		const file = await fileHandle?.getFile();

		return file?.slice(start, end).arrayBuffer();
	}
}