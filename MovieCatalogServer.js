var io = require('socket.io').listen(8000);
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;

//TODO: Remove debug function, this is to test XmlSupport stuff.
startupFunction = function()
{
	var arrayToSend = [];
	arrayToSend.push({name: 'fart', description: 'fart', genres: 'fart,fartmore', movieid: '5', userrating: '1', rating:'1', posternum: '0', year: '1995', image: 'fart'});
	//arrayToSend.push(296883);
	//arrayToSend.push(924);

	var xmlTest = require('./XMLSupport');
	
	// var result = xmlTest.readFromXml({subpayload: arrayToSend});
	var result = xmlTest.writeToXml({payload: arrayToSend});
	console.log(result);
};

//startupFunction();

io.sockets.on('connection', function (socket) {
	
	//User obtains connection, a user is NOT authenticated at this point.
	console.log('User connection obatined.');
	
	//Can use this variable to determine who is authenticated.
	var authenticated = 1;
	//TODO: Change this from the debug user statement.
	var userId = '';
	
	//Verify the user's credentials. Doesn't do much right now, just make sure that the
	//username exists.	
	socket.on('authenticate', function(authString)
	{	
		MongoClient.connect('mongodb://alces2:stimperman@ds045531.mongolab.com:45531/alces', function(err,db)
		{
			if(err)
			{
				//This should also kick back some error to the user.
				console.log('Database error');
			}
			
			else
			{
				console.log(authString.user +' is attempting to auth.');
				//Should be able to swap out this mongo connection for any other kind of DB.
				var collection = db.collection('users');
				
				collection.findOne({user: authString.user}, function(err, result)
				{
					if(err)
					{
						console.log(err);
					}
					
					else if(!result)
					{
						//User name does not exist in the database.
						socket.emit('disconnect','Your credentials have been rejected. Incorrect user name.');
					}
					
					//User is found in the log, do auth.
					else
					{
						console.log('Found user: ' + result.user + '. Doing Auth');
						
						//Basic auth.
						console.log('Comparing passwords: ' + result.password + ' ' + authString.password);
						if(result.password == authString.password)
						{
							console.log('User ' + authString.user + ' has been authorized');
							socket.emit('authenticate', 'authenitcated ' + result._id);
							authenticated = 1;
							userId = result._id.toString();
						}
						
						else
						{
							console.log('User ' + authString.name + ' has been rejected for incorrect password');
							socket.emit('disconnect', 'user failed authentication');
						}
					}
				});
			}
		});
	});
	
	//Creates a user in the database
	//currently not secure.
	socket.on('create', function(createString)
	{
		//var splitString = createString.split(";");
		//var userToAdd = {name: splitString[0], password: splitString[1]};
		
		MongoClient.connect('mongodb://alces2:stimperman@ds045531.mongolab.com:45531/alces', function(err,db)
		{
			if(err)
			{
				console.log('Database error');
			}
			
			else
			{
				console.log('Connection made with MongoDB user server');
				var collection = db.collection('users');
				
				collection.find({user: createString.user}, function(err, cursor)
				{
					cursor.toArray(function(err, result)
					{
						if(err)
						{
							console.log(err);
						}
						
						else
						{
							//User already exists
							if(result.length != 0)
							{
								console.log('User already exists: ' + createString.user);
							}
							
							else
							{
								collection.insert(createString, function(err,result)
								{
									if(err)
									{
										console.log(err);
									}
									else
									{
										console.log('Inserted new user into the database.' + createString.name);
										socket.emit('create', 'user created successfully');
									}
								});
							}
						}
					});
				});
			}
		});
		
	});
	
	//This function retrieves ALL of a user's movie information.
	socket.on('request_movie_information', function(requestString)
	{
		if(authenticated == 1)
		{
			//User is authenticated, and should be allowed access to the DB.
			MongoClient.connect('mongodb://alces2:stimperman@ds045531.mongolab.com:45531/alces', function(err, db)
			{
				var collection = db.collection('movies');
				//Find all movies that belong to a user.
				collection.find({userId: userId}, function(err, cursor)
				{
					cursor.skip(0);
					
					cursor.toArray(function(err,docs)
					{
						if(err)
						{
							console.log(err);
						}
						
						else
						{
							var xmlTest = require('./XMLSupport');
							var arrayToSend = [];
							docs.forEach(function(entry)
							{
								arrayToSend.push(entry.MID);
							});
							var result = xmlTest.readFromXml({payload: arrayToSend});
							socket.emit('request_movie_information', {payload: result});
						}
					});
				});
			});
		}
		
		else
		{
			//Emit the user's unauthenticated status.
			socket.emit('USER_NOT_AUTHENTICATED_ERROR', 'User has not bee authenticated');
		}
	});
	
	socket.on('add_movie_collection', function(requestString)
	{
		if(authenticated == 1)
		{
			MongoClient.connect('mongodb://alces2:stimperman@ds045531.mongolab.com:45531/alces', function(err, db)
			{
				if(err)
				{
					console.log('Database error: ' + err);
				}
				
				else
				{
					var collection = db.collection('movies');
					//This assume that the object that the user passed in is a json serialized object.
					//If it isn't we will need to change whatever they gave us into a json serialized object.
					collection.insert(requestString.compact);
					
					var xmlTest = require('./XMLSupport');
					//This should handle duplicates as per the .dll functions
					var result = xmlTest.writeToXml({payload: requestString.full});
				}
			});
		}
	});
	
	socket.on('remove_movie_collection', function(request)
	{
		if(authenticated == 1)
		{
			MongoClient.connect('mongodb://alces2:stimperman@ds045531.mongolab.com:45531/alces', function(err, db)
			{
				
			});
		}
	});
	
	socket.on('does_user_exist', function(name)
	{
		MongoClient.connect('mongodb://alces2:stimperman@ds045531.mongolab.com:45531/alces', function(err,db)
		{
			if(err)
			{
				console.log('Found error in get_user_sync_status at : ' + err);
			}
			
			else
			{
				var collection = db.collection('users');
				collection.findOne({name: name}, function(err, cursor)
				{	
					if(err)
					{
						console.log('Found error: ' + err);
					}
					
					else
					{
						//Good, the user doesn't exist
						if(!cursor)
						{
							socket.emit('does_user_exist', 'false');
						}
						
						else
						{
							socket.emit('does_user_exist', cursor._id);
						}
					}
				});
			}
		});
		
	});
	
	socket.on('update_user', function(request)
	{
		//TODO: Add stuff here
	});
	
	socket.on('get_user_sync_status', function(request)
	{
		if(authenticated == 1)
		{
			MongoClient.connect('mongodb://alces2:stimperman@ds045531.mongolab.com:45531/alces', function(err,db)
			{
				if(err)
				{
					console.log('Found error in get_user_sync_status at : ' + err);
				}
				
				else
				{
					var collection = db.collection('users');
					collection.find({uid: userId}, function(err, cursor)
					{	
						if(err)
						{
							console.log('Found error: ' + err);
						}
						
						else
						{
							cursor.skip(0);
							socket.emit('get_user_sync_status', cursor.sync);
						}
					});
				}
			});
		}
	});
	
	socket.on('exit', function (name)
	{
		if(authenticated == 0)
		{
			console.log(name, ' has disconected.');
		}
	});
});