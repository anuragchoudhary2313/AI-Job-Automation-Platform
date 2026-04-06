import logging
import json
import re
from typing import Optional, Any, Dict, List
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

    async def generate_text(
        self,
        prompt: str,
        model: str = None,
        json_mode: bool = False,
        temperature: float = 0.7,
    ) -> str:
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
                "temperature": temperature,
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
        """Generate a one-page ATS-optimized LaTeX resume tailored to a job description."""
        client = ai_client.get_async_client()
        if not client:
            return self._mock_latex_response()
            
        template_format = self._mock_latex_response()
        
        prompt = f"""
        You are an expert ATS resume strategist and LaTeX resume writer.
        Your goal: produce a HIGH-MATCH, one-page resume in clean ATS-safe LaTeX.

        TARGET OUTCOME (best effort):
        - ATS alignment target: 90+ match quality for this JD using exact role keywords, tools, and domain terms.
        - Final resume must be exactly ONE PAGE when compiled.
        - The page should look complete and content-rich; avoid large blank areas.

        ATS AND CONTENT RULES (strict):
        1. Mirror the job title and seniority intent in the summary and experience phrasing.
        2. Include at least 15 relevant JD keywords naturally across Summary, Skills, Experience, and Projects.
        3. Prioritize hard skills from JD (frameworks, cloud, databases, languages, tooling) before soft skills.
        4. Every experience/project bullet must start with a strong action verb and include impact/metric when possible.
        5. Avoid vague claims; be specific and scannable.
        6. Keep ATS-safe formatting only: plain section titles, standard bullets, no tables for body content, no icons in bullets.
        7. Never fabricate impossible credentials. If details are missing, generalize safely without fake company claims.

        ONE-PAGE DENSITY RULES (strict):
        1. Include enough meaningful content to visually fill one page without overflow to page 2.
        2. Use concise, high-density bullets (typically 1 line; max 2 lines).
        3. Keep 4-6 bullets for latest/relevant role, 2-4 for other roles, and 2-4 per key project.
        4. Ensure sections are balanced so there is no large unused white space near the bottom.
        5. If content is short, strengthen Summary, Skills detail, and project impact bullets to fill the page responsibly.

        LATEX RULES (strict):
        1. Output valid raw LaTeX only.
        2. Start with \\documentclass and end with \\end{{document}}.
        3. Ensure it compiles with Tectonic (XeTeX).
        4. Do NOT use \\input{{glyphtounicode}} or \\pdfgentounicode=1.
        5. Do NOT wrap output in markdown fences.

        Job Description:
        {job_description[:2500]}...
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

        TEMPLATE STRUCTURE TO FOLLOW EXACTLY:
        =============================
        {template_format}
        =============================

        IMPORTANT FINAL CHECKS BEFORE OUTPUT:
        - Keep it on one page.
        - Ensure dense but readable content that covers the page.
        - Ensure keyword alignment with the JD.
        - Return only the final LaTeX.
        """
        response_text = await self.generate_text(
            prompt,
            model=settings.AI_MODEL_SMART,
            temperature=0.35,
        )
        
        if response_text.startswith("[MOCK AI RESPONSE]"):
            return self._mock_latex_response()
            
        primary_latex = self._clean_latex_output(response_text)

        if self._needs_latex_density_pass(primary_latex):
            densify_prompt = f"""
            You are revising an existing LaTeX resume that is under-detailed or leaves visible blank space.
            Improve it to be a complete one-page ATS-friendly resume.

            STRICT REQUIREMENTS:
            1. Keep exactly one page after compile.
            2. Fill the page with meaningful detail; avoid visible blank space at bottom.
            3. Expand weak sections with specific, relevant bullets (action + impact).
            4. Ensure robust content in Skills, Experience, and Projects.
            5. Use JD keywords naturally and repeatedly where appropriate.
            6. Keep ATS-safe formatting and valid LaTeX.
            7. Do not invent impossible claims.

            JOB DESCRIPTION:
            {job_description[:2500]}...

            CURRENT RESUME DETAILS (if provided):
            {(resume_text or 'No original resume provided')[:4000]}...

            CURRENT LATEX TO IMPROVE:
            {primary_latex}

            Return only the improved full LaTeX (from \\documentclass to \\end{{document}}).
            """

            revised_text = await self.generate_text(
                densify_prompt,
                model=settings.AI_MODEL_SMART,
                temperature=0.3,
            )
            revised_latex = self._clean_latex_output(revised_text)

            # Keep the denser candidate when the revision is valid and meaningfully fuller.
            primary_words = self._latex_content_word_count(primary_latex)
            revised_words = self._latex_content_word_count(revised_latex)
            if revised_latex and revised_latex.startswith("\\documentclass") and revised_words >= int(primary_words * 0.95):
                return revised_latex

        return primary_latex

    def _clean_latex_output(self, output: str) -> str:
        text = (output or "").strip()
        if text.startswith("```latex"):
            text = text.replace("```latex\n", "", 1)
        if text.startswith("```"):
            text = text.replace("```\n", "", 1)
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    def _latex_to_plain_text(self, latex: str) -> str:
        if not latex:
            return ""
        plain = latex
        plain = re.sub(r"%.*", " ", plain)
        plain = re.sub(r"\\[a-zA-Z]+\*?(\[[^\]]*\])?", " ", plain)
        plain = re.sub(r"[{}$&_#^~]", " ", plain)
        plain = re.sub(r"\s+", " ", plain)
        return plain.strip().lower()

    def _latex_content_word_count(self, latex: str) -> int:
        if not latex:
            return 0
        # Strip LaTeX commands and braces, then estimate real content density.
        plain = re.sub(r"\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^{}]*\})?", " ", latex)
        plain = re.sub(r"[{}$&_#^~]", " ", plain)
        words = [w for w in re.split(r"\s+", plain) if w and len(w) > 1]
        return len(words)

    def _needs_latex_density_pass(self, latex: str) -> bool:
        if not latex:
            return True

        words = self._latex_content_word_count(latex)
        bullets = len(re.findall(r"\\resumeItem\{", latex)) + len(re.findall(r"\\item\b", latex))

        has_skills = bool(re.search(r"\\section\{\s*(Technical\s+Skills|Skills)\s*\}", latex, re.IGNORECASE))
        has_experience = bool(re.search(r"\\section\{\s*Experience\s*\}", latex, re.IGNORECASE))
        has_projects = bool(re.search(r"\\section\{\s*Projects\s*\}", latex, re.IGNORECASE))

        missing_core_section = not (has_skills and has_experience and has_projects)
        too_sparse = words < 360 or bullets < 10

        return missing_core_section or too_sparse

    def score_latex_resume(self, job_description: str, latex_code: str) -> Dict[str, Any]:
        """Compute a deterministic ATS-style quality score for a generated LaTeX resume."""
        plain_resume = self._latex_to_plain_text(latex_code)
        plain_jd = (job_description or "").lower()

        section_checks = {
            "skills": bool(re.search(r"\\section\{\s*(technical\s+skills|skills)\s*\}", latex_code, re.IGNORECASE)),
            "experience": bool(re.search(r"\\section\{\s*experience\s*\}", latex_code, re.IGNORECASE)),
            "projects": bool(re.search(r"\\section\{\s*projects\s*\}", latex_code, re.IGNORECASE)),
            "education": bool(re.search(r"\\section\{\s*education\s*\}", latex_code, re.IGNORECASE)),
            "summary_or_objective": bool(
                re.search(r"\\section\{\s*(summary|objective|professional\s+summary)\s*\}", latex_code, re.IGNORECASE)
            ),
        }

        keyword_stopwords = {
            "with", "from", "that", "this", "have", "will", "your", "their", "they", "them", "role",
            "team", "years", "year", "work", "using", "strong", "ability", "skills", "experience",
            "requirements", "preferred", "knowledge", "development", "engineer", "software", "and", "the",
            "for", "you", "our", "are", "all", "can", "job", "position", "responsibilities",
        }

        jd_tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+.#-]{2,}", plain_jd)
        filtered_tokens = [token for token in jd_tokens if token not in keyword_stopwords]

        token_freq: Dict[str, int] = {}
        for token in filtered_tokens:
            token_freq[token] = token_freq.get(token, 0) + 1

        ranked_keywords = sorted(token_freq.keys(), key=lambda t: (-token_freq[t], t))[:40]
        matched_keywords = [kw for kw in ranked_keywords if re.search(rf"\b{re.escape(kw)}\b", plain_resume)]

        keywords_total = len(ranked_keywords)
        keywords_matched = len(matched_keywords)
        keyword_match_pct = round((keywords_matched / keywords_total) * 100, 1) if keywords_total else 0.0

        words = self._latex_content_word_count(latex_code)
        bullets = len(re.findall(r"\\resumeItem\{", latex_code)) + len(re.findall(r"\\item\b", latex_code))

        section_count = len([ok for ok in section_checks.values() if ok])
        section_score = (section_count / max(1, len(section_checks))) * 100

        if words < 340:
            density_score = 45
        elif words < 420:
            density_score = 70
        elif words <= 720:
            density_score = 100
        elif words <= 800:
            density_score = 80
        else:
            density_score = 60

        if bullets < 9:
            bullet_score = 50
        elif bullets < 12:
            bullet_score = 72
        elif bullets <= 24:
            bullet_score = 100
        else:
            bullet_score = 78

        weighted_score = (
            keyword_match_pct * 0.45
            + section_score * 0.25
            + density_score * 0.15
            + bullet_score * 0.15
        )
        ats_score = int(max(0, min(100, round(weighted_score))))

        recommendations: List[str] = []
        if keyword_match_pct < 70:
            recommendations.append("Increase exact JD keyword coverage in Summary, Skills, and Experience bullets.")
        if not section_checks["skills"]:
            recommendations.append("Add a dedicated Technical Skills section with role-relevant tools and stacks.")
        if not section_checks["experience"]:
            recommendations.append("Add an Experience section with impact-focused bullets.")
        if not section_checks["projects"]:
            recommendations.append("Add Projects with measurable outcomes and technologies used.")
        if words < 420:
            recommendations.append("Resume is sparse for one page; expand bullets with specific impact and metrics.")
        if bullets < 12:
            recommendations.append("Increase high-value bullet points to improve ATS scan depth and detail.")

        return {
            "ats_score": ats_score,
            "keyword_match_pct": keyword_match_pct,
            "keywords_total": keywords_total,
            "keywords_matched": keywords_matched,
            "matched_keywords": matched_keywords[:20],
            "word_count": words,
            "bullet_count": bullets,
            "section_checks": section_checks,
            "recommendations": recommendations,
            "passes_auto_gate": ats_score >= 78 and section_checks["skills"] and section_checks["experience"] and section_checks["projects"],
        }

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
\flushbottom
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
