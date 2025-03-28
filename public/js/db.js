
document.getElementById("searchInput").addEventListener("keyup", function() {
    let query = this.value.trim().toLowerCase();
    let resultsDiv = document.getElementById("results");

    if (query.length > 2) { // Évite les requêtes inutiles avec trop peu de caractères
        fetch(`/search?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    resultsDiv.innerHTML = "<p>Aucun monument trouvé.</p>";
                    return;
                }

                let table = `<table border="1">
                    <thead>
                        <tr>
                            <th>ID</th> 
                            <th>Nom</th>
                            <th>Adresse</th>
                            <th>Commune</th>
                            <th>Code postal</th>
                            <th>Type d'équipement</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>`;

                data.forEach(monument => {
                    table += `
                        <tr>
                            <td>${monument.monument_id}</td>
                            <td>${monument.nom}</td>
                            <td>${monument.adresse}</td>
                            <td>${monument.libelle_geographique}</td>
                            <td>${monument.code_postal}</td>
                            <td>${monument.type_equipement_ou_lieu}</td>
                            <td><a class="btn btn-warning" href="/edit/${monument.monument_id}">Modifier</a></td>
                        </tr>`;
                });

                table += `</tbody></table>`;
                resultsDiv.innerHTML = table;
            })
            .catch(error => {
                resultsDiv.innerHTML = "<p>Erreur lors de la recherche.</p>";
                console.error("Erreur AJAX :", error);
            });
    } else {
        resultsDiv.innerHTML = ""; // Efface les résultats si l'entrée est vide
    }
});



// function showMore() {
//     let hiddenRows = document.querySelectorAll("tbody tr.hidden");
//     for (let i = 0; i < 50 && i < hiddenRows.length; i++) {
//         hiddenRows[i].classList.remove("hidden");
//     }
//     if (document.querySelectorAll("tbody tr.hidden").length === 0) {
//         document.getElementById("showMoreBtn").style.display = "none";
//     }
// };