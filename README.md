# SkyMongoBackup
서버 시간으로 매일 새벽 5시에 데이터베이스를 백업합니다.

## 설정
`config.json` 파일을 수정합니다.
```json
{
	"dbName": "test",
	"dbHost": "127.0.0.1",
	"dbPort": 27017,
	"dbUsername": "test",
	"dbPassword": "1234",
	"collections": [
		"MyProject.User",
		"MyProject.User__History"
	]
}
```
* `dbName`는 필수이며, 나머지 설정들은 선택입니다.
* `collections`를 설정하게 되면 모든 데이터가 아닌 지정한 Collection들의 데이터만 백업하게 됩니다.

## 다중 설정
`configs`로 여러 설정을 추가할 수 있습니다.
```json
{
	"configs" : [{
		"dbName": "test",
		"dbHost": "127.0.0.1",
		"dbPort": 27017,
		"dbUsername": "test",
		"dbPassword": "1234",
		"collections": [
			"MyProject.User",
			"MyProject.User__History"
		]
	}, {
		"dbName": "test2",
		"dbHost": "127.0.0.1",
		"dbPort": 27017,
		"dbUsername": "test2",
		"dbPassword": "1234",
		"collections": [
			"MyProject2.User",
			"MyProject2.User__History"
		]
	}]
}
```

## 실행
```
node SkyMongoBackup.js
```
```
forever start SkyMongoBackup.js
```

## 라이센스
[MIT](LICENSE)

## 작성자
[Young Jae Sim](https://github.com/Hanul)
