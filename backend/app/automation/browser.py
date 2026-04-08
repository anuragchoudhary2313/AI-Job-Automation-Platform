import asyncio
import subprocess
import sys
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class BrowserManager:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None

    async def launch(self) -> Page:
        """
        Launches Playwright browser and returns a page.
        """
        return await self._launch_with_retry(allow_install_retry=True)

    async def _launch_with_retry(self, allow_install_retry: bool) -> Page:
        try:
            self.playwright = await async_playwright().start()
            
            # Launch Chromium
            self.browser = await self.playwright.chromium.launch(
                headless=getattr(settings, "PLAYWRIGHT_HEADLESS", True),
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu",
                ]
            )
            
            # Create Context with stealth settings
            self.context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US",
                timezone_id="America/New_York",
            )
            
            # Anti-detection scripts
            page = await self.context.new_page()
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)
            
            return page
            
        except Exception as e:
            error_text = str(e)
            if allow_install_retry and "Executable doesn't exist" in error_text:
                logger.warning("Playwright browser executable missing. Installing Chromium and retrying launch once...")
                await self.close()
                try:
                    subprocess.run(
                        [sys.executable, "-m", "playwright", "install", "chromium"],
                        check=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                    return await self._launch_with_retry(allow_install_retry=False)
                except Exception as install_error:
                    logger.error(f"Failed to install Playwright Chromium at runtime: {install_error}")

            logger.error(f"Failed to launch browser: {e}")
            await self.close()
            raise e

    async def close(self):
        """
        Closes all browser resources.
        """
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
