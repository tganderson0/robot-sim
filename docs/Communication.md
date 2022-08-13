# Robot Sim Communication Protocol

The overarching goal with the project architecture is to allow for the easiest migration between simulation and reality. With this in mind, all projects are assumed to follow the given structure:

![](./img/robot-sim-overall-arch.png)

Because the decision agents are separated from direct communication with a simulation, it *can* translate to an easier switch to real systems. This is assuming that you are keeping sensors and constraints within Unity as realistic as possible.

For each project, if there are any special sensors in use that do not have a prebuilt asset, or for a full physics simulation of a robot not already available, you will need to write a communication layer between the server and the sim/robot. There will be examples of how to write these below, and you can look at the prebuilt examples for how it should work as well.

## Messages

Robot Sim messages are written in JSON (at the time of writing, I am considering moving to Google Protobufs instead, but will use JSON until there is a limit from JSON).

They all follow a common format, which is important for the websocket server to correctly handle it.

```JSON
{
  "method": Method,
  "dataType": string,
  "messageType": string,
  "data": Data,
}
```

## Methods

With this communication protocol, every message should have a 'method', similar to HTTP requests. There are 4 methods:

1. GET
2. POST
3. SUBSCRIBE
4. UNSUBSCRIBE

### GET

This triggers the server to send you a payload of the requested `messageType`. Internally, the server stores all values in a string based hash table, so if you want to get an update on the current LiDAR state, you would send the following message:

```JSON
{
  "method": "GET",
  "messageType": "Lidar"
}
```

Because this is a websocket based server rather than a HTTP request one, you cannot just call a `GET` request and await it, there should be handlers setup for `OnMessage` events. If instead you want to always just have the newest data, you can use the subscription events I will discuss later.

### POST

This is how you can push data to the server, whether than be commands from the decision agents, or sensor feed from the robot/simulation. If you were sending the current relative coordinates of the robot/simulation, the message might look as follows:

```JSON
{
  "method": "POST",
  "dataType": "JSON",
  "messageType": "Location",
  "data": "{\"x\": 24, \"y\": 1, \"z\": 10.05}"
}
```

You may notice that the data is a nested JSON that will have to be parsed 2x, rather than just being the data itself like you'd expect. This is to do with how Unity and a few other languages do their JSON parsing. This allows us to first parse the JSON into a `Message`, after which you can parse the `data` into the correct type, by reading the `messageType` and data type.

### SUBSCRIBE

Subscriptions allow you to request the server to keep you updated anytime a value may change. In my experience so far, this seems to be the most useful. What this allows you to do is keep track of a local copy of the remote data, and fully separate yourself from the communication process. You can do 2 different forms of subscription, which are either an overall subscription, meaning you want to know any and all changes to data, or selective subscriptions, where you can specify which data points you want to stay updated on. Here is an example of each:

**Overall** (will get all updates to any data *including your own commands*, although your own commands do not necessarily need to be handled)
```JSON
{
  "method": "SUBSCRIBE"
}
```

**Specific** (will only get updates to `Location` data updates, along with any other specific subscriptions)
```JSON
{
  "method": "SUBSCRIBE",
  "messageType": "Location"
}
```

### UNSUBSCRIBE

This is just the opposite of `SUBSCRIBE`, if you want to stop getting data for a subscription to everything, or just get rid of a specific one, send the following messages:

**Overall** (will remove you from a subscription to everything. *NOTE: this won't remove specific subscriptions, only overall ones. You need to manually unsubscribe from specific ones*)
```JSON
{
  "method": "UNSUBSCRIBE"
}
```

**Specific** (will remove you from the `Location` data subscription, if you have one)
```JSON
{
  "method": "UNSUBSCRIBE",
  "messageType": "Location"
}
```
