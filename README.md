# Robot Sim

This is a project aimed at accelerating the starting time for various robot research projects which require a simulation. The goal is to provide a framework in where you can immediately start testing and designing algorithms, rather than spending a large amount of time with setup. You'll find guides on how to use it linked below.

## Communication Protocol

This project uses a communication protocol over websockets to facilitate the connection between your planner/model and Unity/Robot. See [docs/Communication](./docs/Communication.md) for more info on it.

## Usage

The base server can be found in [websocket-server](./websocket-server/). Its documentation and usage can be found in [docs/websocket-server](./docs/websocket-server.md)