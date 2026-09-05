import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
url = 'https://ncert.nic.in/textbook.php'
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req).read().decode('utf-8')

import json
with open('ncert_books.json', 'w', encoding='utf-8') as f:
    f.write(html)
