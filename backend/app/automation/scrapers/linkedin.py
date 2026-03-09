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
        try:
            logger.info(f"Navigating to {url}")
            await self.page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for results or empty state
            try:
                await self.page.wait_for_selector(".jobs-search__results-list, .results-context-header", timeout=15000)
            except:
                logger.warning("Timeout waiting for job selectors, attempting to parse whatever is on page")
            
            # Scroll to load more (basic)
            await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
            await asyncio.sleep(2)
            
            jobs = []
            cards = await self.page.query_selector_all("li")
            
            count = 0
            for card in cards:
                if count >= limit:
                    break
                    
                try:
                    title_elem = await card.query_selector("h3, .base-search-card__title")
                    company_elem = await card.query_selector("h4, .base-search-card__subtitle")
                    loc_elem = await card.query_selector(".job-search-card__location, .base-search-card__metadata")
                    link_elem = await card.query_selector("a")
    
                    if title_elem and link_elem:
                        title = await title_elem.inner_text()
                        company = await company_elem.inner_text() if company_elem else "Unknown"
                        location = await loc_elem.inner_text() if loc_elem else "Unknown"
                        link = await link_elem.get_attribute("href")
                        
                        if link:
                            # Cleanup link
                            link = link.split("?")[0].strip()
                            
                            jobs.append({
                                "title": title.strip(),
                                "company": company.strip(),
                                "location": location.strip(),
                                "link": link,
                                "source": "linkedin"
                            })
                            count += 1
                except Exception as e:
                    logger.debug(f"Failed to parse job card: {e}")
                    continue
                    
            logger.info(f"Successfully scraped {len(jobs)} jobs from LinkedIn")
            return jobs
        except Exception as e:
            logger.error(f"Error during LinkedIn scraping: {e}")
            return []
