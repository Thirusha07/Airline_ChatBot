import os
import re
import uuid
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
import chromadb

# --- Configuration ---
HTML_FOLDER = "HTMLFiles"
FILE_NAMES = [
    "Our Fares _ JetBlue_TrueBlue_or_guest.html",
    "Our Fares _ JetBlue_Mosaic_member.html",
    "Our Fares _ JetBlue_JetBlue_Plus_or_Business_Cardmember.html",
    "Traveling with Pets _ JetBlue.html"
]
PERSIST_DIRECTORY = "policy_vector_db" # DB output folder
COLLECTION_NAME = "policy_chunks"    # DB collection name
MODEL_NAME = 'all-MiniLM-L6-v2'      # Embedding model
MIN_CHUNK_WORDS = 5                  # Minimum words for a chunk to be kept

# --- Helper Function: Improved Text Extraction & Chunking ---
def extract_text_chunks_from_soup(soup, source_filename):
    """
    Extracts text chunks based on semantic HTML tags.
    Returns a list of dictionaries, each with 'text' and 'source'.
    """
    chunks_with_source = []
    
    # Target specific tags that usually contain distinct pieces of info
    tags_to_process = ['p', 'li', 'h2', 'h3', 'h4', 'th', 'td'] 
    
    body = soup.find('body')
    if not body:
        print(f"[Warning] Could not find <body> tag in {source_filename}")
        return []

    for element in body.find_all(tags_to_process):
        # Get text only from this element, clean excess whitespace/newlines
        text = element.get_text(strip=True)
        text = re.sub(r'\s*\n\s*', ' ', text).strip() # Replace newlines within text with space
        text = re.sub(r'\s+', ' ', text).strip()      # Consolidate multiple spaces

        # Keep chunks that meet the minimum word count
        if text and len(text.split()) >= MIN_CHUNK_WORDS: 
            chunks_with_source.append({"text": text, "source": source_filename})
            
    # Remove exact duplicate chunks (often happens with table headers/footers)
    unique_chunks_data = []
    seen_texts = set()
    for item in chunks_with_source:
        if item["text"] not in seen_texts:
            unique_chunks_data.append(item)
            seen_texts.add(item["text"])
            
    return unique_chunks_data

# --- Main Execution ---
def main():
    print("--- Building Local Vector Database (Raw Chunks) ---")
    
    all_chunks_data = []

    # 1. Read HTML files and Extract Chunks
    print("Step 1: Reading HTML files and extracting text chunks...")
    for file_name in FILE_NAMES:
        full_path = os.path.join(HTML_FOLDER, file_name)
        try:
            print(f"  Processing: {full_path}")
            with open(full_path, "r", encoding="utf-8") as f:
                html_content = f.read()
            
            soup = BeautifulSoup(html_content, "html.parser")
            file_chunks = extract_text_chunks_from_soup(soup, file_name)
            all_chunks_data.extend(file_chunks)
            print(f"    Extracted {len(file_chunks)} chunks.")

        except FileNotFoundError:
            print(f"[ERROR] File not found: {full_path}")
        except Exception as e:
            print(f"[ERROR] An error occurred processing {full_path}: {e}")

    if not all_chunks_data:
        print("[ERROR] No chunks extracted. Exiting.")
        return
        
    print(f"Total chunks extracted: {len(all_chunks_data)}")

    # 2. Load Embedding Model
    print("\nStep 2: Loading embedding model...")
    try:
        embedding_model = SentenceTransformer(MODEL_NAME, device='cpu')
        print("Embedding model loaded successfully (CPU).")
    except Exception as e:
        print(f"FATAL: Could not load embedding model! Error: {e}")
        return

    # 3. Encode Chunks into Vectors
    print("\nStep 3: Encoding text chunks into vectors...")
    chunks_text = [item["text"] for item in all_chunks_data]
    vectors = embedding_model.encode(chunks_text, show_progress_bar=True)
    vector_lists = [v.tolist() for v in vectors]
    print("Encoding complete.")

    # 4. Prepare Data for ChromaDB
    ids = [str(uuid.uuid4()) for _ in all_chunks_data]
    metadatas = [{"text_chunk": item["text"], "source_file": item["source"]} for item in all_chunks_data]

    # 5. Initialize ChromaDB and Add Data
    print("\nStep 4: Setting up ChromaDB...")
    try:
        # Check if the database directory exists, delete if you want to overwrite
        if os.path.exists(PERSIST_DIRECTORY):
             print(f"  Database directory '{PERSIST_DIRECTORY}' already exists.")
             # Decide if you want to delete and recreate or just get existing
             # For simplicity, let's get existing or create new
             
        client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)

        # Try to delete the collection if it exists to ensure fresh data
        try:
            print(f"  Attempting to delete existing collection '{COLLECTION_NAME}' (if any)...")
            client.delete_collection(name=COLLECTION_NAME)
            print(f"  Collection '{COLLECTION_NAME}' deleted.")
        except Exception:
            print(f"  Collection '{COLLECTION_NAME}' does not exist or could not be deleted, creating anew.")
            pass # Collection doesn't exist or other error, proceed to create

        print(f"  Creating collection: {COLLECTION_NAME}")
        collection = client.create_collection(
            name=COLLECTION_NAME,
            # metadata={"hnsw:space": "cosine"} # Optional: Specify distance metric if needed
        )
        
        print(f"  Adding {len(ids)} items to ChromaDB collection...")
        # Add data in batches if you have a very large number of chunks
        batch_size = 500 # Adjust as needed
        for i in range(0, len(ids), batch_size):
            print(f"    Adding batch {i//batch_size + 1}...")
            collection.add(
                ids=ids[i:i+batch_size],
                embeddings=vector_lists[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size]
            )
        print("  Data added successfully!")

    except Exception as e:
        print(f"[ERROR] Failed to set up or add data to ChromaDB: {e}")
        return

    print("\n--- Local Vector Database Build Complete ---")
    print(f"Database stored in folder: '{PERSIST_DIRECTORY}'")
    print(f"Collection '{COLLECTION_NAME}' contains {collection.count()} items.")
    print("You can now use 'query_local_db_rag.py' to ask questions.")

if __name__ == "__main__":
    main()