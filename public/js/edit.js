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

