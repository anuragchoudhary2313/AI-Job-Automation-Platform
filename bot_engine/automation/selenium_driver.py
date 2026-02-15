from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

def get_selenium_driver(headless: bool = True):
    """
    Initializes and returns a Selenium WebDriver instance.
    """
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    import os
    
    # Check if running in Docker (or if binary exists)
    chrome_binary_path = "/usr/bin/chromium"
    chromedriver_path = "/usr/bin/chromedriver"

    if os.path.exists(chrome_binary_path):
        chrome_options.binary_location = chrome_binary_path
        
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # Add user-agent to avoid detection
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36")

    if os.path.exists(chromedriver_path):
        service = Service(executable_path=chromedriver_path)
    else:
        service = Service(ChromeDriverManager().install())

    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver
