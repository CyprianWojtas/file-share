// tsc does not undersand what these are
// bruh.
// @ts-ignore
export type FSDirectoryEH = FileSystemDirectoryHandle | FileSystemDirectoryEntry;
// @ts-ignore
export type FSFileEH = FileSystemFileHandle | FileSystemFileEntry;
// @ts-ignore
export type FSDirectoryHandle = FileSystemDirectoryHandle;
// @ts-ignore
export type FSFileHandle = FileSystemFileHandle;

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


const fileHandles:      { [key: string]: FSFileEH;      } = {};
const directoryHandles: { [key: string]: FSDirectoryEH; } = {};

let shareId = 1;

export default
class Shared
{
	static async files(): Promise<FileInfo[]>
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

	static async directories(): Promise<DirectoryInfo[]>
	{
		const dirList: DirectoryInfo[] = [];

		for (const id in directoryHandles)
		{
			const dirHandle = directoryHandles[id];
			const dirInfo = await this.getDirectoryInfo(dirHandle, [ id ]);
			dirList.push(dirInfo);
		}

		dirList.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );

		return dirList;
	}

	/** File System API required */
	static async requestFile(): Promise<boolean>
	{
		try
		{
			// @ts-ignore
			const handles: FSFileEH[] = await showOpenFilePicker({ multiple: true });

			for (let fileHandle of handles)
				this.addFile(fileHandle);

			return true;
		}
		catch(e)
		{
			console.warn(e);
			return false;
		}
	}

	static addFile(fileHandle: FSFileEH): void
	{
		fileHandles[shareId++] = fileHandle;
	}

	/** File System API required */
	static async requestDirectory(): Promise<boolean>
	{
		try
		{
			// @ts-ignore
			let dirHandle: FSDirectoryEH = await showDirectoryPicker();
			this.addDirectory(dirHandle);

			return true;
		}
		catch(e)
		{
			console.warn(e);
			return false;
		}
	}

	static addDirectory(fileHandle: FSDirectoryEH): void
	{
		directoryHandles[shareId++] = fileHandle;
	}

	private static async getFileInfo(fileHandle: FSFileEH, path = []): Promise<FileInfo>
	{
		let file = null;
		
		if (typeof FileSystemFileEntry != "undefined" && fileHandle instanceof FileSystemFileEntry)
			file = await new Promise((ret, err) => fileHandle.file(ret, err));
		else
			file = await (<FSFileHandle>fileHandle).getFile();
		
		return { name: file.name, path, size: file.size, type: file.type, lastModified: file.lastModified };
	}

	private static async getDirectoryInfo(dirHandle: FSDirectoryEH, path: string[] = []): Promise<DirectoryInfo>
	{
		/** @type {{ directories: DirectoryInfo[], files: FileInfo[] }} */
		const contents: { directories: DirectoryInfo[]; files: FileInfo[]; } = { directories: [], files: [] };

		if (typeof FileSystemDirectoryEntry != "undefined" && dirHandle instanceof FileSystemDirectoryEntry)
		{
			const reader = dirHandle.createReader();
			const entries: FileSystemEntry[] = await new Promise((ret, err) => reader.readEntries(ret, err));

			for (const entry of entries)
			{
				if (entry.isDirectory)
					contents.directories.push({ name: entry.name, path: [ ...path, entry.name ] });
				else if (entry.isFile)
					contents.files.push({ ...await this.getFileInfo(<FileSystemFileEntry>entry), path: [ ...path, entry.name ] });
			}
		}
		else
		{
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
		}

		contents.files.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );
		contents.directories.sort((a, b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1 );

		return { name: dirHandle.name, ...contents, path };
	}

	private static async getDirectoryHandle(path: string[] = []): Promise<FSDirectoryEH | null>
	{
		if (!path.length)
			return null;
		
		const shiftedPath = [ ...path ];
		let currentDir = directoryHandles[shiftedPath.shift() || ""];

		try
		{
			while (shiftedPath.length)
			{
				if (typeof FileSystemDirectoryEntry != "undefined" && currentDir instanceof FileSystemDirectoryEntry)
				{
					try
					{
						currentDir = await new Promise((ret, err) => (<FileSystemDirectoryEntry>currentDir).getDirectory(shiftedPath.shift(), {}, ret, err));
					}
					catch(err)
					{
						console.warn("Directory listning error:", err);
						return null;
					}
				}
				else
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

	private static async getFileHandle(path: string[] = []): Promise<FSFileEH | null>
	{
		const dirPath = [...path];
		const fileName = dirPath.pop();

		if (!fileName)
			return null;
		
		if (!dirPath.length)
			return fileHandles[fileName] || null;

		const dirHandle = await this.getDirectoryHandle(dirPath);

		if (typeof FileSystemDirectoryEntry != "undefined" && dirHandle instanceof FileSystemDirectoryEntry)
		{
			try
			{
				return await new Promise((ret, err) => dirHandle.getFile(fileName, {}, ret, err));
			}
			catch(e)
			{
				console.warn(e);
				return null;
			}
		}
		else
			return await (<FSDirectoryHandle>dirHandle)?.getFileHandle(fileName) || null;
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

		if (typeof FileSystemFileEntry != "undefined" && fileHandle instanceof FileSystemFileEntry)
		{
			try
			{
				return await new Promise((ret, err) => fileHandle.file(ret, err));
			}
			catch(e)
			{
				console.warn(e);
				return null;
			}
		}

		const file = await (<FSFileHandle>fileHandle)?.getFile();

		return file || null;
	}
}