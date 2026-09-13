import sys
import base64

if len(sys.argv) < 3:
    print("Usage: python write_file_helper.py <target_path> <base64_content>")
    sys.exit(1)

target = sys.argv[1]
b64_data = sys.argv[2]
content = base64.b64decode(b64_data).decode('utf-8')

import os
os.makedirs(os.path.dirname(os.path.abspath(target)), exist_ok=True)
with open(target, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Successfully wrote {target}")