import send from '../images/send.png';

import React, { useState } from 'react';
import useLocalStorageState from 'use-local-storage-state'

import '../App.css';

const CustomPromptSettings = ({ fetchCompletion, transcriptText }) => {
    // const [errorMessage, setErrorMessage] = useState('');
    const [replyCharacter, setReplyCharacter] = useLocalStorageState('replyCharacter', {
        defaultValue: 'Friendly Person'
    })
    const [replyTone, setReplyTone] = useLocalStorageState('replyTone', {
        defaultValue: 'Friendly'
    })
    const [replyStyle, setReplyStyle] = useLocalStorageState('replyStyle', {
        defaultValue: 'Relaxed'
    })
    const [replyFormat, setReplyFormat] = useLocalStorageState('replyFormat', {
        defaultValue: 'Message'
    })
    const [replyLength, setReplyLength] = useLocalStorageState('replyLength', {
        defaultValue: 'Very Short'
    })

    const [prompt, setPrompt] = useState('')

    // const [userData, setUserData] = useState({
    //     email: '',
    //     password: ''
    // });

    // const handleChange = e => {
    //     setUserData({
    //         ...userData,
    //         [e.target.name]: e.target.value
    //     });
    // };

    return (
        <div>
            <fieldset className='noTextSelect'>
                <legend>Custom Prompt:</legend>
                <label htmlFor="replyCharacter"> Character: </label>
                <select
                    id="replyCharacter"
                    name="replyCharacter"
                    value={replyCharacter}
                    onChange={(event) => setReplyCharacter(event.target.value)}
                >
                    <option value="Friendly Person">Default</option>
                    <option value="AI Assistant">AI Assistant</option>
                    <option value="Friend">Friend</option>
                    <option value="Standup Comedian">Standup Comedian</option>
                    <option value="Life Coach">Life Coach</option>
                    <option value="Career Counselor">Career Counselor</option>
                    <option value="Nutritionist">Nutritionist</option>
                    <option value="Product Manger">Product Manger</option>
                    <option value="Personal Trainer">Personal Trainer</option>
                    <option value="Life Hacker">Life Hacker</option>
                    <option value="Travel Advisor">Travel Advisor</option>
                    <option value="Mindfulness Coach">Mindfulness Coach</option>
                    <option value="Financial Advisor">Financial Advisor</option>
                    <option value="Language Tutor">Language Tutor</option>
                    <option value="Travel Guide">Travel Guide</option>
                    <option value="Marketing Expert">Marketing Expert</option>
                    <option value="Software Developer">Software Developer</option>
                    <option value="Dating Coach">Dating Coach</option>
                    <option value="DIY Expert">DIY Expert</option>
                    <option value="Journalist">Journalist</option>
                    <option value="Tech Writer">Tech Writer</option>
                    <option value="Professional Chef">Professional Chef</option>
                    <option value="Professional Salesperson">
                        Professional Salesperson
                    </option>
                    <option value="Startup Tech Lawyer">Startup Tech Lawyer</option>
                    <option value="Graphic Designer">Graphic Designer</option>
                    <option value="Academic Researcher">Academic Researcher</option>
                    <option value="Custom Support Agent">
                        Custom Support Agent
                    </option>
                    <option value="HR Consultant">HR Consultant</option></select
                ><br />

                <label htmlFor="replyTone"> Tone: </label>
                <select
                    id="replyTone"
                    name="replyTone"
                    value={replyTone}
                    onChange={(event) => setReplyTone(event.target.value)}
                >
                    <option value="Friendly">Default</option>
                    <option value="Casual">Casual</option>
                    <option value="Assertive">Assertive</option>
                    <option value="Authoritative">Authoritative</option>
                    <option value="Confident">Confident</option>
                    <option value="Condescending">Condescending</option>
                    <option value="Diplomatic">Diplomatic</option>
                    <option value="Direct">Direct</option>
                    <option value="Formal">Formal</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Humorous">Humorous</option>
                    <option value="Inspiring">Inspiring</option>
                    <option value="Intense">Intense</option>
                    <option value="Irritable">Irritable</option>
                    <option value="Joking">Joking</option>
                    <option value="Polite">Polite</option>
                    <option value="Sarcastic">Sarcastic</option>
                    <option value="Sincere">Sincere</option>
                    <option value="Soothing">Soothing</option>
                    <option value="Stern">Stern</option>
                    <option value="Sympathetic">Sympathetic</option>
                    <option value="Tactful">Tactful</option>
                    <option value="Witty">Witty</option></select
                ><br />

                <label htmlFor="replyStyle"> Style: </label>
                <select
                    id="replyStyle"
                    name="replyStyle"
                    value={replyStyle}
                    onChange={(event) => setReplyStyle(event.target.value)}
                >
                    <option value="Relaxed">Default</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Academic">Academic</option>
                    <option value="Analytical">Analytical</option>
                    <option value="Argumentative">Argumentative</option>
                    <option value="Creative">Creative</option>
                    <option value="Critical">Critical</option>
                    <option value="Descriptive">Descriptive</option>
                    <option value="Explanatory">Explanatory</option>
                    <option value="Informative">Informative</option>
                    <option value="Instructive">Instructive</option>
                    <option value="Investigative">Investigative</option>
                    <option value="Narrative">Narrative</option>
                    <option value="Persuasive">Persuasive</option>
                    <option value="Poetic">Poetic</option>
                    <option value="Satirical">Satirical</option>
                    <option value="Technical">Technical</option>
                </select>
                <br />

                <label htmlFor="replyFormat"> Format: </label>
                <select
                    id="replyFormat"
                    name="replyFormat"
                    value={replyFormat}
                    onChange={(event) => setReplyFormat(event.target.value)}
                >
                    <option value="Message">Default</option>
                    <option value="Chat">Chat</option>
                    <option value="Email">Email</option>
                    <option value="Concise">Concise</option>
                    <option value="Step-by-step">Step-by-step</option>
                    <option value="Extreme Detail">Extreme Detail</option>
                    <option value="Explain Like I'm Five">
                        Explain Like I'm Five
                    </option>
                    <option value="Blog post">Blog post</option>
                    <option value="Social media post">Social media post</option>
                    <option value="Suggestion">Suggestion</option>
                </select>
                <br />

                <label htmlFor="replyLength"> Length: </label>
                <select
                    id="replyLength"
                    name="replyLength"
                    value={replyLength}
                    onChange={(event) => setReplyLength(event.target.value)}
                >
                    <option value="Normal">Default</option>
                    <option value="Very short">Very short</option>
                    <option value="Short">Short</option>
                    <option value="Medium">Medium</option>
                    <option value="Long">Long</option>
                    <option value="Very long">Very long</option>
                </select>
                <br /><br />
                <div className={`noTextSelect`}>
                    <textarea
                        id="chatMessageBox"
                        placeholder="Write Custom Prompt"
                        className={`chatMessageBox`}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                fetchCompletion(`As a ${replyCharacter} give a ${replyLength} length ${replyTone} and ${replyStyle} reply in ${replyFormat} format to the the following prompt about a youtube video content: \n\nPROMPT:\n${prompt} \n\nVIDEO SUBTITLES/TRANSCRIPT: \n${transcriptText} `);
                            }
                        }}
                    ></textarea>
                    <div>
                        <img
                            title="Send"
                            alt="ChatSend"
                            className="icons"
                            style={{ marginLeft: "auto" }}
                            src={send}
                            onClick={() => {
                                fetchCompletion(`As a ${replyCharacter} give a ${replyLength} length ${replyTone} and ${replyStyle} reply in ${replyFormat} format to the the following prompt about a transcript of a video: \n\nPROMPT:\n${prompt} \n\nVIDEO SUBTITLES/TRANSCRIPT: \n${transcriptText} `);
                            }}
                        />
                    </div>
                </div>
            </fieldset>
        </div>
    );
};

export default CustomPromptSettings