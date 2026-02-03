#!/usr/bin/python3
import os
from urllib.parse import parse_qs

query = parse_qs(os.environ.get("QUERY_STRING", ""))
action = query.get("action", ["view"])[0]
value = query.get("value", [""])[0]

# Clear state
if action == "clear":
    print("Set-Cookie: saved=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/")
    print("Content-Type: text/html\n")
    print("<h1>State Cleared</h1>")
    exit()

# Save state
if action == "save":
    print(f"Set-Cookie: saved={value}; Path=/")
    print("Content-Type: text/html\n")
    print("<h1>State Saved</h1>")
    print(f"<p>Saved value: {value}</p>")
    exit()

# View state
cookie = os.environ.get("HTTP_COOKIE", "")
print("Content-Type: text/html\n")
print("<h1>Saved State</h1>")
print(f"<p>Cookie: {cookie if cookie else 'No state saved'}</p>")
