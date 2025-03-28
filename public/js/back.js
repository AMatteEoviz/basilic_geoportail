Vue.createApp({
    data() {
      return {
        monuments: [],
        monumentsADD: [],
        monumentsEDI: [],
      };
    },
    methods: {
      async recupererTempBasilic() {
        try {
          const resultEDI = await fetch("/back/api/temp_basilic?source=EDI");
          const resultADD = await fetch("/back/api/temp_basilic?source=ADD");
  
          if (!resultEDI.ok || !resultADD.ok) {
            console.error("Erreur lors de la récupération des monuments");
            return;
          }
  
          this.monumentsEDI = await resultEDI.json();
          this.monumentsADD = await resultADD.json();
  
          this.monuments = [...this.monumentsADD, ...this.monumentsEDI];
  
          for (let monument of [...this.monumentsEDI, ...this.monumentsADD]) {
            try {
              const response = await fetch(`/temp_image/${monument.monument_id}`);
              
              if (response.ok) {
                const textResponse = await response.text(); // Récupérer la réponse en texte
  
                if (textResponse.trim()) {
                  // Si la réponse n'est pas vide, on tente de la convertir en JSON
                  const data = JSON.parse(textResponse);
                  monument.image = data.image || null;
                } else {
                  monument.image = null;
                }
              } else if (response.status === 204) {
                monument.image = null;
              }
            } catch (error) {
              console.error(`Erreur lors de la récupération de l'image pour le monument ${monument.monument_id}:`, error);
              monument.image = null;  // Si erreur, on ne met pas d'image
            }
          }
        } catch (error) {
          console.error("Erreur récupération données :", error);
        }
      },
  
      async supprimerMonument(id) {
        const response = await fetch(`/back/supprimer/${id}`, { method: "POST" });
        if (response.ok) {
          this.monuments = this.monuments.filter(m => m.monument_id !== id);
          this.monumentsADD = this.monumentsADD.filter(m => m.monument_id !== id);
          this.monumentsEDI = this.monumentsEDI.filter(m => m.monument_id !== id);
        }
      },
  
      async validerAjout(id) {
        const monument = this.monuments.find(m => m.monument_id === id);
        
        const response = await fetch(`/back/ADD/valider/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nom: monument.nom,
            adresse: monument.adresse,
            libelle_geographique: monument.libelle_geographique,
            code_postal: monument.code_postal,
            type_equipement_ou_lieu: monument.type_equipement_ou_lieu,
            wkb_geometry: monument.wkb_geometry,
            image: undefined,  // Image en base64 si elle existe
          }),
        });
  
        if (response.ok) {
          // Si l'ajout réussit, on supprime le monument de la liste des ajouts
          this.monumentsADD = this.monumentsADD.filter(m => m.monument_id !== id);
          this.monuments = this.monuments.filter(m => m.monument_id !== id);
        } else {
          console.error("Erreur lors de l'ajout du monument");
        }
      },
  
      async validerModif(id) {
        const monument = this.monuments.find(m => m.monument_id === id);
        
        const response = await fetch(`/back/EDI/valider/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nom: monument.nom,
            adresse: monument.adresse,
            libelle_geographique: monument.libelle_geographique,
            code_postal: monument.code_postal,
            type_equipement_ou_lieu: monument.type_equipement_ou_lieu,
            wkb_geometry: monument.wkb_geometry,
            image: monument.image,  // Image en base64 si elle existe
          }),
        });
  
        if (response.ok) {
          // Si la modification réussit, on supprime le monument de la liste des modifications
          this.monumentsEDI = this.monumentsEDI.filter(m => m.monument_id !== id);
          this.monuments = this.monuments.filter(m => m.monument_id !== id);
        } else {
          console.error("Erreur lors de la modification du monument");
        }
      },
    },
  
    mounted() {
      this.recupererTempBasilic();
    }
  }).mount("#app");
  