# System Overview

The project is a simplified implementation of a cloud-based file management system,
inspired by Google Drive.

The system is composed of several components that work together as a single
integrated application.

## Components

### Web Server (NodeJS – MVC Architecture)
The Web Server is the core of the system.
It exposes a RESTful API used by the client applications.

Main responsibilities:
- User registration and authentication
- Managing files and folders metadata
- Managing permissions
- Handling search requests
- Communicating with the File Management Server for file content operations

The server is implemented using NodeJS and Express, following the MVC architecture.

### File Management Server
The File Management Server is responsible for handling file content operations,
such as storing and retrieving file data.

The Web Server does not store file data directly. Instead, it communicates with
the File Management Server using sockets, and delegates file-related operations
such as creation, retrieval, deletion, and search to it.

### Client Applications
The system includes client applications that communicate with the Web Server API:
- A Web client implemented using React.
- A Native React client.

The clients display dynamic data received from the server and allow users to
perform operations on files and folders.

### Database
The Web Server uses MongoDB to persist application data, including users,
files, folders, and permissions.

## Deployment
All components are built and executed together using `docker-compose`,
allowing the entire system to be started with a single command.

---

➡️ Next: [02 – Run the System](02-Run-The-System.md)  
⬅️ Back to: [Wiki Home](README.md)

