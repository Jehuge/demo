import { useState, useEffect, useCallback } from 'react';

export default function useVoiceAssistant() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');

    const speak = useCallback((text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        // Select a robotic voice if available
        const voices = window.speechSynthesis.getVoices();
        const roboticVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (roboticVoice) utterance.voice = roboticVoice;
        utterance.pitch = 0.8; // Lower pitch for Jarvis-like effect
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
        setResponse(text);
    }, []);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn("Web Speech API not supported");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript;
            setTranscript(text);
            processCommand(text);
        };

        if (isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }

        return () => recognition.abort();
    }, [isListening]);

    const processCommand = (cmd) => {
        const lowerCmd = cmd.toLowerCase();

        if (lowerCmd.includes('hello') || lowerCmd.includes('jarvis')) {
            speak("Greetings. Systems are fully operational.");
        } else if (lowerCmd.includes('status') || lowerCmd.includes('report')) {
            speak("All systems nominal. CPU load at 12 percent. Network secure.");
        } else if (lowerCmd.includes('time')) {
            speak(`The current time is ${new Date().toLocaleTimeString()}`);
        } else if (lowerCmd.includes('who are you')) {
            speak("I am J.A.R.V.I.S. Just A Rather Very Intelligent System.");
        } else {
            speak("I did not catch that. Could you repeat?");
        }
    };

    const toggleListening = () => setIsListening(!isListening);

    return { isListening, toggleListening, transcript, response };
}
