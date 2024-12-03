const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3250;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));


/**
 * Télécharge une image à partir d'une URL et la convertit en buffer.
 * @param {string} imageUrl - L'URL de l'image.
 * @returns {Promise<Buffer>} - Une promesse qui résout en un buffer contenant les données de l'image.
 */
async function downloadImageAsBuffer(imageUrl) {
    try {
        const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer', // Permet de recevoir les données binaires.
        });

        // Convertit les données reçues en buffer.
        const buffer = Buffer.from(response.data);

        console.log('Image téléchargée et convertie en buffer avec succès !');
        return buffer;
    } catch (error) {
        console.error('Erreur lors du téléchargement ou de la conversion de l\'image :', error.message);
        throw error;
    }
}

app.get('/get-image', async(req, res) => {

    const imageUrl = 'https://api-actu.yaatalmbinde.sn/actu221-file/maguichou.webp'; // Remplacez par l'URL de l'image.
  
    try {
        const imageBuffer = await downloadImageAsBuffer(imageUrl);

        return res.send(imageBuffer)
    
    } catch (error) {
        console.error('Une erreur est survenue :', error.message);
    }

});


app.listen(port, () => {
    console.log(`Servidor iniciado en el puerto ${port}`);
});







