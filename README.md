# CSE135 - Team CSS

Homepage: https://www.cse135-css.site 

Test Site: https://test.cse135-css.site/

Database Reporting Site: https://reporting.cse135-css.site/

**SSH Login and Site Access Credentials:** \
Server IP: REDACTED \
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

## Homework 2

Approach 3: Free Choice Discussion - In evaluating Userpilot’s reporting and analytics, I considered the types of data available, including user engagement metrics, feature adoption, and onboarding completion rates, as well as whether the platform provides real-time insights for product decision-making. I chose this service because it offers comprehensive visibility into user behavior, pre-built dashboards that track adoption and engagement, and professional support to help optimize user experiences. During the evaluation, I explored the Feature Adoption dashboard, noting how actions are categorized and visualized, and found the charts and graphs intuitive and actionable. Overall, the service provided clear, real-time insights that help identify friction points, monitor user activity, and make data-driven decisions, making it a valuable tool for improving product adoption and user success.

## Homework 3

**Changes made to collector.js beyond ideas:**

Beyond ideas from the collector tutorial from the CSE135.site, in collector.js images and CSS are checked using runtime detection because there are no built-in browser flags for either. For images, the script creates a small Image object and assigns it a valid source. If the onload event fires, images are enabled, and if onerror fires, they are blocked. For CSS, the script dynamically creates a test element, applies a style (like display: none), and then uses getComputedStyle() to verify that the style was actually applied. These checks were added to the initial static page-load event so the environment information (image and CSS support) could be included in the data sent to the server and stored in the database.

## Homework 4

**Changes made to collector.js beyond ideas:**

Part 2: app.js acts as the frontend  and user interface which requests data from another file metrics.php, acts as the backend and fetcher of data which then connects back to app.js in order to display the data in the user interface as an HTML table