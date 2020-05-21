var http = require('http');
var crypto = require('crypto');
var child_process= require('child_process');
var textBody = require('body');

// Github webhooks
http.createServer(function (request, response) {
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
    return;
  });

  response.on('error', (err) => {
    console.error(err);
  });


  const { headers } = request;
  if (
    request.method === 'POST'
    && headers['x-github-event'] === 'push'
    && headers['user-agent'].startsWith('GitHub-Hookshot/')
  ) {
    textBody(request, response, function(err, payload_body) {
      var signature = Buffer.from(headers['x-hub-signature'], 'utf8');

      if (validate_github_webhook(signature, payload_body)) {
        console.log('GitHub Validate Success');

        const pushed_branch = JSON.parse(payload_body).ref;
        console.log('Updated branch: ' + pushed_branch);
        if (pushed_branch === 'refs/heads/master') {
          response.statusCode = 200;

          auto_update();
        } else {
          console.log('Not master branch. Ignoring.');
        }
      } else {
        console.log('Failure');
        response.statusCode = 403;
      }

      response.setHeader('Content-Type', 'application/json');
      response.end();
    })
  } else {
    console.log('github_deploy not from github');
    response.statusCode = 403;
    response.end();
  }
}).listen(8082);


function validate_github_webhook(signature, payload_body) {
  console.log('Running validate function');

  var hmac = crypto.createHmac('sha1', process.env.WEBPI_GITHUB_TOKEN);
  hmac.update(payload_body);

  const digest = Buffer.from('sha1=' + hmac.digest('hex'), 'utf8');
  return crypto.timingSafeEqual(digest, signature);
}


function auto_update() {
  console.log('Auto-updating...');
  child_process.exec('/home/yizow/WebPi/update.sh -a', (err, stdout, stderr) => {
    if (err) {
      return;
    }

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}
