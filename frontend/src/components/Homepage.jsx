import React, { useState, useEffect, useRef } from "react";
import {
  Pagination,
  PaginationItem,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { ReactMediaRecorder } from "react-media-recorder";
import Recorder from "./Recorder";
import axios from "axios";
import { useAuthState } from "react-firebase-hooks/auth";
import Sidebar from "./Sidebar";
import SidebarLayout from "./SidebarLayout";

function Homepage() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [botMessages, setBotMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [response, setResponse] = useState(null);
  const [user] = useAuthState(auth);
  const [showAlert, setShowAlert] = useState(false);
  const [totalMessages, setTotalMessages] = useState([]);
  const [isSubmit, setIsSubmit] = useState(false);
  const [listOfAudio, setListOfAudio] = useState([]);
  const [conversationClearLoading, setConversationClearLoading] = useState(false);
  const [sessionID, setSessionID] = useState("");

  const chatRef = useRef(null);
  const prevMessages = useRef([]);
  const prevBotMessages = useRef([]);


  useEffect(() => {
    // Determine which dependency changed
    const changedMessages = messages !== prevMessages.current ? messages : null;
    const changedBotMessages = botMessages !== prevBotMessages.current ? botMessages : null;

    // Process the changed message
    let lastMessage = null;
    if (changedMessages != null) {
      // Handle changed messages
      console.log('Messages changed:', changedMessages);
      lastMessage = changedMessages.slice(-1)[0];
    }
    if (changedBotMessages != null) {
      // Handle changed bot messages
      console.log('Bot messages changed:', changedBotMessages);
      lastMessage = changedBotMessages.slice(-1)[0];
      if (lastMessage != null) {
        receiveMessageAudioOutput(lastMessage.content);
      }
    }

    if (lastMessage != null) {
      setTotalMessages(prevTotalMessages => [...prevTotalMessages, lastMessage]);
    }

    // Update previous values for the next comparison
    prevMessages.current = messages;
    prevBotMessages.current = botMessages;

    console.log('Total messages:', totalMessages);

  }, [messages, botMessages]);


  useEffect(() => {
    messageResponseFunction();
  }, [messages])



  useEffect(() => {

    chatRef.current && chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [totalMessages]);

  const clearResponsesAndTotalMessages = async () => {
    setConversationClearLoading(false);
    setTotalMessages([]);
    setJobDescription('');
    listOfAudio.forEach(audio => audio.pause());
    setConversationClearLoading(true);
  }

  const submitJobDescription = async () => {
    if (jobDescription.trim() === '') {
      // Show an alert or toast message indicating that the field is required
      setShowAlert(true);
      return; // Do not proceed with submission
    }

    const sidResponse = await axios.post("http://localhost:8080/create_session", { uid: user.uid });
    setSessionID(sidResponse.data.sid);

    axios.post('http://localhost:8080/set_job_description_for_user', {
      text: jobDescription, uid: user.uid, sid: sidResponse.data.sid
    }).then(async (response) => {
      console.log(jobDescription);
      clearResponsesAndTotalMessages();
      messageResponseFunction(sidResponse.data.sid);
      setIsSubmit(true);
    })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  const saveAudio = (audioBlob) => {
    setIsLoading(true);
    listOfAudio.forEach(audio => audio.pause());
    const myMessage = { sender: "me", audioBlob };
    const messageList = [...messages, myMessage];

    console.log(audioBlob);
    fetch(audioBlob)
      .then((res) => res.blob())
      .then(async (audioBlob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.wav");
        axios.post("http://localhost:8080/transcribe_text/", formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then((response) => {
            axios.post("http://localhost:8080/add_message", { uid: user.uid, content: response.data.text, role: "user", sid: sessionID})
            setMessages([...messages, { role: "User", content: response.data.text }])
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      });
  };

  const messageResponseFunction = async (sid = sessionID) => {
    console.log("sid", sid);
    console.log("messages:", messages);
    const response = await axios.post("http://localhost:8080/fetch_response", { sid });
    await axios.post("http://localhost:8080/add_message", { uid: user.uid, content: response.data, role: "assistant", sid })
    setBotMessages([...botMessages, { role: "Celia", content: response.data }])
  
  }

  function createBlobURL(data) {
    const blob = new Blob([data], { type: "audio/mpeg" });
    const url = window.URL.createObjectURL(blob);
    return url;
  }

  const receiveMessageAudioOutput = async (text) => {
    await axios.post("http://localhost:8080/text_to_speech", { text }, { responseType: 'arraybuffer' })
      .then((response) => {
        const blob = response.data;
        const audio = new Audio();
        audio.src = createBlobURL(blob);
        setIsLoading(false);
        console.log("audio ", audio);
        isSubmit && audio.play();

        setListOfAudio([...listOfAudio, audio]);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  const clearResponses = async () => {
    try {
      const response = await axios.delete(`http://localhost:8080/delete_messages/${user.uid}`);
      console.log(response.data.message);
      // Optionally, you can update the state or perform other actions after clearing responses
    } catch (error) {
      console.error("Error:", error);
    }
  }

  useEffect(() => {
    if (totalMessages.length === 0) {
      clearResponses();
    }
  }, [totalMessages]);
  return (
    <SidebarLayout>
      <div className="w-full h-full flex relative items-center justify-center gap-x-4 overflow-hidden">
        {!isSubmit &&
          <div className="w-[600px] h-auto p-4 rounded-2xl drop-shadow-lg bg-slate-100 items-center flex flex-col relative overflow-y-auto no-scrollbar">
              <div className="flex flex-row justify-start gap-x-2 items-center">
                <Avatar src="/Celia.jpg" sx={{ bgcolor: "purple" }}></Avatar>
                <div className="p-2 bg-blue-500 max-w-[600px] drop-shadow-lg rounded-2xl">
                  <Typography sx={{ color: "white", fontFamily: "nunito" }}>
                    Hi! I'm Celia, your virtual job interviewer. To get started, please provide a job description.
                    You can copy and paste any job description from any listing you find online or you can write
                    a brief summary of any job description.
                  </Typography>
                </div>
              </div>

            <TextField
              sx={{ width: "100%", mt: 2 }}
              id="response"
              placeholder="Job Description"
              onChange={(e) => setJobDescription(e.target.value)}
              multiline
              rows={20}
              inputProps={{ style: { fontSize: "0.8rem"} }}
              
            />

            <div className="w-full flex justify-center">
              <Button onClick={submitJobDescription} disabled={isSubmit} sx={{ mt: 2 }} variant="contained">Submit</Button>
            </div>
            {showAlert && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Please enter the job description.
              </Alert>
            )}

          </div>
        }
        {isSubmit &&  
          <div className="w-full h-full overflow-hidden">
            <div ref={chatRef} className="w-[100%] h-[90%] p-2 gap-4 flex flex-col overflow-y-auto no-scrollbar">
              {conversationClearLoading &&
                <>
                  {
                    totalMessages.map((message) => (
                      <>
                        {message.role === "User" &&
                          <div className="flex flex-row justify-end gap-x-2 items-center">
                            <div className="p-2 bg-slate-200 max-w-[800px] drop-shadow-lg rounded-2xl">
                              <Typography sx={{ fontFamily: "nunito" }}>
                                {message.content}
                              </Typography>
                            </div>
                            <Avatar src={user.photoURL} sx={{ bgcolor: "purple" }}></Avatar>
                          </div>
                        }
                        {message.role === "Celia" &&
                          <div className="flex flex-row justify-start gap-x-2 items-center">
                            <Avatar src="/Celia.jpg" sx={{ bgcolor: "purple" }}></Avatar>
                            <div className="p-2 bg-blue-500 max-w-[800px] drop-shadow-lg rounded-2xl">
                              <Typography sx={{ color: "white", fontFamily: "nunito" }}>
                                {message.content}
                              </Typography>
                            </div>

                          </div>
                        }



                      </>
                    ))
                  }
                </>
              }

            </div>
              <div className="flex justify-center h-[5.5rem] bg-[#FFFFFF] sticky bottom-0 gap-x-4 items-center">
              <button
                  className="flex h-[4rem] w-[4rem] bg-white outline-none rounded-full items-center justify-center drop-shadow-md"
                  onClick={() => { setIsSubmit(false); clearResponsesAndTotalMessages(); }}
                >
                  <ArrowBackIosNewIcon />
                </button>
                <Recorder handleStop={saveAudio} />
                
              </div>


        </div>
       

        }

      </div>
    </SidebarLayout>
  );
}

export default Homepage;
