with open('music.py', 'r') as f:
    content = f.read()

content = content.replace("import urllib.parse", "import urllib.parse\nimport re")

with open('music.py', 'w') as f:
    f.write(content)
