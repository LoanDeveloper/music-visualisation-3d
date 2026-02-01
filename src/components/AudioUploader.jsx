import { useRef, useState } from 'react';
import { Music, Upload, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * AudioUploader component
 * Handles audio file upload via file input or drag-and-drop
 * Shows inline controls when audio is already loaded
 */
const AudioUploader = ({ onFileSelect, hasAudio, audioName }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);

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
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndLoadFile(file);
    }
  };

  const validateAndLoadFile = (file) => {
    setError(null);
    
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['mp3', 'wav', 'ogg'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Format non supporte. Utilisez MP3, WAV ou OGG.');
      return;
    }

    // Create URL for audio file
    const url = URL.createObjectURL(file);
    onFileSelect(url, file.name);
  };

  const handleReset = () => {
    onFileSelect(null, '');
    setError(null);
  };

  // Hidden file input (shared)
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
      onChange={handleFileChange}
      className="hidden"
    />
  );

  // Compact inline uploader when audio is loaded
  if (hasAudio) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90]">
        <div className="flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-xl rounded-xl border border-white/10">
          <Music className="h-4 w-4 text-foreground/50" />
          <span className="text-xs text-foreground/70 max-w-[200px] truncate">
            {audioName || 'Audio charge'}
          </span>
          <div className="w-px h-4 bg-white/10" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-foreground/50 hover:text-foreground hover:bg-white/10"
            onClick={handleClick}
          >
            <Upload className="h-3 w-3 mr-1" />
            Changer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-foreground/40 hover:text-foreground hover:bg-white/10"
            onClick={handleReset}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        {fileInput}
      </div>
    );
  }

  // Full uploader screen when no audio
  return (
    <Card
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[90%] p-10 bg-black/50 backdrop-blur-xl rounded-2xl border border-dashed cursor-pointer transition-all z-[100] ${
        isDragOver 
          ? 'border-white/50 bg-black/60 scale-[1.02]' 
          : 'border-white/20 hover:border-white/40 hover:bg-black/55'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="pointer-events-none text-center">
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full bg-white/5 transition-transform ${isDragOver ? 'scale-110' : ''}`}>
            <Music className="h-10 w-10 text-foreground/60" />
          </div>
        </div>
        <h2 className="text-lg font-medium text-foreground mb-2">
          Visualisation 3D Musicale
        </h2>
        <p className="text-sm text-foreground/50 mb-1">
          {isDragOver ? 'Deposez le fichier...' : 'Cliquez ou glissez-deposez un fichier audio'}
        </p>
        <p className="text-xs text-foreground/30">
          MP3, WAV, OGG
        </p>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-foreground/60">{error}</p>
          </div>
        )}
      </div>
      {fileInput}
    </Card>
  );
};

export default AudioUploader;
