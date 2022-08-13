const WebSocket = require('ws');

const PORT = 8080;

const GET = 'GET';
const POST = 'POST';
const SUBSCRIBE = 'SUBSCRIBE';
const UNSUBSCRIBE = 'UNSUBSCRIBE';

const savedValues = {};

const subscriptions = {};
const genericSubscriptions = [];

const wss = new WebSocket.Server({ port: PORT, maxPayload: 1000000 * 1024 }, () => {
  console.log(`Server started on ws://localhost:${PORT}`);
});

wss.on('listening', () => {
  console.log(`Server now listening on ws://localhost:${PORT}`);
})

wss.on('connection', function connection(ws){
  console.log('Client Connected');
  ws.on('message', (data) => handleMessage(ws, data))
});

const handleMessage = (ws, data) => {
  const message = JSON.parse(data.toString('utf-8'));
  if (!message){
    return console.error("ERR: Couldn't parse this message: ", data.toString('utf-8'));
  }

  if (!message.method){
    return console.error("ERR: Message was missing a method: ", message);
  }

  switch(message.method){
    case GET:
      handleGet(ws, message);
      break;
    case POST:
      handlePost(ws, message);
      break;
    case SUBSCRIBE:
      handleSubscribe(ws, message);
      break;
    case UNSUBSCRIBE:
      handleUnsubscribe(ws, message);
      break;
    default:
      console.error("ERR: Invalid method: ", message.method);
  }

}

const handleGet = (ws, data) => {
  ws.send(JSON.stringify({ ...savedValues[data.messageType], method: GET }));
}

const handlePost = (ws, data) => {
  delete data.method;
  savedValues[data.messageType] = { ...data };
  genericSubscriptions.forEach(subscriber => {
    subscriber.send(JSON.stringify({ ...savedValues[data.messageType], method: SUBSCRIBE }));
  });

  if (subscriptions[data.messageType]?.length){
    subscriptions[data.messageType].forEach(subscriber => {
      subscriber.send(JSON.stringify({ ...savedValues[data.messageType], method: SUBSCRIBE }));
    });
  }
}

const handleSubscribe = (ws, data) => {
  if (data.messageType){
    console.log(`SUBSCRIBE: ${data.messageType}`);
    subscriptions[data.messageType] = [ ...(subscriptions[data.messageType] ?? []), ws ];
  }
  else {
    console.log('SUBSCRIBE: ALL');
    genericSubscriptions.push(ws);
  }
}

const handleUnsubscribe = (ws, data) => {
  if (data.messageType){
    console.log(`UNSUBSCRIBE: ${data.messageType}`);
    subscriptions[data.messageType] = subscriptions[data.messageType]?.filter(subscriber => subscriber !== ws) ?? [];
  }
  else {
    console.log('UNSUBSCRIBE: ALL');
    genericSubscriptions = genericSubscriptions.filter(subscriber => subscriber !== ws);
  }
}