var http = require('http');

var requestCounter = 0;
var updateCounter = 0;

http.createServer(function (request, response) {
  // Send the HTTP header
  // HTTP Status: 200 : OK
  // Content Type: text/plain
  response.writeHead(200, {'Content-Type': 'text/plain'});

  // Send the response body
  response.write('Hello World. This is Node.js.\n')
  requestCounter++;
  response.write('requestCounter: ' + requestCounter + '\n');
  requestCounter %= 1000;
  response.write('updateCounter: ' + updateCounter);
  response.end();
}).listen(8081);
