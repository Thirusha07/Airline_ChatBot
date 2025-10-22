import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# --- CONFIG ---
INDEX_FILE = "policy_index.faiss"
MAP_FILE = "chunk_map.json"
RETRIEVER_MODEL = 'all-MiniLM-L6-v2'

# --- FINAL MODEL UPGRADE ---
# Using 'large' for the best quality demo that fits hackathon rules.
GENERATOR_MODEL = 'google/flan-t5-large' 
# ---
K_RESULTS = 3  # Number of results to retrieve

def search(query_text, model, index, filepaths_map):
    """
    Embeds a query, searches the index, and returns the top K *chunk text*.
    """
    print(f"\nEmbedding query: '{query_text}'")
    query_vector = model.encode([query_text])
    query_vector = np.array(query_vector).astype('float32')

    print(f"Searching index for top {K_RESULTS} results...")
    # D = distances, I = indices
    D, I = index.search(query_vector, K_RESULTS)

    retrieved_chunks = []
    if not I.size:
        print("No results found.")
        return [], []
    
    print("\n--- Retrieved Chunks (Context) ---")
    filepaths = []
    for i, idx in enumerate(I[0]):
        filepath = filepaths_map[idx]
        filepaths.append(filepath)
        with open(filepath, 'r', encoding='utf-8') as f:
            chunk_text = f.read()
            print(f"\n[Chunk {i+1} from: {filepath}]")
            print(chunk_text)
            retrieved_chunks.append(chunk_text)
    
    print("----------------------------------")
    return retrieved_chunks, filepaths

def generate_answer(context, question, model, tokenizer):
    """
    Generates a natural language answer given the context and question.
    """
    print("\nGenerating answer... (This may take a moment with the 'large' model)")
    
    # --- FINAL PROMPT ---
    # This is the strictest prompt to handle ambiguity.
    prompt = f"""
    You are a helpful assistant. Read the following context carefully.
    Find the text that *specifically* answers the *exact* question.
    Answer the question based *only* on the context provided.
    If the context does not contain the answer, say "Sorry, I could not find that information in the policy documents."

    Context:
    ---
    {context}
    ---
    
    Question: {question}
    
    Answer:
    """
    # ---
    
    # Move inputs to the same device as the model
    device = model.device
    inputs = tokenizer(prompt, return_tensors="pt", max_length=1024, truncation=True).to(device)
    
    # Generate the answer
    outputs = model.generate(
        **inputs, 
        max_length=256,  # Max length of the *answer*
        num_beams=5,      # Use beam search for better results
        early_stopping=True
    )
    answer = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return answer

def main():
    """
    Main function to load models and start the interactive query loop.
    """
    try:
        # Check for device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}")
        print("Note: 'cuda' (GPU) will be much faster for the 'large' model.")

        # 1. Load Retriever Model
        print(f"Loading retriever model '{RETRIEVER_MODEL}'...")
        retriever_model = SentenceTransformer(RETRIEVER_MODEL, device=device)

        # 2. Load FAISS Index and Map
        print(f"Loading index from {INDEX_FILE}...")
        index = faiss.read_index(INDEX_FILE)

        print(f"Loading map from {MAP_FILE}...")
        with open(MAP_FILE, 'r', encoding='utf-8') as f:
            filepaths_map = json.load(f)
            
        # 3. Load Generator Model
        print(f"Loading generator model '{GENERATOR_MODEL}'...")
        print("This may take a few minutes the first time...")
        generator_tokenizer = AutoTokenizer.from_pretrained(GENERATOR_MODEL)
        generator_model = AutoModelForSeq2SeqLM.from_pretrained(GENERATOR_MODEL).to(device)
            
        print("\n✅ All models and data loaded. Ready to query.")
        print("="*50)

    except FileNotFoundError as e:
        print(f"❌ ERROR: Could not load file: {e.filename}")
        print("Please run the `run_pipeline.py` script first to create the index files.")
        return
    except Exception as e:
        print(f"❌ An unexpected error occurred on startup: {e}")
        return

    # 4. Start interactive loop
    while True:
        try:
            query = input("\nEnter your query (or 'exit' to quit): ")
            
            if query.lower() in ['exit', 'quit']:
                print("Exiting...")
                break
                
            if not query.strip():
                continue
                
            # Step 1: Retrieve
            retrieved_chunks, _ = search(query, retriever_model, index, filepaths_map)
            
            if not retrieved_chunks:
                print("\n" + "="*20 + " FINAL ANSWER " + "="*20)
                print("Sorry, I couldn't find any relevant information in the documents.")
                print("="*56)
                continue

            # Step 2: Combine context
            context_string = "\n\n".join(retrieved_chunks)
            
            # Step 3: Generate
            answer = generate_answer(context_string, query, generator_model, generator_tokenizer)
            
            print("\n" + "="*20 + " FINAL ANSWER " + "="*20)
            print(answer)
            print("="*56)

        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"❌ An error occurred during query: {e}")


if __name__ == "__main__":
    main()

