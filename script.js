console.log('Loading globe-handler component...');

if (typeof AFRAME !== 'undefined') {
  console.log('A-Frame available, registering component...');
  

  AFRAME.registerComponent('globe-handler', {
    init: function() {
      console.log('Globe handler initializing...');
      this.globe = document.querySelector('#globe');
      console.log('Found globe element:', this.globe);
      this.currentScale = 1;
      this.targetScale = 1;
      this.smoothingFactor = 0.15;
      this.isPinching = false;
      this.lastPinchPos = null;
      this.globePosition = { x: 0, y: 0, z: 0 };
      
      this.initHandTracking();
    },

    initHandTracking: async function() {
      console.log('Starting hand tracking initialization...');
      const video = document.getElementById('webcam');
      const debugCanvas = document.getElementById('debug-canvas');
      const debugCtx = debugCanvas.getContext('2d');
      const status = document.getElementById('status');

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = 1280;
      tempCanvas.height = 720;

      const hands = new Hands({
        locateFile: (file) => {
          console.log('Loading MediaPipe file:', file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      hands.onResults((results) => {
        debugCtx.save();
        debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
        
        debugCtx.drawImage(results.image, 0, 0, debugCanvas.width, debugCanvas.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            
            const pinchDistance = this.calculateDistance(thumbTip, indexTip);
            const isPinching = pinchDistance < 0.1;
            
            if (isPinching) {
              const pinchPos = {
                x: thumbTip.x,
                y: thumbTip.y,
                z: thumbTip.z
              };

              if (!this.isPinching) {
                this.isPinching = true;
                this.lastPinchPos = pinchPos;
              } else {
                const deltaX = (pinchPos.x - this.lastPinchPos.x) * 7;
                const deltaY = (pinchPos.y - this.lastPinchPos.y) * 7;
                const deltaZ = 0

                this.globePosition.x += deltaX;
                this.globePosition.y -= deltaY;
                this.globePosition.z += deltaZ;

                if (this.globe) {
                  this.globe.setAttribute('position', `${this.globePosition.x} ${this.globePosition.y} ${this.globePosition.z}`);
                }

                this.lastPinchPos = pinchPos;
              }
              status.textContent = 'Pinching - Moving globe';
            } else {
              this.isPinching = false;
              this.lastPinchPos = null;
              status.textContent = 'Not pinching';
            }

            this.drawHand(debugCtx, landmarks, debugCanvas.width, debugCanvas.height, isPinching);
          }
        } else {
          status.textContent = 'No hands detected';
          this.isPinching = false;
          this.lastPinchPos = null;
        }
        
        debugCtx.restore();
      });

      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 1280, 
            height: 720,
            facingMode: 'user'
          }
        });
        video.srcObject = stream;
        
        await new Promise(resolve => video.onloadedmetadata = resolve);
        
        debugCanvas.width = 320;
        debugCanvas.height = 240;
        
        console.log('Starting MediaPipe camera...');
        const camera = new Camera(video, {
          onFrame: async () => {
            try {
              tempCtx.save();
              tempCtx.scale(-1, 1);
              tempCtx.drawImage(video, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);
              tempCtx.restore();
              
              await hands.send({ image: tempCanvas });
            } catch (error) {
              console.error('Error in hand detection:', error);
            }
          },
          width: 1280,
          height: 720
        });
        
        await hands.initialize();
        console.log('MediaPipe Hands initialized');
        
        camera.start();
        console.log('Camera started');
        status.textContent = 'Hand tracking initialized - Try pinching!';
      } catch (error) {
        console.error('Error initializing camera:', error);
        status.textContent = 'Error: ' + error.message;
      }
    },

    calculateDistance: function(point1, point2) {
      return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) +
        Math.pow(point1.y - point2.y, 2) +
        Math.pow(point1.z - point2.z, 2)
      );
    },

    drawHand: function(ctx, landmarks, width, height, isPinching) {
      ctx.lineWidth = 2;

      for (let i = 0; i < landmarks.length; i++) {
        const point = landmarks[i];
        const x = point.x * width;
        const y = point.y * height;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        
        if (i === 4 || i === 8) {
          ctx.fillStyle = isPinching ? '#FF0000' : '#FFFF00';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = '#00FF00';
          ctx.strokeStyle = '#00FF00';
        }
        
        ctx.fill();
        ctx.stroke();

        if (i > 0) {
          const prev = landmarks[i - 1];
          const prevX = prev.x * width;
          const prevY = prev.y * height;
          
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#00FF00';
          ctx.stroke();
        }
      }

      if (isPinching) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        ctx.beginPath();
        ctx.moveTo(thumb.x * width, thumb.y * height);
        ctx.lineTo(index.x * width, index.y * height);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  });
} else {
  console.error('A-Frame not loaded yet!');
}

window.addEventListener('load', () => {
  console.log('Window loaded, A-Frame ready:', typeof AFRAME !== 'undefined');
  if (typeof AFRAME === 'undefined') {
    console.error('A-Frame failed to load!');
  }
});