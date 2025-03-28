Vue.createApp({

    data() {
        return {

            map: null,

            filtreBaseEstSelectionne: true,

            erreurCQL: false,

            listeFiltre_liste: [
                "insee_reg",
                "type_equipement_ou_lieu"

            ],
            listeFiltre_input: [
                "insee_dep",
                "code_postal",
                "code_insee",
                "libelle_geographique"
            ],
            listeFiltre: {
                "Région": "insee_reg",
                "Département": "insee_dep",
                "Code postal": "code_postal",
                "Code insee": "code_insee",
                "Nom de la commune": "libelle_geographique",
                "type d'équipement": "type_equipement_ou_lieu"
            },

            selectedFiltre: "insee_reg",

            filtre: [],

            lignes: [
                { selectedFiltre: "insee_reg", selectedValeur: "", operateur: "placeHolderPourPasQueCaCrache", filtre: [] }
            ],

            ficheIdentite: {nom: undefined,
                            type: undefined,
                            image: undefined,
                            ville: undefined, 
                            departement: undefined,
                            adresse: undefined,
                            code_postal: undefined,
                            coordonnees: undefined,
                            description: undefined},
            
            equipementLayer: undefined,

            equipementOptions: undefined,
        }
    },


    methods: {
        creerCarte: function () {

            this.map = L.map('map').setView([46.603354, 1.888334], 6);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.map);
        },

        async trouverFiltre(ligne) {
                const response = await fetch(`http://localhost:3000/map/api/basilic_final_${ligne.selectedFiltre}`);
                const data = await response.json();
                console.log(data);
    
                ligne.filtre = [...new Set(
                    data.features
                        .map(feature => feature[ligne.selectedFiltre])
                )];
        },

        ajouterLigne: function (index, event) {
            if (event) { 
                event.preventDefault(); // Empêche le submit
                this.lignes.push({ selectedFiltre: "insee_reg", selectedValeur: "", operateur: "", filtre: [] });
                    this.trouverFiltre(this.lignes[this.lignes.length-1]);
            };
        },

        retirerLigne: function (index, event){
            if (event) {
                event.preventDefault(); // Empêche le submit
                console.log("ligne supprimée !");
                if(this.lignes.length > 1){
                    this.lignes.pop()
                };
            };
        },

        construireRequete_avancee: function () {
            console.log("avancé")

            let conditions = this.lignes.map(ligne => {
                if (ligne.selectedFiltre.length && ligne.selectedValeur){
                    return `${ligne.selectedFiltre}='${ligne.selectedValeur}'`;
                } else {
                    console.log("condition vide");
                    return "erreur_CQL";
                }
            });

            let operateur = this.lignes.map(ligne => {
                if (ligne.operateur != ""){
                    return `${ligne.operateur}`;
                }
                else{
                    console.log("operateur vide");
                    return "erreur_CQL";
                }
            })

            if (operateur.includes("erreur_CQL") || conditions.includes("erreur_CQL")){
                console.log("erreurCQL: ", this.erreurCQL)
                this.erreurCQL = true;
            }
            else{
                let requeteCQL = conditions
                .map((condition, index) => (index === 0 ? condition : `${operateur[index]} ${condition}`))
                .join(" ");
                let URL = `http://localhost:8080/geoserver/MoNat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MoNat%3Abasilic_final&outputFormat=application%2Fjson&CQL_FILTER=${requeteCQL}`;
                console.log("Requête construite :", URL);
                this.erreurCQL = false;
                return URL;
            }
        },

        construireRequete_simple: function () {
            console.log("simple")
            if (this.lignes[0].selectedFiltre != "" && this.lignes[0].selectedValeur != ""){
                let condition = `${this.lignes[0].selectedFiltre}='${this.lignes[0].selectedValeur}'`;
                let URL = `http://localhost:8080/geoserver/MoNat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MoNat%3Abasilic_final&outputFormat=application%2Fjson&CQL_FILTER=${condition}`;
                console.log("Requête construite :", URL)
                this.erreurCQL = false;
                return URL;
            }
            else {
                console.log("operateur ou valeur vide");
                console.log("erreurCQL: ", this.erreurCQL)
                this.erreurCQL = true;
            }
        },

        ajouterCouche: async function (event) {

            if (event) event.preventDefault(); // Empêche le submit

            this.equipementsOptions = {
                pointToLayer: (feature, latlng) => {
                    // Définition des couleurs en fonction du type d'équipement ou lieu
                    let couleurs = {
                        "Parc et jardin": "green",
                        "Conservatoire": "purple",
                        "Centre de création artistique": "purple",
                        "Théâtre": "purple",
                        "Cinéma": "purple",
                        "Scène": "purple",
                        "Bibliothèque": "blue",
                        "Musée": "blue"
                    };
            
                    // Définir la couleur par défaut si le type n'est pas reconnu
                    let couleur = couleurs[feature.properties.type_equipement_ou_lieu] || "gray";
            
                    return L.circleMarker(latlng, { 
                        radius: 4, 
                        fillColor: couleur, 
                        color: "black", // Bordure du cercle
                        weight: 0.1,
                        fillOpacity: 0.8 
                    });
                }
            };

                if (this.lignes.length > 1) {
                    let reponseAPI = await (await fetch(this.construireRequete_avancee())).json();
                    console.log(reponseAPI);
                    this.equipementsLayer = L.geoJson(reponseAPI, this.equipementsOptions);
                    this.map.addLayer(this.equipementsLayer);
                    this.equipementsLayer.on('click', (evt) => { this.majFeature(evt.layer.feature) })

                }else {
                    let reponseAPI = await (await fetch(this.construireRequete_simple())).json();
                    this.equipementsLayer = L.geoJson(reponseAPI, this.equipementsOptions);
                    this.map.addLayer(this.equipementsLayer);
                    this.equipementsLayer.on('click', (evt) => { this.majFeature(evt.layer.feature)})


                };

                this.majSelecteur();

        },

        majFeature: async function (feature){
            L.geoJson(feature, this.equipementOptions).addTo(this.map);
            this.map.removeLayer(this.equipementsLayer);
            this.ficheIdentite.nom = feature.properties.nom; // nom
            this.ficheIdentite.type = feature.properties.type_equipement_ou_lieu; // type
            this.ficheIdentite.ville = feature.properties.libelle_geographique;
            this.ficheIdentite.departement = feature.properties.insee_dep; // ville, département
            this.ficheIdentite.adresse = feature.properties.adresse;
            this.ficheIdentite.code_postal = feature.properties.code_postal; // adresse, code postal
            this.ficheIdentite.description = feature.properties.description;
            this.ficheIdentite.coordonnees = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]; // latlong

            this.map.flyTo(this.ficheIdentite.coordonnees, 16, {duration: 2});

            // Récupérer l'image

            const response = await fetch(`/image/${feature.properties.monument_id}`);
            const data = await response.json();
            this.ficheIdentite.image = data.image;
        },

        majSelecteur: function () {
            for (i=1; i < this.lignes.length; i++){
                this.retirerLigne;
            }
            this.lignes = [
                { selectedFiltre: "insee_reg", selectedValeur: "", operateur: "placeHolderPourPasQueCaCrache", filtre: [] }
            ]

            this.trouverFiltre(this.lignes[0])
        },

        nettoyerCarte: function () {
            if (this.map) {
                this.map.eachLayer((layer) => {
                    if (!layer._url) {
                        this.map.removeLayer(layer);
                    }
                });
            }

            Object.keys(this.ficheIdentite).forEach(key => {
                delete this.ficheIdentite[key];
            });

            this.map.flyTo([46.603354, 1.888334], 6, {duration:1});
        },

        openSidebar: function () {
            document.getElementById("mySidebar").style.width = "500px";
            document.getElementById("mapContainer").style.marginLeft = "520px";
            this.filtreBaseEstSelectionne = false;
        },
    
        closeSidebar: function () {
            document.getElementById("mySidebar").style.width = "0";
            document.getElementById("mapContainer").style.marginLeft = "0";
            this.filtreBaseEstSelectionne = true;

        },
    
    },

    mounted() {
        this.creerCarte(),
        this.trouverFiltre(this.lignes[0]);

    }

  }).mount('#app')
