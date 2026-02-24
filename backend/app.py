import sqlite3
import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# --- Configuration ---
UPLOAD_DIR = "music_files"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# --- Database Initialization ---
def init_db():
    conn = sqlite3.connect('artists.db', check_same_thread=False)
    cursor = conn.cursor()
    # Store the file path instead of the BLOB
    cursor.execute('''CREATE TABLE IF NOT EXISTS music_cat(
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        artist_name TEXT,
                        genre TEXT,
                        song_title TEXT,
                        song_path TEXT,
                        subscribers INTEGER DEFAULT 0)''')
    conn.commit()
    return conn

conn = init_db()
cursor = conn.cursor()
app = FastAPI(title="Music API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---
@app.get("/search")
def search(query: str):
    cursor.execute("SELECT id, artist_name, genre, song_title FROM music_cat WHERE artist_name LIKE ? OR song_title LIKE ? OR genre LIKE ?", (f"%{query}%", f"%{query}%", f"%{query}%"))
    rows = cursor.fetchall()
    return [
        {
            "id": r[0], "artist": r[1], "genre": r[2], "song": r[3],
            "audio_url": f"http://localhost:8000/stream-song/{r[0]}" 
        } for r in rows
    ]

@app.post("/upload")
async def upload_artist_and_song(
    artist_name: str = Form(...), 
    genre: str = Form(...),
    song_title: str = Form(...),
    song_file: UploadFile = File(...)
):
    # 1. Create a unique file path
    file_location = os.path.join(UPLOAD_DIR, song_file.filename)
    
    # 2. Save the file to the disk
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(song_file.file, buffer)

    # 3. Save the path to the database
    cursor.execute(
        """INSERT INTO music_cat (artist_name, genre, song_title, song_path) 
           VALUES (?, ?, ?, ?)""",
        (artist_name, genre, song_title, file_location)
    )
    conn.commit()

    return {"message": "Upload successful", "path": file_location}

@app.get("/stream-song/{entry_id}")
def stream_song(entry_id: int):
    cursor.execute("SELECT song_path FROM music_cat WHERE id=?", (entry_id,))
    result = cursor.fetchone()
    
    if not result or not os.path.exists(result[0]):
        raise HTTPException(status_code=404, detail="Audio file not found on server")
    
    # FileResponse handles headers and streaming automatically
    return FileResponse(result[0])

@app.get("/all-entries")
def get_all_entries():
    cursor.execute("SELECT id, artist_name, genre, song_title FROM music_cat")
    rows = cursor.fetchall()
    return [
        {
            "id": r[0], "artist": r[1], "genre": r[2], "song": r[3],
            "audio_url": f"http://localhost:8000/stream-song/{r[0]}" 
        } for r in rows
    ]

@app.delete("/entry/{entry_id}")
def delete_entry(entry_id: int):
    # 1. Get the path so we can delete the physical file too
    cursor.execute("SELECT song_path FROM music_cat WHERE id=?", (entry_id,))
    result = cursor.fetchone()
    
    if result:
        file_path = result[0]
        if os.path.exists(file_path):
            os.remove(file_path) # Delete physical file
            
        cursor.execute("DELETE FROM music_cat WHERE id=?", (entry_id,))
        conn.commit()
        return {"message": "Entry and file deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Entry not found")