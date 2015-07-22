//Writes a list of "Movie"s to XML file.
module.exports.writeToXml = function(toWrite)
{
	var edge = require('edge').func({
	assemblyFile: 'MovieCatalogLibrary.dll',
	typeName: 'MovieCatalogLibrary.FileHandler',
	methodName: 'addMoviesNode'});
	
	var result = edge(toWrite, true);
	return result;
};

//Gets the movie information from the XML file.
//Argument is a list of MIDs
module.exports.readFromXml = function(mid)
{
	var edge = require('edge').func({
	assemblyFile: 'MovieCatalogLibrary.dll',
	typeName: 'MovieCatalogLibrary.FileHandler',
	methodName: 'getMoviesNode'});
	
	var toReturn = edge({payload: mid.payload},true);
	
	return toReturn;
};