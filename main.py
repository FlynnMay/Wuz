# from discordInteractor import Interactor
from speaker import queue
import ollama
import keyboard
from audioRecorder import AudioRecorder
from audioTranscriber import AudioTranscriber

record = False
transcriber = AudioTranscriber()
recorder = AudioRecorder()
device = None

mimic = False

def enable_mimic():
    global mimic
    mimic = True

def disable_mimic():
    global mimic
    mimic = False

commands = [
    {
        'response_format': "[command][mimic]",
        'explanation': "use when i ask you to write what i say to the console, or ask you to take notes",
        'action': enable_mimic
    },
    {
        'response_format': "[command][end_mimic]",
        'explanation': "use when i ask you to stop writing what i say to the console, or ask you to stop taking notes",
        'action': disable_mimic
    }
]

command_prompts = '\n'.join(f"response format: {command['response_format']}, explanation: {command['explanation']}" for command in commands)

messages = [
    {
            'role': 'user',
            'content': f'Make your response very brief and provide no other information then what is asked. You are obama respond how they would, unless my message sounds like a command then respond as requested by the following commands response format. My prompt will sound like a command if it matches the explanation of one of the commands. When responding to a command you must only respond using the command response format. The following are the commands. {command_prompts}.',
    }
]


def check_for_commands(response: str) -> bool:
    command_found = False
    print(("[command]" in response))
    if("[command]" in response):
        for command in commands:
            print(f"{command['response_format']} == {response} = {command['response_format'] in response}")
            if command['response_format'] in response:
                command['action']()
                command_found = True

    return command_found

def toggle_recording():
    global record
    record = not record

    if record:
        on_start_recording()
    else:
        on_end_recording()

def on_start_recording():
    print("Microphone is recording!")
    recorder.open(channels=device["maxInputChannels"], rate=device['defaultSampleRate'], chunk=4096, device_index=device["index"])

def on_end_recording():
    print("Microphone is no longer recording!")
    try:
        recorder.close()
        recorder.save_to_wav("recorded.wav")
        segments, info = transcriber.transcribe("recorded.wav")

        transcription = ''.join(segment.text for segment in segments)

        if mimic:
            print(transcription)

        message = {
            'role': 'user',
            'content': f'Remember to keep your response brief and follow all relavent instructions. {transcription}',
        }

        messages.append(message)

        response = ollama.chat(model='llama3.1', messages=messages)
        
        command_found = check_for_commands(response['message'])

        messages.append(response['message'])

        print(response['message'])

        if not command_found:
            queue("obama", response['message']['content'])
    except:
        print("an error occured")

    

def main():
    devices = recorder.get_devices()
    print("================================")
    print(f"Device List")
    print("================================")
    for i, d in enumerate(devices):
        print(f"({i}) {d["name"]}")
    print("================================")
    
    while True:
        try:
            index = int(input(f"Select Input Device (0-{len(devices)-1}): "))
            if 0 <= index < len(devices):
                global device
                device = devices[index]
                print(device)
                break  # Exit the loop once a valid index is selected
            else:
                print(f"Please enter a number between 0 and {len(devices)-1}.")
        except ValueError:
            print("Invalid input. Please enter a number.")

    keyboard.add_hotkey('space', lambda: toggle_recording())
    print("Press 'space' to toggle recording.")

    # keyboard.wait()

    # while True:
    #     # Prompt for the voice argument
    #     voice = input("Enter a voice (/exit to quit): ")

    #     if voice.lower() == '/exit':
    #         print("Exiting...")
    #         break

    #     # Prompt for the prompt argument
    #     prompt = input("Enter a prompt (/exit to quit): ")

    #     if prompt.lower() == '/exit':
    #         print("Exiting...")
    #         break

    #     queue(voice, response['message']['content'])


if __name__ == "__main__":
    main()

#pip install --force-reinstall "faster-whisper @ https://github.com/SYSTRAN/faster-whisper/archive/refs/heads/master.tar.gz"
#pip install nvidia-cublas-cu12 nvidia-cudnn-cu12==8.9.7.29
#export LD_LIBRARY_PATH=`python3 -c 'import os; import nvidia.cublas.lib; import nvidia.cudnn.lib; print(os.path.dirname(nvidia.cublas.lib.__file__) + ":" + os.path.dirname(nvidia.cudnn.lib.__file__))'`
#export LD_LIBRARY_PATH=`python3 -c 'import os; import nvidia.cublas.lib; import nvidia.cudnn.lib; print(os.path.dirname(nvidia.cublas.lib.__file__) + ":" + os.path.dirname(nvidia.cudnn.lib.__file__))'`

# pip install nvidia-cublas-cu12 nvidia-cudnn-cu12
