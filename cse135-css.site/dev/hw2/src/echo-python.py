#!/usr/bin/python3
import os, sys, json, datetime
from urllib.parse import parse_qs

print("Cache-Control: no-cache")
print("Content-Type: application/json\n")

method = os.environ.get("REQUEST_METHOD", "UNKNOWN")
content_type = os.environ.get("CONTENT_TYPE", "")
data = {}

# Read body if present
if method in ["POST", "PUT", "DELETE"]:
    length = int(os.environ.get("CONTENT_LENGTH", 0))
    body = sys.stdin.read(length)

    if "application/json" in content_type:
        try:
            data = json.loads(body)
        except:
            data = {"error": "Invalid JSON"}
    else:
        data = parse_qs(body)
else:
    data = parse_qs(os.environ.get("QUERY_STRING", ""))

response = {
    "method": method,
    "content_type": content_type,
    "received_data": data,
    "time": datetime.datetime.now().isoformat(),
    "hostname": os.environ.get("SERVER_NAME"),
    "ip": os.environ.get("REMOTE_ADDR"),
    "user_agent": os.environ.get("HTTP_USER_AGENT")
}

print(json.dumps(response, indent=2))
