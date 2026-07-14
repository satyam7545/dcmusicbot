import re

with open('music.py', 'r') as f:
    content = f.read()

imports_addition = """
import random
import aiohttp
import urllib.parse
"""
content = content.replace("import os", "import os" + imports_addition)

states_addition = """
# Store voice clients and queues
voice_clients = {}
queues = {}
current_song = {}
loop_state = {} # 'off', 'song', 'queue'
volumes = {} # 0.0 to 2.0 (default 1.0)
"""
content = re.sub(r'# Store voice clients and queues\nvoice_clients = \{\}\nqueues = \{\}', states_addition.strip(), content)

with open('music.py', 'w') as f:
    f.write(content)
