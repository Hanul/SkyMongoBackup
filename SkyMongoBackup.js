require('uppercase-core');

let exec = require('child_process').exec;

let JSZip = require('jszip');
let Request = require('request');

let config = JSON.parse(READ_FILE({
	path : 'config.json',
	isSync : true
}));

let configs = config.configs === undefined ? [config] : config.configs;

let checkIsAllowedFolderName = (name) => {
	//REQUIRED: name

	return (
		// hide folder
		name[0] !== '.' &&

		// node.js module
		name !== 'node_modules' &&

		// not_load
		name !== 'not_load' &&

		// deprecated
		name !== 'deprecated' &&

		// _ folder
		name[0] !== '_'
	);
};

let scanFolder = (path, folderPath, func) => {
	//REQUIRED: path
	//REQUIRED: folderPath
	//REQUIRED: func

	if (CHECK_FILE_EXISTS({
		path : path,
		isSync : true
	}) === true) {

		FIND_FILE_NAMES({
			path : path,
			isSync : true
		}, {

			error : () => {
				// ignore.
			},

			success : (fileNames) => {
				EACH(fileNames, (fileName) => {
					func(path + '/' + fileName, folderPath + '/' + fileName);
				});
			}
		});

		FIND_FOLDER_NAMES({
			path : path,
			isSync : true
		}, {

			error : () => {
				// ignore.
			},

			success : (folderNames) => {
				EACH(folderNames, (folderName) => {
					if (checkIsAllowedFolderName(folderName) === true) {
						scanFolder(path + '/' + folderName, folderPath + '/' + folderName, func);
					}
				});
			}
		});
	}
};

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
			
			let backupServerHost = config.backupServerHost;
			let backupServerPort = config.backupServerPort;
			
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
					
					if (backupServerHost !== undefined && backupServerPort !== undefined) {
						
						let zip = JSZip();
						
						scanFolder(__dirname + '/__BACKUP/' + todayStr, '', (fromPath, toPath) => {
							
							zip.file(toPath, READ_FILE({
								path : fromPath,
								isSync : true
							}));
						});
						
						zip.generateAsync({
							type : 'nodebuffer'
						}).then((content) => {
							
							let req = Request.post('http://' + backupServerHost + ':' + backupServerPort + '/__BACKUP', (error) => {
								if (error !== TO_DELETE) {
									SHOW_ERROR('SkyMongoBackup', error.toString());
								}
							});
							
							req.form().append('file', content, {
								filename : todayStr + '.zip',
								contentType : 'application/zip'
							});
						});
					}
				}
				
				else {
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

EACH(configs, (config) => {
	
	let backupPort = config.backupPort;
	
	if (backupPort !== undefined) {
		
		WEB_SERVER({
			port : backupPort,
			uploadURI : '__BACKUP',
			uploadPath : __dirname + '/__BACKUP',
			
			// 최대 100GB
			maxUploadFileMB : 102400
		}, {
			uploadOverFileSize : (params, maxUploadFileMB, requestInfo, response) => {
				SHOW_ERROR('SkyMongoBackup-' + dbName, '백업 파일의 용량이 너무 큽니다.');
			},
			uploadSuccess : (params, fileDataSet, requestInfo, response) => {
				
				let nowCal = CALENDAR();
				
				let todayStr = nowCal.getYear() + '-' + nowCal.getMonth(true) + '-' + nowCal.getDate(true);
				
				EACH(fileDataSet, (fileData) => {
					
					MOVE_FILE({
						from : fileData.path,
						to : __dirname + '/__BACKUP/' + todayStr + '.zip'
					});
					
					console.log(CONSOLE_GREEN(todayStr + ' [SkyMongoBackup-' + dbName + '] 백업 파일 업로드가 완료되었습니다.'));
				});
			}
		});
	}
});

console.log('[SkyMongoBackup] 실행중입니다.');
