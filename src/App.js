import logo from './logo.png';
import timestamp from './images/timestamp.png';
import copy from './images/copy.png';
import copyDone from './images/copyDone.png';
import settings from './images/settings.png';
import darkModeIcon from './images/darkMode.png';
import rewrite from './images/rewrite.png';
import summarize from './images/summarize.png';
import summarizeInBullets from './images/summarizeInBullets.png';
import customPrompt from './images/customPrompt.png';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { AES, enc } from 'crypto-js';
import OpenAI from "openai";
import axios from 'axios';
import { loadStripe } from "@stripe/stripe-js";

import React, { useState, useEffect } from 'react';
import Register from './components/register';
import Login from './components/login';
import CustomPromptSettings from './components/customPromptSettings';
import './App.css';

function App() {
  const [link, setLink] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [resultLoading, setResultLoading] = useState(true);
  const [displayTimestamps, setDisplayTimestamps] = useState(true);
  const [copyClicked, setCopyClicked] = useState(false);
  const [saveClicked, setSaveClicked] = useState(false);
  const [deleteClicked, setDeleteClicked] = useState(false);
  const [menuSelection, setMenuSelection] = useState("transcription");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [darkMode, setdarkMode] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [user, setUser] = useState(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showCustomPromptSettings, setShowCustomPromptSettings] = useState(false);

  const secretKey = process.env.REACT_APP_SECRET_KEY;
  const stripePromise = loadStripe(`${process.env.REACT_APP_STRIPE_PUBLISHABLE_API_KEY}`);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setResultLoading(false);
        return;
      };

      // Attach the token to future instance of axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const { data: user } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/check-user`);
        setUser(user);
      } catch (err) {
        console.error(err);
        if (err.response.data.error === "Invalid Request" || err.response.data.error === "User Not Found") {
          logOut();
        }
        setResultLoading(false);
      }
    };

    checkUser();
  }, []);

  //////////Stripe///////////
  useEffect(() => {
    if (user && user.email) {
      const checkSubscription = async (email, priceId) => {
        setResultLoading(true);
        try {
          const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/check_subscription`,
            { email: email, priceId: priceId });

          if (response.data.activeSubscription) {
            console.log("Subscription active");
            console.log(response);
            setSubscriptionActive(true);
          }
        } catch (error) {
          if (!error.response.data.activeSubscription) {
            console.log("Error finding active subscription");
            console.log(error.response.data.error);
            setSubscriptionActive(false);
          }
        }

        setResultLoading(false);
      };

      checkSubscription(user.email, 'price_1NpmDgBFwI6dKFfnYJLlkb9x');
    }
  }, [user, subscriptionActive]);

  const handleCheckout = async () => {
    const stripe = await stripePromise;

    const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/stripe-create-checkout-session`, { priceId: 'price_1NpmDgBFwI6dKFfnYJLlkb9x', email: user.email, name: user.name });
    const session = await response.data.sessionId;

    const result = await stripe.redirectToCheckout({
      sessionId: session,
    });

    if (result.error) {
      alert(result.error.message);
    }
  };
  ////////////////////

  useEffect(() => {
    const fetchApiKey = async () => {
      const encryptedKey = localStorage.getItem('apiKey');

      // Check if encryptedKey is not defined or empty
      if (!encryptedKey || encryptedKey === "") {
        return "";
      }

      // Decrypt the API key
      const bytes = AES.decrypt(encryptedKey, secretKey);
      const originalKey = bytes.toString(enc.Utf8);

      // Set apiKey state
      setApiKey(originalKey);

      console.log("API Key fetched");
    };

    fetchApiKey();
    fetchDarkMode();
  }, [secretKey]);

  const logOut = () => {
    // remove the token from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('darkMode');
    localStorage.removeItem('apiKey');

    // set the user state to null
    setUser(null);
    setApiKey('');
    setdarkMode(false);
    console.log("Logout success");
  };

  const fetchTranscripts = async (event) => {
    event.preventDefault();

    setResultLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/fetch-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link }),
      });

      const data = await response.json();
      console.log(data);
      console.log("videoData Received");

      setResultLoading(false);
      setVideoData(data);
      setAiResult("");
      setMenuSelection("transcription");
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompletion = async (prompt) => {
    if (apiKey) {
      setResultLoading(true);
      try {
        const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

        const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo-16k-0613",
        });
        setResultLoading(false);
        setAiResult(chatCompletion.choices[0].message.content);
        setMenuSelection("aiAssistant");
        console.log("Ai result:\n", chatCompletion);
      } catch (error) {
        setResultLoading(false);
        setAiResult(`"Error during chat completion:\n", ${error}`);
        console.error("Error during chat completion:\n", error);
      }
    } else {
      setAiResult("Add OpenAi API key in the settings ⚙️ to use Ai Assistant.");
    }
  };

  const saveApiKey = async (event) => {
    event.preventDefault();
    const encryptedKey = AES.encrypt(apiKey, secretKey);

    await localStorage.setItem('apiKey', encryptedKey);
    console.log("API Key saved");
  };

  const deleteApiKey = async (event) => {
    event.preventDefault();

    await localStorage.removeItem('apiKey');
    setApiKey('');
    console.log("API Key deleted");
  };

  function convertMSecToHHMMSS(inputMilliseconds) {
    const totalSeconds = Math.floor(inputMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    const seconds = totalSeconds - (hours * 3600) - (minutes * 60);

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  function convertSecToHHMMSS(inputMilliseconds) {
    const totalSeconds = Math.floor(inputMilliseconds / 1);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    const seconds = totalSeconds - (hours * 3600) - (minutes * 60);

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  const transcriptText = videoData && videoData.transcript[0] ? videoData.transcript.reduce((text, subtitles) => {
    return displayTimestamps ?
      text + convertMSecToHHMMSS(subtitles.offset) + " " + subtitles.text + "\n" :
      text + subtitles.text + "\n"
  }, "") : "";

  function handleClearResults() {
    setLink("");
    setVideoData(null);
  }

  function handleCopyClicked() {
    setCopyClicked(true);
    setTimeout(() => setCopyClicked(false), 1000);
  }

  function handleSaveClicked() {
    setSaveClicked(true);
    setTimeout(() => setSaveClicked(false), 1000);
  }

  function handleDeleteClicked() {
    setDeleteClicked(true);
    setTimeout(() => setDeleteClicked(false), 1000);
  }

  const handleDarkModeClick = async (event) => {
    event.preventDefault();
    await localStorage.setItem('darkMode', !darkMode);
    setdarkMode(state => !state);
  }

  const fetchDarkMode = async () => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
      setdarkMode(storedDarkMode);
    }
  }

  return (
    <div className={darkMode ? ("darkMode") : (undefined)}>
      <br />
      <div className={`main`}>
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <div className={`${'card'} `}>

          <div className='header'>
            <div className="header-group">
              <img className="logo" alt="logo" src={logo} />&nbsp;<h2><span style={{ color: "rgb(225, 0, 125)" }}>U</span><span style={{ color: "rgb(125, 125, 125, 0.8)" }}>transcript</span></h2>
            </div>
          </div>

          {resultLoading && (<div style={{ fontFamily: "monospace", color: "rgb(255, 255, 255)", textAlign: "center", padding: "5px", fontSize: "1.5em", backgroundColor: "rgb(98, 95, 255)", position: "fixed", top: "1vh", left: "40vw", zIndex: "100" }}>
            <div className='typewriter'>Loading</div>
          </div>)}
          {
            !user ? (
              !resultLoading &&
              (<div className='login-group'>
                {!showSignUp && (
                  <div className='loginDiv'>
                    <Login setUser={setUser} setShowSignUp={setShowSignUp} />
                  </div>
                )}
                {showSignUp && (
                  <div className='registerDiv'>
                    <Register setUser={setUser} setShowSignUp={setShowSignUp} />
                  </div>
                )}
              </div>)
            )
              :
              !subscriptionActive || subscriptionActive === false ? (
                !resultLoading &&
                (
                  <div>
                    <u style={{ cursor: 'pointer' }} onClick={handleCheckout}><h3>Subscribe</h3></u><br />
                    <u style={{ cursor: "pointer", fontWeight: "bold" }} onClick={logOut}>Logout</u>
                  </div>
                )
              )
                :
                (
                  <div>
                    <div className='siteFeaturesContainer'>
                      <div className="inputDiv noTextSelect">
                        <br />
                        <form onSubmit={fetchTranscripts}>
                          <div>
                            <label htmlFor="link">Paste youtube video link here</label><br />
                            <input
                              type="text"
                              name="link"
                              className="input__field"
                              value={link}
                              onChange={(e) => setLink(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=7d16CpWp-ok"
                            />
                          </div>
                          <div className="button-group">
                            <input className="button2" type="submit" value="Submit" />
                            <b
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => handleClearResults(e)}
                            >Reset</b>
                            <div style={{ marginLeft: "auto" }}>
                              <img title="Light/Dark" className="icons" alt="Light/Dark mode" src={darkModeIcon}
                                onClick={(event) => handleDarkModeClick(event)} />&nbsp;&nbsp;
                              <img title="Settings" className="icons" alt="settings" src={settings}
                                onClick={(event) => setShowSettings(state => !state)} />
                            </div>
                            <u style={{ cursor: "pointer", fontWeight: "bold" }} onClick={logOut}>Logout</u>
                          </div>
                        </form>
                      </div>

                      {showSettings && (
                        <div className='settingsSection'>
                          <form
                            onSubmit={saveApiKey}
                          >
                            <div className="settinsInputDiv">
                              <label htmlFor="link">Add OpenAi API key to enable Ai assistant</label><br />
                              <input
                                type="text"
                                name="apiKey"
                                className="input__field"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste your OpenaAi api key here"
                              />
                              <div>
                                <input onClick={handleSaveClicked} className="settingsSubmitButton" type="submit" value={saveClicked ? ("  ✔  ") : ("Save")} />
                                <button
                                  className="settingsDeleteButton"
                                  onClick={(e) => { deleteApiKey(e); handleDeleteClicked(e); }}
                                >
                                  {deleteClicked ? ("  ✔  ") : ("Delete")}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      )}

                      <div className='results'>
                        {videoData && (
                          <div className='resultsContainer'>

                            <div className='result-videoInfo'>
                              {videoData && videoData.videoInfo.title ? (
                                <div>
                                  <a title="Play the video" href={`${videoData.videoInfo.url}`} rel="noreferrer" target="_blank"><img alt="video thumbnail" src={`${videoData.videoInfo.thumbnailUrl}`} className='result-thumbnail noTextSelect' /></a><br />
                                  <span><b>Title: </b>{videoData.videoInfo.title}</span><br />
                                  <span><b>Owner: </b>{videoData.videoInfo.owner}</span><br />
                                  <span><b>Published on: </b>{videoData.videoInfo.datePublished}</span><br />
                                  <span><b>Genre: </b>{videoData.videoInfo.genre}</span><br />
                                  <span><b>Duration: </b>{convertSecToHHMMSS(videoData.videoInfo.duration)}</span><br />
                                  <span><b>Views: </b>{videoData.videoInfo.views}</span><br />
                                  <span><b>Description: </b>{videoData.videoInfo.description}</span>
                                </div>
                              ) : videoData && videoData.videoInfo.error && (
                                <div>
                                  <p>
                                    {/* {videoData.videoInfo.error} */}
                                    Video doesn't exist anymore or video link is incorrect.
                                  </p>
                                </div>
                              )
                              }
                              <br />
                            </div>

                            <div className='result-transcript'>
                              {videoData && videoData.videoInfo.title && (
                                <div className='noTextSelect'>
                                  <span title='Transcription Tab' style={{ cursor: "pointer" }} className={menuSelection === "transcription" ? (`${"active"}`) : (undefined)} onClick={(event) => setMenuSelection("transcription")}>TRANSCRIPTION</span>&nbsp;&nbsp;
                                  |&nbsp;&nbsp;<span title='Ai Assistant Tab' style={{ cursor: "pointer" }} className={menuSelection === "aiAssistant" ? (`${"active"}`) : (undefined)} onClick={(event) => setMenuSelection("aiAssistant")}>AI ASSISTANT</span>
                                  <br /><br />
                                </div>
                              )}

                              {/* //////transcriptions////// */}
                              {videoData && videoData.videoInfo.title && menuSelection === "transcription" &&
                                (videoData.transcript[0] ? (
                                  <div style={{ minHeight: "50vh" }} id='transcriptionContents'>
                                    <div>
                                      <div className="button-group">
                                        <span onClick={(event) => setDisplayTimestamps(state => !state)}><img className="icons" src={timestamp} title="Toggle Timestamps" alt='Toggle timestamps' /></span>
                                        <CopyToClipboard text={transcriptText}>
                                          <span onClick={handleCopyClicked} style={{ cursor: "pointer" }}>
                                            <img
                                              // onClick={(event) => alert("Transcript copied")} 
                                              className="icons" src={copyClicked ? copyDone : copy} title="Copy" alt='Copy' /></span>
                                        </CopyToClipboard>
                                      </div>
                                      {videoData.transcript.map((subtitles, index) => (
                                        <div key={index}>
                                          {displayTimestamps && (<span>
                                            <a target="_blank" title={`Play ${convertMSecToHHMMSS(subtitles.offset)}`} rel="noreferrer" href={`https://youtu.be/${videoData.videoInfo.videoId}?t=${Math.floor(subtitles.offset / 1000)}`}><span>
                                              {convertMSecToHHMMSS(subtitles.offset)}
                                            </span></a>&nbsp;&nbsp;
                                          </span>
                                          )}
                                          <span>
                                            {subtitles.text}
                                          </span><br />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p>
                                      {/* {videoData.transcript.error} */}
                                      Transcription is disabled on this video.
                                    </p>
                                  </div>
                                )
                                )
                              }

                              {/* //////aiResults////// */}
                              {videoData && videoData.videoInfo.title && menuSelection === "aiAssistant" &&
                                (apiKey !== "" ? (
                                  videoData.transcript[0] ? (
                                    <div style={{ minHeight: "50vh" }} id='aiAssistantContents'>
                                      <div>
                                        <div className="button-group noTextSelect">
                                          <span
                                          // onClick={rewriteTranscription}
                                          ><img className="icons" src={rewrite} title="Re-write Transcript" alt='Re-write transcript'
                                            onClick={(event) => {
                                              fetchCompletion(`Re-write the following transcript of a video(${videoData.videoInfo.genre}):\n${transcriptText}`);
                                              setShowCustomPromptSettings(false);
                                            }}
                                            /></span>
                                          <span
                                          // onClick={summarizeTranscriptionInBullets}
                                          ><img className="icons" src={summarizeInBullets} title="Summarize Transcript With Bullet Points" alt='Summarize transcript with bullet points'
                                            onClick={(event) => {
                                              fetchCompletion(`Summarize the following transcript of a video(${videoData.videoInfo.genre}) with bullet points:\n${transcriptText}`);
                                              setShowCustomPromptSettings(false);
                                            }}
                                            /></span>
                                          <span
                                          // onClick={summarizeTranscription}
                                          ><img className="icons" src={summarize} title="Summarize Transcript" alt='Summarize transcript'
                                            onClick={(event) => {
                                              fetchCompletion(`Summarize the following transcript of a video(${videoData.videoInfo.genre}):\n${transcriptText}`);
                                              setShowCustomPromptSettings(false);
                                            }}
                                            /></span>
                                          <span
                                          // onClick={summarizeTranscription}
                                          ><img className="icons" src={customPrompt} title="Create Custom Prompt" alt='Create custom prompt'
                                            onClick={(event) => setShowCustomPromptSettings(state => !state)}
                                            /></span>
                                          <CopyToClipboard text={aiResult}>
                                            <span onClick={handleCopyClicked} style={{ cursor: "pointer" }}>
                                              <img
                                                className="icons" src={copyClicked ? copyDone : copy} title="Copy" alt='Copy' /></span>
                                          </CopyToClipboard>
                                        </div>
                                        {showCustomPromptSettings && (
                                          <div className='customPromptSettings'>
                                            <CustomPromptSettings fetchCompletion={fetchCompletion} transcriptText={transcriptText} />
                                          </div>
                                        )}
                                        {aiResult ? (
                                          <div>
                                            <hr />
                                            <div>
                                              {aiResult.split("\n").map((line, i) => (
                                                <React.Fragment key={i}>
                                                  {line}
                                                  <br />
                                                </React.Fragment>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div>{aiResult.split("\n").map((line, i) => (
                                            <React.Fragment key={i}>
                                              {line}
                                              <br />
                                            </React.Fragment>
                                          ))}</div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <p>
                                        {/* {videoData.transcript.error} */}
                                        Transcription is disabled on this video.
                                      </p>
                                    </div>
                                  )
                                ) : (
                                  <div>
                                    <p>
                                      Add OpenAi API key in the settings ⚙️ to use Ai Assistant.
                                    </p>
                                  </div>)
                                )
                              }


                            </div>

                          </div>
                        )}

                      </div>
                    </div>
                  </div>)
          }
        </div>
        <br />


      </div >
    </div >
  );
}

export default App;