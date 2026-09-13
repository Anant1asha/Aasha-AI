import json
with open('c:/Users/admin/Downloads/NGO AI LLM/Aasha-AI/aasha-pipeline-with-master-json/template/v5-engine-template.html', 'r', encoding='utf-8') as f:
    template = f.read()
nodes = [{'title': 'The Pizza Problem & Variables', 'emoji': '??', 'steps': [{'t': 'intro', 'icon': '??', 'title': 'The Pizza Problem', 'sub': 'Imagine buying pizza for an unknown number of friends.', 'hero': ''}, {'t': 'text', 'title': 'Unknown Numbers', 'text': 'If a pizza costs 200, the cost for 1 friend is 200, for 2 friends is 400. What if there are n friends? The cost is 200 * n, or 200n.'}, {'t': 'text', 'title': 'Variable', 'text': 'A letter used to represent an unknown number is called a variable. In 200n, n is the variable.'}, {'t': 'quiz', 'q': {'q': 'In the expression 200n, what does n represent?', 'opts': [{'t': 'The unknown number of friends', 'c': True, 'm': ''}, {'t': 'The cost of one pizza', 'c': False, 'm': '200 is the cost of one pizza, not n.'}, {'t': 'The total cost', 'c': False, 'm': '200n is the total cost, n is just the number of friends.'}]}}, {'t': 'progress', 'xp': 25, 'next': True}]}, {'title': 'Terms & Coefficients', 'emoji': '??', 'steps': [{'t': 'intro', 'icon': '??', 'title': 'Terms & Coefficients', 'sub': 'Breaking down an algebraic expression.', 'hero': ''}, {'t': 'text', 'title': 'Terms', 'text': 'Parts of an expression separated by + or - signs are called terms. For example, in 200n + 50, the terms are 200n and 50.'}, {'t': 'text', 'title': 'Coefficient', 'text': 'A number multiplied by a variable is called a coefficient. In 200n, 200 is the coefficient.'}, {'t': 'quiz', 'q': {'q': 'What is the coefficient in the term 5x?', 'opts': [{'t': '5', 'c': True, 'm': ''}, {'t': 'x', 'c': False, 'm': 'x is the variable, not the coefficient.'}, {'t': '5x', 'c': False, 'm': '5x is the whole term, the coefficient is just the number.'}]}}, {'t': 'progress', 'xp': 25, 'next': False}]}]
template = template.replace('{{CHAPTER_TITLE}}', 'Algebraic Expressions')
template = template.replace('{{WM_JSON}}', '{}')
template = template.replace('{{CONN_JSON}}', '{}')
template = template.replace('{{LEVELS_JSON}}', '[{"name":"Beginner","xp":0},{"name":"Learner","xp":100},{"name":"Scholar","xp":200}]')
template = template.replace('{{BADGES_JSON}}', '[]')
template = template.replace('{{WE_JSON}}', '{}')
template = template.replace('{{SOLVE_JSON}}', '{}')
template = template.replace('{{STORAGE_KEY}}', 'algebraic_expr_v1')
template = template.replace('{{CONTENT_JSON}}', json.dumps(nodes))
with open('c:/Users/admin/Downloads/NGO AI LLM/Aasha-AI/chapters/algebraic_expressions.html', 'w', encoding='utf-8') as f:
    f.write(template)
print('Fixed successfully')
