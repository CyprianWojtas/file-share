// tsc does not undersand what these are
// bruh.
// @ts-ignore
type FSDirectoryHandle = FileSystemDirectoryHandle;
// @ts-ignore
type FSFileHandle = FileSystemFileHandle;

export interface FileInfo
{
	path: string[];
	name: string;
	size: number;
	type: string;
	lastModified: number;
}

export interface DirectoryInfo
{
	path: string[];
	name: string;
	directories?: DirectoryInfo[];
	files?: FileInfo[];
}


const fileHandles:      { [key: string]: FSFileHandle;      } = {};
const directoryHandles: { [key: string]: FSDirectoryHandle; } = {};

let shareId = 1;

export default
class Shared
{
	static async files()
	{
		const fileList: FileInfo[] = [];

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

		for (const id in directoryHandles)
		{
			const dirHandle = directoryHandles[id];
			const dirInfo = await this.getDirectoryInfo(dirHandle, [ id ]);
			dirList.push(dirInfo);
		}

		dirList.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );

		return dirList;
	}

	static async requestFile()
	{
		try
		{
			// @ts-ignore
			const handles: FSFileHandle[] = await showOpenFilePicker({ multiple: true });

			for (let fileHandle of handles)
				this.addFile(fileHandle);

			return handles;
		}
		catch(e)
		{
			console.warn(e);
			return null;
		}
	}

	static addFile(fileHandle: FSFileHandle)
	{
		fileHandles[shareId++] = fileHandle;
	}

	static async requestDirectory()
	{
		try
		{
			// @ts-ignore
			let dirHandle: FSDirectoryHandle = await showDirectoryPicker();
			this.addDirectory(dirHandle);

			return dirHandle;
		}
		catch(e)
		{
			console.warn(e);
			return null;
		}
	}

	static addDirectory(fileHandle: FSDirectoryHandle)
	{
		directoryHandles[shareId++] = fileHandle;
	}

	static async getFileInfo(fileHandle: FSFileHandle, path = []): Promise<FileInfo>
	{
		const file = await fileHandle.getFile();
		return { name: file.name, path, size: file.size, type: file.type, lastModified: file.lastModified };
	}

	static async getDirectoryInfo(dirHandle: FSDirectoryHandle, path: string[] = []): Promise<DirectoryInfo>
	{
		/** @type {{ directories: DirectoryInfo[], files: FileInfo[] }} */
		const contents: { directories: DirectoryInfo[]; files: FileInfo[]; } = { directories: [], files: [] };

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

	static async getDirectoryHandle(path: string[] = []): Promise<FSDirectoryHandle | null>
	{
		if (!path.length)
			return null;
		
		const shiftedPath = [ ...path ];
		let currentDir = directoryHandles[shiftedPath.shift() || ""];

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

	static async getFileHandle(path: string[] = []): Promise<FSFileHandle | null>
	{
		const dirPath = [...path];
		const fileName = dirPath.pop();

		if (!fileName)
			return null;
		
		if (!dirPath.length)
			return fileHandles[fileName] || null;

		const dirHandle = await this.getDirectoryHandle(dirPath);
		return await dirHandle?.getFileHandle(fileName) || null;
	}

	static async getDirectory(path: string[] = []): Promise<DirectoryInfo | null>
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

		return await this.getDirectoryInfo(dirHandle, path);
	}

	static async getFile(path: string[] = []): Promise<FileInfo | null>
	{
		const fileHandle = await this.getFileHandle(path);

		if (fileHandle)
			return this.getFileInfo(fileHandle, path);

		return null;
	}

	static async readFile(path: string[] = []): Promise<File | null>
	{
		const fileHandle = await this.getFileHandle(path);
		const file = await fileHandle?.getFile();

		return file || null;
	}
}