console.log('testing');
var http = require("http");

http.createServer(function (request, response) {
  // Send the HTTP header
  // HTTP Status: 200 : OK
  // Content Type: text/plain
  response.writeHead(200, {'Content-Type': 'text/plain'});

  // Send the response body
  response.end('Hello World. This is Node.js.\n');
}).listen(8081);

/*const { exec } = require('child_process');
exec('sudo /home/yizow/test.sh && echo "done" ', (err, stdout, stderr) => {
  if (err) {
    return;
  }

  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
*/

