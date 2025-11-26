const videoElement = document.getElementById('inputVideo');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const captureBtn = document.getElementById('captureBtn');

// Store background as an ImageBitmap or Canvas for drawImage support
let backgroundImage = null;
let isBackgroundCaptured = false;

function onResults(results) {
    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (isBackgroundCaptured && backgroundImage) {
        // 1. Draw the Person-Background (Invisibility Effect)
        // Draw the mask first
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);

        // Keep only the background image where the mask is (The Person)
        canvasCtx.globalCompositeOperation = 'source-in';
        canvasCtx.drawImage(backgroundImage, 0, 0, canvasElement.width, canvasElement.height);

        // 2. Draw the Outline (Glow)
        // We draw the mask again BEHIND the person, with a shadow.
        canvasCtx.globalCompositeOperation = 'destination-over';
        canvasCtx.shadowColor = '#00ffff'; // Cyan glow
        canvasCtx.shadowBlur = 20;
        canvasCtx.lineWidth = 5;
        canvasCtx.strokeStyle = '#00ffff'; // Also stroke it for sharpness if needed, but mask is an image.

        // Since segmentationMask is an image, we can't "stroke" it easily. 
        // But drawing it with a shadow works.
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);

        // Reset shadow for next layer
        canvasCtx.shadowBlur = 0;

        // 3. Draw the Camera Feed (The Rest of the World)
        // Draw behind everything else
        canvasCtx.globalCompositeOperation = 'destination-over';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    } else {
        // Just draw the camera feed
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }

    canvasCtx.restore();
}

const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    }
});

selfieSegmentation.setOptions({
    modelSelection: 1,
});

selfieSegmentation.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await selfieSegmentation.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});

camera.start();

captureBtn.addEventListener('click', () => {
    // Capture the current frame as background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoElement.videoWidth;
    tempCanvas.height = videoElement.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(videoElement, 0, 0);

    // Create an Image from the canvas to use in drawImage
    const image = new Image();
    image.src = tempCanvas.toDataURL();
    image.onload = () => {
        backgroundImage = image;
        isBackgroundCaptured = true;
        captureBtn.innerText = "Recapture Background";
    };
});
