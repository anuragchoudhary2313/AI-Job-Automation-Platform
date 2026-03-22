import logging
import json
from typing import Optional, Any
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.ai import ai_client
from app.core.config import settings
from app.models.log import AgentLog
import time

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = ai_client.get_client()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((json.JSONDecodeError, Exception)),
        reraise=True
    )
    async def _generate_json(self, prompt: str, model: str) -> dict:
        """
        Helper to generate and validate JSON response.
        Retries on JSON errors or API failures.
        """
        response_text = await self.generate_text(prompt, model=model, json_mode=True)
        # Validate and parse JSON
        return json.loads(response_text)

    async def generate_text(self, prompt: str, model: str = None, json_mode: bool = False) -> str:
        """
        Generates text using Groq (via OpenAI SDK) asynchronously.
        """
        client = ai_client.get_async_client()
        if not client:
            return self._mock_response(prompt, json_mode=json_mode)
            
        try:
            # use fast model by default if not specified
            model_to_use = model or settings.AI_MODEL_FAST
            
            kwargs = {
                "model": model_to_use,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            }
            
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            start_time = time.time()
            response = await client.chat.completions.create(**kwargs)
            duration = (time.time() - start_time) * 1000
            
            content = response.choices[0].message.content or ""
            
            # Log to AgentLog
            try:
                await AgentLog(
                    agent_name="AIService",
                    input={"prompt": prompt, "model": model_to_use, "json_mode": json_mode},
                    output={"content": content},
                    execution_time_ms=duration,
                    # user_id should be passed if available, but for now we log globally
                ).insert()
            except Exception as log_err:
                logger.error(f"Failed to log AI call: {log_err}")
                
            return content
        except Exception as e:
            logger.error(f"AI API error: {e}")
            return self._mock_response(prompt, json_mode=json_mode)



    async def generate_structured_resume(self, job_description: str) -> dict:
        prompt = f"""
        You are an AI job automation assistant. Your goal is to rewrite and optimize resume content to match the provided job description.
        
        Job Description:
        {job_description[:2000]}...
        
        Output valid JSON with the following structure:
        {{
            "summary": "Professional summary optimized for the job",
            "skills": ["List", "of", "relevant", "skills"],
            "experience": [
                {{
                    "title": "Job Title",
                    "content": ["Optimized bullet point 1", "Optimized bullet point 2"]
                }}
            ],
            "education": [
                {{
                     "title": "Degree / University",
                     "content": ["Details"]
                }}
            ]
        }}
        """
        return await self._generate_json(prompt, model=settings.AI_MODEL_FAST)

    async def generate_resume_content(self, job_description: str) -> str:
        prompt = f"""
        You are an AI job automation assistant. Your goal is to rewrite and optimize resume bullet points to match the provided job description.
        Output only the optimized resume content.
        
        Job Description:
        {job_description[:2000]}...
        """
        return await self.generate_text(prompt, model=settings.AI_MODEL_FAST)

    async def generate_latex_resume(self, job_description: str, resume_text: str = None) -> str:
        """Generates a Jake's Resume LaTeX resume tailored to the job description."""
        client = ai_client.get_async_client()
        if not client:
            return self._mock_latex_response()
            
        template_format = self._mock_latex_response()
        
        prompt = f"""
        You are an expert LaTeX resume writer. Format the user's resume perfectly using the provided LaTeX template structure. 
        Optimize the content beautifully to match the full extent of this job description:
        
        Job Description:
        {job_description[:2000]}...
        """
        
        if resume_text:
            prompt += f"""
        
        IMPORTANT: Base the resume on the following user details and experience. Extract the relevant information from this text and map it directly into the LaTeX template structure:
        
        User's Current Resume:
        {resume_text[:4000]}...
        """
        else:
            prompt += "\n\n(No current resume provided. Generate realistic placeholder content optimized for the job.)"
            
        prompt += f"""
        
        TEMPLATE STRUCTURE TO USE:
        =============================
        {template_format}
        =============================
        
        Output ONLY the valid raw LaTeX code string, starting from \\documentclass and ending with \\end{{document}}.
        Ensure that it compiles cleanly with Tectonic (XeTeX). Do NOT use \\input{{glyphtounicode}} or \\pdfgentounicode=1.
        Do NOT wrap output with ```latex or anything else.
        Produce a professional 1-page template using the placeholders and structural commands shown in the TEMPLATE STRUCTURE. Don't add any introductory or concluding remarks.
        """
        response_text = await self.generate_text(prompt, model=settings.AI_MODEL_SMART)
        
        if response_text.startswith("[MOCK AI RESPONSE]"):
            return self._mock_latex_response()
            
        response_text = response_text.strip()
        if response_text.startswith("```latex"):
            response_text = response_text.replace("```latex\n", "", 1)
        if response_text.startswith("```"):
            response_text = response_text.replace("```\n", "", 1)
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return response_text.strip()

    async def generate_resume_bullets(self, bullet: str, job_description: str) -> str:
        prompt = f"""
        Rewrite the following resume bullet point to make it more impactful and relevant to the job description.
        
        Job Description:
        {job_description[:500]}...
        
        Original Bullet:
        {bullet}
        
        Optimized Bullet:
        """
        return await self.generate_text(prompt)

    async def generate_structured_cover_letter(self, resume_summary: str, job_description: str, company_name: str) -> dict:
        prompt = f"""
        Write a professional cover letter for {company_name}.
        
        Job Description:
        {job_description[:1000]}...
        
        Resume Summary:
        {resume_summary}
        
        Output valid JSON with the following structure:
        {{
            "recipient": "Hiring Manager",
            "company": "{company_name}",
            "content": "The body of the cover letter...",
            "tone": "professional"
        }}
        """
        return await self._generate_json(prompt, model=settings.AI_MODEL_SMART)

    async def generate_cover_letter(self, resume_summary: str, job_description: str, company_name: str) -> str:
        prompt = f"""
        Write a professional cover letter for {company_name}.
        
        Job Description:
        {job_description[:1000]}...
        
        Resume Summary:
        {resume_summary}
        
        Cover Letter:
        """
        return await self.generate_text(prompt, model=settings.AI_MODEL_SMART)

    async def personalize_email(self, template: str, company_name: str, role: str) -> str:
        prompt = f"""
        Personalize the following email template for {company_name} hiring a {role}.
        Keep it professional and concise.
        
        Template:
        {template}
        
        Personalized Email:
        """
        return await self.generate_text(prompt)

    async def parse_resume(self, resume_text: str) -> dict:
        """
        Parse raw resume text into structured JSON.
        """
        prompt = f"""
        You are an expert HR data parser. Extract structured information from the following resume text.
        
        Resume Text:
        {resume_text[:4000]}
        
        Output valid JSON with the following structure:
        {{
            "personal_info": {{
                "name": "Full Name",
                "email": "email@example.com",
                "phone": "Phone Number",
                "links": ["LinkedIn", "GitHub", "Portfolio"]
            }},
            "summary": "Professional summary",
            "skills": ["Skill 1", "Skill 2"],
            "experience": [
                {{
                    "company": "Company Name",
                    "title": "Job Title",
                    "period": "Start - End",
                    "responsibilities": ["Bullet 1", "Bullet 2"]
                }}
            ],
            "education": [
                {{
                    "institution": "University Name",
                    "degree": "Degree Earned",
                    "year": "Year"
                }}
            ]
        }}
        """
        return await self._generate_json(prompt, model=settings.AI_MODEL_FAST)

    async def evaluate_job_match(self, job_description: str, user_profile: str) -> dict:
        """
        AI Decision classification for job matching.
        """
        prompt = f"""
        You are an expert technical recruiter and AI agent evaluating if a candidate matches a job.
        Evaluate the job description against the provided user profile.
        
        User Profile:
        {user_profile[:1000]}
        
        Job Description:
        {job_description[:2000]}
        
        Requirements:
        1. Output valid JSON only.
        2. Set "decision" to exactly "apply", "skip", or "maybe". Default to "skip" if unsure.
        3. Set "confidence" to a float between 0.0 and 1.0.
        4. Set "reason" to a concise string explaining the decision.
        
        Output format:
        {{
            "decision": "skip",
            "confidence": 0.85,
            "reason": "Candidate lacks required cloud architecture experience."
        }}
        """
        try:
            result = await self._generate_json(prompt, model=settings.AI_MODEL_FAST)
            # Safe parsing
            decision = result.get("decision", "skip").lower()
            if decision not in ["apply", "skip", "maybe"]:
                decision = "skip"
            
            return {
                "decision": decision,
                "confidence": float(result.get("confidence", 0.0)),
                "reason": str(result.get("reason", "No reason provided."))
            }
        except Exception as e:
            logger.error(f"AI Decision match failed: {e}")
            return {"decision": "skip", "confidence": 0.0, "reason": "AI evaluation failed."}

    async def classify_recruiter_email(self, email_body: str) -> dict:
        """
        AI Classifier isolating unstructured email replies into distinct JSON statuses.
        """
        prompt = f"""
        You are an expert HR parser analyzing recruiter replies.
        Read the following email body and classify the recruiter's intent.
        
        Email Body:
        {email_body[:3000]}
        
        Requirements:
        1. Output valid JSON only.
        2. Set "classification" to exactly: "interview", "rejected", or "received".
           - "interview": They want to schedule a call, interview, or sent an assessment.
           - "rejected": They declined the application or moved forward with others.
           - "received": They just acknowledged receipt, auto-reply, or asked to wait.
        3. Set "company_name" to the extracted name of the company if discernible (else null).
        
        Output format:
        {{
            "classification": "rejected",
            "company_name": "Google",
            "summary": "Standard rejection template"
        }}
        """
        try:
            result = await self._generate_json(prompt, model=settings.AI_MODEL_FAST)
            classification = result.get("classification", "received").lower()
            if classification not in ["interview", "rejected", "received"]:
                classification = "received"
            
            return {
                "classification": classification,
                "company_name": result.get("company_name"),
                "summary": str(result.get("summary", ""))
            }
        except Exception as e:
            logger.error(f"AI Email Classification failed: {e}")
            return {"classification": "received", "company_name": None, "summary": "Failed to parse."}

    def _mock_response(self, prompt: str, json_mode: bool = False) -> str:
        """Fallback mock response."""
        logger.warning("Returning mock AI response.")
        
        if json_mode:
            return json.dumps({
                "summary": "This is a mock AI summary generated because the AI service is currently unavailable or not configured. Please check your API keys.",
                "skills": ["Mock Skill 1", "Mock Skill 2", "Python", "React", "FastAPI"],
                "experience": [
                    {
                        "title": "Software Engineer (Mock)",
                        "content": [
                            "Optimized backend performance by 20% using asyncio.",
                            "Developed a scalable frontend architecture with React."
                        ]
                    }
                ],
                "education": [
                    {
                        "title": "Bachelor of Science in Computer Science (Mock University)",
                        "content": ["Graduated with Honors", "Focus on AI and Distributed Systems"]
                    }
                ],
                "projects": [
                    {
                        "title": "AI Job Automation Platform",
                        "content": ["Built a full-stack SaaS application for automating job applications."]
                    }
                ],
                "recipient": "Hiring Manager",
                "company": "Example Corp",
                "content": "Dear Hiring Manager,\n\nI am writing to express my interest in the position. [Mock Cover Letter Content]\n\nSincerely,\n[Your Name]",
                "tone": "professional",
                "personal_info": {
                        "name": "John Doe (Mock)",
                        "email": "john@example.com", 
                        "phone": "123-456-7890",
                        "links": ["linkedin.com/in/johndoe"]
                }
            })
            
        return f"[MOCK AI RESPONSE] Processed: {prompt[:50]}..."

    def _mock_latex_response(self) -> str:
        """Returns the optimized default LaTeX resume template."""
        return r'''\documentclass[letterpaper,11pt]{article}

% --- PACKAGES ---
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{multicol}
\usepackage{graphicx}

% --- PAGE SETUP ---
\pagestyle{fancy}
\fancyhf{} % clear all header and footer fields
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-0.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% --- SECTION FORMATTING ---
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large\bfseries
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

% --- CUSTOM COMMANDS ---
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

% -----------------------------------------------------------
% --- DOCUMENT STARTS HERE ---
% -----------------------------------------------------------
\begin{document}

% --- HEADING ---
\begin{center}
    \textbf{\Huge \scshape Anurag Choudhary} \\ \vspace{3pt}
    \small 
    \faMobile \hspace{.5pt} \href{tel:917489542136}{+91 7489542136} $|$ 
    \faEnvelope \hspace{.5pt} \href{mailto:anuragchoudhary603@gmail.com}{\underline{anuragchoudhary603@gmail.com}} $|$ 
    \faLinkedin \hspace{.5pt} \href{https://www.linkedin.com}{\underline{LinkedIn}} $|$
    \faGithub \hspace{.5pt} \href{https://github.com}{\underline{GitHub}}
\end{center}

% --- OBJECTIVE ---
\section{Objective}
\small{Aspiring Full-Stack Developer with hands-on MERN experience, skilled in C++, JavaScript, PHP, and building responsive, CMS-driven web applications using WordPress, REST APIs, and scalable backend systems.}
\vspace{-2pt}

% --- EDUCATION ---
\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Acropolis Institute of Technology \& Research}{Indore, India}
      {Bachelor of Technology (B.Tech) in Information Technology; \textbf{CGPA: 6.29/10}}{2022 -- 2026}
    \resumeSubheading
      {Pahal A School}{Dhamnod, India}
      {Senior Secondary (12th); \textbf{Percentage: 70.6\%}}{2020 -- 2021}
  \resumeSubHeadingListEnd

% --- TECHNICAL SKILLS ---
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Programming Languages}{: C++, JavaScript, PHP, Java, MySQL} \\
     \textbf{Frontend}{: React.js, HTML5, CSS3, Responsive UI, Theme Customization} \\
     \textbf{Backend}{: Node.js, Express.js, MongoDB, REST APIs} \\
     \textbf{DevOps \& Tools}{: AWS (EC2, S3, IAM), Git, GitHub, CI/CD Basics, WordPress}
    }}
 \end{itemize}

% --- EXPERIENCE ---
\section{Experience}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Frontend Development Intern}{Aug 2023 -- Sep 2023}
      {CipherByte Technologies}{Remote}
      \resumeItemListStart
        \resumeItem{Developed responsive and SEO-friendly web pages using HTML, CSS, JavaScript, and CMS concepts.}
        \resumeItem{Customized UI components and layouts similar to WordPress themes.}
        \resumeItem{Collaborated using Git and Agile practices to deliver production-ready features.}
      \resumeItemListEnd
  \resumeSubHeadingListEnd

% --- PROJECTS ---
\section{Projects}
    \resumeSubHeadingListStart
      \resumeProjectHeading
          {\textbf{Net Shield – Network Security Analyzer} $|$ \emph{React, Python, MongoDB}}{}
          \resumeItemListStart
            \resumeItem{Developed a real-time network security analyzer to monitor, detect, and report malicious activity.}
          \resumeItemListEnd
      \resumeProjectHeading
          {\textbf{Volunteer Opportunity Exchange Platform} $|$ \emph{PHP, React.js, Node.js, MySQL}}{}
          \resumeItemListStart
            \resumeItem{Built a CMS-style full-stack platform enabling user management, content posting, and secure data handling.}
          \resumeItemListEnd
    \resumeSubHeadingListEnd

% --- ACHIEVEMENTS ---
\section{Achievements \& Certifications}
 \begin{itemize}[leftmargin=0.15in, label={$\bullet$}]
    \small{
      \item GeeksforGeeks: 3-Star Coder in C++ (Rating: 1669).
      \item LeetCode: Solved 100+ Data Structures and Algorithm problems.
      \item Cisco Certified: Introduction to Cybersecurity.
    }
 \end{itemize}

\end{document}'''

# Global instance
ai_service = AIService()
