// @ts-check

import Connection from "./Connection.js";

const CHUNK_SIZE = 1048576; // 1 MB

export default
class Downloader
{
	/**
	 * 
	 * @param {Connection} connection 
	 * @param {string[]} path 
	 */
	static async downloadFile(connection, path)
	{
		const fileInfo = await connection.getFile(path);

		let progress = 0;

		// @ts-ignore
		const fileHandle = await showSaveFilePicker({ suggestedName: fileInfo.name });
		const fileWritable = await fileHandle.createWritable();

		while (progress < fileInfo.size)
		{
			console.log("Downloading", progress, "/", fileInfo.size, (progress / fileInfo.size * 100).toFixed(2) + "%");

			let data = await connection.readFile(path, progress, progress + CHUNK_SIZE);

			progress += CHUNK_SIZE;
			await fileWritable.write(data);
		}
		
		await fileWritable.close();

		console.log("Downloading", progress, "/", fileInfo.size, (progress / fileInfo.size * 100).toFixed(2) + "%");
		console.log("Download compelete!");
	}
}