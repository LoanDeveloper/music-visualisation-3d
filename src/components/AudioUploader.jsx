import { useRef } from 'react';
import './AudioUploader.css';

/**
 * AudioUploader component
 * Handles audio file upload via file input or drag-and-drop
 */
const AudioUploader = ({ onFileSelect, hasAudio }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndLoadFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndLoadFile(file);
    }
  };

  const validateAndLoadFile = (file) => {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['mp3', 'wav', 'ogg'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Format de fichier non supporté. Veuillez uploader un fichier MP3, WAV ou OGG.');
      return;
    }

    // Create URL for audio file
    const url = URL.createObjectURL(file);
    onFileSelect(url, file.name);
  };

  if (hasAudio) {
    return null; // Hide uploader when audio is loaded
  }

  return (
    <div
      className="audio-uploader"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="uploader-content">
        <div className="uploader-icon">🎵</div>
        <h2>Visualisation 3D Musicale</h2>
        <p>Cliquez ou glissez-déposez un fichier audio</p>
        <p className="uploader-formats">MP3, WAV, OGG</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AudioUploader;
