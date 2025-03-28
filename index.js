const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const session = require("express-session");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// Création du serveur Express (P_1)
const app = express();

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "monat",
    password: "postgres",
    port: 5432
});
console.log("Connexion réussie à la base de donnée ")




// Configuration du serveur
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false })); // <--- paramétrage du middleware
app.use(require('body-parser').json());


// Configuration des sessions
app.use(session({
  secret: "mon_super_secret", 
  resave: false, 
  saveUninitialized: false,
  cookie: { 
      secure: false,
      httpOnly: true
  }
}));

// N'accoder l'accès aux pages qu'aux utilisateurs connectés
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
      return res.redirect("/login");
  }
  next();
}


// Démarrage du serveur
app.listen(3000, () => {
  console.log("Serveur démarré (http://localhost:3000/) !");
});


// HOME PAGE (P_2)

app.get("/", (req, res) => {
  res.render("main");
});



// MAP (P_3)

app.get("/map", (req, res) => {
  res.render("map");
});

app.get("/map/api/basilic_final_insee_reg", async (req, res) => {
    const sql = "SELECT DISTINCT(insee_reg) FROM monat.basilic_final";
    const result = await pool.query(sql);
    res.json({features: result.rows})
});

app.get("/map/api/basilic_final_type_equipement_ou_lieu", async (req, res) => {
  const sql = "SELECT DISTINCT(type_equipement_ou_lieu) FROM monat.basilic_final";
  const result = await pool.query(sql);
  res.json({features: result.rows})
});

app.get("/image/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const result = await pool.query("SELECT image FROM monat.basilic_final WHERE monument_id = $1", [id]);

      if (result.rows.length === 0 || !result.rows[0].image) {
          return res.status(404).json({ message: "Image non trouvée" });
      }

      // Convertir le buffer en Base64
      const imageBase64 = result.rows[0].image.toString("base64");

      // Retourner l'image sous forme de base64 avec son type MIME
      res.json({ image: `data:image/png;base64,${imageBase64}` }); // Remplace 'image/png' si besoin

  } catch (error) {
      console.error("Erreur récupération image :", error);
      res.status(500).json({ message: "Erreur serveur" });
  }
});


// DASHBOARD (P_4)

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

// API DASHBOARD

// Appel fréquentation musées par département et région

app.get("/dashboard/api/frequentation_musee_dep", async (req, res) => {
  try {
    const { categorie, valeur, annee } = req.query; 

    let sql = "SELECT * FROM monat.stat_musee_reg";
    let values = [];

    if (categorie && valeur && annee) {
      sql += ` WHERE ${categorie} = $1 AND annee = $2`; 
      values.push(valeur, annee);
    } else if (categorie && valeur) {
      sql += ` WHERE ${categorie} = $1`;
      values.push(valeur);
    } else if (annee) {
      sql += ` WHERE annee = $1`;
      values.push(annee);
    }

    const result = await pool.query(sql, values);

    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des données" });
  }
});

app.get("/dashboard/api/frequentation_musee_reg", async (req, res) => {
  try {
    const { categorie, valeur, annee } = req.query; 

    let sql = "SELECT * FROM monat.stat_musee_france";
    let values = [];

    if (categorie && valeur && annee) {
      sql += ` WHERE ${categorie} = $1 AND annee = $2`;
      values.push(valeur, annee);
    } else if (categorie && valeur) {
      sql += ` WHERE ${categorie} = $1`;
      values.push(valeur);
    } else if (annee) {
      sql += ` WHERE annee = $1`;
      values.push(annee);
    }

    const result = await pool.query(sql, values);

    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des données" });
  }
});

// Appel nombre d'équipement par département et région

app.get("/dashboard/api/nb_equipement_dep", async (req, res) => {
  try {
    const { categorie, valeur } = req.query;

    let sql = "SELECT * FROM monat.stat_eqp_reg";
    let values = [];

    if (categorie && valeur) {
      sql += ` WHERE ${categorie} = $1`;
      values.push(valeur);

    const result = await pool.query(sql, values);

    res.json({ data: result.rows });
  } 
  }
    catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des données" });
  }
});

app.get("/dashboard/api/nb_equipement_reg", async (req, res) => {
  try {
    const { categorie, valeur } = req.query;

    let sql = "SELECT * FROM monat.stat_eqp_france";
    let values = [];

    if (categorie && valeur) {
      sql += ` WHERE ${categorie} = $1`;
      values.push(valeur);

    const result = await pool.query(sql, values);

    res.json({ data: result.rows });
  } 
  }
    catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des données" });
  }
});


// partie CRUD (P_5)

app.get("/db", isAuthenticated, (req, res) => {
  const sql = "SELECT * FROM monat.basilic_final ORDER BY Nom";
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("db", { model: result.rows });
  });
});

