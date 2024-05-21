import { useCallback, useState } from 'react'
import ReactTextareaAutosize from 'react-textarea-autosize'
import { IconSend } from '@tabler/icons-react'

import Button from './components/Button'
import useConversation from './hooks/useConversation'
import { calcTokenUsage } from './utils/textUtils'
import TypingAnimation from './components/TypingAnimation'
import { ollamaApiCall } from './api/ollama'
import { formatTimestamp } from './utils/numberUtils'
import './App.css'

function App() {
  // const [response, setResponse] = useState('')
  const [userInput, setUserInput] = useState('')
  const [updateConversation, conversation] = useConversation()
  const [pendingResponse, setPendingResponse] = useState(false)

  const sendMessage = useCallback(
    async (input: string) => {
      setPendingResponse(true)
      let responseMessage = ''


      // Hack to force state update inside updateConversation to next tick
      setTimeout(() => {}, 500)

      await ollamaApiCall(input, () => {
        setPendingResponse(false)
        responseMessage += input

        updateConversation({
          role: 'assistant',
          content: responseMessage,
          timestamp: null,
          streamingResponse: true
        })
      })

      updateConversation({
        role: 'assistant',
        content: responseMessage,
        timestamp: Date.now(),
        streamingResponse: true
      })
    },
    [updateConversation]
  )

  const handleEnterKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        updateConversation({
          role: 'user',
          content: userInput,
          timestamp: Date.now(),
          streamingResponse: false
        })
        sendMessage(userInput)
        setUserInput('')
      }
    },
    [sendMessage, userInput]
  )

  return (
    <div className="flex flex-col gap-1 w-full">
      <h1>Simple AI Chat UI</h1>
      <div className="flex flex-row gap-2 items-end">
        <ReactTextareaAutosize
          id="message"
          maxRows={6}
          minRows={1}
          className="min-h-[46px] block p-2.5 w-full text-md text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleEnterKeyDown}
          placeholder="Your message to an AI assistant"
          value={userInput}
        />
        <Button
          onClick={() => {
            updateConversation({
              role: 'user',
              content: userInput,
              timestamp: Date.now(),
              streamingResponse: false
            })
            sendMessage(userInput)
            setUserInput('')
          }}
        >
          <IconSend />
        </Button>
      </div>
      <div className="flex flex-row gap-2 text-xs mb-2">
        {userInput.length} {userInput.length === 1 ? 'character' : 'characters'}{' '}
        / {calcTokenUsage('user', userInput)}{' '}
        {calcTokenUsage('user', userInput) === 1 ? 'token' : 'tokens'}
      </div>
      <div className="flex flex-col gap-4 w-full">
        {pendingResponse && (
          <div className={`flex flex-col w-full gap-1 pl-[40%] items-end`}>
            <div
              className={`flex flex-row gap-2 text-left text-sm rounded-md p-2.5 bg-gray-600 text-white`}
            >
              <TypingAnimation />
            </div>
          </div>
        )}
        {conversation.map((message) => (
          <div
            className={`flex flex-col w-full gap-1
            ${message.role === 'assistant' ? 'pl-[20%] md:pl-[40%] items-end' : 'pr-[20%] md:pr-[40%] items-start'}
            `}
            key={message.timestamp}
          >
            <div
              className={`flex flex-row gap-2 text-left text-sm rounded-md p-2.5
                ${message.role === 'assistant' ? 'bg-gray-600 text-white' : 'bg-blue-500 text-white'}`}
            >
              {!message.content ? (
                <TypingAnimation />
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\n/g, '<br />')
                  }}
                  style={{
                    wordBreak: 'break-all'
                  }}
                />
              )}
            </div>
            {message.timestamp && (
              <div className="text-xs">
                {formatTimestamp(message.timestamp)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
