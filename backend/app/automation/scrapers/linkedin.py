from typing import List, Dict
import asyncio
from app.automation.scrapers.base import BaseScraper
import logging

logger = logging.getLogger(__name__)

class LinkedInScraper(BaseScraper):
    async def login(self):
        # For now, we rely on existing cookies or public pages
        # LinkedIn login is strict with CAPTCHAs, so we prioritize public scraping or cookie reuse
        cookies = self.session_manager.load_cookies()
        if cookies:
            await self.page.context.add_cookies(cookies)
            await self.page.goto("https://www.linkedin.com/feed/")
            # Check if logged in
            if "feed" in self.page.url:
                logger.info("Successfully resumed LinkedIn session")
                return

        logger.warning("No valid session found for LinkedIn. Proceeding in guest mode (limited).")

    async def scrape_jobs(self, keyword: str, location: str, limit: int = 10) -> List[Dict]:
        url = f"https://www.linkedin.com/jobs/search?keywords={keyword}&location={location}"
        await self.page.goto(url)
        await self.page.wait_for_selector(".jobs-search__results-list", timeout=5000)
        
        jobs = []
        # Basic parsing logic for public job search page
        # Selectrs might need update as LinkedIn changes DOM frequently
        cards = await self.page.query_selector_all("li")
        
        count = 0
        for card in cards:
            if count >= limit:
                break
                
            try:
                title_elem = await card.query_selector("h3")
                company_elem = await card.query_selector("h4")
                loc_elem = await card.query_selector(".job-search-card__location")
                link_elem = await card.query_selector("a")

                if title_elem and link_elem:
                    title = await title_elem.inner_text()
                    company = await company_elem.inner_text() if company_elem else "Unknown"
                    location = await loc_elem.inner_text() if loc_elem else "Unknown"
                    link = await link_elem.get_attribute("href")
                    
                    jobs.append({
                        "title": title.strip(),
                        "company": company.strip(),
                        "location": location.strip(),
                        "link": link.split("?")[0], # Clean URL
                        "source": "linkedin"
                    })
                    count += 1
            except Exception as e:
                logger.debug(f"Failed to parse job card: {e}")
                continue
                
        logger.info(f"Scraped {len(jobs)} jobs from LinkedIn")
        return jobs