// GET /create
app.get("/create", isAuthenticated, (req, res) => {
  res.render("create", { model: {} });
});

// GET create/api pour récupérer la liste des types d'equipements
app.get("/create/api", async (req, res) => {
  const sql = "SELECT DISTINCT (type_equipement_ou_lieu) FROM monat.basilic_final";
  const result = await pool.query(sql);
  res.json(result.rows)
});

// POST /create pour insérer les nouveaux monuments dans la base
app.post("/create", upload.single("image"), (req, res) => {

  const uploadedImage = req.file ? req.file.buffer : null; // Multer ajoute `file` à `req`

  // const uploadedImage = req.files != null ? req.files.image.data : null // formulation ternaire d'une condition if/else
  console.log(uploadedImage)
 const values = [req.body.Nom, req.body.Adresse, req.body.Complement, req.body.Commune, req.body.Codepostal, req.body.TypeEquipement, parseFloat(req.body.Latitude), parseFloat(req.body.Longitude), uploadedImage, req.body.description];
  // Insertion des données dans la table
  console.log(values)
  const insertQuery = `
  INSERT INTO temp_monat.temp_basilic (nom, adresse, complement_adresse, libelle_geographique, code_postal, type_equipement_ou_lieu, wkb_geometry, image, description, source) 
  VALUES ($1, $2, $3, $4, $5, $6,  ST_SetSRID(ST_MakePoint($8, $7), 4326), $9, $10, 'ADD')
  RETURNING *;
`;
  pool.query(insertQuery, values, (err,result)=>{
    if(err){
      console.error("Erreur lors de l'insertion :", err);
      res.status(500).send("Erreur lors de l'ajout des données.");
    }else{
      res.redirect("/create"); 
      console.log("Données ajoutées :", result.rows[0]); 
    }
    
  });
});

//GET pour rechercher les monuments dans la table
app.get("/search", isAuthenticated, (req, res) => {
  const searchQuery = req.query.query;

  if (!searchQuery) {
      return res.json([]); // Retourne un tableau vide si la requête est vide
  }

  const sql = "SELECT * FROM monat.basilic_final WHERE LOWER(nom) LIKE $1 LIMIT 50";
  const values = [`%${searchQuery}%`];

  pool.query(sql, values, (err, result) => {
      if (err) {
          console.error("Erreur SQL :", err);
          return res.status(500).json({ error: "Erreur de serveur" });
      }
      res.json(result.rows); // Renvoie les résultats au frontend
  });
});


// GET /edit/
app.get("/edit/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const sql = "SELECT * FROM monat.basilic_final WHERE monument_id = $1";
    
    // Exécution de la requête SQL avec await
    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).send("Monument non trouvé");
    }

    res.render("edit", { model: result.rows[0] });

  } catch (error) {
    console.error("Erreur lors de la récupération du monument :", error);
    res.status(500).send("Erreur serveur");
  }
});

// POST /edit pour mettre a jour la ligne du monument dans la table temp_basilic
app.post("/edit/:id", upload.single("image"), (req, res) => {

  pool.query("SELECT 1", (err, res) => {
    if (err) {
        console.error("Erreur de connexion à la base de données :", err);
    } else {
        console.log("Connexion à la base PostgreSQL réussie !");
    }
});

  const uploadedImage = req.file ? req.file.buffer : null; // Multer ajoute `file` à `req`
  const book = [req.body.Nom, req.body.Adresse, req.body.Complement, req.body.Commune, req.body.Codepostal, req.body.TypeEquipement, uploadedImage, req.body.description];
  const sql = "INSERT INTO temp_monat.temp_basilic (nom, adresse, complement_adresse, libelle_geographique, code_postal, type_equipement_ou_lieu, image, description, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EDI')";
  pool.query(sql, book, (err, result) => {
    if (err) {
      console.log(err)
    }
    res.redirect("/db");
  });
});


// LOGIN (P_6)

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login/api/register", async (req, res) => {
  const password = req.body.password;
  const username = req.body.username;

  try {
      const checkUser = await pool.query("SELECT * FROM monat_log.log WHERE identifiant = $1", [username]);
      if (checkUser.rows.length > 0) {
          return res.status(400).json({ message: "Utilisateur déjà existant" });
      }

      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);

      await pool.query("INSERT INTO monat_log.log (identifiant, mot_de_passe, role) VALUES ($1, $2, 'user')", [username, hash]);

      res.status(201).json({ message: "Utilisateur créé avec succès " });
  } catch (error) {
      console.error("Erreur serveur :", error);
      res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/login/api/connect", async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await pool.query("SELECT * FROM monat_log.log WHERE identifiant = $1", [username]);

      if (user.rows.length === 0) {
          return res.status(400).json({ message: "Utilisateur non trouvé " });
      }

      const passwordMatch = await bcrypt.compare(password, `${user.rows[0].mot_de_passe}`); // C'est sale comme façon de faire, mais bcrypt.compare attend une string en deuxième argument et le mdp est stocké en binaire sur PG

      if (!passwordMatch) {
          return res.status(400).json({ message: "Mot de passe incorrect " });
      }

      req.session.user = {
        id: user.rows[0].id,
        username: user.rows[0].identifiant
      };

      return res.json({ success: true });

  } catch (error) {
      console.error("Erreur serveur :", error);
      res.status(500).json({ message: "Erreur serveur" });
  }
});

