import requests
from typing import List, Dict

def fetch_github_projects(username: str) -> List[Dict]:
    """
    Fetches pinned or top repositories from a GitHub profile.
    """
    api_url = f"https://api.github.com/users/{username}/repos?sort=stars&per_page=5"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        repos = response.json()
        
        project_list = []
        for repo in repos:
            project_list.append({
                "name": repo.get("name"),
                "description": repo.get("description"),
                "url": repo.get("html_url"),
                "stars": repo.get("stargazers_count"),
                "language": repo.get("language")
            })
        return project_list
    except Exception as e:
        print(f"Error fetching GitHub projects: {e}")
        return []

def parse_readme_to_bullets(repo_url: str) -> List[str]:
    """
    Fetches README and extracts bullet points (placeholder logic).
    """
    # Placeholder: fetch raw README content and parse
    return ["Implemented feature X", "Optimized Y", "Deployed using Z"]
