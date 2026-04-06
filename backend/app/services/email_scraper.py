import re
import logging
import asyncio
from typing import Optional, List
from urllib.parse import urlparse
import dns.resolver
import requests
from bs4 import BeautifulSoup
from app.core.cache import cache

logger = logging.getLogger(__name__)


class FreeEmailScraper:
    """
    Free HR email scraper - scrapes company websites and validates emails.
    Zero external API costs, completely self-hosted.
    """
    
    def __init__(self):
        self.timeout = 5
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.cache_ttl = 2592000  # 30 days in seconds

    async def scrape_hr_emails(self, company: str, domain: Optional[str] = None) -> dict:
        """
        Main function to scrape HR emails for a company.
        Returns: {
            'company': str,
            'emails': list[str],
            'source': str,
            'cached': bool
        }
        """
        
        # Try cache first
        cache_key = f"hr_emails:{company}:{domain}"
        cached = await cache.get(cache_key)
        if cached:
            logger.info(f"Found cached HR emails for {company}")
            return {
                'company': company,
                'emails': cached,
                'source': 'cache',
                'cached': True
            }

        # Extract domain if not provided
        if not domain:
            domain = self._extract_domain(company)
        
        if not domain:
            logger.warning(f"Could not extract domain for {company}")
            return {
                'company': company,
                'emails': [],
                'source': 'none',
                'cached': False
            }

        # Try scraping
        emails = await self._scrape_website(domain)
        
        # Fallback: generate common patterns
        if not emails:
            emails = self._generate_common_emails(domain)
        
        # Validate each email
        valid_emails = [e for e in emails if self._validate_email(e)]
        
        # Cache result
        if valid_emails:
            await cache.set(cache_key, valid_emails, self.cache_ttl)
            logger.info(f"Found and cached {len(valid_emails)} HR emails for {company}")
        
        return {
            'company': company,
            'emails': valid_emails[:5],  # Return top 5
            'source': 'scraper' if emails else 'generated',
            'cached': False
        }

    async def _scrape_website(self, domain: str) -> List[str]:
        """Scrape company website for HR/recruiting emails"""
        emails = set()
        
        # Paths to check in order of likelihood
        paths = [
            '/careers',
            '/jobs',
            '/hiring',
            '/contact',
            '/about/careers',
            '/about/team',
            '/team',
            '/about',
            '/company/careers',
            '',  # Root
        ]
        
        for path in paths:
            try:
                url = f"https://{domain}{path}"
                logger.info(f"Scraping {url}")
                
                response = requests.get(
                    url,
                    timeout=self.timeout,
                    headers=self.headers,
                    allow_redirects=True
                )
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    text = soup.get_text()
                    
                    # Extract all emails with regex
                    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
                    found_emails = re.findall(email_pattern, text)
                    
                    for email in found_emails:
                        if self._is_hr_email(email):
                            emails.add(email)
                    
                    if len(emails) >= 3:
                        logger.info(f"Found {len(emails)} HR emails on {url}")
                        return list(emails)
            
            except requests.exceptions.RequestException as e:
                logger.debug(f"Error scraping {domain}{path}: {e}")
                continue
            except Exception as e:
                logger.debug(f"Unexpected error scraping {domain}{path}: {e}")
                continue
        
        logger.info(f"Scraped {len(emails)} HR emails from {domain}")
        return list(emails)

    def _generate_common_emails(self, domain: str) -> List[str]:
        """Generate common HR email patterns"""
        common_prefixes = [
            'hr',
            'recruiter',
            'recruiting',
            'hiring',
            'jobs',
            'careers',
            'talent',
            'recruitment',
            'applicants',
            'apply',
        ]
        
        generated = [f"{prefix}@{domain}" for prefix in common_prefixes]
        logger.info(f"Generated {len(generated)} common email patterns for {domain}")
        return generated

    def _is_hr_email(self, email: str) -> bool:
        """Determine if email looks like HR/recruiting related"""
        try:
            local_part = email.split('@')[0].lower()
            
            hr_keywords = [
                'hr', 'recruiter', 'recruit', 'recruiting',
                'hiring', 'hire', 'talent', 'career', 'careers',
                'job', 'jobs', 'applicant', 'candidate', 'apply',
                'recruitment', 'vacancy', 'employment'
            ]
            
            # Check for HR keywords
            for keyword in hr_keywords:
                if keyword in local_part:
                    return True
            
            # Also accept generic corporate emails as fallback
            if any(x in local_part for x in ['info', 'contact', 'business']):
                return True
            
            return False
        except:
            return False

    def _validate_email(self, email: str) -> bool:
        """Validate email format and check if domain has MX records"""
        
        # Check email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return False
        
        # Check MX record (verify domain can receive email) - FREE MX lookup
        try:
            domain = email.split('@')[1]
            mx_records = dns.resolver.resolve(domain, 'MX')
            if len(mx_records) > 0:
                logger.debug(f"MX check passed for {domain}")
                return True
        except Exception as e:
            logger.debug(f"MX lookup failed for {domain}: {e}")
        
        # If MX lookup fails, still accept common TLDs
        # Better to be permissive than lose valid emails
        if email.endswith(('.com', '.org', '.net', '.co', '.io', '.dev', '.app')):
            return True
        
        return False

    def _extract_domain(self, company_name: str) -> Optional[str]:
        """
        Extract domain from company name.
        Simple heuristic: lowercase, remove spaces, clean special chars
        """
        try:
            # Basic extraction
            domain = company_name.lower()
            domain = domain.replace(' ', '')
            domain = domain.replace(',', '')
            domain = re.sub(r'[^a-z0-9-]', '', domain)
            domain = domain.strip('-')
            
            if domain:
                return f"{domain}.com"
        except:
            pass
        
        return None


# Global instance
email_scraper = FreeEmailScraper()
