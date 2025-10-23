"""
Policy Retrieval Pipeline (Scraper + Indexer)
------------------------------------------------------
✅ Scrapes dynamic airline policy pages
✅ Cleans, saves, and chunks data
✅ Immediately builds a searchable FAISS index from the chunks
"""

import os
import re
import time
import json
import glob
from urllib.parse import urlparse

import faiss
import numpy as np
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


# ---------- CONFIG ----------
# Scraper Config
OUTPUT_DIR = "data"  # Changed from "data/policies"
CHUNK_SIZE = 120  # words per chunk
WAIT_TIME = 3

# Indexer Config
INDEX_FILE = "policy_index.faiss"
MAP_FILE = "chunk_map.json"
MODEL_NAME = 'all-MiniLM-L6-v2'
# ----------------------------


# --- Scraper Functions ---

def fetch_page(url: str) -> str:
    """Fetch full HTML including content tabs inside the body section."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/118.0.0.0 Safari/537.36"
    )

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get(url)
    time.sleep(WAIT_TIME)

    html_parts = []

    try:
        tab_buttons = driver.find_elements(
            By.XPATH,
            "//div[contains(@class,'tab') or @role='tablist']//button | //div[contains(@class,'tab') or @role='tablist']//a"
        )
        clicked_tabs = set()

        if not tab_buttons:
            print("⚠️ No local tabs found. Capturing page as-is.")
            html_parts.append(driver.page_source)
        else:
            for tab in tab_buttons:
                try:
                    text = tab.text.strip()
                    if not text or len(text) > 60:
                        continue
                    if text.lower() in ["book", "flights", "my trips", "manage trips", "travel info"]:
                        continue
                    if text.lower() in clicked_tabs:
                        continue

                    driver.execute_script("arguments[0].scrollIntoView(true);", tab)
                    driver.execute_script("arguments[0].click();", tab)
                    time.sleep(WAIT_TIME)
                    
                    heading_marker = f"<h2>--- TAB CONTENT: {text} ---</h2>"
                    html_parts.append(heading_marker + driver.page_source)
                    clicked_tabs.add(text.lower())
                    print(f"🟢 Captured policy tab: {text}")
                except Exception:
                    continue
    except Exception as e:
        print(f"⚠️ Could not detect local tabs: {e}")
        if not html_parts:
            html_parts.append(driver.page_source)

    driver.quit()
    return "\n".join(html_parts)


def extract_main_text(html: str) -> str:
    """Extract visible readable text from HTML."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "form", "noscript"]):
        tag.decompose()
    text = " ".join(soup.stripped_strings)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_into_chunks(text: str, max_words: int = CHUNK_SIZE):
    """Split long text into smaller, retrievable chunks."""
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]


def save_text(path: str, text: str):
    """Save text safely to file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def scrape_policy(url: str):
    """Full pipeline: fetch -> clean -> chunk -> save."""
    print(f"\n🔍 Fetching: {url}")
    html = fetch_page(url)
    text = extract_main_text(html)

    parsed = urlparse(url)
    base_name = parsed.netloc + parsed.path.replace("/", "_")
    base_name = re.sub(r"[^0-9A-Za-z_.-]+", "_", base_name).strip("_")

    raw_path = os.path.join(OUTPUT_DIR, f"{base_name}_raw.txt")
    save_text(raw_path, text)
    print(f"✅ Saved raw text → {raw_path}")

    chunks = split_into_chunks(text)
    chunk_dir = os.path.join(OUTPUT_DIR, f"{base_name}_chunks")
    os.makedirs(chunk_dir, exist_ok=True)
    for i, chunk in enumerate(chunks):
        save_text(os.path.join(chunk_dir, f"chunk_{i:03d}.txt"), chunk)
    print(f"✅ Created {len(chunks)} chunks → {chunk_dir}")

    return {"raw_path": raw_path, "chunks_dir": chunk_dir, "num_chunks": len(chunks)}


# --- Indexer Function ---

def build_index():
    """Finds all chunks in OUTPUT_DIR, embeds them, and saves a FAISS index."""
    print("\n" + "="*30)
    print("STARTING INDEX BUILD...")
    print("="*30)

    # 1. Find all chunk files (using the global OUTPUT_DIR)
    chunk_files = []
    for root, dirs, files in os.walk(OUTPUT_DIR):
        for file in files:
            if file.startswith("chunk_") and file.endswith(".txt"):
                chunk_files.append(os.path.join(root, file))

    if not chunk_files:
        print(f"❌ No chunk files found in {OUTPUT_DIR}. Cannot build index.")
        return

    print(f"Found {len(chunk_files)} chunk files to index.")

    # 2. Read text from files
    texts = []
    filepaths_map = []  # This will be our map

    for i, f_path in enumerate(chunk_files):
        try:
            with open(f_path, "r", encoding="utf-8") as f:
                texts.append(f.read())
                # We save the path at the same index 'i'
                filepaths_map.append(f_path) 
        except Exception as e:
            print(f"Error reading {f_path}: {e}")

    print(f"Loaded text from {len(texts)} files.")

    # 3. Load the embedding model (from Hugging Face)
    print(f"Loading embedding model '{MODEL_NAME}'...")
    model = SentenceTransformer(MODEL_NAME)

    # 4. Create embeddings
    print("Creating embeddings... (This may take a moment)")
    embeddings = model.encode(texts, show_progress_bar=True)
    embeddings = np.array(embeddings).astype('float32') # FAISS needs float32

    # 5. Build the FAISS Index
    index = faiss.IndexFlatL2(embeddings.shape[1])  # L2 distance
    index.add(embeddings)  # Add all embeddings to the index

    # 6. Save the index and the map
    print(f"Saving index to {INDEX_FILE}...")
    faiss.write_index(index, INDEX_FILE)

    print(f"Saving map to {MAP_FILE}...")
    with open(MAP_FILE, 'w', encoding='utf-8') as f:
        json.dump(filepaths_map, f, indent=2)

    print("\n✅✅✅ PIPELINE COMPLETE ✅✅✅")
    print(f"  -> Index file: {INDEX_FILE} ({index.ntotal} vectors)")
    print(f"  -> Map file: {MAP_FILE} ({len(filepaths_map)} entries)")


# --- Main execution ---

if __name__ == "__main__":
    
    # --- Part 1: Scraping ---
    print("="*30)
    print("STARTING SCRAPING...")
    print("="*30)
    
    urls = [
        "https://www.jetblue.com/flying-with-us/our-fares",
        "https://www.jetblue.com/traveling-together/traveling-with-pets"
    ]

    for u in urls:
        try:
            result = scrape_policy(u)
            print(result)
        except Exception as e:
            print(f"❌ Error scraping {u}: {e}")

    # --- Part 2: Indexing ---
    # After scraping is done, build the index from the files we just created.
    build_index()