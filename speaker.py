import fakeyou
import pygame
import threading
import os
from fuzzywuzzy import fuzz

from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.


CHUNK = 1024

fn = "temp-sound.wav"
fy = fakeyou.FakeYou()

request_queue = []

# Attempt login
try:
    fy.login(os.environ['FAKEYOU_USERNAME'], os.environ['FAKEYOU_PASSWORD'])
except fakeyou.exception.InvalidCredentials:
    print("Check your username or password.")

def find(query:str):
    voices = fy.list_voices()
    found = []
    for title, vjson in zip(voices.title, voices.json):
        if query.lower() in title.lower():
            found.append(vjson)

    sortKey = lambda name : fuzz.ratio(name, query) / 100.0
    found = sorted(found, key=sortKey)
    return found

def play_audio(filename):
    try:
        pygame.mixer.init()
    except pygame.error as e:
        print(f"Failed to initialize pygame mixer: {e}")
        return
    
    try:
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
    except pygame.error as e:
        print(f"Failed to load or play audio: {e}")




def speak(voice:str, message:str):
    voices = find(voice)    
    
    if len(voices) <= 0: 
        return
    
    voice = voices[0]

    token = voice["model_token"]
    try:
        wav = fy.say(text=message,ttsModelToken=token)
        wav.save(fn)
        play_audio(fn)
        
    except fakeyou.exception.TooManyRequests:
        print("Request limit exceeded")

    return voice

def queue(voice:str, message:str):
    request_queue.append([voice, message])

def generate_audio():
    while True:
        if len(request_queue) <= 0:
            continue

        request = request_queue[0]
        speak(request[0], request[1])
        request_queue.pop(0)

# Start the audio generation thread
audio_thread = threading.Thread(target=generate_audio)
audio_thread.start()

if(__name__ == "__main__"):
    play_audio('temp-sound.wav')

#pip install -r requirements.txt
#source myenv/bin/activate


# WuzCore ==================================
# 
# A layer above Ollama that instructs the 
# LLM how to responds to specific prompts
#  
# 
# 