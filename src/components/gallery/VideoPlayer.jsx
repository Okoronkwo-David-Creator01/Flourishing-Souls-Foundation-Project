import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress, FaRedo, FaUndo, FaDownload } from "react-icons/fa";

// Helper: Format duration/position time (e.g. 01:23:45)
const formatTime = (seconds = 0) => {
  if (isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return [h, m.toString().padStart(2, "0"), s.toString().padStart(2, "0")].join(":");
  return [m, s.toString().padStart(2, "0")].join(":");
};

const VideoPlayer = ({
  src,
  poster,
  title,
  allowDownload = true,
  autoPlay = false,
  controls = true,
  className = "",
  onEnded,
  onPlay,
  onPause,
  onError,
  ...props
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);

  // AUTO-HIDE CONTROLS LOGIC (for immersive fullscreen)
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      return;
    }
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 2500);
    };
    const node = containerRef.current;
    if (node) {
      node.addEventListener("mousemove", handleMouseMove);
      timeout = setTimeout(() => setShowControls(false), 2500);
    }
    return () => {
      if (node) node.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  // Set volume & mute on mount/video change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, src]);

  useEffect(() => {
    // Sync isPlaying state with video element in all cases
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, src]);

  // Listen for keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case "Space":
        case "KeyK":
          togglePlay();
          e.preventDefault();
          break;
        case "ArrowRight":
          seekBy(5);
          break;
        case "ArrowLeft":
          seekBy(-5);
          break;
        case "ArrowUp":
          handleVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          handleVolume(Math.max(0, volume - 0.1));
          break;
        case "KeyM":
          setIsMuted((m) => !m);
          break;
        case "KeyF":
          fullscreenToggle();
          break;
        default:
          break;
      }
    };
    containerRef.current?.addEventListener("keydown", handleKeyDown);

    return () => containerRef.current?.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [volume, isPlaying, isMuted, isFullscreen, duration, currentTime]);

  // API: Seek
  const seekBy = (offset) => {
    if (!videoRef.current) return;
    let time = videoRef.current.currentTime + offset;
    time = Math.max(0, Math.min(time, duration));
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width);
    const time = percent * duration;
    setCurrentTime(time);
    videoRef.current.currentTime = time;
  };

  const handleScrubStart = () => setSeeking(true);

  const handleScrubMove = (e) => {
    if (!seeking) return;
    handleSeek(e);
  };

  const handleScrubEnd = () => setSeeking(false);

  // API: Play/Pause
  const togglePlay = () => setIsPlaying((play) => !play);

  // API: Volume/Mute
  const handleVolume = (vol) => {
    setVolume(vol);
    if (vol === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  // API: Fullscreen
  const fullscreenToggle = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Download video
  const handleDownload = (e) => {
    if (!allowDownload) return;
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = src;
    a.download = title ? `${title.replace(/[^a-z0-9]/gi, "_")}.mp4` : "video.mp4";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  };

  // Side-effects: video event listeners
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
    setBuffered(videoRef.current.buffered.length > 0 ? videoRef.current.buffered.end(0) : 0);
    setError(null);
  };
  const handleTimeUpdate = () => setCurrentTime(videoRef.current.currentTime);

  const handleBufferedUpdate = () => {
    try {
      const v = videoRef.current;
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
      else setBuffered(0);
    } catch {
      setBuffered(0);
    }
  };
  const handleVideoError = (e) => {
    setError("An error occurred while loading or playing the video.");
    onError && onError(e);
  };

  // JSX return
  return (
    <div
      className={`relative w-full max-w-3xl mx-auto bg-black rounded-lg shadow-lg overflow-hidden focus:outline-none ${className}`}
      tabIndex={0}
      ref={containerRef}
      aria-label={title || "Video player"}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="metadata"
        autoPlay={autoPlay}
        tabIndex={-1}
        className={`block w-full h-auto max-h-[70vh] bg-black cursor-pointer outline-none select-none`}
        controls={false}
        muted={isMuted}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleBufferedUpdate}
        onPlay={() => {
          setIsPlaying(true);
          onPlay && onPlay();
        }}
        onPause={() => {
          setIsPlaying(false);
          onPause && onPause();
        }}
        onEnded={onEnded}
        onError={handleVideoError}
        {...props}
        style={{ objectFit: "contain" }}
        aria-label={title || "Video"}
        data-testid="video-player"
      />
      {/* Overlay play icon for poster */}
      {!isPlaying && currentTime === 0 && (
        <button
          className="absolute inset-0 flex items-center justify-center w-full h-full bg-black/40 text-white text-6xl transition-opacity duration-200 z-10"
          aria-label="Play video"
          onClick={togglePlay}
          type="button"
        >
          <FaPlay className="drop-shadow-lg" />
        </button>
      )}
      {/* Controls */}
      {(controls && showControls) && (
        <div className={`absolute inset-x-0 bottom-0 flex flex-col z-20 bg-gradient-to-t from-black/70 via-black/5 to-transparent px-3 pb-2 pt-6`}>
          {/* Seek bar */}
          <div
            className="group w-full flex-1 flex items-center cursor-pointer relative py-1"
            onMouseDown={handleScrubStart}
            onMouseUp={handleScrubEnd}
            onMouseMove={handleScrubMove}
            onClick={handleSeek}
            aria-label="Seek bar"
            tabIndex={-1}
          >
            {/* Progress background */}
            <div className="bg-gray-700/50 h-2 w-full rounded">
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-2 rounded bg-gray-400/70"
                style={{
                  width: `${(buffered / duration) * 100 || 0}%`,
                  zIndex: 1,
                  pointerEvents: "none",
                }}
                aria-hidden="true"
              />
              {/* Played */}
              <div
                className="absolute top-0 left-0 h-2 bg-primary-500 rounded"
                style={{
                  width: `${(currentTime / duration) * 100 || 0}%`,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
                aria-hidden="true"
              />
              {/* Scrubber */}
              <div
                className="absolute top-0 transition-transform -translate-y-1/2"
                style={{
                  left: `calc(${(currentTime / duration) * 100 || 0}% - 10px)`,
                  zIndex: 3,
                  pointerEvents: "none",
                  display: seeking ? "block" : "none",
                }}
                aria-hidden="true"
              >
                <div className="w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow"></div>
              </div>
            </div>
          </div>
          {/* Controls Row */}
          <div className="flex items-center justify-between mt-2 gap-2 select-none text-white text-base">
            {/* Play/Pause/Replay */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="focus:outline-none p-1 rounded hover:bg-black/20 active:bg-black/30"
                type="button"
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              {/* Seek backward */}
              <button
                onClick={() => seekBy(-10)}
                aria-label="Rewind 10 seconds"
                className="focus:outline-none p-1 rounded hover:bg-black/20"
                type="button"
              >
                <FaUndo />
              </button>
              {/* Seek forward */}
              <button
                onClick={() => seekBy(10)}
                aria-label="Forward 10 seconds"
                className="focus:outline-none p-1 rounded hover:bg-black/20"
                type="button"
              >
                <FaRedo />
              </button>
              {/* Download */}
              {allowDownload && (
                <button
                  onClick={handleDownload}
                  aria-label="Download video"
                  className="focus:outline-none p-1 rounded hover:bg-black/20"
                  type="button"
                >
                  <FaDownload />
                </button>
              )}
            </div>
            {/* Time display */}
            <div className="flex items-center gap-1 font-mono text-xs px-2">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
            {/* Volume */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="focus:outline-none p-1 rounded hover:bg-black/20"
                type="button"
              >
                {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolume(parseFloat(e.target.value))}
                aria-label="Adjust volume"
                className="w-[70px] accent-primary-500"
              />
            </div>
            {/* Fullscreen */}
            <div className="flex items-center gap-1">
              <button
                onClick={fullscreenToggle}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="focus:outline-none p-1 rounded hover:bg-black/20"
                type="button"
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-30">
          <span className="text-red-400 text-base">{error}</span>
        </div>
      )}
      {/* Video title */}
      {title && (
        <div className="absolute top-0 left-0 px-4 py-2 bg-black/50 text-white rounded-br-lg z-30 text-sm font-semibold truncate max-w-[70vw]">
          {title}
        </div>
      )}
    </div>
  );
};

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,      // URL to video file (mp4/webm, etc)
  poster: PropTypes.string,              // Poster image
  title: PropTypes.string,               // Title of the video (optional)
  allowDownload: PropTypes.bool,         // Enable/disable download
  autoPlay: PropTypes.bool,              // Auto play video
  controls: PropTypes.bool,              // Show controls or not
  className: PropTypes.string,
  onEnded: PropTypes.func,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onError: PropTypes.func,
};

export default VideoPlayer;