import React, { useState } from 'react';
import axios from 'axios';

const Registration = ({ setUser, setShowSignUp }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const [resultLoading, setResultLoading] = useState(false);

    const [userData, setUserData] = useState({
        name: '',
        userName: '',
        email: '',
        password: ''
    });

    const handleChange = e => {
        setUserData({
            ...userData,
            [e.target.name]: e.target.value
        });
    };

    const register = async () => {
        setResultLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/register`, userData, { withCredentials: true });
            // save the token and user data to local storage
            localStorage.setItem('token', res.data.token);

            setUser(res.data); // update the App state with the current user data
            console.log("registration success");
            setResultLoading(false);
        } catch (err) {
            console.error(err);
            // If error response exists use it else use err.message
            setErrorMessage(err.response ? err.response.data.error : err.message);
            setResultLoading(false);
        }
    };

    return (
        <div>
            {resultLoading && (<div style={{ fontFamily: "monospace", color: "rgb(255, 255, 255)", textAlign: "center", padding: "5px", fontSize: "1.5em", backgroundColor: "rgb(98, 95, 255)", position: "fixed", top: "1vh", left: "40vw", zIndex: "100" }}>
                <div className='typewriter'>Loading</div>
            </div>)}
            <h2>SIGN UP</h2>
            {errorMessage && (<span><i style={{ color: "red" }}>{errorMessage}</i><br /></span>)}
            <label htmlFor="name">Full Name<span>*</span></label><br />
            <input type="text" name="name" onChange={handleChange} /><br />
            <label htmlFor="userName">Username<span>*</span></label><br />
            <input type="text" name="userName" onChange={handleChange} /><br />
            <label htmlFor="email">Email<span>*</span></label><br />
            <input type="email" name="email" onChange={handleChange} /><br />
            <label htmlFor="password">Password<span>*</span></label><br />
            <input type="password" name="password" onChange={handleChange} /><br /><br />
            <button className="button2" onClick={register}>SIGN UP</button><br /><br />
            <u style={{ cursor: "pointer" }} onClick={(event) => setShowSignUp(state => !state)} >Login to existing account</u>
        </div>
    );
};

export default Registration;