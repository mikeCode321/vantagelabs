brew install docker docker-credential-helper
You may come across an issue later on where the Docker CLI will throw an error that 'docker-credential-desktop not installed' which is a result of a misconfiguration (potentially from a previous installation of Docker Desktop). You can correct this by doing the following.

nano ~/.docker/config.json

{
        "auths": {},
        "credsStore": "osxkeychain",
        "currentContext": "colima"
}
Yours might not have the current context set to Colima yet, however, the important one to update is credStore.

brew install colima
Once this is installed, all you need to do is start the Colima VM.

colima start
Now you're good to go! You can test that everything is connected correctly by running. Where the * indicates the active context.

docker context ls
# this will return a list of docker socket configurations, example below

NAME       DESCRIPTION                               DOCKER ENDPOINT                                             KUBERNETES ENDPOINT                    ORCHESTRATOR
colima *   colima                                    unix:///Users/{you}/.colima/default/docker.sock                                          
default    Current DOCKER_HOST based configuration   unix:///var/run/docker.sock                                 https://192.168.64.3:16443 (default)   swarm


Docker context will switch

Docker Desktop will automatically set your active context to:

desktop-linux

Colima uses:

colima

Check with:

docker context ls

Switch manually:

docker context use colima
docker context use desktop-linux

If You Install Docker Desktop Later

You have 3 clean options:

Option A — Use Docker Desktop only
colima stop
brew uninstall colima
Option B — Keep both, switch when needed
docker context use colima
docker context use desktop-linux
Option C — Remove Docker Desktop

Drag to trash + remove settings:

rm -rf ~/.docker/desktop


=============
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 25

# Verify the Node.js version:
node -v # Should print "v25.7.0".

# Verify npm version:
npm -v # Should print "11.10.1".



#####################################
CREATE BACKEND AND POSTGRES SQL
#####################################

docker pull postgres:alpine

docker run --name fastapi-postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres:alpine


CREATE DB AND USER AND EXPOSE TO OUTSIDE A CONTAINER 

docker exec -it fastapi-postgres bash
d4c30f0b575b:/# psql -U postgres
postgres=# create database fastapi_db;
CREATE DATABASE
postgres=# create user myuser with encrypted password 'password';
CREATE ROLE
postgres=# grant all privileges on database fastapi_db to myuser ; 
postgres=# GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;
postgres=# GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myuser;
GRANT
postgres=# \c fastapi_db 
You are now connected to database "fastapi_db" as user "postgres".

fastapi_db=# psql -h localhost -p 5432 postgres 


install pip packages:
pip3 install "fastapi[all]" SQLAlchemy psycopg2-binary


# COMMON POSTGRES CMDS:
Database-Level Commands
psql -U username -d dbname
Connect to a database.

\l
List all databases.

CREATE DATABASE dbname;
Create a new database.

DROP DATABASE dbname;
Delete a database.

\c dbname
Connect to a database from psql.

🔹 Table Commands
\dt
List tables.

CREATE TABLE table_name (...);
Create a table.

DROP TABLE table_name;
Delete a table.

ALTER TABLE table_name ADD COLUMN column_name datatype;
Add a column.

ALTER TABLE table_name DROP COLUMN column_name;
Remove a column.

\d table_name
Describe table structure.

🔹 Data Manipulation (CRUD)

INSERT INTO table_name VALUES (...);
Insert data.

INSERT INTO table_name (col1, col2) VALUES (...);
Insert specific columns.

UPDATE table_name SET column = value WHERE condition;
Update data.

DELETE FROM table_name WHERE condition;
Delete rows.

🔹 User & Permissions

CREATE USER username WITH PASSWORD 'password';

GRANT ALL PRIVILEGES ON DATABASE dbname TO username;

\du — List users/roles




# -------------

docker-compose build --no-cache <empty or specific service>