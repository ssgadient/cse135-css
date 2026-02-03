#!/usr/bin/python3

import os
import datetime

print("Cache-Control: no-cache")
print("Content-Type: text/html\n")

print("<!DOCTYPE html>")
print("<html>")
print("<head>")
print("<title>Hello CGI World (Python)</title>")
print("</head>")
print("<body>")

print("<h1 align='center'>Hello HTML World</h1><hr/>")
print("<p>Hello HTML World! - Christian, Sophie and Stefan</p>")
print("<p>This page was generated with the Python programming language and by Team CSS</p>")

current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
print(f"<p>This program was generated at: {current_time}</p>")

ip_address = os.environ.get("REMOTE_ADDR", "Unknown")
print(f"<p>Your current IP Address is: {ip_address}</p>")

print("</body>")
print("</html>")
