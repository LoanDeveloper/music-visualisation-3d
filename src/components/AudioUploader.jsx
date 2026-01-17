import { useRef } from 'react';
import { Music } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
      alert('Format de fichier non supporte. Veuillez uploader un fichier MP3, WAV ou OGG.');
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
    <Card
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[90%] p-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-dashed border-white/20 cursor-pointer transition-all hover:border-white/40 hover:bg-black/50 z-[100]"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="pointer-events-none text-center">
        <div className="flex justify-center mb-4">
          <Music className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Visualisation 3D Musicale
        </h2>
        <p className="text-sm text-muted-foreground mb-1">
          Cliquez ou glissez-deposez un fichier audio
        </p>
        <p className="text-xs text-muted-foreground/60">
          MP3, WAV, OGG
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
        onChange={handleFileChange}
        className="hidden"
      />
    </Card>
  );
};

export default AudioUploader;
