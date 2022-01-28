
## Requirement:

1. Docker
2. Nodejs 14+
3. Git

## Setting
config path = server/config/config.json

1. Change those db setting to you own.
``` Shell
"username": "postgres",
"password": "db_password",
"database": "db_container",
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
CREATE DATABASE welfare2021;
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
npx sequelize-cli db:migrate:undo:all

npx sequelize-cli db:seed:all
npx sequelize-cli db:seed:undo:all
```


## Development:

``` Shell
npm run watch-service
npm run dev
```


## Build Setup:
``` Shell

npm run build
npm run service
```
