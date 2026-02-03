#!/usr/bin/env python3

import os
import sys
import time
import socket
import json
import cgi

print("Content-type: text/html\r\n\r\n")

def env(key):
    return os.environ.get(key, "N/A")

# --- Metadata ---
real_method = env("REQUEST_METHOD")
encoding    = env("CONTENT_TYPE")
user_agent  = env("HTTP_USER_AGENT")
remote_ip   = env("REMOTE_ADDR")
hostname    = socket.gethostname()
dt          = time.ctime()

# --- Read input ---
body = ""

form = cgi.FieldStorage()

# Method override (for PUT / DELETE via POST)
intended_method = real_method
if "_method" in form:
    intended_method = form.getvalue("_method")

if real_method == "GET":
    body = env("QUERY_STRING")

elif real_method == "POST":
    if encoding.startswith("application/json"):
        try:
            length = int(env("CONTENT_LENGTH"))
            body = sys.stdin.read(length)
        except:
            body = ""
    else:
        pairs = []
        for key in form:
            if key != "_method":
                pairs.append(f"{key}={form.getvalue(key)}")
        body = "&".join(pairs)

# DELETE intentionally has no body (matches C++)
if intended_method == "DELETE":
    body = ""

# --- Output ---
print("Python Echo Endpoint")
print("{")
print(f"      Method:{intended_method}")
print(f"      Hostname:{hostname}")
print(f"      IP:{remote_ip}")
print(f"      Time:{dt}")
print(f"      Agent:{user_agent}")
print(f"      Encoding:{encoding}")
print(f"      Payload:{body if body else '[No Data]'}")
print("}")
