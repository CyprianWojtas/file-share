// @ts-check

const fileListEl = document.querySelector("fileList");

function toFileSize(size)
{
	if (size > 1024 ** 4) return (size / 1024 ** 4).toFixed(2) + " TB";
	if (size > 1024 ** 3) return (size / 1024 ** 3).toFixed(2) + " GB";
	if (size > 1024 ** 2) return (size / 1024 ** 2).toFixed(2) + " MB";
	if (size > 1024     ) return (size / 1024     ).toFixed(2) + " kB";
	return size + " B";
}

let generatingHash = false;
async function generateHash(fileHandle, progressEl)
{
	if (generatingHash && progressEl)
		progressEl.innerHTML = "Waiting...";
	while (generatingHash)
		await new Promise(ret => setTimeout(ret, 100));
	
	progressEl?.classList?.remove("waiting");
	progressEl?.classList?.add("processing");

	generatingHash = true;
	const file = await fileHandle?.getFile();
	const fileSize = file.size;
	let progress = 0;

	/** @type {ReadableStreamDefaultReader} */
	const fileReader = await file?.stream().getReader();
	
	// @ts-ignore
	const hash = SHA256.createHash();

	let done = false;

	do
	{
		let filePart = await fileReader.read();
		done = filePart.done;
		progress += filePart.value?.length || 0;

		if (progressEl)
			progressEl.innerHTML = `${ toFileSize(progress) } / ${ toFileSize(fileSize) } — ${ (progress / fileSize * 100).toFixed(2) }%`;

		if (filePart.value)
			hash.update(filePart.value);
		
		await new Promise(ret => setTimeout(ret, 1));
	}
	while(!done);

	progressEl?.classList?.remove("processing");
	generatingHash = false;
	return hash.digest("hex");
}

async function generateTree(handle)
{
	// console.log(handle);
	let fileEl = document.createElement("div");

	fileEl.append(handle.name);
	fileEl.classList.add(handle.kind);

	if (handle.kind == "directory")
	(async () =>
	{
		for await (const entry of handle.values())
		{
			let entryEl = await generateTree(entry);

			fileEl.append(entryEl);
		}
	})();
	if (handle.kind == "file")
	(async () =>
	{
		const file = await handle?.getFile();
		console.log(file);
		// let progressBar = document.createElement("div");
		// progressBar.classList.add("waiting");
		// fileEl.append(progressBar);

		// progressBar.innerHTML = await generateHash(handle, progressBar);
	})();

	return fileEl;
}

document.getElementById("dirChooser")?.addEventListener("click", async () =>
{
	console.log("Requesting directory access...");
	// @ts-ignore
	let dirHandle = await showDirectoryPicker({ mode: "readwrite" });


	console.log(dirHandle);
	document.body.append(await generateTree(dirHandle));

});
