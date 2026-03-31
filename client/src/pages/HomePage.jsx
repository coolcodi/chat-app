import React, { useContext, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'

function HomePage() {
  const {selectedUser}= useContext(ChatContext);

    return (
        <div className="border w-full h-screen sm:px-[15%] sm:py-[5%] text-white">

            <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl 
                overflow-hidden h-full grid grid-cols-3 relative    ${selectedUser ? "grid-cols-[1fr_2.5fr_1fr]" : "grid-cols-[2fr_3fr]"}`}>

                <Sidebar  />
                <ChatContainer/>
                <RightSidebar  />

            </div>

        </div>
    )
}

export default HomePage
