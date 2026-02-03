#!/usr/bin/python3
import os

print("Cache-Control: no-cache")
print("Content-Type: text/plain\n")

for key, value in sorted(os.environ.items()):
    print(f"{key}={value}")
