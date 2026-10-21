# Running the Full System

This page demonstrates how to build and run the entire system together,
as required.

The backend services are executed using `docker-compose`.
The React Native (Expo) client is then started separately in order to
connect to the backend from a mobile device.

---

## Prerequisites

The following must be installed on the host machine:
- Docker Desktop (includes Docker Engine and Docker Compose)
- Git

All other dependencies (NodeJS, npm, Express, React, MongoDB, etc.)
are installed and managed inside Docker containers during the build process.
No additional software installation is required on the host machine
when running the system via Docker.

## Project Structure

The system consists of multiple services that are executed together
using `docker-compose`:
- **MongoDB** – persistent data storage
- **File Management Server (C++)** – handles file content storage
- **Web API Server (NodeJS)** – REST API and system logic
- **Client Application (React)** – user interface

## Build and Start the System

From the root directory of the repository, run:

```bash
docker compose up -d --build
```
if you want to run the react server app press here
## Run the React Native Client (Expo)

After the backend services are running, the React Native (Expo) client   
must be started separately so it can connect to the backend from a   
mobile device.   

## One-time setup (Windows only)

If this is the first time running npm scripts on Windows, execute once:   
```bash
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
## Install client dependencies   
Navigate to the React Native client directory and install dependencies:   

```bash
cd MyDriveApp
npm install
```
## Find your PC Wi-Fi IPv4 address

The mobile device must be able to reach the backend through your PC’s   
local network address.   

Use the appropriate command for your operating system:   

### Windows:
```
ipconfig
```

Look for IPv4 Address under the Wireless LAN adapter ‏‏Wi-Fi.

### macOS:
```
ipconfig getifaddr en0
```

### Linux:
```
hostname -I
```
Copy the IPv4 address and use it in the next step.   

---
## Start Expo with the correct API URL

Replace <PC-WIFI-IP> with the IPv4 address found above.   

### Windows (PowerShell):
```
$env:EXPO_PUBLIC_API_URL="http://<PC-WIFI-IP>:3000"
npx -y expo start --tunnel
```

### macOS / Linux:
```
export EXPO_PUBLIC_API_URL="http://<PC-WIFI-IP>:3000"
npx -y expo start --tunnel
```
When finished scan the QR with Expo Go or open the web link that will be presented there.


## ❸ Run & Access the Application
After starting the system, the React development server may take a few minutes to fully load.

During this time, opening the application in the browser may display an **error or placeholder screen** (see image below).  
This is expected behavior.

Please wait a short moment and **refresh the page** — once the React server finishes loading, the application will appear normally.
![Application Screenshot](images/error.png)   
Once the system is running, you can access the application in one of the following ways:   
Option 1 — Open in Browser

Open your browser and navigate to:
```
http://localhost:3001
```
Option 2 — Open via Command Line
### Windows PowerShell
```powershell
start http://localhost:3001
```
### Linux / macOS (bash) 
```bash
xdg-open http://localhost:3001
```

---

⬅️ Previous: [01 – System Overview](01-System-Overview.md)  
➡️ Next: [03 – Registration & Login](03-Auth-Flow.md)  
⬅️ Back to: [Wiki Home](README.md)
