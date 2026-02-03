#!/usr/bin/python3
import json, os, datetime

print("Cache-Control: no-cache")
print("Content-Type: application/json\n")

response = {
    "message": "Hello JSON World!",
    "team": "Christian, Sophie and Stefan",
    "language": "Python",
    "generated_at": datetime.datetime.now().isoformat(),
    "ip": os.environ.get("REMOTE_ADDR", "Unknown")
}

print(json.dumps(response, indent=2))
