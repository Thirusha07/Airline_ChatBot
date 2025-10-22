from sentence_transformers import SentenceTransformer
from transformers import pipeline # Added for generation
import chromadb
import os
import time # Added to measure generation time
import re # Added for better chunk extraction

# --- Configuration ---
PERSIST_DIRECTORY = "policy_vector_db"
COLLECTION_NAME = "policy_chunks"
RETRIEVAL_MODEL_NAME = 'all-MiniLM-L6-v2'
GENERATION_MODEL_NAME = 'google/flan-t5-base' # Using the 'base' model
NUM_RETRIEVED_CHUNKS = 7 # Retrieving 7 chunks

# --- Load Models and Database ---
print("Loading embedding model...")
try:
    # Force CPU for consistency during testing/demo unless GPU is confirmed available
    embedding_model = SentenceTransformer(RETRIEVAL_MODEL_NAME, device='cpu')
    print("Embedding model loaded successfully (CPU).")
except Exception as e:
    print(f"FATAL: Could not load embedding model! Error: {e}")
    exit()

print(f"Loading generative model '{GENERATION_MODEL_NAME}'...")
try:
    # --- >>> CORRECTED TASK NAME HERE <<< ---
    generator = pipeline('text2text-generation', model=GENERATION_MODEL_NAME, device=-1)
    # --- >>> END CORRECTION <<< ---
    print("Generative model loaded successfully (CPU).")
except Exception as e:
    print(f"FATAL: Could not load generative model! Error: {e}")
    exit()

print("Connecting to local vector database...")
try:
    client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)
    collection = client.get_collection(name=COLLECTION_NAME)
    print(f"Connected to ChromaDB. Collection '{COLLECTION_NAME}' has {collection.count()} items.")
except Exception as e:
    print(f"FATAL: Could not connect to ChromaDB collection '{COLLECTION_NAME}'! Error: {e}")
    print(f"Did you run 'build_database.py' successfully?")
    print(f"Does the folder '{PERSIST_DIRECTORY}' exist?")
    exit()

# --- RAG Function ---
def answer_query_with_rag(query_text, num_results=NUM_RETRIEVED_CHUNKS):
    """
    Retrieves relevant chunks and uses a generative model to synthesize an answer.
    """
    if not query_text:
        return "Please enter a query."

    # 1. Retrieve
    print("Step 1: Retrieving relevant documents...")
    try:
        query_vector = embedding_model.encode([query_text])[0].tolist()
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=num_results,
            include=['metadatas', 'distances'] # ChromaDB uses 'metadatas' plural
        )
    except Exception as e:
        print(f"Error querying ChromaDB: {e}")
        return "Error querying database."

    # Check if results are valid and contain metadata
    if not results or not results.get('ids') or not results['ids'][0] or not results.get('metadatas') or not results['metadatas'][0]:
        return "No relevant policy information found in the database."

    # 2. Augment
    # Extract text chunks correctly from the nested list structure
    context_chunks = [
        metadata.get('text_chunk', '')
        for metadata in results['metadatas'][0]
        if metadata # Ensure metadata dict itself is not None
    ]
    context = "\n\n".join(filter(None, context_chunks)) # Filter out empty strings

    if not context.strip():
         return "Found potentially relevant documents, but couldn't extract text context."

    print("Step 2: Preparing context for generation...")

    # 3. Generate
    # Using the improved prompt
    prompt = f"""Carefully read the following context based on airline policies. Answer the user's question clearly and directly in a complete sentence, using *only* the information provided in the context. If the context explicitly mentions fees, conditions, or specific details relevant to the question, include them in your answer. If the context does not contain enough information to answer the question, state that the information is not available in the provided documents.

Context:
{context}

Question: {query_text}

Answer:"""

    print("Step 3: Generating answer...")
    start_time = time.time()
    answer = "Error: Generation failed." # Default error message
    try:
        # Using adjusted generation parameters
        generated_result = generator(prompt, max_new_tokens=200, num_beams=4, early_stopping=True)

        # Check output structure and extract text
        if generated_result and isinstance(generated_result, list) and 'generated_text' in generated_result[0]:
             answer_raw = generated_result[0]['generated_text'].strip()
             if not answer_raw:
                 answer = "[Model generated an empty response]"
             else:
                 # Clean up potential model prefixes/artifacts if necessary
                 answer = answer_raw # Simple assignment for now
        else:
             answer = "[Unexpected generator output format]"
             print(f"DEBUG: Raw generator output: {generated_result}") # Print if format is wrong

        end_time = time.time()
        print(f"Generation took {end_time - start_time:.2f} seconds.")


    except Exception as e:
        print(f"Error during generation: {e}")
        answer = f"Error generating answer from context. Details: {e}"

    return answer

# --- Interactive Loop ---
if __name__ == "__main__":
    print("\n--- Policy RAG Query Tool ---")
    print("Enter your policy question (or type 'quit' to exit)")

    while True:
        user_query = input("\nQuery: ")
        if user_query.lower() == 'quit':
            break

        final_answer = answer_query_with_rag(user_query)

        print("\n--- Generated Answer ---")
        print(final_answer) # Print the final answer

    print("\nExiting Policy RAG Query Tool.")