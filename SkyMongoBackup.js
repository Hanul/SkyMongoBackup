require('uppercase-core');

let exec = require('child_process').exec;

let config = JSON.parse(READ_FILE({
	path : 'config.json',
	isSync : true
}));

let configs = config.configs === undefined ? [config] : config.configs;

// 1분에 한번씩 체크
INTERVAL(60, RAR(() => {
	
	let nowCal = CALENDAR();
	
	let todayStr = nowCal.getYear() + '-' + nowCal.getMonth(true) + '-' + nowCal.getDate(true);
	
	// 새벅 5시에 백업
	if (nowCal.getHour() === 5 && nowCal.getMinute() === 0) {
		
		EACH(configs, (config) => {
			
			let dbName = config.dbName;
			let dbHost = config.dbHost === undefined ? '127.0.0.1' : config.dbHost;
			let dbPort = config.dbPort === undefined ? 27017 : config.dbPort;
			let dbUsername = config.dbUsername;
			let dbPassword = config.dbPassword;
			
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
			
			command += ' --out ' + __dirname + '/__BACKUP/' + todayStr;
			
			exec(command, (error) => {
				if (error === TO_DELETE) {
					console.log(CONSOLE_GREEN(todayStr + ' [SkyMongoBackup-' + dbName + '] 백업하였습니다.'));
				} else {
					SHOW_ERROR('SkyMongoBackup-' + dbName, error.toString());
				}
			});
		});
		
		let lastDayCal = CALENDAR(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000));
		let lastDayStr = lastDayCal.getYear() + '-' + lastDayCal.getMonth(true) + '-' + lastDayCal.getDate(true);
		
		// 어제껀 삭제
		REMOVE_FOLDER(__dirname + '/__BACKUP/' + lastDayStr);
	}
}));

console.log('[SkyMongoBackup] 실행중입니다.');
