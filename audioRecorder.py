import pyaudio
import threading
import wave

DEFAULT_FORMAT = pyaudio.paInt16  # Audio format (16-bit PCM)
DEFAULT_CHANNELS = 1              # Number of audio channels
DEFAULT_DEVICE_INDEX = 0          # Device to record from
DEFAULT_RATE = 44100              # Sampling rate (Hz)
DEFAULT_CHUNK = 1024              # Number of frames per buffer
DEFAULT_WAVE_OUTPUT_FILENAME = "recorded.wav"  # Output file name

class AudioRecorder:
    def __init__(self):
        self.p = pyaudio.PyAudio()
        self.recording = False
        self.stream = None
        self.format = DEFAULT_FORMAT
        self.channels = DEFAULT_CHANNELS
        self.rate = DEFAULT_RATE
        self.chunk = DEFAULT_CHUNK
        self.frames = []
        self.lock = threading.Lock()
        self.thread = None

    def open(self, format=DEFAULT_FORMAT, channels=DEFAULT_CHANNELS, rate=DEFAULT_RATE, chunk=DEFAULT_CHUNK, device_index=DEFAULT_DEVICE_INDEX):
        self.format = format
        self.channels = channels
        self.rate = rate
        self.chunk = chunk

        try:
            self.stream = self.p.open(format=format,
                                channels=channels,
                                rate=int(rate),
                                input=True,
                                frames_per_buffer=chunk,
                                input_device_index=device_index)        
            self.frames = []
            self.recording = True
            self.thread = threading.Thread(target=self.record_loop)
            self.thread.start()
        except Exception as e:
            self.recording = False
            print(f"Error in recording thread: {e}")
    
    def record_loop(self):
        try:
            while self.recording: 
                try:
                    data = self.stream.read(self.chunk, exception_on_overflow=False)
                    with self.lock:
                        self.frames.append(data)
                except IOError as e:
                    print(f"IOError in recording thread: {e}")
                except Exception as e:
                    print(f"Error in recording thread: {e}")
        except Exception as e:
            print(f"Error in recording loop: {e}")


    def close(self):
        self.recording = False

        if self.thread and self.thread.is_alive():
            self.thread.join()
        
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()

    def get_frames(self):
        with self.lock:
            return self.frames.copy()

    def save_to_wav(self, file_name=DEFAULT_WAVE_OUTPUT_FILENAME):
        with wave.open(file_name, 'wb') as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.p.get_sample_size(self.format))
            wf.setframerate(self.rate)
            with self.lock:
                wf.writeframes(b''.join(self.frames))

    def get_devices(self):
        input_devices = []
        for i in range(self.p.get_device_count()):
            device_info = self.p.get_device_info_by_index(i)
            if device_info['maxInputChannels'] > 0:
                input_devices.append(device_info)
        
        return input_devices

if __name__ == "__main__":
    import time
    recorder = AudioRecorder()
    recorder.open()
    time.sleep(3)
    recorder.close()
    recorder.save_to_wav()
    # print(recorder.get_devices())