# VantageLabs — Local Development Setup

---

## Table of Contents

1. [Install Docker CLI](#1-install-docker-cli)
2. [Fix Docker Credential Configuration](#2-fix-docker-credential-configuration)
3. [Install and Start Colima](#3-install-and-start-colima)
4. [Verify Docker Context](#4-verify-docker-context)
5. [Switching Docker Contexts](#5-switching-docker-contexts)
6. [If You Install Docker Desktop Later](#6-if-you-install-docker-desktop-later)
7. [Install Node.js via NVM](#7-install-nodejs-via-nvm)
8. [Run PostgreSQL with Docker](#8-run-postgresql-with-docker)
9. [Create Database and User](#9-create-database-and-user)
10. [Install Backend Dependencies](#10-install-backend-dependencies)
11. [PostgreSQL Quick Reference](#11-postgresql-quick-reference)
12. [Running the Project](#12-running-the-project)
13. [Configure VS Code Docker Integration](#13-configure-vs-code-docker-integration)

---

## 1. Install Docker CLI

Install Docker CLI and credential helpers via Homebrew:

```bash
brew install docker docker-credential-helper
```

> **Note:** You may see `docker-credential-desktop not installed` if Docker Desktop was previously installed. This is resolved in the next step.

---

## 2. Fix Docker Credential Configuration

Open your Docker config file:

```bash
nano ~/.docker/config.json
```

Replace its contents with:

```json
{
  "auths": {},
  "credsStore": "osxkeychain", // container tools extension may throw errs: if so remove this and reload vscode
  "currentContext": "colima"
}
```

> The key field here is `"credsStore": "osxkeychain"`.

---

## 3. Install and Start Colima

Install Colima:

```bash
brew install colima
```

Start the Colima VM:

```bash
colima start
```

---

## 4. Verify Docker Context

Check your Docker contexts:

```bash
docker context ls
```

Expected output:

```
NAME       DESCRIPTION                               DOCKER ENDPOINT
colima *   colima                                    unix:///Users/{you}/.colima/default/docker.sock
default    Current DOCKER_HOST configuration         unix:///var/run/docker.sock
```

> The `*` indicates the active context.

---

## 5. Switching Docker Contexts

Switch to Colima:

```bash
docker context use colima
```

Switch to Docker Desktop:

```bash
docker context use desktop-linux
```

---

## 6. If You Install Docker Desktop Later

Choose one of the following options:

**Option A — Use Docker Desktop only:**

```bash
colima stop
brew uninstall colima
```

**Option B — Keep both and switch as needed:**

```bash
docker context use colima
# or
docker context use default
```

**Option C — Remove Docker Desktop settings:**

```bash
rm -rf ~/.docker/desktop
```

---

## 7. Install Node.js via NVM

Install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
```

Load NVM into your shell:

```bash
\. "$HOME/.nvm/nvm.sh"
```

Install Node.js:

```bash
nvm install 25
```

Verify the installation:

```bash
node -v  # v25.7.0
npm -v   # 11.10.1
```

---

## 8. Install Backend Dependencies - pyproject.toml

```bash
pip3 install .
```

---

## 9. PostgreSQL Quick Reference

### Connection

| Action | Command |
|---|---|
| Connect to a database | `psql -U username -d dbname` |
| List databases | `\l` |
| Switch database | `\c dbname` |
| List tables | `\dt` |
| Describe a table | `\d table_name` |
| List users | `\du` |

### Database Management

```sql
CREATE DATABASE dbname;
DROP DATABASE dbname;
```

### Table Management

```sql
CREATE TABLE table_name (...);
DROP TABLE table_name;
ALTER TABLE table_name ADD COLUMN column_name datatype;
ALTER TABLE table_name DROP COLUMN column_name;
```

### CRUD Operations

```sql
-- Insert
INSERT INTO table_name VALUES (...);
INSERT INTO table_name (col1, col2) VALUES (...);

-- Update
UPDATE table_name SET column = value WHERE condition;

-- Delete
DELETE FROM table_name WHERE condition;
```

### Users & Permissions

```sql
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE dbname TO username;
```

---

## 10. Running the Project

Navigate to the project directory:

```bash
cd vantagelabs
```

Build all containers:

```bash
docker compose build --no-cache
```

Or build a specific service:

```bash
docker compose build --no-cache <service>
```

Start containers in detached mode:

```bash
docker compose up -d
```

---

## 11. Configure VS Code Docker Integration

Open the VS Code settings JSON:

```
Cmd + Shift + P → Preferences: Open Settings (JSON)
```

Add the following configuration:

```json
{
  "files.autoSave": "afterDelay",
  "containers.containerClient": "com.microsoft.visualstudio.containers.docker",
  "containers.orchestratorClient": "com.microsoft.visualstudio.orchestrators.dockercompose",
  "docker.host": "unix:///Users/maiklzaki/.colima/default/docker.sock"
}
```

> This ensures VS Code connects to Docker through the Colima socket.