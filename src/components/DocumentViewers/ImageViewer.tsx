import React, { useState, useRef, useEffect } from 'react';
import { Button, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined } from '@ant-design/icons';

interface ImageViewerProps {
  fileUrl: string;
  filename: string;
  onError?: (error: string) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ fileUrl, filename, onError }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset to fit screen
  const handleFitToScreen = () => {
    if (!containerRef.current || !imageRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const imageWidth = imageDimensions.width;
    const imageHeight = imageDimensions.height;

    // Calculate scale to fit image in container
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

    setScale(newScale);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom in
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5)); // Max 500%
  };

  // Zoom out
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1)); // Min 10%
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mouse drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  // Mouse drag move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // Mouse drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  };

  // Auto-fit on load
  useEffect(() => {
    if (imageLoaded) {
      handleFitToScreen();
    }
  }, [imageLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle image error
  const handleImageError = () => {
    onError?.('Failed to load image');
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Zoom controls */}
      <div style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
        <Space>
          <Button icon={<ZoomInOutlined />} onClick={handleZoomIn}>
            Zoom In
          </Button>
          <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut}>
            Zoom Out
          </Button>
          <Button icon={<FullscreenOutlined />} onClick={handleFitToScreen}>
            Fit to Screen
          </Button>
          <span style={{ marginLeft: '10px', color: '#666' }}>
            {Math.round(scale * 100)}%
          </span>
        </Space>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          backgroundColor: '#f5f5f5',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            ref={imageRef}
            src={fileUrl}
            alt={filename}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              userSelect: 'none',
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;

