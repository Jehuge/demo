import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Wifi, Mic, MicOff, MessageSquare } from 'lucide-react';
import useVoiceAssistant from '../hooks/useVoiceAssistant';

export default function HUD() {
    const [cpuLoad, setCpuLoad] = useState(12);
    const { isListening, toggleListening, transcript, response } = useVoiceAssistant();
    const [messages, setMessages] = useState([
        { id: 1, text: "System initialized.", sender: "system" },
        { id: 2, text: "Waiting for voice command...", sender: "jarvis" },
    ]);

    useEffect(() => {
        if (transcript) {
            setMessages(prev => [...prev, { id: Date.now(), text: transcript, sender: "user" }]);
        }
    }, [transcript]);

    useEffect(() => {
        if (response) {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: "jarvis" }]);
        }
    }, [response]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCpuLoad(Math.floor(Math.random() * 20) + 10);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 text-cyan-400 font-mono overflow-hidden">

            {/* Top Bar */}
            <header className="flex justify-between items-start">
                <div className="flex flex-col">
                    <motion.h1
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-6xl font-bold tracking-widest uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                    >
                        JARVIS
                    </motion.h1>
                    <span className="text-xs tracking-[0.5em] opacity-70">SYSTEM ONLINE</span>
                </div>

                <div className="flex gap-4 text-right">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-xs opacity-70">
                            <Cpu size={14} /> CPU
                        </div>
                        <div className="text-xl font-bold">{cpuLoad}%</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-xs opacity-70">
                            <Wifi size={14} /> NET
                        </div>
                        <div className="text-xl font-bold">54 MS</div>
                    </div>
                </div>
            </header>

            {/* Center - Voice Status */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleListening}
                    className={`p-4 rounded-full border-2 ${isListening ? 'border-red-500 text-red-500 animate-pulse' : 'border-cyan-400 text-cyan-400'} bg-black/50 backdrop-blur-sm transition-colors`}
                >
                    {isListening ? <Mic size={32} /> : <MicOff size={32} />}
                </motion.button>
            </div>

            {/* Chat / Log Area */}
            <div className="absolute top-1/3 right-10 w-80 h-64 overflow-hidden pointer-events-auto">
                <div className="border-l-2 border-cyan-400/30 pl-4 h-full flex flex-col justify-end">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`mb-2 text-sm ${msg.sender === 'system' ? 'text-gray-500' : 'text-cyan-300'}`}
                        >
                            <span className="uppercase text-xs opacity-50 mr-2">[{msg.sender}]</span>
                            {msg.text}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            <footer className="flex justify-between items-end">
                <div className="w-64">
                    <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                        <Activity size={14} /> SYSTEM INTEGRITY
                    </div>
                    <div className="h-1 bg-cyan-900 w-full">
                        <motion.div
                            className="h-full bg-cyan-400"
                            initial={{ width: "0%" }}
                            animate={{ width: "98%" }}
                            transition={{ duration: 2 }}
                        />
                    </div>
                </div>

                <div className="text-right text-xs opacity-50">
                    SECURE CONNECTION ESTABLISHED<br />
                    V 4.0.1 ALPHA
                </div>
            </footer>

            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-400 rounded-tl-3xl opacity-50"></div>
            <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-cyan-400 rounded-tr-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-cyan-400 rounded-bl-3xl opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cyan-400 rounded-br-3xl opacity-50"></div>

            {/* Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>
        </div>
    );
}
