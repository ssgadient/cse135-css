# CSE135 - Team CSS

https://www.cse135-css.site 

**SSH Login and Site Access Credentials:** \
Username: REDACTED \
Password: REDACTED

**Team members:**
- Christian Pacheco
- Stefan Gadient
- Sophie Phung

## Homework 1

**Details of Github auto deploy setup:** \
For the github auto deploy setup, we use a post-receive hook on the server side, which detects a push to the server and automatically updates the website files. Then we create a github action to detect pushes to the repository, which would send an ssh-agent to push new commits to the server. Because we implemented the post-receive hook, we can also manually push to the website without going through github if needed.

**Summary of changes to HTML file in DevTools after compression:** \
The html file now has a header Content-Encoding: gzip and the number of bytes is 592, vs the uncompressed version which is 1382 bytes long. 

**Summary of removing 'server' header:** \
We removed the server header by installing a mod_security package, which allowed for a custom server name to be installed. We were unable to use Header set Server since the server header is protected by Apache. After a lot of configurations to mod_security file, we got the Server header to switch for html files, but any css or js files still leak info about the server. 