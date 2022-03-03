
## Requirement:

1. Docker
2. Nodejs 14+
3. Git
4. Python 2+

## Setting
config path = server/config/config.json

1. Change those db setting to you own.
``` Shell
"username": "youruser",
"password": "yourpassword",
"database": "yourdatabase",
"host": "127.0.0.1",
"dialect": "postgres"
```

2. Use Postgresql on Docker 
``` Shell
docker pull postgres
docker run --name pdbname -e POSTGRES_PASSWORD=yourpwd -d -p 5432:5432 postgres
docker ps
docker exec -it [ID] bash

psql -h 127.0.0.1 -p 5432 -U postgres
CREATE DATABASE yourdatabase;
CREATE USER youruser WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE yourdatabase TO youruser;
\q
exit
```

3. Install Node dependencies
``` Bash
npm install

```

4. Init sequelize
``` Shell
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```


## Development:

1. run both 2 script below for develop env
``` Shell
npm run watch-service
npm run dev
```

2. if you want to clear or reset data
``` Shell
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:seed:undo:all
```


## Build Setup:
``` Shell
npm run build
npm run service
```


## Database Backup:

Dump:
``` Shell
docker ps
docker exec -it [id] bash
pg_dump welfare2022 -U postgres -c --if-exists -f [filename]
exit

docker cp [id]:/[filename] ./[filename]
```

Restore:
``` Shell
docker cp [filename] [id]:/[filename]
docker exec -it [id] bash
psql -U postgres -d welfare2022 < [filename]
```
