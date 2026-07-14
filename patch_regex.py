with open('music.py', 'r') as f:
    content = f.read()
content = content.replace("clean_title = re.sub(r'[\\(\\[\\{].*?[\\)\\]\\}]', '', title).strip()", "clean_title = re.sub(r'[[({].*?[]})]', '', title).strip()")
with open('music.py', 'w') as f:
    f.write(content)
