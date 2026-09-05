import sys
html = open('ncert_books.json', 'r', encoding='utf-8').read()
for subj in ['Mathematics', 'Science', 'Social Science']:
    idx = html.find(f'tclass.value==8) && (document.test.tsubject.options[sind].text=="{subj}"')
    if idx != -1:
        print(html[idx:idx+600])
