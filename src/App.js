import React, { useEffect, useRef, useState } from "react";
import send from "./assets/sendArrow.png";
import dot from "./assets/dot.png";
import bot from "./assets/bot.png";
import MarkdownPreview from "@uiw/react-markdown-preview";

const App = () => {
  const [key, setKey] = useState(null);
  const [chatbot_id, setChatbot_id] = useState(null);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatID, setChatID] = useState(null);
  const [imagePreview, setImagePreview] = useState(bot);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const scriptTag = document.querySelector("script.build-chat-ai-bot");
    if (scriptTag) {
      const id = scriptTag.getAttribute("key");
      const botid = scriptTag.getAttribute("chatbot_id");
      setKey(id);
      setChatbot_id(botid);
    }
  }, []);

  const options = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  const [chats, setChats] = useState([
    {
      chat: "Hello, How may i assist you today?",
      type: "bot",
      time: new Intl.DateTimeFormat("en-US", options).format(new Date()),
    },
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClickSugession = (suggestion) => {
    handleChatSubmit(suggestion);
  };

  const handleInputChange = (e) => {
    setChatInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleChatSubmit(chatInput);
    }
  };

  const handleChatSubmit = async (e) => {
    let q;
    if (e) {
      q = e;
    } else {
      q = chatInput;
    }
    if (q.trim() === "") return;

    if (chatLoading) {
      return;
    }

    try {
      setError(null);
      setChats((prevChat) => [
        ...prevChat,
        {
          chat: q,
          type: "user",
          time: new Intl.DateTimeFormat("en-US", options).format(new Date()),
        },
      ]);

      setChatLoading(true);
      setIsStreaming(true);
      setStreamingResponse("");
      let chatid = chatID;

      try {
        setChatInput("");
        const response = await fetch(
          `http://localhost:8000/api/v1/access-keys/${key}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: q,
              chatbot_id: chatbot_id,
              session_id: sessionId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get response from the server');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                fullResponse += data.content;
                setStreamingResponse(fullResponse);
                if (data.session_id && !sessionId) {
                  setSessionId(data.session_id);
                }
              } catch (e) {
                console.error("Error parsing stream data:", e);
                setError("Error processing the response. Please try again.");
              }
            }
          }
        }

        setChats((prevChat) => [
          ...prevChat,
          {
            chat: fullResponse,
            type: "bot",
            time: new Intl.DateTimeFormat("en-US", options).format(new Date()),
          },
        ]);
      } catch (error) {
        console.error("Error in streaming:", error);
        setError(error.message || "An error occurred while processing your request. Please try again.");
        setChats((prevChat) => [
          ...prevChat,
          {
            chat: "Sorry, I encountered an error while processing your request. Please try again.",
            type: "bot",
            time: new Intl.DateTimeFormat("en-US", options).format(new Date()),
          },
        ]);
      } finally {
        setChatLoading(false);
        setIsStreaming(false);
        setStreamingResponse("");
      }

      setChatInput("");
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full flex justify-end h-screen">
      {(!key || !chatbot_id) ? (
        <div className="w-[50%] h-[80%] p-5 bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-md w-full">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Configuration Error</h2>
              <p className="text-gray-600 mb-6">
                {!key && !chatbot_id ? "API Key and Chatbot ID are missing" : 
                 !key ? "API Key is missing" : "Chatbot ID is missing"}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <p className="text-sm text-gray-700 mb-2">Please add the following script tag to your HTML:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {`<script class="build-chat-ai-bot" key="your-api-key" chatbot_id="your-chatbot-id"></script>`}
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : imagePreview && (
        <div className="w-[50%] h-[80%] p-5 bg-gray-50">
          <div className="border-2 h-full border-gray-200 flex flex-col justify-between rounded-xl bg-white shadow-lg">
            <div className="rounded-sm w-full flex-1 flex flex-col overflow-y-hidden pb-2">
              <div className="h-[70px] rounded-t-xl border-b border-gray-200 py-4 px-5 flex justify-center items-center bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreview}
                    height={35}
                    width={35}
                    alt="avatar"
                    className="rounded-full shadow-sm"
                  />
                  <h2 className="text-lg font-semibold text-gray-800">
                    AI Assistant
                  </h2>
                </div>
              </div>
              <div className="px-4 w-full h-full overflow-y-scroll pt-4 custom-scrollbar-2">
                {chats.map((chat, index) => (
                  <div
                    key={index}
                    className=" max-w-[786px] mx-auto flex flex-col mb-4"
                  >
                    <div
                      key={index}
                      className="flex gap-3 items-start"
                      style={{
                        justifyContent: chat.type == "bot" ? "start" : "end",
                        flexDirection: chat.type == "bot" ? "" : "row-reverse",
                      }}
                    >
                      {chat.type == "bot" && (
                        <img
                          src={imagePreview}
                          height={35}
                          width={35}
                          alt="avatar"
                          className="rounded-full shadow-sm"
                        />
                      )}
                      <div className="w-fit">
                        <div
                          className={`p-4 rounded-2xl ${
                            chat.type == "bot"
                              ? "bg-gray-100 rounded-tl-none"
                              : "bg-blue-600 text-white rounded-tr-none"
                          }`}
                          style={{
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <div
                            // style={{ overflowWrap: "break-word" }}
                            className={`font-style whitespace-pre-line text-base ${
                              chat.type == "bot"

                                ? "text-gray-800"
                                : "text-white"
                            }`}
                          >
                            <MarkdownPreview
                              source={chat.chat}
                              className="!bg-transparent !text-inherit prose prose-neutral dark:prose-invert max-w-none"
                            />
                            {/* {chat.chat} */}
                          </div>
                        </div>
                        <div
                          className={`mt-1.5 flex ${
                            chat.type == "bot" ? "" : "justify-end"
                          }`}
                        >
                          <p
                            className="text-xs text-gray-500"
                            suppressHydrationWarning
                          >
                            {chat.time}
                          </p>
                        </div>
                      </div>
                    </div>
                    {chat.type === "bot" &&
                      chat.followup &&
                      chat.followup.length > 0 && (
                        <div
                          className="flex flex-col gap-2 border-[0.5px] bg-primary_white p-4 !my-2 rounded-lg mx-5 w-full max-w-[98%]"
                          key={index}
                        >
                          <div className="pl-4 text5"> Suggestions </div>
                          <div className=" flex items-center justify-center gap-2 lg:gap-5">
                            {chat.followup.map((v, i) => (
                              <p
                                key={i}
                                onClick={() => handleClickSugession(v)}
                                className=" flex-1 text5 cursor-pointer p-2 lg:p-4 !text-xs border-[0.5px] rounded-full bg-white text-center transition-all duration-500 hover:scale-[1.03]"
                              >
                                {v}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
                {error && (
                  <div className="max-w-[786px] mx-auto mb-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                {isStreaming && (
                  <div className="flex gap-3 items-start mb-4">
                    <img
                      src={imagePreview}
                      height={35}
                      width={35}
                      alt="avatar"
                      className="rounded-full shadow-sm"
                    />
                    <div className="max-w-[85%]">
                      <div
                        className="p-4 bg-gray-100 rounded-2xl rounded-tl-none"
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <pre
                          style={{ overflowWrap: "break-word" }}
                          className="font-style whitespace-pre-line text-base text-gray-800"
                        >
                          {streamingResponse}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                {chatLoading && !isStreaming && (
                  <div className="flex gap-3 items-start mb-4">
                    <img
                      src={imagePreview}
                      height={35}
                      width={35}
                      alt="avatar"
                      className="rounded-full shadow-sm"
                    />
                    <div className="max-w-[85%]">
                      <div
                        className="p-4 bg-gray-100 rounded-2xl rounded-tl-none"
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite]" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite]" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite]" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div
                  style={{ float: "left", clear: "both" }}
                  ref={messagesEndRef}
                ></div>
              </div>
            </div>
            <div className="w-full flex border-t border-gray-200 p-4 items-center gap-3 bg-white rounded-b-xl">
              <div className="flex-1 flex justify-between items-center rounded-full px-5 py-2 bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                <input
                  className="font-style w-full h-full bg-transparent text-start custom-scrollbar-2 text-base outline-none resize-none placeholder-gray-400"
                  value={chatInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                />
                <button
                  className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  onClick={() => handleChatSubmit(chatInput)}
                  disabled={chatLoading}
                >
                  <img src={send} className="w-5 invert" alt="Send" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
