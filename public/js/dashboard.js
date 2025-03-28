Vue.createApp ({

  data(){return {

        listeFiltre: {
                      insee_reg: "reg",
                      insee_dep: "dep"
        }, 

        listeFiltre_liste: [
          "insee_reg",
      ],

      listeFiltre_input: [
          "insee_dep",
          "code_postal",
          "code_insee",
          "libelle_geographique"
      ],

        selectedFiltre: "insee_reg",
        selectedValeur: "",
        filtre: [],  

        selectedAnnee: "2016",
        minAnnee: "2016",
        maxAnnee: "2021"
    };

  },

  methods: {

    async trouverFiltre() {
      const response = await fetch("http://localhost:3000/map/api/basilic_final_insee_reg");
      const data = await response.json();
      console.log(data);

      this.filtre = [...new Set(
          data.features
              .map(feature => feature[this.selectedFiltre])
              .filter(value => value > 6 && value !== undefined && value !== null)
      )];
    },

    construireRequete_cercle: function () {

      if (this.selectedFiltre == "fr"){
        console.log("coucou la france ! ")
        let URL = `http://localhost:8080/geoserver/MoNat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MoNat%3Avous_reprendrez_bien_du_bertin&outputFormat=application%2Fjson`;
        return URL

      }
      else{
        if (this.selectedFiltre != "" && this.selectedValeur != ""){
            let condition = `${this.selectedFiltre}='${this.selectedValeur}'`;
            let URL = `http://localhost:8080/geoserver/MoNat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MoNat%3Avous_reprendrez_bien_du_bertin&outputFormat=application%2Fjson&CQL_FILTER=${condition}`;
            console.log("Requête construite :", URL)
            return URL;
        }
        else {
            console.log("erreurCQL: ", this.erreurCQL)
            this.erreurCQL = true;
        }
    }
  },

  construireRequete_emprise: function () {

    if (this.selectedFiltre != "" && this.selectedValeur != ""){
        let condition = `${this.selectedFiltre}='${this.selectedValeur}'`;
        let URL = `http://localhost:8080/geoserver/MoNat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MoNat%3Acarto_dep&outputFormat=application%2Fjson&CQL_FILTER=${condition}`;
        console.log("Requête construite :", URL)
        return URL;
    }
    else {
        console.log("erreurCQL: ", this.erreurCQL)
        this.erreurCQL = true;
    }
  },

  construireRequete_bar: async function () {

    if (this.selectedFiltre !== "" && this.selectedValeur !== "") {
      let URL = `/dashboard/api/frequentation_musee_${this.selectedFiltre.slice(-3)}?categorie=${this.selectedFiltre}&valeur=${this.selectedValeur}&annee=${this.selectedAnnee}`;
      console.log("Requête construite :", URL);
  
      try {
        const response = await fetch(URL);
        if (!response.ok) throw new Error("Erreur lors de la récupération des données");
  
        const data = await response.json();
        console.log("Données reçues :", data);
  
        if (data.data && data.data.length > 0) {
          return [
            { "category": "Gratuit", "value": data.data[0].nb_gratuit || 0 },
            { "category": "Payant", "value": data.data[0].nb_payant || 0 }
          ];
        } else {
          console.error("Données vides ou mal formatées");
          return [];
        }
      } catch (error) {
        console.error("Erreur dans construireRequete_bar :", error);
        return [];
      }
    }
     else {
      console.log("erreurCQL: ", this.erreurCQL);
      this.erreurCQL = true;
      return [];
    }
    },

    construireRequete_barPlot: async function () {
      if (this.selectedFiltre !== "" && this.selectedValeur !== "") {
        let URL = `/dashboard/api/nb_equipement_${this.selectedFiltre.slice(-3)}?categorie=${this.selectedFiltre}&valeur=${this.selectedValeur}`;
        console.log("Requête construite :", URL);

      try {
        const response = await fetch(URL);
        if (!response.ok) throw new Error("Erreur lors de la récupération des données");
  
        const data = await response.json();
        console.log("Données reçues :", data);

        if (data.data && data.data.length > 0) {

          let listeEquipement = []
          let ligneEquipement

            for (let i= 0; i < data.data.length; i++) {
              if (data.data[i].type_equipement != "Monument"){
              ligneEquipement = {"type_equipement": data.data[i].type_equipement,
                                 "value": data.data[i].nombre || 0};
              listeEquipement.push(ligneEquipement);
              }
            }
            return listeEquipement;
        } 
        else {
          console.error("Données vides ou mal formatées");
          return [];
        }
      }
      catch(error){
        console.log(error);
      }
    }
  },

      chargerCarte: function () {
      var mapSpec = {

          "$schema": "https://vega.github.io/schema/vega-lite/v5.21.0.json",
          "width": 600,
          "height": 600,
          "autosize": "fit",
          "title": "Densité des équipement culturels (3,5km²)",
        
          "layer": [{

            "data": {
              "url": this.construireRequete_emprise(),
              "format": {"type": "json"}
            },
            "mark": {"type": "geoshape"},
            "encoding":{
            "color": {"value": "white"},
            "stroke": {"value": "#bebebe", "width": 5}
            }
          },
          {
          "data": {
            "url": this.construireRequete_cercle(),
            "format": {"type": "json", "property": "features"}
          },
          "transform": [
            {
              "calculate": "datum.geometry.coordinates[0]",
              "as": "longitude"
            },
            {
              "calculate": "datum.geometry.coordinates[1]",
              "as": "latitude"
            }
          ],

            "mark": {"type": "circle"},
            "encoding": {
              "longitude": {
                "field": "longitude",
                "type": "quantitative"
              },
              "latitude": {
                "field": "latitude",
                "type": "quantitative"
              },
              "size": {
                "field": "properties.nb_equipement",
                "type": "quantitative",
                "title": "Nb d'équipements culturels",
                "scale": {
                  "range": [0, 1500]
                }
              },
              "color": {
                "value": "#393939"
              },
              "stroke": {"value": "white"
              },
              "strokeWidth": {"value": 0.5},
              "opacity": {"value": 1} 
            }
          }]
      }
      vegaEmbed('#map', mapSpec).catch(console.error);
    },

    chargerBarre: async function () {
      const formattedData = await this.construireRequete_bar();
    
      if (formattedData.length === 0) {
        console.log("Aucune donnée disponible pour le graphique");
        return;
      }
    
      const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 400,
        "height": 50, 
        "title": `Distribution des entrée en musée en fonction de la gratuité en ${this.selectedAnnee}`,

        "data": {
          "values": formattedData
        },
        "mark": "bar",
        "encoding": {
          "x": { 
            "field": "value",
            "type": "quantitative",
            "stack": "normalize",
            "axis": {"title": null}
          },
          "color": {
            "field": "category",
            "scale": {"range": ["#393939", "#bebebe"]},
            "legend": {"orient": "top", "title": null}
          },
          "tooltip": [
            { "field": "category" }, 
            { "field": "value" }
          ],
          "axis": {"labelExpr": null}
        }
      };
    
      vegaEmbed("#bar", spec);
    },

    chargerBarPlot: async function () {

    var formattedData = await (this.construireRequete_barPlot());
    console.log(formattedData);


    var barSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "width": 400,
      "height": 400,
      "autosize": "fit",
      "title": "Nombre d'équipement en fonction de sa nature",

      "data": {
        "values": formattedData
      },
      "mark": "bar",
      "encoding": {
        "x": {"field": "type_equipement", "type": "nominal", "axis": {"title": null, "labelAngle": -45}},
        "y": {"field": "value", "type": "quantitative", "axis": {"title": null}},
        "color": {"value": "#393939"},
        "tooltip": [
          { "field": "type_equipement" }, 
          { "field": "value" }
        ],
      }
    };
  
    vegaEmbed('#barPlot', barSpec).catch(console.error);
  },

    chargerDashboard: function () {
      this.chargerCarte();
      this.chargerBarre();
      this.chargerBarPlot();
    },

    exporterPDF: function () {
      const element = document.getElementById('dashboard');
      const elementRect = element.getBoundingClientRect();
      const width = elementRect.width + 20 ;
      const height = elementRect.height;
            
      const options = {
          filename:     `charts_${this.selectedFiltre}_${this.selectedValeur}`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 4 },
          jsPDF:        { unit: 'px', format: [height, width], orientation: 'landscape' }
      };

      html2pdf().from(element).set(options).save();
    }

  }, // fin de méthode

  mounted() {this.trouverFiltre()}

}).mount("#app");

