# Welcome to my (work in progress) blog

This is intended to be the main landing page of the blog. It is a rather simplistic placeholder for now, used only to record potential future work.

So why do all this construction work instead of just using something like github webpages or wordpress?

1. I went to all the trouble to setup a RaspberryPi webserver and I'm going to use it, dammit
2. I wanted to play ~~god~~ server admin
3. I wanted to learn how the basics of the webstack work (nginx, node.js, html, etc.)
4. I like lightweight frameworks. I can understand the internal workings better, I feel more in control, I dislike bloat and extra fancy features I don't want to bother learning. What could be more lightweight than buidling a bug-ridden blog infrastructure from the ground up?


# Why blog

Stay tuned for `blog_posts[1]`

# ToDo:

0. Add an actual index to this page

1. Add index to every blog post
    * automate index creation with a script
    * file name format should be `[0-9]+(-[0-9]+)+ .*\`. `YYYY-MM-DD(-II) Title`. `(-II)` in the off chance I add more than one post in a single day.
    * script should be able to order everything
    * every blog post should link to the previous and next blog entries

2. Move current location and format of files to pure .md files
    * really just to allow my editor to detect that its a markdown file and not an html file for syntax highlighting
    * will need to create an additional script that reads in all the files, appending the two html lines necessary for StrapDown.js, and outputting to some other directory.
    * _deploying_, basically.

3. Add blog redeploy script to run automatically when master updates

4. Add contact information
    * It'd be cool to setup an email server maybe? Even if all it does is provide an alternate email address for me, that I just forward and filter in my main gmail anyways...

5. Add a comment / forum thing
    * This might start straining computational resources of a RaspberryPi. I have no idea of scale, I've never worked in this domain before
    * Hello, SQL injection attacks!

6. Add a 'whoami'/`whois` section

7. Update update script to only update if we are currently on master branch
    * Assumption is that if we're not on master, we're in development mode and don't want stray updates
    * Technically not related to blog, but it's a problem introduced by the new branch I made for developing on a new blog branch
        * Don't develop on master, kids!
    * Might want to look into setting up a local copy of website so I don't need to do all development on the 'production' server...
        * \#im_not_a_professional

8. Add analytics
