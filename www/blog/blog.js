var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var md = require('markdown-it')()
          .use(require('markdown-it-sup'));
var url = require('url');

var blog_root = 'www/blog/';
var template = 'template.html';

// YYYY_MM_DD_BLOG_TITLE.md
var blog_format = /([0-9]{4}_[0-9]{2}_[0-9]{2}_(.*)\.md)$/;

// Blog proper
http.createServer(function (request, response) {
  var blog_post = '0000_00_00_index.md'
  var query = url.parse(request.url, true).pathname;

  var is_indexed = /blog_posts\[([0-9]*)\]/;
  if (is_indexed.test(query)) {
    var index = parseInt(query.match(is_indexed)[1]);
    // get blog_post by index
    blog_posts = blog_posts_by_name();
    if (index < blog_posts.length) {
      blog_post = blog_posts[index];
  }

  if (blog_format.test(query)) {
      blog_post = query.match(blog_format)[1];
    }
  }

  var blog_path = blog_root + blog_post;
  if (!fs.existsSync(blog_path)) {
    response.writeHead(404, {'Content-Type': 'text/html'}).end('404\nNot found');
    return;
  }

  response.writeHead(200, {'Content-Type': 'text/html'});
  var markdown = md.render(fs.readFileSync(blog_path, 'utf-8'));

  ejs.renderFile(blog_root + template, {title: blog_post.match(blog_format)[2], markdown: markdown}, {}, (err, str) => {
    if (err) {
      console.log(err);
    } else {
      response.end(str);
    }
  });
}).listen(8083);


// Recipes
var recipe_root = 'www/';

http.createServer(function (request, response) {
  var query = url.parse(request.url, true).pathname;
  query = recipe_root + query;

  if (!fs.existsSync(query)) {
    response.writeHead(404, {'Content-Type': 'text/html'}).end('404\nNot found');
    return;
  }

  response.writeHead(200, {'Content-Type': 'text/html'});
  var markdown = md.render(fs.readFileSync(query, 'utf-8'));

  ejs.renderFile(blog_root + template, {title: query.match(/\/([^\/]*)\.md$/)[1], markdown: markdown}, {}, (err, str) => {
    if (err) {
      console.log(err);
    } else {
      response.end(str);
    }
  });
}).listen(8084);


function blog_posts_by_name() {
  return fs.readdirSync(blog_root, {withFileTypes: true})
            .filter(blog_post => blog_post.isFile() && blog_format.test(blog_post.name))
            .map(dirent => dirent.name);
}
