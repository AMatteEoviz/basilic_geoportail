Vue.createApp({
    data(){ return {
        inscription: false,
        username: "",
        premier_mdp: "",
        deuxieme_mdp: "",
        message: "",
        erreur: false
    };
    },
    methods: {
        montrerInscription: function () {
            this.inscription = true;
        },
        fermerInscription: function () {
            this.inscription = false;
        },

        async inscrireUtilisateur() {
            // 1️⃣ Vérification des mots de passe
            if (this.premier_mdp !== this.deuxieme_mdp) {
                this.message = "Les mots de passe ne correspondent pas";
                this.erreur = true;
                return;
            }
            

            try {
                // 2️⃣ Envoi des données au backend
                const response = await fetch("http://localhost:3000/login/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: this.username,
                        password: this.premier_mdp
                    })
                });

                console.log(this.username, this.premier_mdp);

                const result = await response.json();

                console.log(result)

                // 3️⃣ Gestion de la réponse
                if (response.ok) {
                    this.message = "Compte créé avec succès";
                    this.erreur = false;
                    setTimeout(() => this.fermerInscription(), 2000); // Ferme après 2s
                } else {
                    this.message = result.message || "Erreur lors de l'inscription";
                    this.erreur = true;
                }
            } catch (error) {
                console.error("Erreur serveur :", error);
                this.message = "Problème de connexion au serveur";
                this.erreur = true;
            }
        },
        async connecterUtilisateur() {
            try {
                const response = await fetch("http://localhost:3000/login/api/connect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: this.username,
                        password: this.password
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    this.message = "Connexion réussie ! 🎉";
                    this.erreur = false;
                    console.log("Utilisateur connecté :", result);
                    window.location.href = "/db";
                } else {
                    this.message = result.message || "Identifiants incorrects";
                    this.erreur = true;
                }
            } catch (error) {
                console.error("Erreur serveur :", error);
                this.message = "Problème de connexion au serveur";
                this.erreur = true;
            }
        }
    }
}).mount("#app");