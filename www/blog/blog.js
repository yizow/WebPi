var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var md = require('markdown-it')()
          .use(require('markdown-it-sup'));
var url = require('url');

var blog_root = 'www/blog/';
var template = 'template.html';

http.createServer(function (request, response) {

  var blog_post = 'index.md'
  var query = url.parse(request.url, true).pathname;
  var matches = query.match(/[^/?]*[^/?]/g);

  if (matches.length > 1) {
    blog_post = matches[1];
  }

  var blog_path = blog_root + blog_post;
  if (!fs.existsSync(blog_path)) {
    response.writeHead(404, {'Content-Type': 'text/html'}).end('404\nNot found');
    return;
  }

  response.writeHead(200, {'Content-Type': 'text/html'});
  var markdown = md.render(fs.readFileSync(blog_path, 'utf-8'));

  ejs.renderFile(blog_root + template, {title: blog_post, markdown: markdown}, {}, (err, str) => {
    if (err) {
      console.log(err);
    } else {
      response.end(str);
    }
  });
}).listen(8083)
