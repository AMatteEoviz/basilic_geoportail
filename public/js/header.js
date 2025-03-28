Vue.createApp ({
    data(){ return {
        user: null
    }
    },
    mounted() {
        this.fetchUser();
    },
    methods: {
        async fetchUser() {
            try {
                const response = await fetch("/login/api/user");
                if (response.ok) {
                    this.user = await response.json();
                }
                console.log(this.user);
            } catch (error) {
                console.error("Erreur récupération utilisateur :", error);
            }
        },
        async logout() {
            try {
                const response = await fetch("/login/api/logout", { method: "POST" });
                if (response.ok) {
                    this.user = null;
                    window.location.reload(); // Recharge la page après déconnexion
                }
            } catch (error) {
                console.error("Erreur lors de la déconnexion :", error);
            }
        }
    }
}).mount("#headApp");