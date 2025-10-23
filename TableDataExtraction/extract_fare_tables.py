import time
import json
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
import os
import re
from bs4 import BeautifulSoup
from io import StringIO

# --- CONFIG ---
URL = "https://www.jetblue.com/flying-with-us/our-fares"
WAIT_TIME = 3
OUTPUT_DIR = "."  # Save files in the current folder
OUTPUT_FILE = "fare_rules.json"

# The three tabs we need to click
TABS_TO_CLICK = [
    "TrueBlue or guest",
    "Mosaic member",
    "JetBlue Plus/Business Cardmember"
]

# --- BeautifulSoup Parsing Functions ---

def clean_text(text):
    """
    Cleans up the extracted text.
    - Removes *only* superscript footnotes (¹²³⁴⁵⁶⁷⁸⁹).
    - Keeps all other numbers and symbols ($75, $100, 1, 2).
    - Replaces newlines (from <br>) with a space.
    """
    # Remove only the superscript characters
    text = re.sub(r'[¹²³⁴⁵⁶⁷⁸⁹]', '', text) 
    
    # Replace newlines and clean up double spaces
    text = text.replace("\n", " ").replace("  ", " ").strip()
    return text

def parse_div_table(soup):
    """
    Parses the specific div-based table structure from the BeautifulSoup object.
    """
    try:
        # 1. Find the table. It's a <div> with role="table"
        table = soup.find("div", {"role": "table", "class": "dn db-ns"})
        if not table:
            print("  -> ❌ ERROR: Could not find <div role='table'>.")
            return None

        # 2. Get the headers (Fare Names)
        header_row = table.find("div", {"role": "rowgroup"}).find("div", {"role": "row"})
        header_cells = header_row.find_all("div", {"role": "columnheader"})
        fare_names = [h.get_text(strip=True) for h in header_cells[1:]]
        
        # 3. Initialize our data dictionary
        tab_data = {fare: {} for fare in fare_names}

        # 4. Get all data rows
        data_rows = table.find_all("div", {"role": "rowgroup"})[1].find_all("div", {"role": "row"})
        print(f"  -> Found {len(fare_names)} fares and {len(data_rows)} feature rows.")

        # 5. Loop through each data row
        for row in data_rows:
            cells = row.find_all("div", {"role": "cell"})
            if not cells:
                continue
            
            # 6. Get the feature name (e.g., "Cancellations")
            feature_name_raw = cells[0].get_text(strip=True)
            feature_name = clean_text(feature_name_raw)

            # 7. Get the values for this feature
            values = [clean_text(c.get_text(separator=" ", strip=True)) for c in cells[1:]]

            # 8. Map features to fares
            for i, fare_name in enumerate(fare_names):
                if i < len(values):
                    tab_data[fare_name][feature_name] = values[i]
        
        return tab_data
    except Exception as e:
        print(f"  -> ❌ ERROR: An exception occurred during parsing: {e}")
        return None

# --- Selenium Function ---

def get_page_source_for_tab(driver, tab_text):
    """Finds a tab by its text and clicks it, then returns the page source."""
    try:
        xpath = f"//button[@role='tab'][contains(., '{tab_text}')]"
        tab_button = driver.find_element(By.XPATH, xpath)
        
        driver.execute_script("arguments[0].scrollIntoView(true);", tab_button)
        driver.execute_script("arguments[0].click();", tab_button)
        time.sleep(WAIT_TIME)
        print(f"🟢 Clicked tab: {tab_text}")
        return driver.page_source
    except Exception as e:
        print(f"❌ Could not find or click tab: {tab_text} | Error: {e}")
        return None

# --- Main Execution ---

def main():
    """Main function to scrape, parse, and save fare rules."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    print(f"Fetching URL: {URL}")
    driver.get(URL)
    time.sleep(WAIT_TIME)

    all_fare_rules = {}
    debug_files_created = []

    for tab_name in TABS_TO_CLICK:
        html_content = get_page_source_for_tab(driver, tab_name)
        clean_key = tab_name.replace("/", "_").replace(" ", "_")
        
        if html_content:
            # 1. Save the raw HTML file for debugging
            debug_filename = os.path.join(OUTPUT_DIR, f"debug_{clean_key}.html")
            with open(debug_filename, "w", encoding="utf-8") as f:
                f.write(html_content)
            print(f"  -> Saved debug HTML to {debug_filename}")
            debug_files_created.append(debug_filename) # Keep track of it

            # 2. Create BeautifulSoup object and parse the table
            soup = BeautifulSoup(html_content, 'html.parser')
            table_data = parse_div_table(soup)
            
            if table_data:
                print(f"  -> ✅ Successfully parsed table for: {tab_name}")
                all_fare_rules[tab_name] = table_data
            else:
                print(f"  -> ❌ Could not parse table for: {tab_name}")
                
    driver.quit()

    # 3. Save the final JSON file
    if all_fare_rules:
        print(f"\nSaving all rules to {OUTPUT_FILE}...")
        with open(os.path.join(OUTPUT_DIR, OUTPUT_FILE), 'w', encoding='utf-8') as f:
            json.dump(all_fare_rules, f, indent=2)
        print("✅ Done.")
    else:
        print("❌ No rules were extracted.")
        
    # 4. Clean up debug files (as you requested)
    print("\nCleaning up debug HTML files...")
    for f_path in debug_files_created:
        try:
            os.remove(f_path)
            print(f"  -> Removed {f_path}")
        except Exception as e:
            print(f"  -> ❌ Error removing {f_path}: {e}")

if __name__ == "__main__":
    main()
