import React, {useEffect, useState} from 'react'
import io from 'socket.io-client'

const socket = io.connect('http://localhost:3001')

const Message = () => {
  const [message, setMessage] = useState('')
  const [messageReceived, setMessageReceived] = useState('')
  const sendMessage = () => {
    socket.emit('send_message', {message})
  }

  useEffect(() => {
    socket.on('received_message', data => {
      setMessageReceived(data.message)
    })
  }, [socket])

  return (
    <div className=" flex items-center justify-center h-screen w-screen  ">
      <form className="  bg-white  w-[50%] shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="message"
          type="text"
          placeholder="Votre message ...."
          onChange={e => setMessage(e.target.value)}
        />
        <button
          className=" flex justify-center px-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2  rounded-full"
          onClick={sendMessage}
        >
          Envoyer
        </button>
      </form>
      <h1>Message:{messageReceived}</h1>
    </div>
  )
}

export default Message
