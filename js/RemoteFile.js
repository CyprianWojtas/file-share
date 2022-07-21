export default
class RemoteFile
{
	constructor(name, size, type, lastModified, path, connection)
	{
		this.name = name;
		this.size = size;
		this.type = type;
		this.lastModified = lastModified;
		this.path = path;
		this.connection = connection;
	}

	downloadFile()
	{

	}
}
