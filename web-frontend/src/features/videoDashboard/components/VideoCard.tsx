import React, { useRef, useEffect } from 'react'
import UserIndicator from '../../../components/UserIndicator'
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteVideoTrack,
} from 'livekit-client'
import type { VideoCardProps } from '../types/VideoCardProps'
import { usePresenceStore } from '@/stores/usePresenceStore'
import { useSnapshot } from '../hooks/useSnapshot';
import AddModal from '@/components/ModalComponent'

/**
 * VideoCard
 *
 * Renders a LiveKit video stream for a single user, with Play/Stop and Chat controls.
 * Buttons and the online indicator are driven by the global WebSocket presence state.
 *
 * @param name           Display name of the user
 * @param email          Email address used as the LiveKit identity
 * @param onPlay         Callback when the first video frame arrives
 * @param onChat         Callback to open a chat with this user
 * @param showHeader     Whether to render the header section with user info
 * @param className      Additional CSS classes for the container
 * @param accessToken    LiveKit access token for connecting
 * @param roomName       LiveKit room name
 * @param livekitUrl     LiveKit server URL
 * @param disableControls If true, always disable Play/Stop button
 * @param shouldStream   Whether the UI should currently attempt streaming
 * @param connecting     True while LiveKit connect is in progress
 * @param onToggle       Callback for Play/Stop button
 */
const VideoCard: React.FC<VideoCardProps & { livekitUrl?: string }> = ({
  name,
  email,
  onPlay,
  onChat,
  showHeader = true,
  className = '',
  accessToken,
  roomName,
  livekitUrl,
  disableControls = false,
  shouldStream = false,
  connecting = false,
  onToggle,
}) => {
  const roomRef  = useRef<Room | null>(null)

  // Read real-time connection state from store
  const streamingMap = usePresenceStore(s => s.streamingMap)
  const isConnected  = Boolean(streamingMap[email])

    const {
    videoRef,
    isModalOpen,
    screenshot,
    reason,
    setReason,
    isSubmitting,
    openModal,
    closeModal,
    confirm,
  } = useSnapshot(email);
  

  useEffect(() => {
    if (!shouldStream && !accessToken && !roomName && !livekitUrl) {
      return
    }

    if (!shouldStream) {
      roomRef.current?.disconnect()
      roomRef.current = null
      return
    }

    if (!accessToken || !roomName || !livekitUrl) {
      return
    }

    let lkRoom: Room | null = null
    let canceled = false
    let started = false
    const vid = videoRef.current!

    function attachIfVideo(pub: any) {
      const track = pub.track
      if (pub.kind === 'video' && pub.isSubscribed && track) {
        ;(track as RemoteVideoTrack).attach(vid)
        if (!started) {
          started = true
          onPlay(email)
        }
      }
    }

    function setupParticipant(p: RemoteParticipant) {
      for (const pub of p.getTrackPublications().values()) {
        attachIfVideo(pub)
      }
      p.on(ParticipantEvent.TrackSubscribed, attachIfVideo)
    }

    async function connectAndWatch() {
      const room = new Room()
      try {
        await room.connect(livekitUrl as string, accessToken as string)
      } catch {
        // ignore
      }
      if (canceled) {
        room.disconnect()
        return
      }
      lkRoom = room
      roomRef.current = room
      room.on(RoomEvent.Disconnected, () => {
        // no-op
      })
      room.remoteParticipants.forEach(p => {
        if (p.identity === roomName) setupParticipant(p)
      })
      room.on(RoomEvent.ParticipantConnected, p => {
        if (p.identity === roomName) setupParticipant(p)
      })
    }

    connectAndWatch()

    return () => {
      canceled = true
      lkRoom?.disconnect()
      roomRef.current = null
      if (vid) {
        vid.srcObject = null
        vid.src       = ''
      }
    }
  }, [shouldStream, accessToken, roomName, livekitUrl, email, onPlay])

  // Determine button label
  const label = connecting
    ? 'Connecting…'
    : shouldStream
      ? 'Stop'
      : 'Play'

  // Final disable logic: respect global connection, local flag, and explicit disableControls
    const isDisabled = disableControls || connecting

  return (
    <><div className={`flex flex-col bg-[var(--color-primary-dark)] rounded-xl overflow-hidden ${className}`}>
      {showHeader && (
        <div className="flex items-center px-2 py-1">
          <UserIndicator
            user={{
              email,
              name,
              fullName: name,
              status: isDisabled ? 'online' : 'offline',
              azureAdObjectId: roomName ?? null,
            }}
            outerClass="w-5 h-5"
            innerClass="w-4 h-4"
            bgClass="bg-[var(--color-secondary)]"
            borderClass="border-2 border-[var(--color-primary-dark)]"
            nameClass="text-white truncate" />
        </div>
      )}

      <div className="relative w-full pb-[50.25%] bg-black rounded-xl">
        {(shouldStream || Boolean(accessToken)) ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            No Stream
          </div>
        )}
      </div>

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => onToggle?.(email)}
          disabled={isDisabled}
          className="flex-1 py-2 bg-white text-[var(--color-primary-dark)] rounded-xl disabled:opacity-50"
        >
          {label}
        </button>
        <button
          onClick={() => onChat(email)}
          className="flex-1 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded-xl"
        >
          Chat
        </button>
        <button
          onClick={openModal}
          className="flex-1 py-2 bg-yellow-400 rounded-xl"
        >
          Snapshot
        </button>
      </div>
    </div><AddModal
       open={isModalOpen}
  title="Report Snapshot"
  onClose={closeModal}
  onConfirm={confirm}
  confirmLabel="Send"
  loading={isSubmitting}
  loadingAction="Sending…"
>
  {/* make this wrapper scrollable & constrain its height */}
<div className="space-y-4 text-white overflow-y-auto w-full sm:max-w-[30rem] md:max-w-[40rem] lg:max-w-[50rem] max-h-96 mx-auto">
    <p className='w-[40rem]'><strong>PSO:</strong> {email}</p>

    {/* force a small, fixed thumbnail */}
    {screenshot && (
      <img
        src={screenshot}
        alt="Snapshot preview"
        className="w-48 h-32 object-cover rounded mx-auto"
      />
    )}

    <textarea
      value={reason}
      onChange={e => setReason(e.target.value)}
      placeholder="Enter reason for snapshot"
       className="w-full h-32 p-2 rounded border"
    />
  </div>
      </AddModal></>
  )
}

export default VideoCard
