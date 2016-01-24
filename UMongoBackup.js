require('./UJS-NODE.js');

RUN(function() {

	var
	//IMPORT: exec
	exec = require('child_process').exec,
	
	// config
	config = JSON.parse(READ_FILE({
		path : 'config.json',
		isSync : true
	})),
	
	// db names
	dbNames = CHECK_IS_ARRAY(config.dbName) === true ? config.dbName : [config.dbName],
	
	// db host
	dbHost = config.dbHost === undefined ? '127.0.0.1' : config.dbHost,

	// db port
	dbPort = config.dbPort === undefined ? 27017 : config.dbPort,
	
	// db username
	dbUsername = config.dbUsername,
	
	// db password
	dbPassword = config.dbPassword;
	
	// 1분에 한번씩 체크
	INTERVAL(60, RAR(function() {
		
		var
		// now cal
		nowCal = CALENDAR(),
		
		// today str
		todayStr = nowCal.getYear() + '-' + (nowCal.getMonth() < 10 ? '0' + nowCal.getMonth() : nowCal.getMonth()) + '-' + (nowCal.getDate() < 10 ? '0' + nowCal.getDate() : nowCal.getDate()),
		
		// last week cal
		lastWeekCal,
		
		// last week str
		lastWeekStr;
		
		// 새벅 5시에 백업
		if (nowCal.getHour() === 5 && nowCal.getMinute() === 0) {
			
			EACH(dbNames, function(dbName) {
				
				var
				// command
				command = 'mongodump';
				
				command += ' --host ' + dbHost;
				command += ' --port ' + dbPort;
				command += ' --db ' + dbName;
				
				if (dbUsername !== undefined) {
					command += ' --username ' + dbUsername;
				}
				
				if (dbPassword !== undefined) {
					command += ' --password ' + dbPassword;
				}
				
				command += ' --out ' + __dirname + '/dump/' + todayStr;
				
				exec(command, function(error) {
					if (error === TO_DELETE) {
						console.log(CONSOLE_GREEN('[UMongoBackup] ' + todayStr + ' `' + dbName + '` BACKED UP!'));
					} else {
						console.log(CONSOLE_RED('[UMongoBackup] `' + dbName + '` ERROR:'), error.toString());
					}
				});
			});
			
			lastWeekCal = CALENDAR(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
			lastWeekStr = lastWeekCal.getYear() + '-' + (lastWeekCal.getMonth() < 10 ? '0' + lastWeekCal.getMonth() : lastWeekCal.getMonth()) + '-' + (lastWeekCal.getDate() < 10 ? '0' + lastWeekCal.getDate() : lastWeekCal.getDate());
			
			// 7일 전 껀 삭제
			REMOVE_FOLDER(__dirname + '/dump/' + lastWeekStr);
		}
	}));
	
	console.log('[UMongoBackup] RUNNING...');
});
