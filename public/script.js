let labeledFaceDescriptors;
let modelsLoaded = false;
let audio = new Audio('/uploads/level-up-191997.mp3'); // Ruta correcta al archivo de sonido

// Cargar modelos de Face API
async function loadModels() {
    const MODEL_URL = '/models';
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
    console.log("Modelos cargados");
}

// Cargar imágenes etiquetadas (usuarios registrados con sus fotos)
async function loadLabeledImages() {
    try {
        
        return new Promise( async (resolve, reject) => {
            const descriptions = [];
            
            const response = await fetch(`/get-image?image=${window.location.pathname.split('/')[1]}`);
            const blob = await response.blob();
            const img = await faceapi.bufferToImage(blob);
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            if (detections && detections.descriptor) {
                descriptions.push(detections.descriptor);
            }
            return resolve(new faceapi.LabeledFaceDescriptors("label", descriptions));
        }) ;
       
    } catch (error) {
        console.error("Error al cargar etiquetas de usuarios:", error);
        throw error;
    }
}



async function startCamera() {
    if (!modelsLoaded) {
        return;
    }

    const video = document.getElementById('video');
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function(error) {
            });
    } else {
    }

    video.addEventListener('loadeddata', async () => {
        const existingCanvas = document.querySelector('#camera canvas');
        if (existingCanvas) {
            existingCanvas.remove(); 
        }

        const canvas = faceapi.createCanvasFromMedia(video);
        canvas.style.position = 'absolute';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        document.getElementById('camera').appendChild(canvas);

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);



        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            if (labeledFaceDescriptors) {
                
                const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

                const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

                for (let result of results) {
                    console.log("result");
                    console.log(result.toString());
                    
                    const box = resizedDetections[results.indexOf(result)].detection.box;
                    const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString().split(' ')[0] === 'label' ? 'Maguette Drame' : 'Inconue', boxColor: result.label === 'unknown' ? 'red' : 'green' });
                    drawBox.draw(canvas);

                    if (result.label !== 'unknown' && result.distance < 0.6) {
                        
                        showToast('Information', 'Bienvenu dans le system', 'success');

                    }else {
                        showToast('Error', 'User pas enregistrée', 'error');

                    }
                }
            }
        }, 5000);
    });
}

// Obtener el ID del usuario por nombre
async function getUserIdByName(name) {
    const response = await fetch(`/get-user-id?name=${name}`);
    if (response.ok) {
        const data = await response.json();
        return data.id;
    }
    return null;
}

// Función para iniciar el reconocimiento facial
async function startFacialLogin() {
    try {
        // Verificar si los modelos están cargados
        if (!modelsLoaded) {
            await loadModels(); // Cargar modelos si no están cargados
        }

        // Cargar imágenes etiquetadas (usuarios registrados con sus fotos)
        if (!labeledFaceDescriptors) {
            labeledFaceDescriptors = await loadLabeledImages();
        }

        // Iniciar la cámara y reconocimiento facial
        startCamera();
    } catch (error) {
        console.error("Error iniciando el reconocimiento facial:", error);
        showToast('Error', 'Hubo un problema al iniciar el reconocimiento facial', 'error');
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const facialLoginButton = document.getElementById('start-camera');

    if (facialLoginButton) {
        facialLoginButton.addEventListener('click', startFacialLogin);
    } else {
        console.error("El botón 'Iniciar Reconocimiento Facial' no se encontró.");
    }
});



// Function to show toasts
function showToast(title, message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastEl = document.getElementById('liveToast');
    
    // Centrar el contenedor de toasts
    toastContainer.style.left = '50%';
    toastContainer.style.transform = 'translateX(-50%)';
    toastContainer.style.bottom = '20px';
    
    const toast = new bootstrap.Toast(toastEl);
    
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    
    // Remover clases de color previas
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    
    // Siempre añadir la clase de éxito
    toastEl.classList.add('bg-success', 'text-white');
    
    toast.show();
}
