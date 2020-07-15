const app = require('./app');
const port = process.env.PORT; // enviroment vars

//
// Without middleware: new request -> run route handler (basic)
//
// With middleware: new request -> do something -> run route handler (fit my needs)
//

app.listen(port, () =>{
    console.log('Server is up on port ' + port);
});

