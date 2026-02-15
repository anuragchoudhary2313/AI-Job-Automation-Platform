import os
from jinja2 import Template

def generate_latex_resume(data: dict) -> str:
    """
    Generates a LaTeX resume string from a data dictionary using Jinja2.
    """
    latex_template = r"""
    \documentclass{article}
    \begin{document}
    \textbf{ {{ name }} } \\
    {{ email }} | {{ phone }} \\
    
    \section{Experience}
    {% for job in experience %}
    \textbf{ {{ job.company }} } - {{ job.title }} \\
    {{ job.dates }} \\
    \begin{itemize}
    {% for bullet in job.bullets %}
        \item {{ bullet }}
    {% endfor %}
    \end{itemize}
    {% endfor %}
    
    \end{document}
    """
    
    template = Template(latex_template)
    return template.render(data)