// Stocker dans l'api les info de l'utilisateur en cours
app.get("/login/api/user", (req, res) => {
  if (!req.session.user) {
      return res.status(401).json(null);
  }
  res.json(req.session.user);
});

// Permettre la déconnexion
app.post("/login/api/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.status(200).json({ message: "Déconnexion réussie" });
  });
});


// BACK OFFICE (P_7)

// GET /back

app.get("/back", (req, res) => {
  res.render("back");
});

app.get("/back/api/temp_basilic", async (req, res) => {
  try {
    const source = req.query.source; // Récupérer le paramètre source (EDI ou ADD)
    if (!source) {
      return res.status(400).json({ message: "Source manquante" });
    }

    const sql = "SELECT * FROM temp_monat.temp_basilic WHERE source = $1";
    const result = await pool.query(sql, [source]);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération données :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


app.get("/temp_image/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const result = await pool.query("SELECT image FROM temp_monat.temp_basilic WHERE monument_id = $1", [id]);

      if (result.rows.length === 0 || !result.rows[0].image) {
          // Si l'image n'existe pas, retourner une image par défaut ou un statut 204 (No Content)
          return res.status(204).json({ message: "Pas d'image disponible" });
      }

      // Convertir le buffer de l'image en base64
      const imageBase64 = result.rows[0].image.toString("base64");

      // Retourner l'image sous forme de base64 avec son type MIME
      res.json({ image: `data:image/png;base64,${imageBase64}` }); // Remplace 'image/png' si l'image est d'un autre type
  } catch (error) {
      console.error("Erreur récupération image :", error);
      res.status(500).json({ message: "Erreur serveur" });
  }
});


app.post("/back/supprimer/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Suppression de la ligne dans la table temporaire
    await pool.query("DELETE FROM temp_monat.temp_basilic WHERE monument_id = $1", [id]);

    // Réponse au client
    res.status(200).json({ message: "Ligne supprimée avec succès" });

  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


app.post("/back/EDI/valider/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { nom, adresse, libelle_geographique, code_postal, type_equipement_ou_lieu } = req.body;

    // Exécution en une transaction
    await pool.query("BEGIN"); // Démarre une transaction

    // Mettre à jour les valeurs dans `basilic_final`
    await pool.query(
      `UPDATE monat.basilic_final 
       SET nom = $2, adresse = $3, libelle_geographique = $4, code_postal = $5, type_equipement_ou_lieu = $6
       WHERE monument_id = $1`,
      [id, nom, adresse, libelle_geographique, code_postal, type_equipement_ou_lieu]
    );

    // Mise à jour de `insee_reg` et `insee_dep`
    await pool.query(
      `UPDATE monat.basilic_final 
       SET insee_reg = '11', insee_dep = '75' 
       WHERE monument_id = $1`,
      [id]
    );

    // Suppression de la ligne dans `temp_basilic`
    await pool.query(
      `DELETE FROM temp_monat.temp_basilic WHERE monument_id = $1`,
      [id]
    );

    await pool.query("COMMIT"); // Valide la transaction

    res.status(200).json({ message: "Ligne modifiée et validée avec succès" });

  } catch (error) {
    await pool.query("ROLLBACK"); // Annule la transaction en cas d'erreur
    console.error("Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/back/ADD/valider/:id", async (req, res) => {
  const id = req.params.id;
  const { nom, adresse, libelle_geographique, code_postal, type_equipement_ou_lieu, wkb_geometry, image } = req.body;
  
  try {
    await pool.query(`INSERT INTO monat.basilic_final (nom, adresse, libelle_geographique, code_postal, type_equipement_ou_lieu, wkb_geometry, image)
                      VALUES($1, $2, $3, $4, $5, $6, $7)`, 
                      [nom, adresse, libelle_geographique, code_postal, type_equipement_ou_lieu, wkb_geometry, image]);
    res.status(200).json({message: "ligne ajoutée"});
    await pool.query(`DELETE FROM temp_monat.temp_basilic WHERE monument_id = $1`, [id])
    res.status(200).json({message: "ligne suprime de la table temporaire"})
  } catch (error) {
    console.error("Erreur d'insertion dans la base de données :", error);
    res.status(500).json({message: error});
  }
});
