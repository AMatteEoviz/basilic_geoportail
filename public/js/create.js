  document.addEventListener("DOMContentLoaded", async () => {
        try {
            const response = await fetch("/create/api");
            if (!response.ok) throw new Error("Erreur lors de la récupération des données");
    
            const typesEquipement = await response.json(); // Convertit la réponse en JSON
            console.log(typesEquipement); // Affiche les données dans la console
    
            // Sélectionne l'élément <select> dans le DOM
            const selectTypeEquipement = document.getElementById("TypeEquipement");
    
            if (selectTypeEquipement) {
                typesEquipement.forEach(type => {
                    const option = document.createElement("option");
                    option.value = type.type_equipement_ou_lieu; // Valeur de l'option
                    option.textContent = type.type_equipement_ou_lieu; // Texte affiché
                    selectTypeEquipement.appendChild(option); // Ajoute l'option au select
                });
            } 
    
        } catch (error) {
            console.error("Erreur lors du chargement :", error);
        }
    });

        
    
    // ajout de la carte osm
    var map = L.map('map').setView([46.98505607963757, 2.63559864630986], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 15,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    console.log(document.getElementById("map"))

    // ajout du marker et recuperation des coordonnées
    var marker;

    map.on('click', evt => {
        if (marker) {
            map.removeLayer(marker); // Supprime l'ancien marqueur
        }
        marker = L.marker(evt.latlng)
        .addTo(map);
        console.log("coordonnées du marqueur : ", marker.getLatLng()); 
        document.getElementById("Latitude").value = `${evt.latlng.lat.toFixed(6)}`;  
        document.getElementById("Longitude").value = `${evt.latlng.lng.toFixed(6)}`;
    });
   

