import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { ExternalBlob } from '../backend';

interface ExternalBlobImageProps {
  blob: ExternalBlob;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export default function ExternalBlobImage({ 
  blob, 
  alt, 
  className = '', 
  fallbackIcon 
}: ExternalBlobImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = blob.getDirectURL();

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        {fallbackIcon || <ImageIcon className="h-8 w-8 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`flex items-center justify-center bg-muted ${className}`}>
          <div className="animate-pulse">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}
