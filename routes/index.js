var express = require('express');


var router = express.Router();
const mysql = require('mysql2');
require('dotenv').config();

const dbConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('brisi', { title: 'Express' });
});
router.get('/brisi', function(req, res, next) {
    res.render('brisi', { title: 'Express' });
});
router.get('/form', (req, res) => {
  res.render('form', { title: 'putni nalozi' });

});

router.post('/submit', function(req, res) {
  const { startDate, endDate } = req.body;
  console.log(req.body);

  // Use a MySQL stored procedure without the CALL statement
  const query = 'sp_lista_putnih_naloga_za_period'; // Assuming the name of your stored procedure
  const params = [startDate, endDate];

  // Use a helper function to execute the stored procedure
  executeStoredProcedure(query, params)
      .then((result) => {
        // Assuming `result` is an array of rows returned by the stored procedure
        // Adjust this part based on the actual structure of the result
        res.render('prikaz', { title: 'Lista putnih naloga', prikaz: result });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
});


router.get('/form2', (req, res) => {
  res.render('form2', { title: 'putni nalozi' });

});

router.get('/cjenovnik_unos', (req, res) => {
  res.render('cjenovnik_unos', { title: 'putni nalozi' });

});

router.post('/submit2', function(req, res) {
  const { startDate, endDate } = req.body;
  console.log(req.body);

  // Use a MySQL stored procedure without the CALL statement
  const query = 'sp_pn_prikaz_zaposlenika_za_dati_period'; // Assuming the name of your stored procedure
  const params = [startDate, endDate];

  // Use a helper function to execute the stored procedure
  executeStoredProcedure(query, params)
      .then((result) => {
        // Assuming `result` is an array of rows returned by the stored procedure
        // Adjust this part based on the actual structure of the result
        res.render('prikaz2', { title: 'Lista zaposlenika', prikaz: result });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
});

router.post('/cjenovnik', function(req, res) {
    const { sifra, datum_pocetka_vazenja, sifra_drzave, iznos_dnevnice } = req.body;

    // Check if sifra already exists
    let checkQuery = 'SELECT * FROM cjenovnik_putni_nalog WHERE sifra = ?';
    dbConnection.query(checkQuery, [sifra], (checkError, checkResults) => {
        if (checkError) {
            console.error(checkError);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (checkResults.length > 0) {
            let insertStavkeQuery = 'INSERT INTO stavke_cjenovnika_putni_nalog (sifra_cjenovnika, sifra_drzave, iznos_dnevnice) VALUES (?, ?, ?)';
            // Prepare data for the second query
            const valuesStavke = [sifra, sifra_drzave, iznos_dnevnice];

            dbConnection.query(insertStavkeQuery, valuesStavke, (stavkeError, stavkeResults) => {
                if (stavkeError) {
                    console.error(stavkeError);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                // Both queries executed successfully, send a response
                res.render('cjenovnik_unos', { title: 'putni nalozi' });
            });
        }
        else{}
        // If sifra doesn't exist, proceed with the insertion
        let insertQuery = 'INSERT INTO cjenovnik_putni_nalog (sifra, datum_pocetka_vazenja) VALUES (?, ?)';
        const valuesCjenovnik = [sifra, datum_pocetka_vazenja];

        dbConnection.query(insertQuery, valuesCjenovnik, (insertError, insertResults) => {
            if (insertError) {
                console.error(insertError);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            // If the first query is successful, proceed with the second query
            let insertStavkeQuery = 'INSERT INTO stavke_cjenovnika_putni_nalog (sifra_cjenovnika, sifra_drzave, iznos_dnevnice) VALUES (?, ?, ?)';
            // Prepare data for the second query
            const valuesStavke = [sifra, sifra_drzave, iznos_dnevnice];

            dbConnection.query(insertStavkeQuery, valuesStavke, (stavkeError, stavkeResults) => {
                if (stavkeError) {
                    console.error(stavkeError);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                // Both queries executed successfully, send a response
                res.status(201).json({ message: 'Data successfully inserted' });
            });
        });
    });
});

router.post('/brisi1',  (req, res) => {
    const id  = req.params.deleteId;
    console.log(id);
    console.log('Received DELETE request for id:', id);
    const query = 'DELETE FROM zaposlenik_putni_nalog WHERE sifra_zaposlenika = ?;';
    console.log(id);
    dbConnection.query(query, [id], (error, results) => {
        if (error) {
            console.log(id);
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'Employee successfully deleted' });
    });
});
// Assuming you have a shared variable to store the data globally

router.get('/zaposlenici', (req, res) => {
    const query = 'SELECT * FROM zaposlenik_putni_nalog';

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.render('prikazZap', { title: 'Lista zasposlenika', prikazZap: results });
    });
});

// Route to render the data
router.get('/prikazZap', (req, res) => {
    // Use the global variable to render the data
    res.redirect('/zaposlenici');
});
router.get('/zaposlenik_unos', function(req, res, next) {
    res.render('zaposlenik_unos', { title: 'Express' });
});
// POST Endpoint: Create a new employee
router.post('/zaposlenici1', function (req, res) {

    const { ime_zaposlenika, prezime_zaposlenika, maticni_broj_zaposlenika } = req.body;
    console.log('Received request with data:',  req.body);

    const query = 'INSERT INTO zaposlenik_putni_nalog (ime_zaposlenika,prezime_zaposlenika,maticni_broj_zaposlenika) VALUES (?, ?, ?);';
    const values = [ime_zaposlenika, prezime_zaposlenika, maticni_broj_zaposlenika];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.status(201).json({ message: 'Employee successfully added' });
    });
});

// Helper function to execute a MySQL stored procedure
function executeStoredProcedure(procedureName, params) {
    return new Promise((resolve, reject) => {
        dbConnection.query(`CALL ${procedureName}(?, ?)`, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                // Assuming the result object has a property 'result' containing the actual result set
                resolve(result[0]);
            }
        });
    });
}


module.exports = router;
